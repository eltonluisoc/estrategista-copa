'use client';

import { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, Users, TrendingUp, Award, CheckCircle, XCircle, History, EyeOff, Clock } from 'lucide-react';
import Link from 'next/link';

// VERSÃO MANUAL - ATUALIZAR A CADA DEPLOY
const APP_VERSION = 'v4';

interface Participante {
  id: string;
  nome: string;
  email: string;
  status: string;
  rodada_eliminacao?: number;
  rodada_atual?: number;
  acertos?: { rodada: number; time: string }[];
  palpite_atual?: string;
  palpite_atual_visivel?: boolean;
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
  const [modoTeste, setModoTeste] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mostrar, setMostrar] = useState<'ativos' | 'eliminados' | 'todos'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<Participante | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [participantesRes, statsRes, configRes, modoTesteRes] = await Promise.all([
        fetch('/api/participantes'),
        fetch('/api/estatisticas-publicas'),
        fetch('/api/configuracoes/inscricoes'),
        fetch('/api/configuracoes?chave=modo_teste')
      ]);

      const participantesData = await participantesRes.json();
      const statsData = await statsRes.json();
      const configData = await configRes.json();
      const modoTesteData = await modoTesteRes.json();

      setParticipantes(participantesData);
      setEstatisticas({
        total: statsData.total || 0,
        ativos: statsData.ativos || 0,
        eliminados: statsData.eliminados || 0
      });
      setInscricoesAbertas(configData.inscricoes_abertas);
      setModoTeste(modoTesteData.valor === 'true');
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

  const abrirHistorico = (participante: Participante) => {
    setParticipanteSelecionado(participante);
    setModalAberto(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      
      {/* Versão no topo */}
      <div className="bg-black/30 text-center py-1 text-[10px] text-gray-500">
        Versão: {APP_VERSION}
      </div>

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
        <div className="text-center mb-6">
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

        {/* Cards de Regras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-bold text-xs">1 erro</span>
            </div>
            <p className="text-gray-300 text-xs">Empate ou derrota = eliminação</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-bold text-xs">1 palpite</span>
            </div>
            <p className="text-gray-300 text-xs">Por rodada, até 23h59 do dia anterior</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-bold text-xs">Prêmio</span>
            </div>
            <p className="text-gray-300 text-xs">Quanto mais participants, maior o prêmio!</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-green-500/10 rounded-xl p-2 sm:p-4 text-center border border-green-500/30">
            <Users className="w-5 h-5 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-green-400">{estatisticas.total}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Total de Participantes</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-2 sm:p-4 text-center border border-blue-500/30">
            <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{estatisticas.ativos}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-2 sm:p-4 text-center border border-red-500/30">
            <Award className="w-5 h-5 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-red-400">{estatisticas.eliminados}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Eliminados</div>
          </div>
        </div>

        {/* Ranking dos Participantes */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-8 overflow-hidden">
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
            <div className="space-y-2">
              {participantesFiltrados.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum participante encontrado</p>
              ) : (
                participantesFiltrados.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`text-xs sm:text-sm w-6 sm:w-8 font-bold ${
                        idx === 0 ? 'text-yellow-400' :
                        idx === 1 ? 'text-gray-300' :
                        idx === 2 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>{idx + 1}</span>
                      <span className="text-white text-sm sm:text-base">{p.nome}</span>
                      <button
                        onClick={() => abrirHistorico(p)}
                        className="text-gray-500 hover:text-yellow-500 transition"
                        title="Ver histórico"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      {p.status === 'ativo' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-green-400 text-[10px] sm:text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Rodada {p.rodada_atual || 1}
                          </span>
                          
                          {p.palpite_atual && (
                            <div className="flex items-center justify-end gap-0.5 mt-0.5">
                              {(p.palpite_atual_visivel || modoTeste) ? (
                                <span className="text-yellow-400 text-[9px] sm:text-[10px] flex items-center gap-0.5">
                                  🎯 {p.palpite_atual}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-[9px] sm:text-[10px] flex items-center gap-0.5">
                                  <EyeOff className="w-2.5 h-2.5" /> Palpite oculto
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-400 text-[10px] sm:text-xs flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Eliminado (Rodada {p.rodada_eliminacao})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 sm:py-6 text-gray-500 text-[10px] sm:text-xs border-t border-white/10">
          <p>Estrategista da Copa 2026</p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mt-1">
            <a href="https://wa.me/5561998507770" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition">
              📱 Falar com Administrador
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

      {/* Modal de Histórico */}
      {modalAberto && participanteSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Histórico de {participanteSelecionado.nome}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {participanteSelecionado.acertos && participanteSelecionado.acertos.length > 0 ? (
                participanteSelecionado.acertos.map((acerto, idx) => (
                  <div key={idx} className="bg-black/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Rodada {acerto.rodada}</span>
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> {acerto.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-black/50 rounded-lg p-3 text-center text-gray-400">
                  Nenhum acerto registrado ainda
                </div>
              )}
              {participanteSelecionado.palpite_atual && (
                <div className="bg-yellow-500/10 rounded-lg p-3 flex justify-between items-center border border-yellow-500/30">
                  <span className="text-gray-300 text-sm">Rodada {participanteSelecionado.rodada_atual} (Atual)</span>
                  <span className="text-yellow-400 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {participanteSelecionado.palpite_atual}
                  </span>
                </div>
              )}
              {participanteSelecionado.status === 'eliminado' && (
                <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/30">
                  <span className="text-red-400 text-sm flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" /> Eliminado na Rodada {participanteSelecionado.rodada_eliminacao}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}