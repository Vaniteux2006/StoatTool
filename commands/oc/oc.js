import { config } from '../../config.js';
import { createOC, deleteOC, getOCsByAuthor, updateOCAvatar, updateOC } from '../../handlers/ocStore.js';

// Extrai um nome no começo do texto: entre aspas ("Nome com espaços") ou a 1ª palavra.
function takeName(text) {
    const m = text.match(/^"([^"]+)"|^'([^']+)'|^(\S+)/);
    if (!m) return null;
    return { name: m[1] ?? m[2] ?? m[3], rest: text.slice(m[0].length).trim() };
}

// Resolve o avatar a partir de um anexo da mensagem (prioridade) ou de um link no texto.
// Devolve { avatar, rest } — rest é o texto sem o link consumido.
function takeAvatar(message, text) {
    const attachment = message.attachments?.[0];
    const urlMatch = text.match(/https?:\/\/\S+/);
    const avatar = attachment?.url ?? urlMatch?.[0];
    const rest = urlMatch ? text.replace(urlMatch[0], '').trim() : text;
    return { avatar, rest };
}

// Interpreta um padrão "prefixo:text:sufixo" → { prefix, suffix }, ou null se faltar "text".
function parsePattern(text) {
    if (!text.includes('text')) return null;
    const idx = text.indexOf('text');
    return {
        prefix: text.slice(0, idx).trim(),
        suffix: text.slice(idx + 'text'.length).trim(),
    };
}

