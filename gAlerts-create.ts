import { chromium, BrowserContext, Page } from 'playwright';
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';

// Set the name of csv file and sites to load
const ALERTS_CSV = "alerts.csv"
const SITE_DATA = "sites.txt"
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
        fs.readFile(path.resolve(__dirname, `data/${ALERTS_CSV}`), 'utf8'),
        fs.readFile(path.resolve(__dirname, `data/${SITE_DATA}`),  'utf8'),
    ]);

    // Parse CSV data into list of alert rows
    const alerts: AlertRow[] = parse(alertsCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as AlertRow[];

    // Parse wordlist entries into list
    const sites = sitesTxt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Create new page in browser context
    const page = await context.newPage();
    await page.goto('https://www.google.com/alerts');

    // Define element locators
    const searchInput  = page.getByRole('searchbox', { name: /search terms|query/i });
    const showOptsBtn  = page.getByRole('button',    { name: /show options/i });
    const frequencySel = page.getByLabel('How often');
    const howManySel   = page.getByLabel('How many results');
    const emailInput   = page.getByRole('textbox',   { name: /deliver to/i });
    const createBtn    = page.getByRole('button',    { name: /create alert/i });

    // Sequentially iterate on each site
    for (const site of sites) {
        // Iterate on all rows of alerts per site
        for (const row of alerts) {
            // Format the search query
            const fullQuery = `${row.query} site:${site}`;

            try {
                // Wait for the form to be ready
                await searchInput.waitFor({ state: 'visible' });

                // Fill the query
                await searchInput.fill(fullQuery);

                // open the options panel if it’s still collapsed
                if (await showOptsBtn.isVisible()) {
                    await showOptsBtn.click();
                }

                // Set the dropdowns
                await frequencySel.selectOption(row.frequency);
                await howManySel.selectOption(row.howMany);

                // Override the "deliver to" if needed
                if (row.deliverTo) {
                    await emailInput.fill(row.deliverTo);
                }

                // Submit the form
                await createBtn.click();

                console.log(`[+] Alert created for [${site}]: "${row.query}"`);

                // Wait for the request process and the form will be cleared
                const inputHandle = await searchInput.elementHandle();
                if (inputHandle) {
                    await page.waitForFunction(
                        (el) => (el as HTMLInputElement).value.trim() === '',
                        inputHandle
                    );
                }
            } catch (err) {
                console.error(`[*] Error on [${site}] "${row.query}":`, err);
            }

            // Sleep a random 2–5 seconds before next alert creation
            await sleepRandom(2, 5);
        }
    }

    console.log('[!] Alert creation process complete');
})();
