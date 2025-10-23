import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { QueryCommand, TimestreamQueryClient } from '@aws-sdk/client-timestream-query';
import { MeasureValueType, TimestreamWriteClient, TimeUnit, WriteRecordsCommand } from '@aws-sdk/client-timestream-write';

const queryClient = new TimestreamQueryClient({});
const writeClient = new TimestreamWriteClient({});
const cloudwatch = new CloudWatchClient({});

export const handler = async (event: any) => {
  const databaseName = process.env.DATABASE_NAME!;
  const tableName = process.env.TABLE_NAME!;
  const environment = process.env.ENVIRONMENT || 'dev';

  // Query for data continuity over the last 12 hours
  const query = `
    WITH recovery_stats AS (
      SELECT 
        device_id,
        COUNT(*) as record_count,
        MIN(time) as first_record,
        MAX(time) as last_record,
        COUNT(DISTINCT DATE_TRUNC('hour', time)) as hours_with_data
      FROM "${databaseName}"."${tableName}"
      WHERE time >= ago(12h)
      GROUP BY device_id
    )
    SELECT 
      COUNT(DISTINCT device_id) as recovered_devices,
      AVG(record_count) as avg_records_per_device,
      COUNT(CASE WHEN hours_with_data >= 12 THEN 1 END) as fully_recovered_devices
    FROM recovery_stats
  `;

  const queryCommand = new QueryCommand({
    QueryString: query
  });

  const response = await queryClient.send(queryCommand);
  const rows = response.Rows || [];

  if (rows.length > 0) {
    const stats = rows[0].Data!;
    const recoveredDevices = parseInt(stats[0].ScalarValue || '0');
    const fullyRecoveredDevices = parseInt(stats[2].ScalarValue || '0');

    // Calculate recovery percentage
    const targetDevices = event.failedDevices || 2300000;
    const recoveryPercentage = (fullyRecoveredDevices / targetDevices) * 100;

    // Write validation metrics to Timestream
    const validationRecord = {
      MeasureName: 'recovery_validation',
      MeasureValue: recoveryPercentage.toString(),
      MeasureValueType: MeasureValueType.DOUBLE,
      Time: Date.now().toString(),
      TimeUnit: TimeUnit.MILLISECONDS,
      Dimensions: [
        { Name: 'metric_type', Value: 'recovery_percentage' },
        { Name: 'validation_run', Value: new Date().toISOString() }
      ]
    };

    await writeClient.send(new WriteRecordsCommand({
      DatabaseName: databaseName,
      TableName: tableName,
      Records: [validationRecord]
    }));

    // Send metrics to CloudWatch
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'IoTRecovery',
      MetricData: [
        {
          MetricName: 'RecoveryPercentage',
          Value: recoveryPercentage,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'DevicesRecovered',
          Value: recoveredDevices,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }));

    // Check if 99.9% recovery target is met
    const targetMet = recoveryPercentage >= 99.9;

    return {
      recoveryPercentage,
      recoveredDevices,
      fullyRecoveredDevices,
      targetMet,
      validationTime: new Date().toISOString(),
      environment
    };
  }

  return {
    error: 'No validation data available'
  };
};
