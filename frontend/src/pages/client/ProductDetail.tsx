import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { mockProducts } from '../../mock/mockData'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ShoppingCart, ArrowLeft, Shield, CheckCircle2, Truck } from 'lucide-react'

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)

  const product = useMemo(() => {
    return mockProducts.find((p) => p.id === id)
  }, [id])

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Peça não encontrada</h2>
        <p className="text-sm text-slate-500 mb-6">A peça buscada não foi encontrada no nosso catálogo.</p>
        <Link to="/produtos">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Catálogo
          </Button>
        </Link>
      </div>
    )
  }

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= product.minStock

  const handleAddToCart = () => {
    if (isOutOfStock) return

    try {
      const savedCart = localStorage.getItem('cart')
      const cart = savedCart ? JSON.parse(savedCart) : []
      const existing = cart.find((item: any) => item.productId === product.id)

      if (existing) {
        existing.quantity += quantity
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: quantity
        })
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      alert(`${quantity} unidade(s) de "${product.name}" adicionada(s) ao carrinho!`)
      navigate('/carrinho')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <Breadcrumb 
        items={[
          { label: 'Produtos', path: '/produtos' },
          { label: product.name }
        ]} 
      />

      <Link 
        to="/produtos" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Lista
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-900/30 border border-slate-900 p-8 md:p-12 rounded-3xl backdrop-blur-sm shadow-2xl">
        {/* Left Side: Product Image Display */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 flex items-center justify-center relative aspect-square shadow-inner">
          <img
            src={product.image}
            alt={product.name}
            className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-95"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
            {isOutOfStock ? (
              <Badge variant="error">Esgotado</Badge>
            ) : isLowStock ? (
              <Badge variant="warning">Apenas {product.stock} un.</Badge>
            ) : (
              <Badge variant="success">Em Estoque</Badge>
            )}
          </div>
        </div>

        {/* Right Side: Product Details & Purchase Controls */}
        <div className="flex flex-col justify-between gap-8">
          <div>
            {/* Header / Info badges */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                {product.manufacturer}
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                {product.category}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-2">
              {product.name}
            </h1>
            
            {/* Part Code */}
            <span className="text-xs text-slate-500 font-mono block mb-6">
              Código do Item: {product.code}
            </span>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Compatibilities */}
            <div className="border-t border-b border-slate-800/80 py-4.5 mb-6 text-left">
              <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Veículos Compatíveis
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.compatibility.map((car, idx) => (
                  <span 
                    key={idx} 
                    className="bg-slate-900 border border-slate-800/80 text-[10px] font-bold text-slate-300 px-2.5 py-1 rounded-lg"
                  >
                    {car}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Cart Action Block */}
          <div className="bg-slate-950/60 border border-slate-900 p-6 rounded-2xl flex flex-col gap-6">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Preço Unitário</span>
              <span className="text-2xl md:text-3xl font-black text-white font-mono">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {/* Quantity Counter */}
              {!isOutOfStock && (
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                    className="px-3.5 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold font-mono text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 1, product.stock))}
                    className="px-3.5 py-2.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 flex justify-center items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
        {[
          { icon: Truck, title: 'Entrega Rápida', desc: 'Consulte prazos para o seu CEP no checkout.' },
          { icon: Shield, title: 'Original & Lacrado', desc: 'Garantimos embalagem original e nota fiscal.' },
          { icon: CheckCircle2, title: 'Compatibilidade Certificada', desc: 'Garantia de encaixe perfeito nos veículos listados.' }
        ].map((feat, index) => {
          const Icon = feat.icon
          return (
            <div key={index} className="flex gap-3.5 p-5 bg-slate-900/20 border border-slate-900/60 rounded-2xl items-center">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-200">{feat.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{feat.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default ProductDetail
