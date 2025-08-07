import {
  iamInstanceProfile,
  iamRole,
  iamRolePolicy,
} from '@cdktf/provider-aws';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface IamStackConfig {
  environment: string;
  commonTags: { [key: string]: string };
}

export class IamStack extends TerraformStack {
  public readonly ec2RoleArn: string;
  public readonly ec2ProfileName: string;
  public readonly s3ServiceRoleArn: string;
  public readonly cloudwatchRoleArn: string;

  constructor(scope: Construct, id: string, config: IamStackConfig) {
    super(scope, id);

    const ec2Role = new iamRole.IamRole(this, 'Ec2Role', {
      name: `${config.environment}-ec2-role`,
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

    const ec2Profile = new iamInstanceProfile.IamInstanceProfile(
      this,
      'Ec2Profile',
      {
        name: `${config.environment}-ec2-profile`,
        role: ec2Role.name,
        tags: config.commonTags,
      }
    );

    new iamRolePolicy.IamRolePolicy(this, 'Ec2Policy', {
      name: `${config.environment}-ec2-policy`,
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

    const s3ServiceRole = new iamRole.IamRole(this, 'S3ServiceRole', {
      name: `${config.environment}-s3-service-role`,
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

    const cloudwatchRole = new iamRole.IamRole(this, 'CloudWatchRole', {
      name: `${config.environment}-cloudwatch-role`,
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

    new TerraformOutput(this, 'ec2_role_arn', {
      value: this.ec2RoleArn,
    });

    new TerraformOutput(this, 'ec2_instance_profile_name', {
      value: this.ec2ProfileName,
    });

    new TerraformOutput(this, 's3_service_role_arn', {
      value: this.s3ServiceRoleArn,
    });

    new TerraformOutput(this, 'cloudwatch_role_arn', {
      value: this.cloudwatchRoleArn,
    });
  }
}
