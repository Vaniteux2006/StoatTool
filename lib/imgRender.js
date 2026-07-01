import { EmbedBuilder } from '@stoatx/client';
import { fetchRemoteFile, isImageMime } from './fetchRemoteFile.js';

// ─── Render de um resultado do rp!img ─────────────────────────────────────────
// O embed do Stoat exige um fileId do CDN em setMedia() (não aceita URL externa),
// então baixamos a imagem do resultado e subimos pro CDN. Guardamos o fileId em
// cache por índice (session.fileIds) pra não re-subir ao navegar de volta, e
// marcamos índices problemáticos (imagem morta/grande/não-imagem) em session.dead
// pra pular automaticamente.

const MAX_IMG_MB = 8;
const MAX_SKIP = 8; // no máximo tantas tentativas ao pular imagens quebradas

/**
 * Garante uma imagem exibível a partir de `startIndex`, andando na direção `dir`
 * (+1 pra frente, -1 pra trás) e pulando resultados quebrados.
 * @returns {Promise<{ index: number, fileId: string }>}
 */
export async function resolveImage(client, session, startIndex, dir = 1) {
    const n = session.results.length;
    session.dead ??= new Set();

    for (let step = 0; step < Math.min(n, MAX_SKIP); step++) {
        const i = (((startIndex + dir * step) % n) + n) % n;
        if (session.dead.has(i)) continue;

        // Já subimos essa? Reusa.
        if (session.fileIds[i]) return { index: i, fileId: session.fileIds[i] };

        try {
            const { buffer, filename, contentType } = await fetchRemoteFile(session.results[i].image, {
                maxBytes: MAX_IMG_MB * 1024 * 1024,
            });
            if (!isImageMime(contentType)) throw new Error('não é imagem');

            const fileId = await client.rest.uploadFile('attachments', buffer, filename || 'img');
            session.fileIds[i] = fileId;
            return { index: i, fileId };
        } catch (err) {
            // Imagem morta/grande/bloqueada → marca e tenta a próxima.
            console.warn(`[img] resultado ${i} falhou (${err.message}); pulando.`);
            session.dead.add(i);
        }
    }

    throw new Error('não consegui carregar as imagens dessa busca (links quebrados).');
}

export function buildEmbed(session, fileId) {
    const { results, index, query, ownerId } = session;
    const item = results[index];

    const footer = `Resultado ${index + 1}/${results.length} • busca: ${query}`;
    const desc = (item.page ? `${item.page}\n\n*${footer}*` : `*${footer}*`).slice(0, 1000);

    const embed = new EmbedBuilder()
        .setTitle((item.title || query).slice(0, 100))
        .setColor('#3399ff')
        .setDescription(desc)
        .setMedia(fileId);

    return { content: `🔎 pedido por <@${ownerId}>`, embeds: [embed] };
}
