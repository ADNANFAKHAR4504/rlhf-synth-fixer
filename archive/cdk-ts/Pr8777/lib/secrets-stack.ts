import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecretsConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
}

export class SecretsConstruct extends Construct {
  public readonly dbCredentials: secretsmanager.Secret;
  public readonly apiKey: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    // KMS key for secrets encryption
    const secretsKey = new kms.Key(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-secrets-key`,
      {
        description: 'KMS key for secrets encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Database credentials in Secrets Manager
    this.dbCredentials = new secretsmanager.Secret(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-db-credentials`,
      {
        secretName: `${props.commonTags.ProjectName}/${props.environmentSuffix}/database/credentials`,
        description: 'Database credentials for RDS cluster',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
        encryptionKey: secretsKey,
      }
    );

    // API key for external services
    this.apiKey = new secretsmanager.Secret(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-api-key`,
      {
        secretName: `${props.commonTags.ProjectName}/${props.environmentSuffix}/api/key`,
        description: 'API key for external service integration',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: 'api_key',
          passwordLength: 32,
        },
        encryptionKey: secretsKey,
      }
    );

    // Parameter Store values for non-sensitive configuration
    new ssm.StringParameter(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-config`,
      {
        parameterName: `/${props.commonTags.ProjectName}/${props.environmentSuffix}/app/config`,
        stringValue: JSON.stringify({
          logLevel: 'INFO',
          maxConnections: '100',
          timeout: '30',
        }),
        description: 'Application configuration parameters',
      }
    );

    new ssm.StringParameter(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-vpc-id`,
      {
        parameterName: `/${props.commonTags.ProjectName}/${props.environmentSuffix}/vpc/id`,
        stringValue: 'PLACEHOLDER', // This would be populated by the networking stack
        description: 'VPC ID for cross-stack reference',
      }
    );

    // Parameter for encryption salt (using regular string with base64 encoding)
    new ssm.StringParameter(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-encryption-salt`,
      {
        parameterName: `/${props.commonTags.ProjectName}/${props.environmentSuffix}/app/encryption-salt`,
        stringValue: cdk.Fn.base64(
          cdk.Fn.sub('${AWS::StackId}-${AWS::Region}')
        ),
        description: 'Encryption salt for application use',
      }
    );

    // Apply tags
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.dbCredentials).add(key, value);
      cdk.Tags.of(this.apiKey).add(key, value);
      cdk.Tags.of(secretsKey).add(key, value);
    });
  }
}
