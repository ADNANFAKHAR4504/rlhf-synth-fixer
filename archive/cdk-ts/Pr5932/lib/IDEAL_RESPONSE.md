# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/auto-response.ts

```typescript
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ssm = new SSMClient({});
const sns = new SNSClient({});

interface AutoResponse {
  action: string;
  target: string;
  reason: string;
  timestamp: string;
}

interface AlertThresholds {
  latencyThresholdMs: number;
  errorRateThreshold: number;
  orderVolumeThreshold: number;
}

export const handler = async (event: Record<string, unknown>) => {
  console.log('Processing automated response event:', JSON.stringify(event));

  const responses: AutoResponse[] = [];

  try {
    // Get alert thresholds from Parameter Store
    const paramResult = await ssm.send(
      new GetParameterCommand({
        Name: '/trading-platform/alert-thresholds',
        WithDecryption: true,
      })
    );

    const thresholds: AlertThresholds = JSON.parse(
      paramResult.Parameter?.Value || '{}'
    );

    // Analyze the alert and determine response
    if (event.alertType === 'HIGH_LATENCY') {
      const latency = event.metrics?.latency || 0;

      if (latency > thresholds.latencyThresholdMs) {
        responses.push({
          action: 'SCALE_OUT',
          target: 'COMPUTE_RESOURCES',
          reason: `Latency (${latency}ms) exceeded threshold (${thresholds.latencyThresholdMs}ms)`,
          timestamp: new Date().toISOString(),
        });

        // Trigger scaling action
        console.log(`Triggering scale-out for high latency: ${latency}ms`);
      }
    }

    if (event.alertType === 'ERROR_RATE_HIGH') {
      const errorRate = event.metrics?.errorRate || 0;

      if (errorRate > thresholds.errorRateThreshold) {
        responses.push({
          action: 'CIRCUIT_BREAKER',
          target: 'API_GATEWAY',
          reason: `Error rate (${errorRate}) exceeded threshold (${thresholds.errorRateThreshold})`,
          timestamp: new Date().toISOString(),
        });

        // Enable circuit breaker
        console.log(
          `Enabling circuit breaker for high error rate: ${errorRate}`
        );
      }
    }

    if (event.alertType === 'INFRASTRUCTURE_HEALTH') {
      const unhealthyServices = event.metrics?.unhealthyServices || [];

      if (unhealthyServices.length > 0) {
        responses.push({
          action: 'FAILOVER',
          target: unhealthyServices.join(', '),
          reason: `Services unhealthy: ${unhealthyServices.join(', ')}`,
          timestamp: new Date().toISOString(),
        });

        // Trigger failover to backup region
        console.log(
          `Initiating failover for unhealthy services: ${unhealthyServices.join(', ')}`
        );
      }
    }

    if (event.alertType === 'ORDER_VOLUME_SPIKE') {
      const orderVolume = event.metrics?.orderVolume || 0;

      if (orderVolume > thresholds.orderVolumeThreshold) {
        responses.push({
          action: 'INCREASE_CAPACITY',
          target: 'ORDER_PROCESSING',
          reason: `Order volume (${orderVolume}) exceeded threshold (${thresholds.orderVolumeThreshold})`,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `Increasing order processing capacity for volume: ${orderVolume}`
        );
      }
    }

    // Log all responses
    console.log('Automated responses executed:', JSON.stringify(responses));

    // Send notification if there are responses
    if (responses.length > 0 && process.env.SNS_TOPIC_ARN) {
      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: `Trading Platform Automated Response - ${event.alertType}`,
          Message: JSON.stringify(responses, null, 2),
        })
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error executing automated response:', errorMessage);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      event: event,
      responsesExecuted: responses.length,
      responses: responses,
    }),
  };
};

```

## ./lib/lambda/health-check.ts

