# Aurora MySQL Serverless v2 Infrastructure# AWS Aurora MySQL Serverless v2 Infrastructure Implementation



This infrastructure deploys an Aurora MySQL Serverless v2 cluster in AWS using CDK TypeScript.This document describes the implementation of a secure RDS Aurora MySQL database deployment using AWS CDK with TypeScript.



## Architecture Overview## Architecture Overview



- **VPC**: Private isolated subnets in us-west-2 (10.30.0.0/16)The implementation provides:

- **Aurora MySQL Serverless v2**: Auto-scaling from 0.5-2 ACU- Aurora MySQL Serverless v2 cluster with read/write endpoints

- **Security**: KMS encryption, VPC isolation, security groups- VPC with public/private subnets for network isolation

- **Monitoring**: CloudWatch alarms for capacity, connections, CPU- KMS encryption for data at rest

- **Backup**: 5-day retention with S3 storage- CloudWatch monitoring and alarms

- S3 backup storage

## Implementation- SNS notifications for alerts



### lib/tap-stack.ts## Stack Structure



```typescript### tap-stack.ts

import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';```typescript

import * as cdk from 'aws-cdk-lib';

// Import your stacks hereimport { Construct } from 'constructs';

import { InfrastructureStack } from './infrastructure-stack';import { InfrastructureStack } from './infrastructure-stack';



interface TapStackProps extends cdk.StackProps {interface TapStackProps extends cdk.StackProps {

  environmentSuffix?: string;  environmentSuffix?: string;

}}



export class TapStack extends cdk.Stack {export class TapStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: TapStackProps) {  constructor(scope: Construct, id: string, props?: TapStackProps) {

    super(scope, id, props);    super(scope, id, props);



    // Get environment suffix from props, context, or use 'dev' as default    // Get environment suffix from props, context, or use 'dev' as default

    const environmentSuffix =    const environmentSuffix =

      props?.environmentSuffix ||      props?.environmentSuffix ||

      this.node.tryGetContext('environmentSuffix') ||      this.node.tryGetContext('environmentSuffix') ||

      'dev';      'dev';



    // Instantiate the Infrastructure Stack    // Instantiate the Infrastructure Stack

