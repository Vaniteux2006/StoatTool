import { spawn } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

const TMP_DIR = path.resolve("tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * Baixa um vídeo de qualquer URL suportada pelo yt-dlp (YouTube, Instagram, X/Twitter, TikTok, etc.)
 * Requer o binário `yt-dlp` instalado no sistema (e `ffmpeg` para merge de áudio/vídeo).
 *
 * @param {string} url - URL do vídeo
 * @param {number} maxFilesizeMB - tamanho máximo em MB
 * @returns {Promise<{filePath: string, title: string}>}
 */
export function downloadVideo(url, maxFilesizeMB = 19) {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const outputTemplate = path.join(TMP_DIR, `${id}.%(ext)s`);

    // Restringe formato a mp4 (h264+aac) sempre que possível, pra garantir
    // compatibilidade de preview no chat, e limita o tamanho do arquivo.
    const args = [
      url,
      "-f",
      `bv*[ext=mp4][filesize<${maxFilesizeMB}M]+ba[ext=m4a]/b[ext=mp4][filesize<${maxFilesizeMB}M]/b[filesize<${maxFilesizeMB}M]`,
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "--max-filesize",
      `${maxFilesizeMB}M`,
      "-o",
      outputTemplate,
      "--print",
      "after_move:filepath",
      "--no-warnings",
    ];

    const proc = spawn("yt-dlp", args);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("error", (err) => {
      reject(new Error(`Não foi possível executar o yt-dlp. Ele está instalado? Detalhe: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp falhou (código ${code}): ${stderr.trim().slice(-800)}`));
        return;
      }

      const filePath = stdout.trim().split("\n").filter(Boolean).pop();

      if (!filePath || !fs.existsSync(filePath)) {
        reject(new Error("yt-dlp terminou mas o arquivo de saída não foi encontrado (pode ter excedido o tamanho máximo)."));
        return;
      }

      const title = path.basename(filePath);
      resolve({ filePath, title });
    });
  });
}

export function cleanupLocalFile(filePath) {
  fs.promises.unlink(filePath).catch(() => {});
}
