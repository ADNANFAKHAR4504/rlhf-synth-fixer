# IDEAL RESPONSE: Customer Portal Infrastructure

This is the production-ready implementation that fully satisfies all 8 requirements with proper AWS best practices, security, and cost optimization.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // ===== 1. NETWORK FOUNDATION =====
    const vpc = new ec2.Vpc(this, 'CustomerPortalVpc', {
      vpcName: `customer-portal-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGatewayProvider: ec2.NatProvider.instance({
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      }),
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ===== 2. CONTAINER PLATFORM =====
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `customer-portal-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });

    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `ecs-task-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const frontendTaskDefinition = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      family: `frontend-task-${environmentSuffix}`,
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
    });

    frontendTaskDefinition.addContainer('FrontendContainer', {
      containerName: 'frontend',
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'frontend',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
    });

    const backendTaskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      family: `backend-task-${environmentSuffix}`,
      memoryLimitMiB: 1024,
      cpu: 512,
      executionRole: taskExecutionRole,
    });

    backendTaskDefinition.addContainer('BackendContainer', {
      containerName: 'backend',
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:18-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      environment: {
        ENVIRONMENT: environmentSuffix,
        NODE_ENV: 'production',
      },
      command: ['node', '-e', 'const http = require("http"); http.createServer((req,res)=>res.end("OK")).listen(3000)'],
    });

    // ===== 3. LOAD BALANCING AND ROUTING =====
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      loadBalancerName: `customer-portal-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: `alb-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    alb.addSecurityGroup(albSecurityGroup);

    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    const frontendServiceSg = new ec2.SecurityGroup(this, 'FrontendServiceSg', {
      securityGroupName: `frontend-service-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for frontend ECS service',
      allowAllOutbound: true,
    });

    frontendServiceSg.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const backendServiceSg = new ec2.SecurityGroup(this, 'BackendServiceSg', {
      securityGroupName: `backend-service-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for backend ECS service',
      allowAllOutbound: true,
    });

    backendServiceSg.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      serviceName: `frontend-service-${environmentSuffix}`,
      cluster,
      taskDefinition: frontendTaskDefinition,
      desiredCount: 2,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [frontendServiceSg],
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
          base: 1,
        },
      ],
      circuitBreaker: { rollback: true },
    });

    const backendService = new ecs.FargateService(this, 'BackendService', {
      serviceName: `backend-service-${environmentSuffix}`,
      cluster,
      taskDefinition: backendTaskDefinition,
      desiredCount: 2,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [backendServiceSg],
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
          base: 1,
        },
      ],
      circuitBreaker: { rollback: true },
    });

    const frontendScaling = frontendService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    frontendScaling.scaleOnCpuUtilization('FrontendCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const backendScaling = backendService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    backendScaling.scaleOnCpuUtilization('BackendCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      targetGroupName: `frontend-tg-${environmentSuffix}`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    const backendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
      targetGroupName: `backend-tg-${environmentSuffix}`,
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    frontendService.attachToApplicationTargetGroup(frontendTargetGroup);
    backendService.attachToApplicationTargetGroup(backendTargetGroup);

    httpListener.addTargetGroups('BackendRule', {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      targetGroups: [backendTargetGroup],
    });

    httpListener.addTargetGroups('FrontendRule', {
      priority: 2,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      targetGroups: [frontendTargetGroup],
    });

    // ===== 4. DATABASE LAYER =====
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `customer-portal-db-secret-${environmentSuffix}`,
      description: 'Aurora PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: `database-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for Aurora PostgreSQL cluster',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      backendServiceSg,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from backend service'
    );

    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      clusterIdentifier: `customer-portal-db-${environmentSuffix}`,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: 'customerportal',
      writer: rds.ClusterInstance.provisioned('Writer', {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('Reader1', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
          publiclyAccessible: false,
        }),
        rds.ClusterInstance.provisioned('Reader2', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
          publiclyAccessible: false,
        }),
      ],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(1),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    dbSecret.grantRead(backendTaskDefinition.taskRole);

    // ===== 5. SESSION MANAGEMENT =====
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `customer-portal-sessions-${environmentSuffix}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'expiresAt',
    });

    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'ActiveSessionsIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastAccessedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    sessionsTable.grantReadWriteData(backendTaskDefinition.taskRole);

    // ===== 6. API GATEWAY INTEGRATION =====
    const vpcLink = new apigateway.VpcLink(this, 'ApiGatewayVpcLink', {
      vpcLinkName: `customer-portal-vpclink-${environmentSuffix}`,
      targets: [alb],
      description: 'VPC Link for API Gateway to ALB integration',
    });

    const api = new apigateway.RestApi(this, 'CustomerPortalApi', {
      restApiName: `customer-portal-api-${environmentSuffix}`,
      description: 'Customer Portal REST API',
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 500,
        throttlingRateLimit: 1000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `customer-portal-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 500,
      },
      quota: {
        limit: 100000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `customer-portal-key-${environmentSuffix}`,
    });

    usagePlan.addApiKey(apiKey);

    const integration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      uri: `http://${alb.loadBalancerDnsName}`,
      options: {
        vpcLink,
        connectionType: apigateway.ConnectionType.VPC_LINK,
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
    });

    const apiResource = api.root.addResource('{proxy+}');
    apiResource.addMethod('ANY', integration, {
      apiKeyRequired: false,
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // ===== 7. CONTENT DELIVERY NETWORK =====
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `customer-portal-assets-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for customer portal ${environmentSuffix}`,
    });

    staticAssetsBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      comment: `Customer Portal CDN ${environmentSuffix}`,
      defaultBehavior: {
        origin: new origins.S3Origin(staticAssetsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // ===== 8. MONITORING AND OBSERVABILITY =====
    const dashboard = new cloudwatch.Dashboard(this, 'CustomerPortalDashboard', {
      dashboardName: `customer-portal-dashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Frontend Metrics',
        left: [frontendService.metricCpuUtilization(), frontendService.metricMemoryUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Backend Metrics',
        left: [backendService.metricCpuUtilization(), backendService.metricMemoryUtilization()],
        width: 12,
      })
    );

    const dbConnections = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: {
        DBClusterIdentifier: dbCluster.clusterIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const dbCpuUtilization = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        DBClusterIdentifier: dbCluster.clusterIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [dbConnections],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [dbCpuUtilization],
        width: 12,
      })
    );

    const apiLatency = api.metricLatency({ period: cdk.Duration.minutes(5) });
    const api4xxErrors = api.metric4xxError({ period: cdk.Duration.minutes(5) });
    const api5xxErrors = api.metric5xxError({ period: cdk.Duration.minutes(5) });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [apiLatency],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        left: [api4xxErrors, api5xxErrors],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Sessions Table',
        left: [
          sessionsTable.metricConsumedReadCapacityUnits(),
          sessionsTable.metricConsumedWriteCapacityUnits(),
        ],
        width: 12,
      })
    );

    new cloudwatch.Alarm(this, 'BackendHighCpuAlarm', {
      alarmName: `backend-high-cpu-${environmentSuffix}`,
      metric: backendService.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'HighDbConnectionsAlarm', {
      alarmName: `high-db-connections-${environmentSuffix}`,
      metric: dbConnections,
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'HighApiLatencyAlarm', {
      alarmName: `high-api-latency-${environmentSuffix}`,
      metric: apiLatency,
      threshold: 1000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ===== OUTPUTS =====
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `${environmentSuffix}-api-url`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `${environmentSuffix}-cloudfront-url`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${environmentSuffix}-db-secret-arn`,
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      description: 'DynamoDB Sessions Table Name',
      exportName: `${environmentSuffix}-sessions-table`,
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucketName', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 Static Assets Bucket Name',
      exportName: `${environmentSuffix}-assets-bucket`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${environmentSuffix}-dashboard-url`,
    });
  }
}
```

## Summary

Production-ready implementation with all 8 requirements fully satisfied:

1. Network Foundation: VPC with 3 AZs, NAT instances
2. Container Platform: ECS Fargate with auto-scaling
3. Load Balancing: ALB with path-based routing
4. Database Layer: Aurora PostgreSQL with 1 writer + 2 readers
5. Session Management: DynamoDB with on-demand billing and 2 GSIs
6. API Gateway: REST API with throttling and VPC Link
7. Content Delivery: CloudFront with S3 and ALB origins
8. Monitoring: CloudWatch dashboard with metrics and alarms

All resources use environmentSuffix, are destroyable, and follow AWS best practices.