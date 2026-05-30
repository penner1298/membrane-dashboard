## Summary

Describe what changed and why.

## Risk Notes

- Security/auth/billing/cache impact:
- Production behavior changed:
- Routes or jobs touched:

## Checks

- [ ] `python3 -m unittest discover -s tests -p 'test*.py'` from the repo root
- [ ] `cd membrane-dashboard && npm run lint -- --quiet`
- [ ] `cd membrane-dashboard && npx tsc --noEmit --incremental false`
- [ ] `cd membrane-dashboard && npm run build`
- [ ] Docs updated, if setup/API/deployment behavior changed
- [ ] No secrets, local cache files, generated exports, or build artifacts included
