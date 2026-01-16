const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Setup welcome and leave messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setwelcome')
                .setDescription('Set the welcome message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for welcome/leave messages')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message (use {user}, {username}, {server}, {membercount})')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setleave')
                .setDescription('Set the leave message')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Leave message (use {user}, {username}, {server}, {membercount})')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable welcome/leave messages')),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'setwelcome') {
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');

            let welcomeConfig = client.welcomeConfig.get(guildId) || {};
            welcomeConfig.channelId = channel.id;
            welcomeConfig.welcomeMessage = message;

            client.welcomeConfig.set(guildId, welcomeConfig);
            await saveData(client);

            await interaction.reply({ 
                content: `Welcome message set!\n**Channel:** ${channel}\n**Message:** ${message}`, 
                ephemeral: true 
            });

        } else if (subcommand === 'setleave') {
            const message = interaction.options.getString('message');

            let welcomeConfig = client.welcomeConfig.get(guildId) || {};
            welcomeConfig.leaveMessage = message;

            client.welcomeConfig.set(guildId, welcomeConfig);
            await saveData(client);

            await interaction.reply({ 
                content: `Leave message set!\n**Message:** ${message}`, 
                ephemeral: true 
            });

        } else if (subcommand === 'disable') {
            client.welcomeConfig.delete(guildId);
            await saveData(client);

            await interaction.reply({ content: 'Welcome/leave messages disabled!', ephemeral: true });
        }
    }
};

async function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.promises.writeFile(path.join(dataDir, 'welcome.json'), JSON.stringify(Object.fromEntries(client.welcomeConfig), null, 2));
    } catch (error) {
        console.error('Error saving welcome data:', error);
    }
}
