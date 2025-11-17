# Model Failures and Corrections

This document catalogs all bugs, security issues, and improvements made between the MODEL_RESPONSE and IDEAL_RESPONSE implementations for the zero-trust security architecture.

## Summary

- Total Issues Fixed: 40
- Critical Security Issues: 15
- Configuration Issues: 10
- Testing Issues: 9
- Documentation Issues: 6

## Critical Security Issues

### BUG 1: Not Using environmentSuffix Context Parameter
**Severity**: High
**Category**: Configuration
**File**: lib/tap-stack.ts

**Problem**:
```typescript
const suffix = 'dev';
```

**Impact**:
- Hardcoded environment prevents multiple environment deployments
- Resource name collisions across environments
- Cannot isolate dev/staging/prod infrastructure

**Fix**:
```typescript
const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';
```

**Lesson**: Always use CDK context parameters for environment-specific values to enable multi-environment deployments.

---

### BUG 2: Missing Resource Tagging
**Severity**: Medium
**Category**: Compliance
**File**: lib/tap-stack.ts

**Problem**:
Resources created without mandatory tags (Department, Environment, DataClassification).

**Impact**:
- Compliance violations
- Poor cost tracking
- Difficult resource management
- Audit failures

**Fix**:
Added comprehensive tagging to all resources:
```typescript
cdk.Tags.of(bucket).add('Department', dept);
cdk.Tags.of(bucket).add('Environment', environmentSuffix);
cdk.Tags.of(bucket).add('DataClassification', dataClassifications[index]);
```

**Lesson**: Resource tagging is critical for compliance, cost management, and operational visibility. Always tag resources at creation.

---

### BUG 3: Missing KMS Key Policy and Alias
**Severity**: Medium
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
KMS key created without proper CloudWatch Logs service policy or alias for easy identification.

**Impact**:
- CloudWatch Logs cannot use the key
- Encryption failures
- Difficult key management

**Fix**:
Added service principal policy and alias:
```typescript
logsKey.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowCloudWatchLogs',
  principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
  actions: ['kms:Encrypt', 'kms:Decrypt', ...],
  conditions: {
    ArnLike: {
      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${account}:*`
    }
  }
}));
```

**Lesson**: KMS keys require explicit service principal permissions. Always add resource policies for AWS services.

---

### BUG 4: Missing environmentSuffix in Bucket Names
**Severity**: High
**Category**: Configuration
**File**: lib/tap-stack.ts

**Problem**:
```typescript
bucketName: `${dept}-data-bucket`
```

**Impact**:
- Bucket name collisions across environments
- Deployment failures in multiple environments
- Cannot deploy to same account with different suffixes

**Fix**:
```typescript
bucketName: `${dept}-data-${environmentSuffix}-${account}`
```

**Lesson**: S3 bucket names must be globally unique. Always include environment identifier and account ID.

---

### BUG 5: Using S3_MANAGED Instead of KMS Encryption
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
encryption: s3.BucketEncryption.S3_MANAGED
```

**Impact**:
- Compliance violation (requires customer-managed keys)
- No key rotation control
- Cannot grant cross-account access to encrypted data
- Audit requirements not met

**Fix**:
```typescript
encryption: s3.BucketEncryption.KMS,
encryptionKey: s3Key
```

**Lesson**: Zero-trust architectures require customer-managed KMS keys, not AWS-managed keys. This provides audit trails, rotation control, and cross-account access capabilities.

---

### BUG 6: Missing S3 Bucket Policy for SSL Enforcement
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
No bucket policy to deny non-SSL requests.

**Impact**:
- Data transmitted in cleartext
- Compliance violation (all data must be encrypted in transit)
- Security vulnerability

**Fix**:
```typescript
bucket.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'DenyInsecureTransport',
  effect: iam.Effect.DENY,
  principals: [new iam.AnyPrincipal()],
  actions: ['s3:*'],
  resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
  conditions: {
    Bool: { 'aws:SecureTransport': 'false' }
  }
}));
```

