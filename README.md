# Discord Bot

A feature-rich Discord bot with multiple functionalities including giveaways, tickets, welcome messages, sticky messages, anti-spam, reaction roles, announcements, voting, donations, and forum management.

## Features

- **Giveaways**: Create, manage, and reroll giveaways
- **Ticket System**: Support ticket system with categories
- **Welcome/Leave Messages**: Customizable welcome and leave messages
- **Sticky Messages**: Create messages that stick to the bottom of channels
- **Anti-Spam**: Automatic spam protection
- **Reaction Roles**: Give roles based on reactions
- **Announcements**: Create and manage server announcements
- **Voting/Polls**: Create interactive polls with multiple options
- **Donation System**: Display donation information with multiple payment methods (PayPal, GoPay, DANA, Bank, QRIS)
- **Forum Management**: Create and manage forum channels and posts

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rsalmn/Discord-Bot.git
cd Discord-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your Discord bot token and client ID:
```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

5. Deploy the slash commands:
```bash
node deploy-commands.js
```

6. Start the bot:
```bash
npm start
```

## Bot Setup

### Creating a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the token and add it to your `.env` file
5. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
6. Go to "OAuth2" → "URL Generator"
7. Select the following scopes:
   - `bot`
   - `applications.commands`
8. Select the following bot permissions:
   - Administrator (or specific permissions as needed)
9. Copy the generated URL and use it to invite the bot to your server

## Commands

### Giveaway Commands
- `/giveaway create <prize> <duration> <winners> [channel]` - Create a new giveaway
- `/giveaway end <messageid>` - End a giveaway early
- `/giveaway reroll <messageid>` - Reroll a giveaway winner

### Ticket Commands
- `/ticket setup <channel> <category>` - Setup the ticket system
- `/ticket close` - Close the current ticket

### Welcome Commands
- `/welcome setwelcome <channel> <message>` - Set welcome message
  - Variables: `{user}`, `{username}`, `{server}`, `{membercount}`
- `/welcome setleave <message>` - Set leave message
- `/welcome disable` - Disable welcome/leave messages

### Sticky Message Commands
- `/sticky create <message> [channel]` - Create a sticky message
- `/sticky delete [channel]` - Delete sticky message

### Reaction Role Commands
- `/reactionrole create <title> <description> [channel]` - Create a reaction role message
- `/reactionrole add <messageid> <role> <emoji>` - Add a reaction role

### Announcement Commands
- `/announcement create <title> <message> <channel> [ping]` - Create an announcement
- `/announcement delete <messageid>` - Delete an announcement
- `/announcement list` - List all announcements

### Vote Commands
- `/vote <question> <options> [duration] [channel]` - Create a vote/poll
  - Options format: `Option1|Option2|Option3`

### Donation Commands
- `/donation create <title> <description> [channel]` - Create a donation message
- `/donation add <messageid> <method> <details>` - Add payment method
  - Methods: PayPal, GoPay, DANA, Bank Transfer, QRIS
- `/donation delete <messageid>` - Delete a donation message
- `/donation list` - List all donation messages

### Forum Commands
- `/forum create <name> [topic]` - Create a new forum channel
- `/forum post <forum> <title> <message>` - Create a forum post
- `/forum send <thread> <message>` - Send a message to a forum thread

## Features Details

### Anti-Spam
The bot automatically monitors messages and will delete messages from users who send 5 or more messages within 5 seconds, preventing spam.

### Sticky Messages
When a sticky message is set in a channel, it will automatically be reposted at the bottom of the channel whenever someone sends a message.

### Welcome/Leave Messages
Set custom messages that will be sent when members join or leave the server. Use variables like `{user}`, `{username}`, `{server}`, and `{membercount}` to personalize messages.

### Reaction Roles
Create messages where users can react with emojis to receive specific roles automatically.

## Data Storage

The bot stores data in JSON files in the `data/` directory:
- `giveaways.json` - Giveaway data
- `tickets.json` - Ticket configuration
- `welcome.json` - Welcome/leave message configuration
- `sticky.json` - Sticky message data
- `reactionRoles.json` - Reaction role configuration
- `announcements.json` - Announcement data
- `votes.json` - Vote/poll data
- `donations.json` - Donation message data

## Development

To run the bot in development mode:
```bash
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the repository owner.