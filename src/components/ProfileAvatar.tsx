export function ProfileAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-24 w-24 text-2xl"
      : size === "sm"
        ? "h-10 w-10 text-sm"
        : "h-16 w-16 text-lg";

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl) {
    return (
      <div
        className={`relative ${dims} shrink-0 overflow-hidden rounded-full border-2 border-[var(--brand-200)] bg-[var(--brand-50)]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent)] font-semibold text-white`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
