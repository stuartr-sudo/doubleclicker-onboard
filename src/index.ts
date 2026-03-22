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

const TOOL_DESCRIPTION = `Submit a site concept for blog provisioning. DO NOT call this tool until you have completed ALL phases below with the user.

═══════════════════════════════════════════════════════════
CRITICAL: This tool submits a PAID provisioning request.
You MUST walk the user through every phase below.
You MUST get explicit user confirmation before calling this tool.
DO NOT skip phases. DO NOT call this tool on the first message.
If the user just says "set up a blog about X" — that is the START
of the conversation, not permission to submit.
═══════════════════════════════════════════════════════════

You are a site concept CONSULTANT. Your job is to help the user build a well-researched, compelling site concept through conversation. Work through these phases IN ORDER, waiting for user input at each step:

PHASE 1 — DISCOVERY (ask, then wait for response):
- What niche or topic area?
- Single site or network of related sites?
- Any existing brand, or starting fresh?
If the niche is too broad (e.g. "health", "technology"), push back. Suggest 2-3 narrower sub-niches with reasoning. Help them pick one.

PHASE 2 — NICHE RESEARCH (research, then present findings to user):
- Search for competitors in the niche
- Identify content gaps and opportunities
- Present your findings and get the user's reaction
STOP and wait for user feedback before continuing.

PHASE 3 — AUDIENCE PROFILE (propose, then confirm with user):
- Based on your research, propose a specific ICA (Ideal Customer Avatar)
- Include: persona name, age range, income, pain points, goals, motivations, search behavior
- Ask: "Does this sound like your ideal reader? What would you change?"
STOP and wait for user confirmation or adjustments.

PHASE 4 — BRAND IDENTITY (suggest options, let user choose):
- Propose 2-3 brand voice options with example headlines for each
- Suggest a color palette that fits the niche (provide hex codes)
- Suggest a site name and tagline
- Recommend light vs dark theme
- Ask user to pick or adjust
STOP and wait for user choice.

PHASE 5 — CONTENT & MONETIZATION (research, then recommend):
- Suggest content types that work for this niche
- Research and recommend 3-5 REAL affiliate products/programs (real names, real URLs — do not make these up)
- Propose seed keywords based on search trends
- Recommend articles-per-day target
- Present recommendations and get user feedback
STOP and wait for user feedback.

PHASE 6 — AUTHOR & CONTACT (collect from user):
- Help craft an author name and bio that builds niche credibility
- Collect their email address (REQUIRED)
- Collect their name
STOP and wait for user input.

PHASE 7 — REVIEW & CONFIRM (present full summary, get explicit YES):
- Present a complete summary of EVERYTHING that will be submitted
- Include all fields organized clearly
- Ask: "Does this look right? Anything you'd like to change?"
- ONLY call this tool after the user says yes / confirms / approves
DO NOT call this tool without explicit confirmation.

═══════════════════════════════════════════════════════════
RULES:
- Be opinionated. Don't present 10 options. Present your best pick with 1-2 alternatives.
- Challenge weak ideas diplomatically. Generic = bad.
- Research before recommending. Use web search. Don't make up product names or URLs.
- Fill in the gaps. If the user doesn't know colors/keywords/products, figure it out for them.
- Quality over speed. 15 minutes of good conversation beats 3 minutes of generic output.
- NEVER call this tool without completing all phases and getting user confirmation.
═══════════════════════════════════════════════════════════`;

