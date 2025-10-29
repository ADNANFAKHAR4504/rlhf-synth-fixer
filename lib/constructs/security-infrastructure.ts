import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { getRemovalPolicy, PipelineConfig } from '../config/pipeline-config';

export interface SecurityInfrastructureProps {
  config: PipelineConfig;
}

export class SecurityInfrastructure extends Construct {
  public readonly kmsKey: kms.Key;
  public readonly parameterPrefix: string;

  constructor(
    scope: Construct,
    id: string,
    props: SecurityInfrastructureProps
  ) {
    super(scope, id);

    const { config } = props;

    // KMS key for encryption
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for ${config.prefix}`,
      enableKeyRotation: true,
      removalPolicy: getRemovalPolicy(config.environmentSuffix),
      alias: `${config.prefix}-key`,
    });

    // Grant CloudWatch Logs permissions
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`,
          },
        },
      })
    );

    this.parameterPrefix = `/${config.prefix}`;

    // Create default parameters
    new ssm.StringParameter(this, 'ApiKeyParameter', {
      parameterName: `${this.parameterPrefix}/api-key`,
      stringValue: 'PLACEHOLDER_API_KEY',
      description: 'API Key for external services',
    });

    new ssm.StringParameter(this, 'DbConnectionParameter', {
      parameterName: `${this.parameterPrefix}/db-connection`,
      stringValue: 'PLACEHOLDER_CONNECTION_STRING',
      description: 'Database connection string',
    });
  }
}
