import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface KmsStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class KmsStack extends Construct {
  public readonly databaseKey: KmsKey;
  public readonly s3Key: KmsKey;
  public readonly lambdaKey: KmsKey;
  public readonly cloudwatchKey: KmsKey;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;
    const caller = new DataAwsCallerIdentity(this, 'caller', {});

    const keyPolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::\${${caller.fqn}.account_id}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudWatch Logs',
          Effect: 'Allow',
          Principal: {
            Service: `logs.${awsRegion}.amazonaws.com`,
          },
          Action: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:CreateGrant',
            'kms:DescribeKey',
          ],
          Resource: '*',
          Condition: {
            ArnLike: {
              'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${awsRegion}:\${${caller.fqn}.account_id}:*`,
            },
          },
        },
        {
          Sid: 'Allow other AWS services',
          Effect: 'Allow',
          Principal: {
            Service: [
              'rds.amazonaws.com',
              's3.amazonaws.com',
              'lambda.amazonaws.com',
            ],
          },
          Action: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:CreateGrant',
            'kms:DescribeKey',
          ],
          Resource: '*',
        },
      ],
    });

    // Database encryption key
    this.databaseKey = new KmsKey(this, 'database-key', {
      description: `Database encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-database-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'database-encryption',
      },
    });

    new KmsAlias(this, 'database-key-alias', {
      name: `alias/trading-database-${environmentSuffix}`,
      targetKeyId: this.databaseKey.id,
    });

    // S3 encryption key
    this.s3Key = new KmsKey(this, 's3-key', {
      description: `S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-s3-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 's3-encryption',
      },
    });

    new KmsAlias(this, 's3-key-alias', {
      name: `alias/trading-s3-${environmentSuffix}`,
      targetKeyId: this.s3Key.id,
    });

    // Lambda encryption key
    this.lambdaKey = new KmsKey(this, 'lambda-key', {
      description: `Lambda encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-lambda-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'lambda-encryption',
      },
    });

    new KmsAlias(this, 'lambda-key-alias', {
      name: `alias/trading-lambda-${environmentSuffix}`,
      targetKeyId: this.lambdaKey.id,
    });

    // CloudWatch Logs encryption key
    this.cloudwatchKey = new KmsKey(this, 'cloudwatch-key', {
      description: `CloudWatch Logs encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-cloudwatch-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'cloudwatch-encryption',
      },
    });

    new KmsAlias(this, 'cloudwatch-key-alias', {
      name: `alias/trading-cloudwatch-${environmentSuffix}`,
      targetKeyId: this.cloudwatchKey.id,
    });
  }
}
