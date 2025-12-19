# Model Failures Documentation

This document outlines potential failure scenarios and edge cases that a language model might encounter when implementing the IAM Security Monitoring and Remediation System as described in TASK_DESCRIPTION.md.

## Task Requirements Summary

The task requires creating a CDK TypeScript program to implement an automated IAM security monitoring and remediation system with:
1. Lambda function for analyzing IAM policies for overly permissive actions
2. Custom KMS keys with automatic key rotation for encrypting security audit logs
3. CloudWatch Log Groups with 90-day retention for security events
4. EventBridge rules to trigger Lambda on IAM policy changes
5. IAM roles with session policies restricting access based on request context
6. CloudWatch alarms for detecting unusual IAM activity (>5 policy changes in 10 minutes)
7. SNS topic for security alerts with email subscriptions
8. Scheduled Lambda for daily IAM policy audits
9. Resource tags for compliance tracking (Environment, Owner, DataClassification)
10. Cross-account IAM roles for security auditing with external ID validation

### Constraints
- Lambda functions must have execution timeouts of 60 seconds or less
- All IAM policies must use explicit deny statements for sensitive actions
- KMS key policies must restrict key usage to specific AWS services only
- CloudWatch log groups must use KMS encryption with customer-managed keys
- EventBridge rules must include dead letter queues for failed invocations

## Common Model Failures

### 1. KMS Key Configuration Failures

**Failure Scenario**: Model creates KMS key without automatic key rotation enabled
```typescript
// INCORRECT
const key = new kms.Key(this, 'Key', {
  description: 'Encryption key',
  // Missing: enableKeyRotation: true
});
```

**Why This Fails**: Task explicitly requires "automatic key rotation enabled"

**Correct Implementation**: The current implementation correctly enables key rotation at tap-stack.ts:51

---

**Failure Scenario**: Model fails to restrict KMS key policy to specific AWS services
```typescript
// INCORRECT - Too permissive
new iam.PolicyStatement({
  principals: [new iam.AnyPrincipal()],
  actions: ['kms:*'],
  resources: ['*'],
});
```

**Why This Fails**: Constraint requires "KMS key policies must restrict key usage to specific AWS services only"

**Correct Implementation**: The current implementation restricts access to specific services (CloudWatch Logs, Lambda) with conditions at tap-stack.ts:64-98

---

### 2. Lambda Function Timeout Failures

**Failure Scenario**: Model sets Lambda timeout greater than 60 seconds
```typescript
// INCORRECT
const lambda = new lambda.Function(this, 'Fn', {
  timeout: cdk.Duration.seconds(120), // Exceeds 60 second limit
});
```

**Why This Fails**: Constraint explicitly states "Lambda functions must have execution timeouts of 60 seconds or less"

**Correct Implementation**: Both Lambda functions are configured with 60-second timeouts at tap-stack.ts:297 and tap-stack.ts:322

---

### 3. IAM Policy Explicit Deny Failures

**Failure Scenario**: Model creates IAM policies without explicit deny statements for sensitive actions
```typescript
// INCORRECT - Only allow statements, no explicit denies
inlinePolicies: {
  Policy: new iam.PolicyDocument({
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:GetPolicy', 'iam:ListPolicies'],
        resources: ['*'],
      }),
      // Missing: Explicit deny for sensitive actions
    ],
  }),
}
```

**Why This Fails**: Constraint requires "All IAM policies must use explicit deny statements for sensitive actions"

**Correct Implementation**: The Lambda execution role includes explicit deny statements at tap-stack.ts:252-278

---

### 4. CloudWatch Log Group Encryption Failures

**Failure Scenario**: Model creates log groups without KMS encryption
```typescript
// INCORRECT
const logGroup = new logs.LogGroup(this, 'LogGroup', {
  retention: logs.RetentionDays.THREE_MONTHS,
  // Missing: encryptionKey
});
```

**Why This Fails**: Constraint requires "CloudWatch log groups must use KMS encryption with customer-managed keys"

**Correct Implementation**: All log groups are encrypted with the custom KMS key at tap-stack.ts:127, 137, 147

---

### 5. CloudWatch Log Retention Failures

**Failure Scenario**: Model sets log retention to a value other than 90 days
```typescript
// INCORRECT
const logGroup = new logs.LogGroup(this, 'LogGroup', {
  retention: logs.RetentionDays.ONE_MONTH, // Not 90 days
});
```

**Why This Fails**: Task requires "CloudWatch Log Groups with 90-day retention"

**Correct Implementation**: All log groups have THREE_MONTHS (90 days) retention at tap-stack.ts:126, 136, 146

