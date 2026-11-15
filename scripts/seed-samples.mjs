// Sample data for local development only. Run: node scripts/seed-samples.mjs
// Every sample profile uses a 0900000xxx phone so it is easy to find and delete.
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = `file:${path.join(process.cwd(), "dev.db")}`;
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const people = [
  { key: "a", name: "Selam Tesfaye", phone: "0900000001", role: "LANDLORD", verified: false },
  { key: "b", name: "Dawit Bekele", phone: "0900000002", role: "AGENT", verified: true },
  { key: "c", name: "Hana Girma", phone: "0900000003", role: "LANDLORD", verified: false },
  { key: "d", name: "Yonas Alemu", phone: "0900000004", role: "AGENT", verified: true },
];

// Approximate neighborhood centers; each listing is nudged slightly so map pins do not stack.
const CENTERS = {
  Bole: [8.997, 38.79], Ayat: [8.92, 38.88], Kazanchis: [9.015, 38.765], CMC: [9.05, 38.81],
  "Arat Kilo": [9.032, 38.762], Megenagna: [9.02, 38.83], Jemo: [8.935, 38.72], Gerji: [8.985, 38.81],
  Mexico: [9.01, 38.735], Gullele: [9.05, 38.72], Piazza: [9.034, 38.746],
};
const nudge = (i, axis) => (((i * (axis ? 37 : 53)) % 11) - 5) * 0.0014;

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;
const PHOTOS = [
  "1522708323590-d24dbb6b0267", "1586023492125-27b2c045efd7", "1600585154340-be6161a56a0c",
  "1493809842364-78817add7ffb", "1484154218962-a197022b5858", "1554995207-c18c203602cb",
  "1505691938895-1758d7feb511", "1512917774080-9991f1c4c750", "1600596542815-ffad4c1539a9",
  "1564013799919-ab600027ffc6", "1556909114-f6e7ad7d3136", "1616594039964-ae9021a400a0",
].map(photo);

const days = (n) => new Date(Date.now() + n * 86400000);

