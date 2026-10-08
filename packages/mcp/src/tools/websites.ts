import { z } from 'zod';
import { toIso } from '../lib/dates';
import { clamp, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, pageInfo } from '../lib/limits';
import { buildTrackingSnippet } from '../lib/snippet';
import { defineTool } from '../lib/tool';

export const listWebsites = defineTool({
  name: 'list_websites',
  title: 'List websites',
  description:
    'Lists the websites the authenticated user can access, including websites shared through teams. ' +
    'Returns each website ID, name and domain. Call this first to find the websiteId required by every other tool. ' +
    'Results are paginated.',
  inputSchema: z.object({
    search: z.string().optional().describe('Filter websites by name or domain.'),
    page: z.number().int().positive().optional().describe('Page number, starting at 1.'),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(MAX_PAGE_SIZE)
      .optional()
      .describe(`Results per page (default ${DEFAULT_PAGE_SIZE}, max ${MAX_PAGE_SIZE}).`),
  }),
  async handler(input, { client }) {
    const result = await client.listWebsites({
      search: input.search,
      page: input.page ?? 1,
      pageSize: clamp(input.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
      includeTeams: 'true',
    });

    return {
      websites: result.data.map(website => ({
        id: website.id,
        name: website.name,
        domain: website.domain,
        teamId: website.teamId ?? null,
        createdAt: toIso(website.createdAt),
      })),
      ...pageInfo(result),
    };
  },
});

export const getWebsite = defineTool({
  name: 'get_website',
  title: 'Get website',
  description:
    'Retrieves detailed information and the tracking script snippet for a specific website by ID.',
  inputSchema: z.object({
    websiteId: z.string().describe('Unique identifier of the website.'),
  }),
  async handler(input, { client }) {
    const website = await client.getWebsite({ websiteId: input.websiteId });
    if (!website) {
      throw new Error(`Website not found: ${input.websiteId}`);
    }
    const tracking = buildTrackingSnippet(website.id, client.baseUrl);

    return {
      website: {
        id: website.id,
        name: website.name,
        domain: website.domain,
        teamId: website.teamId ?? null,
        shareId: website.shareId ?? null,
        resetAt: toIso(website.resetAt),
        createdAt: toIso(website.createdAt),
        updatedAt: toIso(website.updatedAt),
      },
      tracking,
    };
  },
});

export const createWebsite = defineTool({
  name: 'create_website',
  title: 'Create website',
  description:
    'Registers a new website in the analytics system and returns its ID and ready-to-embed tracking code.',
  inputSchema: z.object({
    name: z.string().min(1).max(100).describe('Display name of the website.'),
    domain: z.string().min(1).max(500).describe('Domain name or hostname (e.g. example.com).'),
    teamId: z.string().uuid().optional().describe('Optional team ID to assign the website to.'),
  }),
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  async handler(input, { client }) {
    const website = await client.createWebsite({
      name: input.name,
      domain: input.domain,
      teamId: input.teamId,
    });
    if (!website) {
      throw new Error('Failed to create website');
    }
    const tracking = buildTrackingSnippet(website.id, client.baseUrl);

    return {
      website: {
        id: website.id,
        name: website.name,
        domain: website.domain,
        teamId: website.teamId ?? null,
        createdAt: toIso(website.createdAt),
      },
      tracking,
    };
  },
});

export const updateWebsite = defineTool({
  name: 'update_website',
  title: 'Update website',
  description: 'Updates the display name or domain of an existing website in the analytics system.',
  inputSchema: z.object({
    websiteId: z.string().describe('Unique identifier of the website to update.'),
    name: z.string().min(1).max(100).optional().describe('New display name of the website.'),
    domain: z.string().min(1).max(500).optional().describe('New domain name or hostname.'),
  }),
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async handler(input, { client }) {
    const website = await client.updateWebsite({
      websiteId: input.websiteId,
      name: input.name,
      domain: input.domain,
    });
    if (!website) {
      throw new Error(`Website not found: ${input.websiteId}`);
    }
    const tracking = buildTrackingSnippet(website.id, client.baseUrl);

    return {
      website: {
        id: website.id,
        name: website.name,
        domain: website.domain,
        teamId: website.teamId ?? null,
        updatedAt: toIso(website.updatedAt),
      },
      tracking,
    };
  },
});

export const deleteWebsite = defineTool({
  name: 'delete_website',
  title: 'Delete website',
  description:
    'Permanently deletes a website and all its historical analytics data. ' +
    'Requires confirm: true to execute. If confirm is false or omitted, returns a safety warning without modifying state.',
  inputSchema: z.object({
    websiteId: z.string().describe('Unique identifier of the website to delete.'),
    confirm: z
      .boolean()
      .optional()
      .describe(
        'Set to true to confirm permanent deletion of the website and all its analytics data.',
      ),
  }),
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
  async handler(input, { client }) {
    if (!input.confirm) {
      let siteName = 'unknown';
      let domain = 'unknown';
      try {
        const site = await client.getWebsite({ websiteId: input.websiteId });
        if (site) {
          siteName = site.name ?? 'unknown';
          domain = site.domain ?? 'unknown';
        }
      } catch {
        // Fallback if site lookup fails
      }

      return {
        status: 'confirmation_required',
        message:
          `Deletion aborted. Deleting website "${siteName}" (${domain}, ID: ${input.websiteId}) will permanently erase all associated historical analytics data, sessions, pageviews, and events. ` +
          'To proceed with deletion, re-invoke this tool with confirm: true.',
        websiteId: input.websiteId,
        name: siteName,
        domain,
      };
    }

    await client.deleteWebsite({ websiteId: input.websiteId });

    return {
      status: 'deleted',
      message: `Website ${input.websiteId} and its analytics data were successfully deleted.`,
      websiteId: input.websiteId,
    };
  },
});
