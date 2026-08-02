## What

<!-- One or two sentences: what changes and why. Link the issue if one exists. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, and `npm run test` pass locally
- [ ] `npm run test:e2e` passes if the change affects the transform, a tool
      shim, or anything user-visible in the example apps
- [ ] Library source changed → `npm run lib:pack` ran and the refreshed
      `vendor/*.tgz` + `package-lock.json` are committed (see CONTRIBUTING.md)
- [ ] Docs stay in lockstep: lib README / docs-site samples / the `Demo*`
      mirror atoms updated together where relevant
- [ ] CHANGELOG.md updated under **Unreleased** for user-facing changes
- [ ] Commits follow Conventional Commits (hooks enforce the format)

## Notes for the reviewer

<!-- Anything non-obvious: trade-offs, footguns checked, follow-ups deferred. -->
