---
description: Deploy AllineApp to GitHub Pages
---

# Deploy AllineApp to GitHub Pages

This workflow guides you through the process of deploying your Expo web app to GitHub Pages.

## Prerequisites
- A GitHub account.
- Git installed and configured on your machine.
- The project pushed to a GitHub repository.

## Steps

1.  **Update `package.json`**:
    - Open `package.json`.
    - Find the `"homepage"` field.
    - Replace `<your-github-username>` with your actual GitHub username.
    - Ensure the URL format is `https://<username>.github.io/<repository-name>`.

2.  **Install Dependencies**:
    - Ensure all dependencies are installed:
      ```bash
      npm install
      ```

3.  **Build and Deploy**:
    - Run the deploy script. This will build the web bundle and push it to the `gh-pages` branch.
      ```bash
      npm run deploy
      ```

4.  **Configure GitHub Pages**:
    - Go to your repository on GitHub.
    - Navigate to **Settings** > **Pages**.
    - Under **Source**, ensure "Deploy from a branch" is selected.
    - Select `gh-pages` as the branch and `/ (root)` as the folder.
    - Click **Save**.

5.  **Verify Deployment**:
    - Wait a few minutes for the deployment to complete.
    - Visit the URL specified in your `homepage` field to see your live app.

## Troubleshooting
- If you see a blank page, check the Console in your browser's Developer Tools for errors.
- Ensure the `homepage` URL in `package.json` matches your GitHub Pages URL exactly.
- If you made changes to `app.json` (like `output: "static"`), you might need to restart the build process.
