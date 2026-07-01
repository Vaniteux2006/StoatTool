import { getSession, touchSession, clearSession } from "./imgSessionStore.js";
import { buildImageEmbed } from "../commands/img.js";
import { BUTTONS, editMessage, deleteMessage, removeUserReaction } from "./messageActions.js";

/**
 * Deve ser chamado sempre que uma reação for adicionada a uma mensagem.
 * Ignora tudo que não for uma sessão ativa de "rp!img", reação do próprio bot,
 * ou clique de alguém que não foi quem pediu a busca.
 *
 * @param {{channelId: string, messageId: string, userId: string, emoji: string}} reaction
 * @param {{apiUrl: string, botToken: string, botUserId: string}} config
 */
export async function handleImgReaction(reaction, config) {
  const { channelId, messageId, userId, emoji } = reaction;

  if (userId === config.botUserId) return; // ignora as próprias reações do bot
  if (!Object.values(BUTTONS).includes(emoji)) return; // não é um dos nossos botões

  const session = getSession(messageId);
  if (!session) return; // não é (ou não é mais) uma sessão de img ativa

  // só quem pediu a busca pode usar os botões
  if (userId !== session.ownerId) {
    await removeUserReaction(config.apiUrl, config.botToken, channelId, messageId, emoji, userId);
    return;
  }

  if (emoji === BUTTONS.DELETE) {
    clearSession(messageId);
    await deleteMessage(config.apiUrl, config.botToken, channelId, messageId);
    return;
  }

  const total = session.results.length;

  if (emoji === BUTTONS.PREV) {
    session.index = (session.index - 1 + total) % total;
  } else if (emoji === BUTTONS.NEXT) {
    session.index = (session.index + 1) % total;
  } else if (emoji === BUTTONS.RANDOM) {
    session.index = Math.floor(Math.random() * total);
  }

  touchSession(messageId);

  const { content, embeds } = buildImageEmbed(session);

  await Promise.all([
    editMessage(config.apiUrl, config.botToken, channelId, messageId, { content, embeds }),
    // "destrava" o botão removendo a reação do usuário, pra ele poder clicar de novo
    removeUserReaction(config.apiUrl, config.botToken, channelId, messageId, emoji, userId),
  ]);
}
