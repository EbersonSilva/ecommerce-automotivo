import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../mock/mockData'
import { getProducts, updateProductStatus, autoDeactivateOutOfStock } from '../../services/productService'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Plus, RefreshCw, Edit2, Power, Zap } from 'lucide-react'

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // Filtros (RF0015)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Modal de Ativação / Inativação (RF0012, RF0016, RN0013)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts({
        admin: true,
        status: statusFilter,
        categoria: categoryFilter
      })
      setProducts(data)
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [statusFilter, categoryFilter])

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [products, search])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredProducts, currentPage])

  // Abertura da Modal de Status com Justificativa
  const handleOpenStatusModal = (product: Product) => {
    setSelectedProduct(product)
    setJustificativa('')
    setIsStatusModalOpen(true)
  }

  // Confirmação da Ativação/Inativação (RF0012 / RF0016)
  const handleConfirmStatusChange = async () => {
    if (!selectedProduct) return

    if (!justificativa.trim()) {
      alert('Regra (RN0013): É obrigatório informar a justificativa para alterar o status da peça.')
      return
    }

    const nextStatus = selectedProduct.status === 'Ativo' ? 'Inativo' : 'Ativo'

    try {
      setStatusSubmitting(true)
      await updateProductStatus(selectedProduct.id, nextStatus, justificativa)
      alert(`Peça ${selectedProduct.code} foi ${nextStatus === 'Ativo' ? 'ativada' : 'inativada'} com sucesso!`)
      setIsStatusModalOpen(false)
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'Falha ao alterar status da peça.')
    } finally {
      setStatusSubmitting(false)
    }
  }

  // Rotina de Inativação Automática (RF0013)
  const handleAutoDeactivate = async () => {
    if (!confirm('Deseja executar a rotina automática de inativação para todas as peças com estoque zerado?')) {
      return
    }

    try {
      const res = await autoDeactivateOutOfStock()
      alert(res.message)
      loadProducts()
    } catch (err: any) {
      alert(err.message || 'Falha ao processar inativação automática.')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Peças Automotivas</h1>
          <p className="text-xs text-slate-500 font-medium">Catálogo, precificação, ativação/inativação e controle de estoque</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Botão de Inativação Automática (RF0013) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDeactivate}
            className="text-xs gap-1.5 border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
            title="Inativa automaticamente todas as peças com estoque zerado"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Inativação Automática
          </Button>

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
              Nova Peça
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros (RF0015) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          placeholder="Buscar por nome, código SKU ou fabricante..."
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

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          options={[
            { value: 'todos', label: 'Status: Todos os Itens' },
            { value: 'Ativo', label: 'Status: Apenas Ativos' },
            { value: 'Inativo', label: 'Status: Apenas Inativos' }
          ]}
        />
      </div>

      {/* Tabela de Produtos */}
      <Table headers={['Código SKU', 'Nome da Peça', 'Categoria', 'Fabricante', 'Preço Venda', 'Estoque', 'Status', 'Ações']}>
        {paginatedProducts.map((p) => (
          <tr key={p.id} className="hover:bg-slate-900/35 transition-colors">
            <td className="px-6 py-4 font-mono font-semibold text-slate-200">
              {p.code}
            </td>
            <td className="px-6 py-4 text-xs font-bold text-slate-100 max-w-[240px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={p.image || '/products/pastilha-freio.webp'} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <span className="truncate">{p.name}</span>
              </div>
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
            <td className="px-6 py-4 flex gap-1.5 items-center justify-start">
              {/* Editar (RF0014) */}
              <Link to={`/admin/produtos/${p.id}/editar`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                  title="Alterar Cadastro"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </Link>

              {/* Ativar/Inativar com Justificativa (RF0012, RF0016, RN0013) */}
              <Button
                variant={p.status === 'Ativo' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleOpenStatusModal(p)}
                className="p-1.5 text-xs flex items-center gap-1 font-bold"
                title={p.status === 'Ativo' ? 'Inativar Peça' : 'Ativar Peça'}
              >
                <Power className="w-3.5 h-3.5" />
                {p.status === 'Ativo' ? 'Inativar' : 'Ativar'}
              </Button>
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

      {/* Modal de Justificativa para Ativação / Inativação (RN0013) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={selectedProduct?.status === 'Ativo' ? 'Inativar Peça Automotiva' : 'Ativar Peça Automotiva'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={selectedProduct?.status === 'Ativo' ? 'danger' : 'primary'}
              size="sm"
              disabled={statusSubmitting}
              onClick={handleConfirmStatusChange}
            >
              {statusSubmitting ? 'Processando...' : `Confirmar ${selectedProduct?.status === 'Ativo' ? 'Inativação' : 'Ativação'}`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300">
            Você está prestes a alterar o status da peça <strong className="text-white font-mono">{selectedProduct?.code}</strong> ({selectedProduct?.name}) para <strong className={selectedProduct?.status === 'Ativo' ? 'text-rose-400' : 'text-emerald-400'}>{selectedProduct?.status === 'Ativo' ? 'INATIVO' : 'ATIVO'}</strong>.
          </p>

          <Input
            label="Justificativa da Alteração"
            placeholder={selectedProduct?.status === 'Ativo' ? "Ex: Descontinuado pelo fabricante, defeito de lote, etc." : "Ex: Chegada de nova remessa do fornecedor."}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  )
}
export default Products
