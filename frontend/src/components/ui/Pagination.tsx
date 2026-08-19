import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex justify-between items-center w-full mt-6 px-2">
      <span className="text-xs text-slate-500 font-medium">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all cursor-pointer"
        >
          Anterior
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentPage === p
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/15'
                : 'border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all cursor-pointer"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}
