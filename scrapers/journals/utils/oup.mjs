export function createOUPScraper(journal, abbreviation, url) {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });

            let calls = await page.$$eval('a[href*="call_for_papers"], a[href*="call-for-papers"], .call-for-papers a', items => items.map(item => ({
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
    const rawContent = await page.$eval('article, main, .widget-items, #ContentColumn', element => element.innerHTML).catch(() => '');
    await page.close();
    return rawContent;
}
