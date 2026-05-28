'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Calendar } from 'lucide-react';

interface Jogo {
  id: number;
  time_casa: string;
  time_fora: string;
  data_hora: string;
  grupo: string;
  finalizado: boolean;
  rodada: number;
}

export default function MataMataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  // --- PROTEÇÃO DE ACESSO ---
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (session?.user?.email === 'admin@estrategista.com') {
      router.replace('/admin');
      return;
    }
    if (status === 'authenticated') {
      carregarJogos();
    }
  }, [status, session]);

  const carregarJogos = async () => {
    try {
      const res = await fetch('/api/jogos');
      const data = await res.json();
      const mataMata = data.filter((j: Jogo) => j.rodada >= 4);
      setJogos(mataMata);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const fases = [
    { rodada: 4, nome: 'Round of 32 (32 avos de final)', icon: '🏆' },
    { rodada: 5, nome: 'Oitavas de Final', icon: '⚽' },
    { rodada: 6, nome: 'Quartas de Final', icon: '🏟️' },
    { rodada: 7, nome: 'Semifinal', icon: '🌟' },
    { rodada: 8, nome: 'Final', icon: '🏆' },
  ];

  // Tela de carregamento
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Verificando acesso...</div>
      </div>
    );
  }

  // Redirecionamento para não participantes
  if (status !== 'authenticated' || session?.user?.email === 'admin@estrategista.com') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando chaveamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Mata-mata - Estrategista da Copa</h1>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">🏆 Chaveamento do Mata-mata 🏆</h2>
          <p className="text-gray-400">Acompanhe os confrontos eliminatórios da Copa 2026</p>
        </div>

        {fases.map(fase => {
          const jogosFase = jogos.filter(j => j.rodada === fase.rodada);
          if (jogosFase.length === 0) return null;

          return (
            <div key={fase.rodada} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{fase.icon}</span>
                <h3 className="text-2xl font-bold text-yellow-500">{fase.nome}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {jogosFase.map(jogo => (
                  <div key={jogo.id} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-yellow-500/30 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-white">{jogo.time_casa}</div>
                        <div className="text-xs text-gray-500 mt-1">Casa</div>
                      </div>
                      <div className="px-4 text-2xl font-bold text-yellow-500">VS</div>
                      <div className="flex-1 text-center">
                        <div className="text-xl font-bold text-white">{jogo.time_fora}</div>
                        <div className="text-xs text-gray-500 mt-1">Fora</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      {jogo.finalizado ? (
                        <span className="text-green-400 text-sm flex items-center justify-center gap-1">
                          ✓ Finalizado
                        </span>
                      ) : (
                        <div className="text-gray-500 text-sm flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {jogos.filter(j => j.rodada >= 4).length === 0 && (
          <div className="bg-yellow-500/10 rounded-xl p-8 text-center border border-yellow-500/30">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Aguardando fase de grupos</h3>
            <p className="text-gray-400">
              Os confrontos do mata-mata serão definidos automaticamente<br />
              após a conclusão da fase de grupos.
            </p>
          </div>
        )}

        <div className="mt-8 bg-yellow-500/10 rounded-lg p-4 text-center">
          <p className="text-yellow-500 text-sm">
            ⚠️ Os confrontos são atualizados automaticamente pelo administrador após a fase de grupos.
          </p>
        </div>
      </div>
    </div>
  );
}