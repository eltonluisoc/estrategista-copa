'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Save, CheckCircle, AlertCircle, Plus, Edit, Trash2, X } from 'lucide-react';

const timesLista = [
  'Brasil', 'Argentina', 'França', 'Alemanha', 'Espanha', 'Inglaterra',
  'Portugal', 'Holanda', 'Itália', 'Bélgica', 'Croácia', 'Uruguai',
  'México', 'Coreia do Sul', 'África do Sul', 'República Tcheca',
  'Canadá', 'Bósnia', 'Catar', 'Suíça', 'Marrocos', 'Haiti', 'Escócia',
  'EUA', 'Paraguai', 'Austrália', 'Turquia', 'Curaçao', 'Costa do Marfim',
  'Equador', 'Japão', 'Suécia', 'Tunísia', 'Egito', 'Irã', 'Nova Zelândia'
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [novoJogo, setNovoJogo] = useState({
    time_casa: '',
    time_fora: '',
    data_hora: '',
    rodada: 1,
    grupo: 'Grupos'
  });

  // --- PROTEÇÃO DE ACESSO ---
  useEffect(() => {
    // Se o usuário não está logado, redireciona para o login
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    // Se está logado, mas o email NÃO é o do admin, redireciona para o dashboard normal
    if (session?.user?.email && session.user.email !== 'admin@estrategista.com') {
      router.push('/dashboard');
    }
    // Se é o admin, carrega os dados
    if (session?.user?.email === 'admin@estrategista.com') {
      carregarJogos();
    }
  }, [status, session]);

  // --- FUNÇÕES DE CARREGAMENTO E CRUD ---
  const carregarJogos = async () => {
    try {
      const res = await fetch('/api/admin/jogos');
      const data = await res.json();
      setJogos(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarResultado = async (jogoId, vencedor, rodada) => {
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogoId, vencedor, rodada })
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: '✅ Processado! ' + data.eliminados + ' eliminado(s).' });
        carregarJogos();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão' });
    }
  };

  const salvarJogo = async () => {
    const dados = editando ? editando : novoJogo;
    const res = await fetch('/api/admin/jogos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      setMensagem({ tipo: 'sucesso', texto: editando ? 'Jogo atualizado!' : 'Jogo criado!' });
      setModalAberto(false);
      setEditando(null);
      carregarJogos();
    } else {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar' });
    }
  };

  const deletarJogo = async (id) => {
    if (confirm('Tem certeza?')) {
      await fetch('/api/admin/jogos/' + id, { method: 'DELETE' });
      setMensagem({ tipo: 'sucesso', texto: 'Jogo deletado!' });
      carregarJogos();
    }
  };

  // --- TELA DE CARREGAMENTO ---
  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center text-yellow-500">Carregando...</div>;
  }

  // --- SE NÃO FOR ADMIN, NÃO MOSTRA O CONTEÚDO (Só uma segurança extra) ---
  if (session?.user?.email !== 'admin@estrategista.com') {
    return null;
  }

  // --- RENDERIZAÇÃO DO ADMIN ---
  const jogosPendentes = jogos.filter(j => !j.finalizado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Admin - Estrategista da Copa</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setEditando(null); setModalAberto(true); }} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Novo Jogo
            </button>
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {mensagem && (
          <div className={'mb-6 p-4 rounded-lg flex items-center gap-2 ' + (mensagem.tipo === 'sucesso' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {mensagem.texto}
          </div>
        )}

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 Jogos Pendentes</h2>
          {jogosPendentes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum jogo pendente</div>
          ) : (
            jogosPendentes.map((jogo) => (
              <div key={jogo.id} className="bg-black/30 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <div className="text-white font-medium">{jogo.time_casa} 🆚 {jogo.time_fora}</div>
                    <div className="text-gray-400 text-sm">Rodada {jogo.rodada} • {jogo.grupo}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditando(jogo); setModalAberto(true); }} className="text-blue-400"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deletarJogo(jogo.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                    <select id={'v-' + jogo.id} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-sm">
                      <option value="">Vencedor</option>
                      <option value={jogo.time_casa}>{jogo.time_casa}</option>
                      <option value={jogo.time_fora}>{jogo.time_fora}</option>
                    </select>
                    <button onClick={() => {
                      const select = document.getElementById('v-' + jogo.id);
                      if (select.value) {
                        processarResultado(jogo.id, select.value, jogo.rodada);
                      } else {
                        alert('Selecione o vencedor');
                      }
                    }} className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded text-sm flex items-center gap-1">
                      <Save className="w-3 h-3" /> Finalizar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-yellow-600/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{editando ? '✏️ Editar Jogo' : '➕ Novo Jogo'}</h3>
              <button onClick={() => setModalAberto(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Time Casa</label>
                <select value={editando?.time_casa || novoJogo.time_casa} onChange={(e) => editando ? setEditando({...editando, time_casa: e.target.value}) : setNovoJogo({...novoJogo, time_casa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white">
                  <option value="">Time Casa</option>
                  {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Time Fora</label>
                <select value={editando?.time_fora || novoJogo.time_fora} onChange={(e) => editando ? setEditando({...editando, time_fora: e.target.value}) : setNovoJogo({...novoJogo, time_fora: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white">
                  <option value="">Time Fora</option>
                  {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Data e Hora</label>
                <input type="datetime-local" value={editando?.data_hora?.slice(0,16) || novoJogo.data_hora} onChange={(e) => editando ? setEditando({...editando, data_hora: e.target.value}) : setNovoJogo({...novoJogo, data_hora: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Rodada</label>
                <input type="number" placeholder="Rodada" value={editando?.rodada || novoJogo.rodada} onChange={(e) => editando ? setEditando({...editando, rodada: parseInt(e.target.value)}) : setNovoJogo({...novoJogo, rodada: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Fase/Grupo</label>
                <select value={editando?.grupo || novoJogo.grupo} onChange={(e) => editando ? setEditando({...editando, grupo: e.target.value}) : setNovoJogo({...novoJogo, grupo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white">
                  <option value="Grupos">Fase de Grupos</option>
                  <option value="Round of 32">Round of 32</option>
                  <option value="Oitavas">Oitavas de Final</option>
                  <option value="Quartas">Quartas de Final</option>
                  <option value="Semifinal">Semifinal</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <button onClick={salvarJogo} className="w-full bg-yellow-600 hover:bg-yellow-500 py-2 rounded font-bold mt-2">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}