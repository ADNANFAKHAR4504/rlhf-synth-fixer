# Enhanced Fixing Guide for iac-synth-trainer

This guide explains the enhanced error analysis and smart fixing capabilities added to the iac-synth-trainer agent.

## Overview

The iac-synth-trainer now includes four new scripts that work together to improve issue identification and fix application:

1. **analyze-errors.sh** - Enhanced error pattern matching and semantic analysis
2. **fix-templates.sh** - Reusable fix functions from lessons_learnt.md
3. **prioritize-fixes.sh** - Prioritizes fixes by impact and batches related fixes
4. **validate-fixes.sh** - Incremental validation of fixes

## How It Works

### 1. Enhanced Error Analysis

**Script**: `.claude/scripts/analyze-errors.sh`

**What it does**:
- Extracts errors from GitHub pipeline logs with context (5 lines before/after)
- Matches errors against known patterns from lessons_learnt.md
- Performs semantic analysis to extract resource types, error types, and locations
- Classifies errors by fix type and priority
- Generates JSON output with structured error data

**Usage**:
```bash
bash .claude/scripts/analyze-errors.sh <PR_NUMBER> <LOG_FILE>
```

**Output**:
- `/tmp/pr-<PR_NUMBER>-error-summary.json` - Summary of all errors
- `/tmp/pr-<PR_NUMBER>-classified-errors.json` - Detailed error classification

**Example**:
```bash
bash .claude/scripts/analyze-errors.sh 6323 /tmp/pr-6323-logs.txt
```

### 2. Fix Templates

**Script**: `.claude/scripts/fix-templates.sh`

**What it does**:
- Provides reusable fix functions for common issues
- Supports multiple platforms (CDK, CDKTF, Pulumi, Terraform)
- Supports multiple languages (TypeScript, Python, Go, Java)
- Handles platform-specific syntax differences

**Available Templates**:
- `missing_environment_suffix` - Adds environmentSuffix to resource names
- `retain_policy` - Changes RETAIN to DESTROY
- `deletion_protection` - Disables deletion protection
- `config_iam_policy` - Fixes AWS Config IAM policy names
- `deprecated_synthetics` - Updates Synthetics runtime version
- `aws_sdk_v2` - Replaces AWS SDK v2 usage
- `lambda_concurrency` - Removes Lambda reserved concurrency

**Usage**:
```bash
source .claude/scripts/fix-templates.sh
apply_fix_template <template_name> <file_path> [platform] [language]
```

**Example**:
```bash
source .claude/scripts/fix-templates.sh
apply_fix_template "missing_environment_suffix" "lib/storage-stack.ts" "cdk" "ts"
```

### 3. Fix Prioritization

**Script**: `.claude/scripts/prioritize-fixes.sh`

**What it does**:
- Prioritizes fixes by impact (Critical → High → Medium → Low)
- Groups related fixes together for batching
- Identifies which fixes can be applied together
- Generates prioritized fix plan

**Priority Levels**:
- **Priority 1 (Critical)**: AWS quota issues, blocking errors
- **Priority 2 (High)**: Missing environmentSuffix, Retain policies, deployment blockers
- **Priority 3 (Medium)**: Deprecated versions, SDK issues, type mismatches
- **Priority 4 (Low)**: Style issues, minor optimizations

**Usage**:
```bash
bash .claude/scripts/prioritize-fixes.sh <errors_json> [platform] [language]
```

**Example**:
```bash
PRIORITIZED=$(bash .claude/scripts/prioritize-fixes.sh /tmp/pr-6323-classified-errors.json "cdk" "ts")
```

### 4. Incremental Validation

**Script**: `.claude/scripts/validate-fixes.sh`

**What it does**:
- Validates each fix after it's applied
- Checks fix-specific changes (e.g., environmentSuffix presence)
- Runs platform-specific validation (synth, preview, validate)
- Provides validation summary

**Usage**:
```bash
bash .claude/scripts/validate-fixes.sh <fixes_json> [platform] [language]
```

**Example**:
```bash
bash .claude/scripts/validate-fixes.sh /tmp/pr-6323-classified-errors.json "cdk" "ts"
```

## Integration with iac-synth-trainer

