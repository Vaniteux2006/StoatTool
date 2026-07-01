/**
 * Estado das sessões de "rp!img" — vive só na RAM do processo.
 * Nada aqui é gravado em arquivo ou banco de dados. Se o bot reiniciar,
 * as sessões em andamento somem (os botões de uma busca antiga param de
 * funcionar, o que é esperado nesse modelo sem persistência).
 *
 * key: messageId da mensagem com os resultados
 * value: { results, index, ownerId, channelId, query, timeout }
 */
const sessions = new Map();

const IDLE_MS = 15 * 60 * 1000; // sessão expira sozinha depois de 15 min sem uso

export function createSession({ messageId, channelId, ownerId, query, results }) {
  clearSession(messageId);

  const session = {
    results,
    index: 0,
    ownerId,
    channelId,
    query,
    timeout: null,
  };

  session.timeout = setTimeout(() => sessions.delete(messageId), IDLE_MS);
  sessions.set(messageId, session);
  return session;
}

export function getSession(messageId) {
  return sessions.get(messageId);
}

/**
 * Renova o timer de expiração toda vez que a sessão é usada (evita expirar
 * no meio de alguém navegando ativamente).
 */
export function touchSession(messageId) {
  const session = sessions.get(messageId);
  if (!session) return;
  clearTimeout(session.timeout);
  session.timeout = setTimeout(() => sessions.delete(messageId), IDLE_MS);
}

export function clearSession(messageId) {
  const session = sessions.get(messageId);
  if (session) clearTimeout(session.timeout);
  sessions.delete(messageId);
}
