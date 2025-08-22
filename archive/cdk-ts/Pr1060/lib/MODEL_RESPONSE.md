I'll create a multi-environment AWS infrastructure using CDK TypeScript that ensures consistency across development, staging, and production environments. This solution includes AWS Lambda functions, API Gateway, and S3 buckets with parameterized configurations.

## Environment Configuration System

First, let's create an environment configuration system:

**lib/environment-config.ts**
```typescript
export interface EnvironmentConfig {
  environmentName: string;
  lambdaMemorySize: number;
  lambdaTimeout: number;
  apiGatewayStageName: string;
  s3BucketRetentionDays: number;
  enableLogging: boolean;
  enableTracing: boolean;
  autoDeleteObjects: boolean;
}

export class EnvironmentConfigs {
  private static configs: Record<string, EnvironmentConfig> = {
    dev: {
      environmentName: 'dev',
      lambdaMemorySize: 256,
      lambdaTimeout: 30,
      apiGatewayStageName: 'dev',
      s3BucketRetentionDays: 7,
      enableLogging: true,
      enableTracing: false,
      autoDeleteObjects: true,
    },
    staging: {
      environmentName: 'staging',
      lambdaMemorySize: 512,
      lambdaTimeout: 60,
      apiGatewayStageName: 'staging',
      s3BucketRetentionDays: 30,
      enableLogging: true,
      enableTracing: true,
      autoDeleteObjects: false,
    },
    prod: {
      environmentName: 'prod',
      lambdaMemorySize: 1024,
      lambdaTimeout: 120,
      apiGatewayStageName: 'prod',
      s3BucketRetentionDays: 365,
      enableLogging: true,
      enableTracing: true,
      autoDeleteObjects: false,
    },
  };

  public static getConfig(environment: string): EnvironmentConfig {
    const config = this.configs[environment];
    if (!config) {
      throw new Error(`Unknown environment: ${environment}. Supported environments: ${Object.keys(this.configs).join(', ')}`);
    }
    return config;
  }

  public static validateEnvironment(environment: string): boolean {
    return Object.keys(this.configs).includes(environment);
  }

  public static getSupportedEnvironments(): string[] {
    return Object.keys(this.configs);
  }
}
```

## Lambda Stack

**lib/lambda-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface LambdaStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
}

export class LambdaStack extends cdk.Stack {
  public readonly apiFunction: lambda.Function;
  public readonly processingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environmentConfig } = props;

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`arn:aws:s3:::*-${environmentConfig.environmentName}/*`],
            }),
          ],
        }),
      },
    });

    // API Lambda Function with response streaming support
    this.apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { Readable } = require('stream');
        
        exports.handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
          const metadata = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Environment': '${environmentConfig.environmentName}',
            },
          };
          
          responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
          
          const data = {
            message: 'Hello from ${environmentConfig.environmentName} environment',
            timestamp: new Date().toISOString(),
            environment: '${environmentConfig.environmentName}',
            requestId: context.awsRequestId,
          };
          
          responseStream.write(JSON.stringify(data));
          responseStream.end();
        });
      `),
      memorySize: environmentConfig.lambdaMemorySize,
      timeout: cdk.Duration.seconds(environmentConfig.lambdaTimeout),
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        LOG_LEVEL: environmentConfig.enableLogging ? 'INFO' : 'ERROR',
      },
      tracing: environmentConfig.enableTracing ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Processing Lambda Function
    this.processingFunction = new lambda.Function(this, 'ProcessingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing event:', JSON.stringify(event, null, 2));
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Processing completed',
              environment: '${environmentConfig.environmentName}',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
      memorySize: environmentConfig.lambdaMemorySize,
      timeout: cdk.Duration.seconds(environmentConfig.lambdaTimeout),
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        LOG_LEVEL: environmentConfig.enableLogging ? 'INFO' : 'ERROR',
      },
      tracing: environmentConfig.enableTracing ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('Component', 'Lambda');
  }
}
```

