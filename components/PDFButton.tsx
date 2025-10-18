import React from "react";

type PDFButtonProps = {
  url?: string | null;
  filename?: string;
  className?: string;
};

export default function PDFButton({ url, filename = "cv.pdf", className }: PDFButtonProps) {
  if (!url) return <span className="text-gray-400">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={filename}
      className={className ?? "text-brand-700 hover:underline"}
    >
      Ver PDF
    </a>
  );
}