const listings = [
  { by: "b", title: "Bright 2-bedroom apartment near Edna Mall", neighborhood: "Bole", roadName: "Cameroon St", propertyType: "APARTMENT", roomType: "APARTMENT", bedrooms: "TWO", furnished: true, priceBirr: 45000, depositBirr: 90000, in: 3, areaSqm: 85, floor: 5, description: "Fully furnished 2-bedroom on the 5th floor with lift, backup generator and 24h security. Five minutes' walk to Edna Mall." },
  { by: "a", title: "Bale 1 kifl condominium, 40/60 site", neighborhood: "Ayat", roadName: "Ayat Zone 3", propertyType: "CONDOMINIUM", roomType: "APARTMENT", bedrooms: "ONE", furnished: false, priceBirr: 12000, depositBirr: 24000, in: 0, areaSqm: 48, floor: 2, description: "Clean one-bedroom condominium on the 2nd floor. Water tank, good sunlight, close to the light rail station." },
  { by: "d", title: "Modern studio for one person in Kazanchis", neighborhood: "Kazanchis", roadName: "Guinea Conakry St", propertyType: "APARTMENT", roomType: "STUDIO", bedrooms: "ONE", furnished: true, priceBirr: 18000, depositBirr: 18000, in: 7, areaSqm: 32, floor: 3, description: "Furnished studio with kitchenette and fast Wi-Fi. Ideal for professionals working around UNECA." },
  { by: "c", title: "Family villa with garden and parking", neighborhood: "CMC", roadName: "CMC Michael", propertyType: "VILLA", roomType: "APARTMENT", bedrooms: "THREE_PLUS", furnished: false, priceBirr: 85000, depositBirr: 170000, in: 14, areaSqm: 320, floor: null, description: "G+1 villa with four bedrooms, a private garden, service quarter and parking for two cars in a quiet compound." },
  { by: "a", title: "Room in shared house, students welcome", neighborhood: "Arat Kilo", roadName: "Queen Elizabeth St", propertyType: "SHARED_HOUSE", roomType: "ROOM", bedrooms: "ONE", furnished: true, priceBirr: 6500, depositBirr: 6500, in: 0, areaSqm: 14, floor: 0, description: "Furnished room with shared kitchen and bathroom. Ten minutes on foot to the AAU main campus." },
  { by: "b", title: "Ground-floor shop on a busy main road", neighborhood: "Megenagna", roadName: "Haile Gebreselassie Rd", propertyType: "SHOP", roomType: "ROOM", bedrooms: "ONE", furnished: false, priceBirr: 30000, depositBirr: 90000, in: 10, areaSqm: 35, floor: 0, description: "35 m² shop with glass front and heavy foot traffic. Suitable for a boutique, pharmacy or café." },
  { by: "d", title: "2-bedroom condominium with a city view", neighborhood: "Jemo", roadName: "Jemo 1", propertyType: "CONDOMINIUM", roomType: "APARTMENT", bedrooms: "TWO", furnished: false, priceBirr: 16000, depositBirr: 32000, in: 5, areaSqm: 70, floor: 4, description: "Renovated two-bedroom on the 4th floor with new tiles, a kitchen cabinet and a wide balcony view." },
  { by: "c", title: "Cozy house with private compound", neighborhood: "Gerji", roadName: "Gerji Mebrat Hail", propertyType: "HOUSE", roomType: "APARTMENT", bedrooms: "TWO", furnished: false, priceBirr: 28000, depositBirr: 56000, in: 21, areaSqm: 110, floor: null, description: "Two-bedroom house with its own gate, a small yard and reliable water. Quiet street close to Unity University." },
  { by: "b", title: "Furnished 1-bedroom near Sarbet", neighborhood: "Mexico", roadName: "Sarbet", propertyType: "APARTMENT", roomType: "APARTMENT", bedrooms: "ONE", furnished: true, priceBirr: 25000, depositBirr: 50000, in: 2, areaSqm: 55, floor: 6, description: "One-bedroom apartment with modern furniture, washing machine and secure parking. Walking distance to the AU." },
  { by: "d", dealType: "SALE", title: "3-bedroom apartment for sale, Bole Atlas", neighborhood: "Bole", roadName: "Atlas", propertyType: "APARTMENT", roomType: "APARTMENT", bedrooms: "THREE_PLUS", furnished: false, priceBirr: 14500000, in: 0, areaSqm: 145, floor: 7, description: "Finished three-bedroom apartment with two bathrooms, lift, generator and basement parking. Title deed ready." },
  { by: "b", dealType: "SALE", title: "40/60 condominium for sale, 2 bedrooms", neighborhood: "Ayat", roadName: "Ayat 49", propertyType: "CONDOMINIUM", roomType: "APARTMENT", bedrooms: "TWO", furnished: false, priceBirr: 5200000, in: 0, areaSqm: 78, floor: 3, description: "Two-bedroom 40/60 condominium, fully paid, with finished floors and kitchen cabinets. Ready to transfer." },
  { by: "c", dealType: "SALE", title: "G+2 villa for sale in a gated compound", neighborhood: "CMC", roadName: "Sunshine Real Estate", propertyType: "VILLA", roomType: "APARTMENT", bedrooms: "THREE_PLUS", furnished: false, priceBirr: 48000000, in: 30, areaSqm: 420, floor: null, description: "Five-bedroom G+2 villa on 350 m² of land with a garden, maid's room and parking for three cars." },
  { by: "d", dealType: "SALE", title: "Studio condominium for sale near the ring road", neighborhood: "Jemo", roadName: "Jemo 2", propertyType: "CONDOMINIUM", roomType: "STUDIO", bedrooms: "ONE", furnished: false, priceBirr: 2300000, in: 0, areaSqm: 32, floor: 1, description: "Affordable studio condominium, good for a first home or as a rental investment." },
  { by: "a", dealType: "SALE", title: "Old house on 250 m² for sale", neighborhood: "Gullele", roadName: "Shiro Meda", propertyType: "HOUSE", roomType: "APARTMENT", bedrooms: "THREE_PLUS", furnished: false, priceBirr: 19000000, in: 0, areaSqm: 180, floor: null, description: "Three-bedroom house with a large compound and a title deed. Suitable for redevelopment." },
  { by: "b", dealType: "SALE", title: "Commercial shop for sale in a new mall", neighborhood: "Piazza", roadName: "Adwa St", propertyType: "SHOP", roomType: "ROOM", bedrooms: "ONE", furnished: false, priceBirr: 8700000, in: 60, areaSqm: 42, floor: 1, description: "First-floor shop in a mall under completion, with escalator access and high visibility." },
  { by: "c", dealType: "SALE", title: "2-bedroom apartment for sale, Kazanchis", neighborhood: "Kazanchis", roadName: "Tito St", propertyType: "APARTMENT", roomType: "APARTMENT", bedrooms: "TWO", furnished: true, priceBirr: 11800000, in: 0, areaSqm: 96, floor: 9, description: "Furnished two-bedroom on the 9th floor with a city view, lift and 24h security. Walk to UNECA." },
];

for (const p of people) {
  await prisma.profile.upsert({
    where: { phone: p.phone },
    update: {},
    create: { name: p.name, phone: p.phone, role: p.role, verified: p.verified, profileComplete: true, bio: "Sample profile for local development." },
  });
}
const byKey = {};
for (const p of people) byKey[p.key] = await prisma.profile.findUnique({ where: { phone: p.phone } });

await prisma.listing.deleteMany({ where: { postedById: { in: Object.values(byKey).map((p) => p.id) } } });
for (const [i, l] of listings.entries()) {
  const { by, in: inDays, ...data } = l;
  const images = [0, 5, 7].map((step, sortOrder) => ({
    url: PHOTOS[(i + step) % PHOTOS.length],
    sortOrder,
  }));
  const [lat, lng] = CENTERS[data.neighborhood];
  await prisma.listing.create({
    data: {
      ...data,
      latitude: lat + nudge(i, 0),
      longitude: lng + nudge(i, 1),
      availableFrom: days(inDays),
      published: true,
      postedById: byKey[by].id,
      images: { create: images },
    },
  });
}
console.log("Seeded", listings.length, "sample listings from", people.length, "sample profiles");
await prisma.$disconnect();
