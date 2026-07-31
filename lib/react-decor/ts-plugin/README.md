# react-decor-ts-plugin

tsserver plugin for [react-decor](https://www.npmjs.com/package/react-decor) decorated
files (`*.at.tsx`): the editor shows the raw `@Card` text while the language
service sees the same-length virtualized text, so directives get zero squiggles
and hover / go-to-definition / completions work inside decorator expressions.
Malformed directives surface as `react-decor` semantic diagnostics (the AT catalog).

A separate package because tsserver only loads bare package names as plugins.

```jsonc
// tsconfig.json
"compilerOptions": {
  "plugins": [{ "name": "react-decor-ts-plugin" }]
}
```

The editor must run the **workspace** TypeScript (VS Code: `TypeScript: Select
TypeScript Version → Use Workspace Version`) — built-in TS never loads
workspace-local plugins.

## License

[MIT](LICENSE)
