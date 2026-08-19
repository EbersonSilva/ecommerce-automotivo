import { Link } from 'react-router-dom'
import type { Product } from '../mock/mockData'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ShoppingCart } from 'lucide-react'

interface CardProps {
  product: Product
  onAddToCart?: (e: React.MouseEvent) => void
}

export const Card = ({ product, onAddToCart }: CardProps) => {
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= product.minStock

  return (
    <div className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden backdrop-blur-sm">
      {/* Stock warning floaters */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 items-end">
        {isOutOfStock ? (
          <Badge variant="error">Esgotado</Badge>
        ) : isLowStock ? (
          <Badge variant="warning">Estoque Baixo</Badge>
        ) : null}
      </div>

      <Link to={`/produtos/${product.id}`} className="flex-1 flex flex-col gap-4">
        {/* Product Image */}
        <div className="aspect-square bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative p-4 group-hover:scale-[1.02] transition-transform duration-300">
          <img
            src={product.image}
            alt={product.name}
            className="object-contain w-32 h-32 opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-2 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
            {product.manufacturer} | {product.category}
          </span>
          <h3 className="text-sm font-bold text-slate-100 line-clamp-2 min-h-[40px] leading-snug group-hover:text-indigo-400 transition-colors">
            {product.name}
          </h3>
          <span className="text-xs text-slate-400 font-mono">Cód: {product.code}</span>
        </div>
      </Link>

      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Preço</span>
          <span className="text-lg font-black text-white font-mono">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <Button
          onClick={(e) => {
            e.preventDefault()
            onAddToCart?.(e)
          }}
          disabled={isOutOfStock}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Comprar
        </Button>
      </div>
    </div>
  )
}
