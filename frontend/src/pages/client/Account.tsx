import { useState } from 'react'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { User, MapPin, Save } from 'lucide-react'

export const Account = () => {
  const [name, setName] = useState('Carlos Henrique Silva')
  const [email, setEmail] = useState('carlos.henrique@gmail.com')
  const [phone, setPhone] = useState('(11) 98765-4321')
  const [cpf, setCpf] = useState('123.456.789-00')

  const [address, setAddress] = useState('Av. Paulista, 1000 - Ap 42')
  const [city, setCity] = useState('São Paulo')
  const [state, setState] = useState('SP')
  const [zipCode, setZipCode] = useState('01310-100')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Perfil atualizado com sucesso (Simulado)!')
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Endereço de entrega atualizado com sucesso (Simulado)!')
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Breadcrumb items={[{ label: 'Minha Conta' }]} />

      <div className="mb-4">
        <h1 className="text-3xl font-black text-white tracking-tight">Minha Conta</h1>
        <p className="text-xs text-slate-500 font-medium">Gerencie seu perfil, dados de contato e endereços de entrega</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        {/* Profile Card Form */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-indigo-400" />
            Dados Pessoais
          </h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                disabled
              />
              <Input
                label="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Perfil
              </Button>
            </div>
          </form>
        </div>

        {/* Address Card Form */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-indigo-400" />
            Endereço de Entrega Padrão
          </h3>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <Input
              label="Endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="Estado"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <Input
              label="CEP"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Endereço
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
export default Account
