### Reasoning Trace

---

The user wants a comprehensive AWS CDK TypeScript application with specific requirements. Let me break down the requirements:

1. **Core Components:**
   - Lambda function (256 MB memory, 10s timeout)
   - DynamoDB table (5 RCU, 5 WCU, with auto-scaling)
   - API Gateway REST API

2. **Region:** us-west-2

3. **DynamoDB:**
   - Primary key: UserId (partition key)
   - Auto-scaling enabled
   - Provisioned capacity: 5 read, 5 write

4. **Lambda:**
   - TypeScript
   - Environment variables
   - IAM permissions for DynamoDB (least privilege)
   - Dead letter queue (SQS)
   - X-Ray tracing
   - CloudWatch logging

5. **API Gateway:**
   - REST API
   - Triggers Lambda
   - X-Ray tracing
   - CloudWatch logging
   - CORS configuration
   - JSON validation with models
   - GET method
   - Deployed stage

6. **Monitoring:**
   - CloudWatch error metric for Lambda
   - X-Ray tracing
   - Logging

7. **Tagging:**
   - All resources tagged with 'Project:ServerlessInfra'

8. **Design Requirements:**
   - Modular constructs
   - Separate files in lib directory
   - environmentSuffix parameter for naming
   - Non-prod resources should be removable
   - Optional parameters with defaults
   - Clean separation of components

File structure needs:

- bin/tap.ts (entrypoint)
- lib/tap-stacks.ts (main stack)
- lib/constructs/ (separate construct files)

Let me create a comprehensive solution following these requirements.

### Answer

---

I'll create a comprehensive serverless application using AWS CDK in TypeScript with modular constructs. Here's the complete implementation:

## File Structure

```
├── bin/
│   └── tap.ts
├── lib/
│   ├── tap-stack.ts
│   └── constructs/
│       ├── lambda-construct.ts
│       ├── dynamodb-construct.ts
│       ├── api-gateway-construct.ts
│       └── monitoring-construct.ts
├── lambda/
│   └── handler.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

## Implementation

### 1. **package.json**

```json
{
  "name": "serverless-infra",
  "version": "1.0.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "npm run build && cdk deploy",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/node": "20.5.7",
    "aws-cdk": "2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "@aws-cdk/aws-apigatewayv2-alpha": "^2.100.0-alpha.0",
    "@aws-cdk/aws-lambda-python-alpha": "^2.100.0-alpha.0",
    "constructs": "^10.2.70",
    "@types/aws-lambda": "^8.10.119",
    "esbuild": "^0.19.2"
  }
}
```

### 2. **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "lib",
    "rootDir": "."
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### 3. **cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.js",
      "**/*.d.ts",
      "node_modules",
      "cdk.out"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:newStyleStackSynthesis": true
  }
}
```

### 4. **bin/tap.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `ServerlessInfra-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: `Serverless Infrastructure Stack - ${environmentSuffix}`,
  tags: {
    Project: 'ServerlessInfra',
    Environment: environmentSuffix,
  },
});
```

### 5. **lib/tap-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaMemorySize?: number;
  lambdaTimeout?: number;
  dynamoReadCapacity?: number;
  dynamoWriteCapacity?: number;
  corsOrigin?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const isProduction = props.environmentSuffix.toLowerCase().includes('prod');
    const removalPolicy = isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Create DynamoDB table
    const dynamoDb = new DynamoDBConstruct(this, 'DynamoDB', {
      environmentSuffix: props.environmentSuffix,
      readCapacity: props.dynamoReadCapacity || 5,
      writeCapacity: props.dynamoWriteCapacity || 5,
      removalPolicy,
    });

    // Create Lambda function
    const lambda = new LambdaConstruct(this, 'Lambda', {
      environmentSuffix: props.environmentSuffix,
      memorySize: props.lambdaMemorySize || 256,
      timeout: props.lambdaTimeout || 10,
      dynamoTable: dynamoDb.table,
      removalPolicy,
    });

    // Create API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      environmentSuffix: props.environmentSuffix,
      lambdaFunction: lambda.function,
      corsOrigin: props.corsOrigin || 'https://example.com',
      removalPolicy,
    });

    // Create monitoring resources
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix: props.environmentSuffix,
      lambdaFunction: lambda.function,
      apiGateway: apiGateway.restApi,
      deadLetterQueue: lambda.deadLetterQueue,
    });

    // Output important values
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.restApi.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoDb.table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambda.function.functionName,
      description: 'Lambda function name',
    });
  }
}
```

