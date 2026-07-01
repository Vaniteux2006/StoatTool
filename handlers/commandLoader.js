import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ─── Carregador de Comandos ───────────────────────────────────────────────────
// Varre a pasta commands/ (e TODAS as subpastas) procurando arquivos .js.
// Cada arquivo deve exportar (export default) um objeto com:
//   { name, aliases?, description?, execute(message, args, client) }
//
// Assim você organiza por categorias em pastas, igual no RPTool:
//   commands/geral/ping.js
//   commands/diversao/dado.js
//   ...e tudo é carregado automaticamente, sem mexer no index.js.
//
// ─── Filosofia: NADA aqui pode derrubar o bot ─────────────────────────────────
//   • Cada arquivo é carregado dentro do seu próprio try/catch. Se UM comando
//     estiver quebrado (erro de sintaxe, import de pacote que não existe, etc.),
//     ele é ignorado e logado — os outros comandos carregam normalmente.
//   • Cada pasta também é isolada: uma subpasta problemática não impede o resto.
//   • Convenção de "desligar sem apagar": qualquer arquivo ou pasta cujo nome
//     comece com "_" é IGNORADO. Renomeie `img.js` → `_img.js` (ou a pasta
//     `img/` → `_img/`) pra tirar um comando do ar sem deletar nada.
export async function loadCommands(client, dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️ [loader] Pasta de comandos não encontrada: ${dir}`);
        return;
    }

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        // Pasta ilegível (permissão, etc.) → isola e segue. Não derruba o boot.
        console.error(`❌ [loader] Não consegui ler a pasta ${dir}:`, err);
        return;
    }

    for (const entry of entries) {
        // "_" = desligado (não carrega); "." = oculto (node_modules-style, .git…).
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
            console.log(`⏭️  [loader] Ignorado (prefixo "_"/"."): ${entry.name}`);
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Subpasta = categoria → carrega recursivamente (isolada em try/catch).
            try {
                await loadCommands(client, fullPath);
            } catch (err) {
                console.error(`❌ [loader] Falha ao varrer a pasta ${entry.name}:`, err);
            }
            continue;
        }

        if (!entry.name.endsWith('.js')) continue;

        try {
            // import() dinâmico precisa de uma URL file:// (importante no Windows).
            const mod = await import(pathToFileURL(fullPath).href);
            const cmd = mod.default ?? mod.command ?? mod;

            if (!cmd?.name || typeof cmd.execute !== 'function') {
                console.warn(`⚠️ [loader] ${entry.name} ignorado (faltando "name" ou "execute" — não segue o contrato de comando).`);
                continue;
            }

            // Aviso de colisão: dois comandos com o mesmo nome. O último vence,
            // mas avisamos alto pra ninguém sobrescrever comando sem querer.
            if (client.commands.has(cmd.name)) {
                console.warn(`⚠️ [loader] Nome duplicado "${cmd.name}" (${entry.name}) — sobrescrevendo o anterior.`);
            }

            client.commands.set(cmd.name, cmd);
            console.log(`🔹 [loader] Comando carregado: ${cmd.name}${cmd.aliases?.length ? ` (aliases: ${cmd.aliases.join(', ')})` : ''}`);
        } catch (err) {
            // Erro ao carregar ESTE comando → loga o rastro completo e segue pro próximo.
            // É aqui que aparece, por exemplo, "Cannot find package 'x'".
            console.error(`❌ [loader] Erro ao carregar ${entry.name} (comando ignorado, bot segue):`, err);
        }
    }
}
