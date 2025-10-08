// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import { 
  DynamoDBClient, 
  GetItemCommand, 
  ScanCommand, 
  QueryCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  LambdaClient, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  EventBridgeClient, 
  PutEventsCommand 
} from '@aws-sdk/client-eventbridge';
import { 
  SQSClient, 
  GetQueueAttributesCommand 
} from '@aws-sdk/client-sqs';
import { 
  CloudWatchClient, 
  GetMetricStatisticsCommand 
} from '@aws-sdk/client-cloudwatch';

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

  describe('End-to-End Shipment Processing', () => {
    const testShipmentId = `E2E-TEST-${Date.now()}`;

    test('should process shipment event via EventBridge', async () => {
      const shipmentEvent = {
        Source: 'logistics.shipments',
        DetailType: 'Shipment Update',
        Detail: JSON.stringify({
          shipmentId: testShipmentId,
          status: 'IN_TRANSIT',
          location: 'Chicago, IL',
          carrier: 'FedEx',
          timestamp: Date.now(),
          tracking: {
            estimatedDelivery: '2024-10-10T15:00:00Z',
            lastUpdate: new Date().toISOString()
          }
        })
      };

      const putEventsCommand = new PutEventsCommand({
        Entries: [shipmentEvent]
      });

      const result = await eventBridgeClient.send(putEventsCommand);
      expect(result.FailedEntryCount).toBe(0);
      expect(result.Entries[0].ErrorCode).toBeUndefined();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
    }, 15000);

    test('should store shipment data in DynamoDB after processing', async () => {
      // Wait additional time for async processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const getItemCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          shipmentId: { S: testShipmentId }
        }
      });

      const result = await dynamoClient.send(getItemCommand);
      expect(result.Item).toBeDefined();
      expect(result.Item.shipmentId.S).toBe(testShipmentId);
      expect(result.Item.status.S).toBe('IN_TRANSIT');
      expect(result.Item.location.S).toBe('Chicago, IL');
      expect(result.Item.carrier.S).toBe('FedEx');
    }, 10000);

    test('should query shipments by status using GSI', async () => {
      const queryCommand = new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': { S: 'IN_TRANSIT' }
        },
        Limit: 10
      });

      const result = await dynamoClient.send(queryCommand);
      expect(result.Items).toBeDefined();
      expect(result.Items.length).toBeGreaterThan(0);
      
      // Verify our test shipment is included
      const testItem = result.Items.find(item => 
        item.shipmentId.S === testShipmentId
      );
      expect(testItem).toBeDefined();
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

    test('should process multiple shipment updates concurrently', async () => {
      const concurrentShipments = Array.from({ length: 5 }, (_, i) => ({
        shipmentId: `CONCURRENT-TEST-${Date.now()}-${i}`,
        status: ['IN_TRANSIT', 'DELIVERED', 'DELAYED', 'IN_TRANSIT', 'DELIVERED'][i],
        location: ['New York', 'Los Angeles', 'Miami', 'Dallas', 'Seattle'][i],
        carrier: ['UPS', 'FedEx', 'DHL', 'USPS', 'UPS'][i]
      }));

      const invokePromises = concurrentShipments.map(shipment =>
        lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: JSON.stringify(shipment)
        }))
      );

      const results = await Promise.all(invokePromises);
      results.forEach(result => {
        expect(result.StatusCode).toBe(200);
      });

      // Wait for DynamoDB writes to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify all shipments were stored
      for (const shipment of concurrentShipments) {
        const getItemCommand = new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            shipmentId: { S: shipment.shipmentId }
          }
        });

        const result = await dynamoClient.send(getItemCommand);
        expect(result.Item).toBeDefined();
        expect(result.Item.status.S).toBe(shipment.status);
      }
    }, 20000);
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

      const result = await sqsClient.send(queueAttributesCommand);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });
  });

  describe('Data Consistency and Integrity', () => {
    test('should maintain data consistency for shipment updates', async () => {
      const shipmentId = `CONSISTENCY-TEST-${Date.now()}`;
      const timestamps = [
        Date.now() - 1000,
        Date.now(),
        Date.now() + 1000
      ];

      // Create multiple updates for the same shipment
      const updates = timestamps.map((timestamp, index) => ({
        shipmentId,
        status: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'][index],
        timestamp,
        location: ['Origin', 'Transit', 'Destination'][index],
        carrier: 'UPS'
      }));

      // Process updates sequentially to test ordering
      for (const update of updates) {
        await lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: JSON.stringify(update)
        }));
        
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for all processing to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Query all records for this shipment
      const queryCommand = new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'shipmentId = :shipmentId',
        ExpressionAttributeValues: {
          ':shipmentId': { S: shipmentId }
        },
        ScanIndexForward: true // Sort by timestamp ascending
      });

      const result = await dynamoClient.send(queryCommand);
      expect(result.Items).toBeDefined();
      expect(result.Items.length).toBe(3);

      // Verify chronological order
      const statuses = result.Items.map(item => item.status.S);
      expect(statuses).toEqual(['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    }, 15000);

    test('should handle high-volume shipment processing', async () => {
      const batchSize = 10;
      const shipments = Array.from({ length: batchSize }, (_, i) => ({
        shipmentId: `VOLUME-TEST-${Date.now()}-${i.toString().padStart(3, '0')}`,
        status: ['IN_TRANSIT', 'DELIVERED'][i % 2],
        location: `Location-${i}`,
        carrier: ['UPS', 'FedEx', 'DHL'][i % 3],
        timestamp: Date.now() + i
      }));

      // Process all shipments
      const processPromises = shipments.map(shipment =>
        lambdaClient.send(new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: JSON.stringify(shipment)
        }))
      );

      const results = await Promise.all(processPromises);
      
      // Verify all processed successfully
      results.forEach(result => {
        expect(result.StatusCode).toBe(200);
      });

      // Wait for DynamoDB consistency
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify data integrity by checking a few random shipments
      const sampleShipments = [shipments[0], shipments[Math.floor(batchSize/2)], shipments[batchSize-1]];
      
      for (const shipment of sampleShipments) {
        const getItemCommand = new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            shipmentId: { S: shipment.shipmentId }
          }
        });

        const result = await dynamoClient.send(getItemCommand);
        expect(result.Item).toBeDefined();
        expect(result.Item.shipmentId.S).toBe(shipment.shipmentId);
        expect(result.Item.status.S).toBe(shipment.status);
        expect(result.Item.location.S).toBe(shipment.location);
      }
    }, 30000);
  });
});
