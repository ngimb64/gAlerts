# gAlerts

## About

This project is the ultimate solution for automating the creation of google alerts for automating targeted leads. It allows users to manually log into their account via browser launched with provided syntax from terminal, then run the program which connects to the browser via Chrome DevTools Protocol and executes the script in the browser.


## Installation and Setup

If Node.js isn’t installed yet:
- Go to https://nodejs.org
- Download the LTS version (recommended for most users)
- Follow the default installation procedures (hit next a lot)

Install dependencies:
```
npm install playwright csv-parse
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

- If desired, add any additional site endpoints where queries will be applied to the sites file in the data folder

- Enter data into Microsoft Excel or LibreOffice Calc and export the final product to a CSV file in the data folder called alerts.csv
- Ensure the columns are in the following order left to right on the first line:
	- query
	- frequency
	- howMany
<br>

- The CSV result of the columns will look like `query,frequency,howMany`
<br>

### Data Options

- query
	- Typical Google search query that supports any advanced operators
<br>

- frequency
	- a:  "As-it-happens"
	- d:  "At most once a day"
	- w:  "At most once a week"
<br>

- howMany
	- best:  "Only the best results"
	- all:  "All results"
<br>

### Browser Launch

- The browser must be launched with a remote debugging port specified so code can be run after authentication

| Browser | OS | Command |
|---------|----|---------|
|Brave|Linux|brave-browser --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com|
|Brave|Windows|"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com|
|Chromium|Linux|chromium --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com|
|Chromium|Windows|"C:\Program Files\Chromium\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com|
|Google Chrome|Linux|google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com|
|Google Chrome|Windows|"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com|
|Microsoft Edge|Linux|microsoft-edge --remote-debugging-port=9222 --user-data-dir="$HOME/.config/playwright-profile" --new-window https://www.google.com|
|Microsoft Edge|Windows|"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="C:\playwright-profile" --new-window https://www.google.com|

<br>

- Once browser is launched log into Google Account the same way it is normally done manually
<br>

### Script Execution

Run the program to load data, connect to browser instance, and configure alerts (ensure PORT variable in file matches one used launching browser):
```
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" gAlerts-create.ts <alerts_file> <sites_file>
```
**Note**:  Only the file name needs to be specified for the alerts & sites files as it is assumed they are in the data folder
