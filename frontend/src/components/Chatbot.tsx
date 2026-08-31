import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, ShoppingCart, Bot } from 'lucide-react'
import { mockProducts, type Product } from '../mock/mockData'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  products?: Product[]
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Olá! Sou o AutoBot, assistente inteligente da AutoPeças. 🚗 Digite o modelo do seu carro (ex: Civic, Onix, Gol) para eu recomendar peças compatíveis!'
      }
    ])
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    // Bot Response Logic
    setTimeout(() => {
      const query = textToSend.toLowerCase().trim()

      // Busca produtos ativos que correspondam à compatibilidade ou nome/categoria
      const matched = mockProducts.filter((product) => {
        const matchesCompatibility = product.compatibility.some(c => c.toLowerCase().includes(query))
        const matchesName = product.name.toLowerCase().includes(query)
        const matchesCategory = product.category.toLowerCase().includes(query)
        return (matchesCompatibility || matchesName || matchesCategory) && product.status === 'Ativo'
      })

      let botResponse: Message
      if (matched.length > 0) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Encontrei as seguintes peças recomendadas compatíveis com "${textToSend}":`,
          products: matched
        }
      } else {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Desculpe, não encontrei peças correspondentes a "${textToSend}". Tente buscar por termos como: Civic, Onix, Gol, Corolla, Filtros ou Freios.`
        }
      }

      setMessages((prev) => [...prev, botResponse])
    }, 600)
  }

  const handleAddToCart = (product: Product) => {
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

      // Envia mensagem de confirmação
      const confirmMessage: Message = {
        id: `bot-cart-${Date.now()}`,
        sender: 'bot',
        text: `✅ "${product.name}" foi adicionado ao seu carrinho! Deseja finalizar a compra?`
      }
      setMessages((prev) => [...prev, confirmMessage])
    } catch (err) {
      console.error(err)
      alert('Falha ao adicionar item ao carrinho.')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans text-left">
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-650 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-xl hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300 cursor-pointer animate-pulse relative"
        title="Assistente de Peças"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-85 sm:w-96 h-[480px] bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn">

          {/* Cabeçalho do Chat */}
          <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border-b border-slate-800 p-4.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  AutoBot Assistente
                  {/* <Sparkles className="w-3 h-3 text-indigo-400" /> */}
                </h4>
                {/* <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Homologação Técnica</span> */}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Container do corpo de mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} w-full animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${m.sender === 'user'
                    ? 'bg-indigo-500 text-white rounded-tr-none'
                    : 'bg-slate-950/65 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}
                >
                  <p>{m.text}</p>

                  {/* Renderiza cards de produtos se houver */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                              <img src={p.image} alt={p.name} className="w-8 h-8 object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-200 block truncate leading-tight">{p.name}</span>
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">R$ {p.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                            title="Adicionar ao Carrinho"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Links pré-definidos dentro das respostas do bot */}
                  {m.text.includes('adicionado ao seu carrinho!') && (
                    <div className="flex gap-2.5 mt-2.5">
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

                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Botões de Resposta Rápida */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto whitespace-nowrap bg-slate-950/20 border-t border-slate-850/50 custom-scrollbar">
            {['Civic', 'Onix', 'Gol', 'Corolla', 'Filtros', 'Freios'].map((pill) => (
              <button
                key={pill}
                onClick={() => handleSend(pill)}
                className="px-2.5 py-1 rounded-full border border-slate-800 hover:border-indigo-500/40 bg-slate-950 text-[10px] font-bold text-slate-450 hover:text-indigo-400 transition-all cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input de Envio de Chat Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(inputValue)
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite o modelo do carro..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-3.5 py-1.5 rounded-xl text-xs focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
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
