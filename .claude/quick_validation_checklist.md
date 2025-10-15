# Quick Validation Checklist for IaC Tasks

This is a condensed checklist for quick validation of IaC synthetic tasks before PR creation.

## Pre-Generation Checklist (Generator Agent)

- [ ] Read `metadata.json` and confirm platform + language
- [ ] PROMPT.md explicitly states platform and language in opening
- [ ] All task requirements extracted and included
- [ ] environmentSuffix requirement explicitly stated
- [ ] Destroyability requirement explicitly stated (no Retain policies)
- [ ] Cost optimization patterns included (serverless preferred)
- [ ] Region requirements specified

## Pre-Deployment Checklist (QA Agent)

### Code Quality Gate
- [ ] `bash scripts/pre-validate-iac.sh` PASSED
- [ ] Platform/language matches metadata.json (CRITICAL)
- [ ] Lint passed with zero errors
- [ ] Build passed with zero errors
- [ ] Synth passed - templates generated successfully

### Testing Gate
- [ ] Unit tests created for all lib/ code
- [ ] Unit test coverage ≥ 90%
- [ ] Unit tests PASSED

### Deployment Gate
- [ ] Resources deployed successfully to AWS
- [ ] Outputs extracted to `cfn-outputs/flat-outputs.json`
- [ ] Integration tests created using real outputs
- [ ] Integration tests PASSED (no mocking)

**Note**: Resource cleanup is NOT required - handled after manual PR review

### Documentation Gate
- [ ] `lib/IDEAL_RESPONSE.md` created
- [ ] `lib/MODEL_FAILURES.md` created with proper categorization
- [ ] All failures documented with impact assessment

## Common Failure Quick Fixes

| Symptom | Quick Fix |
|---------|-----------|
| "Already exists" error | Add environmentSuffix to resource names |
| Lint errors | Run `npm run format` or `pipenv run format` |
| "Bucket not empty" | Add `autoDeleteObjects: true` |
| Wrong platform/language | Regenerate with correct platform in PROMPT.md |
| Coverage < 90% | Add more unit tests for untested code paths |
| Integration test failures | Use outputs from cfn-outputs/flat-outputs.json |
| Pre-validate warnings | Fix hardcoded values and missing environmentSuffix |

## Quick Commands

```bash
# Check platform/language
cat metadata.json | jq -r '"\(.platform) - \(.language)"'

# Pre-validate
bash scripts/pre-validate-iac.sh

# Run full pipeline (NOTE: destroy.sh is NOT run - cleanup after PR review)
bash scripts/build.sh && \
bash scripts/synth.sh && \
bash scripts/lint.sh && \
bash scripts/unit-tests.sh && \
bash scripts/deploy.sh && \
bash scripts/integration-tests.sh && \

# Check test coverage
npm run test:unit          # TypeScript
pipenv run test:unit       # Python
go test -cover ./...       # Go
./gradlew test            # Java

# Verify outputs exist
cat cfn-outputs/flat-outputs.json
```

## Red Flags (STOP and Fix)

🚨 **CRITICAL - Task will fail:**
- Platform/language mismatch with metadata.json
- Pre-validate script has errors (not warnings)
- Lint, build, or synth fails
- Unit test coverage < 90%
- Deployment fails after 5 attempts

⚠️ **WARNING - High risk:**
- Pre-validate script has > 3 warnings
- Missing environmentSuffix in resource names
- Hardcoded environment values (prod-, dev-, stage-)
- RDS non-serverless instances
- NAT Gateways (expensive)

## For Detailed Guidance

- **Complete Guide**: `.claude/validation_and_testing_guide.md`
- **Common Issues**: `.claude/lessons_learnt.md`
- **CSV Safety**: `.claude/csv_safety_guide.md`
- **Generator Instructions**: `.claude/agents/iac-infra-generator.md`
- **QA Instructions**: `.claude/agents/iac-infra-qa-trainer.md`

---

*Use this checklist before marking any task as complete or creating a PR*

