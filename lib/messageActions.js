import fetch from "node-fetch";

// Emojis usados como "botões". Pode trocar por emojis customizados do servidor se quiser.
export const BUTTONS = {
  PREV: "⬅️",
  RANDOM: "🔀",
  NEXT: "➡️",
  DELETE: "🗑️",
};

export const BUTTON_ORDER = [BUTTONS.PREV, BUTTONS.RANDOM, BUTTONS.NEXT, BUTTONS.DELETE];

function headers(botToken) {
  return {
    "Content-Type": "application/json",
    "X-Bot-Token": botToken,
  };
}

/**
 * Adiciona uma reação à mensagem (uma chamada por emoji).
 * PUT /channels/{channel}/messages/{message}/reactions/{emoji}
 */
export async function addReaction(apiUrl, botToken, channelId, messageId, emoji) {
  const res = await fetch(
    `${apiUrl}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: "PUT", headers: headers(botToken) }
  );
  if (!res.ok && res.status !== 204) {
    console.error(`[reactions] falha ao adicionar ${emoji}: ${res.status}`);
  }
}

export async function addAllButtons(apiUrl, botToken, channelId, messageId) {
  // em série, pra não tomar rate limit batendo tudo de uma vez
  for (const emoji of BUTTON_ORDER) {
    await addReaction(apiUrl, botToken, channelId, messageId, emoji);
  }
}

/**
 * Remove a reação de um usuário específico, pra "destravar" o botão e ele
 * poder clicar de novo (efeito de botão reutilizável usando reações).
 * DELETE /channels/{channel}/messages/{message}/reactions/{emoji}?user_id=...
 *
 * Importante: o bot precisa da permissão "Manage Messages" no canal pra
 * conseguir remover reações de outras pessoas.
 */
export async function removeUserReaction(apiUrl, botToken, channelId, messageId, emoji, userId) {
  const url = new URL(`${apiUrl}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  url.searchParams.set("user_id", userId);

  const res = await fetch(url, { method: "DELETE", headers: headers(botToken) });
  if (!res.ok && res.status !== 204) {
    console.error(`[reactions] falha ao remover reação de ${userId}: ${res.status}`);
  }
}

/**
 * Edita o conteúdo/embed de uma mensagem já enviada.
 * PATCH /channels/{channel}/messages/{message}
 */
export async function editMessage(apiUrl, botToken, channelId, messageId, { content, embeds }) {
  const res = await fetch(`${apiUrl}/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH",
    headers: headers(botToken),
    body: JSON.stringify({ content, embeds }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao editar mensagem (${res.status}): ${body.slice(0, 200)}`);
  }
}

/**
 * Apaga uma mensagem.
 * DELETE /channels/{channel}/messages/{message}
 */
export async function deleteMessage(apiUrl, botToken, channelId, messageId) {
  const res = await fetch(`${apiUrl}/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
    headers: headers(botToken),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Falha ao apagar mensagem (${res.status})`);
  }
}
