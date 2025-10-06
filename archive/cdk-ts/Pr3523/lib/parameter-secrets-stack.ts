import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ParameterSecretsStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  mobileAppRole: iam.Role;
}

export class ParameterSecretsStack extends cdk.Stack {
  public readonly apiKeySecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: ParameterSecretsStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create API Key Secret with automatic rotation
    this.apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: `mobile-app/api-keys/${environmentSuffix}`,
      description: 'API keys for mobile application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          primaryKey: '',
          secondaryKey: '',
        }),
        generateStringKey: 'apiKey',
        excludeCharacters: ' ',
        passwordLength: 32,
      },
    });

    // Note: Automatic rotation requires a Lambda function for API keys
    // This would need to be implemented with a custom Lambda rotation function
    // For now, manual rotation can be done through the AWS Console

    // Database Credentials Secret
    const dbCredentialsSecret = new secretsmanager.Secret(
      this,
      'DbCredentialsSecret',
      {
        secretName: `mobile-app/database/${environmentSuffix}`,
        description: 'Database credentials for mobile application',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'admin',
            database: 'mobileapp',
          }),
          generateStringKey: 'password',
          excludeCharacters: ' "\'\\',
          passwordLength: 24,
        },
      }
    );

    // Third-party Service Credentials
    const thirdPartySecret = new secretsmanager.Secret(
      this,
      'ThirdPartySecret',
      {
        secretName: `mobile-app/third-party/${environmentSuffix}`,
        description: 'Third-party service credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            serviceName: 'analytics',
            endpoint: '',
          }),
          generateStringKey: 'token',
          excludeCharacters: ' ',
          passwordLength: 40,
        },
      }
    );

    // Standard Parameters for non-sensitive configuration
    new ssm.StringParameter(this, 'ApiEndpoint', {
      parameterName: `/mobile-app/config/${environmentSuffix}/api-endpoint`,
      stringValue: 'https://api.example.com/v1',
      description: 'API endpoint for mobile application',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'ApiTimeout', {
      parameterName: `/mobile-app/config/${environmentSuffix}/api-timeout`,
      stringValue: '30000',
      description: 'API timeout in milliseconds',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'MaxRetries', {
      parameterName: `/mobile-app/config/${environmentSuffix}/max-retries`,
      stringValue: '3',
      description: 'Maximum number of API retries',
      tier: ssm.ParameterTier.STANDARD,
    });

    // SecureString Parameters should be stored in Secrets Manager
    // For authentication token, using Secrets Manager instead
    const authTokenSecret = new secretsmanager.Secret(this, 'AuthTokenSecret', {
      secretName: `mobile-app/auth-token/${environmentSuffix}`,
      description: 'Authentication token for services',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          service: 'mobile-app',
        }),
        generateStringKey: 'authToken',
        excludeCharacters: ' ',
        passwordLength: 40,
      },
    });

    // Advanced tier parameter for cross-account sharing
    const sharedConfig = new ssm.StringParameter(this, 'SharedConfiguration', {
      parameterName: `/mobile-app/config/${environmentSuffix}/shared-config`,
      stringValue: JSON.stringify({
        version: '1.0.0',
        features: {
          analytics: true,
          logging: true,
          caching: false,
        },
        endpoints: {
          primary: 'https://primary.example.com',
          secondary: 'https://secondary.example.com',
        },
      }),
      description: 'Shared configuration for cross-account access',
      tier: ssm.ParameterTier.ADVANCED,
    });

    // Create resource policy for cross-account sharing (not currently used, kept for reference)
    // const parameterPolicy = new iam.PolicyDocument({
    //   statements: [
    //     new iam.PolicyStatement({
    //       sid: 'AllowCrossAccountAccess',
    //       effect: iam.Effect.ALLOW,
    //       principals: [new iam.AccountPrincipal(this.account)],
    //       actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    //       resources: ['*'],
    //       conditions: {
    //         StringEquals: {
    //           'aws:PrincipalOrgID': 'o-example',
    //         },
    //       },
    //     }),
    //   ],
    // });

    // Grant mobile app role permissions
    this.apiKeySecret.grantRead(props.mobileAppRole);
    dbCredentialsSecret.grantRead(props.mobileAppRole);
    thirdPartySecret.grantRead(props.mobileAppRole);
    authTokenSecret.grantRead(props.mobileAppRole);

    props.mobileAppRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/mobile-app/config/${environmentSuffix}/*`,
        ],
      })
    );

    props.mobileAppRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'appconfig:GetConfiguration',
          'appconfig:StartConfigurationSession',
        ],
        resources: ['*'],
      })
    );

    // Output important ARNs
    new cdk.CfnOutput(this, 'ApiKeySecretArn', {
      value: this.apiKeySecret.secretArn,
      description: 'ARN of the API key secret',
    });

    new cdk.CfnOutput(this, 'SharedConfigParameterArn', {
      value: sharedConfig.parameterArn,
      description: 'ARN of the shared configuration parameter',
    });
  }
}
