import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // DynamoDB Table
    const dataTable = new dynamodb.Table(this, 'ServerlessDataTable', {
      tableName: `serverless-data-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets Manager - Store application configuration
    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: `serverless-app-config-${environmentSuffix}`,
      description: 'Application configuration secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiVersion: 'v1.0',
          environment: environmentSuffix,
        }),
        generateStringKey: 'encryptionKey',
        excludeCharacters: '/@"\\\'',
      },
    });

    // EventBridge Custom Event Bus
    const customEventBus = new events.EventBus(this, 'ServerlessEventBus', {
      eventBusName: `serverless-events-${environmentSuffix}`,
    });

    // SNS FIFO Topic for notifications
    const notificationTopic = new sns.Topic(
      this,
      'ProcessingNotificationTopic',
      {
        topicName: `serverless-notifications-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        displayName: 'Serverless Processing Notifications',
      }
    );

    // CloudWatch Log Groups
    const apiLogGroup = new logs.LogGroup(this, 'ApiLambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const validatorLogGroup = new logs.LogGroup(
      this,
      'ValidatorLambdaLogGroup',
      {
        logGroupName: `/aws/lambda/serverless-validator-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const transformerLogGroup = new logs.LogGroup(
      this,
      'TransformerLambdaLogGroup',
      {
        logGroupName: `/aws/lambda/serverless-transformer-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const notifierLogGroup = new logs.LogGroup(this, 'NotifierLambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-notifier-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC Configuration - Simplified for LocalStack
    // LocalStack has limited VPC endpoint support, so we simplify the VPC config
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    const vpc = new ec2.Vpc(this, 'ServerlessVpc', {
      vpcName: `serverless-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: vpc,
      securityGroupName: `serverless-lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda function - HTTPS only',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic only'
    );

    // VPC Endpoints - Only add for non-LocalStack environments
    // LocalStack has limited VPC endpoint support
    if (!isLocalStack) {
      vpc.addGatewayEndpoint('DynamoDBEndpoint', {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      });

      vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      });

      vpc.addInterfaceEndpoint('EventBridgeEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      });

      vpc.addInterfaceEndpoint('StepFunctionsEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.STEP_FUNCTIONS,
      });

      vpc.addInterfaceEndpoint('SNSEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SNS,
      });
    }

    // IAM Roles
    const apiLambdaRole = new iam.Role(this, 'ApiLambdaExecutionRole', {
      roleName: `serverless-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dataTable.tableArn],
            }),
          ],
        }),
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [apiLogGroup.logGroupArn],
            }),
          ],
        }),
        EventBridgePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: [customEventBus.eventBusArn],
            }),
          ],
        }),
        SecretsManagerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [appSecret.secretArn],
            }),
          ],
        }),
      },
    });

    const stepFunctionsLambdaRole = new iam.Role(
      this,
      'StepFunctionsLambdaRole',
      {
        roleName: `serverless-stepfunctions-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
        inlinePolicies: {
          CloudWatchLogsPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: [
                  validatorLogGroup.logGroupArn,
                  transformerLogGroup.logGroupArn,
                  notifierLogGroup.logGroupArn,
                ],
              }),
            ],
          }),
          SNSPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [notificationTopic.topicArn],
              }),
            ],
          }),
        },
      }
    );

    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsExecutionRole', {
      roleName: `serverless-stepfunctions-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      inlinePolicies: {
        LambdaInvokePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: ['*'],
            }),
          ],
        }),
        SNSPublishPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [notificationTopic.topicArn],
            }),
          ],
        }),
      },
    });

    // Lambda Functions for Step Functions workflow
    const validatorFunction = new lambda.Function(this, 'ValidatorFunction', {
      functionName: `serverless-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Validator received event:', JSON.stringify(event, null, 2));
    
    try {
        const { detail } = event;
        const { data } = detail;
        
        // Validation logic
        const validationResults = {
            isValid: true,
            errors: []
        };
        
        // Check required fields
        if (!data.name || data.name.trim() === '') {
            validationResults.isValid = false;
            validationResults.errors.push('Name is required');
        }
        
        if (!data.email || !/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/.test(data.email)) {
            validationResults.isValid = false;
            validationResults.errors.push('Valid email is required');
        }
        
        console.log('Validation results:', validationResults);
        
        return {
            statusCode: 200,
            validationResults,
            originalData: data,
            processingId: detail.itemId,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Validation error:', error);
        throw error;
    }
};
      `),
      role: stepFunctionsLambdaRole,
      vpc: vpc,
      securityGroups: [securityGroup],
      logGroup: validatorLogGroup,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const transformerFunction = new lambda.Function(
      this,
      'TransformerFunction',
      {
        functionName: `serverless-transformer-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Transformer received event:', JSON.stringify(event, null, 2));
    
    try {
        const { originalData, processingId } = event;
        
        // Transform data (example transformation)
        const transformedData = {
            id: processingId,
            fullName: originalData.name?.toUpperCase() || '',
            emailDomain: originalData.email ? originalData.email.split('@')[1] : '',
            processedAt: new Date().toISOString(),
            category: originalData.category || 'general',
            priority: originalData.priority || 'normal',
            metadata: {
                source: 'api',
                transformation: 'v1.0',
                originalFields: Object.keys(originalData)
            }
        };
        
        console.log('Transformed data:', transformedData);
        
        return {
            statusCode: 200,
            transformedData,
            processingId,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Transformation error:', error);
        throw error;
    }
};
      `),
        role: stepFunctionsLambdaRole,
        vpc: vpc,
        securityGroups: [securityGroup],
        logGroup: transformerLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(30),
        memorySize: 128,
      }
    );

    const notifierFunction = new lambda.Function(this, 'NotifierFunction', {
      functionName: `serverless-notifier-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Notifier received event:', JSON.stringify(event, null, 2));
    
    try {
        const { transformedData, processingId } = event;
        const topicArn = process.env.TOPIC_ARN;
        
        const message = {
            processingId: processingId,
            status: 'completed',
            data: transformedData,
            completedAt: new Date().toISOString()
        };
        
        // For simplicity, just log the notification
        console.log('Would send SNS notification:', {
            TopicArn: topicArn,
            Message: JSON.stringify(message),
            MessageGroupId: 'data-processing',
            MessageDeduplicationId: \`\${processingId}-\${Date.now()}\`,
            Subject: \`Data Processing Completed - \${processingId}\`
        });
        
        return {
            statusCode: 200,
            notificationId: \`notification-\${processingId}\`,
            processingId,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Notification error:', error);
        throw error;
    }
};
      `),
      environment: {
        TOPIC_ARN: notificationTopic.topicArn,
      },
      role: stepFunctionsLambdaRole,
      vpc: vpc,
      securityGroups: [securityGroup],
      logGroup: notifierLogGroup,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    // Step Functions State Machine with JSONATA transformations
    const validateTask = new tasks.LambdaInvoke(this, 'ValidateData', {
      lambdaFunction: validatorFunction,
      outputPath: '$.Payload',
    });

    const transformTask = new tasks.LambdaInvoke(this, 'TransformData', {
      lambdaFunction: transformerFunction,
      outputPath: '$.Payload',
    });

    const notifyTask = new tasks.LambdaInvoke(this, 'NotifyCompletion', {
      lambdaFunction: notifierFunction,
      outputPath: '$.Payload',
    });

    // Error handling states
    const validationFailedTask = new stepfunctions.Fail(
      this,
      'ValidationFailed',
      {
        cause: 'Data validation failed',
        error: 'VALIDATION_ERROR',
      }
    );

    const transformationFailedTask = new stepfunctions.Fail(
      this,
      'TransformationFailed',
      {
        cause: 'Data transformation failed',
        error: 'TRANSFORMATION_ERROR',
      }
    );

    const notificationFailedTask = new stepfunctions.Fail(
      this,
      'NotificationFailed',
      {
        cause: 'Notification sending failed',
        error: 'NOTIFICATION_ERROR',
      }
    );

    // Define workflow with error handling and retry logic
    const definition = validateTask
      .addRetry({
        errors: ['Lambda.ServiceException', 'Lambda.AWSLambdaException'],
        interval: cdk.Duration.seconds(2),
        maxAttempts: 3,
        backoffRate: 2,
      })
      .addCatch(validationFailedTask, {
        errors: ['States.TaskFailed'],
        resultPath: '$.error',
      })
      .next(
        new stepfunctions.Choice(this, 'IsValidationSuccessful')
          .when(
            stepfunctions.Condition.booleanEquals(
              '$.validationResults.isValid',
              true
            ),
            transformTask
              .addRetry({
                errors: [
                  'Lambda.ServiceException',
                  'Lambda.AWSLambdaException',
                ],
                interval: cdk.Duration.seconds(2),
                maxAttempts: 3,
                backoffRate: 2,
              })
              .addCatch(transformationFailedTask, {
                errors: ['States.TaskFailed'],
                resultPath: '$.error',
              })
              .next(
                notifyTask
                  .addRetry({
                    errors: [
                      'Lambda.ServiceException',
                      'Lambda.AWSLambdaException',
                    ],
                    interval: cdk.Duration.seconds(2),
                    maxAttempts: 3,
                    backoffRate: 2,
                  })
                  .addCatch(notificationFailedTask, {
                    errors: ['States.TaskFailed'],
                    resultPath: '$.error',
                  })
              )
          )
          .otherwise(validationFailedTask)
      );

    const stateMachine = new stepfunctions.StateMachine(
      this,
      'DataProcessingWorkflow',
      {
        stateMachineName: `serverless-data-processing-${environmentSuffix}`,
        definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
        role: stepFunctionsRole,
        tracingEnabled: true,
      }
    );

    // Main API Lambda Function
    const apiFunction = new lambda.Function(this, 'ServerlessApiFunction', {
      functionName: `serverless-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.TABLE_NAME;
    const eventBusName = process.env.EVENT_BUS_NAME;
    const secretArn = process.env.SECRET_ARN;
    
    try {
        // Mock configuration
        const appConfig = { apiVersion: 'v1.0', environment: 'test' };
        
        const httpMethod = event.httpMethod;
        let body = {};
        
        // Parse body if present
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (parseError) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        message: 'Bad Request', 
                        error: 'Invalid JSON in request body' 
                    })
                };
            }
        }
        
        let response;
        
        switch (httpMethod) {
            case 'GET':
                // Mock response for GET
                response = {
                    Items: [],
                    Count: 0,
                    ApiVersion: appConfig.apiVersion,
                    Environment: appConfig.environment
                };
                break;
                
            case 'POST':
                const item = {
                    id: Date.now().toString(),
                    ...body,
                    timestamp: new Date().toISOString(),
                    apiVersion: appConfig.apiVersion
                };
                
                // Mock DynamoDB put
                console.log('Would save to DynamoDB:', tableName, item);
                
                // Mock EventBridge publish
                console.log('Would publish to EventBridge:', {
                    Source: 'serverless.api',
                    DetailType: 'Data Created',
                    Detail: JSON.stringify({
                        action: 'data-created',
                        itemId: item.id,
                        timestamp: item.timestamp,
                        data: body
                    }),
                    EventBusName: eventBusName
                });
                
                response = { 
                    message: 'Item created successfully', 
                    item,
                    eventPublished: true,
                    apiVersion: appConfig.apiVersion
                };
                break;
                
            default:
                throw new Error(\`Unsupported method \${httpMethod}\`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Internal server error', 
                error: error.message 
            })
        };
    }
};
      `),
      environment: {
        TABLE_NAME: dataTable.tableName,
        EVENT_BUS_NAME: customEventBus.eventBusName,
        SECRET_ARN: appSecret.secretArn,
      },
      role: apiLambdaRole,
      vpc: vpc,
      securityGroups: [securityGroup],
      logGroup: apiLogGroup,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // EventBridge Rule for Step Functions workflow trigger
    const dataProcessingRule = new events.Rule(this, 'DataProcessingRule', {
      ruleName: `data-processing-rule-${environmentSuffix}`,
      description: 'Route data created events to Step Functions workflow',
      eventBus: customEventBus,
      eventPattern: {
        source: ['serverless.api'],
        detailType: ['Data Created'],
      },
    });

    // Add Step Functions target to EventBridge rule
    dataProcessingRule.addTarget(new targets.SfnStateMachine(stateMachine));

    // API Gateway
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: 'Enhanced Serverless API with Step Functions and SNS',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // API Key and Usage Plan
    const apiKey = new apigateway.ApiKey(this, 'ServerlessApiKey', {
      apiKeyName: `serverless-api-key-${environmentSuffix}`,
      description: 'API Key for Enhanced Serverless API',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'ServerlessUsagePlan', {
      name: `serverless-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for Enhanced Serverless API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // API Integration
    const integration = new apigateway.LambdaIntegration(apiFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
    });

    // API Methods
    const dataResource = api.root.addResource('data');

    dataResource.addMethod('GET', integration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    dataResource.addMethod('POST', integration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Project', 'ServerlessApp');
    cdk.Tags.of(dataTable).add('Project', 'ServerlessApp');
    cdk.Tags.of(apiFunction).add('Project', 'ServerlessApp');
    cdk.Tags.of(validatorFunction).add('Project', 'ServerlessApp');
    cdk.Tags.of(transformerFunction).add('Project', 'ServerlessApp');
    cdk.Tags.of(notifierFunction).add('Project', 'ServerlessApp');
    cdk.Tags.of(stateMachine).add('Project', 'ServerlessApp');
    cdk.Tags.of(notificationTopic).add('Project', 'ServerlessApp');
    cdk.Tags.of(api).add('Project', 'ServerlessApp');
    cdk.Tags.of(apiLogGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(validatorLogGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(transformerLogGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(notifierLogGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(vpc).add('Project', 'ServerlessApp');
    cdk.Tags.of(securityGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(customEventBus).add('Project', 'ServerlessApp');
    cdk.Tags.of(appSecret).add('Project', 'ServerlessApp');

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dataTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'API Lambda function name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: customEventBus.eventBusName,
      description: 'Custom EventBridge event bus name',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: appSecret.secretArn,
      description: 'Application secrets ARN',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS FIFO topic ARN for notifications',
    });
  }
}
