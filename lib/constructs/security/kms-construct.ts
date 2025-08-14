import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SecurityConfig } from '../../config/security-config';

/**
 * KMS Construct for managing encryption keys with automatic rotation
 * Implements encryption at rest for all sensitive data stores
 */
export class KmsConstruct extends Construct {
  public readonly s3Key: kms.Key;
  public readonly secretsKey: kms.Key;
  public readonly cloudTrailKey: kms.Key;
  public readonly efsKey: kms.Key;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Encryption Key - For all S3 buckets containing sensitive data
    this.s3Key = new kms.Key(this, `${SecurityConfig.RESOURCE_PREFIX}-S3-Key`, {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

      // Key policy following least privilege principle
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Secrets Manager Encryption Key
    this.secretsKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Secrets-Key`,
      {
        description: 'KMS key for AWS Secrets Manager encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'Enable IAM User Permissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow Secrets Manager Service',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
              ],
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:ReEncrypt*',
                'kms:CreateGrant',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    // CloudTrail Encryption Key
    this.cloudTrailKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Key`,
      {
        description: 'KMS key for CloudTrail log encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'Enable IAM User Permissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow CloudTrail Service',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              ],
              actions: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    // EFS Encryption Key
    this.efsKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EFS-Key`,
      {
        description: 'KMS key for EFS encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      }
    );

    // Create aliases for easier key management
    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-S3-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-s3-key`,
      targetKey: this.s3Key,
    });

    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-Secrets-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-secrets-key`,
      targetKey: this.secretsKey,
    });

    new kms.Alias(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Key-Alias`,
      {
        aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-key`,
        targetKey: this.cloudTrailKey,
      }
    );

    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-EFS-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-efs-key`,
      targetKey: this.efsKey,
    });
  }
}
