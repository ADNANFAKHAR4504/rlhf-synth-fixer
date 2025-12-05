import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

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
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    cdk.Tags.of(configBucket).add('CostCenter', 'Security');
    cdk.Tags.of(configBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(configBucket).add('ComplianceLevel', 'High');

    // Note: AWS Config Configuration Recorder and Delivery Channel are not created here
    // because AWS Config only allows ONE configuration recorder per region per account.
    // This stack assumes an existing configuration recorder is already set up.
    // The Config Rules below will use the existing recorder automatically.

    // SNS Topics for different severity levels
    const criticalTopic = new sns.Topic(this, 'CriticalTopic', {
      topicName: `compliance-critical-${environmentSuffix}`,
      displayName: 'Critical Compliance Violations',
    });

    const highTopic = new sns.Topic(this, 'HighTopic', {
      topicName: `compliance-high-${environmentSuffix}`,
      displayName: 'High Compliance Violations',
    });

    const mediumTopic = new sns.Topic(this, 'MediumTopic', {
      topicName: `compliance-medium-${environmentSuffix}`,
      displayName: 'Medium Compliance Violations',
    });

    const lowTopic = new sns.Topic(this, 'LowTopic', {
      topicName: `compliance-low-${environmentSuffix}`,
      displayName: 'Low Compliance Violations',
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
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      timeout: cdk.Duration.minutes(5),
    });

    cdk.Tags.of(complianceLambda).add('CostCenter', 'Security');
    cdk.Tags.of(complianceLambda).add('Environment', environmentSuffix);
    cdk.Tags.of(complianceLambda).add('ComplianceLevel', 'High');

    // Grant Lambda permissions
    criticalTopic.grantPublish(complianceLambda);
    highTopic.grantPublish(complianceLambda);
    mediumTopic.grantPublish(complianceLambda);
    lowTopic.grantPublish(complianceLambda);

    complianceLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'config:DescribeConfigRules',
          'config:GetComplianceDetailsByConfigRule',
          'config:DescribeComplianceByConfigRule',
        ],
        resources: ['*'],
      })
    );

    // Custom Config Rules

    // Rule 1: S3 Bucket Encryption
    const s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      configRuleName: `s3-bucket-encryption-${environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Check S3 buckets have encryption enabled',
    });

    cdk.Tags.of(s3EncryptionRule).add('CostCenter', 'Security');
    cdk.Tags.of(s3EncryptionRule).add('Environment', environmentSuffix);
    cdk.Tags.of(s3EncryptionRule).add('ComplianceLevel', 'High');

    // Rule 2: EC2 Instance Type Check
    const ec2InstanceRule = new config.ManagedRule(
      this,
      'EC2InstanceTypeRule',
      {
        configRuleName: `ec2-instance-type-${environmentSuffix}`,
        identifier: config.ManagedRuleIdentifiers.EC2_DESIRED_INSTANCE_TYPE,
        inputParameters: {
          instanceType: 't3.micro,t3.small,t3.medium',
        },
        description: 'Check EC2 instances are approved types',
      }
    );

    cdk.Tags.of(ec2InstanceRule).add('CostCenter', 'Security');
    cdk.Tags.of(ec2InstanceRule).add('Environment', environmentSuffix);
    cdk.Tags.of(ec2InstanceRule).add('ComplianceLevel', 'Medium');

    // Rule 3: RDS Backup Retention
    const rdsBackupRule = new config.ManagedRule(this, 'RDSBackupRule', {
      configRuleName: `rds-backup-retention-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_DB_INSTANCE_BACKUP_ENABLED,
      description: 'Check RDS databases have automatic backups enabled',
    });

    cdk.Tags.of(rdsBackupRule).add('CostCenter', 'Security');
    cdk.Tags.of(rdsBackupRule).add('Environment', environmentSuffix);
    cdk.Tags.of(rdsBackupRule).add('ComplianceLevel', 'High');

    // Lambda trigger from Config rule evaluations
    [s3EncryptionRule, ec2InstanceRule, rdsBackupRule].forEach(rule => {
      rule.onComplianceChange('ComplianceChange', {
        target: new events_targets.LambdaFunction(complianceLambda),
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for Config snapshots',
    });

    new cdk.CfnOutput(this, 'ComplianceLambdaArn', {
      value: complianceLambda.functionArn,
      description: 'Compliance analyzer Lambda ARN',
    });

    new cdk.CfnOutput(this, 'CriticalTopicArn', {
      value: criticalTopic.topicArn,
      description: 'Critical violations SNS topic',
    });
  }
}
