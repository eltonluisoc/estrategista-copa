'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Save, CheckCircle, AlertCircle, Plus, Edit, Trash2, X, UserCheck, DollarSign, Users } from 'lucide-react';

const timesLista = [
  'Brasil', 'Argentina', 'França', 'Alemanha', 'Espanha', 'Inglaterra',
  'Portugal', 'Holanda', 'Itália', 'Bélgica', 'Croácia', 'Uruguai',
  'México', 'Coreia do Sul', 'África do Sul', 'República Tcheca',
  'Canadá', 'Bósnia', 'Catar', 'Suíça', 'Marrocos', 'Haiti', 'Escócia',
  'EUA', 'Paraguai', 'Austrália', 'Turquia', 'Curaçao', 'Costa do Marfim',
  'Equador', 'Japão', 'Suécia', 'Tunísia', 'Egito', 'Irã', 'Nova Zelândia'
];

const VALOR_INSCRICAO = 20;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jogos, setJogos] = useState([]);
  const [usuariosPendentes, setUsuariosPendentes] = useState([]);
  const [financeiro, setFinanceiro] = useState({ totalArrecadado: 0, custos: 0, premio: 0, totalAprovados: 0 });
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [processandoMataMata, setProcessandoMataMata] = useState(false);
  const [novoJogo, setNovoJogo] = useState({
    time_casa: '',
    time_fora: '',
    data_hora: '',
    rodada: 1,
    grupo: 'Grupos'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.email === 'admin@estrategista.com') {
      carregarJogos();
      carregarUsuariosPendentes();
      carregarFinanceiro();
    } else if (session?.user?.email && session?.user?.email !== 'admin@estrategista.com') {
      router.push('/dashboard');
    }
  }, [status, session]);

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

  const carregarUsuariosPendentes = async () => {
    try {
      const res = await fetch('/api/admin/usuarios/pendentes');
      const data = await res.json();
      setUsuariosPendentes(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const carregarFinanceiro = async () => {
    try {
      const res = await fetch('/api/admin/financeiro');
      const data = await res.json();
      setFinanceiro(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const aprovarUsuario = async (usuarioId) => {
    try {
      const res = await fetch('/api/admin/usuarios/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId })
      });
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Usuário aprovado com sucesso!' });
        carregarUsuariosPendentes();
        carregarFinanceiro();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao aprovar usuário' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão' });
    }
  };

  const processarResultado = async (jogoId, gols_casa, gols_fora, rodada) => {
    setMensagem(null);
    try {
      const res = await fetch('/api/admin/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogoId, gols_casa, gols_fora, rodada })
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: '✅ Processado! ' + data.eliminados + ' eliminado(s).' });
        carregarJogos();
        carregarFinanceiro();
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
      const res = await fetch('/api/admin/jogos/' + id, { method: 'DELETE' });
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Jogo deletado!' });
        carregarJogos();
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500">Carregando...</div>
      </div>
    );
  }

  if (session?.user?.email !== 'admin@estrategista.com') {
    return null;
  }

  const jogosPendentes = jogos.filter(j => !j.finalizado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-lg sm:text-xl font-bold text-white">Admin - Estrategista da Copa</h1>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => { setEditando(null); setModalAberto(true); }} 
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Novo Jogo
            </button>
            <button onClick={() => router.push('/dashboard')} 
              className="text-gray-400 hover:text-white px-2 py-1.5">
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

        {/* Cards Financeiros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">R$ {financeiro.totalArrecadado}</div>
            <div className="text-gray-400 text-sm">Total Arrecadado</div>
            <div className="text-xs text-gray-500 mt-1">{financeiro.totalAprovados} participantes aprovados</div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 text-center">
            <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">R$ {financeiro.custos}</div>
            <div className="text-gray-400 text-sm">10% Custos do Site</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 text-center">
            <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">R$ {financeiro.premio}</div>
            <div className="text-gray-400 text-sm">Prêmio Final</div>
          </div>
        </div>

        {/* Usuários Pendentes de Aprovação */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-yellow-500" />
            👥 Usuários Pendentes ({usuariosPendentes.length})
          </h2>
          {usuariosPendentes.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nenhum usuário aguardando aprovação</p>
          ) : (
            <div className="space-y-2">
              {usuariosPendentes.map(usuario => (
                <div key={usuario.id} className="bg-black/30 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-white font-medium">{usuario.nome}</div>
                    <div className="text-gray-400 text-sm">{usuario.email}</div>
                    <div className="text-gray-500 text-xs">Cadastrado em: {new Date(usuario.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <button
                    onClick={() => aprovarUsuario(usuario.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Aprovar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jogos Pendentes - Tabela com placar numérico */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">🎮 Jogos Pendentes</h2>
          {jogosPendentes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum jogo pendente</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/50 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400">Data/Hora</th>
                    <th className="px-3 py-2 text-left text-gray-400">Jogo</th>
                    <th className="px-3 py-2 text-center text-gray-400">Placar</th>
                    <th className="px-3 py-2 text-center text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {jogosPendentes.map((jogo) => (
                    <tr key={jogo.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-white">{jogo.time_casa} 🆚 {jogo.time_fora}</div>
                        <div className="text-gray-500 text-xs">Rodada {jogo.rodada} • {jogo.grupo}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            id={`gols-casa-${jogo.id}`}
                            placeholder="0"
                            className="w-16 bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-center"
                          />
                          <span className="text-yellow-500 font-bold">x</span>
                          <input
                            type="number"
                            id={`gols-fora-${jogo.id}`}
                            placeholder="0"
                            className="w-16 bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-center"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => {
                              const golsCasa = document.getElementById(`gols-casa-${jogo.id}`).value;
                              const golsFora = document.getElementById(`gols-fora-${jogo.id}`).value;
                              if (golsCasa === '' || golsFora === '') {
                                alert('Preencha o placar do jogo');
                                return;
                              }
                              processarResultado(jogo.id, parseInt(golsCasa), parseInt(golsFora), jogo.rodada);
                            }}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Finalizar
                          </button>
                          <button
                            onClick={() => { setEditando(jogo); setModalAberto(true); }}
                            className="text-blue-400 hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletarJogo(jogo.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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