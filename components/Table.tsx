import { ReactNode } from 'react'
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl border">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 text-sm">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">{children}</tbody>
      </table>
    </div>
  )
}
