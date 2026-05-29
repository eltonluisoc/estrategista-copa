'use client';

import { useState, useEffect } from 'react';
import { Trophy, Target, Users, TrendingUp, Award, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Participante {
  id: string;
  nome: string;
  email: string;
  status: string;
  rodada_eliminacao?: number;
}

interface Estatisticas {
  total: number;
  ativos: number;
  eliminados: number;
}

export default function Home() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({ total: 0, ativos: 0, eliminados: 0 });
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mostrar, setMostrar] = useState<'ativos' | 'eliminados' | 'todos'>('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [participantesRes, statsRes, configRes] = await Promise.all([
        fetch('/api/participantes'),
        fetch('/api/estatisticas-publicas'),
        fetch('/api/configuracoes/inscricoes')
      ]);

      const participantesData = await participantesRes.json();
      const statsData = await statsRes.json();
      const configData = await configRes.json();

      const ordenados = participantesData.sort((a: Participante, b: Participante) => {
        if (a.status === 'ativo' && b.status !== 'ativo') return -1;
        if (a.status !== 'ativo' && b.status === 'ativo') return 1;
        return 0;
      });

      setParticipantes(ordenados);
      setEstatisticas({
        total: statsData.total || 0,
        ativos: statsData.ativos || 0,
        eliminados: statsData.eliminados || 0
      });
      setInscricoesAbertas(configData.inscricoes_abertas);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const participantesFiltrados = participantes.filter(p => {
    if (mostrar === 'ativos') return p.status === 'ativo';
    if (mostrar === 'eliminados') return p.status === 'eliminado';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tighter">
                Estrategista<span className="text-yellow-500"> da Copa</span>
              </h1>
            </div>
            <div className="flex gap-3">
              {inscricoesAbertas ? (
                <Link 
                  href="/cadastro" 
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 sm:px-6 rounded-lg transition shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  📝 Inscrever-se
                </Link>
              ) : (
                <button 
                  disabled 
                  className="bg-gray-600 cursor-not-allowed text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm sm:text-base"
                >
                  🔒 Inscrições Encerradas
                </button>
              )}
              <Link 
                href="/login" 
                className="border-2 border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 font-bold py-2 px-4 sm:px-6 rounded-lg transition text-sm sm:text-base"
              >
                🔑 Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-yellow-500 font-semibold tracking-wider text-xs sm:text-sm mb-1 uppercase">
            Copa do Mundo 2026
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
            Bolão <span className="text-yellow-500">Estrategista da Copa</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Escolha um time por rodada. Empatou ou perdeu? Está eliminado!
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-green-500/10 rounded-xl p-2 sm:p-4 text-center border border-green-500/30">
            <Users className="w-5 h-5 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-green-400">{estatisticas.total}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Total de Participantes</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-2 sm:p-4 text-center border border-blue-500/30">
            <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{estatisticas.ativos}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-2 sm:p-4 text-center border border-red-500/30">
            <XCircle className="w-5 h-5 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-red-400">{estatisticas.eliminados}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Eliminados</div>
          </div>
        </div>

        {/* Ranking dos Participantes */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-6 sm:mb-8 overflow-hidden">
          <div className="bg-yellow-600/20 px-4 sm:px-6 py-2 sm:py-3 border-b border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                Ranking dos Participantes
              </h2>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setMostrar('todos')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition ${
                    mostrar === 'todos' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setMostrar('ativos')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition ${
                    mostrar === 'ativos' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setMostrar('eliminados')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition ${
                    mostrar === 'eliminados' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Eliminados
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="space-y-1.5 sm:space-y-2">
              {participantesFiltrados.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum participante encontrado</p>
              ) : (
                participantesFiltrados.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center py-1.5 sm:py-2 border-b border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-500 text-xs sm:text-sm w-6 sm:w-8">{idx + 1}</span>
                      <span className="text-white text-sm sm:text-base">{p.nome}</span>
                    </div>
                    {p.status === 'ativo' ? (
                      <span className="text-green-400 text-xs sm:text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="text-red-400 text-xs sm:text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Eliminado
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Features (Regras) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <Target className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mb-2 sm:mb-4" />
            <h3 className="text-base sm:text-xl font-bold text-white mb-1">1 erro = eliminação</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Empate ou derrota e você está fora.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base sm:text-xl font-bold text-white mb-1">1 palpite por rodada</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Até 23h59 do dia anterior ao jogo.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mb-2 sm:mb-4" />
            <h3 className="text-base sm:text-xl font-bold text-white mb-1">Prêmio acumulado</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Quanto mais participantes, maior o prêmio!</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 sm:py-6 text-gray-500 text-[10px] sm:text-xs border-t border-white/10 mt-6 sm:mt-8">
          <p>Estrategista da Copa 2026</p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mt-1">
            <a href="https://wa.me/5561998507770" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition">
              📱 WhatsApp
            </a>
            <Link href="/como-funciona" className="hover:text-yellow-500 transition">
              Como funciona
            </Link>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 border-t border-white/5">
            <p>Desenvolvido por <span className="text-yellow-500">Elton Luis</span></p>
            <p className="mt-0.5">© {new Date().getFullYear()} - Todos os direitos reservados</p>
          </div>
        </footer>
      </div>
    </div>
  );
}