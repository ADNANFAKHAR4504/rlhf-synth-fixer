import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecurityConfigProps {
  config: any;
  removalPolicy: cdk.RemovalPolicy;
}

export class SecurityConfig extends Construct {
  public readonly dbSecret: secretsmanager.Secret;
  public readonly apiKeySecret: secretsmanager.Secret;
  public readonly configParams: Map<string, ssm.StringParameter>;

  constructor(scope: Construct, id: string, props: SecurityConfigProps) {
    super(scope, id);

    const { config, removalPolicy } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create database credentials secret
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: resourceName('db-credentials'),
      description: 'Database credentials for the application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludeCharacters: ' "\'\\',
      },
      removalPolicy,
    });

    // Create API key secret
    this.apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: resourceName('api-key'),
      description: 'External API key',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: cdk.Fn.base64(cdk.Stack.of(this).stackId),
        }),
        generateStringKey: 'apiSecret',
        passwordLength: 48,
      },
      removalPolicy,
    });

    // Create Parameter Store entries for non-sensitive config
    this.configParams = new Map();

    const parameters = {
      'app-config': JSON.stringify({
        appName: `${config.company}-${config.division}`,
        environment: config.environmentSuffix,
        logLevel: config.environmentSuffix.includes('prod') ? 'info' : 'debug',
        features: {
          monitoring: true,
          analytics: config.environmentSuffix.includes('prod'),
        },
      }),
      'database-host': config.environmentSuffix.includes('prod')
        ? 'prod-db.example.com'
        : 'dev-db.example.com',
      'redis-endpoint': config.environmentSuffix.includes('prod')
        ? 'prod-redis.example.com:6379'
        : 'dev-redis.example.com:6379',
      'api-timeout': '30000',
      'max-retries': '3',
    };

    for (const [key, value] of Object.entries(parameters)) {
      const param = new ssm.StringParameter(this, `Param-${key}`, {
        parameterName: `/${config.company}/${config.division}/${config.environmentSuffix}/${key}`,
        stringValue: value,
        description: `Configuration parameter: ${key}`,
        tier: ssm.ParameterTier.STANDARD,
      });

      this.configParams.set(key, param);
    }

    // Add secret rotation for database credentials (production only)
    if (config.environmentSuffix.includes('prod')) {
      new secretsmanager.RotationSchedule(this, 'DbSecretRotation', {
        secret: this.dbSecret,
        hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
        automaticallyAfter: cdk.Duration.days(30),
      });
    }

    // Add construct outputs
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'ARN of the database credentials secret',
      exportName: `${resourceName('db-secret-arn')}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretName', {
      value: this.dbSecret.secretName,
      description: 'Name of the database credentials secret',
      exportName: `${resourceName('db-secret-name')}`,
    });

    new cdk.CfnOutput(this, 'ApiKeySecretArn', {
      value: this.apiKeySecret.secretArn,
      description: 'ARN of the API key secret',
      exportName: `${resourceName('api-key-secret-arn')}`,
    });

    new cdk.CfnOutput(this, 'ApiKeySecretName', {
      value: this.apiKeySecret.secretName,
      description: 'Name of the API key secret',
      exportName: `${resourceName('api-key-secret-name')}`,
    });

    // Output parameter store paths
    new cdk.CfnOutput(this, 'ParameterStorePrefix', {
      value: `/${config.company}/${config.division}/${config.environmentSuffix}`,
      description: 'Parameter Store path prefix for configuration parameters',
      exportName: `${resourceName('parameter-store-prefix')}`,
    });
  }
}
