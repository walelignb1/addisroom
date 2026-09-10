"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BedroomCount,
  PropertyType,
  RoomType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNeighborhoodCoords } from "@/lib/geo";
import { parseImageUrls, pickSampleImages } from "@/lib/sample-images";
import { getSessionProfileId } from "@/lib/auth";
import { canPostListing } from "@/lib/monetization";
import {
  containsPhoneNumber,
  PHONE_BLOCKED_MESSAGE,
} from "@/lib/message-privacy";
import { initializeListingPayment } from "@/lib/payments";

function requiredString(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "")
    throw new Error(`${key} is required`);
  return v.trim();
}

function optionalString(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function requiredInt(fd: FormData, key: string) {
  const v = requiredString(fd, key);
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0)
    throw new Error(`${key} must be a positive integer`);
  return n;
}

function optionalInt(fd: FormData, key: string) {
  const v = optionalString(fd, key);
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0)
    throw new Error(`${key} must be a positive integer`);
  return n;
}

export async function createListing(fd: FormData) {
  const sessionId = await getSessionProfileId();
  if (!sessionId) redirect("/login?next=/listings/new");
  const profileId = sessionId;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { role: true, profileComplete: true },
  });
  if (!profile) throw new Error("Profile not found");
  if (!profile.profileComplete) {
    redirect("/onboarding?next=/listings/new");
  }
  if (!canPostListing(profile.role)) {
    redirect("/listings/new/upgrade?next=/listings/new");
  }

  const title = requiredString(fd, "title");
  const description = requiredString(fd, "description");
  const neighborhood = requiredString(fd, "neighborhood");
  const roadName = optionalString(fd, "roadName");
  // Disabled on the client for property type SHOP, so they may be absent here.
  const roomType = (optionalString(fd, "roomType") as RoomType | undefined) ?? "ROOM";
  const propertyType = requiredString(fd, "propertyType") as PropertyType;
  const bedrooms = (optionalString(fd, "bedrooms") as BedroomCount | undefined) ?? "ONE";
  const furnished = fd.get("furnished") === "on";
  const priceBirr = requiredInt(fd, "priceBirr");
  const depositBirr = optionalInt(fd, "depositBirr");
  const availableFromRaw = requiredString(fd, "availableFrom");
  const availableFrom = new Date(availableFromRaw);
  if (Number.isNaN(availableFrom.getTime())) {
    throw new Error("availableFrom must be a valid date");
  }

  const coords = getNeighborhoodCoords(neighborhood);
  const customUrls = parseImageUrls(optionalString(fd, "imageUrls"));
  const imageUrls =
    customUrls.length > 0 ? customUrls : pickSampleImages(title, 4);

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      neighborhood,
      roadName,
      latitude: coords?.lat,
      longitude: coords?.lng,
      roomType,
      propertyType,
      bedrooms,
      furnished,
      priceBirr,
      depositBirr,
      availableFrom,
      published: false,
      postedById: profileId,
      images: {
        create: imageUrls.map((url, i) => ({ url, sortOrder: i })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/");

  let checkoutUrl: string;
  try {
    checkoutUrl = (
      await initializeListingPayment({ listingId: listing.id, profileId })
    ).checkoutUrl;
  } catch (err) {
    console.error("[createListing] payment init failed", err);
    redirect(`/listings/${listing.id}?payment=error`);
  }
  redirect(checkoutUrl);
}

export async function sendMessage(fd: FormData) {
  const sessionId = await getSessionProfileId();
  if (!sessionId) redirect("/login");

  const listingId = requiredString(fd, "listingId");
  const body = requiredString(fd, "body");

  if (containsPhoneNumber(body)) {
    throw new Error(PHONE_BLOCKED_MESSAGE);
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, postedById: true },
  });
  if (!listing) throw new Error("Listing not found");

  await prisma.message.create({
    data: {
      listingId: listing.id,
      fromProfileId: sessionId,
      toProfileId: listing.postedById,
      body,
    },
  });

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/inbox");

  redirect("/inbox");
}