### 6. **lib/constructs/dynamodb-construct.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DynamoDBConstructProps {
  environmentSuffix: string;
  readCapacity: number;
  writeCapacity: number;
  removalPolicy: cdk.RemovalPolicy;
}

export class DynamoDBConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'UserTable', {
      tableName: `users-${props.environmentSuffix}`,
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      removalPolicy: props.removalPolicy,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      tags: [
        {
          key: 'Project',
          value: 'ServerlessInfra',
        },
      ],
    });

    // Configure auto-scaling
    const readScaling = this.table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const writeScaling = this.table.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}
```

### 7. **lib/constructs/lambda-construct.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaConstructProps {
  environmentSuffix: string;
  memorySize: number;
  timeout: number;
  dynamoTable: dynamodb.Table;
  removalPolicy: cdk.RemovalPolicy;
}

export class LambdaConstruct extends Construct {
  public readonly function: NodejsFunction;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Create Dead Letter Queue
    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `lambda-dlq-${props.environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: props.removalPolicy,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create Lambda function
    this.function = new NodejsFunction(this, 'Function', {
      functionName: `serverless-function-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambda/handler.ts'),
      memorySize: props.memorySize,
      timeout: cdk.Duration.seconds(props.timeout),
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: this.deadLetterQueue,
      deadLetterQueueEnabled: true,
      maxEventAge: cdk.Duration.hours(2),
      retryAttempts: 2,
      environment: {
        TABLE_NAME: props.dynamoTable.tableName,
        ENVIRONMENT: props.environmentSuffix,
        REGION: cdk.Stack.of(this).region,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        minify: false,
        sourceMap: true,
        sourcesContent: false,
        target: 'es2020',
        tsconfig: path.join(__dirname, '../../tsconfig.json'),
      },
      logRetention: 7,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_143_0,
    });

    // Grant permissions using least privilege principle
    props.dynamoTable.grantWriteData(this.function);

    // Additional specific permissions
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:Query', 'dynamodb:GetItem'],
        resources: [props.dynamoTable.tableArn],
      })
    );

    // Grant permissions for X-Ray
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Add tags
    cdk.Tags.of(this.function).add('Project', 'ServerlessInfra');
    cdk.Tags.of(this.deadLetterQueue).add('Project', 'ServerlessInfra');
  }
}
```

### 8. **lib/constructs/api-gateway-construct.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiGatewayConstructProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  corsOrigin: string;
  removalPolicy: cdk.RemovalPolicy;
}

export class ApiGatewayConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create CloudWatch Log Group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/serverless-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.removalPolicy,
    });

    // Create REST API
    this.restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Serverless REST API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [props.corsOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      cloudWatchRole: true,
    });

    // Create request model for validation
    const requestModel = new apigateway.Model(this, 'RequestModel', {
      restApi: this.restApi,
      contentType: 'application/json',
      modelName: `UserRequestModel${props.environmentSuffix}`,
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          userId: { type: apigateway.JsonSchemaType.STRING },
          name: { type: apigateway.JsonSchemaType.STRING },
          email: {
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          },
        },
        required: ['userId'],
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.lambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '',
            },
          },
          {
            statusCode: '400',
            selectionPattern: '.*[Bad Request].*',
            responseTemplates: {
              'application/json': '{"error": "Bad Request"}',
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*[Error].*',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
          },
        ],
      }
    );

    // Create users resource
    const users = this.restApi.root.addResource('users');

    // Add GET method with request validation
    users.addMethod('GET', lambdaIntegration, {
      requestValidatorOptions: {
        requestValidatorName: 'Validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      requestModels: {
        'application/json': requestModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // Add tags
    cdk.Tags.of(this.restApi).add('Project', 'ServerlessInfra');
  }
}
```

### 9. **lib/constructs/monitoring-construct.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  deadLetterQueue: sqs.Queue;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `serverless-alerts-${props.environmentSuffix}`,
      displayName: 'Serverless Infrastructure Alerts',
    });

    // Lambda error metric
    const lambdaErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: props.lambdaFunction.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Lambda error alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function has errors',
      metric: lambdaErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda duration metric
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `lambda-duration-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function duration is high',
        metric: props.lambdaFunction.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5000, // 5 seconds
        evaluationPeriods: 2,
      }
    );

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda throttles alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        alarmName: `lambda-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function is throttled',
        metric: props.lambdaFunction.metricThrottles({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // DLQ message alarm
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
      alarmName: `dlq-messages-${props.environmentSuffix}`,
      alarmDescription: 'Alert when messages are sent to DLQ',
      metric: props.deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 4xx errors
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      alarmName: `api-4xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert on high 4xx error rate',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.environmentSuffix,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
    });

    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5xx errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `api-5xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert on 5xx errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.environmentSuffix,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
    });

    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `serverless-dashboard-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Metrics',
            left: [
              props.lambdaFunction.metricInvocations(),
              props.lambdaFunction.metricErrors(),
              props.lambdaFunction.metricThrottles(),
            ],
            right: [props.lambdaFunction.metricDuration()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Dead Letter Queue',
            left: [
              props.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
              props.deadLetterQueue.metricApproximateNumberOfMessagesNotVisible(),
            ],
            width: 12,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Lambda Concurrent Executions',
            metrics: [
              props.lambdaFunction.metricConcurrentExecutions({
                statistic: 'Maximum',
              }),
            ],
            width: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'API Gateway Latency',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
                statistic: 'Average',
              }),
            ],
            width: 6,
          }),
        ],
      ],
    });

    // Add tags
    cdk.Tags.of(alertTopic).add('Project', 'ServerlessInfra');
    cdk.Tags.of(dashboard).add('Project', 'ServerlessInfra');
  }
}
```

### 10. **lambda/handler.ts**

```typescript
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

