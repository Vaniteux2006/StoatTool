import { Client } from '@stoatx/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { loadCommands } from './handlers/commandLoader.js';
import { handleMessageCreate } from './handlers/messageCreate.js';



// __dirname não existe em ESM — recriamos a partir do import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Redes de segurança globais ───────────────────────────────────────────────
// Última linha de defesa: qualquer erro que "escapar" de um try/catch (ex: um
// comando que dá pau de forma assíncrona) NÃO pode derrubar o bot. Só logamos e
// seguimos online. É isso que garante o bot vivo mesmo com comando bugado.
process.on('uncaughtException', (err) => {
    console.error('🛡️ uncaughtException (bot continua online):', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('🛡️ unhandledRejection (bot continua online):', reason);
});

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
// O carregamento é blindado: se UM comando falhar ao carregar (ex: import de um
// pacote que não está instalado), o commandLoader já ignora aquele arquivo e
// segue. O try/catch aqui é só uma garantia extra pra nada travar o boot.
console.log('📂 Carregando comandos...');
try {
    await loadCommands(client, path.join(__dirname, 'commands'));
} catch (err) {
    console.error('⚠️ Erro ao carregar comandos (seguindo mesmo assim):', err);
}

if (!config.token) {
    console.error('❌ TOKEN não encontrado no .env. Bot não pode iniciar.');
    process.exit(1);
}

console.log('⏳ Tentando conectar...');
client.login(config.token);
