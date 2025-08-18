# Terraform Platform Validation Guide

## Pre-Pull Request Validation Checklist

Before creating a pull request for Terraform-based infrastructure tasks, ensure the following validation steps are completed:

### 1. NPM Commands Validation
Run these commands in sequence and ensure all pass:

```bash
npm run build    # TypeScript compilation
npm run lint     # ESLint validation  
npm run test:unit
```

### 2. Integration Tests Assessment
Observe whether they would pass if infrastructure was deployed.

### 3. GitHub CI/CD Workflow Review

Ensure the PR will pass the `claude review` workflow by validating:

#### Required Documentation Files
- `lib/PROMPT.md` - Task requirements documentation
- `lib/MODEL_RESPONSE.md` - Initial implementation
- `lib/IDEAL_RESPONSE.md` - Reference implementation
- `lib/MODEL_FAILURES.md` - Issues and fixes documentation

#### File Content Validation
- `lib/PROMPT.md` must appear human-written (no AI-generated content, emojis, or formatting symbols)
- All files must be properly structured and contain relevant content
- Documentation must align with actual implementation

#### CI Pipeline Requirements
The Claude Review job requires:
- Successful completion of integration-tests-live job
- All required documentation files present
- Human-written task requirements
- No AI-generated formatting in PROMPT.md

### 4. Final Validation Summary

Before PR creation, confirm:
- Build passes: `npm run build`
- Linting passes: `npm run lint`
- Unit tests pass: `npm run test:unit`
- Integration tests assessed
- All required lib/ files present and properly formatted
- Infrastructure meets all original requirements
- PCI-DSS compliance validated
- Production readiness confirmed

### 5. Expected CI/CD Pipeline Flow

When PR is created, expect these jobs to run:
1. **detect-metadata** - Validates project structure
2. **build** - Runs build process
3. **synth** - Synthesizes infrastructure templates
4. **lint** - Code quality checks
5. **unit-tests** - Runs unit test suite
6. **integration-tests-live** - Deploys and tests infrastructure
7. **claude-code-action** - Claude Review validation

### 6. Common Issues and Resolutions

#### Integration Test Failures
- **Cause**: Infrastructure destroyed after QA validation
- **Resolution**: Expected behavior, assess test logic not results

#### Claude Review Failures
- **Cause**: Missing documentation files or AI-generated content
- **Resolution**: Ensure all lib/ files present and human-written

#### Build Failures
- **Cause**: TypeScript compilation errors
- **Resolution**: Run `npm run build` locally and fix errors

#### Lint Failures
- **Cause**: Code style violations
- **Resolution**: Run `npm run lint` locally and fix issues

## Task Completion Workflow

1. Complete infrastructure implementation
2. Run QA validation phase
3. Run code review phase
4. Execute pre-PR validation checklist
5. Request permission for PR creation
6. Create pull request only after explicit approval

## Final Note
Exclude these directories from PRs:
- `.claude`

This ensures all tasks meet production standards before PR submission.