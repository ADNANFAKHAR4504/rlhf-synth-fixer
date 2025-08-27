import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as xray from 'aws-cdk-lib/aws-xray';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props or context
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Common tags for cost monitoring
    const commonTags = {
      Project: 'srvrless-api',
      Environment: environmentSuffix,
      CostCenter: 'engineering',
      Team: 'serverless',
      EnvironmentSuffix: environmentSuffix,
    };

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'srvrless-vpc', {
      vpcName: `srvrless-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'srvrless-public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'srvrless-private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Name', 'srvrless-vpc');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // Create DynamoDB table for CRUD operations
    const table = new dynamodb.Table(this, 'srvrless-table', {
      tableName: `srvrless-items-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to DynamoDB table
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(table).add(key, value);
    });

    // Create custom EventBridge event bus for application events
    const eventBus = new events.EventBus(this, 'srvrless-event-bus', {
      eventBusName: `srvrless-event-bus-${environmentSuffix}`,
      description: 'Custom event bus for CRUD operations',
    });

    // Apply tags to EventBridge event bus
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(eventBus).add(key, value);
    });

    // Create CloudWatch Log Group for EventBridge logging
    const eventLogGroup = new logs.LogGroup(this, 'srvrless-event-logs', {
      logGroupName: `/aws/events/srvrless-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SQS Queue for EventBridge Dead Letter Queue
    const eventDlq = new sqs.Queue(this, 'srvrless-event-dlq', {
      queueName: `srvrless-event-dlq-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create SQS Queue for event processing
    const eventQueue = new sqs.Queue(this, 'srvrless-event-queue', {
      queueName: `srvrless-event-queue-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: cdk.Duration.seconds(90),
      deadLetterQueue: {
        queue: eventDlq,
        maxReceiveCount: 3,
      },
    });

    // Apply tags to SQS queues
    [eventDlq, eventQueue].forEach(queue => {
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(queue).add(key, value);
      });
    });

    // Create X-Ray sampling rule for enhanced tracing
    const xraySamplingRule = new xray.CfnSamplingRule(
      this,
      'srvrless-xray-sampling',
      {
        samplingRule: {
          ruleName: `srvrless-sampling-rule-${environmentSuffix}`,
          priority: 9000,
          fixedRate: 0.1,
          reservoirSize: 1,
          serviceName: 'srvrless-api',
          serviceType: '*',
          host: '*',
          httpMethod: '*',
          urlPath: '*',
          version: 1,
          resourceArn: '*',
        },
      }
    );

    // Apply tags to X-Ray sampling rule
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(xraySamplingRule).add(key, value);
    });

    // Create IAM role for Lambda functions with least privilege
    const lambdaRole = new iam.Role(this, 'srvrless-lambda-role', {
      roleName: `srvrless-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Add DynamoDB permissions to Lambda role
    table.grantReadWriteData(lambdaRole);

    // Add EventBridge permissions to Lambda role
    eventBus.grantPutEventsTo(lambdaRole);

    // Add SQS permissions to Lambda role
    eventQueue.grantConsumeMessages(lambdaRole);
    eventDlq.grantConsumeMessages(lambdaRole);

    // Add X-Ray permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
        ],
        resources: ['*'],
      })
    );

    // Create VPC Endpoint for DynamoDB
    vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // Create security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'srvrless-lambda-sg',
      {
        securityGroupName: `srvrless-lambda-sg-${environmentSuffix}`,
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Create CloudWatch Log Groups for Lambda functions
    const createLogGroup = new logs.LogGroup(this, 'create-function-logs', {
      logGroupName: `/aws/lambda/srvrless-create-item-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const readLogGroup = new logs.LogGroup(this, 'read-function-logs', {
      logGroupName: `/aws/lambda/srvrless-read-item-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const updateLogGroup = new logs.LogGroup(this, 'update-function-logs', {
      logGroupName: `/aws/lambda/srvrless-update-item-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const deleteLogGroup = new logs.LogGroup(this, 'delete-function-logs', {
      logGroupName: `/aws/lambda/srvrless-delete-item-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const eventProcessorLogGroup = new logs.LogGroup(
      this,
      'event-processor-logs',
      {
        logGroupName: `/aws/lambda/srvrless-event-processor-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create Lambda function for CREATE operation
    const createFunction = new lambda.Function(
      this,
      'srvrless-create-function',
      {
        functionName: `srvrless-create-item-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          //_X_AMZN_TRACE_ID: 'Root=1-5e1b4151-5ac6c58b5fcf0c2946f5e4d2',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: createLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          const segment = AWSXRay.getSegment();
          const subsegment = segment.addNewSubsegment('CreateItemHandler');

          try {
            subsegment.addAnnotation('operation', 'create');
            subsegment.addMetadata('requestId', event.requestContext?.requestId);

            const body = JSON.parse(event.body);
            const item = {
              id: body.id || require('crypto').randomUUID(),
              ...body,
              createdAt: new Date().toISOString()
            };

            subsegment.addMetadata('itemId', item.id);

            const putSubsegment = subsegment.addNewSubsegment('DynamoDB-Put');
            try {
              await dynamodb.put({
                TableName: process.env.TABLE_NAME,
                Item: item
              }).promise();
              putSubsegment.close();
            } catch (error) {
              putSubsegment.addError(error);
              putSubsegment.close();
              throw error;
            }

            // Publish event to EventBridge
            const eventSubsegment = subsegment.addNewSubsegment('EventBridge-PutEvents');
            try {
              await eventbridge.putEvents({
                Entries: [{
                  Source: 'srvrless.api',
                  DetailType: 'Item Created',
                  Detail: JSON.stringify({ item }),
                  EventBusName: process.env.EVENT_BUS_NAME
                }]
              }).promise();
              eventSubsegment.close();
            } catch (error) {
              eventSubsegment.addError(error);
              eventSubsegment.close();
              // Don't fail the request if event publishing fails
              console.error('Failed to publish event:', error);
            }

            subsegment.close();
            return {
              statusCode: 201,
              headers: {
                'Content-Type': 'application/json',
                'X-Trace-Id': process.env._X_AMZN_TRACE_ID
              },
              body: JSON.stringify({ message: 'Item created successfully', item })
            };
          } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      }
    );

    // Create Lambda function for READ operation
    const readFunction = new lambda.Function(this, 'srvrless-read-function', {
      functionName: `srvrless-read-item-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        TABLE_NAME: table.tableName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: readLogGroup,
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());

        exports.handler = async (event) => {
          const segment = AWSXRay.getSegment();
          const subsegment = segment.addNewSubsegment('ReadItemHandler');

          try {
            subsegment.addAnnotation('operation', 'read');
            subsegment.addMetadata('requestId', event.requestContext?.requestId);

            const id = event.pathParameters?.id;

            if (id) {
              subsegment.addMetadata('itemId', id);
              const getSubsegment = subsegment.addNewSubsegment('DynamoDB-Get');

              try {
                const result = await dynamodb.get({
                  TableName: process.env.TABLE_NAME,
                  Key: { id }
                }).promise();
                getSubsegment.close();

                if (!result.Item) {
                  subsegment.close();
                  return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Item not found' })
                  };
                }

                subsegment.close();
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.Item)
                };
              } catch (error) {
                getSubsegment.addError(error);
                getSubsegment.close();
                throw error;
              }
            } else {
              const scanSubsegment = subsegment.addNewSubsegment('DynamoDB-Scan');

              try {
                const result = await dynamodb.scan({
                  TableName: process.env.TABLE_NAME
                }).promise();
                scanSubsegment.close();
                subsegment.close();

                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.Items)
                };
              } catch (error) {
                scanSubsegment.addError(error);
                scanSubsegment.close();
                throw error;
              }
            }
          } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
    });

    // Create Lambda function for UPDATE operation
    const updateFunction = new lambda.Function(
      this,
      'srvrless-update-function',
      {
        functionName: `srvrless-update-item-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: updateLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          const segment = AWSXRay.getSegment();
          const subsegment = segment.addNewSubsegment('UpdateItemHandler');

          try {
            subsegment.addAnnotation('operation', 'update');
            subsegment.addMetadata('requestId', event.requestContext?.requestId);

            const id = event.pathParameters.id;
            const body = JSON.parse(event.body);

            subsegment.addMetadata('itemId', id);

            const updateSubsegment = subsegment.addNewSubsegment('DynamoDB-Update');
            let result;
            try {
              result = await dynamodb.update({
                TableName: process.env.TABLE_NAME,
                Key: { id },
                UpdateExpression: 'SET #data = :data, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                  '#data': 'data'
                },
                ExpressionAttributeValues: {
                  ':data': body,
                  ':updatedAt': new Date().toISOString()
                },
                ReturnValues: 'ALL_NEW'
              }).promise();
              updateSubsegment.close();
            } catch (error) {
              updateSubsegment.addError(error);
              updateSubsegment.close();
              throw error;
            }

            // Publish event to EventBridge
            const eventSubsegment = subsegment.addNewSubsegment('EventBridge-PutEvents');
            try {
              await eventbridge.putEvents({
                Entries: [{
                  Source: 'srvrless.api',
                  DetailType: 'Item Updated',
                  Detail: JSON.stringify({ id, item: result.Attributes }),
                  EventBusName: process.env.EVENT_BUS_NAME
                }]
              }).promise();
              eventSubsegment.close();
            } catch (error) {
              eventSubsegment.addError(error);
              eventSubsegment.close();
              console.error('Failed to publish event:', error);
            }

            subsegment.close();
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Item updated successfully', item: result.Attributes })
            };
          } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      }
    );

    // Create Lambda function for DELETE operation
    const deleteFunction = new lambda.Function(
      this,
      'srvrless-delete-function',
      {
        functionName: `srvrless-delete-item-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: deleteLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          const segment = AWSXRay.getSegment();
          const subsegment = segment.addNewSubsegment('DeleteItemHandler');

          try {
            subsegment.addAnnotation('operation', 'delete');
            subsegment.addMetadata('requestId', event.requestContext?.requestId);

            const id = event.pathParameters.id;
            subsegment.addMetadata('itemId', id);

            const deleteSubsegment = subsegment.addNewSubsegment('DynamoDB-Delete');
            try {
              await dynamodb.delete({
                TableName: process.env.TABLE_NAME,
                Key: { id }
              }).promise();
              deleteSubsegment.close();
            } catch (error) {
              deleteSubsegment.addError(error);
              deleteSubsegment.close();
              throw error;
            }

            // Publish event to EventBridge
            const eventSubsegment = subsegment.addNewSubsegment('EventBridge-PutEvents');
            try {
              await eventbridge.putEvents({
                Entries: [{
                  Source: 'srvrless.api',
                  DetailType: 'Item Deleted',
                  Detail: JSON.stringify({ id }),
                  EventBusName: process.env.EVENT_BUS_NAME
                }]
              }).promise();
              eventSubsegment.close();
            } catch (error) {
              eventSubsegment.addError(error);
              eventSubsegment.close();
              console.error('Failed to publish event:', error);
            }

            subsegment.close();
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Item deleted successfully' })
            };
          } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      }
    );

    // Apply tags to Lambda functions
    [createFunction, readFunction, updateFunction, deleteFunction].forEach(
      func => {
        Object.entries(commonTags).forEach(([key, value]) => {
          cdk.Tags.of(func).add(key, value);
        });
      }
    );

    // Create event processor Lambda for demonstrating EventBridge functionality
    const eventProcessorFunction = new lambda.Function(
      this,
      'srvrless-event-processor',
      {
        functionName: `srvrless-event-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: eventProcessorLogGroup,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWSXRay = require('aws-xray-sdk-core');

        exports.handler = async (event) => {
          const segment = AWSXRay.getSegment();
          const subsegment = segment.addNewSubsegment('EventProcessor');

          try {
            subsegment.addAnnotation('eventSource', 'sqs');
            console.log('Event received:', JSON.stringify(event, null, 2));

            for (const record of event.Records) {
              const eventDetail = JSON.parse(record.body);
              console.log('Processing event:', eventDetail['detail-type']);
              console.log('Event source:', eventDetail.source);
              console.log('Event details:', eventDetail.detail);

              subsegment.addMetadata('processedEvent', {
                detailType: eventDetail['detail-type'],
                source: eventDetail.source
              });
            }

            subsegment.close();
            return { statusCode: 200, body: 'Events processed successfully' };
          } catch (error) {
            subsegment.addError(error);
            subsegment.close();
            throw error;
          }
        };
      `),
      }
    );

    // Add SQS event source to event processor function
    eventProcessorFunction.addEventSource(
      new SqsEventSource(eventQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(10),
      })
    );

    // Apply tags to event processor function
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(eventProcessorFunction).add(key, value);
    });

    // Create EventBridge rules for different event types with SQS targets
    const createEventRule = new events.Rule(this, 'srvrless-create-rule', {
      ruleName: `srvrless-create-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Created'],
      },
      targets: [
        new targets.CloudWatchLogGroup(eventLogGroup),
        new targets.SqsQueue(eventQueue),
      ],
    });

    const updateEventRule = new events.Rule(this, 'srvrless-update-rule', {
      ruleName: `srvrless-update-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Updated'],
      },
      targets: [
        new targets.CloudWatchLogGroup(eventLogGroup),
        new targets.SqsQueue(eventQueue),
      ],
    });

    const deleteEventRule = new events.Rule(this, 'srvrless-delete-rule', {
      ruleName: `srvrless-delete-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Deleted'],
      },
      targets: [
        new targets.CloudWatchLogGroup(eventLogGroup),
        new targets.SqsQueue(eventQueue),
      ],
    });

    // Apply tags to EventBridge rules
    [createEventRule, updateEventRule, deleteEventRule].forEach(rule => {
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(rule).add(key, value);
      });
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'srvrless-api', {
      restApiName: `srvrless-rest-api-${environmentSuffix}`,
      description: 'Serverless REST API for CRUD operations',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      cloudWatchRole: true,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create API Gateway resource and methods
    const items = api.root.addResource('items');
    const item = items.addResource('{id}');

    // POST /items - Create item
    items.addMethod('POST', new apigateway.LambdaIntegration(createFunction), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // GET /items - List all items
    items.addMethod('GET', new apigateway.LambdaIntegration(readFunction), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // GET /items/{id} - Get specific item
    item.addMethod('GET', new apigateway.LambdaIntegration(readFunction), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // PUT /items/{id} - Update item
    item.addMethod('PUT', new apigateway.LambdaIntegration(updateFunction), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // DELETE /items/{id} - Delete item
    item.addMethod('DELETE', new apigateway.LambdaIntegration(deleteFunction), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Apply tags to API Gateway
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(api).add(key, value);
    });

    // Output important information
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway ID',
      exportName: `ApiId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
      exportName: `TableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CreateFunctionName', {
      value: createFunction.functionName,
      description: 'Create Lambda Function Name',
      exportName: `CreateFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReadFunctionName', {
      value: readFunction.functionName,
      description: 'Read Lambda Function Name',
      exportName: `ReadFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UpdateFunctionName', {
      value: updateFunction.functionName,
      description: 'Update Lambda Function Name',
      exportName: `UpdateFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeleteFunctionName', {
      value: deleteFunction.functionName,
      description: 'Delete Lambda Function Name',
      exportName: `DeleteFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventProcessorFunctionName', {
      value: eventProcessorFunction.functionName,
      description: 'Event Processor Lambda Function Name',
      exportName: `EventProcessorFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
      exportName: `EventBusName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: eventBus.eventBusArn,
      description: 'EventBridge Event Bus ARN',
      exportName: `EventBusArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventQueueUrl', {
      value: eventQueue.queueUrl,
      description: 'SQS Event Queue URL',
      exportName: `EventQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventDlqUrl', {
      value: eventDlq.queueUrl,
      description: 'SQS Event Dead Letter Queue URL',
      exportName: `EventDlqUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'XRaySamplingRuleName', {
      value: xraySamplingRule.ref,
      description: 'X-Ray Sampling Rule Name',
      exportName: `XRaySamplingRuleName-${environmentSuffix}`,
    });
  }
}
