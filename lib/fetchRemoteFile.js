import path from 'node:path';

// ─── Download de arquivo remoto ───────────────────────────────────────────────
// Baixa o conteúdo de um link direto (http/https) pra um Buffer, com teto de
// tamanho, e descobre um nome de arquivo razoável. Usado pelos comandos `dl`
// (reenviar como anexo) e `img` (exibir imagem num card).
//
// Node 24 já tem `fetch` global — não precisa de node-fetch nem pacote nenhum.

// Teto de segurança: o CDN do Stoat (Autumn) costuma limitar uploads perto disso.
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

// Extensão de reserva quando a URL não tem uma (ex: .../download?id=123).
const EXT_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
};

const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

/**
 * @param {string} url
 * @param {{ maxBytes?: number }} [opts]
 * @returns {Promise<{ buffer: Buffer, filename: string, contentType: string }>}
 */
export async function fetchRemoteFile(url, { maxBytes = MAX_BYTES } = {}) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('essa URL não é válida.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('só aceito links http/https.');
    }

    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
        throw new Error(`o servidor respondeu HTTP ${res.status}.`);
    }

    // Se o servidor já anuncia o tamanho e ele estoura o teto, nem baixa.
    const declared = Number(res.headers.get('content-length'));
    if (declared && declared > maxBytes) {
        throw new Error(`arquivo grande demais (${mb(declared)} MB; máx ${mb(maxBytes)} MB).`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > maxBytes) {
        throw new Error(`arquivo grande demais (${mb(buffer.length)} MB; máx ${mb(maxBytes)} MB).`);
    }

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    const filename = deriveFilename(parsed, contentType);

    return { buffer, filename, contentType };
}

function deriveFilename(parsed, contentType) {
    let base = '';
    try {
        base = decodeURIComponent(path.basename(parsed.pathname));
    } catch {
        base = path.basename(parsed.pathname);
    }

    // Já tem nome com extensão? Usa (limitando o tamanho).
    if (base && path.extname(base)) return base.slice(0, 200);

    // Senão, monta a partir do content-type.
    const ext = EXT_BY_MIME[contentType];
    const name = base || 'arquivo';
    return ext ? `${name}.${ext}` : name;
}

export function isImageMime(contentType) {
    return typeof contentType === 'string' && contentType.startsWith('image/');
}
