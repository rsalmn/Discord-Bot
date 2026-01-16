const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donation')
        .setDescription('Manage donation messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a donation message')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of donation message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description text')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to post donation info')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a payment method')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The donation message ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('method')
                        .setDescription('Payment method')
                        .setRequired(true)
                        .addChoices(
                            { name: 'PayPal', value: 'paypal' },
                            { name: 'GoPay', value: 'gopay' },
                            { name: 'DANA', value: 'dana' },
                            { name: 'Bank Transfer', value: 'bank' },
                            { name: 'QRIS', value: 'qris' }
                        ))
                .addStringOption(option =>
                    option.setName('details')
                        .setDescription('Payment details (email, number, account, etc.)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a donation message')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The message ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all donation messages')),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`💰 ${title}`)
                .setDescription(description)
                .addFields({ name: 'Payment Methods', value: 'Use `/donation add` to add payment methods!' })
                .setFooter({ text: 'Thank you for your support!' })
                .setTimestamp();

            const message = await channel.send({ embeds: [embed] });

            const donationData = {
                messageId: message.id,
                channelId: channel.id,
                title,
                description,
                paymentMethods: []
            };

            client.donations.set(message.id, donationData);
            saveData(client);

            await interaction.reply({ content: `Donation message created! ID: ${message.id}`, ephemeral: true });

        } else if (subcommand === 'add') {
            const messageId = interaction.options.getString('messageid');
            const method = interaction.options.getString('method');
            const details = interaction.options.getString('details');

            const donationData = client.donations.get(messageId);

            if (!donationData) {
                return interaction.reply({ content: 'Donation message not found!', ephemeral: true });
            }

            const methodIcons = {
                paypal: '💳',
                gopay: '🟢',
                dana: '🔵',
                bank: '🏦',
                qris: '📱'
            };

            const methodNames = {
                paypal: 'PayPal',
                gopay: 'GoPay',
                dana: 'DANA',
                bank: 'Bank Transfer',
                qris: 'QRIS'
            };

            donationData.paymentMethods.push({
                method: methodNames[method],
                icon: methodIcons[method],
                details
            });

            client.donations.set(messageId, donationData);
            saveData(client);

            try {
                const channel = await client.channels.fetch(donationData.channelId);
                const message = await channel.messages.fetch(messageId);

                const fields = donationData.paymentMethods.map(pm => ({
                    name: `${pm.icon} ${pm.method}`,
                    value: pm.details,
                    inline: false
                }));

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle(`💰 ${donationData.title}`)
                    .setDescription(donationData.description)
                    .addFields(fields)
                    .setFooter({ text: 'Thank you for your support!' })
                    .setTimestamp();

                await message.edit({ embeds: [embed] });
                await interaction.reply({ content: 'Payment method added!', ephemeral: true });
            } catch (error) {
                console.error('Error updating donation message:', error);
                await interaction.reply({ content: 'Error updating message!', ephemeral: true });
            }

        } else if (subcommand === 'delete') {
            const messageId = interaction.options.getString('messageid');
            const donationData = client.donations.get(messageId);

            if (!donationData) {
                return interaction.reply({ content: 'Donation message not found!', ephemeral: true });
            }

            try {
                const channel = await client.channels.fetch(donationData.channelId);
                const message = await channel.messages.fetch(messageId);
                await message.delete();

                client.donations.delete(messageId);
                saveData(client);

                await interaction.reply({ content: 'Donation message deleted!', ephemeral: true });
            } catch (error) {
                console.error('Error deleting donation message:', error);
                await interaction.reply({ content: 'Error deleting message!', ephemeral: true });
            }

        } else if (subcommand === 'list') {
            const donations = Array.from(client.donations.values());

            if (donations.length === 0) {
                return interaction.reply({ content: 'No donation messages found!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💰 Donation Messages')
                .setDescription(donations.map(d => 
                    `**${d.title}** (ID: ${d.messageId})\n<#${d.channelId}> - ${d.paymentMethods.length} payment method(s)`
                ).join('\n\n'));

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    fs.writeFileSync(path.join(dataDir, 'donations.json'), JSON.stringify(Object.fromEntries(client.donations), null, 2));
}
