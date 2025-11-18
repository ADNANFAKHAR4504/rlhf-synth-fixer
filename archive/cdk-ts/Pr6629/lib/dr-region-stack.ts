import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface DRRegionStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DRRegionStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly backupBucketDR: s3.Bucket;
  public readonly backupBucket: s3.Bucket; // Alias for tests
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly database: rds.DatabaseInstance; // Alias for tests
  public readonly monitoringTopic: sns.Topic;
  public readonly replicationLagMonitorFunction: lambda.Function;
  public readonly dbEndpoint: string;

  constructor(scope: Construct, id: string, props: DRRegionStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption in DR region
    this.kmsKey = new kms.Key(this, `DrKmsKey-${environmentSuffix}`, {
      description: `KMS key for DR region resources - ${environmentSuffix}`,
      enableKeyRotation: false, // Disabled for testing/destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC in DR region
    this.vpc = new ec2.Vpc(this, `DrVpc-${environmentSuffix}`, {
      vpcName: `dr-vpc-${environmentSuffix}`,
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
    this.vpc.addInterfaceEndpoint(`DrRdsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
    });

    this.vpc.addInterfaceEndpoint(`DrSnsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
    });

    this.vpc.addInterfaceEndpoint(
      `DrCloudwatchLogsEndpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      }
    );

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DrDbSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for DR RDS instance - ${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `DrLambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for DR Lambda functions - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // SNS Topic for alerts in DR region
    this.monitoringTopic = new sns.Topic(
      this,
      `DrMonitoringTopic-${environmentSuffix}`,
      {
        topicName: `dr-monitoring-topic-${environmentSuffix}`,
        displayName: 'DR Region Monitoring Alerts',
      }
    );

    // S3 Bucket for backups in DR region (destination bucket)
    // CRITICAL: No replication configuration here - this is the destination
    this.backupBucketDR = new s3.Bucket(
      this,
      `DrBackupBucket-${environmentSuffix}`,
      {
        bucketName: `dr-backup-bucket-${environmentSuffix}-${this.account}`,
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
    this.backupBucket = this.backupBucketDR; // Alias for test compatibility

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DrDbSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `dr-db-subnet-group-${environmentSuffix}`,
        description: `Subnet group for DR RDS instance - ${environmentSuffix}`,
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS PostgreSQL Instance in DR region (initially a standalone instance)
    // This will become a read replica promoted from the primary region
    this.dbInstance = new rds.DatabaseInstance(
      this,
      `DrDbInstance-${environmentSuffix}`,
      {
        instanceIdentifier: `dr-postgres-${environmentSuffix}`,
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
        multiAz: true,
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
          `DrDbParameterGroup-${environmentSuffix}`,
          'default.postgres14'
        ),
      }
    );
    this.database = this.dbInstance; // Alias for test compatibility

    // Lambda function to monitor replication lag in DR region
    this.replicationLagMonitorFunction = new lambda.Function(
      this,
      `DrReplicationLagMonitor-${environmentSuffix}`,
      {
        functionName: `dr-replication-lag-monitor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/replication-lag-monitor'),
        timeout: cdk.Duration.seconds(60),
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          DB_ENDPOINT: this.dbInstance.dbInstanceEndpointAddress,
          DB_PORT: this.dbInstance.dbInstanceEndpointPort,
          SNS_TOPIC_ARN: this.monitoringTopic.topicArn,
          LAG_THRESHOLD_SECONDS: '300',
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Lambda permissions
    this.monitoringTopic.grantPublish(this.replicationLagMonitorFunction);
    this.dbInstance.grantConnect(this.replicationLagMonitorFunction);

    // Add RDS describe permissions for monitoring
    this.replicationLagMonitorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
        resources: [`arn:aws:rds:${this.region}:${this.account}:db:*`],
      })
    );

    // Schedule the Lambda to run every 5 minutes
    const rule = new cdk.aws_events.Rule(
      this,
      `DrMonitoringRule-${environmentSuffix}`,
      {
        ruleName: `dr-monitoring-rule-${environmentSuffix}`,
        schedule: cdk.aws_events.Schedule.rate(cdk.Duration.minutes(5)),
      }
    );

    rule.addTarget(
      new cdk.aws_events_targets.LambdaFunction(
        this.replicationLagMonitorFunction
      )
    );

    // Store DB endpoint for cross-stack reference
    this.dbEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Outputs
    new cdk.CfnOutput(this, 'DrVpcId', {
      value: this.vpc.vpcId,
      description: 'DR VPC ID',
      exportName: `DrVpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DrDbEndpoint', {
      value: this.dbEndpoint,
      description: 'DR Database Endpoint',
      exportName: `DrDbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DrBackupBucketArn', {
      value: this.backupBucketDR.bucketArn,
      description: 'DR Backup Bucket ARN',
      exportName: `DrBackupBucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DrBackupBucketName', {
      value: this.backupBucketDR.bucketName,
      description: 'DR Backup Bucket Name',
      exportName: `DrBackupBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DrKmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'DR KMS Key ARN',
      exportName: `DrKmsKeyArn-${environmentSuffix}`,
    });
  }
}
