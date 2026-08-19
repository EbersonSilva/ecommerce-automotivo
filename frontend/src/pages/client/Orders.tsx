import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { mockOrders } from '../../mock/mockData'
import type { Order } from '../../mock/mockData'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Eye, ClipboardList } from 'lucide-react'

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('custom-orders')
      const customList = savedCustom ? JSON.parse(savedCustom) : []
      setOrders([...customList, ...mockOrders])
    } catch {
      setOrders(mockOrders)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6 text-left">
      <Breadcrumb items={[{ label: 'Meus Pedidos' }]} />

      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Meus Pedidos</h1>
        <p className="text-xs text-slate-500">Histórico de compras e rastreamento de entregas</p>
      </div>

      {orders.length > 0 ? (
        <Table headers={['Código', 'Data', 'Itens', 'Total', 'Status', 'Ações']}>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-slate-200">
                {order.id}
              </td>
              <td className="px-6 py-4 text-xs">
                {order.date}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
              </td>
              <td className="px-6 py-4 font-mono font-semibold text-slate-255 text-xs">
                R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <Link to={`/pedidos/${order.id}`}>
                  <Button variant="secondary" size="sm" className="flex items-center gap-1.5 py-1 px-2 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center max-w-xl mx-auto">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum pedido efetuado</h3>
          <p className="text-xs text-slate-500">Você ainda não realizou compras em nossa plataforma.</p>
        </div>
      )}
    </div>
  )
}
export default Orders
