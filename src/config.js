module.exports = {
  defaultPrefix: ',',
  botName: 'ZMB',
  embedColor: 0x2B2D31,

  categories: [
    {
      name: 'General',
      description: 'Basic bot commands and server information',
      commands: ['help', 'ping', 'botinfo', 'serverinfo', 'userinfo', 'avatar', 'uptime', 'invite', 'setprefix', 'afk'],
    },
    {
      name: 'Moderation',
      description: 'Server moderation and member management',
      commands: ['ban', 'unban', 'kick', 'timeout', 'untimeout', 'warn', 'warnings', 'clear', 'lock', 'unlock', 'slowmode', 'jail', 'unjail'],
    },
    {
      name: 'Moderation Setup',
      description: 'Configure moderation and logging systems',
      commands: ['setjail', 'setlogchannel', 'logsettings', 'viewlogs', 'antispam'],
    },
    {
      name: 'Utility',
      description: 'Useful tools for everyday server use',
      commands: ['remind', 'calculate', 'poll', 'say', 'announce', 'channelinfo', 'roleinfo', 'membercount', 'firstmessage'],
    },
    {
      name: 'Configuration',
      description: 'Welcome, goodbye, auto role, XP, and custom commands',
      commands: ['setwelcome', 'setgoodbye', 'setautorole', 'xpconfig', 'setlevelreward', 'customcommand', 'reactionrole', 'buttonrole', 'embed', 'rank', 'leaderboard', 'addxp', 'removexp'],
    },
    {
      name: 'Information',
      description: 'Detailed information about the bot, server, and members',
      commands: ['botinfo', 'serverinfo', 'userinfo', 'channelinfo', 'roleinfo', 'membercount'],
    },
  ],
};
