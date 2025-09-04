/**
 * monitoring-stack.ts
 *
 * This module defines the MonitoringStack component for creating
 * VPC Flow Logs, CloudTrail, and other monitoring resources.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  logsBucketName: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly vpcFlowLogId: pulumi.Output<string>;
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudWatchLogGroupArn: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: ResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogGroup = new aws.cloudwatch.LogGroup(
      `tap-vpc-flow-logs-${environmentSuffix}`,
      {
        name: `/aws/vpc/flowlogs/${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: args.kmsKeyArn,
        tags: {
          Name: `tap-vpc-flow-logs-${environmentSuffix}`,
          Purpose: 'VPCFlowLogs',
          ...tags,
        },
      },
      { parent: this }
    );

    // IAM role for VPC Flow Logs
    const vpcFlowLogRole = new aws.iam.Role(
      `tap-vpc-flow-log-role-${environmentSuffix}`,
      {
        name: `tap-vpc-flow-log-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-vpc-flow-log-role-${environmentSuffix}`,
          Purpose: 'VPCFlowLogsExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // IAM policy for VPC Flow Logs
    new aws.iam.RolePolicy(
      `tap-vpc-flow-log-policy-${environmentSuffix}`,
      {
        role: vpcFlowLogRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
              ],
              "Resource": "${vpcFlowLogGroup.arn}:*"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // VPC Flow Logs
    const vpcFlowLog = new aws.ec2.FlowLog(
      `tap-vpc-flow-log-${environmentSuffix}`,
      {
        iamRoleArn: vpcFlowLogRole.arn,
        logDestination: vpcFlowLogGroup.arn,
        logDestinationType: 'cloud-watch-logs',
        vpcId: args.vpcId,
        trafficType: 'ALL',
        logFormat:
          '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}',
        tags: {
          Name: `tap-vpc-flow-log-${environmentSuffix}`,
          Purpose: 'NetworkMonitoring',
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudTrail S3 bucket policy
    const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
      `tap-cloudtrail-bucket-policy-${environmentSuffix}`,
      {
        bucket: args.logsBucketName,
        policy: pulumi
          .all([args.logsBucketName, aws.getCallerIdentity()])
          .apply(([bucketName, _identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: `arn:aws:s3:::${bucketName}`,
                },
                {
                  Sid: 'AWSCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `arn:aws:s3:::${bucketName}/cloudtrail-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudTrail
    const cloudTrail = new aws.cloudtrail.Trail(
      `tap-cloudtrail-${environmentSuffix}`,
      {
        name: `tap-cloudtrail-${environmentSuffix}`,
        s3BucketName: args.logsBucketName,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogging: true,
        kmsKeyId: args.kmsKeyArn,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: ['arn:aws:s3:::*/*'],
              },
            ],
          },
        ],
        tags: {
          Name: `tap-cloudtrail-${environmentSuffix}`,
          Purpose: 'APIAuditing',
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [cloudTrailBucketPolicy],
      }
    );

    // GuardDuty Detector
    new aws.guardduty.Detector(
      `tap-guardduty-${environmentSuffix}`,
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        datasources: {
          s3Logs: {
            enable: true,
          },
          kubernetes: {
            auditLogs: {
              enable: true,
            },
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: {
                enable: true,
              },
            },
          },
        },
        tags: {
          Name: `tap-guardduty-${environmentSuffix}`,
          Purpose: 'ThreatDetection',
          ...tags,
        },
      },
      { parent: this }
    );

    this.vpcFlowLogId = vpcFlowLog.id;
    this.cloudTrailArn = cloudTrail.arn;
    this.cloudWatchLogGroupArn = vpcFlowLogGroup.arn;

    this.registerOutputs({
      vpcFlowLogId: this.vpcFlowLogId,
      cloudTrailArn: this.cloudTrailArn,
      cloudWatchLogGroupArn: this.cloudWatchLogGroupArn,
    });
  }
}
