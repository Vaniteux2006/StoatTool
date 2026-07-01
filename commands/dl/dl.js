import { downloadVideo, cleanupLocalFile } from "../../lib/downloader.js";
import { uploadToAutumn } from "../../lib/uploader.js";
import { scheduleMessageDeletion } from ".././lib/cleanup.js";

const URL_REGEX = /https?:\/\/\S+/i;

/**
 * @param {import("stoat.js").Message} message
 * @param {string[]} args
 * @param {{apiUrl: string, botToken: string, maxFilesizeMB: number, retentionDays: number}} config
 */
export async function handleDl(message, args, config) {
  const url = args.find((a) => URL_REGEX.test(a));

  if (!url) {
    await message.reply({
      content: "Manda assim: `rp!dl https://...` (Instagram, YouTube, X, TikTok, etc.)",
    });
    return;
  }

  const statusMsg = await message.channel.sendMessage("⏳ Baixando vídeo...");

  let filePath;
  try {
    const result = await downloadVideo(url, config.maxFilesizeMB);
    filePath = result.filePath;

    await statusMsg.edit({ content: "⏳ Subindo pro chat..." });

    const attachmentId = await uploadToAutumn(filePath, "video.mp4", {
      apiUrl: config.apiUrl,
      botToken: config.botToken,
    });

    const sentMessage = await message.channel.sendMessage({
      content: `🎬 Baixado a pedido de <@${message.author_id}>\nFonte: ${url}\n*(este vídeo será removido automaticamente em ${config.retentionDays} dias)*`,
      attachments: [attachmentId],
    });

    // Agenda a exclusão futura só em memória — nada é salvo em disco/DB.
    scheduleMessageDeletion({
      channelId: message.channel_id ?? message.channel.id,
      messageId: sentMessage._id ?? sentMessage.id,
      retentionDays: config.retentionDays,
      apiUrl: config.apiUrl,
      botToken: config.botToken,
    });

    await statusMsg.delete().catch(() => {});
  } catch (err) {
    console.error("[rp!dl] erro:", err);
    await statusMsg
      .edit({ content: `❌ Não consegui baixar esse vídeo: ${err.message}` })
      .catch(() => {});
  } finally {
    // O arquivo local não é mais necessário depois do upload (já está no Autumn),
    // então apagamos imediatamente pra não acumular nada em disco.
    if (filePath) cleanupLocalFile(filePath);
  }
}
