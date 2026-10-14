import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../mock/mockData'
import { getProducts } from '../../services/productService'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Plus, RefreshCw } from 'lucide-react'

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // States de Filtro e Paginação
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)))
  }, [products])

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
          <p className="text-xs text-slate-500 font-medium">Catálogo completo de autopeças registradas no banco (PostgreSQL)</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={loadProducts} 
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link to="/admin/produtos/novo">
            <Button size="sm" className="gap-2 text-xs">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          placeholder="Buscar por nome, código ou fabricante..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
        />
        <Select 
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setCurrentPage(1)
          }}
          options={[
            { value: '', label: 'Todas as Categorias' },
            ...categories.map((c) => ({ value: c, label: c }))
          ]}
        />
      </div>

      {/* Tabela de Produtos */}
      <Table headers={['Código', 'Nome do Produto', 'Categoria', 'Fabricante', 'Preço Venda', 'Estoque', 'Status']}>
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
            <td className="px-6 py-4 text-xs text-slate-300">
              {p.manufacturer}
            </td>
            <td className="px-6 py-4 font-mono font-semibold text-slate-100 text-xs">
              R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className={`px-6 py-4 font-mono font-bold text-xs ${p.stock <= p.minStock ? 'text-rose-400' : 'text-slate-200'}`}>
              {p.stock} un.
            </td>
            <td className="px-6 py-4">
              <Badge variant={getStatusVariant(p.status)}>
                {p.status}
              </Badge>
            </td>
          </tr>
        ))}
      </Table>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-1.5">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export default Products
