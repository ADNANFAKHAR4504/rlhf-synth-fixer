import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ConfigManagementStack } from '../lib/config-management-stack';
import { AppConfigStack } from '../lib/appconfig-stack';
import { ParameterSecretsStack } from '../lib/parameter-secrets-stack';
import { StepFunctionsOrchestrationStack } from '../lib/stepfunctions-orchestration-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('Stack creates outputs', () => {
    // Verify the stack has outputs
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('Region', {
      Description: 'AWS Region for deployment',
    });
    template.hasOutput('EnvironmentSuffix', {
      Value: environmentSuffix,
      Description: 'Environment suffix for this deployment',
    });
    template.hasOutput('StateMachineArn', {
      Description: 'Step Functions state machine for config deployment orchestration',
    });
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const newApp = new cdk.App();
    const stackWithoutSuffix = new TapStack(newApp, 'TestDefaultStack');
    const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);

    templateWithoutSuffix.hasOutput('EnvironmentSuffix', {
      Description: 'Environment suffix for this deployment',
    });
  });

  test('Stack uses context environmentSuffix when provided', () => {
    const newApp = new cdk.App();
    newApp.node.setContext('environmentSuffix', 'context-test');
    const stackWithContext = new TapStack(newApp, 'TestContextStack');
    const templateWithContext = Template.fromStack(stackWithContext);

    templateWithContext.hasOutput('EnvironmentSuffix', {
      Value: 'context-test',
      Description: 'Environment suffix for this deployment',
    });
  });
});

describe('ConfigManagementStack', () => {
  let app: cdk.App;
  let stack: ConfigManagementStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ConfigManagementStack(app, 'TestConfigStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const newApp = new cdk.App();
    const stackWithoutSuffix = new ConfigManagementStack(newApp, 'TestDefaultConfigStack');
    const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);

    templateWithoutSuffix.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'mobile-app-config-backup-dev',
    });
  });

  test('Creates S3 bucket with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: `mobile-app-config-backup-${environmentSuffix}`,
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'archive-old-backups',
            Status: 'Enabled',
            Transitions: Match.arrayWith([
              Match.objectLike({
                StorageClass: 'GLACIER',
                TransitionInDays: 90,
              }),
            ]),
            ExpirationInDays: 365,
          }),
        ]),
      },
    });
  });

  test('Creates DynamoDB table with correct configuration', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: `MobileAppConfigHistory-${environmentSuffix}`,
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      SSESpecification: {
        SSEEnabled: true,
      },
      KeySchema: [
        {
          AttributeName: 'configId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'timestamp',
          KeyType: 'RANGE',
        },
      ],
    });
  });

  test('Creates DynamoDB table with GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'TimestampIndex',
          KeySchema: [
            {
              AttributeName: 'configType',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE',
            },
          ],
        }),
      ]),
    });
  });

  test('Creates IAM roles with correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `MobileAppConfigAccess-${environmentSuffix}`,
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }),
        ]),
      }),
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `ConfigLambdaExecution-${environmentSuffix}`,
    });
  });

  test('Creates Lambda functions', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `config-validator-${environmentSuffix}`,
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      Timeout: 30,
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `config-backup-${environmentSuffix}`,
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      Timeout: 300,
    });
  });

  test('Creates CloudWatch alarm', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: `config-validation-failures-${environmentSuffix}`,
      MetricName: 'Errors',
      Threshold: 5,
      EvaluationPeriods: 1,
    });
  });

  test('Creates CloudWatch dashboard', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: `MobileAppConfig-${environmentSuffix}`,
    });
  });

  test('Creates EventBridge rule for daily backups', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: `config-daily-backup-${environmentSuffix}`,
      ScheduleExpression: 'cron(0 2 * * ? *)',
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('ConfigHistoryTableName', {
      Description: 'DynamoDB table for configuration history',
    });
    template.hasOutput('BackupBucketName', {
      Description: 'S3 bucket for configuration backups',
    });
    template.hasOutput('MobileAppRoleArn', {
      Description: 'IAM role for mobile application access',
    });
    template.hasOutput('ValidatorFunctionArn', {
      Description: 'Configuration validator Lambda function ARN',
    });
  });
});

