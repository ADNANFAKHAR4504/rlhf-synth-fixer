import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';

export class SecurityMonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;
    // Get region from AWS_REGION environment variable set by CICD or use us-west-2 as default
    const region = process.env.AWS_REGION || 'us-west-2';
    const stackSuffix = `${environmentSuffix}-${region}`;

    // S3 bucket for CloudTrail logs
    this.cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailBucket${environmentSuffix}`,
      {
        bucketName: `aws-cloudtrail-security-${environmentSuffix}-${this.account}-${cdk.Aws.REGION}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kms.Key.fromKeyArn(
          this,
          'CloudTrailEncryptionKey',
          encryptionKeyArn
        ),
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            id: 'ArchiveOldLogs',
            expiration: cdk.Duration.days(2555), // 7 years retention
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
              {
                storageClass: s3.StorageClass.DEEP_ARCHIVE,
                transitionAfter: cdk.Duration.days(365),
              },
            ],
          },
        ],
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // CloudWatch Log Group for CloudTrail
    this.cloudTrailLogGroup = new logs.LogGroup(
      this,
      `CloudTrailLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/cloudtrail/security-trail-${environmentSuffix}`,
        retention: logs.RetentionDays.TWO_YEARS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // SNS topic for security alerts
    this.securityAlertsTopic = new sns.Topic(
      this,
      `SecurityAlertsTopic${environmentSuffix}`,
      {
        topicName: `security-alerts-${environmentSuffix}`,
        displayName: 'Security Alerts',
        masterKey: kms.Key.fromKeyArn(
          this,
          'AlertsEncryptionKey',
          encryptionKeyArn
        ),
      }
    );

    // CloudTrail for comprehensive API logging
    // Changed construct ID to force replacement and resolve UPDATE_ROLLBACK_FAILED
    this.securityTrail = new cloudtrail.Trail(
      this,
      `SecurityCloudTrailV2${environmentSuffix}`,
      {
        trailName: `SecurityTrailV2${environmentSuffix}`,
        bucket: this.cloudTrailBucket,
        s3KeyPrefix: 'security-logs',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: false, // Single region deployment
        enableFileValidation: true,
        encryptionKey: kms.Key.fromKeyArn(
          this,
          'TrailEncryptionKey',
          encryptionKeyArn
        ),
        cloudWatchLogGroup: this.cloudTrailLogGroup,
        cloudWatchLogGroupRetention: logs.RetentionDays.TWO_YEARS,
        sendToCloudWatchLogs: true,
        insightTypes: [cloudtrail.InsightType.API_CALL_RATE],
      }
    );

    // Force replacement of CloudTrail by changing the resource name
    // This helps resolve UPDATE_ROLLBACK_FAILED issues
    cdk.Tags.of(this.securityTrail).add('ForceReplacement', 'true');

    // Add S3 and KMS event selectors
    this.securityTrail.addS3EventSelector(
      [
        {
          bucket: this.cloudTrailBucket,
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
      }
    );

    // VPC for security monitoring (if needed for resources)
    this.securityVpc = new ec2.Vpc(this, `SecurityVPC${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      vpcName: `SecurityVPC${environmentSuffix}`,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs
    this.vpcFlowLogs = new ec2.FlowLog(
      this,
      `VPCFlowLogs${environmentSuffix}`,
      {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.securityVpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(
          new logs.LogGroup(this, `VPCFlowLogsGroup${environmentSuffix}`, {
            logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_YEAR,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          })
        ),
        trafficType: ec2.FlowLogTrafficType.ALL,
      }
    );

    // CloudWatch Alarms for Security Events

    // High number of failed logins
    new cloudwatch.Alarm(this, `HighFailedLoginsAlarm${environmentSuffix}`, {
      alarmName: `HighFailedLogins-${environmentSuffix}`,
      alarmDescription:
        'Alert when there are high number of failed login attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Events',
        metricName: 'FailedLogins',
        dimensionsMap: {
          Environment: environmentSuffix,
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cloudwatchActions.SnsAction(this.securityAlertsTopic)
    );

    // Root account usage
    const rootUsageMetricFilter = new logs.MetricFilter(
      this,
      `RootUsageMetricFilter${environmentSuffix}`,
      {
        logGroup: this.cloudTrailLogGroup,
        metricNamespace: 'SecurityMonitoring',
        metricName: 'RootAccountUsage',
        filterPattern: logs.FilterPattern.literal(
          '{ $.userIdentity.type = "Root" }'
        ),
        metricValue: '1',
      }
    );

    new cloudwatch.Alarm(this, `RootAccountUsageAlarm${environmentSuffix}`, {
      alarmName: `RootAccountUsage-${environmentSuffix}`,
      alarmDescription: 'Alert when root account is used',
      metric: rootUsageMetricFilter.metric({
        statistic: 'Sum',
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cloudwatchActions.SnsAction(this.securityAlertsTopic)
    );

    // Unauthorized API calls
    const unauthorizedApiCallsMetricFilter = new logs.MetricFilter(
      this,
      `UnauthorizedApiCallsMetricFilter${environmentSuffix}`,
      {
        logGroup: this.cloudTrailLogGroup,
        metricNamespace: 'SecurityMonitoring',
        metricName: 'UnauthorizedApiCalls',
        filterPattern: logs.FilterPattern.literal(
          '{ $.responseElements.message = "*Unauthorized*" || $.errorCode = "*Unauthorized*" || $.errorCode = "AccessDenied*" }'
        ),
        metricValue: '1',
      }
    );

    new cloudwatch.Alarm(
      this,
      `UnauthorizedApiCallsAlarm${environmentSuffix}`,
      {
        alarmName: `UnauthorizedApiCalls-${environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized API calls',
        metric: unauthorizedApiCallsMetricFilter.metric({
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    ).addAlarmAction(new cloudwatchActions.SnsAction(this.securityAlertsTopic));

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'SecurityMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `CloudTrailBucketName${stackSuffix}`, {
      value: this.cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 Bucket Name',
      exportName: `SecurityStack-CloudTrailBucket-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityAlertsTopicArn${stackSuffix}`, {
      value: this.securityAlertsTopic.topicArn,
      description: 'Security Alerts SNS Topic ARN',
      exportName: `SecurityStack-SecurityAlerts-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityVPCId${stackSuffix}`, {
      value: this.securityVpc.vpcId,
      description: 'Security VPC ID',
      exportName: `SecurityStack-VPCId-${stackSuffix}`,
    });
  }
}
