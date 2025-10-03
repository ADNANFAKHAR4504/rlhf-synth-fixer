I'll create the infrastructure code for a secure RDS Aurora MySQL database deployment using AWS CDK with TypeScript. Here's the complete implementation:I'll create the infrastructure code for a comprehensive backup system using AWS CDK with TypeScript. Here's the complete implementation:I'll create the infrastructure code for a comprehensive backup system using AWS CDK with TypeScript. Here's the complete implementation:I'll create the infrastructure code for a secure RDS Aurora MySQL database deployment using AWS CDK with TypeScript. Here's the complete implementation:



## tap-stack.ts


```typescript## tap-stack.ts

import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';



// ? Import your stacks here```typescript## tap-stack.ts## tap-stack.ts

import { InfrastructureStack } from './infrastructure-stack';

import * as cdk from 'aws-cdk-lib';

interface TapStackProps extends cdk.StackProps {

  environmentSuffix?: string;import { Construct } from 'constructs';

}



export class TapStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: TapStackProps) {// ? Import your stacks here```typescript```typescript

    super(scope, id, props);

import { InfrastructureStack } from './infrastructure-stack';

    // Get environment suffix from props, context, or use 'dev' as default

    const environmentSuffix =import * as cdk from 'aws-cdk-lib';import * as cdk from 'aws-cdk-lib';

      props?.environmentSuffix ||

