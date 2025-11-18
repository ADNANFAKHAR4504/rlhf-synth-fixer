import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface PrimaryRegionStackProps extends cdk.StackProps {
  environmentSuffix: string;
  drBucketArn: string;
  drVpcId: string;
  drVpcCidr: string;
  drKmsKeyId: string;
}

export class PrimaryRegionStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly backupBucket: s3.Bucket;
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly database: rds.DatabaseInstance; // Alias for tests
  public readonly monitoringTopic: sns.Topic;
  public readonly replicationLagMonitorFunction: lambda.Function;
  public readonly failoverFunction: lambda.Function;
  public readonly dbEndpoint: string;

  constructor(scope: Construct, id: string, props: PrimaryRegionStackProps) {
    super(scope, id, props);

    const { environmentSuffix, drBucketArn, drKmsKeyId } = props;
    const drBackupBucketArn = drBucketArn; // Alias for backward compatibility
    const drKmsKeyArn = drKmsKeyId; // Alias for backward compatibility

    // KMS Key for encryption in primary region
    this.kmsKey = new kms.Key(this, `PrimaryKmsKey-${environmentSuffix}`, {
      description: `KMS key for primary region resources - ${environmentSuffix}`,
      enableKeyRotation: false, // Disabled for testing/destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC in primary region
    this.vpc = new ec2.Vpc(this, `PrimaryVpc-${environmentSuffix}`, {
      vpcName: `primary-vpc-${environmentSuffix}`,
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
    this.vpc.addInterfaceEndpoint(`PrimaryRdsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
    });

    this.vpc.addInterfaceEndpoint(`PrimarySnsEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
    });

    this.vpc.addInterfaceEndpoint(
      `PrimaryCloudwatchLogsEndpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      }
    );

    this.vpc.addInterfaceEndpoint(
      `PrimaryEventsEndpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_EVENTS,
      }
    );

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `PrimaryDbSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for primary RDS instance - ${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `PrimaryLambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for primary Lambda functions - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // SNS Topic for alerts in primary region
    this.monitoringTopic = new sns.Topic(
      this,
      `PrimaryMonitoringTopic-${environmentSuffix}`,
      {
        topicName: `primary-monitoring-topic-${environmentSuffix}`,
        displayName: 'Primary Region Monitoring Alerts',
      }
    );

    // S3 Bucket for backups in primary region (source bucket)
    this.backupBucket = new s3.Bucket(
      this,
      `PrimaryBackupBucket-${environmentSuffix}`,
      {
        bucketName: `primary-backup-bucket-${environmentSuffix}-${this.account}`,
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

    // CRITICAL: Configure S3 replication in PRIMARY stack
    // Create replication role
    const replicationRole = new iam.Role(
      this,
      `S3ReplicationRole-${environmentSuffix}`,
      {
        roleName: `s3-replication-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: 'Role for S3 cross-region replication',
      }
    );

    // Grant replication role access to source bucket
    this.backupBucket.grantRead(replicationRole);

    // Grant replication role access to destination bucket
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
          's3:GetObjectVersionTagging',
        ],
        resources: [`${drBackupBucketArn}/*`],
      })
    );

    // Grant replication role access to destination KMS key
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [this.kmsKey.keyArn],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Encrypt', 'kms:DescribeKey'],
        resources: [drKmsKeyArn],
      })
    );

    // Configure replication on source bucket
    const cfnBucket = this.backupBucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.replicationConfiguration = {
      role: replicationRole.roleArn,
      rules: [
        {
          id: `replication-rule-${environmentSuffix}`,
          status: 'Enabled',
          priority: 1,
          filter: {},
          destination: {
            bucket: drBackupBucketArn,
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
            encryptionConfiguration: {
              replicaKmsKeyId: drKmsKeyArn,
            },
          },
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          sourceSelectionCriteria: {
            sseKmsEncryptedObjects: {
              status: 'Enabled',
            },
          },
        },
      ],
    };

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `PrimaryDbSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `primary-db-subnet-group-${environmentSuffix}`,
        description: `Subnet group for primary RDS instance - ${environmentSuffix}`,
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS PostgreSQL Instance in primary region
    this.dbInstance = new rds.DatabaseInstance(
      this,
      `PrimaryDbInstance-${environmentSuffix}`,
      {
        instanceIdentifier: `primary-postgres-${environmentSuffix}`,
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
          `PrimaryDbParameterGroup-${environmentSuffix}`,
          'default.postgres14'
        ),
      }
    );
    this.database = this.dbInstance; // Alias for test compatibility

    // Lambda function to monitor replication lag in primary region
    this.replicationLagMonitorFunction = new lambda.Function(
      this,
      `PrimaryReplicationLagMonitor-${environmentSuffix}`,
      {
        functionName: `primary-replication-lag-monitor-${environmentSuffix}`,
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

    // Lambda function for failover orchestration
    this.failoverFunction = new lambda.Function(
      this,
      `FailoverOrchestrator-${environmentSuffix}`,
      {
        functionName: `failover-orchestrator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/failover-orchestrator'),
        timeout: cdk.Duration.minutes(5),
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          PRIMARY_DB_ENDPOINT: this.dbInstance.dbInstanceEndpointAddress,
          SNS_TOPIC_ARN: this.monitoringTopic.topicArn,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant failover Lambda permissions
    this.monitoringTopic.grantPublish(this.failoverFunction);
    this.failoverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBInstances',
          'rds:PromoteReadReplica',
          'rds:ModifyDBInstance',
          'route53:ChangeResourceRecordSets',
          'route53:GetChange',
        ],
        resources: ['*'],
      })
    );

    // CloudWatch Alarms for database monitoring
    const dbCpuAlarm = new cloudwatch.Alarm(
      this,
      `PrimaryDbCpuAlarm-${environmentSuffix}`,
      {
        alarmName: `primary-db-cpu-alarm-${environmentSuffix}`,
        metric: this.dbInstance.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const dbConnectionsAlarm = new cloudwatch.Alarm(
      this,
      `PrimaryDbConnectionsAlarm-${environmentSuffix}`,
      {
        alarmName: `primary-db-connections-alarm-${environmentSuffix}`,
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

    // Schedule the monitoring Lambda to run every 5 minutes
    const monitoringRule = new cdk.aws_events.Rule(
      this,
      `PrimaryMonitoringRule-${environmentSuffix}`,
      {
        ruleName: `primary-monitoring-rule-${environmentSuffix}`,
        schedule: cdk.aws_events.Schedule.rate(cdk.Duration.minutes(5)),
      }
    );

    monitoringRule.addTarget(
      new cdk.aws_events_targets.LambdaFunction(
        this.replicationLagMonitorFunction
      )
    );

    // EventBridge rule to trigger failover on composite alarm
    const failoverRule = new cdk.aws_events.Rule(
      this,
      `FailoverRule-${environmentSuffix}`,
      {
        ruleName: `failover-rule-${environmentSuffix}`,
        description:
          'Trigger failover orchestration when composite alarm fires',
        eventPattern: {
          source: ['aws.cloudwatch'],
          detailType: ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [
              {
                prefix: 'primary-db-',
              },
            ],
            state: {
              value: ['ALARM'],
            },
          },
        },
      }
    );

    failoverRule.addTarget(
      new cdk.aws_events_targets.LambdaFunction(this.failoverFunction)
    );

    // Store DB endpoint for cross-stack reference
    this.dbEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Outputs
    new cdk.CfnOutput(this, 'PrimaryVpcId', {
      value: this.vpc.vpcId,
      description: 'Primary VPC ID',
      exportName: `PrimaryVpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryDbEndpoint', {
      value: this.dbEndpoint,
      description: 'Primary Database Endpoint',
      exportName: `PrimaryDbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryBackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'Primary Backup Bucket ARN',
      exportName: `PrimaryBackupBucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryBackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'Primary Backup Bucket Name',
      exportName: `PrimaryBackupBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleArn', {
      value: replicationRole.roleArn,
      description: 'S3 Replication Role ARN',
      exportName: `ReplicationRoleArn-${environmentSuffix}`,
    });
  }
}
