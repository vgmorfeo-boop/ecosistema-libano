// components/QuickAction.tsx
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function QuickAction({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={
        className ??
        "inline-block px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm shadow-sm"
      }
    >
      {children}
    </Link>
  );
}
