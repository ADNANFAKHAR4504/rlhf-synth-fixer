# Claude Unit Test Connectivity Review

You are reviewing unit tests to ensure they verify the service connectivity described in the prompt.

## Your Task

Validate that unit tests actually test the connections between services, not just that resources exist.

## Step 1: Run Unit Test Connectivity Validation

**MANDATORY**: Execute the unit test connectivity validation script:

```bash
bash ./scripts/claude-validate-unit-test-connectivity.sh
```

**Check the exit code:**
- Exit code 0: Validation PASSED
- Exit code 1: Validation FAILED

## Step 2: Post Review Comment

You MUST post a GitHub comment on this PR with your findings.

### If Validation PASSED:

Post this comment:

```markdown
## ✅ Unit Test Connectivity Review - PASSED

### Validation Results

The unit test connectivity validation has passed.

**Script Output:**
```
[Paste the full output from claude-validate-unit-test-connectivity.sh]
```

### Summary

Unit tests appropriately verify the service connectivity described in `lib/PROMPT.md`.

- ✅ All services from prompt are covered in tests
- ✅ Tests verify properties and configuration, not just existence
- ✅ Tests validate how services connect and integrate
```

### If Validation FAILED:

Post this comment:

```markdown
## ❌ Unit Test Connectivity Review - FAILED

### Validation Results

The unit test connectivity validation has failed.

**Script Output:**
```
[Paste the full output from claude-validate-unit-test-connectivity.sh]
```

### Issues Found

[List the specific issues from the script output]

### How to Fix

1. Review the script output above for specific failures
2. Identify which services from PROMPT.md are not tested
3. Add unit tests that verify:
   - Service configuration properties (not just existence)
   - IAM permissions and roles
   - Event triggers and integrations
   - Network configurations
4. Push your changes

### Examples

**Good unit tests:**
```typescript
it('should configure S3 bucket with Lambda trigger', () => {
  expect(template).toHaveResourceLike('AWS::S3::Bucket', {
    NotificationConfiguration: {
      LambdaConfigurations: [{
        Event: 's3:ObjectCreated:*',
        Function: { 'Fn::GetAtt': ['MyFunction', 'Arn'] }
      }]
    }
  });
});

it('should grant Lambda permission to write to DynamoDB', () => {
  expect(template).toHaveResourceLike('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [{
        Action: 'dynamodb:PutItem',
        Resource: { 'Fn::GetAtt': ['MyTable', 'Arn'] }
      }]
    }
  });
});
```

**Bad unit tests (existence-only):**
```typescript
it('should create S3 bucket', () => {
  expect(template).toHaveResource('AWS::S3::Bucket');
});

it('should create Lambda function', () => {
  expect(lambda).toBeDefined();
});
```
```

## Step 3: Exit Appropriately

- If validation PASSED: Continue normally (exit 0)
- If validation FAILED: After posting the comment, exit with code 1 to fail the job

## CRITICAL

You MUST post a GitHub comment. Do not proceed without posting your review.
