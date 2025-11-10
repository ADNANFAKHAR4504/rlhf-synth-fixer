import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { IoTClient, ListThingsCommand } from '@aws-sdk/client-iot';
// @ts-ignore - Optional dependency resolved at deploy time
import { GetThingShadowCommand, IoTDataPlaneClient } from '@aws-sdk/client-iot-data-plane';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const iot = new IoTClient({});
const iotData = new IoTDataPlaneClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

interface DeviceState {
  deviceId: string;
  deviceType: string;
  lastSeen: number;
  needsRecovery: boolean;
}

export const handler = async (event: any) => {
  const tableName = process.env.DEVICE_TABLE_NAME!;
  const bucketName = process.env.BUCKET_NAME!;
  const environment = process.env.ENVIRONMENT || 'dev';

  // Batch process devices
  const batchSize = 1000;
  let nextToken: string | undefined;
  let processedDevices = 0;
  const failedDevices: DeviceState[] = [];

  do {
    // List devices
    const listCommand = new ListThingsCommand({
      maxResults: batchSize,
      nextToken
    });

    const response = await iot.send(listCommand);
    const things = response.things || [];

    // Process shadows in parallel
    const shadowPromises = things.map(async (thing) => {
      try {
        const shadowCommand = new GetThingShadowCommand({
          thingName: thing.thingName!
        });

        const shadowResponse = await iotData.send(shadowCommand);
        const shadow = JSON.parse(new TextDecoder().decode(shadowResponse.payload));

        // Analyze shadow state
        const reported = shadow.state?.reported || {};
        const lastActivity = reported.timestamp || 0;
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivity;

        // If device hasn't reported in 1 hour, mark for recovery
        if (timeSinceLastActivity > 3600000) {
          failedDevices.push({
            deviceId: thing.thingName!,
            deviceType: thing.thingTypeName || 'unknown',
            lastSeen: lastActivity,
            needsRecovery: true
          });
        }
      } catch (error) {
        console.error(`Error processing device ${thing.thingName}:`, error);
      }
    });

    await Promise.all(shadowPromises);
    processedDevices += things.length;
    nextToken = response.nextToken;

  } while (nextToken && processedDevices < 2300000); // Process up to 2.3M devices

  // Store failed devices in DynamoDB
  if (failedDevices.length > 0) {
    const chunks = [];
    for (let i = 0; i < failedDevices.length; i += 25) {
      chunks.push(failedDevices.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const putRequests = chunk.map(device => ({
        PutRequest: {
          Item: {
            ...device,
            timestamp: Date.now(),
            recoveryStatus: 'pending'
          }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      }));
    }
  }

  // Identify S3 archives for backfill (last 12 hours)
  const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
  const archives: string[] = [];

  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'iot-data/'
  });

  const s3Response = await s3.send(listObjectsCommand);
  const objects = s3Response.Contents || [];

  objects.forEach(obj => {
    if (obj.LastModified && obj.LastModified.getTime() >= twelveHoursAgo) {
      archives.push(obj.Key!);
    }
  });

  return {
    processedDevices,
    failedDevices: failedDevices.length,
    archivesToProcess: archives,
    environment
  };
};
