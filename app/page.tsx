'use client';

import { useState, useEffect } from 'react';
import { Trophy, Target, Users, Calendar, Eye, TrendingUp, Award, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Participante {
  id: string;
  nome: string;
  email: string;
  status: string;
  rodada_eliminacao?: number;
  palpites_acertados?: number;
}

interface Jogo {
  id: number;
  time_casa: string;
  time_fora: string;
  data_hora: string;
  grupo: string;
  finalizado: boolean;
  rodada: number;
}

interface EstatisticasGerais {
  totalParticipantes: number;
  ativos: number;
  eliminados: number;
}

export default function Home() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [proximosJogos, setProximosJogos] = useState<Jogo[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais>({ totalParticipantes: 0, ativos: 0, eliminados: 0 });
  const [loading, setLoading] = useState(true);
  const [mostrar, setMostrar] = useState<'ativos' | 'eliminados' | 'todos'>('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [participantesRes, jogosRes, statsRes] = await Promise.all([
        fetch('/api/participantes'),
        fetch('/api/jogos'),
        fetch('/api/estatisticas-publicas')
      ]);

      const participantesData = await participantesRes.json();
      const jogosData = await jogosRes.json();
      const statsData = await statsRes.json();

      // Ordenar: ativos primeiro, depois eliminados
      const ordenados = participantesData.sort((a: Participante, b: Participante) => {
        if (a.status === 'ativo' && b.status !== 'ativo') return -1;
        if (a.status !== 'ativo' && b.status === 'ativo') return 1;
        return 0;
      });

      setParticipantes(ordenados);
      setEstatisticas(statsData);

      // Filtrar próximos jogos (não finalizados e futuros)
      const agora = new Date();
      const futuros = jogosData.filter((j: Jogo) => 
        !j.finalizado && new Date(j.data_hora) > agora
      ).sort((a: Jogo, b: Jogo) => 
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      ).slice(0, 6);
      
      setProximosJogos(futuros);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black relative overflow-x-hidden">
      
      {/* Fundo estilo campo de futebol */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-green-950/20"></div>
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border-2 border-white/10 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border border-white/5 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-md border-b border-yellow-600/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-white tracking-tighter">
                Estrategista<span className="text-yellow-500"> da Copa</span>
              </h1>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-10">
          <p className="text-yellow-500 font-semibold tracking-wider text-sm mb-2 uppercase">
            Copa do Mundo 2026 • 🇺🇸🇨🇦🇲🇽
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Bolão <span className="text-yellow-500">Estrategista da Copa</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-6">
            Escolha um time por rodada. Empatou ou perdeu? Está eliminado. 
            O último sobrevivente leva o prêmio!
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/cadastro" className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg">
              Participar do Bolão
            </Link>
            <Link href="/como-funciona" className="border border-yellow-600 text-yellow-500 hover:bg-yellow-600/10 font-bold py-3 px-8 rounded-lg transition">
              Como funciona
            </Link>
          </div>
        </div>

        {/* Cards de Estatísticas da Competição */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 text-center border border-green-500/30">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{estatisticas.totalParticipantes}</div>
            <div className="text-gray-400 text-sm">Total de Participantes</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-500/30">
            <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{estatisticas.ativos}</div>
            <div className="text-gray-400 text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 text-center border border-red-500/30">
            <Award className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{estatisticas.eliminados}</div>
            <div className="text-gray-400 text-sm">Participantes Eliminados</div>
          </div>
        </div>

        {/* Ranking dos Participantes */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-10 overflow-hidden">
          <div className="bg-yellow-600/20 px-6 py-4 border-b border-white/10">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Ranking dos Participantes
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrar('todos')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    mostrar === 'todos' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setMostrar('ativos')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    mostrar === 'ativos' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setMostrar('eliminados')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
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
          <div className="p-4">
            {participantesFiltrados.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum participante encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">Participante</th>
                      <th className="text-center py-2 px-3">Status</th>
                      <th className="text-center py-2 px-3">Rodada Eliminação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantesFiltrados.map((p, idx) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white font-medium">{idx + 1}</td>
                        <td className="py-2 px-3 text-white">{p.nome}</td>
                        <td className="py-2 px-3 text-center">
                          {p.status === 'ativo' ? (
                            <span className="inline-flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-3 h-3" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <XCircle className="w-3 h-3" /> Eliminado
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">
                          {p.rodada_eliminacao ? `Rodada ${p.rodada_eliminacao}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Próximos Jogos da Copa */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-10 overflow-hidden">
          <div className="bg-blue-600/20 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Próximos Jogos da Copa
            </h2>
          </div>
          <div className="p-4">
            {proximosJogos.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum jogo programado</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {proximosJogos.map(jogo => (
                  <div key={jogo.id} className="bg-black/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-xs">{jogo.grupo}</span>
                      <span className="text-gray-500 text-xs">{new Date(jogo.data_hora).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-center text-white font-medium">
                      {jogo.time_casa} 🆚 {jogo.time_fora}
                    </div>
                    <div className="text-gray-500 text-xs text-center mt-1">
                      {new Date(jogo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <Target className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">1 erro = eliminação</h3>
            <p className="text-gray-400">Empate ou derrota e você está fora. Só a vitória mantém você vivo!</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <Calendar className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">1 palpite por rodada</h3>
            <p className="text-gray-400">Escolha seu time até 23h59 do dia anterior ao jogo.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Prêmio acumulado</h3>
            <p className="text-gray-400">Quanto mais participantes, maior o prêmio!</p>
          </div>
        </div>

        {/* Bandeiras decorativas */}
        <div className="flex justify-center gap-4 py-6 opacity-40 flex-wrap">
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
        <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/10">
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
    </div>
  );
}