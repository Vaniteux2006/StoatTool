import { Client } from '@stoatx/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { loadCommands } from './handlers/commandLoader.js';
import { handleMessageCreate } from './handlers/messageCreate.js';
import { loadLibs } from "./handlers/loadLibs.js";



// __dirname não existe em ESM — recriamos a partir do import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client();
client.commands = new Map(); // registro de comandos: nome -> comando

// Evita que um erro derrube o processo inteiro.
client.on('error', (err) => {
    console.error('⚠️ Erro no client:', err);
});

client.on('ready', () => {
    console.log(`⚡ IT'S ALIVE! O bot ${client.user.username} nasceu e tá on!`);
    console.log(`🔧 Prefixo: "${config.prefix}" | ${client.commands.size} comando(s) carregado(s).`);
});

// Toda a lógica de roteamento de comandos vive em handlers/messageCreate.js.
client.on('messageCreate', (message) => handleMessageCreate(client, message));

// ─── Boot ─────────────────────────────────────────────────────────────────────
console.log('📂 Carregando comandos...');
await loadCommands(client, path.join(__dirname, 'commands'));
await loadLibs();
await loadCommands(client);

if (!config.token) {
    console.error('❌ TOKEN não encontrado no .env. Bot não pode iniciar.');
    process.exit(1);
}

console.log('⏳ Tentando conectar...');
client.login(config.token);
