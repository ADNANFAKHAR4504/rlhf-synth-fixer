import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface InfrastructureStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbCluster: rds.DatabaseCluster;
  public readonly backupBucket: s3.Bucket;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create a VPC with only private isolated subnets (no NAT Gateway)
    this.vpc = new ec2.Vpc(this, `AuroraVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.30.0.0/16'),
      maxAzs: 2, // Use 2 AZs for high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // No NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PrivateIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create KMS key for encryption at rest
    const encryptionKey = new kms.Key(
      this,
      `AuroraEncryptionKey-${environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: 'KMS key for Aurora database encryption',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Generate unique alias name using stack name to avoid conflicts
    const uniqueId = cdk.Names.uniqueId(this).toLowerCase().substring(0, 8);
    new kms.Alias(this, `AuroraKeyAlias-${environmentSuffix}`, {
      aliasName: `alias/aurora-db-key-${environmentSuffix}-${uniqueId}`,
      targetKey: encryptionKey,
    });

    // Create security group for Aurora
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `AuroraSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Aurora MySQL database',
        allowAllOutbound: false,
      }
    );

    // Allow MySQL traffic only from within the VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from VPC'
    );

    // Create a DB subnet group
    const subnetGroup = new rds.SubnetGroup(
      this,
      `AuroraSubnetGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        description: 'Subnet group for Aurora database',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create Aurora MySQL Serverless v2 cluster
    this.dbCluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_08_2,
        }),
        writer: rds.ClusterInstance.serverlessV2(
          `writer-${environmentSuffix}`,
          {
            publiclyAccessible: false,
            enablePerformanceInsights: true,
            performanceInsightRetention:
              rds.PerformanceInsightRetention.DEFAULT, // 7 days
          }
        ),
        readers: [
          rds.ClusterInstance.serverlessV2(`reader-${environmentSuffix}`, {
            scaleWithWriter: true,
            publiclyAccessible: false,
            enablePerformanceInsights: true,
            performanceInsightRetention:
              rds.PerformanceInsightRetention.DEFAULT,
          }),
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
