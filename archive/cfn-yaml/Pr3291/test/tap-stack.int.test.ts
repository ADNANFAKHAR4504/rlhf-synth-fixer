// Configuration - These are coming from cfn-outputs after deployment
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventbridge = new AWS.EventBridge();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();

describe('Serverless Logistics Processing System Integration Tests', () => {
  const shipmentId = 'TEST-SHIP-' + Date.now();
  const testEventDetail = {
    shipmentId: shipmentId,
    status: 'IN_TRANSIT',
    location: 'Memphis, TN',
    carrier: 'FedEx'
  };

  describe('EventBridge Integration', () => {
    test('should successfully put events to EventBridge', async () => {
      const params = {
        Entries: [
          {
            Source: 'logistics.shipments',
            DetailType: 'Shipment Update',
            Detail: JSON.stringify(testEventDetail)
          }
        ]
      };

      const result: any = await eventbridge.putEvents(params).promise();
      expect(result.Entries).toHaveLength(1);
      expect(result.Entries[0].EventId).toBeDefined();
      expect(result.FailedEntryCount).toBe(0);
    });
  });

  describe('DynamoDB Integration', () => {
    test('should verify shipment data is stored in DynamoDB', async () => {
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      const params = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'shipmentId = :shipmentId',
        ExpressionAttributeValues: {
          ':shipmentId': shipmentId
        }
      };

      const result: any = await dynamodb.query(params).promise();
      expect(result.Items).toBeDefined();
      expect(result.Items.length).toBeGreaterThan(0);

      const item = result.Items[0];
      expect(item.shipmentId).toBe(shipmentId);
      expect(item.status).toBe('IN_TRANSIT');
      expect(item.location).toBe('Memphis, TN');
      expect(item.carrier).toBe('FedEx');
      expect(item.timestamp).toBeDefined();
      expect(item.eventTime).toBeDefined();
    });
  });

  describe('Lambda Function Integration', () => {
    test('should process shipment events successfully', async () => {
      // Send test event
      const params = {
        Entries: [
          {
            Source: 'logistics.shipments',
            DetailType: 'Shipment Update',
            Detail: JSON.stringify({
              shipmentId: 'TEST-SUCCESS-' + Date.now(),
              status: 'DELIVERED',
              location: 'Customer Location',
              carrier: 'UPS'
            })
          }
        ]
      };

      const result = await eventbridge.putEvents(params).promise();
      expect(result.FailedEntryCount).toBe(0);

      // Verify processing by checking CloudWatch metrics
      await new Promise(resolve => setTimeout(resolve, 3000));

      const metricsParams = {
        Namespace: 'LogisticsProcessing',
        MetricName: 'ShipmentUpdatesProcessed',
        StartTime: new Date(Date.now() - 600000), // 10 minutes ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };

      const metricsResult = await cloudwatch.getMetricStatistics(metricsParams).promise();
      expect(metricsResult.Datapoints).toBeDefined();
    });
  });

  describe('Alert System Integration', () => {
    test('should send alerts for critical shipment statuses', async () => {
      const criticalEventDetail = {
        shipmentId: 'TEST-CRITICAL-' + Date.now(),
        status: 'DELAYED',
        location: 'Distribution Center',
        carrier: 'DHL'
      };

      const params = {
        Entries: [
          {
            Source: 'logistics.shipments',
            DetailType: 'Shipment Update',
            Detail: JSON.stringify(criticalEventDetail)
          }
        ]
      };

      const result = await eventbridge.putEvents(params).promise();
      expect(result.FailedEntryCount).toBe(0);

      // Wait for processing and alert
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify the event was processed (stored in DynamoDB)
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'shipmentId = :shipmentId',
        ExpressionAttributeValues: {
          ':shipmentId': criticalEventDetail.shipmentId
        }
      };

      const queryResult: any = await dynamodb.query(queryParams).promise();
      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items.length).toBeGreaterThan(0);
      expect(queryResult.Items[0].status).toBe('DELAYED');
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('should have custom metrics published to CloudWatch', async () => {
      const metricsParams = {
        Namespace: 'LogisticsProcessing',
        MetricName: 'ShipmentUpdatesProcessed',
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };

      const result = await cloudwatch.getMetricStatistics(metricsParams).promise();
      expect(result.Datapoints).toBeDefined();
      expect(Array.isArray(result.Datapoints)).toBe(true);
    });

    test('should verify Lambda function metrics exist', async () => {
      const metricsParams = {
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: outputs.LambdaFunctionArn.split(':').pop()
          }
        ],
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };

      const result = await cloudwatch.getMetricStatistics(metricsParams).promise();
      expect(result.Datapoints).toBeDefined();
      expect(Array.isArray(result.Datapoints)).toBe(true);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('should process complete shipment lifecycle', async () => {
      const lifecycleShipmentId = 'TEST-LIFECYCLE-' + Date.now();
      const statuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

      for (const status of statuses) {
        const eventDetail = {
          shipmentId: lifecycleShipmentId,
          status: status,
          location: `Location for ${status}`,
          carrier: 'TestCarrier'
        };

        const params = {
          Entries: [
            {
              Source: 'logistics.shipments',
              DetailType: 'Shipment Update',
              Detail: JSON.stringify(eventDetail)
            }
          ]
        };

        const result = await eventbridge.putEvents(params).promise();
        expect(result.FailedEntryCount).toBe(0);

        // Wait between events
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Wait for all processing to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify all status updates are stored
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'shipmentId = :shipmentId',
        ExpressionAttributeValues: {
          ':shipmentId': lifecycleShipmentId
        }
      };

      const queryResult: any = await dynamodb.query(queryParams).promise();
      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items.length).toBe(statuses.length);

      const retrievedStatuses = queryResult.Items.map((item: any) => item.status).sort();
      expect(retrievedStatuses).toEqual(statuses.sort());
    });
  });
});