**Lesson**: Always enforce SSL/TLS for data in transit. Use bucket policies with SecureTransport condition.

---

### BUG 7: Missing environmentSuffix in DynamoDB Table Names
**Severity**: High
**Category**: Configuration
**File**: lib/tap-stack.ts

**Problem**:
```typescript
tableName: `${dept}-data-table`
```

**Impact**:
- Table name collisions across environments
- Cannot deploy multiple environments
- Deployment failures

**Fix**:
```typescript
tableName: `${dept}-data-${environmentSuffix}`
```

**Lesson**: All resource names must include environment identifiers for multi-environment support.

---

### BUG 8: Not Using KMS Encryption for DynamoDB
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
encryption: dynamodb.TableEncryption.DEFAULT
```

**Impact**:
- Compliance violation
- No customer-controlled encryption
- Cannot audit key usage
- No key rotation control

**Fix**:
```typescript
encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
encryptionKey: dynamoKey
```

**Lesson**: Zero-trust architectures require customer-managed encryption for all data at rest.

---

### BUG 9: Missing IP Condition and External ID in Role Trust Policy
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
Trust policy missing IP restrictions and MFA requirements.

**Impact**:
- Roles can be assumed from any IP address
- No defense against compromised credentials
- Compliance violation for zero-trust requirements

**Fix**:
```typescript
financeTrustPolicy.addStatements(new iam.PolicyStatement({
  conditions: {
    IpAddress: { 'aws:SourceIp': ['10.0.0.0/8'] },
    Bool: { 'aws:MultiFactorAuthPresent': 'true' }
  }
}));
```

**Lesson**: Zero-trust requires IP restrictions and MFA for all role assumptions accessing sensitive data.

---

### BUG 10: Session Duration Exceeds 1 Hour Requirement
**Severity**: Medium
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
maxSessionDuration: cdk.Duration.hours(2)
```

**Impact**:
- Violates security requirement (max 1 hour)
- Increased risk from stolen credentials
- Compliance violation

**Fix**:
```typescript
maxSessionDuration: cdk.Duration.hours(1)
```

**Lesson**: Follow security requirements strictly. Shorter session durations reduce credential theft risk.

---

### BUG 11: Overly Permissive IAM Policy with Wildcards
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
financeRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:*', 'dynamodb:*'],
  resources: ['*']
}));
```

**Impact**:
- Violates least privilege principle
- Finance can access ALL S3 buckets and DynamoDB tables
- Major security vulnerability
- Compliance violation

**Fix**:
```typescript
financeRole.addToPolicy(new iam.PolicyStatement({
  sid: 'FinanceS3Access',
  actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
  resources: [buckets['finance'].bucketArn, `${buckets['finance'].bucketArn}/*`]
}));
```

**Lesson**: Never use wildcard resources in production. Scope all permissions to specific resources.

---

### BUG 12: IAM Policy Not Properly Scoped to Department Resources
**Severity**: High
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
marketingRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:*'],
  resources: ['arn:aws:s3:::marketing-*']
}));
```

**Impact**:
- Role can access any bucket starting with "marketing-"
- Not scoped to specific bucket created in stack
- Potential access to unintended resources

