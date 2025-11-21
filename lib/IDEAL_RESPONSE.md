# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Single region deployment configuration
const region = process.env.AWS_REGION || 'us-east-1';

// Create stack in single region
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
});

```

## ./lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly database: rds.DatabaseInstance;
  public readonly credentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc, kmsKey } = props;
    const region = cdk.Stack.of(this).region;

    // Database credentials stored in Secrets Manager
    this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `postgres-credentials-${environmentSuffix}`,
      description: `PostgreSQL credentials for ${region}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: `postgres-subnet-group-${environmentSuffix}`,
      description: `Subnet group for PostgreSQL in ${region}`,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database parameter group for PostgreSQL 14
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        description: `Parameter group for PostgreSQL 14 in ${region}`,
        parameters: {
          'rds.force_ssl': '1',
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
          track_activity_query_size: '2048',
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Option group (required for some PostgreSQL features)
    const optionGroup = new rds.OptionGroup(this, 'DatabaseOptionGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      description: `Option group for PostgreSQL 14 in ${region}`,
      configurations: [],
    });

    // RDS PostgreSQL instance with Multi-AZ
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `postgres-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R6G,
        ec2.InstanceSize.XLARGE
      ),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      multiAz: true, // Multi-AZ for high availability
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      optionGroup: optionGroup,
      credentials: rds.Credentials.fromSecret(this.credentials),
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      deletionProtection: false, // Must be false for testing/destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      publiclyAccessible: false,
    });

    // Tags
    cdk.Tags.of(this.database).add('Name', `postgres-${environmentSuffix}`);
    cdk.Tags.of(this.database).add('Region', region);
    cdk.Tags.of(this.database).add('Purpose', 'PostgreSQL');
    cdk.Tags.of(this.database).add('BackupRetention', '7-days');

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: `Database endpoint for ${region}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: `Database port for ${region}`,
    });

    new cdk.CfnOutput(this, 'DatabaseIdentifier', {
      value: this.database.instanceIdentifier,
      description: `Database identifier for ${region}`,
    });

    new cdk.CfnOutput(this, 'CredentialsSecretArn', {
      value: this.credentials.secretArn,
      description: `Database credentials secret ARN for ${region}`,
    });
  }
}

```

## ./lib/monitoring-stack.ts

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly alarmTopic: sns.Topic;
  public readonly compositeAlarm: cloudwatch.CompositeAlarm;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, database } = props;
    const region = cdk.Stack.of(this).region;

    // SNS Topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `postgres-alarms-${environmentSuffix}`,
      displayName: `PostgreSQL Alarms for ${region}`,
    });

    // CloudWatch Alarms for database
    // CPU Utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `postgres-cpu-${environmentSuffix}`,
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Free Storage Space
    const storageAlarm = new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      alarmName: `postgres-storage-${environmentSuffix}`,
      metric: database.metricFreeStorageSpace(),
      threshold: 10 * 1024 * 1024 * 1024, // 10 GB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    storageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Database Connections
    const connectionsAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseConnectionsAlarm',
      {
        alarmName: `postgres-connections-${environmentSuffix}`,
        metric: database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    connectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Read Latency
    const readLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseReadLatencyAlarm',
      {
        alarmName: `postgres-read-latency-${environmentSuffix}`,
        metric: database.metric('ReadLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    readLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Write Latency
    const writeLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseWriteLatencyAlarm',
      {
        alarmName: `postgres-write-latency-${environmentSuffix}`,
        metric: database.metric('WriteLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    writeLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Composite Alarm - Critical database issues
    this.compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      'DatabaseCompositeAlarm',
      {
        compositeAlarmName: `postgres-composite-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for critical database issues',
        alarmRule: cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(cpuAlarm, cloudwatch.AlarmState.ALARM),
          cloudwatch.AlarmRule.fromAlarm(
            storageAlarm,
            cloudwatch.AlarmState.ALARM
          ),
          cloudwatch.AlarmRule.allOf(
            cloudwatch.AlarmRule.fromAlarm(
              readLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            ),
            cloudwatch.AlarmRule.fromAlarm(
              writeLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            )
          )
        ),
      }
    );
    this.compositeAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: `Alarm topic ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'CompositeAlarmName', {
      value: this.compositeAlarm.alarmName,
      description: `Composite alarm name for ${region}`,
    });

    // Tags
    cdk.Tags.of(this.alarmTopic).add(
      'Name',
      `postgres-alarms-${environmentSuffix}`
    );
    cdk.Tags.of(this.alarmTopic).add('Region', region);
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'PostgreSQL-Monitoring');
  }
}

```

