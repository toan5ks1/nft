import { flatten } from 'lodash-es';
import { MetadataRoute } from 'next';
import qs from 'query-string';
import urlJoin from 'url-join';

import { DEFAULT_LANG } from '@/const/locale';
import { SITEMAP_BASE_URL } from '@/const/url';
import { Locales, locales as allLocales } from '@/locales/resources';
import { DiscoverService } from '@/server/services/discover';
import { getCanonicalUrl } from '@/server/utils/url';
import { ProductCategory } from '@/types/discover';
import { isDev } from '@/utils/env';

export interface SitemapItem {
  alternates?: {
    languages?: string;
  };
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified?: string | Date;
  priority?: number;
  url: string;
}

export enum SitemapType {
  Pages = 'pages',
  Products = 'Products',
}

export const LAST_MODIFIED = new Date().toISOString();

export class Sitemap {
  sitemapIndexs = [{ id: SitemapType.Pages }, { id: SitemapType.Products }];

  private discoverService = new DiscoverService();

  private _generateSitemapLink(url: string) {
    return [
      '<sitemap>',
      `<loc>${url}</loc>`,
      `<lastmod>${LAST_MODIFIED}</lastmod>`,
      '</sitemap>',
    ].join('\n');
  }

  private _formatTime(time?: string) {
    try {
      if (!time) return LAST_MODIFIED;
      return new Date(time).toISOString() || LAST_MODIFIED;
    } catch {
      return LAST_MODIFIED;
    }
  }

  private _genSitemapItem = (
    lang: Locales,
    url: string,
    {
      lastModified,
      changeFrequency = 'monthly',
      priority = 0.4,
      noLocales,
      locales = allLocales,
    }: {
      changeFrequency?: SitemapItem['changeFrequency'];
      lastModified?: string;
      locales?: typeof allLocales;
      noLocales?: boolean;
      priority?: number;
    } = {},
  ) => {
    const sitemap = {
      changeFrequency,
      lastModified: this._formatTime(lastModified),
      priority,
      url:
        lang === DEFAULT_LANG
          ? getCanonicalUrl(url)
          : qs.stringifyUrl({ query: { hl: lang }, url: getCanonicalUrl(url) }),
    };
    if (noLocales) return sitemap;

    const languages: any = {};
    for (const locale of locales) {
      if (locale === lang) continue;
      languages[locale] = qs.stringifyUrl({
        query: { hl: locale },
        url: getCanonicalUrl(url),
      });
    }
    return {
      alternates: {
        languages,
      },
      ...sitemap,
    };
  };

  private _genSitemap(
    url: string,
    {
      lastModified,
      changeFrequency = 'monthly',
      priority = 0.4,
      noLocales,
      locales = allLocales,
    }: {
      changeFrequency?: SitemapItem['changeFrequency'];
      lastModified?: string;
      locales?: typeof allLocales;
      noLocales?: boolean;
      priority?: number;
    } = {},
  ) {
    if (noLocales)
      return [
        this._genSitemapItem(DEFAULT_LANG, url, {
          changeFrequency,
          lastModified,
          locales,
          noLocales,
          priority,
        }),
      ];
    return locales.map((lang) =>
      this._genSitemapItem(lang, url, {
        changeFrequency,
        lastModified,
        locales,
        noLocales,
        priority,
      }),
    );
  }

  getIndex(): string {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...this.sitemapIndexs.map((item) =>
        this._generateSitemapLink(
          getCanonicalUrl(SITEMAP_BASE_URL, isDev ? item.id : `${item.id}.xml`),
        ),
      ),
      '</sitemapindex>',
    ].join('\n');
  }

  async getAssistants(): Promise<MetadataRoute.Sitemap> {
    const list = await this.discoverService.getProductList({});
    const sitmap = list.data.map((item) =>
      this._genSitemap(urlJoin('/product', item.product.identifier), {
        lastModified: new Date(item?.product.createdAt.toString()).toISOString() || LAST_MODIFIED,
      }),
    );
    return flatten(sitmap);
  }

  async getPage(): Promise<MetadataRoute.Sitemap> {
    const assistantsCategory = Object.values(ProductCategory);

    return [
      ...this._genSitemap('/', { noLocales: true }),
      ...this._genSitemap('/chat', { noLocales: true }),
      ...this._genSitemap('/welcome', { noLocales: true }),
      /* ↓ cloud slot ↓ */

      /* ↑ cloud slot ↑ */
      ...this._genSitemap('/', { changeFrequency: 'daily', priority: 0.7 }),
      ...this._genSitemap('/products', { changeFrequency: 'daily', priority: 0.7 }),
      ...assistantsCategory.flatMap((slug) =>
        this._genSitemap(`/products/${slug}`, {
          changeFrequency: 'daily',
          priority: 0.7,
        }),
      ),
    ];
  }
  getRobots() {
    return [
      getCanonicalUrl('/sitemap-index.xml'),
      ...this.sitemapIndexs.map((index) =>
        getCanonicalUrl(SITEMAP_BASE_URL, isDev ? index.id : `${index.id}.xml`),
      ),
    ];
  }
}

export const sitemapModule = new Sitemap();
