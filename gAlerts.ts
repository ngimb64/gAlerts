import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { constants } from 'fs';
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';

// Port to connect for remote debugging
const PORT = 9222;

type AlertRow = {
    query: string;
    frequency: 'a' | 'd' | 'w';
    howMany: 'best' | 'all';
};

// Ensure the the passed in file paths exist
async function ensureFilesExist(...paths: string[]) {
    for (const p of paths) {
        try {
            await fs.access(p, constants.F_OK);
        } catch {
            console.error(`[*] Required file missing:  ${p}`);
            process.exit(1);
        }
    }
}

// Sleep for a random time between minSec and maxSec
function sleepRandom(minSec: number, maxSec: number): Promise<void> {
    const durationMs = (Math.random() * (maxSec - minSec) + minSec) * 1000;
    return new Promise(resolve => setTimeout(resolve, durationMs));
}


(async () => {
    // Attach to already open browser via Chrome Devtools Protocol
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    const [context]: BrowserContext[] = browser.contexts();
    if (!context) {
        console.error('[*] No browser context found. Ensure Chrome/Edge is running with --remote-debugging-port flag');
        process.exit(1);
    }

    // Grab the two passed in file args
    const args = process.argv;
    const alertsFile = args[2];
    const sitesFile  = args[3];

    // If either is missing, raise an error and exit
    if (!alertsFile || !sitesFile) {
        console.error('Missing required parameters: <alerts.csv> <sites.txt>');
        process.exit(1);
    }

    // Set the file path for each passed in file
    const alertsPath = path.resolve(__dirname, `data/${alertsFile}`)
    const sitesPath = path.resolve(__dirname, `data/${sitesFile}`)

    // Ensure the passed in files exist
    await ensureFilesExist(alertsPath, sitesPath)

    // Load the data files
    const [alertsCsv, sitesTxt] = await Promise.all([
        fs.readFile(alertsPath, 'utf8'),
        fs.readFile(sitesPath,  'utf8'),
    ]);

    // Parse CSV data into list of alert rows
    const alerts: AlertRow[] = parse(alertsCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        quote: "",
    }) as AlertRow[];

    // Parse wordlist entries into list
    const sites = sitesTxt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Create new page in browser context
    const page = await context.newPage();
    await page.goto('https://www.google.com/alerts');

    // Define element locators
    const searchInput  = page.getByRole('textbox', { name: /create an alert about.../i });
    const showOptsBtn  = page.getByRole('button',  { name: /show options/i });
    const createBtn    = page.getByRole('button',  { name: /create alert/i }).first();

    // Map each possible value to their perspective aria value used to set in drop down
    const freqMap: Record<AlertRow['frequency'], string> = {
        a: "As-it-happens",
        d: "At most once a day",
        w: "At most once a week"
    };
    const howManyMap: Record<AlertRow['howMany'], string> = {
        best: "Only the best results",
        all: "All results"
    };

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
                // Hit enter
                await searchInput.press('Enter')

                // open the options panel if it’s still collapsed
                if (await showOptsBtn.isVisible()) {
                    await showOptsBtn.click();
                }

                // Set aria position to select item in drop down
                const freqText = freqMap[row.frequency];
                // Locate the table row by its label text
                const freqRow = page.locator('tr', { hasText: 'How often' });
                // Within that row, grab the dropdown menu
                const frequencySel = freqRow.locator('[role="listbox"]').first()
                // Open the dropdown menu
                await frequencySel.click();
                // Click the option by text
                const freqOption = page.locator('.goog-menuitem-content',
                                                { hasText: freqText }).first();
                await freqOption.click()

                // Locate the table row by its label text
                const regionRow = page.locator('tr', { hasText: 'Region' });
                // Within that row, grab the dropdown menu
                const regionSel = regionRow.locator('[role="listbox"]').first()
                // Open the dropdown menu
                await regionSel.click();
                // Select the US
                const regionOption = page.locator('.goog-menuitem-content',
                                                  { hasText: 'United States' }).first()
                await regionOption.click()

                // Set aria position to select item in drop down
                const howManyText = howManyMap[row.howMany];
                // Locate the table row by its label text
                const howManyRow = page.locator('tr', { hasText: 'How many' });
                // Within that row, grab the dropdown
                const howManySel = howManyRow.locator('[role="listbox"]').first();
                // Open the drop down
                await howManySel.click();
                // Select the option based on text
                const howManyOption = page.locator('.goog-menuitem-content',
                                                   { hasText: howManyText }).first()
                await howManyOption.click()

                // Submit the form
                await createBtn.click();

                console.log(`[+] Alert created [${site}]:  "${row.query}"`);

                // Wait for the request process and the form will be cleared
                const inputHandle = await searchInput.elementHandle();
                if (inputHandle) {
                    await page.waitForFunction(
                        (el: any) => el.value.trim() === '',
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

    console.log('\n[!] Alert creation process complete');
    process.exit(0)
})();
