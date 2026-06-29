import { AttachmentBuilder } from '@stoatx/client';

// Teto de segurança por anexo (evita baixar arquivos gigantes).
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Re-upload de anexos ──────────────────────────────────────────────────────
// Baixa os anexos de uma mensagem (a partir da URL do CDN) e devolve
// AttachmentBuilders prontos pra reenviar em outra mensagem. É o que permite
// "falar como o OC mandando uma imagem junto": baixamos o arquivo original e
// reenviamos no novo send (que faz upload pro CDN e anexa).
export async function rebuildAttachments(message) {
    const sources = message.attachments ?? [];
    const builders = [];

    for (const att of sources) {
        try {
            const res = await fetch(att.url);
            if (!res.ok) {
                console.warn(`⚠️ Falha ao baixar anexo ${att.filename} (HTTP ${res.status}).`);
                continue;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            if (buffer.length > MAX_BYTES) {
                console.warn(`⚠️ Anexo ${att.filename} ignorado (maior que ${MAX_BYTES} bytes).`);
                continue;
            }
            builders.push(new AttachmentBuilder(buffer, att.filename));
        } catch (err) {
            console.error(`❌ Erro ao baixar anexo ${att?.filename}:`, err);
        }
    }

    return builders;
}
