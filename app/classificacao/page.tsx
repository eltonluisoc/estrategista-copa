'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClassificacaoItem {
  id: number;
  grupo: string;
  time_id: number;
  time_nome: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo_gols: number;
}

const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function ClassificacaoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classificacao, setClassificacao] = useState<ClassificacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [grupoAtual, setGrupoAtual] = useState('A');
  const [classificacaoGrupo, setClassificacaoGrupo] = useState<ClassificacaoItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    carregarClassificacao();
  }, [status]);

  useEffect(() => {
    const filtrado = classificacao.filter(c => c.grupo === grupoAtual);
    setClassificacaoGrupo(filtrado);
  }, [grupoAtual, classificacao]);

  const carregarClassificacao = async () => {
    try {
      const res = await fetch('/api/classificacao');
      const data = await res.json();
      setClassificacao(data);
    } catch (error) {
      console.error('Erro ao carregar classificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const grupoAnterior = () => {
    const index = grupos.indexOf(grupoAtual);
    if (index > 0) setGrupoAtual(grupos[index - 1]);
  };

  const proximoGrupo = () => {
    const index = grupos.indexOf(grupoAtual);
    if (index < grupos.length - 1) setGrupoAtual(grupos[index + 1]);
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
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Classificação - Estrategista da Copa</h1>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Navegação entre grupos */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={grupoAnterior}
            disabled={grupoAtual === 'A'}
            className="bg-yellow-600/20 hover:bg-yellow-600/30 disabled:opacity-30 p-2 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 text-yellow-500" />
          </button>
          <h2 className="text-3xl font-bold text-white">Grupo {grupoAtual}</h2>
          <button
            onClick={proximoGrupo}
            disabled={grupoAtual === 'L'}
            className="bg-yellow-600/20 hover:bg-yellow-600/30 disabled:opacity-30 p-2 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6 text-yellow-500" />
          </button>
        </div>

        {/* Tabela de classificação */}
        <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400 text-sm">Pos</th>
                  <th className="px-4 py-3 text-left text-gray-400 text-sm">Time</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">P</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">J</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">V</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">E</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">D</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">GP</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">GC</th>
                  <th className="px-4 py-3 text-center text-gray-400 text-sm">SG</th>
                </tr>
              </thead>
              <tbody>
                {classificacaoGrupo.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                      Nenhum jogo finalizado ainda
                    </td>
                  </tr>
                ) : (
                  classificacaoGrupo.map((item, idx) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-white font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 text-white">{item.time_nome}</td>
                      <td className="px-4 py-3 text-center text-yellow-500 font-bold">{item.pontos}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.jogos}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.vitorias}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.empates}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.derrotas}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.gols_pro}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.gols_contra}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{item.saldo_gols}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>Classificação atualizada automaticamente após cada jogo finalizado.</p>
          <p className="mt-1">P = Pontos | J = Jogos | V = Vitórias | E = Empates | D = Derrotas | GP = Gols Pró | GC = Gols Contra | SG = Saldo de Gols</p>
        </div>
      </div>
    </div>
  );
}