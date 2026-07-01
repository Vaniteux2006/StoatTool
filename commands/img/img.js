import { searchImages } from "../lib/imageSearch.js";
import { createSession } from "../lib/imgSessionStore.js";
import { addAllButtons } from "../lib/messageActions.js";

/**
 * Monta o payload de embed pro índice atual da sessão, no estilo do card do NotSoBot:
 * autor da busca, título da página de origem, link, imagem grande e rodapé "Página X/Y".
 */
export function buildImageEmbed(session) {
  const { results, index, query, ownerId } = session;
  const item = results[index];

  const footerText = `Página ${index + 1}/${results.length} • ${item.displayLink}`;

  return {
    content: `🔎 Resultado para **${query}** — pedido por <@${ownerId}>`,
    embeds: [
      {
        type: "Text",
        title: item.title.slice(0, 250),
        // O footer "Página X/Y" entra junto da descrição, já que SendableEmbed
        // no Stoat não tem um campo de footer dedicado.
        description: `${item.contextLink}\n\n*${footerText}*`,
        url: item.contextLink,
        media: item.link, // imagem exibida no card
        colour: "#3399ff",
      },
    ],
  };
}

/**
 * @param {import("stoat.js").Message} message
 * @param {string[]} args
 * @param {{apiUrl: string, botToken: string, imagesPerSearch: number}} config
 */
export async function handleImg(message, args, config) {
  const query = args.join(" ").trim();

  if (!query) {
    await message.reply({ content: "Manda assim: `rp!img Relâmpago Marquinhos`" });
    return;
  }

  const statusMsg = await message.channel.sendMessage(`🔎 Procurando "${query}"...`);

  let results;
  try {
    results = await searchImages(query, { count: config.imagesPerSearch });
  } catch (err) {
    console.error("[rp!img] erro na busca:", err);
    await statusMsg.edit({ content: `❌ Não consegui buscar imagens: ${err.message}` }).catch(() => {});
    return;
  }

  if (results.length === 0) {
    await statusMsg.edit({ content: `❌ Nenhuma imagem encontrada para "${query}".` }).catch(() => {});
    return;
  }

  const channelId = message.channel_id ?? message.channel.id;
  const ownerId = message.author_id;

  // sessão provisória só pra montar o primeiro embed (ainda sem messageId real)
  let session = { results, index: 0, query, ownerId, channelId };
  const { content, embeds } = buildImageEmbed(session);

  const sentMessage = await message.channel.sendMessage({ content, embeds });
  await statusMsg.delete().catch(() => {});

  const messageId = sentMessage._id ?? sentMessage.id;

  // agora registra a sessão de verdade, indexada pelo ID real da mensagem
  createSession({ messageId, channelId, ownerId, query, results });

  await addAllButtons(config.apiUrl, config.botToken, channelId, messageId);
}
