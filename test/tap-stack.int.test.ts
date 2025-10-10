import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Financial Data Layer Integration Tests', () => {
  let dynamoClient: DynamoDBClient;
  let secretsClient: SecretsManagerClient;
  let lambdaClient: LambdaClient;
  let eventBridgeClient: EventBridgeClient;
  let rdsClient: RDSClient;

  let tableName: string;
  let lambdaArn: string;
  let eventBusName: string;
  let databaseSecretArn: string;
  let clusterIdentifier: string;

  beforeAll(() => {
    const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

    dynamoClient = new DynamoDBClient({ region });
    secretsClient = new SecretsManagerClient({ region });
    lambdaClient = new LambdaClient({ region });
    eventBridgeClient = new EventBridgeClient({ region });
    rdsClient = new RDSClient({ region });

    tableName = outputs.MetadataTableName;
    lambdaArn = outputs.BackupLambdaArn;
    eventBusName = outputs.EventBusName;
    databaseSecretArn = outputs.DatabaseSecretArn;
    clusterIdentifier = outputs.AuroraClusterIdentifier;

    expect(tableName).toBeDefined();
    expect(lambdaArn).toBeDefined();
    expect(eventBusName).toBeDefined();
    expect(databaseSecretArn).toBeDefined();
    expect(clusterIdentifier).toBeDefined();
  });

  test('End-to-end transaction processing flow', async () => {
    const transactionId = `txn-${Date.now()}`;
    const timestamp = Date.now();

    console.log('Step 1: Verify Aurora cluster is available');
    const clusterResponse = await rdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      })
    );
    expect(clusterResponse.DBClusters).toBeDefined();
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
    expect(clusterResponse.DBClusters![0].Engine).toBe('aurora-postgresql');
    expect(clusterResponse.DBClusters![0].StorageEncrypted).toBe(true);
    console.log('Aurora cluster is available and encrypted');

    console.log('Step 2: Verify database credentials are stored in Secrets Manager');
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: databaseSecretArn,
      })
    );
    expect(secretResponse.SecretString).toBeDefined();
    const dbCredentials = JSON.parse(secretResponse.SecretString!);
    expect(dbCredentials.username).toBe('dbadmin');
    expect(dbCredentials.password).toBeDefined();
    expect(dbCredentials.password.length).toBeGreaterThan(20);
    console.log('Database credentials retrieved successfully');

    console.log('Step 3: Write transaction metadata to DynamoDB');
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '1500.50' },
          status: { S: 'pending' },
          description: { S: 'Test financial transaction' },
        },
      })
    );
    console.log('Transaction metadata written to DynamoDB');

    console.log('Step 4: Retrieve transaction from DynamoDB');
    const getItemResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
        },
      })
    );
    expect(getItemResponse.Item).toBeDefined();
    expect(getItemResponse.Item!.id.S).toBe(transactionId);
    expect(getItemResponse.Item!.status.S).toBe('pending');
    console.log('Transaction retrieved successfully from DynamoDB');

    console.log('Step 5: Send operational event to EventBridge');
    const eventResponse = await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'com.financial.operations',
            DetailType: 'TransactionProcessed',
            Detail: JSON.stringify({
              transactionId,
              timestamp,
              status: 'processed',
            }),
            EventBusName: eventBusName,
          },
        ],
      })
    );
    expect(eventResponse.FailedEntryCount).toBe(0);
    expect(eventResponse.Entries).toBeDefined();
    expect(eventResponse.Entries![0].EventId).toBeDefined();
    console.log('Operational event sent to EventBridge');

    console.log('Step 6: Trigger backup Lambda function');
    const invokeResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            source: 'integration-test',
            transactionId,
          })
        ),
      })
    );
    expect(invokeResponse.StatusCode).toBe(200);
    const lambdaResult = JSON.parse(
      Buffer.from(invokeResponse.Payload!).toString()
    );
    expect(lambdaResult.statusCode).toBe(200);
    const body = JSON.parse(lambdaResult.body);
    expect(body.message).toBe('Success');
    expect(body.timestamp).toBeDefined();
    console.log('Backup Lambda function executed successfully');

    console.log('Step 7: Verify backup job metadata was recorded in DynamoDB');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const queryResponse = await dynamoClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: 'backup-job' },
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    );
    expect(queryResponse.Items).toBeDefined();
    expect(queryResponse.Items!.length).toBeGreaterThan(0);
    const backupJob = queryResponse.Items![0];
    expect(backupJob.id.S).toBe('backup-job');
    expect(backupJob.status.S).toBe('completed');
    expect(backupJob.details.S).toContain('successfully');
    console.log('Backup job metadata verified in DynamoDB');

    console.log('Step 8: Update transaction status to completed');
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '1500.50' },
          status: { S: 'completed' },
          description: { S: 'Test financial transaction' },
          completedAt: { N: Date.now().toString() },
        },
      })
    );
    console.log('Transaction status updated to completed');

    console.log('Step 9: Verify final transaction state');
    const finalResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
        },
      })
    );
    expect(finalResponse.Item).toBeDefined();
    expect(finalResponse.Item!.status.S).toBe('completed');
    expect(finalResponse.Item!.completedAt).toBeDefined();
    console.log('Final transaction state verified');

    console.log('All steps completed successfully - End-to-end flow validated');
  }, 120000);
});
