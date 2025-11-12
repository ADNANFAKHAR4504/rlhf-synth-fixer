import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

export interface IamStackProps {
  environmentSuffix: string;
  dynamodbTableArn: string;
  sqsQueueArn: string;
  snsTopicArn: string;
  kmsKeyArn: string;
}

export class IamStack extends Construct {
  public readonly transactionProcessorRole: IamRole;
  public readonly statusCheckerRole: IamRole;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      dynamodbTableArn,
      sqsQueueArn,
      snsTopicArn,
      kmsKeyArn,
    } = props;

    // Get current AWS account ID and region
    const currentAccount = new DataAwsCallerIdentity(
      this,
      'current_account',
      {}
    );
    const currentRegion = new DataAwsRegion(this, 'current_region', {});

    // IAM role for transaction processor Lambda
    this.transactionProcessorRole = new IamRole(
      this,
      'transaction_processor_role',
      {
        name: `transaction-processor-role-${environmentSuffix}`,
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
          Name: `transaction-processor-role-${environmentSuffix}`,
        },
      }
    );

    new IamRolePolicy(this, 'transaction_processor_policy', {
      name: `transaction-processor-policy-${environmentSuffix}`,
      role: this.transactionProcessorRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
            ],
            Resource: [dynamodbTableArn, `${dynamodbTableArn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:SendMessage',
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Resource: sqsQueueArn,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: snsTopicArn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: kmsKeyArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:\${${currentRegion.name}}:\${${currentAccount.accountId}}:log-group:/aws/lambda/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
          },
        ],
      }),
    });

    // IAM role for status checker Lambda
    this.statusCheckerRole = new IamRole(this, 'status_checker_role', {
      name: `status-checker-role-${environmentSuffix}`,
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
        Name: `status-checker-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicy(this, 'status_checker_policy', {
      name: `status-checker-policy-${environmentSuffix}`,
      role: this.statusCheckerRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
            Resource: [dynamodbTableArn, `${dynamodbTableArn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: kmsKeyArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:\${${currentRegion.name}}:\${${currentAccount.accountId}}:log-group:/aws/lambda/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
          },
        ],
      }),
    });
  }
}
