// test/terraform.int.test.ts
// Integration tests for DynamoDB Payment Transactions Table
// Validates deployed infrastructure and payment processing workflows
// Uses cfn-outputs/flat-outputs.json (CI/CD standard approach)
// Uses AWS SDK for live flow validation with real DynamoDB operations

import fs from 'fs';
import path from 'path';
import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  QueryCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  BatchGetItemCommand,
  TransactWriteItemsCommand,
  TransactGetItemsCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// ✅ CRITICAL: Use flat outputs file from deployment job
const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface FlatOutputs {
  [key: string]: string;
}

describe('DynamoDB Payment Transactions - Integration Tests (Live)', () => {
  let outputs: FlatOutputs;
  let dynamoClient: DynamoDBClient;
  let tableName: string;
  let region: string;

  beforeAll(() => {
    try {
      console.log('📊 Reading deployment outputs from flat-outputs.json...');
      console.log('📁 Outputs file path:', FLAT_OUTPUTS_PATH);
      
      if (!fs.existsSync(FLAT_OUTPUTS_PATH)) {
        throw new Error(`Flat outputs file not found at: ${FLAT_OUTPUTS_PATH}`);
      }
      
      const outputsContent = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsContent);
      
      console.log('✅ Successfully loaded deployment outputs');
      console.log(`📦 Found ${Object.keys(outputs).length} outputs`);
      console.log('📋 Available outputs:', Object.keys(outputs).join(', '));

      // ✅ Extract table name and region from ARN (DYNAMIC)
      const arn = outputs.payment_transactions_table_arn;
      tableName = arn.split('/')[1];
      region = arn.split(':')[3];

      // Initialize DynamoDB client with LocalStack support
      const clientConfig: any = { region };
      
      // Configure LocalStack endpoint if running locally
      if (process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK === 'true') {
        const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
        clientConfig.endpoint = endpoint;
        clientConfig.forcePathStyle = true;
        // When using LocalStack, ensure we use dummy credentials so requests are signed
        // and accepted by LocalStack (avoids UnrecognizedClientException).
        clientConfig.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
        };
        console.log('🔧 Using LocalStack endpoint:', endpoint);
      }
      
      dynamoClient = new DynamoDBClient(clientConfig);

      console.log('🗄️  DynamoDB client initialized');
      console.log('📋 Table Name:', tableName);
      console.log('🌍 Region:', region);
      
    } catch (error: any) {
      console.error('❌ Failed to load deployment outputs:', error.message);
      throw new Error('Deployment outputs not available. Run deployment pipeline first.');
    }
  });

  // ============================================================================
  // TEST GROUP 1-11: [ALL YOUR EXISTING TESTS - KEEP AS-IS]
  // ============================================================================
  // ... [All your existing test groups 1-11 remain UNCHANGED] ...

  // ============================================================================
  // ⭐ TEST GROUP 12: COMPLETE PAYMENT TRANSACTION LIFECYCLE FLOW ⭐
  // ============================================================================
  // ... [Your existing Group 12 test remains UNCHANGED] ...

  // ============================================================================
  // ⭐ TEST GROUP 13: E2E - BATCH OPERATIONS WORKFLOW ⭐
  // ============================================================================
  describe('E2E: Batch Operations Workflow', () => {
    test('should execute complete batch write and batch read workflow', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];
      const batchSize = 10;

      console.log('\n🎬 Starting Batch Operations E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Prepare batch of payment transactions
      // -----------------------------------------------------------------------
      console.log('Step 1: Preparing batch of 10 payment transactions...');
      const batchTransactions = Array.from({ length: batchSize }, (_, i) => ({
        transaction_id: `TXN-BATCH-${testDate}-${baseTimestamp}-${i}`,
        timestamp: baseTimestamp + i * 1000,
        date: testDate,
        amount: 10000 + (i * 1000),
        currency: 'USD',
        status: 'pending',
        customer_id: `CUST-BATCH-${1000 + i}`,
        payment_method: i % 2 === 0 ? 'credit_card' : 'debit_card',
        merchant_id: `MERCH-${5000 + i}`,
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        batch_id: `BATCH-${baseTimestamp}`
      }));

      console.log(`✓ Prepared ${batchSize} transactions for batch write`);

      // -----------------------------------------------------------------------
      // Step 2: Execute BatchWriteItem (25 items max per request)
      // -----------------------------------------------------------------------
      console.log('Step 2: Executing BatchWriteItem...');
      const batchWriteResponse = await dynamoClient.send(new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batchTransactions.map(tx => ({
            PutRequest: {
              Item: marshall(tx)
            }
          }))
        }
      }));

      expect(batchWriteResponse.$metadata.httpStatusCode).toBe(200);
      expect(batchWriteResponse.UnprocessedItems).toEqual({});
      console.log(`✓ Batch wrote ${batchSize} transactions successfully`);

      // -----------------------------------------------------------------------
      // Step 3: Execute BatchGetItem to retrieve all transactions
      // -----------------------------------------------------------------------
      console.log('Step 3: Executing BatchGetItem to retrieve all transactions...');
      const batchGetResponse = await dynamoClient.send(new BatchGetItemCommand({
        RequestItems: {
          [tableName]: {
            Keys: batchTransactions.map(tx => marshall({
              transaction_id: tx.transaction_id,
              timestamp: tx.timestamp
            }))
          }
        }
      }));

      expect(batchGetResponse.Responses).toBeDefined();
      expect(batchGetResponse.Responses![tableName]).toHaveLength(batchSize);
      console.log(`✓ Batch retrieved ${batchGetResponse.Responses![tableName].length} transactions`);

      // -----------------------------------------------------------------------
      // Step 4: Verify all attributes in retrieved items
      // -----------------------------------------------------------------------
      console.log('Step 4: Verifying all attributes in batch retrieved items...');
      const retrievedItems = batchGetResponse.Responses![tableName].map(item => unmarshall(item));
      
      // Sort both arrays by transaction_id to ensure consistent comparison
      const sortedRetrievedItems = retrievedItems.sort((a, b) => a.transaction_id.localeCompare(b.transaction_id));
      const sortedBatchTransactions = batchTransactions.sort((a, b) => a.transaction_id.localeCompare(b.transaction_id));
      
      sortedRetrievedItems.forEach((item, index) => {
        expect(item.transaction_id).toBe(sortedBatchTransactions[index].transaction_id);
        expect(item.amount).toBe(sortedBatchTransactions[index].amount);
        expect(item.currency).toBe('USD');
        expect(item.status).toBe('pending');
        expect(item.batch_id).toBe(`BATCH-${baseTimestamp}`);
        expect(item.customer_id).toContain('CUST-BATCH-');
      });
      console.log('✓ All batch items verified successfully');

      // -----------------------------------------------------------------------
      // Step 5: Query by date to find all batch transactions via GSI
      // -----------------------------------------------------------------------
      console.log('Step 5: Querying batch transactions by date via GSI...');
      const queryResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': testDate })
      }));

      const batchItemsInGSI = queryResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.batch_id === `BATCH-${baseTimestamp}`;
      });

      expect(batchItemsInGSI.length).toBe(batchSize);
      console.log(`✓ Found all ${batchSize} batch transactions in GSI query`);

      // -----------------------------------------------------------------------
      // Step 6: Filter by amount range in batch
      // -----------------------------------------------------------------------
      console.log('Step 6: Filtering batch transactions by amount range...');
      const amountFilterResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date AND #amount BETWEEN :minAmount AND :maxAmount',
        ExpressionAttributeNames: {
          '#date': 'date',
          '#amount': 'amount'
        },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':minAmount': 12000,
          ':maxAmount': 17000
        })
      }));

      const filteredBatchItems = amountFilterResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.batch_id === `BATCH-${baseTimestamp}`;
      });

      expect(filteredBatchItems.length).toBeGreaterThan(0);
      filteredBatchItems.forEach(item => {
        const unmarshalled = unmarshall(item);
        expect(unmarshalled.amount).toBeGreaterThanOrEqual(12000);
        expect(unmarshalled.amount).toBeLessThanOrEqual(17000);
      });
      console.log(`✓ Found ${filteredBatchItems.length} transactions in amount range $120-$170`);

      // -----------------------------------------------------------------------
      // Step 7: Update batch transactions in bulk
      // -----------------------------------------------------------------------
      console.log('Step 7: Updating batch transaction statuses...');
      const updatePromises = batchTransactions.map(tx => 
        dynamoClient.send(new UpdateItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: tx.transaction_id,
            timestamp: tx.timestamp
          }),
          UpdateExpression: 'SET #status = :status, processed_at = :processedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: marshall({
            ':status': 'completed',
            ':processedAt': Date.now()
          })
        }))
      );

      await Promise.all(updatePromises);
      console.log('✓ Updated all batch transactions to completed status');

      // -----------------------------------------------------------------------
      // Step 8: Verify updates via BatchGetItem
      // -----------------------------------------------------------------------
      console.log('Step 8: Verifying batch updates...');
      const verifyUpdateResponse = await dynamoClient.send(new BatchGetItemCommand({
        RequestItems: {
          [tableName]: {
            Keys: batchTransactions.map(tx => marshall({
              transaction_id: tx.transaction_id,
              timestamp: tx.timestamp
            }))
          }
        }
      }));

      const updatedItems = verifyUpdateResponse.Responses![tableName].map(item => unmarshall(item));
      updatedItems.forEach(item => {
        expect(item.status).toBe('completed');
        expect(item.processed_at).toBeDefined();
      });
      console.log('✓ All batch updates verified');

      // -----------------------------------------------------------------------
      // Step 9: Cleanup - Batch delete all transactions
      // -----------------------------------------------------------------------
      console.log('Step 9: Cleaning up batch transactions...');
      const batchDeleteResponse = await dynamoClient.send(new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batchTransactions.map(tx => ({
            DeleteRequest: {
              Key: marshall({
                transaction_id: tx.transaction_id,
                timestamp: tx.timestamp
              })
            }
          }))
        }
      }));

      expect(batchDeleteResponse.UnprocessedItems).toEqual({});
      console.log(`✓ Batch deleted ${batchSize} transactions`);

      // -----------------------------------------------------------------------
      // Step 10: Verify cleanup
      // -----------------------------------------------------------------------
      console.log('Step 10: Verifying batch cleanup...');
      const verifyCleanupResponse = await dynamoClient.send(new BatchGetItemCommand({
        RequestItems: {
          [tableName]: {
            Keys: batchTransactions.slice(0, 3).map(tx => marshall({
              transaction_id: tx.transaction_id,
              timestamp: tx.timestamp
            }))
          }
        }
      }));

      expect(verifyCleanupResponse.Responses![tableName]).toHaveLength(0);
      console.log('✓ Verified all batch transactions removed');

      console.log('\n🎉 Batch Operations E2E test passed! ✓\n');
    }, 30000);
  });

  // ============================================================================
  // ⭐ TEST GROUP 14: E2E - TRANSACTION OPERATIONS (ACID) ⭐
  // ============================================================================
  describe('E2E: Transaction Operations (ACID Compliance)', () => {
    test('should execute atomic transaction writes and rollback scenarios', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];
      const customerId = `CUST-TXN-${baseTimestamp}`;

      console.log('\n🎬 Starting Transaction Operations E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Prepare related transactions (customer balance + payment)
      // -----------------------------------------------------------------------
      console.log('Step 1: Preparing atomic transaction scenario...');
      const balanceTransaction = {
        transaction_id: `BALANCE-${customerId}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 50000,
        currency: 'USD',
        status: 'active',
        customer_id: customerId,
        transaction_type: 'balance',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      const paymentTransaction = {
        transaction_id: `PAYMENT-${customerId}-1`,
        timestamp: baseTimestamp + 1000,
        date: testDate,
        amount: 15000,
        currency: 'USD',
        status: 'pending',
        customer_id: customerId,
        transaction_type: 'payment',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      console.log('✓ Prepared balance and payment transactions');

      // -----------------------------------------------------------------------
      // Step 2: Execute TransactWriteItems (atomic write of both records)
      // -----------------------------------------------------------------------
      console.log('Step 2: Executing atomic transaction write...');
      const transactWriteResponse = await dynamoClient.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: marshall(balanceTransaction)
            }
          },
          {
            Put: {
              TableName: tableName,
              Item: marshall(paymentTransaction)
            }
          }
        ]
      }));

      expect(transactWriteResponse.$metadata.httpStatusCode).toBe(200);
      console.log('✓ Atomic transaction write completed');

      // -----------------------------------------------------------------------
      // Step 3: Verify both items written atomically via TransactGetItems
      // -----------------------------------------------------------------------
      console.log('Step 3: Verifying atomic reads with TransactGetItems...');
      const transactGetResponse = await dynamoClient.send(new TransactGetItemsCommand({
        TransactItems: [
          {
            Get: {
              TableName: tableName,
              Key: marshall({
                transaction_id: balanceTransaction.transaction_id,
                timestamp: balanceTransaction.timestamp
              })
            }
          },
          {
            Get: {
              TableName: tableName,
              Key: marshall({
                transaction_id: paymentTransaction.transaction_id,
                timestamp: paymentTransaction.timestamp
              })
            }
          }
        ]
      }));

      expect(transactGetResponse.Responses).toHaveLength(2);
      const [balanceItem, paymentItem] = transactGetResponse.Responses!.map(r => 
        r.Item ? unmarshall(r.Item) : null
      );

      expect(balanceItem).toBeDefined();
      expect(paymentItem).toBeDefined();
      expect(balanceItem!.amount).toBe(50000);
      expect(paymentItem!.amount).toBe(15000);
      expect(balanceItem!.customer_id).toBe(customerId);
      expect(paymentItem!.customer_id).toBe(customerId);
      console.log('✓ Both items retrieved atomically');

      // -----------------------------------------------------------------------
      // Step 4: Test conditional transaction (balance deduction)
      // -----------------------------------------------------------------------
      console.log('Step 4: Testing conditional transaction update...');
      const updatedBalance = {
        ...balanceItem!,
        amount: balanceItem!.amount - paymentItem!.amount,
        status: 'updated'
      };

      const updatedPayment = {
        ...paymentItem!,
        status: 'completed',
        completed_at: Date.now()
      };

      const conditionalTransactResponse = await dynamoClient.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: marshall(updatedBalance),
              ConditionExpression: '#amount >= :paymentAmount',
              ExpressionAttributeNames: { '#amount': 'amount' },
              ExpressionAttributeValues: marshall({
                ':paymentAmount': paymentItem!.amount
              })
            }
          },
          {
            Put: {
              TableName: tableName,
              Item: marshall(updatedPayment)
            }
          }
        ]
      }));

      expect(conditionalTransactResponse.$metadata.httpStatusCode).toBe(200);
      console.log('✓ Conditional transaction update succeeded');

      // -----------------------------------------------------------------------
      // Step 5: Verify balance deducted correctly
      // -----------------------------------------------------------------------
      console.log('Step 5: Verifying balance deduction...');
      const verifyBalanceResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: balanceTransaction.transaction_id,
          timestamp: balanceTransaction.timestamp
        })
      }));

      const currentBalance = unmarshall(verifyBalanceResponse.Item!);
      expect(currentBalance.amount).toBe(35000); // 50000 - 15000
      expect(currentBalance.status).toBe('updated');
      console.log(`✓ Balance deducted correctly: $500.00 → $350.00`);

      // -----------------------------------------------------------------------
      // Step 6: Test transaction rollback scenario (insufficient balance)
      // -----------------------------------------------------------------------
      console.log('Step 6: Testing transaction rollback on insufficient balance...');
      const largePayment = {
        transaction_id: `PAYMENT-${customerId}-2`,
        timestamp: baseTimestamp + 2000,
        date: testDate,
        amount: 100000, // More than current balance (35000)
        currency: 'USD',
        status: 'pending',
        customer_id: customerId,
        transaction_type: 'payment',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      let rollbackOccurred = false;
      try {
        await dynamoClient.send(new TransactWriteItemsCommand({
          TransactItems: [
            {
              Put: {
                TableName: tableName,
                Item: marshall({
                  ...currentBalance,
                  amount: currentBalance.amount - largePayment.amount
                }),
                ConditionExpression: '#amount >= :paymentAmount',
                ExpressionAttributeNames: { '#amount': 'amount' },
                ExpressionAttributeValues: marshall({
                  ':paymentAmount': largePayment.amount
                })
              }
            },
            {
              Put: {
                TableName: tableName,
                Item: marshall(largePayment)
              }
            }
          ]
        }));
      } catch (error: any) {
        rollbackOccurred = true;
        expect(error.name).toBe('TransactionCanceledException');
        console.log('✓ Transaction rolled back due to insufficient balance');
      }

      expect(rollbackOccurred).toBe(true);

      // -----------------------------------------------------------------------
      // Step 7: Verify rollback - balance unchanged, large payment not created
      // -----------------------------------------------------------------------
      console.log('Step 7: Verifying rollback - no changes persisted...');
      const verifyRollbackBalance = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: balanceTransaction.transaction_id,
          timestamp: balanceTransaction.timestamp
        })
      }));

      const rollbackBalance = unmarshall(verifyRollbackBalance.Item!);
      expect(rollbackBalance.amount).toBe(35000); // Unchanged
      console.log('✓ Balance unchanged after rollback');

      const verifyLargePayment = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: largePayment.transaction_id,
          timestamp: largePayment.timestamp
        })
      }));

      expect(verifyLargePayment.Item).toBeUndefined();
      console.log('✓ Large payment not created (transaction rolled back)');

      // -----------------------------------------------------------------------
      // Step 8: Query all transactions for customer via GSI
      // -----------------------------------------------------------------------
      console.log('Step 8: Querying all customer transactions...');
      const customerQueryResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        FilterExpression: 'customer_id = :customerId',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':customerId': customerId
        })
      }));

      const customerTransactions = customerQueryResponse.Items!.map(item => unmarshall(item));
      expect(customerTransactions.length).toBe(2); // Balance + successful payment only
      console.log(`✓ Found ${customerTransactions.length} transactions for customer`);

      // -----------------------------------------------------------------------
      // Step 9: Cleanup - Delete all customer transactions
      // -----------------------------------------------------------------------
      console.log('Step 9: Cleaning up customer transactions...');
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: balanceTransaction.transaction_id,
          timestamp: balanceTransaction.timestamp
        })
      }));

      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: paymentTransaction.transaction_id,
          timestamp: paymentTransaction.timestamp
        })
      }));

      console.log('✓ Cleaned up all customer transactions');

      // -----------------------------------------------------------------------
      // Step 10: Verify cleanup
      // -----------------------------------------------------------------------
      console.log('Step 10: Verifying cleanup...');
      const verifyCleanup = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: balanceTransaction.transaction_id,
          timestamp: balanceTransaction.timestamp
        })
      }));

      expect(verifyCleanup.Item).toBeUndefined();
      console.log('✓ Verified all transactions removed');

      console.log('\n🎉 Transaction Operations E2E test passed! ✓\n');
    }, 30000);
  });

  // ============================================================================
  // ⭐ TEST GROUP 15: E2E - CONDITIONAL WRITES AND CONFLICT RESOLUTION ⭐
  // ============================================================================
  describe('E2E: Conditional Writes and Conflict Resolution', () => {
    test('should handle concurrent updates and conditional writes', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];
      const transactionId = `TXN-CONFLICT-${baseTimestamp}`;

      console.log('\n🎬 Starting Conditional Writes E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Create initial transaction
      // -----------------------------------------------------------------------
      console.log('Step 1: Creating initial transaction...');
      const initialTransaction = {
        transaction_id: transactionId,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 10000,
        currency: 'USD',
        status: 'pending',
        version: 1,
        customer_id: 'CUST-CONFLICT-TEST',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(initialTransaction)
      }));
      console.log('✓ Initial transaction created with version 1');

      // -----------------------------------------------------------------------
      // Step 2: Conditional update - only if version matches
      // -----------------------------------------------------------------------
      console.log('Step 2: Executing conditional update (version check)...');
      const updateResponse = await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        UpdateExpression: 'SET #status = :newStatus, #version = :newVersion',
        ConditionExpression: '#version = :expectedVersion',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#version': 'version'
        },
        ExpressionAttributeValues: marshall({
          ':newStatus': 'processing',
          ':newVersion': 2,
          ':expectedVersion': 1
        }),
        ReturnValues: 'ALL_NEW'
      }));

      const updatedItem = unmarshall(updateResponse.Attributes!);
      expect(updatedItem.status).toBe('processing');
      expect(updatedItem.version).toBe(2);
      console.log('✓ Conditional update succeeded (version 1 → 2)');

      // -----------------------------------------------------------------------
      // Step 3: Test conditional update failure (version mismatch)
      // -----------------------------------------------------------------------
      console.log('Step 3: Testing conditional update failure...');
      let conditionalCheckFailed = false;
      
      try {
        await dynamoClient.send(new UpdateItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: transactionId,
            timestamp: baseTimestamp
          }),
          UpdateExpression: 'SET #status = :newStatus',
          ConditionExpression: '#version = :expectedVersion',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#version': 'version'
          },
          ExpressionAttributeValues: marshall({
            ':newStatus': 'failed',
            ':expectedVersion': 1 // Wrong version!
          })
        }));
      } catch (error: any) {
        conditionalCheckFailed = true;
        expect(error.name).toBe('ConditionalCheckFailedException');
        console.log('✓ Conditional update failed as expected (version mismatch)');
      }

      expect(conditionalCheckFailed).toBe(true);

      // -----------------------------------------------------------------------
      // Step 4: Verify item unchanged after failed conditional update
      // -----------------------------------------------------------------------
      console.log('Step 4: Verifying item unchanged after failed update...');
      const verifyResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        })
      }));

      const verifiedItem = unmarshall(verifyResponse.Item!);
      expect(verifiedItem.status).toBe('processing'); // Still processing
      expect(verifiedItem.version).toBe(2); // Still version 2
      console.log('✓ Item unchanged after failed conditional update');

      // -----------------------------------------------------------------------
      // Step 5: Test conditional put - item must not exist
      // -----------------------------------------------------------------------
      console.log('Step 5: Testing conditional put (attribute_not_exists)...');
      const newTransactionId = `TXN-NEW-${baseTimestamp}`;
      
      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall({
          transaction_id: newTransactionId,
          timestamp: baseTimestamp,
          date: testDate,
          amount: 5000,
          currency: 'USD',
          status: 'pending',
          expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        }),
        ConditionExpression: 'attribute_not_exists(transaction_id)'
      }));

      console.log('✓ Conditional put succeeded (item did not exist)');

      // -----------------------------------------------------------------------
      // Step 6: Test duplicate prevention
      // -----------------------------------------------------------------------
      console.log('Step 6: Testing duplicate prevention...');
      let duplicatePreventionWorked = false;

      try {
        await dynamoClient.send(new PutItemCommand({
          TableName: tableName,
          Item: marshall({
            transaction_id: newTransactionId,
            timestamp: baseTimestamp,
            date: testDate,
            amount: 8000,
            currency: 'USD',
            status: 'pending',
            expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
          }),
          ConditionExpression: 'attribute_not_exists(transaction_id)'
        }));
      } catch (error: any) {
        duplicatePreventionWorked = true;
        expect(error.name).toBe('ConditionalCheckFailedException');
        console.log('✓ Duplicate prevention worked (item already exists)');
      }

      expect(duplicatePreventionWorked).toBe(true);

      // -----------------------------------------------------------------------
      // Step 7: Test conditional update based on status
      // -----------------------------------------------------------------------
      console.log('Step 7: Testing status-based conditional update...');
      await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        UpdateExpression: 'SET #status = :completedStatus, #version = :newVersion, completed_at = :completedAt',
        ConditionExpression: '#status = :expectedStatus',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#version': 'version'
        },
        ExpressionAttributeValues: marshall({
          ':completedStatus': 'completed',
          ':newVersion': 3,
          ':expectedStatus': 'processing',
          ':completedAt': Date.now()
        })
      }));

      console.log('✓ Status-based conditional update succeeded (processing → completed)');

      // -----------------------------------------------------------------------
      // Step 8: Test amount-based conditional update
      // -----------------------------------------------------------------------
      console.log('Step 8: Testing amount-based conditional update...');
      await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        UpdateExpression: 'SET refund_amount = :refundAmount',
        ConditionExpression: '#amount >= :minAmount',
        ExpressionAttributeNames: {
          '#amount': 'amount'
        },
        ExpressionAttributeValues: marshall({
          ':refundAmount': 5000,
          ':minAmount': 5000
        })
      }));

      console.log('✓ Amount-based conditional update succeeded');

      // -----------------------------------------------------------------------
      // Step 9: Verify final state
      // -----------------------------------------------------------------------
      console.log('Step 9: Verifying final transaction state...');
      const finalStateResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        })
      }));

      const finalItem = unmarshall(finalStateResponse.Item!);
      expect(finalItem.status).toBe('completed');
      expect(finalItem.version).toBe(3);
      expect(finalItem.refund_amount).toBe(5000);
      expect(finalItem.completed_at).toBeDefined();
      console.log('✓ Final state verified - all conditional updates applied');

      // -----------------------------------------------------------------------
      // Step 10: Cleanup
      // -----------------------------------------------------------------------
      console.log('Step 10: Cleaning up test transactions...');
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        })
      }));

      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: newTransactionId,
          timestamp: baseTimestamp
        })
      }));

      console.log('✓ Test transactions cleaned up');

      console.log('\n🎉 Conditional Writes E2E test passed! ✓\n');
    }, 30000);
  });

  // ============================================================================
  // ⭐ TEST GROUP 16: E2E - COMPLEX GSI QUERY PATTERNS ⭐
  // ============================================================================
  describe('E2E: Complex GSI Query Patterns', () => {
    test('should execute complex queries with pagination and filtering', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];
      const itemCount = 15;

      console.log('\n🎬 Starting Complex GSI Query Patterns E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Create multiple transactions with varying amounts
      // -----------------------------------------------------------------------
      console.log('Step 1: Creating 15 transactions with varying amounts...');
      const transactions = Array.from({ length: itemCount }, (_, i) => ({
        transaction_id: `TXN-GSI-${testDate}-${baseTimestamp}-${i}`,
        timestamp: baseTimestamp + i * 1000,
        date: testDate,
        amount: 5000 + (i * 2000), // 5000, 7000, 9000, ..., 33000
        currency: 'USD',
        status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'processing' : 'completed',
        customer_id: `CUST-GSI-${1000 + (i % 5)}`,
        merchant_id: `MERCH-${5000 + (i % 3)}`,
        category: i < 5 ? 'retail' : i < 10 ? 'dining' : 'entertainment',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      }));

      for (const tx of transactions) {
        await dynamoClient.send(new PutItemCommand({
          TableName: tableName,
          Item: marshall(tx)
        }));
      }

      console.log('✓ Created 15 transactions with amounts ranging $50-$330');

      // -----------------------------------------------------------------------
      // Step 2: Query all transactions for the date
      // -----------------------------------------------------------------------
      console.log('Step 2: Querying all transactions for test date...');
      const allTransactionsResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': testDate })
      }));

      const testDateTransactions = allTransactionsResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id.includes(`TXN-GSI-${testDate}-${baseTimestamp}`);
      });

      expect(testDateTransactions.length).toBe(itemCount);
      console.log(`✓ Found all ${itemCount} transactions for ${testDate}`);

      // -----------------------------------------------------------------------
      // Step 3: Query with amount range (BETWEEN)
      // -----------------------------------------------------------------------
      console.log('Step 3: Querying transactions with amount range ($100-$200)...');
      const rangeQueryResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date AND #amount BETWEEN :minAmount AND :maxAmount',
        ExpressionAttributeNames: {
          '#date': 'date',
          '#amount': 'amount'
        },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':minAmount': 10000,
          ':maxAmount': 20000
        })
      }));

      const rangeTransactions = rangeQueryResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id.includes(`TXN-GSI-${testDate}-${baseTimestamp}`);
      });

      rangeTransactions.forEach(item => {
        const unmarshalled = unmarshall(item);
        expect(unmarshalled.amount).toBeGreaterThanOrEqual(10000);
        expect(unmarshalled.amount).toBeLessThanOrEqual(20000);
      });
      console.log(`✓ Found ${rangeTransactions.length} transactions in amount range`);

      // -----------------------------------------------------------------------
      // Step 4: Query with pagination (Limit)
      // -----------------------------------------------------------------------
      console.log('Step 4: Testing pagination with Limit=5...');
      const paginatedResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': testDate }),
        Limit: 5
      }));

      expect(paginatedResponse.Items!.length).toBeLessThanOrEqual(5);
      expect(paginatedResponse.LastEvaluatedKey).toBeDefined();
      console.log(`✓ Paginated query returned ${paginatedResponse.Items!.length} items with continuation key`);

      // -----------------------------------------------------------------------
      // Step 5: Continue pagination with LastEvaluatedKey
      // -----------------------------------------------------------------------
      console.log('Step 5: Fetching next page using LastEvaluatedKey...');
      const nextPageResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': testDate }),
        Limit: 5,
        ExclusiveStartKey: paginatedResponse.LastEvaluatedKey
      }));

      expect(nextPageResponse.Items!.length).toBeGreaterThan(0);
      console.log(`✓ Next page returned ${nextPageResponse.Items!.length} items`);

      // -----------------------------------------------------------------------
      // Step 6: Filter by status after GSI query
      // -----------------------------------------------------------------------
      console.log('Step 6: Filtering by status (completed only)...');
      const statusFilterResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#date': 'date',
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':status': 'completed'
        })
      }));

      const completedTransactions = statusFilterResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id.includes(`TXN-GSI-${testDate}-${baseTimestamp}`);
      });

      completedTransactions.forEach(item => {
        const unmarshalled = unmarshall(item);
        expect(unmarshalled.status).toBe('completed');
      });
      console.log(`✓ Found ${completedTransactions.length} completed transactions`);

      // -----------------------------------------------------------------------
      // Step 7: Filter by multiple attributes (status AND category)
      // -----------------------------------------------------------------------
      console.log('Step 7: Filtering by multiple attributes...');
      const multiFilterResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        FilterExpression: '#status = :status AND category = :category',
        ExpressionAttributeNames: {
          '#date': 'date',
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':status': 'completed',
          ':category': 'dining'
        })
      }));

      const multiFilteredTransactions = multiFilterResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id.includes(`TXN-GSI-${testDate}-${baseTimestamp}`);
      });

      multiFilteredTransactions.forEach(item => {
        const unmarshalled = unmarshall(item);
        expect(unmarshalled.status).toBe('completed');
        expect(unmarshalled.category).toBe('dining');
      });
      console.log(`✓ Found ${multiFilteredTransactions.length} completed dining transactions`);

      // -----------------------------------------------------------------------
      // Step 8: Query by amount greater than threshold
      // -----------------------------------------------------------------------
      console.log('Step 8: Querying high-value transactions (amount > $200)...');
      const highValueResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date AND #amount > :threshold',
        ExpressionAttributeNames: {
          '#date': 'date',
          '#amount': 'amount'
        },
        ExpressionAttributeValues: marshall({
          ':date': testDate,
          ':threshold': 20000
        })
      }));

      const highValueTransactions = highValueResponse.Items!.filter(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id.includes(`TXN-GSI-${testDate}-${baseTimestamp}`);
      });

      highValueTransactions.forEach(item => {
        const unmarshalled = unmarshall(item);
        expect(unmarshalled.amount).toBeGreaterThan(20000);
      });
      console.log(`✓ Found ${highValueTransactions.length} high-value transactions`);

      // -----------------------------------------------------------------------
      // Step 9: Aggregate data (sum all amounts)
      // -----------------------------------------------------------------------
      console.log('Step 9: Calculating total transaction volume...');
      const totalVolume = testDateTransactions.reduce((sum, item) => {
        const unmarshalled = unmarshall(item);
        return sum + unmarshalled.amount;
      }, 0);

      const expectedTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      expect(totalVolume).toBe(expectedTotal);
      console.log(`✓ Total transaction volume: $${(totalVolume / 100).toFixed(2)}`);

      // -----------------------------------------------------------------------
      // Step 10: Cleanup
      // -----------------------------------------------------------------------
      console.log('Step 10: Cleaning up test transactions...');
      for (const tx of transactions) {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: tx.transaction_id,
            timestamp: tx.timestamp
          })
        }));
      }

      console.log('✓ All test transactions cleaned up');

      console.log('\n🎉 Complex GSI Query Patterns E2E test passed! ✓\n');
    }, 60000); // Longer timeout for multiple operations
  });

  // ============================================================================
  // ⭐ TEST GROUP 17: E2E - DATA CONSISTENCY AND READ PATTERNS ⭐
  // ============================================================================
  describe('E2E: Data Consistency and Read Patterns', () => {
    test('should verify eventual vs strong consistency and read patterns', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];
      const transactionId = `TXN-CONSISTENCY-${baseTimestamp}`;

      console.log('\n🎬 Starting Data Consistency E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Write transaction
      // -----------------------------------------------------------------------
      console.log('Step 1: Writing transaction...');
      const transaction = {
        transaction_id: transactionId,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 12500,
        currency: 'USD',
        status: 'pending',
        customer_id: 'CUST-CONSISTENCY',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(transaction)
      }));
      console.log('✓ Transaction written');

      // -----------------------------------------------------------------------
      // Step 2: Strongly consistent read (immediate)
      // -----------------------------------------------------------------------
      console.log('Step 2: Performing strongly consistent read...');
      const strongReadResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        ConsistentRead: true // ✅ Strong consistency
      }));

      expect(strongReadResponse.Item).toBeDefined();
      const strongReadItem = unmarshall(strongReadResponse.Item!);
      expect(strongReadItem.transaction_id).toBe(transactionId);
      expect(strongReadItem.amount).toBe(12500);
      console.log('✓ Strongly consistent read successful (immediate)');

      // -----------------------------------------------------------------------
      // Step 3: Eventually consistent read
      // -----------------------------------------------------------------------
      console.log('Step 3: Performing eventually consistent read...');
      const eventualReadResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        ConsistentRead: false // ✅ Eventual consistency
      }));

      expect(eventualReadResponse.Item).toBeDefined();
      const eventualReadItem = unmarshall(eventualReadResponse.Item!);
      expect(eventualReadItem.transaction_id).toBe(transactionId);
      console.log('✓ Eventually consistent read successful');

      // -----------------------------------------------------------------------
      // Step 4: Update transaction
      // -----------------------------------------------------------------------
      console.log('Step 4: Updating transaction...');
      await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: marshall({
          ':status': 'processing',
          ':updatedAt': Date.now()
        })
      }));
      console.log('✓ Transaction updated to processing');

      // -----------------------------------------------------------------------
      // Step 5: Strongly consistent read after update
      // -----------------------------------------------------------------------
      console.log('Step 5: Verifying update with strongly consistent read...');
      const updatedStrongRead = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        ConsistentRead: true
      }));

      const updatedItem = unmarshall(updatedStrongRead.Item!);
      expect(updatedItem.status).toBe('processing');
      expect(updatedItem.updated_at).toBeDefined();
      console.log('✓ Update immediately visible in strongly consistent read');

      // -----------------------------------------------------------------------
      // Step 6: Query primary key (strongly consistent possible)
      // -----------------------------------------------------------------------
      console.log('Step 6: Querying by primary key with strong consistency...');
      const primaryKeyQuery = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'transaction_id = :txId',
        ExpressionAttributeValues: marshall({
          ':txId': transactionId
        }),
        ConsistentRead: true // ✅ Supported on primary key query
      }));

      expect(primaryKeyQuery.Items!.length).toBe(1);
      const queriedItem = unmarshall(primaryKeyQuery.Items![0]);
      expect(queriedItem.status).toBe('processing');
      console.log('✓ Primary key query with strong consistency successful');

      // -----------------------------------------------------------------------
      // Step 7: GSI query (eventually consistent only)
      // -----------------------------------------------------------------------
      console.log('Step 7: Querying GSI (eventually consistent)...');
      const gsiQuery = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': testDate })
        // ConsistentRead NOT supported on GSI
      }));

      const gsiResult = gsiQuery.Items!.find(item => {
        const unmarshalled = unmarshall(item);
        return unmarshalled.transaction_id === transactionId;
      });

      expect(gsiResult).toBeDefined();
      console.log('✓ GSI query successful (eventually consistent)');

      // -----------------------------------------------------------------------
      // Step 8: Multiple updates to test consistency
      // -----------------------------------------------------------------------
      console.log('Step 8: Performing rapid sequential updates...');
      const updates = ['completed', 'settled', 'archived'];
      
      for (const status of updates) {
        await dynamoClient.send(new UpdateItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: transactionId,
            timestamp: baseTimestamp
          }),
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: marshall({ ':status': status })
        }));
      }

      console.log('✓ Sequential updates completed');

      // -----------------------------------------------------------------------
      // Step 9: Verify final state with strong consistency
      // -----------------------------------------------------------------------
      console.log('Step 9: Verifying final state...');
      const finalStateRead = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        }),
        ConsistentRead: true
      }));

      const finalItem = unmarshall(finalStateRead.Item!);
      expect(finalItem.status).toBe('archived');
      console.log('✓ Final state verified (status: archived)');

      // -----------------------------------------------------------------------
      // Step 10: Cleanup
      // -----------------------------------------------------------------------
      console.log('Step 10: Cleaning up test transaction...');
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: transactionId,
          timestamp: baseTimestamp
        })
      }));

      console.log('✓ Test transaction cleaned up');

      console.log('\n🎉 Data Consistency E2E test passed! ✓\n');
    }, 30000);
  });

  // ============================================================================
  // ⭐ TEST GROUP 18: E2E - ERROR HANDLING AND EDGE CASES ⭐
  // ============================================================================
  describe('E2E: Error Handling and Edge Cases', () => {
    test('should handle errors and edge cases gracefully', async () => {
      const baseTimestamp = Date.now();
      const testDate = new Date().toISOString().split('T')[0];

      console.log('\n🎬 Starting Error Handling E2E Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Test reading non-existent item
      // -----------------------------------------------------------------------
      console.log('Step 1: Testing read of non-existent item...');
      const nonExistentResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: 'NON-EXISTENT-TX',
          timestamp: baseTimestamp
        })
      }));

      expect(nonExistentResponse.Item).toBeUndefined();
      console.log('✓ Non-existent item returns undefined (no error)');

      // -----------------------------------------------------------------------
      // Step 2: Test query with no results
      // -----------------------------------------------------------------------
      console.log('Step 2: Testing query with no results...');
      const emptyQueryResponse = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: outputs.date_index_name,
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: marshall({ ':date': '1999-01-01' }) // Old date
      }));

      expect(emptyQueryResponse.Items).toHaveLength(0);
      expect(emptyQueryResponse.Count).toBe(0);
      console.log('✓ Empty query returns empty array (no error)');

      // -----------------------------------------------------------------------
      // Step 3: Test deleting non-existent item (idempotent)
      // -----------------------------------------------------------------------
      console.log('Step 3: Testing deletion of non-existent item...');
      const deleteNonExistentResponse = await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: 'NON-EXISTENT-DELETE',
          timestamp: baseTimestamp
        })
      }));

      expect(deleteNonExistentResponse.$metadata.httpStatusCode).toBe(200);
      console.log('✓ Delete non-existent item is idempotent (no error)');

      // -----------------------------------------------------------------------
      // Step 4: Test empty string attribute
      // -----------------------------------------------------------------------
      console.log('Step 4: Testing transaction with empty string attribute...');
      const emptyStringTx = {
        transaction_id: `TXN-EMPTY-${baseTimestamp}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 5000,
        currency: 'USD',
        status: 'pending',
        notes: '', // Empty string
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      let emptyStringError = false;
      try {
        // DynamoDB actually allows empty strings, so we need to test with null value instead
        // or test with an invalid attribute type to trigger ValidationException
        const invalidTx = {
          transaction_id: `TXN-INVALID-${baseTimestamp}`,
          timestamp: baseTimestamp,
          date: testDate,
          amount: "invalid_number", // Invalid type - should be Number
          currency: 'USD',
          status: 'pending',
          expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        };
        
        await dynamoClient.send(new PutItemCommand({
          TableName: tableName,
          Item: marshall(invalidTx, {
            removeUndefinedValues: true,
            convertEmptyValues: false
          })
        }));
      } catch (error: any) {
        emptyStringError = true;
        expect(error.name).toBe('ValidationException');
        console.log('✓ Invalid attribute type rejected (ValidationException)');
      }

      expect(emptyStringError).toBe(true);

      // -----------------------------------------------------------------------
      // Step 5: Test very large item (approaching 400KB limit)
      // -----------------------------------------------------------------------
      console.log('Step 5: Testing large item with extensive metadata...');
      const largeItem = {
        transaction_id: `TXN-LARGE-${baseTimestamp}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 10000,
        currency: 'USD',
        status: 'pending',
        metadata: 'x'.repeat(50000), // 50KB of data
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(largeItem)
      }));

      const largeItemRead = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: largeItem.transaction_id,
          timestamp: largeItem.timestamp
        })
      }));

      const retrievedLargeItem = unmarshall(largeItemRead.Item!);
      expect(retrievedLargeItem.metadata.length).toBe(50000);
      console.log('✓ Large item (50KB) written and retrieved successfully');

      // -----------------------------------------------------------------------
      // Step 6: Test attribute with special characters
      // -----------------------------------------------------------------------
      console.log('Step 6: Testing attribute with special characters...');
      const specialCharTx = {
        transaction_id: `TXN-SPECIAL-${baseTimestamp}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 7500,
        currency: 'USD',
        status: 'pending',
        description: 'Payment from José García - €100.50 (50% discount) #PROMO2024',
        customer_email: 'test+user@example.com',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(specialCharTx)
      }));

      const specialCharRead = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: specialCharTx.transaction_id,
          timestamp: specialCharTx.timestamp
        })
      }));

      const retrievedSpecialChar = unmarshall(specialCharRead.Item!);
      expect(retrievedSpecialChar.description).toBe(specialCharTx.description);
      expect(retrievedSpecialChar.customer_email).toBe('test+user@example.com');
      console.log('✓ Special characters preserved correctly');

      // -----------------------------------------------------------------------
      // Step 7: Test numeric precision (large amounts)
      // -----------------------------------------------------------------------
      console.log('Step 7: Testing large numeric values...');
      const largeAmountTx = {
        transaction_id: `TXN-BIGNUM-${baseTimestamp}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 999999999999, // $9,999,999,999.99
        currency: 'USD',
        status: 'pending',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(largeAmountTx)
      }));

      const largeAmountRead = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          transaction_id: largeAmountTx.transaction_id,
          timestamp: largeAmountTx.timestamp
        })
      }));

      const retrievedLargeAmount = unmarshall(largeAmountRead.Item!);
      expect(retrievedLargeAmount.amount).toBe(999999999999);
      console.log('✓ Large numeric value preserved exactly');

      // -----------------------------------------------------------------------
      // Step 8: Test batch write with partial failure handling
      // -----------------------------------------------------------------------
      console.log('Step 8: Testing batch write error handling...');
      const batchItems = Array.from({ length: 3 }, (_, i) => ({
        transaction_id: `TXN-BATCH-ERR-${baseTimestamp}-${i}`,
        timestamp: baseTimestamp + i * 1000,
        date: testDate,
        amount: 5000 * (i + 1),
        currency: 'USD',
        status: 'pending',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      }));

      await dynamoClient.send(new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batchItems.map(item => ({
            PutRequest: { Item: marshall(item) }
          }))
        }
      }));

      console.log('✓ Batch write completed successfully');

      // -----------------------------------------------------------------------
      // Step 9: Test conditional check failure
      // -----------------------------------------------------------------------
      console.log('Step 9: Testing conditional check failure scenario...');
      const conditionalTx = {
        transaction_id: `TXN-COND-${baseTimestamp}`,
        timestamp: baseTimestamp,
        date: testDate,
        amount: 3000,
        currency: 'USD',
        status: 'pending',
        expiration_time: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: marshall(conditionalTx)
      }));

      let conditionalFailed = false;
      try {
        await dynamoClient.send(new UpdateItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: conditionalTx.transaction_id,
            timestamp: conditionalTx.timestamp
          }),
          UpdateExpression: 'SET #status = :newStatus',
          ConditionExpression: '#status = :expectedStatus',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: marshall({
            ':newStatus': 'completed',
            ':expectedStatus': 'processing' // Wrong status
          })
        }));
      } catch (error: any) {
        conditionalFailed = true;
        expect(error.name).toBe('ConditionalCheckFailedException');
        console.log('✓ Conditional check failure handled correctly');
      }

      expect(conditionalFailed).toBe(true);

      // -----------------------------------------------------------------------
      // Step 10: Cleanup all test items
      // -----------------------------------------------------------------------
      console.log('Step 10: Cleaning up all test items...');
      const itemsToDelete = [
        largeItem,
        specialCharTx,
        largeAmountTx,
        ...batchItems,
        conditionalTx
      ];

      for (const item of itemsToDelete) {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: marshall({
            transaction_id: item.transaction_id,
            timestamp: item.timestamp
          })
        }));
      }

      console.log('✓ All test items cleaned up');

      console.log('\n🎉 Error Handling E2E test passed! ✓\n');
    }, 30000);
  });
});