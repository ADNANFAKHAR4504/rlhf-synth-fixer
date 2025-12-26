### Reasoning Trace
---

Alright, let's break down what I need to create:

1. AWS CDK code in JavaScript for a booking platform API that needs to:
   - Handle ~50k search requests daily
   - Return results quickly
   - Scale under load
   - Integrate with external systems
   - Capture analytics securely

2. Components:
   - API Gateway as the front door
   - Lambda functions for processing
   - Redis cluster in ElastiCache for caching
   - DynamoDB for persistent storage
   - CloudWatch for metrics and logs
   - X-Ray for tracing
   - EventBridge for event fanout
   - IAM roles with least privilege

3. Additional configuration:
   - VPC for Redis with proper security groups
   - Environment variables for configuration
   - Usage plans and rate limits
   - Alarms for errors and latency

4. Files to create:
   - bin/tap.mjs: Entry point for the CDK app
   - lib/tap-stack.mjs: Stack definition with all resources

Let me create these files one by one:

**bin/tap.mjs**:
This will be the entry point that creates the CDK app and instantiates our stack.

```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

**lib/tap-stack.mjs**:
This will define all the resources needed for our booking platform.

```javascript
import { Stack, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // VPC for ElastiCache Redis
    const vpc = new ec2.Vpc(this, 'BookingVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // Security Group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Allow Lambda to Redis traffic',
      allowAllOutbound: true
    });

    // Security Group for Lambda functions that need Redis access
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions with Redis access',
      allowAllOutbound: true
    });

    // Allow Lambda to connect to Redis
    redisSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Lambda to Redis'
    );

    // ElastiCache Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    // ElastiCache Redis Cluster
    const redisCluster = new elasticache.CfnCacheCluster(this, 'BookingRedis', {
      cacheNodeType: 'cache.t3.small',
      engine: 'redis',
      numCacheNodes: 1,
      automaticFailoverEnabled: false,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      clusterName: 'booking-cache'
    });

    // DynamoDB Table
    const bookingTable = new dynamodb.Table(this, 'BookingTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // Add a GSI for efficient searches by other attributes if needed
    bookingTable.addGlobalSecondaryIndex({
      indexName: 'searchIndex',
      partitionKey: { name: 'searchKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    // Lambda Role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add permissions to Lambda execution role
    bookingTable.grantReadWriteData(lambdaExecutionRole);
    
    // EventBridge role for publishing events
    const eventBridgeRole = new iam.Role(this, 'EventBridgeRole', {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com')
    });

    // Lambda function for search
    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/search'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
        CACHE_TTL: '300' // 5 minutes in seconds
      }
    });

    // Lambda function for booking
    const bookingFunction = new lambda.Function(this, 'BookingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/booking'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort
      }
    });

    // API Gateway with X-Ray tracing
    const api = new apigw.RestApi(this, 'BookingApi', {
      description: 'Booking Platform API',
      deployOptions: {
        tracingEnabled: true, // X-Ray tracing
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS
      }
    });

    // Usage plan with rate limits
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

    // API Key
    const apiKey = api.addApiKey('ApiKey');
    usagePlan.addApiKey(apiKey);

    // Search resource and method
    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigw.LambdaIntegration(searchFunction), {
      apiKeyRequired: true
    });

    // Booking resource and method
    const bookingResource = api.root.addResource('booking');
    bookingResource.addMethod('POST', new apigw.LambdaIntegration(bookingFunction), {
      apiKeyRequired: true
    });

    // EventBridge event bus
    const eventBus = new events.EventBus(this, 'BookingEventBus', {
      eventBusName: 'booking-platform-events'
    });

    // Grant Lambda permissions to publish events
    eventBus.grantPutEventsTo(searchFunction);
    eventBus.grantPutEventsTo(bookingFunction);

    // Example rule for 'search.completed' event
    const searchCompletedRule = new events.Rule(this, 'SearchCompletedRule', {
      eventBus,
      description: 'Rule that captures completed search events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['search.completed']
      }
    });

    // Example rule for 'booking.requested' event
    const bookingRequestedRule = new events.Rule(this, 'BookingRequestedRule', {
      eventBus,
      description: 'Rule that captures booking request events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['booking.requested']
      }
    });

    // CloudWatch Alarms

    // API Gateway 4xx errors
    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 4xx errors'
    });

    // API Gateway 5xx errors
    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 5xx errors'
    });

    // API Gateway latency
    new cloudwatch.Alarm(this, 'ApiGatewayLatencyAlarm', {
      metric: api.metricLatency(),
      threshold: 1000, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has high latency'
    });

    // Lambda errors
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

    // Custom metric for Lambda to publish cache hit/miss
    // This is done in the Lambda code, but we create a CloudWatch dashboard to view it
    const dashboard = new cloudwatch.Dashboard(this, 'BookingPlatformDashboard', {
      dashboardName: 'BookingPlatform'
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
          })
        ]
      })
    );

    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID (retrieve value from AWS Console or CLI)'
    });

    new CfnOutput(this, 'TableName', {
      value: bookingTable.tableName,
      description: 'DynamoDB Table Name'
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis Endpoint Address'
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name'
    });

    new CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name'
    });
  }
}
```

Actually, I see a couple of issues with the code above that need to be fixed:

1. For the ElastiCache Redis cluster, we're using CfnCacheCluster which doesn't support automaticFailoverEnabled directly as I wrote it. Let me update that to use a proper Redis replication group.

2. Let me also ensure we're correctly using EventBridge for the fanout events.

Let me fix these issues and provide the complete and corrected code:

**bin/tap.mjs**:
```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

