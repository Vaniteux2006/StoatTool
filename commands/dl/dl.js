import { AttachmentBuilder } from '@stoatx/client';
import fs from 'node:fs';
import { downloadVideo, cleanupFile } from '../../lib/videoDownloader.js';

const URL_REGEX = /^https?:\/\/\S+$/i;
const MAX_MB = 19; // limite prático de anexo do chat

// ─── rp!dl <link> ─────────────────────────────────────────────────────────────
// Baixa o VÍDEO de um link (YouTube, TikTok, X/Twitter, Reddit e ~1000 sites via
// yt-dlp) e posta como anexo tocável no chat, estilo NotSoBot.
// Instagram exige cookies de login — ver lib/videoDownloader.js (resolveCookies).
export default {
    name: 'dl',
    aliases: ['baixar', 'download'],
    description: 'Baixa o vídeo de um link e posta no chat (YouTube, TikTok, X, etc.). Ex: rp!dl <link>',

    async execute(message, args, client) {
        const url = args.find((a) => URL_REGEX.test(a));

        if (!url) {
            await message
                .reply('Manda o **link do vídeo**. Ex: `rp!dl https://www.tiktok.com/@user/video/123`')
                .catch(() => {});
            return;
        }

        let status = null;
        try {
            status = await message.reply('⏳ Baixando vídeo...');
        } catch (err) {
            console.error('[dl] não consegui mandar o status:', err);
        }

        let filePath = null;
        try {
            const result = await downloadVideo(url, { maxMB: MAX_MB });
            filePath = result.filePath;

            if (status) await status.edit('⏫ Enviando pro chat...').catch(() => {});

            const buffer = await fs.promises.readFile(filePath);
            const channel = message.channel ?? (await client.channels.fetch(message.channelId));
            await channel.send({
                content: `🎬 a pedido de <@${message.authorId}>`,
                attachments: [new AttachmentBuilder(buffer, 'video.mp4')],
            });

            if (status) await status.delete().catch(() => {});
        } catch (err) {
            // err.message já vem tratado do videoDownloader (login, tamanho, etc.).
            console.error('[dl] falhou:', err);
            const aviso = `❌ Não consegui baixar esse vídeo: ${err.message}`;
            if (status) await status.edit(aviso).catch(() => {});
            else await message.reply(aviso).catch(() => {});
        } finally {
            // O arquivo temporário não é mais necessário depois do upload.
            if (filePath) cleanupFile(filePath);
        }
    },
};
