import React from 'react'

interface TableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
          {children}
        </tbody>
      </table>
    </div>
  )
}