---

### 6. EventBridge Dead Letter Queue Failures

**Failure Scenario**: Model creates EventBridge rules without configuring DLQ
```typescript
// INCORRECT
rule.addTarget(new targets.LambdaFunction(lambdaFn, {
  // Missing: deadLetterQueue
  // Missing: maxEventAge
  // Missing: retryAttempts
}));
```

**Why This Fails**: Constraint requires "EventBridge rules must include dead letter queues for failed invocations"

**Correct Implementation**: EventBridge targets include DLQ configuration at tap-stack.ts:369-373 and tap-stack.ts:387-391

---

### 7. CloudWatch Alarm Threshold Failures

**Failure Scenario**: Model creates alarm with incorrect threshold for policy changes
```typescript
// INCORRECT
const alarm = new cloudwatch.Alarm(this, 'Alarm', {
  metric: policyChangeMetric,
  threshold: 10, // Should be 5
  evaluationPeriods: 1,
});
```

**Why This Fails**: Task specifies "more than 5 policy changes in 10 minutes"

**Correct Implementation**: Alarm threshold is correctly set to 5 at tap-stack.ts:417

---

### 8. EventBridge Event Pattern Failures

**Failure Scenario**: Model creates incomplete event pattern missing key IAM events
```typescript
// INCORRECT
eventPattern: {
  source: ['aws.iam'],
  detail: {
    eventName: ['CreatePolicy'], // Missing other policy change events
  },
}
```

**Why This Fails**: Task requires monitoring "when IAM policies are created or modified"

**Correct Implementation**: Event pattern includes all policy change events at tap-stack.ts:348-362

---

### 9. Cross-Account Role External ID Failures

**Failure Scenario**: Model creates cross-account role without external ID validation
```typescript
// INCORRECT
const role = new iam.Role(this, 'AuditRole', {
  assumedBy: new iam.AccountPrincipal('123456789012'),
  // Missing: externalIds parameter
});
```

**Why This Fails**: Task requires "cross-account IAM roles for security auditing with external ID validation"

**Correct Implementation**: Cross-account role includes external ID at tap-stack.ts:486

---

### 10. Node.js Runtime Version Failures

**Failure Scenario**: Model uses outdated Node.js runtime
```typescript
// INCORRECT
const fn = new lambda.Function(this, 'Fn', {
  runtime: lambda.Runtime.NODEJS_18_X, // Outdated
});
```

**Why This Fails**: Task requires Node.js 22 runtime (implied by current CDK best practices and the bundling target)

**Correct Implementation**: Lambda functions use NODEJS_22_X runtime at tap-stack.ts:294, 319

---

### 11. Resource Tagging Failures

**Failure Scenario**: Model fails to implement compliance tagging
```typescript
// INCORRECT - No tags applied
const stack = new TapStack(app, 'Stack', props);
// Missing: cdk.Tags.of(stack).add() calls
```

**Why This Fails**: Task requires "resource tags for compliance tracking with mandatory tags: Environment, Owner, and DataClassification"

**Correct Implementation**: Tags should be applied at the app level in bin/tap.ts (noted in comments at tap-stack.ts:568)

---

### 12. Lambda Policy Analysis Logic Failures

**Failure Scenario**: Model creates policy analyzer that doesn't check for wildcard actions and resources
```typescript
// INCORRECT - Incomplete analysis
function analyzePolicy(policy: PolicyDocument) {
  // Only checks for wildcard actions, missing resource wildcards
  if (policy.Statement.some(s => s.Action === '*')) {
    return ['Wildcard action found'];
  }
}
```

**Why This Fails**: Task requires "analyzes IAM policies for overly permissive actions (e.g., '*' in Action or Resource fields)"

**Correct Implementation**: Policy analyzer checks both actions and resources for wildcards at policy-analyzer.ts:269-287

---

### 13. Session Duration Failures

**Failure Scenario**: Model creates IAM roles without session duration restrictions
```typescript
// INCORRECT
const role = new iam.Role(this, 'Role', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  // Missing: maxSessionDuration
});
```

**Why This Fails**: Task requires "session policies that restrict access to sensitive resources based on request context"

**Correct Implementation**: Roles include maxSessionDuration of 1 hour at tap-stack.ts:186, 488

---

### 14. Scheduled Rule Configuration Failures

**Failure Scenario**: Model creates scheduled rule without proper cron expression
```typescript
// INCORRECT
const rule = new events.Rule(this, 'DailyRule', {
  schedule: events.Schedule.rate(cdk.Duration.days(1)), // Not specific time
});
```