The enhanced fixing capabilities are automatically integrated into the iac-synth-trainer workflow:

### Phase 2.0: Root Cause Analysis

Enhanced error analysis is automatically run when analyzing GitHub logs:

```bash
# In Phase 2.0.1
bash .claude/scripts/analyze-errors.sh $PR_NUMBER /tmp/pr-${PR_NUMBER}-logs.txt
```

### Phase 2.0.2: Fix Plan Development

Fix plans are generated from prioritized fixes:

```bash
# Prioritize fixes
PRIORITIZED=$(bash .claude/scripts/prioritize-fixes.sh /tmp/pr-${PR_NUMBER}-classified-errors.json "$PLATFORM" "$LANGUAGE")
```

### Phase 2.5: Pre-Deployment Validation

Fix templates are used for automated fixes:

```bash
source .claude/scripts/fix-templates.sh
fix_retain_policies "$file" "$PLATFORM" "$LANGUAGE"
```

### Phase 2.6: Local Validation

Incremental validation is performed:

```bash
bash .claude/scripts/validate-fixes.sh /tmp/pr-${PR_NUMBER}-classified-errors.json "$PLATFORM" "$LANGUAGE"
```

## Benefits

### Faster Fixes
- **Batch Processing**: Related fixes applied together reduces iteration time
- **Pattern Matching**: Common issues caught automatically
- **Prioritization**: Critical fixes applied first

### Higher Success Rate
- **Pattern Matching**: Matches errors against known patterns from lessons_learnt.md
- **Semantic Analysis**: Better understanding of error context
- **Fix Templates**: Proven fixes from lessons_learnt.md

### Better Validation
- **Incremental Validation**: Each fix validated before proceeding
- **Platform-Specific**: Runs appropriate validation for each platform
- **Early Detection**: Catches issues before deployment

### Reduced Manual Work
- **Automated Fixes**: Templates handle repetitive fixes
- **Structured Analysis**: JSON output enables programmatic processing
- **Reusable Functions**: Fix templates can be reused across PRs

## Error Pattern Database

The error analysis script includes a database of known error patterns:

| Pattern | Fix Type | Priority |
|---------|----------|----------|
| BucketAlreadyExists | missing_environment_suffix | High |
| Policy.*does not exist | config_iam_policy | High |
| Cannot find module | missing_dependency | High |
| quota\|limit exceeded | aws_quota | Critical |
| RemovalPolicy.*RETAIN | retain_policy | High |
| GuardDuty.*detector.*exists | guardduty_detector | High |
| SYNTHETICS_NODEJS_PUPPETEER_[0-5] | deprecated_synthetics | Medium |
| aws-sdk.*not found | aws_sdk_v2 | Medium |
| deletionProtection.*true | deletion_protection | High |

## Adding New Fix Templates

To add a new fix template:

1. Add the pattern to `analyze-errors.sh`:
```bash
declare -A ERROR_PATTERNS=(
  ...
  ["new_pattern"]="new_fix_type"
)
```

2. Add the fix function to `fix-templates.sh`:
```bash
fix_new_fix_type() {
  local file="$1"
  local platform="$2"
  local language="$3"
  
  # Fix implementation
}
```

3. Add validation to `validate-fixes.sh`:
```bash
case "$fix_type" in
  ...
  "new_fix_type")
    # Validation logic
    ;;
esac
```

4. Update priority in `prioritize-fixes.sh`:
```bash
declare -A FIX_PRIORITIES=(
  ...
  ["new_fix_type"]=2  # High priority
)
```

## Troubleshooting

### Enhanced analysis not available

If enhanced error analysis fails, the agent falls back to basic grep patterns. Check:
- Log file exists and is readable
- jq is installed
- Scripts are executable

### Fix templates not working

If fix templates fail:
- Check platform and language are correct
- Verify file exists and is readable
- Check syntax for platform-specific fixes

### Validation failing

If validation fails:
- Check fix was actually applied
- Verify platform-specific tools are available (npm, pulumi, terraform)
- Review validation output for specific errors

## Future Enhancements

Potential future improvements:
- AST-based code analysis for more precise fixes
- Historical pattern learning from successful fixes
- Machine learning for error classification
- Fix confidence scoring
- Automated fix testing

