import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption with automatic rotation
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `healthcare-key-${props.regionName}-${props.environmentSuffix}`,
      description: `Encryption key for healthcare data in ${props.regionName}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed for testing - use RETAIN in production
    });

    // Create database credentials in Secrets Manager
    // Note: This is a simple secret without attachment to avoid circular dependencies
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `healthcare-db-credentials-${props.regionName}-${props.environmentSuffix}`,
      description: `Database credentials for ${props.regionName} region`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Note: Automatic rotation and secret attachment will be configured separately
    // to avoid circular dependencies between stacks

    // Add tags
    cdk.Tags.of(this.kmsKey).add('Name', `healthcare-kms-${props.regionName}`);
    cdk.Tags.of(this.kmsKey).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.databaseSecret).add(
      'Name',
      `healthcare-secret-${props.regionName}`
    );
    cdk.Tags.of(this.databaseSecret).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
