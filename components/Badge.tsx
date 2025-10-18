// components/Badge.tsx
import { type BadgeColor } from '../lib/ui';

type Props = {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
};

const colorMap: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  green:  'bg-green-100  text-green-700  ring-green-200',
  red:    'bg-red-100    text-red-700    ring-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  blue:   'bg-blue-100   text-blue-700   ring-blue-200',
  gray:   'bg-gray-100   text-gray-700   ring-gray-200',
};

export default function Badge({ children, color = 'gray', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}