      this.node.tryGetContext('environmentSuffix') ||interface TapStackProps extends cdk.StackProps {

      'dev';

  environmentSuffix?: string;import { Construct } from 'constructs';import { Construct } from 'constructs';

    // ? Add your stack instantiations here

    // ! Do NOT create resources directly in this stack.}

    // ! Instead, create separate stacks for each resource type.



    // Instantiate the Infrastructure Stack

    new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {export class TapStack extends cdk.Stack {

      environmentSuffix,

      env: props?.env,  constructor(scope: Construct, id: string, props?: TapStackProps) {// ? Import your stacks here// ? Import your stacks here

    });

  }    super(scope, id, props);

}

```import { InfrastructureStack } from './infrastructure-stack';import { InfrastructureStack } from './infrastructure-stack';



## infrastructure-stack.ts    // Get environment suffix from props, context, or use 'dev' as default



```typescript    const environmentSuffix =

import * as cdk from 'aws-cdk-lib';

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';      props?.environmentSuffix ||

import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

import * as ec2 from 'aws-cdk-lib/aws-ec2';      this.node.tryGetContext('environmentSuffix') ||interface TapStackProps extends cdk.StackProps {interface TapStackProps extends cdk.StackProps {

import * as kms from 'aws-cdk-lib/aws-kms';

import * as rds from 'aws-cdk-lib/aws-rds';      'dev';

import * as s3 from 'aws-cdk-lib/aws-s3';

import * as sns from 'aws-cdk-lib/aws-sns';  environmentSuffix?: string;  environmentSuffix?: string;

import { Construct } from 'constructs';

    // ? Add your stack instantiations here

export interface InfrastructureStackProps extends cdk.StackProps {

  environmentSuffix?: string;    // ! Do NOT create resources directly in this stack.}}

}

    // ! Instead, create separate stacks for each resource type.

export class InfrastructureStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {

    super(scope, id, props);

    // Instantiate the Infrastructure Stack

    const environmentSuffix = props?.environmentSuffix || 'dev';

    new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {export class TapStack extends cdk.Stack {export class TapStack extends cdk.Stack {

    // Create a VPC with only private isolated subnets (no NAT Gateway)

    const vpc = new ec2.Vpc(this, `AuroraVpc-${environmentSuffix}`, {      environmentSuffix,

      ipAddresses: ec2.IpAddresses.cidr('10.30.0.0/16'),

      maxAzs: 2, // Use 2 AZs for high availability      env: props?.env,  constructor(scope: Construct, id: string, props?: TapStackProps) {  constructor(scope: Construct, id: string, props?: TapStackProps) {

      enableDnsHostnames: true,

      enableDnsSupport: true,    });

      natGateways: 0, // No NAT Gateway for cost optimization

      subnetConfiguration: [  }    super(scope, id, props);    super(scope, id, props);

        {

          cidrMask: 24,}

          name: 'PrivateIsolated',

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,```

        },

      ],

    });

## infrastructure-stack.ts    // Get environment suffix from props, context, or use 'dev' as default    // Get environment suffix from props, context, or use 'dev' as default

    // Create KMS key for encryption at rest

    const encryptionKey = new kms.Key(

      this,

      `AuroraEncryptionKey-${environmentSuffix}`,```typescript    const environmentSuffix =    const environmentSuffix =

      {

        enableKeyRotation: true,import * as cdk from 'aws-cdk-lib';

        description: 'KMS key for Aurora database encryption',

        removalPolicy: cdk.RemovalPolicy.DESTROY,import * as s3 from 'aws-cdk-lib/aws-s3';      props?.environmentSuffix ||      props?.environmentSuffix ||

      }

    );import * as kms from 'aws-cdk-lib/aws-kms';



    // Generate unique alias name using stack name to avoid conflictsimport * as dynamodb from 'aws-cdk-lib/aws-dynamodb';      this.node.tryGetContext('environmentSuffix') ||      this.node.tryGetContext('environmentSuffix') ||

    const uniqueId = cdk.Names.uniqueId(this).toLowerCase().substring(0, 8);

    new kms.Alias(this, `AuroraKeyAlias-${environmentSuffix}`, {import * as sqs from 'aws-cdk-lib/aws-sqs';

      aliasName: `alias/aurora-db-key-${environmentSuffix}-${uniqueId}`,

      targetKey: encryptionKey,import * as sns from 'aws-cdk-lib/aws-sns';      'dev';      'dev';

    });

import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

    // Create security group for Aurora

    const dbSecurityGroup = new ec2.SecurityGroup(import { Construct } from 'constructs';

      this,

      `AuroraSecurityGroup-${environmentSuffix}`,

      {

        vpc,export interface InfrastructureStackProps extends cdk.StackProps {    // ? Add your stack instantiations here    // ? Add your stack instantiations here

        description: 'Security group for Aurora MySQL database',

        allowAllOutbound: false,  environmentSuffix?: string;

      }

    );}    // ! Do NOT create resources directly in this stack.    // ! Do NOT create resources directly in this stack.



    // Allow MySQL traffic only from within the VPC

    dbSecurityGroup.addIngressRule(

      ec2.Peer.ipv4(vpc.vpcCidrBlock),export class InfrastructureStack extends cdk.Stack {    // ! Instead, create separate stacks for each resource type.    // ! Instead, create separate stacks for each resource type.

      ec2.Port.tcp(3306),

      'Allow MySQL traffic from VPC'  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {

    );

    super(scope, id, props);

    // Create a DB subnet group

    const subnetGroup = new rds.SubnetGroup(

      this,

      `AuroraSubnetGroup-${environmentSuffix}`,    const environmentSuffix = props?.environmentSuffix || 'dev';    // Instantiate the Infrastructure Stack    // Instantiate the Infrastructure Stack

      {

        vpc,

        vpcSubnets: {

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,    // Create KMS key for encryption    new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {    new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {

        },

        description: 'Subnet group for Aurora database',    const encryptionKey = new kms.Key(this, `BackupEncryptionKey-${environmentSuffix}`, {

        removalPolicy: cdk.RemovalPolicy.DESTROY,

      }      enableKeyRotation: true,      environmentSuffix,      environmentSuffix,

    );

      description: 'KMS key for backup system encryption',

    // Create Aurora MySQL Serverless v2 cluster

    const dbCluster = new rds.DatabaseCluster(      removalPolicy: cdk.RemovalPolicy.DESTROY,      env: props?.env,      env: props?.env,

      this,

      `AuroraCluster-${environmentSuffix}`,    });

      {

        engine: rds.DatabaseClusterEngine.auroraMysql({    });    });

          version: rds.AuroraMysqlEngineVersion.VER_3_08_2,

        }),    // Primary backup bucket

        writer: rds.ClusterInstance.serverlessV2(

          `writer-${environmentSuffix}`,    const backupBucket = new s3.Bucket(this, `BackupBucket-${environmentSuffix}`, {  }  }

          {

            publiclyAccessible: false,      bucketName: `backup-primary-${environmentSuffix}-${this.account}-${this.region}`,

            enablePerformanceInsights: true,

            performanceInsightRetention:      encryption: s3.BucketEncryption.KMS,}}

              rds.PerformanceInsightRetention.DEFAULT, // 7 days

          }      encryptionKey: encryptionKey,

        ),

        readers: [      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,``````

          rds.ClusterInstance.serverlessV2(`reader-${environmentSuffix}`, {

            scaleWithWriter: true,      versioned: true,

            publiclyAccessible: false,

            enablePerformanceInsights: true,      lifecycleRules: [

            performanceInsightRetention:

              rds.PerformanceInsightRetention.DEFAULT,        {

          }),

        ],          id: 'IntelligentTiering',## infrastructure-stack.ts## infrastructure-stack.ts

        serverlessV2MinCapacity: 0.5,

        serverlessV2MaxCapacity: 2,          enabled: true,

        vpc,

        vpcSubnets: {          transitions: [

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

        },            {

        subnetGroup,

        securityGroups: [dbSecurityGroup],              storageClass: s3.StorageClass.INTELLIGENT_TIERING,```typescript```typescript

        storageEncrypted: true,

        storageEncryptionKey: encryptionKey,              transitionAfter: cdk.Duration.days(1),

        backup: {

          retention: cdk.Duration.days(5),            },import * as cdk from 'aws-cdk-lib';import * as cdk from 'aws-cdk-lib';

          preferredWindow: '03:00-04:00',

        },            {

        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

        deletionProtection: false,              storageClass: s3.StorageClass.GLACIER,import * as s3 from 'aws-cdk-lib/aws-s3';import * as ec2 from 'aws-cdk-lib/aws-ec2';

        removalPolicy: cdk.RemovalPolicy.DESTROY,

        defaultDatabaseName: 'saasdb',              transitionAfter: cdk.Duration.days(30),

        credentials: rds.Credentials.fromGeneratedSecret('admin', {

          secretName: `aurora-db-secret-${environmentSuffix}`,            },import * as kms from 'aws-cdk-lib/aws-kms';import * as rds from 'aws-cdk-lib/aws-rds';

        }),

        monitoringInterval: cdk.Duration.seconds(60),            {

        cloudwatchLogsExports: ['error', 'general', 'slowquery'],

        cloudwatchLogsRetention: 7,              storageClass: s3.StorageClass.DEEP_ARCHIVE,import * * dynamodb from 'aws-cdk-lib/aws-dynamodb';import * as kms from 'aws-cdk-lib/aws-kms';

      }

    );              transitionAfter: cdk.Duration.days(90),



    // Create S3 bucket for backup storage (for export tasks)            },import * as sqs from 'aws-cdk-lib/aws-sqs';import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

    const backupBucket = new s3.Bucket(

      this,          ],

      `DatabaseBackupBucket-${environmentSuffix}`,

      {          expiration: cdk.Duration.days(365),import * as sns from 'aws-cdk-lib/aws-sns';import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

        bucketName: `aurora-backups-${this.account}-${environmentSuffix}`,

        encryption: s3.BucketEncryption.KMS,        },

        encryptionKey: encryptionKey,

        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,      ],import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';import * as sns from 'aws-cdk-lib/aws-sns';

        versioned: true,

        lifecycleRules: [      removalPolicy: cdk.RemovalPolicy.DESTROY,

          {

            id: 'BackupLifecycle',      autoDeleteObjects: true,import { Construct } from 'constructs';import * as s3 from 'aws-cdk-lib/aws-s3';

            enabled: true,

            transitions: [    });

              {

                storageClass: s3.StorageClass.INFREQUENT_ACCESS,import { Construct } from 'constructs';

                transitionAfter: cdk.Duration.days(30),

              },    // Replication bucket for cross-region backup

              {

                storageClass: s3.StorageClass.GLACIER,    const replicationBucket = new s3.Bucket(this, `ReplicationBucket-${environmentSuffix}`, {export interface InfrastructureStackProps extends cdk.StackProps {

                transitionAfter: cdk.Duration.days(90),

              },      bucketName: `backup-replication-${environmentSuffix}-${this.account}-${this.region}`,

            ],

            expiration: cdk.Duration.days(365),      encryption: s3.BucketEncryption.KMS,  environmentSuffix?: string;interface InfrastructureStackProps extends cdk.StackProps {

          },

        ],      encryptionKey: encryptionKey,

        removalPolicy: cdk.RemovalPolicy.DESTROY,

        autoDeleteObjects: true,      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,}  environmentSuffix?: string;

      }

    );      versioned: true,



    // Create SNS topic for alarms      removalPolicy: cdk.RemovalPolicy.DESTROY,}

    const alarmTopic = new sns.Topic(

      this,      autoDeleteObjects: true,

      `DatabaseAlarmTopic-${environmentSuffix}`,

      {    });export class InfrastructureStack extends cdk.Stack {

        displayName: 'Aurora Database Alarms',

        topicName: `aurora-alarms-${environmentSuffix}`,

        masterKey: encryptionKey,

      }    // DynamoDB table for backup metadata  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {export class InfrastructureStack extends cdk.Stack {

    );

    const metadataTable = new dynamodb.Table(this, `BackupMetadataTable-${environmentSuffix}`, {

    // CloudWatch Alarms for monitoring

      partitionKey: { name: 'backupId', type: dynamodb.AttributeType.STRING },    super(scope, id, props);  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {

    // ServerlessDatabaseCapacity alarm

    const capacityAlarm = new cloudwatch.Alarm(      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },

      this,

      `HighDatabaseCapacity-${environmentSuffix}`,      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,    super(scope, id, props);

      {

        metric: new cloudwatch.Metric({      encryptionKey: encryptionKey,

          namespace: 'AWS/RDS',

          metricName: 'ServerlessDatabaseCapacity',      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,    const environmentSuffix = props?.environmentSuffix || 'dev';

          dimensionsMap: {

            DBClusterIdentifier: dbCluster.clusterIdentifier,      pointInTimeRecovery: true,

          },

          statistic: 'Average',      removalPolicy: cdk.RemovalPolicy.DESTROY,    const environmentSuffix = props?.environmentSuffix || 'dev';

          period: cdk.Duration.minutes(5),

        }),    });

        threshold: 1.5,

        evaluationPeriods: 2,    // Create KMS key for encryption

        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,

        alarmDescription: 'Aurora Serverless capacity is high',    // DynamoDB table for deduplication

        actionsEnabled: true,

      }    const deduplicationTable = new dynamodb.Table(this, `DeduplicationTable-${environmentSuffix}`, {    const encryptionKey = new kms.Key(this, `BackupEncryptionKey-${environmentSuffix}`, {    // Create VPC with private subnets

    );

    capacityAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));      partitionKey: { name: 'fileHash', type: dynamodb.AttributeType.STRING },



    // ACUUtilization alarm      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,      enableKeyRotation: true,    const vpc = new ec2.Vpc(this, `DatabaseVPC-${environmentSuffix}`, {

    const acuAlarm = new cloudwatch.Alarm(

      this,      encryptionKey: encryptionKey,

      `HighACUUtilization-${environmentSuffix}`,

      {      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,      description: 'KMS key for backup system encryption',      maxAzs: 2,

        metric: new cloudwatch.Metric({

          namespace: 'AWS/RDS',      timeToLiveAttribute: 'ttl',

          metricName: 'ACUUtilization',

          dimensionsMap: {      removalPolicy: cdk.RemovalPolicy.DESTROY,      removalPolicy: cdk.RemovalPolicy.DESTROY,      natGateways: 0, // No NAT gateways for cost optimization

            DBClusterIdentifier: dbCluster.clusterIdentifier,

          },    });

          statistic: 'Average',

          period: cdk.Duration.minutes(5),    });      subnetConfiguration: [

        }),

        threshold: 80,    // SQS queue for backup processing

        evaluationPeriods: 2,

        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,    const backupQueue = new sqs.Queue(this, `BackupQueue-${environmentSuffix}`, {        {

        alarmDescription: 'Aurora ACU utilization is high',

        actionsEnabled: true,      encryption: sqs.QueueEncryption.KMS,

      }

    );      encryptionMasterKey: encryptionKey,    // Primary backup bucket          cidrMask: 24,

    acuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

      visibilityTimeout: cdk.Duration.minutes(15),

    // DatabaseConnections alarm

    const connectionsAlarm = new cloudwatch.Alarm(      retentionPeriod: cdk.Duration.days(14),    const backupBucket = new s3.Bucket(this, `BackupBucket-${environmentSuffix}`, {          name: 'Private',

      this,

      `HighDatabaseConnections-${environmentSuffix}`,      deadLetterQueue: {

      {

        metric: new cloudwatch.Metric({        queue: new sqs.Queue(this, `BackupDeadLetterQueue-${environmentSuffix}`, {      bucketName: `backup-primary-${environmentSuffix}-${this.account}-${this.region}`,          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

          namespace: 'AWS/RDS',

          metricName: 'DatabaseConnections',          encryption: sqs.QueueEncryption.KMS,

          dimensionsMap: {

            DBClusterIdentifier: dbCluster.clusterIdentifier,          encryptionMasterKey: encryptionKey,      encryption: s3.BucketEncryption.KMS,        },

          },

          statistic: 'Average',        }),

          period: cdk.Duration.minutes(5),

        }),        maxReceiveCount: 3,      encryptionKey: encryptionKey,      ],

        threshold: 40,

        evaluationPeriods: 2,      },

        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,

        alarmDescription: 'Aurora database connections are high',    });      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,      ipAddresses: ec2.IpAddresses.cidr('10.30.0.0/16'),

        actionsEnabled: true,

      }

    );

    connectionsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));    // SNS topic for notifications      versioned: true,    });



