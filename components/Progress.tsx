export default function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-28">
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-indigo-500 rounded"
          style={{ width: `${v}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{v}%</div>
    </div>
  );
}
