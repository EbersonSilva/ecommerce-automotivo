import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  X,
  Send,
  ShoppingCart,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RefreshCw,
  UserCheck,
  LogIn,
  CheckCircle2
} from 'lucide-react'
import {
  sendChatbotMessage,
  sendChatbotFeedback,
  type RecommendedProduct
} from '../services/chatbotService'

interface Message {
  id: string
  interactionId?: string
  sender: 'bot' | 'user'
  text: string
  products?: RecommendedProduct[]
  feedback?: 'UTIL' | 'NAO_UTIL' | null
  feedbackNote?: string
}

interface LoggedCustomerInfo {
  id: string
  name: string
  cpf: string
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loadingReply, setLoadingReply] = useState(false)

  // Lê diretamente o cliente logado na sessão da loja (localStorage 'logged-customer')
  const getLoggedCustomerFromStorage = (): LoggedCustomerInfo | null => {
    try {
      const saved = localStorage.getItem('logged-customer')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.id && parsed.id !== 'admin') {
          return {
            id: String(parsed.id),
            name: String(parsed.name || 'Cliente'),
            cpf: String(parsed.cpf || '')
          }
        }
      }
    } catch {
      // Ignora erro de parse
    }
    return null
  }

  const [loggedCustomer, setLoggedCustomer] = useState<LoggedCustomerInfo | null>(() =>
    getLoggedCustomerFromStorage()
  )
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const currentCustomerId = loggedCustomer?.id || 'visitante'

  // Escuta login/logout feito no cabeçalho da loja ('auth-change')
  useEffect(() => {
    const syncLoggedCustomer = () => {
      setLoggedCustomer(getLoggedCustomerFromStorage())
    }

    window.addEventListener('auth-change', syncLoggedCustomer)
    window.addEventListener('storage', syncLoggedCustomer)
    return () => {
      window.removeEventListener('auth-change', syncLoggedCustomer)
      window.removeEventListener('storage', syncLoggedCustomer)
    }
  }, [])

  // Mensagem inicial natural para o cliente logado (só reinicia se trocar de cliente)
  useEffect(() => {
    if (loggedCustomer) {
      setMessages([
        {
          id: `welcome-${loggedCustomer.id}`,
          sender: 'bot',
          text: `Olá, **${loggedCustomer.name}**! Sou o **AutoBot**, seu assistente virtual da AutoParts. \nPosso sugerir peças ideais com base nas suas compras, ajudar a buscar produtos ou tirar dúvidas sobre manutenção do seu carro!`
        }
      ])
    } else {
      setMessages([
        {
          id: 'welcome-guest',
          sender: 'bot',
          text: `Olá! Sou o **AutoBot**, assistente virtual da AutoParts. \nPosso ajudar você a encontrar peças, responder dúvidas sobre manutenção e sugerir produtos. Entre na sua conta para receber recomendações personalizadas para o seu carro!`
        }
      ])
    }
  }, [loggedCustomer?.id, loggedCustomer?.name])

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loadingReply) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoadingReply(true)

    try {
      const response = await sendChatbotMessage(currentCustomerId, textToSend.trim())

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        interactionId: response.interactionId,
        sender: 'bot',
        text: response.reply,
        products: response.recommendedProducts,
        feedback: null
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: err.message || 'Desculpe, não consegui processar sua mensagem agora.'
        }
      ])
    } finally {
      setLoadingReply(false)
    }
  }

  const handleFeedback = async (
    messageId: string,
    interactionId: string | undefined,
    feedbackType: 'UTIL' | 'NAO_UTIL'
  ) => {
    if (!interactionId) return

    try {
      const res = await sendChatbotFeedback(interactionId, feedbackType)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                feedback: feedbackType,
                feedbackNote: res.message
              }
            : m
        )
      )
    } catch (err) {
      console.error('Erro ao registrar feedback:', err)
    }
  }

  const handleAddToCart = (product: RecommendedProduct) => {
    try {
      const savedCart = localStorage.getItem('cart')
      const cartItems = savedCart ? JSON.parse(savedCart) : []

      const existing = cartItems.find((item: any) => item.productId === product.id)
      if (existing) {
        existing.quantity += 1
      } else {
        cartItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        })
      }

      localStorage.setItem('cart', JSON.stringify(cartItems))
      window.dispatchEvent(new Event('cart-updated'))

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-cart-${Date.now()}`,
          sender: 'bot',
          text: `✅ **"${product.name}"** foi adicionado ao seu carrinho! Deseja finalizar a compra?`
        }
      ])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans text-left">
      {/* Botão Flutuante de Abertura */}
      <button
        data-testid="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 cursor-pointer relative"
        title="Assistente Virtual AutoBot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div
          data-testid="chatbot-window"
          className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[540px] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden"
        >
          {/* Cabeçalho Limpo e Natural */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/30 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    AutoBot Assistente
                    {/* <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> */}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    ● Online • Atendimento Inteligente
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identificação do Cliente Logado */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/90 px-3 py-1.5 rounded-xl text-[11px]">
              {loggedCustomer ? (
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-400">Olá,</span>
                  <span className="font-bold text-white truncate">{loggedCustomer.name}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-slate-400 text-[10px]">Atendimento ao visitante</span>
                  <Link
                    to="/cadastro"
                    onClick={() => setIsOpen(false)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] flex items-center gap-1"
                  >
                    <LogIn className="w-3 h-3" />
                    Entrar na conta
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Mensagens do Chat */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                } w-full`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950/85 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Cards de Produtos Recomendados */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          data-testid={`recommended-product-${p.code}`}
                          className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-white truncate block">
                              {p.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                R$ {Number(p.price).toFixed(2)}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                                {p.category}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                            title="Adicionar ao Carrinho"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Links rápidos quando adiciona ao carrinho */}
                  {m.text.includes('adicionado ao seu carrinho!') && (
                    <div className="flex gap-3 mt-2.5">
                      <Link
                        to="/carrinho"
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Ir para o Carrinho
                      </Link>
                      <Link
                        to="/checkout"
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Finalizar Compra
                      </Link>
                    </div>
                  )}

                  {/* Avaliação da Resposta pelo Cliente (Útil / Não Útil) */}
                  {m.sender === 'bot' && m.interactionId && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Esta resposta ajudou você?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            data-testid={`feedback-util-${m.interactionId}`}
                            disabled={Boolean(m.feedback)}
                            onClick={() => handleFeedback(m.id, m.interactionId, 'UTIL')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                              m.feedback === 'UTIL'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            Útil
                          </button>
                          <button
                            type="button"
                            data-testid={`feedback-nao-util-${m.interactionId}`}
                            disabled={Boolean(m.feedback)}
                            onClick={() => handleFeedback(m.id, m.interactionId, 'NAO_UTIL')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                              m.feedback === 'NAO_UTIL'
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-rose-300'
                            }`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                            Não Útil
                          </button>
                        </div>
                      </div>

                      {m.feedbackNote && (
                        <div
                          data-testid="feedback-confirmation-msg"
                          className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{m.feedbackNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loadingReply && (
              <div className="flex justify-start">
                <div className="bg-slate-950/80 border border-slate-800 text-slate-400 rounded-2xl p-3 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>AutoBot está digitando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas Naturais */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto whitespace-nowrap bg-slate-950/50 border-t border-slate-800/80 custom-scrollbar">
            {[
              'O que você me recomenda hoje?',
              'Quando devo trocar a pastilha de freio?',
              'Dicas de manutenção preventiva',
              'Peças para Civic',
              'Peças para Onix'
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => handleSend(promptText)}
                className="px-2.5 py-1 rounded-full border border-slate-800 hover:border-indigo-500/50 bg-slate-900 text-[10px] font-bold text-slate-300 hover:text-indigo-300 transition-all cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Campo de Mensagem */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(inputValue)
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input
              data-testid="chatbot-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua dúvida ou o que procura..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-3.5 py-2 rounded-xl text-xs focus:outline-none transition-all"
            />
            <button
              data-testid="chatbot-send-btn"
              type="submit"
              disabled={loadingReply}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Chatbot