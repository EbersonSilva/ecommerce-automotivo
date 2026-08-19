import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { mockProducts } from '../../mock/mockData'
import type { Product } from '../../mock/mockData'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Save, ShoppingBag } from 'lucide-react'

export const ProductForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  // Form Fields State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Freios')
  const [manufacturer, setManufacturer] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  const [description, setDescription] = useState('')
  const [compatibilityInput, setCompatibilityInput] = useState('')

  // Load existing data if edit mode
  useEffect(() => {
    if (isEdit) {
      try {
        const saved = localStorage.getItem('custom-products')
        const list = saved ? JSON.parse(saved) : mockProducts
        const found = list.find((p: Product) => p.id === id)
        
        if (found) {
          setName(found.name)
          setCategory(found.category)
          setManufacturer(found.manufacturer)
          setPrice(String(found.price))
          setCostPrice(String(found.costPrice))
          setStock(String(found.stock))
          setMinStock(String(found.minStock))
          setStatus(found.status)
          setDescription(found.description)
          setCompatibilityInput(found.compatibility.join(', '))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }, [id, isEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !manufacturer || !price || !costPrice || !stock || !minStock) {
      alert('Favor preencher todos os campos obrigatórios.')
      return
    }

    // Convert compatibility input to string list
    const compatibility = compatibilityInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')

    try {
      const saved = localStorage.getItem('custom-products')
      const list: Product[] = saved ? JSON.parse(saved) : [...mockProducts]

      if (isEdit) {
        // Edit product
        const updated = list.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              name,
              category,
              manufacturer,
              price: parseFloat(price),
              costPrice: parseFloat(costPrice),
              stock: parseInt(stock, 10),
              minStock: parseInt(minStock, 10),
              status,
              description,
              compatibility
            }
          }
          return p
        })
        localStorage.setItem('custom-products', JSON.stringify(updated))
        alert('Produto atualizado com sucesso!')
      } else {
        // Create new product
        const newProduct: Product = {
          id: String(list.length + 1),
          code: `PEC-${String(list.length + 1).padStart(4, '0')}`,
          name,
          category,
          manufacturer,
          price: parseFloat(price),
          costPrice: parseFloat(costPrice),
          stock: parseInt(stock, 10),
          minStock: parseInt(minStock, 10),
          status,
          description,
          image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%236366f1" rx="12"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="4"/><path d="M30 50h40M50 30v40" stroke="white" stroke-width="4"/></svg>`, // Generic Indigo SVG
          compatibility
        }
        list.push(newProduct)
        localStorage.setItem('custom-products', JSON.stringify(list))
        alert('Novo produto cadastrado com sucesso!')
      }

      navigate('/admin/produtos')
    } catch (err) {
      console.error(err)
      alert('Falha ao gravar registro do produto.')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto w-full">
      <Link 
        to="/admin/produtos" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a Gestão
      </Link>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isEdit ? 'Editar Produto' : 'Cadastrar Produto'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isEdit ? 'Atualize as especificações técnicas da peça automotiva' : 'Cadastre uma nova peça com seus respectivos custos, preços e estoques de segurança'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-2">
        {/* Left Side: General Technical details */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-indigo-400" />
            Especificações Gerais
          </h3>

          <Input
            label="Nome da Peça *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Pastilha de Freio Cerâmica Traseira"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Freios', label: 'Freios' },
                { value: 'Filtros', label: 'Filtros' },
                { value: 'Ignição', label: 'Ignição' },
                { value: 'Suspensão', label: 'Suspensão' },
                { value: 'Iluminação', label: 'Iluminação' },
                { value: 'Correias', label: 'Correias' }
              ]}
            />
            <Input
              label="Fabricante *"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="Ex: Bosch"
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição do Produto</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all h-28 resize-none"
              placeholder="Descreva as aplicações, tecnologia e material da peça..."
            />
          </div>

          <Input
            label="Modelos Compatíveis (separados por vírgula)"
            value={compatibilityInput}
            onChange={(e) => setCompatibilityInput(e.target.value)}
            placeholder="Ex: Civic 2016-2021, Corolla 2018-2022"
          />
        </div>

        {/* Right Side: Financials, status and stock limits */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 justify-between h-full">
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850">
              Precificação e Estoque
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Preço de Custo (R$) *"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                required
              />
              <Input
                label="Preço de Venda (R$) *"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Qtd em Estoque *"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                type="number"
                required
              />
              <Input
                label="Estoque Mínimo (Alerta) *"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="0"
                type="number"
                required
              />
            </div>

            <Select
              label="Status do Item"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
              options={[
                { value: 'Ativo', label: 'Ativo (Disponível na Loja)' },
                { value: 'Inativo', label: 'Inativo (Oculto da Loja)' }
              ]}
            />
          </div>

          <div className="flex justify-end mt-8 border-t border-slate-850 pt-6">
            <Button type="submit" className="gap-2 px-8 py-3">
              <Save className="w-4 h-4" />
              Salvar Cadastro
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default ProductForm
