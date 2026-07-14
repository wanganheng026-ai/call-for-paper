import { parse } from '../../fileParser.mjs';

export function createWileyScraper(journal, abbreviation, url) {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });
            const correctPage = await page.$$eval('div.pb-rich-text h2, .special-issues h2, #special-issues h2', elements => elements.length > 0);
            if (!correctPage) {
                await page.close();
                return [];
            }

            // Try multiple common selectors for Wiley special issue listings
            let calls = await page.$$eval('table tr td:first-child p a', items => items.map(item => ({
                metaTitle: item.textContent,
                url: item.href,
            })));

            if (calls.length === 0) {
                calls = await page.$$eval('.special-issues a[href*="special"], #special-issues a[href*="special"]', items => items.map(item => ({
                    metaTitle: item.textContent,
                    url: item.href,
                })));
            }

            if (calls.length === 0) {
                calls = await page.$$eval('div.pb-rich-text a[href*="special"]', items => items.map(item => ({
                    metaTitle: item.textContent,
                    url: item.href,
                })));
            }

            calls = calls.map(call => ({
                journal,
                abbreviation,
                metaTitle: call.metaTitle,
                url: call.url,
            }));

            calls = await Promise.all(
                calls.map(async (call) => ({
                    ...call,
                    rawContent: call.url.endsWith('.pdf') ? await parse(browser, call.url) : await get_raw_content(browser, call.url)
                }))
            );

            await page.close();
            return calls;
        }
    };
}

async function get_raw_content(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const rawContent = await page.$eval('div.pb-rich-text, article, main', element => element.innerHTML).catch(() => '');
    await page.close();
    return rawContent;
}
