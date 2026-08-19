import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { mockCustomers, mockOrders } from '../../mock/mockData'
import type { Customer, Order } from '../../mock/mockData'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, User, MapPin, ClipboardList, Calendar } from 'lucide-react'

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    try {
      const savedCusts = localStorage.getItem('custom-customers')
      const custList = savedCusts ? JSON.parse(savedCusts) : mockCustomers
      const found = custList.find((c: Customer) => c.id === id)
      setCustomer(found || null)

      const savedOrders = localStorage.getItem('custom-orders')
      const ordersList = savedOrders ? JSON.parse(savedOrders) : []
      const combinedOrders = [...ordersList, ...mockOrders]

      // Filter orders related to this customer (or match by name if custom)
      if (found) {
        const filtered = combinedOrders.filter(
          (o) => o.customerId === found.id || o.customerName === found.name
        )
        setOrders(filtered)
      }
    } catch {
      const found = mockCustomers.find((c) => c.id === id)
      setCustomer(found || null)
      if (found) {
        setOrders(mockOrders.filter((o) => o.customerId === found.id))
      }
    }
  }, [id])

  if (!customer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Cliente não encontrado</h2>
        <p className="text-sm text-slate-500 mb-6">O código solicitado não coincide com nenhum cliente da base.</p>
        <Link to="/admin/clientes">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Lista
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
      <Link 
        to="/admin/clientes" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Lista
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-indigo-400 px-3 py-1.5 rounded-lg">
            {customer.code}
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-3">{customer.name}</h1>
        </div>
        <Link to={`/admin/clientes/${customer.id}/editar`}>
          <Button variant="secondary" size="md">
            Editar Cadastro
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 items-start">
        {/* Left Columns: Customer metadata cards */}
        <div className="flex flex-col gap-6">
          {/* Personal Info Card */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-xs pb-3 border-b border-slate-850">
              <User className="w-4.5 h-4.5 text-indigo-400" />
              Dados de Cadastro
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-550">CPF</span>
                <span className="font-mono text-slate-300">{customer.cpf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550">E-mail</span>
                <span className="text-slate-300">{customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550">Telefone</span>
                <span className="text-slate-300">{customer.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-550">Status</span>
                <Badge variant={getStatusVariant(customer.status)}>{customer.status}</Badge>
              </div>
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-sm shadow-xl text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Endereço Registrado
            </h4>
            {customer.address ? (
              <div className="space-y-1 text-slate-300">
                <p className="font-semibold">{customer.address}</p>
                <p className="text-slate-450">{customer.city} - {customer.state}</p>
                <p className="font-mono text-[10px] text-slate-500">CEP: {customer.zipCode}</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">Nenhum endereço registrado.</p>
            )}
          </div>
        </div>

        {/* Right Side: Order history */}
        <div className="md:col-span-2 bg-slate-900/40 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-indigo-400" />
            Histórico de Pedidos
          </h3>

          {orders.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {orders.map((o) => (
                <div key={o.id} className="py-4 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="font-bold text-slate-200 font-mono block text-sm">{o.id}</span>
                    <span className="text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {o.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-slate-200 font-semibold text-sm">
                      R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={getStatusVariant(o.status)}>{o.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhuma compra registrada para este cliente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default CustomerDetail
