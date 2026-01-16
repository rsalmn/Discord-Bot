const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the ticket creation message')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category for ticket channels')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket')),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const channel = interaction.options.getChannel('channel');
            const category = interaction.options.getChannel('category');

            if (category.type !== ChannelType.GuildCategory) {
                return interaction.reply({ content: 'Please select a category channel!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎫 Support Tickets')
                .setDescription('Need help? Click the button below to create a support ticket!\n\nA staff member will assist you as soon as possible.')
                .setFooter({ text: 'Click the button to open a ticket' });

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_create')
                        .setLabel('Create Ticket')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary)
                );

            await channel.send({ embeds: [embed], components: [button] });

            const ticketConfig = {
                channelId: channel.id,
                categoryId: category.id
            };

            client.tickets.set(interaction.guild.id, ticketConfig);
            saveData(client);

            await interaction.reply({ content: 'Ticket system has been set up!', ephemeral: true });

        } else if (subcommand === 'close') {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: 'This command can only be used in ticket channels!', ephemeral: true });
            }

            await interaction.reply('Closing ticket in 5 seconds...');
            
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Error closing ticket:', error);
                }
            }, 5000);
        }
    }
};

function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    fs.writeFileSync(path.join(dataDir, 'tickets.json'), JSON.stringify(Object.fromEntries(client.tickets), null, 2));
}