// Initialize AWS SDK clients
const client = new DynamoDBClient({
  region: process.env.REGION || 'us-west-2',
});
const dynamoDb = DynamoDBDocumentClient.from(client);

// Initialize PowerTools
const logger = new Logger({ serviceName: 'serverless-function' });
const tracer = new Tracer({ serviceName: 'serverless-function' });

interface User {
  UserId: string;
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Add trace annotations
  tracer.putAnnotation('environment', process.env.ENVIRONMENT || 'unknown');
  tracer.putAnnotation('tableName', process.env.TABLE_NAME || 'unknown');

  // Log the incoming event
  logger.info('Received request', {
    requestId: context.requestId,
    path: event.path,
    method: event.httpMethod,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      throw new Error('TABLE_NAME environment variable is not set');
    }

    // Handle GET request
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;

      if (userId) {
        // Get specific user
        const segment = tracer.getSegment();
        const subsegment = segment?.addNewSubsegment('DynamoDB GetItem');

        try {
          const result = await dynamoDb.send(
            new GetCommand({
              TableName: tableName,
              Key: { UserId: userId },
            })
          );

          logger.info('User retrieved successfully', { userId });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin':
                process.env.CORS_ORIGIN || 'https://example.com',
            },
            body: JSON.stringify({
              success: true,
              data: result.Item || null,
            }),
          };
        } finally {
          subsegment?.close();
        }
      } else {
        // For demo purposes, create a sample user
        const sampleUser: User = {
          UserId: `user-${Date.now()}`,
          name: 'Sample User',
          email: 'sample@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const segment = tracer.getSegment();
        const subsegment = segment?.addNewSubsegment('DynamoDB PutItem');

        try {
          await dynamoDb.send(
            new PutCommand({
              TableName: tableName,
              Item: sampleUser,
              ConditionExpression: 'attribute_not_exists(UserId)',
            })
          );

          logger.info('User created successfully', {
            userId: sampleUser.UserId,
          });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin':
                process.env.CORS_ORIGIN || 'https://example.com',
            },
            body: JSON.stringify({
              success: true,
              message: 'Sample user created',
              data: sampleUser,
            }),
          };
        } catch (error) {
          if ((error as any).name === 'ConditionalCheckFailedException') {
            logger.warn('User already exists', { userId: sampleUser.UserId });
            return {
              statusCode: 409,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin':
                  process.env.CORS_ORIGIN || 'https://example.com',
              },
              body: JSON.stringify({
                success: false,
                error: 'User already exists',
              }),
            };
          }
          throw error;
        } finally {
          subsegment?.close();
        }
      }
    }

    // Handle POST request (if body is provided)
    if (event.httpMethod === 'POST' && event.body) {
      const userData = JSON.parse(event.body) as User;

      if (!userData.UserId) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
              process.env.CORS_ORIGIN || 'https://example.com',
          },
          body: JSON.stringify({
            success: false,
            error: 'UserId is required',
          }),
        };
      }

      userData.createdAt = new Date().toISOString();
      userData.updatedAt = new Date().toISOString();

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: userData,
        })
      );

      logger.info('User saved successfully', { userId: userData.UserId });

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin':
            process.env.CORS_ORIGIN || 'https://example.com',
        },
        body: JSON.stringify({
          success: true,
          data: userData,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':
          process.env.CORS_ORIGIN || 'https://example.com',
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    logger.error('Error processing request', error as Error);
    tracer.addErrorAsMetadata(error as Error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':
          process.env.CORS_ORIGIN || 'https://example.com',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        requestId: context.requestId,
      }),
    };
  }
};
```

### 11. **Additional Lambda dependencies (package.json for Lambda)**

Add these dependencies to your main package.json for the Lambda function:

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/lib-dynamodb": "^3.400.0",
    "@aws-lambda-powertools/logger": "^1.12.1",
    "@aws-lambda-powertools/tracer": "^1.12.1"
  }
}
```

