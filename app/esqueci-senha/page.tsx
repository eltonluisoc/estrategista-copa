'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Se o email existir, você receberá um link de recuperação.' });
        setEmail('');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao enviar solicitação' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/10">
        
        <Link href="/login" className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar para o login
        </Link>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Esqueci minha senha</h1>
        <p className="text-gray-400 text-center mb-6">Digite seu e-mail para receber um link de recuperação</p>

        {mensagem && (
          <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${mensagem.tipo === 'sucesso' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{mensagem.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      </div>
    </div>
  );
}