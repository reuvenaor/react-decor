# Security Policy

## Supported versions

| Package                 | Version | Supported |
| ----------------------- | ------- | --------- |
| `react-decor`           | 0.3.x   | ✅        |
| `react-decor-ts-plugin` | 0.3.x   | ✅        |
| anything older          | < 0.3   | ❌        |

Only the latest minor release line receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security reports.**

1. **Preferred:** use GitHub's private vulnerability reporting — the **Security**
   tab of this repository → **Report a vulnerability**. This opens a private
   advisory thread with the maintainers.
2. **Fallback:** email **reuvenaor85@gmail.com** with the subject prefixed
   `[SECURITY] react-decor`. Include a description, a minimal reproduction, the
   affected package/version, and the impact as you understand it.

### What to expect

- **Acknowledgement within 3 business days.**
- A status update at least **every 7 days** while we investigate.
- We aim to ship a fix (or a documented mitigation) and publish a GitHub Security
  Advisory with credit to the reporter (unless you prefer to stay anonymous).
- **Coordinated disclosure:** we ask for up to **90 days** before public
  disclosure; we will almost always be much faster.

## Scope and threat model

react-decor is a **build-time** tool: the transform runs in your bundler
(Vite/webpack/Turbopack), `at-tsc` and the ESLint parser run in your toolchain, and
`react-decor-ts-plugin` runs inside tsserver. **No react-decor code ships in your
production bundle** — the output is plain JSX compiled by your own toolchain.

In scope:

- The source transform (`react-decor/transform`, `/scan`, `/virtualize`) producing
  incorrect or injectable output from attacker-influenced source.
- The Vite plugin, webpack/Turbopack loader, `at-tsc` bin, ESLint parser/plugin,
  and the tsserver plugin (e.g. path handling, arbitrary code execution beyond
  what a build tool inherently does).
- Supply-chain integrity of the published packages (the only runtime dependency
  is `magic-string`; releases are published from CI with npm provenance).

Out of scope:

- The docs-site example apps (`examples/`, `shared/`) — not published packages.
- Vulnerabilities in third-party dependencies (report upstream; we will still
  coordinate a bump if you tell us).
- Scenarios that already require a compromised developer machine or CI runner —
  a build tool cannot defend the machine it runs on.
