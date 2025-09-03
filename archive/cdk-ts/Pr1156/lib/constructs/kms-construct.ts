import { Construct } from 'constructs';
import { Key, KeyUsage, KeySpec } from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy } from 'aws-cdk-lib';
import { TaggingUtils } from '../utils/tagging';
import {
  PolicyDocument,
  PolicyStatement,
  Effect,
  AccountRootPrincipal,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

export interface KmsConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
}

/**
 * KMS Construct for managing encryption keys
 * Creates customer-managed KMS keys for encryption at rest
 * Follows financial services compliance requirements
 */
export class KmsConstruct extends Construct {
  public readonly dataEncryptionKey: Key;
  public readonly logEncryptionKey: Key;
  public readonly databaseEncryptionKey: Key;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    // KMS Key for general data encryption (S3, EBS, etc.)
    this.dataEncryptionKey = new Key(this, 'DataEncryptionKey', {
      description: 'KMS key for encrypting sensitive data at rest',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true, // Automatic key rotation for compliance
      removalPolicy: RemovalPolicy.RETAIN, // Prevent accidental deletion
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'data-key'
      ),
      // Add key policy for general data encryption
      policy: new PolicyDocument({
        statements: [
          // Allow the account root user full access
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // KMS Key for CloudTrail and CloudWatch logs encryption
    this.logEncryptionKey = new Key(this, 'LogEncryptionKey', {
      description: 'KMS key for encrypting audit and application logs',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'log-key'
      ),
      // Add key policy to allow CloudWatch Logs to use this key
      policy: new PolicyDocument({
        statements: [
          // Allow the account root user full access
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow CloudWatch Logs to use this key for encryption
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:Describe*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // KMS Key for database encryption
    this.databaseEncryptionKey = new Key(this, 'DatabaseEncryptionKey', {
      description: 'KMS key for encrypting database storage and backups',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'db-key'
      ),
      // Add key policy for database encryption
      policy: new PolicyDocument({
        statements: [
          // Allow the account root user full access
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Apply standard tags to all KMS keys
    TaggingUtils.applyStandardTags(
      this.dataEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-DataKey' }
    );

    TaggingUtils.applyStandardTags(
      this.logEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-LogKey' }
    );

    TaggingUtils.applyStandardTags(
      this.databaseEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-DatabaseKey' }
    );
  }
}
