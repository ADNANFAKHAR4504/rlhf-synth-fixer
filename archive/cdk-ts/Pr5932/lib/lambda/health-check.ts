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
