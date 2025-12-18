import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // ===== DynamoDB Tables =====
    // User Data Table with DynamoDB Streams
    const userDataTable = new dynamodb.Table(this, 'UserDataTable', {
      tableName: `${environmentSuffix}-userdata-synth`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Order Data Table with DynamoDB Streams
    const orderDataTable = new dynamodb.Table(this, 'OrderDataTable', {
      tableName: `${environmentSuffix}-orderdata-synth`,
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Analytics Table for processed data
    const analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: `${environmentSuffix}-analytics-synth`,
      partitionKey: { name: 'dataType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'processedAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===== Lambda Functions with PowerTools =====
    // User Data Processor Lambda with PowerTools
    const userDataProcessorRole = new iam.Role(this, 'UserDataProcessorRole', {
      roleName: `${environmentSuffix}-userdataproc-role-synth`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Add inline policy for DynamoDB stream access
    userDataProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [userDataTable.tableStreamArn!],
      })
    );

    userDataProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [analyticsTable.tableArn],
      })
    );

    const userDataProcessor = new lambda.Function(this, 'UserDataProcessor', {
      functionName: `${environmentSuffix}-userdataproc-synth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: userDataProcessorRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      environment: {
        ANALYTICS_TABLE_NAME: analyticsTable.tableName,
        REGION: process.env.AWS_REGION || 'us-east-1',
        POWERTOOLS_SERVICE_NAME: 'user-data-processor',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        LOG_LEVEL: 'INFO',
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
        const clientConfig = {
          region: process.env.REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        };
        const client = new DynamoDBClient(clientConfig);
        const dynamodb = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          console.log('Processing user data stream records:', JSON.stringify(event, null, 2));
          
          const processedRecords = [];
          
          for (const record of event.Records) {
            try {
              if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                const userId = newImage.userId.S;
                const timestamp = parseInt(newImage.timestamp.N);
                
                console.log('Processing user record:', { userId, eventType: record.eventName });
                
                const putCommand = new PutCommand({
                  TableName: process.env.ANALYTICS_TABLE_NAME,
                  Item: {
                    dataType: 'USER_ACTIVITY',
                    processedAt: Date.now(),
                    sourceUserId: userId,
                    sourceTimestamp: timestamp,
                    eventType: record.eventName,
                    processedBy: 'userDataProcessor'
                  }
                });
                
                await dynamodb.send(putCommand);
                processedRecords.push(userId);
                
                console.log('Successfully processed user data:', userId);
              }
            } catch (error) {
              console.error('Error processing record:', error.message, {
                userId: record.dynamodb?.Keys?.userId?.S,
                eventName: record.eventName
              });
              throw error;
            }
          }
          
          console.log('Batch processing complete. Processed records:', processedRecords.length);
          return { statusCode: 200, body: 'Successfully processed user data stream' };
        };
      `),
    });

    // Order Data Processor Lambda with PowerTools
    const orderDataProcessorRole = new iam.Role(
      this,
      'OrderDataProcessorRole',
      {
        roleName: `${environmentSuffix}-orderdataproc-role-synth`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    orderDataProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [orderDataTable.tableStreamArn!],
      })
    );

    orderDataProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [analyticsTable.tableArn],
      })
    );

    const orderDataProcessor = new lambda.Function(this, 'OrderDataProcessor', {
      functionName: `${environmentSuffix}-orderdataproc-synth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: orderDataProcessorRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ANALYTICS_TABLE_NAME: analyticsTable.tableName,
        REGION: process.env.AWS_REGION || 'us-east-1',
        POWERTOOLS_SERVICE_NAME: 'order-data-processor',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        LOG_LEVEL: 'INFO',
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
        const clientConfig = {
          region: process.env.REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        };
        const client = new DynamoDBClient(clientConfig);
        const dynamodb = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          console.log('Processing order data stream records:', JSON.stringify(event, null, 2));
          
          const processedRecords = [];
          
          for (const record of event.Records) {
            try {
              if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                const orderId = newImage.orderId.S;
                const createdAt = parseInt(newImage.createdAt.N);
                
                console.log('Processing order record:', { orderId, eventType: record.eventName });
                
                const putCommand = new PutCommand({
                  TableName: process.env.ANALYTICS_TABLE_NAME,
                  Item: {
                    dataType: 'ORDER_ACTIVITY',
                    processedAt: Date.now(),
                    sourceOrderId: orderId,
                    sourceTimestamp: createdAt,
                    eventType: record.eventName,
                    processedBy: 'orderDataProcessor'
                  }
                });
                
                await dynamodb.send(putCommand);
                processedRecords.push(orderId);
                
                console.log('Successfully processed order data:', orderId);
              }
            } catch (error) {
              console.error('Error storing analytics data:', error.message, {
                orderId: record.dynamodb?.Keys?.orderId?.S,
                eventName: record.eventName
              });
              throw error;
            }
          }
          
          console.log('Batch processing complete. Processed records:', processedRecords.length);
          return { statusCode: 200, body: 'Successfully processed order data stream' };
        };
      `),
    });

    // Analytics Processor Lambda with PowerTools
    const analyticsProcessorRole = new iam.Role(
      this,
      'AnalyticsProcessorRole',
      {
        roleName: `${environmentSuffix}-analyticsproc-role-synth`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    analyticsProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:PutItem'],
        resources: [analyticsTable.tableArn],
      })
    );

    const analyticsProcessor = new lambda.Function(this, 'AnalyticsProcessor', {
      functionName: `${environmentSuffix}-analyticsproc-synth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: analyticsProcessorRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ANALYTICS_TABLE_NAME: analyticsTable.tableName,
        REGION: process.env.AWS_REGION || 'us-east-1',
        POWERTOOLS_SERVICE_NAME: 'analytics-processor',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        LOG_LEVEL: 'INFO',
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
        const clientConfig = {
          region: process.env.REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        };
        const client = new DynamoDBClient(clientConfig);
        const dynamodb = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          console.log('Running analytics processor with event:', JSON.stringify(event));
          
          try {
            const scanCommand = new ScanCommand({
              TableName: process.env.ANALYTICS_TABLE_NAME,
              FilterExpression: 'processedAt > :timestamp',
              ExpressionAttributeValues: {
                ':timestamp': Date.now() - (24 * 60 * 60 * 1000)
              }
            });
            
            const result = await dynamodb.send(scanCommand);
            console.log('Queried analytics data:', result.Items ? result.Items.length : 0);
            
            const items = result.Items || [];
            const userActivityCount = items.filter(item => item.dataType === 'USER_ACTIVITY').length;
            const orderActivityCount = items.filter(item => item.dataType === 'ORDER_ACTIVITY').length;
            
            const summary = {
              dataType: 'DAILY_SUMMARY',
              processedAt: Date.now(),
              totalRecords: items.length,
              userActivityCount,
              orderActivityCount,
              processedBy: 'analyticsProcessor'
            };
            
            const putCommand = new PutCommand({
              TableName: process.env.ANALYTICS_TABLE_NAME,
              Item: summary
            });
            
            await dynamodb.send(putCommand);
            
            console.log('Analytics summary created:', summary);
            
            // Return proper response structure for both direct invocation and Step Functions
            const response = { 
              statusCode: 200, 
              body: 'Successfully processed analytics',
              summary: summary
            };
            console.log('Returning response:', response);
            return response;
            
          } catch (error) {
            console.error('Error processing analytics:', error);
            // Return error response with statusCode
            return {
              statusCode: 500,
              body: JSON.stringify({ error: error.message }),
              error: error.message
            };
          }
        };
      `),
    });

    // Data Validation Lambda for Step Functions
    const dataValidatorRole = new iam.Role(this, 'DataValidatorRole', {
      roleName: `${environmentSuffix}-datavalidator-role-synth`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    const dataValidator = new lambda.Function(this, 'DataValidator', {
      functionName: `${environmentSuffix}-datavalidator-synth`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: dataValidatorRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'data-validator',
        POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
        LOG_LEVEL: 'INFO',
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Validating data batch:', event);
          
          const { dataType, batchSize = 100 } = event;
          
          // Simulate validation logic
          const isValid = dataType && ['USER_DATA', 'ORDER_DATA', 'DAILY_ANALYTICS'].includes(dataType);
          const validBatchSize = batchSize >= 1 && batchSize <= 1000;
          
          console.log('Validation check:', { dataType, batchSize, isValid, validBatchSize });
          
          if (isValid && validBatchSize) {
            console.log('Data validation successful:', { dataType, batchSize });
            
            return {
              isValid: true,
              dataType,
              batchSize,
              validatedAt: new Date().toISOString()
            };
          } else {
            console.log('Data validation failed:', { dataType, batchSize, isValid, validBatchSize });
            
            return {
              isValid: false,
              dataType,
              batchSize,
              error: 'Invalid data type or batch size',
              validatedAt: new Date().toISOString()
            };
          }
        };
      `),
    });

    // ===== Step Functions State Machine =====
    // Define the data processing workflow
    const dataProcessingLogGroup = new logs.LogGroup(
      this,
      'DataProcessingLogGroup',
      {
        logGroupName: `/aws/stepfunctions/${environmentSuffix}-data-processing-synth`,
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Step Functions role
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [dataValidator.functionArn, analyticsProcessor.functionArn],
      })
    );

    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogDelivery',
          'logs:GetLogDelivery',
          'logs:UpdateLogDelivery',
          'logs:DeleteLogDelivery',
          'logs:ListLogDeliveries',
          'logs:PutResourcePolicy',
          'logs:DescribeResourcePolicies',
          'logs:DescribeLogGroups',
        ],
        resources: ['*'],
      })
    );

    // Define Step Functions tasks
    const validateDataTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ValidateData',
      {
        lambdaFunction: dataValidator,
        outputPath: '$.Payload',
        retryOnServiceExceptions: true,
      }
    );

    const processAnalyticsTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ProcessAnalytics',
      {
        lambdaFunction: analyticsProcessor,
        outputPath: '$.Payload',
        retryOnServiceExceptions: true,
      }
    );

    // Define the workflow
    const validateChoice = new stepfunctions.Choice(this, 'IsDataValid?')
      .when(
        stepfunctions.Condition.booleanEquals('$.isValid', true),
        processAnalyticsTask
      )
      .otherwise(
        new stepfunctions.Fail(this, 'ValidationFailed', {
          cause: 'Data validation failed',
          error: 'InvalidDataError',
        })
      );

    const definition = validateDataTask.next(validateChoice);

    const dataProcessingStateMachine = new stepfunctions.StateMachine(
      this,
      'DataProcessingStateMachine',
      {
        stateMachineName: `${environmentSuffix}-data-processing-synth`,
        definition,
        role: stepFunctionsRole,
        tracingEnabled: true,
        logs: {
          destination: dataProcessingLogGroup,
          level: stepfunctions.LogLevel.ALL,
        },
      }
    );

    // ===== Event Source Mappings =====
    // Connect DynamoDB streams to Lambda functions
    userDataProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(userDataTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
        parallelizationFactor: 2,
        reportBatchItemFailures: true,
      })
    );

    orderDataProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(orderDataTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.seconds(10),
        retryAttempts: 3,
        parallelizationFactor: 1,
        reportBatchItemFailures: true,
      })
    );

    // ===== Monitoring =====
    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${environmentSuffix}-serverless-alerts-synth`,
      displayName: 'Serverless Infrastructure Alerts',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `${environmentSuffix}-serverless-dash-synth`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Invocations',
        left: [
          userDataProcessor.metricInvocations(),
          orderDataProcessor.metricInvocations(),
          analyticsProcessor.metricInvocations(),
          dataValidator.metricInvocations(),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Errors',
        left: [
          userDataProcessor.metricErrors(),
          orderDataProcessor.metricErrors(),
          analyticsProcessor.metricErrors(),
          dataValidator.metricErrors(),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Step Functions Execution Status',
        left: [
          dataProcessingStateMachine.metricStarted(),
          dataProcessingStateMachine.metricSucceeded(),
          dataProcessingStateMachine.metricFailed(),
        ],
        width: 12,
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'UserDataProcessorErrorAlarm', {
      alarmName: `${environmentSuffix}-userdataproc-errors-synth`,
      alarmDescription: 'Alarm for User Data Processor Lambda errors',
      metric: userDataProcessor.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Step Functions execution alarm
    new cloudwatch.Alarm(this, 'StepFunctionsFailureAlarm', {
      alarmName: `${environmentSuffix}-stepfunctions-failures-synth`,
      alarmDescription: 'Alarm for Step Functions execution failures',
      metric: dataProcessingStateMachine.metricFailed({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // EventBridge rule to trigger analytics processor daily
    const dailyAnalyticsRule = new events.Rule(this, 'DailyAnalyticsRule', {
      ruleName: `${environmentSuffix}-daily-analytics-synth`,
      description: 'Triggers Step Functions workflow daily',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // 2 AM daily
      }),
    });

    // Add Step Functions as target instead of direct Lambda
    dailyAnalyticsRule.addTarget(
      new targets.SfnStateMachine(dataProcessingStateMachine, {
        input: events.RuleTargetInput.fromObject({
          dataType: 'DAILY_ANALYTICS',
          batchSize: 100,
          scheduledExecution: true,
        }),
      })
    );

    // ===== Stack Outputs =====
    new cdk.CfnOutput(this, 'UserDataTableName', {
      value: userDataTable.tableName,
      description: 'User data table name',
    });

    new cdk.CfnOutput(this, 'OrderDataTableName', {
      value: orderDataTable.tableName,
      description: 'Order data table name',
    });

    new cdk.CfnOutput(this, 'AnalyticsTableName', {
      value: analyticsTable.tableName,
      description: 'Analytics table name',
    });

    new cdk.CfnOutput(this, 'UserDataProcessorFunctionName', {
      value: userDataProcessor.functionName,
      description: 'User data processor Lambda function name',
    });

    new cdk.CfnOutput(this, 'OrderDataProcessorFunctionName', {
      value: orderDataProcessor.functionName,
      description: 'Order data processor Lambda function name',
    });

    new cdk.CfnOutput(this, 'AnalyticsProcessorFunctionName', {
      value: analyticsProcessor.functionName,
      description: 'Analytics processor Lambda function name',
    });

    new cdk.CfnOutput(this, 'DataValidatorFunctionName', {
      value: dataValidator.functionName,
      description: 'Data validator Lambda function name',
    });

    new cdk.CfnOutput(this, 'StepFunctionsStateMachineArn', {
      value: dataProcessingStateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${environmentSuffix}-serverless-dash-synth`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });
  }
}
