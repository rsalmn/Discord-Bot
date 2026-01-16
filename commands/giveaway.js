const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('The prize for the giveaway')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in minutes')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to post the giveaway')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The message ID of the giveaway')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll a giveaway winner')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The message ID of the giveaway')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const prize = interaction.options.getString('prize');
            const duration = interaction.options.getInteger('duration');
            const winners = interaction.options.getInteger('winners');
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const endTime = Date.now() + (duration * 60 * 1000);

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('🎉 GIVEAWAY 🎉')
                .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
                .setFooter({ text: 'Click the button below to enter!' })
                .setTimestamp();

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('giveaway_enter')
                        .setLabel('Enter Giveaway')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Primary)
                );

            const message = await channel.send({ embeds: [embed], components: [button] });

            const giveawayData = {
                prize,
                duration,
                winners,
                channelId: channel.id,
                messageId: message.id,
                endTime,
                participants: [],
                ended: false,
                guildId: interaction.guild.id
            };

            client.giveaways.set(message.id, giveawayData);
            saveData(client);

            setTimeout(() => endGiveaway(message.id, client), duration * 60 * 1000);

            await interaction.reply({ content: `Giveaway created in ${channel}!`, ephemeral: true });

        } else if (subcommand === 'end') {
            const messageId = interaction.options.getString('messageid');
            await endGiveaway(messageId, client);
            await interaction.reply({ content: 'Giveaway ended!', ephemeral: true });

        } else if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('messageid');
            const giveaway = client.giveaways.get(messageId);

            if (!giveaway) {
                return interaction.reply({ content: 'Giveaway not found!', ephemeral: true });
            }

            if (!giveaway.ended) {
                return interaction.reply({ content: 'This giveaway has not ended yet!', ephemeral: true });
            }

            if (giveaway.participants.length === 0) {
                return interaction.reply({ content: 'No participants to reroll!', ephemeral: true });
            }

            const winner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
            const channel = await client.channels.fetch(giveaway.channelId);
            
            await channel.send(`🎉 Reroll! New winner: <@${winner}> won **${giveaway.prize}**!`);
            await interaction.reply({ content: 'Giveaway rerolled!', ephemeral: true });
        }
    }
};

async function endGiveaway(messageId, client) {
    const giveaway = client.giveaways.get(messageId);
    
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;
    client.giveaways.set(messageId, giveaway);

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(messageId);

        if (giveaway.participants.length === 0) {
            await channel.send('Giveaway ended! No valid entries.');
            return;
        }

        const winnerCount = Math.min(giveaway.winners, giveaway.participants.length);
        const winners = [];
        const participantsCopy = [...giveaway.participants];

        for (let i = 0; i < winnerCount; i++) {
            const randomIndex = Math.floor(Math.random() * participantsCopy.length);
            winners.push(participantsCopy[randomIndex]);
            participantsCopy.splice(randomIndex, 1);
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 GIVEAWAY ENDED 🎉')
            .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.map(w => `<@${w}>`).join(', ')}`)
            .setTimestamp();

        await message.edit({ embeds: [embed], components: [] });
        await channel.send(`🎉 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**!`);

        saveData(client);
    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
}

function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    fs.writeFileSync(path.join(dataDir, 'giveaways.json'), JSON.stringify(Object.fromEntries(client.giveaways), null, 2));
}
