# 🤖 RLHF-SYNTH-FIXER

Automated PR Fixer for IAC Test Automations using Claude Code.

## 🎯 Two Agents Available

| Agent | Command | Purpose |
|-------|---------|---------|
| **Synth Fixer** | `/synth-fixer <PR>` | Fix PRs via remote CI/CD monitoring |
| **Local CI Runner** | `/local-ci-runner <PR>` | Run ALL CI stages locally before push |

### Which Agent to Use?

| Scenario | Agent |
|----------|-------|
| Quick fixes, remote CI available | `/synth-fixer` |
| LocalStack deployment testing | `/local-ci-runner` |
| Full local validation before push | `/local-ci-runner` |
| Internet issues / GitHub slow | `/local-ci-runner` |

---

## Smart Repo Detection

The agent automatically finds the `iac-test-automations` repository:

1. **REPO_PATH env var** → Uses if set in `config.env`
2. **Current directory** → Uses if it's the correct repo
3. **Common locations** → Checks `~/iac-test-automations`, `~/turing/iac-test-automations`, etc.

**No hardcoded paths!** Works from any directory.

## Prerequisites

### 1. Install Claude Code CLI

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### 2. Install GitHub CLI

```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Verify installation
gh --version
```

### 3. Configure Both CLIs

```bash
# Login to GitHub CLI
gh auth login

# Set Anthropic API Key (for Claude)
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### 4. Configure config.env

Edit the `config.env` file in the synth-agent folder:

```bash
# File: /home/adnan/Desktop/synth-agent/config.env

# ═══════════════════════════════════════════════════════════════
# AI API Keys
# ═══════════════════════════════════════════════════════════════

# Anthropic API Key (required for Claude)
# Get it from: https://console.anthropic.com/
# Format: sk-ant-api03-...
ANTHROPIC_API_KEY="sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ═══════════════════════════════════════════════════════════════
# Repository Settings
# ═══════════════════════════════════════════════════════════════

# Path to iac-test-automations repository
REPO_PATH="/home/adnan/turing/iac-test-automations"

# Worktree base directory (used for PR worktrees)
WORKTREE_BASE="/home/adnan/turing/iac-test-automations/worktree"

# Agent name
AGENT_NAME="synth-agent"

# CI/CD polling interval (seconds)
POLL_INTERVAL=30
```

**Important:** Replace `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with your actual Anthropic API key.

## Usage

### Step 1: Navigate to synth-agent folder

```bash
cd ~/Desktop/synth-agent
```

### Step 2: Run Claude Code with permissions

```bash
claude --dangerously-skip-permissions
```

### Step 3: Use the synth-fixer command

Once Claude Code is running, use the `/synth-fixer` command:

```
/synth-fixer 8543
```

Where `8543` is your PR number.

### Examples

```
# Fix single PR
/synth-fixer 8543

# The agent will:
# 1. Setup worktree for PR branch
# 2. Pull latest main and rebase
# 3. Check for protected files and restore them
# 4. Monitor CI/CD status
# 5. Detect and fix errors automatically
# 6. Ask for confirmation before committing
# 7. Push and wait for CI/CD to pass
```

