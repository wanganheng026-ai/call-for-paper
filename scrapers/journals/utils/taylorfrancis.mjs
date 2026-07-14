export function createTaylorFrancisScraper(journal, abbreviation, url) {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });
            const correctPage = await page.$$eval('div.journalMetaTitle > h1, h1.journal-heading', elements => elements.length > 0);
            if (!correctPage) {
                await page.close();
                return [];
            }

            let calls = await page.$$eval('div.cfpContent > a, .cfp-list a, a[href*="call-for-papers"]', items => items.map(item => ({
                metaTitle: item.textContent.trim(),
                url: item.href,
            })).filter(item => item.metaTitle.length > 0));

            calls = calls.map(call => ({
                journal,
                abbreviation,
                metaTitle: call.metaTitle,
                url: call.url,
            }));

            calls = await Promise.all(
                calls.map(async (call) => ({
                    ...call,
                    rawContent: await get_raw_content(browser, call.url)
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
    const rawContent = await page.$eval('main#main-content > article, article, main', element => element.innerHTML).catch(() => '');
    await page.close();
    return rawContent;
}
