const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Manage sticky messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a sticky message')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message to stick')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to stick the message in')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete sticky message from a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to remove sticky message from')
                        .setRequired(false))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const message = interaction.options.getString('message');
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const stickyMessage = await channel.send(message);

            const stickyData = {
                content: message,
                messageId: stickyMessage.id,
                channelId: channel.id
            };

            client.stickyMessages.set(channel.id, stickyData);
            await saveData(client);

            await interaction.reply({ content: `Sticky message created in ${channel}!`, ephemeral: true });

        } else if (subcommand === 'delete') {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const stickyData = client.stickyMessages.get(channel.id);

            if (!stickyData) {
                return interaction.reply({ content: 'No sticky message found in that channel!', ephemeral: true });
            }

            try {
                const message = await channel.messages.fetch(stickyData.messageId);
                await message.delete();
            } catch (error) {
                console.error('Error deleting sticky message:', error);
            }

            client.stickyMessages.delete(channel.id);
            await saveData(client);

            await interaction.reply({ content: 'Sticky message deleted!', ephemeral: true });
        }
    }
};

async function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.promises.writeFile(path.join(dataDir, 'sticky.json'), JSON.stringify(Object.fromEntries(client.stickyMessages), null, 2));
    } catch (error) {
        console.error('Error saving sticky data:', error);
    }
}
