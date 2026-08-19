import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-rose-400">{error}</span>
      )}
    </div>
  )
}
