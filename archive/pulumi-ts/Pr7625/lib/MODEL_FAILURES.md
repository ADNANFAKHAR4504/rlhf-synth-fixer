# MODEL_FAILURES.md - Intentional Issues in MODEL_RESPONSE

This document lists the intentional failures and issues present in the MODEL_RESPONSE.md implementation.

## Infrastructure Issues (lib/tap-stack.ts)

### 1. Missing S3 Block Public Access Configuration
**Location**: Line 24-54 (S3 Bucket definition)
**Issue**: The S3 bucket for compliance reports does not have `blockPublicAccess` configuration
**Severity**: HIGH
**Impact**: Bucket could potentially be made public, exposing sensitive compliance data
**Fix Required**: Add `blockPublicAccess` property with all settings enabled

```typescript
// MISSING:
blockPublicAccess: {
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
}
```

### 2. CloudWatch Log Group Naming Pattern
**Location**: Line 145 (CloudWatch LogGroup)
**Issue**: Log group name uses literal `/aws/lambda/compliance-scanner-${environmentSuffix}` instead of deriving from Lambda function name
**Severity**: MEDIUM
**Impact**: If Lambda function name changes, logs won't be captured; naming inconsistency
**Fix Required**: Use `scannerFunction.name` to construct log group name dynamically

### 3. Missing Explicit Naming for Resources
**Location**: Multiple resources
**Issue**: Some resources rely on Pulumi auto-naming instead of explicit names
**Severity**: LOW
**Impact**: Less control over resource naming; harder to track in AWS console
**Fix Required**: Add explicit `name` property to EventRule, EventTarget, IAM resources

## Lambda Function Issues (lib/lambda/scanner/index.ts)

### 4. No Pagination Handling for Security Groups
**Location**: Line 377-407 (`checkSecurityGroups` function)
**Issue**: `DescribeSecurityGroupsCommand` does not handle pagination via `NextToken`
**Severity**: HIGH
**Impact**: In accounts with >1000 security groups, only first page is scanned
**Fix Required**: Implement pagination loop using `NextToken`

```typescript
// MISSING pagination loop:
let nextToken: string | undefined;
do {
  const response = await ec2Client.send(
    new DescribeSecurityGroupsCommand({ NextToken: nextToken })
  );
  // process results
  nextToken = response.NextToken;
} while (nextToken);
```

### 5. No Retry Logic for AWS API Calls
**Location**: Line 410-461 (`checkS3Compliance` function) and others
**Issue**: No exponential backoff or retry logic for AWS SDK calls
**Severity**: MEDIUM
**Impact**: API throttling errors will cause scan failure instead of graceful retry
**Fix Required**: Implement retry wrapper with exponential backoff

```typescript
// MISSING retry wrapper function:
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  // implementation with exponential backoff
}
```

### 6. Missing Resource Count Tracking
**Location**: Line 300-314 (ComplianceReport creation)
**Issue**: `totalResources` is hardcoded to 0, `checked` counts always 0
**Severity**: MEDIUM
**Impact**: Reports don't show how many resources were scanned
**Fix Required**: Track actual resource counts during scanning

### 7. Sequential Violation Storage (Performance Issue)
**Location**: Line 565-584 (`storeViolations` function)
**Issue**: DynamoDB PutItem calls are sequential in a for loop
**Severity**: MEDIUM
**Impact**: Slow performance when storing many violations
**Fix Required**: Use `Promise.all()` or DynamoDB BatchWriteItem for parallel/batch operations

### 8. Missing Pagination for EC2, EBS, VPC, IAM
**Location**: Multiple functions
**Issue**: None of the check functions implement pagination
**Severity**: HIGH
**Impact**: Large AWS accounts will have incomplete scans
**Fix Required**: Add pagination to all AWS SDK describe/list calls

## Configuration Issues

### 9. Missing Error Handling for Missing Environment Variables
**Location**: Line 566 (`storeViolations`), Line 587 (`uploadReport`)
**Issue**: Uses `process.env.DYNAMODB_TABLE!` without checking if undefined
**Severity**: MEDIUM
**Impact**: Runtime errors if environment variables not set
**Fix Required**: Add validation at handler start

### 10. No Timeout Handling
**Location**: All async functions
**Issue**: No timeout protection for AWS API calls
**Severity**: LOW
**Impact**: Lambda could timeout waiting for slow AWS API responses
**Fix Required**: Add timeout wrapper or use AbortController

## Missing Features from Requirements

### 11. No Parallel Scanning with Concurrency Control
**Requirement**: "Implement parallel scanning with configurable concurrency limits"
**Issue**: All scans run sequentially
**Fix Required**: Use `Promise.all()` with concurrency limiter (p-limit library)

### 12. No Separate Compliance Scores Per Service Category
**Requirement**: "Calculate separate compliance scores for each service category"
**Issue**: Only overall score calculated, not per-service
**Fix Required**: Calculate individual scores in `calculateComplianceScore()`

### 13. Incomplete Summary Statistics
**Issue**: Summary `checked` counts are always 0
**Fix Required**: Track actual resource counts and populate summary properly

## Best Practice Violations

### 14. No Input Validation
**Issue**: Handler doesn't validate event structure
**Fix Required**: Add event validation and error responses

### 15. Insufficient Error Context
**Issue**: Generic error logging without context
**Fix Required**: Include resource IDs, operation details in error logs

### 16. No Circuit Breaker Pattern
**Issue**: Continues scanning even if AWS APIs are consistently failing
**Fix Required**: Implement circuit breaker to fail fast

## Testing Gaps

### 17. No Unit Tests Provided
**Issue**: No test files in MODEL_RESPONSE
**Fix Required**: Create test files for all functions

### 18. No Integration Tests
**Issue**: No end-to-end tests for compliance scanning
**Fix Required**: Create integration tests that validate against actual/mock AWS resources

## Summary

**Total Issues**: 18
**Critical/High**: 6
**Medium**: 8
**Low**: 4

The MODEL_RESPONSE provides a functional baseline but has significant gaps in:
- Pagination handling (affects completeness)
- Error handling and retry logic (affects reliability)
- Performance optimization (affects scalability)
- Security best practices (S3 public access)
- Feature completeness (missing requirements)

These issues are intentional to test the QA and code review processes.
