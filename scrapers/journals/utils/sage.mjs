import { parse } from '../../fileParser.mjs';

export function createSageScraper(journal, abbreviation, url) {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });
            const correctPage = await page.$$eval('div.sage-custom-pages h1, h1.page-title', elements => elements.length > 0);
            if (!correctPage) {
                await page.close();
                return [];
            }

            let calls = await page.$$eval('div.pb-rich-text a, .call-for-papers a, a[href*="call-for-papers"]', items => items.map(item => ({
                metaTitle: item.textContent.trim(),
                url: item.href,
            })).filter(item => item.metaTitle.length > 0 && !item.url.includes('#')));

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
