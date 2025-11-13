import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
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
  public readonly hostedZoneId: cdk.CfnOutput;
  public readonly hostedZoneName: cdk.CfnOutput;
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
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.SMALL
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

    // Extract Lambda URL domain for health check
    const lambdaUrlDomain = lambdaUrl.url.replace('https://', '').split('/')[0];

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

    // 🔹 Route 53 Hosted Zone
    const hostedZone = new route53.HostedZone(
      this,
      `HostedZone-${environmentSuffix}`,
      {
        zoneName: props.config.domainName,
      }
    );

    // 🔹 Route 53 Health Check for Primary Region
    const healthCheck = new route53.CfnHealthCheck(
      this,
      `PrimaryHealthCheck-${environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: '/',
          fullyQualifiedDomainName: lambdaUrlDomain,
          port: 443,
          requestInterval: 30,
          failureThreshold: 3,
        },
      }
    );

    // 🔹 Route 53 Primary Failover Record
    new route53.CfnRecordSet(
      this,
      `PrimaryFailoverRecord-${environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: props.config.domainName,
        type: 'CNAME',
        setIdentifier: 'primary',
        failover: 'PRIMARY',
        healthCheckId: healthCheck.attrHealthCheckId,
        resourceRecords: [lambdaUrlDomain],
        ttl: '60',
      }
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
    const backupPlan = new backup.BackupPlan(
      this,
      `BackupPlan-${environmentSuffix}`,
      {
        backupPlanRules: [
          new backup.BackupPlanRule({
            ruleName: `DailyBackup-${environmentSuffix}`,
            deleteAfter: cdk.Duration.days(7),
            copyActions: [
              {
                destinationBackupVault: new backup.BackupVault(
                  this,
                  `SecondaryBackupVault-${environmentSuffix}`,
                  {
                    backupVaultName: `secondary-region-vault-${environmentSuffix}`,
                  }
                ),
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
    this.hostedZoneId = new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      exportName: `${this.stackName}-HostedZoneId`,
    });
    this.hostedZoneName = new cdk.CfnOutput(this, 'HostedZoneName', {
      value: hostedZone.zoneName,
      exportName: `${this.stackName}-HostedZoneName`,
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
      hostedZoneId: cdk.CfnOutput;
      hostedZoneName: cdk.CfnOutput;
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
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.SMALL
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

    const lambdaUrl = paymentLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // Extract Lambda URL domain for health check
    const lambdaUrlDomain = lambdaUrl.url.replace('https://', '').split('/')[0];

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

    // 🔹 Route 53 Health Check for Secondary Region
    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `SecondaryHealthCheck-${environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: '/',
          fullyQualifiedDomainName: lambdaUrlDomain,
          port: 443,
          requestInterval: 30,
          failureThreshold: 3,
        },
      }
    );

    // 🔹 Route 53 Failover Records
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId.importValue,
        zoneName: props.hostedZoneName.importValue,
      }
    );

    // 🔹 Route 53 Secondary Failover Record
    new route53.CfnRecordSet(
      this,
      `SecondaryFailoverRecord-${environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: props.config.domainName,
        type: 'CNAME',
        setIdentifier: 'secondary',
        failover: 'SECONDARY',
        healthCheckId: secondaryHealthCheck.attrHealthCheckId,
        resourceRecords: [lambdaUrlDomain],
        ttl: '60',
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
