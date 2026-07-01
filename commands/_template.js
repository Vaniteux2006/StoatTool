// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATE / CONTRATO DE COMANDO  —  leia isto antes de criar um comando novo
// ─────────────────────────────────────────────────────────────────────────────
//
//  Este arquivo começa com "_", então o loader O IGNORA (não vira comando).
//  Ele existe só como documentação viva: copie o formato abaixo pra um arquivo
//  novo dentro de commands/ (em qualquer subpasta) e o bot carrega sozinho.
//
//  ── Como funciona o carregamento (handlers/commandLoader.js) ────────────────
//   • Todo arquivo .js dentro de commands/ é carregado automaticamente.
//   • Organize por pastas (categorias) à vontade: commands/diversao/dado.js etc.
//   • Adicionar um comando novo = criar o arquivo. NÃO precisa mexer no index.js.
//   • Apagar um comando = apagar o arquivo. O resto continua funcionando.
//   • DESLIGAR sem apagar = renomeie pro prefixo "_" (ex: dado.js → _dado.js,
//     ou a pasta inteira img/ → _img/). O loader pula tudo que começa com "_".
//
//  ── Regra de ouro da resiliência ───────────────────────────────────────────
//   Se ESTE arquivo quebrar (erro de sintaxe, import de pacote que não existe,
//   erro dentro do execute...), APENAS este comando cai — o bot continua online.
//   O loader isola cada arquivo em try/catch e o execute roda em try/catch no
//   messageCreate. Então: sempre trate seus próprios erros e rotule os logs,
//   ex: console.error('[meucomando] deu ruim ao buscar X:', err).
//
//  ── Contrato (o que o loader espera) ────────────────────────────────────────
//   Um export default com, no mínimo, `name` (string) e `execute` (função).
//   Sem esses dois, o comando é ignorado com um aviso no console.

export default {
    // OBRIGATÓRIO: nome do comando (o que vem depois do prefixo). Ex: "rp!dado".
    name: 'exemplo',

    // OPCIONAL: outros nomes que disparam o mesmo comando.
    aliases: ['ex', 'modelo'],

    // OPCIONAL (mas recomendado): usado por um futuro comando de ajuda.
    description: 'Descreve em uma linha o que o comando faz.',

    // OBRIGATÓRIO: a lógica do comando.
    //   message = a mensagem recebida (tem .reply, .channel, .author, etc.)
    //   args    = as palavras após o comando, já separadas. Ex: "rp!ex a b" → ['a','b']
    //   client  = a instância do bot (client.commands, client.user, etc.)
    async execute(message, args, client) {
        try {
            await message.reply('✅ Comando de exemplo funcionando!');
        } catch (err) {
            // Rotule sempre com o nome do comando pra achar a origem no log.
            console.error('[exemplo] falhou ao responder:', err);
        }
    },
};
