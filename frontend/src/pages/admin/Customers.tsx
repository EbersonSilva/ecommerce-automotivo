import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { mockCustomers } from '../../mock/mockData'
import type { Customer } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Plus, Eye, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('custom-customers')
      return saved ? JSON.parse(saved) : mockCustomers
    } catch {
      return mockCustomers
    }
  })

  // States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modal State for Toggle Status
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null)

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.cpf.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === '' || c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [customers, search, statusFilter])

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredCustomers.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredCustomers, currentPage])

  const openToggleModal = (customer: Customer) => {
    setTargetCustomer(customer)
    setIsModalOpen(true)
  }

  const handleToggleStatus = () => {
    if (!targetCustomer) return

    const updated = customers.map((c) => {
      if (c.id === targetCustomer.id) {
        return {
          ...c,
          status: c.status === 'Ativo' ? 'Inativo' : 'Ativo' as 'Ativo' | 'Inativo'
        }
      }
      return c
    })

    setCustomers(updated)
    localStorage.setItem('custom-customers', JSON.stringify(updated))
    setIsModalOpen(false)
    setTargetCustomer(null)
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500 font-medium">Cadastre, edite e ative/inative clientes da base</p>
        </div>
        <Link to="/admin/clientes/novo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-end backdrop-blur-sm shadow-md">
        <div className="flex-1 w-full">
          <Input
            label="Pesquisa Rápida"
            placeholder="Nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Filtrar por Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: 'Todos' },
              { value: 'Ativo', label: 'Ativos' },
              { value: 'Inativo', label: 'Inativos' }
            ]}
          />
        </div>
      </div>

      {/* Customers Data Table */}
      {paginatedCustomers.length > 0 ? (
        <Table headers={['Código', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Status', 'Ações']}>
          {paginatedCustomers.map((cust) => (
            <tr key={cust.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                {cust.code}
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-100">
                {cust.name}
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-400">
                {cust.cpf}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                {cust.email}
              </td>
              <td className="px-6 py-4 text-xs text-slate-450">
                {cust.phone}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(cust.status)}>
                  {cust.status}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-1.5 justify-start">
                <Link to={`/admin/clientes/${cust.id}`}>
                  <Button variant="secondary" size="sm" className="p-2" title="Visualizar Perfil">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to={`/admin/clientes/${cust.id}/editar`}>
                  <Button variant="secondary" size="sm" className="p-2" title="Editar Cadastro">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  </Button>
                </Link>
                <Button 
                  onClick={() => openToggleModal(cust)} 
                  variant="danger" 
                  size="sm" 
                  className="p-2" 
                  title={cust.status === 'Ativo' ? 'Inativar Cliente' : 'Ativar Cliente'}
                >
                  {cust.status === 'Ativo' ? (
                    <ToggleRight className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-emerald-400" />
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <span className="text-3xl block mb-4">👥</span>
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum cliente cadastrado</h3>
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setTargetCustomer(null)
        }}
        title="Confirmar Alteração de Status"
        footer={
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                setIsModalOpen(false)
                setTargetCustomer(null)
              }}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleToggleStatus}
              variant={targetCustomer?.status === 'Ativo' ? 'danger' : 'primary'}
            >
              Confirmar
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-300 leading-relaxed">
          Tem certeza que deseja alterar o status de <strong>{targetCustomer?.name}</strong> para{' '}
          <strong className={targetCustomer?.status === 'Ativo' ? 'text-rose-400' : 'text-emerald-400'}>
            {targetCustomer?.status === 'Ativo' ? 'Inativo' : 'Ativo'}
          </strong>?
        </p>
      </Modal>
    </div>
  )
}
export default Customers
