'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Calendar, CheckCircle, XCircle, AlertCircle, ChevronRight, Edit, Users, UserCheck, UserX, RefreshCw, TrendingUp, Award, Shield } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  status: 'ativo' | 'eliminado';
  rodada_eliminacao?: number;
  rodada_atual?: number;
}

interface Time {
  id: number;
  nome: string;
  grupo: string;
}

interface Palpite {
  id: string;
  time_id: number;
  rodada: number;
  data_palpite: string;
}

interface Jogo {
  id: number;
  time_casa: string;
  time_fora: string;
  data_hora: string;
  grupo: string;
  finalizado: boolean;
  rodada: number;
  prazo: string;
}

interface ParticipanteRanking {
  id: string;
  nome: string;
  status: string;
  rodada_eliminacao?: number;
  rodada_atual?: number;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState<Time[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [rankingParticipantes, setRankingParticipantes] = useState<ParticipanteRanking[]>([]);
  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [timeSelecionado, setTimeSelecionado] = useState('');
  const [palpiteEnviando, setPalpiteEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const estaAprovado = session?.user?.aprovado === true;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (session?.user?.email === 'admin@estrategista.com') {
      router.replace('/admin');
      return;
    }
    if (status === 'authenticated' && session?.user?.id && session?.user?.email !== 'admin@estrategista.com') {
      carregarDados();
    }
  }, [status, session]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (session?.user?.id && session?.user?.email !== 'admin@estrategista.com' && !estaAprovado) {
        try {
          const res = await fetch('/api/usuarios/atualizar-sessao');
          const data = await res.json();
          if (data.aprovado === true) {
            await update();
            carregarDados();
            setMensagem({ tipo: 'sucesso', texto: '✅ Conta aprovada! Agora você pode fazer seus palpites.' });
          }
        } catch (error) {
          console.error('Erro ao verificar aprovação:', error);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [session, estaAprovado, update]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [timesRes, palpitesRes, jogosRes, rankingRes] = await Promise.all([
        fetch('/api/times'),
        fetch(`/api/palpites?usuarioId=${session?.user?.id}`),
        fetch('/api/jogos'),
        fetch('/api/participantes')
      ]);
      
      const timesData = await timesRes.json();
      const palpitesData = await palpitesRes.json();
      const jogosData = await jogosRes.json();
      let rankingData = await rankingRes.json();
      
      setTimes(timesData);
      setPalpites(palpitesData);
      setJogos(jogosData);
      
      // Calcular a rodada atual de cada participante
      const agora = new Date();
      const jogosFuturos = jogosData.filter((j: Jogo) => new Date(j.data_hora) > agora && !j.finalizado);
      let rodadaAtualCalculada = 1;
      if (jogosFuturos.length > 0) {
        const proximoJogo = jogosFuturos.sort((a: Jogo, b: Jogo) => 
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
        )[0];
        rodadaAtualCalculada = proximoJogo.rodada;
        setRodadaAtual(rodadaAtualCalculada);
      } else {
        const proximaRodada = jogosData.filter((j: Jogo) => !j.finalizado).sort((a: Jogo, b: Jogo) => a.rodada - b.rodada)[0];
        if (proximaRodada) {
          rodadaAtualCalculada = proximaRodada.rodada;
          setRodadaAtual(rodadaAtualCalculada);
        }
      }
      
      // Para cada participante, calcular em qual rodada ele está
      rankingData = rankingData.map((p: ParticipanteRanking) => {
        if (p.status === 'eliminado') return p;
        
        // Buscar o último palpite do participante
        const palpitesDoUsuario = palpitesData.filter((palpite: Palpite) => 
          palpite.usuario_id === p.id
        );
        
        if (palpitesDoUsuario.length === 0) {
          // Participante nunca palpitou - ainda está na rodada 1
          return { ...p, rodada_atual: 1 };
        }
        
        // Última rodada que ele palpitou
        const ultimaRodadaPalpite = Math.max(...palpitesDoUsuario.map((palpite: Palpite) => palpite.rodada));
        
        // Verificar se o palpite dele na última rodada foi válido (time venceu)
        // Por enquanto, se ele não foi eliminado, consideramos que está na próxima rodada
        return { ...p, rodada_atual: ultimaRodadaPalpite + 1 };
      });
      
      setRankingParticipantes(rankingData);
      
      const userRes = await fetch(`/api/usuarios/${session?.user?.id}`);
      const userData = await userRes.json();
      setUsuario(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePalpite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeSelecionado || !session?.user?.id) return;

    const timeSelecionadoNome = times.find(t => t.id === parseInt(timeSelecionado))?.nome;
    const jogoDoTime = jogos.find(j => 
      j.rodada === rodadaAtual && 
      (j.time_casa === timeSelecionadoNome || j.time_fora === timeSelecionadoNome)
    );
    
    if (jogoDoTime && jogoDoTime.finalizado) {
      setMensagem({ tipo: 'erro', texto: '❌ Este jogo já foi finalizado! Não é mais possível palpitar.' });
      return;
    }

    if (jogoDoTime && new Date() > new Date(jogoDoTime.prazo)) {
      setMensagem({ tipo: 'erro', texto: '⏰ Prazo para palpitar este jogo já encerrado!' });
      return;
    }

    setPalpiteEnviando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/palpites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: session.user.id,
          timeId: parseInt(timeSelecionado),
          rodada: rodadaAtual
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Palpite registrado com sucesso!' });
        setTimeSelecionado('');
        carregarDados();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao registrar palpite' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão' });
    }