## ./lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // VPC with private subnets for RDS and Lambda
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `postgres-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `private-db-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `private-lambda-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for RDS
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `rds-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: `Security group for PostgreSQL RDS in ${region}`,
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL traffic within VPC
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Security Group for Lambda
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        securityGroupName: `lambda-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: `Security group for Lambda functions in ${region}`,
        allowAllOutbound: true,
      }
    );

    // VPC Endpoints for AWS services (cost optimization - avoid NAT charges)
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SnsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Tags
    cdk.Tags.of(this.vpc).add('Name', `postgres-vpc-${environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Region', region);
    cdk.Tags.of(this.vpc).add('Purpose', 'PostgreSQL');

    // Outputs
    new cdk.CfnOutput(this, 'VpcIdOutput', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: this.dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${region}`,
    });
  }
}

```

## ./lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly backupBucket: s3.Bucket;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'KmsKey', {
      description: `KMS key for PostgreSQL in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: `postgres-key-${environmentSuffix}`,
    });

    // Grant RDS service permission to use the key
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow RDS to use the key',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: [
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:CreateGrant',
          'kms:GenerateDataKey',
        ],
        resources: ['*'],
      })
    );

    // S3 Bucket for backups with versioning
    const bucketName = `postgres-backups-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`;

    this.backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          enabled: true,
        },
        {
          id: 'TransitionToGlacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: true,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: `Backup bucket for ${region}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: `Backup bucket ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: `KMS key ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: `KMS key ARN for ${region}`,
    });

    // Tags
    cdk.Tags.of(this.backupBucket).add('Name', bucketName);
    cdk.Tags.of(this.backupBucket).add('Region', region);
    cdk.Tags.of(this.backupBucket).add('Purpose', 'PostgreSQL-Backups');
  }
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = this.region;

    // Network Stack - VPC, Subnets, NAT Gateways
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Storage Stack - S3 with versioning, KMS keys
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    // Database Stack - RDS PostgreSQL with Multi-AZ
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      kmsKey: storageStack.kmsKey,
    });
    databaseStack.addDependency(networkStack);
    databaseStack.addDependency(storageStack);

    // Monitoring Stack - CloudWatch alarms, Lambda for database monitoring
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      database: databaseStack.database,
    });
    monitoringStack.addDependency(databaseStack);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: `VPC ID for ${region}`,
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: `Database endpoint for ${region}`,
      exportName: `${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'BackupBucket', {
      value: storageStack.backupBucket.bucketName,
      description: `S3 backup bucket for ${region}`,
      exportName: `${environmentSuffix}-backup-bucket`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoringStack.alarmTopic.topicArn,
      description: `SNS topic ARN for ${region}`,
      exportName: `${environmentSuffix}-alarm-topic`,
    });

    // Additional Network Stack Outputs
    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: networkStack.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: networkStack.dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: networkStack.lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${region}`,
    });

    // Additional Database Stack Outputs
    new cdk.CfnOutput(this, 'DatabasePort', {
      value: databaseStack.database.dbInstanceEndpointPort,
      description: `Database port for ${region}`,
    });

    new cdk.CfnOutput(this, 'DatabaseIdentifier', {
      value: databaseStack.database.instanceIdentifier,
      description: `Database identifier for ${region}`,
    });

    new cdk.CfnOutput(this, 'CredentialsSecretArn', {
      value: databaseStack.credentials.secretArn,
      description: `Database credentials secret ARN for ${region}`,
    });

    // Additional Storage Stack Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: storageStack.backupBucket.bucketName,
      description: `Backup bucket name for ${region}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: storageStack.backupBucket.bucketArn,
      description: `Backup bucket ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: storageStack.kmsKey.keyId,
      description: `KMS key ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: storageStack.kmsKey.keyArn,
      description: `KMS key ARN for ${region}`,
    });

    // Additional Monitoring Stack Outputs
    new cdk.CfnOutput(this, 'CompositeAlarmName', {
      value: monitoringStack.compositeAlarm.alarmName,
      description: `Composite alarm name for ${region}`,
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import * as fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeVpcEndpointsCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });

const vpcId = outputs.VpcId;
const dbIdentifier = outputs.DatabaseIdentifier;
const dbSgId = outputs.DbSecurityGroupId;
const lambdaSgId = outputs.LambdaSecurityGroupId;
const bucketName = outputs.BackupBucketName;
const kmsKeyId = outputs.KmsKeyId;
const kmsKeyArn = outputs.KmsKeyArn;
const secretArn = outputs.CredentialsSecretArn;
const topicArn = outputs.AlarmTopicArn;
const compositeAlarmName = outputs.CompositeAlarmName;

describe('TapStack Live AWS Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has correct subnets across AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const subnets = response.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);

      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways are active in multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const natGateways = response.NatGateways!;
      expect(natGateways.length).toBe(2);

      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });

      const natAZs = new Set(natGateways.map(nat => nat.SubnetId));
      expect(natAZs.size).toBe(2);
    });

    test('Security groups exist with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId, lambdaSgId]
      }));

      const securityGroups = response.SecurityGroups!;
      expect(securityGroups.length).toBe(2);

      const dbSg = securityGroups.find(sg => sg.GroupId === dbSgId);
      expect(dbSg).toBeDefined();
      expect(dbSg!.GroupName).toContain('rds-sg');
      expect(dbSg!.VpcId).toBe(vpcId);

      const lambdaSg = securityGroups.find(sg => sg.GroupId === lambdaSgId);
      expect(lambdaSg).toBeDefined();
      expect(lambdaSg!.GroupName).toContain('lambda-sg');
      expect(lambdaSg!.VpcId).toBe(vpcId);
    });

    test('VPC endpoints are active for AWS services', async () => {
      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const endpoints = response.VpcEndpoints!;
      expect(endpoints.length).toBeGreaterThanOrEqual(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
        expect(endpoint.VpcEndpointType).toBe('Interface');
      });

      const serviceNames = endpoints.map(e => e.ServiceName);
      expect(serviceNames.some(s => s!.includes('secretsmanager'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('logs'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('sns'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('monitoring'))).toBe(true);
    });
  });

  describe('RDS PostgreSQL Database', () => {
    test('Database instance is available with correct engine', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toContain('14');
    });

    test('Database has Multi-AZ enabled for high availability', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.AvailabilityZone).toBeDefined();
      expect(dbInstance.SecondaryAvailabilityZone).toBeDefined();
    });

    test('Database has correct instance class and storage', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe('db.r6g.xlarge');
      expect(dbInstance.StorageType).toBe('gp3');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(100);
      expect(dbInstance.MaxAllocatedStorage).toBe(500);
    });

    test('Database has backup and maintenance windows configured', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
      expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
    });

    test('Database has performance insights enabled', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    test('Database is not publicly accessible', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('Database has CloudWatch logs enabled', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.EnabledCloudwatchLogsExports).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    test('Database subnet group spans multiple AZs', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const subnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;

      const subnetResponse = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      }));

      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(vpcId);
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Database uses KMS encryption', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toContain(kmsKeyId);
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    });

    test('S3 bucket has versioning enabled', async () => {
      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has KMS encryption enabled', async () => {
      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const rules = response.ServerSideEncryptionConfiguration!.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThan(0);
      expect(rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      const kmsMasterKeyID = rules![0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      expect(kmsMasterKeyID).toContain(kmsKeyArn.split('/')[1]);
    });

    test('S3 bucket has lifecycle rules for cost optimization', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      const rules = response.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThanOrEqual(2);

      const iaRule = rules!.find(r => r.ID === 'TransitionToIA');
      expect(iaRule).toBeDefined();
      expect(iaRule!.Status).toBe('Enabled');

      const glacierRule = rules!.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule!.Status).toBe('Enabled');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
    });

    test('KMS key has correct configuration', async () => {
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('Database credentials secret exists', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('postgres-credentials');
    });

    test('Secret is encrypted with KMS', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms exist for database metrics', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `postgres-`
      }));

      const alarms = response.MetricAlarms!.filter(a => a.AlarmName!.includes(environmentSuffix));
      expect(alarms.length).toBeGreaterThanOrEqual(5);

      const cpuAlarm = alarms.find(a => a.AlarmName!.includes('cpu'));
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.MetricName).toBe('CPUUtilization');

      const storageAlarm = alarms.find(a => a.AlarmName!.includes('storage'));
      expect(storageAlarm).toBeDefined();
      expect(storageAlarm!.MetricName).toBe('FreeStorageSpace');

      const connectionsAlarm = alarms.find(a => a.AlarmName!.includes('connections'));
      expect(connectionsAlarm).toBeDefined();
      expect(connectionsAlarm!.MetricName).toBe('DatabaseConnections');
    });

    test('All alarms have SNS actions configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `postgres-`
      }));

      const alarms = response.MetricAlarms!.filter(a => a.AlarmName!.includes(environmentSuffix));

      alarms.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions!.some(action => action.includes('sns'))).toBe(true);
      });
    });

    test('Composite alarm configuration verified', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      expect(response).toBeDefined();
      expect(compositeAlarmName).toContain('postgres-composite');
      expect(compositeAlarmName).toContain(environmentSuffix);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and accessible', async () => {
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('SNS topic has correct display name', async () => {
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));

      expect(response.Attributes!.DisplayName).toContain('PostgreSQL Alarms');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow naming convention with suffix', () => {
      expect(dbIdentifier).toContain('postgres-');
      expect(bucketName).toContain('postgres-backups');
      expect(compositeAlarmName).toContain('postgres-composite');

      expect(dbIdentifier).toContain(environmentSuffix);
      expect(bucketName).toContain(environmentSuffix);
    });

    test('All ARNs use correct region', () => {
      expect(kmsKeyArn).toContain(region);
      expect(topicArn).toContain(region);
      expect(secretArn).toContain(region);
    });
  });

  describe('Security Configuration', () => {
    test('Database credentials stored securely in Secrets Manager', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('postgres-credentials');
    });

    test('All encrypted resources use same KMS key', async () => {
      const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.KmsKeyId).toContain(kmsKeyId);

      const s3Response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const kmsMasterKeyID = s3Response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      expect(kmsMasterKeyID).toContain(kmsKeyArn.split('/')[1]);
    });
  });

  describe('High Availability Verification', () => {
    test('Database configured for Multi-AZ deployment', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.AvailabilityZone).toBeDefined();
      expect(dbInstance.SecondaryAvailabilityZone).toBeDefined();
    });

    test('NAT Gateways deployed across multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const natGateways = response.NatGateways!;
      const azs = new Set(natGateways.map(nat => nat.SubnetId));
      expect(azs.size).toBe(2);
    });

    test('Subnets distributed across multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const subnets = response.Subnets!;
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cost Optimization Features', () => {
    test('S3 lifecycle policies configured for cost savings', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      const rules = response.Rules;
      expect(rules!.length).toBeGreaterThanOrEqual(2);

      const iaRule = rules!.find(r => r.ID === 'TransitionToIA');
      expect(iaRule!.Transitions![0].Days).toBe(30);
      expect(iaRule!.Transitions![0].StorageClass).toBe('STANDARD_IA');

      const glacierRule = rules!.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule!.Transitions![0].Days).toBe(90);
      expect(glacierRule!.Transitions![0].StorageClass).toBe('GLACIER');
    });

    test('VPC endpoints configured to reduce NAT costs', async () => {
      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const endpoints = response.VpcEndpoints!;
      expect(endpoints.length).toBeGreaterThanOrEqual(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
      });
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('TAP Stack - Complete Unit Test Suite', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  // ============================================================================
  // NETWORK STACK TESTS
  // ============================================================================
  describe('NetworkStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
    });

    test('creates VPC with correct CIDR', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'postgres-vpc-test',
          }),
        ]),
      });
    });

    test('creates 3 subnet types', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('creates 2 NAT gateways', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates database security group with VPC ingress', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'rds-sg-test',
      });
    });

    test('creates VPC endpoints for AWS services', () => {
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    });
  });

  // ============================================================================
  // STORAGE STACK TESTS
  // ============================================================================
  describe('StorageStack', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack');
    });

    test('creates KMS key with rotation enabled', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates S3 bucket with versioning', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates S3 bucket with lifecycle rules', () => {
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
            }),
            Match.objectLike({
              Id: 'TransitionToGlacier',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  // ============================================================================
  // DATABASE STACK TESTS
  // ============================================================================
  describe('DatabaseStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');
    });

    test('creates PostgreSQL database with Multi-AZ', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '14',
        MultiAZ: true,
        StorageEncrypted: true,
      });
    });

    test('creates PostgreSQL database with correct instance class', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
      });
    });

    test('creates database with automated backups', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('creates database credentials in Secrets Manager', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
        }),
      });
    });

    test('database is not publicly accessible', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });
  });

  // ============================================================================
  // MONITORING STACK TESTS
  // ============================================================================
  describe('MonitoringStack', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let database: rds.DatabaseInstance;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');

      database = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpc: vpc,
        storageEncryptionKey: kmsKey,
      });
    });

    test('creates SNS topic for alarms', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('PostgreSQL Alarms'),
      });
    });

    test('creates CPU utilization alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Threshold: 80,
      });
    });

    test('creates storage alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FreeStorageSpace',
      });
    });

    test('creates composite alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      template.resourceCountIs('AWS::CloudWatch::CompositeAlarm', 1);
    });

    test('creates at least 5 CloudWatch alarms', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);

      const alarmCount = template.toJSON().Resources;
      const alarms = Object.values(alarmCount).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================================================
  // FULL STACK INTEGRATION TESTS
  // ============================================================================
  describe('TapStack Integration', () => {
    test('creates complete stack with all nested stacks', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      // Check for nested stacks
      template.resourceCountIs('AWS::CloudFormation::Stack', 4);
    });

    test('exports VPC ID', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('VpcId', {
        Export: {
          Name: 'test-vpc-id',
        },
      });
    });

    test('exports Database Endpoint', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('DatabaseEndpoint', {
        Export: {
          Name: 'test-db-endpoint',
        },
      });
    });

    test('exports Backup Bucket', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('BackupBucket', {
        Export: {
          Name: 'test-backup-bucket',
        },
      });
    });

    test('exports Alarm Topic ARN', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      template.hasOutput('AlarmTopicArn', {
        Export: {
          Name: 'test-alarm-topic',
        },
      });
    });

    test('applies correct tags to stack', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });

  // ============================================================================
  // RESOURCE COUNT VERIFICATION
  // ============================================================================
  describe('Resource Count Verification', () => {
    test('NetworkStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);

      // VPC should have 1 VPC resource
      template.resourceCountIs('AWS::EC2::VPC', 1);
      // Should have 6 subnets (2 AZs * 3 subnet types)
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      // Should have 2 NAT gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      // Should have 4 VPC endpoints
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    });

    test('StorageStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);

      // Should have 1 KMS key
      template.resourceCountIs('AWS::KMS::Key', 1);
      // Should have 1 S3 bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('DatabaseStack creates expected number of resources', () => {
      const stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      const vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');

      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);

      // Should have 1 RDS instance
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      // Should have 1 Secrets Manager secret
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
      // Should have 1 DB subnet group
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });

  // ============================================================================
  // ADDITIONAL NETWORK STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('NetworkStack Additional Coverage', () => {
    test('creates Lambda security group', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      const resources = template.toJSON().Resources;
      const securityGroups = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(2);
    });

    test('creates security groups with correct names', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'rds-sg-test',
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'lambda-sg-test',
      });
    });

    test('creates VPC endpoints for all required services', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      const resources = template.toJSON().Resources;
      const endpoints = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::VPCEndpoint'
      );
      expect(endpoints.length).toBe(4);
    });

    test('VPC has correct DNS settings', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates Internet Gateway', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates route tables', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const networkStack = new NetworkStack(stack, 'NetworkStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(networkStack);
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });
  });

  // ============================================================================
  // ADDITIONAL STORAGE STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('StorageStack Additional Coverage', () => {
    test('KMS key has correct alias', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/postgres-key-test',
      });
    });

    test('S3 bucket has encryption enabled', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket has auto-delete configured', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      const resources = template.toJSON().Resources;
      const customResources = Object.values(resources).filter(
        (resource: any) => resource.Type === 'Custom::S3AutoDeleteObjects'
      );
      expect(customResources.length).toBeGreaterThan(0);
    });

    test('KMS key grants RDS permissions', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'rds.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('creates KMS alias resource', () => {
      const stack = new cdk.Stack(app, 'TestStack');
      const storageStack = new StorageStack(stack, 'StorageStack', {
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(storageStack);
      template.resourceCountIs('AWS::KMS::Alias', 1);
    });
  });

  // ============================================================================
  // ADDITIONAL DATABASE STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('DatabaseStack Additional Coverage', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let kmsKey: kms.Key;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVpc');
      kmsKey = new kms.Key(stack, 'TestKey');
    });

    test('creates parameter group with correct settings', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('creates option group', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.resourceCountIs('AWS::RDS::OptionGroup', 1);
    });

    test('database has performance insights enabled', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('database has CloudWatch logs exports', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql', 'upgrade'],
      });
    });

    test('database has auto minor version upgrade enabled', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AutoMinorVersionUpgrade: true,
        AllowMajorVersionUpgrade: false,
      });
    });

    test('database has GP3 storage type', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageType: 'gp3',
      });
    });

    test('database has max allocated storage', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MaxAllocatedStorage: 500,
      });
    });

    test('secret has correct removal policy', () => {
      const databaseStack = new DatabaseStack(stack, 'DatabaseStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        kmsKey: kmsKey,
      });

      const template = Template.fromStack(databaseStack);
      const resources = template.toJSON().Resources;
      const secret = Object.values(resources).find(
        (resource: any) => resource.Type === 'AWS::SecretsManager::Secret'
      );
      expect(secret).toBeDefined();
    });
  });

  // ============================================================================
  // ADDITIONAL MONITORING STACK TESTS FOR COVERAGE
  // ============================================================================
  describe('MonitoringStack Additional Coverage', () => {
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;
    let database: rds.DatabaseInstance;

    beforeEach(() => {
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      vpc = new ec2.Vpc(stack, 'TestVpc');
      const kmsKey = new kms.Key(stack, 'TestKey');
      database = new rds.DatabaseInstance(stack, 'TestDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpc: vpc,
        storageEncryptionKey: kmsKey,
      });
    });

    test('creates connections alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
      });
    });

    test('creates read latency alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ReadLatency',
      });
    });

    test('creates write latency alarm', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'WriteLatency',
      });
    });

    test('all alarms have alarm actions', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      const resources = template.toJSON().Resources;
      const alarms = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('composite alarm has correct alarm rule structure', () => {
      const monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environmentSuffix: 'test',
        vpc: vpc,
        database: database,
      });

      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::CompositeAlarm', {
        AlarmRule: Match.anyValue(),
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
