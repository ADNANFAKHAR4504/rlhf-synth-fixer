import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface ServerlessDataPipelineStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  notificationEmail?: string;
}

export class ServerlessDataPipelineStack extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessDataPipelineStackProps
  ) {
    super(scope, id, props);

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create VPC for enhanced security
    const vpc = new ec2.Vpc(this, 'DataPipelineVPC', {
      maxAzs: 2,
      natGateways: 0, // No NAT gateways needed for serverless with VPC endpoints
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create VPC endpoints for AWS services
    // S3 Gateway endpoint (required for PrivateDnsOnlyForInboundResolverEndpoint)
    vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

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

    // Create CloudWatch log group with retention
    const logGroup = new logs.LogGroup(this, 'DataProcessingLogs', {
      logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role with VPC and minimal permissions
    const lambdaRole = new iam.Role(this, 'DataProcessingLambdaRole', {
      roleName: `data-processing-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
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
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
              ],
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
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
        NODE_OPTIONS: '--enable-source-maps', // Better debugging
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: logGroup,
      // reservedConcurrentExecutions: 5, // Removed to avoid account limits
    });

    // S3 will trigger the main Lambda function directly
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(dataProcessor),
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
        proxy: true, // Enable response streaming and full proxy integration
        requestTemplates: {
          'application/json': JSON.stringify({
            body: '$input.body',
            headers: '$input.params().header',
            queryParams: '$input.params().querystring',
            pathParams: '$input.params().path',
            requestId: '$context.requestId',
            sourceIp: '$context.identity.sourceIp',
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

    // Create simplified CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'DataProcessingDashboard',
      {
        dashboardName: `data-processing-pipeline-${props.environmentSuffix}`,
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
      new cloudwatchActions.SnsAction(notificationTopic)
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
      new cloudwatchActions.SnsAction(notificationTopic)
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL for testing',
      exportName: `APIEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'APIGatewayId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `APIGatewayId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket name for data uploads and testing',
      exportName: `DataBucket-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: dataBucket.bucketArn,
      description: 'S3 bucket ARN for testing',
      exportName: `DataBucketArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: dataProcessor.functionName,
      description: 'Lambda function name for testing',
      exportName: `LambdaFunctionName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: dataProcessor.functionArn,
      description: 'Lambda function ARN for testing',
      exportName: `LambdaFunctionArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications and testing',
      exportName: `SNSTopicArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicName', {
      value: notificationTopic.topicName,
      description: 'SNS topic name for testing',
      exportName: `SNSTopicName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'IAMRoleName', {
      value: lambdaRole.roleName,
      description: 'Lambda execution role name for testing',
      exportName: `IAMRoleName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda execution role ARN for testing',
      exportName: `IAMRoleArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch dashboard name for testing',
      exportName: `DashboardName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
      exportName: `DashboardUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
      exportName: `Region-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: props.environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `EnvironmentSuffix-${props.environmentSuffix}`,
    });

    // VPC outputs for security validation
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for enhanced security',
      exportName: `VpcId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcEndpointCount', {
      value: '3', // S3, SNS, CloudWatch Logs endpoints
      description: 'Number of VPC endpoints configured',
      exportName: `VpcEndpointCount-${props.environmentSuffix}`,
    });

    // Error alarm outputs for testing
    new cdk.CfnOutput(this, 'ErrorAlarmName', {
      value: errorAlarm.alarmName,
      description: 'CloudWatch error alarm name for testing',
      exportName: `ErrorAlarmName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DurationAlarmName', {
      value: durationAlarm.alarmName,
      description: 'CloudWatch duration alarm name for testing',
      exportName: `DurationAlarmName-${props.environmentSuffix}`,
    });

    // Integration testing outputs are handled via CfnOutput above
  }
}