## What the Agent Does

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🤖 SYNTH-AGENT [PR #8543] is monitoring...                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

[SYNTH-AGENT] [PR #8543] Checking CI/CD status...
[SYNTH-AGENT] [PR #8543] Found errors: Unit Testing failed
[SYNTH-AGENT] [PR #8543] Applying fixes...
[SYNTH-AGENT] [PR #8543] ✓ Fixed: metadata.json
[SYNTH-AGENT] [PR #8543] ✓ Fixed: lib/tap-stack.ts

╔══════════════════════════════════════════════════════════════════════════════╗
║  🤔 CONFIRM COMMIT & PUSH                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [y/yes]  - Commit and push these changes                                    ║
║  [n/no]   - Cancel and discard changes                                       ║
║  [d/diff] - Show full diff                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## CI/CD Jobs Monitored

| ✅ Must Pass | ❌ Ignored |
|--------------|-----------|
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

## Protected Files (Never Modified)

```
scripts/            # CI/CD scripts
.github/            # Workflows
.claude/            # Agent config
config/             # Schemas
package.json        # NO PERMISSION
package-lock.json   # NO PERMISSION
tsconfig.json       # NO PERMISSION
requirements.txt    # NO PERMISSION
pyproject.toml      # NO PERMISSION
```

## Metadata Rules

The agent automatically ensures `metadata.json` has correct values:

```json
{
  "team": "synth",           // ALWAYS "synth"
  "provider": "localstack",  // ALWAYS "localstack"
  "wave": "P0 or P1"         // P0 for tf/hcl, P1 for all others
}
```

**Wave Rules:**
- `hcl` (Terraform) → `"P0"`
- All other languages → `"P1"`

## Error Types Fixed

| Error | Fix Applied |
|-------|-------------|
| Metadata validation | Fix metadata.json |
| Prompt Quality FAILED | Remove emojis, dashes, brackets from PROMPT.md |
| TypeScript errors | Fix code in lib/ |
| Lint errors | Fix formatting |
| Test failures | Fix tests in test/ |
| Coverage low | Add more tests (not modify jest.config.js) |
| IDEAL_RESPONSE mismatch | Regenerate from lib/ code |
| Deploy errors | Fix LocalStack config |
| Missing files | Restore from archive |
| **⚠️ Resource Not Found** | **REMOVE failing test** (don't add resource) |

## Success Conditions

| Status | Result |
|--------|--------|
| Archive: pending/waiting | ✅ PR READY - all passed |
| All jobs: success | ✅ PR READY |
| Any job: failure | ❌ Needs fix |

## File Structure

```
rlhf-synth-fixer/
├── README.md                    # This file
├── CLAUDE.md                    # Project context
├── config.env                   # Configuration (create from config.env.example)
├── config.env.example           # Example configuration
├── logs/
│   └── status.json              # Status tracking
└── .claude/
    ├── agents/
    │   ├── synth-fixer.md       # Synth Fixer agent
    │   └── local-ci-runner.md   # Local CI Runner agent
    └── commands/
        ├── synth-fixer.md       # /synth-fixer command
        └── local-ci-runner.md   # /local-ci-runner command
```

---

# 🏠 LOCAL-CI-RUNNER Agent

Run ALL CI/CD stages locally before pushing to GitHub.

## Usage

```bash
/local-ci-runner <PR_NUMBER>

# Examples:
/local-ci-runner 9581
/local-ci-runner 8543
```

## What It Does

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        🏠 LOCAL CI RUNNER - PHASES                                ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  ⛔ PHASE 0: LOAD CONFIG & CHANGE REPO                                           ║
║  ├── Load config.env                                                             ║
║  ├── cd /home/adnan/turing/iac-test-automations                                  ║
║  └── Export AWS/LocalStack credentials                                           ║
║                                                                                   ║
║  PHASE 1: WORKTREE SETUP                                                         ║
║  ├── Create worktree for PR branch                                               ║
║  ├── git pull origin <branch> --rebase                                           ║
║  └── Remove "Hey Team" from PROMPT.md                                            ║
║                                                                                   ║
║  PHASE 2: PROTECTED FILES CHECK                                                  ║
║  ├── Detect if protected files were modified                                     ║
║  └── Restore from main branch                                                    ║
║                                                                                   ║
║  PHASE 3: LOCAL CI STAGES (ALL MUST PASS!)                                       ║
║  ├── 3.1 Detect Project Files ⚠️ MANDATORY                                       ║
║  ├── 3.2 Prompt Quality ⚠️ MANDATORY                                             ║
║  ├── 3.3 Commit Validation                                                       ║
║  ├── 3.4 Jest Config                                                             ║
║  ├── 3.5 Build ⚠️ MANDATORY                                                      ║
║  ├── 3.6 Synth ⚠️ MANDATORY                                                      ║
║  ├── 3.7 Lint ⚠️ MANDATORY                                                       ║
║  ├── 3.8 Unit Tests ⚠️ MANDATORY                                                 ║
║  ├── 3.9 Deploy (LocalStack, 20min timeout)                                      ║
║  ├── 3.10 Integration Tests                                                      ║
║  └── 3.12 IDEAL_RESPONSE ⚠️ MANDATORY                                            ║
║                                                                                   ║
║  PHASE 4: PUSH & MONITOR                                                         ║
║  ├── Push to GitHub                                                              ║
║  ├── Monitor each CI stage                                                       ║
║  ├── Auto-fix failures and re-push                                               ║
║  └── 🎉 STOP when "archive-folders" passes                                       ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## LocalStack Requirements

For `Deploy` and `Integration Tests` stages, you need LocalStack Pro:

```bash
# Set LocalStack token
localstack auth set-token ls-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Start LocalStack
localstack start
```

Or configure in `config.env`:
```bash
LOCALSTACK_AUTH_TOKEN="ls-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_DEFAULT_REGION="us-east-1"
AWS_ENDPOINT_URL="http://localhost:4566"
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Live Deploy Monitoring** | Shows resources being created in real-time |
| **20 min Deploy Timeout** | Stops if deploy takes too long |
| **Auto-Cleanup on Fail** | Deletes created resources before retry |
| **IDEAL_RESPONSE Sync** | Auto-updates when code changes |
| **GitHub CI Monitor** | Watches each stage after push |
| **Auto-Fix & Re-Push** | Fixes failures and pushes again |
| **Archive Stop** | Stops when PR is ready for archive |

## Local CI vs Remote CI

| Stage | Local Script | Remote Job |
|-------|--------------|------------|
| Detect | `./scripts/detect-metadata.sh` | `detect-metadata` |
| Prompt Quality | `.claude/scripts/claude-validate-prompt-quality.sh` | `claude-review-prompt-quality` |
| Build | `./scripts/build.sh` | `build` |
| Synth | `./scripts/synth.sh` | `synth` |
| Lint | `./scripts/lint.sh` | `lint` |
| Unit Tests | `./scripts/unit-tests.sh` | `unit-tests` |
| Deploy | `./scripts/ci-deploy-conditional.sh` | `deploy` |
| Integration | `./scripts/ci-integration-tests-conditional.sh` | `integration-tests-live` |
| IDEAL_RESPONSE | `.claude/scripts/validate-ideal-response.sh` | `claude-review-ideal-response` |

## Troubleshooting

### "GitHub CLI not authenticated"
```bash
gh auth login
```

### "ANTHROPIC_API_KEY not set"
```bash
# Option 1: Load from config.env
source ~/Desktop/synth-agent/config.env

# Option 2: Export directly
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### "Permission denied"
Run Claude with skip permissions flag:
```bash
claude --dangerously-skip-permissions
```

### "Maximum attempts reached"
PR needs manual fixing. Check CI/CD logs on GitHub.

## Quick Start Summary

```bash
# 1. Make sure prerequisites are installed and configured
gh auth status           # Should show logged in

# 2. Edit config.env with your API key and paths
nano ~/Desktop/synth-agent/config.env

# 3. Load the configuration
source ~/Desktop/synth-agent/config.env
echo $ANTHROPIC_API_KEY  # Should show your key

# 4. Go to synth-agent folder
cd ~/Desktop/synth-agent

# 5. Run Claude Code
claude --dangerously-skip-permissions

# 6. In Claude Code, run:
/synth-fixer <pr-number>

# Example:
/synth-fixer 8543
```

## License

MIT
