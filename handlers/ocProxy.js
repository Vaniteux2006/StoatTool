import { getOCsByAuthor, getOlderRivals } from './ocStore.js';
import { rebuildAttachments } from './attachmentUtils.js';

// Teto de segmentos por mensagem (evita spam: 1 mensagem virar 50 masquerades).
const MAX_SEGMENTS = 10;

// ─── Parser de segmentos ──────────────────────────────────────────────────────
// Quebra o texto em pedaços, cada um associado a um OC. Permite VÁRIOS OCs numa
// mensagem só, ex:
//   b:Olá, eu sou o Bob
//   a:E eu sou a Alice
// vira [{ oc: Bob, content: "Olá, eu sou o Bob" }, { oc: Alice, content: "..." }].
//
// Regras (mesma ideia do RPTool):
//   • com sufixo  → o trecho vai do prefixo até o sufixo (ex: "[fala do bob]").
//   • sem sufixo  → o trecho vai até a próxima LINHA que comece com o prefixo de
//                   outro OC (ou até o fim da mensagem).
// `ocs` deve vir ordenado por prefixo mais longo primeiro.
function parseSegments(content, ocs) {
    const segments = [];
    let rest = content.trim();

    while (rest.length > 0 && segments.length < MAX_SEGMENTS) {
        let matched = null;
        let inner = '';
        let remaining = '';

        for (const oc of ocs) {
            const prefix = oc.prefix || '';
            const suffix = oc.suffix || '';
            if (prefix && !rest.startsWith(prefix)) continue;
            if (!prefix && !suffix) continue;

            if (suffix) {
                // Procura o sufixo depois do prefixo; se não achar, este OC não casa aqui.
                const suffixIndex = rest.indexOf(suffix, prefix.length);
                if (suffixIndex === -1) continue;
                matched = oc;
                inner = rest.substring(prefix.length, suffixIndex).trim();
                remaining = rest.substring(suffixIndex + suffix.length).trim();
                break;
            }

            // Sem sufixo: vai até a próxima linha que comece com outro prefixo.
            matched = oc;
            let endIndex = rest.length;
            const lines = rest.substring(prefix.length).split('\n');
            let acc = prefix.length;
            for (let i = 0; i < lines.length; i++) {
                if (i > 0) {
                    const trimmed = lines[i].trimStart();
                    const nextOC = ocs.find(o => o.prefix && trimmed.startsWith(o.prefix));
                    if (nextOC) { endIndex = acc; break; }
                }
                acc += lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 pelo '\n'
            }
            inner = rest.substring(prefix.length, endIndex).trim();
            remaining = rest.substring(endIndex).trim();
            break;
        }

        if (matched) {
            segments.push({ oc: matched, content: inner });
            rest = remaining;
        } else {
            // Nada casou no começo deste trecho → pula pra próxima linha.
            const nl = rest.indexOf('\n');
            if (nl === -1) break;
            rest = rest.substring(nl + 1).trimStart();
        }
    }

    return segments;
}

// ─── Proxy de OC (tupper) via Masquerade ──────────────────────────────────────
// Reenvia o conteúdo "como o(s) personagem(ns)" usando o MASQUERADE nativo do
// Revolt (nome + avatar) e apaga a mensagem original. Suporta vários OCs por
// mensagem. Os anexos vão junto do PRIMEIRO segmento enviado.
//
// No Discord (RPTool) isso exige webhooks por canal; no Revolt o masquerade faz
// o mesmo de forma nativa — só precisa da permissão "Masquerade" no canal.
export async function handleOCMessage(client, message) {
    if (message.author?.bot) return false;
    if (message.authorId === client.user?.id) return false;

    const content = typeof message.content === 'string' ? message.content : '';
    if (!content.trim()) return false;

    // OCs do autor que tenham algum padrão; prefixo mais longo primeiro
    // (assim "bb:" ganha de "b:" quando ambos casam).
    const ocs = getOCsByAuthor(message.authorId)
        .filter(oc => oc.prefix || oc.suffix)
        .sort((a, b) => (b.prefix?.length || 0) - (a.prefix?.length || 0));
    if (!ocs.length) return false;

    let segments = parseSegments(content, ocs);
    if (!segments.length) return false;

    // ─── Regra "mais antigo ganha" ────────────────────────────────────────────
    // Em um servidor, se outro dono que está PRESENTE tem um OC mais antigo com o
    // mesmo padrão, este OC perde o conflito e o segmento é descartado (a mensagem
    // original do autor permanece). Em DM não há conflito.
    const server = message.server;
    if (server) {
        segments = segments.filter((seg) => {
            const lost = getOlderRivals(seg.oc)
                .some((rival) => server.members?.cache?.has(rival.adminId));
            if (lost) {
                console.log(`⚔️ Conflito: "${seg.oc.name}" perdeu (OC mais antigo presente com o mesmo padrão).`);
            }
            return !lost;
        });
        if (!segments.length) return false;
    }

    try {
        const channel = message.channel ?? await client.channels.fetch(message.channelId);

        // Reanexa os arquivos da original (baixa + re-upload). Vão no 1º envio.
        let attachments = await rebuildAttachments(message);
        let sentAny = false;

        for (const seg of segments) {
            if (!seg.content) continue; // pula segmentos vazios
            const payload = {
                content: seg.content,
                masquerade: { name: seg.oc.name, avatar: seg.oc.avatar },
            };
            if (attachments.length) {
                payload.attachments = attachments;
                attachments = []; // só no primeiro segmento com texto
            }
            await channel.send(payload);
            sentAny = true;
        }

        // Sobrou anexo e nenhum segmento tinha texto (ex: "b:" + só uma imagem):
        // manda a imagem como o primeiro OC.
        if (attachments.length) {
            const { name, avatar } = segments[0].oc;
            await channel.send({ attachments, masquerade: { name, avatar } });
            sentAny = true;
        }

        if (!sentAny) return false;
        await message.delete().catch(() => {}); // pode falhar sem permissão de apagar
        return true;
    } catch (err) {
        console.error('❌ Erro no proxy de OC (masquerade):', err);
        return false;
    }
}
