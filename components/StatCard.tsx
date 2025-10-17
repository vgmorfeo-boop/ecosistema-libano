type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
  href?: string;
};

export default function StatCard({ title, value, subtitle, href }: Props) {
  const content = (
    <div className="bg-white border rounded-xl p-4 shadow-soft hover:shadow transition">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block focus:outline-none focus:ring-2 focus:ring-brand-400 rounded-xl">
        {content}
      </a>
    );
  }
  return content;
}
