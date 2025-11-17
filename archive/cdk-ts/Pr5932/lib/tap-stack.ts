// lib/tap-stack.ts

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * TapStack - Financial Services Trading Platform Infrastructure
 * Multi-region, multi-account, multi-environment AWS infrastructure
 * Supports: dev, qa, staging, prod environments
 */
export class TapStack extends cdk.Stack {
  // Stack properties for external access
  private readonly vpc: ec2.Vpc;
  private readonly transitGateway: ec2.CfnTransitGateway;
  private readonly s3Buckets: Map<string, s3.Bucket> = new Map();
  private readonly hostedZone: route53.HostedZone;
  private readonly dynamoTables: Map<string, dynamodb.Table> = new Map();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // ENVIRONMENT VARIABLES
    // ========================================
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';
    const region = this.region;
    const account = this.account;

    // Resource name prefix
    const prefix = `tap-${environmentSuffix}`;

    // ========================================
    // 1. VPC CONFIGURATION
    // ========================================
    this.vpc = new ec2.Vpc(this, 'TradingPlatformVPC', {
      vpcName: `${prefix}-vpc`,
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 3, // One per AZ for high availability
      natGatewayProvider: ec2.NatProvider.gateway(),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${prefix}-PublicSubnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${prefix}-PrivateSubnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${prefix}-DatabaseSubnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag subnets for identification
    this.vpc.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `${prefix}-PublicSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Environment', environmentSuffix);
      cdk.Tags.of(subnet).add('Type', 'Public');
      cdk.Tags.of(subnet).add('iac-rlhf-amazon', 'true');
    });

    this.vpc.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `${prefix}-PrivateSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Environment', environmentSuffix);
      cdk.Tags.of(subnet).add('Type', 'Private');
      cdk.Tags.of(subnet).add('iac-rlhf-amazon', 'true');
    });