**lib/tap-stack.mjs**:
```javascript
import { Stack, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // VPC for ElastiCache Redis
    const vpc = new ec2.Vpc(this, 'BookingVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // Security Group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Allow Lambda to Redis traffic',
      allowAllOutbound: true
    });

    // Security Group for Lambda functions that need Redis access
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions with Redis access',
      allowAllOutbound: true
    });

    // Allow Lambda to connect to Redis
    redisSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Lambda to Redis'
    );

    // ElastiCache Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    // ElastiCache Redis Replication Group
    const redisReplicationGroup = new elasticache.CfnReplicationGroup(this, 'BookingRedis', {
      replicationGroupDescription: 'Redis cluster for booking platform',
      cacheNodeType: 'cache.t3.small',
      engine: 'redis',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      automaticFailoverEnabled: true,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true
    });

    // DynamoDB Table
    const bookingTable = new dynamodb.Table(this, 'BookingTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // Add a GSI for efficient searches by other attributes
    bookingTable.addGlobalSecondaryIndex({
      indexName: 'searchIndex',
      partitionKey: { name: 'searchKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    // Lambda Role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add permissions to Lambda execution role
    bookingTable.grantReadWriteData(lambdaExecutionRole);
    
    // EventBridge event bus
    const eventBus = new events.EventBus(this, 'BookingEventBus', {
      eventBusName: 'booking-platform-events'
    });

    // Grant Lambda permission to publish events to EventBridge
    eventBus.grantPutEventsTo(lambdaExecutionRole);

    // Lambda function for search
    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/search'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName,
        CACHE_TTL: '300' // 5 minutes in seconds
      }
    });

    // Lambda function for booking
    const bookingFunction = new lambda.Function(this, 'BookingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/booking'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName
      }
    });

    // API Gateway with X-Ray tracing
    const api = new apigw.RestApi(this, 'BookingApi', {
      description: 'Booking Platform API',
      deployOptions: {
        tracingEnabled: true, // X-Ray tracing
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS
      }
    });

    // Usage plan with rate limits
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

    // API Key
    const apiKey = api.addApiKey('ApiKey');
    usagePlan.addApiKey(apiKey);

    // Search resource and method
    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigw.LambdaIntegration(searchFunction), {
      apiKeyRequired: true
    });

    // Booking resource and method
    const bookingResource = api.root.addResource('booking');
    bookingResource.addMethod('POST', new apigw.LambdaIntegration(bookingFunction), {
      apiKeyRequired: true
    });

    // Example rule for 'search.completed' event
    const searchCompletedRule = new events.Rule(this, 'SearchCompletedRule', {
      eventBus,
      description: 'Rule that captures completed search events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['search.completed']
      }
    });

    // Example rule for 'booking.requested' event
    const bookingRequestedRule = new events.Rule(this, 'BookingRequestedRule', {
      eventBus,
      description: 'Rule that captures booking request events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['booking.requested']
      }
    });

    // External target for events (would typically be an SQS queue, Lambda, etc.)
    // Placeholder for demonstration - would be replaced with actual targets
    const externalSystemRole = new iam.Role(this, 'ExternalSystemRole', {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com')
    });

    // CloudWatch Alarms

    // API Gateway 4xx errors
    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 4xx errors'
    });

    // API Gateway 5xx errors
    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has a high rate of 5xx errors'
    });

    // API Gateway latency
    new cloudwatch.Alarm(this, 'ApiGatewayLatencyAlarm', {
      metric: api.metricLatency(),
      threshold: 1000, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway has high latency'
    });

    // Lambda errors
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

    // Custom metric for Lambda to publish cache hit/miss
    // This is done in the Lambda code, but we create a CloudWatch dashboard to view it
    const dashboard = new cloudwatch.Dashboard(this, 'BookingPlatformDashboard', {
      dashboardName: 'BookingPlatform'
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

    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID (retrieve value from AWS Console or CLI)'
    });

    new CfnOutput(this, 'TableName', {
      value: bookingTable.tableName,
      description: 'DynamoDB Table Name'
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'Redis Endpoint Address'
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name'
    });

    new CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name'
    });
  }
}
```

I've made the following improvements:

1. Replaced CfnCacheCluster with CfnReplicationGroup for ElastiCache to properly support replication and automatic failover
2. Added encryption at rest and in transit for the Redis cluster
3. Added proper EventBus name to Lambda environment variables
4. Fixed the attributes for Redis endpoint access from the replication group
5. Improved the dashboard with more relevant metrics

Let me make one more check to ensure this code fulfills the requirements:

