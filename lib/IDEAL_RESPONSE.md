# AWS Aurora MySQL Serverless v2 Infrastructure Implementation

This document describes the implementation of a secure RDS Aurora MySQL database deployment using AWS CDK with TypeScript.

## Architecture Overview

The implementation provides:
- Aurora MySQL Serverless v2 cluster with read/write endpoints
- VPC with public/private subnets for network isolation
- KMS encryption for data at rest
- CloudWatch monitoring and alarms
- S3 backup storage
- SNS notifications for alerts

## Stack Structure

### tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the Infrastructure Stack
    const infraStack = new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
    });

    // Export Aurora outputs for integration tests
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: infraStack.clusterEndpoint,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: infraStack.clusterReadEndpoint,
      description: 'Aurora cluster read endpoint',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: infraStack.secretArn,
      description: 'Secret ARN for database credentials',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: infraStack.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: infraStack.alarmTopicArn,
      description: 'SNS topic for database alarms',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: infraStack.backupBucketName,
      description: 'S3 bucket for database backups',
    });
  }
}
```

### infrastructure-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface InfrastructureStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly clusterEndpoint: string;
  public readonly clusterReadEndpoint: string;
  public readonly secretArn: string;
  public readonly vpcId: string;
  public readonly alarmTopicArn: string;
  public readonly backupBucketName: string;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'AuroraKmsKey', {
      description: `Aurora encryption key for ${environmentSuffix} environment`,
      enableKeyRotation: true,
    });

    // VPC for Aurora cluster
    const vpc = new ec2.Vpc(this, `AuroraVpc${environmentSuffix}`, {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group for Aurora
    const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc,
      description: 'Security group for Aurora MySQL cluster',
      allowAllOutbound: false,
    });

    auroraSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'Allow MySQL access from VPC'
    );

    // Subnet Group for Aurora
    const subnetGroup = new rds.SubnetGroup(this, 'AuroraSubnetGroup', {
      vpc,
      description: 'Subnet group for Aurora MySQL cluster',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Aurora Cluster
    const cluster = new rds.DatabaseCluster(this, `AuroraCluster${environmentSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_07_0,
      }),
      serverlessV2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 16,
      },
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          publiclyAccessible: false,
        }),
      ],
      vpc,
      subnetGroup,
      securityGroups: [auroraSecurityGroup],
      storageEncryptionKey: kmsKey,
      storageEncrypted: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false,
      defaultDatabaseName: 'aurora_db',
    });

    // S3 Bucket for backups
    const backupBucket = new s3.Bucket(this, `DatabaseBackupBucket${environmentSuffix}`, {
      bucketName: `aurora-backups-${this.account}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'backup-lifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
