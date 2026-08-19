import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mockProducts } from '../../mock/mockData'
import { Card } from '../../components/Card'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Filter, RefreshCw } from 'lucide-react'

export const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedManufacturer, setSelectedManufacturer] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortOption, setSortOption] = useState('name-asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Sync state with URL search params on mount or param change
  useEffect(() => {
    const searchParam = searchParams.get('search') || ''
    const categoryParam = searchParams.get('category') || ''
    
    setSearch(searchParam)
    setSelectedCategory(categoryParam)
    setCurrentPage(1)
  }, [searchParams])

  // Extract unique categories and manufacturers for filter dropdowns
  const categories = useMemo(() => {
    return Array.from(new Set(mockProducts.map((p) => p.category)))
  }, [])

  const manufacturers = useMemo(() => {
    return Array.from(new Set(mockProducts.map((p) => p.manufacturer)))
  }, [])

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = mockProducts.filter((p) => p.status === 'Ativo')

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q)
      )
    }

    // Category
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory)
    }

    // Manufacturer
    if (selectedManufacturer) {
      result = result.filter((p) => p.manufacturer === selectedManufacturer)
    }

    // Max Price
    if (maxPrice) {
      const priceNum = parseFloat(maxPrice)
      if (!isNaN(priceNum)) {
        result = result.filter((p) => p.price <= priceNum)
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price
      if (sortOption === 'price-desc') return b.price - a.price
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name)
      // Default: name-asc
      return a.name.localeCompare(a.name)
    })

    return result
  }, [search, selectedCategory, selectedManufacturer, maxPrice, sortOption])

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredProducts, currentPage])

  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedManufacturer('')
    setMaxPrice('')
    setSortOption('name-asc')
    setSearchParams({})
  }

  const handleAddToCart = (productId: string) => {
    try {
      const savedCart = localStorage.getItem('cart')
      const cart = savedCart ? JSON.parse(savedCart) : []
      const existing = cart.find((item: any) => item.productId === productId)
      
      const product = mockProducts.find((p) => p.id === productId)
      if (!product) return

      if (existing) {
        existing.quantity += 1
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        })
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      alert('Produto adicionado ao carrinho!')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <Breadcrumb items={[{ label: 'Produtos' }]} />

      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Catálogo de Autopeças</h1>
          <p className="text-xs text-slate-500">Mostrando {filteredProducts.length} peças encontradas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-sm sticky top-24">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              Filtros
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Limpar
            </button>
          </div>

          {/* Search Input */}
          <Input
            label="Pesquisa Direta"
            placeholder="Nome ou código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />

          {/* Category Dropdown */}
          <Select
            label="Categoria"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: 'Todas as categorias' },
              ...categories.map((c) => ({ value: c, label: c }))
            ]}
          />

          {/* Manufacturer Dropdown */}
          <Select
            label="Fabricante"
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: 'Todos os fabricantes' },
              ...manufacturers.map((m) => ({ value: m, label: m }))
            ]}
          />

          {/* Max Price Range Input */}
          <Input
            label="Preço Máximo (R$)"
            placeholder="Ex: 300"
            type="number"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setCurrentPage(1)
            }}
          />
        </aside>

        {/* Catalog Main Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Sorting Bar */}
          <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Ordenando itens catalogados
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">Ordenar por:</span>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                options={[
                  { value: 'name-asc', label: 'Nome: A-Z' },
                  { value: 'name-desc', label: 'Nome: Z-A' },
                  { value: 'price-asc', label: 'Preço: Menor p/ Maior' },
                  { value: 'price-desc', label: 'Preço: Maior p/ Menor' }
                ]}
                className="py-1.5 px-3 min-w-[180px]"
              />
            </div>
          </div>

          {/* Grid Products */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <Card
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/10 border border-slate-900/60 rounded-2xl p-16 text-center">
              <span className="text-3xl block mb-4">🔍</span>
              <h3 className="text-base font-bold text-slate-200 mb-1">Nenhum produto encontrado</h3>
              <p className="text-xs text-slate-500">Tente ajustar seus termos de busca ou filtros.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center w-full mt-6 border-t border-slate-900 pt-6">
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
        </div>
      </div>
    </div>
  )
}
export default ProductList
