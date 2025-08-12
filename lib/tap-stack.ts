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
      cidr: '10.0.0.0/16',
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
      pointInTimeRecovery: true,
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

    // Add X-Ray permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
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
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          try {
            const body = JSON.parse(event.body);
            const item = {
              id: body.id || require('crypto').randomUUID(),
              ...body,
              createdAt: new Date().toISOString()
            };

            await dynamodb.put({
              TableName: process.env.TABLE_NAME,
              Item: item
            }).promise();

            // Publish event to EventBridge
            await eventbridge.putEvents({
              Entries: [{
                Source: 'srvrless.api',
                DetailType: 'Item Created',
                Detail: JSON.stringify({ item }),
                EventBusName: process.env.EVENT_BUS_NAME
              }]
            }).promise();

            return {
              statusCode: 201,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Item created successfully', item })
            };
          } catch (error) {
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
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());

        exports.handler = async (event) => {
          try {
            const id = event.pathParameters?.id;
            
            if (id) {
              const result = await dynamodb.get({
                TableName: process.env.TABLE_NAME,
                Key: { id }
              }).promise();

              if (!result.Item) {
                return {
                  statusCode: 404,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'Item not found' })
                };
              }

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.Item)
              };
            } else {
              const result = await dynamodb.scan({
                TableName: process.env.TABLE_NAME
              }).promise();

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.Items)
              };
            }
          } catch (error) {
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
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          try {
            const id = event.pathParameters.id;
            const body = JSON.parse(event.body);

            const result = await dynamodb.update({
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

            // Publish event to EventBridge
            await eventbridge.putEvents({
              Entries: [{
                Source: 'srvrless.api',
                DetailType: 'Item Updated',
                Detail: JSON.stringify({ id, item: result.Attributes }),
                EventBusName: process.env.EVENT_BUS_NAME
              }]
            }).promise();

            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Item updated successfully', item: result.Attributes })
            };
          } catch (error) {
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
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());
        const eventbridge = AWSXRay.captureAWSClient(new AWS.EventBridge());

        exports.handler = async (event) => {
          try {
            const id = event.pathParameters.id;

            await dynamodb.delete({
              TableName: process.env.TABLE_NAME,
              Key: { id }
            }).promise();

            // Publish event to EventBridge
            await eventbridge.putEvents({
              Entries: [{
                Source: 'srvrless.api',
                DetailType: 'Item Deleted',
                Detail: JSON.stringify({ id }),
                EventBusName: process.env.EVENT_BUS_NAME
              }]
            }).promise();

            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Item deleted successfully' })
            };
          } catch (error) {
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
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
        const AWSXRay = require('aws-xray-sdk-core');

        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            const eventDetail = JSON.parse(record.body);
            console.log('Processing event:', eventDetail['detail-type']);
            console.log('Event source:', eventDetail.source);
            console.log('Event details:', eventDetail.detail);
          }
          
          return { statusCode: 200, body: 'Events processed successfully' };
        };
      `),
      }
    );

    // Apply tags to event processor function
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(eventProcessorFunction).add(key, value);
    });

    // Create EventBridge rules for different event types
    const createEventRule = new events.Rule(this, 'srvrless-create-rule', {
      ruleName: `srvrless-create-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Created'],
      },
      targets: [new targets.CloudWatchLogGroup(eventLogGroup)],
    });

    const updateEventRule = new events.Rule(this, 'srvrless-update-rule', {
      ruleName: `srvrless-update-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Updated'],
      },
      targets: [new targets.CloudWatchLogGroup(eventLogGroup)],
    });

    const deleteEventRule = new events.Rule(this, 'srvrless-delete-rule', {
      ruleName: `srvrless-delete-rule-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['srvrless.api'],
        detailType: ['Item Deleted'],
      },
      targets: [new targets.CloudWatchLogGroup(eventLogGroup)],
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

    new cdk.CfnOutput(this, 'XRaySamplingRuleName', {
      value: xraySamplingRule.ref,
      description: 'X-Ray Sampling Rule Name',
      exportName: `XRaySamplingRuleName-${environmentSuffix}`,
    });
  }
}