## Deployment Commands

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap aws://ACCOUNT-ID/us-west-2

# Deploy to dev environment
npx cdk deploy -c environmentSuffix=dev

# Deploy to production
npx cdk deploy -c environmentSuffix=prod

# Destroy dev stack
npx cdk destroy -c environmentSuffix=dev
```

## Key Features Implemented

1. **Modular Architecture**: Separated components into reusable constructs
2. **Environment-based Configuration**: Uses `environmentSuffix` for naming and configuration
3. **Security Best Practices**:
   - Least privilege IAM roles
   - Encryption at rest for DynamoDB and SQS
   - API Gateway request validation
4. **Monitoring & Observability**:
   - X-Ray tracing enabled
   - CloudWatch logs and metrics
   - Custom alarms for errors
   - Comprehensive dashboard
5. **Error Handling**:
   - Dead letter queue for Lambda
   - Retry configuration
   - Proper error responses
6. **Auto-scaling**: DynamoDB table with auto-scaling configuration
7. **CORS Configuration**: Configurable CORS origin
8. **Resource Tagging**: All resources tagged with 'Project:ServerlessInfra'
9. **Removal Policy**: Non-production resources can be destroyed safely

This implementation provides a production-ready serverless infrastructure with all the requested features and follows AWS CDK best practices.
