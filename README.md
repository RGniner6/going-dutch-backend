# Going Dutch backend

Express API for receipt upload and item extraction. The combined local setup
guide is also available in the [Going Dutch workspace README](../README.md).

## Run the full app locally

Start the backend from this directory in Terminal 1:

```bash
npm ci
if [ ! -f configuration/.env ]; then cp configuration/env.template configuration/.env; fi
```

Set `GEMINI_API_KEY` in `configuration/.env`, then start the API:

```bash
npm run dev
```

The API listens on `http://localhost:3000`; `GET /ping` should return `pong`.

In Terminal 2, from this directory, start the frontend:

```bash
cd ../going-dutch-front-end
npm ci
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.
The frontend uses the local API by default, and the backend allows this local
frontend origin. To change the API URL, set `VITE_API_URL` in a frontend `.env`
file.

`POST /api/receipt/process` accepts a receipt image in the `image` form field.

## Backend development

To run just the API, install dependencies and create `configuration/.env` if
needed, then run `npm run dev` from this directory.

Gemini is the default provider. OpenAI is optional; set `PROVIDER=openai` and
`OPEN_AI_API_KEY` in `configuration/.env` to select it. Only the selected
provider needs a key.

## Scripts

- `npm run dev` — run the API with `ts-node`
- `npm run dev:watch` — run the API with automatic restarts
- `npm run build` — compile TypeScript into `dist/`
- `npm start` — run the compiled API
- `npm test` — run the Jest suite
- `npm run cdk` — invoke the AWS CDK CLI

Press `Ctrl+C` in each terminal to stop the apps.
