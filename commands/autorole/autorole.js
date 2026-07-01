// commands/autorole.js
//
// rp!autorole entrada <cargo|id>
// rp!autorole reagir <id-mensagem> <cargo|id> <emoji>
// rp!autorole all <cargo|id>
// rp!autorole status <cargo|id>
// rp!autorole help
//
// Apenas Administradores podem usar. Segue o contrato do commandLoader:
// export default { name, execute }.

import { PermissionsBitField, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'autorole.json');

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

function getGuildConfig(data, guildId) {
  if (!data[guildId]) {
    data[guildId] = { entrada: null, reagir: [] };
  }
  if (!data[guildId].reagir) data[guildId].reagir = [];
  return data[guildId];
}

// ---------- Helpers ----------

function resolveRole(message, arg) {
  if (!arg) return null;
  const mentionMatch = arg.match(/^<@&(\d+)>$/);
  const roleId = mentionMatch ? mentionMatch[1] : arg.replace(/\D/g, '');
  if (!roleId) return null;
  return message.guild.roles.cache.get(roleId) || null;
}

function isAdmin(message) {
  return message.member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function botCanAssign(message, role) {
  const botMember = message.guild.members.me;
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return { ok: false, reason: 'Eu não tenho a permissão **Gerenciar Cargos** neste servidor.' };
  }
  if (role.position >= botMember.roles.highest.position) {
    return { ok: false, reason: `Meu cargo mais alto precisa estar **acima** do cargo ${role.name} na lista de cargos.` };
  }
  if (role.managed) {
    return { ok: false, reason: 'Esse cargo é gerenciado automaticamente (bot/integração) e não pode ser atribuído manualmente.' };
  }
  return { ok: true };
}

async function findMessageInGuild(guild, messageId, preferredChannel) {
  if (preferredChannel) {
    try {
      const msg = await preferredChannel.messages.fetch(messageId);
      if (msg) return { message: msg, channel: preferredChannel };
    } catch {
      // segue tentando outros canais
    }
  }

  const channels = guild.channels.cache.filter(
    (c) => c.isTextBased && c.isTextBased() && c.viewable
  );

  for (const channel of channels.values()) {
    try {
      const msg = await channel.messages.fetch(messageId);
      if (msg) return { message: msg, channel };
    } catch {
      continue;
    }
  }
  return null;
}

// ---------- Embed de ajuda ----------

