import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductById, createProduct, updateProduct, uploadProductImage } from '../../services/productService'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Save, ShoppingBag, Image as ImageIcon, Upload } from 'lucide-react'


export const ProductForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  // Form Fields State
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Freios')
  const [manufacturer, setManufacturer] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [description, setDescription] = useState('')
  const [compatibilityInput, setCompatibilityInput] = useState('')

  // Imagem State - Armazenamento de Caminho no Banco
  const [image, setImage] = useState('/products/pastilha-freio.webp')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('/products/pastilha-freio.webp')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Carrega dados se for modo de edição (RF0014)
  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      getProductById(id)
        .then((found) => {
          if (found) {
            setCode(found.code)
            setName(found.name)
            setCategory(found.category)
            setManufacturer(found.manufacturer)
            setPrice(String(found.price))
            setCostPrice(String(found.costPrice || '0'))
            setStock(String(found.stock))
            setMinStock(String(found.minStock))
            setDescription(found.description || '')
            setCompatibilityInput(Array.isArray(found.compatibility) ? found.compatibility.join(', ') : '')

            const currentImg = found.image || '/products/pastilha-freio.webp'
            setImage(currentImg)
            setPreviewUrl(currentImg)
          }
        })
        .catch((err) => {
          console.error(err)
          alert('Não foi possível carregar os dados da peça para edição.')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // Sugere um código SKU único para novos cadastros
      setCode(`PEC-${Math.floor(1000 + Math.random() * 9000)}`)
    }
  }, [id, isEdit])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || !name || !manufacturer || !price || !costPrice || !stock || !minStock) {
      alert('Favor preencher todos os campos obrigatórios.')
      return
    }

    const numPrice = parseFloat(price)
    const numCostPrice = parseFloat(costPrice)

    // RN0012: Preço de venda deve ser maior ou igual ao custo
    if (numPrice < numCostPrice) {
      alert('Regra de Precificação (RN0012): O preço de venda não pode ser inferior ao preço de custo.')
      return
    }

    const compatibility = compatibilityInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')

    try {
      setSubmitting(true)

      let finalImagePath = image

      // Se o usuário selecionou um arquivo local no computador, faz o upload físico
      if (imageFile) {
        finalImagePath = await uploadProductImage(imageFile)
      }

      const payload = {
        code,
        name,
        category,
        manufacturer,
        price: numPrice,
        costPrice: numCostPrice,
        stock: parseInt(stock, 10),
        minStock: parseInt(minStock, 10),
        description,
        compatibility,
        image: finalImagePath // Salva apenas o caminho relativo no banco (ex: /products/17290...-nome.png)
      }

      if (isEdit) {
        await updateProduct(id, payload)
        alert('Peça atualizada com sucesso no PostgreSQL!')
      } else {
        await createProduct(payload)
        alert('Nova peça cadastrada com sucesso no PostgreSQL!')
      }
      navigate('/admin/produtos')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Falha ao salvar produto no banco.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Carregando dados da peça...</div>
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
          {isEdit ? 'Editar Peça Automotiva' : 'Cadastrar Peça Automotiva'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {isEdit 
            ? 'Atualize as especificações técnicas, imagem, preços e modelos compatíveis (PostgreSQL)' 
            : 'Cadastre um novo componente com imagem, precificação e estoque de segurança (PostgreSQL)'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-2">
        {/* Left Side: General Technical details */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-indigo-400" />
            Especificações Gerais
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código SKU / Part Number *"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: PEC-1020"
              disabled={isEdit}
              required
            />
            <Input
              label="Fabricante / Marca *"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="Ex: Cobreq, Bosch, Monroe"
              required
            />
          </div>

          <Input
            label="Nome da Peça *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Pastilha de Freio Cerâmica Traseira"
            required
          />

          <Select
            label="Categoria / Sistema Automotivo"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Freios', label: 'Freios' },
              { value: 'Filtros', label: 'Filtros' },
              { value: 'Ignição', label: 'Ignição' },
              { value: 'Suspensão', label: 'Suspensão' },
              { value: 'Iluminação', label: 'Iluminação' },
              { value: 'Correias', label: 'Correias' },
              { value: 'Motor', label: 'Motor' }
            ]}
          />

          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição Técnica</label>
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

        {/* Right Side: Image Upload & Financials */}
        <div className="flex flex-col gap-8">
          {/* Card: Upload de Imagem (Apenas o caminho é salvo no banco) */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-400" />
                Imagem da Peça
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-center">
              {/* Visual Preview */}
              <div className="w-28 h-28 flex-shrink-0 bg-slate-950/80 border-2 border-dashed border-slate-800 rounded-2xl p-2 flex items-center justify-center relative overflow-hidden group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview da peça"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-col gap-2.5 flex-1 w-full text-left">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Upload de Arquivo (JPG, PNG, WEBP)
                </label>
                <input
                  type="file"
                  id="product-image-file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="product-image-file"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold cursor-pointer transition-all hover:border-indigo-500/50 hover:text-white"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  {imageFile ? `Arquivo: ${imageFile.name.slice(0, 18)}...` : 'Subir Imagem do Computador'}
                </label>

                
              </div>
            </div>
          </div>

          {/* Card: Precificação e Estoque */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl flex flex-col gap-6 justify-between">
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

              {/* Indicador de Margem Projetada */}
              {parseFloat(price) > 0 && parseFloat(costPrice) > 0 && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs flex justify-between items-center text-indigo-300">
                  <span>Margem de Lucro Bruta:</span>
                  <strong className="font-mono text-sm text-emerald-400">
                    +R$ {(parseFloat(price) - parseFloat(costPrice)).toFixed(2)} ({(((parseFloat(price) - parseFloat(costPrice)) / parseFloat(costPrice)) * 100).toFixed(1)}%)
                  </strong>
                </div>
              )}

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
            </div>

            <div className="flex justify-end mt-8 border-t border-slate-850 pt-6">
              <Button type="submit" disabled={submitting} className="gap-2 px-8 py-3">
                <Save className="w-4 h-4" />
                {submitting ? 'Salvando...' : 'Salvar no PostgreSQL'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
export default ProductForm
