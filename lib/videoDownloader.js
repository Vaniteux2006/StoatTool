import youtubedl from 'youtube-dl-exec';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

// ─── Download de vídeo (yt-dlp) ───────────────────────────────────────────────
// Usa o binário do yt-dlp que vem embutido no pacote `youtube-dl-exec`, então
// não precisa instalar yt-dlp no sistema. Precisa de ffmpeg pra juntar áudio+vídeo
// em alguns sites (no Discloud: APT=ffmpeg).
//
// Suporta YouTube, TikTok, X/Twitter, Reddit e ~1000 sites sem login. Instagram
// exige cookies de uma conta logada — ver resolveCookies().

const TMP_DIR = path.join(os.tmpdir(), 'stoattool-dl');

// Cookies (opcional): habilita Instagram e outros sites que exigem login.
// Procuramos, nesta ordem: variável de ambiente YT_COOKIES, ou ./cookies.txt na
// raiz do projeto. Formato: arquivo cookies.txt (Netscape), exportado do navegador.
function resolveCookies() {
    const candidates = [process.env.YT_COOKIES, path.join(process.cwd(), 'cookies.txt')].filter(Boolean);
    for (const c of candidates) {
        try {
            if (fs.existsSync(c)) return c;
        } catch {
            /* ignora caminho inválido */
        }
    }
    return null;
}

export function hasCookies() {
    return resolveCookies() !== null;
}

/**
 * Baixa um vídeo de `url` pra um arquivo temporário local.
 * @param {string} url
 * @param {{ maxMB?: number }} [opts]
 * @returns {Promise<{ filePath: string, filename: string, sizeMB: number }>}
 */
export async function downloadVideo(url, { maxMB = 19 } = {}) {
    fs.mkdirSync(TMP_DIR, { recursive: true });

    const id = randomUUID();
    const outputTemplate = path.join(TMP_DIR, `${id}.%(ext)s`);
    const cookies = resolveCookies();

    // Sempre com faixa de vídeo (bv* = best video) — nunca áudio isolado. A ordem:
    // mp4 (vídeo+áudio) mesclado → melhor mp4 progressivo → mp4 mesclado limitado a
    // 720p (menor) → qualquer coisa. O --max-filesize é a trava de tamanho.
    const options = {
        output: outputTemplate,
        format: `b[ext=mp4]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/bv*[height<=720]+ba/b`,
        maxFilesize: `${maxMB}M`,
        noPlaylist: true,
        noWarnings: true,
        mergeOutputFormat: 'mp4',
        retries: 3,
    };
    if (cookies) options.cookies = cookies;

    try {
        await youtubedl(url, options);
    } catch (err) {
        cleanupPrefix(id);
        const stderr = (err?.stderr || err?.message || '').toString();
        throw new Error(friendlyError(stderr));
    }

    // Acha o arquivo final (ignora .part de downloads interrompidos).
    const finalName = fs
        .readdirSync(TMP_DIR)
        .find((n) => n.startsWith(id) && !n.endsWith('.part'));

    if (!finalName) {
        cleanupPrefix(id);
        throw new Error('não consegui baixar o vídeo (pode ter passado do limite de tamanho ou exigir login).');
    }

    // Guarda contra baixar só áudio (alguns sites só têm faixa de áudio avulsa).
    if (/\.(m4a|mp3|ogg|opus|wav|aac)$/i.test(finalName)) {
        cleanupPrefix(id);
        throw new Error('esse link só tinha áudio, não um vídeo.');
    }

    const filePath = path.join(TMP_DIR, finalName);
    const bytes = fs.statSync(filePath).size;
    const sizeMB = bytes / (1024 * 1024);

    if (bytes > maxMB * 1024 * 1024) {
        cleanupPrefix(id);
        throw new Error(`vídeo grande demais (${sizeMB.toFixed(1)}MB; o limite do chat é ~${maxMB}MB).`);
    }

    return { filePath, filename: finalName, sizeMB };
}

// Traduz erros comuns do yt-dlp pra algo legível pro usuário.
function friendlyError(stderr) {
    const s = stderr.toLowerCase();
    if (s.includes('login') || s.includes('cookies') || s.includes('rate-limit') || s.includes('authentication')) {
        return 'esse site exige login. Pra Instagram, é preciso configurar os cookies (cookies.txt).';
    }
    if (s.includes('unsupported url') || s.includes('no video')) {
        return 'não achei um vídeo nesse link.';
    }
    if (s.includes('file is larger') || s.includes('max-filesize')) {
        return 'o vídeo passou do limite de tamanho do chat.';
    }
    if (s.includes('private') || s.includes('unavailable')) {
        return 'esse vídeo é privado ou foi removido.';
    }
    // Última linha do stderr costuma ser a mais informativa.
    const lastLine = stderr.trim().split('\n').pop()?.slice(0, 200);
    return lastLine || 'falha desconhecida no download.';
}

export function cleanupFile(filePath) {
    fs.promises.unlink(filePath).catch(() => {});
}

// Remove qualquer arquivo (inclusive .part) que tenha sobrado com este id.
function cleanupPrefix(id) {
    try {
        for (const n of fs.readdirSync(TMP_DIR)) {
            if (n.startsWith(id)) fs.promises.unlink(path.join(TMP_DIR, n)).catch(() => {});
        }
    } catch {
        /* pasta pode nem existir */
    }
}
