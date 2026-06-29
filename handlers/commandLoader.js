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
export async function loadCommands(client, dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️ Pasta de comandos não encontrada: ${dir}`);
        return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Subpasta = categoria → carrega recursivamente.
            await loadCommands(client, fullPath);
            continue;
        }

        if (!entry.name.endsWith('.js')) continue;

        try {
            // import() dinâmico precisa de uma URL file:// (importante no Windows).
            const mod = await import(pathToFileURL(fullPath).href);
            const cmd = mod.default ?? mod.command ?? mod;

            if (cmd?.name && typeof cmd.execute === 'function') {
                client.commands.set(cmd.name, cmd);
                console.log(`🔹 Comando carregado: ${cmd.name}`);
            } else {
                console.warn(`⚠️ ${entry.name} ignorado (faltando "name" ou "execute").`);
            }
        } catch (err) {
            console.error(`❌ Erro ao carregar ${entry.name}:`, err);
        }
    }
}
