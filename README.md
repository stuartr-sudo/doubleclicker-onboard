# Doubleclicker Onboard -- MCP Server

Submit blog site concepts directly from your AI agent.

## Setup

1. Clone this repo
2. Install and build:
   ```bash
   npm install
   npm run build
   ```
3. Add to your Claude Code settings (Settings -> MCP Servers):
   ```json
   {
     "mcpServers": {
       "doubleclicker": {
         "command": "node",
         "args": ["/absolute/path/to/doubleclicker-onboard/dist/index.js"],
         "env": {
           "DOUBLECLICKER_API_KEY": "dc_live_your_key_here",
           "DOUBLECLICKER_API_URL": "https://doubledoubleclickclick.fly.dev"
         }
       }
     }
   }
   ```
4. Restart Claude Code
5. Start a conversation: "I want to set up a new blog site"

## What happens

Your AI will guide you through defining:
- Site type (single or network)
- Niche and brand voice
- Target audience profile
- Visual direction (colors, mood)
- Affiliate products
- Content preferences
- Author info

Once collected, the AI submits your concept as a draft for review and provisioning.

## Requirements

- Node.js 20+
- An API key (contact your administrator)
