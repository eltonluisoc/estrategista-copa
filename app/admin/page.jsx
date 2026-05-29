'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Save, CheckCircle, AlertCircle, Plus, Edit, Trash2, X, UserCheck, DollarSign, Users, XCircle, Calendar, Shield } from 'lucide-react';

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
  const [usuariosAtivos, setUsuariosAtivos] = useState([]);
  const [usuariosEliminados, setUsuariosEliminados] = useState([]);
  const [financeiro, setFinanceiro] = useState({ totalArrecadado: 0, custos: 0, premio: 0, totalAprovados: 0 });
  const [eliminados, setEliminados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [rodadaVerificacao, setRodadaVerificacao] = useState(4);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
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
      carregarUsuarios();
      carregarEliminados();
      carregarStatusInscricoes();
    } else if (session?.user?.email && session?.user?.email !== 'admin@estrategista.com') {
      router.push('/dashboard');
    }
  }, [status, session]);

  const carregarStatusInscricoes = async () => {
    try {
      const res = await fetch('/api/configuracoes/inscricoes');
      const data = await res.json();
      setInscricoesAbertas(data.inscricoes_abertas);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

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

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios?excluirAdmin=true');
      const data = await res.json();
      const ativos = data.filter(u => u.status === 'ativo');
      const eliminados = data.filter(u => u.status === 'eliminado');
      setUsuariosAtivos(ativos);
      setUsuariosEliminados(eliminados);
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

  const carregarEliminados = async () => {
    try {
      const res = await fetch('/api/admin/eliminacoes-detalhadas');
      const data = await res.json();
      setEliminados(data);
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
        carregarUsuarios();
        await fetch('/api/admin/forcar-atualizacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId })
        });
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
        carregarUsuarios();
        carregarEliminados();
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

  const verificarDisponibilidade = async () => {
    setVerificando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/usuarios/verificar-disponibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rodada: rodadaVerificacao })
      });
      const data = await res.json();
      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: data.message });
        carregarUsuarios();
        carregarEliminados();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao verificar disponibilidade' });
    }
    setVerificando(false);
  };

  const toggleInscricoes = async () => {
    try {
      const res = await fetch('/api/configuracoes/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscricoes_abertas: !inscricoesAbertas })
      });
      if (res.ok) {
        setInscricoesAbertas(!inscricoesAbertas);
        setMensagem({ tipo: 'sucesso', texto: `Inscrições ${!inscricoesAbertas ? 'abertas' : 'encerradas'}!` });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao alterar' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }

  if (session?.user?.email !== 'admin@estrategista.com') {
    return null;
  }

  const jogosPendentes = jogos.filter(j => !j.finalizado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-xl font-bold text-white">Admin - Estrategista da Copa</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditando(null); setModalAberto(true); }}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Novo Jogo
              </button>
              <button
                onClick={verificarDisponibilidade}
                disabled={verificando}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
              >
                <Shield className="w-4 h-4" />
                {verificando ? 'Verificando...' : 'Verificar Disponibilidade'}
              </button>
              <button
                onClick={toggleInscricoes}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition ${
                  inscricoesAbertas ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                }`}
              >
                {inscricoesAbertas ? '📝 Inscrições Abertas' : '🔒 Inscrições Encerradas'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            mensagem.tipo === 'sucesso' 
              ? 'bg-green-500/20 border border-green-500 text-green-400' 
              : 'bg-red-500/20 border border-red-500 text-red-400'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        {/* Cards Financeiros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-green-400">R$ {financeiro.totalArrecadado}</div>
            <div className="text-gray-400 text-sm mt-1">Arrecadado</div>
            <div className="text-xs text-gray-500 mt-2">{financeiro.totalAprovados} participantes</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 rounded-xl p-6 border border-yellow-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-gray-500">10%</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">R$ {financeiro.custos}</div>
            <div className="text-gray-400 text-sm mt-1">Custos do Site</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-500">Prêmio</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">R$ {financeiro.premio}</div>
            <div className="text-gray-400 text-sm mt-1">Prêmio Final</div>
          </div>
        </div>

        {/* Resumo da Competição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/20 to-green-950/20 rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-lg font-bold text-white">Participantes Ativos</h2>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">{usuariosAtivos.length}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {usuariosAtivos.slice(0, 5).map(u => (
                <span key={u.id} className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">{u.nome}</span>
              ))}
              {usuariosAtivos.length > 5 && (
                <span className="text-xs text-gray-400">+{usuariosAtivos.length - 5}</span>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 rounded-xl p-6 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-lg font-bold text-white">Participantes Eliminados</h2>
            </div>
            <div className="text-4xl font-bold text-red-400 mb-2">{usuariosEliminados.length}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {usuariosEliminados.slice(0, 5).map(u => (
                <span key={u.id} className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">{u.nome}</span>
              ))}
              {usuariosEliminados.length > 5 && (
                <span className="text-xs text-gray-400">+{usuariosEliminados.length - 5}</span>
              )}
            </div>
          </div>
        </div>

        {/* Usuários Pendentes */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-8 overflow-hidden">
          <div className="bg-yellow-600/20 px-6 py-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-yellow-400" />
              Usuários Pendentes ({usuariosPendentes.length})
            </h2>
          </div>
          <div className="p-6">
            {usuariosPendentes.length === 0 ? (
              <p className="text-gray-400 text-center py-4">✅ Nenhum usuário aguardando aprovação</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left text-gray-400 text-sm border-b border-white/10">
                    <tr>
                      <th className="pb-2">Nome</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Data Cadastro</th>
                      <th className="pb-2 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {usuariosPendentes.map(usuario => (
                      <tr key={usuario.id} className="border-b border-white/5">
                        <td className="py-3 text-white">{usuario.nome}</td>
                        <td className="py-3 text-gray-400">{usuario.email}</td>
                        <td className="py-3 text-gray-500">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => aprovarUsuario(usuario.id)}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm transition"
                          >
                            Aprovar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Jogos Pendentes */}
        <div className="bg-white/5 rounded-xl border border-white/10 mb-8 overflow-hidden">
          <div className="bg-blue-600/20 px-6 py-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Jogos Pendentes ({jogosPendentes.length})
            </h2>
          </div>
          <div className="p-6">
            {jogosPendentes.length === 0 ? (
              <p className="text-gray-400 text-center py-4">✅ Nenhum jogo pendente</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left text-gray-400 text-sm border-b border-white/10">
                    <tr>
                      <th className="pb-2">Data/Hora</th>
                      <th className="pb-2">Jogo</th>
                      <th className="pb-2">Rodada</th>
                      <th className="pb-2 text-center">Placar</th>
                      <th className="pb-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {jogosPendentes.map((jogo) => (
                      <tr key={jogo.id} className="border-b border-white/5">
                        <td className="py-3 text-gray-400 whitespace-nowrap">
                          {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3">
                          <div className="text-white font-medium">{jogo.time_casa} 🆚 {jogo.time_fora}</div>
                          <div className="text-gray-500 text-xs">{jogo.grupo}</div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Rodada {jogo.rodada}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              id={`gols-casa-${jogo.id}`}
                              placeholder="0"
                              className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-yellow-500"
                            />
                            <span className="text-yellow-500 font-bold">x</span>
                            <input
                              type="number"
                              id={`gols-fora-${jogo.id}`}
                              placeholder="0"
                              className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-yellow-500"
                            />
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-center gap-2">
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
                              className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition"
                            >
                              <Save className="w-3 h-3" /> Finalizar
                            </button>
                            <button
                              onClick={() => { setEditando(jogo); setModalAberto(true); }}
                              className="text-blue-400 hover:text-blue-300 transition"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletarJogo(jogo.id)}
                              className="text-red-400 hover:text-red-300 transition"
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

        {/* Últimos Eliminados */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="bg-red-600/20 px-6 py-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Últimos Eliminados ({eliminados.length})
            </h2>
          </div>
          <div className="p-6">
            {eliminados.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum eliminado ainda</p>
            ) : (
              <div className="space-y-3">
                {eliminados.map((elim, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="text-white font-semibold">{elim.nome}</div>
                        <div className="text-gray-400 text-sm">{elim.email}</div>
                      </div>
                      <div className="text-red-400 text-sm font-medium">Rodada {elim.rodada_eliminacao}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
                      <div className="bg-black/50 rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Palpite</div>
                        <div className="text-yellow-400 font-medium">{elim.time_escolhido}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Jogo</div>
                        <div className="text-white">{elim.time_casa} x {elim.time_fora}</div>
                        <div className="text-gray-400 text-xs">{elim.gols_casa} - {elim.gols_fora}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Resultado</div>
                        <div className={elim.vencedor === elim.time_escolhido ? 'text-green-400' : 'text-red-400'}>
                          {elim.vencedor === elim.time_escolhido ? '✅ Acertou' : '❌ Errou'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-yellow-600/30 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white">{editando ? '✏️ Editar Jogo' : '➕ Novo Jogo'}</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Time Casa</label>
                <select 
                  value={editando?.time_casa || novoJogo.time_casa} 
                  onChange={(e) => editando ? setEditando({...editando, time_casa: e.target.value}) : setNovoJogo({...novoJogo, time_casa: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Selecione o time</option>
                  {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Time Fora</label>
                <select 
                  value={editando?.time_fora || novoJogo.time_fora} 
                  onChange={(e) => editando ? setEditando({...editando, time_fora: e.target.value}) : setNovoJogo({...novoJogo, time_fora: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="">Selecione o time</option>
                  {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Data e Hora</label>
                <input 
                  type="datetime-local" 
                  value={editando?.data_hora?.slice(0,16) || novoJogo.data_hora} 
                  onChange={(e) => editando ? setEditando({...editando, data_hora: e.target.value}) : setNovoJogo({...novoJogo, data_hora: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Rodada</label>
                  <input 
                    type="number" 
                    placeholder="Rodada" 
                    value={editando?.rodada || novoJogo.rodada} 
                    onChange={(e) => editando ? setEditando({...editando, rodada: parseInt(e.target.value)}) : setNovoJogo({...novoJogo, rodada: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500" 
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Fase/Grupo</label>
                  <select
                    value={editando?.grupo || novoJogo.grupo}
                    onChange={(e) => editando ? setEditando({...editando, grupo: e.target.value}) : setNovoJogo({...novoJogo, grupo: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="Grupos">Fase de Grupos</option>
                    <option value="Round of 32">Round of 32</option>
                    <option value="Oitavas">Oitavas de Final</option>
                    <option value="Quartas">Quartas de Final</option>
                    <option value="Semifinal">Semifinal</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={salvarJogo} 
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition mt-2"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}