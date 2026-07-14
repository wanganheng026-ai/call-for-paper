export function createINFORMSScraper(journal, abbreviation, url) {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });
            const correctPage = await page.$$eval('h1', elements => elements.length > 0);
            if (!correctPage) {
                await page.close();
                return [];
            }

            // INFORMS calls-for-papers page lists all journals; filter by journal name
            let calls = await page.$$eval('div.WordSection1, section', items => items.map(item => {
                const firstP = item.querySelector('p');
                return {
                    metaTitle: firstP ? firstP.textContent.trim() : '',
                    rawContent: item.innerHTML,
                };
            }).filter(item => item.metaTitle.length > 0));

            calls = calls.map(call => ({
                journal,
                abbreviation,
                metaTitle: call.metaTitle,
                url: url,
                rawContent: call.rawContent,
            }));

            await page.close();
            return calls;
        }
    };
}
