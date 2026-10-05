import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertModalOptions {
  title?: string
  message: string
  type?: AlertType
  confirmText?: string
  onConfirm?: () => void
}

interface AlertModalContextType {
  showAlert: (options: string | AlertModalOptions, title?: string, type?: AlertType) => Promise<void>
  closeAlert: () => void
}

const AlertModalContext = createContext<AlertModalContextType | undefined>(undefined)

// Global reference for window.alert bridge
let globalShowAlert: ((options: string | AlertModalOptions) => Promise<void>) | null = null

export const AlertModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [alertData, setAlertData] = useState<AlertModalOptions>({
    title: 'Atenção',
    message: '',
    type: 'info',
    confirmText: 'OK'
  })
  const [resolver, setResolver] = useState<(() => void) | null>(null)

  const inferTypeAndTitle = (msg: string): { type: AlertType; title: string } => {
    const lower = msg.toLowerCase()
    
    // Regras de Negócio ou Validações de formulário/estoque/cupom
    if (
      msg.includes('RN0031') || 
      msg.includes('RN0033') || 
      msg.includes('RN0034') || 
      msg.includes('RN0035') || 
      msg.includes('RN0021') || 
      msg.includes('RN0022') || 
      msg.includes('RN0023') || 
      msg.includes('RN0024') || 
      msg.includes('RN0026') ||
      lower.includes('favor preencher') ||
      lower.includes('por favor, preencha') ||
      lower.includes('preencha todos') ||
      lower.includes('excede') ||
      lower.includes('máxima disponível') ||
      lower.includes('já está cadastrado') ||
      lower.includes('permitido apenas') ||
      lower.includes('valor mínimo')
    ) {
      if (msg.includes('RN0031')) return { type: 'warning', title: 'RN0031 - Limite de Estoque' }
      if (msg.includes('RN0033')) return { type: 'warning', title: 'RN0033 - Regra de Cupons' }
      if (msg.includes('RN0034') || msg.includes('RN0035')) return { type: 'warning', title: 'RN0034 - Regra de Cartões' }
      return { type: 'warning', title: 'Atenção' }
    }

    if (
      lower.includes('sucesso') || 
      lower.includes('adicionada') || 
      lower.includes('adicionado') || 
      lower.includes('copiada') || 
      lower.includes('copiado') || 
      lower.includes('concluído') || 
      lower.includes('concluída') ||
      lower.includes('atualizado') ||
      lower.includes('confirmado') ||
      lower.includes('despachado') ||
      lower.includes('enviada') ||
      lower.includes('bem-vindo')
    ) {
      return { type: 'success', title: 'Sucesso!' }
    }

    if (
      lower.includes('erro') || 
      lower.includes('falha') || 
      lower.includes('não foi possível') || 
      lower.includes('recusad')
    ) {
      return { type: 'error', title: 'Erro' }
    }

    return { type: 'info', title: 'Informação' }
  }

  const showAlert = useCallback((options: string | AlertModalOptions, customTitle?: string, customType?: AlertType): Promise<void> => {
    return new Promise<void>((resolve) => {
      let finalOptions: AlertModalOptions

      if (typeof options === 'string') {
        const inferred = inferTypeAndTitle(options)
        finalOptions = {
          message: options,
          title: customTitle || inferred.title,
          type: customType || inferred.type,
          confirmText: 'OK'
        }
      } else {
        const inferred = inferTypeAndTitle(options.message || '')
        finalOptions = {
          message: options.message,
          title: options.title || inferred.title,
          type: options.type || inferred.type,
          confirmText: options.confirmText || 'OK',
          onConfirm: options.onConfirm
        }
      }

      setAlertData(finalOptions)
      setResolver(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const closeAlert = useCallback(() => {
    setIsOpen(false)
    if (alertData.onConfirm) {
      alertData.onConfirm()
    }
    if (resolver) {
      resolver()
      setResolver(null)
    }
  }, [alertData, resolver])

  // Setup global window.alert interceptor
  useEffect(() => {
    globalShowAlert = showAlert
    const originalAlert = window.alert

    window.alert = (message?: any) => {
      const msgStr = typeof message === 'string' ? message : String(message ?? '')
      globalShowAlert?.(msgStr)
    }

    return () => {
      window.alert = originalAlert
      globalShowAlert = null
    }
  }, [showAlert])

  // Keyboard shortcut: Escape or Enter closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        closeAlert()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeAlert])

  const typeConfig = {
    warning: {
      borderColor: 'border-amber-500/40',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      glow: 'shadow-amber-500/10',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold',
      icon: (
        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    error: {
      borderColor: 'border-rose-500/40',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      glow: 'shadow-rose-500/10',
      btnBg: 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold',
      icon: (
        <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
      btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold',
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      borderColor: 'border-indigo-500/40',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      glow: 'shadow-indigo-500/10',
      btnBg: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 text-white font-bold',
      icon: (
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const currentConfig = typeConfig[alertData.type || 'info']

  return (
    <AlertModalContext.Provider value={{ showAlert, closeAlert }}>
      {children}

      {/* Global Interactive Alert Modal Dialog */}
      {isOpen && (
        <div 
          role="dialog" 
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={closeAlert}
          />

          {/* Modal Container */}
          <div 
            className={`relative z-10 w-full max-w-md bg-slate-900/95 border ${currentConfig.borderColor} rounded-2xl p-6 shadow-2xl ${currentConfig.glow} flex flex-col items-center text-center overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-150`}
          >
            {/* Top Close Button (X) */}
            <button
              onClick={closeAlert}
              aria-label="Fechar modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Glowing Icon Circle */}
            <div className={`w-16 h-16 rounded-2xl ${currentConfig.bgColor} border ${currentConfig.borderColor} flex items-center justify-center mb-4 shadow-inner`}>
              {currentConfig.icon}
            </div>

            {/* Modal Title */}
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              {alertData.title}
            </h3>

            {/* Modal Message Body */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-line max-h-60 overflow-y-auto px-2">
              {alertData.message}
            </p>

            {/* Modal Confirmation Button */}
            <button
              id="modal-ok-btn"
              data-testid="modal-ok-btn"
              onClick={closeAlert}
              autoFocus
              className={`w-full py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg cursor-pointer ${currentConfig.btnBg}`}
            >
              {alertData.confirmText || 'OK'}
            </button>
          </div>
        </div>
      )}
    </AlertModalContext.Provider>
  )
}

export const useAlertModal = () => {
  const context = useContext(AlertModalContext)
  if (!context) {
    throw new Error('useAlertModal must be used within an AlertModalProvider')
  }
  return context
}
