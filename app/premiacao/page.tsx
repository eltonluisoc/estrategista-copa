'use client';

import { useEffect, useState } from 'react';
import { Trophy, Award, Users, TrendingUp } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';
import Link from 'next/link';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function PremiacaoPage() {
  const [premioTotal, setPremioTotal] = useState(0);
  const [totalAprovados, setTotalAprovados] = useState(0);
  const [participantesAtivos, setParticipantesAtivos] = useState(0);
  const [qtosEmPrimeiro, setQtosEmPrimeiro] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/participantes');
        const json = await res.json();
        
        const totalAprov = json.totalAprovados || 0;
        const qtosPrimeiro = json.qtosEmPrimeiro || 0;
        const premio = totalAprov * 20 * 0.9 - 20;
        
        setTotalAprovados(totalAprov);
        setQtosEmPrimeiro(qtosPrimeiro);
        setPremioTotal(premio > 0 ? premio : 0);
        setParticipantesAtivos(json.participantesAtivos || 0);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

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
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Título */}
        <div className="text-center mb-10">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white">Premiação</h1>
          <p className="text-gray-400">Saiba quanto vale cada posição</p>
        </div>

        {/* Prêmio Total */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 rounded-2xl p-8 mb-8 text-center border border-yellow-500/30">
  <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-2">PRÊMIO TOTAL</h2>
  <div className="text-5xl font-bold text-yellow-400 mb-2">
    {formatarMoeda(premioTotal)}
  </div>
  {/* Linha de arrecadação removida propositalmente */}
</div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* 1º Lugar */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-500 font-bold text-xl">1</span>
              </div>
              <h2 className="text-xl font-bold text-white">1º Lugar</h2>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {formatarMoeda(premioTotal)}
            </div>
            <p className="text-gray-400 text-sm">100% do prêmio total</p>
          </div>

          {/* Regra de Empate */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Regra de Empate</h2>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Em caso de empate no 1º lugar, o prêmio será dividido igualmente.
            </p>
            <div className="bg-blue-500/10 rounded-lg p-3">
              <span className="text-blue-400 font-medium">Exemplo:</span>{' '}
              <span className="text-gray-300">
                Se 2 empatarem, cada um recebe {formatarMoeda(premioTotal / 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Situação Atual (se houver empate) */}
        {qtosEmPrimeiro > 1 && (
          <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Situação Atual</h2>
            </div>
            <p className="text-gray-300">
              {qtosEmPrimeiro} participantes empatados em 1º lugar! Cada um levaria{' '}
              <strong className="text-green-400">{formatarMoeda(premioTotal / qtosEmPrimeiro)}</strong>.
            </p>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{totalAprovados}</div>
            <div className="text-gray-400 text-xs">Participantes Confirmados</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{participantesAtivos}</div>
            <div className="text-gray-400 text-xs">Participantes Ativos</div>
          </div>
        </div>

        {/* Voltar */}
        <div className="text-center">
          <Link href="/" className="text-yellow-500 hover:text-yellow-400 text-sm transition">
            ← Voltar ao início
          </Link>
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