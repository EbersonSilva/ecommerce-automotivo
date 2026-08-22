import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = ''
}) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}

export const getStatusVariant = (status: string): BadgeVariant => {
  const norm = status.toLowerCase()
  if (['pago', 'pagamento realizado', 'entregue', 'ativo', 'aprovado', 'sucesso', 'normal', 'troca aceita', 'troca processada'].includes(norm)) return 'success'
  if (['pendente', 'em aberto', 'alerta', 'troca solicitada'].includes(norm)) return 'warning'
  if (['cancelado', 'inativo', 'recusado', 'esgotado', 'baixo', 'troca negada'].includes(norm)) return 'error'
  if (['enviado', 'em trânsito', 'em transito', 'em processamento', 'processando', 'item enviado', 'item recebido'].includes(norm)) return 'info'
  return 'neutral'
}
