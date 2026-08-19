import { useState, useEffect } from 'react'
import { mockProducts } from '../../mock/mockData'
import type { Product } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export const Stock = () => {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom-products')
      setProducts(saved ? JSON.parse(saved) : mockProducts)
    } catch {
      setProducts(mockProducts)
    }
  }, [])

  // Stock summary math
  const totalCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0)
  const totalSaleValue = products.reduce((acc, p) => acc + p.price * p.stock, 0)
  const potentialProfit = totalSaleValue - totalCostValue

  const getStockStatus = (p: Product) => {
    if (p.stock === 0) return 'Esgotado'
    if (p.stock <= p.minStock) return 'Baixo'
    return 'Normal'
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Painel de Estoque</h1>
        <p className="text-xs text-slate-500 font-medium">Controle de entradas, custos operacionais e margem de rentabilidade</p>
      </div>

      {/* Stock Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1 backdrop-blur-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Custo do Estoque Ativo</span>
          <span className="text-xl font-black text-white font-mono">
            R$ {totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            Capital imobilizado em peças
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1 backdrop-blur-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valor Estimado de Venda</span>
          <span className="text-xl font-black text-white font-mono">
            R$ {totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            Faturamento potencial bruto
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col gap-1 backdrop-blur-sm bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Lucro Bruto Projetado</span>
          <span className="text-xl font-black text-indigo-400 font-mono">
            R$ {potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-indigo-500 mt-1">
            Margem ponderada estimada
          </span>
        </div>
      </div>

      {/* Stock Critical alerts bar */}
      {products.some((p) => p.stock <= p.minStock) && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Existem itens com estoque zerado ou abaixo do limite de segurança. Reabastecimento sugerido.</span>
        </div>
      )}

      {/* Stock Grid Table */}
      <Table headers={['Código', 'Produto', 'Custo (R$)', 'Venda (R$)', 'Qtd Disponível', 'Estoque Mín.', 'Status']}>
        {products.map((p) => {
          const status = getStockStatus(p)
          return (
            <tr key={p.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                {p.code}
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-100 max-w-[220px] truncate">
                {p.name}
              </td>
              <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                R$ {p.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className={`px-6 py-4 font-mono text-xs font-bold ${p.stock === 0 ? 'text-rose-400' : p.stock <= p.minStock ? 'text-amber-400' : 'text-slate-100'}`}>
                {p.stock} un.
              </td>
              <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                {p.minStock} un.
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(status)}>
                  {status}
                </Badge>
              </td>
            </tr>
          )
        })}
      </Table>
    </div>
  )
}
export default Stock
