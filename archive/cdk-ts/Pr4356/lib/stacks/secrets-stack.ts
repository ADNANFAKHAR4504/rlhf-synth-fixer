import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface SecretsStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecretsStack extends cdk.Stack {
  public readonly apiSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // API Secret for sensitive configuration
    this.apiSecret = new secretsmanager.Secret(
      this,
      `ApiSecret-${props.environmentSuffix}`,
      {
        secretName: `serverless-api-secret-${props.environmentSuffix}`,
        description: 'API keys and sensitive configuration',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            apiKey: 'placeholder',
            webhookUrl: 'placeholder',
          }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 32,
        },
      }
    );

    // Output secret ARN
    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.apiSecret.secretArn,
      description: 'Secret ARN',
      exportName: `ApiSecretArn-${props.environmentSuffix}`,
    });
  }
}
