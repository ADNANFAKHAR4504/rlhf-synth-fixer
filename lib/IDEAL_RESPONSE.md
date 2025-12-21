bin/tap.mjs

```javascript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

lib/tap-stack.mjs

```javascript
import { Stack, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';

class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const isLocalStack = process.env.CDK_LOCAL === 'true' ||
                         process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.LOCALSTACK_HOSTNAME !== undefined;

    const environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

    const vpc = new ec2.Vpc(this, 'BookingVpc', {
      maxAzs: 2,
      natGateways: isLocalStack ? 0 : 1,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Allow Lambda to Redis traffic',
      allowAllOutbound: true
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions with Redis access',
      allowAllOutbound: true
    });

    redisSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Lambda to Redis'
    );

    let redisEndpoint = 'localhost';
    let redisPort = '6379';

    if (!isLocalStack) {
      const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
        description: 'Subnet group for Redis cluster',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
      });

      const redisCluster = new elasticache.CfnCacheCluster(this, 'BookingRedis', {
        cacheNodeType: 'cache.t3.micro',
        engine: 'redis',
        numCacheNodes: 1,
        cacheSubnetGroupName: redisSubnetGroup.ref,
        vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId]
      });

      redisEndpoint = redisCluster.attrRedisEndpointAddress;
      redisPort = redisCluster.attrRedisEndpointPort;
    }

    const bookingTable = new dynamodb.Table(this, 'BookingTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false
    });

    bookingTable.addGlobalSecondaryIndex({
      indexName: 'searchIndex',
      partitionKey: { name: 'searchKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*']
    }));

    bookingTable.grantReadWriteData(lambdaExecutionRole);

    const eventBus = new events.EventBus(this, 'BookingEventBus', {
      eventBusName: `booking-platform-events-${environmentSuffix}`
    });

    eventBus.grantPutEventsTo(lambdaExecutionRole);

    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/search.zip'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisEndpoint,
        REDIS_PORT: redisPort,
        EVENT_BUS_NAME: eventBus.eventBusName,
        CACHE_TTL: '300'
      }
    });

    const bookingFunction = new lambda.Function(this, 'BookingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/booking.zip'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisEndpoint,
        REDIS_PORT: redisPort,
        EVENT_BUS_NAME: eventBus.eventBusName
      }
    });

    const api = new apigw.RestApi(this, 'BookingApi', {
      restApiName: `BookingApi-${environmentSuffix}`,
      description: 'Booking Platform API',
      deployOptions: {
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS
      }
    });

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: 'Standard',
      throttle: {
        rateLimit: 100,
        burstLimit: 200
      },
      quota: {
        limit: 50000,
        period: apigw.Period.DAY
      }
    });

    const apiKey = api.addApiKey('ApiKey');
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({ stage: api.deploymentStage });

    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigw.LambdaIntegration(searchFunction), {
      apiKeyRequired: true
    });

    const bookingResource = api.root.addResource('booking');
    bookingResource.addMethod('POST', new apigw.LambdaIntegration(bookingFunction), {
      apiKeyRequired: true
    });

    new events.Rule(this, 'SearchCompletedRule', {
      eventBus,
      description: 'Rule that captures completed search events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['search.completed']
      }
    });

    new events.Rule(this, 'BookingRequestedRule', {
      eventBus,
      description: 'Rule that captures booking request events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['booking.requested']
      }
    });

    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 4xx errors'
    });

    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 5xx errors'
    });

    new cloudwatch.Alarm(this, 'ApiGatewayLatencyAlarm', {
      metric: api.metricLatency(),
      threshold: 1000,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has high latency'
    });

    new cloudwatch.Alarm(this, 'SearchFunctionErrorsAlarm', {
      metric: searchFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Search Lambda function has a high error rate'
    });

    new cloudwatch.Alarm(this, 'BookingFunctionErrorsAlarm', {
      metric: bookingFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Booking Lambda function has a high error rate'
    });

    const dashboard = new cloudwatch.Dashboard(this, 'BookingPlatformDashboard', {
      dashboardName: `BookingPlatform-${environmentSuffix}`
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway',
        left: [
          api.metricCount(),
          api.metricLatency(),
          api.metricClientError(),
          api.metricServerError()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Functions',
        left: [
          searchFunction.metricInvocations(),
          searchFunction.metricDuration(),
          searchFunction.metricErrors(),
          bookingFunction.metricInvocations(),
          bookingFunction.metricDuration(),
          bookingFunction.metricErrors()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Cache Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'BookingPlatform',
            metricName: 'CacheHit',
            statistic: 'Sum',
            period: Duration.minutes(1)
          }),
          new cloudwatch.Metric({
            namespace: 'BookingPlatform',
            metricName: 'CacheMiss',
            statistic: 'Sum',
            period: Duration.minutes(1)
          }),
          new cloudwatch.Metric({
            namespace: 'BookingPlatform',
            metricName: 'Latency',
            statistic: 'Average',
            period: Duration.minutes(1)
          })
        ]
      })
    );

    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${id}-ApiEndpoint`
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `${id}-ApiKeyId`
    });

    new CfnOutput(this, 'TableName', {
      value: bookingTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `${id}-TableName`
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisEndpoint,
      description: 'Redis Endpoint Address',
      exportName: `${id}-RedisEndpoint`
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
      exportName: `${id}-EventBusName`
    });

    new CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `${id}-DashboardName`
    });
  }
}

export { TapStack };
```