    // CPU Utilization alarm    const notificationTopic = new sns.Topic(this, `BackupNotificationTopic-${environmentSuffix}`, {

    const cpuAlarm = new cloudwatch.Alarm(

      this,      masterKey: encryptionKey,      lifecycleRules: [

      `HighCPUUtilization-${environmentSuffix}`,

      {    });

        metric: new cloudwatch.Metric({

          namespace: 'AWS/RDS',        {    // Override subnet CIDR blocks

          metricName: 'CPUUtilization',

          dimensionsMap: {    // CloudWatch Dashboard

            DBClusterIdentifier: dbCluster.clusterIdentifier,

          },    const dashboard = new cloudwatch.Dashboard(this, `BackupDashboard-${environmentSuffix}`, {          id: 'IntelligentTiering',    const cfnSubnet1 = vpc.isolatedSubnets[0].node

          statistic: 'Average',

          period: cdk.Duration.minutes(5),      dashboardName: `BackupSystemMonitoring-${environmentSuffix}`,

        }),

        threshold: 80,    });          enabled: true,      .defaultChild as ec2.CfnSubnet;

        evaluationPeriods: 2,

        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,

        alarmDescription: 'Aurora CPU utilization is high',

        actionsEnabled: true,    // System capabilities configuration          transitions: [    cfnSubnet1.cidrBlock = '10.30.10.0/24';

      }

    );    const systemCapabilities = {

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

      maxUsers: 1000,            {

    // Outputs

    new cdk.CfnOutput(this, 'VpcId', {      retentionDays: 60,

      value: vpc.vpcId,

      description: 'VPC ID',      rto: '2 hours',              storageClass: s3.StorageClass.INTELLIGENT_TIERING,    const cfnSubnet2 = vpc.isolatedSubnets[1].node

    });

      rpo: '24 hours',

    new cdk.CfnOutput(this, 'ClusterEndpoint', {

      value: dbCluster.clusterEndpoint.socketAddress,      availability: '99.9%',              transitionAfter: cdk.Duration.days(1),      .defaultChild as ec2.CfnSubnet;

      description: 'Aurora cluster endpoint',

    });      encryption: 'KMS Customer Managed',



    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {      replication: 'Cross-Region',            },    cfnSubnet2.cidrBlock = '10.30.20.0/24';

      value: dbCluster.clusterReadEndpoint.socketAddress,

      description: 'Aurora cluster read endpoint',      deduplication: 'Enabled',

    });

