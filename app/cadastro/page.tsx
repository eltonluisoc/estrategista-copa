'use client';

import { useState } from 'react';
import { Trophy, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha: password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Erro ao cadastrar');
      }
    } catch (error) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-center border border-white/10">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Cadastro realizado!</h1>
          <p className="text-gray-300 mb-6">
            Sua conta foi criada com sucesso!
          </p>
          <Link
            href="/login"
            className="inline-block bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/10">
        
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white mb-6 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex justify-center mb-6">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Criar conta
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Cadastre-se para participar do bolão
        </p>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="Seu nome"
                required
              />
            </div>
          </div>

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

          <div>
            <label className="block text-gray-300 mb-1 text-sm">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 text-sm">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-6">
          Ao criar uma conta, você concorda com as regras do bolão.
        </p>

        <div className="text-center mt-4">
          <Link href="/login" className="text-yellow-500 hover:text-yellow-400 text-sm transition">
            Já tem conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}