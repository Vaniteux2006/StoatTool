import { Client } from "@stoatx/client";

const client = new Client();

client.on("ready", () => {
    console.log(`⚡ IT'S ALIVE! O bot ${client.user.username} nasceu e tá on!`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
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