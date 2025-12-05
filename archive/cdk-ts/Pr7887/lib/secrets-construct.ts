import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SecretsConstructProps {
  environmentSuffix: string;
}

export class SecretsConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Issue 10: Create secret for database credentials
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `db-credentials-${environmentSuffix}`,
      description: 'Database credentials for ECS application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'appuser' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Fully destroyable
    });
  }
}
