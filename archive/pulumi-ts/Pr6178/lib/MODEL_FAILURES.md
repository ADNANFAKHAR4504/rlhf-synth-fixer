# Model Failures Documentation

This document catalogs the intentional issues introduced in MODEL_RESPONSE.md and how they were corrected in IDEAL_RESPONSE.md. These issues represent common mistakes made when generating infrastructure code.

## Issue 1: Missing X-Ray Policy Attachments

**Category:** IAM / Permissions
**Severity:** High
**Requirement:** "All Lambda functions must have X-Ray tracing enabled"

### Problem
MODEL_RESPONSE attached only the basic Lambda execution policy to both Lambda roles, but did not attach the AWS X-Ray write access policy. While the Lambda functions had `tracingConfig: { mode: 'Active' }`, they lacked the IAM permissions to actually send trace data to X-Ray.

### Impact
Lambda functions would fail to send X-Ray trace data, resulting in missing distributed tracing information and potential execution errors.

### Fix Applied in IDEAL_RESPONSE
Added X-Ray policy attachments for both Lambda roles:

```typescript
new aws.iam.RolePolicyAttachment(
  `validation-lambda-xray-${environmentSuffix}`,
  {
    role: validationLambdaRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
  },
  { parent: validationLambdaRole }
);

new aws.iam.RolePolicyAttachment(
  `processing-lambda-xray-${environmentSuffix}`,
  {
    role: processingLambdaRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
  },
  { parent: processingLambdaRole }
);
```

---

## Issue 2: Missing Dead Letter Queue

**Category:** Resource Creation
**Severity:** Critical
**Requirement:** "Implement a dead letter queue pattern using SQS for failed processing attempts"

### Problem
MODEL_RESPONSE completely omitted the SQS dead letter queue resource. The requirement explicitly stated: "Dead letter queues must retain failed messages for 14 days" and "SQS messages must have a visibility timeout of 5 minutes".

### Impact
Without a DLQ, failed Lambda invocations would be permanently lost with no ability to retry or investigate failures. This violates the reliability requirement.

### Fix Applied in IDEAL_RESPONSE
Added SQS queue with correct configuration:

```typescript
const deadLetterQueue = new aws.sqs.Queue(
  `dlq-${environmentSuffix}`,
  {
    name: `transaction-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    visibilityTimeoutSeconds: 300, // 5 minutes
    tags: defaultTags,
  },
  { parent: this }
);
```

---

## Issue 3: Missing CloudWatch Log Groups

**Category:** Observability / Monitoring
**Severity:** High
**Requirement:** "CloudWatch logs must be retained for exactly 30 days"

### Problem
MODEL_RESPONSE did not create explicit CloudWatch Log Groups for the Lambda functions. Without explicit log groups, CloudWatch would create them automatically with the default retention period (never expire), violating the 30-day retention requirement.

### Impact
- Logs would be retained indefinitely, increasing storage costs
- Compliance violation (requirement specified exactly 30 days)
- Missing dependsOn relationship could cause Lambda to fail on first invocation

### Fix Applied in IDEAL_RESPONSE
Created explicit Log Groups with 30-day retention:

```typescript
const validationLogGroup = new aws.cloudwatch.LogGroup(
  `validation-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/validation-lambda-${environmentSuffix}`,
    retentionInDays: 30,
    tags: defaultTags,
  },
  { parent: this }
);

const processingLogGroup = new aws.cloudwatch.LogGroup(
  `processing-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/processing-lambda-${environmentSuffix}`,
    retentionInDays: 30,
    tags: defaultTags,
  },
  { parent: this }
);
```

And added dependsOn to Lambda functions:

```typescript
{ parent: this, dependsOn: [validationLogGroup] }
```

---

## Issue 4: Missing SNS Publish Permission for Validation Lambda

**Category:** IAM / Permissions
**Severity:** Critical
**Requirement:** Lambda must publish to SNS topic

### Problem
MODEL_RESPONSE created the validation Lambda with environment variable `SNS_TOPIC_ARN` but never granted the Lambda function IAM permissions to actually publish messages to the SNS topic. The Lambda code calls `sns.publish()` but would receive Access Denied errors.

### Impact
Validation Lambda would successfully validate transactions but fail when attempting to publish to SNS, breaking the entire processing pipeline. All transactions would fail with 500 errors.

### Fix Applied in IDEAL_RESPONSE
Added inline IAM policy granting SNS publish permissions:

```typescript
const validationSnsPolicy = new aws.iam.RolePolicy(
  `validation-sns-policy-${environmentSuffix}`,
  {
    role: validationLambdaRole.id,
    policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "sns:Publish",
          "Resource": "${transactionTopic.arn}"
        }
      ]
    }`,
  },
  { parent: validationLambdaRole }
);
```

