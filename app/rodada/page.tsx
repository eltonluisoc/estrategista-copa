'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

interface Jogo {
  id: number;
  time_casa: string;
  time_fora: string;
  data_hora: string;
  prazo: string;
  rodada: number;
  grupo: string;
  finalizado: boolean;
}

interface Palpite {
  id: string;
  usuario_id: string;
  time_id: number;
  rodada: number;
  usuario_nome?: string;
  time_nome?: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: string;
}

export default function RodadaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [tempoRestante, setTempoRestante] = useState<string>('');
  const [prazoFinal, setPrazoFinal] = useState<Date | null>(null);
  const [palpiteUsuario, setPalpiteUsuario] = useState<Palpite | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      carregarDados();
    }
  }, [status]);

  useEffect(() => {
    if (prazoFinal) {
      const interval = setInterval(() => {
        atualizarContador();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [prazoFinal]);

  const carregarDados = async () => {
    try {
      // Carregar jogos
      const resJogos = await fetch('/api/jogos');
      const jogosData = await resJogos.json();
      setJogos(jogosData);

      // Determinar rodada atual baseada na data
      const agora = new Date();
      const jogosFuturos = jogosData.filter((j: Jogo) => new Date(j.data_hora) > agora);
      if (jogosFuturos.length > 0) {
        const proximoJogo = jogosFuturos.sort((a: Jogo, b: Jogo) => 
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
        )[0];
        setRodadaAtual(proximoJogo.rodada);
        setPrazoFinal(new Date(proximoJogo.prazo));
      }

      // Carregar palpites
      const resPalpites = await fetch('/api/palpites/rodada?rodada=' + rodadaAtual);
      const palpitesData = await resPalpites.json();
      setPalpites(palpitesData);

      // Carregar usuários
      const resUsuarios = await fetch('/api/usuarios');
      const usuariosData = await resUsuarios.json();
      setUsuarios(usuariosData);

      // Buscar palpite do usuário logado
      const meuPalpite = palpitesData.find((p: Palpite) => p.usuario_id === session?.user?.id);
      setPalpiteUsuario(meuPalpite || null);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarContador = () => {
    if (!prazoFinal) return;
    
    const agora = new Date();
    const diff = prazoFinal.getTime() - agora.getTime();

    if (diff <= 0) {
      setTempoRestante('Prazo encerrado');
      return;
    }

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    setTempoRestante(`${horas}h ${minutos}m ${segundos}s`);
  };

  // Enriquecer palpites com nomes dos usuários e times
  const palpitesCompletos = palpites.map(palpite => {
    const usuario = usuarios.find(u => u.id === palpite.usuario_id);
    return {
      ...palpite,
      usuario_nome: usuario?.nome || 'Desconhecido',
    };
  });

  const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');
  const usuariosEliminados = usuarios.filter(u => u.status === 'eliminado');
  
  const usuariosQuePalpitaram = new Set(palpites.map(p => p.usuario_id));
  const usuariosPendentes = usuariosAtivos.filter(u => !usuariosQuePalpitaram.has(u.id));

  const prazoExpirado = prazoFinal && new Date() > prazoFinal;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Estrategista da Copa</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Título e contador */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rodada {rodadaAtual}</h1>
          <div className="inline-flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-300">
              {prazoExpirado ? '🔒 Prazo encerrado' : `⏰ Tempo restante para palpitar: ${tempoRestante}`}
            </span>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{usuariosAtivos.length}</div>
            <div className="text-gray-400 text-sm">Participantes ativos</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{usuariosEliminados.length}</div>
            <div className="text-gray-400 text-sm">Eliminados</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{usuariosQuePalpitaram.size}</div>
            <div className="text-gray-400 text-sm">Já palpitaram</div>
          </div>
        </div>

        {/* Seu palpite */}
        {palpiteUsuario && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-white">Seu palpite</h2>
            </div>
            <p className="text-xl text-yellow-400 font-bold">
              {palpiteUsuario.time_nome || 'Time escolhido'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {prazoExpirado ? 'Aguardando resultado...' : 'Palpite registrado com sucesso!'}
            </p>
          </div>
        )}

        {/* Lista de palpites (visível após o prazo) */}
        {prazoExpirado ? (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Palpites da Rodada {rodadaAtual}
            </h2>
            <div className="space-y-2">
              {palpitesCompletos.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum palpite registrado nesta rodada.</p>
              ) : (
                palpitesCompletos.map((palpite, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">{palpite.usuario_nome}</span>
                    <span className="text-yellow-500 font-semibold">{palpite.time_nome || 'Time'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Lista de pendentes (antes do prazo) */
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Ainda não palpitaram ({usuariosPendentes.length})
            </h2>
            <div className="space-y-2">
              {usuariosPendentes.length === 0 ? (
                <p className="text-green-400 text-center py-8">✅ Todos os participantes já palpitaram!</p>
              ) : (
                usuariosPendentes.map(usuario => (
                  <div key={usuario.id} className="bg-black/30 rounded-lg p-3">
                    <span className="text-gray-300">{usuario.nome}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg text-center">
              <p className="text-yellow-400 text-sm">
                ⏰ Prazo para palpitar: {new Date(prazoFinal || '').toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Jogos da rodada */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            Jogos da Rodada {rodadaAtual}
          </h2>
          <div className="space-y-2">
            {jogos.filter(j => j.rodada === rodadaAtual).map(jogo => (
              <div key={jogo.id} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-white">{jogo.time_casa} x {jogo.time_fora}</span>
                  <span className="text-gray-500 text-sm ml-3">{jogo.grupo}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}