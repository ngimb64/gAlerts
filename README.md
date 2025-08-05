# gAlerts

## About

This project automates the creation of google alerts for automating monitoring websites

## Installation and Setup

If Node.js isn’t installed yet:
- Go to https://nodejs.org
- Download the LTS version (recommended for most users)
- Install as normal on Windows/macOS

Install dependencies:
```
npm install playwright csv-parse p-map
```

Install TypeScript + ts-node to run .ts files:
```
npm install --save-dev typescript ts-node @types/node
```

Create directory for playwright profile:
- Linux
```
mkdir -p ~/.config/playwright-profile
```
- Windows
```
mkdir C:\playwright-profile
```


## Usage

- If desired, add any additional site endpoints where queries will be applied to the sites.txt file in the data folder

- Enter data into Microsoft Excel or LibreOffice Calc and export the final product to a CSV file in the data folder called alerts.csv
- Ensure the columns are in the following order left to right:
	- query
	- frequency
	- howMany
	- deliverTo
<br>

- The CSV result of the columns will look like `query,frequency,howMany,deliverTo`
<br>

- The browser must be launched with a remote debugging port specified so code can be run after authentication

| Browser | OS | Command |
|---------|----|---------|
|Brave|Linux|brave-browser --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com/alerts|
|Brave|Windows|"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com/alerts|
|Chromium|Linux|chromium --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com/alerts|
|Chromium|Windows|"C:\Program Files\Chromium\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com/alerts|
|Google Chrome|Linux|google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com/alerts|
|Google Chrome|Windows|"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com/alerts|
|Microsoft Edge|Linux|microsoft-edge --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com/alerts|
|Microsoft Edge|Windows|"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com/alerts|

<br>

- Once browser is launched log into Google Account the same way it is normally done manually
<br>

Run the program to load data, connect to browser instance, and configure alerts (ensure PORT variable in file matches one used launching browser):
```
npx ts-node gAlerts.ts
```
