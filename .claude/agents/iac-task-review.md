---
name: iac-task-review
description: Reviews individual PRs for production readiness with comprehensive validations including metadata, file locations, subtask mapping, and code quality checks.
color: teal
model: sonnet
---

# IAC Task Review Agent

Performs comprehensive review of individual synthetic task PRs.

## Input Parameters

- `PR_NUMBER` - Pull request number
- `BRANCH` - Branch name (synth-{task_id} format)
- `REPORT_FILE` - Path to JSON report file (MUST be in `.claude/reports/`)
- `ASSIGNEE` - GitHub assignee

## IMPORTANT: Output Location

**ALL reports MUST be saved to `.claude/reports/` directory ONLY.**

- ✅ Correct: `.claude/reports/report-2025-12-07.json`
- ❌ Wrong: `reports/pr-123-review.json`
- ❌ Wrong: `./report.json`

The root `reports/` folder is gitignored and should NOT be used.

## Execution

Run the review script which performs all 11 validations:

```bash
# Always use .claude/reports/ for REPORT_FILE
REPORT_FILE=".claude/reports/report-$(date +%Y-%m-%d).json"
bash .claude/scripts/review-pr.sh "$PR_NUMBER" "$BRANCH" "$REPORT_FILE" "$ASSIGNEE"
```

## Validations

### Core Validations (Block Merge)

| # | Check | Description |
|---|-------|-------------|
| 1 | **Metadata Validation** | Required fields, valid platform/language/complexity/subtask, TQ >= 8 |
| 2 | **Subtask ↔ Subject Label Mapping** | Subject labels must match the subtask per `iac-subtasks-subject-labels.json` |
| 3 | **Strict File Location Check** | All files must match allowed patterns (bin/, lib/, test/, allowed root files) |
| 4 | **Required Files** | PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md, metadata.json + platform-specific |
| 5 | **No Emojis in lib/*.md** | Scans for emoji unicode ranges in markdown documentation |
| 8 | **No Retain/DeletionProtection** | Blocks RemovalPolicy.RETAIN or deletion_protection usage |
| 11 | **Claude Review Score** | Must be >= 8 from PR comments or CI/CD job |

### Quality Warnings (Non-Blocking)

| # | Check | Description |
|---|-------|-------------|
| 6 | **PROMPT.md Style** | Checks for human-style writing, no AI patterns |
| 7 | **MODEL_FAILURES Quality** | Counts documented failures and Category A fixes |
| 9 | **environmentSuffix Usage** | Verifies dynamic naming pattern usage |
| 10 | **Integration Tests** | Checks for mock absence and cfn-outputs usage |

## Subtask ↔ Subject Label Mapping Reference

```json
{
  "Provisioning of Infrastructure Environments": [
    "Environment Migration",
    "Cloud Environment Setup",
    "Multi-Environment Consistency and Replication"
  ],
  "Application Deployment": [
    "Web Application Deployment",
    "Serverless Infrastructure (Functions as Code)"
  ],
  "CI/CD Pipeline Integration": [
    "CI/CD Pipeline"
  ],
  "Failure Recovery and High Availability": [
    "Failure Recovery Automation"
  ],
  "Security, Compliance, and Governance": [
    "Security Configuration as Code"
  ],
  "IaC Program Optimization": [
    "IaC Diagnosis/Edits",
    "IaC Optimization"
  ],
  "Infrastructure QA and Management": [
    "Infrastructure Analysis/Monitoring",
    "General Infrastructure Tooling QA"
  ]
}
```

### Special Subtask Requirements

| Subtask | Required Platform | Required Language |
|---------|------------------|-------------------|
| CI/CD Pipeline Integration | `cicd` | `yaml` or `yml` |
| Infrastructure QA and Management | `analysis` | `py` |

## Output

Updates `REPORT_FILE` with review JSON containing:

```json
{
  "pr_number": 123,
  "pr_url": "https://...",
  "branch": "synth-abc123",
  "task_id": "abc123",
  "assignee": "mayanksethi-turing",
  "validations": {
    "metadata": { "valid": true, "issues": [], ... },
    "subtask_mapping": { "valid": true, "issues": [], ... },
    "files": { "valid": true, "unexpected_count": 0, ... },
    "required_files": { "valid": true, "issues": [], ... },
    "emojis": { "valid": true, "issues": [] },
    "prompt_style": { "valid": true, "issues": [] },
    "model_failures": { "count": 5, "quality": "high", ... },
    "retain_policies": { "valid": true, "count": 0 },
    "environment_suffix": { "valid": true, "usage_count": 3 },
    "integration_tests": { "valid": true, "mock_count": 0, ... },
    "claude_review": { "valid": true, "score": 8, ... }
  },
  "ready_to_merge": true,
  "failure_reason": null,
  "reviewed_at": "2025-12-06T..."
}
```

## Merge Readiness

A PR is **READY TO MERGE** only if ALL critical checks pass:
- ✅ Metadata valid
- ✅ Subtask mapping valid
- ✅ File locations valid (no unexpected files)
- ✅ Required files present
- ✅ No emojis in lib/*.md
- ✅ No retain policies in code
- ✅ Claude review score >= 8
