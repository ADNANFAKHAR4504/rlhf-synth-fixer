import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly backupBucket: s3.Bucket;
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly database: rds.DatabaseInstance; // Alias for tests
  public readonly monitoringTopic: sns.Topic;
  public readonly dbEndpoint: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for encryption in us-east-1
    this.kmsKey = new kms.Key(this, `KmsKey-${environmentSuffix}`, {
      description: `KMS key for resources - ${environmentSuffix}`,
      enableKeyRotation: false, // Disabled for testing/destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC in us-east-1
    this.vpc = new ec2.Vpc(this, `Vpc-${environmentSuffix}`, {
      vpcName: `vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // VPC Endpoints for AWS services
    this.vpc.addInterfaceEndpoint(`RdsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
    });

    this.vpc.addInterfaceEndpoint(`SnsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
    });

    this.vpc.addInterfaceEndpoint(
      `CloudwatchLogsEndpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      }
    );

    this.vpc.addInterfaceEndpoint(`EventsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_EVENTS,
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for RDS instance - ${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for Lambda functions - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // SNS Topic for alerts
    this.monitoringTopic = new sns.Topic(
      this,
      `MonitoringTopic-${environmentSuffix}`,
      {
        topicName: `monitoring-topic-${environmentSuffix}`,
        displayName: 'Monitoring Alerts',
      }
    );

    // S3 Bucket for backups
    this.backupBucket = new s3.Bucket(
      this,
      `BackupBucket-${environmentSuffix}`,
      {
        bucketName: `backup-bucket-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `db-subnet-group-${environmentSuffix}`,
        description: `Subnet group for RDS instance - ${environmentSuffix}`,
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS PostgreSQL Instance with Multi-AZ for high availability
    this.dbInstance = new rds.DatabaseInstance(
      this,
      `DbInstance-${environmentSuffix}`,
      {
        instanceIdentifier: `postgres-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [dbSecurityGroup],
        subnetGroup: dbSubnetGroup,
        multiAz: true, // High availability within us-east-1
        allocatedStorage: 100,
        maxAllocatedStorage: 500,
        storageType: rds.StorageType.GP3,
        storageEncrypted: true,
        storageEncryptionKey: this.kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        cloudwatchLogsExports: ['postgresql', 'upgrade'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: this.kmsKey,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        parameterGroup: rds.ParameterGroup.fromParameterGroupName(
          this,
          `DbParameterGroup-${environmentSuffix}`,
          'default.postgres14'
        ),
      }
    );
    this.database = this.dbInstance; // Alias for test compatibility

    // CloudWatch Alarms for database monitoring
    const dbCpuAlarm = new cloudwatch.Alarm(
      this,
      `DbCpuAlarm-${environmentSuffix}`,
      {
        alarmName: `db-cpu-alarm-${environmentSuffix}`,
        metric: this.dbInstance.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const dbConnectionsAlarm = new cloudwatch.Alarm(
      this,
      `DbConnectionsAlarm-${environmentSuffix}`,
      {
        alarmName: `db-connections-alarm-${environmentSuffix}`,
        metric: this.dbInstance.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Add SNS action to alarms
    dbCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.monitoringTopic)
    );
    dbConnectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.monitoringTopic)
    );

    // Store DB endpoint for outputs
    this.dbEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Outputs - exposing all important resource identifiers for flat-output.json
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `VpcCidr-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbEndpoint,
      description: 'Database Endpoint',
      exportName: `DbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DbInstanceIdentifier', {
      value: this.dbInstance.instanceIdentifier,
      description: 'Database Instance Identifier',
      exportName: `DbInstanceIdentifier-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DbPort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'Database Port',
      exportName: `DbPort-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'Backup Bucket ARN',
      exportName: `BackupBucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'Backup Bucket Name',
      exportName: `BackupBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN',
      exportName: `KmsKeyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `KmsKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MonitoringTopicArn', {
      value: this.monitoringTopic.topicArn,
      description: 'SNS Monitoring Topic ARN',
      exportName: `MonitoringTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MonitoringTopicName', {
      value: this.monitoringTopic.topicName,
      description: 'SNS Monitoring Topic Name',
      exportName: `MonitoringTopicName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
      exportName: `DbSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Lambda Security Group ID',
      exportName: `LambdaSecurityGroupId-${environmentSuffix}`,
    });
  }
}
