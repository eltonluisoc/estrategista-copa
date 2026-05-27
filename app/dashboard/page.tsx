'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Calendar, CheckCircle, XCircle, AlertCircle, ChevronRight, Eye, Edit, Users, UserCheck, UserX } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  status: 'ativo' | 'eliminado';
  rodada_eliminacao?: number;
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
}

interface Estatisticas {
  total: number;
  ativos: number;
  eliminados: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState<Time[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({ total: 0, ativos: 0, eliminados: 0 });
  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [timeSelecionado, setTimeSelecionado] = useState('');
  const [palpiteEnviando, setPalpiteEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.id) {
      carregarDados();
      carregarEstatisticas();
    }
  }, [status, session]);

  const carregarEstatisticas = async () => {
    try {
      const res = await fetch('/api/usuarios/estatisticas');
      const data = await res.json();
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [timesRes, palpitesRes] = await Promise.all([
        fetch('/api/times'),
        fetch(`/api/palpites?usuarioId=${session?.user?.id}`)
      ]);
      
      const timesData = await timesRes.json();
      const palpitesData = await palpitesRes.json();
      
      setTimes(timesData);
      setPalpites(palpitesData);
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }

  const timesJaUsados = palpites.map(p => p.time_id);
  const timesDisponiveis = times.filter(t => !timesJaUsados.includes(t.id));
  const jaPalpitouRodada = palpites.some(p => p.rodada === rodadaAtual);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              Estrategista<span className="text-yellow-500"> da Copa</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/rodada')}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg transition"
            >
              <Eye className="w-4 h-4" />
              Ver Rodada Atual
            </button>
            <button
              onClick={() => router.push('/classificacao')}
              className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-2 rounded-lg transition"
            >
              <Trophy className="w-4 h-4" />
              Classificação
            </button>
            <span className="text-gray-300 hidden md:inline">
              Olá, <span className="text-yellow-500 font-semibold">{usuario?.nome || session?.user?.name}</span>
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 text-center">
            <Users className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-400">{estatisticas.total}</div>
            <div className="text-gray-400 text-sm">Total de Participantes</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 text-center">
            <UserCheck className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-400">{estatisticas.ativos}</div>
            <div className="text-gray-400 text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 text-center">
            <UserX className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400">{estatisticas.eliminados}</div>
            <div className="text-gray-400 text-sm">Participantes Eliminados</div>
          </div>
        </div>

        {/* Status do participante */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Seu status</h2>
              <p className="text-gray-400 text-sm">Você está competindo pelo prêmio!</p>
            </div>
            <div className="flex items-center gap-2">
              {usuario?.status === 'ativo' ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">ATIVO</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-semibold">ELIMINADO</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Área de palpite */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Palpite da Rodada {rodadaAtual}</h3>
            
            {usuario?.status === 'eliminado' ? (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-400">Você foi eliminado!</p>
                <p className="text-gray-500 text-sm mt-2">Na próxima Copa tem mais.</p>
              </div>
            ) : jaPalpitouRodada ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-300">Palpite já registrado para esta rodada!</p>
                <p className="text-gray-500 text-sm mt-2">Você pode alterá-lo até o prazo final.</p>
              </div>
            ) : (
              <form onSubmit={handlePalpite} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Escolha um time para vencer:
                  </label>
                  <select
                    value={timeSelecionado}
                    onChange={(e) => setTimeSelecionado(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="">Selecione um time</option>
                    {timesDisponiveis.map(time => (
                      <option key={time.id} value={time.id}>
                        {time.nome} (Grupo {time.grupo})
                      </option>
                    ))}
                  </select>
                </div>

                {mensagem && (
                  <div className={`p-3 rounded-lg ${
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
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {palpiteEnviando ? 'Registrando...' : 'Confirmar palpite'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Histórico de palpites com botão de editar */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Seus palpites</h3>
            {palpites.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400">Nenhum palpite ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {palpites.map(palpite => {
                  const time = times.find(t => t.id === palpite.time_id);
                  return (
                    <div key={palpite.id} className="flex justify-between items-center border-b border-white/10 py-2">
                      <span className="text-gray-300">Rodada {palpite.rodada}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500 font-semibold">{time?.nome || 'Time'}</span>
                        <button
                          onClick={() => deletarPalpite(palpite.id, palpite.rodada)}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="Alterar palpite (apenas antes do prazo)"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Times disponíveis */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Times disponíveis ({timesDisponiveis.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timesDisponiveis.slice(0, 20).map(time => (
              <div key={time.id} className="text-gray-400 text-sm">
                {time.nome} ({time.grupo})
              </div>
            ))}
            {timesDisponiveis.length > 20 && (
              <div className="text-gray-500 text-sm">+ {timesDisponiveis.length - 20} times</div>
            )}
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-gray-500 text-sm border-t border-white/10">
        <p>Estrategista da Copa 2026 | O bolão mais estratégico da Copa do Mundo</p>
        <div className="mt-2">
          <p>Desenvolvido por <span className="text-yellow-500">Elton Luis</span></p>
          <p className="text-xs mt-1">© {new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}