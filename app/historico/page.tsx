'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Trophy, Users } from 'lucide-react';
import Link from 'next/link';

interface PalpiteHistorico {
  participante: string;
  rodada: number;
  time_escolhido: string;
  jogo: string;
  resultado: string;
  data_palpite: string;
}

export default function HistoricoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [palpites, setPalpites] = useState<PalpiteHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroParticipante, setFiltroParticipante] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      carregarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const carregarHistorico = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/historico';
      if (filtroParticipante.trim()) {
        url += '?participante=' + encodeURIComponent(filtroParticipante.trim());
      }
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar histórico');
      }
      
      if (!Array.isArray(data)) {
        setPalpites([]);
        return;
      }
      
      setPalpites(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar histórico. Tente novamente.');
      setPalpites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    carregarHistorico();
  };

  const handleLimpar = () => {
    setFiltroParticipante('');
    // Pequeno delay para o estado atualizar antes de buscar
    setTimeout(() => carregarHistorico(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      carregarHistorico();
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  const getResultadoStyle = (resultado: string) => {
    if (resultado.includes('Acertou')) return 'text-green-400 bg-green-500/10';
    if (resultado.includes('Errou')) return 'text-red-400 bg-red-500/10';
    return 'text-gray-400 bg-gray-500/10';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Histórico de Palpites
            </h1>
            <p className="text-gray-400 text-sm">Acompanhe todos os palpites dos participantes</p>
          </div>
          <Link
            href="/dashboard"
            className="text-yellow-500 hover:text-yellow-400 text-sm transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Filtro com busca direta */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-gray-400 text-xs font-medium mb-1">Buscar participante</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={filtroParticipante}
                  onChange={(e) => setFiltroParticipante(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o nome do participante..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={handleBuscar}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm transition whitespace-nowrap"
              >
                Buscar
              </button>
              {filtroParticipante && (
                <button
                  onClick={handleLimpar}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm transition whitespace-nowrap"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-yellow-500 text-lg">Carregando histórico...</div>
          </div>
        ) : palpites.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
            <p className="text-gray-400">
              {filtroParticipante ? `Nenhum palpite encontrado para "${filtroParticipante}".` : 'Nenhum palpite encontrado.'}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Participante</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Rodada</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Time escolhido</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Jogo</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Resultado</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Data do palpite</th>
                  </tr>
                </thead>
                <tbody>
                  {palpites.map((palpite, idx) => {
                    const data = new Date(palpite.data_palpite);
                    const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4 text-white font-medium">{palpite.participante}</td>
                        <td className="py-3 px-4 text-center text-yellow-400">{palpite.rodada}</td>
                        <td className="py-3 px-4 text-yellow-500">{palpite.time_escolhido}</td>
                        <td className="py-3 px-4 text-gray-300">{palpite.jogo}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResultadoStyle(palpite.resultado)}`}>
                            {palpite.resultado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500 text-xs whitespace-nowrap">
                          {dataFormatada}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/10 text-gray-500 text-xs">
              Total: {palpites.length} palpites
            </div>
          </div>
        )}
      </div>
    </div>
  );
}