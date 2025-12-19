import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface AccessControlStackProps {
  environmentSuffix: string;
}

export class AccessControlStack extends Construct {
  public readonly buildSystemRole: IamRole;

  constructor(scope: Construct, id: string, props: AccessControlStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    const buildSystemAssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'build-system-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: [
                  'ec2.amazonaws.com',
                  'codebuild.amazonaws.com',
                  'ecs-tasks.amazonaws.com',
                ],
              },
            ],
          },
        ],
      }
    );

    this.buildSystemRole = new IamRole(this, 'build-system-role', {
      name: `cicd-build-system-${environmentSuffix}`,
      assumeRolePolicy: buildSystemAssumeRolePolicy.json,
      tags: {
        Name: `cicd-build-system-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Build System Access',
      },
    });

    const buildSystemPolicy = new DataAwsIamPolicyDocument(
      this,
      'build-system-policy',
      {
        statement: [
          {
            sid: 'S3ArtifactAccess',
            actions: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:GetObjectVersion',
            ],
            resources: [
              'arn:aws:s3:::cicd-artifacts-*',
              'arn:aws:s3:::cicd-artifacts-*/*',
            ],
          },
          {
            sid: 'DynamoDBMetadataAccess',
            actions: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
            ],
            resources: ['arn:aws:dynamodb:*:*:table/artifact-metadata-*'],
          },
          {
            sid: 'CloudWatchMetrics',
            actions: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricData',
              'cloudwatch:GetMetricStatistics',
            ],
            resources: ['*'],
          },
        ],
      }
    );

    new IamRolePolicy(this, 'build-system-role-policy', {
      name: `build-system-policy-${environmentSuffix}`,
      role: this.buildSystemRole.id,
      policy: buildSystemPolicy.json,
    });
  }
}
