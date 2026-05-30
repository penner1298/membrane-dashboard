# Security Policy

Membrane handles API keys, license checks, webhook verification, cached prompts, and structured extraction workloads. Treat security-sensitive reports as private by default.

## Reporting a Vulnerability

Please do not open a public issue for vulnerabilities, exposed credentials, authentication bypasses, webhook validation bugs, cache isolation bugs, billing/license bypasses, or tenant data exposure.

Use GitHub private vulnerability reporting if it is enabled for the repository:

https://github.com/thejoshuapenner/membrane-dashboard/security/advisories/new

If private reporting is not available, contact the maintainer directly and include:

- The affected route, file, or feature.
- A concise reproduction path.
- Whether the behavior appears to fail open or fail closed.
- Any logs or screenshots with secrets and customer data removed.

## Supported Surfaces

Security review currently covers:

- Python backend routes under `membrane/`.
- Next.js API routes under `membrane-dashboard/src/app/api/`.
- License, billing, webhook, cache, DLQ, and admin flows.
- Deployment configuration and environment variable handling.

Exploratory SDKs are not currently published from this repository. If SDK packages are added later, this policy should be updated with supported package names and versions.

## Secret Handling

Never commit `.env` files, production database URLs, API keys, webhook secrets, license keys, or customer content. Rotate any credential that may have been exposed, even if the exposure was brief.
