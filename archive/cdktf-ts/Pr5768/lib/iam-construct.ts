import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { EnvironmentConfig } from './environment-config';

export interface IamConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  bucketArn: string;
  tableArn: string;
}

export class IamConstruct extends Construct {
  public readonly dataAccessRole: IamRole;
  public readonly dataAccessRoleArn: string;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    const { environmentSuffix, config, bucketArn, tableArn } = props;

    // Create IAM role for data access with least-privilege
    this.dataAccessRole = new IamRole(this, 'DataAccessRole', {
      name: `data-access-role-${environmentSuffix}`,
      description: `Role for accessing ${config.environment} environment resources`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `data-access-role-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.dataAccessRoleArn = this.dataAccessRole.arn;

    // Attach least-privilege policy for S3 access
    new IamRolePolicy(this, 'S3AccessPolicy', {
      name: `s3-access-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
        ],
      }),
    });

    // Attach least-privilege policy for DynamoDB access
    new IamRolePolicy(this, 'DynamoDBAccessPolicy', {
      name: `dynamodb-access-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [tableArn, `${tableArn}/index/*`],
          },
        ],
      }),
    });

    // Add CloudWatch Logs permissions for Lambda
    new IamRolePolicy(this, 'CloudWatchLogsPolicy', {
      name: `cloudwatch-logs-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });
  }
}
