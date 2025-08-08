import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export interface IamConstructProps {
  environment: string;
  commonTags: { [key: string]: string };
  roleNameSuffix?: string; // already here
}

export class IamConstruct extends Construct {
  public readonly ec2RoleArn: string;
  public readonly ec2ProfileName: string;
  public readonly s3ServiceRoleArn: string;
  public readonly cloudwatchRoleArn: string;

  constructor(scope: Construct, id: string, config: IamConstructProps) {
    super(scope, id);

    // ✅ CHANGED: use suffix if provided, otherwise empty string
    const suffix = config.roleNameSuffix ? `-${config.roleNameSuffix}` : '';

    const ec2Role = new aws.iamRole.IamRole(this, 'Ec2Role', {
      name: `${config.environment}-ec2-role${suffix}`, // ✅ CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    const ec2Profile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'Ec2Profile',
      {
        name: `${config.environment}-ec2-profile${suffix}`, // ✅ CHANGED
        role: ec2Role.name,
        tags: config.commonTags,
      }
    );

    new aws.iamRolePolicy.IamRolePolicy(this, 'Ec2Policy', {
      name: `${config.environment}-ec2-policy${suffix}`, // ✅ CHANGED
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:::${config.environment}-*/*`,
          },
        ],
      }),
    });

    const s3ServiceRole = new aws.iamRole.IamRole(this, 'S3ServiceRole', {
      name: `${config.environment}-s3-service-role${suffix}`, // ✅ CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    const cloudwatchRole = new aws.iamRole.IamRole(this, 'CloudWatchRole', {
      name: `${config.environment}-cloudwatch-role${suffix}`, // ✅ CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    this.ec2RoleArn = ec2Role.arn;
    this.ec2ProfileName = ec2Profile.name;
    this.s3ServiceRoleArn = s3ServiceRole.arn;
    this.cloudwatchRoleArn = cloudwatchRole.arn;
  }
}
