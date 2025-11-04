import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const kinesis = new KinesisClient({});
const s3 = new S3Client({});
const eventbridge = new EventBridgeClient({});

interface IoTMessage {
  deviceId: string;
  deviceType: string;
  timestamp: number;
  data: any;
}

export const handler = async (event: any) => {
  const kinesisStreams = JSON.parse(process.env.KINESIS_STREAMS!);
  const archives = event.archivesToProcess || [];
  const environment = process.env.ENVIRONMENT || 'dev';

  let totalMessagesReplayed = 0;
  const batchSize = 500; // Kinesis max batch size

  for (const archiveKey of archives) {
    // Get archived data from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: event.bucketName,
      Key: archiveKey
    });

    const s3Response = await s3.send(getObjectCommand);
    const archiveData = await s3Response.Body!.transformToString();
    const messages: IoTMessage[] = JSON.parse(archiveData);

    // Sort messages by timestamp to maintain ordering
    messages.sort((a, b) => a.timestamp - b.timestamp);

    // Distribute messages across Kinesis streams
    const messagesByStream: { [key: string]: any[] } = {};
    kinesisStreams.forEach((stream: string) => {
      messagesByStream[stream] = [];
    });

    messages.forEach((message, index) => {
      const streamIndex = index % kinesisStreams.length;
      const streamName = kinesisStreams[streamIndex];

      messagesByStream[streamName].push({
        Data: JSON.stringify(message),
        PartitionKey: message.deviceId
      });
    });

    // Republish to Kinesis in batches
    for (const [streamName, streamMessages] of Object.entries(messagesByStream)) {
      for (let i = 0; i < streamMessages.length; i += batchSize) {
        const batch = streamMessages.slice(i, i + batchSize);

        const putRecordsCommand = new PutRecordsCommand({
          StreamName: streamName,
          Records: batch
        });

        const response = await kinesis.send(putRecordsCommand);

        // Handle failed records
        if (response.FailedRecordCount && response.FailedRecordCount > 0) {
          const failedRecords = batch.filter((_, index) =>
            response.Records![index].ErrorCode
          );

          // Send failed records to EventBridge for DLQ routing
          await sendToEventBridge(failedRecords);
        }

        totalMessagesReplayed += batch.length - (response.FailedRecordCount || 0);
      }
    }
  }

  return {
    totalMessagesReplayed,
    targetMessageCount: 45000000,
    completionPercentage: (totalMessagesReplayed / 45000000) * 100,
    environment
  };
};

async function sendToEventBridge(failedRecords: any[]) {
  const events = failedRecords.map(record => {
    const message = JSON.parse(record.Data);
    return {
      Source: 'iot.recovery',
      DetailType: 'Device Recovery Event',
      Detail: JSON.stringify({
        deviceId: message.deviceId,
        deviceType: message.deviceType,
        timestamp: message.timestamp,
        reason: 'kinesis_republish_failed'
      })
    };
  });

  const putEventsCommand = new PutEventsCommand({
    Entries: events
  });

  await eventbridge.send(putEventsCommand);
}
