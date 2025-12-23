# 🤖 SYNTH-AGENT

Automated PR fixer for IaC test automations powered by Claude Code. Follow the steps below for a clean setup without relying on legacy `./scripts` entrypoints.

> **Important:** The agent is always launched with `claude --dangerously-skip-permissions`. No other wrapper scripts are required. Inside that Claude session, trigger the fixer with `/synth-fixer <pr-number>` (example: `/synth-fixer 8543`) and supply whatever PR ID you want the agent to repair.

## Features

- Autonomously fixes failing IaC PRs end-to-end.
- Uses special worktrees so your main repo stays clean.
- Monitors CI/CD jobs and retries safely.
- Guards protected files from accidental edits.

## Requirements

| Tool | Why it is needed | Install |
|------|-----------------|---------|
| Claude Code CLI | Runs the synth agent | `npm install -g @anthropic-ai/claude-code` |
| GitHub CLI (`gh`) | Authenticates with GitHub for PR status + push | `sudo apt install gh` or `brew install gh` |
| Node.js 18+ | Runtime for the Claude CLI | Use preferred Node installer |

After installing, verify the CLIs:

```bash
claude --version
gh --version
```

Authenticate both before continuing:

```bash
gh auth login
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

## Configure `config.env`

Create or edit `config.env` in this folder:

```bash
# File: /home/adnan/Desktop/turing/rlhf-synth-fixer/config.env

# ═══════════════════════════════════════════════════════════════
# AI API Keys
# ═══════════════════════════════════════════════════════════════
ANTHROPIC_API_KEY="sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ═══════════════════════════════════════════════════════════════
# Repository Settings
# ═══════════════════════════════════════════════════════════════
REPO_PATH="/home/adnan/turing/iac-test-automations"
WORKTREE_BASE="/home/adnan/turing/iac-test-automations/worktree"
AGENT_NAME="synth-agent"
POLL_INTERVAL=30
```

> Replace the placeholder API key with your own Anthropic key from https://console.anthropic.com/.

Load the file whenever you start a new shell:

```bash
source ./config.env
```

## Run the Agent (no scripts required)

1. **Enter the project folder**
   ```bash
   cd /home/adnan/Desktop/turing/rlhf-synth-fixer
   ```
2. **Launch Claude in dangerous mode** – this is the only command you need to run locally:
   ```bash
   claude --dangerously-skip-permissions
   ```
3. **Inside Claude**, start the fixer command:
   ```
   /synth-fixer <pr-number>
   ```
   Example:
   ```
   /synth-fixer 8543
   ```

This replaces older instructions that relied on `./scripts/...` helpers.

## What Happens During a Run

```
1. Create a fresh worktree for the PR.
2. Rebase the PR on top of main.
3. Restore protected files if needed.
4. Watch CI/CD jobs in GitHub Actions.
5. Detect failures, fix code, re-run tests.
6. Ask you to confirm before committing.
7. Push changes once everything passes.
```

You will see output similar to:

```
[SYNTH-AGENT] Checking CI/CD status...
[SYNTH-AGENT] Found errors: Unit Testing failed
[SYNTH-AGENT] ✓ Fixed: metadata.json

CONFIRM COMMIT & PUSH? (y/n/d)
```

## CI/CD Jobs Monitored

| ✅ Must Pass | ❌ Ignored |
|-------------|-----------|
| Detect Project Files | Upload Task to S3 |
| Validate Commit Message | Semantic Release |
| Validate Jest Config | Debug Claude outputs |
| Claude Review: Prompt Quality | Analysis |
| Build, Synth, Lint | Infracost |
| Unit Testing | IaC Optimization |
| Integration Tests | |
| Claude Review | |
| Claude Review: IDEAL_RESPONSE | |
| Archive | |

## Protected Files (never touched)

```
.github/            # GitHub workflows
.claude/            # Agent config
config/             # Schemas
package.json        # NO PERMISSION
package-lock.json   # NO PERMISSION
tsconfig.json       # NO PERMISSION
requirements.txt    # NO PERMISSION
pyproject.toml      # NO PERMISSION
```

## Metadata Rules

`metadata.json` is always rewritten to:

```json
{
  "team": "synth",
  "provider": "localstack",
  "wave": "P0"
}
```

## Error Types Auto-Fixed

| Error | Action |
|-------|--------|
| Metadata validation | Rewrites `metadata.json` |
| Prompt Quality FAILED | Cleans `PROMPT.md` |
| TypeScript errors | Repairs `lib/` sources |
| Lint errors | Applies formatting |
| Unit/Integration failures | Updates code + tests |
| Coverage low | Adds tests (never edits `jest.config.js`) |
| IDEAL_RESPONSE mismatch | Regenerates from source |
| Deploy errors | Adjusts LocalStack config |
| Missing files | Restores from archive |

## Success Criteria

| CI Result | Interpretation |
|-----------|----------------|
| Archive job pending/waiting | ✅ PR ready |
| All jobs success | ✅ PR ready |
| Any job failed | ❌ Needs more fixes |

## File Layout

```
rlhf-synth-fixer/
├── README.md
├── CLAUDE.md
├── config.env.example
├── logs/
└── .claude/
```

## Troubleshooting

- **GitHub CLI not authenticated**  
  `gh auth login`

- **`ANTHROPIC_API_KEY` empty**  
  `source ./config.env`

- **Permission errors inside Claude**  
  Always start with `claude --dangerously-skip-permissions`.

- **Agent stops after max attempts**  
  Review failing CI job logs directly in GitHub and re-run `/synth-fixer`.

## Quick Reference

```bash
cd /home/adnan/Desktop/turing/rlhf-synth-fixer
source ./config.env
claude --dangerously-skip-permissions
# inside Claude:
/synth-fixer <pr-number>
```

## License

MIT