    setPalpiteEnviando(false);
  };

  const deletarPalpite = async (palpiteId: string, rodada: number) => {
    const prazoJogo = jogos.find(j => j.rodada === rodada)?.prazo;
    if (prazoJogo && new Date() > new Date(prazoJogo)) {
      setMensagem({ tipo: 'erro', texto: '⏰ Prazo para alterar este palpite já encerrado!' });
      return;
    }

    if (!confirm(`Deseja alterar seu palpite da Rodada ${rodada}?`)) return;
    
    try {
      const res = await fetch(`/api/palpites/${palpiteId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: `Palpite da Rodada ${rodada} removido! Faça um novo.` });
        carregarDados();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao remover palpite' });
    }
  };

  const forcarRecarregamento = async () => {
    setMensagem(null);
    setLoading(true);
    try {
      const userRes = await fetch(`/api/usuarios/${session?.user?.id}`);
      const userData = await userRes.json();
      setUsuario(userData);
      
      const sessaoRes = await fetch('/api/usuarios/atualizar-sessao');
      const sessaoData = await sessaoRes.json();
      
      if (sessaoData.aprovado === true) {
        await update();
        setMensagem({ tipo: 'sucesso', texto: '✅ Conta aprovada! Agora você pode fazer seus palpites.' });
        carregarDados();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Sua conta ainda aguarda aprovação.' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao verificar aprovação' });
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Verificando acesso...</div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.email === 'admin@estrategista.com') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando dados...</div>
      </div>
    );
  }

  const timesJaUsados = palpites.map((p) => p.time_id);
  const timesUsadosList = times.filter((t) => timesJaUsados.includes(t.id));
  const timesDisponiveis = times.filter((t) => !timesJaUsados.includes(t.id));
  const jaPalpitouRodada = palpites.some((p) => p.rodada === rodadaAtual);
  const jogosRodada = jogos.filter((j) => j.rodada === rodadaAtual && !j.finalizado);
  
  const participantesAtivos = rankingParticipantes.filter((p) => p.status === 'ativo').length;
  const participantesEliminados = rankingParticipantes.filter((p) => p.status === 'eliminado').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tighter">
                Estrategista<span className="text-yellow-500"> da Copa</span>
              </h1>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={forcarRecarregamento}
                className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 px-3 py-1.5 rounded-lg text-sm transition"
              >
                <RefreshCw className="w-4 h-4 inline" /> Atualizar
              </button>
              <a
                href="https://wa.me/5561998507770?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20bolão%20Estrategista%20da%20Copa"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2"
              >
                <span>📱</span>
                Falar com Administrador
              </a>
              <button
                onClick={() => signOut()}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm transition"
              >
                <LogOut className="w-4 h-4 inline" /> Sair
              </button>
            </div>
          </div>
          <div className="text-center sm:text-right text-gray-300 text-sm mt-2">
            Olá, <span className="text-yellow-500 font-semibold">{usuario?.nome || session?.user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        
        {/* Cards de Estatísticas do Bolão */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/30">
            <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-green-400">{rankingParticipantes.length}</div>
            <div className="text-gray-400 text-xs">Total de Participantes</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-3 text-center border border-blue-500/30">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-blue-400">{participantesAtivos}</div>
            <div className="text-gray-400 text-xs">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/30">
            <Award className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-red-400">{participantesEliminados}</div>
            <div className="text-gray-400 text-xs">Participantes Eliminados</div>
          </div>
        </div>

        {/* Status do participante */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white mb-0.5">Sua situação</h2>
              <p className="text-gray-400 text-xs">Você está competindo pelo prêmio!</p>
            </div>
            <div className="flex items-center gap-2">
              {usuario?.status === 'ativo' ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">Rodada {rodadaAtual}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-semibold text-sm">Eliminado na Rodada {usuario?.rodada_eliminacao}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUNA ESQUERDA - Palpites + Ranking */}
          <div className="space-y-6">
            {/* Área de palpite */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Palpite da Rodada {rodadaAtual}</h3>
              
              {!estaAprovado ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-400 font-semibold text-sm">⏳ Inscrição pendente</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Seu cadastro aguarda aprovação do administrador.
                  </p>
                  <button
                    onClick={forcarRecarregamento}
                    className="mt-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm transition"
                  >
                    <RefreshCw className="w-3 h-3 inline" /> Verificar aprovação
                  </button>
                </div>
              ) : usuario?.status === 'eliminado' ? (
                <div className="text-center py-6">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-400">Você foi eliminado!</p>
                  <p className="text-gray-500 text-xs mt-1">Na próxima Copa tem mais.</p>
                </div>
              ) : jaPalpitouRodada ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Palpite já registrado para esta rodada!</p>
                  <p className="text-gray-500 text-xs mt-1">Você pode alterá-lo até o prazo final.</p>
                </div>
              ) : (
                <form onSubmit={handlePalpite} className="space-y-3">
                  <select
                    value={timeSelecionado}
                    onChange={(e) => setTimeSelecionado(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="">Selecione um time</option>
                    {timesDisponiveis.map((time) => (
                      <option key={time.id} value={time.id}>
                        {time.nome} (Grupo {time.grupo})
                      </option>
                    ))}
                  </select>

                  {mensagem && (
                    <div className={`p-2 rounded-lg text-xs ${
                      mensagem.tipo === 'sucesso' 
                        ? 'bg-green-500/20 border border-green-500 text-green-400'
                        : 'bg-red-500/20 border border-red-500 text-red-400'
                    }`}>
                      {mensagem.texto}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={palpiteEnviando || timesDisponiveis.length === 0}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
                  >
                    {palpiteEnviando ? 'Registrando...' : 'Confirmar palpite'}
                    <ChevronRight className="w-3 h-3 inline ml-1" />
                  </button>
                </form>
              )}
            </div>

            {/* Seus palpites */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">Seus palpites</h3>
              {palpites.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-10 h-10 text-yellow-500 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400 text-sm">Nenhum palpite ainda</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {palpites.map((palpite) => {
                    const time = times.find((t) => t.id === palpite.time_id);
                    return (
                      <div key={palpite.id} className="flex justify-between items-center border-b border-white/10 py-2">
                        <span className="text-gray-300 text-sm">Rodada {palpite.rodada}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 font-semibold text-sm">{time?.nome || 'Time'}</span>
                          <button
                            onClick={() => deletarPalpite(palpite.id, palpite.rodada)}
                            className="text-blue-400 hover:text-blue-300 transition"
                            title="Alterar palpite"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ranking dos Participantes */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Ranking dos Participantes
              </h3>
              <div className="space-y-2">
                {rankingParticipantes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhum participante encontrado</p>
                ) : (
                  rankingParticipantes.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{p.nome}</div>
                          <div className="text-gray-500 text-xs">
                            {p.status === 'ativo' ? (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Rodada {p.rodada_atual || 1}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Eliminado (Rodada {p.rodada_eliminacao})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {p.status === 'ativo' ? (
                          <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                            🟢 Rodada {p.rodada_atual || 1}
                          </span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full font-medium">
                            🔴 Eliminado
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - Jogos da Rodada */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                Jogos da Rodada {rodadaAtual}
              </h3>
              {jogosRodada.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">Nenhum jogo disponível para esta rodada.</p>
              ) : (
                <div className="space-y-2">
                  {jogosRodada.map((jogo) => (
                    <div key={jogo.id} className="bg-black/30 rounded-lg p-2.5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="text-white text-sm font-medium">{jogo.time_casa} 🆚 {jogo.time_fora}</span>
                          <span className="text-gray-500 text-xs ml-2">({jogo.grupo})</span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {new Date(jogo.data_hora).toLocaleDateString('pt-BR')} - {new Date(jogo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Times já usados */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            Times que você já usou ({timesUsadosList.length})
          </h3>
          {timesUsadosList.length === 0 ? (
            <p className="text-gray-400 text-center py-3 text-sm">Você ainda não usou nenhum time.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {timesUsadosList.map((time) => (
                <div key={time.id} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-red-500/30 transition-all">
                  <div className="text-white text-sm font-medium">{time.nome}</div>
                  <div className="text-gray-500 text-xs">Grupo {time.grupo}</div>
                  <div className="text-red-400 text-xs mt-1 flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Usado
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aviso de segurança */}
        <div className="mt-6 bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/30">
          <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Prazo para palpitar: até 23h59 do dia anterior ao jogo. Após este horário, o palpite fica bloqueado.</span>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-500 text-xs border-t border-white/10 mt-6">
        <p>Estrategista da Copa 2026 | O bolão mais estratégico da Copa do Mundo</p>
        <div className="mt-1">
          <p>Desenvolvido por <span className="text-yellow-500">Elton Luis</span></p>
          <p className="text-xs mt-0.5">© {new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}