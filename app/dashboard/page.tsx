'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Calendar, CheckCircle, XCircle, AlertCircle, ChevronRight, Edit, Users, RefreshCw, TrendingUp, Award, Shield } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';

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
  vencedor_id?: number;
  gols_casa?: number;
  gols_fora?: number;
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
  const [modoTeste, setModoTeste] = useState(false);

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
      carregarModoTeste();
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

  const carregarModoTeste = async () => {
    try {
      const res = await fetch('/api/configuracoes?chave=modo_teste');
      const data = await res.json();
      setModoTeste(data.valor === 'true');
    } catch (error) {
      console.error('Erro ao carregar modo teste:', error);
    }
  };

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
      const rankingData = await rankingRes.json();
      
      setTimes(timesData);
      setPalpites(palpitesData);
      setJogos(jogosData);
      setRankingParticipantes(rankingData);
      
      const userRes = await fetch(`/api/usuarios/${session?.user?.id}`);
      const userData = await userRes.json();
      
      // Calcular rodada atual do usuário
      let rodadaUsuario = 1;
      const palpitesOrdenados = [...palpitesData].sort((a, b) => a.rodada - b.rodada);
      
      for (const palpite of palpitesOrdenados) {
        const jogo = jogosData.find((j: Jogo) => j.rodada === palpite.rodada);
        
        if (jogo && jogo.finalizado) {
          if (jogo.vencedor_id === palpite.time_id) {
            rodadaUsuario = palpite.rodada + 1;
          } else if (jogo.vencedor_id !== palpite.time_id) {
            setUsuario({ ...userData, status: 'eliminado', rodada_eliminacao: palpite.rodada, rodada_atual: palpite.rodada });
            setLoading(false);
            return;
          }
        } else {
          rodadaUsuario = palpite.rodada;
          break;
        }
      }
      
      if (palpitesData.length === 0) {
        rodadaUsuario = 1;
      }
      
      // Determinar rodada atual baseada nos jogos disponíveis com prazo válido
      const agora = new Date();
      const jogosComPrazoValido = jogosData.filter((j: Jogo) => {
        const prazo = new Date(j.prazo);
        return !j.finalizado && prazo >= agora;
      });
      
      let rodadaDoSistema = rodadaUsuario;
      
      if (jogosComPrazoValido.length > 0) {
        const proximoJogoValido = jogosComPrazoValido.sort((a: Jogo, b: Jogo) => 
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
        )[0];
        rodadaDoSistema = proximoJogoValido.rodada;
      } else {
        // Se não há jogos com prazo válido, mostrar a próxima rodada mesmo sem prazo
        const todosJogosFuturos = jogosData.filter((j: Jogo) => new Date(j.data_hora) > agora && !j.finalizado);
        if (todosJogosFuturos.length > 0) {
          rodadaDoSistema = todosJogosFuturos[0].rodada;
        }
      }
      
      setRodadaAtual(rodadaDoSistema);
      setUsuario({ ...userData, rodada_atual: rodadaUsuario, status: userData.status || 'ativo' });
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

    if (jogoDoTime && new Date() > new Date(jogoDoTime.prazo) && !modoTeste) {
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
    if (prazoJogo && new Date() > new Date(prazoJogo) && !modoTeste) {
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
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Verificando acesso...</div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.email === 'admin@estrategista.com') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Carregando dados...</div>
        </div>
      </div>
    );
  }

  const timesJaUsados = palpites.map((p) => p.time_id);
  const timesUsadosList = times.filter((t) => timesJaUsados.includes(t.id));
  const timesDisponiveis = times.filter((t) => !timesJaUsados.includes(t.id));
  const jaPalpitouRodada = palpites.some((p) => p.rodada === rodadaAtual);
  
  // CORREÇÃO: Filtrar jogos da rodada que ainda estão dentro do prazo
  const agora = new Date();
  const jogosRodada = jogos.filter((j) => {
    const prazo = new Date(j.prazo);
    return j.rodada === rodadaAtual && !j.finalizado && (modoTeste || prazo >= agora);
  });
  
  const participantesAtivos = rankingParticipantes.filter((p) => p.status === 'ativo').length;
  const participantesEliminados = rankingParticipantes.filter((p) => p.status === 'eliminado').length;

  const rodadaExibicao = usuario?.status === 'ativo' 
    ? (usuario?.rodada_atual || rodadaAtual)
    : (usuario?.rodada_eliminacao || '?');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />

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
                  <span className="text-green-400 font-semibold text-sm">Rodada {rodadaExibicao}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-semibold text-sm">Eliminado na Rodada {rodadaExibicao}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* COLUNA ESQUERDA - Palpites */}
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
              ) : jogosRodada.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Nenhum jogo disponível para palpitar no momento.</p>
                  <p className="text-gray-500 text-xs mt-1">Os jogos ficam disponíveis até 23h59 do dia anterior à partida.</p>
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
                    const jogo = jogos.find((j) => j.rodada === palpite.rodada);
                    let resultado = '';
                    if (jogo?.finalizado) {
                      if (jogo.vencedor_id === palpite.time_id) {
                        resultado = '✅ Acertou';
                      } else {
                        resultado = '❌ Errou';
                      }
                    } else {
                      resultado = '⏳ Aguardando';
                    }
                    return (
                      <div key={palpite.id} className="flex justify-between items-center border-b border-white/10 py-2">
                        <div>
                          <span className="text-gray-300 text-sm">Rodada {palpite.rodada}</span>
                          <span className="text-gray-500 text-xs ml-2">({resultado})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 font-semibold text-sm">{time?.nome || 'Time'}</span>
                          {!jogo?.finalizado && (
                            <button
                              onClick={() => deletarPalpite(palpite.id, palpite.rodada)}
                              className="text-blue-400 hover:text-blue-300 transition"
                              title="Alterar palpite"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Times já usados */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
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
          </div>

          {/* COLUNA DIREITA - Apenas Jogos da Rodada */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                Jogos da Rodada {rodadaAtual}
              </h3>
              {jogosRodada.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">Nenhum jogo disponível no momento.</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Os jogos ficam disponíveis para palpite até 23h59 do dia anterior.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jogosRodada.map((jogo) => {
                    const prazo = new Date(jogo.prazo);
                    const prazoFormatado = prazo.toLocaleDateString('pt-BR') + ' ' + prazo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={jogo.id} className="bg-black/30 rounded-lg p-2.5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <span className="text-white text-sm font-medium">{jogo.time_casa} 🆚 {jogo.time_fora}</span>
                            <span className="text-gray-500 text-xs ml-2">({jogo.grupo})</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-gray-500 text-xs">
                              {new Date(jogo.data_hora).toLocaleDateString('pt-BR')} - {new Date(jogo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-yellow-600/70 text-[10px]">
                              ⏰ Prazo: {prazoFormatado}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aviso de segurança */}
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs">
                <Shield className="w-4 h-4" />
                <span>Prazo para palpitar: até 23h59 do dia anterior ao jogo. Após este horário, o palpite fica bloqueado.</span>
              </div>
            </div>
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