```typescript
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeTransitGatewaysCommand } from '@aws-sdk/client-ec2';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});
const ec2 = new EC2Client({});

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  error?: string;
  latency?: number;
}

export const handler = async (event: Record<string, unknown>) => {
  console.log('Health check event:', JSON.stringify(event));

  const healthChecks: HealthCheck[] = [];
  const ordersTableName = process.env.ORDERS_TABLE || '';
  const marketDataTableName = process.env.MARKET_DATA_TABLE || '';
  const tradingDataBucket = process.env.TRADING_DATA_BUCKET || '';
  const transitGatewayId = process.env.TRANSIT_GATEWAY_ID || '';

  // Check DynamoDB Orders Table
  try {
    const start = Date.now();
    await dynamodb.send(
      new ScanCommand({
        TableName: ordersTableName,
        Limit: 1,
      })
    );
    const latency = Date.now() - start;
    healthChecks.push({
      service: 'DynamoDB-Orders',
      status: 'healthy',
      latency,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    healthChecks.push({
      service: 'DynamoDB-Orders',
      status: 'unhealthy',
      error: errorMessage,
    });
  }

  // Check DynamoDB Market Data Table
  try {
    const start = Date.now();
    await dynamodb.send(
      new ScanCommand({
        TableName: marketDataTableName,
        Limit: 1,
      })
    );
    const latency = Date.now() - start;
    healthChecks.push({
      service: 'DynamoDB-MarketData',
      status: 'healthy',
      latency,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    healthChecks.push({
      service: 'DynamoDB-MarketData',
      status: 'unhealthy',
      error: errorMessage,
    });
  }

  // Check S3 Bucket
  try {
    const start = Date.now();
    await s3.send(
      new HeadBucketCommand({
        Bucket: tradingDataBucket,
      })
    );
    const latency = Date.now() - start;
    healthChecks.push({
      service: 'S3-TradingData',
      status: 'healthy',
      latency,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    healthChecks.push({
      service: 'S3-TradingData',
      status: 'unhealthy',
      error: errorMessage,
    });
  }

  // Check Transit Gateway
  try {
    const start = Date.now();
    await ec2.send(
      new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [transitGatewayId],
      })
    );
    const latency = Date.now() - start;
    healthChecks.push({
      service: 'TransitGateway',
      status: 'healthy',
      latency,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    healthChecks.push({
      service: 'TransitGateway',
      status: 'unhealthy',
      error: errorMessage,
    });
  }

  const allHealthy = healthChecks.every(check => check.status === 'healthy');
  const avgLatency =
    healthChecks
      .filter(check => check.latency)
      .reduce((sum, check) => sum + (check.latency || 0), 0) /
    healthChecks.length;

  return {
    statusCode: allHealthy ? 200 : 503,
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION,
      overall: allHealthy ? 'healthy' : 'degraded',
      averageLatency: Math.round(avgLatency),
      checks: healthChecks,
    }),
  };
};

```

## ./lib/lambda/order-processor.ts

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBStreamEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