---

## Issue 5: Missing Dead Letter Config on Processing Lambda

**Category:** Reliability / Configuration
**Severity:** High
**Requirement:** "Implement a dead letter queue pattern using SQS"

### Problem
MODEL_RESPONSE created the processing Lambda but did not configure `deadLetterConfig`. Even though Issue 2 shows the DLQ was completely missing, this issue is about the Lambda configuration. Without this config, failed Lambda invocations would not be sent to the DLQ.

### Impact
Failed processing attempts would be lost after Lambda's built-in retry mechanism (2 attempts for async invocations), with no way to reprocess or investigate failures.

### Fix Applied in IDEAL_RESPONSE
Added deadLetterConfig to processing Lambda:

```typescript
deadLetterConfig: {
  targetArn: deadLetterQueue.arn,
},
```

---

## Issue 6: Missing DynamoDB Write Permissions

**Category:** IAM / Permissions
**Severity:** Critical
**Requirement:** Processing Lambda must store data in DynamoDB

### Problem
MODEL_RESPONSE configured the processing Lambda with `DYNAMODB_TABLE_NAME` environment variable but never granted IAM permissions to write to the DynamoDB table. The Lambda code calls `dynamodb.put()` but would receive Access Denied errors.

### Impact
Processing Lambda would successfully receive messages from SNS and enrich transaction data, but fail when attempting to store in DynamoDB. All messages would fail and be sent to DLQ (if configured), causing complete pipeline failure.

### Fix Applied in IDEAL_RESPONSE
Added inline IAM policy with DynamoDB write permissions:

```typescript
const processingDynamoPolicy = new aws.iam.RolePolicy(
  `processing-dynamodb-policy-${environmentSuffix}`,
  {
    role: processingLambdaRole.id,
    policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:PutItem",
            "dynamodb:UpdateItem"
          ],
          "Resource": "${transactionsTable.arn}"
        }
      ]
    }`,
  },
  { parent: processingLambdaRole }
);
```

Also added SQS SendMessage permission for DLQ:

```typescript
const processingSqsPolicy = new aws.iam.RolePolicy(
  `processing-sqs-policy-${environmentSuffix}`,
  {
    role: processingLambdaRole.id,
    policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "sqs:SendMessage",
          "Resource": "${deadLetterQueue.arn}"
        }
      ]
    }`,
  },
  { parent: processingLambdaRole }
);
```

---

## Issue 7: Missing API Gateway Throttling Configuration

**Category:** Configuration / Performance
**Severity:** Medium
**Requirement:** "API Gateway must implement request throttling at 10,000 requests per second"

### Problem
MODEL_RESPONSE created the API Gateway stage but did not configure method settings with throttling limits. Without explicit throttling, API Gateway uses default account-level limits, not the required 10,000 req/sec.

### Impact
- Requirement violation: throttling not set to specified 10,000 req/sec
- Potential for uncontrolled traffic to overwhelm downstream Lambda functions
- No rate limiting protection for the API

### Fix Applied in IDEAL_RESPONSE
Added MethodSettings resource with throttling configuration:

```typescript
const methodSettings = new aws.apigateway.MethodSettings(
  `webhook-throttling-${environmentSuffix}`,
  {
    restApi: api.id,
    stageName: stage.stageName,
    methodPath: '*/*',
    settings: {
      throttlingRateLimit: 10000,
      throttlingBurstLimit: 5000,
    },
  },
  { parent: stage }
);
```

---

## Issue 8: Missing CloudWatch Alarms for Lambda Errors

**Category:** Monitoring / Alerting
**Severity:** High
**Requirement:** "Set up CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes"

