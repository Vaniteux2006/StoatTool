// commands/administracao/autorole.js
//
// rp!autorole entrada <cargo|id>
// rp!autorole reagir <id-mensagem> <cargo|id> <emoji>
// rp!autorole all <cargo|id>
// rp!autorole status <cargo|id>
// rp!autorole help
//
// Feito para STOAT (stoat.js), não discord.js.
// Só quem tem permissão ManageServer (ou é dono do servidor) pode usar.
// Segue o contrato do commandLoader: export default { name, execute }.
//
// IMPORTANTE: as classes do stoat.js (Message, Server, ServerMember...) não
// expõem o client publicamente, então este arquivo NÃO consegue se auto-
// registrar nos eventos de serverMemberJoin / reação sozinho. Você precisa
// chamar registerEvents(client) UMA VEZ no seu index.js, por exemplo:
//
//   import autorole from './commands/administracao/autorole.js';
//   client.on('ready', () => autorole.registerEvents(client));
//
// Sem essa linha, os subcomandos "entrada" e "reagir" salvam a config
// normalmente, mas o cargo automático (entrada de membro / reação) nunca
// dispara.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'autorole.json');

// IDs no Stoat são ULIDs (ex: 01JTTSRP73PQ5SGG0SQ1XPKN1D) — alfanuméricos,
// não numéricos como no Discord. Aceita ID cru ou menção <%id>.
const ID_RE = /^[0-9A-HJKMNP-TV-Z]{20,30}$/i;
const ROLE_MENTION_RE = /^<%([0-9A-HJKMNP-TV-Z]{20,30})>$/i;

// ---------- Persistência ----------

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
}