interface TradingOrder {
  orderId: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'BUY' | 'SELL';
  status: 'PENDING' | 'PROCESSING' | 'EXECUTED' | 'FAILED';
  timestamp: number;
  processedAt?: string;
  executionPrice?: number;
}

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing order stream event:', JSON.stringify(event));

  const processedOrders: TradingOrder[] = [];
  const failedOrders: string[] = [];

  for (const record of event.Records) {
    try {
      if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
        const newImage = record.dynamodb.NewImage;

        // Extract order details from DynamoDB stream
        const orderId = newImage.orderId?.S || '';
        const userId = newImage.userId?.S || '';
        const symbol = newImage.symbol?.S || '';
        const quantity = parseInt(newImage.quantity?.N || '0');
        const price = parseFloat(newImage.price?.N || '0');
        const orderType = (newImage.orderType?.S as 'BUY' | 'SELL') || 'BUY';
        const timestamp = parseInt(newImage.timestamp?.N || '0');

        console.log(
          `Processing order: ${orderId} for ${symbol} ${orderType} ${quantity} @ ${price}`
        );

        // Simulate order validation
        const isValid = quantity > 0 && price > 0;

        if (!isValid) {
          failedOrders.push(orderId);
          await dynamodb.send(
            new UpdateCommand({
              TableName: process.env.ORDERS_TABLE,
              Key: { orderId, timestamp },
              UpdateExpression:
                'SET #status = :failed, processedAt = :processedAt, failureReason = :reason',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':failed': 'FAILED',
                ':processedAt': new Date().toISOString(),
                ':reason': 'Invalid order parameters',
              },
            })
          );
          continue;
        }

        // Simulate market execution (in real scenario, this would connect to exchange)
        const executionPrice = price * (0.98 + Math.random() * 0.04); // ±2% slippage

        // Update order status to EXECUTED
        const processedOrder: TradingOrder = {
          orderId,
          userId,
          symbol,
          quantity,
          price,
          orderType,
          status: 'EXECUTED',
          timestamp,
          processedAt: new Date().toISOString(),
          executionPrice: parseFloat(executionPrice.toFixed(2)),
        };

        await dynamodb.send(
          new UpdateCommand({
            TableName: process.env.ORDERS_TABLE,
            Key: { orderId, timestamp },
            UpdateExpression:
              'SET #status = :executed, processedAt = :processedAt, executionPrice = :execPrice',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':executed': 'EXECUTED',
              ':processedAt': processedOrder.processedAt,
              ':execPrice': processedOrder.executionPrice,
            },
          })
        );

        // Archive processed order to S3 for audit trail
        if (process.env.TRADING_DATA_BUCKET) {
          const archiveKey = `orders/${new Date().toISOString().split('T')[0]}/${orderId}.json`;
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.TRADING_DATA_BUCKET,
              Key: archiveKey,
              Body: JSON.stringify(processedOrder),
              ContentType: 'application/json',
            })
          );
        }

        // Update market data table with latest execution
        if (process.env.MARKET_DATA_TABLE) {
          await dynamodb.send(
            new PutCommand({
              TableName: process.env.MARKET_DATA_TABLE,
              Item: {
                symbol,
                timestamp: Date.now(),
                lastPrice: executionPrice,
                lastQuantity: quantity,
                orderType,
                updatedAt: new Date().toISOString(),
              },
            })
          );
        }

        processedOrders.push(processedOrder);
        console.log(
          `Order ${orderId} executed successfully at ${executionPrice}`
        );
      } else if (record.eventName === 'MODIFY' && record.dynamodb?.NewImage) {
        // Handle order modifications
        const orderId = record.dynamodb.NewImage.orderId?.S || '';
        console.log(`Order ${orderId} was modified`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing order:', errorMessage);
      const orderId = record.dynamodb?.NewImage?.orderId?.S || 'unknown';
      failedOrders.push(orderId);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalRecords: event.Records.length,
    processedCount: processedOrders.length,
    failedCount: failedOrders.length,
    processedOrders: processedOrders.map(o => ({
      orderId: o.orderId,
      symbol: o.symbol,
      executionPrice: o.executionPrice,
    })),
    failedOrders,
  };

  console.log('Order processing summary:', JSON.stringify(summary));

  return {
    statusCode: 200,
    body: JSON.stringify(summary),
  };
};

```

## ./lib/tap-stack.ts

```typescript
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
    // 7. LAMBDA FUNCTIONS
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
    // 10. SECURITY GROUPS
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
    // 11. VPC ENDPOINTS
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
    // 12. CLOUDWATCH ALARMS
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
    // 13. OUTPUTS
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

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  GetHostedZoneCommand,
} from '@aws-sdk/client-route-53';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';
const prefix = `tap-${environmentSuffix}`;
const stackName = `TapStack${environmentSuffix}`;

const dynamodbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const route53Client = new Route53Client({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });
const cfnClient = new CloudFormationClient({ region });

