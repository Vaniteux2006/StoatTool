import { Client } from "@stoatx/client";

const client = new Client();

client.on("ready", () => {
    console.log(`⚡ IT'S ALIVE! O bot ${client.user.username} nasceu e tá on!`);
});

// evita que um erro derrube o processo inteiro
client.on("error", (err) => {
    console.error("⚠️ Erro no client:", err);
});

client.on("messageCreate", async (message) => {
    // ignora as próprias mensagens do bot
    if (message.authorId === client.user?.id) return;
    // ignora outros bots (author?. porque pode não estar no cache ainda)
    if (message.author?.bot) return;
    if (typeof message.content !== 'string') return;

    console.log(`📨 Mensagem: "${message.content}"`);

    if (message.content.toLowerCase() === '!ping') {
        await message.channel.send('🏓 Pong!');
        console.log('Respondido!');
    }
});

const MEU_TOKEN = 'qz3sg7uyBjIwVuW3wVSewT9MKgabk75ltb8S3nPLNkVcrdzkKsHR3HRUsvDxas35';

console.log("⏳ Tentando conectar...");
client.login(MEU_TOKEN);