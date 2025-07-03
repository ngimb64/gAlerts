// create-alerts-sequential.ts
import { chromium, BrowserContext, Page } from 'playwright';
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';

// Set the name of csv file to load
const ALERTS_CSV = "alerts"
// Port to connect for remote debugging
const PORT = 9222;

type AlertRow = {
    query: string;
    frequency: 'd' | 'w' | 'm';
    howMany: 'all' | 'best';
    deliverTo?: string;
};

// Sleep for a random time between minSec and maxSec
function sleepRandom(minSec: number, maxSec: number): Promise<void> {
    const durationMs = (Math.random() * (maxSec - minSec) + minSec) * 1000;
    return new Promise(resolve => setTimeout(resolve, durationMs));
}


(async () => {
    // Attach to already open browser
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    const [context]: BrowserContext[] = browser.contexts();
    if (!context) {
        console.error('[*] No browser context found. Ensure Chrome/Edge is running with --remote-debugging-port flag');
        process.exit(1);
    }

    // Load the data files
    const [alertsCsv, sitesTxt] = await Promise.all([
        fs.readFile(path.resolve(__dirname, `data/${ALERTS_CSV}.csv`), 'utf8'),
        fs.readFile(path.resolve(__dirname, 'data/sites.txt'),  'utf8'),
    ]);

    // Parse CSV data into list of alert rows
    const alerts: AlertRow[] = parse(alertsCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as AlertRow[];

    // Parse wordlist entries into list
    const sites = sitesTxt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Sequentially iterate on each site
    for (const site of sites) {
        // Iterate on all rows of alerts per site
        for (const row of alerts) {
            // Create new page in browser context
            const page: Page = await context.newPage();

            try {
                await page.goto('https://www.google.com/alerts');

                // Fill in the combined query
                const fullQuery = `${row.query} site:${site}`;
                await page.fill('input[name="q"]', fullQuery);

                // Expand options if needed
                const btn = await page.$('button:has-text("Show options")');
                if (btn) await btn.click();

                // Set frequency & howMany
                await page.selectOption('select[name="t"]', row.frequency);
                await page.selectOption('select[name="n"]', row.howMany);

                // If email if specified, otherwise default gmail will be used
                if (row.deliverTo) {
                    const emailInput = await page.$('input[name="e"]');
                    if (emailInput) await emailInput.fill(row.deliverTo);
                }

                // submit
                await page.click('button:has-text("Create Alert")');
                console.log(`[+] Alert created:  [${site}] "${row.query}"`);

            // If an error occurs
            } catch (err) {
                console.error(`[*] Failed for [${site}] "${row.query}":`, err);
            // Ensure the page is closed per iteration
            } finally {
                await page.close();
            }

            // Sleep a random 2–5 seconds before next alert creation
            await sleepRandom(2, 5);
        }
    }

    await browser.close();
    console.log('[!] Alert creation process complete');
})();
