import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const cloudwatch = new CloudWatchClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: any) => {
  const validationTableName = process.env.VALIDATION_TABLE_NAME!;
  const deviceTableName = process.env.DEVICE_TABLE_NAME!;
  const environment = process.env.ENVIRONMENT || 'dev';

  // Get recovery statistics from the event
  const processedDevices = event.processedDevices || 0;
  const failedDevices = event.failedDevices || 0;
  const totalMessagesReplayed = event.totalMessagesReplayed || 0;
  const archivesToProcess = event.archivesToProcess || [];

  try {
    // Store validation record in DynamoDB
    const validationTimestamp = Date.now();
    const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days TTL

    await docClient.send(new PutCommand({
      TableName: validationTableName,
      Item: {
        deviceId: 'RECOVERY_VALIDATION',
        timestamp: validationTimestamp,
        validationType: 'recovery_metrics',
        processedDevices,
        failedDevices,
        totalMessagesReplayed,
        archivesProcessed: archivesToProcess.length,
        ttl
      }
    }));

    // Query time-series data for the last 12 hours to detect gaps
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

    const queryResponse = await docClient.send(new QueryCommand({
      TableName: validationTableName,
      IndexName: `timestamp-index-${environment}`,
      KeyConditionExpression: 'validationType = :type AND #ts >= :startTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':type': 'recovery_metrics',
        ':startTime': twelveHoursAgo
      },
      ScanIndexForward: true // Sort by timestamp ascending
    }));

    const validationRecords = queryResponse.Items || [];

    // Detect timestamp gaps (missing data periods)
    const timestampGaps: { start: number; end: number; durationMinutes: number }[] = [];
    const expectedInterval = 5 * 60 * 1000; // 5 minutes

    for (let i = 1; i < validationRecords.length; i++) {
      const prevTimestamp = validationRecords[i - 1].timestamp;
      const currentTimestamp = validationRecords[i].timestamp;
      const gap = currentTimestamp - prevTimestamp;

      if (gap > expectedInterval * 2) { // Allow for some variance
        timestampGaps.push({
          start: prevTimestamp,
          end: currentTimestamp,
          durationMinutes: Math.floor(gap / (60 * 1000))
        });
      }
    }

    // Query device table to verify recovery
    const deviceQueryResponse = await docClient.send(new QueryCommand({
      TableName: deviceTableName,
      IndexName: `deviceType-index-${environment}`,
      KeyConditionExpression: 'deviceType = :type AND #ts >= :startTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':type': 'sensor', // Check one device type as sample
        ':startTime': twelveHoursAgo
      },
      Limit: 1000 // Sample 1000 devices
    }));

    const recoveredDeviceCount = deviceQueryResponse.Items?.length || 0;

    // Calculate recovery percentage
    const targetDevices = 2300000; // 2.3M devices
    const recoveryPercentage = targetDevices > 0 ?
      ((processedDevices - failedDevices) / targetDevices) * 100 : 0;

    // Calculate data continuity percentage (100% - % of time with gaps)
    const totalTimeRange = 12 * 60; // 12 hours in minutes
    const totalGapTime = timestampGaps.reduce((sum, gap) => sum + gap.durationMinutes, 0);
    const dataContinuityPercentage = ((totalTimeRange - totalGapTime) / totalTimeRange) * 100;

    // Send metrics to CloudWatch
    const metricData = [
      {
        MetricName: 'RecoveryPercentage',
        Value: recoveryPercentage,
        Unit: StandardUnit.Percent,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'recovery_percentage' }
        ]
      },
      {
        MetricName: 'DevicesRecovered',
        Value: processedDevices - failedDevices,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'devices_recovered' }
        ]
      },
      {
        MetricName: 'DevicesFailed',
        Value: failedDevices,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'devices_failed' }
        ]
      },
      {
        MetricName: 'MessagesReplayed',
        Value: totalMessagesReplayed,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'messages_replayed' }
        ]
      },
      {
        MetricName: 'DataContinuityPercentage',
        Value: dataContinuityPercentage,
        Unit: StandardUnit.Percent,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'data_continuity' }
        ]
      },
      {
        MetricName: 'TimestampGapsDetected',
        Value: timestampGaps.length,
        Unit: StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'timestamp_gaps' }
        ]
      },
      {
        MetricName: 'RecoveryCompletion',
        Value: recoveryPercentage >= 99.9 ? 1 : 0,
        Unit: StandardUnit.None,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: environment },
          { Name: 'MetricType', Value: 'recovery_completion' }
        ]
      }
    ];

    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: `IoTRecovery-${environment}`,
      MetricData: metricData
    }));

    console.log(`Successfully sent ${metricData.length} metrics to CloudWatch`);
    console.log(`Detected ${timestampGaps.length} timestamp gaps in the last 12 hours`);

    // Check if 99.9% recovery target is met
    const targetMet = recoveryPercentage >= 99.9 && dataContinuityPercentage >= 99.9;

    return {
      recoveryPercentage,
      dataContinuityPercentage,
      processedDevices,
      failedDevices,
      totalMessagesReplayed,
      recoveredDeviceCount,
      timestampGaps: timestampGaps.length,
      timestampGapDetails: timestampGaps.slice(0, 10), // Return first 10 gaps
      targetMet,
      validationTime: new Date().toISOString(),
      environment,
      metricsSent: metricData.length,
      validationRecordsAnalyzed: validationRecords.length
    };
  } catch (error) {
    console.error('Failed to perform DynamoDB validation:', error);

    return {
      error: 'Failed to perform validation',
      details: error instanceof Error ? error.message : 'Unknown error',
      recoveryPercentage: 0,
      processedDevices,
      failedDevices,
      totalMessagesReplayed,
      environment
    };
  }
};

