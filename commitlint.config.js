/**
 * Commit-message gate for this repo, enforced by .husky/commit-msg -> commitlint.
 * Mechanical rules only; the fuller convention (type choice, atomic commits, tense,
 * no attribution/signature footers) lives in CONTRIBUTING.md "Commits".
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The only seven types these repos use.
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    // Keep `git log --oneline` scannable: subject <= 50, whole header <= 72.
    'subject-max-length': [2, 'always', 50],
    'header-max-length': [2, 'always', 72],
    // Off so a leading Jira key ("PROJ-123 add ...") isn't rejected for case.
    'subject-case': [0],
    // Off so long explanatory bodies / URLs in the footer pass.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
