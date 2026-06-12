'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GlobalHeader } from '@/components/GlobalHeader';

export default function AlterarSenhaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    // Se não estiver logado, redireciona para login
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (novaSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/alterar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso! Redirecionando...' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao alterar senha' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão' });
    }

    setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <GlobalHeader />
      <div className="container mx-auto px-4 py-12 max-w-md">
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="flex justify-center mb-6">
            <Shield className="w-16 h-16 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Alterar Senha
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Digite sua nova senha
          </p>

          {mensagem && (
            <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-green-500/20 border border-green-500 text-green-400' 
                : 'bg-red-500/20 border border-red-500 text-red-400'
            }`}>
              {mensagem.tipo === 'sucesso' 
                ? <CheckCircle className="w-4 h-4" /> 
                : <AlertCircle className="w-4 h-4" />}
              <p className="text-sm">{mensagem.texto}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1 text-sm">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Voltar ao dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}