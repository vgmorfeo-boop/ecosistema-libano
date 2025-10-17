import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, children, className = "" }: Props) {
  return (
    <section
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 ${className}`}
    >
      {title && (
        <h2 className="text-base sm:text-[15px] font-semibold text-gray-800 mb-3">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
