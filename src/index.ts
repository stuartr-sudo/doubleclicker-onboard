#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.DOUBLECLICKER_API_KEY;
const API_URL =
  process.env.DOUBLECLICKER_API_URL || "https://doubledoubleclickclick.fly.dev";

if (!API_KEY) {
  console.error(
    "DOUBLECLICKER_API_KEY environment variable is required. Set it in your MCP server config."
  );
  process.exit(1);
}

const server = new McpServer({
  name: "doubleclicker-onboard",
  version: "1.0.0",
});

const TOOL_DESCRIPTION = `Submit a site concept for blog provisioning. Before calling this tool, you MUST guide the user through defining their site concept by collecting the following information through natural conversation:

1. SITE TYPE: Ask if they want a single blog site or a network of related sites. If network, ask how many sub-sites plus one hub site.

2. FOR EACH SITE, collect:
   - Niche (REQUIRED): What topic/industry is this site about?
   - Brand Voice (REQUIRED): How should the content sound? (e.g. "Authoritative yet approachable", "Casual and friendly")
   - Tone: More specific emotional quality (e.g. "Educational", "Inspirational")
   - Placeholder Name: A suggested name for the site
   - Tagline: A short tagline or slogan

3. TARGET AUDIENCE (ICA Profile):
   - Who is the ideal reader? (persona name, age range, income level)
   - What are their pain points?
   - What are their goals?
   - What motivates them?
   - How do they search for information?

4. VISUAL DIRECTION:
   - Primary and accent colors (hex codes if they have them, or describe and suggest)
   - Visual mood (e.g. "Clean and clinical", "Warm and earthy")
   - Font preferences (or let the system choose)
   - Light or dark theme preference

5. AFFILIATE PRODUCTS (if any):
   - Product names, categories, types (SaaS, physical, course)
   - URLs if available

6. CONTENT PREFERENCES:
   - What types of content? (how-to guides, product reviews, listicles, etc.)
   - Seed keywords they want to rank for
   - How many articles per day?
   - Additional languages beyond English?

7. AUTHOR INFO:
   - Author name for the blog
   - Short author bio

8. CONTACT INFO:
   - Their email address (REQUIRED)
   - Their name

Ask these questions conversationally — don't dump them all at once. Adapt based on what the user knows. If they're unsure about something optional, skip it. The minimum required is: type, niche, brand_voice, and contact_email.

When you have enough information, call this tool with the collected data.`;

const SiteSchema = z.object({
  role: z
    .enum(["single", "hub", "spoke"])
    .describe(
      "Role of this site: 'single' for standalone, 'hub' for the main site in a network, 'spoke' for satellite sites"
    ),
  niche: z.string().describe("Topic or industry for this site"),
  brand_voice: z
    .string()
    .describe(
      'How the content should sound (e.g. "Authoritative yet approachable")'
    ),
  tone: z
    .string()
    .optional()
    .describe(
      'More specific emotional quality (e.g. "Educational", "Inspirational")'
    ),
  placeholder_name: z
    .string()
    .optional()
    .describe("Suggested name for the site"),
  tagline: z.string().optional().describe("Short tagline or slogan"),
  ica_profile: z
    .object({
      persona_name: z.string().optional().describe("Name for the ideal reader persona"),
      age_range: z.string().optional().describe('Age range (e.g. "25-45")'),
      income_level: z
        .string()
        .optional()
        .describe('Income level (e.g. "$50k-$100k")'),
      pain_points: z
        .array(z.string())
        .optional()
        .describe("List of pain points"),
      goals: z.array(z.string()).optional().describe("List of goals"),
      motivations: z
        .array(z.string())
        .optional()
        .describe("What motivates them"),
      search_behavior: z
        .string()
        .optional()
        .describe("How they search for information"),
    })
    .optional()
    .describe("Ideal Customer Avatar profile"),
  visual_direction: z
    .object({
      primary_color: z
        .string()
        .optional()
        .describe('Primary brand color (hex code e.g. "#1A365D")'),
      accent_color: z
        .string()
        .optional()
        .describe('Accent color (hex code e.g. "#E53E3E")'),
      visual_mood: z
        .string()
        .optional()
        .describe(
          'Visual mood description (e.g. "Clean and clinical", "Warm and earthy")'
        ),
      font_preference: z
        .string()
        .optional()
        .describe("Font style preference or specific font name"),
      theme: z
        .enum(["light", "dark"])
        .optional()
        .describe("Light or dark theme preference"),
    })
    .optional()
    .describe("Visual and design direction"),
  affiliate_products: z
    .array(
      z.object({
        name: z.string().describe("Product name"),
        category: z
          .string()
          .optional()
          .describe("Product category"),
        type: z
          .enum(["saas", "physical", "course", "service", "other"])
          .optional()
          .describe("Product type"),
        url: z.string().optional().describe("Product URL"),
      })
    )
    .optional()
    .describe("Affiliate products to promote"),
  content_preferences: z
    .object({
      content_types: z
        .array(z.string())
        .optional()
        .describe(
          'Types of content (e.g. ["how-to guides", "product reviews", "listicles"])'
        ),
      seed_keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords they want to rank for"),
      articles_per_day: z
        .number()
        .optional()
        .describe("Target number of articles per day"),
      additional_languages: z
        .array(z.string())
        .optional()
        .describe("Languages beyond English"),
    })
    .optional()
    .describe("Content strategy preferences"),
  author: z
    .object({
      name: z.string().describe("Author name"),
      bio: z.string().optional().describe("Short author bio"),
    })
    .optional()
    .describe("Author information for the blog"),
});

const PayloadSchema = z.object({
  type: z
    .enum(["single", "network"])
    .describe("Whether this is a single site or a network of sites"),
  sites: z
    .array(SiteSchema)
    .min(1)
    .describe(
      "Array of site definitions. Single type has one site; network has hub + spokes"
    ),
  contact_email: z
    .string()
    .describe("Email address of the person submitting the concept"),
  contact_name: z.string().optional().describe("Name of the person submitting"),
});

server.tool("submit_site_concept", TOOL_DESCRIPTION, PayloadSchema.shape, async (args) => {
  try {
    const response = await fetch(`${API_URL}/api/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(args),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error submitting site concept (HTTP ${response.status}): ${responseText}`,
          },
        ],
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = responseText;
    }

    const resultText =
      typeof parsed === "object"
        ? JSON.stringify(parsed, null, 2)
        : String(parsed);

    return {
      content: [
        {
          type: "text" as const,
          text: `Site concept submitted successfully!\n\n${resultText}`,
        },
      ],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to submit site concept: ${message}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
