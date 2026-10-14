import { useState, useEffect } from 'react'
import type { Order } from '../../mock/mockData'
import { getAllOrders, updateOrderStatus } from '../../services/orderService'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { ClipboardList, RefreshCw } from 'lucide-react'

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Busca todos os pedidos reais gravados no PostgreSQL
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err)
      alert('Não foi possível carregar os pedidos do banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // 2. Envia a alteração de status para o PostgreSQL via PATCH /api/pedidos/:id/status
  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus)

      // Atualiza a tabela na tela imediatamente
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
      )

      alert(`Status do pedido #${orderId} atualizado para "${nextStatus}" com sucesso!`)
    } catch (err: any) {
      console.error(err)
      alert(`Falha ao atualizar status do pedido: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Pedidos Recebidos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PostgreSQL
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Acompanhe faturamentos, entregas e despachos de mercadorias em tempo real
          </p>
        </div>

        {/* Botão para recarregar a lista manualmente */}
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center text-slate-400 text-sm">
          Carregando pedidos do PostgreSQL...
        </div>
      ) : orders.length > 0 ? (
        <Table headers={['Código / ID', 'Cliente', 'Data', 'Valor Total', 'Pagamento', 'Status Atual', 'Alterar Status']}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-slate-200">
                {o.code || `#${o.id}`}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-100">
                {o.customerName}
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-400">
                {o.date}
              </td>
              <td className="px-6 py-4 font-mono text-slate-200 text-xs font-bold">
                R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                {o.paymentMethod}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(o.status)}>
                  {o.status}
                </Badge>
              </td>
              <td className="px-6 py-4 min-w-[200px]">
                <Select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  options={[
                    { value: 'EM PROCESSAMENTO', label: 'EM PROCESSAMENTO' },
                    { value: 'PAGAMENTO APROVADO', label: 'PAGAMENTO APROVADO' },
                    { value: 'PAGAMENTO RECUSADO', label: 'PAGAMENTO RECUSADO' },
                    { value: 'EM TRANSPORTE', label: 'EM TRANSPORTE' },
                    { value: 'ENTREGUE', label: 'ENTREGUE' },
                    { value: 'CANCELADO', label: 'CANCELADO' },
                    { value: 'TROCA SOLICITADA', label: 'TROCA SOLICITADA' }
                  ]}
                  className="py-1 px-2.5 text-xs rounded-lg"
                />
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum pedido faturado</h3>
          <p className="text-xs text-slate-500">Nenhum pedido recebido no banco de dados.</p>
        </div>
      )}
    </div>
  )
}

export default Orders
