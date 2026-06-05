'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trophy, LogOut, Save, CheckCircle, AlertCircle, Plus, Edit, Trash2, X, UserCheck, DollarSign, Users, XCircle, Calendar, Shield, Eye, EyeOff } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';

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
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  
  const [faseExpandida, setFaseExpandida] = useState({
    grupos: true,
    round32: false,
    oitavas: false,
    quartas: false,
    semi: false,
    final: false
  });
  const [novoJogo, setNovoJogo] = useState({
    time_casa: '',
    time_fora: '',
    data_hora: '',
    rodada: 1,
    grupo: 'Grupos'
  });
  const [mostrarParticipantes, setMostrarParticipantes] = useState(false);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

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
    if (carregandoUsuarios) return;
    setCarregandoUsuarios(true);
    try {
      const res = await fetch('/api/usuarios?excluirAdmin=true');
      const data = await res.json();
      
      const unicos = [];
      const ids = new Set();
      for (const usuario of data) {
        if (!ids.has(usuario.id)) {
          ids.add(usuario.id);
          unicos.push(usuario);
        }
      }
      
      const ativos = unicos.filter(u => u.status === 'ativo');
      const eliminados = unicos.filter(u => u.status === 'eliminado');
      const pendentes = unicos.filter(u => u.status === 'pendente');
      
      setUsuariosAtivos(ativos);
      setUsuariosEliminados(eliminados);
      setUsuariosPendentes(pendentes);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregandoUsuarios(false);
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

  const toggleFase = (fase) => {
    setFaseExpandida(prev => ({ ...prev, [fase]: !prev[fase] }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
        <GlobalHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-yellow-500 text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  if (session?.user?.email !== 'admin@estrategista.com') {
    return null;
  }

  const jogosGrupos = jogos.filter(j => j.rodada === 1 || j.rodada === 2 || j.rodada === 3);
  const jogosRound32 = jogos.filter(j => j.rodada === 4);
  const jogosOitavas = jogos.filter(j => j.rodada === 5);
  const jogosQuartas = jogos.filter(j => j.rodada === 6);
  const jogosSemi = jogos.filter(j => j.rodada === 7);
  const jogosFinal = jogos.filter(j => j.rodada === 8);

  const fases = [
    { id: 'grupos', nome: 'Fase de Grupos (Rodadas 1, 2, 3)', jogos: jogosGrupos, expandida: faseExpandida.grupos, totalJogos: 72 },
    { id: 'round32', nome: '16 avos de final', jogos: jogosRound32, expandida: faseExpandida.round32, totalJogos: 16 },
    { id: 'oitavas', nome: 'Oitavas de Final', jogos: jogosOitavas, expandida: faseExpandida.oitavas, totalJogos: 8 },
    { id: 'quartas', nome: 'Quartas de Final', jogos: jogosQuartas, expandida: faseExpandida.quartas, totalJogos: 4 },
    { id: 'semi', nome: 'Semifinal', jogos: jogosSemi, expandida: faseExpandida.semi, totalJogos: 2 },
    { id: 'final', nome: 'Final', jogos: jogosFinal, expandida: faseExpandida.final, totalJogos: 1 }
  ];

  const todosUsuarios = [...new Map([...usuariosAtivos, ...usuariosPendentes, ...usuariosEliminados].map(u => [u.id, u])).values()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />

      <div className="container mx-auto px-4 py-6">
        {mensagem && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${mensagem.tipo === 'sucesso' ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'}`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-6 h-6 text-green-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-green-400">R$ {financeiro.totalArrecadado}</div>
            <div className="text-gray-400 text-xs">Arrecadado</div>
            <div className="text-xs text-gray-500 mt-1">{financeiro.totalAprovados} participantes</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-1">
              <Users className="w-6 h-6 text-yellow-400" />
              <span className="text-xs text-gray-500">10%</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">R$ {financeiro.custos}</div>
            <div className="text-gray-400 text-xs">Custos do Site</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-1">
              <Trophy className="w-6 h-6 text-blue-400" />
              <span className="text-xs text-gray-500">Prêmio</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">R$ {financeiro.premio}</div>
            <div className="text-gray-400 text-xs">Prêmio Final</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{usuariosAtivos.length}</div>
            <div className="text-gray-400 text-xs">Participantes Ativos</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/30">
            <div className="text-2xl font-bold text-red-400">{usuariosEliminados.length}</div>
            <div className="text-gray-400 text-xs">Participantes Eliminados</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
          <div className="bg-yellow-600/20 px-4 py-2 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-yellow-400" /> Usuários Pendentes ({usuariosPendentes.length})
            </h2>
          </div>
          <div className="p-3">
            {usuariosPendentes.length === 0 ? (
              <p className="text-gray-400 text-center py-2 text-sm">Nenhum usuário aguardando aprovação</p>
            ) : (
              <div className="space-y-2">
                {usuariosPendentes.map(usuario => (
                  <div key={usuario.id} className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                    <div>
                      <div className="text-white text-sm">{usuario.nome}</div>
                      <div className="text-gray-400 text-xs">{usuario.email}</div>
                    </div>
                    <button onClick={() => aprovarUsuario(usuario.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">
                      Aprovar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 mb-6 overflow-hidden">
          <button onClick={() => setMostrarParticipantes(!mostrarParticipantes)} className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/50 to-transparent hover:bg-white/5 transition flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="text-sm font-bold text-white">Todos os Participantes ({todosUsuarios.length})</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Ativos: {usuariosAtivos.length} | Eliminados: {usuariosEliminados.length} | Pendentes: {usuariosPendentes.length}
              </span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${mostrarParticipantes ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {mostrarParticipantes && (
            <div className="p-4 border-t border-white/10">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-white/10 sticky top-0 bg-gray-900">
                    <tr>
                      <th className="text-left py-2 px-2">Nome</th>
                      <th className="text-left py-2 px-2">Email</th>
                      <th className="text-center py-2 px-2">Rodada</th>
                      <th className="text-center py-2 px-2">Status</th>
                      <th className="text-center py-2 px-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2 text-white text-sm">{usuario.nome}</td>
                        <td className="py-2 px-2 text-gray-400 text-xs">{usuario.email}</td>
                        <td className="py-2 px-2 text-center text-yellow-400 text-sm">{usuario.rodada_atual || '-'}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${usuario.status === 'ativo' ? 'bg-green-500/20 text-green-400' : usuario.status === 'eliminado' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {usuario.status === 'ativo' ? 'Ativo' : usuario.status === 'eliminado' ? 'Eliminado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {usuario.status === 'pendente' && (
                            <button onClick={() => aprovarUsuario(usuario.id)} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">
                              Aprovar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {fases.map((fase) => (
            <div key={fase.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button onClick={() => toggleFase(fase.id)} className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/50 to-transparent hover:bg-white/5 transition flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">{fase.nome}</h2>
                  <span className="text-xs text-gray-400">({fase.totalJogos} jogos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{fase.jogos.filter(j => j.finalizado).length}/{fase.totalJogos} finalizados</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${fase.expandida ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {fase.expandida && (
                <div className="p-4 border-t border-white/10">
                  {fase.jogos.length === 0 ? (
                    <p className="text-gray-400 text-center py-4 text-sm">Nenhum jogo cadastrado nesta fase.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-gray-400 border-b border-white/10">
                          <tr>
                            <th className="text-left py-2 px-2">Data/Hora</th>
                            <th className="text-left py-2 px-2">Jogo</th>
                            <th className="text-center py-2 px-2">Placar</th>
                            <th className="text-center py-2 px-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fase.jogos.map((jogo) => (
                            <tr key={jogo.id} className={`border-b border-white/5 hover:bg-white/5 ${jogo.finalizado ? 'opacity-60' : ''}`}>
                              <td className="py-2 px-2 text-gray-400 whitespace-nowrap text-xs">
                                {new Date(jogo.data_hora).toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2 px-2">
                                <div className="text-white text-sm">{jogo.time_casa} x {jogo.time_fora}</div>
                                <div className="text-gray-500 text-xs">{jogo.grupo}</div>
                                {jogo.finalizado && (
                                  <div className="text-yellow-500 text-xs mt-1">
                                    Placar final: {jogo.gols_casa} - {jogo.gols_fora}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                {!jogo.finalizado ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <input type="text" inputMode="numeric" pattern="[0-9]*" id={`gols-casa-${jogo.id}`} placeholder="0" className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-yellow-500" />
                                    <span className="text-yellow-500 text-sm">x</span>
                                    <input type="text" inputMode="numeric" pattern="[0-9]*" id={`gols-fora-${jogo.id}`} placeholder="0" className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-yellow-500" />
                                  </div>
                                ) : (
                                  <div className="text-center text-gray-400 text-sm">
                                    {jogo.gols_casa} - {jogo.gols_fora}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex justify-center gap-2">
                                  {!jogo.finalizado && (
                                    <button onClick={() => {
                                      const golsCasa = document.getElementById(`gols-casa-${jogo.id}`).value;
                                      const golsFora = document.getElementById(`gols-fora-${jogo.id}`).value;
                                      if (golsCasa === '' || golsFora === '') {
                                        alert('Preencha o placar do jogo');
                                        return;
                                      }
                                      processarResultado(jogo.id, parseInt(golsCasa), parseInt(golsFora), jogo.rodada);
                                    }} className="px-2 py-1 rounded text-xs flex items-center gap-1 transition bg-yellow-600 hover:bg-yellow-500 text-white">
                                      <Save className="w-3 h-3" /> Finalizar
                                    </button>
                                  )}
                                  <button onClick={() => { setEditando(jogo); setModalAberto(true); }} className="text-blue-400 hover:text-blue-300" title="Editar">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deletarJogo(jogo.id)} className="text-red-400 hover:text-red-300" title="Deletar">
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
              )}
            </div>
          ))}
        </div>

        {/* ÚLTIMOS ELIMINADOS - VERSÃO SIMPLIFICADA */}
        <div className="mt-6 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="bg-red-600/20 px-4 py-2 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" /> Últimos Eliminados ({eliminados.length})
            </h2>
          </div>
          <div className="p-3">
            {eliminados.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">Nenhum eliminado ainda</p>
            ) : (
              <div className="space-y-2">
                {eliminados.slice(0, 10).map((elim, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-white text-sm font-medium">{elim.nome}</div>
                        <div className="text-gray-400 text-xs">{elim.email}</div>
                      </div>
                      <div className="text-red-400 text-xs">Rodada {elim.rodada_eliminacao || '?'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-5 w-full max-w-md border border-yellow-600/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{editando ? 'Editar Jogo' : 'Novo Jogo'}</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <select value={editando?.time_casa || novoJogo.time_casa} onChange={(e) => editando ? setEditando({...editando, time_casa: e.target.value}) : setNovoJogo({...novoJogo, time_casa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm">
                <option value="">Time Casa</option>
                {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
              <select value={editando?.time_fora || novoJogo.time_fora} onChange={(e) => editando ? setEditando({...editando, time_fora: e.target.value}) : setNovoJogo({...novoJogo, time_fora: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm">
                <option value="">Time Fora</option>
                {timesLista.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
              <input type="datetime-local" value={editando?.data_hora?.slice(0,16) || novoJogo.data_hora} onChange={(e) => editando ? setEditando({...editando, data_hora: e.target.value}) : setNovoJogo({...novoJogo, data_hora: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Rodada" value={editando?.rodada || novoJogo.rodada} onChange={(e) => editando ? setEditando({...editando, rodada: parseInt(e.target.value)}) : setNovoJogo({...novoJogo, rodada: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm" />
                <select value={editando?.grupo || novoJogo.grupo} onChange={(e) => editando ? setEditando({...editando, grupo: e.target.value}) : setNovoJogo({...novoJogo, grupo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm">
                  <option value="Grupos">Grupos</option>
                  <option value="Round of 32">RO32</option>
                  <option value="Oitavas">Oitavas</option>
                  <option value="Quartas">Quartas</option>
                  <option value="Semifinal">Semi</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <button onClick={salvarJogo} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl transition mt-2 text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}