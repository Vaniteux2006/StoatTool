// commands/roll/roll.js
export default {
    name: 'roll',
    aliases: ['r'],
    description: 'Rola dados no formato NdN, ex: 1d20 ou 2d10 Ataque.',

    // message = a mensagem recebida | args = palavras após o comando | client = o bot
    async execute(message, args, client) {
        const argsStr = args.join(' ');

        const match = argsStr.match(/^(\d+)d(\d+)(?:\s+(.+))?$/i);

        if (!match) {
            return message.reply(
                "Uso correto: `rp!roll 1d20` ou `rp!roll 2d10 Teste`"
            );
        }

        const quantidade = parseInt(match[1]);
        const lados = parseInt(match[2]);
        const descricao = match[3];

        // Limites de segurança
        if (quantidade <= 0 || lados <= 0) {
            return message.reply("Os valores precisam ser maiores que 0.");
        }

        if (quantidade > 100) {
            return message.reply("Você não pode rolar mais de 100 dados.");
        }

        if (lados > 1000000) {
            return message.reply("Número de lados muito alto.");
        }

        const resultados = [];

        for (let i = 0; i < quantidade; i++) {
            const roll = Math.floor(Math.random() * lados) + 1;
            resultados.push(roll);
        }

        const soma = resultados.reduce((a, b) => a + b, 0);

        let resposta = "";

        // Caso tenha descrição
        if (descricao) {
            resposta += `🎲 **${descricao}**\n`;
        }

        resposta += `Rolagem: \`${quantidade}d${lados}\`\n`;

        // Mostrar resultados
        if (quantidade === 1) {
            resposta += `Resultado: **${resultados[0]}**`;
        } else {
            resposta += `Resultados: [${resultados.join(", ")}]\n`;
            resposta += `Soma Total: **${soma}**`;
        }

        await message.reply(resposta);
    },
};