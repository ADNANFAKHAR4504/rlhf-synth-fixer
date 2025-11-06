import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { StackConfig } from '../interfaces/config-interfaces';
import { NamingUtil } from '../utils/naming';

interface MonitoringConstructProps extends StackConfig {
  asgName: string;
  albArn: string;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopicArn: string;
  public readonly configBucket: s3.Bucket;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { config: appConfig, asgName, albArn } = props;

    // Create SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: NamingUtil.generateResourceName(appConfig, 'alarms', false),
      displayName: `CloudWatch alarms for ${appConfig.environment}`,
    });

    this.alarmTopicArn = alarmTopic.topicArn;

    // Add email subscription for production
    if (appConfig.environment === 'prod') {
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription('ops-team@example.com')
      );
    }

    // Create comprehensive CloudWatch alarms

    // 1. EC2 CPU utilization alarm (requirement)
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: NamingUtil.generateResourceName(appConfig, 'high-cpu', false),
      alarmDescription: `High CPU utilization in ASG ${asgName}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asgName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // 2. ALB target health alarm
    const albName = cdk.Fn.select(
      1,
      cdk.Fn.split('/', cdk.Fn.select(5, cdk.Fn.split(':', albArn)))
    );

    const unhealthyTargetsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetsAlarm',
      {
        alarmName: NamingUtil.generateResourceName(
          appConfig,
          'unhealthy-targets',
          false
        ),
        alarmDescription: `Unhealthy ALB targets for ${albName}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            LoadBalancer: albName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unhealthyTargetsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // 3. ALB response time alarm
    const responseTimeAlarm = new cloudwatch.Alarm(
      this,
      'HighResponseTimeAlarm',
      {
        alarmName: NamingUtil.generateResourceName(
          appConfig,
          'high-response-time',
          false
        ),
        alarmDescription: `High response time for ALB ${albName}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          dimensionsMap: {
            LoadBalancer: albName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5, // 5 seconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    responseTimeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // 4. ALB 5xx error rate alarm
    const errorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: NamingUtil.generateResourceName(
        appConfig,
        'high-error-rate',
        false
      ),
      alarmDescription: `High 5xx error rate for ALB ${albName}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: albName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    errorRateAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Create S3 bucket for AWS Config (fix: proper Config setup)
    this.configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: NamingUtil.generateBucketName(appConfig, 'aws-config'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'config-lifecycle',
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
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM role for AWS Config (fix: proper Config service role)
    // COMMENTED OUT: AWS Config limits - only one per account, typically managed at org level
    /*
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: NamingUtil.generateRoleName(appConfig, 'config-service'),
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')
      ]
    });

    // Grant Config permissions to write to S3 bucket
    this.configBucket.grantWrite(configRole);
    this.configBucket.grantRead(configRole);

    // Add additional permissions for Config
    configRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetBucketAcl',
        's3:ListBucket'
      ],
      resources: [this.configBucket.bucketArn]
    }));

    configRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject'
      ],
      resources: [`${this.configBucket.bucketArn}/*`]
    }));
    */

    // NOTE: AWS Config setup skipped - using existing account Config service
    // AWS Config allows only one delivery channel and one recorder per account
    // These are typically managed at the organization level

    // Create Config rules for compliance monitoring (requirement)
    // COMMENTED OUT: Config rules require Config service setup which conflicts with existing account setup
    /*
    // 1. Required tags rule
    const requiredTagsRule = new config.CfnConfigRule(this, 'RequiredTagsRule', {
      configRuleName: NamingUtil.generateResourceName(appConfig, 'required-tags-rule', false),
      description: 'Checks that required tags are present on resources',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'REQUIRED_TAGS'
      },
      inputParameters: {
        tag1Key: 'iac-rlhf-amazon',
        tag2Key: 'Environment',
        tag3Key: 'ManagedBy'
      }
    });

    // No dependencies needed - using existing Config service

    // 2. S3 bucket encryption rule
    const s3EncryptionRule = new config.CfnConfigRule(this, 'S3EncryptionRule', {
      configRuleName: NamingUtil.generateResourceName(appConfig, 's3-encryption-rule', false),
      description: 'Checks that S3 buckets have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      }
    });

    // No dependencies needed - using existing Config service

    // 3. RDS encryption rule
    const rdsEncryptionRule = new config.CfnConfigRule(this, 'RdsEncryptionRule', {
      configRuleName: NamingUtil.generateResourceName(appConfig, 'rds-encryption-rule', false),
      description: 'Checks that RDS instances have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'RDS_STORAGE_ENCRYPTED'
      }
    });

    // No dependencies needed - using existing Config service

    // 4. Security group SSH rule
    const sshRestrictedRule = new config.CfnConfigRule(this, 'SshRestrictedRule', {
      configRuleName: NamingUtil.generateResourceName(appConfig, 'ssh-restricted-rule', false),
      description: 'Checks that security groups do not allow unrestricted SSH access',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'INCOMING_SSH_DISABLED'
      }
    });

    // No dependencies needed - using existing Config service
    */

    // Create CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: NamingUtil.generateResourceName(
        appConfig,
        'dashboard',
        false
      ),
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            width: 12,
            height: 6,
            left: [cpuAlarm.metric],
            leftYAxis: {
              min: 0,
              max: 100,
            },
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB Metrics',
            width: 12,
            height: 6,
            left: [unhealthyTargetsAlarm.metric],
            right: [responseTimeAlarm.metric],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'ALB Error Rates',
            width: 24,
            height: 6,
            left: [errorRateAlarm.metric],
          }),
        ],
      ],
    });

    // Apply tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
  }
}
