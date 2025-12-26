import { Stack, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Check if running in LocalStack
    const isLocalStack = process.env.CDK_LOCAL === 'true' || 
                         process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.LOCALSTACK_HOSTNAME !== undefined;

    const environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // NAT Gateways have known issues in LocalStack (AllocationID handling problems)
    // So we disable them when running in LocalStack environment
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

    // ElastiCache is not enabled in LocalStack CI environment
    // Only create Redis resources when not running in LocalStack
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
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false }
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

    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    new apigw.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn
    });

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
  }
}
