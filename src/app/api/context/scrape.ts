import crypto from 'crypto';
import https from 'https';
import fetch from 'node-fetch';
import { load, type Element } from 'cheerio';

interface Entry {
    readonly link: string;
    readonly title: string;
    readonly text: string;
}

const httpsAgent = new https.Agent({
    // for self signed you could also add
    // rejectUnauthorized: false,
    // allow legacy server
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});


async function getWebsiteSitemap(url: string, pages: number): Promise<string[]> {
    const response = await fetch(url, {
        agent: httpsAgent,
    });

    const $ = load(await response.text());

    const sitemapLinks: string[] = $('loc')
        .map((index: number, element: Element) => $(element).text().trim())
        .get();

    return sitemapLinks.slice(0, pages);
}

async function getEntriesFromLinks(links: string[]): Promise<Entry[]> {
    let allEntries: Entry[] = [];

    for (const link of links) {
        console.log('Scraping', link);

        try {
            const response = await fetch(link, {
                agent: httpsAgent,
            });

            const html = await response.text()

            const $ = load(html);

            const contentArray: string[] = [];

            $('p').each((index: number, element: Element) => {
                contentArray.push($(element).text().trim());
            });

            const title = $('title').text().trim()

            const content = contentArray
                .join('\n')
                .split('\n')
                .filter(line => line.length > 0)
                .map(line => ({ link: link, title, text: line }));

            //console.log('Content:', content)

            allEntries = allEntries.concat(content);
        } catch (error) {
            console.error(`Error processing ${link}:`, error);
        }
    }

    return allEntries;
}

export async function getDomObjects(url: string, pages: number): Promise<Entry[]> {
    const sitemapUrls = await getWebsiteSitemap(url, pages);
    const allEntries = await getEntriesFromLinks(sitemapUrls);

    return allEntries;
}
