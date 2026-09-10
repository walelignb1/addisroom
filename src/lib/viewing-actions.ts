"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ViewingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionProfileId } from "@/lib/auth";

export type ViewingActionResult = { ok: true } | { ok: false; error: string };

export async function proposeViewing(
  _prev: ViewingActionResult | null,
  fd: FormData,
): Promise<ViewingActionResult> {
  try {
    const profileId = await getSessionProfileId();
    if (!profileId) redirect("/login");

    const listingId = String(fd.get("listingId") ?? "").trim();
    const proposedAtRaw = String(fd.get("proposedAt") ?? "").trim();
    const note = String(fd.get("note") ?? "").trim() || undefined;

    if (!listingId || !proposedAtRaw) {
      return { ok: false, error: "Pick a date and time for the viewing" };
    }

    const proposedAt = new Date(proposedAtRaw);
    if (Number.isNaN(proposedAt.getTime()) || proposedAt < new Date()) {
      return { ok: false, error: "Choose a future date and time" };
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { postedById: true },
    });
    if (!listing) return { ok: false, error: "Listing not found" };
    if (listing.postedById === profileId) {
      return { ok: false, error: "You cannot schedule a viewing on your own listing" };
    }

    await prisma.viewingSchedule.create({
      data: {
        listingId,
        fromProfileId: profileId,
        toProfileId: listing.postedById,
        proposedAt,
        note,
        status: ViewingStatus.PROPOSED,
      },
    });

    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/inbox");
    return { ok: true };
  } catch (e) {
    console.error("[AddisRoom] proposeViewing failed:", e);
    return { ok: false, error: "Could not schedule viewing. Try again." };
  }
}

export async function respondToViewing(
  _prev: ViewingActionResult | null,
  fd: FormData,
): Promise<ViewingActionResult> {
  try {
    const profileId = await getSessionProfileId();
    if (!profileId) redirect("/login");

    const viewingId = String(fd.get("viewingId") ?? "").trim();
    const decision = String(fd.get("decision") ?? "").trim();

    if (!viewingId || !["ACCEPTED", "DECLINED"].includes(decision)) {
      return { ok: false, error: "Invalid response" };
    }

    const viewing = await prisma.viewingSchedule.findUnique({
      where: { id: viewingId },
      select: { toProfileId: true, listingId: true, status: true },
    });

    if (!viewing || viewing.toProfileId !== profileId) {
      return { ok: false, error: "Viewing request not found" };
    }
    if (viewing.status !== ViewingStatus.PROPOSED) {
      return { ok: false, error: "This request was already answered" };
    }

    await prisma.viewingSchedule.update({
      where: { id: viewingId },
      data: {
        status: decision as ViewingStatus,
        respondedAt: new Date(),
      },
    });

    revalidatePath(`/listings/${viewing.listingId}`);
    revalidatePath("/inbox");
    return { ok: true };
  } catch (e) {
    console.error("[AddisRoom] respondToViewing failed:", e);
    return { ok: false, error: "Could not update viewing. Try again." };
  }
}

export async function getListingViewings(listingId: string, profileId: string) {
  try {
    return await prisma.viewingSchedule.findMany({
      where: {
        listingId,
        OR: [{ fromProfileId: profileId }, { toProfileId: profileId }],
      },
      orderBy: { proposedAt: "asc" },
      include: {
        from: { select: { name: true } },
        to: { select: { name: true } },
      },
    });
  } catch {
    return [];
  }
}
