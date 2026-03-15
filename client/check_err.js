import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('BROWSER ERROR:', msg.text());
            }
        });

        page.on('pageerror', err => {
            console.log('BROWSER PAGE ERROR:', err.toString());
        });

        await page.goto('http://localhost:5174/admin/arrears/manage', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log("Page loaded. Any errors above?");
        await browser.close();
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
