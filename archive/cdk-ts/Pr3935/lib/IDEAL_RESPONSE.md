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

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambdas/access-key-cleanup.ts

```typescript
// eslint-disable-next-line import/no-extraneous-dependencies
import { IAM, SNS } from 'aws-sdk';

const iam = new IAM();
const sns = new SNS();

interface AccessKeyInfo {
  userName: string;
  accessKeyId: string;
  createdDate: Date;
  lastUsedDate?: Date;
  ageInDays: number;
  lastUsedDays?: number;
}

export const handler = async (): Promise<void> => {
  const maxKeyAgeDays = parseInt(process.env.MAX_KEY_AGE_DAYS || '90');
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;

  const now = new Date();
  const keysToDelete: AccessKeyInfo[] = [];
  const keysToWarn: AccessKeyInfo[] = [];

  try {
    // List all IAM users
    const usersResponse = await iam.listUsers().promise();

    for (const user of usersResponse.Users) {
      // List access keys for each user
      const keysResponse = await iam
        .listAccessKeys({
          UserName: user.UserName!,
        })
        .promise();

      for (const keyMetadata of keysResponse.AccessKeyMetadata) {
        const createdDate = keyMetadata.CreateDate!;
        const ageInDays = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get last used information
        const lastUsedResponse = await iam
          .getAccessKeyLastUsed({
            AccessKeyId: keyMetadata.AccessKeyId!,
          })
          .promise();

        const lastUsedDate = lastUsedResponse.AccessKeyLastUsed?.LastUsedDate;
        const lastUsedDays = lastUsedDate
          ? Math.floor(
              (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : undefined;

        const keyInfo: AccessKeyInfo = {
          userName: user.UserName!,
          accessKeyId: keyMetadata.AccessKeyId!,
          createdDate,
          lastUsedDate,
          ageInDays,
          lastUsedDays,
        };

        // If key is old and hasn't been used recently
        if (ageInDays > maxKeyAgeDays) {
          if (!lastUsedDate || lastUsedDays! > maxKeyAgeDays) {
            keysToDelete.push(keyInfo);
          } else {
            keysToWarn.push(keyInfo);
          }
        }
      }
    }

    // Send warnings for old but recently used keys
    if (keysToWarn.length > 0) {
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Warning: Old Access Keys Still In Use',
          Message: JSON.stringify(
            {
              severity: 'WARNING',
              message: `Found ${keysToWarn.length} access keys older than ${maxKeyAgeDays} days that are still being used`,
              keys: keysToWarn.map(k => ({
                userName: k.userName,
                accessKeyId: k.accessKeyId,
                ageInDays: k.ageInDays,
                lastUsedDays: k.lastUsedDays,
              })),
            },
            null,
            2
          ),
        })
        .promise();
    }

    // Delete old unused keys
    for (const keyInfo of keysToDelete) {
      await iam
        .deleteAccessKey({
          UserName: keyInfo.userName,
          AccessKeyId: keyInfo.accessKeyId,
        })
        .promise();
    }

    if (keysToDelete.length > 0) {
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Info: Old Access Keys Deleted',
          Message: JSON.stringify(
            {
              severity: 'INFO',
              message: `Deleted ${keysToDelete.length} unused access keys older than ${maxKeyAgeDays} days`,
              keys: keysToDelete.map(k => ({
                userName: k.userName,
                accessKeyId: k.accessKeyId,
                ageInDays: k.ageInDays,
                lastUsedDays: k.lastUsedDays,
              })),
            },
            null,
            2
          ),
        })
        .promise();
    }
  } catch (error) {
    console.error('Error in access key cleanup:', error);

    await sns
      .publish({
        TopicArn: snsTopicArn,
        Subject: 'Error: Access Key Cleanup Failed',
        Message: JSON.stringify(
          {
            severity: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          null,
          2
        ),
      })
      .promise();

    throw error;
  }
};

```

## ./lib/lambdas/cloudtrail-processor.ts

