# RadeStreet Storefront Demo

This repository contains the read-only storefront demo in [`storefront`](./storefront/).

## Deploy to Vercel

1. Import this repository into Vercel.
2. Set **Root Directory** to `storefront`.
3. Keep the framework preset as **Next.js** and the default install/build commands.
4. No environment variables are required for the demo.

The demo uses sample catalog data and local storefront images. It does not connect to a database or accept orders, payments, sign-ins, or form submissions. Do not use the demo configuration as a production commerce deployment.

## Run locally

```powershell
cd storefront
npm install
npm run dev
```