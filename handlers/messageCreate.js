import { config } from '../config.js';

// Anti-spam simples por canal (mesma ideia do RPTool).
const cooldowns = new Map();      // canalId -> timestamp em que o castigo expira
const commandStrikes = new Map(); // canalId -> lista de timestamps recentes

// ─── Roteamento de Comandos por Prefixo ───────────────────────────────────────
// Tudo que envolve "chegou uma mensagem → é um comando? qual? executa" fica aqui.
// O index.js só conecta este handler ao evento messageCreate.
export async function handleMessageCreate(client, message) {
    // author?. porque o autor pode ainda não estar no cache (evita o TypeError).
    if (message.author?.bot) return;
    // Ignora as próprias mensagens do bot (forma confiável, sem depender do cache).
    if (message.authorId === client.user?.id) return;
    if (typeof message.content !== 'string') return;
    if (!message.content.startsWith(config.prefix)) return;

    const channelId = message.channelId;
    const now = Date.now();

    // Se o canal está de castigo, ignora até expirar.
    if (cooldowns.has(channelId)) {
        if (now < cooldowns.get(channelId)) return;
        cooldowns.delete(channelId);
        commandStrikes.set(channelId, []);
    }

    // Conta comandos dos últimos 10s; 8+ = spam → 30s de castigo.
    const recent = (commandStrikes.get(channelId) ?? []).filter(t => now - t < 10_000);
    if (recent.length >= 8) {
        cooldowns.set(channelId, now + 30_000);
        commandStrikes.set(channelId, []);
        await message.reply('🛑 **Spam detectado!** Esperem 30 segundos antes de usar mais comandos.').catch(() => {});
        return;
    }
    recent.push(now);
    commandStrikes.set(channelId, recent);

    // Separa "!comando arg1 arg2" em commandName + args.
    const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    // Busca pelo nome ou por algum alias.
    const command = client.commands.get(commandName)
        ?? [...client.commands.values()].find(c => c.aliases?.includes(commandName));
    if (!command) return;

    console.log(`📝 ${config.prefix}${commandName} | ${message.author?.username ?? message.authorId}`);

    try {
        await command.execute(message, args, client);
    } catch (err) {
        console.error(`❌ Erro em ${config.prefix}${commandName}:`, err);
        await message.reply('❌ Erro interno ao executar o comando.').catch(() => {});
    }
}