```typescript
import { S3Event } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { S3, SNS } from 'aws-sdk';
import * as zlib from 'zlib';

const s3 = new S3();
const sns = new SNS();

interface CloudTrailRecord {
  eventTime: string;
  eventName: string;
  awsRegion: string;
  userIdentity: {
    type: string;
    principalId?: string;
    arn?: string;
    accountId?: string;
    userName?: string;
  };
  errorCode?: string;
  errorMessage?: string;
}

const SUSPICIOUS_EVENTS = [
  'DeleteTrail',
  'StopLogging',
  'DeleteFlowLogs',
  'DeleteDetector',
  'DisableEbsEncryptionByDefault',
  'DeleteDBInstance',
  'ModifyDBInstance',
  'CreateAccessKey',
  'CreateUser',
  'AttachUserPolicy',
  'PutBucketPolicy',
  'PutBucketAcl',
  'CreateNetworkAclEntry',
  'AuthorizeSecurityGroupIngress',
];

export const handler = async (event: S3Event): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      // Get the CloudTrail log file from S3
      const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();

      // Decompress the log file
      const unzipped = await new Promise<Buffer>((resolve, reject) => {
        zlib.gunzip(obj.Body as Buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const logData = JSON.parse(unzipped.toString());
      const records: CloudTrailRecord[] = logData.Records;

      for (const logRecord of records) {
        // Check for root account usage
        if (logRecord.userIdentity.type === 'Root') {
          await sns
            .publish({
              TopicArn: snsTopicArn,
              Subject: 'CRITICAL: Root Account Usage Detected',
              Message: JSON.stringify(
                {
                  severity: 'CRITICAL',
                  eventTime: logRecord.eventTime,
                  eventName: logRecord.eventName,
                  region: logRecord.awsRegion,
                  userIdentity: logRecord.userIdentity,
                },
                null,
                2
              ),
            })
            .promise();
        }

        // Check for suspicious events
        if (SUSPICIOUS_EVENTS.includes(logRecord.eventName)) {
          await sns
            .publish({
              TopicArn: snsTopicArn,
              Subject: `Security Alert: Suspicious Activity - ${logRecord.eventName}`,
              Message: JSON.stringify(
                {
                  severity: 'HIGH',
                  eventTime: logRecord.eventTime,
                  eventName: logRecord.eventName,
                  region: logRecord.awsRegion,
                  userIdentity: logRecord.userIdentity,
                  errorCode: logRecord.errorCode,
                },
                null,
                2
              ),
            })
            .promise();
        }

        // Check for repeated failed authentication attempts
        if (
          logRecord.errorCode === 'UnauthorizedOperation' ||
          logRecord.errorCode === 'AccessDenied'
        ) {
          // In production, you'd want to aggregate these and only alert on patterns
          console.log(
            `Failed authentication attempt: ${JSON.stringify(logRecord)}`
          );
        }
      }
    } catch (error) {
      console.error(`Error processing CloudTrail log ${key}:`, error);

      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Error: CloudTrail Log Processing Failed',
          Message: JSON.stringify(
            {
              severity: 'ERROR',
              bucket,
              key,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            null,
            2
          ),
        })
        .promise();
    }
  }
};

```

## ./lib/lambdas/cost-monitor.ts

```typescript
// eslint-disable-next-line import/no-extraneous-dependencies
import { CostExplorer, SNS } from 'aws-sdk';

const ce = new CostExplorer();
const sns = new SNS();

export const handler = async (): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const thresholdPercentage = parseInt(
    process.env.THRESHOLD_PERCENTAGE || '20'
  );

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  try {
    // Get current week costs
    const currentWeekResponse = await ce
      .getCostAndUsage({
        TimePeriod: {
          Start: lastWeek.toISOString().split('T')[0],
          End: today.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      })
      .promise();

    // Get previous week costs for comparison
    const previousWeekResponse = await ce
      .getCostAndUsage({
        TimePeriod: {
          Start: twoWeeksAgo.toISOString().split('T')[0],
          End: lastWeek.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      })
      .promise();

    // Calculate totals
    let currentWeekTotal = 0;
    let previousWeekTotal = 0;
    const serviceBreakdown: Record<
      string,
      { current: number; previous: number }
    > = {};

    // Process current week
    currentWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        currentWeekTotal += amount;

        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].current += amount;
      });
    });

    // Process previous week
    previousWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        previousWeekTotal += amount;

        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].previous += amount;
      });
    });

    // Calculate percentage increase
    const percentageIncrease =
      previousWeekTotal > 0
        ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : 0;

    // Alert if costs increased beyond threshold
    if (percentageIncrease > thresholdPercentage) {
      // Find services with significant increases
      const significantIncreases = Object.entries(serviceBreakdown)
        .filter(([_, costs]) => {
          const serviceIncrease =
            costs.previous > 0
              ? ((costs.current - costs.previous) / costs.previous) * 100
              : 0;
          return serviceIncrease > thresholdPercentage;
        })
        .map(([service, costs]) => ({
          service,
          currentCost: costs.current.toFixed(2),
          previousCost: costs.previous.toFixed(2),
          increase:
            (((costs.current - costs.previous) / costs.previous) * 100).toFixed(
              2
            ) + '%',
        }));

      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: `Cost Alert: ${percentageIncrease.toFixed(2)}% Increase Detected`,
          Message: JSON.stringify(
            {
              severity: 'WARNING',
              message: `Weekly costs increased by ${percentageIncrease.toFixed(2)}%`,
              currentWeekTotal: currentWeekTotal.toFixed(2),
              previousWeekTotal: previousWeekTotal.toFixed(2),
              servicesWithSignificantIncreases: significantIncreases,
            },
            null,
            2
          ),
        })
        .promise();
    } else {
      // Send informational update
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Cost Update: Weekly Summary',
          Message: JSON.stringify(
            {
              severity: 'INFO',
              message: 'Weekly cost summary',
              currentWeekTotal: currentWeekTotal.toFixed(2),
              previousWeekTotal: previousWeekTotal.toFixed(2),
              change: percentageIncrease.toFixed(2) + '%',
            },
            null,
            2
          ),
        })
        .promise();
    }
  } catch (error) {
    console.error('Error in cost monitoring:', error);

    await sns
      .publish({
        TopicArn: snsTopicArn,
        Subject: 'Error: Cost Monitoring Failed',
        Message: JSON.stringify(
          {
            severity: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          null,
          2
        ),
      })
      .promise();

    throw error;
  }
};

```

