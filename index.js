require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ]
});

// Collections for commands and data
client.commands = new Collection();
client.giveaways = new Collection();
client.tickets = new Collection();
client.welcomeConfig = new Collection();
client.stickyMessages = new Collection();
client.spamTracking = new Collection();
client.reactionRoles = new Collection();
client.announcements = new Collection();
client.votes = new Collection();
client.donations = new Collection();

// Load data from files
function loadData() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    const dataFiles = ['giveaways.json', 'tickets.json', 'welcome.json', 'sticky.json', 'reactionRoles.json', 'announcements.json', 'votes.json', 'donations.json'];
    
    dataFiles.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({}));
        }
    });

    try {
        const giveawaysData = JSON.parse(fs.readFileSync(path.join(dataDir, 'giveaways.json'), 'utf8'));
        Object.entries(giveawaysData).forEach(([key, value]) => client.giveaways.set(key, value));

        const ticketsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tickets.json'), 'utf8'));
        Object.entries(ticketsData).forEach(([key, value]) => client.tickets.set(key, value));

        const welcomeData = JSON.parse(fs.readFileSync(path.join(dataDir, 'welcome.json'), 'utf8'));
        Object.entries(welcomeData).forEach(([key, value]) => client.welcomeConfig.set(key, value));

        const stickyData = JSON.parse(fs.readFileSync(path.join(dataDir, 'sticky.json'), 'utf8'));
        Object.entries(stickyData).forEach(([key, value]) => client.stickyMessages.set(key, value));

        const reactionRolesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'reactionRoles.json'), 'utf8'));
        Object.entries(reactionRolesData).forEach(([key, value]) => client.reactionRoles.set(key, value));

        const announcementsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'announcements.json'), 'utf8'));
        Object.entries(announcementsData).forEach(([key, value]) => client.announcements.set(key, value));

        const votesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'votes.json'), 'utf8'));
        Object.entries(votesData).forEach(([key, value]) => client.votes.set(key, value));

        const donationsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'donations.json'), 'utf8'));
        Object.entries(donationsData).forEach(([key, value]) => client.donations.set(key, value));
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Save data to files
function saveData() {
    const dataDir = path.join(__dirname, 'data');
    
    fs.writeFileSync(path.join(dataDir, 'giveaways.json'), JSON.stringify(Object.fromEntries(client.giveaways), null, 2));
    fs.writeFileSync(path.join(dataDir, 'tickets.json'), JSON.stringify(Object.fromEntries(client.tickets), null, 2));
    fs.writeFileSync(path.join(dataDir, 'welcome.json'), JSON.stringify(Object.fromEntries(client.welcomeConfig), null, 2));
    fs.writeFileSync(path.join(dataDir, 'sticky.json'), JSON.stringify(Object.fromEntries(client.stickyMessages), null, 2));
    fs.writeFileSync(path.join(dataDir, 'reactionRoles.json'), JSON.stringify(Object.fromEntries(client.reactionRoles), null, 2));
    fs.writeFileSync(path.join(dataDir, 'announcements.json'), JSON.stringify(Object.fromEntries(client.announcements), null, 2));
    fs.writeFileSync(path.join(dataDir, 'votes.json'), JSON.stringify(Object.fromEntries(client.votes), null, 2));
    fs.writeFileSync(path.join(dataDir, 'donations.json'), JSON.stringify(Object.fromEntries(client.donations), null, 2));
}

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// When the client is ready
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    loadData();
});

// Handle interactions (slash commands and buttons)
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            const reply = { content: 'There was an error executing this command!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    } else if (interaction.isButton()) {
        const [action, ...args] = interaction.customId.split('_');
        
        if (action === 'ticket') {
            await handleTicketButton(interaction, client);
        } else if (action === 'giveaway') {
            await handleGiveawayButton(interaction, client);
        }
    }
});

