import React from 'react'
import { Link } from 'react-router-dom'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* About Section */}
        <div className="flex flex-col gap-3 text-left">
          <span className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AutoPeças.net
          </span>
          <p className="leading-relaxed text-slate-500">
            Protótipo de e-commerce de peças automotivas desenvolvido para a disciplina de Laboratório de Engenharia de Software.
          </p>
        </div>

        {/* Links: Catalog */}
        <div className="flex flex-col gap-2.5 text-left">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1.5">Catálogo</h4>
          <Link to="/produtos" className="hover:text-white transition-colors">Todas as Peças</Link>
          <Link to="/produtos?category=Freios" className="hover:text-white transition-colors">Freios</Link>
          <Link to="/produtos?category=Filtros" className="hover:text-white transition-colors">Filtros</Link>
          <Link to="/produtos?category=Suspensão" className="hover:text-white transition-colors">Suspensão</Link>
        </div>

        {/* Links: Customer Area */}
        <div className="flex flex-col gap-2.5 text-left">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1.5">Área do Cliente</h4>
          <Link to="/minha-conta" className="hover:text-white transition-colors">Minha Conta</Link>
          <Link to="/pedidos" className="hover:text-white transition-colors">Meus Pedidos</Link>
          <Link to="/carrinho" className="hover:text-white transition-colors">Carrinho de Compras</Link>
        </div>

        {/* Links: Administration */}
        <div className="flex flex-col gap-2.5 text-left">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-1.5">Administração</h4>
          <Link to="/admin" className="hover:text-white transition-colors">Dashboard Admin</Link>
          <Link to="/admin/clientes" className="hover:text-white transition-colors">Gerenciar Clientes</Link>
          <Link to="/admin/produtos" className="hover:text-white transition-colors">Gerenciar Produtos</Link>
          <Link to="/admin/relatorios" className="hover:text-white transition-colors">Relatórios de Vendas</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
        <div>
          © {new Date().getFullYear()} - AutoPeças.net. Desenvolvido para fins acadêmicos.
        </div>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 cursor-pointer">Termos de Uso</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacidade</span>
        </div>
      </div>
    </footer>
  )
}
export default Footer
