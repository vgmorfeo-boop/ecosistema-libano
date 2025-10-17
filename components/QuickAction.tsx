import clsx from "clsx";

export default function QuickAction({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm border bg-white hover:bg-gray-50 shadow-sm";
  if (href) {
    return (
      <a href={href} className={clsx(base, "focus:outline-none focus:ring-2 focus:ring-brand-400")}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={base}>
      {children}
    </button>
  );
}
