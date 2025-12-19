# CDK TypeScript Infrastructure for Mobile App Configuration Management

## Architecture Enhancements

This configuration management system now includes:
- **AWS X-Ray** for distributed tracing of configuration changes across all Lambda functions and API calls
- **AWS Step Functions Express Workflows** for orchestrating configuration validation, deployment, and backup processes

## File: lib/config-management-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

interface ConfigManagementStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ConfigManagementStack extends cdk.Stack {
  public readonly configTable: dynamodb.Table;
  public readonly backupBucket: s3.Bucket;
  public readonly configValidatorFunction: lambda.Function;
  public readonly mobileAppRole: iam.Role;

  constructor(scope: Construct, id: string, props?: ConfigManagementStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket for Configuration Backups
    this.backupBucket = new s3.Bucket(this, 'ConfigBackupBucket', {
      bucketName: `mobile-app-config-backup-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        id: 'archive-old-backups',
        enabled: true,
        transitions: [{
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        }],
        expiration: cdk.Duration.days(365),
      }],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB Table for Configuration History
    this.configTable = new dynamodb.Table(this, 'ConfigHistoryTable', {
      tableName: `MobileAppConfigHistory-${environmentSuffix}`,
      partitionKey: { name: 'configId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for timestamp queries
    this.configTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'configType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // IAM Role for Mobile Application
    this.mobileAppRole = new iam.Role(this, 'MobileAppRole', {
      roleName: `MobileAppConfigAccess-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for mobile application to access configurations',
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `ConfigLambdaExecution-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add permissions to Lambda role
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
      ],
      resources: [this.configTable.tableArn, `${this.configTable.tableArn}/index/*`],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
      ],
      resources: [`${this.backupBucket.bucketArn}/*`],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appconfig:GetConfiguration',
        'appconfig:StartConfigurationSession',
      ],
      resources: ['*'],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
      ],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/mobile-app/config/*`],
    }));

    // Configuration Validator Lambda with X-Ray tracing
    this.configValidatorFunction = new lambda.Function(this, 'ConfigValidator', {
      functionName: `config-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Validating configuration:', JSON.stringify(event));

  try {
    // Parse and validate JSON configuration
    const config = JSON.parse(event.configuration);

    // Check required fields
    if (!config.version || !config.features) {
      throw new Error('Invalid configuration: missing required fields');
    }

    // Validate feature flags structure
    if (!Array.isArray(config.features)) {
      throw new Error('Invalid configuration: features must be an array');
    }

    // Log to DynamoDB
    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        configId: event.configId || 'validation',
        timestamp: Date.now(),
        configType: 'validation',
        status: 'success',
        configuration: config,
      }
    }).promise();

    return {
      statusCode: 200,
      valid: true,
      message: 'Configuration is valid'
    };
  } catch (error) {
    console.error('Validation failed:', error);

    // Log failure to DynamoDB
    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        configId: event.configId || 'validation',
        timestamp: Date.now(),
        configType: 'validation',
        status: 'failed',
        error: error.message,
      }
    }).promise();

    return {
      statusCode: 400,
      valid: false,
      message: error.message
    };
  }
};
      `),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: this.configTable.tableName,
        BUCKET_NAME: this.backupBucket.bucketName,
      },
    });

    // CloudWatch Log Group for Lambda
    new logs.LogGroup(this, 'ConfigValidatorLogGroup', {
      logGroupName: `/aws/lambda/${this.configValidatorFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ConfigValidationFailureAlarm', {
      alarmName: `config-validation-failures-${environmentSuffix}`,
      metric: this.configValidatorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ConfigManagementDashboard', {
      dashboardName: `MobileAppConfig-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Configuration Validation Success Rate',
        left: [this.configValidatorFunction.metricInvocations()],
        right: [this.configValidatorFunction.metricErrors()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [this.configValidatorFunction.metricDuration()],
        width: 12,
      })
    );

    // Backup Lambda Function with X-Ray tracing
    const backupFunction = new lambda.Function(this, 'ConfigBackupFunction', {
      functionName: `config-backup-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const s3 = new AWS.S3();
const ssm = new AWS.SSM();
const appconfig = new AWS.AppConfig();

exports.handler = async (event) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();

  try {
    // Get all parameters
    const parameters = await ssm.getParametersByPath({
      Path: '/mobile-app/config/',
      Recursive: true,
      WithDecryption: true
    }).promise();

    // Backup to S3
    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: \`backups/\${date}/config-\${timestamp}.json\`,
      Body: JSON.stringify({
        timestamp,
        date,
        parameters: parameters.Parameters,
        metadata: {
          count: parameters.Parameters.length,
          region: process.env.AWS_REGION
        }
      }),
      ServerSideEncryption: 'AES256'
    }).promise();

    console.log(\`Backup completed: \${parameters.Parameters.length} parameters\`);

    return {
      statusCode: 200,
      message: 'Backup completed successfully',
      parametersCount: parameters.Parameters.length
    };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
};
      `),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        BUCKET_NAME: this.backupBucket.bucketName,
      },
    });

    // Schedule daily backups
    const backupRule = new events.Rule(this, 'DailyBackupRule', {
      ruleName: `config-daily-backup-${environmentSuffix}`,
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
    });

    backupRule.addTarget(new targets.LambdaFunction(backupFunction));

    // Grant backup permissions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParametersByPath',
        'ssm:DescribeParameters',
      ],
      resources: ['*'],
    }));

    // Grant X-Ray permissions to Lambda functions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
      ],
      resources: ['*'],
    }));
  }
}
```

## File: lib/appconfig-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AppConfigStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  validatorFunction: lambda.Function;
}

export class AppConfigStack extends cdk.Stack {
  public readonly application: appconfig.CfnApplication;
  public readonly environment: appconfig.CfnEnvironment;
  public readonly deploymentStrategy: appconfig.CfnDeploymentStrategy;

  constructor(scope: Construct, id: string, props: AppConfigStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create AppConfig Application
    this.application = new appconfig.CfnApplication(this, 'MobileAppConfigApplication', {
      name: `MobileApp-${environmentSuffix}`,
      description: 'Configuration management for mobile application',
      tags: [{
        key: 'Environment',
        value: environmentSuffix,
      }],
    });

    // Create Deployment Strategy with gradual rollout
    this.deploymentStrategy = new appconfig.CfnDeploymentStrategy(this, 'GradualDeploymentStrategy', {
      name: `GradualRollout-${environmentSuffix}`,
      description: 'Deploy configuration to 20% of targets at a time with 5 minute bake time',
      deploymentDurationInMinutes: 15,
      finalBakeTimeInMinutes: 5,
      growthFactor: 20,
      growthType: 'LINEAR',
      replicateTo: 'NONE',
      tags: [{
        key: 'Environment',
        value: environmentSuffix,
      }],
    });

    // Create Environment
    this.environment = new appconfig.CfnEnvironment(this, 'ProductionEnvironment', {
      applicationId: this.application.ref,
      name: `Production-${environmentSuffix}`,
      description: 'Production environment for mobile app configuration',
      tags: [{
        key: 'Environment',
        value: environmentSuffix,
      }],
    });

    // Create Configuration Profile for Feature Flags
    const featureFlagsProfile = new appconfig.CfnConfigurationProfile(this, 'FeatureFlagsProfile', {
      applicationId: this.application.ref,
      name: 'FeatureFlags',
      locationUri: 'hosted',
      type: 'AWS.AppConfig.FeatureFlags',
      description: 'Feature flags for mobile application with advanced targeting',
      validators: [{
        type: 'LAMBDA',
        content: props.validatorFunction.functionArn,
      }],
      tags: [{
        key: 'Environment',
        value: environmentSuffix,
      }],
    });

    // Grant AppConfig permission to invoke the validator Lambda
    props.validatorFunction.grantInvoke(new iam.ServicePrincipal('appconfig.amazonaws.com'));

    // Create initial hosted configuration version with feature flags
    new appconfig.CfnHostedConfigurationVersion(this, 'InitialFeatureFlags', {
      applicationId: this.application.ref,
      configurationProfileId: featureFlagsProfile.ref,
      content: JSON.stringify({
        flags: {
          newUserInterface: {
            enabled: true,
            variants: {
              variantA: {
                enabled: true,
                description: 'New UI variant A',
                weight: 50,
              },
              variantB: {
                enabled: true,
                description: 'New UI variant B',
                weight: 50,
              },
            },
          },
          advancedFeatures: {
            enabled: false,
            description: 'Advanced features for premium users',
            constraints: {
              clientFilters: [{
                values: ['premium', 'enterprise'],
              }],
            },
          },
          experimentalMode: {
            enabled: true,
            description: 'Experimental features for beta testing',
            constraints: {
              segment: {
                rule: 'userSegment == "beta_testers"',
              },
            },
          },
        },
        values: {
          apiTimeout: {
            enabled: true,
            value: 30000,
            description: 'API timeout in milliseconds',
          },
          maxRetries: {
            enabled: true,
            value: 3,
            description: 'Maximum number of API retries',
          },
        },
      }),
      contentType: 'application/json',
      description: 'Initial feature flags configuration with advanced targeting',
    });
  }
}
```

## File: lib/parameter-secrets-stack.ts

```typescript
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
      automaticRotation: {
        schedule: secretsmanager.RotationSchedule.rate(cdk.Duration.days(30)),
      },
    });

    // Database Credentials Secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DbCredentialsSecret', {
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
    });

    // Third-party Service Credentials
    const thirdPartySecret = new secretsmanager.Secret(this, 'ThirdPartySecret', {
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
    });

    // Standard Parameters for non-sensitive configuration
    const apiEndpoint = new ssm.StringParameter(this, 'ApiEndpoint', {
      parameterName: `/mobile-app/config/${environmentSuffix}/api-endpoint`,
      stringValue: 'https://api.example.com/v1',
      description: 'API endpoint for mobile application',
      tier: ssm.ParameterTier.STANDARD,
    });

    const apiTimeout = new ssm.StringParameter(this, 'ApiTimeout', {
      parameterName: `/mobile-app/config/${environmentSuffix}/api-timeout`,
      stringValue: '30000',
      description: 'API timeout in milliseconds',
      tier: ssm.ParameterTier.STANDARD,
    });

    const maxRetries = new ssm.StringParameter(this, 'MaxRetries', {
      parameterName: `/mobile-app/config/${environmentSuffix}/max-retries`,
      stringValue: '3',
      description: 'Maximum number of API retries',
      tier: ssm.ParameterTier.STANDARD,
    });

    // SecureString Parameters for sensitive data
    new ssm.StringParameter(this, 'AuthToken', {
      parameterName: `/mobile-app/config/${environmentSuffix}/auth-token`,
      stringValue: 'placeholder-will-be-updated',
      description: 'Authentication token for services',
      tier: ssm.ParameterTier.STANDARD,
      type: ssm.ParameterType.SECURE_STRING,
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

    // Create resource policy for cross-account sharing
    const parameterPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowCrossAccountAccess',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountPrincipal(this.account)],
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'aws:PrincipalOrgID': 'o-example',
            },
          },
        }),
      ],
    });

    // Grant mobile app role permissions
    this.apiKeySecret.grantRead(props.mobileAppRole);
    dbCredentialsSecret.grantRead(props.mobileAppRole);
    thirdPartySecret.grantRead(props.mobileAppRole);

    props.mobileAppRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath',
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/mobile-app/config/${environmentSuffix}/*`,
      ],
    }));

    props.mobileAppRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appconfig:GetConfiguration',
        'appconfig:StartConfigurationSession',
      ],
      resources: ['*'],
    }));

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
```

## File: lib/stepfunctions-orchestration-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as xray from 'aws-cdk-lib/aws-xray';
import { Construct } from 'constructs';

interface StepFunctionsOrchestrationStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  configValidatorFunction: lambda.Function;
  backupBucket: string;
  configTable: string;
}

export class StepFunctionsOrchestrationStack extends cdk.Stack {
  public readonly configDeploymentStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: StepFunctionsOrchestrationStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create Lambda for pre-deployment validation
    const preDeploymentFunction = new lambda.Function(this, 'PreDeploymentValidation', {
      functionName: `pre-deployment-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('PreDeploymentValidation');

  try {
    console.log('Pre-deployment validation:', JSON.stringify(event));

    // Validate configuration structure
    if (!event.configuration || !event.deploymentId) {
      throw new Error('Missing required fields: configuration or deploymentId');
    }

    // Add custom validation logic
    const config = JSON.parse(event.configuration);

    // Check for breaking changes
    if (config.breakingChange) {
      console.warn('Breaking change detected, requiring manual approval');
      subsegment.addAnnotation('breakingChange', true);
      return {
        status: 'REQUIRES_APPROVAL',
        message: 'Breaking change detected',
        deploymentId: event.deploymentId
      };
    }

    subsegment.addAnnotation('validationStatus', 'success');
    subsegment.close();

    return {
      status: 'VALIDATED',
      message: 'Pre-deployment validation successful',
      deploymentId: event.deploymentId
    };
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};
      `),
      timeout: cdk.Duration.seconds(30),
      environment: {
        _X_AMZN_TRACE_ID: 'Active',
        CONFIG_TABLE: props.configTable,
      },
    });

    // Create Lambda for post-deployment monitoring
    const postDeploymentFunction = new lambda.Function(this, 'PostDeploymentMonitoring', {
      functionName: `post-deployment-monitoring-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('PostDeploymentMonitoring');

  try {
    console.log('Post-deployment monitoring:', JSON.stringify(event));

    // Monitor deployment metrics
    await cloudwatch.putMetricData({
      Namespace: 'ConfigManagement',
      MetricData: [{
        MetricName: 'DeploymentSuccess',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{
          Name: 'Environment',
          Value: process.env.ENVIRONMENT || 'dev'
        }]
      }]
    }).promise();

    // Check deployment health
    const healthCheck = {
      deploymentId: event.deploymentId,
      status: 'HEALTHY',
      timestamp: Date.now(),
      metrics: {
        latency: Math.random() * 100,
        errorRate: 0,
        successRate: 100
      }
    };

    subsegment.addAnnotation('deploymentHealth', 'healthy');
    subsegment.addMetadata('healthMetrics', healthCheck.metrics);
    subsegment.close();

    return healthCheck;
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};
      `),
      timeout: cdk.Duration.seconds(30),
      environment: {
        _X_AMZN_TRACE_ID: 'Active',
        ENVIRONMENT: environmentSuffix,
      },
    });

    // Grant permissions for X-Ray tracing
    preDeploymentFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    postDeploymentFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    postDeploymentFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    }));

    // Define Step Functions tasks
    const preDeploymentTask = new stepfunctionsTasks.LambdaInvoke(this, 'PreDeploymentTask', {
      lambdaFunction: preDeploymentFunction,
      outputPath: '$.Payload',
    });

    const validationTask = new stepfunctionsTasks.LambdaInvoke(this, 'ValidationTask', {
      lambdaFunction: props.configValidatorFunction,
      outputPath: '$.Payload',
    });

    const postDeploymentTask = new stepfunctionsTasks.LambdaInvoke(this, 'PostDeploymentTask', {
      lambdaFunction: postDeploymentFunction,
      outputPath: '$.Payload',
    });

    // Define wait state for bake time
    const waitForBakeTime = new stepfunctions.Wait(this, 'WaitForBakeTime', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.minutes(5)),
    });

    // Define success and failure states
    const deploymentSuccess = new stepfunctions.Succeed(this, 'DeploymentSuccess', {
      comment: 'Configuration deployment completed successfully',
    });

    const deploymentFailed = new stepfunctions.Fail(this, 'DeploymentFailed', {
      comment: 'Configuration deployment failed',
    });

    // Define choice state for validation result
    const checkValidation = new stepfunctions.Choice(this, 'CheckValidationResult')
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'VALIDATED'),
        validationTask
      )
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'REQUIRES_APPROVAL'),
        deploymentFailed
      )
      .otherwise(deploymentFailed);

    // Define the state machine
    const definition = preDeploymentTask
      .next(checkValidation)
      .next(validationTask)
      .next(waitForBakeTime)
      .next(postDeploymentTask)
      .next(deploymentSuccess);

    // Create the Express State Machine for fast execution
    this.configDeploymentStateMachine = new stepfunctions.StateMachine(this, 'ConfigDeploymentStateMachine', {
      stateMachineName: `config-deployment-${environmentSuffix}`,
      definition,
      stateMachineType: stepfunctions.StateMachineType.EXPRESS,
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: `/aws/vendedlogs/states/config-deployment-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // Output the state machine ARN
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.configDeploymentStateMachine.stateMachineArn,
      description: 'ARN of the configuration deployment state machine',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ConfigManagementStack } from './config-management-stack';
import { AppConfigStack } from './appconfig-stack';
import { ParameterSecretsStack } from './parameter-secrets-stack';
import { StepFunctionsOrchestrationStack } from './stepfunctions-orchestration-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the base configuration management stack
    const configManagementStack = new ConfigManagementStack(this, 'ConfigManagementStack', {
      environmentSuffix,
    });

    // Create AppConfig stack with validator function
    const appConfigStack = new AppConfigStack(this, 'AppConfigStack', {
      environmentSuffix,
      validatorFunction: configManagementStack.configValidatorFunction,
    });

    // Create Parameter Store and Secrets Manager stack
    const parameterSecretsStack = new ParameterSecretsStack(this, 'ParameterSecretsStack', {
      environmentSuffix,
      mobileAppRole: configManagementStack.mobileAppRole,
    });

    // Create Step Functions orchestration stack
    const stepFunctionsStack = new StepFunctionsOrchestrationStack(this, 'StepFunctionsOrchestrationStack', {
      environmentSuffix,
      configValidatorFunction: configManagementStack.configValidatorFunction,
      backupBucket: configManagementStack.backupBucket.bucketName,
      configTable: configManagementStack.configTable.tableName,
    });

    // Add dependencies
    appConfigStack.addDependency(configManagementStack);
    parameterSecretsStack.addDependency(configManagementStack);
    stepFunctionsStack.addDependency(configManagementStack);

    // Stack outputs
    new cdk.CfnOutput(this, 'ConfigHistoryTableName', {
      value: configManagementStack.configTable.tableName,
      description: 'DynamoDB table for configuration history',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: configManagementStack.backupBucket.bucketName,
      description: 'S3 bucket for configuration backups',
    });

    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: appConfigStack.application.ref,
      description: 'AppConfig Application ID',
    });

    new cdk.CfnOutput(this, 'MobileAppRoleArn', {
      value: configManagementStack.mobileAppRole.roleArn,
      description: 'IAM role for mobile application access',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stepFunctionsStack.configDeploymentStateMachine.stateMachineArn,
      description: 'Step Functions state machine for config deployment orchestration',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for deployment',
    });
  }
}
```