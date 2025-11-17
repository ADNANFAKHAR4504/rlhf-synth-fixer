const { Logger } = require('@aws-lambda-powertools/logger');
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const logger = new Logger({ serviceName: 'KinesisConsumer' });
const metrics = new Metrics({ namespace: 'StockPatternDetection', serviceName: 'KinesisConsumer' });
const tracer = new Tracer({ serviceName: 'KinesisConsumer' });
const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('KinesisProcessing');

  try {
    logger.info('Processing Kinesis records', { recordCount: event.Records?.length });

    const records = event.Records || [];
    const processedCount = records.length;

    for (const record of records) {
      try {
        const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
        const data = JSON.parse(payload);

        // Store in DynamoDB
        await dynamoClient.send(
          new PutItemCommand({
            TableName: process.env.TRADING_PATTERNS_TABLE,
            Item: {
              patternId: { S: `kinesis-${record.kinesis.sequenceNumber}` },
              timestamp: { S: new Date().toISOString() },
              data: { S: payload },
            },
          })
        );

        // Send alert if high confidence
        if (data.confidence && data.confidence > 0.9) {
          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: process.env.ALERT_QUEUE_URL,
              MessageBody: JSON.stringify({
                type: 'high_confidence_pattern',
                data,
                source: 'kinesis',
              }),
            })
          );
        }
      } catch (error) {
        logger.error('Error processing Kinesis record', { error, record });
        throw error; // Trigger bisect-on-error
      }
    }

    metrics.addMetric('RecordsProcessed', MetricUnits.Count, processedCount);

    subsegment.close();
    logger.info('Kinesis processing completed', { processedCount });

    return { statusCode: 200, processedRecords: processedCount };
  } catch (error) {
    logger.error('Error in Kinesis consumer', { error });
    subsegment.addError(error);
    subsegment.close();
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};
