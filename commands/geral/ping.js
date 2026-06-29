// Exemplo de comando. Para criar outros, copie este formato em qualquer arquivo
// dentro de commands/ (em qualquer subpasta). O loader acha sozinho.
export default {
    name: 'ping',
    aliases: ['p'],
    description: 'Responde com Pong! para testar se o bot está vivo.',

    // message = a mensagem recebida | args = palavras após o comando | client = o bot
    async execute(message, args, client) {
        await message.reply('🏓 Pong!');
        console.log('Respondido!');
    },
};
