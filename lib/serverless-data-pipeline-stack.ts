import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface ServerlessDataPipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
  notificationEmail?: string;
}

export class ServerlessDataPipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessDataPipelineStackProps
  ) {
    super(scope, id, props);

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create S3 bucket with AES-256 encryption
    const dataBucket = new s3.Bucket(this, 'DataProcessingBucket', {
      bucketName: `data-pipeline-${props.environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensures resources are destroyable
      autoDeleteObjects: true,
    });

    // Create SNS topic for notifications
    const notificationTopic = new sns.Topic(
      this,
      'ProcessingNotificationTopic',
      {
        topicName: `data-processing-notifications-${props.environmentSuffix}`,
        displayName: 'Data Processing Notifications',
        fifo: false,
      }
    );

    // Add email subscription if provided
    if (props.notificationEmail) {
      notificationTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'DataProcessingLogs', {
      logGroupName: `/aws/lambda/data-processing-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role with minimal permissions
    const lambdaRole = new iam.Role(this, 'DataProcessingLambdaRole', {
      roleName: `data-processing-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DataProcessingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [dataBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [notificationTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [logGroup.logGroupArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [
                `arn:aws:lambda:${this.region}:${this.account}:function:*`,
              ],
            }),
          ],
        }),
      },
    });

    // Main data processing Lambda function with inline code
    const dataProcessor = new lambda.Function(this, 'DataProcessor', {
      functionName: `data-processor-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    let request;

    // Handle different event sources
    if (event.body) {
      // API Gateway request
      request = JSON.parse(event.body);
    } else if (event.fileName) {
      // Direct invocation from S3 trigger
      request = event;
    } else {
      throw new Error('Invalid event format');
    }

    // Validate request
    if (!request.fileName || !request.processingType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: fileName, processingType' }),
      };
    }

    // Process the data
    const result = await processData(request);

    // Send notification
    await sendNotification(request.fileName, result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing completed successfully',
        result,
      }),
    };
  } catch (error) {
    console.error('Processing error:', error);
    await sendErrorNotification(error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function processData(request) {
  const { fileName, processingType } = request;

  try {
    // Get object from S3
    const getCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
    });
    const response = await s3Client.send(getCommand);

    // Read the data
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

    // Process based on type
    let processedData;
    switch (processingType) {
      case 'priority':
        processedData = data.map(item => ({ ...item, processed: true, priority: true, timestamp: new Date().toISOString() }));
        break;
      case 'batch':
        processedData = data.map((item, index) => ({ ...item, processed: true, batchId: Math.floor(index / 100), timestamp: new Date().toISOString() }));
        break;
      default:
        processedData = data.map(item => ({ ...item, processed: true, timestamp: new Date().toISOString() }));
    }

    // Save processed data
    const outputKey = \`processed/\${fileName}\`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: outputKey,
      Body: JSON.stringify(processedData),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
      Metadata: {
        processedAt: new Date().toISOString(),
        processingType,
      },
    });

    await s3Client.send(putCommand);

    return {
      outputKey,
      recordsProcessed: processedData.length,
      processingType,
    };
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}

async function sendNotification(fileName, result) {
  const message = {
    fileName,
    result,
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
  };

  const command = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: 'Data Processing Completed',
    Message: JSON.stringify(message, null, 2),
    MessageAttributes: {
      fileName: { DataType: 'String', StringValue: fileName },
      status: { DataType: 'String', StringValue: 'SUCCESS' },
    },
  });

  await snsClient.send(command);
}

async function sendErrorNotification(error) {
  const message = {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    status: 'ERROR',
  };

  const command = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: 'Data Processing Failed',
    Message: JSON.stringify(message, null, 2),
    MessageAttributes: {
      status: { DataType: 'String', StringValue: 'ERROR' },
    },
  });

  try {
    await snsClient.send(command);
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
  }
}
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 3008, // Maximum memory for better performance
      role: lambdaRole,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: logGroup,
      reservedConcurrentExecutions: 100,
    });

    // S3 trigger function with inline code
    const s3TriggerFunction = new lambda.Function(this, 'S3TriggerFunction', {
      functionName: `s3-trigger-processor-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName.startsWith('ObjectCreated:')) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));

      console.log(\`Processing new file: \${objectKey} from bucket: \${bucketName}\`);

      try {
        // Determine processing type based on file path
        const processingType = determineProcessingType(objectKey);

        // Invoke main processor function
        const payload = {
          fileName: objectKey,
          processingType,
        };

        const command = new InvokeCommand({
          FunctionName: process.env.PROCESSOR_FUNCTION_NAME,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify(payload),
        });

        await lambdaClient.send(command);
        console.log(\`Successfully triggered processing for \${objectKey}\`);
      } catch (error) {
        console.error(\`Error processing \${objectKey}:\`, error);
        throw error;
      }
    }
  }
};

function determineProcessingType(objectKey) {
  if (objectKey.includes('/priority/')) {
    return 'priority';
  } else if (objectKey.includes('/batch/')) {
    return 'batch';
  }
  return 'standard';
}
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      environment: {
        PROCESSOR_FUNCTION_NAME: dataProcessor.functionName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    // Grant S3 trigger function permission to invoke main processor
    dataProcessor.grantInvoke(s3TriggerFunction);

    // Add S3 event notification to trigger Lambda
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3TriggerFunction),
      { suffix: '.json' }
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'DataProcessingAPI', {
      restApiName: `Data-Processing-API-${props.environmentSuffix}`,
      description: 'API for triggering data processing',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Don't log request/response data for security
        metricsEnabled: true,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
      // No CORS configuration - internal use only
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(this.account)],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
          }),
        ],
      }),
    });

    // Create API resource and method
    const processResource = api.root.addResource('process');

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        requestValidatorName: `request-validator-${props.environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Define request model
    const requestModel = api.addModel('ProcessRequestModel', {
      contentType: 'application/json',
      modelName: 'ProcessRequest',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'processRequest',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          fileName: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            description: 'Name of the file to process in S3',
          },
          processingType: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ['standard', 'priority', 'batch'],
            description: 'Type of processing to perform',
          },
        },
        required: ['fileName', 'processingType'],
        additionalProperties: false,
      },
    });

    // Add POST method with Lambda integration
    processResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(dataProcessor, {
        requestTemplates: {
          'application/json': JSON.stringify({
            body: '$input.body',
            headers: '$input.params().header',
            queryParams: '$input.params().querystring',
            pathParams: '$input.params().path',
            requestId: '$context.requestId',
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
            },
          },
          {
            statusCode: '400',
            selectionPattern: '.*"statusCode": 400.*',
            responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*"statusCode": 500.*',
            responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
            },
          },
        ],
      }),
      {
        requestValidator,
        requestModels: {
          'application/json': requestModel,
        },
        authorizationType: apigateway.AuthorizationType.IAM,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
        ],
      }
    );

    // Create usage plan for API throttling and monitoring
    api.addUsagePlan('DataProcessingUsagePlan', {
      name: `data-processing-plan-${props.environmentSuffix}`,
      description: 'Usage plan for data processing API',
      throttle: {
        burstLimit: 1000,
        rateLimit: 500,
      },
      quota: {
        limit: 100000, // 100k requests per month as required
        period: apigateway.Period.MONTH,
      },
    });

    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'DataProcessingDashboard',
      {
        dashboardName: `data-processing-pipeline-${props.environmentSuffix}`,
        widgets: [
          // First row - Lambda metrics
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Invocations',
              left: [dataProcessor.metricInvocations()],
              right: [dataProcessor.metricErrors()],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'Lambda Duration',
              left: [dataProcessor.metricDuration()],
              width: 12,
              height: 6,
            }),
          ],
          // Second row - API Gateway metrics
          [
            new cloudwatch.GraphWidget({
              title: 'API Gateway Requests',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Count',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                    Stage: 'prod',
                  },
                  statistic: 'Sum',
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '4XXError',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                    Stage: 'prod',
                  },
                  statistic: 'Sum',
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '5XXError',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                    Stage: 'prod',
                  },
                  statistic: 'Sum',
                }),
              ],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'API Gateway Latency',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Latency',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                    Stage: 'prod',
                  },
                  statistic: 'Average',
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'IntegrationLatency',
                  dimensionsMap: {
                    ApiName: api.restApiName,
                    Stage: 'prod',
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
          // Third row - SNS metrics
          [
            new cloudwatch.GraphWidget({
              title: 'SNS Messages',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/SNS',
                  metricName: 'NumberOfMessagesPublished',
                  dimensionsMap: {
                    TopicName: notificationTopic.topicName,
                  },
                  statistic: 'Sum',
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/SNS',
                  metricName: 'NumberOfNotificationsFailed',
                  dimensionsMap: {
                    TopicName: notificationTopic.topicName,
                  },
                  statistic: 'Sum',
                }),
              ],
              width: 24,
              height: 6,
            }),
          ],
        ],
      }
    );

    // Create CloudWatch alarms for critical metrics
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `data-processor-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alarm for Lambda function errors',
      metric: dataProcessor.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action to SNS topic
    errorAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(notificationTopic)
    );

    // Lambda duration alarm
    const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `data-processor-duration-${props.environmentSuffix}`,
      alarmDescription: 'Alarm for Lambda function duration',
      metric: dataProcessor.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 240000, // 4 minutes (alert before 5-minute timeout)
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    durationAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(notificationTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `APIEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket name for data uploads',
      exportName: `DataBucket-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications',
      exportName: `SNSTopicArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
      exportName: `DashboardUrl-${props.environmentSuffix}`,
    });
  }
}
