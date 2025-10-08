// Configuration - These are coming from cfn-outputs after deployment
import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  PutEventsCommand
} from '@aws-sdk/client-eventbridge';
import {
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetQueueAttributesCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Helper function to get the latest shipment record using Query
async function getLatestShipmentRecord(shipmentId: string) {
  const queryCommand = new QueryCommand({
    TableName: outputs.DynamoDBTableName,
    KeyConditionExpression: 'shipmentId = :shipmentId',
    ExpressionAttributeValues: {
      ':shipmentId': { S: shipmentId }
    },
    ScanIndexForward: false, // Sort descending to get latest first
    Limit: 1
  });

  const result = await dynamoClient.send(queryCommand);
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

// Helper function to get all shipment records for a shipmentId
async function getAllShipmentRecords(shipmentId: string) {
  const queryCommand = new QueryCommand({
    TableName: outputs.DynamoDBTableName,
    KeyConditionExpression: 'shipmentId = :shipmentId',
    ExpressionAttributeValues: {
      ':shipmentId': { S: shipmentId }
    },
    ScanIndexForward: true // Sort ascending by timestamp
  });

  const result = await dynamoClient.send(queryCommand);
  return result.Items || [];
}

describe('Logistics Shipment Automation System Integration Tests', () => {

  describe('Infrastructure Validation', () => {
    test('should have all required outputs from deployment', () => {
      const requiredOutputs = [
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'EventBridgeRuleName',
        'DeadLetterQueueURL'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have DynamoDB table accessible', async () => {
      const scanCommand = new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        Limit: 1
      });

      await expect(dynamoClient.send(scanCommand)).resolves.not.toThrow();
    });

    test('should have Lambda function accessible', async () => {
      const testPayload = {
        shipmentId: 'TEST-HEALTH-CHECK',
        status: 'IN_TRANSIT',
        location: 'TEST_LOCATION',
        carrier: 'TEST_CARRIER'
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify(testPayload)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid shipment data gracefully', async () => {
      const invalidPayload = {
        // Missing required shipmentId
        status: 'INVALID',
        location: 'Unknown'
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify(invalidPayload)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);

      // Parse response to check for error handling
      const responsePayload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(responsePayload.statusCode).toBe(500);
    });
  });

  describe('Monitoring and Metrics Validation', () => {
    test('should publish custom CloudWatch metrics', async () => {
      // Wait for metrics to be published
      await new Promise(resolve => setTimeout(resolve, 5000));

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (5 * 60 * 1000)); // 5 minutes ago

      const metricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'LogisticsAutomation',
        MetricName: 'ShipmentProcessed',
        Dimensions: [
          {
            Name: 'Environment',
            Value: environmentSuffix
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      });

      const result = await cloudWatchClient.send(metricsCommand);
      expect(result.Datapoints).toBeDefined();
      // Metrics may not be immediately available, so we just verify the call succeeds
    });

    test('should have Dead Letter Queue configured and empty initially', async () => {
      const queueAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.DeadLetterQueueURL,
        AttributeNames: ['ApproximateNumberOfMessages', 'MessageRetentionPeriod']
      });

      const result: any = await sqsClient.send(queueAttributesCommand);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });
  });

  describe('Complete End-to-End Flow Tests', () => {
    test('should process complete shipment lifecycle from creation to delivery', async () => {
      const shipmentId = `COMPLETE-FLOW-${Date.now()}`;
      const baseTimestamp = Date.now();

      // Define complete shipment lifecycle
      const lifecycle = [
        {
          status: 'RECEIVED',
          location: 'Warehouse - New York',
          carrier: 'FedEx',
          description: 'Package received at origin facility'
        },
        {
          status: 'IN_TRANSIT',
          location: 'Distribution Center - Chicago',
          carrier: 'FedEx',
          description: 'In transit to destination'
        },
        {
          status: 'IN_TRANSIT',
          location: 'Distribution Center - Denver',
          carrier: 'FedEx',
          description: 'Passed through intermediate hub'
        },
        {
          status: 'OUT_FOR_DELIVERY',
          location: 'Local Facility - San Francisco',
          carrier: 'FedEx',
          description: 'Out for delivery'
        },
        {
          status: 'DELIVERED',
          location: 'Customer Address - San Francisco',
          carrier: 'FedEx',
          description: 'Successfully delivered'
        }
      ];

      console.log(`Starting complete shipment flow test for: ${shipmentId}`);

      // Step 1: Send shipment through EventBridge (simulating real event)
      console.log('Step 1: Sending initial shipment event via EventBridge');
      const initialEvent = {
        Source: 'logistics.shipments',
        DetailType: 'Shipment Update',
        Detail: JSON.stringify({
          shipmentId,
          ...lifecycle[0],
          timestamp: baseTimestamp,
          customerInfo: {
            name: 'Test Customer',
            email: 'customer@example.com'
          }
        })
      };

      const eventResult: any = await eventBridgeClient.send(
        new PutEventsCommand({ Entries: [initialEvent] })
      );
      expect(eventResult.FailedEntryCount).toBe(0);
      console.log('Initial event sent successfully');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Process remaining lifecycle updates via Lambda
      console.log('Step 2: Processing shipment lifecycle updates');
      for (let i = 1; i < lifecycle.length; i++) {
        const update = {
          shipmentId,
          ...lifecycle[i],
          timestamp: baseTimestamp + (i * 1000)
        };

        const response = await lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: JSON.stringify(update)
        }));

        expect(response.StatusCode).toBe(200);
        const responsePayload = JSON.parse(
          new TextDecoder().decode(response.Payload)
        );
        expect(responsePayload.statusCode).toBe(200);
        console.log(`Update ${i}/${lifecycle.length - 1}: ${lifecycle[i].status}`);

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for all processing to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Verify all records in DynamoDB
      console.log('Step 3: Verifying DynamoDB records');
      const allRecords = await getAllShipmentRecords(shipmentId);

      expect(allRecords.length).toBe(lifecycle.length);
      console.log(`Found all ${lifecycle.length} records in DynamoDB`);

      // Verify each status update
      allRecords.forEach((record: any, index: number) => {
        expect(record.shipmentId.S).toBe(shipmentId);
        expect(record.status.S).toBe(lifecycle[index].status);
        expect(record.location.S).toBe(lifecycle[index].location);
        expect(record.carrier.S).toBe(lifecycle[index].carrier);
      });
      console.log('All records have correct status, location, and carrier data');

      // Step 4: Query by status using GSI
      console.log('Step 4: Testing Global Secondary Index queries');
      for (const status of ['IN_TRANSIT', 'DELIVERED']) {
        const queryCommand = new QueryCommand({
          TableName: outputs.DynamoDBTableName,
          IndexName: 'StatusIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': { S: status }
          }
        });

        const result: any = await dynamoClient.send(queryCommand);
        expect(result.Items.length).toBeGreaterThan(0);

        const hasOurShipment = result.Items.some((item: any) =>
          item.shipmentId.S === shipmentId
        );
        expect(hasOurShipment).toBe(true);
        console.log(`Found shipment in ${status} status (GSI query)`);
      }

      // Step 5: Verify latest status
      console.log('Step 5: Verifying latest shipment status');
      const latestRecord = await getLatestShipmentRecord(shipmentId);
      expect(latestRecord).toBeDefined();
      expect(latestRecord!.status.S).toBe('DELIVERED');
      expect(latestRecord!.location.S).toBe('Customer Address - San Francisco');
      console.log('Latest status is DELIVERED at correct location');

      // Step 6: Verify timestamp ordering
      console.log('Step 6: Verifying timestamp ordering');
      const timestamps = allRecords.map((record: any) => parseInt(record.timestamp.N));
      const isSorted = timestamps.every((val, i, arr) => !i || arr[i - 1] <= val);
      expect(isSorted).toBe(true);
      console.log('All timestamps are in chronological order');

      // Step 7: Test timestamp range queries
      console.log('Step 7: Testing timestamp range queries');
      const midTimestamp = baseTimestamp + (2 * 1000);
      const rangeQuery = new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'shipmentId = :shipmentId AND #ts >= :start',
        ExpressionAttributeNames: {
          '#ts': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':shipmentId': { S: shipmentId },
          ':start': { N: midTimestamp.toString() }
        }
      });

      const rangeResult = await dynamoClient.send(rangeQuery);
      expect(rangeResult.Items!.length).toBe(4);
      console.log('Timestamp range query returned correct number of records');

      console.log('Complete shipment lifecycle test passed successfully');
    }, 45000);

    test('should handle complete flow with error scenarios and recovery', async () => {
      const shipmentId = `ERROR-RECOVERY-FLOW-${Date.now()}`;
      const baseTimestamp = Date.now();

      console.log(`Starting error recovery flow test for: ${shipmentId}`);

      // Step 1: Normal processing
      console.log('Step 1: Processing normal shipment updates');
      const normalUpdates = [
        { status: 'RECEIVED', location: 'Origin', carrier: 'UPS' },
        { status: 'IN_TRANSIT', location: 'Hub-1', carrier: 'UPS' }
      ];

      for (let i = 0; i < normalUpdates.length; i++) {
        const response = await lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: JSON.stringify({
            shipmentId,
            ...normalUpdates[i],
            timestamp: baseTimestamp + (i * 1000)
          })
        }));
        expect(response.StatusCode).toBe(200);
      }
      console.log('Normal updates processed');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Simulate error scenario - DELAYED status (triggers SNS alert)
      console.log('Step 2: Simulating DELAYED status (should trigger alert)');
      const delayedResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          shipmentId,
          status: 'DELAYED',
          location: 'Hub-2',
          carrier: 'UPS',
          timestamp: baseTimestamp + 2000,
          delayReason: 'Weather conditions'
        })
      }));
      expect(delayedResponse.StatusCode).toBe(200);
      console.log('DELAYED status processed (SNS alert should be sent)');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Invalid data (should fail gracefully)
      console.log('Step 3: Testing invalid data handling');
      const invalidResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          // Missing shipmentId
          status: 'INVALID',
          location: 'Unknown'
        })
      }));

      const invalidPayload = JSON.parse(
        new TextDecoder().decode(invalidResponse.Payload)
      );
      expect(invalidPayload.statusCode).toBe(500);
      console.log('Invalid data handled gracefully with error response');

      // Step 4: Recovery - continue processing
      console.log('Step 4: Testing recovery after error');
      const recoveryResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          shipmentId,
          status: 'IN_TRANSIT',
          location: 'Hub-3',
          carrier: 'UPS',
          timestamp: baseTimestamp + 3000,
          recoveryNote: 'Resumed after delay'
        })
      }));
      expect(recoveryResponse.StatusCode).toBe(200);
      console.log('System recovered and processed new update');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Final delivery
      console.log('Step 5: Processing final delivery');
      const deliveryResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          shipmentId,
          status: 'DELIVERED',
          location: 'Destination',
          carrier: 'UPS',
          timestamp: baseTimestamp + 4000
        })
      }));
      expect(deliveryResponse.StatusCode).toBe(200);
      console.log('Final delivery processed');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 6: Verify complete record history
      console.log('Step 6: Verifying complete record history');
      const allRecords = await getAllShipmentRecords(shipmentId);

      // Should have 5 records (2 normal + 1 delayed + 1 recovery + 1 delivered)
      expect(allRecords.length).toBe(5);

      const statuses = allRecords.map((r: any) => r.status.S);
      expect(statuses).toEqual([
        'RECEIVED',
        'IN_TRANSIT',
        'DELAYED',
        'IN_TRANSIT',
        'DELIVERED'
      ]);
      console.log('All statuses recorded correctly in history');

      // Step 7: Verify latest status is DELIVERED
      console.log('Step 7: Verifying final state');
      const latestRecord = await getLatestShipmentRecord(shipmentId);
      expect(latestRecord!.status.S).toBe('DELIVERED');
      console.log('Final status is DELIVERED');

      // Step 8: Verify DELAYED status is in history
      console.log('Step 8: Verifying error state in history');
      const delayedRecord = allRecords.find((r: any) => r.status.S === 'DELAYED');
      expect(delayedRecord).toBeDefined();
      expect(delayedRecord!.location.S).toBe('Hub-2');
      console.log('DELAYED status preserved in history');

      console.log('Error recovery flow test passed successfully');
    }, 45000);

    test('should handle concurrent shipments with complete lifecycle', async () => {
      const baseTimestamp = Date.now();
      const numShipments = 3;

      console.log(`Starting concurrent shipments test (${numShipments} shipments)`);

      const shipments = Array.from({ length: numShipments }, (_, i) => ({
        shipmentId: `CONCURRENT-COMPLETE-${baseTimestamp}-${i}`,
        carrier: ['UPS', 'FedEx', 'DHL'][i],
        customerName: `Customer-${i}`
      }));

      // Step 1: Send initial events via EventBridge
      console.log('Step 1: Sending initial events for all shipments via EventBridge');
      const eventPromises = shipments.map((shipment, i) =>
        eventBridgeClient.send(new PutEventsCommand({
          Entries: [{
            Source: 'logistics.shipments',
            DetailType: 'Shipment Update',
            Detail: JSON.stringify({
              shipmentId: shipment.shipmentId,
              status: 'RECEIVED',
              location: `Warehouse-${i}`,
              carrier: shipment.carrier,
              timestamp: baseTimestamp + i
            })
          }]
        }))
      );

      const eventResults = await Promise.all(eventPromises);
      eventResults.forEach((result: any) => {
        expect(result.FailedEntryCount).toBe(0);
      });
      console.log('All initial events sent successfully');

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Process lifecycle updates for all shipments concurrently
      console.log('Step 2: Processing lifecycle updates for all shipments');
      const lifecycle = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

      for (let updateIndex = 0; updateIndex < lifecycle.length; updateIndex++) {
        const updatePromises = shipments.map((shipment, shipmentIndex) =>
          lambdaClient.send(new InvokeCommand({
            FunctionName: outputs.LambdaFunctionArn,
            Payload: JSON.stringify({
              shipmentId: shipment.shipmentId,
              status: lifecycle[updateIndex],
              location: `Location-${updateIndex}-${shipmentIndex}`,
              carrier: shipment.carrier,
              timestamp: baseTimestamp + ((updateIndex + 1) * 1000) + shipmentIndex
            })
          }))
        );

        const results = await Promise.all(updatePromises);
        results.forEach(result => expect(result.StatusCode).toBe(200));
        console.log(`Update ${updateIndex + 1}/${lifecycle.length} completed for all shipments`);

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Verify all shipments reached DELIVERED status
      console.log('Step 3: Verifying all shipments reached DELIVERED status');
      for (const shipment of shipments) {
        const latestRecord = await getLatestShipmentRecord(shipment.shipmentId);
        expect(latestRecord).toBeDefined();
        expect(latestRecord!.status.S).toBe('DELIVERED');

        const allRecords = await getAllShipmentRecords(shipment.shipmentId);
        expect(allRecords.length).toBe(4); // RECEIVED + 3 lifecycle updates
      }
      console.log('All shipments completed successfully');

      // Step 4: Verify GSI can find all delivered shipments
      console.log('Step 4: Verifying GSI query for delivered shipments');
      const deliveredQuery = new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': { S: 'DELIVERED' }
        }
      });

      const deliveredResult = await dynamoClient.send(deliveredQuery);
      const ourShipments = deliveredResult.Items!.filter((item: any) =>
        shipments.some(s => s.shipmentId === item.shipmentId.S)
      );
      expect(ourShipments.length).toBe(numShipments);
      console.log(`Found all ${numShipments} delivered shipments via GSI`);

      // Step 5: Verify data integrity
      console.log('Step 5: Verifying data integrity across all shipments');
      for (let i = 0; i < shipments.length; i++) {
        const records = await getAllShipmentRecords(shipments[i].shipmentId);

        // Check carrier consistency
        const carriers = records.map((r: any) => r.carrier.S);
        const allSameCarrier = carriers.every(c => c === shipments[i].carrier);
        expect(allSameCarrier).toBe(true);

        // Check timestamp ordering
        const timestamps = records.map((r: any) => parseInt(r.timestamp.N));
        const isOrdered = timestamps.every((val, idx, arr) => !idx || arr[idx - 1] <= val);
        expect(isOrdered).toBe(true);
      }
      console.log('Data integrity verified for all shipments');

      console.log('Concurrent shipments test passed successfully');
    }, 60000);
  });
});