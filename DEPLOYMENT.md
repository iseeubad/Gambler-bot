# ☁️ Deploying Gambler-bot on Discloud (Free 24/7)

Discloud is a hosting platform that allows you to host Discord bots for free. Follow these steps to get your bot running 24/7.

## Prerequisites
*   A Discord Account.
*   Your Bot Token (from Discord Developer Portal).

## Step 1: Prepare Your Files
1.  **Check `discloud.config`**: ensure this file exists in your root folder with the following content:
    ```ini
    NAME=GamblerBot
    TYPE=bot
    MAIN=index.js
    RAM=100
    AUTORESTART=true
    VERSION=latest
    APT=tools
    ```
2.  **Create a ZIP file**:
    Select **ONLY** the following files/folders and zip them into `Gambler-bot.zip`:
    *   `src/` (folder)
    *   `package.json`
    *   `discloud.config`
    *   `index.js`
    
    > ⚠️ **IMPORTANT**: Do **NOT** include `node_modules` or `.env` in the zip file. Discloud installs dependencies for you.

## Step 2: Create Discloud Account
1.  Go to [discloud.com](https://discloud.com/).
2.  Click **Login** and authorize with your Discord account.
3.  Once logged in, you will be taken to your **Dashboard**.

## Step 3: Upload Your Bot
1.  In the Discloud Dashboard, look for the **"Add App"** or **"Upload"** button.
2.  Click to upload and select your `Gambler-bot.zip` file.
3.  Discloud will process the upload and install dependencies (`npm install`).

## Step 4: Configure Environment Variables
1.  After uploading, click on your bot in the dashboard to manage it.
2.  Look for the **"App"** or **"Settings"** tab where you can manage files/settings.
3.  You won't upload your `.env` file directly for security in some workflows, strictly speaking, **Discloud reads the `.env` if you include it**, BUT best practice on some platforms is injecting variables. 
    *   **Simpler Method for Discloud**: You *can* actually include the `.env` file in your zip if you trust the platform, OR:
    *   **Better Method**: In the **Files** section of your bot on Discloud, create a new file named `.env` and paste your `token=...` inside it. Save changes.
    *   Alternatively, most users just wrap the `.env` in the zip for personal free bots. If you excluded it in Step 2, go to the **Files** tab, create `.env`, and paste your token.

## Step 5: Start the Bot
1.  If the bot isn't running, click **Start** or **Restart**.
2.  Check the **Terminal/Logs** tab to see:
    ```
    Ready! Logged in as ...
    ```
3.  Your bot is now online 24/7!

## Troubleshooting
*   **"Module not found"**: Ensure `package.json` is in the zip and lists all dependencies.
*   **"Token invalid"**: Check your `.env` file in the Discloud Files manager.
*   **"RAM Limit"**: The free plan provides limited RAM (usually 100MB is enough for a simple bot). If you crash, ensure `RAM=100` matches your plan limit.

## Updating the Bot
To update your code:
1.  Zip the modified files again.
2.  Go to the Dashboard -> Your Bot.
3.  Upload the new Zip to replace the existing one, or verify if Discloud supports GitHub integration (Plan dependent).