function helpEmbed(prefix = 'rp!') {
  return new EmbedBuilder()
    .setTitle('📋 Ajuda — Autorole')
    .setDescription('Comandos disponíveis (apenas Administradores podem usá-los):')
    .addFields(
      {
        name: `${prefix}autorole entrada <cargo|id>`,
        value: 'Define um cargo que será dado automaticamente a todo membro que entrar no servidor.',
      },
      {
        name: `${prefix}autorole reagir <id-mensagem> <cargo|id> <emoji>`,
        value: 'Configura um cargo por reação: quem reagir com o emoji na mensagem indicada recebe o cargo (e perde ao remover a reação).',
      },
      {
        name: `${prefix}autorole all <cargo|id>`,
        value: 'Atribui o cargo informado a **todos** os membros atuais do servidor.',
      },
      {
        name: `${prefix}autorole status <cargo|id>`,
        value: 'Mostra a lista de membros que atualmente possuem o cargo informado.',
      }
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Exemplo: rp!autorole entrada @Membro' });
}

// ---------- Subcomandos ----------

async function cmdEntrada(message, args, data) {
  const role = resolveRole(message, args[0]);
  if (!role) {
    return message.reply('⚠️ Você precisa mencionar um cargo ou passar o ID dele. Ex: `rp!autorole entrada @Membro`');
  }

  const check = botCanAssign(message, role);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const guildConfig = getGuildConfig(data, message.guild.id);
  guildConfig.entrada = role.id;
  saveData(data);

  return message.reply(`✅ Cargo de entrada configurado: **${role.name}**. Todo novo membro receberá esse cargo automaticamente.`);
}

async function cmdReagir(message, args, data) {
  const [messageId, roleArg, emoji] = args;

  if (!messageId || !roleArg || !emoji) {
    return message.reply(
      '⚠️ Uso correto: `rp!autorole reagir <id-mensagem> <cargo|id> <emoji>`'
    );
  }

  if (!/^\d{17,20}$/.test(messageId)) {
    return message.reply('⚠️ O ID da mensagem parece inválido.');
  }

  const role = resolveRole(message, roleArg);
  if (!role) return message.reply('⚠️ Cargo inválido. Mencione o cargo ou informe o ID dele.');

  const check = botCanAssign(message, role);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const found = await findMessageInGuild(message.guild, messageId, message.channel);
  if (!found) {
    return message.reply('❌ Não encontrei nenhuma mensagem com esse ID nos canais que consigo ver.');
  }

  try {
    await found.message.react(emoji);
  } catch {
    return message.reply('❌ Não consegui reagir com esse emoji. Verifique se ele é válido (emoji padrão do Discord ou emoji custom deste servidor).');
  }

  const guildConfig = getGuildConfig(data, message.guild.id);

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

async function cmdAll(message, args, data) {
  const role = resolveRole(message, args[0]);
  if (!role) return message.reply('⚠️ Mencione o cargo ou informe o ID dele. Ex: `rp!autorole all @Membro`');

  const check = botCanAssign(message, role);
  if (!check.ok) return message.reply(`❌ ${check.reason}`);

  const statusMsg = await message.reply(`⏳ Buscando membros do servidor...`);

  let members;
  try {
    members = await message.guild.members.fetch();
  } catch {
    return statusMsg.edit('❌ Não consegui buscar a lista de membros do servidor.');
  }

  const membersToAdd = members.filter((m) => !m.user.bot && !m.roles.cache.has(role.id));

  let success = 0;
  let fail = 0;

  await statusMsg.edit(`⏳ Atribuindo cargo **${role.name}** a ${membersToAdd.size} membro(s)...`);

  for (const member of membersToAdd.values()) {
    try {
      await member.roles.add(role);
      success++;
    } catch {
      fail++;
    }
  }

  return statusMsg.edit(
    `✅ Concluído! Cargo **${role.name}** atribuído a **${success}** membro(s).` +
      (fail > 0 ? ` ⚠️ Falhou em **${fail}** membro(s).` : '')
  );
}

async function cmdStatus(message, args) {
  const role = resolveRole(message, args[0]);
  if (!role) return message.reply('⚠️ Mencione o cargo ou informe o ID dele. Ex: `rp!autorole status @Membro`');

  const statusMsg = await message.reply('⏳ Buscando membros...');

  let members;
  try {
    members = await message.guild.members.fetch();
  } catch {
    return statusMsg.edit('❌ Não consegui buscar a lista de membros do servidor.');
  }

  const withRole = members.filter((m) => m.roles.cache.has(role.id));

  if (withRole.size === 0) {
    return statusMsg.edit(`ℹ️ Nenhum membro possui o cargo **${role.name}** no momento.`);
  }

  const names = withRole.map((m) => `• ${m.user.tag} (${m.id})`);

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
    const embed = new EmbedBuilder()
      .setTitle(`👥 Membros com o cargo ${role.name} (${withRole.size} total)`)
      .setDescription(chunks[i])
      .setColor(role.color || 0x5865f2);

    if (i === 0) {
      await statusMsg.edit({ content: null, embeds: [embed] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }
}

// ---------- Eventos (entrada automática e reação) ----------
// Registrados sob demanda no client, uma única vez por processo.

function registerEvents(client) {
  if (client.__autoroleEventsRegistered) return;
  client.__autoroleEventsRegistered = true;

  client.on('guildMemberAdd', async (member) => {
    try {
      const data = loadData();
      const guildConfig = data[member.guild.id];
      if (!guildConfig || !guildConfig.entrada) return;

      const role = member.guild.roles.cache.get(guildConfig.entrada);
      if (!role) return;

      await member.roles.add(role).catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em guildMemberAdd:', err);
    }
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch().catch(() => null);
      if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
      if (!reaction.message.guild) return;

      const data = loadData();
      const guildConfig = data[reaction.message.guild.id];
      if (!guildConfig || !guildConfig.reagir?.length) return;

      const emojiKey = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;

      const config = guildConfig.reagir.find(
        (r) =>
          r.messageId === reaction.message.id &&
          (r.emoji === emojiKey || r.emoji === reaction.emoji.name)
      );
      if (!config) return;

      const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
      const role = reaction.message.guild.roles.cache.get(config.roleId);
      if (!member || !role) return;

      await member.roles.add(role).catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em messageReactionAdd:', err);
    }
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch().catch(() => null);
      if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
      if (!reaction.message.guild) return;

      const data = loadData();
      const guildConfig = data[reaction.message.guild.id];
      if (!guildConfig || !guildConfig.reagir?.length) return;

      const emojiKey = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;

      const config = guildConfig.reagir.find(
        (r) =>
          r.messageId === reaction.message.id &&
          (r.emoji === emojiKey || r.emoji === reaction.emoji.name)
      );
      if (!config) return;

      const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
      const role = reaction.message.guild.roles.cache.get(config.roleId);
      if (!member || !role) return;

      await member.roles.remove(role).catch(() => {});
    } catch (err) {
      console.error('[autorole] erro em messageReactionRemove:', err);
    }
  });
}

// ---------- Contrato do commandLoader ----------

export default {
  name: 'autorole',
  description: 'Configura cargo automático de entrada, cargo por reação, atribuição em massa e status de um cargo.',
  async execute(message, args) {
    if (!message.guild) return;

    // Garante que os listeners de guildMemberAdd/reação estão ativos.
    registerEvents(message.client);

    if (!isAdmin(message)) {
      return message.reply('🚫 Apenas administradores podem usar o comando `autorole`.');
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
        return cmdAll(message, rest, data);
      case 'status':
        return cmdStatus(message, rest);
      case 'help':
      case '':
        return message.reply({ embeds: [helpEmbed()] });
      default:
        return message.reply(
          '⚠️ Subcomando desconhecido. Use `rp!autorole help` para ver a lista de comandos.'
        );
    }
  },
};
