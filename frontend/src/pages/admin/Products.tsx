import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { mockProducts } from '../../mock/mockData'
import type { Product } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Plus, Edit2 } from 'lucide-react'

export const Products = () => {
  const [products] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('custom-products')
      return saved ? JSON.parse(saved) : mockProducts
    } catch {
      return mockProducts
    }
  })

  // States
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const categories = useMemo(() => {
    return Array.from(new Set(mockProducts.map((p) => p.category)))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(search.toLowerCase())
      
      const matchesCategory = categoryFilter === '' || p.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredProducts, currentPage])

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Produtos</h1>
          <p className="text-xs text-slate-500 font-medium">Cadastre e gerencie o catálogo de autopeças da loja</p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-end backdrop-blur-sm shadow-md">
        <div className="flex-1 w-full">
          <Input
            label="Buscar Peça"
            placeholder="Nome, código do fabricante ou descrição..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Categoria"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: 'Todas' },
              ...categories.map((cat) => ({ value: cat, label: cat }))
            ]}
          />
        </div>
      </div>

      {/* Products Data Table */}
      {paginatedProducts.length > 0 ? (
        <Table headers={['Código', 'Nome', 'Categoria', 'Fabricante', 'Preço', 'Estoque', 'Status', 'Ações']}>
          {paginatedProducts.map((p) => (
            <tr key={p.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                {p.code}
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-100 max-w-[200px] truncate">
                {p.name}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                {p.category}
              </td>
              <td className="px-6 py-4 text-xs text-slate-450">
                {p.manufacturer}
              </td>
              <td className="px-6 py-4 font-mono font-semibold text-slate-200 text-xs">
                R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 font-mono text-slate-350 text-xs">
                {p.stock} un.
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(p.status)}>
                  {p.status}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-1.5 justify-start">
                <Link to={`/admin/produtos/${p.id}/editar`}>
                  <Button variant="secondary" size="sm" className="p-2" title="Editar Produto">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <span className="text-3xl block mb-4">⚙️</span>
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum produto catalogado</h3>
          <p className="text-xs text-slate-500">Tente ajustar seus critérios de busca.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center w-full mt-2">
          <span className="text-xs text-slate-500 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
            <Button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export default Products
