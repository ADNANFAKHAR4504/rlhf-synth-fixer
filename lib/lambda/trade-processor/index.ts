import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const REGION = process.env.REGION || 'us-east-1';
const SESSION_TABLE_NAME = process.env.SESSION_TABLE_NAME || '';
const CONFIG_BUCKET_NAME = process.env.CONFIG_BUCKET_NAME || '';

interface TradeOrder {
  orderId: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: number;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`Processing trades in ${REGION}`);
  console.log(`Event: ${JSON.stringify(event)}`);

  // Load configuration from S3
  try {
    const configCommand = new GetObjectCommand({
      Bucket: CONFIG_BUCKET_NAME,
      Key: `config-${ENVIRONMENT_SUFFIX}.json`,
    });
    const configResponse = await s3.send(configCommand);
    const config = JSON.parse(await configResponse.Body!.transformToString());
    console.log('Loaded config:', config);
  } catch (error) {
    console.log('No config found in S3, using defaults');
  }

  const processPromises = event.Records.map((record: SQSRecord) =>
    processRecord(record)
  );
  await Promise.all(processPromises);

  console.log(`Processed ${event.Records.length} trade orders successfully`);
};

async function processRecord(record: SQSRecord): Promise<void> {
  const trade: TradeOrder = JSON.parse(record.body);
  console.log(`Processing trade: ${trade.orderId}`);

  // Validate trade
  if (!trade.orderId || !trade.userId || !trade.symbol) {
    throw new Error('Invalid trade order');
  }

  // Store trade execution in DynamoDB
  const putCommand = new PutItemCommand({
    TableName: SESSION_TABLE_NAME,
    Item: {
      sessionId: { S: trade.userId },
      timestamp: { N: Date.now().toString() },
      orderId: { S: trade.orderId },
      symbol: { S: trade.symbol },
      quantity: { N: trade.quantity.toString() },
      price: { N: trade.price.toString() },
      region: { S: REGION },
      processedAt: { S: new Date().toISOString() },
    },
  });

  await dynamodb.send(putCommand);
  console.log(`Trade ${trade.orderId} stored in DynamoDB`);

  // Simulate trade execution logic
  const executionTime = Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, executionTime));

  console.log(`Trade ${trade.orderId} executed in ${executionTime}ms`);
}
