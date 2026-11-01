/**
 * ZMB OFFICIAL — command metadata used by usage and error embeds.
 *
 * Each entry mirrors the parsing that the command actually performs so the
 * syntax shown to members never drifts from the implementation. Keep this in
 * sync with the `usage` string inside every command module (the embed
 * validation check verifies that).
 */

const PERMISSIONS = {
  banMembers: 'Requires the **Ban Members** permission.',
  kickMembers: 'Requires the **Kick Members** permission.',
  moderateMembers: 'Requires the **Moderate Members** permission.',
  manageMessages: 'Requires the **Manage Messages** permission.',
  manageChannels: 'Requires the **Manage Channels** permission.',
  manageRoles: 'Requires the **Manage Roles** permission.',
  manageGuild: 'Requires the **Manage Server** permission.',
};

const MODERATION_REASON = 'Reason recorded in the case log and shown to the member.';

const COMMAND_META = {
  // ── General ────────────────────────────────────────────────────────────────
  help: {
    arguments: [{ name: 'command', required: false, description: 'Command name or alias to show details for.' }],
    examples: ['help', 'help ban'],
  },
  afk: {
    arguments: [{ name: 'reason', required: false, description: 'Short status shown while you are away.' }],
    examples: ['afk eating dinner'],
  },
  avatar: {
    arguments: [{ name: '@user', required: false, description: 'Member whose avatar to show. Defaults to you.' }],
    examples: ['avatar', 'avatar @Zara'],
  },
  botinfo: { arguments: [], examples: ['botinfo'] },
  invite: { arguments: [], examples: ['invite'] },
  ping: { arguments: [], examples: ['ping'] },
  serverinfo: { arguments: [], examples: ['serverinfo'] },
  setprefix: {
    arguments: [{ name: 'new prefix', required: true, description: 'New command prefix (1-3 characters).' }],
    examples: ['setprefix !'],
    permissions: PERMISSIONS.manageGuild,
  },
  uptime: { arguments: [], examples: ['uptime'] },
  userinfo: {
    arguments: [{ name: '@user', required: false, description: 'Member to inspect. Defaults to you.' }],
    examples: ['userinfo', 'userinfo @Zara'],
  },

  // ── Moderation ─────────────────────────────────────────────────────────────
  ban: {
    arguments: [
      { name: '@member', required: true, description: 'Member to ban. Mentions and user IDs are accepted.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['ban @Spammer posting invite links'],
    permissions: PERMISSIONS.banMembers,
  },
  kick: {
    arguments: [
      { name: '@member', required: true, description: 'Member to kick.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['kick @Troll repeated warnings ignored'],
    permissions: PERMISSIONS.kickMembers,
  },
  timeout: {
    arguments: [
      { name: '@member', required: true, description: 'Member to time out.' },
      { name: 'duration', required: true, description: 'Duration such as 10m, 1h or 2d (maximum 28d).' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['timeout @Flooder 10m spamming chat'],
    permissions: PERMISSIONS.moderateMembers,
  },
  untimeout: {
    arguments: [
      { name: '@member', required: true, description: 'Member whose timeout to remove.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['untimeout @Flooder appeal accepted'],
    permissions: PERMISSIONS.moderateMembers,
  },
  warn: {
    arguments: [
      { name: '@member', required: true, description: 'Member to warn.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['warn @Troll off-topic in #general'],
    permissions: PERMISSIONS.moderateMembers,
  },
  warnings: {
    arguments: [{ name: '@member', required: true, description: 'Member whose warnings to list.' }],
    examples: ['warnings @Troll'],
    permissions: PERMISSIONS.moderateMembers,
  },
  clear: {
    arguments: [
      { name: 'amount', required: true, description: 'Number of messages to delete (1-100).' },
      { name: '@member', required: false, description: 'Only delete messages sent by this member.' },
    ],
    examples: ['clear 25', 'clear 50 @Spammer'],
    permissions: PERMISSIONS.manageMessages,
  },
  jail: {
    arguments: [
      { name: '@member', required: true, description: 'Member to move into the jail role.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['jail @Troll cooling off period'],
    permissions: PERMISSIONS.moderateMembers,
  },
  unjail: {
    arguments: [
      { name: '@member', required: true, description: 'Member to release from jail.' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['unjail @Troll served their time'],
    permissions: PERMISSIONS.moderateMembers,
  },
  setjail: {
    arguments: [
      { name: 'role', required: true, description: 'Role used to mark jailed members.' },
      { name: '#channel', required: true, description: 'Channel jailed members can talk in.' },
    ],
    examples: ['setjail @Jailed #jail'],
    permissions: PERMISSIONS.manageGuild,
  },
  lock: {
    arguments: [
      { name: 'channel', required: false, description: 'Channel to lock. Defaults to the current channel.' },
      { name: 'reason', required: false, description: 'Reason shown in the audit log.' },
    ],
    examples: ['lock', 'lock #general cooling down'],
    permissions: PERMISSIONS.manageChannels,
  },
  unlock: {
    arguments: [
      { name: 'channel', required: false, description: 'Channel to unlock. Defaults to the current channel.' },
      { name: 'reason', required: false, description: 'Reason shown in the audit log.' },
    ],
    examples: ['unlock', 'unlock #general discussion resumed'],
    permissions: PERMISSIONS.manageChannels,
  },
  slowmode: {
    arguments: [
      { name: 'seconds', required: true, description: 'Delay between messages (0-21600 seconds).' },
      { name: 'channel', required: false, description: 'Target channel. Defaults to the current channel.' },
    ],
    examples: ['slowmode 10', 'slowmode 0 #general'],
    permissions: PERMISSIONS.manageChannels,
  },
  unban: {
    arguments: [
      { name: 'user_id', required: true, description: 'ID of the banned user (right-click → Copy User ID).' },
      { name: 'reason', required: false, description: MODERATION_REASON },
    ],
    examples: ['unban 123456789012345678 appeal accepted'],
    permissions: PERMISSIONS.banMembers,
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  announce: {
    arguments: [
      { name: '#channel', required: true, description: 'Channel to post the announcement in.' },
      { name: 'message', required: true, description: 'Announcement text.' },
    ],
    examples: ['announce #announcements Server maintenance at 20:00 UTC'],
    permissions: PERMISSIONS.manageMessages,
  },
  calculate: {
    arguments: [{ name: 'expression', required: true, description: 'Math expression to evaluate.' }],
    examples: ['calculate (12 * 4) / 3'],
  },
  channelinfo: {
    arguments: [{ name: '#channel', required: false, description: 'Channel to inspect. Defaults to the current one.' }],
    examples: ['channelinfo', 'channelinfo #general'],
  },
  firstmessage: {
    arguments: [{ name: '#channel', required: false, description: 'Channel to search. Defaults to the current one.' }],
    examples: ['firstmessage', 'firstmessage #general'],
  },
  membercount: { arguments: [], examples: ['membercount'] },
  poll: {
    arguments: [
      { name: 'question', required: true, description: 'Poll question.' },
      { name: 'option1', required: true, description: 'First answer choice.' },
      { name: 'option2', required: true, description: 'Second answer choice.' },
      { name: 'option3...', required: false, description: 'Up to nine options in total.' },
    ],
    examples: ['poll Movie night? | Friday | Saturday | Sunday'],
  },
  remind: {
    arguments: [
      { name: 'duration', required: true, description: 'Delay such as 30m, 2h or 1d.' },
      { name: 'message', required: true, description: 'What to remind you about.' },
    ],
    examples: ['remind 2h check the support ticket'],
  },
  roleinfo: {
    arguments: [{ name: '@role', required: true, description: 'Role to inspect.' }],
    examples: ['roleinfo @Moderator'],
  },
  say: {
    arguments: [{ name: 'message', required: true, description: 'Message for the bot to send.' }],
    examples: ['say Welcome to the server!'],
    permissions: PERMISSIONS.manageMessages,
  },

  // ── Logging ────────────────────────────────────────────────────────────────
  logsettings: { arguments: [], examples: ['logsettings'], permissions: PERMISSIONS.manageGuild },
  setlogchannel: {
    arguments: [
      { name: 'type', required: true, description: 'Log type: chat, server, role or mod.' },
      { name: '#channel', required: true, description: 'Channel that receives the logs.' },
    ],
    examples: ['setlogchannel mod #mod-logs'],
    permissions: PERMISSIONS.manageGuild,
  },
  viewlogs: {
    arguments: [
      { name: 'type', required: false, description: 'Log type filter such as mod or chat.' },
      { name: 'amount', required: false, description: 'How many entries to show (default 10).' },
    ],
    examples: ['viewlogs', 'viewlogs mod 20'],
    permissions: PERMISSIONS.manageGuild,
  },

  // ── Welcome ────────────────────────────────────────────────────────────────
  setautorole: {
    arguments: [{ name: '@role', required: true, description: 'Role given to every new member.' }],
    examples: ['setautorole @Member'],
    permissions: PERMISSIONS.manageGuild,
  },
  setwelcome: {
    arguments: [
      { name: '#channel', required: true, description: 'Channel that receives welcome messages.' },
      { name: 'message', required: true, description: 'Message text. `{user}` and `{server}` are replaced.' },
    ],
    examples: ['setwelcome #welcome Welcome {user} to {server}!'],
    permissions: PERMISSIONS.manageGuild,
  },
  setgoodbye: {
    arguments: [
      { name: '#channel', required: true, description: 'Channel that receives goodbye messages.' },
      { name: 'message', required: false, description: 'Custom message text. Defaults to the standard farewell.' },
    ],
    examples: ['setgoodbye #goodbye {user} left the server'],
    permissions: PERMISSIONS.manageGuild,
  },

  // ── XP ─────────────────────────────────────────────────────────────────────
  addxp: {
    arguments: [
      { name: '@member', required: true, description: 'Member who receives XP.' },
      { name: 'amount', required: true, description: 'Positive XP amount.' },
    ],
    examples: ['addxp @Zara 250'],
    permissions: PERMISSIONS.manageGuild,
  },
  removexp: {
    arguments: [
      { name: '@member', required: true, description: 'Member who loses XP.' },
      { name: 'amount', required: true, description: 'XP amount to remove.' },
    ],
    examples: ['removexp @Zara 100'],
    permissions: PERMISSIONS.manageGuild,
  },
  setlevelreward: {
    arguments: [
      { name: 'level', required: true, description: 'Level that grants the role.' },
      { name: '@role', required: true, description: 'Role granted at that level.' },
    ],
    examples: ['setlevelreward 10 @Active'],
    permissions: PERMISSIONS.manageGuild,
  },
  xpconfig: {
    arguments: [
      { name: 'action', required: true, description: 'One of on, off, config, cooldown, min, max, ignore, unignore.' },
      { name: 'value', required: false, description: 'Value for the selected action, such as 60 or #no-xp.' },
    ],
    examples: ['xpconfig config', 'xpconfig cooldown 60', 'xpconfig ignore #no-xp'],
    permissions: PERMISSIONS.manageGuild,
  },
  rank: {
    arguments: [{ name: '@user', required: false, description: 'Member whose rank to show. Defaults to you.' }],
    examples: ['rank', 'rank @Zara'],
  },
  leaderboard: { arguments: [], examples: ['leaderboard'] },

  // ── Reaction roles ─────────────────────────────────────────────────────────
  buttonrole: {
    arguments: [
      { name: 'title', required: true, description: 'Embed title for the role menu.' },
      { name: 'label @role', required: true, description: 'Button label paired with a role.', requiredHint: true },
      { name: 'label @role ...', required: false, description: 'Repeat for each additional button.' },
    ],
    examples: ['buttonrole Choose roles | Announcements @Announcements | Events @Events'],
    permissions: PERMISSIONS.manageRoles,
  },
  reactionrole: {
    arguments: [
      { name: 'title', required: true, description: 'Embed title for the role menu.' },
      { name: 'emoji @role', required: true, description: 'Emoji paired with a role.' },
      { name: 'emoji @role ...', required: false, description: 'Repeat for each additional role.' },
    ],
    examples: ['reactionrole Pick a color | 🔴 @Red | 🔵 @Blue'],
    permissions: PERMISSIONS.manageRoles,
  },

  // ── Embed builder & custom commands ────────────────────────────────────────
  embed: {
    arguments: [
      { name: 'send', required: true, description: 'Subcommand: send, save, load, list or delete.' },
      { name: 'args...', required: false, description: 'Subcommand arguments, such as a channel or template name.' },
    ],
    examples: ['embed send #announcements', 'embed list'],
    permissions: PERMISSIONS.manageMessages,
  },
  customcommand: {
    arguments: [
      { name: 'add|list|delete', required: true, description: 'Action to perform.' },
      { name: 'name', required: false, description: 'Custom command name (required for add and delete).' },
      { name: 'response', required: false, description: 'Response text (required for add).' },
    ],
    examples: ['customcommand add rules Read #rules please', 'customcommand list'],
    permissions: PERMISSIONS.manageGuild,
  },

  // ── Security ───────────────────────────────────────────────────────────────
  antispam: { arguments: [], examples: ['antispam'], permissions: PERMISSIONS.manageGuild },
};

function getCommandMeta(name) {
  if (!name) return null;
  return COMMAND_META[String(name).toLowerCase()] || null;
}

function hasCommandMeta(name) {
  return Boolean(getCommandMeta(name));
}

module.exports = { COMMAND_META, PERMISSIONS, getCommandMeta, hasCommandMeta };
