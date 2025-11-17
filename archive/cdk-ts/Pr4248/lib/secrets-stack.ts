import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecretsStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class SecretsStack extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly applicationSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id);

    // Database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `payment-db-credentials-${props.environmentSuffix}`,
      description: 'Database credentials for payment processing',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'paymentadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
        requireEachIncludedType: true,
      },
      encryptionKey: props.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Application secrets
    this.applicationSecret = new secretsmanager.Secret(
      this,
      'ApplicationSecret',
      {
        secretName: `payment-app-secrets-${props.environmentSuffix}`,
        description: 'Application secrets for payment processing',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            apiKey: 'placeholder',
            encryptionKey: 'placeholder',
          }),
          generateStringKey: 'jwtSecret',
          excludeCharacters: '"@/\\',
          passwordLength: 64,
        },
        encryptionKey: props.kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Enable automatic rotation for database secret (commented out as it requires database setup)
    // Note: Rotation requires the database to be created first, so it's handled in the database stack
    // this.databaseSecret.addRotationSchedule('DatabaseRotation', {
    //   automaticallyAfter: cdk.Duration.days(30),
    //   hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
    // });
  }
}
