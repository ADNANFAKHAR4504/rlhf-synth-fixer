# Synth Trainer Quick Reference

Quick reference card for the `iac-synth-trainer` agent and related commands.

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/task-fix <PR>` | Fix PR until production ready | `/task-fix 1234` |
| `/task-fix <branch>` | Fix by branch name | `/task-fix synth-abc123` |
| `/task-fix` | Fix current branch | `/task-fix` |
| `/synth-trainer-health` | Check prerequisites | `/synth-trainer-health` |
| `/task-coordinator` | Full task generation workflow | `/task-coordinator` |

## Exit Codes

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| `0` | SUCCESS | PR is production ready | Ready for merge |
| `1` | ERROR | Unrecoverable error | Can retry |
| `2` | BLOCKED | Manual intervention needed | Review PR comments |

## Quality Gates

### Standard IaC Tasks (12 gates)

| # | Gate | Requirement |
|---|------|-------------|
| 1 | Worktree | Correct structure at `worktree/synth-{task_id}` |
| 2 | Metadata | All required fields valid |
| 3 | Code Quality | Lint, build, synth passing |
| 4 | Pre-Deploy | No hardcoded values, proper naming |
| 5 | Code Health | No known failure patterns |
| 6 | Deployment | All resources deployed |
| 7 | Test Coverage | **100%** (statements, functions, lines) |
| 8 | Integration Tests | **100%** pass rate |
| 9 | Documentation | MODEL_FAILURES.md, IDEAL_RESPONSE.md |
| 10 | Training Quality | Score **≥ 8** |
| 11 | File Location | All files in allowed directories |
| 12 | Commit Format | Conventional commits, lowercase |

### Task Type Variations

| Task Type | Detection | Skip Synth | Skip Deploy | Skip Integration |
|-----------|-----------|------------|-------------|------------------|
| **Standard IaC** | Default | ❌ | ❌ | ❌ |
| **CI/CD Pipeline** | `subject_labels: CI/CD Pipeline` | ✅ | ✅ | ✅ |
| **Analysis** | `subtask: Infrastructure QA` or `platform: analysis` | ✅ | ✅ | ✅ |
| **Optimization** | `subject_labels: IaC Optimization` | ❌ | ❌ | ❌ |

### Required Files by Task Type

| Task Type | Required Files |
|-----------|----------------|
| Standard | `metadata.json`, `lib/PROMPT.md` |
| CI/CD | + `lib/ci-cd.yml` |
| Analysis | + `lib/analyse.py` or `lib/analyse.sh` |
| Optimization | + `lib/optimize.py` |

## Configuration

**Location**: `.claude/config/synth-trainer.yaml`

### Key Settings

```yaml
iteration:
  max_iterations: 10           # Max fix iterations
  max_deployment_attempts: 5   # Max deploys per iteration

quality_gates:
  min_training_quality: 8      # Minimum score for approval
  required_test_coverage: 100  # Required coverage %

timeouts:
  cicd_wait_default: 600       # 10 minutes
  cicd_wait_long: 900          # 15 minutes for complex tasks
```

## Iteration Policy

| Score | Action | Notes |
|-------|--------|-------|
| **9-10** | ✅ Approve PR | Excellent |
| **8** | ✅ Approve PR | Meets threshold |
| **6-7** | ⚠️ Conditional | Only if features can be added |
| **4-5** | ⚠️ Conditional | Only if major gaps fixable |
| **0-3** | ❌ Error | Critical failure or model too good |

## File Location Rules

### Allowed Directories
```
✅ lib/          # Infrastructure code, documentation
✅ bin/          # Entry points (CDK apps)
✅ test/         # Test files
✅ tests/        # Test files (alternative)
```

### Allowed Root Files
```
✅ metadata.json, package.json, package-lock.json
✅ cdk.json, cdktf.json, Pulumi.yaml
✅ tap.py, tap.go, setup.js
✅ Pipfile, Pipfile.lock, requirements.txt
✅ go.mod, go.sum, build.gradle, pom.xml
```

### Forbidden Directories
```
❌ .github/      # CI/CD workflows
❌ .claude/      # Agent configurations
❌ scripts/      # Build/deployment scripts
❌ docs/         # Documentation
❌ templates/    # Project templates
❌ archive/      # Archived tasks
```

## Troubleshooting

### Worktree Issues

```bash
# List worktrees
git worktree list

# Remove stale worktree
git worktree remove worktree/synth-{task_id} --force

# Prune stale references
git worktree prune
```

### GitHub CLI Issues

```bash
# Check authentication
gh auth status

# Re-authenticate
gh auth login

# Check rate limits
gh api rate_limit
```

### Branch Sync Issues

```bash
# Fetch latest main
git fetch origin main

# Rebase on main
git rebase origin/main

# Force push (with lease for safety)
git push origin {branch} --force-with-lease
```

## Commit Message Format

**Required format**: Conventional commits with **lowercase** subject

```bash
# ✅ CORRECT
git commit -m "fix(synth-abc123): resolve deployment issues"
git commit -m "feat(synth-abc123): add cloudwatch monitoring"

# ❌ WRONG (uppercase)
git commit -m "Fix(synth-abc123): Resolve deployment issues"
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance (cleanup, formatting)
- `docs`: Documentation only
- `refactor`: Code change that neither fixes bug nor adds feature

## Logging

### View Logs

```bash
# Recent logs
tail -f /tmp/synth-trainer-logs/synth-trainer-$(date +%Y%m%d).log

# Search logs for PR
grep "PR#1234" /tmp/synth-trainer-logs/*.log
```

## CI/CD Job Mapping

| CI/CD Job | Local Validation |
|-----------|------------------|
| `detect-metadata` | Checkpoint A: Metadata |
| `validate-commit-message` | Commit format check |
| `build`, `lint` | Checkpoint G: Build Quality |
| `synth` | Checkpoint G: Build Quality |
| `unit-tests` | Checkpoint H: Test Coverage |
| `deploy` | Deployment Success |
| `integration-tests-live` | Checkpoint I: Integration Tests |
| `claude-code-action` | Checkpoint J: Training Quality |

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `setup-worktree.sh` | Create/reuse worktree, sync with main |
| `wait-for-cicd.sh` | Poll CI/CD until complete |
| `add-assignee.sh` | Add agent as PR assignee |
| `validate-file-path.sh` | Check file in allowed directory |
| `post-fix-comment.sh` | Post fix summary to PR |
| `logger.sh` | Structured logging |

## Related Documentation

| Document | Description |
|----------|-------------|
| `.claude/agents/iac-synth-trainer.md` | Full agent workflow |
| `.claude/commands/task-fix.md` | Command details |
| `.claude/config/synth-trainer.yaml` | Configuration |
| `.claude/docs/policies/iteration-policy.md` | Iteration rules |
| `.claude/docs/references/validation-checkpoints.md` | All validations |
| `.claude/lessons_learnt.md` | Common issues & solutions |

---

*Quick Reference v1.0 - Updated 2025*

