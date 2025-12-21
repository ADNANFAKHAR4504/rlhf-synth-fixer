import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class DataIngestionStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const encryptionKey = props.encryptionKey;

    // Kinesis Data Stream for real-time patient data ingestion
    this.dataStream = new kinesis.Stream(this, 'PatientDataStream', {
      streamName: `patient-data-stream-${environmentSuffix}`,
      shardCount: 10, // Handle 100,000+ events per minute
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: encryptionKey,
    });

    // CloudWatch alarms for stream monitoring
    const iteratorAgeAlarm = new cloudwatch.Alarm(this, 'IteratorAgeAlarm', {
      alarmName: `kinesis-iterator-age-${environmentSuffix}`,
      metric: this.dataStream.metricGetRecordsIteratorAgeMilliseconds(),
      threshold: 60000, // 1 minute
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const writeThrottleAlarm = new cloudwatch.Alarm(this, 'WriteThrottleAlarm', {
      alarmName: `kinesis-write-throttle-${environmentSuffix}`,
      metric: this.dataStream.metricPutRecordsThrottledRecords(),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
