import { Construct } from 'constructs';
import { Key, KeyUsage, KeySpec } from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy } from 'aws-cdk-lib';
import { TaggingUtils } from '../utils/tagging';

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
