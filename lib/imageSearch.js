import { searchImages as ddgSearchImages, SafeSearchType } from "duck-duck-scrape";

/**
 * Busca imagens usando o duck-duck-scrape (não-oficial, sem chave de API,
 * faz scraping do endpoint de imagens do DuckDuckGo).
 *
 * O DuckDuckGo normalmente já retorna um lote grande de resultados (na
 * casa de ~100) numa única chamada, mas paginamos com `offset` mesmo assim
 * caso o lote inicial venha menor que o pedido, reaproveitando o token
 * `vqd` pra não precisar re-resolver a busca do zero a cada página.
 *
 * @param {string} query
 * @param {{count?: number}} opts
 * @returns {Promise<{title: string, link: string, contextLink: string, displayLink: string}[]>}
 */
export async function searchImages(query, { count = 100 } = {}) {
  const collected = [];
  let vqd;
  let offset = 0;
  let safety = 0; // limite de segurança pra nunca entrar em loop infinito

  while (collected.length < count && safety < 10) {
    safety++;

    const page = await ddgSearchImages(query, {
      safeSearch: SafeSearchType.MODERATE,
      offset,
      vqd, // reaproveita o token de busca a partir da 2ª página
    });

    if (!page?.results?.length) break;

    vqd = page.vqd;

    for (const item of page.results) {
      collected.push({
        title: item.title || "Sem título",
        link: item.image, // URL direta da imagem
        contextLink: item.url, // página onde a imagem foi encontrada
        displayLink: safeHostname(item.url),
      });
    }

    offset += page.results.length;

    // se a página veio menor do que pedimos, provavelmente acabaram os resultados
    if (page.results.length < 10) break;
  }

  return collected.slice(0, count);
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
