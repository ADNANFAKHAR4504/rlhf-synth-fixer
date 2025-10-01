I'll create the infrastructure code for a secure RDS Aurora MySQL database deployment using AWS CDK with TypeScript. Here's the complete implementation:

## infrastructure-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface InfrastructureStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with private subnets
    const vpc = new ec2.Vpc(this, `DatabaseVPC-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 0, // No NAT gateways for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      ipAddresses: ec2.IpAddresses.cidr('10.30.0.0/16'),
    });

    // Override subnet CIDR blocks
    const cfnSubnet1 = vpc.isolatedSubnets[0].node.defaultChild as ec2.CfnSubnet;
    cfnSubnet1.cidrBlock = '10.30.10.0/24';

    const cfnSubnet2 = vpc.isolatedSubnets[1].node.defaultChild as ec2.CfnSubnet;
    cfnSubnet2.cidrBlock = '10.30.20.0/24';

    // Create KMS key for database encryption
    const encryptionKey = new kms.Key(this, `DatabaseEncryptionKey-${environmentSuffix}`, {
      description: 'KMS key for Aurora database encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      alias: `aurora-db-key-${environmentSuffix}`,
    });

    // Create Security Group for Aurora
    const dbSecurityGroup = new ec2.SecurityGroup(this, `DatabaseSecurityGroup-${environmentSuffix}`, {
      vpc,
      description: 'Security group for Aurora MySQL database',
      allowAllOutbound: false,
    });

    // Allow MySQL traffic only within VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from within VPC'
    );

    // Create subnet group for Aurora
    const subnetGroup = new rds.SubnetGroup(this, `DatabaseSubnetGroup-${environmentSuffix}`, {
      description: 'Subnet group for Aurora database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create Aurora Serverless v2 MySQL cluster
    const dbCluster = new rds.DatabaseCluster(this, `AuroraCluster-${environmentSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_05_2,
      }),
      serverlessV2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      writer: rds.ClusterInstance.serverlessV2(`writer-${environmentSuffix}`, {
        publiclyAccessible: false,
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT, // 7 days
      }),
      readers: [
        rds.ClusterInstance.serverlessV2(`reader-${environmentSuffix}`, {
          scaleWithWriter: true,
          publiclyAccessible: false,
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        }),
      ],
      vpc,
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
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      defaultDatabaseName: 'saasdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `aurora-db-secret-${environmentSuffix}`,
      }),
      monitoringInterval: cdk.Duration.seconds(60),
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      cloudwatchLogsRetention: 7,
    });

    // Create S3 bucket for backup storage (for export tasks)
    const backupBucket = new s3.Bucket(this, `DatabaseBackupBucket-${environmentSuffix}`, {
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant Aurora permissions to write to S3 bucket
    backupBucket.grantWrite(dbCluster);

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, `DatabaseAlarmTopic-${environmentSuffix}`, {
      displayName: 'Aurora Database Alarms',
      topicName: `aurora-alarms-${environmentSuffix}`,
    });

    // CloudWatch Alarms for monitoring

    // ServerlessDatabaseCapacity alarm
    new cloudwatch.Alarm(this, `HighDatabaseCapacity-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ServerlessDatabaseCapacity',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1.5,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when database capacity is high',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // ACUUtilization alarm
    new cloudwatch.Alarm(this, `HighACUUtilization-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ACUUtilization',
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