import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

export const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const navigate = useNavigate()

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const saveCart = (items: CartItem[]) => {
    setCartItems(items)
    localStorage.setItem('cart', JSON.stringify(items))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.productId === productId) {
        const nextQty = item.quantity + delta
        return { ...item, quantity: Math.max(nextQty, 1) }
      }
      return item
    })
    saveCart(updated)
  }

  const handleRemoveItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.productId !== productId)
    saveCart(updated)
  }

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 25.00
  const total = subtotal + shipping

  return (
    <div className="flex flex-col gap-6 text-left">
      <Breadcrumb items={[{ label: 'Carrinho de Compras' }]} />

      <h1 className="text-3xl font-black text-white tracking-tight mb-2">Meu Carrinho</h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cartItems.map((item) => (
              <div 
                key={item.productId}
                className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-sm"
              >
                {/* Image and Title */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1">
                      <Link to={`/produtos/${item.productId}`}>{item.name}</Link>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quantity and Subtotal Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                  {/* Quantity Counter */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, -1)}
                      className="px-2.5 py-1.5 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, 1)}
                      className="px-2.5 py-1.5 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal Item */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Subtotal</span>
                    <span className="text-sm font-bold font-mono text-white">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Remover Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Back to Shopping Navigation */}
            <div className="flex justify-start">
              <Link to="/produtos">
                <Button variant="outline" className="gap-2 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Continuar Comprando
                </Button>
              </Link>
            </div>
          </div>

          {/* Cart Order Summary Sidebar */}
          <aside className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800">
              Resumo do Pedido
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal dos Itens</span>
                <span className="font-mono font-semibold text-slate-200">
                  R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frete de Envio</span>
                <span className="font-mono font-semibold text-slate-200">
                  {shipping === 0 ? (
                    <span className="text-emerald-400 uppercase text-[10px] font-bold">Grátis</span>
                  ) : (
                    `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[10px] text-indigo-400 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                  Adicione mais R$ {(250 - subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em produtos para obter <strong>Frete Grátis</strong>!
                </p>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-100">Total Geral</span>
              <span className="text-xl font-black text-white font-mono">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-3"
            >
              Ir para o Checkout
              <ArrowRight className="w-4 h-4" />
            </Button>
          </aside>
        </div>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center max-w-xl mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Seu carrinho está vazio</h3>
          <p className="text-xs text-slate-500 mb-6">Nenhuma peça foi adicionada para compra ainda.</p>
          <Link to="/produtos">
            <Button variant="primary">Explorar Catálogo</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
export default Cart
