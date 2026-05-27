'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Target, Calendar, Users, ArrowLeft, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export default function ComoFuncionaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
      <header className="bg-black/40 backdrop-blur-md border-b border-yellow-600/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Estrategista da Copa</h1>
          </div>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-white text-center mb-2">Como Funciona</h1>
        <p className="text-center text-gray-400 mb-8">Entenda as regras do bolão e como participar</p>

        {/* Regras principais */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h2 className="text-xl font-bold text-white">Regras Básicas</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li>• 1 palpite por rodada da Copa</li>
              <li>• Cada time pode ser usado apenas uma vez</li>
              <li>• Empate ou derrota = ELIMINAÇÃO</li>
              <li>• Só a vitória mantém o participante vivo</li>
              <li>• Último participante vivo é o campeão</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Prazos</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li>• Palpites até <strong>23h59 do dia anterior</strong> ao jogo</li>
              <li>• Após o prazo, palpite fica bloqueado</li>
              <li>• Você pode alterar seu palpite antes do prazo</li>
              <li>• Acompanhe o contador regressivo na página da rodada</li>
            </ul>
          </div>
        </div>

        {/* Fases da competição */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-500" />
            Fases da Competição
          </h2>
          <div className="space-y-3 text-gray-300">
            <p>• <strong>Rodadas 1, 2, 3:</strong> Fase de Grupos (72 jogos)</p>
            <p>• <strong>Rodada 4:</strong> Round of 32 (32 avos de final)</p>
            <p>• <strong>Rodada 5:</strong> Oitavas de final</p>
            <p>• <strong>Rodada 6:</strong> Quartas de final</p>
            <p>• <strong>Rodada 7:</strong> Semifinal</p>
            <p>• <strong>Rodada 8:</strong> Final</p>
          </div>
        </div>

        {/* Como participar */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Como Participar</h2>
            </div>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>Crie sua conta (cadastro gratuito)</li>
              <li>Faça login no sistema</li>
              <li>No dashboard, escolha seu time para a rodada</li>
              <li>Confirme seu palpite</li>
              <li>Acompanhe seus palpites no histórico</li>
            </ol>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-8 h-8 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Informações Disponíveis</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li>• <strong>Dashboard:</strong> Faça seus palpites</li>
              <li>• <strong>Rodada Atual:</strong> Veja quem já palpitou</li>
              <li>• <strong>Classificação:</strong> Acompanhe os grupos</li>
              <li>• <strong>Mata-mata:</strong> Confira os confrontos</li>
            </ul>
          </div>
        </div>

        {/* Premiação */}
        <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 text-center">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Premiação</h2>
          <p className="text-gray-300">
            Quanto mais participantes, maior o prêmio!<br />
            O último sobrevivente leva <strong>93% do valor arrecadado</strong>.<br />
            Em caso de múltiplos campeões, o prêmio é dividido igualmente.
          </p>
        </div>
      </div>
    </div>
  );
}