**Fix**:
```typescript
marketingRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
  resources: [buckets['marketing'].bucketArn, `${buckets['marketing'].bucketArn}/*`]
}));
```

**Lesson**: Use actual resource ARNs from created resources, not pattern matching.

---

### BUG 13: Missing External ID Validation for Cross-Department Roles
**Severity**: Critical
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
Cross-department roles don't require external ID.

**Impact**:
- No protection against confused deputy problem
- Anyone with account credentials can assume role
- Major security vulnerability for cross-account/cross-department access

**Fix**:
```typescript
const financeToMarketingRole = new iam.Role(this, 'FinanceToMarketingRole', {
  assumedBy: new iam.AccountPrincipal(account).withConditions({
    StringEquals: { 'sts:ExternalId': externalId },
    IpAddress: { 'aws:SourceIp': ['10.0.0.0/8'] }
  }),
  externalIds: [externalId]
});
```

**Lesson**: Always use external IDs for cross-department and cross-account role assumptions to prevent confused deputy attacks.

---

### BUG 14: Cross-Department Role Not Read-Only
**Severity**: High
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
financeToMarketingRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject'],
  ...
}));
```

**Impact**:
- Violates requirement for read-only cross-department access
- Finance can modify Marketing data
- Data integrity risk

**Fix**:
```typescript
financeToMarketingRole.addToPolicy(new iam.PolicyStatement({
  sid: 'ReadOnlyMarketingSharedData',
  actions: ['s3:GetObject', 's3:ListBucket'],
  resources: [buckets['marketing'].bucketArn, `${buckets['marketing'].bucketArn}/shared/*`]
}));
```

**Lesson**: Enforce read-only access for data sharing scenarios. Never include write permissions unless explicitly required.

---

### BUG 15: Missing CloudWatch Logs Permissions for Lambda Role
**Severity**: Medium
**Category**: Security/Operations
**File**: lib/tap-stack.ts

**Problem**:
Lambda execution role missing CloudWatch Logs permissions.

**Impact**:
- Cannot write logs
- No debugging capability
- Operational blind spot

**Fix**:
```typescript
const financeLambdaRole = new iam.Role(this, 'FinanceLambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
  ]
});
```

**Lesson**: Lambda roles always need CloudWatch Logs permissions. Use AWSLambdaBasicExecutionRole managed policy.

---

### BUG 16: Lambda Role Not Scoped to Specific Bucket
**Severity**: High
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
financeLambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: ['*']
}));
```

**Impact**:
- Lambda can access ALL S3 buckets
- Violates least privilege
- Security vulnerability

**Fix**:
```typescript
financeLambdaRole.addToPolicy(new iam.PolicyStatement({
  sid: 'FinanceLambdaS3Access',
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: [`${buckets['finance'].bucketArn}/*`]
}));
```

**Lesson**: Lambda functions should only access specific resources they need, not wildcards.

---

## Compliance and Configuration Issues

### BUG 17: Missing KMS Encryption for CloudWatch Log Groups
**Severity**: High
**Category**: Security/Compliance
**File**: lib/tap-stack.ts

**Problem**:
```typescript
const financeLogGroup = new logs.LogGroup(this, 'FinanceLogGroup', {
  logGroupName: '/aws/lambda/finance',
  retention: logs.RetentionDays.ONE_WEEK
});
```

**Impact**:
- Logs not encrypted at rest
- Compliance violation
- Sensitive data in logs unprotected

**Fix**:
```typescript
const financeLogGroup = new logs.LogGroup(this, 'FinanceLogGroup', {
  logGroupName: `/aws/lambda/finance-${environmentSuffix}`,
  retention: logs.RetentionDays.THREE_MONTHS,
  encryptionKey: logsKey,
  removalPolicy: cdk.RemovalPolicy.DESTROY
});
```

**Lesson**: CloudWatch Logs containing sensitive data must be encrypted with customer-managed KMS keys.

---

### BUG 18: Retention Too Short for Compliance
**Severity**: Medium
**Category**: Compliance
**File**: lib/tap-stack.ts

**Problem**:
```typescript
retention: logs.RetentionDays.ONE_WEEK
```

**Impact**:
- Violates 90-day minimum retention requirement
- Compliance violation
- Insufficient audit trail

**Fix**:
```typescript
retention: logs.RetentionDays.THREE_MONTHS // 90 days
```

**Lesson**: Always check compliance requirements for log retention. Financial services typically require 90+ days.

---

### BUG 19: Missing SNS Topic Encryption
**Severity**: High
**Category**: Security
**File**: lib/tap-stack.ts

**Problem**:
```typescript
const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
  displayName: 'Security Alerts'
});
```

**Impact**:
- Security alerts transmitted unencrypted at rest
- Compliance violation
- Sensitive alert data exposed

**Fix**:
```typescript
const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
  topicName: `security-alerts-${environmentSuffix}`,
  displayName: 'Security Alerts',
  masterKey: snsKey
});
```

**Lesson**: SNS topics transmitting sensitive data must be encrypted with customer-managed keys.

---

### BUG 20: Missing Metric Filter for CloudWatch Alarms
**Severity**: Medium
**Category**: Monitoring
**File**: lib/tap-stack.ts

**Problem**:
Alarm created without corresponding metric filter to generate metrics from logs.

**Impact**:
- Alarm never triggers
- No security event detection
- False sense of security

**Fix**:
```typescript
const unauthorizedApiCallsMetricFilter = new logs.MetricFilter(this, 'UnauthorizedApiCallsFilter', {
  logGroup: financeLogGroup,
  metricNamespace: 'SecurityMetrics',
  metricName: 'UnauthorizedApiCalls',
  filterPattern: logs.FilterPattern.literal('{($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*")}'),
  metricValue: '1'
});
```

**Lesson**: CloudWatch Alarms on custom metrics require metric filters to extract metrics from logs.

---

### BUG 21: Alarm Not Connected to SNS Topic
**Severity**: Medium
**Category**: Monitoring
**File**: lib/tap-stack.ts

**Problem**:
Alarm created but no actions configured.

**Impact**:
- No notifications sent when alarm triggers
- Security team not alerted
- Events go unnoticed

**Fix**:
```typescript
unauthorizedApiCallsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(securityAlertsTopic));
```

**Lesson**: Always configure alarm actions to notify appropriate teams.

---

### BUG 22: Missing IAM Password Policy Config Rule
**Severity**: Medium
**Category**: Compliance
**File**: lib/tap-stack.ts

**Problem**:
Only one Config rule created, missing critical compliance rules.

**Impact**:
- Incomplete compliance monitoring
- Password policy violations undetected
- Audit failures

**Fix**:
```typescript
const iamPasswordPolicyRule = new config.ManagedRule(this, 'IamPasswordPolicyRule', {
  configRuleName: `iam-password-policy-${environmentSuffix}`,
  identifier: 'IAM_PASSWORD_POLICY',
  description: 'Checks whether the account password policy meets specified requirements'
});
```

**Lesson**: Comprehensive compliance monitoring requires multiple AWS Config rules covering all security domains.

---

### BUG 23: Missing MFA Enabled Config Rule
**Severity**: Medium
**Category**: Compliance
**File**: lib/tap-stack.ts

**Problem**:
No monitoring for MFA enablement on IAM users.

**Impact**:
- Cannot enforce MFA requirements
- Compliance violation
- Weak authentication

**Fix**:
```typescript
const mfaEnabledRule = new config.ManagedRule(this, 'MfaEnabledRule', {
  configRuleName: `mfa-enabled-for-iam-console-${environmentSuffix}`,
  identifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
  description: 'Checks whether MFA is enabled for IAM users with console access'
});
```

**Lesson**: MFA enforcement is critical for security. Monitor with AWS Config.

---

### BUG 24: Missing CloudTrail Enabled Config Rule
**Severity**: High
**Category**: Compliance/Security
**File**: lib/tap-stack.ts

**Problem**:
No monitoring to ensure CloudTrail is enabled.

**Impact**:
- Cannot detect if audit logging is disabled
- Compliance violation
- No audit trail

**Fix**:
```typescript
const cloudTrailEnabledRule = new config.ManagedRule(this, 'CloudTrailEnabledRule', {
  configRuleName: `cloudtrail-enabled-${environmentSuffix}`,
  identifier: 'CLOUD_TRAIL_ENABLED',
  description: 'Checks whether CloudTrail is enabled in this region'
});
```

**Lesson**: CloudTrail enablement must be continuously monitored for audit compliance.

---

### BUG 25: Missing CloudFormation Outputs
**Severity**: Low
**Category**: Operations
**File**: lib/tap-stack.ts

**Problem**:
No stack outputs for role ARNs and other key values.

**Impact**:
- Difficult to use roles in other stacks
- Manual ARN lookup required
- Poor operational experience

**Fix**:
```typescript
new cdk.CfnOutput(this, 'FinanceRoleArn', {
  value: financeRole.roleArn,
  description: 'Finance department role ARN',
  exportName: `finance-role-arn-${environmentSuffix}`
});
```

**Lesson**: Always export critical resource identifiers as stack outputs for cross-stack references.

---

## Application Entry Point Issues

### BUG 26: Not Reading environmentSuffix from Context in bin/tap.ts
**Severity**: High
**Category**: Configuration
**File**: bin/tap.ts

**Problem**:
```typescript
new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});
```

**Impact**:
- Cannot pass environmentSuffix to stack
- Hardcoded stack name causes collisions
- Multi-environment deployment broken

**Fix**:
```typescript
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stack = new TapStack(app, `TapStack-${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: `Zero-trust security architecture for multi-department data platform (${environmentSuffix})`
});
```

**Lesson**: Application entry point must read context parameters and pass to stacks.

---

### BUG 27: Missing Stack Tags
**Severity**: Low
**Category**: Operations/Compliance
**File**: bin/tap.ts

**Problem**:
Stack created without tags.

**Impact**:
- Poor cost allocation
- Difficult stack management
- Compliance tracking issues

**Fix**:
```typescript
tags: {
  Environment: environmentSuffix,
  Project: 'ZeroTrustSecurityPlatform',
  ManagedBy: 'CDK',
  CostCenter: 'Engineering'
}
```

**Lesson**: Tag stacks for cost allocation, management, and compliance tracking.

---

## Testing Issues

### BUG 28: Missing Test for environmentSuffix Usage
**Severity**: Medium
**Category**: Testing
**File**: test/tap-stack.unit.test.ts

**Problem**:
No test verifying environmentSuffix is used in resource names.

**Impact**:
- Cannot verify multi-environment support
- Regression risk
- Quality issue

**Fix**:
```typescript
test('Creates S3 buckets for each department with environmentSuffix', () => {
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: Match.stringLikeRegexp('finance-data-test-.*')
  });
});
```

**Lesson**: Test all configurable parameters are properly applied.

---

### BUG 29: Missing Test for KMS Encryption
**Severity**: Medium
**Category**: Testing
**File**: test/tap-stack.unit.test.ts

**Problem**:
No test verifying KMS encryption is used.

**Impact**:
- Cannot verify encryption requirements
- Security regression risk

**Fix**:
```typescript
test('S3 buckets use KMS encryption', () => {
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [{
        ServerSideEncryptionByDefault: {
          SSEAlgorithm: 'aws:kms'
        }
      }]
    }
  });
});
```

**Lesson**: Security requirements must be tested to prevent regressions.

---

### BUG 30: Missing Tests for IAM Role Conditions
**Severity**: High
**Category**: Testing
**File**: test/tap-stack.unit.test.ts

**Problem**:
No tests for external ID, IP restrictions, MFA requirements.

**Impact**:
- Critical security controls untested
- High regression risk
- Cannot verify zero-trust requirements

**Fix**:
```typescript
test('Cross-department roles have external ID validation', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: 'finance-to-marketing-test',
    AssumeRolePolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Condition: Match.objectLike({
            StringEquals: Match.objectLike({
              'sts:ExternalId': 'zero-trust-test-external-id'
            }),
            IpAddress: Match.objectLike({
              'aws:SourceIp': ['10.0.0.0/8']
            })
          })
        })
      ])
    })
  });
});
```

**Lesson**: Critical security controls (external ID, IP restrictions, MFA) must have dedicated tests.

---

### BUG 31-34: Missing Tests for Core Components
**Severity**: Medium
**Category**: Testing
**File**: test/tap-stack.unit.test.ts

**Problem**:
Missing tests for:
- CloudWatch alarms (BUG 31)
- AWS Config rules (BUG 32)
- SNS topics (BUG 33)
- Resource tagging (BUG 34)

**Impact**:
- Incomplete test coverage
- Regression risk
- Cannot verify all requirements

**Fix**:
Added comprehensive test suites for all components:
```typescript
describe('CloudWatch Monitoring', () => {
  test('Creates CloudWatch alarms for security monitoring', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'unauthorized-api-calls-test'
    });
  });
});

describe('AWS Config Rules', () => {
  test('Creates AWS Config rules for compliance', () => {
    template.resourceCountIs('AWS::Config::ConfigRule', 5);
  });
});

describe('SNS Topics', () => {
  test('Creates SNS topics for alerting', () => {
    template.resourceCountIs('AWS::SNS::Topic', 2);
  });
});

describe('Resource Tagging', () => {
  test('Stack has required tags', () => {
    const stackTags = cdk.Tags.of(stack).tagValues();
    expect(stackTags).toHaveProperty('Environment');
  });
});
```

**Lesson**: Comprehensive testing requires coverage of all components, not just infrastructure resources.

---

## Documentation Issues

### BUG 35-40: Incomplete Documentation
**Severity**: Low
**Category**: Documentation
**File**: lib/README.md

**Problems**:
- Missing architecture diagram (BUG 35)
- Missing external ID usage section (BUG 36)
- Missing IP restrictions documentation (BUG 37)
- Missing MFA requirements explanation (BUG 38)
- Missing troubleshooting section (BUG 39)
- Missing cleanup instructions (BUG 40)

**Impact**:
- Difficult for users to understand and use
- Poor operational support
- Increased support burden

**Fix**:
Added comprehensive documentation sections:
- Architecture overview with detailed component descriptions
- Configuration section explaining external ID usage
- IP restrictions configuration guidance
- Role assumption examples with MFA
- Comprehensive troubleshooting guide
- Cleanup instructions with caveats

**Lesson**: Production infrastructure requires comprehensive documentation covering architecture, configuration, usage, troubleshooting, and cleanup.

---

## Summary of Lessons Learned

### Security Best Practices
1. Always use customer-managed KMS keys for data at rest encryption
2. Enforce SSL/TLS for all data in transit using bucket policies
3. Implement least privilege with specific resource ARNs, never wildcards
4. Use external IDs for cross-account/cross-department role assumptions
5. Require MFA for sensitive data access
6. Implement IP restrictions for role assumptions
7. Limit session durations to minimum required (1 hour for zero-trust)

### Configuration Management
8. Use CDK context parameters for environment-specific values
9. Include environment suffix in all resource names
10. Use actual account IDs in S3 bucket names for global uniqueness
11. Tag all resources for compliance, cost tracking, and management

### Monitoring and Compliance
12. Create metric filters before CloudWatch Alarms
13. Connect alarms to SNS topics for notifications
14. Implement comprehensive AWS Config rules
15. Set appropriate log retention for compliance (90+ days)
16. Encrypt all logs with customer-managed KMS keys

### Operations and Testing
17. Export critical resource identifiers as CloudFormation outputs
18. Add managed policies (AWSLambdaBasicExecutionRole) for Lambda roles
19. Test all security controls (encryption, IAM conditions, etc.)
20. Document architecture, configuration, usage, and troubleshooting

### Zero-Trust Architecture Principles
21. Verify explicitly: IP restrictions, external IDs, MFA
22. Use least privilege access: Specific resources, limited actions
23. Assume breach: Short sessions, encryption everywhere, monitoring
24. Segment access: Department isolation, read-only cross-department access