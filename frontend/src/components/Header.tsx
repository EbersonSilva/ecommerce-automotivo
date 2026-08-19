import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Search, Shield, Package } from 'lucide-react'

export const Header: React.FC = () => {
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Function to load cart count from localStorage
  const updateCartCount = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartItems = JSON.parse(savedCart)
        const totalItems = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0)
        setCartCount(totalItems)
      } else {
        setCartCount(0)
      }
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => {
    updateCartCount()
    // Listen for custom event 'cart-updated' to keep count in sync
    window.addEventListener('cart-updated', updateCartCount)
    return () => {
      window.removeEventListener('cart-updated', updateCartCount)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Logo and Lab Badge */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              AutoPeças.net
            </span>
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              PROTÓTIPO
            </span>
          </Link>
          <Link 
            to="/admin" 
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-550/20 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar pastilhas, filtros, amortecedores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-all"
          />
          <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <Link to="/produtos" className="text-sm font-medium text-slate-300 hover:text-white transition-colors mr-2">
            Catálogo
          </Link>

          <Link to="/pedidos" className="text-slate-400 hover:text-slate-200 transition-colors relative p-1.5" title="Meus Pedidos">
            <Package className="w-5 h-5" />
          </Link>

          <Link to="/minha-conta" className="text-slate-400 hover:text-slate-200 transition-colors relative p-1.5" title="Minha Conta">
            <User className="w-5 h-5" />
          </Link>

          <Link to="/carrinho" className="text-slate-400 hover:text-slate-200 transition-colors relative p-1.5" title="Carrinho">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
                {cartCount}
              </span>
            )}
          </Link>

          <Link 
            to="/admin" 
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Painel Admin
          </Link>
        </div>
      </div>
    </header>
  )
}
export default Header
