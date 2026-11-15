import { getSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptDocument } from "@/lib/identity-storage";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionProfile();
  if (!me) return new Response(null, { status: 401 });
  const { id } = await params;
  const doc = await prisma.identityDocument.findUnique({ where: { id } });
  if (!doc || (!me.isAdmin && me.id !== doc.profileId))
    return new Response(null, { status: 404 });
  return new Response(new Uint8Array(decryptDocument(doc.encryptedData)), {
    headers: {
      "Content-Type": doc.mimeType,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Content-Disposition": "inline",
    },
  });
}
