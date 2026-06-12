'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

function RedefinirContent() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

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
    const res = await fetch('/api/auth/redefinir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, novaSenha }),
    });

    const data = await res.json();
    if (res.ok) {
      setMensagem({ tipo: 'sucesso', texto: 'Senha alterada! Redirecionando para o login...' });
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao redefinir senha' });
    }
    setLoading(false);
  };

  if (!token) {
    return <p className="text-center text-red-400">Token inválido ou ausente.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/10">
        <div className="flex justify-center mb-6"><Shield className="w-12 h-12 text-yellow-500" /></div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Redefinir senha</h1>

        {mensagem && (
          <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${mensagem.tipo === 'sucesso' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{mensagem.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white" required minLength={6} />
          <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Confirmar nova senha" className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white" required />
          <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition disabled:opacity-50">
            {loading ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
        <Link href="/login" className="block text-center text-gray-400 hover:text-white text-sm mt-4">Voltar para o login</Link>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center"><p className="text-white">Carregando...</p></div>}><RedefinirContent /></Suspense>);
}