const SiteSchema = z.object({
  role: z
    .enum(["main", "hub", "sub"])
    .describe(
      "Role: 'main' for standalone single sites, 'hub' for the primary site in a network, 'sub' for satellite sites in a network"
    ),
  niche: z.string().describe("Specific topic or industry niche for this site"),
  brand_voice: z
    .string()
    .describe(
      'How the content should sound (e.g. "Authoritative yet approachable, grounded in peer-reviewed research")'
    ),
  tone: z
    .string()
    .optional()
    .describe(
      'Emotional quality of the writing (e.g. "Educational and empowering", "Conversational and witty")'
    ),
  placeholder_name: z
    .string()
    .optional()
    .describe("Suggested name for the site (e.g. 'The Longevity Post')"),
  tagline: z
    .string()
    .optional()
    .describe("Short tagline or slogan (e.g. 'Evidence-Based Health & Wellness')"),
  ica_profile: z
    .object({
      persona_name: z.string().optional().describe("Name for the ideal reader persona (e.g. 'Health-Conscious Hannah')"),
      age_range: z.string().optional().describe('Age range (e.g. "30-50")'),
      income: z.string().optional().describe('Income level (e.g. "$75k-$150k")'),
      pain_points: z.array(z.string()).optional().describe("Specific pain points this audience experiences"),
      goals: z.array(z.string()).optional().describe("What this audience is trying to achieve"),
      motivations: z.array(z.string()).optional().describe("What drives their decisions"),
      buying_behavior: z.string().optional().describe("How they research and buy products"),
      search_behaviour: z.array(z.string()).optional().describe("How they search for information — what terms, platforms, question formats"),
    })
    .optional()
    .describe("Ideal Customer Avatar — build this based on niche research, don't just ask the user"),
  style_guide: z
    .object({
      primary_color: z.string().optional().describe('Primary brand color as hex (e.g. "#1a5632")'),
      accent_color: z.string().optional().describe('Accent color as hex (e.g. "#c4a35a")'),
      heading_font: z.string().optional().describe("Heading font preference"),
      body_font: z.string().optional().describe("Body text font preference"),
      visual_mood: z.string().optional().describe('Visual mood (e.g. "Clean, clinical, trustworthy" or "Warm, earthy, approachable")'),
      imagery_style: z.string().optional().describe('Style of images (e.g. "High-quality photography, natural lighting" or "Minimalist illustrations")'),
      dark_light: z.enum(["dark", "light"]).optional().describe("Light or dark theme preference"),
    })
    .optional()
    .describe("Visual direction — suggest based on niche conventions"),
  affiliate_products: z
    .array(
      z.object({
        name: z.string().describe("Real product name"),
        category: z.string().optional().describe("Product category"),
        commission: z.string().optional().describe("Commission rate if known"),
        product_type: z.enum(["saas", "physical", "course"]).optional().describe("Product type"),
        url: z.string().optional().describe("Product or affiliate program URL"),
      })
    )
    .optional()
    .describe("Affiliate products — research real products in the niche, don't make them up"),
  content_types: z
    .array(z.string())
    .optional()
    .describe('Content formats (e.g. ["how-to guides", "product reviews", "listicles", "comparison posts"])'),
  seed_keywords: z
    .array(z.string())
    .optional()
    .describe("Seed keywords based on search trend research"),
  articles_per_day: z
    .number()
    .optional()
    .describe("Target articles per day (typically 3-5)"),
  languages: z
    .array(z.string())
    .optional()
    .describe('Additional languages beyond English (e.g. ["es", "fr"])'),
  author_name: z
    .string()
    .optional()
    .describe("Author name for the blog"),
  author_bio: z
    .string()
    .optional()
    .describe("Short author bio that builds credibility in the niche"),
});

const PayloadSchema = z.object({
  type: z
    .enum(["single", "network"])
    .describe("Whether this is a single site or a network of related sites"),
  network_name: z
    .string()
    .optional()
    .describe("Name for the network (only for network type, e.g. 'Health & Wellness Network')"),
  sites: z
    .array(SiteSchema)
    .min(1)
    .describe(
      "Site definitions. Single type: one site with role 'main'. Network: one 'hub' + one or more 'sub' sites."
    ),
  contact_email: z
    .string()
    .describe("Email address of the person submitting the concept"),
  contact_name: z
    .string()
    .optional()
    .describe("Name of the person submitting"),
  notes: z
    .string()
    .optional()
    .describe("Any additional notes or context for the reviewer"),
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
          text: `Site concept submitted successfully!\n\n${resultText}\n\nThe concept has been submitted as a draft and will be reviewed shortly. The admin will select a domain and provision the site.`,
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
