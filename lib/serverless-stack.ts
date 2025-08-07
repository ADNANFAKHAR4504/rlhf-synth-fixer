import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import { Construct } from 'constructs';

export interface ServerlessStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class ServerlessStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly userFunction: lambda.Function;
  public readonly orderFunction: lambda.Function;
  public readonly scheduledProcessingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id, props);

    // Create EventBridge custom bus with enhanced logging
    const eventBus = new events.EventBus(this, 'ServerlessEventBus', {
      eventBusName: `serverless-events-${props.environmentSuffix}`,
    });

    // Create CloudWatch Log Group for EventBridge enhanced logging
    const eventBridgeLogGroup = new logs.LogGroup(this, 'EventBridgeLogGroup', {
      logGroupName: `/aws/events/serverless-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CloudWatch Log Group for Lambda Powertools
    const powertoolsLogGroup = new logs.LogGroup(this, 'PowertoolsLogGroup', {
      logGroupName: `/aws/lambda/powertools-${props.environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create EventBridge rule with enhanced logging
    const orderProcessingRule = new events.Rule(this, 'OrderProcessingRule', {
      eventBus: eventBus,
      eventPattern: {
        source: ['serverless.orders'],
        detailType: ['Order Created', 'Order Updated'],
      },
      ruleName: `order-processing-${props.environmentSuffix}`,
    });

    // Lambda Powertools layer (using official AWS layer)
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:3`
    );

    // Create IAM role for Lambda functions with X-Ray and CloudWatch permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        CloudWatchMetrics: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // User Management Lambda Function with Powertools
    this.userFunction = new lambda.Function(this, 'UserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      layers: [powertoolsLayer],
      code: lambda.Code.fromInline(`
        const { Logger } = require('@aws-lambda-powertools/logger');
        const { Metrics } = require('@aws-lambda-powertools/metrics');
        const { Tracer } = require('@aws-lambda-powertools/tracer');

        const logger = new Logger({
          serviceName: 'user-service',
          environment: process.env.ENVIRONMENT,
          logLevel: 'INFO'
        });

        const metrics = new Metrics({
          namespace: 'ServerlessApp',
          serviceName: 'user-service',
          defaultDimensions: {
            environment: process.env.ENVIRONMENT
          }
        });

        const tracer = new Tracer({
          serviceName: 'user-service',
          captureHTTPsRequests: true
        });

        exports.handler = async (event, context) => {
          // Inject Lambda context into logger
          logger.addContext(context);
          
          // Start tracer segment
          const segment = tracer.getSegment();
          const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
          
          logger.info('User function invoked', { 
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
            path: event.path
          });

          // Add custom metrics
          metrics.addMetric('UserFunctionInvocation', 'Count', 1);
          metrics.addMetadata('userId', event.pathParameters?.userId || 'anonymous');

          // Add custom tracing annotations
          if (subsegment) {
            subsegment.addAnnotation('userId', event.pathParameters?.userId || 'anonymous');
            subsegment.addAnnotation('httpMethod', event.httpMethod);
          }
          
          try {
            // Simulate user processing
            const userData = {
              userId: event.pathParameters?.userId || Math.random().toString(36).substr(2, 9),
              action: event.httpMethod,
              timestamp: new Date().toISOString(),
            };

            logger.info('User data processed successfully', { userData });
            metrics.addMetric('UserProcessingSuccess', 'Count', 1);

            const response = {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'User operation successful',
                userData: userData,
                version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                traceId: tracer.getRootXrayTraceId()
              })
            };

            if (subsegment) {
              subsegment.close();
            }
            
            // Publish metrics before returning
            metrics.publishStoredMetrics();
            return response;

          } catch (error) {
            logger.error('Error processing user request', { error: error.message });
            metrics.addMetric('UserProcessingError', 'Count', 1);
            
            if (subsegment) {
              subsegment.addError(error);
              subsegment.close();
            }

            // Publish metrics even on error
            metrics.publishStoredMetrics();
            
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
      functionName: `user-service-${props.environmentSuffix}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaExecutionRole,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ENVIRONMENT: props.environmentSuffix,
        EVENT_BUS_NAME: eventBus.eventBusName,
        POWERTOOLS_SERVICE_NAME: 'user-service',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        POWERTOOLS_LOG_LEVEL: 'INFO',
      },
    });

    // Order Processing Lambda Function with Powertools
    this.orderFunction = new lambda.Function(this, 'OrderFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      layers: [powertoolsLayer],
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const { Logger } = require('@aws-lambda-powertools/logger');
        const { Metrics } = require('@aws-lambda-powertools/metrics');
        const { Tracer } = require('@aws-lambda-powertools/tracer');
        
        const eventbridge = new AWS.EventBridge();
        
        const logger = new Logger({
          serviceName: 'order-service',
          environment: process.env.ENVIRONMENT,
          logLevel: 'INFO'
        });

        const metrics = new Metrics({
          namespace: 'ServerlessApp',
          serviceName: 'order-service',
          defaultDimensions: {
            environment: process.env.ENVIRONMENT
          }
        });

        const tracer = new Tracer({
          serviceName: 'order-service',
          captureHTTPsRequests: true
        });

        exports.handler = async (event, context) => {
          // Inject Lambda context into logger
          logger.addContext(context);
          
          // Start tracer segment
          const segment = tracer.getSegment();
          const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
          
          logger.info('Order function invoked', { 
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
            customerId: event.pathParameters?.customerId
          });

          // Add custom metrics
          metrics.addMetric('OrderFunctionInvocation', 'Count', 1);
          metrics.addMetadata('customerId', event.pathParameters?.customerId || 'anonymous');

          // Add custom tracing annotations
          if (subsegment) {
            subsegment.addAnnotation('customerId', event.pathParameters?.customerId || 'anonymous');
            subsegment.addAnnotation('httpMethod', event.httpMethod);
          }

          try {
            const orderId = Math.random().toString(36).substr(2, 9);
            const customerId = event.pathParameters?.customerId || 'default';
            
            const orderData = {
              orderId: orderId,
              customerId: customerId,
              timestamp: new Date().toISOString(),
              status: 'processing'
            };

            // Publish event to EventBridge
            const eventParams = {
              Entries: [{
                Source: 'serverless.orders',
                DetailType: 'Order Created',
                Detail: JSON.stringify(orderData),
                EventBusName: process.env.EVENT_BUS_NAME
              }]
            };
            
            await eventbridge.putEvents(eventParams).promise();
            logger.info('Event published to EventBridge', { orderId, customerId });
            metrics.addMetric('EventBridgeEventPublished', 'Count', 1);

            metrics.addMetric('OrderProcessingSuccess', 'Count', 1);

            const response = {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Order processed successfully',
                orderData: orderData,
                version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                traceId: tracer.getRootXrayTraceId()
              })
            };

            if (subsegment) {
              subsegment.close();
            }
            
            // Publish metrics before returning
            metrics.publishStoredMetrics();
            return response;

          } catch (error) {
            logger.error('Error processing order', { error: error.message });
            metrics.addMetric('OrderProcessingError', 'Count', 1);
            
            if (subsegment) {
              subsegment.addError(error);
              subsegment.close();
            }

            // Publish metrics even on error
            metrics.publishStoredMetrics();
            
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
      functionName: `order-service-${props.environmentSuffix}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaExecutionRole,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ENVIRONMENT: props.environmentSuffix,
        EVENT_BUS_NAME: eventBus.eventBusName,
        POWERTOOLS_SERVICE_NAME: 'order-service',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        POWERTOOLS_LOG_LEVEL: 'INFO',
      },
    });

    // Scheduled Processing Lambda Function with Powertools
    this.scheduledProcessingFunction = new lambda.Function(
      this,
      'ScheduledProcessingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        layers: [powertoolsLayer],
        code: lambda.Code.fromInline(`
        const { Logger } = require('@aws-lambda-powertools/logger');
        const { Metrics } = require('@aws-lambda-powertools/metrics');
        const { Tracer } = require('@aws-lambda-powertools/tracer');

        const logger = new Logger({
          serviceName: 'scheduled-processing',
          environment: process.env.ENVIRONMENT,
          logLevel: 'INFO'
        });

        const metrics = new Metrics({
          namespace: 'ServerlessApp',
          serviceName: 'scheduled-processing',
          defaultDimensions: {
            environment: process.env.ENVIRONMENT
          }
        });

        const tracer = new Tracer({
          serviceName: 'scheduled-processing',
          captureHTTPsRequests: true
        });

        exports.handler = async (event, context) => {
          // Inject Lambda context into logger
          logger.addContext(context);
          
          // Start tracer segment
          const segment = tracer.getSegment();
          const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
          
          logger.info('Scheduled processing function invoked', { 
            requestId: context.awsRequestId,
            scheduleArn: event.scheduleArn,
            scheduledTime: event.time
          });

          // Add custom metrics
          metrics.addMetric('ScheduledProcessingInvocation', 'Count', 1);
          metrics.addMetadata('scheduleArn', event.scheduleArn);

          // Add custom tracing annotations
          if (subsegment) {
            subsegment.addAnnotation('scheduleType', event.scheduleType || 'unknown');
            subsegment.addAnnotation('scheduledTime', event.time);
          }

          try {
            // Simulate scheduled processing tasks
            const processingTasks = [
              'Cleanup old logs',
              'Archive completed orders',
              'Generate daily reports',
              'Optimize database indexes',
              'Send notification emails'
            ];

            const randomTask = processingTasks[Math.floor(Math.random() * processingTasks.length)];
            
            logger.info('Executing scheduled task', { 
              task: randomTask,
              executionTime: new Date().toISOString()
            });

            // Simulate task execution time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

            metrics.addMetric('ScheduledTaskCompleted', 'Count', 1);
            metrics.addMetadata('taskType', randomTask);

            logger.info('Scheduled task completed successfully', { 
              task: randomTask,
              duration: context.getRemainingTimeInMillis()
            });

            const response = {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Scheduled processing completed successfully',
                task: randomTask,
                executionTime: new Date().toISOString(),
                traceId: tracer.getRootXrayTraceId()
              })
            };

            if (subsegment) {
              subsegment.close();
            }
            
            // Publish metrics before returning
            metrics.publishStoredMetrics();
            return response;

          } catch (error) {
            logger.error('Error in scheduled processing', { error: error.message });
            metrics.addMetric('ScheduledProcessingError', 'Count', 1);
            
            if (subsegment) {
              subsegment.addError(error);
              subsegment.close();
            }

            // Publish metrics even on error
            metrics.publishStoredMetrics();
            
            return {
              statusCode: 500,
              body: JSON.stringify({
                message: 'Scheduled processing failed',
                error: error.message
              })
            };
          }
        };
      `),
        functionName: `scheduled-processing-${props.environmentSuffix}`,
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        role: lambdaExecutionRole,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ENVIRONMENT: props.environmentSuffix,
          POWERTOOLS_SERVICE_NAME: 'scheduled-processing',
          POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
          POWERTOOLS_LOG_LEVEL: 'INFO',
        },
      }
    );

    // Grant EventBridge permissions to Lambda functions
    eventBus.grantPutEventsTo(this.orderFunction);

    // Create IAM role for EventBridge Scheduler
    const schedulerExecutionRole = new iam.Role(
      this,
      'SchedulerExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
        inlinePolicies: {
          LambdaInvokePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: [this.scheduledProcessingFunction.functionArn],
              }),
            ],
          }),
        },
      }
    );

    // Create Schedule Group for organizing schedules
    const scheduleGroup = new scheduler.CfnScheduleGroup(
      this,
      'ServerlessScheduleGroup',
      {
        name: `serverless-schedules-${props.environmentSuffix}`,
        tags: [
          {
            key: 'Environment',
            value: props.environmentSuffix,
          },
          {
            key: 'Service',
            value: 'serverless-processing',
          },
        ],
      }
    );

    // Create recurring schedule for daily processing
    const dailyProcessingSchedule = new scheduler.CfnSchedule(
      this,
      'DailyProcessingSchedule',
      {
        flexibleTimeWindow: {
          mode: 'FLEXIBLE',
          maximumWindowInMinutes: 15,
        },
        groupName: scheduleGroup.name,
        name: `daily-processing-${props.environmentSuffix}`,
        scheduleExpression: 'cron(0 2 * * ? *)', // Daily at 2 AM UTC
        scheduleExpressionTimezone: 'UTC',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'daily',
            task: 'daily-maintenance',
            environment: props.environmentSuffix,
          }),
        },
        description: 'Daily scheduled processing for maintenance tasks',
      }
    );

    // Create hourly schedule for frequent processing
    const hourlyProcessingSchedule = new scheduler.CfnSchedule(
      this,
      'HourlyProcessingSchedule',
      {
        flexibleTimeWindow: {
          mode: 'FLEXIBLE',
          maximumWindowInMinutes: 5,
        },
        groupName: scheduleGroup.name,
        name: `hourly-processing-${props.environmentSuffix}`,
        scheduleExpression: 'rate(1 hour)',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'hourly',
            task: 'frequent-check',
            environment: props.environmentSuffix,
          }),
        },
        description: 'Hourly scheduled processing for frequent checks',
      }
    );

    // Create one-time schedule for system initialization (24 hours from deployment)
    const initializationDate = new Date();
    initializationDate.setHours(initializationDate.getHours() + 24);

    const oneTimeInitSchedule = new scheduler.CfnSchedule(
      this,
      'OneTimeInitSchedule',
      {
        flexibleTimeWindow: {
          mode: 'OFF',
        },
        groupName: scheduleGroup.name,
        name: `initialization-${props.environmentSuffix}`,
        scheduleExpression: `at(${initializationDate.toISOString().slice(0, 19)})`,
        scheduleExpressionTimezone: 'UTC',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'one-time',
            task: 'system-initialization',
            environment: props.environmentSuffix,
          }),
        },
        description: 'One-time system initialization 24 hours after deployment',
      }
    );

    // Create Lambda Aliases for canary deployments
    const userFunctionAlias = new lambda.Alias(this, 'UserFunctionAlias', {
      aliasName: 'live',
      version: this.userFunction.currentVersion,
    });

    const orderFunctionAlias = new lambda.Alias(this, 'OrderFunctionAlias', {
      aliasName: 'live',
      version: this.orderFunction.currentVersion,
    });

    const scheduledFunctionAlias = new lambda.Alias(
      this,
      'ScheduledFunctionAlias',
      {
        aliasName: 'live',
        version: this.scheduledProcessingFunction.currentVersion,
      }
    );

    // Create CloudWatch Alarms for monitoring
    const userFunctionErrorAlarm = new cloudwatch.Alarm(
      this,
      'UserFunctionErrorAlarm',
      {
        metric: this.userFunction.metricErrors(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const orderFunctionErrorAlarm = new cloudwatch.Alarm(
      this,
      'OrderFunctionErrorAlarm',
      {
        metric: this.orderFunction.metricErrors(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const scheduledFunctionErrorAlarm = new cloudwatch.Alarm(
      this,
      'ScheduledFunctionErrorAlarm',
      {
        metric: this.scheduledProcessingFunction.metricErrors(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Create CloudWatch Custom Metrics Alarms for Powertools
    const userProcessingErrorsMetric = new cloudwatch.Metric({
      namespace: 'ServerlessApp',
      metricName: 'UserProcessingError',
      dimensionsMap: {
        environment: props.environmentSuffix,
      },
      statistic: 'Sum',
    });

    const userProcessingErrorsAlarm = new cloudwatch.Alarm(
      this,
      'UserProcessingErrorsAlarm',
      {
        metric: userProcessingErrorsMetric,
        threshold: 3,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Create CodeDeploy Application and Deployment Groups for canary deployments
    const codeDeployApp = new codedeploy.LambdaApplication(
      this,
      'ServerlessApp',
      {
        applicationName: `serverless-app-${props.environmentSuffix}`,
      }
    );

    // Create deployment group for user function canary deployments
    new codedeploy.LambdaDeploymentGroup(this, 'UserDeploymentGroup', {
      application: codeDeployApp,
      alias: userFunctionAlias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
      alarms: [userFunctionErrorAlarm, userProcessingErrorsAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: false,
      },
    });

    // Create deployment group for order function canary deployments
    new codedeploy.LambdaDeploymentGroup(this, 'OrderDeploymentGroup', {
      application: codeDeployApp,
      alias: orderFunctionAlias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
      alarms: [orderFunctionErrorAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: false,
      },
    });

    // Create deployment group for scheduled function canary deployments
    new codedeploy.LambdaDeploymentGroup(this, 'ScheduledDeploymentGroup', {
      application: codeDeployApp,
      alias: scheduledFunctionAlias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
      alarms: [scheduledFunctionErrorAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: false,
      },
    });

    // Add EventBridge as target for the order processing rule
    orderProcessingRule.addTarget(
      new targets.LambdaFunction(orderFunctionAlias)
    );

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Enhanced Serverless API with Powertools and Scheduler',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Trace-Id',
        ],
      },
      deployOptions: {
        stageName: props.environmentSuffix,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
    });

    // Create API Resources and Methods
    const usersResource = this.api.root.addResource('users');
    const userMethodIntegration = new apigateway.LambdaIntegration(
      userFunctionAlias,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    usersResource.addMethod('GET', userMethodIntegration);
    usersResource.addMethod('POST', userMethodIntegration);

    const userByIdResource = usersResource.addResource('{userId}');
    userByIdResource.addMethod('GET', userMethodIntegration);
    userByIdResource.addMethod('PUT', userMethodIntegration);

    const ordersResource = this.api.root.addResource('orders');
    const orderMethodIntegration = new apigateway.LambdaIntegration(
      orderFunctionAlias,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    ordersResource.addMethod('GET', orderMethodIntegration);
    ordersResource.addMethod('POST', orderMethodIntegration);

    // Customer-specific orders endpoint
    const customerOrdersResource = ordersResource.addResource('{customerId}');
    customerOrdersResource.addMethod('POST', orderMethodIntegration);

    // Output important values
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'Enhanced API Gateway URL with tracing',
      exportName: `api-url-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Bus Name',
      exportName: `event-bus-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBridgeLogGroupArn', {
      value: eventBridgeLogGroup.logGroupArn,
      description: 'EventBridge Log Group ARN',
      exportName: `eventbridge-log-group-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PowertoolsLogGroupArn', {
      value: powertoolsLogGroup.logGroupArn,
      description: 'Lambda Powertools Log Group ARN',
      exportName: `powertools-log-group-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduleGroupName', {
      value: scheduleGroup.name!,
      description: 'EventBridge Scheduler Group Name',
      exportName: `schedule-group-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UserFunctionName', {
      value: this.userFunction.functionName,
      description: 'User Lambda Function Name with Powertools',
      exportName: `user-function-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrderFunctionName', {
      value: this.orderFunction.functionName,
      description: 'Order Lambda Function Name with Powertools',
      exportName: `order-function-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduledProcessingFunctionName', {
      value: this.scheduledProcessingFunction.functionName,
      description: 'Scheduled Processing Lambda Function Name',
      exportName: `scheduled-function-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DailyScheduleName', {
      value: dailyProcessingSchedule.name!,
      description: 'Daily Processing Schedule Name',
      exportName: `daily-schedule-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HourlyScheduleName', {
      value: hourlyProcessingSchedule.name!,
      description: 'Hourly Processing Schedule Name',
      exportName: `hourly-schedule-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OneTimeScheduleName', {
      value: oneTimeInitSchedule.name!,
      description: 'One-time Initialization Schedule Name',
      exportName: `onetime-schedule-${props.environmentSuffix}`,
    });
  }
}
