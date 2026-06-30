import fetch from "node-fetch";

/**
 * Agendamento 100% em memória — nenhum dado é persistido em disco/DB.
 * Cada vídeo enviado agenda seu próprio setTimeout pra apagar a mensagem
 * depois de RETENTION_DAYS. Se o processo do bot reiniciar, agendamentos
 * pendentes são perdidos (a mensagem antiga simplesmente não será apagada).
 */

/**
 * Apaga a mensagem no Stoat via REST (DELETE /channels/:channel/messages/:id).
 */
async function deleteMessage(channelId, messageId, { apiUrl, botToken }) {
  const res = await fetch(`${apiUrl}/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
    headers: { "X-Bot-Token": botToken },
  });

  // 404 = mensagem já não existe (apagada manualmente, por exemplo), tudo bem.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Falha ao apagar mensagem ${messageId} (${res.status})`);
  }
}

/**
 * Agenda a exclusão de uma mensagem específica depois de `retentionDays`.
 * Não grava nada em disco: o agendamento existe só enquanto o processo Node estiver rodando.
 */
export function scheduleMessageDeletion({ channelId, messageId, retentionDays, apiUrl, botToken }) {
  const delayMs = retentionDays * 24 * 60 * 60 * 1000;

  // setTimeout aceita no máximo ~24.8 dias (limite de int32 do Node).
  // Pra retenções longas, encadeamos timeouts menores até bater o prazo total.
  const MAX_TIMEOUT = 2_147_483_000; // ~24.8 dias em ms

  const fire = async (remainingMs) => {
    if (remainingMs > MAX_TIMEOUT) {
      setTimeout(() => fire(remainingMs - MAX_TIMEOUT), MAX_TIMEOUT);
      return;
    }

    setTimeout(async () => {
      try {
        await deleteMessage(channelId, messageId, { apiUrl, botToken });
        console.log(`[cleanup] vídeo expirado removido: ${messageId}`);
      } catch (err) {
        console.error(`[cleanup] erro ao apagar mensagem ${messageId}:`, err.message);
      }
    }, remainingMs);
  };

  fire(delayMs);
}
