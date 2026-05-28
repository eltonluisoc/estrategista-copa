import { Trophy, Target, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black relative overflow-x-hidden">
      
      {/* Fundo estilo campo de futebol */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gramado base */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-green-950/20"></div>
        
        {/* Linha do meio de campo */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2"></div>
        
        {/* Círculo central */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border-2 border-white/10 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border border-white/5 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white/20 -translate-x-1/2 -translate-y-1/2"></div>

        {/* Áreas dos gols */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 border-2 border-white/5 rounded-b-3xl"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 border-2 border-white/5 rounded-t-3xl"></div>

        {/* Linhas laterais */}
        <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-white/5"></div>
        <div className="absolute right-[10%] top-0 bottom-0 w-[1px] bg-white/5"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-md border-b border-yellow-600/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              Estrategista<span className="text-yellow-500"> da Copa</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/participantes" className="text-gray-300 hover:text-yellow-500 transition">
              Participantes
            </Link>
            <a href="/login" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg">
              Entrar
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <p className="text-yellow-500 font-semibold tracking-wider text-sm mb-4 uppercase">
          Copa do Mundo 2026 • 🇺🇸🇨🇦🇲🇽
        </p>
        <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter">
          Sobreviva às <span className="text-yellow-500">8 rodadas</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
          Escolha um time por rodada. Empatou ou perdeu? Está eliminado.
        </p>
        <p className="text-md text-yellow-500/70 max-w-2xl mx-auto mb-8 italic">
          48 seleções. 8 rodadas. 1 estrategista.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/cadastro" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition shadow-lg hover:shadow-xl">
            Começar agora
          </a>
          <a href="/como-funciona" className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 font-bold py-3 px-8 rounded-lg text-lg transition">
            Como funciona
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all hover:-translate-y-1">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">1 erro = eliminação</h3>
            <p className="text-gray-400">Empate ou derrota e você está fora. Só a vitória mantém você vivo!</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all hover:-translate-y-1">
            <Target className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">1 palpite por rodada</h3>
            <p className="text-gray-400">Simples e direto. Escolha seu time até 23h59 do dia anterior.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all hover:-translate-y-1">
            <Users className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Prêmio acumulado</h3>
            <p className="text-gray-400">Quanto mais participantes, maior o prêmio! O valor é calculado automaticamente.</p>
          </div>
        </div>
      </section>

      {/* Bandeiras decorativas */}
      <div className="relative z-10 flex justify-center gap-4 py-8 opacity-40 flex-wrap">
        <span className="text-2xl">🇧🇷</span>
        <span className="text-2xl">🇦🇷</span>
        <span className="text-2xl">🇫🇷</span>
        <span className="text-2xl">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
        <span className="text-2xl">🇩🇪</span>
        <span className="text-2xl">🇵🇹</span>
        <span className="text-2xl">🇪🇸</span>
        <span className="text-2xl">🇮🇹</span>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-gray-500 text-sm border-t border-white/10">
        <p className="mb-2">Estrategista da Copa 2026 | O bolão mais estratégico da Copa do Mundo</p>
        <div className="flex justify-center gap-3 text-xs text-gray-600 flex-wrap">
          <a href="https://wa.me/5561998507770" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition">
            📱 Dúvidas? WhatsApp
          </a>
          <span>⚽ Brasil 2002</span>
          <span>🏆 Alemanha 2014</span>
          <span>🇫🇷 França 2018</span>
          <span>🇦🇷 Argentina 2022</span>
        </div>
        <div className="mt-4 pt-3 border-t border-white/5">
          <p>Desenvolvido por <span className="text-yellow-500 font-semibold">Elton Luis</span></p>
          <p className="text-xs text-gray-600 mt-1">© {new Date().getFullYear()} Estrategista da Copa - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}