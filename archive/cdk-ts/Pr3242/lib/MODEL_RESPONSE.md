# Infrastructure Code for Retail Database System

Here's the complete CDK TypeScript implementation for the retail database system:

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create Network Stack
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Create Backup Stack
    const backupStack = new BackupStack(this, 'BackupStack', {
      environmentSuffix,
    });

    // Create Database Stack
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.databaseSecurityGroup,
      backupBucket: backupStack.backupBucket,
      environmentSuffix,
    });

    // Create Monitoring Stack
    new MonitoringStack(this, 'MonitoringStack', {
      database: databaseStack.database,
      environmentSuffix,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // Create VPC with specific CIDR
    this.vpc = new ec2.Vpc(this, 'RetailVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC endpoints for S3
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // Create Security Group for RDS
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from within VPC
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.2.0.0/16'),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    // Allow HTTPS for S3 backup connectivity
    this.databaseSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('10.2.0.0/16'),
      ec2.Port.tcp(443),
      'Allow HTTPS for S3 backups'
    );

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  backupBucket: s3.Bucket;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create KMS key for database encryption
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: 'KMS key for RDS PostgreSQL encryption',
      enableKeyRotation: true,
      alias: `retail-db-key-${props.environmentSuffix}`,
    });

    // Create database credentials secret
    const databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Create subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS PostgreSQL',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'RetailDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_5,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      subnetGroup: subnetGroup,
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      multiAz: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: encryptionKey,
      monitoringInterval: cdk.Duration.seconds(60),
      databaseName: 'retaildb',
      parameterGroup: new rds.ParameterGroup(this, 'ParameterGroup', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_5,
        }),
        parameters: {
          'log_statement': 'all',
          'log_duration': 'on',
          'shared_preload_libraries': 'pg_stat_statements',
        },
      }),
    });

    // Grant backup bucket permissions
    props.backupBucket.grantReadWrite(this.database);

    // Output database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: 'RDS PostgreSQL port',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## File: lib/backup-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BackupStackProps {
  environmentSuffix: string;
}

export class BackupStack extends Construct {
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id);

    // Create S3 bucket for database backups
    this.backupBucket = new s3.Bucket(this, 'DatabaseBackupBucket', {
      bucketName: `retail-db-backups-${cdk.Stack.of(this).account}-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldBackups',
          enabled: true,
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
        {
          id: 'CleanupIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Output bucket name
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket for database backups',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  database: rds.DatabaseInstance;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'DatabaseAlerts', {
      displayName: `Retail Database Alerts - ${props.environmentSuffix}`,
      topicName: `retail-db-alerts-${props.environmentSuffix}`,
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'DatabaseDashboard', {
      dashboardName: `retail-database-${props.environmentSuffix}`,
    });

    // CPU Utilization Widget
    const cpuWidget = new cloudwatch.GraphWidget({
      title: 'CPU Utilization',
      left: [props.database.metricCPUUtilization()],
      width: 12,
      height: 6,
    });

    // Database Connections Widget
    const connectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [props.database.metricDatabaseConnections()],
      width: 12,
      height: 6,
    });

    // Free Storage Space Widget
    const storageWidget = new cloudwatch.GraphWidget({
      title: 'Free Storage Space',
      left: [props.database.metricFreeStorageSpace()],
      width: 12,
      height: 6,
    });

    // Read/Write IOPS Widget
    const iopsWidget = new cloudwatch.GraphWidget({
      title: 'Read/Write IOPS',
      left: [
        props.database.metricReadIOPS({ label: 'Read IOPS' }),
        props.database.metricWriteIOPS({ label: 'Write IOPS' }),
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(cpuWidget, connectionsWidget);
    dashboard.addWidgets(storageWidget, iopsWidget);

    // Create CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: props.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when CPU utilization exceeds 80%',
    });
    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const storageAlarm = new cloudwatch.Alarm(this, 'LowStorageAlarm', {
      metric: props.database.metricFreeStorageSpace(),
      threshold: 2 * 1024 * 1024 * 1024, // 2 GB in bytes
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when free storage space falls below 2GB',
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
    storageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(this, 'HighConnectionsAlarm', {
      metric: props.database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when database connections exceed 80',
    });
    connectionAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Output dashboard URL
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```