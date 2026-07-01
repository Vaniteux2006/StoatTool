import { EmbedBuilder } from '@stoatx/client';
import { fetchRemoteFile, isImageMime } from '../../lib/fetchRemoteFile.js';

const URL_REGEX = /^https?:\/\/\S+$/i;

// ─── rp!img <link> [legenda] ──────────────────────────────────────────────────
// Exibe uma imagem de um link (ou de um anexo da própria mensagem) num card
// (embed). A imagem é baixada e re-hospedada no CDN do Stoat, então continua
// aparecendo mesmo que o link original saia do ar depois.
//
// Detalhe da lib: embed.setMedia() precisa de um fileId do CDN, não de uma URL
// externa. Por isso subimos o arquivo com client.rest.uploadFile() antes.
export default {
    name: 'img',
    aliases: ['imagem', 'image'],
    description: 'Exibe uma imagem de um link num card. Ex: rp!img https://site.com/gato.png',

    async execute(message, args, client) {
        // Link no texto? Se não, usa o primeiro anexo de imagem da mensagem.
        let url = args.find((a) => URL_REGEX.test(a));
        const legenda = args.filter((a) => a !== url).join(' ').trim();

        if (!url && message.attachments?.length) {
            url = message.attachments[0].url;
        }

        if (!url) {
            await message
                .reply('Manda o **link da imagem** (ou anexe uma). Ex: `rp!img https://site.com/gato.png`')
                .catch(() => {});
            return;
        }

        let status = null;
        try {
            status = await message.reply('🖼️ Carregando imagem...');
        } catch (err) {
            console.error('[img] não consegui mandar o status:', err);
        }

        try {
            const { buffer, filename, contentType } = await fetchRemoteFile(url);

            if (!isImageMime(contentType)) {
                throw new Error('esse link não parece ser uma imagem.');
            }

            // Sobe pro CDN pra conseguir o fileId que o embed exige.
            const fileId = await client.rest.uploadFile('attachments', buffer, filename);

            const embed = new EmbedBuilder()
                .setTitle((legenda || filename).slice(0, 100))
                .setColor('#3399ff')
                .setMedia(fileId);
            if (legenda) embed.setDescription(legenda);

            const channel = message.channel ?? (await client.channels.fetch(message.channelId));
            await channel.send({ embeds: [embed] });

            if (status) await status.delete().catch(() => {});
        } catch (err) {
            console.error('[img] falhou ao exibir a imagem:', err);
            const aviso = `❌ Não consegui exibir a imagem: ${err.message}`;
            if (status) await status.edit(aviso).catch(() => {});
            else await message.reply(aviso).catch(() => {});
        }
    },
};
