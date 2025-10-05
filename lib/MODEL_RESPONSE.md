### Reasoning Trace
---

This is a comprehensive AWS CDK implementation request for a freelancer marketplace platform. Let me break down what needs to be implemented:

1. **Network Layer**: VPC with CIDR 10.36.0.0/16, multi-AZ setup with public/private subnets, NAT gateways
2. **Compute**: ECS Fargate with ALB, auto-scaling
3. **Data Layer**: Aurora MySQL, DynamoDB with GSIs, S3 for files, ElastiCache Redis
4. **Auth**: Two separate Cognito user pools (freelancers and clients)
5. **Serverless**: Lambda for payment webhooks, Step Functions for project workflow
6. **Messaging**: SES for emails, SNS for notifications
7. **CDN**: CloudFront for S3 content
8. **Monitoring**: CloudWatch dashboards and alarms

Key considerations:
- Region: us-east-2 (Ohio)
- Environment: dev
- User base: 8,000 professionals + clients
- High concurrency requirements
- Message query performance < 100ms
- Tenant isolation between freelancers and clients

I need to create three files:
1. lib/tap-stack.ts - Main CDK stack
2. tests/tap-stack.unit.test.ts - Unit tests
3. tests/tap-stack.int.test.ts - Integration tests

Let me structure the implementation carefully with all the required resources and proper interconnections.
### Answer 
---

Looking at this comprehensive freelancer marketplace platform requirements, I'll design a production-ready infrastructure with proper resource interconnections, security, and scalability. Let me implement the three required files with all necessary AWS resources.

### File 1: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * TAP Stack - Freelancer Marketplace Platform Infrastructure
 * 
 * This stack provisions a complete AWS infrastructure for a freelancer marketplace
 * supporting 8,000+ professionals with project bidding, milestone payments, and messaging.
 */
