// ─── Sessões do rp!img (só em memória) ────────────────────────────────────────
// key: messageId do card de resultados
// value: { results, index, query, ownerId, channelId, fileIds, dead, message, timeout }
// Se o bot reiniciar, as sessões somem (os botões de buscas antigas param de
// funcionar — esperado, sem persistência).

const sessions = new Map();
const IDLE_MS = 10 * 60 * 1000; // expira sozinha após 10 min sem uso

/** Guarda o PRÓPRIO objeto session (não uma cópia), pra o handler ver as mutações. */
export function createSession(messageId, session) {
    clearSession(messageId);
    session.timeout = setTimeout(() => sessions.delete(messageId), IDLE_MS);
    sessions.set(messageId, session);
    return session;
}

export function getSession(messageId) {
    return sessions.get(messageId);
}

export function touchSession(messageId) {
    const s = sessions.get(messageId);
    if (!s) return;
    clearTimeout(s.timeout);
    s.timeout = setTimeout(() => sessions.delete(messageId), IDLE_MS);
}

export function clearSession(messageId) {
    const s = sessions.get(messageId);
    if (s) clearTimeout(s.timeout);
    sessions.delete(messageId);
}
