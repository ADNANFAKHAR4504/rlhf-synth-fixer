# Documentation Structure

This directory contains organized documentation for the IaC Test Automation system.

## Directory Structure

```
.claude/
├── agents/              # Agent-specific prompts and instructions
│   ├── iac-code-reviewer.md
│   ├── iac-infra-generator.md
│   ├── iac-infra-qa-trainer.md
│   └── iac-task-selector.md
│
├── commands/            # Slash command implementations
│   └── task-coordinator.md
│
├── docs/                # Comprehensive documentation
│   ├── guides/          # How-to guides and tutorials
│   │   ├── working-directory-guide.md
│   │   ├── error-recovery-guide.md
│   │   └── validation_and_testing_guide.md
│   │
│   ├── policies/        # Policies and decision frameworks
│   │   ├── iteration-policy.md
│   │   ├── training-quality-guide.md
│   │   └── csv_safety_guide.md
│   │
│   └── references/      # Quick reference materials
│       ├── shared-validations.md
│       ├── validation-checkpoints.md
│       ├── cicd-file-restrictions.md
│       ├── error-handling.md
│       └── quick_validation_checklist.md
│
├── scripts/             # Utility scripts
│   ├── task-manager.sh
│   ├── preflight-checks.sh
│   └── verify-worktree.sh
│
├── lessons_learnt.md    # Root-level: Historical learnings
└── platform_enforcement.md  # Root-level: Platform config

```

## Document Categories

### Guides (`docs/guides/`)
**Purpose**: Step-by-step instructions and comprehensive how-to documentation

- `working-directory-guide.md`: Directory context, verification commands, path rules
- `error-recovery-guide.md`: Decision trees for error recovery and retry logic
- `validation_and_testing_guide.md`: Testing procedures and validation steps

### Policies (`docs/policies/`)
**Purpose**: Decision frameworks, rules, and standards

- `iteration-policy.md`: When to iterate vs fail, thresholds, max limits
- `training-quality-guide.md`: Scoring system, categories, examples
- `csv_safety_guide.md`: CSV file manipulation rules and safety

### References (`docs/references/`)
**Purpose**: Quick lookup materials and checklists

- `shared-validations.md`: Common validation rules across agents
- `validation-checkpoints.md`: Named checkpoints for reuse
- `cicd-file-restrictions.md`: **CRITICAL** File location rules enforced by CI/CD (check-project-files.sh)
- `error-handling.md`: Error patterns and reporting standards
- `quick_validation_checklist.md`: Fast checklist for common tasks

## Usage Patterns

### For Agents
1. Read agent-specific file in `agents/` for your role
2. Reference `docs/references/` for validation rules
3. Use `docs/policies/` for decision-making
4. Consult `docs/guides/` when encountering complex scenarios

### For Coordinators
1. Start with `commands/task-coordinator.md`
2. Reference `docs/policies/iteration-policy.md` for score decisions
3. Use `scripts/` for automation tasks

### For Troubleshooting
1. Check `docs/guides/error-recovery-guide.md` for decision trees
2. Review `lessons_learnt.md` for historical issues
3. Consult `docs/references/error-handling.md` for patterns

## File Naming Conventions

- **Guides**: `{topic}-guide.md` (e.g., `working-directory-guide.md`)
- **Policies**: `{topic}-policy.md` (e.g., `iteration-policy.md`)
- **References**: `{topic}.md` or `{topic}-{detail}.md` (e.g., `shared-validations.md`)
- **Checklists**: `{scope}_checklist.md` (e.g., `quick_validation_checklist.md`)

## Cross-References

Documents frequently reference each other:
- Agents reference `docs/references/` for validation rules
- Policies are referenced by agents for decisions
- Guides provide deep-dive into complex topics
- References point to guides for details

## Maintenance

When adding new documentation:
1. Determine category (guide/policy/reference)
2. Place in appropriate `docs/` subdirectory
3. Update this README with entry
4. Update cross-references in related documents
5. Follow naming conventions
