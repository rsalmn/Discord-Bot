const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Setup reaction roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a reaction role message')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the reaction role message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the reaction role message')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the message')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a reaction role to a message')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The message ID')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to give')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to react with')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: 'React to get roles!' });

            const message = await channel.send({ embeds: [embed] });

            const reactionRoleData = {
                messageId: message.id,
                channelId: channel.id,
                roles: []
            };

            client.reactionRoles.set(message.id, reactionRoleData);
            await saveData(client);

            await interaction.reply({ content: `Reaction role message created! Use \`/reactionrole add\` to add roles.\nMessage ID: ${message.id}`, ephemeral: true });

        } else if (subcommand === 'add') {
            const messageId = interaction.options.getString('messageid');
            const role = interaction.options.getRole('role');
            const emoji = interaction.options.getString('emoji');

            const reactionRoleData = client.reactionRoles.get(messageId);

            if (!reactionRoleData) {
                return interaction.reply({ content: 'Message not found! Make sure you created it with `/reactionrole create` first.', ephemeral: true });
            }

            try {
                const channel = await client.channels.fetch(reactionRoleData.channelId);
                const message = await channel.messages.fetch(messageId);
                await message.react(emoji);

                reactionRoleData.roles.push({
                    roleId: role.id,
                    emoji: emoji
                });

                client.reactionRoles.set(messageId, reactionRoleData);
                await saveData(client);

                await interaction.reply({ content: `Reaction role added! ${emoji} → ${role}`, ephemeral: true });
            } catch (error) {
                console.error('Error adding reaction role:', error);
                await interaction.reply({ content: 'Error adding reaction role. Make sure the emoji is valid!', ephemeral: true });
            }
        }
    }
};

async function saveData(client) {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.promises.writeFile(path.join(dataDir, 'reactionRoles.json'), JSON.stringify(Object.fromEntries(client.reactionRoles), null, 2));
    } catch (error) {
        console.error('Error saving reaction role data:', error);
    }
}