describe('AppConfigStack', () => {
  let app: cdk.App;
  let mockValidatorFunction: any;
  let stack: AppConfigStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create a mock validator function
    const mockStack = new cdk.Stack(app, 'MockStack');
    mockValidatorFunction = new cdk.aws_lambda.Function(mockStack, 'MockFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: cdk.aws_lambda.Code.fromInline('exports.handler = () => {}'),
    });

    stack = new AppConfigStack(app, 'TestAppConfigStack', {
      environmentSuffix,
      validatorFunction: mockValidatorFunction,
    });
    template = Template.fromStack(stack);
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const newApp = new cdk.App();
    const newMockStack = new cdk.Stack(newApp, 'NewMockStack');
    const newMockValidatorFunction = new cdk.aws_lambda.Function(newMockStack, 'NewMockFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: cdk.aws_lambda.Code.fromInline('exports.handler = () => {}'),
    });

    const stackWithoutSuffix = new AppConfigStack(newApp, 'TestDefaultAppConfigStack', {
      validatorFunction: newMockValidatorFunction,
    });
    const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);

    templateWithoutSuffix.hasResourceProperties('AWS::AppConfig::Application', {
      Name: 'MobileApp-dev',
    });
  });

  test('Creates AppConfig application', () => {
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Name: `MobileApp-${environmentSuffix}`,
      Description: 'Configuration management for mobile application',
    });
  });

  test('Creates AppConfig deployment strategy', () => {
    template.hasResourceProperties('AWS::AppConfig::DeploymentStrategy', {
      Name: `GradualRollout-${environmentSuffix}`,
      DeploymentDurationInMinutes: 15,
      FinalBakeTimeInMinutes: 5,
      GrowthFactor: 20,
      GrowthType: 'LINEAR',
      ReplicateTo: 'NONE',
    });
  });

  test('Creates AppConfig environment', () => {
    template.hasResourceProperties('AWS::AppConfig::Environment', {
      Name: `Production-${environmentSuffix}`,
      Description: 'Production environment for mobile app configuration',
    });
  });

  test('Creates AppConfig configuration profile', () => {
    template.hasResourceProperties('AWS::AppConfig::ConfigurationProfile', {
      Name: 'FeatureFlags',
      LocationUri: 'hosted',
      Type: 'AWS.AppConfig.FeatureFlags',
      Validators: Match.arrayWith([
        Match.objectLike({
          Type: 'LAMBDA',
        }),
      ]),
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('AppConfigApplicationId', {
      Description: 'AppConfig Application ID',
    });
    template.hasOutput('AppConfigEnvironmentId', {
      Description: 'AppConfig Environment ID',
    });
    template.hasOutput('DeploymentStrategyId', {
      Description: 'AppConfig Deployment Strategy ID',
    });
  });
});

describe('ParameterSecretsStack', () => {
  let app: cdk.App;
  let mockMobileAppRole: any;
  let stack: ParameterSecretsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create a mock IAM role
    const mockStack = new cdk.Stack(app, 'MockStack');
    mockMobileAppRole = new cdk.aws_iam.Role(mockStack, 'MockRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    stack = new ParameterSecretsStack(app, 'TestParameterSecretsStack', {
      environmentSuffix,
      mobileAppRole: mockMobileAppRole,
    });
    template = Template.fromStack(stack);
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const newApp = new cdk.App();
    const newMockStack = new cdk.Stack(newApp, 'NewMockStack2');
    const newMockMobileAppRole = new cdk.aws_iam.Role(newMockStack, 'NewMockRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    const stackWithoutSuffix = new ParameterSecretsStack(newApp, 'TestDefaultParameterSecretsStack', {
      mobileAppRole: newMockMobileAppRole,
    });
    const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);

    templateWithoutSuffix.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'mobile-app/api-keys/dev',
    });
  });

  test('Creates API key secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: `mobile-app/api-keys/${environmentSuffix}`,
      Description: 'API keys for mobile application',
    });
  });

  test('Creates database credentials secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: `mobile-app/database/${environmentSuffix}`,
      Description: 'Database credentials for mobile application',
    });
  });

  test('Creates third-party service secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: `mobile-app/third-party/${environmentSuffix}`,
      Description: 'Third-party service credentials',
    });
  });

  test('Creates auth token secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: `mobile-app/auth-token/${environmentSuffix}`,
      Description: 'Authentication token for services',
    });
  });

  test('Creates SSM parameters', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/mobile-app/config/${environmentSuffix}/api-endpoint`,
      Value: 'https://api.example.com/v1',
      Description: 'API endpoint for mobile application',
      Tier: 'Standard',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/mobile-app/config/${environmentSuffix}/api-timeout`,
      Value: '30000',
      Description: 'API timeout in milliseconds',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/mobile-app/config/${environmentSuffix}/max-retries`,
      Value: '3',
      Description: 'Maximum number of API retries',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/mobile-app/config/${environmentSuffix}/shared-config`,
      Tier: 'Advanced',
      Description: 'Shared configuration for cross-account access',
    });
  });

  test('Stack has correct outputs', () => {
    template.hasOutput('ApiKeySecretArn', {
      Description: 'ARN of the API key secret',
    });
    template.hasOutput('SharedConfigParameterArn', {
      Description: 'ARN of the shared configuration parameter',
    });
  });
});