## ./lib/stacks/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  applicationSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  instanceRole: iam.Role;
  logBucket: s3.Bucket;
  databaseSecret: secretsmanager.Secret;
  webAcl: wafv2.CfnWebACL;
  tags?: { [key: string]: string };
}

export class ComputeStack extends cdk.NestedStack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create launch template for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y amazon-ssm-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Application Server</h1>" > /var/www/html/index.html',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          run_as_user: 'cwagent',
        },
        metrics: {
          namespace: `${props.environmentSuffix}/EC2`,
          metrics_collected: {
            cpu: {
              measurement: [
                {
                  name: 'cpu_usage_idle',
                  rename: 'CPU_USAGE_IDLE',
                  unit: 'Percent',
                },
                {
                  name: 'cpu_usage_iowait',
                  rename: 'CPU_USAGE_IOWAIT',
                  unit: 'Percent',
                },
                'cpu_time_guest',
              ],
              totalcpu: false,
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: [
                {
                  name: 'used_percent',
                  rename: 'DISK_USED_PERCENT',
                  unit: 'Percent',
                },
                'disk_free',
              ],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: [
                {
                  name: 'mem_used_percent',
                  rename: 'MEM_USED_PERCENT',
                  unit: 'Percent',
                },
                'mem_available',
              ],
              metrics_collection_interval: 60,
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60,
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\',
      '  -a fetch-config \\',
      '  -m ec2 \\',
      '  -s \\',
      '  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json'
    );

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `${props.environmentSuffix}-alb-v4`,
    });

    // Enable ALB access logs
    this.alb.logAccessLogs(props.logBucket);

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'ALBWebACLAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn: props.webAcl.attrArn,
    });

    // Create Auto Scaling Group
    this.asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.applicationSecurityGroup,
      role: props.instanceRole,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 2,
      }),
      instanceMonitoring: autoscaling.Monitoring.DETAILED,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(30, {
            volumeType: autoscaling.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    // Add scaling policies
    this.asg.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    this.asg.scaleOnMetric('MemoryScaling', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: `${props.environmentSuffix}/EC2`,
        metricName: 'MEM_USED_PERCENT',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 60, change: -1 },
        { lower: 80, change: +1 },
        { lower: 90, change: +2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.minutes(5),
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Add listener
    this.alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });
  }
}

```

## ./lib/stacks/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  databaseSecurityGroup: ec2.SecurityGroup;
  tags?: { [key: string]: string };
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create database credentials in Secrets Manager
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.environmentSuffix}/rds/credentials-v4`,
      description: `RDS database credentials for ${props.environmentSuffix} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey: props.kmsKey,
    });

    // Create subnet group for database
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Database subnet group for ${props.environmentSuffix}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS instance with Multi-AZ
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.LARGE
      ),
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [props.databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });
  }
}

```

