import React from "react";

type Props = {
  title?: string;
  actions?: React.ReactNode;   // <- volvemos a aceptar 'actions'
  children: React.ReactNode;
  className?: string;
};

export default function Card({ title, actions, children, className = "" }: Props) {
  return (
    <section
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 ${className}`}
    >
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base sm:text-[15px] font-semibold text-gray-800">
              {title}
            </h2>
          ) : <div />}
          {actions ?? null}
        </header>
      )}
      {children}
    </section>
  );
}
