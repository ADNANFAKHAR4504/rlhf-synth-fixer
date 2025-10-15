import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface KmsConstructProps {
  environmentSuffix: string;
  removalPolicy: cdk.RemovalPolicy;
}

export class KmsConstruct extends Construct {
  public readonly key: kms.Key;
  public readonly alias: kms.Alias;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    // Create customer-managed KMS key
    this.key = new kms.Key(this, 'EncryptionKey', {
      description: `Customer-managed encryption key for ${props.environmentSuffix} environment`,
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow the account to manage the key
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow AWS services to use the key for encryption/decryption
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('dynamodb.amazonaws.com'),
              new iam.ServicePrincipal('lambda.amazonaws.com'),
              new iam.ServicePrincipal('apigateway.amazonaws.com'),
              new iam.ServicePrincipal('logs.amazonaws.com'),
              new iam.ServicePrincipal('sns.amazonaws.com'),
              new iam.ServicePrincipal('sqs.amazonaws.com'),
              new iam.ServicePrincipal('cloudwatch.amazonaws.com'),
            ],
            actions: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey*',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Create alias for easier reference
    this.alias = new kms.Alias(this, 'EncryptionKeyAlias', {
      aliasName: `alias/serverless-infra-${props.environmentSuffix}`,
      targetKey: this.key,
    });

    // Add tags
    cdk.Tags.of(this.key).add('Project', 'ServerlessInfra');
    cdk.Tags.of(this.key).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.key).add('Purpose', 'Encryption');
    cdk.Tags.of(this.alias).add('Project', 'ServerlessInfra');
    cdk.Tags.of(this.alias).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.alias).add('Purpose', 'Encryption');
  }

  /**
   * Grant encryption/decryption permissions to a principal
   */
  public grantEncryptDecrypt(principal: iam.IGrantable): void {
    this.key.grantEncryptDecrypt(principal);
  }

  /**
   * Grant key usage permissions to a principal
   */
  public grantKeyUsage(principal: iam.IGrantable): void {
    this.key.grant(
      principal,
      'kms:Decrypt',
      'kms:DescribeKey',
      'kms:Encrypt',
      'kms:GenerateDataKey*',
      'kms:ReEncrypt*'
    );
  }
}
