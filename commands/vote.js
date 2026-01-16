const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Create a vote/poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question to vote on')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Vote options separated by | (e.g., Option1|Option2|Option3)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (optional)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to post the vote')
                .setRequired(false)),

    async execute(interaction, client) {
        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        const duration = interaction.options.getInteger('duration');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const options = optionsString.split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) {
            return interaction.reply({ content: 'Please provide at least 2 options!', ephemeral: true });
        }

        if (options.length > 10) {
            return interaction.reply({ content: 'Maximum 10 options allowed!', ephemeral: true });
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        let description = options.map((option, index) => `${emojis[index]} ${option}`).join('\n');

        if (duration) {
            const endTime = Date.now() + (duration * 60 * 1000);
            description += `\n\n⏰ Ends <t:${Math.floor(endTime / 1000)}:R>`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(`📊 ${question}`)
            .setDescription(description)
            .setFooter({ text: `Vote created by ${interaction.user.username}` })
            .setTimestamp();

        const message = await channel.send({ embeds: [embed] });

        for (let i = 0; i < options.length; i++) {
            await message.react(emojis[i]);
        }

        const voteData = {
            messageId: message.id,
            channelId: channel.id,
            question,
            options,
            author: interaction.user.id,
            timestamp: Date.now(),
            duration,
            ended: false
        };

        client.votes.set(message.id, voteData);
        await saveData(client);

        await interaction.reply({ content: `Vote created in ${channel}!`, ephemeral: true });
    }
};

async function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.promises.writeFile(path.join(dataDir, 'votes.json'), JSON.stringify(Object.fromEntries(client.votes), null, 2));
    } catch (error) {
        console.error('Error saving vote data:', error);
    }
}
