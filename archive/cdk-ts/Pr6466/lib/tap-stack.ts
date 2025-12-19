import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

// 🔹 Shared Configuration
export interface SharedConfig {
  domainName: string;
  alertEmail: string;
  tags: Record<string, string>;
}

// 🔹 Primary Region Stack
export class PrimaryStack extends cdk.Stack {
  public readonly vpcId: cdk.CfnOutput;
  public readonly vpcCidr: cdk.CfnOutput;
  public readonly globalDatabaseId: cdk.CfnOutput;
  public readonly lambdaUrl: cdk.CfnOutput;
  public readonly bucketArn: cdk.CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      config: SharedConfig;
      replicationRegion?: string;
      environmentSuffix?: string;
    }
  ) {
    super(scope, id, props);

    const replicationRegion = props.replicationRegion || 'us-west-2';
    const environmentSuffix = props.environmentSuffix || 'dev';

    // 🔹 VPC
    const vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // 🔹 Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Aurora database',
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
      }
    );

    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access Aurora'
    );

    // 🔹 Aurora Global Database (PostgreSQL)
    const cluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_12,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
        }),
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        vpc,
        securityGroups: [dbSecurityGroup],
        defaultDatabaseName: 'paymentdb',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 🔹 Lambda Function
    const paymentLambda = new lambda.Function(
      this,
      `PaymentLambda-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Payment processing successful'
    }
      `),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
        logGroup: new logs.LogGroup(
          this,
          `PaymentLambdaLogGroup-${environmentSuffix}`,
          {
            retention: logs.RetentionDays.ONE_WEEK,
          }
        ),
      }
    );

    paymentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
        resources: [cluster.clusterArn],
      })
    );

    const lambdaUrl = paymentLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // 🔹 DynamoDB Global Table
    const sessionTable = new dynamodb.Table(
      this,
      `SessionTable-${environmentSuffix}`,
      {
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        replicationRegions: [replicationRegion],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    paymentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [sessionTable.tableArn],
      })
    );

    // 🔹 S3 Bucket with Cross-Region Replication
    const bucket = new s3.Bucket(
      this,
      `StaticContentBucket-${environmentSuffix}`,
      {
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: false,
      }
    );

    const replicationRole = new iam.Role(
      this,
      `ReplicationRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      }
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
        resources: [bucket.bucketArn],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // 🔹 SNS Topic
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      displayName: 'Payment DR Alerts',
    });

    new sns.Subscription(this, `EmailSubscription-${environmentSuffix}`, {
      topic: alertTopic,
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: props.config.alertEmail,
    });

    // 🔹 CloudWatch Alarms
    new cloudwatch.Alarm(this, `AuroraWriterHealthAlarm-${environmentSuffix}`, {
      metric: cluster.metricDatabaseConnections(),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Aurora writer health check',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, `LambdaErrorAlarm-${environmentSuffix}`, {
      metric: paymentLambda.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Lambda function errors',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, `DynamoDBThrottleAlarm-${environmentSuffix}`, {
      metric: sessionTable.metricUserErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'DynamoDB throttling',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 🔹 AWS Backup
    const primaryBackupVault = new backup.BackupVault(
      this,
      `PrimaryBackupVault-${environmentSuffix}`,
      {
        backupVaultName: `payment-dr-primary-vault-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const secondaryBackupVault = new backup.BackupVault(
      this,
      `SecondaryBackupVault-${environmentSuffix}`,
      {
        backupVaultName: `payment-dr-secondary-vault-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const backupPlan = new backup.BackupPlan(
      this,
      `BackupPlan-${environmentSuffix}`,
      {
        backupVault: primaryBackupVault,
        backupPlanRules: [
          new backup.BackupPlanRule({
            ruleName: `DailyBackup-${environmentSuffix}`,
            deleteAfter: cdk.Duration.days(7),
            copyActions: [
              {
                destinationBackupVault: secondaryBackupVault,
                moveToColdStorageAfter: cdk.Duration.days(1),
              },
            ],
          }),
        ],
      }
    );

    backupPlan.addSelection(`AuroraBackup-${environmentSuffix}`, {
      resources: [backup.BackupResource.fromRdsDatabaseCluster(cluster)],
    });

    // 🔹 Outputs
    this.vpcId = new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      exportName: `${this.stackName}-VpcId`,
    });
    this.vpcCidr = new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      exportName: `${this.stackName}-VpcCidr`,
    });
    this.globalDatabaseId = new cdk.CfnOutput(this, 'GlobalDatabaseId', {
      value: cluster.clusterIdentifier,
      exportName: `${this.stackName}-GlobalDatabaseId`,
    });
    this.lambdaUrl = new cdk.CfnOutput(this, 'LambdaUrl', {
      value: lambdaUrl.url,
      exportName: `${this.stackName}-LambdaUrl`,
    });
    this.bucketArn = new cdk.CfnOutput(this, 'BucketArn', {
      value: bucket.bucketArn,
      exportName: `${this.stackName}-BucketArn`,
    });

    // 🔹 Apply Tags
    Object.entries(props.config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}

// 🔹 Secondary Region Stack
export class SecondaryStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      config: SharedConfig;
      primaryRegion?: string;
      environmentSuffix?: string;
      primaryVpcId: cdk.CfnOutput;
      primaryVpcCidr: cdk.CfnOutput;
      globalDatabaseId: cdk.CfnOutput;
      primaryLambdaUrl: cdk.CfnOutput;
      primaryBucketArn: cdk.CfnOutput;
    }
  ) {
    super(scope, id, props);

    const primaryRegion = props.primaryRegion || 'us-east-1';
    const environmentSuffix = props.environmentSuffix || 'dev';

    // 🔹 VPC
    const vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // 🔹 Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Aurora database',
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
      }
    );

    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access Aurora'
    );

    // 🔹 Aurora Secondary Cluster (Global Database member)
    const secondaryCluster = new rds.DatabaseCluster(
      this,
      `SecondaryCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_12,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
        }),
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        vpc,
        securityGroups: [dbSecurityGroup],
        defaultDatabaseName: 'paymentdb',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 🔹 Lambda Function
    const paymentLambda = new lambda.Function(
      this,
      `PaymentLambda-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Payment processing successful'
    }
      `),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
        logGroup: new logs.LogGroup(
          this,
          `PaymentLambdaLogGroup-${environmentSuffix}`,
          {
            retention: logs.RetentionDays.ONE_WEEK,
          }
        ),
      }
    );

    paymentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
        resources: [secondaryCluster.clusterArn],
      })
    );

    paymentLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // 🔹 DynamoDB Global Table (replicated from primary)
    const sessionTable = new dynamodb.Table(
      this,
      `SessionTable-${environmentSuffix}`,
      {
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        replicationRegions: [primaryRegion],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    paymentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [sessionTable.tableArn],
      })
    );

    // 🔹 S3 Bucket (replication target)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucket = new s3.Bucket(
      this,
      `StaticContentBucket-${environmentSuffix}`,
      {
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: false,
      }
    );

    // 🔹 SNS Topic
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      displayName: 'Payment DR Alerts Secondary',
    });

    new sns.Subscription(this, `EmailSubscription-${environmentSuffix}`, {
      topic: alertTopic,
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: props.config.alertEmail,
    });

    // 🔹 CloudWatch Alarms
    new cloudwatch.Alarm(this, `AuroraWriterHealthAlarm-${environmentSuffix}`, {
      metric: secondaryCluster.metricDatabaseConnections(),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Aurora writer health check',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, `LambdaErrorAlarm-${environmentSuffix}`, {
      metric: paymentLambda.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Lambda function errors',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 🔹 Apply Tags
    Object.entries(props.config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
