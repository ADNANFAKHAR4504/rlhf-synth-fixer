import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class SecurityStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;

    // KMS key for encrypting data at rest
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      alias: `healthtech-encryption-${environmentSuffix}`,
      description: 'KMS key for encrypting HealthTech data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for RDS encryption
    this.rdsEncryptionKey = new kms.Key(this, 'RDSEncryptionKey', {
      alias: `healthtech-rds-encryption-${environmentSuffix}`,
      description: 'KMS key for RDS database encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for Kinesis encryption
    this.kinesisEncryptionKey = new kms.Key(this, 'KinesisEncryptionKey', {
      alias: `healthtech-kinesis-encryption-${environmentSuffix}`,
      description: 'KMS key for Kinesis stream encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Generate database credentials (to be created externally per requirements)
    // This creates a secret that should be populated with actual credentials
    this.dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `healthtech-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for HealthTech RDS',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'healthtech_admin' }),
        generateStringKey: 'password',
        excludeCharacters: '/@"\'\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
