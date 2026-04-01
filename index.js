const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TEMPO_ALERTA = 1000 * 60 * 60 * 24 * 3; // 3 dias
const TEMPO_BAN = 1000 * 60 * 60 * 24 * 4;    // 4 dias

const CANAL_ALERTA = '1488628203290366086';
const CARGO_MOD = '1489012663261466806';

let ultimaAtividade = {};
let avisados = new Set();
let banidos = new Set();

client.on('ready', () => {
  console.log(`Online como ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot || !message.guild) return;

  if (message.member.roles.cache.has(CARGO_MOD)) {
    ultimaAtividade[message.author.id] = Date.now();
    avisados.delete(message.author.id);
    banidos.delete(message.author.id);
  }
});

setInterval(async () => {
  for (const guild of client.guilds.cache.values()) {

    const canal = guild.channels.cache.get(CANAL_ALERTA);
    const role = guild.roles.cache.get(CARGO_MOD);
    if (!role) continue;

    for (const member of role.members.values()) {

      // Ignorar dono e admins
      if (
        member.id === guild.ownerId ||
        member.permissions.has(PermissionsBitField.Flags.Administrator)
      ) continue;

      const ultima = ultimaAtividade[member.id] || 0;
      const tempo = Date.now() - ultima;

      // ALERTA
      if (tempo > TEMPO_ALERTA && !avisados.has(member.id)) {
        canal?.send(`<@${member.id}> está inativo há 3 dias.`);
        avisados.add(member.id);
      }

      // BAN
      if (tempo > TEMPO_BAN && !banidos.has(member.id)) {
        try {
          await member.ban({ reason: 'Inatividade +4 dias' });
          canal?.send(`<@${member.id}> foi banido por inatividade.`);
          banidos.add(member.id);
        } catch (err) {
          console.log(`Erro ao banir ${member.user.tag}:`, err.message);
        }
      }
    }
  }
}, 60000);

// usar variável de ambiente (Railway/Render)
client.login(process.env.TOKEN);
