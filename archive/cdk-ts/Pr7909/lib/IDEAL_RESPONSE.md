# AWS Config Compliance Monitoring System - IDEAL Implementation

This is the corrected, production-ready implementation that addresses all issues found in the initial MODEL_RESPONSE.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';
    const regions = this.node.tryGetContext('regions') || ['us-east-1'];

    // S3 bucket for Config snapshots
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `config-snapshots-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-snapshots',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          expiration: cdk.Duration.days(365)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    cdk.Tags.of(configBucket).add('CostCenter', 'Security');
    cdk.Tags.of(configBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(configBucket).add('ComplianceLevel', 'High');

    // IAM role for AWS Config - FIXED: Use correct managed policy name
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `config-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')
      ]
    });

    configBucket.grantWrite(configRole);

    // AWS Config Recorder
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `config-recorder-${environmentSuffix}`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true
      }
    });

    // Config Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      name: `config-delivery-${environmentSuffix}`,
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'Six_Hours'
      }
    });

    deliveryChannel.addDependency(configRecorder);

    // SNS Topics for different severity levels
    const criticalTopic = new sns.Topic(this, 'CriticalTopic', {
      topicName: `compliance-critical-${environmentSuffix}`,
      displayName: 'Critical Compliance Violations'
    });

    const highTopic = new sns.Topic(this, 'HighTopic', {
      topicName: `compliance-high-${environmentSuffix}`,
      displayName: 'High Compliance Violations'
    });

    const mediumTopic = new sns.Topic(this, 'MediumTopic', {
      topicName: `compliance-medium-${environmentSuffix}`,
      displayName: 'Medium Compliance Violations'
    });

    const lowTopic = new sns.Topic(this, 'LowTopic', {
      topicName: `compliance-low-${environmentSuffix}`,
      displayName: 'Low Compliance Violations'
    });

    [criticalTopic, highTopic, mediumTopic, lowTopic].forEach(topic => {
      cdk.Tags.of(topic).add('CostCenter', 'Security');
      cdk.Tags.of(topic).add('Environment', environmentSuffix);
      cdk.Tags.of(topic).add('ComplianceLevel', 'High');
    });

    // Lambda function for compliance analysis
    const complianceLambda = new lambda.Function(this, 'ComplianceLambda', {
      functionName: `compliance-analyzer-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      environment: {
        CRITICAL_TOPIC_ARN: criticalTopic.topicArn,
        HIGH_TOPIC_ARN: highTopic.topicArn,
        MEDIUM_TOPIC_ARN: mediumTopic.topicArn,
        LOW_TOPIC_ARN: lowTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix
      },
      timeout: cdk.Duration.minutes(5)
    });

    cdk.Tags.of(complianceLambda).add('CostCenter', 'Security');
    cdk.Tags.of(complianceLambda).add('Environment', environmentSuffix);
    cdk.Tags.of(complianceLambda).add('ComplianceLevel', 'High');

    // Grant Lambda permissions
    criticalTopic.grantPublish(complianceLambda);
    highTopic.grantPublish(complianceLambda);
    mediumTopic.grantPublish(complianceLambda);
    lowTopic.grantPublish(complianceLambda);

    complianceLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'config:DescribeConfigRules',
        'config:GetComplianceDetailsByConfigRule',
        'config:DescribeComplianceByConfigRule'
      ],
      resources: ['*']
    }));

    // Custom Config Rules

    // Rule 1: S3 Bucket Encryption
    const s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      configRuleName: `s3-bucket-encryption-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Check S3 buckets have encryption enabled'
    });

    cdk.Tags.of(s3EncryptionRule).add('CostCenter', 'Security');
    cdk.Tags.of(s3EncryptionRule).add('Environment', environmentSuffix);
    cdk.Tags.of(s3EncryptionRule).add('ComplianceLevel', 'High');

    // Rule 2: EC2 Instance Type Check
    const ec2InstanceRule = new config.ManagedRule(this, 'EC2InstanceTypeRule', {
      configRuleName: `ec2-instance-type-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.DESIRED_INSTANCE_TYPE,
      inputParameters: {
        instanceType: 't3.micro,t3.small,t3.medium'
      },
      description: 'Check EC2 instances are approved types'
    });

    cdk.Tags.of(ec2InstanceRule).add('CostCenter', 'Security');
    cdk.Tags.of(ec2InstanceRule).add('Environment', environmentSuffix);
    cdk.Tags.of(ec2InstanceRule).add('ComplianceLevel', 'Medium');

    // Rule 3: RDS Backup Retention
    const rdsBackupRule = new config.ManagedRule(this, 'RDSBackupRule', {
      configRuleName: `rds-backup-retention-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_AUTOMATIC_BACKUP_ENABLED,
      description: 'Check RDS databases have automatic backups enabled'
    });

    cdk.Tags.of(rdsBackupRule).add('CostCenter', 'Security');
    cdk.Tags.of(rdsBackupRule).add('Environment', environmentSuffix);
    cdk.Tags.of(rdsBackupRule).add('ComplianceLevel', 'High');

    // Lambda trigger from Config rule evaluations - FIXED: Import added at top
    [s3EncryptionRule, ec2InstanceRule, rdsBackupRule].forEach(rule => {
      rule.onComplianceChange('ComplianceChange', {
        target: new events_targets.LambdaFunction(complianceLambda)
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for Config snapshots'
    });

    new cdk.CfnOutput(this, 'ComplianceLambdaArn', {
      value: complianceLambda.functionArn,
      description: 'Compliance analyzer Lambda ARN'
    });

    new cdk.CfnOutput(this, 'CriticalTopicArn', {
      value: criticalTopic.topicArn,
      description: 'Critical violations SNS topic'
    });
  }
}
```

## File: lib/lambda/index.ts

```typescript
import { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } from '@aws-sdk/client-config-service';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const configClient = new ConfigServiceClient({});
const snsClient = new SNSClient({});