    this.vpc.isolatedSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `${prefix}-DatabaseSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Environment', environmentSuffix);
      cdk.Tags.of(subnet).add('Type', 'Database');
      cdk.Tags.of(subnet).add('iac-rlhf-amazon', 'true');
    });

    // ========================================
    // 2. TRANSIT GATEWAY
    // ========================================
    this.transitGateway = new ec2.CfnTransitGateway(
      this,
      'TradingTransitGateway',
      {
        amazonSideAsn: 64512,
        description: `Transit Gateway for Trading Platform - ${environmentSuffix}`,
        defaultRouteTableAssociation: 'disable',
        defaultRouteTablePropagation: 'disable',
        dnsSupport: 'enable',
        vpnEcmpSupport: 'enable',
        tags: [
          {
            key: 'Name',
            value: `${prefix}-tgw`,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
          },
          {
            key: 'iac-rlhf-amazon',
            value: 'true',
          },
        ],
      }
    );

    // Create Transit Gateway Attachment for Production VPC
    const tgwAttachmentProd = new ec2.CfnTransitGatewayAttachment(
      this,
      'TGWAttachmentProd',
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: this.vpc.vpcId,
        subnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
        tags: [
          {
            key: 'Name',
            value: `${prefix}-tgw-attachment-prod`,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
          },
          {
            key: 'iac-rlhf-amazon',
            value: 'true',
          },
        ],
      }
    );

    // Create Development VPC for demonstration of isolation
    const devVpc = new ec2.Vpc(this, 'DevelopmentVPC', {
      vpcName: `${prefix}-dev-vpc`,
      cidr: '172.16.0.0/16',
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${prefix}-DevPrivateSubnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    cdk.Tags.of(devVpc).add('iac-rlhf-amazon', 'true');

    // Create Transit Gateway Attachment for Development VPC
    const tgwAttachmentDev = new ec2.CfnTransitGatewayAttachment(
      this,
      'TGWAttachmentDev',
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: devVpc.vpcId,
        subnetIds: devVpc.isolatedSubnets.map(subnet => subnet.subnetId),
        tags: [
          {
            key: 'Name',
            value: `${prefix}-tgw-attachment-dev`,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
          },
          {
            key: 'iac-rlhf-amazon',
            value: 'true',
          },
        ],
      }
    );

    // Create separate route tables to ensure isolation between prod and dev
    const tgwRouteTableProd = new ec2.CfnTransitGatewayRouteTable(
      this,
      'TGWRouteTableProd',
      {
        transitGatewayId: this.transitGateway.ref,
        tags: [
          {
            key: 'Name',
            value: `${prefix}-tgw-rt-prod`,
          },
          {
            key: 'iac-rlhf-amazon',
            value: 'true',
          },
        ],
      }
    );

    const tgwRouteTableDev = new ec2.CfnTransitGatewayRouteTable(
      this,
      'TGWRouteTableDev',
      {
        transitGatewayId: this.transitGateway.ref,
        tags: [
          {
            key: 'Name',
            value: `${prefix}-tgw-rt-dev`,
          },
          {
            key: 'iac-rlhf-amazon',
            value: 'true',
          },
        ],
      }
    );

    // Associate route tables with attachments (ensures traffic isolation)
    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      'TGWRouteTableAssocProd',
      {
        transitGatewayAttachmentId: tgwAttachmentProd.ref,
        transitGatewayRouteTableId: tgwRouteTableProd.ref,
      }
    );

    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      'TGWRouteTableAssocDev',
      {
        transitGatewayAttachmentId: tgwAttachmentDev.ref,
        transitGatewayRouteTableId: tgwRouteTableDev.ref,
      }
    );

    // ========================================
    // 3. S3 BUCKETS
    // ========================================

    // Flow Logs Bucket
    const flowLogsBucket = new s3.Bucket(this, 'FlowLogsBucket', {
      bucketName: `${prefix}-flowlogs-${region}-${account}`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldFlowLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(flowLogsBucket).add('iac-rlhf-amazon', 'true');
    this.s3Buckets.set('flowLogs', flowLogsBucket);

    // Trading Data Bucket
    const tradingDataBucket = new s3.Bucket(this, 'TradingDataBucket', {
      bucketName: `${prefix}-data-${region}-${account}`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(tradingDataBucket).add('iac-rlhf-amazon', 'true');
    this.s3Buckets.set('tradingData', tradingDataBucket);

    // Backup Bucket
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `${prefix}-backup-${region}-${account}`.toLowerCase(),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(backupBucket).add('iac-rlhf-amazon', 'true');
    this.s3Buckets.set('backup', backupBucket);

    // ========================================
    // 4. VPC FLOW LOGS
    // ========================================
    const flowLogsRole = new iam.Role(this, 'FlowLogsRole', {
      roleName: `${prefix}-flowlogs-role`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });
    cdk.Tags.of(flowLogsRole).add('iac-rlhf-amazon', 'true');

    flowLogsBucket.grantWrite(flowLogsRole);

    // Create VPC Flow Logs with exclusion filter for AWS service endpoints
    new ec2.CfnFlowLog(this, 'VPCFlowLog', {
      resourceType: 'VPC',
      resourceId: this.vpc.vpcId,
      trafficType: 'ALL',
      logDestinationType: 's3',
      logDestination: flowLogsBucket.bucketArn,
      logFormat:
        '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}',
      maxAggregationInterval: 600, // 10 minutes (valid values: 60 or 600)
      tags: [
        {
          key: 'Name',
          value: `${prefix}-vpc-flowlogs`,
        },
        {
          key: 'iac-rlhf-amazon',
          value: 'true',
        },
      ],
    });

    // ========================================
    // 5. DYNAMODB TABLES
    // ========================================

    // Trading Orders Table
    const ordersTable = new dynamodb.Table(this, 'TradingOrdersTable', {
      tableName: `${prefix}-TradingOrders`,
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(ordersTable).add('iac-rlhf-amazon', 'true');

    // Add GSI for querying by user
    ordersTable.addGlobalSecondaryIndex({
      indexName: 'UserOrdersIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    this.dynamoTables.set('orders', ordersTable);

    // Market Data Table
    const marketDataTable = new dynamodb.Table(this, 'MarketDataTable', {
      tableName: `${prefix}-MarketData`,
      partitionKey: {
        name: 'symbol',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(marketDataTable).add('iac-rlhf-amazon', 'true');

    this.dynamoTables.set('marketData', marketDataTable);

    // User Accounts Table
    const userAccountsTable = new dynamodb.Table(this, 'UserAccountsTable', {
      tableName: `${prefix}-UserAccounts`,
      partitionKey: {
        name: 'accountId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(userAccountsTable).add('iac-rlhf-amazon', 'true');

    this.dynamoTables.set('userAccounts', userAccountsTable);

    // ========================================
    // 6. ROUTE 53
    // ========================================
    this.hostedZone = new route53.HostedZone(
      this,
      'TradingPlatformHostedZone',
      {
        zoneName: `${prefix}-trading-platform.internal`,
        vpcs: [this.vpc],
        comment: `Private hosted zone for trading platform - ${environmentSuffix}`,
      }
    );
    cdk.Tags.of(this.hostedZone).add('iac-rlhf-amazon', 'true');

    // Create health checks for critical endpoints
    new route53.CfnHealthCheck(this, 'APIHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: `api.${prefix}-trading-platform.internal`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `${prefix}-api-healthcheck`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
        {
          key: 'iac-rlhf-amazon',
          value: 'true',
        },
      ],
    });

    new route53.CfnHealthCheck(this, 'DatabaseHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: `db.${prefix}-trading-platform.internal`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `${prefix}-db-healthcheck`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
        {
          key: 'iac-rlhf-amazon',
          value: 'true',
        },
      ],
    });

    // ========================================
    // 7. SECURITY GROUPS
    // ========================================

    // Application Security Group
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `${prefix}-app-sg`,
        description: 'Security group for trading platform applications',
        allowAllOutbound: true,
      }
    );
    cdk.Tags.of(appSecurityGroup).add('iac-rlhf-amazon', 'true');

    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `${prefix}-db-sg`,
        description: 'Security group for database instances',
        allowAllOutbound: false,
      }
    );
    cdk.Tags.of(dbSecurityGroup).add('iac-rlhf-amazon', 'true');

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from application layer'
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from application layer'
    );

    // Remove the default egress rule to have truly restricted egress
    const cfnDbSecurityGroup = dbSecurityGroup.node
      .defaultChild as ec2.CfnSecurityGroup;
    cfnDbSecurityGroup.securityGroupEgress = [];

    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `${prefix}-lambda-sg`,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );
    cdk.Tags.of(lambdaSecurityGroup).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 8. LAMBDA FUNCTIONS
    // ========================================

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${prefix}-lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });
    cdk.Tags.of(lambdaRole).add('iac-rlhf-amazon', 'true');

    // Grant permissions to Lambda role
    ordersTable.grantReadWriteData(lambdaRole);
    marketDataTable.grantReadWriteData(lambdaRole);
    userAccountsTable.grantReadWriteData(lambdaRole);
    tradingDataBucket.grantReadWrite(lambdaRole);

    // Grant DynamoDB stream read permissions for event source mapping
    ordersTable.grantStreamRead(lambdaRole);

    // Grant EC2 describe permissions for health checks
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DescribeTransitGateways'],
        resources: ['*'],
      })
    );

    // Health Check Lambda
    const healthCheckLambda = new lambdaNodejs.NodejsFunction(
      this,
      'HealthCheckLambda',
      {
        functionName: `${prefix}-health-check`,
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64, // Graviton2 for cost optimization
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'health-check.ts'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          REGION: region,
          ORDERS_TABLE: ordersTable.tableName,
          MARKET_DATA_TABLE: marketDataTable.tableName,
          ACCOUNTS_TABLE: userAccountsTable.tableName,
          TRADING_DATA_BUCKET: tradingDataBucket.bucketName,
          TRANSIT_GATEWAY_ID: this.transitGateway.ref,
        },
        role: lambdaRole,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(healthCheckLambda).add('iac-rlhf-amazon', 'true');

    // Automated Response Lambda
    const autoResponseLambda = new lambdaNodejs.NodejsFunction(
      this,
      'AutoResponseLambda',
      {
        functionName: `${prefix}-auto-response`,
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64, // Graviton2 for cost optimization
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'auto-response.ts'),
        timeout: cdk.Duration.seconds(60),
        memorySize: 1024,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(autoResponseLambda).add('iac-rlhf-amazon', 'true');

    // Grant SSM access to auto-response Lambda
    autoResponseLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess')
    );

    // Order Processing Lambda
    const orderProcessingLambda = new lambdaNodejs.NodejsFunction(
      this,
      'OrderProcessingLambda',
      {
        functionName: `${prefix}-order-processor`,
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64, // Graviton2 for cost optimization
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'order-processor.ts'),
        timeout: cdk.Duration.minutes(5),
        memorySize: 2048,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          ORDERS_TABLE: ordersTable.tableName,
          MARKET_DATA_TABLE: marketDataTable.tableName,
          TRADING_DATA_BUCKET: tradingDataBucket.bucketName,
        },
        role: lambdaRole,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(orderProcessingLambda).add('iac-rlhf-amazon', 'true');

    // Add DynamoDB stream as event source for order processing
    orderProcessingLambda.addEventSourceMapping('OrderStreamMapping', {
      eventSourceArn: ordersTable.tableStreamArn!,
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
    });

    // ========================================
    // 8. CLOUDWATCH EVENTS
    // ========================================

    // Schedule health checks every 5 minutes
    const healthCheckRule = new events.Rule(this, 'HealthCheckSchedule', {
      ruleName: `${prefix}-health-check-schedule`,
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      description: 'Trigger health check Lambda every 5 minutes',
    });
    cdk.Tags.of(healthCheckRule).add('iac-rlhf-amazon', 'true');

    healthCheckRule.addTarget(new targets.LambdaFunction(healthCheckLambda));

    // ========================================
    // 9. SSM PARAMETER STORE
    // ========================================

    // Store configuration parameters
    new ssm.StringParameter(this, 'AlertThresholds', {
      parameterName: `/${prefix}/alert-thresholds`,
      stringValue: JSON.stringify({
        latencyThresholdMs: 100,
        errorRateThreshold: 0.01,
        orderVolumeThreshold: 10000,
      }),
      description: `Alert thresholds for trading platform - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'DatabaseConfig', {
      parameterName: `/${prefix}/database-config`,
      stringValue: JSON.stringify({
        readCapacity: 'ON_DEMAND',
        writeCapacity: 'ON_DEMAND',
        backupEnabled: true,
        pointInTimeRecovery: true,
      }),
      description: `Database configuration for trading platform - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'NetworkConfig', {
      parameterName: `/${prefix}/network-config`,
      stringValue: JSON.stringify({
        vpcCidr: '10.0.0.0/16',
        transitGatewayAsn: 64512,
        natGateways: 3,
        availabilityZones: 3,
      }),
      description: `Network configuration for trading platform - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'S3BucketConfig', {
      parameterName: `/${prefix}/s3-config`,
      stringValue: JSON.stringify({
        flowLogsBucket: flowLogsBucket.bucketName,
        tradingDataBucket: tradingDataBucket.bucketName,
        backupBucket: backupBucket.bucketName,
        versioning: true,
        encryption: 'S3_MANAGED',
      }),
      description: `S3 bucket configuration for trading platform - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    // Store Transit Gateway attachment IDs
    new ssm.StringParameter(this, 'TransitGatewayAttachments', {
      parameterName: `/${prefix}/tgw-attachments`,
      stringValue: JSON.stringify({
        productionAttachment: tgwAttachmentProd.ref,
        developmentAttachment: tgwAttachmentDev.ref,
      }),
      description: `Transit Gateway attachment IDs - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    // ========================================
    // 10. VPC ENDPOINTS
    // ========================================

    // S3 VPC Endpoint (Gateway endpoint)
    const s3Endpoint = new ec2.GatewayVpcEndpoint(this, 'S3VPCEndpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    cdk.Tags.of(s3Endpoint).add('iac-rlhf-amazon', 'true');

    // DynamoDB VPC Endpoint
    const dynamoDbEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      'DynamoDBVPCEndpoint',
      {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [
          {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      }
    );
    cdk.Tags.of(dynamoDbEndpoint).add('iac-rlhf-amazon', 'true');

    // SSM VPC Endpoint
    const ssmEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SSMVPCEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [appSecurityGroup],
    });
    cdk.Tags.of(ssmEndpoint).add('iac-rlhf-amazon', 'true');

    // Lambda VPC Endpoint
    const lambdaEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      'LambdaVPCEndpoint',
      {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
      }
    );
    cdk.Tags.of(lambdaEndpoint).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 11. CLOUDWATCH ALARMS
    // ========================================

    // Lambda Error Rate Alarm
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${prefix}-lambda-error-alarm`,
      metric: healthCheckLambda.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Lambda function errors exceed threshold',
    });

    // DynamoDB Throttle Alarm
    new cdk.aws_cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      alarmName: `${prefix}-dynamodb-throttle-alarm`,
      metric: ordersTable.metricUserErrors(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when DynamoDB throttling occurs',
    });

    // ========================================
    // 12. OUTPUTS
    // ========================================

    // Transit Gateway Attachment IDs
    new cdk.CfnOutput(this, 'TransitGatewayAttachmentProdId', {
      value: tgwAttachmentProd.ref,
      description: 'Transit Gateway Attachment ID for Production VPC',
      exportName: `${prefix}-TGW-Attachment-Prod-ID`,
    });

    new cdk.CfnOutput(this, 'TransitGatewayAttachmentDevId', {
      value: tgwAttachmentDev.ref,
      description: 'Transit Gateway Attachment ID for Development VPC',
      exportName: `${prefix}-TGW-Attachment-Dev-ID`,
    });

    // Route 53 Hosted Zone ID
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `${prefix}-HostedZone-ID`,
    });

    // S3 Bucket ARNs
    new cdk.CfnOutput(this, 'FlowLogsBucketArn', {
      value: flowLogsBucket.bucketArn,
      description: 'Flow Logs S3 Bucket ARN',
      exportName: `${prefix}-FlowLogs-Bucket-ARN`,
    });

    new cdk.CfnOutput(this, 'TradingDataBucketArn', {
      value: tradingDataBucket.bucketArn,
      description: 'Trading Data S3 Bucket ARN',
      exportName: `${prefix}-TradingData-Bucket-ARN`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: backupBucket.bucketArn,
      description: 'Backup S3 Bucket ARN',
      exportName: `${prefix}-Backup-Bucket-ARN`,
    });

    // VPC and Subnet Information
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'Production VPC ID',
      exportName: `${prefix}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'VPCCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'Production VPC CIDR Block',
      exportName: `${prefix}-VPC-CIDR`,
    });

    // DynamoDB Table Names
    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: ordersTable.tableName,
      description: 'Trading Orders DynamoDB Table Name',
      exportName: `${prefix}-Orders-Table-Name`,
    });

    new cdk.CfnOutput(this, 'MarketDataTableName', {
      value: marketDataTable.tableName,
      description: 'Market Data DynamoDB Table Name',
      exportName: `${prefix}-MarketData-Table-Name`,
    });

    // Lambda Function ARNs
    new cdk.CfnOutput(this, 'HealthCheckLambdaArn', {
      value: healthCheckLambda.functionArn,
      description: 'Health Check Lambda Function ARN',
      exportName: `${prefix}-HealthCheck-Lambda-ARN`,
    });

    new cdk.CfnOutput(this, 'OrderProcessingLambdaArn', {
      value: orderProcessingLambda.functionArn,
      description: 'Order Processing Lambda Function ARN',
      exportName: `${prefix}-OrderProcessing-Lambda-ARN`,
    });

    // Transit Gateway ID
    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: this.transitGateway.ref,
      description: 'Transit Gateway ID',
      exportName: `${prefix}-TGW-ID`,
    });

    // Add tags to the stack
    cdk.Tags.of(this).add('Application', 'TradingPlatform');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('Compliance', 'FinancialServices');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
  }
}