    const infrastructureStack = new InfrastructureStack(    const infraStack = new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {

      this,      environmentSuffix,

      `InfrastructureStack-${environmentSuffix}`,      env: props?.env,

      {    });

        environmentSuffix,

        env: props?.env,    // Export Aurora outputs for integration tests

      }    new cdk.CfnOutput(this, 'ClusterEndpoint', {

    );      value: infraStack.clusterEndpoint,

      description: 'Aurora cluster endpoint',

    // Bubble up Aurora outputs to the main TapStack so integration tests can find them    });

    new cdk.CfnOutput(this, 'VpcId', {

      value: infrastructureStack.vpc.vpcId,    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {

      description: 'VPC ID',      value: infraStack.clusterReadEndpoint,

    });      description: 'Aurora cluster read endpoint',

    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {

      value: infrastructureStack.dbCluster.clusterEndpoint.socketAddress,    new cdk.CfnOutput(this, 'SecretArn', {

      description: 'Aurora cluster endpoint',      value: infraStack.secretArn,

    });      description: 'Secret ARN for database credentials',

    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {

      value: infrastructureStack.dbCluster.clusterReadEndpoint.socketAddress,    new cdk.CfnOutput(this, 'VpcId', {

      description: 'Aurora cluster read endpoint',      value: infraStack.vpcId,

    });      description: 'VPC ID',

    });

    new cdk.CfnOutput(this, 'SecretArn', {

      value: infrastructureStack.dbCluster.secret!.secretArn,    new cdk.CfnOutput(this, 'AlarmTopicArn', {

      description: 'Secret ARN for database credentials',      value: infraStack.alarmTopicArn,

    });      description: 'SNS topic for database alarms',

    });

    new cdk.CfnOutput(this, 'BackupBucketName', {

      value: infrastructureStack.backupBucket.bucketName,    new cdk.CfnOutput(this, 'BackupBucketName', {

      description: 'S3 bucket for database backups',      value: infraStack.backupBucketName,

    });      description: 'S3 bucket for database backups',

    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {  }

      value: infrastructureStack.alarmTopic.topicArn,}

      description: 'SNS topic for database alarms',```

    });

  }### infrastructure-stack.ts

}

``````typescript

import * as cdk from 'aws-cdk-lib';

### lib/infrastructure-stack.tsimport * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

```typescriptimport * as ec2 from 'aws-cdk-lib/aws-ec2';

import * as cdk from 'aws-cdk-lib';import * as kms from 'aws-cdk-lib/aws-kms';

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';import * as rds from 'aws-cdk-lib/aws-rds';

import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';import * as s3 from 'aws-cdk-lib/aws-s3';

import * as ec2 from 'aws-cdk-lib/aws-ec2';import * as sns from 'aws-cdk-lib/aws-sns';

import * as kms from 'aws-cdk-lib/aws-kms';import { Construct } from 'constructs';

import * as rds from 'aws-cdk-lib/aws-rds';

import * as s3 from 'aws-cdk-lib/aws-s3';interface InfrastructureStackProps extends cdk.StackProps {

import * as sns from 'aws-cdk-lib/aws-sns';  environmentSuffix: string;

import { Construct } from 'constructs';}



export interface InfrastructureStackProps extends cdk.StackProps {export class InfrastructureStack extends cdk.Stack {

  environmentSuffix?: string;  public readonly clusterEndpoint: string;

}  public readonly clusterReadEndpoint: string;

  public readonly secretArn: string;

export class InfrastructureStack extends cdk.Stack {  public readonly vpcId: string;

  public readonly vpc: ec2.Vpc;  public readonly alarmTopicArn: string;

  public readonly dbCluster: rds.DatabaseCluster;  public readonly backupBucketName: string;

  public readonly backupBucket: s3.Bucket;

  public readonly alarmTopic: sns.Topic;  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {

    super(scope, id, props);

  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {

    super(scope, id, props);    const { environmentSuffix } = props;



    const environmentSuffix = props?.environmentSuffix || 'dev';    // KMS Key for encryption

    const kmsKey = new kms.Key(this, 'AuroraKmsKey', {

    // Create a VPC with only private isolated subnets (no NAT Gateway)      description: `Aurora encryption key for ${environmentSuffix} environment`,

    this.vpc = new ec2.Vpc(this, `AuroraVpc-${environmentSuffix}`, {      enableKeyRotation: true,

      ipAddresses: ec2.IpAddresses.cidr('10.30.0.0/16'),    });

      maxAzs: 2, // Use 2 AZs for high availability

      enableDnsHostnames: true,    // VPC for Aurora cluster

      enableDnsSupport: true,    const vpc = new ec2.Vpc(this, `AuroraVpc${environmentSuffix}`, {

      natGateways: 0, // No NAT Gateway for cost optimization      cidr: '10.0.0.0/16',

      subnetConfiguration: [      maxAzs: 2,

        {      subnetConfiguration: [

          cidrMask: 24,        {

          name: 'PrivateIsolated',          cidrMask: 24,

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,          name: 'PublicSubnet',

        },          subnetType: ec2.SubnetType.PUBLIC,

      ],        },

    });        {

          cidrMask: 24,

    // Create KMS key for encryption at rest          name: 'PrivateSubnet',

    const encryptionKey = new kms.Key(          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,

      this,        },

      `AuroraEncryptionKey-${environmentSuffix}`,      ],

      {    });

        enableKeyRotation: true,

        description: 'KMS key for Aurora database encryption',    // Security Group for Aurora

        removalPolicy: cdk.RemovalPolicy.DESTROY,    const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {

      }      vpc,

    );      description: 'Security group for Aurora MySQL cluster',

      allowAllOutbound: false,

    // Generate unique alias name using stack name to avoid conflicts    });

    const uniqueId = cdk.Names.uniqueId(this).toLowerCase().substring(0, 8);

    new kms.Alias(this, `AuroraKeyAlias-${environmentSuffix}`, {    auroraSecurityGroup.addIngressRule(

      aliasName: `alias/aurora-db-key-${environmentSuffix}-${uniqueId}`,      ec2.Peer.ipv4(vpc.vpcCidrBlock),

      targetKey: encryptionKey,      ec2.Port.tcp(3306),

    });      'Allow MySQL access from VPC'

    );

    // Create security group for Aurora

    const dbSecurityGroup = new ec2.SecurityGroup(    // Subnet Group for Aurora

      this,    const subnetGroup = new rds.SubnetGroup(this, 'AuroraSubnetGroup', {

      `AuroraSecurityGroup-${environmentSuffix}`,      vpc,

      {      description: 'Subnet group for Aurora MySQL cluster',

        vpc: this.vpc,      vpcSubnets: {

        description: 'Security group for Aurora MySQL database',        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,

        allowAllOutbound: false,      },

      }    });

    );

    // Aurora Cluster

    // Allow MySQL traffic only from within the VPC    const cluster = new rds.DatabaseCluster(this, `AuroraCluster${environmentSuffix}`, {

    dbSecurityGroup.addIngressRule(      engine: rds.DatabaseClusterEngine.auroraMysql({

      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),        version: rds.AuroraMysqlEngineVersion.VER_3_07_0,

      ec2.Port.tcp(3306),      }),

      'Allow MySQL traffic from VPC'      serverlessV2ScalingConfiguration: {

    );        minCapacity: 0.5,

        maxCapacity: 16,

    // Create a DB subnet group      },

    const subnetGroup = new rds.SubnetGroup(      writer: rds.ClusterInstance.serverlessV2('writer', {

      this,        publiclyAccessible: false,

      `AuroraSubnetGroup-${environmentSuffix}`,      }),

      {      readers: [

        vpc: this.vpc,        rds.ClusterInstance.serverlessV2('reader', {

        vpcSubnets: {          publiclyAccessible: false,

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,        }),

        },      ],

        description: 'Subnet group for Aurora database',      vpc,

        removalPolicy: cdk.RemovalPolicy.DESTROY,      subnetGroup,

      }      securityGroups: [auroraSecurityGroup],

    );      storageEncryptionKey: kmsKey,

      storageEncrypted: true,

    // Create Aurora MySQL Serverless v2 cluster      cloudwatchLogsExports: ['error', 'general', 'slowquery'],

    this.dbCluster = new rds.DatabaseCluster(      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,

      this,      backup: {

      `AuroraCluster-${environmentSuffix}`,        retention: cdk.Duration.days(7),

      {        preferredWindow: '03:00-04:00',

        engine: rds.DatabaseClusterEngine.auroraMysql({      },

          version: rds.AuroraMysqlEngineVersion.VER_3_08_2,      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

        }),      deletionProtection: false,

        writer: rds.ClusterInstance.serverlessV2(      defaultDatabaseName: 'aurora_db',

          `writer-${environmentSuffix}`,    });

          {

            publiclyAccessible: false,    // S3 Bucket for backups

            enablePerformanceInsights: true,    const backupBucket = new s3.Bucket(this, `DatabaseBackupBucket${environmentSuffix}`, {

            performanceInsightRetention:      bucketName: `aurora-backups-${this.account}-${environmentSuffix}`,

              rds.PerformanceInsightRetention.DEFAULT, // 7 days      encryption: s3.BucketEncryption.KMS,

          }      encryptionKey: kmsKey,

        ),      versioned: true,

        readers: [      lifecycleRules: [

          rds.ClusterInstance.serverlessV2(`reader-${environmentSuffix}`, {        {

            scaleWithWriter: true,          id: 'backup-lifecycle',

            publiclyAccessible: false,          enabled: true,

            enablePerformanceInsights: true,          transitions: [

            performanceInsightRetention:            {

              rds.PerformanceInsightRetention.DEFAULT,              storageClass: s3.StorageClass.INFREQUENT_ACCESS,

          }),              transitionAfter: cdk.Duration.days(30),

        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        subnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backup: {
          retention: cdk.Duration.days(5),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        defaultDatabaseName: 'saasdb',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `aurora-db-secret-${environmentSuffix}`,
        }),
        monitoringInterval: cdk.Duration.seconds(60),
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
        cloudwatchLogsRetention: 7,
      }
    );

    // Create S3 bucket for backup storage (for export tasks)
    this.backupBucket = new s3.Bucket(
      this,
      `DatabaseBackupBucket-${environmentSuffix}`,
      {
        bucketName: `aurora-backups-${cdk.Stack.of(this).account}-${environmentSuffix}`,
        versioned: true,
        lifecycleRules: [
          {
            id: 'delete-old-backups',
            expiration: cdk.Duration.days(30),
          },
        ],
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, `DbAlarmTopic-${environmentSuffix}`, {
      displayName: `Aurora Database Alarms - ${environmentSuffix}`,
    });

    // Create CloudWatch alarms for monitoring
    const capacityAlarm = new cloudwatch.Alarm(
      this,
      `ServerlessCapacityAlarm-${environmentSuffix}`,
      {
        metric: this.dbCluster.metricServerlessDatabaseCapacity(),
        threshold: 1.5,
        evaluationPeriods: 2,
        alarmDescription:
          'Alert when serverless database capacity is approaching maximum',
      }
    );
    capacityAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const acuUtilizationAlarm = new cloudwatch.Alarm(
      this,
      `ACUUtilizationAlarm-${environmentSuffix}`,
      {
        metric: this.dbCluster.metricACUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        alarmDescription: 'Alert when ACU utilization exceeds 80%',
      }
    );
    acuUtilizationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const connectionsAlarm = new cloudwatch.Alarm(
      this,
      `DatabaseConnectionsAlarm-${environmentSuffix}`,
      {
        metric: this.dbCluster.metricDatabaseConnections(),
        threshold: 100,
        evaluationPeriods: 2,
        alarmDescription: 'Alert when database connections exceed 100',
      }
    );
    connectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `CPUUtilizationAlarm-${environmentSuffix}`,
      {
        metric: this.dbCluster.metricCPUUtilization(),
        threshold: 75,
        evaluationPeriods: 2,
        alarmDescription: 'Alert when CPU utilization exceeds 75%',
      }
    );
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.dbCluster.clusterEndpoint.socketAddress,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.dbCluster.clusterReadEndpoint.socketAddress,
      description: 'Aurora cluster read endpoint',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.dbCluster.secret!.secretArn,
      description: 'Secret ARN for database credentials',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket for database backups',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS topic for database alarms',
    });
  }
}
```

## Key Features

1. **Aurora MySQL Serverless v2**: Latest version (3.08.2) with auto-scaling
2. **High Availability**: Multi-AZ deployment with reader instance
3. **Security**: VPC isolation, KMS encryption, security groups
4. **Monitoring**: CloudWatch alarms for capacity, ACU, connections, CPU
5. **Backup**: 5-day retention with S3 lifecycle management
6. **Performance**: Performance Insights enabled with 7-day retention
7. **Cost Optimization**: 0.5-2 ACU scaling range, no NAT Gateway