interface ComplianceEvent {
  detail: {
    configRuleName: string;
    complianceType: string;
    resourceId: string;
    resourceType: string;
  };
}

export const handler = async (event: ComplianceEvent) => {
  console.log('Received compliance event:', JSON.stringify(event, null, 2));

  try {
    const { configRuleName, complianceType, resourceId, resourceType } = event.detail;

    if (complianceType === 'NON_COMPLIANT') {
      // Determine severity based on rule name
      let topicArn: string;
      let severity: string;

      if (configRuleName.includes('s3-bucket-encryption') || configRuleName.includes('rds-backup')) {
        topicArn = process.env.CRITICAL_TOPIC_ARN!;
        severity = 'CRITICAL';
      } else if (configRuleName.includes('ec2-instance-type')) {
        topicArn = process.env.MEDIUM_TOPIC_ARN!;
        severity = 'MEDIUM';
      } else {
        topicArn = process.env.LOW_TOPIC_ARN!;
        severity = 'LOW';
      }

      // Generate compliance report
      const report = {
        timestamp: new Date().toISOString(),
        severity: severity,
        ruleName: configRuleName,
        resourceId: resourceId,
        resourceType: resourceType,
        complianceStatus: complianceType,
        environmentSuffix: process.env.ENVIRONMENT_SUFFIX
      };

      // Send notification
      const message = `
Compliance Violation Detected

Severity: ${severity}
Rule: ${configRuleName}
Resource: ${resourceId} (${resourceType})
Status: ${complianceType}
Environment: ${process.env.ENVIRONMENT_SUFFIX}
Timestamp: ${report.timestamp}

Please review and remediate this compliance violation.
      `;

      await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: `[${severity}] Compliance Violation: ${configRuleName}`,
        Message: message
      }));

      console.log(`Sent ${severity} notification for ${resourceId}`);

      return {
        statusCode: 200,
        body: JSON.stringify(report)
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource is compliant' })
    };
  } catch (error) {
    console.error('Error processing compliance event:', error);
    throw error;
  }
};
```

## File: lib/lambda/package.json

```json
{
  "name": "compliance-analyzer",
  "version": "1.0.0",
  "description": "AWS Config compliance analyzer Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@aws-sdk/client-config-service": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
cd lib/lambda && npm install && cd ../..
```

2. Deploy with context variables:
```bash
cdk deploy --context environmentSuffix=prod --context regions=us-east-1,eu-west-1
```

3. Subscribe to SNS topics for notifications:
```bash
aws sns subscribe --topic-arn <critical-topic-arn> --protocol email --notification-endpoint your-email@example.com
```