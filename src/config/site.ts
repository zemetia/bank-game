/**
 * Central "company brain" — single source of truth for all SEO, GEO, and LLMs.txt.
 * Edit this file first whenever you add a page or change brand/product details.
 * Every field here propagates to: metadata, sitemap, robots.txt, structured data, llms.txt.
 */

import type { MetadataRoute } from 'next';

export type SitemapChangeFreq = NonNullable<
  MetadataRoute.Sitemap[number]['changeFrequency']
>;

export interface PageConfig {
  /** URL path relative to root, e.g. '/about' */
  path: string;
  /** <title> for this page */
  title: string;
  /** Meta description — be specific: include what the visitor gains */
  description: string;
  /** Sitemap change frequency hint */
  changeFreq: SitemapChangeFreq;
  /** Sitemap priority 0.0–1.0 */
  priority: number;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  company: {
    legalName: string;
    foundedYear: number;
    industry: string;
    targetAudience: string;
    problemSolved: string;
    solution: string;
    keyBenefits: string[];
    contactEmail: string;
    socialLinks: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
  };
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    twitterHandle?: string;
    locale: string;
  };
  /** Registry of all public pages — drives sitemap + LLMs.txt page index */
  pages: Record<string, PageConfig>;
}

export const siteConfig: SiteConfig = {
  // ─── Core Identity ───────────────────────────────────────────────────────────
  name: 'BankGame',
  tagline: 'Virtual bank for any board or tabletop game.',
  description:
    'BankGame is a shared virtual bank simulator for any game that uses money. Create a room, invite players, and track every balance and transaction — no accounts needed.',
  url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://example.com',

  // ─── Brand Assets ────────────────────────────────────────────────────────────
  ogImage: '/og.png',

  // ─── Company Details (drives Organization schema + LLMs.txt) ─────────────────
  company: {
    legalName: 'BankGame',
    foundedYear: 2026,
    industry: 'Gaming / Utilities',
    targetAudience:
      'Players of board games, tabletop RPGs, and any game that tracks in-game currency.',
    problemSolved:
      'Managing in-game money with physical tokens or paper is slow, error-prone, and hard to audit.',
    solution:
      'BankGame provides a digital bank room that any player can join by code. The room master controls deposits and withdrawals; players transfer money between each other with a PIN-protected account.',
    keyBenefits: [
      'No accounts — join by room code and PIN',
      'Full transaction history for every player',
      'Room master controls who is in the game',
    ],
    contactEmail: 'contact@example.com',
    socialLinks: {},
  },

  // ─── SEO Settings ────────────────────────────────────────────────────────────
  seo: {
    titleTemplate: '%s | BankGame',
    defaultTitle: 'BankGame — Virtual Bank for Any Game',
    locale: 'en_US',
  },

  // ─── Pages Registry ──────────────────────────────────────────────────────────
  pages: {
    home: {
      path: '/',
      title: 'BankGame — Virtual Bank for Any Game',
      description:
        'Create a shared virtual bank for your game. Track balances, transfers, and transactions for every player in the room — no login required.',
      changeFreq: 'weekly',
      priority: 1.0,
    },
  },
};