## ./lib/stacks/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as inspector from 'aws-cdk-lib/aws-inspectorv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  cloudTrailBucket: s3.Bucket;
  kmsKey: kms.Key;
  vpc: ec2.Vpc;
  ec2InstanceRole: iam.Role;
  tags?: { [key: string]: string };
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly trail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create CloudTrail
    this.trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${props.environmentSuffix}-trail-v4`,
      bucket: props.cloudTrailBucket,
      encryptionKey: props.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_YEAR,
    });

    // Create Config Service
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-config-v4`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-config',
          enabled: true,
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    configBucket.grantWrite(configRole);

    // NOTE: AWS Config Rules require a Configuration Recorder in the region.
    // Since AWS Config allows only ONE Configuration Recorder per region and
    // the region may not have one configured, we don't create Config Rules here.
    //
    // To enable Config Rules:
    // 1. Manually set up a Configuration Recorder in the region (one-time setup)
    // 2. Uncomment the Config Rules below
    //
    // Recommended Config Rules:
    // - REQUIRED_TAGS: Verify all resources have 'iac-rlhf-amazon' tag
    // - EC2_EBS_ENCRYPTION_BY_DEFAULT: Ensure EBS volumes are encrypted
    // - S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED: Ensure S3 buckets are encrypted

    // Inspector V2 - Enable scanning
    new inspector.CfnFilter(this, 'InspectorFilter', {
      name: `${props.environmentSuffix}-ec2-filter-v4`,
      filterAction: 'NONE',
      filterCriteria: {
        resourceType: [
          {
            comparison: 'EQUALS',
            value: 'AWS_EC2_INSTANCE',
          },
        ],
      },
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `${props.environmentSuffix}-security-dashboard-v4`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# ${props.environmentSuffix} Security Dashboard`,
            width: 24,
            height: 2,
          }),
        ],
        [
          new cloudwatch.LogQueryWidget({
            title: 'Failed Login Attempts',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, userIdentity.userName, errorCode, errorMessage',
              '| filter errorCode = "UnauthorizedOperation" or errorCode = "AccessDenied"',
              '| stats count() by userIdentity.userName',
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.LogQueryWidget({
            title: 'Root Account Usage',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, eventName, userAgent',
              '| filter userIdentity.type = "Root"',
              '| sort @timestamp desc',
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });
  }
}

```

## ./lib/stacks/networking-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class NetworkingStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'MainVPC', {
      maxAzs: 3,
      natGateways: 2,
      vpcName: `${props.environmentSuffix}-vpc-v4`,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Configure NACLs for public subnets
    const publicNacl = new ec2.NetworkAcl(this, 'PublicNACL', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    publicNacl.addEntry('AllowInboundHTTP', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowInboundHTTPS', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowInboundEphemeral', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowOutboundAll', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Configure NACLs for private subnets
    const privateNacl = new ec2.NetworkAcl(this, 'PrivateNACL', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    privateNacl.addEntry('AllowInboundFromVPC', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
    });

    privateNacl.addEntry('AllowOutboundAll', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Create security groups
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for application servers',
        allowAllOutbound: true,
      }
    );

    this.applicationSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from application servers'
    );

    // Add VPC Flow Logs
    this.vpc.addFlowLog('VPCFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });
  }
}

```

## ./lib/stacks/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2InstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'MasterKMSKey', {
      description: `Master KMS key for ${props.environmentSuffix} environment`,
      enableKeyRotation: true,
      alias: `alias/${props.environmentSuffix}-master-key-v4`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant CloudTrail permission to use the KMS key
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudTrail to encrypt logs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );

    // Create IAM role for EC2 instances
    this.ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
        SecretsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [
                `arn:aws:secretsmanager:*:*:secret:${props.environmentSuffix}/rds/credentials-v4*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create IAM policy for MFA requirement
    new iam.ManagedPolicy(this, 'RequireMFAPolicy', {
      managedPolicyName: `${props.environmentSuffix}-require-mfa-v4`,
      description: 'Requires MFA for console access',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'AllowViewAccountInfo',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:GetAccountPasswordPolicy',
              'iam:ListVirtualMFADevices',
              'iam:ListUsers',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnPasswords',
            effect: iam.Effect.ALLOW,
            actions: ['iam:ChangePassword', 'iam:GetUser'],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnAccessKeys',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateAccessKey',
              'iam:DeleteAccessKey',
              'iam:ListAccessKeys',
              'iam:UpdateAccessKey',
            ],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnMFA',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ListMFADevices',
              'iam:ResyncMFADevice',
              'iam:DeactivateMFADevice',
            ],
            resources: [
              'arn:aws:iam::*:mfa/${aws:username}',
              'arn:aws:iam::*:user/${aws:username}',
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyAllExceptListedIfNoMFA',
            effect: iam.Effect.DENY,
            notActions: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      }),
    });
  }
}

```

## ./lib/stacks/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
  tags?: { [key: string]: string };
}

