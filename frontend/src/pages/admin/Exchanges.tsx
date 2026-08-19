import { useState, useEffect } from 'react'
import { mockExchanges } from '../../mock/mockData'
import type { Exchange } from '../../mock/mockData'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { RefreshCw, Check, X } from 'lucide-react'

export const Exchanges = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([])

  const loadExchanges = () => {
    try {
      const savedCustom = localStorage.getItem('custom-exchanges')
      const customList = savedCustom ? JSON.parse(savedCustom) : []
      setExchanges([...customList, ...mockExchanges])
    } catch {
      setExchanges(mockExchanges)
    }
  }

  useEffect(() => {
    loadExchanges()
  }, [])

  const handleAction = (exchangeId: string, nextStatus: 'Aprovado' | 'Recusado') => {
    try {
      const savedCustom = localStorage.getItem('custom-exchanges')
      const customList: Exchange[] = savedCustom ? JSON.parse(savedCustom) : []
      
      const foundInCustom = customList.find((ex) => ex.id === exchangeId)
      
      let updatedExchanges: Exchange[]
      if (foundInCustom) {
        const updatedCustom = customList.map((ex) => {
          if (ex.id === exchangeId) {
            return { ...ex, status: nextStatus }
          }
          return ex
        })
        localStorage.setItem('custom-exchanges', JSON.stringify(updatedCustom))
        updatedExchanges = [...updatedCustom, ...mockExchanges]
      } else {
        // Update mock items in local state
        updatedExchanges = exchanges.map((ex) => {
          if (ex.id === exchangeId) {
            return { ...ex, status: nextStatus }
          }
          return ex
        })
      }
      
      setExchanges(updatedExchanges)
      alert(`Solicitação de devolução ${exchangeId} foi "${nextStatus}"!`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Solicitações de Trocas</h1>
        <p className="text-xs text-slate-500 font-medium">Controle de devoluções, trocas e logística reversa de autopeças</p>
      </div>

      {exchanges.length > 0 ? (
        <Table headers={['Código Troca', 'Código Pedido', 'Cliente', 'Produto / Peça', 'Data Solicitação', 'Motivo da Troca', 'Status', 'Ações']}>
          {exchanges.map((ex) => (
            <tr key={ex.id} className="hover:bg-slate-900/35 transition-colors">
              <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                {ex.id}
              </td>
              <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                {ex.orderId}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-150">
                {ex.customerName}
              </td>
              <td className="px-6 py-4 text-xs text-slate-100 font-bold max-w-[150px] truncate">
                {ex.product}
              </td>
              <td className="px-6 py-4 text-xs font-mono text-slate-450">
                {ex.requestDate}
              </td>
              <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={ex.reason}>
                {ex.reason}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(ex.status)}>
                  {ex.status}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-1.5 justify-start">
                {ex.status === 'Pendente' ? (
                  <>
                    <Button
                      onClick={() => handleAction(ex.id, 'Aprovado')}
                      variant="primary"
                      size="sm"
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/10 text-white font-bold flex items-center gap-1 text-[11px]"
                      title="Aprovar Devolução"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleAction(ex.id, 'Recusado')}
                      variant="danger"
                      size="sm"
                      className="px-2 py-1 flex items-center gap-1 text-[11px]"
                      title="Recusar Devolução"
                    >
                      <X className="w-3.5 h-3.5" />
                      Recusar
                    </Button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Decidido</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <RefreshCw className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-spin-slow" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhuma solicitação pendente</h3>
          <p className="text-xs text-slate-500">A fila de trocas e devoluções encontra-se vazia.</p>
        </div>
      )}
    </div>
  )
}
export default Exchanges
