import React from 'react'
import { Link } from 'react-router-dom'
import { mockProducts } from '../../mock/mockData'
import { Card } from '../../components/Card'
import { Wrench, Disc, Settings, AlertTriangle, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react'

export const Home: React.FC = () => {
  const heroImages = [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
  ]
  const [heroImage] = React.useState(() => heroImages[Math.floor(Math.random() * heroImages.length)])

  // Mock adding to cart with a simple local storage push
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

  // Get active products for display
  const activeProducts = mockProducts.filter((p) => p.status === 'Ativo')
  const featuredProducts = activeProducts.slice(0, 4)
  const bestSellers = activeProducts.slice(2, 6)

  // Define as categorias de produtos com ícones e cores
  const categories = [
    { name: 'Freios', icon: Disc, count: 2, color: 'from-blue-500 to-cyan-500' },
    { name: 'Filtros', icon: Settings, count: 2, color: 'from-emerald-500 to-teal-500' },
    { name: 'Ignição', icon: Wrench, count: 1, color: 'from-purple-500 to-pink-500' },
    { name: 'Suspensão', icon: AlertTriangle, count: 1, color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="flex flex-col gap-16">
      {/* Banner  */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-transparent pointer-events-none" />
        {/* */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
        
        <div className="flex-1 text-left relative z-10">
          {/* <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 mb-6">
            Especialistas em Performance
          </span> */}
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Encontre a Peça Perfeita para o Seu Veículo
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
            Pastilhas de freio, filtros de óleo, amortecedores e muito mais. Peças de alta qualidade com garantia de fabricante e entrega expressa.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/produtos"
              className="px-6 py-3 rounded-xl b bg-indigo-500 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              Explorar Catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/produtos?category=Freios"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold text-sm transition-all"
            >
              Ver Linha de Freios
            </Link>
          </div>
        </div>

        {/* Hero Image Mock/Visual Graphic */}
        <div className="flex-1 max-w-sm w-full aspect-square bg-linear-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center items-center relative p-4 shadow-inner overflow-hidden">
          <img src={heroImage} alt="Peças automotivas" className="w-full h-full object-cover rounded-2xl" />
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-slate-950/70 backdrop-blur-sm border border-white/10 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Peças 100% Originais</h3>
            <p className="text-[11px] text-slate-300">Distribuidor Autorizado das Maiores Marcas</p>
          </div>
        </div>
      </section>

      {/* Store Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Truck, title: 'Entrega Expressa', desc: 'Envio no mesmo dia para toda a região metropolitana.' },
          { icon: ShieldCheck, title: 'Garantia Estendida', desc: 'Até 12 meses de garantia direta com a fabricante.' },
          { icon: RotateCcw, title: 'Devolução Facilitada', desc: 'Trocas e devoluções gerenciadas de forma simples no painel.' }
        ].map((feat, index) => {
          const Icon = feat.icon
          return (
            <div key={index} className="flex gap-4 p-6 bg-slate-900/40 border border-slate-900/80 rounded-2xl text-left items-start backdrop-blur-sm">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">{feat.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Categories Grid */}
      <section className="flex flex-col gap-6 text-left">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Comprar por Categoria</h2>
          <p className="text-xs text-slate-500">Navegue pelas principais peças e suprimentos mecânicos.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.name}
                to={`/produtos?category=${cat.name}`}
                className="group p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-900/80 hover:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 text-center hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className={`p-4 rounded-full bg-linear-to-tr ${cat.color} bg-opacity-20 flex items-center justify-center text-white shadow-md shadow-slate-950`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                    {cat.count} Itens
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Produtos em Destaque</h2>
            <p className="text-xs text-slate-500">O que há de melhor em tecnologia e segurança automotiva.</p>
          </div>
          <Link to="/produtos" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            Ver Todos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Card
              key={product.id}
              product={product}
              onAddToCart={() => handleAddToCart(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Banner Secundário (Promo) */}
      <section className="rounded-3xl bg-linear-to-r from-purple-900/40 via-pink-900/20 to-slate-950 border border-purple-500/20 p-8 md:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">Oferta da Semana</span>
          <h3 className="text-2xl font-bold text-white mt-1.5 mb-2">Manutenção Preventiva de Ignição</h3>
          <p className="text-xs text-slate-400 max-w-md">Ganhe 15% de desconto no par ou jogo completo de Velas Iridium e Cabos de Vela NGK.</p>
        </div>
        <Link
          to="/produtos?category=Ignição"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all whitespace-nowrap"
        >
          Aproveitar Oferta
        </Link>
      </section>

      {/* Best Sellers */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Mais Vendidos</h2>
            <p className="text-xs text-slate-500">As peças mais buscadas pelos mecânicos e motoristas.</p>
          </div>
          <Link to="/produtos" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            Ver Todos
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <Card
              key={product.id}
              product={product}
              onAddToCart={() => handleAddToCart(product.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
export default Home
