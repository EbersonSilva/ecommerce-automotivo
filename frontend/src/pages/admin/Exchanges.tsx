import { useState, useEffect } from 'react'
import type { Exchange } from '../../mock/mockData'
import { getAllExchanges, updateExchangeStatus } from '../../services/exchangeService'
import { Table } from '../../components/ui/Table'
import { Badge, getStatusVariant } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { RefreshCw, Check, X } from 'lucide-react'

export const Exchanges = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(false)

  const loadExchanges = async () => {
    try {
      setLoading(true)
      const data = await getAllExchanges()
      setExchanges(data)
    } catch (err: any) {
      console.error('Erro ao carregar trocas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExchanges()
  }, [])

  const handleAction = async (exchangeId: string, nextStatus: Exchange['status']) => {
    try {
      await updateExchangeStatus(exchangeId, nextStatus)

      if (nextStatus === 'TROCA PROCESSADA') {
        alert(`Solicitação ${exchangeId} processada com sucesso! Um cupom de troca foi gerado no PostgreSQL para o cliente.`)
      } else {
        alert(`Solicitação ${exchangeId} alterada para "${nextStatus}"!`)
      }

      // Recarrega as trocas diretamente do banco de dados
      loadExchanges()
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar status da troca.')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Solicitações de Trocas</h1>
          <p className="text-xs text-slate-500 font-medium">Controle de devoluções, trocas e logística reversa de autopeças</p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={loadExchanges} 
          disabled={loading}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
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
                {ex.status === 'TROCA SOLICITADA' && (
                  <>
                    <Button
                      onClick={() => handleAction(ex.id, 'TROCA ACEITA')}
                      variant="primary"
                      size="sm"
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[10px]"
                      title="Aprovar Troca"
                    >
                      <Check className="w-3 h-3" />
                      Aceitar
                    </Button>
                    <Button
                      onClick={() => handleAction(ex.id, 'TROCA NEGADA')}
                      variant="danger"
                      size="sm"
                      className="px-2 py-1 flex items-center gap-1 text-[10px]"
                      title="Recusar Troca"
                    >
                      <X className="w-3 h-3" />
                      Negar
                    </Button>
                  </>
                )}

                {ex.status === 'ITEM ENVIADO' && (
                  <Button
                    onClick={() => handleAction(ex.id, 'ITEM RECEBIDO')}
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 text-[10px]"
                    title="Confirmar Recebimento"
                  >
                    <Check className="w-3 h-3" />
                    Receber Item
                  </Button>
                )}

                {ex.status === 'ITEM RECEBIDO' && (
                  <Button
                    onClick={() => handleAction(ex.id, 'TROCA PROCESSADA')}
                    variant="primary"
                    size="sm"
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[10px]"
                    title="Processar Troca e Gerar Cupom"
                  >
                    <Check className="w-3 h-3" />
                    Processar Cupom
                  </Button>
                )}

                {ex.status === 'TROCA ACEITA' && (
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Aguardando Envio</span>
                )}
                {ex.status === 'TROCA NEGADA' && (
                  <span className="text-[10px] text-rose-500 font-bold uppercase">Negada</span>
                )}
                {ex.status === 'TROCA PROCESSADA' && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Concluída / Cupom Gerado</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-16 text-center">
          <RefreshCw className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Nenhuma solicitação pendente</h3>
          <p className="text-xs text-slate-500">A fila de trocas e devoluções encontra-se vazia.</p>
        </div>
      )}
    </div>
  )
}
export default Exchanges
