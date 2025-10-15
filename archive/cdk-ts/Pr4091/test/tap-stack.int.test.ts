import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  BatchWriteItemCommand,
  ScanCommand,
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

// Load CloudFormation outputs with better error handling
function loadOutputs(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

const primaryOutputs = loadOutputs('cfn-outputs/primary-outputs.json');
const secondaryOutputs = loadOutputs('cfn-outputs/secondary-outputs.json');
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Check if stacks are deployed
const stacksDeployed = primaryOutputs && secondaryOutputs;
const skipMessage = stacksDeployed
  ? null
  : 'Stack not deployed. Run: cdk deploy --all --outputs-file cfn-outputs/primary-outputs.json';

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
    if (!stacksDeployed) {
      console.log('\n⚠️  Stacks not deployed - tests will be skipped');
      console.log('💡 Deploy with: cdk deploy --all --outputs-file cfn-outputs');
      return;
    }

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

  (skipMessage ? test.skip : test)('Flow 1: End-to-end transaction processing flow', async () => {
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
    expect(primaryFinalResponse.Item!.completedRegion.S).toBe('us-west-1');
    console.log('Update replicated to primary region successfully');

    console.log('All steps completed - Multi-region end-to-end flow validated');
  }, 180000);

  (skipMessage ? test.skip : test)('Flow 2: Concurrent multi-region writes and consistency validation', async () => {
    console.log('=== Testing concurrent writes from both regions ===');
    const baseId = `concurrent-${Date.now()}`;
    const primaryWrites: Promise<any>[] = [];
    const secondaryWrites: Promise<any>[] = [];

    console.log('Step 1: Write 10 items concurrently from primary region');
    for (let i = 0; i < 10; i++) {
      primaryWrites.push(
        primaryDynamoClient.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: `${baseId}-primary-${i}` },
              timestamp: { N: (Date.now() + i).toString() },
              region: { S: 'us-east-1' },
              data: { S: `Primary data ${i}` },
            },
          })
        )
      );
    }

    console.log('Step 2: Write 10 items concurrently from secondary region');
    for (let i = 0; i < 10; i++) {
      secondaryWrites.push(
        secondaryDynamoClient.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: `${baseId}-secondary-${i}` },
              timestamp: { N: (Date.now() + i + 100).toString() },
              region: { S: 'us-west-1' },
              data: { S: `Secondary data ${i}` },
            },
          })
        )
      );
    }

    await Promise.all([...primaryWrites, ...secondaryWrites]);
    console.log('All concurrent writes completed');

    console.log('Step 3: Wait for global table replication (5s)');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Step 4: Verify all primary writes are replicated to secondary');
    for (let i = 0; i < 10; i++) {
      const response = await secondaryDynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: `${baseId}-primary-${i}` },
            timestamp: { N: (Date.now() + i).toString() },
          },
        })
      );
      expect(response.Item).toBeDefined();
      expect(response.Item!.region.S).toBe('us-east-1');
    }

    console.log('Step 5: Verify all secondary writes are replicated to primary');
    for (let i = 0; i < 10; i++) {
      const response = await primaryDynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: `${baseId}-secondary-${i}` },
            timestamp: { N: (Date.now() + i + 100).toString() },
          },
        })
      );
      expect(response.Item).toBeDefined();
      expect(response.Item!.region.S).toBe('us-west-1');
    }

    console.log('Concurrent write flow validated - 20 items replicated successfully');
  }, 180000);

  (skipMessage ? test.skip : test)('Flow 3: Regional failover and disaster recovery simulation', async () => {
    console.log('=== Testing regional failover scenario ===');
    const failoverId = `failover-${Date.now()}`;
    const timestamp = Date.now();

    console.log('Step 1: Write critical transaction to primary region');
    await primaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: failoverId },
          timestamp: { N: timestamp.toString() },
          status: { S: 'processing' },
          amount: { N: '50000.00' },
          critical: { BOOL: true },
        },
      })
    );

    console.log('Step 2: Verify Aurora primary cluster is available');
    const primaryCluster = await primaryRdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: primaryClusterIdentifier,
      })
    );
    expect(primaryCluster.DBClusters![0].Status).toBe('available');

    console.log('Step 3: Wait for replication to secondary region');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Step 4: Simulate primary region failure - read from secondary');
    const failoverRead = await secondaryDynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: failoverId },
          timestamp: { N: timestamp.toString() },
        },
      })
    );
    expect(failoverRead.Item).toBeDefined();
    expect(failoverRead.Item!.critical.BOOL).toBe(true);

    console.log('Step 5: Complete transaction from secondary region');
    await secondaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: failoverId },
          timestamp: { N: timestamp.toString() },
          status: { S: 'completed-failover' },
          amount: { N: '50000.00' },
          critical: { BOOL: true },
          failoverRegion: { S: 'us-west-1' },
          failoverTime: { N: Date.now().toString() },
        },
      })
    );

    console.log('Step 6: Verify secondary Aurora cluster is available for reads');
    const secondaryCluster = await secondaryRdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: secondaryClusterIdentifier,
      })
    );
    expect(secondaryCluster.DBClusters![0].Status).toBe('available');
    expect(secondaryCluster.DBClusters![0].ReaderEndpoint).toBeDefined();

    console.log(
      'Failover simulation completed - Secondary region handled critical transaction'
    );
  }, 180000);

  (skipMessage ? test.skip : test)('Flow 4: Bulk data operations and batch processing', async () => {
    console.log('=== Testing bulk data operations ===');
    const batchId = `batch-${Date.now()}`;
    const batchSize = 25;

    console.log(`Step 1: Prepare batch write of ${batchSize} items`);
    const batchItems = [];
    for (let i = 0; i < batchSize; i++) {
      batchItems.push({
        PutRequest: {
          Item: {
            id: { S: `${batchId}-item-${i}` },
            timestamp: { N: (Date.now() + i).toString() },
            batchNumber: { N: i.toString() },
            processingStatus: { S: 'queued' },
            amount: { N: (Math.random() * 10000).toFixed(2) },
          },
        },
      });
    }

    console.log('Step 2: Execute batch write to primary region');
    await primaryDynamoClient.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batchItems,
        },
      })
    );

    console.log('Step 3: Trigger batch processing Lambda in primary region');
    const batchProcessResponse = await primaryLambdaClient.send(
      new InvokeCommand({
        FunctionName: primaryLambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(
          JSON.stringify({
            source: 'batch-processor',
            batchId,
            batchSize,
          })
        ),
      })
    );
    expect(batchProcessResponse.StatusCode).toBe(200);

    console.log('Step 4: Wait for batch replication (6s)');
    await new Promise((resolve) => setTimeout(resolve, 6000));

    console.log('Step 5: Verify batch items replicated to secondary region');
    let replicatedCount = 0;
    for (let i = 0; i < batchSize; i++) {
      const response = await secondaryDynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: `${batchId}-item-${i}` },
            timestamp: { N: (Date.now() + i).toString() },
          },
        })
      );
      if (response.Item) {
        replicatedCount++;
      }
    }
    expect(replicatedCount).toBeGreaterThan(20); // Allow for eventual consistency

    console.log(
      `Bulk operation completed - ${replicatedCount}/${batchSize} items replicated`
    );
  }, 180000);

  (skipMessage ? test.skip : test)('Flow 5: Event-driven workflow with cross-region coordination', async () => {
    console.log('=== Testing event-driven workflow ===');
    const workflowId = `workflow-${Date.now()}`;
    const timestamp = Date.now();

    console.log('Step 1: Initiate workflow in primary region');
    await primaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: workflowId },
          timestamp: { N: timestamp.toString() },
          workflowStatus: { S: 'initiated' },
          steps: { N: '0' },
          initiatedRegion: { S: 'us-east-1' },
        },
      })
    );

    console.log('Step 2: Send workflow event to primary EventBridge');
    const event1 = await primaryEventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'com.financial.workflow',
            DetailType: 'WorkflowInitiated',
            Detail: JSON.stringify({
              workflowId,
              step: 1,
              action: 'validate-transaction',
            }),
            EventBusName: primaryEventBusName,
          },
        ],
      })
    );
    expect(event1.FailedEntryCount).toBe(0);

    console.log('Step 3: Invoke Lambda for workflow step 1');
    const step1Response = await primaryLambdaClient.send(
      new InvokeCommand({
        FunctionName: primaryLambdaArn,
        Payload: Buffer.from(
          JSON.stringify({
            source: 'workflow-orchestrator',
            workflowId,
            step: 1,
          })
        ),
      })
    );
    expect(step1Response.StatusCode).toBe(200);

    console.log('Step 4: Wait for replication');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Step 5: Continue workflow from secondary region');
    await secondaryDynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: workflowId },
          timestamp: { N: timestamp.toString() },
          workflowStatus: { S: 'processing' },
          steps: { N: '1' },
          initiatedRegion: { S: 'us-east-1' },
          processingRegion: { S: 'us-west-1' },
        },
      })
    );

    console.log('Step 6: Send completion event from secondary region');
    const event2 = await secondaryEventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'com.financial.workflow',
            DetailType: 'WorkflowStepCompleted',
            Detail: JSON.stringify({
              workflowId,
              step: 2,
              completedIn: 'us-west-1',
            }),
            EventBusName: secondaryEventBusName,
          },
        ],
      })
    );
    expect(event2.FailedEntryCount).toBe(0);

    console.log('Step 7: Invoke secondary Lambda for final step');
    const step2Response = await secondaryLambdaClient.send(
      new InvokeCommand({
        FunctionName: secondaryLambdaArn,
        Payload: Buffer.from(
          JSON.stringify({
            source: 'workflow-orchestrator',
            workflowId,
            step: 2,
            finalStep: true,
          })
        ),
      })
    );
    expect(step2Response.StatusCode).toBe(200);

    console.log('Step 8: Wait for final replication');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Step 9: Verify workflow completion in primary region');
    const finalState = await primaryDynamoClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: workflowId },
          timestamp: { N: timestamp.toString() },
        },
      })
    );
    expect(finalState.Item).toBeDefined();
    expect(finalState.Item!.processingRegion.S).toBe('us-west-1');

    console.log(
      'Event-driven workflow completed - Cross-region coordination validated'
    );
  }, 180000);
});
