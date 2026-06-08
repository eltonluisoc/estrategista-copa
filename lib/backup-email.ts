import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const sql = neon(process.env.DATABASE_URL!);

export async function enviarBackupPorEmail() {
  try {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR');

    // Buscar jogos do dia
    const inicioDia = new Date(hoje);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const jogos = await sql`
      SELECT id, time_casa, time_fora, data_hora
      FROM jogos 
      WHERE data_hora BETWEEN ${inicioDia.toISOString()} AND ${fimDia.toISOString()}
    `;

    // Buscar palpites do dia
    let palpitesTexto = '';
    let totalPalpites = 0;

    // Buscar total de participantes ativos
    const ativosResult = await sql`
      SELECT COUNT(*) as total FROM usuarios WHERE status = 'ativo' AND email != 'admin@estrategista.com'
    `;
    const totalAtivos = ativosResult[0]?.total || 0;

    if (jogos.length === 0) {
      palpitesTexto = 'Nenhum jogo programado para hoje. Nenhum palpite registrado.';
    } else {
      for (const jogo of jogos) {
        const palpites = await sql`
          SELECT u.nome, t.nome as palpite, p.data_palpite
          FROM palpites p
          JOIN usuarios u ON u.id = p.usuario_id
          JOIN times t ON t.id = p.time_id
          WHERE p.rodada = (SELECT rodada FROM jogos WHERE id = ${jogo.id})
            AND (t.nome = ${jogo.time_casa} OR t.nome = ${jogo.time_fora})
          ORDER BY u.nome
        `;

        if (palpites.length > 0) {
          totalPalpites += palpites.length;
          palpitesTexto += `\n📋 ${jogo.time_casa} x ${jogo.time_fora}\n`;
          palpitesTexto += `   📅 ${new Date(jogo.data_hora).toLocaleString('pt-BR')}\n`;
          palpitesTexto += `   ${'-'.repeat(40)}\n`;
          palpites.forEach((p, idx) => {
            palpitesTexto += `   ${idx + 1}. ${p.nome} → ${p.palpite}\n`;
          });
          palpitesTexto += `\n`;
        }
      }
    }

    // Calcular hash ANTES de montar o conteúdo do email
    const hashBase = `${dataFormatada}|${jogos.length}|${totalPalpites}|${totalAtivos}`;
    const hash = createHash('sha256').update(hashBase).digest('hex').substring(0, 16);

    // Montar conteúdo do email (sem referência circular)
    const conteudo = `
📊 BACKUP DIÁRIO - ESTRATEGISTA DA COPA 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data: ${dataFormatada}
🕐 Gerado em: ${hoje.toLocaleTimeString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${palpitesTexto}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMO:
├─ Jogos do dia: ${jogos.length}
├─ Total de palpites: ${totalPalpites}
└─ Participantes ativos: ${totalAtivos}

🔐 Hash: ${hash}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Documento gerado automaticamente pelo sistema Estrategista da Copa
    `;

    // Enviar email
    await resend.emails.send({
      from: 'Estrategista da Copa <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL!],
      subject: `📊 Backup Diário - ${dataFormatada} - ${jogos.length} jogos, ${totalPalpites} palpites`,
      text: conteudo,
    });

    console.log(`✅ Backup enviado para ${process.env.ADMIN_EMAIL}`);
    return { success: true, jogos: jogos.length, palpites: totalPalpites };
  } catch (error) {
    console.error('❌ Erro no backup:', error);
    return { success: false, error: String(error) };
  }
}