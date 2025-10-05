import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * Freelancer Marketplace Platform Stack
 * 
 * Implements a production-ready freelancer marketplace connecting 8,000 professionals
 * with clients. Features include profile management, project bidding, milestone-based
 * payments, and real-time messaging.
 * 
 * Architecture:
 * - Multi-AZ VPC with public/private subnets
 * - ECS Fargate for containerized application
 * - Aurora MySQL for transactional data
 * - DynamoDB for real-time messaging
 * - ElastiCache Redis for caching
 * - S3 + CloudFront for portfolio content delivery
 * - Two separate Cognito pools (freelancers & clients)
 * - Lambda for payment webhook processing
 * - Step Functions for project lifecycle workflow
 * - SNS/SES for notifications
 * - Comprehensive CloudWatch monitoring
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const env =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const projectName = 'freelancer-platform';
    const resourcePrefix = `${env}-${projectName}`;

    // =================================================================
    // 1. NETWORKING LAYER - VPC with Multi-AZ configuration
    // =================================================================
    // For dev environment, use single NAT Gateway to avoid EIP limits
    // For production, increase to 2 for high availability
    const natGateways = env === 'dev' ? 1 : 2;

    const vpc = new ec2.Vpc(this, 'FreelancerVPC', {
      vpcName: `${resourcePrefix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.36.0.0/16'),
      maxAzs: 2,
      natGateways: natGateways, // Reduced to 1 for dev to avoid EIP limit
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for network monitoring
    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogs', {
      logGroupName: `/aws/vpc/${resourcePrefix}-flow-logs`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // =================================================================
    // 2. SECURITY GROUPS - Define all upfront for proper dependency management
    // =================================================================
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      securityGroupName: `${resourcePrefix}-alb-sg`,
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS Fargate tasks',
      securityGroupName: `${resourcePrefix}-ecs-sg`,
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB on container port'
    );

    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      'AuroraSecurityGroup',
      {
        vpc,
        description: 'Security group for Aurora MySQL cluster',
        securityGroupName: `${resourcePrefix}-aurora-sg`,
        allowAllOutbound: false,
      }
    );

    const redisSecurityGroup = new ec2.SecurityGroup(
      this,
      'RedisSecurityGroup',
      {
        vpc,
        description: 'Security group for ElastiCache Redis',
        securityGroupName: `${resourcePrefix}-redis-sg`,
        allowAllOutbound: false,
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        securityGroupName: `${resourcePrefix}-lambda-sg`,
        allowAllOutbound: true,
      }
    );

    // Configure security group rules after all SGs are created
    auroraSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from ECS tasks'
    );

    auroraSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from Lambda'
    );

    redisSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from ECS tasks'
    );

    // =================================================================
    // 3. AURORA MYSQL - Transactional database for users, projects, bids
    // =================================================================
    const dbSecret = new secretsmanager.Secret(this, 'AuroraSecret', {
      secretName: `${resourcePrefix}-aurora-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    const auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      clusterIdentifier: `${resourcePrefix}-aurora-cluster`,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: 'freelancerdb',
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          publiclyAccessible: false,
        }),
      ],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [auroraSecurityGroup],
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // =================================================================
    // 4. DYNAMODB - Real-time messaging with optimized query patterns
    // =================================================================
    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: `${resourcePrefix}-messages`,
      partitionKey: {
        name: 'conversationId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI-1: Query messages by sender
    messagesTable.addGlobalSecondaryIndex({
      indexName: 'userId-timestamp-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI-2: Query messages by receiver (inbox queries)
    messagesTable.addGlobalSecondaryIndex({
      indexName: 'receiverId-timestamp-index',
      partitionKey: { name: 'receiverId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =================================================================
    // 5. ELASTICACHE REDIS - Session caching and search result optimization
    // =================================================================
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for ElastiCache Redis',
        subnetIds: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
        cacheSubnetGroupName: `${resourcePrefix}-redis-subnet-group`,
      }
    );

    const redisReplicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupId: `${resourcePrefix}-redis`,
        replicationGroupDescription:
          'Redis cluster for freelancer platform caching',
        engine: 'redis',
        engineVersion: '7.0',
        cacheNodeType: 'cache.t3.medium',
        numNodeGroups: 1,
        replicasPerNodeGroup: 1,
        multiAzEnabled: true,
        automaticFailoverEnabled: true,
        cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
        securityGroupIds: [redisSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
      }
    );

    redisReplicationGroup.addDependency(redisSubnetGroup);

    // =================================================================
    // 6. S3 + CLOUDFRONT - Portfolio content storage and global delivery
    // =================================================================
    const portfolioBucket = new s3.Bucket(this, 'PortfolioBucket', {
      bucketName: `${resourcePrefix}-portfolios-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'archive-old-versions',
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Identity for secure S3 access
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for ${resourcePrefix} portfolio bucket`,
      }
    );

    portfolioBucket.grantRead(originAccessIdentity);

    // CDN Log Bucket
    const cdnLogBucket = new s3.Bucket(this, 'CDNLogBucket', {
      bucketName: `${resourcePrefix}-cdn-logs-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
    });

    const distribution = new cloudfront.Distribution(this, 'CDNDistribution', {
      comment: `${resourcePrefix} portfolio content CDN`,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(portfolioBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enableLogging: true,
      logBucket: cdnLogBucket,
      logFilePrefix: 'cdn-access-logs/',
    });

    // =================================================================
    // 7. COGNITO USER POOLS - Separate authentication for freelancers and clients
    // =================================================================
    // Freelancer User Pool
    const freelancerPool = new cognito.UserPool(this, 'FreelancerUserPool', {
      userPoolName: `${resourcePrefix}-freelancers`,
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: false },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: true, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      customAttributes: {
        skills: new cognito.StringAttribute({ mutable: true, maxLen: 500 }),
        hourlyRate: new cognito.NumberAttribute({
          mutable: true,
          min: 0,
          max: 1000,
        }),
        portfolioUrl: new cognito.StringAttribute({
          mutable: true,
          maxLen: 256,
        }),
        experienceLevel: new cognito.StringAttribute({
          mutable: true,
          maxLen: 50,
        }),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const freelancerPoolClient = freelancerPool.addClient(
      'FreelancerAppClient',
      {
        userPoolClientName: `${resourcePrefix}-freelancer-client`,
        authFlows: {
          userPassword: true,
          userSrp: true,
          custom: true,
        },
        generateSecret: false,
        preventUserExistenceErrors: true,
      }
    );

    // Client User Pool
    const clientPool = new cognito.UserPool(this, 'ClientUserPool', {
      userPoolName: `${resourcePrefix}-clients`,
      selfSignUpEnabled: true,
      signInAliases: { email: true, username: false },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: true, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      customAttributes: {
        companyName: new cognito.StringAttribute({
          mutable: true,
          maxLen: 256,
        }),
        industry: new cognito.StringAttribute({ mutable: true, maxLen: 100 }),
        budgetRange: new cognito.StringAttribute({ mutable: true, maxLen: 50 }),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const clientPoolClient = clientPool.addClient('ClientAppClient', {
      userPoolClientName: `${resourcePrefix}-client-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // =================================================================
    // 8. ECS FARGATE - Containerized application layer
    // =================================================================
    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: `${resourcePrefix}-cluster`,
      vpc,
      enableFargateCapacityProviders: true,
    });

    cluster.addDefaultCloudMapNamespace({
      name: `${resourcePrefix}.local`,
    });

    const taskRole = new iam.Role(this, 'ECSTaskRole', {
      roleName: `${resourcePrefix}-ecs-task-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant task access to DynamoDB, S3, and Secrets Manager
    messagesTable.grantReadWriteData(taskRole);
    portfolioBucket.grantReadWrite(taskRole);
    dbSecret.grantRead(taskRole);

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `${resourcePrefix}-task`,
      memoryLimitMiB: 2048,
      cpu: 1024,
      taskRole,
    });

    const ecsLogGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: `/ecs/${resourcePrefix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // FIXED: Remove REDIS_ENDPOINT from initial environment
    const container = taskDefinition.addContainer('AppContainer', {
      containerName: 'freelancer-app',
      image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Replace with actual app image
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: ecsLogGroup,
      }),
      environment: {
        ENVIRONMENT: env,
        AURORA_ENDPOINT: auroraCluster.clusterEndpoint.hostname,
        DYNAMODB_TABLE: messagesTable.tableName,
        // REDIS_ENDPOINT removed from here
        S3_BUCKET: portfolioBucket.bucketName,
        CLOUDFRONT_URL: distribution.distributionDomainName,
        FREELANCER_POOL_ID: freelancerPool.userPoolId,
        FREELANCER_CLIENT_ID: freelancerPoolClient.userPoolClientId,
        CLIENT_POOL_ID: clientPool.userPoolId,
        CLIENT_CLIENT_ID: clientPoolClient.userPoolClientId,
      },
      secrets: {
        DB_SECRET_ARN: ecs.Secret.fromSecretsManager(dbSecret),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // FIXED: Add explicit dependency and Redis endpoint after container is created
    taskDefinition.node.addDependency(redisReplicationGroup);
    
    // Add Redis endpoint as environment variable after task definition is created
    const cfnTaskDef = taskDefinition.node.defaultChild as ecs.CfnTaskDefinition;
    cfnTaskDef.addPropertyOverride('ContainerDefinitions.0.Environment', [
      { Name: 'ENVIRONMENT', Value: env },
      { Name: 'AURORA_ENDPOINT', Value: auroraCluster.clusterEndpoint.hostname },
      { Name: 'DYNAMODB_TABLE', Value: messagesTable.tableName },
      { Name: 'REDIS_ENDPOINT', Value: redisReplicationGroup.attrConfigurationEndPointAddress },
      { Name: 'S3_BUCKET', Value: portfolioBucket.bucketName },
      { Name: 'CLOUDFRONT_URL', Value: distribution.distributionDomainName },
      { Name: 'FREELANCER_POOL_ID', Value: freelancerPool.userPoolId },
      { Name: 'FREELANCER_CLIENT_ID', Value: freelancerPoolClient.userPoolClientId },
      { Name: 'CLIENT_POOL_ID', Value: clientPool.userPoolId },
      { Name: 'CLIENT_CLIENT_ID', Value: clientPoolClient.userPoolClientId },
    ]);

    const fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: `${resourcePrefix}-service`,
      cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      enableExecuteCommand: true,
    });

    // Auto-scaling based on CPU and memory
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // =================================================================
    // 9. APPLICATION LOAD BALANCER - Traffic distribution
    // =================================================================
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `${resourcePrefix}-alb`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `${resourcePrefix}-tg`,
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
      stickinessCookieDuration: cdk.Duration.hours(1),
    });

    fargateService.attachToApplicationTargetGroup(targetGroup);

    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // =================================================================
    // 10. SNS TOPICS - Real-time notifications
    // =================================================================
    const bidNotificationTopic = new sns.Topic(this, 'BidNotificationTopic', {
      topicName: `${resourcePrefix}-bid-notifications`,
      displayName: 'New Bid Notifications',
    });

    const milestoneApprovalTopic = new sns.Topic(
      this,
      'MilestoneApprovalTopic',
      {
        topicName: `${resourcePrefix}-milestone-approvals`,
        displayName: 'Milestone Approval Notifications',
      }
    );

    const paymentConfirmationTopic = new sns.Topic(
      this,
      'PaymentConfirmationTopic',
      {
        topicName: `${resourcePrefix}-payment-confirmations`,
        displayName: 'Payment Confirmation Notifications',
      }
    );

    // =================================================================
    // 11. SES CONFIGURATION - Transactional emails
    // =================================================================
    new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.email('noreply@example.com'), // Replace with actual domain
    });

    new ses.ConfigurationSet(this, 'ConfigurationSet', {
      configurationSetName: `${resourcePrefix}-ses-config`,
    });

    // =================================================================
    // 12. LAMBDA - Payment webhook processing
    // =================================================================
    const paymentWebhookDLQ = new sqs.Queue(this, 'PaymentWebhookDLQ', {
      queueName: `${resourcePrefix}-payment-webhook-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const paymentWebhookFunction = new lambda.Function(
      this,
      'PaymentWebhookFunction',
      {
        functionName: `${resourcePrefix}-payment-webhook`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Payment webhook received:', JSON.stringify(event));
  // Process payment webhook
  // Update Aurora database with payment status
  // Publish to SNS for notifications
  return { statusCode: 200, body: 'Payment processed' };
};
        `),
        environment: {
          AURORA_ENDPOINT: auroraCluster.clusterEndpoint.hostname,
          DB_SECRET_ARN: dbSecret.secretArn,
          PAYMENT_TOPIC_ARN: paymentConfirmationTopic.topicArn,
        },
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        deadLetterQueue: paymentWebhookDLQ,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    dbSecret.grantRead(paymentWebhookFunction);
    paymentConfirmationTopic.grantPublish(paymentWebhookFunction);

    // =================================================================
    // 13. STEP FUNCTIONS - Project lifecycle workflow
    // =================================================================
    const projectCreatedTask = new tasks.SnsPublish(
      this,
      'ProjectCreatedNotification',
      {
        topic: bidNotificationTopic,
        message: sfn.TaskInput.fromText(
          'New project created and open for bidding'
        ),
      }
    );

    const biddingOpenTask = new sfn.Pass(this, 'BiddingOpen', {
      result: sfn.Result.fromObject({ status: 'bidding_open' }),
    });

    const freelancerSelectedTask = new tasks.SnsPublish(
      this,
      'FreelancerSelectedNotification',
      {
        topic: milestoneApprovalTopic,
        message: sfn.TaskInput.fromText('Freelancer selected for project'),
      }
    );

    const milestonesDefinedTask = new sfn.Pass(this, 'MilestonesDefined', {
      result: sfn.Result.fromObject({ status: 'milestones_defined' }),
    });

    const workInProgressTask = new sfn.Pass(this, 'WorkInProgress', {
      result: sfn.Result.fromObject({ status: 'work_in_progress' }),
    });

    const milestoneApprovalTask = new tasks.SnsPublish(
      this,
      'MilestoneApprovalNotification',
      {
        topic: milestoneApprovalTopic,
        message: sfn.TaskInput.fromText('Milestone approved by client'),
      }
    );

    const paymentProcessedTask = new tasks.LambdaInvoke(
      this,
      'ProcessPayment',
      {
        lambdaFunction: paymentWebhookFunction,
        outputPath: '$.Payload',
      }
    );

    const projectCompletedTask = new tasks.SnsPublish(
      this,
      'ProjectCompletedNotification',
      {
        topic: paymentConfirmationTopic,
        message: sfn.TaskInput.fromText('Project completed successfully'),
      }
    );

    const definition = projectCreatedTask
      .next(biddingOpenTask)
      .next(freelancerSelectedTask)
      .next(milestonesDefinedTask)
      .next(workInProgressTask)
      .next(milestoneApprovalTask)
      .next(paymentProcessedTask)
      .next(projectCompletedTask);

    const stateMachine = new sfn.StateMachine(
      this,
      'ProjectLifecycleStateMachine',
      {
        stateMachineName: `${resourcePrefix}-project-lifecycle`,
        definitionBody: sfn.DefinitionBody.fromChainable(definition),
        timeout: cdk.Duration.hours(24),
        tracingEnabled: true,
      }
    );

    // =================================================================
    // 14. CLOUDWATCH MONITORING - Dashboards and Alarms
    // =================================================================
    const dashboard = new cloudwatch.Dashboard(this, 'PlatformDashboard', {
      dashboardName: `${resourcePrefix}-dashboard`,
    });

    // ALB Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metrics.requestCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB 5XX Errors',
        left: [
          alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT),
        ],
      })
    );

    // ECS Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [fargateService.metricCpuUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [fargateService.metricMemoryUtilization()],
      })
    );

    // DynamoDB Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          messagesTable.metricConsumedReadCapacityUnits(),
          messagesTable.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ALB5XXAlarm', {
      alarmName: `${resourcePrefix}-alb-5xx-errors`,
      metric: alb.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT
      ),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'AuroraConnectionsAlarm', {
      alarmName: `${resourcePrefix}-aurora-connections`,
      metric: auroraCluster.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'DynamoDBThrottlesAlarm', {
      alarmName: `${resourcePrefix}-dynamodb-throttles`,
      metric: messagesTable.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.PUT_ITEM],
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // =================================================================
    // 15. RESOURCE TAGGING - Consistent tagging strategy
    // =================================================================
    cdk.Tags.of(this).add('Environment', env);
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'engineering');

    // =================================================================
    // 16. CLOUDFORMATION OUTPUTS - Important resource identifiers
    // =================================================================
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${resourcePrefix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${resourcePrefix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'AuroraEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora MySQL Cluster Endpoint',
      exportName: `${resourcePrefix}-aurora-endpoint`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: messagesTable.tableName,
      description: 'DynamoDB Messages Table Name',
      exportName: `${resourcePrefix}-dynamodb-table`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: portfolioBucket.bucketName,
      description: 'Portfolio S3 Bucket Name',
      exportName: `${resourcePrefix}-s3-bucket`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `${resourcePrefix}-cloudfront-url`,
    });

    new cdk.CfnOutput(this, 'FreelancerUserPoolId', {
      value: freelancerPool.userPoolId,
      description: 'Freelancer Cognito User Pool ID',
      exportName: `${resourcePrefix}-freelancer-pool-id`,
    });

    new cdk.CfnOutput(this, 'ClientUserPoolId', {
      value: clientPool.userPoolId,
      description: 'Client Cognito User Pool ID',
      exportName: `${resourcePrefix}-client-pool-id`,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrConfigurationEndPointAddress,
      description: 'ElastiCache Redis Endpoint',
      exportName: `${resourcePrefix}-redis-endpoint`,
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Project Lifecycle State Machine ARN',
      exportName: `${resourcePrefix}-state-machine-arn`,
    });
  }
}
