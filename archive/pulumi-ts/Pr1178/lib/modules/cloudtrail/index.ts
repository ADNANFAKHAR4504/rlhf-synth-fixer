import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface CloudTrailArgs {
  trailName?: string;
  s3BucketName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
  tags?: Record<string, string>;
}

export class SecureCloudTrail extends pulumi.ComponentResource {
  public readonly trail: aws.cloudtrail.Trail;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logStream: aws.cloudwatch.LogStream;

  constructor(
    name: string,
    args: CloudTrailArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureCloudTrail', name, {}, opts);

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: `/aws/cloudtrail/${args.trailName || name}`,
        retentionInDays: 365,
        kmsKeyId: args.kmsKeyId,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Create CloudWatch Log Stream
    this.logStream = new aws.cloudwatch.LogStream(
      `${name}-log-stream`,
      {
        name: `${args.trailName || name}-stream`,
        logGroupName: this.logGroup.name,
      },
      { parent: this }
    );

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailRole = new aws.iam.Role(
      `${name}-cloudtrail-role`,
      {
        name: `${args.trailName || name}-cloudtrail-role`,
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

    // Policy for CloudTrail to write to CloudWatch
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
              "logs:CreateLogStream"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudTrail
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
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this, dependsOn: [cloudTrailPolicy] }
    );

    this.registerOutputs({
      trailArn: this.trail.arn,
      trailName: this.trail.name,
      logGroupArn: this.logGroup.arn,
    });
  }
}