### Problem
MODEL_RESPONSE completely omitted CloudWatch alarms. The requirement explicitly stated: "CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes."

### Impact
- No alerting when Lambda functions experience errors
- Failures would go unnoticed until manually checked
- Cannot meet SLA requirements without proactive monitoring
- Requirement explicitly violated

### Fix Applied in IDEAL_RESPONSE
Added CloudWatch MetricAlarms for both Lambda functions:

```typescript
const validationErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `validation-error-alarm-${environmentSuffix}`,
  {
    name: `validation-lambda-errors-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300, // 5 minutes
    statistic: 'Sum',
    threshold: 1,
    treatMissingData: 'notBreaching',
    dimensions: {
      FunctionName: validationLambda.name,
    },
    alarmDescription: 'Triggers when validation Lambda error rate exceeds 1%',
    tags: defaultTags,
  },
  { parent: this }
);
```

Similar alarm created for processing Lambda.

---

## Issue 9: Hardcoded Region in API URL

**Category:** Portability / Configuration
**Severity:** Medium
**Requirement:** Should work in any AWS region

### Problem
MODEL_RESPONSE hardcoded 'us-east-1' in the API URL construction:

```typescript
this.apiUrl = pulumi.interpolate`${api.id}.execute-api.us-east-1.amazonaws.com/...`;
```

While the target region is us-east-1, hardcoding violates infrastructure-as-code best practices and makes the stack non-portable.

### Impact
- If deployed to a different region, API URL would be incorrect
- Stack would fail to work properly in non-us-east-1 regions
- Reduces reusability and portability of the code

### Fix Applied in IDEAL_RESPONSE
Used dynamic region lookup:

```typescript
this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/webhook`;
```

---

## Issue 10: Incomplete Output Registration

**Category:** Stack Outputs / Usability
**Severity:** Low
**Requirement:** "Export the API Gateway invoke URL and DynamoDB table name as stack outputs"

### Problem
MODEL_RESPONSE only registered `apiUrl` and `tableName` outputs. While this satisfies the minimum requirement, it misses important resource identifiers needed for testing, debugging, and integration:

- SNS topic ARN
- DLQ URL
- Lambda function ARNs
- API Gateway ID

### Impact
- Difficult to write integration tests without resource ARNs
- Manual lookup required for debugging
- Reduced automation capabilities
- Poor developer experience

### Fix Applied in IDEAL_RESPONSE
Added complete outputs registration:

```typescript
this.registerOutputs({
  apiUrl: this.apiUrl,
  tableName: this.tableName,
  apiGatewayId: api.id,
  snsTopicArn: transactionTopic.arn,
  dlqUrl: deadLetterQueue.url,
  validationLambdaArn: validationLambda.arn,
  processingLambdaArn: processingLambda.arn,
});
```

---

## Summary Statistics

- **Total Issues:** 10
- **Critical Severity:** 3 (Issues 2, 4, 6)
- **High Severity:** 4 (Issues 1, 3, 5, 8)
- **Medium Severity:** 2 (Issues 7, 9)
- **Low Severity:** 1 (Issue 10)

### Categories
- **IAM/Permissions:** 4 issues (1, 4, 6, partial 5)
- **Resource Creation:** 2 issues (2, 3)
- **Configuration:** 2 issues (5, 7)
- **Monitoring:** 2 issues (3, 8)
- **Best Practices:** 2 issues (9, 10)

### Key Learnings

1. **IAM Permissions Are Critical:** 40% of issues were IAM-related. Always verify Lambda functions have permissions for every AWS service they interact with.

2. **Explicit Resource Creation:** Don't rely on AWS defaults. Create CloudWatch Log Groups explicitly to control retention.

3. **Requirements Must Be Complete:** Every requirement from PROMPT.md must be implemented. MODEL_RESPONSE missed several explicit requirements (DLQ, alarms, throttling).

4. **Error Handling Is Non-Negotiable:** DLQ configuration and CloudWatch alarms are essential for production reliability.

5. **Test Your Assumptions:** Just because a Lambda has an environment variable doesn't mean it has permission to use that resource.

These issues represent common pitfalls when generating infrastructure code and serve as training examples for improving LLM-generated infrastructure code quality.
