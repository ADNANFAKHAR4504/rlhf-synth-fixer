import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface EnhancedCloudTrailArgs {
  trailName?: string;
  s3BucketName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
  enableInsightSelectors?: boolean;
  tags?: Record<string, string>;
}

export class EnhancedCloudTrail extends pulumi.ComponentResource {
  public readonly trail: aws.cloudtrail.Trail;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logStream: aws.cloudwatch.LogStream;
  public readonly metricFilter: aws.cloudwatch.LogMetricFilter;
  public readonly alarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    args: EnhancedCloudTrailArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:EnhancedCloudTrail', name, {}, opts);

    // Create CloudWatch Log Group for CloudTrail with longer retention
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: `/aws/cloudtrail/${name}`,
        retentionInDays: 2555, // 7 years for compliance
        kmsKeyId: args.kmsKeyId,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Create CloudWatch Log Stream
    this.logStream = new aws.cloudwatch.LogStream(
      `${name}-log-stream`,
      {
        name: `${name}-stream`,
        logGroupName: this.logGroup.name,
      },
      { parent: this }
    );

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailRole = new aws.iam.Role(
      `${name}-cloudtrail-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enhanced policy for CloudTrail to write to CloudWatch
    const cloudTrailPolicy = new aws.iam.RolePolicy(
      `${name}-cloudtrail-policy`,
      {
        role: cloudTrailRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create enhanced CloudTrail with comprehensive event selectors
    this.trail = new aws.cloudtrail.Trail(
      `${name}-trail`,
      {
        name: args.trailName,
        s3BucketName: args.s3BucketName,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: args.includeGlobalServiceEvents ?? true,
        isMultiRegionTrail: args.isMultiRegionTrail ?? true,
        enableLogFileValidation: args.enableLogFileValidation ?? true,
        kmsKeyId: args.kmsKeyId,
        cloudWatchLogsGroupArn: pulumi.interpolate`${this.logGroup.arn}:*`,
        cloudWatchLogsRoleArn: cloudTrailRole.arn,

        // Comprehensive event selectors for maximum audit coverage
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: ['arn:aws:s3:::*/*'],
              },
              {
                type: 'AWS::S3::Bucket',
                values: ['arn:aws:s3:::*'],
              },
            ],
          },
        ],

        // Advanced event selectors for more granular logging
        advancedEventSelectors: [
          {
            name: 'Log all S3 data events',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Data'],
              },
              {
                field: 'resources.type',
                equals: ['AWS::S3::Object'],
              },
            ],
          },
          {
            name: 'Log all IAM management events',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Management'],
              },
              {
                field: 'eventName',
                equals: [
                  'CreateRole',
                  'DeleteRole',
                  'AttachRolePolicy',
                  'DetachRolePolicy',
                  'PutRolePolicy',
                  'DeleteRolePolicy',
                  'CreateUser',
                  'DeleteUser',
                  'CreateAccessKey',
                  'DeleteAccessKey',
                ],
              },
            ],
          },
          {
            name: 'Log all KMS key operations',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Management'],
              },
              {
                field: 'resources.type',
                equals: ['AWS::KMS::Key'],
              },
            ],
          },
          {
            name: 'Log security group changes',
            fieldSelectors: [
              {
                field: 'eventCategory',
                equals: ['Management'],
              },
              {
                field: 'eventName',
                equals: [
                  'CreateSecurityGroup',
                  'DeleteSecurityGroup',
                  'AuthorizeSecurityGroupIngress',
                  'AuthorizeSecurityGroupEgress',
                  'RevokeSecurityGroupIngress',
                  'RevokeSecurityGroupEgress',
                ],
              },
            ],
          },
        ],

        // Enable insights for anomaly detection
        insightSelectors: args.enableInsightSelectors
          ? [
              {
                insightType: 'ApiCallRateInsight',
              },
            ]
          : undefined,

        tags: { ...commonTags, ...args.tags },
      },
      { parent: this, dependsOn: [cloudTrailPolicy] }
    );

    // Create metric filter for security events
    this.metricFilter = new aws.cloudwatch.LogMetricFilter(
      `${name}-security-events`,
      {
        name: `${name}-security-events-filter`,
        logGroupName: this.logGroup.name,
        pattern:
          '[version, account, time, region, source, name="ConsoleLogin" || name="AssumeRole" || name="CreateRole" || name="DeleteRole" || name="AttachRolePolicy" || name="DetachRolePolicy"]',
        metricTransformation: {
          name: `${name}-SecurityEvents`,
          namespace: 'Security/CloudTrail',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for suspicious activity
    this.alarm = new aws.cloudwatch.MetricAlarm(
      `${name}-security-alarm`,
      {
        name: `${name}-suspicious-activity`,
        alarmDescription: 'Alarm for suspicious security-related activities',
        metricName: `${name}-SecurityEvents`,
        namespace: 'Security/CloudTrail',
        statistic: 'Sum',
        period: 300, // 5 minutes
        evaluationPeriods: 1,
        threshold: 10, // Alert if more than 10 security events in 5 minutes
        comparisonOperator: 'GreaterThanThreshold',
        alarmActions: [], // Add SNS topic ARN here for notifications
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    this.registerOutputs({
      trailArn: this.trail.arn,
      trailName: this.trail.name,
      logGroupArn: this.logGroup.arn,
      metricFilterName: this.metricFilter.name,
      alarmName: this.alarm.name,
    });
  }
}
