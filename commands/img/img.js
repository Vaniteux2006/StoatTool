import { searchImages } from '../../lib/imageSearch.js';
import { resolveImage, buildEmbed } from '../../lib/imgRender.js';
import { createSession } from '../../lib/imgSessions.js';
import { BTN_ORDER } from '../../lib/imgButtons.js';

// ─── rp!img <busca> ───────────────────────────────────────────────────────────
// Busca imagens no Bing e mostra num card navegável com botões de reação
// (⬅️ anterior, 🔀 aleatório, ➡️ próximo, 🗑️ apagar), estilo NotSoBot.
// A navegação em si é tratada em handlers/imgReactions.js.
export default {
    name: 'img',
    aliases: ['imagem', 'image'],
    description: 'Busca imagens e mostra num card navegável. Ex: rp!img gato preto',

    async execute(message, args, client) {
        const query = args.join(' ').trim();

        if (!query) {
            await message.reply('O que você quer buscar? Ex: `rp!img gato preto`').catch(() => {});
            return;
        }

        let status = null;
        try {
            status = await message.reply(`🔎 Buscando "${query}"...`);
        } catch (err) {
            console.error('[img] não consegui mandar o status:', err);
        }

        try {
            const results = await searchImages(query);
            if (!results.length) {
                const aviso = `❌ Nada encontrado pra "${query}".`;
                if (status) await status.edit(aviso).catch(() => {});
                else await message.reply(aviso).catch(() => {});
                return;
            }

            // Sessão montada antes de enviar; o handler de reações vê o mesmo objeto.
            const session = {
                results,
                index: 0,
                query,
                ownerId: message.authorId,
                channelId: message.channelId,
                fileIds: {},
                dead: new Set(),
                message: null,
            };

            // Resolve a primeira imagem exibível (pula quebradas a partir do índice 0).
            const { index, fileId } = await resolveImage(client, session, 0, 1);
            session.index = index;

            const channel = message.channel ?? (await client.channels.fetch(message.channelId));
            const sent = await channel.send(buildEmbed(session, fileId));
            session.message = sent;

            createSession(sent.id, session);
            if (status) await status.delete().catch(() => {});

            // Adiciona os botões (em série, pra não tomar rate limit).
            for (const emoji of BTN_ORDER) {
                await sent.react(emoji).catch((e) => console.warn(`[img] não reagiu ${emoji}:`, e.message));
            }
        } catch (err) {
            console.error('[img] falhou na busca:', err);
            const aviso = `❌ Deu ruim na busca: ${err.message}`;
            if (status) await status.edit(aviso).catch(() => {});
            else await message.reply(aviso).catch(() => {});
        }
    },
};
