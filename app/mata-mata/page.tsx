'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut } from 'lucide-react';

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    carregarJogos();
  }, [status]);

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
    { rodada: 4, nome: 'Round of 32 (32 avos)' },
    { rodada: 5, nome: 'Oitavas de Final' },
    { rodada: 6, nome: 'Quartas de Final' },
    { rodada: 7, nome: 'Semifinal' },
    { rodada: 8, nome: 'Final' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500">Carregando...</div>
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Chaveamento do Mata-mata</h2>
        
        {fases.map(fase => {
          const jogosFase = jogos.filter(j => j.rodada === fase.rodada);
          if (jogosFase.length === 0) return null;
          
          return (
            <div key={fase.rodada} className="mb-8">
              <h3 className="text-xl font-bold text-yellow-500 mb-4">{fase.nome}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {jogosFase.map(jogo => (
                  <div key={jogo.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">
                        {jogo.time_casa} x {jogo.time_fora}
                      </div>
                      {jogo.finalizado ? (
                        <span className="text-green-400 text-sm">✓ Finalizado</span>
                      ) : (
                        <span className="text-gray-400 text-sm">⏳ Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="mt-8 bg-yellow-500/10 rounded-lg p-4 text-center">
          <p className="text-yellow-500 text-sm">
            ⚠️ Após a fase de grupos, o administrador deve clicar em "Calcular Mata-mata" no painel Admin para preencher os confrontos automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}