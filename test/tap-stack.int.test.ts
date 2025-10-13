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

const primaryOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/primary-outputs.json', 'utf8')
);
const secondaryOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/secondary-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Financial Data Layer Multi-Region Integration Tests', () => {
  let primaryDynamoClient: DynamoDBClient;
  let secondaryDynamoClient: DynamoDBClient;
  let primarySecretsClient: SecretsManagerClient;
  let secondarySecretsClient: SecretsManagerClient;
  let primaryLambdaClient: LambdaClient;
  let secondaryLambdaClient: LambdaClient;
  let primaryEventBridgeClient: EventBridgeClient;
  let secondaryEventBridgeClient: EventBridgeClient;
  let primaryRdsClient: RDSClient;
  let secondaryRdsClient: RDSClient;

  let tableName: string;
  let primaryLambdaArn: string;
  let secondaryLambdaArn: string;
  let primaryEventBusName: string;
  let secondaryEventBusName: string;
  let primaryDatabaseSecretArn: string;
  let secondaryDatabaseSecretArn: string;
  let primaryClusterIdentifier: string;
  let secondaryClusterIdentifier: string;

  beforeAll(() => {
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-1';

    primaryDynamoClient = new DynamoDBClient({ region: primaryRegion });
    secondaryDynamoClient = new DynamoDBClient({ region: secondaryRegion });
    primarySecretsClient = new SecretsManagerClient({ region: primaryRegion });
    secondarySecretsClient = new SecretsManagerClient({ region: secondaryRegion });
    primaryLambdaClient = new LambdaClient({ region: primaryRegion });
    secondaryLambdaClient = new LambdaClient({ region: secondaryRegion });
    primaryEventBridgeClient = new EventBridgeClient({ region: primaryRegion });
    secondaryEventBridgeClient = new EventBridgeClient({ region: secondaryRegion });
    primaryRdsClient = new RDSClient({ region: primaryRegion });
    secondaryRdsClient = new RDSClient({ region: secondaryRegion });

    tableName = primaryOutputs.MetadataTableName || secondaryOutputs.MetadataTableName;
    primaryLambdaArn = primaryOutputs.BackupLambdaArn;
    secondaryLambdaArn = secondaryOutputs.BackupLambdaArn;
    primaryEventBusName = primaryOutputs.EventBusName;
    secondaryEventBusName = secondaryOutputs.EventBusName;
    primaryDatabaseSecretArn = primaryOutputs.DatabaseSecretArn;
    secondaryDatabaseSecretArn = secondaryOutputs.DatabaseSecretArn;
    primaryClusterIdentifier = primaryOutputs.AuroraClusterIdentifier;
    secondaryClusterIdentifier = secondaryOutputs.AuroraClusterIdentifier;

    expect(tableName).toBeDefined();
    expect(primaryLambdaArn).toBeDefined();
    expect(secondaryLambdaArn).toBeDefined();
    expect(primaryEventBusName).toBeDefined();
    expect(secondaryEventBusName).toBeDefined();
    expect(primaryDatabaseSecretArn).toBeDefined();
    expect(secondaryDatabaseSecretArn).toBeDefined();
    expect(primaryClusterIdentifier).toBeDefined();
    expect(secondaryClusterIdentifier).toBeDefined();
  });

  test('End-to-end transaction processing flow', async () => {
    const transactionId = `txn-${Date.now()}`;
    const timestamp = Date.now();

    console.log('Step 1: Verify Aurora clusters are available in both regions');
    const primaryClusterResponse = await primaryRdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: primaryClusterIdentifier,
      })
    );
    const secondaryClusterResponse = await secondaryRdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: secondaryClusterIdentifier,
      })
    );
    expect(primaryClusterResponse.DBClusters).toBeDefined();
    expect(primaryClusterResponse.DBClusters![0].Status).toBe('available');
    expect(secondaryClusterResponse.DBClusters).toBeDefined();
    expect(secondaryClusterResponse.DBClusters![0].Status).toBe('available');
    console.log('Both Aurora clusters are available');

    console.log('Step 2: Verify database credentials in both regions');
    const primarySecretResponse = await primarySecretsClient.send(
      new GetSecretValueCommand({
        SecretId: primaryDatabaseSecretArn,
      })
    );
    expect(primarySecretResponse.SecretString).toBeDefined();
    const dbCredentials = JSON.parse(primarySecretResponse.SecretString!);
    expect(dbCredentials.username).toBe('dbadmin');
    expect(dbCredentials.password).toBeDefined();
    console.log('Database credentials retrieved successfully');

    console.log('Step 3: Write transaction metadata to primary DynamoDB');
    await primaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '1500.50' },
          status: { S: 'pending' },
          description: { S: 'Multi-region test transaction' },
        },
      })
    );
    console.log('Transaction written to primary region');

    console.log('Step 4: Wait for replication and verify in secondary region');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const secondaryGetResponse = await secondaryDynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
        },
        ConsistentRead: false,
      })
    );
    expect(secondaryGetResponse.Item).toBeDefined();
    expect(secondaryGetResponse.Item!.id.S).toBe(transactionId);
    expect(secondaryGetResponse.Item!.status.S).toBe('pending');
    console.log('Transaction replicated to secondary region successfully');

    console.log('Step 5: Send operational event to primary EventBridge');
    const primaryEventResponse = await primaryEventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'com.financial.operations',
            DetailType: 'TransactionProcessed',
            Detail: JSON.stringify({
              transactionId,
              timestamp,
              status: 'processed',
              region: 'us-east-1',
            }),
            EventBusName: primaryEventBusName,
          },
        ],
      })
    );
    expect(primaryEventResponse.FailedEntryCount).toBe(0);
    console.log('Event sent to primary region EventBridge');

    console.log('Step 6: Trigger backup Lambda in primary region');
    const primaryInvokeResponse = await primaryLambdaClient.send(
      new InvokeCommand({
        FunctionName: primaryLambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            source: 'integration-test-primary',
            transactionId,
          })
        ),
      })
    );
    expect(primaryInvokeResponse.StatusCode).toBe(200);
    const primaryLambdaResult = JSON.parse(
      Buffer.from(primaryInvokeResponse.Payload!).toString()
    );
    expect(primaryLambdaResult.statusCode).toBe(200);
    console.log('Primary backup Lambda executed successfully');

    console.log('Step 7: Trigger backup Lambda in secondary region');
    const secondaryInvokeResponse = await secondaryLambdaClient.send(
      new InvokeCommand({
        FunctionName: secondaryLambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            source: 'integration-test-secondary',
            transactionId,
          })
        ),
      })
    );
    expect(secondaryInvokeResponse.StatusCode).toBe(200);
    const secondaryLambdaResult = JSON.parse(
      Buffer.from(secondaryInvokeResponse.Payload!).toString()
    );
    expect(secondaryLambdaResult.statusCode).toBe(200);
    console.log('Secondary backup Lambda executed successfully');

    console.log('Step 8: Verify backup metadata in primary region');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const primaryQueryResponse = await primaryDynamoClient.send(
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
    expect(primaryQueryResponse.Items).toBeDefined();
    expect(primaryQueryResponse.Items!.length).toBeGreaterThan(0);
    console.log('Backup metadata verified in primary region');

    console.log('Step 9: Update transaction to completed in secondary region');
    await secondaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '1500.50' },
          status: { S: 'completed' },
          description: { S: 'Multi-region test transaction' },
          completedAt: { N: Date.now().toString() },
          completedRegion: { S: 'us-west-1' },
        },
      })
    );
    console.log('Transaction updated in secondary region');

    console.log('Step 10: Verify update replicated to primary region');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const primaryFinalResponse = await primaryDynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
        },
      })
    );
    expect(primaryFinalResponse.Item).toBeDefined();
    expect(primaryFinalResponse.Item!.status.S).toBe('completed');
    expect(primaryFinalResponse.Item!.completedAt).toBeDefined();
    expect(secondaryGetResponse.Item!.completedRegion.S).toBe('us-west-1');
    console.log('Update replicated to primary region successfully');

    console.log('All steps completed - Multi-region end-to-end flow validated');
  }, 180000);
});
