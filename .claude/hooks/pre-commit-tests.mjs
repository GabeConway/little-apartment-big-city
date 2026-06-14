#!/usr/bin/env node
// Claude Code PreToolUse hook: run the test suite before any `git commit`.
//
// Wired in .claude/settings.json on the Bash tool. Reads the tool-call JSON from
// stdin, and only acts when the command is a git commit. On test failure it
// exits 2 — Claude Code treats that as "block the tool call" and feeds stderr
// back to the agent, so the commit never runs with red tests. Bypass with
// `git commit --no-verify` (or `-n`) for the rare intentional WIP commit.

import { execSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let command = '';
  try { command = JSON.parse(raw)?.tool_input?.command ?? ''; } catch { /* not JSON → ignore */ }

  const isCommit = /\bgit\b[^\n]*\bcommit\b/.test(command);
  // Bypass: `git commit --no-verify` or `-n`. (`-n` is git's short --no-verify.)
  const bypass = /--no-verify\b/.test(command) || /\bcommit\b[^\n]*\s-[a-zA-Z]*n/.test(command);
  if (!isCommit || bypass) {
    process.exit(0); // not a commit, or explicitly bypassed
  }

  try {
    execSync('npm test', { stdio: 'pipe' });
    process.exit(0);
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    process.stderr.write(
      'Pre-commit tests FAILED — commit blocked. Fix the tests, then retry.\n' +
      'To bypass intentionally: git commit --no-verify\n\n' +
      out.slice(-3000),
    );
    process.exit(2);
  }
});
