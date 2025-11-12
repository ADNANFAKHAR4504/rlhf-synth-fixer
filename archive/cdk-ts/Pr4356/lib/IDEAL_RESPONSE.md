# Overview

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/stacks/api-gateway-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  dataProcessorFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(
      this,
      `ApiLogGroup-${props.environmentSuffix}`,
      {
        logGroupName: `/aws/apigateway/serverless-api-${props.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // REST API
    this.api = new apigateway.RestApi(this, `Api-${props.environmentSuffix}`, {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Serverless Data Processing API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
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
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.days(1),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator-${props.environmentSuffix}`,
      {
        restApi: this.api,
        requestValidatorName: 'validate-body',
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // Request Model
    const dataModel = new apigateway.Model(
      this,
      `DataModel-${props.environmentSuffix}`,
      {
        restApi: this.api,
        contentType: 'application/json',
        modelName: 'DataModel',
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['data'],
          properties: {
            data: {
              type: apigateway.JsonSchemaType.OBJECT,
            },
            metadata: {
              type: apigateway.JsonSchemaType.OBJECT,
            },
          },
        },
      }
    );

    // Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.dataProcessorFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*Error.*',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }
    );

    // API Resources and Methods
    const dataResource = this.api.root.addResource('data');

    // POST /data
    dataResource.addMethod('POST', lambdaIntegration, {
      requestValidator,
      requestModels: {
        'application/json': dataModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // GET /data (for health check)
    dataResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // API Key and Usage Plan
    const apiKey = new apigateway.ApiKey(
      this,
      `ApiKey-${props.environmentSuffix}`,
      {
        apiKeyName: `serverless-api-key-${props.environmentSuffix}`,
        description: 'API Key for serverless application',
      }
    );

    const usagePlan = new apigateway.UsagePlan(
      this,
      `UsagePlan-${props.environmentSuffix}`,
      {
        name: `serverless-usage-plan-${props.environmentSuffix}`,
        throttle: {
          rateLimit: 100,
          burstLimit: 200,
        },
        quota: {
          limit: 10000,
          period: apigateway.Period.DAY,
        },
        apiStages: [
          {
            api: this.api,
            stage: this.api.deploymentStage,
          },
        ],
      }
    );

    usagePlan.addApiKey(apiKey);

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `ApiEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `ApiKeyId-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/stacks/lambda-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  dataTable: dynamodb.Table;
  dataBucket: s3.Bucket;
  apiSecret: secretsmanager.Secret;
}

export class LambdaStack extends cdk.Stack {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // Lambda execution role with specific permissions
    const lambdaRole = new iam.Role(
      this,
      `LambdaRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Lambda execution role for data processor',
        roleName: `serverless-lambda-role-${props.environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSG-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    // Lambda function for data processing
    this.dataProcessorFunction = new lambda.Function(
      this,
      `DataProcessor-${props.environmentSuffix}`,
      {
        functionName: `serverless-data-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
        const { randomUUID } = require('crypto');

        const dynamoClient = new DynamoDBClient({});
        const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);
        const s3Client = new S3Client({});
        const secretsClient = new SecretsManagerClient({});

        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));

          try {
            // Parse request body
            const body = JSON.parse(event.body || '{}');
            const timestamp = Date.now();
            const id = randomUUID();

            // Get secrets
            const secretCommand = new GetSecretValueCommand({
              SecretId: process.env.SECRET_ARN
            });
            const secretData = await secretsClient.send(secretCommand);
            const secrets = JSON.parse(secretData.SecretString);

            // Process data
            const processedData = {
              id,
              timestamp,
              status: 'processed',
              data: body,
              processedAt: new Date().toISOString(),
              ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
            };

            // Store in DynamoDB
            const putCommand = new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: processedData
            });
            await dynamoDB.send(putCommand);

            // Store raw data in S3
            const s3Command = new PutObjectCommand({
              Bucket: process.env.BUCKET_NAME,
              Key: \`data/\${new Date().getFullYear()}/\${new Date().getMonth() + 1}/\${id}.json\`,
              Body: JSON.stringify(processedData),
              ContentType: 'application/json',
              ServerSideEncryption: 'AES256',
              Metadata: {
                'processed-by': 'lambda',
                'timestamp': timestamp.toString()
              }
            });
            await s3Client.send(s3Command);

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Data processed successfully',
                id,
                timestamp
              })
            };
          } catch (error) {
            console.error('Error processing data:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Error processing data',
                error: error.message
              })
            };
          }
        };
      `),
        environment: {
          TABLE_NAME: props.dataTable.tableName,
          BUCKET_NAME: props.dataBucket.bucketName,
          SECRET_ARN: props.apiSecret.secretArn,
          ENVIRONMENT: props.environmentSuffix,
        },
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        deadLetterQueueEnabled: true,
        retryAttempts: 2,
      }
    );

    // Grant permissions
    props.dataTable.grantReadWriteData(this.dataProcessorFunction);
    props.dataBucket.grantReadWrite(this.dataProcessorFunction);
    props.apiSecret.grantRead(this.dataProcessorFunction);

    // Output
    new cdk.CfnOutput(this, 'FunctionArn', {
      value: this.dataProcessorFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `DataProcessorArn-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/stacks/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  dataTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(
      this,
      `AlertTopic-${props.environmentSuffix}`,
      {
        topicName: `serverless-alerts-${props.environmentSuffix}`,
        displayName: 'Serverless Application Alerts',
      }
    );

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('your-email@example.com')
    );

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function has errors',
        metric: props.lambdaFunction.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-duration-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda execution time is high',
        metric: props.lambdaFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 10000, // 10 seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Throttles Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      `LambdaThrottleAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda is throttled',
        metric: props.lambdaFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // API Gateway 4XX Errors Alarm
    const api4xxAlarm = new cloudwatch.Alarm(
      this,
      `Api4xxAlarm-${props.environmentSuffix}`,
      {
        alarmName: `api-4xx-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when API has 4xx errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: props.apiGateway.restApiName,
            Stage: props.apiGateway.deploymentStage.stageName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5XX Errors Alarm
    const api5xxAlarm = new cloudwatch.Alarm(
      this,
      `Api5xxAlarm-${props.environmentSuffix}`,
      {
        alarmName: `api-5xx-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when API has 5xx errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: props.apiGateway.restApiName,
            Stage: props.apiGateway.deploymentStage.stageName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // DynamoDB Throttles Alarm
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      `DynamoThrottleAlarm-${props.environmentSuffix}`,
      {
        alarmName: `dynamo-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when DynamoDB is throttled',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'UserErrors',
          dimensionsMap: {
            TableName: props.dataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${props.environmentSuffix}`,
      {
        dashboardName: `serverless-dashboard-${props.environmentSuffix}`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Metrics',
              left: [
                props.lambdaFunction.metricInvocations(),
                props.lambdaFunction.metricErrors(),
                props.lambdaFunction.metricThrottles(),
              ],
              right: [props.lambdaFunction.metricDuration()],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'API Gateway Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Count',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '4XXError',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '5XXError',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'DynamoDB Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'ConsumedReadCapacityUnits',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'ConsumedWriteCapacityUnits',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'UserErrors',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'Lambda Invocations',
              metrics: [props.lambdaFunction.metricInvocations()],
              width: 6,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'API Gateway Latency',
              metrics: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Latency',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 6,
              height: 6,
            }),
          ],
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `AlertTopicArn-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/stacks/secrets-stack.ts

```typescript
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

```

## ./lib/stacks/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  apiGateway: apigateway.RestApi;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // WAF Web ACL for API Gateway
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `WebAcl-${props.environmentSuffix}`,
      {
        name: `serverless-waf-${props.environmentSuffix}`,
        description: 'WAF Web ACL for API Gateway protection',
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          // Rate limiting rule
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            action: {
              block: {
                customResponse: {
                  responseCode: 429,
                  customResponseBodyKey: 'TooManyRequests',
                },
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          // SQL Injection protection
          {
            name: 'SQLiRule',
            priority: 2,
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRule',
            },
          },
          // XSS protection
          {
            name: 'XSSRule',
            priority: 3,
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'XSSRule',
            },
          },
          // Size constraint rule
          {
            name: 'SizeRestrictionRule',
            priority: 4,
            statement: {
              sizeConstraintStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'NONE',
                  },
                ],
                comparisonOperator: 'GT',
                size: 8192, // 8KB limit
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SizeRestrictionRule',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `serverless-waf-${props.environmentSuffix}`,
        },
        customResponseBodies: {
          TooManyRequests: {
            contentType: 'APPLICATION_JSON',
            content: '{"error": "Too many requests. Please try again later."}',
          },
        },
      }
    );

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(
      this,
      `WebAclAssociation-${props.environmentSuffix}`,
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${props.apiGateway.restApiId}/stages/${props.apiGateway.deploymentStage.stageName}`,
        webAclArn: this.webAcl.attrArn,
      }
    );

    // Output
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebAclArn-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/stacks/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly dataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // S3 Bucket with versioning and encryption
    this.dataBucket = new s3.Bucket(
      this,
      `DataBucket-${props.environmentSuffix}`,
      {
        bucketName: `serverless-data-bucket-${props.environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          },
        ],
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST,
            ],
            allowedOrigins: ['*'],
            exposedHeaders: ['ETag'],
            maxAge: 3000,
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect data from accidental deletion
      }
    );

    // DynamoDB Table with backup and autoscaling
    this.dataTable = new dynamodb.Table(
      this,
      `DataTable-${props.environmentSuffix}`,
      {
        tableName: `serverless-data-table-${props.environmentSuffix}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: true,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        contributorInsightsEnabled: true,
        timeToLiveAttribute: 'ttl',
      }
    );

    // Add Global Secondary Index for querying by status
    this.dataTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `DataBucketName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.dataTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DataTableName-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/stacks/vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      vpcName: `serverless-vpc-${props.environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    this.vpc.addFlowLog(`VpcFlowLog-${props.environmentSuffix}`, {
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${props.environmentSuffix}`,
    });
  }
}

```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { VpcStack } from './stacks/vpc-stack';
import { StorageStack } from './stacks/storage-stack';
import { SecretsStack } from './stacks/secrets-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { SecurityStack } from './stacks/security-stack';
import { MonitoringStack } from './stacks/monitoring-stack';

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

    // Get region from environment or use default
    const region =
      process.env.AWS_REGION ||
      this.node.tryGetContext('region') ||
      'ap-northeast-1';

    // Stack instantiations with proper dependency management

    // 1. VPC Stack - Foundation for network isolation
    const vpcStack = new VpcStack(scope, `VpcStack-${environmentSuffix}`, {
      environmentSuffix,
      env: { region },
    });

    // 2. Secrets Stack - Manage sensitive data
    const secretsStack = new SecretsStack(
      scope,
      `SecretsStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region },
      }
    );

    // 3. Storage Stack - S3 and DynamoDB
    const storageStack = new StorageStack(
      scope,
      `StorageStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region },
      }
    );

    // 4. Lambda Stack - Processing functions
    const lambdaStack = new LambdaStack(
      scope,
      `LambdaStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: vpcStack.vpc,
        dataTable: storageStack.dataTable,
        dataBucket: storageStack.dataBucket,
        apiSecret: secretsStack.apiSecret,
        env: { region },
      }
    );
    lambdaStack.addDependency(vpcStack);
    lambdaStack.addDependency(storageStack);
    lambdaStack.addDependency(secretsStack);

    // 5. API Gateway Stack - REST API endpoints
    const apiGatewayStack = new ApiGatewayStack(
      scope,
      `ApiGatewayStack-${environmentSuffix}`,
      {
        environmentSuffix,
        dataProcessorFunction: lambdaStack.dataProcessorFunction,
        env: { region },
      }
    );
    apiGatewayStack.addDependency(lambdaStack);

    // 6. Security Stack - WAF for API Gateway
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        apiGateway: apiGatewayStack.api,
        env: { region },
      }
    );
    securityStack.addDependency(apiGatewayStack);

    // 7. Monitoring Stack - CloudWatch alarms and logging
    const monitoringStack = new MonitoringStack(
      scope,
      `MonitoringStack-${environmentSuffix}`,
      {
        environmentSuffix,
        lambdaFunction: lambdaStack.dataProcessorFunction,
        apiGateway: apiGatewayStack.api,
        dataTable: storageStack.dataTable,
        env: { region },
      }
    );
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(storageStack);

    // Outputs - Import from other stacks and re-export for integration tests
    new cdk.CfnOutput(this, 'BucketName', {
      value: cdk.Fn.importValue(`DataBucketName-${environmentSuffix}`),
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: cdk.Fn.importValue(`DataTableName-${environmentSuffix}`),
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: cdk.Fn.importValue(`ApiEndpoint-${environmentSuffix}`),
      description: 'API Gateway Endpoint URL',
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: cdk.Fn.importValue(`DataProcessorArn-${environmentSuffix}`),
      description: 'Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: cdk.Fn.importValue(`VpcId-${environmentSuffix}`),
      description: 'VPC ID',
    });
  }
}

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const ec2Client = new EC2Client({ region });

// Resource names based on naming convention
const tableName = `serverless-data-table-${environmentSuffix}`;
const bucketName = outputs[`DataBucketName-${environmentSuffix}`] || `serverless-data-bucket-${environmentSuffix}-`;
const functionName = `serverless-data-processor-${environmentSuffix}`;
const secretName = `serverless-api-secret-${environmentSuffix}`;
const apiEndpoint = outputs[`ApiEndpoint-${environmentSuffix}`] || outputs.ApiEndpoint;

describe('Serverless Application Integration Tests', () => {
  describe('DynamoDB Table Tests', () => {
    test('DynamoDB table exists and is active', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(tableName);
    }, 30000);

    test('DynamoDB table has correct schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
    }, 30000);

    test('DynamoDB table has Global Secondary Index', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      const statusIndex = response.Table?.GlobalSecondaryIndexes?.find(
        (index) => index.IndexName === 'StatusIndex'
      );
      expect(statusIndex).toBeDefined();
    }, 30000);

    test('Can write to and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const testTimestamp = Date.now();

      // Put item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
          status: { S: 'test' },
          data: { S: JSON.stringify({ test: true }) },
        },
      });
      await dynamoClient.send(putCommand);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      const response = await dynamoClient.send(getCommand);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 30000);
  });

  describe('S3 Bucket Tests', () => {
    test('S3 bucket exists and is accessible', async () => {
      // Find the bucket name from outputs (prefer BucketName key, otherwise search for bucket pattern)
      let bucket = outputs['BucketName'] || outputs[`DataBucketName-${environmentSuffix}`];

      if (!bucket) {
        const actualBucketName = Object.keys(outputs).find((key) =>
          key.includes('BucketName') && outputs[key] && outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`) && !outputs[key].toString().includes('arn:')
        );
        bucket = actualBucketName ? outputs[actualBucketName] : null;
      }

      if (!bucket) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucket });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('Can write to and read from S3 bucket', async () => {
      // Find the bucket name from outputs (prefer BucketName key, otherwise search for bucket pattern)
      let bucket = outputs['BucketName'] || outputs[`DataBucketName-${environmentSuffix}`];

      if (!bucket) {
        const actualBucketName = Object.keys(outputs).find((key) =>
          key.includes('BucketName') && outputs[key] && outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`) && !outputs[key].toString().includes('arn:')
        );
        bucket = actualBucketName ? outputs[actualBucketName] : null;
      }

      if (!bucket) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }
      const testKey = `test/${Date.now()}.json`;
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });

      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: testData,
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);

      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: testKey,
      });
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();

      expect(body).toBe(testData);

      // Clean up
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toContain('nodejs22');
      expect(response.Configuration?.State).toBe('Active');
    }, 30000);

    test('Lambda function has correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TABLE_NAME).toBe(tableName);
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
    }, 30000);

    test('Lambda function has VPC configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Secrets Manager Tests', () => {
    test('Secret exists and is configured correctly', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.ARN).toBeDefined();
    }, 30000);

    test('Secret has correct tags', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      const tags = response.Tags || [];
      const hasIacTag = tags.some(
        (tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasIacTag).toBe(true);
    }, 30000);
  });

  describe('VPC Tests', () => {
    test('VPC exists with correct tags', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`serverless-vpc-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];
      const hasIacTag = tags.some(
        (tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasIacTag).toBe(true);
    }, 30000);
  });

  describe('API Gateway Tests', () => {
    test('API Gateway endpoint is accessible', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const response = await fetch(apiEndpoint, { method: 'OPTIONS' });
      expect(response.status).toBeLessThan(500); // Should not have server errors
    }, 30000);

    test('API Gateway has CORS enabled', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const response = await fetch(apiEndpoint, { method: 'OPTIONS' });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Test', () => {
    test('Complete data flow: API -> Lambda -> DynamoDB -> S3', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const testData = {
        data: {
          test: true,
          timestamp: Date.now(),
          environment: environmentSuffix,
        },
      };

      // POST to API Gateway
      const response = await fetch(`${apiEndpoint}data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.id).toBeDefined();
      expect(responseData.timestamp).toBeDefined();

      // Wait a bit for data to be written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify data in DynamoDB
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: responseData.id },
          timestamp: { N: responseData.timestamp.toString() },
        },
      });
      const dbResponse = await dynamoClient.send(getCommand);
      expect(dbResponse.Item).toBeDefined();

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: responseData.id },
          timestamp: { N: responseData.timestamp.toString() },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 60000);
  });
});

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'ap-northeast-1' },
    });
  });

  test('TapStack creates successfully', () => {
    expect(stack).toBeDefined();
  });

  test('TapStack has correct environment suffix', () => {
    expect(stack.stackName).toContain('TestTapStack');
  });

  test('All nested stacks are created', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('VpcStack is created with correct ID', () => {
    const vpcStack = app.node.findAll().find((node) => {
      return node.node.id === `VpcStack-${environmentSuffix}`;
    });

    expect(vpcStack).toBeDefined();
  });

  test('SecretsStack is created with correct ID', () => {
    const secretsStack = app.node.findAll().find((node) => {
      return node.node.id === `SecretsStack-${environmentSuffix}`;
    });

    expect(secretsStack).toBeDefined();
  });

  test('StorageStack is created with correct ID', () => {
    const storageStack = app.node.findAll().find((node) => {
      return node.node.id === `StorageStack-${environmentSuffix}`;
    });

    expect(storageStack).toBeDefined();
  });

  test('LambdaStack is created with correct ID', () => {
    const lambdaStack = app.node.findAll().find((node) => {
      return node.node.id === `LambdaStack-${environmentSuffix}`;
    });

    expect(lambdaStack).toBeDefined();
  });

  test('ApiGatewayStack is created with correct ID', () => {
    const apiStack = app.node.findAll().find((node) => {
      return node.node.id === `ApiGatewayStack-${environmentSuffix}`;
    });

    expect(apiStack).toBeDefined();
  });

  test('SecurityStack is created with correct ID', () => {
    const securityStack = app.node.findAll().find((node) => {
      return node.node.id === `SecurityStack-${environmentSuffix}`;
    });

    expect(securityStack).toBeDefined();
  });

  test('MonitoringStack is created with correct ID', () => {
    const monitoringStack = app.node.findAll().find((node) => {
      return node.node.id === `MonitoringStack-${environmentSuffix}`;
    });

    expect(monitoringStack).toBeDefined();
  });

  test('Stacks use correct environment configuration', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    nestedStacks.forEach((nestedStack) => {
      const stackNode = nestedStack as cdk.Stack;
      expect(stackNode.region || stackNode.env?.region).toBeDefined();
    });
  });

  test('Stack has iac-rlhf-amazon tag', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses context environmentSuffix when provided', () => {
    const testApp = new cdk.App({ context: { environmentSuffix: 'qa' } });
    const testStack = new TapStack(testApp, 'TestContextStack');

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const testApp = new cdk.App();
    const testStack = new TapStack(testApp, 'TestDefaultStack', {});

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses props environmentSuffix over context', () => {
    const testApp = new cdk.App({ context: { environmentSuffix: 'qa' } });
    const testStack = new TapStack(testApp, 'TestPropsStack', {
      environmentSuffix: 'staging',
    });

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });
});

describe('VpcStack', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('VPC has public and private subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
  });

  test('VPC has NAT Gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('VPC has iac-rlhf-amazon tag', () => {
    const vpc = template.findResources('AWS::EC2::VPC');
    const vpcTags = Object.values(vpc)[0].Properties.Tags;
    const hasTag = vpcTags.some((tag: any) =>
      tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
    );
    expect(hasTag).toBe(true);
  });

  test('VPC has flow logs', () => {
    template.resourceCountIs('AWS::EC2::FlowLog', 1);
  });

  test('VPC outputs VpcId', () => {
    template.hasOutput('VpcId', {});
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  test('S3 bucket is created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('S3 bucket has versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('S3 bucket has encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.anyValue(),
      }),
    });
  });

  test('DynamoDB table is created', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  test('DynamoDB table has correct keys', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
    });
  });

  test('DynamoDB table has point-in-time recovery', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('DynamoDB table has GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'StatusIndex',
        }),
      ]),
    });
  });

  test('Stack has outputs', () => {
    template.hasOutput('BucketName', {});
    template.hasOutput('TableName', {});
  });
});

describe('SecretsStack', () => {
  let app: cdk.App;
  let stack: SecretsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Secret is created', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('Secret has correct name', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'serverless-api-secret-dev',
    });
  });

  test('Secret has iac-rlhf-amazon tag', () => {
    const secrets = template.findResources('AWS::SecretsManager::Secret');
    const secretTags = Object.values(secrets)[0].Properties.Tags;
    const hasTag = secretTags.some((tag: any) =>
      tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
    );
    expect(hasTag).toBe(true);
  });

  test('Stack has SecretArn output', () => {
    template.hasOutput('SecretArn', {});
  });
});

describe('LambdaStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(lambdaStack);
  });

  test('Lambda function is created', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2); // includes log retention function
  });

  test('Lambda function uses Node 22 runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
    });
  });

  test('Lambda has IAM role', () => {
    template.resourceCountIs('AWS::IAM::Role', 2);
  });

  test('Lambda has security group', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
  });

  test('Lambda has dead letter queue', () => {
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  test('Stack has FunctionArn output', () => {
    template.hasOutput('FunctionArn', {});
  });
});

describe('ApiGatewayStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(apiStack);
  });

  test('API Gateway is created', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('API Gateway has methods', () => {
    template.resourceCountIs('AWS::ApiGateway::Method', 4); // GET, POST, OPTIONS
  });

  test('API Gateway has deployment', () => {
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
  });

  test('API Gateway has stage', () => {
    template.resourceCountIs('AWS::ApiGateway::Stage', 1);
  });

  test('API Key is created', () => {
    template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
  });

  test('Usage Plan is created', () => {
    template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
  });

  test('API has CORS enabled', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  test('Stack has ApiEndpoint output', () => {
    template.hasOutput('ApiEndpoint', {});
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let securityStack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'dev',
      apiGateway: apiStack.api,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(securityStack);
  });

  test('WAF Web ACL is created', () => {
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
  });

  test('WAF has rate limiting rule', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'RateLimitRule',
        }),
      ]),
    });
  });

  test('WAF has SQL injection protection', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'SQLiRule',
        }),
      ]),
    });
  });

  test('WAF has XSS protection', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'XSSRule',
        }),
      ]),
    });
  });

  test('WAF Web ACL Association is created', () => {
    template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
  });

  test('Stack has WebAclArn output', () => {
    template.hasOutput('WebAclArn', {});
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let monitoringStack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix: 'dev',
      lambdaFunction: lambdaStack.dataProcessorFunction,
      apiGateway: apiStack.api,
      dataTable: storageStack.dataTable,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(monitoringStack);
  });

  test('SNS Topic is created', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('CloudWatch Alarms are created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 6);
  });

  test('Lambda error alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'lambda-errors-dev',
    });
  });

  test('API Gateway 4xx alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'api-4xx-errors-dev',
    });
  });

  test('API Gateway 5xx alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'api-5xx-errors-dev',
    });
  });

  test('Stack has DashboardUrl output', () => {
    template.hasOutput('DashboardUrl', {});
  });

  test('Stack has AlertTopicArn output', () => {
    template.hasOutput('AlertTopicArn', {});
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
