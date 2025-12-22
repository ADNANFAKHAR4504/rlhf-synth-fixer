# Synth Agent v5.0

Enhanced Continuous Self-Fixing Agent for IAC Test Automations.

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Batch Error Classification** | 15+ error types automatically detected |
| **Protected Paths** | Never modifies `scripts/`, `.github/`, `.claude/` |
| **AI-Powered Fixes** | Claude API for intelligent code fixes |
| **Multi-PR Support** | Process multiple PRs in sequence |
| **JSON Status Tracking** | Real-time progress in `logs/status.json` |
| **Auto Cleanup** | Worktrees cleaned on exit |

## 📦 Installation

```bash
# Clone to Desktop
git clone <this-repo> ~/Desktop/synth-agent

# Configure
cp config.env.example config.env
nano config.env  # Add your ANTHROPIC_API_KEY
```

## ⚙️ Configuration

Edit `config.env`:

```bash
# Required
ANTHROPIC_API_KEY="sk-ant-..."

# Optional
REPO_PATH="/home/adnan/turing/iac-test-automations"
WORKTREE_BASE="${REPO_PATH}/worktree"
GITHUB_REPO="TuringGpt/iac-test-automations"
POLL_INTERVAL=30
MAX_ATTEMPTS=15
```

## 🎯 Usage

### Single PR
```bash
./synth-agent.sh 8543
```

### Multiple PRs
```bash
./synth-agent.sh 8543 8544 8545
```

### From File
```bash
# prs.txt: one PR per line
./synth-agent.sh --from-file prs.txt
```

### Check Status
```bash
./synth-agent.sh --status
```

### Re-process Failed
```bash
./synth-agent.sh --failed-only
```

### Options
```bash
./synth-agent.sh --help

Options:
  --status, -s          Show status of running fixes
  --failed-only         Re-process only failed PRs
  --from-file, -f FILE  Read PR numbers from file
  --max-attempts, -m N  Maximum fix attempts (default: 15)
  --poll, -p N          Poll interval in seconds (default: 30)
```

## 🔒 Protected Paths

These paths are NEVER modified:
- `scripts/`
- `.github/`
- `.claude/`
- `config/`
- `node_modules/`
- `dist/`
- `jest.config.js` (requires 80%+ coverage)

## 🔍 Error Classification

The agent automatically detects and fixes:

| Error Type | Pattern | Fix Applied |
|------------|---------|-------------|
| Metadata | `schema invalid` | Sanitize metadata.json |
| TypeScript | `cannot find module` | Import fixes |
| ENVIRONMENT_SUFFIX | `environmentSuffix` | Add env var fallback |
| LocalStack Endpoint | `connection refused` | Add endpoint config |
| S3 Path-Style | `InvalidBucketName` | Enable path-style |
| IAM Policy | `MalformedPolicyDocument` | Simplify policy |
| Removal Policy | `cannot delete` | Set DESTROY |
| Test Failures | `jest failed` | AI-powered fix |
| Lint Errors | `eslint error` | Auto-fix |
| Deploy Errors | `CREATE_FAILED` | AI-powered fix |

## 📁 File Structure

```
synth-agent/
├── synth-agent.sh      # Main agent script
├── config.env          # Configuration
├── CLAUDE.md           # Project context for Claude Code
├── README.md           # This file
├── logs/
│   └── status.json     # Status tracking
└── .claude/
    ├── agents/
    │   └── synth-fixer.md    # Main agent
    └── commands/
        └── synth-fixer.md    # /synth-fixer command
```

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNTH AGENT WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SETUP                                                    │
│     └→ Create isolated worktree for PR branch               │
│                                                              │
│  2. MONITOR                                                  │
│     └→ Poll GitHub CI/CD status every 30s                   │
│                                                              │
│  3. ON FAILURE                                               │
│     ├→ Fetch error logs                                     │
│     ├→ Classify errors (15+ types)                          │
│     ├→ Apply batch fixes                                    │
│     ├→ Run AI fix (Claude)                                  │
│     └→ Commit & push                                        │
│                                                              │
│  4. REPEAT until all stages pass (max 15 attempts)          │
│                                                              │
│  5. CLEANUP                                                  │
│     └→ Remove worktree                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Status Tracking

Check status anytime:
```bash
./synth-agent.sh --status
```

Output:
```
═══════════════════════════════════════════════════════════════
📊 SYNTH AGENT STATUS
═══════════════════════════════════════════════════════════════

  Pending:     0  ⏳
  Running:     1  🔄
  Completed:   2  ✅
  Failed:      0  ❌

Currently Running:
  🔄 PR #8543 (attempt 3)
```

## 🛠️ Troubleshooting

### "GitHub CLI not authenticated"
```bash
gh auth login
```

### "No changes to commit"
The agent couldn't apply any fixes. Check:
1. Error logs are accessible
2. Files are in allowed paths
3. AI API key is valid

### "Maximum attempts reached"
PR has issues that need manual fixing. Check:
1. CI/CD logs on GitHub
2. Local `logs/status.json` for details

## 📄 License

MIT
