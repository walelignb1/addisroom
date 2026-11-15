import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
function key() {
  const value = process.env.IDENTITY_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error("Identity uploads are not configured. Contact support.");
  return Buffer.from(value, "hex");
}
export function encryptDocument(data: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}
export function decryptDocument(data: Uint8Array) {
  const bytes = Buffer.from(data);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    bytes.subarray(0, 12),
  );
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
}
export async function readIdentityImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size || value.size > 3 * 1024 * 1024)
    throw new Error("Upload a JPEG or PNG image, maximum 3 MB per file.");
  const bytes = Buffer.from(await value.arrayBuffer());
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !jpeg)
    throw new Error("Only JPEG and PNG image files are accepted.");
  return {
    mimeType: png ? "image/png" : "image/jpeg",
    encryptedData: encryptDocument(bytes),
  };
}