function loadData() {
  ensureStorage();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveData(data) {
  ensureStorage();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getGuildConfig(data, serverId) {
  if (!data[serverId]) data[serverId] = { entrada: null, reagir: [] };
  if (!data[serverId].reagir) data[serverId].reagir = [];
  return data[serverId];
}

// ---------- Helpers ----------

function resolveRole(server, arg) {
  if (!arg) return null;
  const mentionMatch = arg.match(ROLE_MENTION_RE);
  const roleId = mentionMatch ? mentionMatch[1] : arg.trim();
  if (!ID_RE.test(roleId)) return null;
  const role = server.roles.get(roleId);
  if (!role) return null;
  return { id: roleId, ...role };
}

function isAdmin(message) {
  const member = message.member;
  const server = message.server;
  if (!member || !server) return false;
  if (server.ownerId === message.authorId) return true;
  return member.hasPermission(server, 'ManageServer');
}

function botCanAssignRoles(message) {
  const server = message.server;
  if (!server.havePermission('AssignRoles')) {
    return { ok: false, reason: 'Eu não tenho a permissão **Assign Roles** neste servidor.' };
  }
  return { ok: true };
}

async function findMessageInServer(server, messageId, preferredChannel) {
  if (preferredChannel) {
    try {
      const msg = await preferredChannel.fetchMessage(messageId);
      if (msg) return { message: msg, channel: preferredChannel };
    } catch {
      // segue tentando outros canais
    }
  }

  for (const channel of server.channels) {
    if (channel.id === preferredChannel?.id) continue;
    try {
      const msg = await channel.fetchMessage(messageId);
      if (msg) return { message: msg, channel };
    } catch {
      continue;
    }
  }
  return null;
}

function embed(title, description, colour) {
  return { title, description, colour };
}

function helpEmbed(prefix = 'rp!') {
  const lines = [
    `**${prefix}autorole entrada <cargo|id>**`,
    'Define um cargo que será dado automaticamente a todo membro que entrar no servidor.',
    '',
    `**${prefix}autorole reagir <id-mensagem> <cargo|id> <emoji>**`,
    'Configura um cargo por reação: quem reagir com o emoji na mensagem indicada recebe o cargo (e perde ao remover a reação).',
    '',
    `**${prefix}autorole all <cargo|id>**`,
    'Atribui o cargo informado a **todos** os membros atuais do servidor.',
    '',
    `**${prefix}autorole status <cargo|id>**`,
    'Mostra a lista de membros que atualmente possuem o cargo informado.',
  ].join('\n');

  return embed('📋 Ajuda — Autorole', lines, '#5865f2');
}

// ---------- Subcomandos ----------

async function cmdEntrada(message, args, data) {
  const role = resolveRole(message.server, args[0]);
  if (!role) {
    return message.reply('⚠️ Você precisa mencionar um cargo ou passar o ID dele. Ex: `rp!autorole entrada %Membro` ou o ID do cargo.');
  }

  const check = botCanAssignRoles(message);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const guildConfig = getGuildConfig(data, message.server.id);
  guildConfig.entrada = role.id;
  saveData(data);

  return message.reply(`✅ Cargo de entrada configurado: **${role.name}**. Todo novo membro receberá esse cargo automaticamente.`);
}

async function cmdReagir(message, args, data) {
  const [messageId, roleArg, emoji] = args;

  if (!messageId || !roleArg || !emoji) {
    return message.reply('⚠️ Uso correto: `rp!autorole reagir <id-mensagem> <cargo|id> <emoji>`');
  }

  if (!ID_RE.test(messageId)) {
    return message.reply('⚠️ O ID da mensagem parece inválido.');
  }

  const role = resolveRole(message.server, roleArg);
  if (!role) return message.reply('⚠️ Cargo inválido. Mencione o cargo ou informe o ID dele.');

  const check = botCanAssignRoles(message);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const found = await findMessageInServer(message.server, messageId, message.channel);
  if (!found) {
    return message.reply('❌ Não encontrei nenhuma mensagem com esse ID nos canais que consigo ver.');
  }

  try {
    await found.message.react(emoji);
  } catch {
    return message.reply('❌ Não consegui reagir com esse emoji. Verifique se ele é válido (emoji padrão ou emoji custom deste servidor) e se tenho a permissão **React**.');
  }

  const guildConfig = getGuildConfig(data, message.server.id);

  guildConfig.reagir = guildConfig.reagir.filter(
    (r) => !(r.messageId === messageId && r.emoji === emoji)
  );

  guildConfig.reagir.push({
    messageId,
    channelId: found.channel.id,
    roleId: role.id,
    emoji,
  });

  saveData(data);

  return message.reply(
    `✅ Configurado! Quem reagir com ${emoji} na mensagem (ID \`${messageId}\`) receberá o cargo **${role.name}**.`
  );
}

async function cmdAll(message, args) {
  const role = resolveRole(message.server, args[0]);
  if (!role) return message.reply('⚠️ Mencione o cargo ou informe o ID dele. Ex: `rp!autorole all <id-do-cargo>`');

  const check = botCanAssignRoles(message);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const statusMsg = await message.reply('⏳ Buscando membros do servidor...');

  let members, users;
  try {
    ({ members, users } = await message.server.fetchMembers());
  } catch {
    return statusMsg
      ? statusMsg.edit({ content: '❌ Não consegui buscar a lista de membros do servidor.' })
      : message.channel.sendMessage('❌ Não consegui buscar a lista de membros do servidor.');
  }

  const userMap = new Map(users.map((u) => [u.id, u]));
  const membersToAdd = members.filter((m) => {
    const u = userMap.get(m.id.user);
    return !(u && u.bot) && !m.roles.includes(role.id);
  });

  let success = 0;
  let fail = 0;

  for (const member of membersToAdd) {
    try {
      await member.edit({ roles: [...member.roles, role.id] });
      success++;
    } catch {
      fail++;
    }
  }

  const resultText =
    `✅ Concluído! Cargo **${role.name}** atribuído a **${success}** membro(s).` +
    (fail > 0 ? ` ⚠️ Falhou em **${fail}** membro(s).` : '');

  return statusMsg
    ? statusMsg.edit({ content: resultText })
    : message.channel.sendMessage(resultText);
}

async function cmdStatus(message, args) {
  const role = resolveRole(message.server, args[0]);
  if (!role) return message.reply('⚠️ Mencione o cargo ou informe o ID dele. Ex: `rp!autorole status <id-do-cargo>`');

  let members, users;
  try {
    ({ members, users } = await message.server.fetchMembers());
  } catch {
    return message.reply('❌ Não consegui buscar a lista de membros do servidor.');
  }

  const userMap = new Map(users.map((u) => [u.id, u]));
  const withRole = members.filter((m) => m.roles.includes(role.id));

  if (withRole.length === 0) {
    return message.reply(`ℹ️ Nenhum membro possui o cargo **${role.name}** no momento.`);
  }

  const names = withRole.map((m) => {
    const u = userMap.get(m.id.user);
    const tag = u ? `${u.username}#${u.discriminator}` : m.id.user;
    return `• ${tag} (${m.id.user})`;
  });

  const chunks = [];
  let current = '';
  for (const line of names) {
    if ((current + line + '\n').length > 3900) {
      chunks.push(current);
      current = '';
    }
    current += line + '\n';
  }
  if (current) chunks.push(current);

  for (let i = 0; i < chunks.length; i++) {
    const em = embed(
      `👥 Membros com o cargo ${role.name} (${withRole.length} total)`,
      chunks[i],
      role.colour || '#5865f2'
    );

    if (i === 0) {
      await message.reply({ embeds: [em] });
    } else {
      await message.channel.sendMessage({ embeds: [em] });
    }
  }
}

// ---------- Eventos (entrada automática e reação) ----------
// Registrados sob demanda no client, uma única vez por processo.

function registerEvents(client) {
  if (client.__autoroleEventsRegistered) return;
  client.__autoroleEventsRegistered = true;

  client.on('serverMemberJoin', async (member) => {
    try {
      const server = member.server;
      if (!server) return;

      const data = loadData();
      const guildConfig = data[server.id];
      if (!guildConfig || !guildConfig.entrada) return;

      const role = server.roles.get(guildConfig.entrada);
      if (!role) return;

      await member.edit({ roles: [...member.roles, guildConfig.entrada] }).catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em serverMemberJoin:', err);
    }
  });

  client.on('messageReactionAdd', async (message, userId, emoji) => {
    try {
      const server = message.server;
      if (!server) return;

      const data = loadData();
      const guildConfig = data[server.id];
      if (!guildConfig || !guildConfig.reagir?.length) return;

      const config = guildConfig.reagir.find(
        (r) => r.messageId === message.id && r.emoji === emoji
      );
      if (!config) return;

      const member = await server.fetchMember(userId).catch(() => null);
      if (!member || member.user?.bot) return;
      if (member.roles.includes(config.roleId)) return;

      await member.edit({ roles: [...member.roles, config.roleId] }).catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em messageReactionAdd:', err);
    }
  });

  client.on('messageReactionRemove', async (message, userId, emoji) => {
    try {
      const server = message.server;
      if (!server) return;

      const data = loadData();
      const guildConfig = data[server.id];
      if (!guildConfig || !guildConfig.reagir?.length) return;

      const config = guildConfig.reagir.find(
        (r) => r.messageId === message.id && r.emoji === emoji
      );
      if (!config) return;

      const member = await server.fetchMember(userId).catch(() => null);
      if (!member) return;
      if (!member.roles.includes(config.roleId)) return;

      await member
        .edit({ roles: member.roles.filter((r) => r !== config.roleId) })
        .catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em messageReactionRemove:', err);
    }
  });
}

// ---------- Contrato do commandLoader ----------

export default {
  name: 'autorole',
  description: 'Configura cargo automático de entrada, cargo por reação, atribuição em massa e status de um cargo.',
  // Exportado para você registrar uma única vez no seu index.js — veja
  // instruções no topo do arquivo. O commandLoader ignora esta propriedade
  // extra, então não quebra nada mesmo se você não usar.
  registerEvents,
  async execute(message, args) {
    if (!message.server) return;

    if (!isAdmin(message)) {
      return message.reply('🚫 Apenas quem tem permissão de Gerenciar Servidor pode usar o comando `autorole`.');
    }

    const sub = (args[0] || '').toLowerCase();
    const rest = args.slice(1);
    const data = loadData();

    switch (sub) {
      case 'entrada':
        return cmdEntrada(message, rest, data);
      case 'reagir':
        return cmdReagir(message, rest, data);
      case 'all':
        return cmdAll(message, rest);
      case 'status':
        return cmdStatus(message, rest);
      case 'help':
      case '':
        return message.reply({ embeds: [helpEmbed()] });
      default:
        return message.reply('⚠️ Subcomando desconhecido. Use `rp!autorole help` para ver a lista de comandos.');
    }
  },
};