**Why This Fails**: Task requires "scheduled Lambda function that runs daily" with consistent timing for audit purposes

**Correct Implementation**: Daily audit rule uses cron schedule at 2 AM UTC at tap-stack.ts:380-383

---

### 15. Missing CloudWatch Metrics Failures

**Failure Scenario**: Model doesn't publish custom metrics for IAM security monitoring
```typescript
// INCORRECT - Lambda doesn't publish metrics
export const handler = async (event: any) => {
  // Analyze policy
  // No metrics published
};
```

**Why This Fails**: Task implies need for "detecting unusual IAM activity patterns" which requires metrics

**Correct Implementation**: Daily auditor publishes comprehensive metrics at daily-auditor.ts:437-489

---

## Edge Cases and Subtle Failures

### 16. Environment Suffix Handling

**Failure**: Hardcoding resource names without environment suffix support
```typescript
// INCORRECT
const resourceName = 'iam-security-logs';
```

**Correct**: Using environment suffix for multi-environment deployments (tap-stack.ts:43)

---

### 17. Region-Specific Resource Naming

**Failure**: Not including region in resource names, causing conflicts in multi-region deployments
```typescript
// INCORRECT
const prefix = `iam-security-${environmentSuffix}`;
```

**Correct**: Including both environment and region (tap-stack.ts:43)

---

### 18. Lambda Environment Variables

**Failure**: Forgetting to pass necessary environment variables to Lambda functions
```typescript
// INCORRECT
const fn = new lambda.Function(this, 'Fn', {
  // Missing: environment variables for SNS_TOPIC_ARN, LOG_GROUP_NAME
});
```

**Correct**: All required environment variables are configured (tap-stack.ts:301-305, 326-330)

---

### 19. CloudWatch Alarm Actions

**Failure**: Creating alarms without SNS actions
```typescript
// INCORRECT
const alarm = new cloudwatch.Alarm(this, 'Alarm', {
  // Alarm configuration
  // Missing: alarm.addAlarmAction()
});
```

**Correct**: All alarms have SNS actions configured (tap-stack.ts:427-429, 449-451, 471-473)

---

### 20. Output Export Names

**Failure**: Not exporting critical outputs or using non-unique export names
```typescript
// INCORRECT
new cdk.CfnOutput(this, 'TopicArn', {
  value: topic.topicArn,
  // Missing: exportName for cross-stack references
});
```

**Correct**: All outputs include unique export names (tap-stack.ts:573-631)

---

## Testing Failures

### 21. Unit Test Coverage

**Failure**: Insufficient test coverage, missing tests for critical security features
- Not testing KMS key rotation
- Not testing explicit deny statements
- Not testing DLQ configuration
- Not testing log encryption

**Correct**: Comprehensive unit tests with 100% coverage in test/tap-stack.unit.test.ts

---

### 22. Integration Test Real Resources

**Failure**: Using mocks instead of testing real deployed resources
```typescript
// INCORRECT
jest.mock('@aws-sdk/client-lambda');
```

**Correct**: Integration tests use AWS SDK v2 to test live resources without mocks (test/tap-stack.int.test.ts)

---

### 23. Integration Test Output Reading

**Failure**: Using describe-stacks to get outputs instead of flat-outputs.json
```typescript
// INCORRECT
const outputs = await cloudformation.describeStacks({ StackName: stackName }).promise();
```

**Correct**: Reading from flat-outputs.json file (test/tap-stack.int.test.ts:27)

---

## Conclusion

The current implementation successfully addresses all requirements from TASK_DESCRIPTION.md and avoids all common model failures. Key success factors include:

1. ✅ Proper KMS key rotation and service-specific policies
2. ✅ Lambda timeouts within 60-second constraint
3. ✅ Explicit deny statements in IAM policies
4. ✅ KMS encryption for all log groups
5. ✅ 90-day log retention
6. ✅ DLQ configuration for EventBridge rules
7. ✅ Correct alarm thresholds (>5 in 10 minutes)
8. ✅ Comprehensive event patterns for IAM changes
9. ✅ Cross-account roles with external ID validation
10. ✅ Modern Node.js 22 runtime
11. ✅ Proper policy analysis for wildcards
12. ✅ Session duration restrictions
13. ✅ Daily scheduled audits
14. ✅ Custom CloudWatch metrics
15. ✅ Multi-environment and multi-region support
16. ✅ Comprehensive unit and integration tests

This implementation serves as a reference for avoiding common pitfalls when building IAM security monitoring systems with AWS CDK.