lib/lambda/search/index.js

```javascript
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { createClient } = require('redis');

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});
const cloudwatch = new CloudWatchClient({});

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_ENDPOINT,
        port: parseInt(process.env.REDIS_PORT)
      }
    });
    await redisClient.connect();
  }
  return redisClient;
}

exports.handler = async (event) => {
  const startTime = Date.now();
  try {
    const queryParams = event.queryStringParameters || {};
    const searchKey = queryParams.searchKey || 'default';
    const cacheKey = `search:${searchKey}`;

    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: 'BookingPlatform',
        MetricData: [{ MetricName: 'CacheHit', Value: 1, Unit: 'Count' }]
      }));

      await eventbridge.send(new PutEventsCommand({
        Entries: [{
          Source: 'booking.platform',
          DetailType: 'search.completed',
          Detail: JSON.stringify({ searchKey, cached: true }),
          EventBusName: process.env.EVENT_BUS_NAME
        }]
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: JSON.parse(cached), cached: true })
      };
    }

    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'CacheMiss', Value: 1, Unit: 'Count' }]
    }));

    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.BOOKING_TABLE,
      IndexName: 'searchIndex',
      KeyConditionExpression: 'searchKey = :sk',
      ExpressionAttributeValues: { ':sk': { S: searchKey } },
      Limit: 50
    }));

    const rawItems = result.Items || [];
    const results = rawItems.map(item => unmarshall(item));
    await redis.setEx(cacheKey, parseInt(process.env.CACHE_TTL), JSON.stringify(results));

    const latency = Date.now() - startTime;
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'Latency', Value: latency, Unit: 'Milliseconds' }]
    }));

    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'booking.platform',
        DetailType: 'search.completed',
        Detail: JSON.stringify({ searchKey, cached: false, count: results.length }),
        EventBusName: process.env.EVENT_BUS_NAME
      }]
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results, cached: false })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

lib/lambda/booking/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { createClient } = require('redis');

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});
const cloudwatch = new CloudWatchClient({});

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_ENDPOINT,
        port: parseInt(process.env.REDIS_PORT)
      }
    });
    await redisClient.connect();
  }
  return redisClient;
}

exports.handler = async (event) => {
  const startTime = Date.now();
  try {
    const body = JSON.parse(event.body || '{}');
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();

    const item = {
      id: { S: bookingId },
      searchKey: { S: body.searchKey || 'default' },
      timestamp: { N: timestamp.toString() },
      data: { S: JSON.stringify(body) }
    };

    await dynamodb.send(new PutItemCommand({
      TableName: process.env.BOOKING_TABLE,
      Item: item
    }));

    const redis = await getRedisClient();
    const cacheKey = `search:${body.searchKey || 'default'}`;
    await redis.del(cacheKey);

    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'booking.platform',
        DetailType: 'booking.requested',
        Detail: JSON.stringify({ bookingId, searchKey: body.searchKey }),
        EventBusName: process.env.EVENT_BUS_NAME
      }]
    }));

    const latency = Date.now() - startTime;
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'Latency', Value: latency, Unit: 'Milliseconds' }]
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, message: 'Booking created successfully' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```