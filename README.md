# dinowithcurls.github.io

Personal portfolio of Aditya Raj Singh — built with React + TypeScript + Vite, deployed
to GitHub Pages via GitHub Actions.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
```

## Content

All copy lives in `src/content.ts`. The downloadable CV is `public/Aditya_Raj_Singh.pdf`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. Repo **Settings → Pages → Source** must be set to **GitHub Actions**.

The previous Start Bootstrap site is preserved in `old/`.
