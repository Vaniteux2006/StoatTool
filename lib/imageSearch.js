// ─── Busca de imagens (scrape do Bing) ────────────────────────────────────────
// Sem chave de API: raspa a página de resultados de imagem do Bing e extrai o
// JSON de cada tile (elemento class="iusc", atributo m="{...}"), que traz a URL
// da imagem (murl), a página de origem (purl) e o título (t).
//
// É scrape — pode quebrar se o Bing mudar o HTML. Se um dia parar, o ponto único
// a arrumar é o regex/seletor aqui.

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/**
 * @param {string} query
 * @param {{ safe?: boolean }} [opts]
 * @returns {Promise<{ image: string, page: string, title: string }[]>}
 */
export async function searchImages(query, { safe = true } = {}) {
    const adlt = safe ? 'moderate' : 'off';
    const url =
        `https://www.bing.com/images/search?q=${encodeURIComponent(query)}` +
        `&form=HDRSC2&first=1&count=35&mkt=pt-BR&adlt=${adlt}`;

    const res = await fetch(url, {
        headers: {
            'User-Agent': UA,
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
    });
    if (!res.ok) throw new Error(`o Bing respondeu HTTP ${res.status}.`);

    const html = await res.text();
    const results = [];
    const seen = new Set();

    // Cada resultado é um <a class="iusc" ... m="{json com &quot;}"> ... </a>
    for (const match of html.matchAll(/class="iusc"[^>]*\sm="([^"]+)"/g)) {
        let json;
        try {
            json = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
        } catch {
            continue;
        }
        const image = json.murl;
        if (!image || !/^https?:\/\//i.test(image) || seen.has(image)) continue;
        seen.add(image);
        results.push({
            image,
            page: json.purl || json.turl || '',
            title: (json.t || '').trim(),
        });
    }

    return results;
}
