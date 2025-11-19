# MODEL_FAILURES: Issues Found in Initial Implementation

## Issue 1: API Gateway URL Export Incorrect
**Severity**: High
**Location**: index.ts, line 392

**Problem**: The exported API Gateway URL uses `executionArn` instead of `invokeUrl`, which will not provide a callable endpoint.

```typescript
// INCORRECT
export const apiGatewayUrl = pulumi.interpolate`${api.executionArn}/prod/ingest`;
```

**Impact**: Users cannot call the API endpoint with the exported URL.

**Fix**: Use the correct URL format with the API ID and deployment stage.

```typescript
// CORRECT
export const apiGatewayUrl = pulumi.interpolate`https://${api.id}.execute-api.us-east-1.amazonaws.com/prod/ingest`;
```

---

## Issue 2: Missing Dead Letter Queue for S3-triggered Lambda
**Severity**: Medium
**Location**: index.ts, DataIngestion Lambda definition

**Problem**: The DataIngestion Lambda function (S3-triggered) does not have a dead letter queue configured, violating the requirement that "all async Lambda invocations MUST have dead letter queue configured."

**Impact**: Failed executions from S3 triggers will not be captured for retry or debugging.

**Fix**: Add dead letter queue configuration to the DataIngestion Lambda.

```typescript
const dataIngestionLambda = new aws.lambda.Function(`DataIngestion-${environmentSuffix}`, {
  // ... existing config ...
  deadLetterConfig: {
    targetArn: deadLetterQueue.arn,
  },
}, { dependsOn: [dataIngestionLogGroup] });
```

---

## Issue 3: Missing Dead Letter Queue for EventBridge-triggered Lambda
**Severity**: Medium
**Location**: index.ts, DataAggregator Lambda definition

**Problem**: The DataAggregator Lambda function (EventBridge-triggered) does not have a dead letter queue configured.

**Impact**: Failed scheduled executions will not be captured.

**Fix**: Add dead letter queue configuration to the DataAggregator Lambda.

```typescript
const dataAggregatorLambda = new aws.lambda.Function(`DataAggregator-${environmentSuffix}`, {
  // ... existing config ...
  deadLetterConfig: {
    targetArn: deadLetterQueue.arn,
  },
}, { dependsOn: [dataAggregatorLogGroup] });
```

---

## Issue 4: IAM Policy Missing Deny Statements
**Severity**: Medium
**Location**: index.ts, all IAM role policies

**Problem**: The task requires "IAM least privilege with explicit deny statements", but none of the IAM policies include explicit Deny statements.

**Impact**: Does not fully meet the security requirement for least privilege access.

**Fix**: Add explicit Deny statements to IAM policies to prevent unintended access.

```typescript
const dataIngestionPolicy = new aws.iam.RolePolicy(`DataIngestion-Policy-${environmentSuffix}`, {
  role: dataIngestionRole.id,
  policy: pulumi.all([marketDataBucket.arn, processingQueue.arn, marketDataTable.arn]).apply(([bucketArn, queueArn, tableArn]) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:GetObjectVersion"],
        Resource: `${bucketArn}/*`,
      },
      {
        Effect: "Deny",
        Action: ["s3:DeleteBucket", "s3:DeleteObject"],
        Resource: "*",
      },
      // ... other statements
    ],
  })),
});
```

---

## Issue 5: CloudWatch Metric Filter Pattern Incorrect
**Severity**: Low
**Location**: index.ts, line 383

**Problem**: The metric filter pattern `"[ERROR, Exception]"` is incorrect syntax. This should be a proper filter pattern that matches ERROR or Exception in log messages.

**Current**:
```typescript
pattern: "[ERROR, Exception]",
```

**Fixed**:
```typescript
pattern: '?ERROR ?Exception',
```

**Impact**: Error metrics will not be captured correctly.

---

## Issue 6: Missing Metric Filters for All Lambda Functions
**Severity**: Low
**Location**: index.ts

**Problem**: Only the DataIngestion Lambda has an error metric filter. The task requires "metric filters for errors" (plural), suggesting all Lambda functions should have error tracking.

**Impact**: Errors in DataProcessor and DataAggregator will not generate CloudWatch metrics.

**Fix**: Add metric filters for all three Lambda function log groups.

---

## Issue 7: SQS Redrive Policy as String Instead of Object
**Severity**: Low
**Location**: index.ts, line 75

**Problem**: The redrivePolicy is defined as a string template, which may cause type issues with Pulumi's type checking.

**Current**:
```typescript
redrivePolicy: pulumi.interpolate`{
  "deadLetterTargetArn": "${deadLetterQueue.arn}",
  "maxReceiveCount": 3
}`,
```

**Better**:
```typescript
redrivePolicy: deadLetterQueue.arn.apply(arn => JSON.stringify({
  deadLetterTargetArn: arn,
  maxReceiveCount: 3,
})),
```

**Impact**: May cause runtime type validation issues.

---

## Summary

Total issues found: 7
- High severity: 1
- Medium severity: 4
- Low severity: 2

All issues have been documented with specific locations, explanations, and corrected code examples. These fixes will be applied in IDEAL_RESPONSE.md.
