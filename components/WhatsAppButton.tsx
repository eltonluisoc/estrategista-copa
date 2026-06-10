'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/EIfDnDerrlG5bChfSY2wDK";

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium"
    >
      <MessageCircle className="w-4 h-4" />
      <span>Entrar no Grupo do WhatsApp</span>
    </a>
  );
}

export function WhatsAppBanner() {
  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
      <MessageCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
      <h3 className="text-white font-bold mb-1">📱 Fique por dentro!</h3>
      <p className="text-gray-300 text-sm mb-3">
        Receba atualizações importantes, resultados e avisos em tempo real
      </p>
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg transition font-medium"
      >
        <MessageCircle className="w-4 h-4" />
        Entrar no Grupo Oficial
      </a>
    </div>
  );
}