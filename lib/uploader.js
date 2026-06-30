import fetch from "node-fetch";
import fs from "node:fs";
import { FormData, fileFromSync } from "formdata-node";

let cachedAutumnUrl = null;

/**
 * Descobre a URL atual do servidor de arquivos (Autumn) consultando a raiz da API.
 * Evita hardcode da URL, já que o Stoat já trocou esse endpoint uma vez.
 */
async function getAutumnUrl(apiUrl) {
  if (cachedAutumnUrl) return cachedAutumnUrl;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Falha ao consultar a API do Stoat (${res.status})`);
  }
  const data = await res.json();
  const autumnUrl = data?.features?.autumn?.url;

  if (!autumnUrl) {
    throw new Error("Não encontrei a URL do Autumn na resposta da API.");
  }

  cachedAutumnUrl = autumnUrl;
  return autumnUrl;
}

/**
 * Faz upload de um arquivo local para o Autumn e retorna o ID do anexo
 * que pode ser usado em message.channel.sendMessage({ attachments: [id] }).
 *
 * @param {string} filePath
 * @param {string} fileName
 * @param {{apiUrl: string, botToken: string}} opts
 * @returns {Promise<string>} attachment id
 */
export async function uploadToAutumn(filePath, fileName, { apiUrl, botToken }) {
  const autumnUrl = await getAutumnUrl(apiUrl);

  const form = new FormData();
  form.append("file", fileFromSync(filePath, fileName));

  const res = await fetch(`${autumnUrl}/attachments`, {
    method: "POST",
    body: form,
    headers: {
      "X-Bot-Token": botToken,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload pro Autumn falhou (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.id;
}