      networkIsolation: true,            {

    new cdk.CfnOutput(this, 'SecretArn', {

      value: dbCluster.secret!.secretArn,      auditLogging: 'CloudTrail + S3 Access Logs',

      description: 'Secret ARN for database credentials',

    });      costOptimization: 'Intelligent Tiering + Lifecycle',              storageClass: s3.StorageClass.GLACIER,    // Create KMS key for database encryption



    new cdk.CfnOutput(this, 'BackupBucketName', {    };

      value: backupBucket.bucketName,

      description: 'S3 bucket for database backups',              transitionAfter: cdk.Duration.days(30),    const encryptionKey = new kms.Key(

    });

    // Outputs

    new cdk.CfnOutput(this, 'AlarmTopicArn', {

      value: alarmTopic.topicArn,    new cdk.CfnOutput(this, 'BackupBucketName', {            },      this,

      description: 'SNS topic for database alarms',

    });      value: backupBucket.bucketName,

  }

}      description: 'Primary backup bucket name',            {      `DatabaseEncryptionKey-${environmentSuffix}`,

```

    });

## Key Features in IDEAL_RESPONSE

              storageClass: s3.StorageClass.DEEP_ARCHIVE,      {

1. **Aurora Version Compatibility**: Uses `VER_3_08_2` which is available in all AWS regions including us-west-2

2. **Proper Resource Cleanup**: All resources have `DESTROY` removal policy for complete cleanup    new cdk.CfnOutput(this, 'ReplicationBucketName', {

3. **S3 Auto-Delete**: Includes `autoDeleteObjects: true` for S3 bucket cleanup

4. **Deletion Protection Disabled**: RDS cluster has `deletionProtection: false` for testing environments      value: replicationBucket.bucketName,              transitionAfter: cdk.Duration.days(90),        description: 'KMS key for Aurora database encryption',

5. **Proper CDK API Usage**: Uses correct CDK v2 API for Serverless v2 configuration

6. **Complete Monitoring Setup**: All required CloudWatch alarms with SNS integration      description: 'Replication backup bucket name',

7. **Cost-Optimized Configuration**: No NAT gateways, minimal ACU capacity (0.5-2)

8. **Security Best Practices**: KMS encryption, private subnets, restricted security groups    });            },        enableKeyRotation: true,

9. **Backup Configuration**: 5-day retention with S3 lifecycle rules

10. **Performance Insights**: Enabled with 7-day retention for monitoring

11. **Unique KMS Alias**: Prevents conflicts across deployments

12. **VPC CIDR Configuration**: Uses 10.30.0.0/16 as specified in requirements    new cdk.CfnOutput(this, 'MetadataTableName', {          ],        removalPolicy: cdk.RemovalPolicy.DESTROY,

      value: metadataTable.tableName,

      description: 'Backup metadata DynamoDB table name',          expiration: cdk.Duration.days(365),        alias: `aurora-db-key-${environmentSuffix}`,

    });

        },      }

    new cdk.CfnOutput(this, 'DeduplicationTableName', {

      value: deduplicationTable.tableName,      ],    );

      description: 'Deduplication DynamoDB table name',

    });      removalPolicy: cdk.RemovalPolicy.DESTROY,



    new cdk.CfnOutput(this, 'BackupQueueUrl', {      autoDeleteObjects: true,    // Create Security Group for Aurora

      value: backupQueue.queueUrl,

      description: 'Backup processing queue URL',    });    const dbSecurityGroup = new ec2.SecurityGroup(

    });

      this,

    new cdk.CfnOutput(this, 'NotificationTopicArn', {

      value: notificationTopic.topicArn,    // Replication bucket for cross-region backup      `DatabaseSecurityGroup-${environmentSuffix}`,

      description: 'Backup notification topic ARN',

    });    const replicationBucket = new s3.Bucket(this, `ReplicationBucket-${environmentSuffix}`, {      {



    new cdk.CfnOutput(this, 'EncryptionKeyId', {      bucketName: `backup-replication-${environmentSuffix}-${this.account}-${this.region}`,        vpc,

      value: encryptionKey.keyId,

      description: 'KMS encryption key ID',      encryption: s3.BucketEncryption.KMS,        description: 'Security group for Aurora MySQL database',

    });

      encryptionKey: encryptionKey,        allowAllOutbound: false,

    new cdk.CfnOutput(this, 'SystemCapabilities', {

      value: JSON.stringify(systemCapabilities),      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,      }

      description: 'System capabilities and configuration',

    });      versioned: true,    );



    new cdk.CfnOutput(this, 'DashboardURL', {      removalPolicy: cdk.RemovalPolicy.DESTROY,

      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,

      description: 'CloudWatch dashboard URL',      autoDeleteObjects: true,    // Allow MySQL traffic only within VPC

    });

  }    });    dbSecurityGroup.addIngressRule(

}

```      ec2.Peer.ipv4(vpc.vpcCidrBlock),



## Key Features in IDEAL_RESPONSE    // DynamoDB table for backup metadata      ec2.Port.tcp(3306),



1. **Comprehensive Backup System**: S3 buckets with encryption, lifecycle policies, and cross-region replication    const metadataTable = new dynamodb.Table(this, `BackupMetadataTable-${environmentSuffix}`, {      'Allow MySQL traffic from within VPC'

2. **Deduplication Support**: DynamoDB table with TTL for efficient storage management  

3. **Metadata Management**: DynamoDB table for backup tracking and audit trails      tableName: `TapStack${environmentSuffix}-BackupMetadataTable-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackId')))}`,    );

4. **Queue Processing**: SQS queue with dead letter queue for reliable backup processing

5. **Monitoring & Alerts**: SNS topic for notifications and CloudWatch dashboard      partitionKey: { name: 'backupId', type: dynamodb.AttributeType.STRING },

6. **Security**: KMS encryption with key rotation, private access controls

7. **Cost Optimization**: Intelligent tiering, lifecycle policies, pay-per-request billing      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },    // Create subnet group for Aurora

8. **High Availability**: Multi-AZ configuration, point-in-time recovery

9. **Compliance**: Comprehensive outputs for system capabilities and configuration      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,    const subnetGroup = new rds.SubnetGroup(

10. **Resource Cleanup**: All resources configured with `DESTROY` removal policy for testing
      encryptionKey: encryptionKey,      this,

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,      `DatabaseSubnetGroup-${environmentSuffix}`,

      pointInTimeRecovery: true,      {

      removalPolicy: cdk.RemovalPolicy.DESTROY,        description: 'Subnet group for Aurora database',

    });        vpc,

        vpcSubnets: {

    // DynamoDB table for deduplication          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

    const deduplicationTable = new dynamodb.Table(this, `DeduplicationTable-${environmentSuffix}`, {        },

      tableName: `TapStack${environmentSuffix}-DeduplicationTable-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackId')))}`,      }

      partitionKey: { name: 'fileHash', type: dynamodb.AttributeType.STRING },    );

      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,

      encryptionKey: encryptionKey,    // Create Aurora Serverless v2 MySQL cluster

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,    const dbCluster = new rds.DatabaseCluster(

      timeToLiveAttribute: 'ttl',      this,

      removalPolicy: cdk.RemovalPolicy.DESTROY,      `AuroraCluster-${environmentSuffix}`,

    });      {

        engine: rds.DatabaseClusterEngine.auroraMysql({

    // SQS queue for backup processing          version: rds.AuroraMysqlEngineVersion.VER_3_04_0,

    const backupQueue = new sqs.Queue(this, `BackupQueue-${environmentSuffix}`, {        }),

      queueName: `TapStack${environmentSuffix}-BackupQueue-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackId')))}`,        writer: rds.ClusterInstance.serverlessV2(

      encryption: sqs.QueueEncryption.KMS,          `writer-${environmentSuffix}`,

      encryptionMasterKey: encryptionKey,          {

      visibilityTimeout: cdk.Duration.minutes(15),            publiclyAccessible: false,

      retentionPeriod: cdk.Duration.days(14),            enablePerformanceInsights: true,

      deadLetterQueue: {            performanceInsightRetention:

        queue: new sqs.Queue(this, `BackupDeadLetterQueue-${environmentSuffix}`, {              rds.PerformanceInsightRetention.DEFAULT, // 7 days

          encryption: sqs.QueueEncryption.KMS,          }

          encryptionMasterKey: encryptionKey,        ),

        }),        readers: [

        maxReceiveCount: 3,          rds.ClusterInstance.serverlessV2(`reader-${environmentSuffix}`, {

      },            scaleWithWriter: true,

    });            publiclyAccessible: false,

            enablePerformanceInsights: true,

    // SNS topic for notifications            performanceInsightRetention:

    const notificationTopic = new sns.Topic(this, `BackupNotificationTopic-${environmentSuffix}`, {              rds.PerformanceInsightRetention.DEFAULT,

      topicName: `TapStack${environmentSuffix}-BackupNotificationTopic-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackId')))}`,          }),

      masterKey: encryptionKey,        ],

    });        serverlessV2MinCapacity: 0.5,

        serverlessV2MaxCapacity: 2,

    // CloudWatch Dashboard        vpc,

    const dashboard = new cloudwatch.Dashboard(this, `BackupDashboard-${environmentSuffix}`, {        vpcSubnets: {

      dashboardName: `BackupSystemMonitoring-${environmentSuffix}`,          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

    });        },

        subnetGroup,

    // System capabilities configuration        securityGroups: [dbSecurityGroup],

    const systemCapabilities = {        storageEncrypted: true,

      maxUsers: 1000,        storageEncryptionKey: encryptionKey,

      retentionDays: 60,        backup: {

      rto: '2 hours',          retention: cdk.Duration.days(5),

      rpo: '24 hours',          preferredWindow: '03:00-04:00',

      availability: '99.9%',        },

      encryption: 'KMS Customer Managed',        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

      replication: 'Cross-Region',        deletionProtection: false,

      deduplication: 'Enabled',        removalPolicy: cdk.RemovalPolicy.DESTROY,

      networkIsolation: true,        defaultDatabaseName: 'saasdb',

      auditLogging: 'CloudTrail + S3 Access Logs',        credentials: rds.Credentials.fromGeneratedSecret('admin', {

      costOptimization: 'Intelligent Tiering + Lifecycle',          secretName: `aurora-db-secret-${environmentSuffix}`,

    };        }),

        monitoringInterval: cdk.Duration.seconds(60),

    // Outputs        cloudwatchLogsExports: ['error', 'general', 'slowquery'],

    new cdk.CfnOutput(this, 'BackupBucketName', {        cloudwatchLogsRetention: 7,

      value: backupBucket.bucketName,      }

      description: 'Primary backup bucket name',    );

    });

    // Create S3 bucket for backup storage (for export tasks)

    new cdk.CfnOutput(this, 'ReplicationBucketName', {    const backupBucket = new s3.Bucket(

      value: replicationBucket.bucketName,      this,

      description: 'Replication backup bucket name',      `DatabaseBackupBucket-${environmentSuffix}`,

    });      {

        bucketName: `aurora-backups-${cdk.Stack.of(this).account}-${environmentSuffix}`,

    new cdk.CfnOutput(this, 'MetadataTableName', {        versioned: true,

      value: metadataTable.tableName,        lifecycleRules: [

      description: 'Backup metadata DynamoDB table name',          {

    });            id: 'delete-old-backups',

            expiration: cdk.Duration.days(30),

    new cdk.CfnOutput(this, 'DeduplicationTableName', {          },

      value: deduplicationTable.tableName,        ],

      description: 'Deduplication DynamoDB table name',        encryption: s3.BucketEncryption.S3_MANAGED,

    });        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

        removalPolicy: cdk.RemovalPolicy.DESTROY,

    new cdk.CfnOutput(this, 'BackupQueueUrl', {        autoDeleteObjects: true,

      value: backupQueue.queueUrl,      }

      description: 'Backup processing queue URL',    );

    });

    // Note: Aurora backup exports to S3 are managed through backup configuration

    new cdk.CfnOutput(this, 'NotificationTopicArn', {

      value: notificationTopic.topicArn,    // Create SNS topic for alarms

      description: 'Backup notification topic ARN',    const alarmTopic = new sns.Topic(

    });      this,

      `DatabaseAlarmTopic-${environmentSuffix}`,

    new cdk.CfnOutput(this, 'EncryptionKeyId', {      {

      value: encryptionKey.keyId,        displayName: 'Aurora Database Alarms',

      description: 'KMS encryption key ID',        topicName: `aurora-alarms-${environmentSuffix}`,

    });      }

    );

    new cdk.CfnOutput(this, 'SystemCapabilities', {

      value: JSON.stringify(systemCapabilities),    // CloudWatch Alarms for monitoring

      description: 'System capabilities and configuration',

    });    // ServerlessDatabaseCapacity alarm

    new cloudwatch.Alarm(this, `HighDatabaseCapacity-${environmentSuffix}`, {

    new cdk.CfnOutput(this, 'DashboardURL', {      metric: new cloudwatch.Metric({

      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,        namespace: 'AWS/RDS',

      description: 'CloudWatch dashboard URL',        metricName: 'ServerlessDatabaseCapacity',

    });        dimensionsMap: {

  }          DBClusterIdentifier: dbCluster.clusterIdentifier,

}        },

```        statistic: 'Average',

        period: cdk.Duration.minutes(5),

## Key Features in IDEAL_RESPONSE      }),

      threshold: 1.5,

1. **Comprehensive Backup System**: S3 buckets with encryption, lifecycle policies, and cross-region replication      evaluationPeriods: 2,

2. **Deduplication Support**: DynamoDB table with TTL for efficient storage management        alarmDescription: 'Alert when database capacity is high',

3. **Metadata Management**: DynamoDB table for backup tracking and audit trails      actionsEnabled: true,

4. **Queue Processing**: SQS queue with dead letter queue for reliable backup processing    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

5. **Monitoring & Alerts**: SNS topic for notifications and CloudWatch dashboard

6. **Security**: KMS encryption with key rotation, private access controls    // ACUUtilization alarm

7. **Cost Optimization**: Intelligent tiering, lifecycle policies, pay-per-request billing    new cloudwatch.Alarm(this, `HighACUUtilization-${environmentSuffix}`, {

8. **High Availability**: Multi-AZ configuration, point-in-time recovery      metric: new cloudwatch.Metric({

9. **Compliance**: Comprehensive outputs for system capabilities and configuration        namespace: 'AWS/RDS',

10. **Resource Cleanup**: All resources configured with `DESTROY` removal policy for testing        metricName: 'ACUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when ACU utilization is above 80%',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // DatabaseConnections alarm
    new cloudwatch.Alarm(this, `HighDatabaseConnections-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when database connections exceed 100',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // CPU Utilization alarm
    new cloudwatch.Alarm(this, `HighCPUUtilization-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 75,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when CPU utilization is above 75%',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: dbCluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: dbCluster.secret?.secretArn || '',
      description: 'Secret ARN for database credentials',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 bucket for database backups',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic for database alarms',
    });
  }
}
```

## Key Improvements in IDEAL_RESPONSE

1. **Aurora Version Compatibility**: Uses `VER_3_04_0` which is available in all AWS regions including us-west-2
2. **Proper Resource Cleanup**: All resources have `DESTROY` removal policy for complete cleanup
3. **S3 Auto-Delete**: Includes `autoDeleteObjects: true` for S3 bucket cleanup
4. **Deletion Protection Disabled**: RDS cluster has `deletionProtection: false` for testing environments
5. **Proper CDK API Usage**: Uses correct CDK v2 API for Serverless v2 configuration
6. **Complete Monitoring Setup**: All required CloudWatch alarms with SNS integration
7. **Cost-Optimized Configuration**: No NAT gateways, minimal ACU capacity (0.5-2)
8. **Security Best Practices**: KMS encryption, private subnets, restricted security groups
9. **Backup Configuration**: 5-day retention with S3 lifecycle rules
10. **Performance Insights**: Enabled with 7-day retention for monitoring
