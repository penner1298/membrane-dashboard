# Contributing to Membrane

Membrane is a monorepo. The historical GitHub repository name may say `membrane-dashboard`, but this repo contains the Python gateway backend, the Next.js dashboard/docs app, operational scripts, tests, and maintainer documentation.

## Where to Start

| Area | Path |
| :--- | :--- |
| Backend gateway, auth, cache, licensing, telemetry | `membrane/` |
| Dashboard, docs site, API proxy routes | `membrane-dashboard/` |
| Backend regression tests | `tests/` |
| Technical notes and experiment history | `docs/` |
| Local operational helpers | `scripts/` |

## Local Setup

Backend:

```bash
pip3 install -r requirements.txt
python3 server.py
```

Dashboard:

```bash
cd membrane-dashboard
npm install
npm run dev
```

The dashboard development server runs on `http://localhost:3001` by default. The backend runs on `http://localhost:8000`.

## Pull Request Checklist

Before opening or merging a pull request, run the relevant checks:

```bash
python3 -m unittest discover -s tests -p 'test*.py'

cd membrane-dashboard
npm run lint -- --quiet
npx tsc --noEmit --incremental false
npm run build
```

For changes that touch security, auth, billing, cache writes, webhook verification, production environment behavior, or API key provisioning, include a short risk note in the pull request. Name the failure mode you tested and whether the route fails open or fails closed.

## Documentation Expectations

Update documentation when a change alters setup, environment variables, API behavior, deployment behavior, or repository layout. User-facing docs belong in the dashboard/docs app; maintainer-facing notes belong in `docs/`.

Do not add generated exports, build folders, local cache files, or strategy drafts to the repository. If an SDK is introduced later, it should have a real package manifest, install instructions, tests, and an owner before being advertised in the root README.

## Security

Do not put secrets, customer data, database URLs, API keys, webhook secrets, license keys, or customer content in issues, pull requests, screenshots, docs, tests, or fixture files. Follow `SECURITY.md` for vulnerability reports.