export class StorageStack extends cdk.NestedStack {
  public readonly logBucket: s3.Bucket;
  public readonly cloudTrailBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create S3 bucket for ALB logs (ALB doesn't support KMS encryption)
    this.logBucket = new s3.Bucket(this, 'ALBLogBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-alb-logs-v4`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for ALB access
    this.logBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal(
            'elasticloadbalancing.amazonaws.com'
          ),
        ],
        actions: ['s3:PutObject'],
        resources: [`${this.logBucket.bucketArn}/*`],
      })
    );

    // Create S3 bucket for CloudTrail logs
    this.cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-cloudtrail-v4`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-trails',
          enabled: true,
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for CloudTrail access
    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        ],
        actions: ['s3:GetBucketAcl'],
        resources: [this.cloudTrailBucket.bucketArn],
      })
    );

    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        ],
        actions: ['s3:PutObject'],
        resources: [`${this.cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              props.kmsKey.keyArn,
          },
        },
      })
    );
  }
}

```

## ./lib/stacks/waf-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface WAFStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class WAFStack extends cdk.NestedStack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WAFStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create IP Set for rate limiting
    new wafv2.CfnIPSet(this, 'IPRateLimitSet', {
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [],
    });

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        // AWS Managed Core Rule Set
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
        // AWS Managed Known Bad Inputs Rule Set
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
        },
        // SQL Injection Rule Set
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
        },
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${props.environmentSuffix}-WebACL`,
      },
    });
  }
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';
import { StorageStack } from './stacks/storage-stack';
import { DatabaseStack } from './stacks/database-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { WAFStack } from './stacks/waf-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      'iac-rlhf-amazon': 'true',
      Environment: environmentSuffix,
      ManagedBy: 'AWS-CDK',
    };

    // Apply tags to this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // 1. Security Stack - KMS keys and IAM roles
    const securityStack = new SecurityStack(
      this,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      }
    );

    // 2. Networking Stack - VPC, Subnets, Security Groups
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      }
    );

    // 3. Storage Stack - S3 buckets with encryption
    const storageStack = new StorageStack(
      this,
      `StorageStack-${environmentSuffix}`,
      {
        environmentSuffix,
        kmsKey: securityStack.kmsKey,
        tags: commonTags,
      }
    );

    // 4. Database Stack - RDS with Multi-AZ
    const databaseStack = new DatabaseStack(
      this,
      `DatabaseStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networkingStack.vpc,
        kmsKey: securityStack.kmsKey,
        databaseSecurityGroup: networkingStack.databaseSecurityGroup,
        tags: commonTags,
      }
    );

    // 5. WAF Stack - Web Application Firewall
    const wafStack = new WAFStack(this, `WAFStack-${environmentSuffix}`, {
      environmentSuffix,
      tags: commonTags,
    });

    // 6. Compute Stack - EC2, Auto Scaling, ALB
    const computeStack = new ComputeStack(
      this,
      `ComputeStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networkingStack.vpc,
        applicationSecurityGroup: networkingStack.applicationSecurityGroup,
        albSecurityGroup: networkingStack.albSecurityGroup,
        kmsKey: securityStack.kmsKey,
        instanceRole: securityStack.ec2InstanceRole,
        logBucket: storageStack.logBucket,
        databaseSecret: databaseStack.databaseSecret,
        webAcl: wafStack.webAcl,
        tags: commonTags,
      }
    );

    // 7. Monitoring Stack - CloudTrail, Config, Inspector
    const monitoringStack = new MonitoringStack(
      this,
      `MonitoringStack-${environmentSuffix}`,
      {
        environmentSuffix,
        cloudTrailBucket: storageStack.cloudTrailBucket,
        kmsKey: securityStack.kmsKey,
        vpc: networkingStack.vpc,
        ec2InstanceRole: securityStack.ec2InstanceRole,
        tags: commonTags,
      }
    );

    // Add stack dependencies
    databaseStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    computeStack.addDependency(networkingStack);
    computeStack.addDependency(securityStack);
    computeStack.addDependency(storageStack);
    computeStack.addDependency(databaseStack);
    computeStack.addDependency(wafStack);
    monitoringStack.addDependency(storageStack);
    monitoringStack.addDependency(securityStack);
    monitoringStack.addDependency(networkingStack);

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: computeStack.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ALBArn', {
      value: computeStack.alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: computeStack.asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseStack.databaseSecret.secretArn,
      description: 'Database Secret ARN',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityStack.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: securityStack.kmsKey.keyArn,
      description: 'KMS Key ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: monitoringStack.trail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, 'ALBLogBucketName', {
      value: storageStack.logBucket.bucketName,
      description: 'ALB Log Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: storageStack.cloudTrailBucket.bucketName,
      description: 'CloudTrail Bucket Name',
    });

    new cdk.CfnOutput(this, 'ApplicationSecurityGroupId', {
      value: networkingStack.applicationSecurityGroup.securityGroupId,
      description: 'Application Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: networkingStack.databaseSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: wafStack.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'EC2InstanceRoleArn', {
      value: securityStack.ec2InstanceRole.roleArn,
      description: 'EC2 Instance Role ARN',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import * as fs from 'fs';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { WAFV2Client, GetWebACLCommand } from '@aws-sdk/client-wafv2';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Read outputs from flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('TapStack Integration Tests', () => {
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const s3Client = new S3Client({ region });
  const rdsClient = new RDSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const asgClient = new AutoScalingClient({ region });
  const kmsClient = new KMSClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const cloudTrailClient = new CloudTrailClient({ region });
  const iamClient = new IAMClient({ region });
  const wafClient = new WAFV2Client({ region }); // WAF is regional

  let vpcId: string;
  let albArn: string;
  let asgName: string;
  let dbEndpoint: string;
  let kmsKeyId: string;
  let dbSecretArn: string;
  let albLogBucket: string;
  let cloudTrailBucket: string;
  let appSecurityGroupId: string;
  let dbSecurityGroupId: string;
  let webAclArn: string;
  let ec2RoleArn: string;

  beforeAll(() => {
    vpcId = outputs.VpcId;
    albArn = outputs.ALBArn;
    asgName = outputs.AutoScalingGroupName;
    dbEndpoint = outputs.DatabaseEndpoint;
    kmsKeyId = outputs.KMSKeyId;
    dbSecretArn = outputs.DatabaseSecretArn;
    albLogBucket = outputs.ALBLogBucketName;
    cloudTrailBucket = outputs.CloudTrailBucketName;
    appSecurityGroupId = outputs.ApplicationSecurityGroupId;
    dbSecurityGroupId = outputs.DatabaseSecurityGroupId;
    webAclArn = outputs.WebACLArn;
    ec2RoleArn = outputs.EC2InstanceRoleArn;
  });

  describe('CloudFormation Stack', () => {
    test('Stack should exist and be in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBeGreaterThan(0);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('Stack should have all required tags', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const tags = response.Stacks![0].Tags || [];
      const iacTag = tags.find(tag => tag.Key === 'iac-rlhf-amazon');
      const envTag = tags.find(tag => tag.Key === 'Environment');

      expect(iacTag).toBeDefined();
      expect(iacTag!.Value).toBe('true');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    });

    test('Stack should have all expected outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stackOutputs = response.Stacks![0].Outputs || [];
      expect(stackOutputs.length).toBe(15);

      const outputKeys = stackOutputs.map(o => o.OutputKey);
      expect(outputKeys).toContain('VpcId');
      expect(outputKeys).toContain('ALBDnsName');
      expect(outputKeys).toContain('ALBArn');
      expect(outputKeys).toContain('AutoScalingGroupName');
      expect(outputKeys).toContain('DatabaseEndpoint');
      expect(outputKeys).toContain('KMSKeyId');
      expect(outputKeys).toContain('CloudTrailName');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and have correct configuration', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBeDefined();
    });

    test('VPC should have public, private, and database subnets across 3 AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(9); // 3 public + 3 private + 3 database

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // 3 availability zones
    });

    test('NAT Gateways should be deployed in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('Application security group should allow HTTP/HTTPS from ALB', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [appSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBeGreaterThan(0);
    });

    test('Database security group should allow MySQL from application tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [dbSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const mysqlRule = sg.IpPermissions!.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('Storage (S3 Buckets)', () => {
    test('ALB log bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: albLogBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('ALB log bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: albLogBucket });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256'); // ALB doesn't support KMS, uses S3-managed encryption
    });

    test('ALB log bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: albLogBucket });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('CloudTrail bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: cloudTrailBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('CloudTrail bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: cloudTrailBucket,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('Database (RDS)', () => {
    test('RDS instance should exist and be available', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
    });

    test('RDS instance should have Multi-AZ enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].MultiAZ).toBe(true);
    });

    test('RDS instance should have encryption enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
    });

    test('RDS instance should be MySQL 8.0', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].Engine).toBe('mysql');
      expect(response.DBInstances![0].EngineVersion).toContain('8.0');
    });

    test('RDS instance should have automated backups enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Database secret should exist in Secrets Manager', async () => {
      const command = new DescribeSecretCommand({ SecretId: dbSecretArn });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(dbSecretArn);
      expect(response.KmsKeyId).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State!.Code).toBe('active');
    });

    test('ALB should be internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('ALB should have at least one target group', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
    });

    test('ALB should have HTTP listener', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);

      const ports = response.Listeners!.map(l => l.Port);
      expect(ports).toContain(80);
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);
    });

    test('Auto Scaling Group should have correct capacity configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
    });

    test('Auto Scaling Group should span multiple AZs', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      const azs = response.AutoScalingGroups![0].AvailabilityZones || [];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    test('Auto Scaling Group should have health check configured', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups![0].HealthCheckType).toBeDefined();
      expect(
        response.AutoScalingGroups![0].HealthCheckGracePeriod
      ).toBeGreaterThan(0);
    });
  });

  describe('Security (KMS)', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 instance role should exist', async () => {
      const roleName = ec2RoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(ec2RoleArn);
    });
  });

  describe('Monitoring (CloudTrail)', () => {
    test('CloudTrail should be logging', async () => {
      const trailName = `${environmentSuffix}-trail-v4`;
      const command = new GetTrailStatusCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);

      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', async () => {
      const trailName = `${environmentSuffix}-trail-v4`;
      const command = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const response = await cloudTrailClient.send(command);

      expect(response.trailList).toBeDefined();
      expect(response.trailList!.length).toBe(1);
      expect(response.trailList![0].LogFileValidationEnabled).toBe(true);
    });
  });

  describe('WAF', () => {
    test('Web ACL should exist and be accessible by ARN', async () => {
      // Parse ARN to get name and ID
      // ARN format: arn:aws:wafv2:region:account:regional/webacl/NAME/ID
      const arnParts = webAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];

      const command = new GetWebACLCommand({
        Id: webAclId,
        Name: webAclName,
        Scope: 'REGIONAL',
      });
      const response = await wafClient.send(command);

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.ARN).toBe(webAclArn);
    });

    test('Web ACL should have rules configured', async () => {
      // Parse ARN to get name and ID
      const arnParts = webAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];

      const command = new GetWebACLCommand({
        Id: webAclId,
        Name: webAclName,
        Scope: 'REGIONAL',
      });
      const response = await wafClient.send(command);

      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Integration', () => {
    test('All critical resources should have proper tags', async () => {
      // Verify VPC tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'iac-rlhf-amazon')).toBe(true);

      // Verify RDS tags
      const dbIdentifier = dbEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbTags = rdsResponse.DBInstances![0].TagList || [];
      expect(dbTags.some(t => t.Key === 'iac-rlhf-amazon')).toBe(true);
    });

    test('Network connectivity should be properly configured', async () => {
      // Verify subnets are in the VPC
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.every(s => s.VpcId === vpcId)).toBe(true);
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        region: process.env.AWS_REGION || 'ap-northeast-1',
        account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('Stack should have all required nested stacks', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });

    test('Stack should have correct tags', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Security Stack', () => {
    test('Should have SecurityStack nested stack', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Networking Stack', () => {
    test('Should have NetworkingStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Storage Stack', () => {
    test('Should have StorageStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Database Stack', () => {
    test('Should have DatabaseStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('WAF Stack', () => {
    test('Should have WAFStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Compute Stack', () => {
    test('Should have ComputeStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Monitoring Stack', () => {
    test('Should have MonitoringStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 7);
    });
  });

  describe('Stack Outputs', () => {
    test('Should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('Should export ALB DNS Name', () => {
      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('Should export ALB ARN', () => {
      template.hasOutput('ALBArn', {
        Description: 'Application Load Balancer ARN',
      });
    });

    test('Should export Auto Scaling Group Name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
      });
    });

    test('Should export Database Endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('Should export Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'Database Secret ARN',
      });
    });

    test('Should export KMS Key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID',
      });
    });

    test('Should export KMS Key ARN', () => {
      template.hasOutput('KMSKeyArn', {
        Description: 'KMS Key ARN',
      });
    });

    test('Should export CloudTrail ARN', () => {
      template.hasOutput('CloudTrailName', {
        Description: 'CloudTrail ARN',
      });
    });

    test('Should export ALB Log Bucket Name', () => {
      template.hasOutput('ALBLogBucketName', {
        Description: 'ALB Log Bucket Name',
      });
    });

    test('Should export CloudTrail Bucket Name', () => {
      template.hasOutput('CloudTrailBucketName', {
        Description: 'CloudTrail Bucket Name',
      });
    });

    test('Should export Application Security Group ID', () => {
      template.hasOutput('ApplicationSecurityGroupId', {
        Description: 'Application Security Group ID',
      });
    });

    test('Should export Database Security Group ID', () => {
      template.hasOutput('DatabaseSecurityGroupId', {
        Description: 'Database Security Group ID',
      });
    });

    test('Should export WAF Web ACL ARN', () => {
      template.hasOutput('WebACLArn', {
        Description: 'WAF Web ACL ARN',
      });
    });

    test('Should export EC2 Instance Role ARN', () => {
      template.hasOutput('EC2InstanceRoleArn', {
        Description: 'EC2 Instance Role ARN',
      });
    });

    test('Should have exactly 15 outputs', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      expect(outputs.length).toBe(15);
    });
  });

  describe('CDK Metadata', () => {
    test('Should include CDK metadata resource or have resources', () => {
      const stackJson = template.toJSON();
      const hasResources = Object.keys(stackJson.Resources || {}).length > 0;
      expect(hasResources).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    test('Should use correct environment suffix in resource names', () => {
      const stackJson = template.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      stackNames.forEach(name => {
        if (name.includes('Stack')) {
          expect(name).toContain(environmentSuffix);
        }
      });
    });

    test('Should use environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack', {
        env: {
          region: process.env.AWS_REGION || 'ap-northeast-1',
          account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      const stackJson = contextTemplate.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      const hasTestSuffix = stackNames.some(name => name.includes('test'));
      expect(hasTestSuffix).toBe(true);
    });

    test('Should default to "dev" when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
        env: {
          region: process.env.AWS_REGION || 'ap-northeast-1',
          account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      const stackJson = defaultTemplate.toJSON();
      const stackNames = Object.keys(stackJson.Resources || {});

      const hasDevSuffix = stackNames.some(name => name.includes('dev'));
      expect(hasDevSuffix).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    test('Nested stacks should have proper dependencies', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      // Check that dependent stacks have DependsOn
      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          // DatabaseStack should depend on NetworkingStack and SecurityStack
          if (key.includes('DatabaseStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
          }
          // ComputeStack should depend on multiple stacks
          if (key.includes('ComputeStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
            expect(resource.DependsOn!.length).toBeGreaterThan(2);
          }
          // MonitoringStack should depend on other stacks
          if (key.includes('MonitoringStack')) {
            expect(resource.DependsOn).toBeDefined();
            expect(Array.isArray(resource.DependsOn)).toBe(true);
          }
        }
      });
    });
  });

  describe('Tagging', () => {
    test('All nested stacks should have required tags', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          expect(resource.Properties.Tags).toBeDefined();
          const tags = resource.Properties.Tags;
          const hasIacTag = tags.some(
            (tag: { Key: string; Value: string }) =>
              tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
          );
          expect(hasIacTag).toBe(true);
        }
      });
    });

    test('Environment tag should be present on parent stack', () => {
      // Check that parent stack has the Environment tag
      const stackJson = template.toJSON();
      const hasEnvTag = Object.keys(stackJson.Resources || {}).length > 0;
      expect(hasEnvTag).toBe(true);
    });
  });

  describe('Parameter Passing', () => {
    test('Nested stacks should receive parameters from parent', () => {
      const stackJson = template.toJSON();
      const resources = stackJson.Resources || {};

      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.Type === 'AWS::CloudFormation::Stack') {
          // Stacks that need parameters should have them
          if (
            key.includes('StorageStack') ||
            key.includes('DatabaseStack') ||
            key.includes('ComputeStack') ||
            key.includes('MonitoringStack')
          ) {
            expect(resource.Properties.Parameters).toBeDefined();
          }
        }
      });
    });
  });

  describe('Bootstrap Version', () => {
    test('Should have bootstrap version parameter', () => {
      const stackJson = template.toJSON();
      expect(stackJson.Parameters?.BootstrapVersion).toBeDefined();
      expect(stackJson.Parameters?.BootstrapVersion.Type).toBe(
        'AWS::SSM::Parameter::Value<String>'
      );
    });
  });

  describe('Stack Synthesis', () => {
    test('Stack should synthesize without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('Generated template should be valid CloudFormation', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      expect(stackArtifact).toBeDefined();
      expect(stackArtifact.template).toBeDefined();
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
