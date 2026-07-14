export function createGenericScraper(journal, abbreviation, url, contentSelector = 'body') {
    return {
        url,
        async scraper(browser) {
            let page = await browser.newPage();
            await page.goto(this.url, { waitUntil: 'domcontentloaded' });

            const calls = await page.$$eval(contentSelector, elements => {
                if (elements.length === 0) return [];
                return [{
                    metaTitle: document.title,
                    url: window.location.href,
                    rawContent: elements[0].innerHTML,
                }];
            });

            await page.close();
            return calls.map(call => ({
                journal,
                abbreviation,
                metaTitle: call.metaTitle,
                url: call.url,
                rawContent: call.rawContent,
            }));
        }
    };
}