- API Gateway as front door 
- Lambda functions for request processing  
- Redis cluster in ElastiCache for caching 
- VPC and security groups for Redis 
- DynamoDB with on-demand capacity and encryption 
- CloudWatch metrics and logs 
- X-Ray tracing on API Gateway and Lambda 
- Custom metrics for cache hit/miss and latency 
- EventBridge for event fanout 
- IAM policies with least-privilege 
- Environment variables for configuration 
- Usage plans and rate limits 
- Alarms on errors and latency 

Looks good! The code is complete and should satisfy all the requirements. I'll present the final version without comments as requested.

One final adjustment: I noticed I should make sure all Lambda functions can publish to CloudWatch for custom metrics. Let me double-check that the policies allow this.

The AWSLambdaBasicExecutionRole policy should provide permissions to write logs to CloudWatch Logs, but I should ensure we have permissions for publishing custom metrics. Let me add that to the final version:

**bin/tap.mjs** (unchanged):
```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

**lib/tap-stack.mjs** (final version):
```javascript
import { Stack, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'BookingVpc', {
      maxAzs: 2,
      natGateways: 1
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

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    const redisReplicationGroup = new elasticache.CfnReplicationGroup(this, 'BookingRedis', {
      replicationGroupDescription: 'Redis cluster for booking platform',
      cacheNodeType: 'cache.t3.small',
      engine: 'redis',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      automaticFailoverEnabled: true,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true
    });

    const bookingTable = new dynamodb.Table(this, 'BookingTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
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
      eventBusName: 'booking-platform-events'
    });

    eventBus.grantPutEventsTo(lambdaExecutionRole);

    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/search'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName,
        CACHE_TTL: '300'
      }
    });

    const bookingFunction = new lambda.Function(this, 'BookingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/booking'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName
      }
    });

    const api = new apigw.RestApi(this, 'BookingApi', {
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

    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigw.LambdaIntegration(searchFunction), {
      apiKeyRequired: true
    });

    const bookingResource = api.root.addResource('booking');
    bookingResource.addMethod('POST', new apigw.LambdaIntegration(bookingFunction), {
      apiKeyRequired: true
    });

    const searchCompletedRule = new events.Rule(this, 'SearchCompletedRule', {
      eventBus,
      description: 'Rule that captures completed search events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['search.completed']
      }
    });

    const bookingRequestedRule = new events.Rule(this, 'BookingRequestedRule', {
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
      dashboardName: 'BookingPlatform'
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
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID (retrieve value from AWS Console or CLI)'
    });

    new CfnOutput(this, 'TableName', {
      value: bookingTable.tableName,
      description: 'DynamoDB Table Name'
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'Redis Endpoint Address'
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name'
    });

    new CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name'
    });
  }
}
```

The major improvement here is that I added a specific IAM policy statement for CloudWatch PutMetricData so the Lambda functions can publish custom metrics.

Now the final code is ready without comments.
### Answer 
---

```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

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
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'BookingVpc', {
      maxAzs: 2,
      natGateways: 1
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

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
    });

    const redisReplicationGroup = new elasticache.CfnReplicationGroup(this, 'BookingRedis', {
      replicationGroupDescription: 'Redis cluster for booking platform',
      cacheNodeType: 'cache.t3.small',
      engine: 'redis',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      automaticFailoverEnabled: true,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true
    });

    const bookingTable = new dynamodb.Table(this, 'BookingTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
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
      eventBusName: 'booking-platform-events'
    });

    eventBus.grantPutEventsTo(lambdaExecutionRole);

    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/search'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName,
        CACHE_TTL: '300'
      }
    });

    const bookingFunction = new lambda.Function(this, 'BookingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/booking'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      securityGroups: [lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        BOOKING_TABLE: bookingTable.tableName,
        REDIS_ENDPOINT: redisReplicationGroup.attrPrimaryEndPointAddress,
        REDIS_PORT: redisReplicationGroup.attrPrimaryEndPointPort,
        EVENT_BUS_NAME: eventBus.eventBusName
      }
    });

    const api = new apigw.RestApi(this, 'BookingApi', {
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

    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigw.LambdaIntegration(searchFunction), {
      apiKeyRequired: true
    });

    const bookingResource = api.root.addResource('booking');
    bookingResource.addMethod('POST', new apigw.LambdaIntegration(bookingFunction), {
      apiKeyRequired: true
    });

    const searchCompletedRule = new events.Rule(this, 'SearchCompletedRule', {
      eventBus,
      description: 'Rule that captures completed search events',
      eventPattern: {
        source: ['booking.platform'],
        detailType: ['search.completed']
      }
    });

    const bookingRequestedRule = new events.Rule(this, 'BookingRequestedRule', {
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
      dashboardName: 'BookingPlatform'
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
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID (retrieve value from AWS Console or CLI)'
    });

    new CfnOutput(this, 'TableName', {
      value: bookingTable.tableName,
      description: 'DynamoDB Table Name'
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'Redis Endpoint Address'
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name'
    });

    new CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name'
    });
  }
}
```