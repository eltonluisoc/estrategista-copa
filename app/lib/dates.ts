// Função para criar data no horário de Brasília (UTC-3)
export function criarDataBrasilia(ano: number, mes: number, dia: number, hora: number = 23, minuto: number = 59): Date {
  // Criar data no formato ISO com fuso -03:00
  const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-03:00`;
  return new Date(dataStr);
}

// Calcular prazo (23:59 do dia anterior) no horário de Brasília
export function calcularPrazoBrasilia(dataHora: Date): Date {
  const ano = dataHora.getFullYear();
  const mes = dataHora.getMonth() + 1;
  const dia = dataHora.getDate() - 1; // dia anterior
  return criarDataBrasilia(ano, mes, dia, 23, 59);
}

// Formatar data para exibição (brasileiro)
export function formatarDataBrasilia(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Verificar se o prazo já expirou (considerando Brasília)
export function prazoExpirado(prazo: Date): boolean {
  const agora = new Date();
  const agoraBrasilia = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const prazoBrasilia = new Date(prazo.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return agoraBrasilia > prazoBrasilia;
}