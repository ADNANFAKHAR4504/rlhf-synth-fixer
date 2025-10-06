# AWS CDK Configuration Management Infrastructure

## Main Stack

```typescript
// lib/tap-stack.ts
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
    const configManagementStack = new ConfigManagementStack(
      this,
      'ConfigManagementStack',
      {
        environmentSuffix,
      }
    );

    // Create AppConfig stack with validator function
    new AppConfigStack(this, 'AppConfigStack', {
      environmentSuffix,
      validatorFunction: configManagementStack.configValidatorFunction,
    });

    // Create Parameter Store and Secrets Manager stack
    new ParameterSecretsStack(this, 'ParameterSecretsStack', {
      environmentSuffix,
      mobileAppRole: configManagementStack.mobileAppRole,
    });

    // Create Step Functions orchestration stack
    const stepFunctionsStack = new StepFunctionsOrchestrationStack(
      this,
      'StepFunctionsOrchestrationStack',
      {
        environmentSuffix,
        configValidatorFunction: configManagementStack.configValidatorFunction,
        backupBucket: configManagementStack.backupBucket.bucketName,
        configTable: configManagementStack.configTable.tableName,
      }
    );

    // Stack outputs
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for deployment',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for this deployment',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stepFunctionsStack.configDeploymentStateMachine.stateMachineArn,
      description: 'Step Functions state machine for config deployment orchestration',
    });
  }
}
```

## Configuration Management Stack