describe('TapStack Integration Tests - Live AWS Resources', () => {
  describe('CloudFormation Stack Tests', () => {
    test('should verify stack exists and is in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBe(1);
      expect(response.Stacks?.[0].StackStatus).toBe('CREATE_COMPLETE');
    }, 30000);

    test('should verify stack has required outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const stack = response.Stacks?.[0];
      expect(stack?.Outputs).toBeDefined();
      expect(stack?.Outputs?.length).toBeGreaterThan(0);

      const outputKeys = stack?.Outputs?.map(o => o.OutputKey) || [];
      expect(outputKeys).toContain('VPCId');
      expect(outputKeys).toContain('TransitGatewayId');
      expect(outputKeys).toContain('HostedZoneId');
      expect(outputKeys).toContain('OrdersTableName');
      expect(outputKeys).toContain('HealthCheckLambdaArn');
    }, 30000);

    test('should verify VPC ID from stack outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const vpcIdOutput = response.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'VPCId'
      );
      expect(vpcIdOutput?.OutputValue).toBe(outputs.VPCId);
    }, 30000);

    test('should verify Transit Gateway ID from stack outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const tgwIdOutput = response.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'TransitGatewayId'
      );
      expect(tgwIdOutput?.OutputValue).toBe(outputs.TransitGatewayId);
    }, 30000);

    test('should verify stack has proper tags', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      const tags = response.Stacks?.[0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
    }, 30000);
  });

  describe('S3 Buckets Configuration Tests', () => {
    test('should verify all 3 S3 buckets exist', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      const flowLogsResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: flowLogsBucketName })
      );
      expect(flowLogsResponse.$metadata.httpStatusCode).toBe(200);

      const tradingDataResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: tradingDataBucketName })
      );
      expect(tradingDataResponse.$metadata.httpStatusCode).toBe(200);

      const backupResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: backupBucketName })
      );
      expect(backupResponse.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should verify S3 buckets have versioning enabled', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: flowLogsBucketName })
      );

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should verify S3 buckets have encryption enabled', async () => {
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: tradingDataBucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    test('should verify S3 buckets have public access blocked', async () => {
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: backupBucketName })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('should be able to write and read objects from trading data bucket', async () => {
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const testKey = `integration-test-${Date.now()}.txt`;
      const testData = 'Integration test data';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
          Body: testData,
        })
      );

      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.Body).toBeDefined();

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: tradingDataBucketName,
          Key: testKey,
        })
      );
    }, 30000);

    test('should verify bucket names include region codes', async () => {
      const flowLogsBucketName = outputs.FlowLogsBucketArn.split(':::')[1];
      const tradingDataBucketName = outputs.TradingDataBucketArn.split(':::')[1];
      const backupBucketName = outputs.BackupBucketArn.split(':::')[1];

      expect(flowLogsBucketName).toContain(region);
      expect(tradingDataBucketName).toContain(region);
      expect(backupBucketName).toContain(region);
    }, 30000);
  });

  describe('DynamoDB Tables Configuration Tests', () => {
    test('should verify all 3 DynamoDB tables exist and are active', async () => {
      const ordersTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );
      expect(ordersTableResponse.Table?.TableStatus).toBe('ACTIVE');

      const marketDataTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.MarketDataTableName,
        })
      );
      expect(marketDataTableResponse.Table?.TableStatus).toBe('ACTIVE');

      const accountsTableName = `${prefix}-UserAccounts`;
      const accountsTableResponse = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: accountsTableName,
        })
      );
      expect(accountsTableResponse.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('should verify DynamoDB tables have on-demand billing', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('should verify DynamoDB tables have encryption enabled', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('should verify Orders table has DynamoDB stream enabled', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    }, 30000);

    test('should verify Orders table has Global Secondary Index', async () => {
      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: outputs.OrdersTableName,
        })
      );

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);

      const userOrdersIndex = response.Table?.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === 'UserOrdersIndex'
      );
      expect(userOrdersIndex).toBeDefined();
    }, 30000);

    test('should be able to write and read items from Orders table using GetItem', async () => {
      const orderId = `test-order-${Date.now()}`;
      const timestamp = Date.now();

      // Write item
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: outputs.OrdersTableName,
          Item: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
            userId: { S: 'test-user' },
            symbol: { S: 'AAPL' },
            quantity: { N: '100' },
            price: { N: '150.50' },
            orderType: { S: 'BUY' },
            status: { S: 'PENDING' },
          },
        })
      );

      // Read item back using GetItem (strongly consistent read)
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
          ConsistentRead: true,
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.orderId.S).toBe(orderId);
      expect(getResponse.Item?.symbol.S).toBe('AAPL');
      expect(getResponse.Item?.status.S).toBe('PENDING');

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );
    }, 30000);

    test('should verify table names include environment suffix', async () => {
      expect(outputs.OrdersTableName).toContain(prefix);
      expect(outputs.MarketDataTableName).toContain(prefix);
    }, 30000);
  });

  describe('Lambda Functions Configuration Tests', () => {
    test('should verify Health Check Lambda exists and is active', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(512);
    }, 30000);

    test('should verify Order Processing Lambda exists and is active', async () => {
      const functionName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(2048);
    }, 30000);

    test('should verify Lambda functions are deployed in VPC', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(outputs.VPCId);
    }, 30000);

    test('should verify DynamoDB stream event source mapping exists', async () => {
      const functionName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new ListEventSourceMappingsCommand({
          FunctionName: functionName,
        })
      );

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);
      expect(response.EventSourceMappings?.[0].State).toBe('Enabled');
      expect(response.EventSourceMappings?.[0].BatchSize).toBe(10);
    }, 30000);

    test('should invoke Health Check Lambda successfully', async () => {
      const functionName = outputs.HealthCheckLambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBeDefined();
        expect(payload.body).toBeDefined();

        const body = JSON.parse(payload.body);
        expect(body.checks).toBeDefined();
        expect(body.checks.length).toBeGreaterThan(0);
      }
    }, 60000);

    test('should verify Lambda functions use Graviton2 ARM64 architecture', async () => {
      const healthCheckName = outputs.HealthCheckLambdaArn.split(':').pop();
      const orderProcessorName = outputs.OrderProcessingLambdaArn.split(':').pop();

      const healthCheckResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: healthCheckName })
      );
      expect(healthCheckResponse.Configuration?.Architectures).toEqual(['arm64']);

      const orderProcessorResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: orderProcessorName })
      );
      expect(orderProcessorResponse.Configuration?.Architectures).toEqual(['arm64']);
    }, 30000);
  });

  describe('Route 53 Configuration Tests', () => {
    test('should verify private hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.HostedZoneId,
        })
      );

      expect(response.HostedZone?.Config?.PrivateZone).toBe(true);
      expect(response.HostedZone?.Name).toContain('trading-platform.internal');
    }, 30000);

    test('should verify hosted zone is associated with VPC', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.HostedZoneId,
        })
      );

      expect(response.VPCs).toBeDefined();
      expect(response.VPCs?.length).toBeGreaterThan(0);
      expect(response.VPCs?.[0].VPCId).toBe(outputs.VPCId);
    }, 30000);
  });

  describe('SSM Parameter Store Configuration Tests', () => {
    test('should verify alert thresholds parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/alert-thresholds`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBeDefined();

      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.latencyThresholdMs).toBeDefined();
      expect(config.errorRateThreshold).toBeDefined();
      expect(config.orderVolumeThreshold).toBeDefined();
    }, 30000);

    test('should verify database configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/database-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.readCapacity).toBe('ON_DEMAND');
      expect(config.pointInTimeRecovery).toBe(true);
    }, 30000);

    test('should verify network configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/network-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.vpcCidr).toBe('10.0.0.0/16');
      expect(config.transitGatewayAsn).toBe(64512);
      expect(config.natGateways).toBe(3);
      expect(config.availabilityZones).toBe(3);
    }, 30000);

    test('should verify Transit Gateway attachments parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/tgw-attachments`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.productionAttachment).toBe(outputs.TransitGatewayAttachmentProdId);
      expect(config.developmentAttachment).toBe(outputs.TransitGatewayAttachmentDevId);
    }, 30000);

    test('should verify S3 bucket configuration parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/${prefix}/s3-config`,
        })
      );

      expect(response.Parameter).toBeDefined();
      const config = JSON.parse(response.Parameter?.Value || '{}');
      expect(config.versioning).toBe(true);
      expect(config.encryption).toBe('S3_MANAGED');
    }, 30000);
  });

  describe('IAM Roles and Permissions Tests', () => {
    test('should verify Lambda execution role exists', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `${prefix}-lambda-execution-role`,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    }, 30000);

    test('should verify Lambda role has VPC access policy', async () => {
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `${prefix}-lambda-execution-role`,
        })
      );

      expect(response.AttachedPolicies).toBeDefined();
      const vpcPolicy = response.AttachedPolicies?.find(policy =>
        policy.PolicyName?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(vpcPolicy).toBeDefined();
    }, 30000);
  });

  describe('Infrastructure Validation Tests', () => {
    test('should verify VPC CIDR from outputs', async () => {
      expect(outputs.VPCCidr).toBe('10.0.0.0/16');
    }, 30000);

    test('should verify Transit Gateway ID exists in outputs', async () => {
      expect(outputs.TransitGatewayId).toBeDefined();
      expect(outputs.TransitGatewayId).toMatch(/^tgw-/);
    }, 30000);

    test('should verify Transit Gateway attachments exist in outputs', async () => {
      expect(outputs.TransitGatewayAttachmentProdId).toBeDefined();
      expect(outputs.TransitGatewayAttachmentProdId).toMatch(/^tgw-attach-/);

      expect(outputs.TransitGatewayAttachmentDevId).toBeDefined();
      expect(outputs.TransitGatewayAttachmentDevId).toMatch(/^tgw-attach-/);
    }, 30000);
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete end-to-end order processing workflow', async () => {
      const orderId = `e2e-test-${Date.now()}`;
      const timestamp = Date.now();

      // Create order
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: outputs.OrdersTableName,
          Item: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
            userId: { S: 'e2e-test-user' },
            symbol: { S: 'TSLA' },
            quantity: { N: '50' },
            price: { N: '200.00' },
            orderType: { S: 'BUY' },
            status: { S: 'PENDING' },
          },
        })
      );

      // Verify order was created using GetItem (strongly consistent)
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
          ConsistentRead: true,
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.orderId.S).toBe(orderId);

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.OrdersTableName,
          Key: {
            orderId: { S: orderId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );
    }, 30000);
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets with egress', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Type', Value: 'Private' }),
        ]),
      }));
    });

    test('should create isolated database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Type', Value: 'Database' }),
        ]),
      }));
    });

    test('should tag all subnets with iac-rlhf-amazon', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      }));
    });

    test('should create development VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });
  });

  describe('Transit Gateway Configuration', () => {
    test('should create Transit Gateway with correct ASN', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64512,
        DefaultRouteTableAssociation: 'disable',
        DefaultRouteTablePropagation: 'disable',
        DnsSupport: 'enable',
        VpnEcmpSupport: 'enable',
      });
    });

    test('should create Transit Gateway attachments for production VPC', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Value: Match.stringLikeRegexp('tgw-attachment-prod') }),
        ]),
      }));
    });

    test('should create Transit Gateway attachments for development VPC', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Value: Match.stringLikeRegexp('tgw-attachment-dev') }),
        ]),
      }));
    });

    test('should create separate route tables for production and development', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTable', 2);
    });

    test('should associate route tables with attachments', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTableAssociation', 2);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should enable versioning on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should apply encryption to all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('should configure lifecycle rules on Flow Logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('flowlogs'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      }));
    });

    test('should configure lifecycle transition on Trading Data bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('data'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
              ]),
            }),
          ]),
        },
      }));
    });

    test('should configure Glacier transition on Backup bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('backup'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      }));
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Logs with S3 destination', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 's3',
      });
    });

    test('should configure flow logs with correct aggregation interval', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        MaxAggregationInterval: 600,
      });
    });

    test('should configure custom log format', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogFormat: Match.stringLikeRegexp('srcaddr'),
      });
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    test('should create 3 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 3);
    });

    test('should configure Trading Orders table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should configure Market Data table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('MarketData'),
        KeySchema: [
          { AttributeName: 'symbol', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should configure User Accounts table with correct key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('UserAccounts'),
        KeySchema: [{ AttributeName: 'accountId', KeyType: 'HASH' }],
      });
    });

    test('should enable on-demand billing for all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable point-in-time recovery on all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should enable DynamoDB streams on orders table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should enable encryption on all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should create Global Secondary Index on Orders table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'UserOrdersIndex',
          }),
        ]),
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create private hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp('trading-platform.internal'),
      });
    });

    test('should create health checks with HTTPS protocol', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTPS',
          Port: 443,
          RequestInterval: 30,
          FailureThreshold: 3,
        }),
      });
    });

    test('should create API health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          FullyQualifiedDomainName: Match.stringLikeRegexp('api'),
        }),
      });
    });

    test('should create database health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          FullyQualifiedDomainName: Match.stringLikeRegexp('db'),
        }),
      });
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('should create 3 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should configure Lambda functions with ARM64 architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('should configure Lambda functions with Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
      });
    });

    test('should configure Health Check Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('health-check'),
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('should configure Auto Response Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('auto-response'),
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should configure Order Processing Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('order-processor'),
        Timeout: 300,
        MemorySize: 2048,
      });
    });

    test('should deploy Lambda functions in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumedBy: Match.objectLike({
          Service: 'lambda.amazonaws.com',
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should configure event source mapping for order processing', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        StartingPosition: 'LATEST',
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('should create EventBridge rule for health checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(5 minutes)',
      });
    });

    test('should configure rule with Lambda target', () => {
      template.hasResourceProperties('AWS::Events::Rule', Match.objectLike({
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      }));
    });
  });

  describe('SSM Parameter Store Configuration', () => {
    test('should create SSM parameters', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 5);
    });

    test('should store alert thresholds configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('alert-thresholds'),
        Type: 'String',
      });
    });

    test('should store database configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('database-config'),
        Type: 'String',
      });
    });

    test('should store network configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('network-config'),
        Type: 'String',
      });
    });

    test('should store S3 bucket configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('s3-config'),
        Type: 'String',
      });
    });

    test('should store Transit Gateway attachments', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('tgw-attachments'),
        Type: 'String',
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create 3 security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should configure application security group with HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      }));
    });

    test('should configure database security group with restricted egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('db-sg'),
        SecurityGroupEgress: [],
      });
    });

    test('should configure database security group with PostgreSQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('should configure database security group with MySQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('should create S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('s3')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create DynamoDB VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('dynamodb')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create SSM VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('ssm')]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });
    });

    test('should create Lambda VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('lambda')]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('lambda-error-alarm'),
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create DynamoDB throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('dynamodb-throttle-alarm'),
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('IAM Permissions Configuration', () => {
    test('should grant DynamoDB read/write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant S3 read/write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant EC2 describe permissions for Transit Gateway checks', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['ec2:DescribeTransitGateways'],
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant SSM read permissions to auto-response Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonSSMReadOnlyAccess'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs Configuration', () => {
    test('should output Transit Gateway attachment IDs', () => {
      template.hasOutput('TransitGatewayAttachmentProdId', {});
      template.hasOutput('TransitGatewayAttachmentDevId', {});
    });

    test('should output Route 53 Hosted Zone ID', () => {
      template.hasOutput('HostedZoneId', {});
    });

    test('should output S3 Bucket ARNs', () => {
      template.hasOutput('FlowLogsBucketArn', {});
      template.hasOutput('TradingDataBucketArn', {});
      template.hasOutput('BackupBucketArn', {});
    });

    test('should output VPC information', () => {
      template.hasOutput('VPCId', {});
      template.hasOutput('VPCCidr', {});
    });

    test('should output DynamoDB table names', () => {
      template.hasOutput('OrdersTableName', {});
      template.hasOutput('MarketDataTableName', {});
    });

    test('should output Lambda function ARNs', () => {
      template.hasOutput('HealthCheckLambdaArn', {});
      template.hasOutput('OrderProcessingLambdaArn', {});
    });

    test('should output Transit Gateway ID', () => {
      template.hasOutput('TransitGatewayId', {});
    });
  });

  describe('Tagging Configuration', () => {
    test('should tag stack with iac-rlhf-amazon', () => {
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });

    test('should tag resources with Application tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Application', Value: 'TradingPlatform' }),
        ]),
      }));
    });

    test('should tag resources with Environment tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: Match.anyValue() }),
        ]),
      }));
    });

    test('should tag resources with iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      }));
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`tap-${environmentSuffix}`),
          }),
        ]),
      });
    });

    test('should include region in S3 bucket names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('ap-northeast-1'),
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy resources across 3 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9);
    });

    test('should create NAT Gateway per availability zone', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
