'use client';

import { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, Users, TrendingUp, Award, CheckCircle, XCircle, History, EyeOff, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { GlobalHeader } from '@/components/GlobalHeader';

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
  posicao?: number;
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
  const [modalAberto, setModalAberto] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<Participante | null>(null);
  const [modoTeste, setModoTeste] = useState(false);

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

      setParticipantes(Array.isArray(participantesData) ? participantesData : (participantesData.ranking || []));
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

  const getPosicaoClass = (posicao: number) => {
    if (posicao === 1) return 'text-yellow-400';
    if (posicao === 2) return 'text-gray-300';
    if (posicao === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  // ========== DETECTAR CAMPEÕES (VERSÃO CORRIGIDA) ==========
  // Encontrar a maior rodada alcançada por qualquer participante
  const maiorRodadaGeral = participantes.reduce((max, p) => {
    // Usar rodada_eliminacao se existir, senão rodada_atual
    const rodada = p.rodada_eliminacao || p.rodada_atual || 1;
    return Math.max(max, rodada);
  }, 1);

  // Verificar se a competição acabou (não há mais participantes ativos)
  const competicaoTerminou = participantes.filter(p => p.status === 'ativo').length === 0;

  // Encontrar os participantes que chegaram à maior rodada
  const participantesNaMaiorRodada = participantes.filter(p => {
    const rodada = p.rodada_eliminacao || p.rodada_atual || 1;
    return rodada === maiorRodadaGeral;
  });

  // Encontrar a maior pontuação entre eles
  const maxPontos = competicaoTerminou && participantesNaMaiorRodada.length > 0
    ? Math.max(...participantesNaMaiorRodada.map(p => p.pontos || 0))
    : 0;

  // Campeões = participantes que chegaram à maior rodada E têm a maior pontuação
  const campeoes = competicaoTerminou && maxPontos > 0
    ? participantesNaMaiorRodada.filter(p => (p.pontos || 0) === maxPontos)
    : [];

  // Calcular a maior rodada entre os ativos (para destaque)
  const maiorRodada = participantes
    .filter(p => p.status === 'ativo')
    .reduce((max, p) => Math.max(max, p.rodada_atual || 1), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        
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
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all group">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition" />
              <span className="text-yellow-500 font-bold text-xs">FASE DE GRUPOS</span>
            </div>
            <p className="text-gray-300 text-xs">Empate ou derrota = ELIMINAÇÃO</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all group">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition" />
              <span className="text-yellow-500 font-bold text-xs">1 PALPITE</span>
            </div>
            <p className="text-gray-300 text-xs">Por rodada, até 23h59 do dia anterior</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all group">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition" />
              <span className="text-yellow-500 font-bold text-xs">FASES FINAIS</span>
            </div>
            <p className="text-gray-300 text-xs">Vale o resultado final (incluindo prorrogação e pênaltis)</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-yellow-500/30 hover:border-yellow-500/50 transition-all group">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition" />
              <span className="text-yellow-500 font-bold text-xs">NÃO REPETIR</span>
            </div>
            <p className="text-gray-300 text-xs">Cada time só pode ser usado uma vez</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-xl p-2 sm:p-4 text-center border border-green-500/30">
            <Users className="w-5 h-5 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-green-400">{estatisticas.total}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Total de Participantes</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-xl p-2 sm:p-4 text-center border border-blue-500/30">
            <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{estatisticas.ativos}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-xl p-2 sm:p-4 text-center border border-red-500/30">
            <Award className="w-5 h-5 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1" />
            <div className="text-lg sm:text-2xl font-bold text-red-400">{estatisticas.eliminados}</div>
            <div className="text-gray-400 text-[10px] sm:text-sm">Participantes Eliminados</div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <a
            href="https://chat.whatsapp.com/EIfDnDerrlG5bChfSY2wDK"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-6 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>
            📱 Entrar no Grupo do WhatsApp
          </a>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 mb-8 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 animate-pulse" />
                Ranking dos Participantes
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 animate-pulse" />
              </h2>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setMostrar('todos')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 ${
                    mostrar === 'todos' 
                      ? 'bg-yellow-600 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setMostrar('ativos')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 ${
                    mostrar === 'ativos' 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setMostrar('eliminados')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 ${
                    mostrar === 'eliminados' 
                      ? 'bg-red-600 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
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
                participantesFiltrados.map((p, idx) => {
                  const posicao = p.posicao || (idx + 1);
                  const rodadaAtual = p.status === 'ativo' ? (p.rodada_atual || 1) : (p.rodada_eliminacao || '?');
                  const posicaoClass = getPosicaoClass(posicao);
                  
                  const isDestaque = p.status === 'ativo' && (p.rodada_atual || 1) === maiorRodada && maiorRodada > 1;
                  const isCampeao = campeoes.some(c => c.id === p.id);
                  
                  const temPalpite = p.palpite_atual && (modoTeste || p.palpite_atual_visivel);
                  const palpiteOculto = p.palpite_atual && !modoTeste && !p.palpite_atual_visivel;
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`group flex flex-wrap justify-between items-center py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-lg transition-all duration-200 hover:translate-x-1 ${
                        isDestaque ? 'rodada-destaque' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className={`text-xs sm:text-sm w-6 sm:w-8 font-bold ${posicaoClass} transition-all duration-200 group-hover:scale-110`}>
                          {posicao}.
                        </span>
                        <span className={`text-sm sm:text-base font-medium transition-colors duration-200 ${
                          isDestaque ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {p.nome}
                          {isCampeao && (
                            <span className="ml-2 text-yellow-500 animate-pulse" title="🏆 Campeão!">
                              🏆
                            </span>
                          )}
                        </span>
                        
                        {temPalpite && (
                          <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-yellow-300 overflow-hidden border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-yellow-400/10 to-yellow-600/20"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-pulse"></div>
                            <span className="relative z-10 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                              🎯 {p.palpite_atual}
                            </span>
                          </div>
                        )}
                        
                        {palpiteOculto && (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gray-500/15 to-gray-600/10 px-2.5 py-1 rounded-full text-xs font-medium text-gray-400 border border-gray-500/30 shadow-sm">
                            <EyeOff className="w-3 h-3" /> Oculto
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 group-hover:scale-105 ${
                          isDestaque 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                            : p.status === 'eliminado'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-green-500/15 text-green-400 border border-green-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            isDestaque ? 'bg-yellow-400' : p.status === 'eliminado' ? 'bg-red-400' : 'bg-green-400'
                          }`}></span>
                          {isCampeao ? '🏆 CAMPEÃO' : p.status === 'eliminado' ? `Eliminado (Rodada ${rodadaAtual})` : `Rodada ${rodadaAtual}`}
                        </span>
                        
                        <button
                          onClick={() => abrirHistorico(p)}
                          className="text-gray-500 hover:text-yellow-500 transition-all duration-200 hover:scale-110"
                          title="Ver histórico"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} Estrategista da Copa - Todos os direitos reservados</p>
        </div>
      </div>

      {modalAberto && participanteSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Histórico de {participanteSelecionado.nome}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {participanteSelecionado.acertos && participanteSelecionado.acertos.length > 0 ? (
                participanteSelecionado.acertos.map((acerto, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-3 flex justify-between items-center border border-green-500/20">
                    <span className="text-gray-300 text-sm">Rodada {acerto.rodada}</span>
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> {acerto.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-black/30 rounded-lg p-3 text-center text-gray-400">
                  Nenhum acerto registrado ainda
                </div>
              )}
              {participanteSelecionado.palpite_atual && (modoTeste || participanteSelecionado.palpite_atual_visivel) && (
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