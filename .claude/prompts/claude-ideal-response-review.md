# Claude IDEAL_RESPONSE.md Code Validation

You are reviewing a pull request to validate that IDEAL_RESPONSE.md accurately contains all infrastructure code and test implementations.

## Your Task

Verify that lib/IDEAL_RESPONSE.md contains the complete, exact code from all infrastructure files and tests in the repository.

## Step 1: Run the Validation Script

Execute the IDEAL_RESPONSE.md validation script:

```bash
bash .claude/scripts/validate-ideal-response.sh
```

Check the exit code:
- Exit code 0: Validation PASSED
- Exit code 1: Validation FAILED

## Step 2: Understand the Requirements

IDEAL_RESPONSE.md MUST contain the complete code for:

1. All infrastructure files (tapstack files):
   - CDK TypeScript: lib/tap-stack.ts
   - CDK Python: lib/tap_stack.py
   - CDK Java: lib/Main.java and all other .java files in lib/
   - CDKTF TypeScript: lib/tap-stack.ts
   - CDKTF Python: lib/tap_stack.py, lib/__main__.py
   - CloudFormation YAML: lib/TapStack.yml
   - CloudFormation JSON: lib/TapStack.json
   - Terraform: ALL .tf files in lib/ (main.tf, variables.tf, outputs.tf, vpc.tf, security.tf, etc.)
   - Pulumi Python: lib/__main__.py, lib/tap_stack.py
   - Pulumi TypeScript: lib/index.ts
   - Pulumi Java: lib/Main.java and all other .java files
   - Pulumi Go: lib/main.go

2. All unit test files:
   - Files matching: *.unit.test.*, *_unit_test.*, *UnitTest.*
   - In test/ or tests/ directory

3. All integration test files:
   - Files matching: *.int.test.*, *_int_test.*, *IntTest.*, *IntegrationTest.*
   - In test/ or tests/ directory

The code must match CHARACTER-FOR-CHARACTER. Even a single space difference is a failure.

## Step 3: Review the Results

If validation PASSED, post this comment:

```markdown
## IDEAL_RESPONSE.md Validation - PASSED

### Validation Results

All infrastructure code and test files are correctly documented in IDEAL_RESPONSE.md.

**Script Output:**
```
[Paste the full output from validate-ideal-response.sh]
```

### Verification Summary

- Infrastructure files: All present and matching
- Unit test files: All present and matching
- Integration test files: All present and matching

IDEAL_RESPONSE.md accurately reflects the implementation and can be used as training data.
```

If validation FAILED, post this comment:

```markdown
## IDEAL_RESPONSE.md Validation - FAILED

### Validation Results

IDEAL_RESPONSE.md is missing or has incorrect code for one or more files.

**Script Output:**
```
[Paste the full output from validate-ideal-response.sh]
```

### Files with Issues

[List the specific files that are missing or mismatched from the script output]

### What This Means

IDEAL_RESPONSE.md must contain the EXACT code from all infrastructure files and tests. Character-for-character accuracy is required.

This failure means:
- Infrastructure code may have been changed but IDEAL_RESPONSE.md was not updated
- Test files may be missing from documentation
- Code blocks in IDEAL_RESPONSE.md do not match actual file contents

### How to Fix

1. Open lib/IDEAL_RESPONSE.md
2. For each file listed above, find the corresponding code block
3. Replace the code block content with the EXACT content from the actual file
4. For missing files, add new code blocks with the complete file content
5. Ensure code blocks use proper markdown syntax:
   ```language
   [exact file content here]
   ```
6. Verify character-for-character match (no extra spaces, tabs, or formatting changes)
7. Push your changes

### Example

If tap-stack.ts is missing or wrong:

**Wrong:**
The code block is missing or has different content than lib/tap-stack.ts

**Correct:**
```typescript
[Complete contents of lib/tap-stack.ts with exact spacing and formatting]
```

---

## CRITICAL

After reviewing the validation results:
- If validation PASSED: Continue normally (exit 0)
- If validation FAILED: After posting the comment above, exit with code 1 to fail the job

Use this command to fail the job:
```bash
exit 1
```
```

## Step 4: Detailed Analysis (Only if Failed)

If validation failed, provide additional context:

1. Read the actual infrastructure files that failed validation
2. Read the IDEAL_RESPONSE.md file
3. Show specific examples of what's different
4. Explain exactly what needs to be updated

Example analysis format:

```markdown
### Detailed Analysis

I compared the actual files to IDEAL_RESPONSE.md and found these specific issues:

**lib/tap-stack.ts (MISSING)**
The file exists at lib/tap-stack.ts but there is no code block in IDEAL_RESPONSE.md containing this code.

**lib/main.tf (CONTENT MISMATCH)**
The actual file has 150 lines but the code block in IDEAL_RESPONSE.md only has 120 lines.
Lines 45-75 are missing from the documentation.

**test/infrastructure.unit.test.ts (MISSING)**
This unit test file exists but is not included in IDEAL_RESPONSE.md at all.

### Action Required

Update IDEAL_RESPONSE.md to include:
1. Complete tap-stack.ts code (add new code block)
2. Complete main.tf code (update existing code block with all 150 lines)
3. Complete infrastructure.unit.test.ts code (add new code block)
```

## Step 5: Exit Appropriately

- If validation PASSED: Post success comment and continue (exit 0)
- If validation FAILED: Post failure comment with details, then exit 1 to fail the job

## Important Notes

1. The validation script checks exact character matches. Whitespace matters.
2. All infrastructure files must be in IDEAL_RESPONSE.md, not just the main tapstack file.
3. All unit and integration tests must be included.
4. For Terraform, ALL .tf files must be present (not just main.tf).
5. For Java projects, ALL .java files in lib/ must be included (not just Main.java).

## Best Practices

1. Always run the validation script first
2. Trust the script output - it does exact string matching
3. Provide clear, actionable feedback on what needs to be fixed
4. Include specific file names and line numbers when possible
5. Show examples of correct vs incorrect formatting

## Critical

You MUST post a GitHub comment with validation results. Do not proceed without posting your review.
