'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Participante {
  id: string;
  nome: string;
  email: string;
  status: string;
  palpites_acertados?: number;
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarParticipantes();
  }, []);

  const carregarParticipantes = async () => {
    try {
      const res = await fetch('/api/participantes');
      const data = await res.json();
      setParticipantes(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500">Carregando...</div>
      </div>
    );
  }

  const ativos = participantes.filter(p => p.status === 'ativo');
  const eliminados = participantes.filter(p => p.status === 'eliminado');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Participantes - Estrategista da Copa</h1>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white transition">
            Voltar
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">🏆 Participantes do Bolão 🏆</h2>
          <p className="text-gray-400">Acompanhe quem está vivo na competição</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-400">{ativos.length}</div>
            <div className="text-gray-400 text-sm">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400">{eliminados.length}</div>
            <div className="text-gray-400 text-sm">Participantes Eliminados</div>
          </div>
        </div>

        {/* Lista de participantes ativos */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Ativos ({ativos.length})
          </h3>
          <div className="space-y-2">
            {ativos.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum participante ativo no momento</p>
            ) : (
              ativos.map((p, idx) => (
                <div key={p.id} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-500 font-bold">#{idx + 1}</span>
                    <span className="text-white">{p.nome}</span>
                  </div>
                  <span className="text-green-400 text-sm">✅ Ativo</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista de participantes eliminados */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Eliminados ({eliminados.length})
          </h3>
          <div className="space-y-2">
            {eliminados.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum participante eliminado ainda</p>
            ) : (
              eliminados.map((p, idx) => (
                <div key={p.id} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold">#{idx + 1}</span>
                    <span className="text-gray-300">{p.nome}</span>
                  </div>
                  <span className="text-red-400 text-sm">❌ Eliminado</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}