```typescript
// lib/config-management-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table for Configuration History
    this.configTable = new dynamodb.Table(this, 'ConfigHistoryTable', {
      tableName: `MobileAppConfigHistory-${environmentSuffix}`,
      partitionKey: { name: 'configId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    // Lambda Execution Role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `ConfigLambdaExecution-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add specific permissions to Lambda role
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
      ],
      resources: [this.configTable.tableArn, `${this.configTable.tableArn}/index/*`],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
      resources: [this.backupBucket.bucketArn, `${this.backupBucket.bucketArn}/*`],
    }));

    // Configuration Validator Lambda Function
    this.configValidatorFunction = new lambda.Function(this, 'ConfigValidator', {
      functionName: `config-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('Validating configuration:', JSON.stringify(event));

          // Validate JSON schema
          try {
            const config = typeof event.configuration === 'string'
              ? JSON.parse(event.configuration)
              : event.configuration;

            // Check required fields
            if (!config.version || !config.environment) {
              return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: version or environment' })
              };
            }

            // Log validation to DynamoDB
            await dynamodb.put({
              TableName: process.env.TABLE_NAME,
              Item: {
                configId: 'validation-' + Date.now(),
                timestamp: Date.now(),
                configType: 'validation',
                result: 'success',
                configuration: config
              }
            }).promise();

            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Configuration validated successfully', config })
            };
          } catch (error) {
            console.error('Validation error:', error);
            return {
              statusCode: 400,
              body: JSON.stringify({ error: 'Invalid configuration: ' + error.message })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: this.configTable.tableName,
      },
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Configuration Backup Lambda Function
    const configBackupFunction = new lambda.Function(this, 'ConfigBackupFunction', {
      functionName: `config-backup-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          const timestamp = new Date().toISOString();
          const backupKey = 'backups/' + timestamp.split('T')[0] + '/config-' + Date.now() + '.json';

          try {
            // Scan all configurations from DynamoDB
            const configs = await dynamodb.scan({
              TableName: process.env.TABLE_NAME
            }).promise();

            // Backup to S3
            await s3.putObject({
              Bucket: process.env.BACKUP_BUCKET,
              Key: backupKey,
              Body: JSON.stringify(configs.Items),
              ContentType: 'application/json',
              ServerSideEncryption: 'AES256'
            }).promise();

            console.log('Backup completed:', backupKey);
            return { statusCode: 200, body: 'Backup completed: ' + backupKey };
          } catch (error) {
            console.error('Backup failed:', error);
            throw error;
          }
        };
      `),
      environment: {
        TABLE_NAME: this.configTable.tableName,
        BACKUP_BUCKET: this.backupBucket.bucketName,
      },
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    // CloudWatch Alarm for Configuration Validation Failures
    new cloudwatch.Alarm(this, 'ConfigValidationFailureAlarm', {
      alarmName: `ConfigValidationFailures-${environmentSuffix}`,
      metric: this.configValidatorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when configuration validation failures exceed threshold',
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'ConfigManagementDashboard', {
      dashboardName: `ConfigManagement-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: '# Configuration Management Dashboard\n## Environment: ' + environmentSuffix,
            width: 24,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Configuration Validations',
            left: [this.configValidatorFunction.metricInvocations()],
            right: [this.configValidatorFunction.metricErrors()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Operations',
            left: [this.configTable.metricConsumedReadCapacityUnits()],
            right: [this.configTable.metricConsumedWriteCapacityUnits()],
            width: 12,
          }),
        ],
      ],
    });

    // EventBridge Rule for Daily Backups
    const dailyBackupRule = new events.Rule(this, 'DailyBackupRule', {
      ruleName: `DailyConfigBackup-${environmentSuffix}`,
      description: 'Trigger daily configuration backups',
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
    });

    dailyBackupRule.addTarget(new targets.LambdaFunction(configBackupFunction));

    // Grant permissions to mobile app role
    this.mobileAppRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:Query'],
      resources: [this.configTable.tableArn, `${this.configTable.tableArn}/index/*`],
    }));

    // Stack Outputs
    new cdk.CfnOutput(this, 'ConfigHistoryTableName', {
      value: this.configTable.tableName,
      description: 'DynamoDB table for configuration history',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket for configuration backups',
    });

    new cdk.CfnOutput(this, 'ValidatorFunctionArn', {
      value: this.configValidatorFunction.functionArn,
      description: 'ARN of configuration validator Lambda function',
    });

    new cdk.CfnOutput(this, 'MobileAppRoleArn', {
      value: this.mobileAppRole.roleArn,
      description: 'ARN of mobile application IAM role',
    });
  }
}
```

## Step Functions Orchestration Stack

```typescript
// lib/stepfunctions-orchestration-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // Create Lambda for pre-deployment validation with X-Ray tracing
    const preDeploymentFunction = new lambda.Function(
      this,
      'PreDeploymentValidation',
      {
        functionName: `pre-deployment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
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
      message: 'Configuration validated for deployment',
      deploymentId: event.deploymentId,
      configuration: event.configuration
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
          CONFIG_TABLE: props.configTable,
        },
      }
    );

    // Create Lambda for post-deployment monitoring with X-Ray tracing
    const postDeploymentFunction = new lambda.Function(
      this,
      'PostDeploymentMonitoring',
      {
        functionName: `post-deployment-monitoring-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
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

    // Track deployment in X-Ray
    subsegment.addAnnotation('deploymentId', event.deploymentId);
    subsegment.addAnnotation('status', 'success');
    subsegment.addMetadata('configuration', event.configuration);

    subsegment.close();
    return {
      status: 'COMPLETED',
      message: 'Deployment monitoring completed',
      deploymentId: event.deploymentId,
      timestamp: new Date().toISOString()
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
          ENVIRONMENT: environmentSuffix,
        },
      }
    );

    // Grant X-Ray permissions to Lambda functions
    preDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    postDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Grant CloudWatch permissions to post-deployment function
    postDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Create Step Functions tasks
    const preDeploymentTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'PreDeploymentTask',
      {
        lambdaFunction: preDeploymentFunction,
        outputPath: '$.Payload',
      }
    );

    const validationTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ValidationTask',
      {
        lambdaFunction: props.configValidatorFunction,
        outputPath: '$.Payload',
      }
    );

    const postDeploymentTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'PostDeploymentTask',
      {
        lambdaFunction: postDeploymentFunction,
        outputPath: '$.Payload',
      }
    );

    // Define wait state for bake time
    const waitForBakeTime = new stepfunctions.Wait(this, 'WaitForBakeTime', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.minutes(5)),
    });

    // Define success and failure states
    const deploymentSuccess = new stepfunctions.Succeed(
      this,
      'DeploymentSuccess',
      {
        comment: 'Configuration deployment completed successfully',
      }
    );

    const deploymentFailed = new stepfunctions.Fail(this, 'DeploymentFailed', {
      comment: 'Configuration deployment failed',
    });

    // Chain the validation and post-deployment tasks
    const validationChain = validationTask
      .next(waitForBakeTime)
      .next(postDeploymentTask)
      .next(deploymentSuccess);

    // Define choice state for validation result
    const checkValidation = new stepfunctions.Choice(
      this,
      'CheckValidationResult'
    )
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'VALIDATED'),
        validationChain
      )
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'REQUIRES_APPROVAL'),
        deploymentFailed
      )
      .otherwise(deploymentFailed);

    // Define the state machine
    const definition = preDeploymentTask.next(checkValidation);

    // Create the Express State Machine for fast execution
    this.configDeploymentStateMachine = new stepfunctions.StateMachine(
      this,
      'ConfigDeploymentStateMachine',
      {
        stateMachineName: `config-deployment-${environmentSuffix}`,
        definition,
        stateMachineType: stepfunctions.StateMachineType.EXPRESS,
        tracingConfiguration: {
          enabled: true, // Enable X-Ray tracing for state machine
        },
        logs: {
          destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
            logGroupName: `/aws/vendedlogs/states/config-deployment-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: stepfunctions.LogLevel.ALL,
          includeExecutionData: true,
        },
      }
    );

    // Create CloudWatch Dashboard for monitoring
    new cloudwatch.Dashboard(this, 'StepFunctionsDashboard', {
      dashboardName: `ConfigDeploymentDashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: '# Configuration Deployment Pipeline\n## Environment: ' + environmentSuffix,
            width: 24,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'State Machine Executions',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/States',
                metricName: 'ExecutionsSucceeded',
                dimensionsMap: {
                  StateMachineArn: this.configDeploymentStateMachine.stateMachineArn,
                },
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/States',
                metricName: 'ExecutionsFailed',
                dimensionsMap: {
                  StateMachineArn: this.configDeploymentStateMachine.stateMachineArn,
                },
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Execution Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/States',
                metricName: 'ExecutionTime',
                dimensionsMap: {
                  StateMachineArn: this.configDeploymentStateMachine.stateMachineArn,
                },
                statistic: 'Average',
              }),
            ],
            width: 12,
          }),
        ],
      ],
    });

    // Output the state machine ARN
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.configDeploymentStateMachine.stateMachineArn,
      description: 'ARN of the configuration deployment state machine',
    });

    new cdk.CfnOutput(this, 'StateMachineName', {
      value: `config-deployment-${environmentSuffix}`,
      description: 'Name of the configuration deployment state machine',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: `ConfigDeploymentDashboard-${environmentSuffix}`,
      description: 'CloudWatch Dashboard for monitoring deployments',
    });
  }
}
```

## AppConfig Stack

```typescript
// lib/appconfig-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface AppConfigStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  validatorFunction: lambda.Function;
}

