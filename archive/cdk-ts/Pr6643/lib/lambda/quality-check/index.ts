import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface QualityReport {
  timestamp: number;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  successRate: number;
  averageProcessingTime: number;
}

export const handler = async (): Promise<QualityReport> => {
  console.log('Quality check started');

  const yesterday = Date.now() - 24 * 60 * 60 * 1000;

  try {
    // Query completed jobs from last 24 hours
    const queryCommand = new QueryCommand({
      TableName: process.env.METADATA_TABLE!,
      IndexName: 'TimestampIndex',
      KeyConditionExpression: '#status = :status AND #timestamp > :yesterday',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'completed' },
        ':yesterday': { N: yesterday.toString() },
      },
    });

    const completedResult = await dynamoClient.send(queryCommand);
    const successfulFiles = completedResult.Items?.length || 0;

    // Query failed jobs
    const failedQueryCommand = new QueryCommand({
      TableName: process.env.METADATA_TABLE!,
      IndexName: 'TimestampIndex',
      KeyConditionExpression: '#status = :status AND #timestamp > :yesterday',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'enrichment_failed' },
        ':yesterday': { N: yesterday.toString() },
      },
    });

    const failedResult = await dynamoClient.send(failedQueryCommand);
    const failedFiles = failedResult.Items?.length || 0;

    const totalFiles = successfulFiles + failedFiles;
    const successRate =
      totalFiles > 0 ? (successfulFiles / totalFiles) * 100 : 100;

    // Calculate average processing time
    let totalProcessingTime = 0;
    if (completedResult.Items) {
      for (const item of completedResult.Items) {
        const processingTime = parseInt(item.processingTime?.N || '0');
        const transformTime = parseInt(item.transformTime?.N || '0');
        const enrichTime = parseInt(item.enrichTime?.N || '0');
        totalProcessingTime += processingTime + transformTime + enrichTime;
      }
    }

    const averageProcessingTime =
      successfulFiles > 0 ? totalProcessingTime / successfulFiles : 0;

    const report: QualityReport = {
      timestamp: Date.now(),
      totalFiles,
      successfulFiles,
      failedFiles,
      successRate,
      averageProcessingTime,
    };

    // Send metrics to CloudWatch
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'DailySuccessRate',
            Value: successRate,
            Unit: 'Percent',
            Timestamp: new Date(),
          },
          {
            MetricName: 'DailyTotalFiles',
            Value: totalFiles,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'DailyFailedFiles',
            Value: failedFiles,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'AverageProcessingTime',
            Value: averageProcessingTime,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log('Quality check report:', JSON.stringify(report));

    return report;
  } catch (error) {
    console.error('Quality check failed:', error);
    throw error;
  }
};
