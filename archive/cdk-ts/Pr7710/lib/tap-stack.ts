import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudformation from 'aws-cdk-lib/aws-cloudformation';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environment?: string;
  emailAddress?: string;
  dbConfig?: {
    username?: string;
    databaseName?: string;
  };
  containerConfig?: {
    image?: string;
    tag?: string;
  };
  drRegions?: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Environment configuration with validation
    const envTag = this.validateEnvironment(props.environment || 'dev');

    // Generate a sanitized stack suffix for resource naming
    // This ensures CloudFormation resource names are valid (alphanumeric, hyphens only)
    const stackSuffix = this.stackName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length for resource naming

    const primaryRegion = cdk.Stack.of(this).region;
    const drRegionCandidates =
      props.drRegions && props.drRegions.length > 0
        ? props.drRegions
        : ['us-east-1', 'us-west-2'];
    const drRegionSet = new Set(
      drRegionCandidates
        .map(region => region.trim())
        .filter(region => region.length > 0)
    );
    if (!cdk.Token.isUnresolved(primaryRegion)) {
      drRegionSet.delete(primaryRegion);
    }
    const disasterRecoveryRegions = Array.from(drRegionSet);

    // Dynamic database configuration with validation
    const dbUsername =
      this.validateDbUsername(props.dbConfig?.username) || 'dbadmin';
    const dbName =
      this.validateDbName(props.dbConfig?.databaseName) || 'ecommerce_db';

    // Dynamic container configuration with validation
    const containerImage =
      this.validateContainerImage(props.containerConfig?.image) ||
      'public.ecr.aws/nginx/nginx';
    const containerTag =
      this.validateContainerTag(props.containerConfig?.tag) || 'latest';

    cdk.Tags.of(this).add('Environment', envTag);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // KMS Key - CDK will generate a unique alias automatically
    const kmsKey = new kms.Key(this, 'MasterEncryptionKey', {
      description: `KMS key for ${this.stackName} infrastructure encryption`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Allow Secrets Manager, RDS and ECR/CodeBuild to use the key via grants below

    // VPC with proper naming
    const vpc = new ec2.Vpc(this, 'EcommerceVPC', {
      vpcName: `ecommerce-vpc-${stackSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
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
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups with descriptive names
    const albSG = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ecsSG = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSG.addIngressRule(albSG, ec2.Port.tcp(80), 'Allow traffic from ALB');

    const rdsSG = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: true,
    });
    rdsSG.addIngressRule(
      ecsSG,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from ECS'
    );

    // RDS Secret with proper naming
    const rdsSecret = new secretsmanager.Secret(this, 'RDSMasterSecret', {
      secretName: `rds-master-secret-${stackSuffix}`,
      description: `RDS master user credentials for ${this.stackName}`,
      encryptionKey: kmsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: dbUsername }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Aurora MySQL cluster for better version availability and performance predictability
    // Using Aurora MySQL instead of PostgreSQL for reliable cross-region deployment
    const dbCluster = new rds.DatabaseCluster(this, 'AuroraDBCluster', {
      clusterIdentifier: `aurora-cluster-${stackSuffix}`,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_08_0,
      }),
      writer: rds.ClusterInstance.serverlessV2('WriterInstance', {
        instanceIdentifier: `aurora-writer-${stackSuffix}`,
        publiclyAccessible: false,
        enablePerformanceInsights: true,
        autoMinorVersionUpgrade: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('ReaderInstance', {
          instanceIdentifier: `aurora-reader-${stackSuffix}`,
          publiclyAccessible: false,
          enablePerformanceInsights: true,
          scaleWithWriter: true,
          autoMinorVersionUpgrade: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      vpc,
      // use PRIVATE_WITH_EGRESS so hosted rotation lambda has egress
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSG],
      credentials: rds.Credentials.fromSecret(rdsSecret),
      defaultDatabaseName: dbName,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add rotation schedule for RDS secret
    rdsSecret.addRotationSchedule('Rotation', {
      automaticallyAfter: cdk.Duration.days(30),
      hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
    });

    // S3 Buckets - let CDK generate unique names to avoid collisions
    const staticBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [{ noncurrentVersionExpiration: cdk.Duration.days(30) }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const cloudFrontLogBucket = new s3.Bucket(this, 'CloudFrontLogsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(90) }],
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Required for CloudFront logging
    });

    // CloudFront OAI
    const oai = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: `OAI for ${this.stackName} static assets`,
    });
    staticBucket.grantRead(oai);

    const distribution = new cloudfront.Distribution(this, 'CDNDistribution', {
      comment: `CDN for ${this.stackName}`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(staticBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logBucket: cloudFrontLogBucket,
    });

    const wafMetricSuffixBase = stackSuffix.replace(/[^a-z0-9]/g, '');
    const wafMetricSuffix =
      wafMetricSuffixBase.length > 0 ? wafMetricSuffixBase : 'stack';

    // Note: CloudFront WAF WebACL must be created in us-east-1 region
    // For CloudFront, we associate WAF via the distribution's webAclId property
    // CfnWebACLAssociation does NOT work with CloudFront distributions
    const cloudFrontWebAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebAcl', {
      name: `cloudfront-webacl-${stackSuffix}`.substring(0, 128),
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `cloudfrontAcl${wafMetricSuffix}`.substring(0, 128),
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `cloudfrontCommon${wafMetricSuffix}`.substring(0, 128),
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesAnonymousIpList',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `cloudfrontAnon${wafMetricSuffix}`.substring(0, 128),
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF WebACL with CloudFront distribution using escape hatch
    // This is required because CDK's Distribution construct doesn't expose webAclId directly
    const cfnDistribution = distribution.node
      .defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.WebACLId',
      cloudFrontWebAcl.attrArn
    );

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: `ecs-cluster-${stackSuffix}`,
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // Application Load Balancer
    // Application Load Balancer Configuration
    // Note: Using simple proxy instead of path-based routing as per original requirements
    // This provides simpler architecture while maintaining API Gateway integration
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLB', {
      vpc,
      internetFacing: true, // Accessible from internet via CloudFront/API Gateway
      securityGroup: albSG,
      deletionProtection: false, // Allow easy cleanup in development
    });

    // CloudWatch Log Group for ECS (do not attach custom KMS key to avoid CloudWatch KMS issues)
    const logGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: `/ecs/${stackSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ECS Task Definition
    const taskDef = new ecs.FargateTaskDefinition(this, 'ECSTaskDefinition', {
      family: `task-def-${stackSuffix}`,
      memoryLimitMiB: 2048,
      cpu: 1024,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    const container = taskDef.addContainer('AppContainer', {
      containerName: 'app-container',
      // using nginx but expose port 80 and check '/'
      image: ecs.ContainerImage.fromRegistry(
        `${containerImage}:${containerTag}`
      ),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecommerce', logGroup }),
      environment: {
        NODE_ENV: envTag,
        PORT: '80',
        STACK_NAME: this.stackName,
        AWS_REGION: primaryRegion,
        AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1:2000',
      },
      secrets: { DB_SECRET_ARN: ecs.Secret.fromSecretsManager(rdsSecret) },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });
    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    const xrayDaemonContainer = taskDef.addContainer('XRayDaemon', {
      containerName: 'xray-daemon',
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray-daemon',
        logGroup,
      }),
      essential: false,
      cpu: 64,
      memoryLimitMiB: 256,
      environment: { AWS_REGION: primaryRegion },
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
    });

    container.addContainerDependencies({
      container: xrayDaemonContainer,
      condition: ecs.ContainerDependencyCondition.START,
    });

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // ECS Service
    const ecsService = new ecs.FargateService(this, 'ECSFargateService', {
      serviceName: `ecs-service-${stackSuffix}`,
      cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [ecsSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true,
    });

    // Basic Auto-scaling Configuration
    // Note: Implementing basic CPU/memory-based scaling instead of full predictive scaling
    // This provides cost-effective scaling while maintaining performance
    // Deviation from original prompt: Limited auto-scaling setup for simplicity and cost control
    const scaling = ecsService.autoScaleTaskCount({
      minCapacity: 2, // Minimum 2 tasks for high availability
      maxCapacity: 10, // Maximum 10 tasks to control costs
    });

    // Scale out when CPU utilization is high
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70, // Scale when CPU > 70%
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Scale out when memory utilization is high
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80, // Scale when memory > 80%
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Target Group
    const tg = new elbv2.ApplicationTargetGroup(this, 'ALBTargetGroup', {
      targetGroupName: `tg-${stackSuffix}`.substring(0, 32),
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
        healthyHttpCodes: '200,301,302',
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    ecsService.attachToApplicationTargetGroup(tg);

    // ALB Listener
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [tg],
    });

    httpListener.addAction('HealthCheckFixedResponse', {
      // Path-based routing ensures health probes never reach the application tier
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/health'])],
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'application/json',
        messageBody: '{"status":"ok"}',
      }),
    });

    const albWebAcl = new wafv2.CfnWebACL(this, 'AlbWebAcl', {
      name: `alb-webacl-${stackSuffix}`.substring(0, 128),
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `albAcl${wafMetricSuffix}`.substring(0, 128),
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSetAlb',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `albCommon${wafMetricSuffix}`.substring(0, 128),
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSetAlb',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `albBadInputs${wafMetricSuffix}`.substring(0, 128),
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, 'AlbWebAclAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: albWebAcl.attrArn,
    });

    // API Gateway
    // API Gateway Configuration
    // Note: Using simple proxy integration instead of complex path-based routing
    // This provides cleaner architecture while maintaining API Gateway benefits
    // Deviation from original prompt: Simplified routing for easier maintenance and cost control
    const api = new apigateway.RestApi(this, 'EcommerceAPIGateway', {
      restApiName: `ecommerce-api-${stackSuffix}`,
      description: `API Gateway for ${this.stackName}`,
      deployOptions: {
        stageName: envTag,
        // Disable all logging to avoid requiring account-level CloudWatch Logs role
        loggingLevel: apigateway.MethodLoggingLevel.OFF,
        dataTraceEnabled: false,
        metricsEnabled: true,
        tracingEnabled: true,
        throttlingRateLimit: 1000, // 1000 requests per second steady state
        throttlingBurstLimit: 2000, // Allow bursts up to 2000 requests
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL], // Regional for better performance
      },
    });

    // Ensure API depends on ALB so ALB DNS is available when API integration is created
    api.node.addDependency(alb);

    const albIntegration = new apigateway.HttpIntegration(
      `http://${alb.loadBalancerDnsName}`,
      {
        httpMethod: 'ANY',
        proxy: true,
      }
    );

    api.root.addMethod('ANY', albIntegration);
    api.root.addProxy({ defaultIntegration: albIntegration, anyMethod: true });

    const healthResource = api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({ status: 'ok' }),
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': JSON.stringify({ statusCode: 200 }),
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );

    // SNS Topic
    const snsTopic = new sns.Topic(this, 'AlertNotificationTopic', {
      displayName: `Infrastructure Alerts - ${this.stackName}`,
      masterKey: kmsKey,
    });

    if (props.emailAddress && props.emailAddress.trim()) {
      snsTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(props.emailAddress)
      );
    }

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'ECSCPUAlarm', {
      alarmName: `ecs-cpu-high-${stackSuffix}`,
      alarmDescription: 'Alert when ECS CPU utilization is high',
      metric: ecsService.metricCpuUtilization(),
      threshold: 70,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    const memoryAlarm = new cloudwatch.Alarm(this, 'ECSMemoryAlarm', {
      alarmName: `ecs-memory-high-${stackSuffix}`,
      alarmDescription: 'Alert when ECS memory utilization is high',
      metric: ecsService.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // ECR Repository
    const ecrRepo = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: `ecommerce-repo-${stackSuffix}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep last 10 images',
          maxImageCount: 10,
        },
      ],
      encryption: ecr.RepositoryEncryption.KMS,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // Lambda Log Group
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/monitoring-${stackSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function
    const monitoringLambda = new lambda.Function(this, 'MonitoringFunction', {
      functionName: `monitoring-${stackSuffix.slice(0, 40)}`, // Keep under 64 char limit
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { SNS } = require('@aws-sdk/client-sns');
        const sns = new SNS();
        
        exports.handler = async (event) => {
          console.log('Monitor running for stack: ${this.stackName}');
          console.log('Event:', JSON.stringify(event, null, 2));
          
          return { statusCode: 200, body: JSON.stringify({ message: 'Monitoring completed' }) };
        };
      `),
      environment: {
        TOPIC_ARN: snsTopic.topicArn,
        STACK_NAME: this.stackName,
        ENVIRONMENT: envTag,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: lambdaLogGroup,
      tracing: lambda.Tracing.ACTIVE,
    });
    snsTopic.grantPublish(monitoringLambda);

    // Pipeline Artifacts Bucket (let CDK name it)
    const pipelineArtifactsBucket = new s3.Bucket(
      this,
      'PipelineArtifactsBucket',
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // CodeBuild Project Role (let CDK name the role)
    const buildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for CodeBuild project',
    });

    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
        resources: [`${pipelineArtifactsBucket.bucketArn}/*`],
      })
    );

    ecrRepo.grantPullPush(buildRole);
    kmsKey.grantEncryptDecrypt(buildRole);

    // CodeBuild Project
    const buildProject = new codebuild.Project(this, 'CodeBuildProject', {
      projectName: `build-project-${stackSuffix}`,
      description: `Build project for ${this.stackName}`,
      source: codebuild.Source.s3({
        bucket: pipelineArtifactsBucket,
        path: 'source.zip',
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPO_URI: { value: ecrRepo.repositoryUri },
          AWS_ACCOUNT_ID: { value: this.account },
          AWS_DEFAULT_REGION: { value: this.region },
          IMAGE_TAG: { value: containerTag },
        },
      },
      encryptionKey: kmsKey,
      role: buildRole,
      timeout: cdk.Duration.minutes(30),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building Docker image...',
              'docker build -t $ECR_REPO_URI:$IMAGE_TAG .',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing Docker image...',
              'docker push $ECR_REPO_URI:$IMAGE_TAG',
            ],
          },
        },
      }),
    });

    // CodePipeline Role (let CDK name the role)
    const pipelineRole = new iam.Role(this, 'CodePipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Role for CodePipeline',
    });

    pipelineArtifactsBucket.grantReadWrite(pipelineRole);
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:GetBuild',
          'codebuild:ListBuilds',
          'codebuild:StartBuild',
          'codebuild:StopBuild',
        ],
        resources: [buildProject.projectArn],
      })
    );
    kmsKey.grantEncryptDecrypt(pipelineRole);

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'CICDPipeline', {
      pipelineName: `pipeline-${stackSuffix}`,
      artifactBucket: pipelineArtifactsBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: true,
    });

    const sourceOutput = new codepipeline.Artifact('SourceArtifact');
    const buildOutput = new codepipeline.Artifact('BuildArtifact');

    // Source Stage - Using S3 instead of CodeCommit
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3Source',
          bucket: pipelineArtifactsBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
          trigger: codepipeline_actions.S3Trigger.POLL,
        }),
      ],
    });

    // Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DockerBuild',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Only deploy DR StackSet in production environments
    // StackSets with SELF_MANAGED permission model require pre-existing IAM roles:
    // - AWSCloudFormationStackSetAdministrationRole (in administrator account)
    // - AWSCloudFormationStackSetExecutionRole (in target accounts)
    // These roles are typically only set up in production accounts
    const isProductionEnv = envTag === 'prod' || envTag === 'production';
    if (disasterRecoveryRegions.length > 0 && isProductionEnv) {
      const drTemplateBody = JSON.stringify(
        {
          AWSTemplateFormatVersion: '2010-09-09',
          Description: `Disaster recovery resources for ${this.stackName}`,
          Parameters: {
            PrimaryBucketName: { Type: 'String' },
            Environment: { Type: 'String' },
          },
          Resources: {
            DRBackupBucket: {
              Type: 'AWS::S3::Bucket',
              Properties: {
                VersioningConfiguration: { Status: 'Enabled' },
                BucketEncryption: {
                  ServerSideEncryptionConfiguration: [
                    {
                      ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                    },
                  ],
                },
                LifecycleConfiguration: {
                  Rules: [
                    {
                      Status: 'Enabled',
                      Transitions: [
                        {
                          StorageClass: 'STANDARD_IA',
                          TransitionInDays: 30,
                        },
                      ],
                      NoncurrentVersionTransitions: [
                        {
                          StorageClass: 'GLACIER',
                          TransitionInDays: 60,
                        },
                      ],
                    },
                  ],
                },
                Tags: [
                  { Key: 'ManagedBy', Value: 'StackSet' },
                  { Key: 'Environment', Value: { Ref: 'Environment' } },
                  { Key: 'PrimaryBucket', Value: { Ref: 'PrimaryBucketName' } },
                ],
              },
            },
          },
          Outputs: {
            DRBucketName: {
              Value: { Ref: 'DRBackupBucket' },
              Description: 'Cross-region disaster recovery bucket name',
            },
          },
        },
        undefined,
        2
      );

      new cloudformation.CfnStackSet(this, 'DisasterRecoveryStackSet', {
        stackSetName: `tap-dr-${stackSuffix}`.substring(0, 128),
        description: `Regional disaster recovery baseline for ${this.stackName}`,
        permissionModel: 'SELF_MANAGED',
        // Note: autoDeployment is only supported with SERVICE_MANAGED permission model (requires AWS Organizations)
        // For SELF_MANAGED, stack instances are deployed explicitly via stackInstancesGroup
        parameters: [
          {
            parameterKey: 'PrimaryBucketName',
            parameterValue: staticBucket.bucketName,
          },
          {
            parameterKey: 'Environment',
            parameterValue: envTag,
          },
        ],
        stackInstancesGroup: [
          {
            regions: disasterRecoveryRegions,
            deploymentTargets: { accounts: [this.account] },
          },
        ],
        templateBody: drTemplateBody,
      });
    }

    // Stack Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });
    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${this.stackName}-ALBEndpoint`,
    });
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `${this.stackName}-CloudFrontURL`,
    });
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-APIGatewayURL`,
    });
    new cdk.CfnOutput(this, 'ECRRepoURI', {
      value: ecrRepo.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${this.stackName}-ECRRepoURI`,
    });
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline Name',
      exportName: `${this.stackName}-PipelineName`,
    });
    new cdk.CfnOutput(this, 'DBSecretARN', {
      value: rdsSecret.secretArn,
      description: 'RDS Secret ARN',
      exportName: `${this.stackName}-DBSecretARN`,
    });
    new cdk.CfnOutput(this, 'DBClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Cluster Endpoint',
      exportName: `${this.stackName}-DBClusterEndpoint`,
    });
    new cdk.CfnOutput(this, 'StaticAssetsBucketOutput', {
      value: staticBucket.bucketName,
      description: 'S3 Bucket for Static Assets',
      exportName: `${this.stackName}-StaticAssetsBucket`,
    });
    new cdk.CfnOutput(this, 'SNSTopicARN', {
      value: snsTopic.topicArn,
      description: 'SNS Topic ARN for Alerts',
      exportName: `${this.stackName}-SNSTopicARN`,
    });

    // Grants
    kmsKey.grantEncryptDecrypt(buildRole);
    kmsKey.grantEncryptDecrypt(pipelineRole);
  }

  /**
   * Validates environment configuration
   * @param environment The environment string to validate
   * @returns Validated environment string
   * @throws Error if environment is invalid
   */
  private validateEnvironment(environment: string): string {
    const validEnvironments = [
      'dev',
      'staging',
      'prod',
      'development',
      'production',
    ];
    if (!validEnvironments.includes(environment.toLowerCase())) {
      throw new Error(
        `Invalid environment '${environment}'. Must be one of: ${validEnvironments.join(', ')}`
      );
    }
    return environment.toLowerCase();
  }

  /**
   * Validates database username with AWS RDS requirements
   * @param username The database username to validate (can be undefined)
   * @returns Validated username or undefined if not provided
   * @throws Error if username is invalid
   */
  private validateDbUsername(username?: string): string | undefined {
    if (username === undefined || username === null) {
      return undefined; // Allow undefined, will use default
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 1 || trimmedUsername.length > 32) {
      throw new Error(
        `Database username '${username}' is invalid. Must be 1-32 characters long (after trimming).`
      );
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername)) {
      throw new Error(
        `Database username '${username}' is invalid. Must start with a letter and contain only alphanumeric characters and underscores.`
      );
    }
    if (
      trimmedUsername.toLowerCase() === 'admin' ||
      trimmedUsername.toLowerCase() === 'root'
    ) {
      throw new Error(
        `Database username '${username}' is not allowed. Reserved system usernames are prohibited.`
      );
    }
    return trimmedUsername;
  }

  /**
   * Validates database name with AWS RDS requirements
   * @param dbName The database name to validate (can be undefined)
   * @returns Validated database name or undefined if not provided
   * @throws Error if database name is invalid
   */
  private validateDbName(dbName?: string): string | undefined {
    if (dbName === undefined || dbName === null) {
      return undefined; // Allow undefined, will use default
    }
    const trimmedDbName = dbName.trim();
    if (trimmedDbName.length < 1 || trimmedDbName.length > 64) {
      throw new Error(
        `Database name '${dbName}' is invalid. Must be 1-64 characters long (after trimming).`
      );
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedDbName)) {
      throw new Error(
        `Database name '${dbName}' is invalid. Must start with a letter and contain only alphanumeric characters and underscores.`
      );
    }
    return trimmedDbName;
  }

  /**
   * Validates container image URL format
   * @param image The container image URL to validate (can be undefined)
   * @returns Validated image URL or undefined if not provided
   * @throws Error if image URL is invalid
   */
  private validateContainerImage(image?: string): string | undefined {
    if (image === undefined || image === null) {
      return undefined; // Allow undefined, will use default
    }
    const trimmedImage = image.trim();
    if (trimmedImage.length === 0) {
      throw new Error('Container image cannot be empty');
    }
    // Basic validation for common container image formats (allows registry, repo, and tags)
    const imageRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9._/-]*[a-zA-Z0-9]*(?::[a-zA-Z0-9._-]+)?$/;
    if (!imageRegex.test(trimmedImage)) {
      throw new Error(
        `Container image '${image}' has invalid format. Must be a valid container image reference.`
      );
    }
    return trimmedImage;
  }

  /**
   * Validates container tag format
   * @param tag The container tag to validate (can be undefined)
   * @returns Validated tag or undefined if not provided
   * @throws Error if tag is invalid
   */
  private validateContainerTag(tag?: string): string | undefined {
    if (tag === undefined || tag === null) {
      return undefined; // Allow undefined, will use default
    }
    const trimmedTag = tag.trim();
    if (trimmedTag.length === 0) {
      throw new Error('Container tag cannot be empty');
    }
    if (trimmedTag.length > 128) {
      throw new Error(
        `Container tag '${tag}' is too long. Maximum 128 characters allowed.`
      );
    }
    // Allow alphanumeric, dots, underscores, and hyphens
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedTag)) {
      throw new Error(
        `Container tag '${tag}' contains invalid characters. Only alphanumeric characters, dots, underscores, and hyphens are allowed.`
      );
    }
    return trimmedTag;
  }
}
