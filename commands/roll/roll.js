client.on("messageCreate", async (message) => {
    if (!message.content.startsWith("rp!roll")) return;

    const args = message.content.slice(8).trim();

    const match = args.match(/^(\d+)d(\d+)(?:\s+(.+))?$/i);

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
});