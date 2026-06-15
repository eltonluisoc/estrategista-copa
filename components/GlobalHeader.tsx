'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Trophy, LogOut, LogIn, Home, Users, Shield, Award, BarChart3 } from 'lucide-react';

export function GlobalHeader() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === 'admin@estrategista.com';

  return (
    <>
      <div className="bg-black/30 text-center py-1 text-[10px] text-gray-500">
        Versão: v11
      </div>
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tighter">
                Estrategista<span className="text-yellow-500"> da Copa</span>
              </h1>
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link href="/" className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                <Home className="w-4 h-4" /> Início
              </Link>
              
              <Link href="/" className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                <Users className="w-4 h-4" /> Ranking
              </Link>

              <Link href="/premiacao" className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                <Award className="w-4 h-4" /> Premiação
              </Link>

              {/* NOVO LINK EVOLUÇÃO */}
              <Link href="/evolucao" className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                <BarChart3 className="w-4 h-4" /> Evolução
              </Link>

              {session ? (
                <>
                  {!isAdmin && (
                    <Link href="/dashboard" className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                      <Trophy className="w-4 h-4" /> Meus Palpites
                    </Link>
                  )}
                  
                  {isAdmin && (
                    <Link href="/admin" className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                      <Shield className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </>
              ) : (
                <Link href="/login" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                  <LogIn className="w-4 h-4" /> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}