export class AppConfigStack extends cdk.Stack {
  public readonly application: appconfig.CfnApplication;
  public readonly appConfigEnvironment: appconfig.CfnEnvironment;
  public readonly deploymentStrategy: appconfig.CfnDeploymentStrategy;

  constructor(scope: Construct, id: string, props: AppConfigStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create AppConfig Application
    this.application = new appconfig.CfnApplication(this, 'MobileApp', {
      name: `MobileApp-${environmentSuffix}`,
      description: 'Mobile application configuration management',
      tags: [
        {
          key: 'Environment',
          value: environmentSuffix,
        },
        {
          key: 'Application',
          value: 'MobileApp',
        },
      ],
    });

    // Create Deployment Strategy with gradual rollout
    this.deploymentStrategy = new appconfig.CfnDeploymentStrategy(
      this,
      'GradualDeployment',
      {
        name: `GradualRollout-${environmentSuffix}`,
        description: 'Gradual rollout: 20% at a time with 5 minute bake time',
        deploymentDurationInMinutes: 25,
        growthFactor: 20,
        growthType: 'LINEAR',
        replicateTo: 'NONE',
        finalBakeTimeInMinutes: 5,
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Create AppConfig Environment
    this.appConfigEnvironment = new appconfig.CfnEnvironment(
      this,
      'ProductionEnvironment',
      {
        applicationId: this.application.ref,
        name: `Production-${environmentSuffix}`,
        description: 'Production environment for mobile app',
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Create Configuration Profile for Feature Flags
    const featureFlagsProfile = new appconfig.CfnConfigurationProfile(
      this,
      'FeatureFlagsProfile',
      {
        applicationId: this.application.ref,
        name: 'FeatureFlags',
        locationUri: 'hosted',
        type: 'AWS.AppConfig.FeatureFlags',
        description: 'Feature flags for mobile application with advanced targeting',
        validators: [
          {
            type: 'LAMBDA',
            content: props.validatorFunction.functionArn,
          },
        ],
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Grant AppConfig permission to invoke the validator Lambda
    props.validatorFunction.grantInvoke(
      new iam.ServicePrincipal('appconfig.amazonaws.com')
    );

    // Stack outputs
    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: this.application.ref,
      description: 'AppConfig Application ID',
    });

    new cdk.CfnOutput(this, 'FeatureFlagsProfileId', {
      value: featureFlagsProfile.ref,
      description: 'Feature Flags Configuration Profile ID',
    });

    new cdk.CfnOutput(this, 'AppConfigEnvironmentId', {
      value: this.appConfigEnvironment.ref,
      description: 'AppConfig Environment ID',
    });

    new cdk.CfnOutput(this, 'DeploymentStrategyId', {
      value: this.deploymentStrategy.ref,
      description: 'Deployment Strategy ID',
    });
  }
}
```

## Parameter and Secrets Stack

```typescript
// lib/parameter-secrets-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ParameterSecretsStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  mobileAppRole: iam.Role;
}

export class ParameterSecretsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ParameterSecretsStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // API Keys Secret
    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: `mobile-app/api-keys/${environmentSuffix}`,
      description: 'API keys for mobile application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          primary: 'PRIMARY_API_KEY',
        }),
        generateStringKey: 'secondary',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'"\\/@',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database Credentials Secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DbCredentialsSecret', {
      secretName: `mobile-app/database/${environmentSuffix}`,
      description: 'Database credentials for mobile application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'"\\/@',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Third-party Service Credentials
    const thirdPartySecret = new secretsmanager.Secret(this, 'ThirdPartySecret', {
      secretName: `mobile-app/third-party/${environmentSuffix}`,
      description: 'Third-party service credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          serviceId: 'third-party-service',
        }),
        generateStringKey: 'apiKey',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'"\\/@',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Auth Token Secret (replacing SecureString parameter)
    const authTokenSecret = new secretsmanager.Secret(this, 'AuthTokenSecret', {
      secretName: `mobile-app/auth-token/${environmentSuffix}`,
      description: 'Authentication tokens for mobile app',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          tokenType: 'Bearer',
        }),
        generateStringKey: 'token',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'"\\/@',
        passwordLength: 64,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Standard SSM Parameters for non-sensitive configurations
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
      description: 'Maximum number of API retry attempts',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Shared configuration parameter for cross-account sharing
    const sharedConfig = new ssm.StringParameter(this, 'SharedConfiguration', {
      parameterName: `/mobile-app/config/${environmentSuffix}/shared-config`,
      stringValue: JSON.stringify({
        region: this.region,
        environment: environmentSuffix,
        version: '1.0.0',
        features: {
          enableCache: true,
          cacheTimeout: 3600,
        },
      }),
      description: 'Shared configuration for mobile app',
      tier: ssm.ParameterTier.ADVANCED,
    });

    // Grant permissions to mobile app role
    apiKeySecret.grantRead(props.mobileAppRole);
    dbCredentialsSecret.grantRead(props.mobileAppRole);
    thirdPartySecret.grantRead(props.mobileAppRole);
    authTokenSecret.grantRead(props.mobileAppRole);

    props.mobileAppRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          apiEndpoint.parameterArn,
          apiTimeout.parameterArn,
          maxRetries.parameterArn,
          sharedConfig.parameterArn,
        ],
      })
    );

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiKeySecretArn', {
      value: apiKeySecret.secretArn,
      description: 'ARN of API key secret',
    });

    new cdk.CfnOutput(this, 'SharedConfigParameterArn', {
      value: sharedConfig.parameterArn,
      description: 'ARN of shared configuration parameter',
    });
  }
}
```