const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Manage announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create an announcement')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the announcement')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Announcement message')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send announcement')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('ping')
                        .setDescription('Ping @everyone')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an announcement')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The message ID of the announcement')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all announcements')),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const message = interaction.options.getString('message');
            const channel = interaction.options.getChannel('channel');
            const ping = interaction.options.getBoolean('ping') || false;

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`📢 ${title}`)
                .setDescription(message)
                .setFooter({ text: `Announced by ${interaction.user.username}` })
                .setTimestamp();

            const content = ping ? '@everyone' : '';
            const announcementMessage = await channel.send({ content, embeds: [embed] });

            const announcementData = {
                messageId: announcementMessage.id,
                channelId: channel.id,
                title,
                message,
                author: interaction.user.id,
                timestamp: Date.now()
            };

            client.announcements.set(announcementMessage.id, announcementData);
            saveData(client);

            await interaction.reply({ content: `Announcement created in ${channel}!`, ephemeral: true });

        } else if (subcommand === 'delete') {
            const messageId = interaction.options.getString('messageid');
            const announcementData = client.announcements.get(messageId);

            if (!announcementData) {
                return interaction.reply({ content: 'Announcement not found!', ephemeral: true });
            }

            try {
                const channel = await client.channels.fetch(announcementData.channelId);
                const message = await channel.messages.fetch(messageId);
                await message.delete();

                client.announcements.delete(messageId);
                saveData(client);

                await interaction.reply({ content: 'Announcement deleted!', ephemeral: true });
            } catch (error) {
                console.error('Error deleting announcement:', error);
                await interaction.reply({ content: 'Error deleting announcement!', ephemeral: true });
            }

        } else if (subcommand === 'list') {
            const announcements = Array.from(client.announcements.values())
                .filter(a => a.channelId && interaction.guild.channels.cache.has(a.channelId));

            if (announcements.length === 0) {
                return interaction.reply({ content: 'No announcements found!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📢 Announcements')
                .setDescription(announcements.map(a => 
                    `**${a.title}** (ID: ${a.messageId})\n<#${a.channelId}> - <t:${Math.floor(a.timestamp / 1000)}:R>`
                ).join('\n\n'));

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    fs.writeFileSync(path.join(dataDir, 'announcements.json'), JSON.stringify(Object.fromEntries(client.announcements), null, 2));
}