export class TapStack extends cdk.Stack {
  // Public properties for testing
  public readonly vpc: ec2.Vpc;
  public readonly auroraCluster: rds.DatabaseCluster;
  public readonly messagesTable: dynamodb.Table;
  public readonly portfolioBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly freelancerPool: cognito.UserPool;
  public readonly clientPool: cognito.UserPool;
  public readonly fargateService: ecs_patterns.ApplicationLoadBalancedFargateService;
  public readonly paymentLambda: lambda.Function;
  public readonly projectWorkflow: stepfunctions.StateMachine;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-2',
      },
    });

    const environment = 'dev';
    const projectName = 'freelancer-platform';
    
    // Apply default tags to all resources
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'engineering');

    // =============================
    // 1. NETWORKING LAYER
    // =============================
    
    /**
     * VPC Configuration
     * Multi-AZ deployment with 10.36.0.0/16 CIDR for high availability
     * Includes public and private subnets across 2 availability zones
     */
    this.vpc = new ec2.Vpc(this, 'MarketplaceVpc', {
      vpcName: `${environment}-${projectName}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.36.0.0/16'),
      maxAzs: 2, // Multi-AZ for high availability
      natGateways: 2, // One per AZ for redundancy
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 20, // 4096 IPs per subnet
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 20,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 20,
        },
      ],
      flowLogs: {
        'vpc-flow-logs': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, 'VpcFlowLogGroup', {
              logGroupName: `/aws/vpc/${environment}-${projectName}`,
              retention: logs.RetentionDays.ONE_WEEK, // Reduced for dev environment
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            })
          ),
          trafficType: ec2.FlowLogTrafficType.REJECT, // Only log rejected traffic in dev
        },
      },
    });

    // =============================
    // 2. SECURITY GROUPS
    // =============================
    
    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environment}-${projectName}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    // ECS Security Group
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environment}-${projectName}-ecs-sg`,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true, // Needs to reach external APIs
    });
    
    // Allow ALB to reach ECS tasks
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow inbound from ALB on container port'
    );
    
    // Aurora Security Group
    const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environment}-${projectName}-aurora-sg`,
      description: 'Security group for Aurora MySQL cluster',
      allowAllOutbound: false,
    });
    auroraSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from ECS tasks'
    );
    
    // Redis Security Group
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environment}-${projectName}-redis-sg`,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis access from ECS tasks'
    );
    
    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environment}-${projectName}-lambda-sg`,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });
    auroraSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from Lambda'
    );

    // =============================
    // 3. DATA STORAGE LAYER
    // =============================
    
    /**
     * Aurora MySQL Cluster
     * Used for storing user profiles, projects, bids, and transactional data
     * Multi-AZ deployment with read replicas for query offloading
     */
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `${environment}-${projectName}-aurora-secret`,
      description: 'Aurora MySQL cluster credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    this.auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      clusterIdentifier: `${environment}-${projectName}-aurora-cluster`,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0, // MySQL 8.0 compatible
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceProps: {
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [auroraSecurityGroup],
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM // Suitable for 8,000 users in dev
        ),
      },
      instances: 2, // One writer, one reader for dev
      defaultDatabaseName: 'freelancer_marketplace',
      backup: {
        retention: cdk.Duration.days(7), // 7 days for dev environment
        preferredWindow: '03:00-04:00', // Low traffic window
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Disabled for dev environment
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion in dev
    });

    /**
     * DynamoDB Table for Messages
     * Optimized for real-time messaging with < 100ms query performance
     */
    this.messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: `${environment}-${projectName}-messages`,
      partitionKey: {
        name: 'conversationId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand for dev
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // For real-time updates
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for sender queries
    this.messagesTable.addGlobalSecondaryIndex({
      indexName: 'userId-timestamp-index',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for receiver inbox queries
    this.messagesTable.addGlobalSecondaryIndex({
      indexName: 'receiverId-timestamp-index',
      partitionKey: {
        name: 'receiverId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    /**
     * S3 Bucket for Portfolio Content
     * Stores resumes, work samples, images, and videos
     */
    const s3EncryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      alias: `${environment}-${projectName}-s3-key`,
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.portfolioBucket = new s3.Bucket(this, 'PortfolioBucket', {
      bucketName: `${environment}-${projectName}-portfolio-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Will be restricted in production
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For dev environment
    });

    /**
     * ElastiCache Redis Cluster
     * Used for caching search results and session data
     */
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      description: 'Subnet group for Redis cluster',
      cacheSubnetGroupName: `${environment}-${projectName}-redis-subnet-group`,
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      clusterName: `${environment}-${projectName}-redis`,
      engine: 'redis',
      engineVersion: '7.0.7',
      cacheNodeType: 'cache.t3.micro', // Sufficient for dev environment
      numCacheNodes: 1, // Single node for dev, will use replication group in prod
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      autoMinorVersionUpgrade: true,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: 1, // 1 day for dev
      snapshotWindow: '03:00-05:00',
    });
    redisCluster.addDependency(redisSubnetGroup);

    // =============================
    // 4. CONTENT DELIVERY
    // =============================
    
    /**
     * CloudFront Distribution
     * Provides global content delivery for portfolio assets
     */
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${environment}-${projectName}`,
    });

    this.portfolioBucket.grantRead(oai);

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${environment}-${projectName} portfolio CDN`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(this.portfolioBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin('placeholder.com'), // Will be updated with ALB DNS
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe for dev
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // =============================
    // 5. AUTHENTICATION & AUTHORIZATION
    // =============================
    
    /**
     * Freelancer Cognito User Pool
     * Separate pool for freelancer authentication with custom attributes
     */
    this.freelancerPool = new cognito.UserPool(this, 'FreelancerPool', {
      userPoolName: `${environment}-${projectName}-freelancers`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your freelancer account',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      customAttributes: {
        skills: new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 500,
          mutable: true,
        }),
        hourlyRate: new cognito.NumberAttribute({ 
          min: 0, 
          max: 10000,
          mutable: true,
        }),
        portfolioLinks: new cognito.StringAttribute({ 
          minLen: 0, 
          maxLen: 2048,
          mutable: true,
        }),
        experienceLevel: new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 50,
          mutable: true,
        }),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const freelancerClient = this.freelancerPool.addClient('FreelancerWebClient', {
      userPoolClientName: `${environment}-${projectName}-freelancer-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      preventUserExistenceErrors: true,
    });

    /**
     * Client Cognito User Pool
     * Separate pool for client authentication with company attributes
     */
    this.clientPool = new cognito.UserPool(this, 'ClientPool', {
      userPoolName: `${environment}-${projectName}-clients`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your client account',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      customAttributes: {
        companyName: new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 255,
          mutable: true,
        }),
        industry: new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 100,
          mutable: true,
        }),
        budgetPreferences: new cognito.StringAttribute({ 
          minLen: 0, 
          maxLen: 500,
          mutable: true,
        }),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const clientClient = this.clientPool.addClient('ClientWebClient', {
      userPoolClientName: `${environment}-${projectName}-client-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      preventUserExistenceErrors: true,
    });

    // =============================
    // 6. COMPUTE LAYER - ECS FARGATE
    // =============================
    
    /**
     * ECS Cluster and Fargate Service
     * Runs the containerized web application with auto-scaling
     */
    const ecsCluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `${environment}-${projectName}-cluster`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `${environment}-${projectName}-task-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant access to database secret
    dbSecret.grantRead(taskExecutionRole);

    // Task role for application permissions
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${environment}-${projectName}-task-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant DynamoDB permissions to task role
    this.messagesTable.grantReadWriteData(taskRole);
    this.portfolioBucket.grantReadWrite(taskRole);

    // Create Fargate service with ALB
    this.fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'FargateService',
      {
        cluster: ecsCluster,
        serviceName: `${environment}-${projectName}-service`,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Placeholder image
          containerPort: 8080,
          containerName: 'web-app',
          environment: {
            NODE_ENV: environment,
            AWS_REGION: this.region,
            MESSAGES_TABLE_NAME: this.messagesTable.tableName,
            PORTFOLIO_BUCKET_NAME: this.portfolioBucket.bucketName,
            REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
            REDIS_PORT: redisCluster.attrRedisEndpointPort,
            FREELANCER_POOL_ID: this.freelancerPool.userPoolId,
            FREELANCER_CLIENT_ID: freelancerClient.userPoolClientId,
            CLIENT_POOL_ID: this.clientPool.userPoolId,
            CLIENT_CLIENT_ID: clientClient.userPoolClientId,
          },
          secrets: {
            DB_SECRET_ARN: ecs.Secret.fromSecretsManager(dbSecret),
          },
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'web-app',
            logGroup: new logs.LogGroup(this, 'WebAppLogGroup', {
              logGroupName: `/ecs/${environment}-${projectName}-web-app`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          }),
          taskRole: taskRole,
          executionRole: taskExecutionRole,
        },
        publicLoadBalancer: true,
        desiredCount: 2, // Start with 2 tasks for dev
        cpu: 512, // 0.5 vCPU
        memoryLimitMiB: 1024, // 1 GB
        assignPublicIp: false, // Tasks in private subnet
        securityGroups: [ecsSecurityGroup],
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        loadBalancerName: `${environment}-freelancer-alb`,
        healthCheckGracePeriod: cdk.Duration.seconds(60),
        enableLogging: true,
      }
    );

    // Configure ALB health check
    this.fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Configure auto-scaling
    const scaling = this.fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10, // Scale up to 10 tasks for load handling
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Configure ALB stickiness
    this.fargateService.targetGroup.setAttribute(
      'stickiness.enabled',
      'true'
    );
    this.fargateService.targetGroup.setAttribute(
      'stickiness.type',
      'lb_cookie'
    );
    this.fargateService.targetGroup.setAttribute(
      'stickiness.lb_cookie.duration_seconds',
      '86400'
    );

    // Allow ALB to egress to ECS
    albSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB to reach ECS tasks'
    );

    // =============================
    // 7. SERVERLESS COMPONENTS
    // =============================
    
    /**
     * Lambda Function for Payment Webhook Processing
     * Handles payment provider webhooks and updates transaction status
     */
    const paymentDLQ = new sqs.Queue(this, 'PaymentDLQ', {
      queueName: `${environment}-${projectName}-payment-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    this.paymentLambda = new lambda.Function(this, 'PaymentWebhookLambda', {
      functionName: `${environment}-${projectName}-payment-webhook`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        const mysql = require('mysql2/promise');
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Processing payment webhook:', JSON.stringify(event));
          
          try {
            // Retrieve database credentials
            const secret = await secretsManager.getSecretValue({ 
              SecretId: process.env.DB_SECRET_ARN 
            }).promise();
            
            const credentials = JSON.parse(secret.SecretString);
            
            // Connect to database
            const connection = await mysql.createConnection({
              host: process.env.DB_ENDPOINT,
              user: credentials.username,
              password: credentials.password,
              database: 'freelancer_marketplace'
            });
            
            // Process payment logic here
            const webhookData = JSON.parse(event.body || '{}');
            
            // Update payment status in database
            await connection.execute(
              'UPDATE payments SET status = ?, updated_at = NOW() WHERE transaction_id = ?',
              [webhookData.status, webhookData.transactionId]
            );
            
            // Publish notification
            await sns.publish({
              TopicArn: process.env.PAYMENT_TOPIC_ARN,
              Message: JSON.stringify({
                transactionId: webhookData.transactionId,
                status: webhookData.status,
                amount: webhookData.amount
              }),
              Subject: 'Payment Status Update'
            }).promise();
            
            await connection.end();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ success: true })
            };
          } catch (error) {
            console.error('Payment webhook error:', error);
            throw error;
          }
        };
      `),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_ENDPOINT: this.auroraCluster.clusterEndpoint.hostname,
        PAYMENT_TOPIC_ARN: '', // Will be set after SNS topic creation
      },
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: paymentDLQ,
      deadLetterQueueEnabled: true,
      reservedConcurrentExecutions: 10, // Limit concurrent executions
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant Lambda permissions
    dbSecret.grantRead(this.paymentLambda);
    
    /**
     * Step Functions State Machine
     * Orchestrates the project lifecycle workflow
     */
    
    // Lambda for project notifications
    const notificationLambda = new lambda.Function(this, 'NotificationLambda', {
      functionName: `${environment}-${projectName}-notifications`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Sending notification:', JSON.stringify(event));
          // Notification logic would go here
          return { success: true, messageId: Date.now().toString() };
        };
      `),
      timeout: cdk.Duration.seconds(10),
    });

    // Define Step Functions tasks
    const notifyProjectCreated = new stepfunctions_tasks.LambdaInvoke(
      this,
      'NotifyProjectCreated',
      {
        lambdaFunction: notificationLambda,
        outputPath: '$.Payload',
      }
    );

    const waitForBids = new stepfunctions.Wait(this, 'WaitForBids', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.hours(24)),
    });

    const checkBidStatus = new stepfunctions.Choice(this, 'CheckBidStatus')
      .when(
        stepfunctions.Condition.numberGreaterThan('$.bidCount', 0),
        new stepfunctions.Pass(this, 'ProcessBids')
      )
      .otherwise(
        new stepfunctions.Fail(this, 'NoBidsReceived', {
          error: 'NoBids',
          cause: 'No bids received within timeframe',
        })
      );

    const freelancerSelected = new stepfunctions.Pass(this, 'FreelancerSelected');
    const milestonesDefined = new stepfunctions.Pass(this, 'MilestonesDefined');
    const workInProgress = new stepfunctions.Pass(this, 'WorkInProgress');
    const milestoneApproval = new stepfunctions.Pass(this, 'MilestoneApproval');
    const paymentProcessed = new stepfunctions.Pass(this, 'PaymentProcessed');
    const projectCompleted = new stepfunctions.Pass(this, 'ProjectCompleted');

    // Build the state machine
    const definition = notifyProjectCreated
      .next(waitForBids)
      .next(checkBidStatus)
      .next(freelancerSelected)
      .next(milestonesDefined)
      .next(workInProgress)
      .next(milestoneApproval)
      .next(paymentProcessed)
      .next(projectCompleted);

    this.projectWorkflow = new stepfunctions.StateMachine(this, 'ProjectWorkflow', {
      stateMachineName: `${environment}-${projectName}-project-workflow`,
      definition,
      timeout: cdk.Duration.days(30),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'WorkflowLogGroup', {
          logGroupName: `/aws/stepfunctions/${environment}-${projectName}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // =============================
    // 8. NOTIFICATIONS & COMMUNICATION
    // =============================
    
    /**
     * SNS Topics for Real-time Notifications
     */
    const bidNotificationTopic = new sns.Topic(this, 'BidNotificationTopic', {
      topicName: `${environment}-${projectName}-bid-notifications`,
      displayName: 'New Bid Notifications',
    });

    const milestoneApprovalTopic = new sns.Topic(this, 'MilestoneApprovalTopic', {
      topicName: `${environment}-${projectName}-milestone-approvals`,
      displayName: 'Milestone Approval Notifications',
    });

    const paymentConfirmationTopic = new sns.Topic(this, 'PaymentConfirmationTopic', {
      topicName: `${environment}-${projectName}-payment-confirmations`,
      displayName: 'Payment Confirmation Notifications',
    });

    // Update Lambda environment with SNS topic ARN
    this.paymentLambda.addEnvironment('PAYMENT_TOPIC_ARN', paymentConfirmationTopic.topicArn);
    paymentConfirmationTopic.grantPublish(this.paymentLambda);

    /**
     * SES Configuration for Transactional Emails
     * Note: Requires verified domain/email in production
     */
    const sesConfigSet = new ses.ConfigurationSet(this, 'SesConfigSet', {
      configurationSetName: `${environment}-${projectName}-config-set`,
      reputationTracking: true,
      sendingEnabled: true,
      suppressionReasons: ses.SuppressionReasons.BOUNCES_AND_COMPLAINTS,
    });

    // Email identity would be configured here in production
    // For now, using placeholder
    const emailIdentity = new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.email('notifications@example.com'), // Replace in production
    });

    // =============================
    // 9. MONITORING & OBSERVABILITY
    // =============================
    
    /**
     * CloudWatch Dashboard
     * Provides centralized monitoring for all platform components
     */
    const dashboard = new cloudwatch.Dashboard(this, 'PlatformDashboard', {
      dashboardName: `${environment}-${projectName}-dashboard`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // ALB Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [this.fargateService.loadBalancer.metricRequestCount()],
        right: [this.fargateService.loadBalancer.metricTargetResponseTime()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Error Rate',
        left: [
          this.fargateService.loadBalancer.metricHttpCodeElb(
            cloudwatch.HttpCodeElb.ELB_4XX_COUNT
          ),
          this.fargateService.loadBalancer.metricHttpCodeElb(
            cloudwatch.HttpCodeElb.ELB_5XX_COUNT
          ),
        ],
        width: 12,
        height: 6,
      })
    );

    // ECS Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU and Memory Utilization',
        left: [this.fargateService.service.metricCpuUtilization()],
        right: [this.fargateService.service.metricMemoryUtilization()],
        width: 12,
        height: 6,
      })
    );

    // Database Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Aurora Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // DynamoDB Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          this.messagesTable.metricConsumedReadCapacityUnits(),
          this.messagesTable.metricConsumedWriteCapacityUnits(),
        ],
        width: 12,
        height: 6,
      })
    );

    /**
     * CloudWatch Alarms
     * Critical alerts for production monitoring
     */
    
    // ALB 5xx errors alarm
    new cloudwatch.Alarm(this, 'ALB5xxAlarm', {
      alarmName: `${environment}-${projectName}-alb-5xx-errors`,
      metric: this.fargateService.loadBalancer.metricHttpCodeElb(
        cloudwatch.HttpCodeElb.ELB_5XX_COUNT
      ),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when ALB 5xx errors exceed threshold',
    });

    // High Aurora connections alarm
    new cloudwatch.Alarm(this, 'HighDatabaseConnectionsAlarm', {
      alarmName: `${environment}-${projectName}-high-db-connections`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 50,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when database connections are high',
    });

    // DynamoDB throttling alarm
    new cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      alarmName: `${environment}-${projectName}-dynamodb-throttles`,
      metric: this.messagesTable.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.PUT_ITEM],
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when DynamoDB operations are throttled',
    });

    // Lambda errors alarm
    new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `${environment}-${projectName}-lambda-errors`,
      metric: this.paymentLambda.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Lambda function errors exceed threshold',
    });

    // =============================
    // 10. OUTPUTS
    // =============================
    
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environment}-${projectName}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: `https://${this.fargateService.loadBalancer.loadBalancerDnsName}`,
      description: 'Application Load Balancer endpoint',
      exportName: `${environment}-${projectName}-alb-endpoint`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: `${environment}-${projectName}-cloudfront-url`,
    });

    new cdk.CfnOutput(this, 'FreelancerPoolId', {
      value: this.freelancerPool.userPoolId,
      description: 'Freelancer Cognito User Pool ID',
      exportName: `${environment}-${projectName}-freelancer-pool-id`,
    });

    new cdk.CfnOutput(this, 'ClientPoolId', {
      value: this.clientPool.userPoolId,
      description: 'Client Cognito User Pool ID',
      exportName: `${environment}-${projectName}-client-pool-id`,
    });

    new cdk.CfnOutput(this, 'MessagesTableName', {
      value: this.messagesTable.tableName,
      description: 'DynamoDB messages table name',
      exportName: `${environment}-${projectName}-messages-table`,
    });

    new cdk.CfnOutput(this, 'PortfolioBucketName', {
      value: this.portfolioBucket.bucketName,
      description: 'S3 portfolio bucket name',
      exportName: `${environment}-${projectName}-portfolio-bucket`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster write endpoint',
      exportName: `${environment}-${projectName}-aurora-endpoint`,
    });

    new cdk.CfnOutput(this, 'AuroraReaderEndpoint', {
      value: this.auroraCluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
      exportName: `${environment}-${projectName}-aurora-reader-endpoint`,
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.projectWorkflow.stateMachineArn,
      description: 'Step Functions state machine ARN',
      exportName: `${environment}-${projectName}-state-machine-arn`,
    });

    new cdk.CfnOutput(this, 'PaymentLambdaArn', {
      value: this.paymentLambda.functionArn,
      description: 'Payment webhook Lambda function ARN',
      exportName: `${environment}-${projectName}-payment-lambda-arn`,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'ElastiCache Redis endpoint',
      exportName: `${environment}-${projectName}-redis-endpoint`,
    });
  }
}
```

### File 2: tests/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

/**
 * Unit tests for TapStack
 * Validates resource creation, properties, and configurations
 */
describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.36.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has multi-AZ subnets', () => {
      // Should have 6 subnets total (3 types x 2 AZs)
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      
      // Verify public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      
      // Verify private subnets exist
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('NAT Gateways are configured for high availability', () => {
      // Should have 2 NAT Gateways for multi-AZ
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('VPC Flow Logs are enabled', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'REJECT',
      });
    });
  });

  describe('Security Groups', () => {
    test('ALB Security Group allows HTTP and HTTPS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Database Security Group restricts access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Aurora MySQL'),
        SecurityGroupEgress: Match.arrayEquals([]), // No outbound rules
      });
    });

    test('Redis Security Group is configured', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('ElastiCache Redis'),
      });
    });
  });

  describe('Aurora MySQL Cluster', () => {
    test('Aurora cluster is created with correct engine', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineMode: 'provisioned',
        DatabaseName: 'freelancer_marketplace',
      });
    });

    test('Aurora has multiple instances for HA', () => {
      // Should have 2 instances (1 writer, 1 reader)
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('Aurora backup is configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('Database credentials are stored in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora MySQL cluster credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.serializedJson(
            Match.objectLike({ username: 'admin' })
          ),
          GenerateStringKey: 'password',
          PasswordLength: 32,
        }),
      });
    });
  });

  describe('DynamoDB Configuration', () => {
    test('Messages table is created with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'conversationId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('GSIs are configured for message queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-timestamp-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          }),
          Match.objectLike({
            IndexName: 'receiverId-timestamp-index',
            KeySchema: [
              { AttributeName: 'receiverId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          }),
        ]),
      });
    });

    test('DynamoDB streams are enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });

  describe('S3 and CloudFront', () => {
    test('Portfolio bucket has versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpirationInDays: 90,
            }),
            Match.objectLike({
              Id: 'transition-to-ia',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('CloudFront distribution is configured', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          HttpVersion: 'http2and3',
          PriceClass: 'PriceClass_100',
          ViewerCertificate: Match.objectLike({
            MinimumProtocolVersion: 'TLSv1.2_2021',
          }),
        }),
      });
    });

    test('OAI is created for secure S3 access', () => {
      template.hasResourceProperties(
        'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        {
          CloudFrontOriginAccessIdentityConfig: {
            Comment: Match.stringLikeRegexp('OAI'),
          },
        }
      );
    });
  });

  describe('Cognito User Pools', () => {
    test('Two separate user pools are created', () => {
      template.resourceCountIs('AWS::Cognito::UserPool', 2);
    });

    test('Freelancer pool has custom attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: Match.stringLikeRegexp('freelancers'),
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'skills',
            AttributeDataType: 'String',
            Mutable: true,
          }),
          Match.objectLike({
            Name: 'hourlyRate',
            AttributeDataType: 'Number',
            Mutable: true,
          }),
          Match.objectLike({
            Name: 'experienceLevel',
            AttributeDataType: 'String',
            Mutable: true,
          }),
        ]),
      });
    });

    test('Client pool has company attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: Match.stringLikeRegexp('clients'),
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'companyName',
            AttributeDataType: 'String',
            Mutable: true,
          }),
          Match.objectLike({
            Name: 'industry',
            AttributeDataType: 'String',
            Mutable: true,
          }),
        ]),
      });
    });

    test('User pools have MFA configured', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        MfaConfiguration: 'OPTIONAL',
        EnabledMfas: Match.arrayWith(['SMS_MFA', 'SOFTWARE_TOKEN_MFA']),
      });
    });

    test('Password policies are strict', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 12,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
          },
        },
      });
    });
  });

  describe('ECS Fargate Service', () => {
    test('ECS cluster is created with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: Match.arrayWith([
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ]),
      });
    });

    test('Fargate service has correct task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('Auto-scaling is configured', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MinCapacity: 2,
          MaxCapacity: 10,
          ResourceId: Match.stringLikeRegexp('service/.*'),
          ScalableDimension: 'ecs:service:DesiredCount',
        }
      );
    });

    test('Target group has health check configured', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 10,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('Target group has sticky sessions', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupAttributes: Match.arrayWith([
          {
            Key: 'stickiness.enabled',
            Value: 'true',
          },
          {
            Key: 'stickiness.type',
            Value: 'lb_cookie',
          },
        ]),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Payment Lambda is configured correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('payment-webhook'),
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda has DLQ configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: Match.objectLike({
          TargetArn: Match.anyValue(),
        }),
      });
    });

    test('Lambda has reserved concurrent executions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 10,
      });
    });

    test('DLQ is encrypted', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('payment-dlq'),
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });
  });

  describe('Step Functions', () => {
    test('State machine is created with tracing', () => {
      template.hasResourceProperties('AWS::St