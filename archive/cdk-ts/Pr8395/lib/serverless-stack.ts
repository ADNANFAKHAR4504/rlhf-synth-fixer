import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    // Create EventBridge resources
    const eventBus = new events.EventBus(this, 'ServerlessEventBus', {
      eventBusName: `serverless-events-${props.environmentSuffix}`,
    });

    // Create CloudWatch Log Groups
    const eventBridgeLogGroup = new logs.LogGroup(this, 'EventBridgeLogGroup', {
      logGroupName: `/aws/events/serverless-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const powertoolsLogGroup = new logs.LogGroup(this, 'PowertoolsLogGroup', {
      logGroupName: `/aws/lambda/powertools-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add AWS Lambda Powertools Layer
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:3`
    );

    // Create shared IAM role with enhanced permissions for X-Ray and CloudWatch
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

    // User Lambda Function with Powertools integration
    this.userFunction = new lambda.Function(this, 'UserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      layers: [powertoolsLayer],
      code: lambda.Code.fromInline(this.getUserFunctionCode()),
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

    // Order Lambda Function with Powertools and EventBridge integration
    this.orderFunction = new lambda.Function(this, 'OrderFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      layers: [powertoolsLayer],
      code: lambda.Code.fromInline(this.getOrderFunctionCode()),
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

    // Scheduled Processing Lambda Function
    this.scheduledProcessingFunction = new lambda.Function(
      this,
      'ScheduledProcessingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        layers: [powertoolsLayer],
        code: lambda.Code.fromInline(this.getScheduledFunctionCode()),
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

    // Grant EventBridge permissions
    eventBus.grantPutEventsTo(this.orderFunction);

    // Create EventBridge Scheduler resources
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

    // Create Schedule Group for organization
    const scheduleGroup = new scheduler.CfnScheduleGroup(
      this,
      'ServerlessScheduleGroup',
      {
        name: `serverless-schedules-${props.environmentSuffix}`,
        tags: [
          { key: 'Environment', value: props.environmentSuffix },
          { key: 'Service', value: 'serverless-processing' },
        ],
      }
    );

    // Create schedules
    this.createSchedules(
      scheduleGroup,
      schedulerExecutionRole,
      props.environmentSuffix
    );

    // Create EventBridge rule for order processing
    const orderProcessingRule = new events.Rule(this, 'OrderProcessingRule', {
      eventBus,
      ruleName: `order-processing-${props.environmentSuffix}`,
      eventPattern: {
        source: ['serverless.orders'],
        detailType: ['Order Created', 'Order Updated'],
      },
    });

    // Create Lambda aliases for deployment management
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

    // Set up CloudWatch Alarms
    const alarms = this.createCloudWatchAlarms(props.environmentSuffix);

    // Set up CodeDeploy for canary deployments with automatic rollbacks
    this.setupCodeDeploy(
      userFunctionAlias,
      orderFunctionAlias,
      scheduledFunctionAlias,
      props.environmentSuffix,
      alarms
    );

    // Add EventBridge target
    orderProcessingRule.addTarget(
      new targets.LambdaFunction(orderFunctionAlias)
    );

    // Create API Gateway with enhanced observability
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

    // Set up API endpoints
    this.setupApiEndpoints(userFunctionAlias, orderFunctionAlias);

    // Create outputs
    this.createOutputs(
      props.environmentSuffix,
      eventBus,
      eventBridgeLogGroup,
      powertoolsLogGroup,
      scheduleGroup
    );
  }

  private getUserFunctionCode(): string {
    return `
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
        defaultDimensions: { environment: process.env.ENVIRONMENT }
      });

      const tracer = new Tracer({
        serviceName: 'user-service',
        captureHTTPsRequests: true
      });

      exports.handler = async (event, context) => {
        logger.addContext(context);
        const segment = tracer.getSegment();
        const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
        
        logger.info('User function invoked', { 
          requestId: context.awsRequestId,
          httpMethod: event.httpMethod,
          path: event.path
        });

        metrics.addMetric('UserFunctionInvocation', 'Count', 1);
        metrics.addMetadata('userId', event.pathParameters?.userId || 'anonymous');

        if (subsegment) {
          subsegment.addAnnotation('userId', event.pathParameters?.userId || 'anonymous');
          subsegment.addAnnotation('httpMethod', event.httpMethod);
        }
        
        try {
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

          if (subsegment) subsegment.close();
          metrics.publishStoredMetrics();
          return response;

        } catch (error) {
          logger.error('Error processing user request', { error: error.message });
          metrics.addMetric('UserProcessingError', 'Count', 1);
          
          if (subsegment) {
            subsegment.addError(error);
            subsegment.close();
          }

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
    `;
  }

  private getOrderFunctionCode(): string {
    return `
      const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
      const { Logger } = require('@aws-lambda-powertools/logger');
      const { Metrics } = require('@aws-lambda-powertools/metrics');
      const { Tracer } = require('@aws-lambda-powertools/tracer');
      
      const eventBridgeClient = new EventBridgeClient();
      
      const logger = new Logger({
        serviceName: 'order-service',
        environment: process.env.ENVIRONMENT,
        logLevel: 'INFO'
      });

      const metrics = new Metrics({
        namespace: 'ServerlessApp',
        serviceName: 'order-service',
        defaultDimensions: { environment: process.env.ENVIRONMENT }
      });

      const tracer = new Tracer({
        serviceName: 'order-service',
        captureHTTPsRequests: true
      });

      exports.handler = async (event, context) => {
        logger.addContext(context);
        const segment = tracer.getSegment();
        const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
        
        logger.info('Order function invoked', { 
          requestId: context.awsRequestId,
          httpMethod: event.httpMethod,
          customerId: event.pathParameters?.customerId
        });

        metrics.addMetric('OrderFunctionInvocation', 'Count', 1);
        metrics.addMetadata('customerId', event.pathParameters?.customerId || 'anonymous');

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

          // Publish event to EventBridge using AWS SDK v3
          const eventParams = {
            Entries: [{
              Source: 'serverless.orders',
              DetailType: 'Order Created',
              Detail: JSON.stringify(orderData),
              EventBusName: process.env.EVENT_BUS_NAME
            }]
          };
          
          const command = new PutEventsCommand(eventParams);
          await eventBridgeClient.send(command);
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

          if (subsegment) subsegment.close();
          metrics.publishStoredMetrics();
          return response;

        } catch (error) {
          logger.error('Error processing order', { error: error.message });
          metrics.addMetric('OrderProcessingError', 'Count', 1);
          
          if (subsegment) {
            subsegment.addError(error);
            subsegment.close();
          }

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
    `;
  }

  private getScheduledFunctionCode(): string {
    return `
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
        defaultDimensions: { environment: process.env.ENVIRONMENT }
      });

      const tracer = new Tracer({
        serviceName: 'scheduled-processing',
        captureHTTPsRequests: true
      });

      exports.handler = async (event, context) => {
        logger.addContext(context);
        const segment = tracer.getSegment();
        const subsegment = segment ? segment.addNewSubsegment('## handler') : null;
        
        logger.info('Scheduled processing function invoked', { 
          requestId: context.awsRequestId,
          scheduleArn: event.scheduleArn,
          scheduledTime: event.time
        });

        metrics.addMetric('ScheduledProcessingInvocation', 'Count', 1);
        metrics.addMetadata('scheduleArn', event.scheduleArn);

        if (subsegment) {
          subsegment.addAnnotation('scheduleType', event.scheduleType || 'unknown');
          subsegment.addAnnotation('scheduledTime', event.time);
        }

        try {
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

          if (subsegment) subsegment.close();
          metrics.publishStoredMetrics();
          return response;

        } catch (error) {
          logger.error('Error in scheduled processing', { error: error.message });
          metrics.addMetric('ScheduledProcessingError', 'Count', 1);
          
          if (subsegment) {
            subsegment.addError(error);
            subsegment.close();
          }

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
    `;
  }

  private createSchedules(
    scheduleGroup: scheduler.CfnScheduleGroup,
    schedulerExecutionRole: iam.Role,
    environmentSuffix: string
  ): void {
    // Check if scheduler should be disabled (for LocalStack which has limited support)
    const disableScheduler =
      this.node.tryGetContext('disableScheduler') === 'true' ||
      this.node.tryGetContext('disableScheduler') === true;

    // Skip scheduler creation if disabled (LocalStack has limited EventBridge Scheduler support)
    if (disableScheduler) {
      return;
    }

    // Daily processing schedule
    const dailySchedule = new scheduler.CfnSchedule(
      this,
      'DailyProcessingSchedule',
      {
        flexibleTimeWindow: {
          mode: 'FLEXIBLE',
          maximumWindowInMinutes: 15,
        },
        groupName: scheduleGroup.name,
        name: `daily-processing-${environmentSuffix}`,
        scheduleExpression: 'cron(0 2 * * ? *)',
        scheduleExpressionTimezone: 'UTC',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'daily',
            task: 'daily-maintenance',
            environment: environmentSuffix,
          }),
        },
        description: 'Daily scheduled processing for maintenance tasks',
      }
    );
    // Add explicit dependency on schedule group
    dailySchedule.addDependency(scheduleGroup);

    // Hourly processing schedule
    const hourlySchedule = new scheduler.CfnSchedule(
      this,
      'HourlyProcessingSchedule',
      {
        flexibleTimeWindow: {
          mode: 'FLEXIBLE',
          maximumWindowInMinutes: 5,
        },
        groupName: scheduleGroup.name,
        name: `hourly-processing-${environmentSuffix}`,
        scheduleExpression: 'rate(1 hour)',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'hourly',
            task: 'frequent-check',
            environment: environmentSuffix,
          }),
        },
        description: 'Hourly scheduled processing for frequent checks',
      }
    );
    // Add explicit dependency on schedule group
    hourlySchedule.addDependency(scheduleGroup);

    // One-time initialization schedule
    const initializationDate = new Date();
    initializationDate.setHours(initializationDate.getHours() + 24);

    const oneTimeSchedule = new scheduler.CfnSchedule(
      this,
      'OneTimeInitSchedule',
      {
        flexibleTimeWindow: {
          mode: 'OFF',
        },
        groupName: scheduleGroup.name,
        name: `initialization-${environmentSuffix}`,
        scheduleExpression: `at(${initializationDate.toISOString().slice(0, 19)})`,
        scheduleExpressionTimezone: 'UTC',
        state: 'ENABLED',
        target: {
          arn: this.scheduledProcessingFunction.functionArn,
          roleArn: schedulerExecutionRole.roleArn,
          input: JSON.stringify({
            scheduleType: 'one-time',
            task: 'system-initialization',
            environment: environmentSuffix,
          }),
        },
        description: 'One-time system initialization 24 hours after deployment',
      }
    );
    // Add explicit dependency on schedule group
    oneTimeSchedule.addDependency(scheduleGroup);
  }

  private createCloudWatchAlarms(environmentSuffix: string): {
    userFunctionErrorAlarm: cloudwatch.Alarm;
    orderFunctionErrorAlarm: cloudwatch.Alarm;
    scheduledFunctionErrorAlarm: cloudwatch.Alarm;
    userProcessingErrorsAlarm: cloudwatch.Alarm;
  } {
    // Function error alarms
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

    // Custom Powertools metrics alarm
    const userProcessingErrorsAlarm = new cloudwatch.Alarm(
      this,
      'UserProcessingErrorsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'ServerlessApp',
          metricName: 'UserProcessingError',
          dimensionsMap: {
            environment: environmentSuffix,
          },
          statistic: 'Sum',
        }),
        threshold: 3,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    return {
      userFunctionErrorAlarm,
      orderFunctionErrorAlarm,
      scheduledFunctionErrorAlarm,
      userProcessingErrorsAlarm,
    };
  }

  private setupCodeDeploy(
    userFunctionAlias: lambda.Alias,
    orderFunctionAlias: lambda.Alias,
    scheduledFunctionAlias: lambda.Alias,
    environmentSuffix: string,
    alarms: {
      userFunctionErrorAlarm: cloudwatch.Alarm;
      orderFunctionErrorAlarm: cloudwatch.Alarm;
      scheduledFunctionErrorAlarm: cloudwatch.Alarm;
      userProcessingErrorsAlarm: cloudwatch.Alarm;
    }
  ): void {
    const codeDeployApp = new codedeploy.LambdaApplication(
      this,
      'ServerlessApp',
      {
        applicationName: `serverless-app-${environmentSuffix}`,
      }
    );

    // Use CANARY deployment strategy for safer deployments
    const deploymentConfig =
      codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES;

    new codedeploy.LambdaDeploymentGroup(this, 'UserDeploymentGroup', {
      application: codeDeployApp,
      alias: userFunctionAlias,
      deploymentConfig,
      alarms: [alarms.userFunctionErrorAlarm, alarms.userProcessingErrorsAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true, // Enable automatic rollback on alarm
      },
    });

    new codedeploy.LambdaDeploymentGroup(this, 'OrderDeploymentGroup', {
      application: codeDeployApp,
      alias: orderFunctionAlias,
      deploymentConfig,
      alarms: [alarms.orderFunctionErrorAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true, // Enable automatic rollback on alarm
      },
    });

    new codedeploy.LambdaDeploymentGroup(this, 'ScheduledDeploymentGroup', {
      application: codeDeployApp,
      alias: scheduledFunctionAlias,
      deploymentConfig,
      alarms: [alarms.scheduledFunctionErrorAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true, // Enable automatic rollback on alarm
      },
    });
  }

  private setupApiEndpoints(
    userFunctionAlias: lambda.Alias,
    orderFunctionAlias: lambda.Alias
  ): void {
    // Users endpoints
    const usersResource = this.api.root.addResource('users');
    const userMethodIntegration = new apigateway.LambdaIntegration(
      userFunctionAlias
    );

    usersResource.addMethod('GET', userMethodIntegration);
    usersResource.addMethod('POST', userMethodIntegration);

    const userByIdResource = usersResource.addResource('{userId}');
    userByIdResource.addMethod('GET', userMethodIntegration);
    userByIdResource.addMethod('PUT', userMethodIntegration);

    // Orders endpoints
    const ordersResource = this.api.root.addResource('orders');
    const orderMethodIntegration = new apigateway.LambdaIntegration(
      orderFunctionAlias
    );

    ordersResource.addMethod('GET', orderMethodIntegration);
    ordersResource.addMethod('POST', orderMethodIntegration);

    const customerOrdersResource = ordersResource.addResource('{customerId}');
    customerOrdersResource.addMethod('POST', orderMethodIntegration);
  }

  private createOutputs(
    environmentSuffix: string,
    eventBus: events.EventBus,
    eventBridgeLogGroup: logs.LogGroup,
    powertoolsLogGroup: logs.LogGroup,
    scheduleGroup: scheduler.CfnScheduleGroup
  ): void {
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'Enhanced API Gateway URL with tracing',
      exportName: `api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Bus Name',
      exportName: `event-bus-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UserFunctionName', {
      value: this.userFunction.functionName,
      description: 'User Lambda Function Name with Powertools',
      exportName: `user-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrderFunctionName', {
      value: this.orderFunction.functionName,
      description: 'Order Lambda Function Name with Powertools',
      exportName: `order-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduledProcessingFunctionName', {
      value: this.scheduledProcessingFunction.functionName,
      description: 'Scheduled Processing Lambda Function Name',
      exportName: `scheduled-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduleGroupName', {
      value: scheduleGroup.name!,
      description: 'EventBridge Scheduler Group Name',
      exportName: `schedule-group-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PowertoolsLogGroupArn', {
      value: powertoolsLogGroup.logGroupArn,
      description: 'Lambda Powertools Log Group ARN',
      exportName: `powertools-log-group-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBridgeLogGroupArn', {
      value: eventBridgeLogGroup.logGroupArn,
      description: 'EventBridge Log Group ARN',
      exportName: `eventbridge-log-group-${environmentSuffix}`,
    });
  }
}
