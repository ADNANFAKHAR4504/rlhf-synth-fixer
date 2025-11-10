import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface IamStackProps {
  environmentSuffix: string;
  s3BucketPrimaryArn: string;
  s3BucketDrArn: string;
}

export interface IamStackOutputs {
  replicationRoleArn: string;
  ec2InstanceProfileArn: string;
  ec2InstanceProfileName: string;
}

export class IamStack extends Construct {
  public readonly outputs: IamStackOutputs;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id);

    const { environmentSuffix, s3BucketPrimaryArn, s3BucketDrArn } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': 'global',
      ManagedBy: 'cdktf',
    };

    // S3 Replication Role
    const replicationAssumeRole = new DataAwsIamPolicyDocument(
      this,
      'replication-assume-role',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['s3.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    const replicationRole = new IamRole(this, 'replication-role', {
      name: `payment-s3-replication-${environmentSuffix}`,
      assumeRolePolicy: replicationAssumeRole.json,
      tags: commonTags,
    });

    const replicationPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'replication-policy-doc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            resources: [s3BucketPrimaryArn],
          },
          {
            effect: 'Allow',
            actions: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            resources: [`${s3BucketPrimaryArn}/*`],
          },
          {
            effect: 'Allow',
            actions: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            resources: [`${s3BucketDrArn}/*`],
          },
        ],
      }
    );

    const replicationPolicy = new IamPolicy(this, 'replication-policy', {
      name: `payment-s3-replication-policy-${environmentSuffix}`,
      policy: replicationPolicyDoc.json,
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'replication-policy-attachment', {
      role: replicationRole.name,
      policyArn: replicationPolicy.arn,
    });

    // EC2 Instance Role for ASG instances
    const ec2AssumeRole = new DataAwsIamPolicyDocument(
      this,
      'ec2-assume-role',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `payment-ec2-role-${environmentSuffix}`,
      assumeRolePolicy: ec2AssumeRole.json,
      tags: commonTags,
    });

    // Policy for EC2 instances to access S3, CloudWatch, and cross-region resources
    const ec2PolicyDoc = new DataAwsIamPolicyDocument(this, 'ec2-policy-doc', {
      statement: [
        {
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
          resources: [
            s3BucketPrimaryArn,
            `${s3BucketPrimaryArn}/*`,
            s3BucketDrArn,
            `${s3BucketDrArn}/*`,
          ],
        },
        {
          effect: 'Allow',
          actions: [
            'cloudwatch:PutMetricData',
            'cloudwatch:GetMetricStatistics',
            'cloudwatch:ListMetrics',
          ],
          resources: ['*'],
        },
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          resources: ['*'],
        },
        {
          effect: 'Allow',
          actions: ['rds:DescribeDBClusters', 'rds:DescribeGlobalClusters'],
          resources: ['*'],
        },
      ],
    });

    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `payment-ec2-policy-${environmentSuffix}`,
      policy: ec2PolicyDoc.json,
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // Attach AWS managed policies for SSM
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `payment-ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: commonTags,
      }
    );

    this.outputs = {
      replicationRoleArn: replicationRole.arn,
      ec2InstanceProfileArn: instanceProfile.arn,
      ec2InstanceProfileName: instanceProfile.name,
    };
  }
}
