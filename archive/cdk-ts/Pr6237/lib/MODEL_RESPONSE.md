# Zero-Trust Security Architecture - Implementation

This implementation provides a comprehensive zero-trust security architecture for a multi-department data platform.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // BUG 1: Not using environmentSuffix context parameter
    const suffix = 'dev';

    // BUG 2: Missing tagging on resources
    const departments = ['finance', 'marketing', 'analytics'];

    // KMS Key for CloudWatch Logs
    // BUG 3: Missing key policy and alias
    const logsKey = new kms.Key(this, 'LogsKmsKey', {
      enableKeyRotation: true,
    });

    // Create S3 buckets for each department
    departments.forEach(dept => {
      const bucket = new s3.Bucket(this, `${dept}Bucket`, {
        // BUG 4: Missing environmentSuffix in bucket name
        bucketName: `${dept}-data-bucket`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        // BUG 5: Using S3_MANAGED instead of KMS encryption
        versioned: true,
        // BUG 6: Missing bucket policy for SSL enforcement
      });
    });

    // Create DynamoDB tables for each department
    departments.forEach(dept => {
      const table = new dynamodb.Table(this, `${dept}Table`, {
        // BUG 7: Missing environmentSuffix in table name
        tableName: `${dept}-data-table`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        // BUG 8: Not using KMS encryption
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    });

    // Create department-specific IAM roles
    // BUG 9: Missing IP condition and external ID
    const financeRole = new iam.Role(this, 'FinanceRole', {
      assumedBy: new iam.AccountRootPrincipal(),
      // BUG 10: Session duration exceeds 1 hour requirement
      maxSessionDuration: cdk.Duration.hours(2),
    });

    // BUG 11: Overly permissive policy - uses wildcard
    financeRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:*', 'dynamodb:*'],
      resources: ['*'],
    }));

    const marketingRole = new iam.Role(this, 'MarketingRole', {
      assumedBy: new iam.AccountRootPrincipal(),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // BUG 12: Not properly scoped to marketing resources
    marketingRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:*'],
      resources: ['arn:aws:s3:::marketing-*'],
    }));

    const analyticsRole = new iam.Role(this, 'AnalyticsRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // Cross-department sharing roles
    // BUG 13: Missing external ID validation
    const financeToMarketingRole = new iam.Role(this, 'FinanceToMarketingRole', {
      assumedBy: new iam.AccountRootPrincipal(),
      description: 'Read-only access from Finance to Marketing data',
    });

    // BUG 14: Not read-only - includes write actions
    financeToMarketingRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: ['arn:aws:s3:::marketing-data-bucket/shared/*'],
    }));

    // Lambda execution roles
    // BUG 15: Missing CloudWatch Logs permissions
    const financeLambdaRole = new iam.Role(this, 'FinanceLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    financeLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      // BUG 16: Not scoped to specific bucket
      resources: ['*'],
    }));

    // CloudWatch Log Groups
    // BUG 17: Missing encryption with KMS key
    const financeLogGroup = new logs.LogGroup(this, 'FinanceLogGroup', {
      logGroupName: '/aws/lambda/finance',
      // BUG 18: Retention too short for compliance (90 days required)
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const marketingLogGroup = new logs.LogGroup(this, 'MarketingLogGroup', {
      logGroupName: '/aws/lambda/marketing',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // SNS Topics for alerts
    // BUG 19: Missing encryption
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'Security Alerts',
    });

    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      displayName: 'Compliance Violations',
    });

    // CloudWatch Alarms
    // BUG 20: Missing metric filter for unauthorized API calls
    const iamPolicyChangeAlarm = new cloudwatch.Alarm(this, 'IamPolicyChangeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudWatch',
        metricName: 'IamPolicyChanges',
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // BUG 21: Alarm not connected to SNS topic

    // AWS Config Rules
    // BUG 22: Missing IAM password policy rule
    const s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      identifier: 's3-bucket-server-side-encryption-enabled',
    });

    // BUG 23: Missing MFA enabled rule
    // BUG 24: Missing CloudTrail enabled rule

    // BUG 25: Missing outputs for role ARNs
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// BUG 26: Not reading environmentSuffix from context
new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  // BUG 27: Missing stack tags
});

app.synth();
```

## File: test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  // BUG 28: Missing test for environmentSuffix usage
  test('Creates S3 buckets for each department', () => {
    template.resourceCountIs('AWS::S3::Bucket', 3);
  });

  // BUG 29: Missing test for KMS encryption on buckets
  test('Creates DynamoDB tables for each department', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 3);
  });

  // BUG 30: Missing tests for IAM role conditions (external ID, IP restrictions)
  test('Creates IAM roles', () => {
    template.resourceCountIs('AWS::IAM::Role', 5);
  });

  // BUG 31: Missing tests for CloudWatch alarms
  // BUG 32: Missing tests for AWS Config rules
  // BUG 33: Missing tests for SNS topics
  // BUG 34: Missing tests for resource tagging
});
```

## File: lib/README.md

```markdown
# Zero-Trust Security Architecture

## Overview

This CDK stack implements a zero-trust security architecture for a multi-department data platform.

## Deployment

```bash
npm install
npm run build
cdk deploy
```

## Testing

```bash
npm test
```

## Architecture

- IAM roles for Finance, Marketing, and Analytics departments
- S3 buckets for each department
- DynamoDB tables for data storage
- CloudWatch monitoring and alarms
- SNS topics for alerting
- AWS Config rules for compliance

<!-- BUG 35: Missing architecture diagram -->
<!-- BUG 36: Missing section on external ID usage -->
<!-- BUG 37: Missing section on IP restrictions -->
<!-- BUG 38: Missing section on MFA requirements -->
<!-- BUG 39: Missing troubleshooting section -->
<!-- BUG 40: Missing cleanup instructions -->
```