// Handle ticket button
async function handleTicketButton(interaction, client) {
    const [action, type] = interaction.customId.split('_');
    
    if (type === 'close') {
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: 'This can only be used in ticket channels!', ephemeral: true });
        }

        await interaction.reply('Closing ticket in 5 seconds...');
        
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('Error closing ticket:', error);
            }
        }, 5000);
        return;
    }

    const guildId = interaction.guild.id;
    const ticketConfig = client.tickets.get(guildId);
    
    if (!ticketConfig) {
        return interaction.reply({ content: 'Ticket system is not set up!', ephemeral: true });
    }

    const ticketName = `ticket-${interaction.user.username}`;
    const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);
    
    if (existingChannel) {
        return interaction.reply({ content: `You already have an open ticket: ${existingChannel}`, ephemeral: true });
    }

    try {
        const ticketChannel = await interaction.guild.channels.create({
            name: ticketName,
            type: 0,
            parent: ticketConfig.categoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Support Ticket')
            .setDescription(`Welcome ${interaction.user}, a staff member will be with you shortly.`)
            .setTimestamp();

        await ticketChannel.send({ embeds: [embed], components: [closeButton] });
        await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Failed to create ticket!', ephemeral: true });
    }
}

// Handle giveaway button
async function handleGiveawayButton(interaction, client) {
    const messageId = interaction.message.id;
    const giveaway = client.giveaways.get(messageId);
    
    if (!giveaway) {
        return interaction.reply({ content: 'This giveaway no longer exists!', ephemeral: true });
    }

    if (giveaway.ended) {
        return interaction.reply({ content: 'This giveaway has already ended!', ephemeral: true });
    }

    if (!giveaway.participants) {
        giveaway.participants = [];
    }

    if (giveaway.participants.includes(interaction.user.id)) {
        giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
        await interaction.reply({ content: 'You have left the giveaway!', ephemeral: true });
    } else {
        giveaway.participants.push(interaction.user.id);
        await interaction.reply({ content: 'You have entered the giveaway!', ephemeral: true });
    }

    client.giveaways.set(messageId, giveaway);
    saveData();
}

// Handle member join
client.on(Events.GuildMemberAdd, async member => {
    const guildId = member.guild.id;
    const welcomeConfig = client.welcomeConfig.get(guildId);
    
    if (!welcomeConfig || !welcomeConfig.channelId || !welcomeConfig.welcomeMessage) {
        return;
    }

    const channel = member.guild.channels.cache.get(welcomeConfig.channelId);
    if (!channel) return;

    let message = welcomeConfig.welcomeMessage
        .replace('{user}', `<@${member.id}>`)
        .replace('{username}', member.user.username)
        .replace('{server}', member.guild.name)
        .replace('{membercount}', member.guild.memberCount);

    try {
        await channel.send(message);
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

// Handle member leave
client.on(Events.GuildMemberRemove, async member => {
    const guildId = member.guild.id;
    const welcomeConfig = client.welcomeConfig.get(guildId);
    
    if (!welcomeConfig || !welcomeConfig.channelId || !welcomeConfig.leaveMessage) {
        return;
    }

    const channel = member.guild.channels.cache.get(welcomeConfig.channelId);
    if (!channel) return;

    let message = welcomeConfig.leaveMessage
        .replace('{user}', member.user.username)
        .replace('{username}', member.user.username)
        .replace('{server}', member.guild.name)
        .replace('{membercount}', member.guild.memberCount);

    try {
        await channel.send(message);
    } catch (error) {
        console.error('Error sending leave message:', error);
    }
});

// Handle messages for sticky and anti-spam
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // Anti-spam protection
    const guildId = message.guild?.id;
    if (guildId) {
        const userId = message.author.id;
        const key = `${guildId}_${userId}`;
        
        if (!client.spamTracking.has(key)) {
            client.spamTracking.set(key, []);
        }

        const userMessages = client.spamTracking.get(key);
        const now = Date.now();
        const recentMessages = userMessages.filter(time => now - time < 5000);
        
        recentMessages.push(now);
        client.spamTracking.set(key, recentMessages);

        if (recentMessages.length >= 5) {
            try {
                await message.delete();
                await message.channel.send(`${message.author}, please slow down! Anti-spam protection activated.`).then(msg => {
                    setTimeout(() => msg.delete(), 5000);
                });
                client.spamTracking.set(key, []);
            } catch (error) {
                console.error('Error handling spam:', error);
            }
        }
    }

    // Sticky messages
    const channelId = message.channel.id;
    const stickyData = client.stickyMessages.get(channelId);
    
    if (stickyData) {
        try {
            if (stickyData.messageId) {
                const oldMessage = await message.channel.messages.fetch(stickyData.messageId).catch(() => null);
                if (oldMessage) {
                    await oldMessage.delete();
                }
            }

            const newMessage = await message.channel.send(stickyData.content);
            stickyData.messageId = newMessage.id;
            client.stickyMessages.set(channelId, stickyData);
            saveData();
        } catch (error) {
            console.error('Error handling sticky message:', error);
        }
    }
});

// Handle reaction roles
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const reactionRoleData = client.reactionRoles.get(reaction.message.id);
    if (!reactionRoleData) return;

    const roleData = reactionRoleData.roles.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
    if (!roleData) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    const role = reaction.message.guild.roles.cache.get(roleData.roleId);
    
    if (role && member) {
        try {
            await member.roles.add(role);
        } catch (error) {
            console.error('Error adding role:', error);
        }
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;
    
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }

    const reactionRoleData = client.reactionRoles.get(reaction.message.id);
    if (!reactionRoleData) return;

    const roleData = reactionRoleData.roles.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
    if (!roleData) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    const role = reaction.message.guild.roles.cache.get(roleData.roleId);
    
    if (role && member) {
        try {
            await member.roles.remove(role);
        } catch (error) {
            console.error('Error removing role:', error);
        }
    }
});

// Periodically save data
setInterval(() => {
    saveData();
}, 60000); // Save every minute

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
