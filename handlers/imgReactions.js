import { getSession, touchSession, clearSession } from '../lib/imgSessions.js';
import { resolveImage, buildEmbed } from '../lib/imgRender.js';
import { BTN, BTN_SET } from '../lib/imgButtons.js';

// ─── Navegação do rp!img por reações ──────────────────────────────────────────
// Registra UM listener global de messageReact. Cada reação é checada contra as
// sessões ativas de img; só o dono da busca navega. Tudo dentro de try/catch —
// um erro aqui nunca derruba o bot.
//
// Chamado uma vez no boot (index.js): registerImgReactions(client).
export function registerImgReactions(client) {
    client.on('messageReact', async (msg, emoji, userId) => {
        try {
            if (!msg?.id) return;
            if (userId === client.user?.id) return; // ignora as próprias reações do bot
            if (!BTN_SET.has(emoji)) return; // não é um dos nossos botões

            const session = getSession(msg.id);
            if (!session || !session.message) return; // não é (ou não é mais) uma sessão de img

            // Só quem pediu a busca controla os botões.
            if (userId !== session.ownerId) {
                await session.message.removeReaction(emoji, userId).catch(() => {});
                return;
            }

            if (emoji === BTN.DELETE) {
                clearSession(msg.id);
                await session.message.delete().catch(() => {});
                return;
            }

            const n = session.results.length;
            let target = session.index;
            let dir = 1;
            if (emoji === BTN.PREV) {
                target = session.index - 1;
                dir = -1;
            } else if (emoji === BTN.NEXT) {
                target = session.index + 1;
                dir = 1;
            } else if (emoji === BTN.RANDOM) {
                target = Math.floor(Math.random() * n);
                dir = 1;
            }

            const { index, fileId } = await resolveImage(client, session, target, dir);
            session.index = index;
            touchSession(msg.id);

            await session.message.edit(buildEmbed(session, fileId)).catch((e) =>
                console.error('[imgReactions] falha ao editar o card:', e),
            );
            // Remove a reação do usuário pra "destravar" o botão (poder clicar de novo).
            // Precisa de permissão de gerenciar mensagens; se não tiver, tudo bem.
            await session.message.removeReaction(emoji, userId).catch(() => {});
        } catch (err) {
            console.error('[imgReactions] erro ao processar reação:', err);
        }
    });

    console.log('🖼️  [imgReactions] navegação de imagens registrada.');
}
