import { AttachmentBuilder } from '@stoatx/client';
import { fetchRemoteFile } from '../../lib/fetchRemoteFile.js';

// Aceita qualquer palavra que seja um link http(s).
const URL_REGEX = /^https?:\/\/\S+$/i;

// ─── rp!dl <link> ─────────────────────────────────────────────────────────────
// Baixa um arquivo de um LINK DIRETO (imagem, vídeo, mp3, pdf...) e reenvia como
// anexo no canal. Não é downloader de YouTube/Insta/TikTok — pra isso a URL teria
// que ser um link direto do arquivo, não a página do site.
export default {
    name: 'dl',
    aliases: ['baixar', 'download'],
    description: 'Baixa um arquivo de um link direto e reenvia como anexo. Ex: rp!dl https://site.com/video.mp4',

    async execute(message, args, client) {
        const url = args.find((a) => URL_REGEX.test(a));

        if (!url) {
            await message
                .reply('Manda um **link direto** pro arquivo. Ex: `rp!dl https://site.com/foto.png`')
                .catch(() => {});
            return;
        }

        // Mensagem de status; se nem isso der, seguimos sem ela.
        let status = null;
        try {
            status = await message.reply('⏳ Baixando...');
        } catch (err) {
            console.error('[dl] não consegui mandar o status:', err);
        }

        try {
            const { buffer, filename } = await fetchRemoteFile(url);

            const channel = message.channel ?? (await client.channels.fetch(message.channelId));
            await channel.send({
                content: `📎 **${filename}** — a pedido de <@${message.authorId}>`,
                attachments: [new AttachmentBuilder(buffer, filename)],
            });

            if (status) await status.delete().catch(() => {});
        } catch (err) {
            // err.message já vem "amigável" do fetchRemoteFile (ex: HTTP 404, grande demais).
            console.error('[dl] falhou ao baixar/enviar:', err);
            const aviso = `❌ Não consegui baixar esse arquivo: ${err.message}`;
            if (status) await status.edit(aviso).catch(() => {});
            else await message.reply(aviso).catch(() => {});
        }
    },
};