## API Gateway Stack

**lib/api-gateway-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface ApiGatewayStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  apiFunction: lambda.Function;
  processingFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { environmentConfig, apiFunction, processingFunction } = props;

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${environmentConfig.environmentName}-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: environmentConfig.autoDeleteObjects ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'MultiEnvApi', {
      restApiName: `multi-env-api-${environmentConfig.environmentName}`,
      description: `Multi-environment API for ${environmentConfig.environmentName}`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: environmentConfig.apiGatewayStageName,
        loggingLevel: environmentConfig.enableLogging ? apigateway.MethodLoggingLevel.INFO : apigateway.MethodLoggingLevel.ERROR,
        dataTraceEnabled: environmentConfig.enableTracing,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      policy: new cdk.aws_iam.PolicyDocument({
        statements: [
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Lambda integrations
    const apiIntegration = new apigateway.LambdaIntegration(apiFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const processingIntegration = new apigateway.LambdaIntegration(processingFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API resources and methods
    const apiResource = this.api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Health check endpoint
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.X-Environment': true,
          },
        },
      ],
    });

    // Processing endpoint
    const processResource = v1Resource.addResource('process');
    processResource.addMethod('POST', processingIntegration, {
      requestValidatorOptions: {
        requestValidatorName: 'Validate body',
        validateRequestBody: true,
        validateRequestParameters: false,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });

    // Environment-specific routing using custom domain (simulation)
    if (environmentConfig.environmentName !== 'dev') {
      // Add CORS for non-dev environments
      this.api.root.addCorsPreflight({
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: `API Gateway URL for ${environmentConfig.environmentName}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: `API Gateway ID for ${environmentConfig.environmentName}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('Component', 'APIGateway');
  }
}
```

## S3 Stack

**lib/s3-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface S3StackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
}

export class S3Stack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const { environmentConfig } = props;

    // Data bucket
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `multi-env-data-${environmentConfig.environmentName}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: environmentConfig.environmentName !== 'dev',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environmentConfig.autoDeleteObjects ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: environmentConfig.autoDeleteObjects,
      lifecycleRules: [
        {
          id: 'DeleteOldObjects',
          enabled: true,
          expiration: cdk.Duration.days(environmentConfig.s3BucketRetentionDays),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Logs bucket
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `multi-env-logs-${environmentConfig.environmentName}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environmentConfig.autoDeleteObjects ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: environmentConfig.autoDeleteObjects,
      lifecycleRules: [
        {
          id: 'ArchiveLogFiles',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(environmentConfig.s3BucketRetentionDays),
        },
      ],
    });

    // Bucket policies
    const dataBucketPolicy = new s3.BucketPolicy(this, 'DataBucketPolicy', {
      bucket: this.dataBucket,
    });

    dataBucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: `Data bucket name for ${environmentConfig.environmentName}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.logsBucket.bucketName,
      description: `Logs bucket name for ${environmentConfig.environmentName}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('Component', 'S3');
  }
}
```

## Validation Stack

**lib/validation-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface ValidationStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
}

export class ValidationStack extends cdk.Stack {
  public readonly validationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ValidationStackProps) {
    super(scope, id, props);

    const { environmentConfig } = props;

    // Validation Lambda Function
    this.validationFunction = new lambda.Function(this, 'ValidationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudformation = new AWS.CloudFormation();
        const apigateway = new AWS.APIGateway();
        const s3 = new AWS.S3();

        exports.handler = async (event) => {
          console.log('Validation event:', JSON.stringify(event, null, 2));
          
          const environment = '${environmentConfig.environmentName}';
          const results = {
            environment,
            timestamp: new Date().toISOString(),
            validations: [],
          };

          try {
            // Validate CloudFormation stacks
            const stacks = await cloudformation.listStacks({
              StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
            }).promise();
            
            const envStacks = stacks.StackSummaries.filter(stack => 
              stack.StackName.includes(environment)
            );
            
            results.validations.push({
              type: 'CloudFormation',
              status: envStacks.length > 0 ? 'PASS' : 'FAIL',
              details: \`Found \${envStacks.length} stacks for environment \${environment}\`
            });

            // Validate S3 buckets
            try {
              const dataBucket = \`multi-env-data-\${environment}-\${process.env.AWS_ACCOUNT_ID || 'unknown'}\`;
              await s3.headBucket({ Bucket: dataBucket }).promise();
              results.validations.push({
                type: 'S3-DataBucket',
                status: 'PASS',
                details: \`Data bucket \${dataBucket} exists and is accessible\`
              });
            } catch (error) {
              results.validations.push({
                type: 'S3-DataBucket',
                status: 'FAIL',
                details: error.message
              });
            }

            console.log('Validation results:', JSON.stringify(results, null, 2));
            return {
              statusCode: 200,
              body: JSON.stringify(results)
            };

          } catch (error) {
            console.error('Validation error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: error.message,
                environment
              })
            };
          }
        };
      `),
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        AWS_ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
      },
    });

    // Grant permissions to validation function
    this.validationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:ListStacks',
          'cloudformation:DescribeStacks',
          's3:ListBucket',
          's3:HeadBucket',
          'apigateway:GET',
          'lambda:GetFunction',
        ],
        resources: ['*'],
      })
    );

    // EventBridge rule for scheduled validation
    const validationRule = new events.Rule(this, 'ValidationRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      description: `Validation rule for ${environmentConfig.environmentName} environment`,
    });

    validationRule.addTarget(new targets.LambdaFunction(this.validationFunction));

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('Component', 'Validation');
  }
}
```

## Updated Main Stack Integration

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { S3Stack } from './s3-stack';
import { ValidationStack } from './validation-stack';
import { EnvironmentConfigs, EnvironmentConfig } from './environment-config';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Validate environment
    if (!EnvironmentConfigs.validateEnvironment(environmentSuffix)) {
      throw new Error(
        \`Invalid environment: \${environmentSuffix}. Supported environments: \${EnvironmentConfigs.getSupportedEnvironments().join(', ')}\`
      );
    }

    // Get environment configuration
    const environmentConfig = EnvironmentConfigs.getConfig(environmentSuffix);

    // Create S3 Stack
    const s3Stack = new S3Stack(scope, \`S3Stack\${environmentSuffix}\`, {
      environmentConfig,
      env: props?.env,
    });

    // Create Lambda Stack
    const lambdaStack = new LambdaStack(scope, \`LambdaStack\${environmentSuffix}\`, {
      environmentConfig,
      env: props?.env,
    });

    // Create API Gateway Stack
    const apiGatewayStack = new ApiGatewayStack(scope, \`ApiGatewayStack\${environmentSuffix}\`, {
      environmentConfig,
      apiFunction: lambdaStack.apiFunction,
      processingFunction: lambdaStack.processingFunction,
      env: props?.env,
    });

    // Create Validation Stack
    const validationStack = new ValidationStack(scope, \`ValidationStack\${environmentSuffix}\`, {
      environmentConfig,
      env: props?.env,
    });

    // Stack dependencies
    apiGatewayStack.addDependency(lambdaStack);
    validationStack.addDependency(s3Stack);
    validationStack.addDependency(lambdaStack);
    validationStack.addDependency(apiGatewayStack);

    // Add cross-stack permissions
    s3Stack.dataBucket.grantReadWrite(lambdaStack.apiFunction);
    s3Stack.dataBucket.grantReadWrite(lambdaStack.processingFunction);
    s3Stack.logsBucket.grantWrite(lambdaStack.apiFunction);

    // Add global tags
    cdk.Tags.of(this).add('Project', 'MultiEnvironmentConsistency');
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: environmentConfig.environmentName,
      description: 'Environment name',
    });

    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: cdk.Aws.REGION,
      description: 'AWS Region for deployment',
    });
  }
}
```