export default {
    name: 'oc',
    aliases: ['tupper', 'personagem'],
    description: 'Gerencia seus personagens (OCs) — create, delete, list.',

    async execute(message, args, client) {
        const sub = args.shift()?.toLowerCase();
        const tail = args.join(' ').trim();

        // ─── create ───────────────────────────────────────────────────────────
        if (sub === 'create' || sub === 'criar') {
            const named = takeName(tail);
            if (!named || !named.rest) {
                return message.reply(`⚠️ Uso: \`${config.prefix}oc create "Nome" padrão-com-text <link-do-avatar>\``);
            }
            const { name } = named;

            // Avatar: anexo tem prioridade; senão procura um link http no texto.
            const { avatar, rest } = takeAvatar(message, named.rest);
            if (!avatar) {
                return message.reply('❌ Precisa de um avatar: anexe uma imagem ou cole um link.');
            }

            // O padrão precisa conter a palavra "text" (onde a mensagem entra).
            const pattern = parsePattern(rest);
            if (!pattern) {
                return message.reply('⚠️ O padrão precisa conter **`text`**. Ex: `Bob:text` ou `[text]`.');
            }
            const { prefix, suffix } = pattern;

            const oc = createOC({ adminId: message.authorId, name, prefix, suffix, avatar });
            if (!oc) return message.reply('❌ Você já tem um OC com esse nome!');

            return message.reply(`✅ OC **${name}** criado!\nExemplo: \`${prefix}Olá${suffix}\``);
        }

        // ─── avatar (trocar foto de perfil) ───────────────────────────────────
        if (sub === 'avatar' || sub === 'foto') {
            const named = takeName(tail);
            if (!named) {
                return message.reply(`⚠️ Uso: \`${config.prefix}oc avatar "Nome"\` (anexe a imagem ou cole um link)`);
            }
            const { avatar } = takeAvatar(message, named.rest);
            if (!avatar) {
                return message.reply('❌ Anexe uma imagem ou cole um link pra usar como avatar.');
            }
            const ok = updateOCAvatar(message.authorId, named.name, avatar);
            return message.reply(ok ? `🖼️ Avatar de **${named.name}** atualizado!` : '❌ OC não encontrado.');
        }

        // ─── edit (mudar nome/padrão/avatar — útil pra fugir de conflito) ─────
        if (sub === 'edit' || sub === 'editar') {
            const named = takeName(tail);
            if (!named || !named.rest) {
                return message.reply([
                    `⚠️ Uso: \`${config.prefix}oc edit "Nome" <campo> <valor>\``,
                    'Campos: `name`, `pattern` (prefixo:text:sufixo), `prefix`, `suffix`, `avatar`.',
                ].join('\n'));
            }

            // Separa o campo (1ª palavra) do valor (resto).
            const fm = named.rest.match(/^(\S+)\s*([\s\S]*)$/);
            const field = fm?.[1]?.toLowerCase();
            const value = (fm?.[2] ?? '').trim();
            const changes = {};

            if (field === 'name' || field === 'nome') {
                const nv = takeName(value);
                if (!nv) return message.reply('⚠️ Informe o novo nome. Ex: `oc edit "Bob" name "Bobby"`');
                changes.name = nv.name;
            } else if (field === 'pattern' || field === 'padrao' || field === 'padrão') {
                const pat = parsePattern(value);
                if (!pat) return message.reply('⚠️ O padrão precisa conter **`text`**. Ex: `b2:text` ou `[text]`.');
                changes.prefix = pat.prefix;
                changes.suffix = pat.suffix;
            } else if (field === 'prefix' || field === 'prefixo') {
                changes.prefix = value;
            } else if (field === 'suffix' || field === 'sufixo') {
                changes.suffix = value;
            } else if (field === 'avatar' || field === 'foto') {
                const { avatar } = takeAvatar(message, value);
                if (!avatar) return message.reply('❌ Anexe uma imagem ou cole um link pro novo avatar.');
                changes.avatar = avatar;
            } else {
                return message.reply('⚠️ Campo inválido. Use: `name`, `pattern`, `prefix`, `suffix` ou `avatar`.');
            }

            const res = updateOC(message.authorId, named.name, changes);
            if (res.status === 'notfound') return message.reply('❌ OC não encontrado.');
            if (res.status === 'dupname') return message.reply('❌ Você já tem outro OC com esse nome.');
            return message.reply(`✏️ OC **${res.oc.name}** atualizado!\nPadrão atual: \`${res.oc.prefix}text${res.oc.suffix}\``);
        }

        // ─── delete ───────────────────────────────────────────────────────────
        if (sub === 'delete' || sub === 'deletar') {
            const named = takeName(tail);
            if (!named) return message.reply(`⚠️ Uso: \`${config.prefix}oc delete "Nome"\``);
            const ok = deleteOC(message.authorId, named.name);
            return message.reply(ok ? `🗑️ OC **${named.name}** deletado.` : '❌ OC não encontrado.');
        }

        // ─── list ─────────────────────────────────────────────────────────────
        if (sub === 'list' || sub === 'lista') {
            const ocs = getOCsByAuthor(message.authorId);
            if (!ocs.length) return message.reply(`Você ainda não tem OCs. Crie com \`${config.prefix}oc create\`.`);
            const lines = ocs.map(oc => `• **${oc.name}** — \`${oc.prefix}text${oc.suffix}\``);
            return message.reply(`🎭 **Seus OCs:**\n${lines.join('\n')}`);
        }

        // ─── ajuda ────────────────────────────────────────────────────────────
        return message.reply([
            '🎭 **Sistema de OC** — subcomandos:',
            `• \`${config.prefix}oc create "Nome" prefixo:text:sufixo <link-ou-anexo>\``,
            `• \`${config.prefix}oc edit "Nome" <name|pattern|prefix|suffix|avatar> <valor>\``,
            `• \`${config.prefix}oc avatar "Nome"\` (anexe a nova imagem ou cole um link)`,
            `• \`${config.prefix}oc delete "Nome"\``,
            `• \`${config.prefix}oc list\``,
            '',
            'Depois é só falar usando o padrão (ex: `Bob:oi pessoal`) que eu reenvio como o personagem — anexos vão junto.',
        ].join('\n'));
    },
};
