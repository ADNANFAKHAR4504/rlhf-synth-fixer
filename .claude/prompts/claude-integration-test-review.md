# Claude Integration Test Connectivity Review

You are reviewing integration tests to ensure they verify end-to-end service connectivity described in the prompt.

## Your Task

Validate that integration tests actually test real AWS service connections, not just mocked interactions.

## Step 1: Run Integration Test Connectivity Validation

**MANDATORY**: Execute the integration test connectivity validation script:

```bash
bash ./scripts/claude-validate-integration-test-connectivity.sh
```

**Check the exit code:**
- Exit code 0: Validation PASSED
- Exit code 1: Validation FAILED

## Step 2: Post Review Comment

You MUST post a GitHub comment on this PR with your findings.

### If Validation PASSED:

Post this comment:

```markdown
## ✅ Integration Test Connectivity Review - PASSED

### Validation Results

The integration test connectivity validation has passed.

**Script Output:**
```
[Paste the full output from claude-validate-integration-test-connectivity.sh]
```

### Summary

Integration tests appropriately verify end-to-end service connectivity described in `lib/PROMPT.md`.

- ✅ All services from prompt are tested in integration tests
- ✅ Tests include actual AWS SDK calls
- ✅ Tests verify data flow between services
- ✅ Minimal mock usage (tests use real deployed resources)
```

### If Validation FAILED:

Post this comment:

```markdown
## ❌ Integration Test Connectivity Review - FAILED

### Validation Results

The integration test connectivity validation has failed.

**Script Output:**
```
[Paste the full output from claude-validate-integration-test-connectivity.sh]
```

### Issues Found

[List the specific issues from the script output]

### How to Fix

1. Review the script output above for specific failures
2. Identify which services from PROMPT.md are not tested
3. Add integration tests that verify:
   - End-to-end data flow (e.g., upload to S3 → Lambda executes → data in DynamoDB)
   - Actual AWS SDK calls to deployed resources
   - Real service interactions (not mocks)
   - Complete connectivity chain as described in prompt
4. Push your changes

### Examples

**Good integration tests:**
```typescript
it('should process uploaded file through complete pipeline', async () => {
  // Upload file to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'test-file.json',
    Body: JSON.stringify({ test: 'data' })
  }));

  // Wait for Lambda to process
  await sleep(2000);

  // Verify data appeared in DynamoDB
  const result = await dynamoClient.send(new GetItemCommand({
    TableName: tableName,
    Key: { id: { S: 'test-file' } }
  }));

  expect(result.Item).toBeDefined();
  expect(result.Item.processedData).toEqual({ S: 'data' });
});
```

**Bad integration tests (not testing connectivity):**
```typescript
it('should have deployed resources', async () => {
  const buckets = await s3Client.send(new ListBucketsCommand({}));
  expect(buckets.Buckets.length).toBeGreaterThan(0);
});
```
```

## Step 3: Exit Appropriately

- If validation PASSED: Continue normally (exit 0)
- If validation FAILED: After posting the comment, exit with code 1 to fail the job

## CRITICAL

You MUST post a GitHub comment. Do not proceed without posting your review.
