export function PaymentLinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border border-[#2eab6f] px-4 py-2.5 text-center text-sm font-semibold text-[#2eab6f] shadow-sm hover:bg-[#2eab6f]/5"
    >
      {label}
    </a>
  );
}
