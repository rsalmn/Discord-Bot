const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forum')
        .setDescription('Manage forum channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new forum channel')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the forum channel')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('topic')
                        .setDescription('Topic/description of the forum')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setDescription('Create a new forum post')
                .addChannelOption(option =>
                    option.setName('forum')
                        .setDescription('The forum channel')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the post')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Content of the post')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a message to a forum thread')
                .addChannelOption(option =>
                    option.setName('thread')
                        .setDescription('The forum thread')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message to send')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const topic = interaction.options.getString('topic') || 'General discussion forum';

            try {
                const forumChannel = await interaction.guild.channels.create({
                    name: name,
                    type: ChannelType.GuildForum,
                    topic: topic
                });

                await interaction.reply({ content: `Forum channel created: ${forumChannel}`, ephemeral: true });
            } catch (error) {
                console.error('Error creating forum:', error);
                await interaction.reply({ content: 'Error creating forum channel!', ephemeral: true });
            }

        } else if (subcommand === 'post') {
            const forum = interaction.options.getChannel('forum');
            const title = interaction.options.getString('title');
            const message = interaction.options.getString('message');

            if (forum.type !== ChannelType.GuildForum) {
                return interaction.reply({ content: 'Please select a forum channel!', ephemeral: true });
            }

            try {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(title)
                    .setDescription(message)
                    .setFooter({ text: `Posted by ${interaction.user.username}` })
                    .setTimestamp();

                const thread = await forum.threads.create({
                    name: title,
                    message: { embeds: [embed] }
                });

                await interaction.reply({ content: `Forum post created: ${thread}`, ephemeral: true });
            } catch (error) {
                console.error('Error creating forum post:', error);
                await interaction.reply({ content: 'Error creating forum post!', ephemeral: true });
            }

        } else if (subcommand === 'send') {
            const thread = interaction.options.getChannel('thread');
            const message = interaction.options.getString('message');

            if (!thread.isThread()) {
                return interaction.reply({ content: 'Please select a forum thread!', ephemeral: true });
            }

            try {
                await thread.send(message);
                await interaction.reply({ content: 'Message sent to forum thread!', ephemeral: true });
            } catch (error) {
                console.error('Error sending message to forum:', error);
                await interaction.reply({ content: 'Error sending message!', ephemeral: true });
            }
        }
    }
};
