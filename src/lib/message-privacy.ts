/** Detect phone numbers in chat (Ethiopian + international patterns). */
const PHONE_PATTERNS = [
  /\b0?9\d{8}\b/,
  /\b\+?251\s?9\d{8}\b/,
  /\b\+?\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/,
  /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/,
];

export function containsPhoneNumber(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ");
  return PHONE_PATTERNS.some((re) => re.test(normalized));
}

export const PHONE_BLOCKED_MESSAGE =
  "Phone numbers cannot be shared in chat. Use the viewing scheduler to arrange a visit.";
