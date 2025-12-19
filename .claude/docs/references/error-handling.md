# Error Handling Patterns

Standard error handling and reporting patterns for all agents.

## Standard Error Response

When validation or operation fails:

1. **Report status**: `❌ BLOCKED: {specific_error}`
2. **List issues**: Missing/invalid items with specifics
3. **Explain context**: Why this blocks progress
4. **Provide fix**: Reference to resolution guide or next steps
5. **Stop execution**: Do NOT proceed past blocking error

**Example**:
```
❌ BLOCKED: metadata.json incomplete
Missing fields: platform, language, team
Explanation: These fields are required by cli/create-task.ts
Fix: task-coordinator must regenerate metadata.json with all required fields
Status: STOPPED - awaiting metadata fix
```

## Blocking vs Non-Blocking Issues

### Blocking Issues (Stop Execution)
- Missing required files (metadata.json, PROMPT.md)
- Invalid platform/language combination
- Failed deployments (after max attempts)
- Authentication failures (gh, AWS)
- Missing critical dependencies

**Response**: Report BLOCKED status, stop execution, escalate to coordinator

### Non-Blocking Issues (Log and Continue)
- Warnings from linters (if build succeeds)
- Coverage slightly below target (85-89%)
- Minor code style issues
- Optimization suggestions

**Response**: Log warning, document in notes, continue execution

## Error Categories and Responses

**For detailed recovery decision trees**, see `../guides/error-recovery-guide.md`

### Validation Errors
**Pattern**: Pre-flight checks fail
**Response**: Report missing/invalid items, reference shared-validations.md, stop
**Example**: "Platform 'terraform' incompatible with language 'ts'. See shared-validations.md for valid combinations."
**Recovery**: Fix metadata.json or regenerate with correct platform

### Deployment Errors
**Pattern**: AWS resource creation fails
**Response**: Log error details, attempt fixes (max 5 attempts), document in MODEL_FAILURES.md
**Example**: "Deployment attempt 3/5 failed: IAM role missing permissions. Adding required policy..."
**Recovery**: See error-recovery-guide.md Category 1 (deployment failures) for decision tree

### Test Failures
**Pattern**: Unit or integration tests fail
**Response**: Analyze failure, fix code, re-run tests
**Example**: "Integration test failed: S3 bucket not found in outputs. Checking cfn-outputs/flat-outputs.json..."
**Recovery**: See error-recovery-guide.md Category 2 (test failures) for decision tree

### Quality Gate Failures
**Pattern**: training_quality score < 8
**Response**: Document gaps, provide specific improvement recommendations, do NOT proceed to PR
**Example**: "Training quality: 6/10. Recommendations: Add monitoring (CloudWatch), implement error handling, add 1 more AWS service."

### PR Creation Failures
**Pattern**: gh CLI or git operations fail
**Response**: Capture error, update CSV with error status, report recovery options
**Example**: "PR creation failed: gh not authenticated. Run 'gh auth login' and retry Phase 5."

## Agent-Specific Status Reporting

All agents must report in this format:

```markdown
**AGENT STATUS**: [PHASE] - [STATUS] - [CURRENT_STEP]
**TASK**: [Specific task being worked on]
**PROGRESS**: [X/Y] steps completed
**NEXT ACTION**: [Next planned action]
**ISSUES**: [Blocking issues or NONE]
**BLOCKED**: [YES/NO - If YES, explain and resolution needed]
```

## Escalation Protocol

### Level 1: Agent Self-Resolution
- Fix code issues
- Retry failed operations
- Adjust configurations

### Level 2: Coordinator Intervention
- Agent reports BLOCKED status
- Coordinator provides additional context
- Coordinator facilitates resolution

### Level 3: User Escalation
- Multiple agents blocked
- External dependencies needed (AWS quotas, credentials)
- Design decision required
- Coordinator requests user input

## CSV Error Recording

When task fails critically:

```bash
# Use thread-safe task manager
./.claude/scripts/task-manager.sh mark-error "${TASK_ID}" "${ERROR_MESSAGE}" "${ERROR_STEP}"
```

**Error message format**: `"[Phase] [Step] failed: [specific error]. [Context]"`

**Example**: `"Phase 5 PR creation failed: gh CLI not authenticated. Requires 'gh auth login'."`

## Recovery and Retry Logic

### Deployments
- **Max attempts**: 5
- **Between attempts**: Analyze error, fix code
- **After max**: Report BLOCKED, document error, update CSV status

### API Calls (gh, AWS)
- **Max attempts**: 3
- **Between attempts**: 1-second delay
- **After max**: Check authentication, report BLOCKED

### File Operations
- **Max attempts**: 2
- **Between attempts**: Verify path, check permissions
- **After max**: Report file system issue, stop

## Common Fixes Reference

See `.claude/lessons_learnt.md` for:
- Common deployment failures and quick fixes
- Known AWS quota issues
- Platform-specific error patterns
- CSV corruption prevention

See `.claude/validation_and_testing_guide.md` for:
- Test failure troubleshooting
- Build/lint/synth error patterns
- Coverage calculation issues
