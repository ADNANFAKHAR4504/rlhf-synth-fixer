import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

describe('Location Tracking API Integration Tests', () => {
  let outputs: any;
  let apiEndpoint: string;
  let tableName: string;
  let region: string;

  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let cloudwatchClient: CloudWatchClient;
  let apiGatewayClient: APIGatewayClient;
  let sqsClient: SQSClient;
  let ec2Client: EC2Client;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Make sure the stack is deployed.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    if (outputs.TapStack) {
      outputs = outputs.TapStack;
    }

    apiEndpoint = outputs.ApiEndpoint;
    tableName = outputs.DynamoDbTableName;
    region = process.env.AWS_REGION || 'ap-southeast-1';

    // Initialize AWS clients
    dynamoClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    sqsClient = new SQSClient({ region });
    ec2Client = new EC2Client({ region });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      const scanResult = await dynamoClient.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      if (scanResult.Items && scanResult.Items.length > 0) {
        for (const item of scanResult.Items) {
          await dynamoClient.send(
            new DeleteItemCommand({
              TableName: tableName,
              Key: {
                driverId: item.driverId,
                timestamp: item.timestamp,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  describe('Infrastructure Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.DynamoDbTableName).toBeDefined();
      expect(outputs.UpdateLocationFunctionName).toBeDefined();
      expect(outputs.GetLocationFunctionName).toBeDefined();
      expect(outputs.GetHistoryFunctionName).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.ApiId).toBeDefined();
    });

    it('should have valid API endpoint URL', () => {
      expect(apiEndpoint).toMatch(
        /^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/prod$/
      );
    });
  });

  describe('VPC Configuration', () => {
    it('should have VPC created', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('API Gateway Configuration', () => {
    it('should have REST API configured correctly', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId,
        })
      );

      expect(response.name).toContain('location-tracking-api');
      expect(response.endpointConfiguration?.types).toContain('EDGE');
    });

    it('should have prod stage with X-Ray tracing enabled', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId,
          stageName: 'prod',
        })
      );

      expect(response.stageName).toBe('prod');
      expect(response.tracingEnabled).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have Lambda error alarms configured', async () => {
      const environmentSuffix = tableName.split('-').pop();

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `update-location-errors-${environmentSuffix}`,
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(0.01);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('API Endpoints - POST /locations', () => {
    it('should successfully update driver location', async () => {
      const driverId = `test-driver-${Date.now()}`;
      const latitude = 1.3521;
      const longitude = 103.8198;

      const response = await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=${latitude}&longitude=${longitude}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty(
        'message',
        'Location updated successfully'
      );
      expect(response.data).toHaveProperty('driverId', driverId);
      expect(response.data).toHaveProperty('latitude', latitude);
      expect(response.data).toHaveProperty('longitude', longitude);
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should reject request with missing driverId', async () => {
      try {
        await axios.post(
          `${apiEndpoint}/locations?latitude=1.3521&longitude=103.8198`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject request with missing latitude', async () => {
      try {
        await axios.post(
          `${apiEndpoint}/locations?driverId=test-driver&longitude=103.8198`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject request with missing longitude', async () => {
      try {
        await axios.post(
          `${apiEndpoint}/locations?driverId=test-driver&latitude=1.3521`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject request with invalid latitude', async () => {
      const driverId = `test-driver-${Date.now()}`;

      const response = await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=999&longitude=103.8198`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toContain(
        'Latitude must be between -90 and 90'
      );
    });

    it('should reject request with invalid longitude', async () => {
      const driverId = `test-driver-${Date.now()}`;

      const response = await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3521&longitude=999`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('longitude between -180 and 180');
    });

    it('should handle multiple concurrent location updates', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        const driverId = `test-driver-concurrent-${Date.now()}-${i}`;
        const latitude = 1.3521 + i * 0.01;
        const longitude = 103.8198 + i * 0.01;

        requests.push(
          axios.post(
            `${apiEndpoint}/locations?driverId=${driverId}&latitude=${latitude}&longitude=${longitude}`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        );
      }

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Location updated successfully');
      });
    });
  });

  describe('API Endpoints - GET /locations', () => {
    let testDriverId: string;

    beforeEach(async () => {
      // Create a test location
      testDriverId = `test-driver-get-${Date.now()}`;
      await axios.post(
        `${apiEndpoint}/locations?driverId=${testDriverId}&latitude=1.3521&longitude=103.8198`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should retrieve current driver location', async () => {
      const response = await axios.get(
        `${apiEndpoint}/locations?driverId=${testDriverId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('driverId', testDriverId);
      expect(response.data).toHaveProperty('latitude', 1.3521);
      expect(response.data).toHaveProperty('longitude', 103.8198);
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent driver', async () => {
      const nonExistentDriverId = `non-existent-${Date.now()}`;

      const response = await axios.get(
        `${apiEndpoint}/locations?driverId=${nonExistentDriverId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('No location found');
    });

    it('should return most recent location when multiple updates exist', async () => {
      const driverId = `test-driver-multiple-${Date.now()}`;

      // Create multiple location updates
      await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3521&longitude=103.8198`,
        {}
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3600&longitude=103.8300`,
        {}
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await axios.get(
        `${apiEndpoint}/locations?driverId=${driverId}`
      );

      expect(response.status).toBe(200);
      expect(response.data.latitude).toBe(1.36);
      expect(response.data.longitude).toBe(103.83);
    });
  });

  describe('API Endpoints - GET /history', () => {
    let testDriverId: string;

    beforeEach(async () => {
      // Create multiple test locations
      testDriverId = `test-driver-history-${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        await axios.post(
          `${apiEndpoint}/locations?driverId=${testDriverId}&latitude=${1.3521 + i * 0.01}&longitude=${103.8198 + i * 0.01}`,
          {}
        );

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should retrieve location history for driver', async () => {
      const response = await axios.get(
        `${apiEndpoint}/history?driverId=${testDriverId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('driverId', testDriverId);
      expect(response.data).toHaveProperty('count');
      expect(response.data).toHaveProperty('locations');
      expect(Array.isArray(response.data.locations)).toBe(true);
      expect(response.data.locations.length).toBeGreaterThan(0);
    });

    it('should return locations in descending order by timestamp', async () => {
      const response = await axios.get(
        `${apiEndpoint}/history?driverId=${testDriverId}`
      );

      expect(response.status).toBe(200);

      const locations = response.data.locations;
      for (let i = 1; i < locations.length; i++) {
        expect(locations[i - 1].timestamp).toBeGreaterThanOrEqual(
          locations[i].timestamp
        );
      }
    });

    it('should respect limit parameter', async () => {
      const response = await axios.get(
        `${apiEndpoint}/history?driverId=${testDriverId}&limit=3`
      );

      expect(response.status).toBe(200);
      expect(response.data.locations.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for driver with no history', async () => {
      const nonExistentDriverId = `non-existent-history-${Date.now()}`;

      const response = await axios.get(
        `${apiEndpoint}/history?driverId=${nonExistentDriverId}`
      );

      expect(response.status).toBe(200);
      expect(response.data.locations).toEqual([]);
      expect(response.data.count).toBe(0);
    });
  });

  describe('Lambda Function Integration', () => {
    it('should invoke update location Lambda function directly', async () => {
      const functionName = outputs.UpdateLocationFunctionName;

      const payload = {
        queryStringParameters: {
          driverId: `test-driver-lambda-${Date.now()}`,
          latitude: '1.3521',
          longitude: '103.8198',
        },
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(payload),
        })
      );

      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Location updated successfully');
    });

    it('should invoke get location Lambda function directly', async () => {
      const functionName = outputs.GetLocationFunctionName;

      const driverId = `test-driver-lambda-get-${Date.now()}`;

      // First, create a location
      await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3521&longitude=103.8198`,
        {}
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      const payload = {
        queryStringParameters: {
          driverId,
        },
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(payload),
        })
      );

      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.driverId).toBe(driverId);
    });
  });

  describe('DynamoDB Integration', () => {
    it('should store location data in DynamoDB', async () => {
      const driverId = `test-driver-dynamo-${Date.now()}`;
      const latitude = 1.3521;
      const longitude = 103.8198;

      await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=${latitude}&longitude=${longitude}`,
        {}
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify data in DynamoDB
      const scanResult = await dynamoClient.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'driverId = :driverId',
          ExpressionAttributeValues: {
            ':driverId': { S: driverId },
          },
        })
      );

      expect(scanResult.Items).toBeDefined();
      expect(scanResult.Items!.length).toBeGreaterThan(0);

      const item = scanResult.Items![0];
      expect(item.driverId.S).toBe(driverId);
      expect(parseFloat(item.latitude.N!)).toBe(latitude);
      expect(parseFloat(item.longitude.N!)).toBe(longitude);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle burst of requests within throttling limits', async () => {
      const requests = [];

      // Send 50 requests in parallel (well under the 5000 burst limit)
      for (let i = 0; i < 50; i++) {
        const driverId = `test-driver-burst-${Date.now()}-${i}`;
        requests.push(
          axios.post(
            `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3521&longitude=103.8198`,
            {}
          )
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 30000);

    it('should respond within acceptable latency', async () => {
      const driverId = `test-driver-latency-${Date.now()}`;

      const startTime = Date.now();
      await axios.post(
        `${apiEndpoint}/locations?driverId=${driverId}&latitude=1.3521&longitude=103.8198`,
        {}
      );
      const endTime = Date.now();

      const latency = endTime - startTime;

      // Response should be within 3 seconds
      expect(latency).toBeLessThan(3000);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await axios.post(
        `${apiEndpoint}/locations?driverId=test&latitude=invalid&longitude=103.8198`,
        {}
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });

    it('should return appropriate error codes', async () => {
      try {
        await axios.post(`${apiEndpoint}/invalid-endpoint`, {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full location tracking workflow', async () => {
      const driverId = `test-driver-e2e-${Date.now()}`;

      // Step 1: Update location multiple times
      const locations = [
        { lat: 1.3521, lon: 103.8198 },
        { lat: 1.36, lon: 103.83 },
        { lat: 1.37, lon: 103.84 },
      ];

      for (const loc of locations) {
        const response = await axios.post(
          `${apiEndpoint}/locations?driverId=${driverId}&latitude=${loc.lat}&longitude=${loc.lon}`,
          {}
        );

        expect(response.status).toBe(200);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Get current location
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentResponse = await axios.get(
        `${apiEndpoint}/locations?driverId=${driverId}`
      );

      expect(currentResponse.status).toBe(200);
      expect(currentResponse.data.latitude).toBe(1.37);
      expect(currentResponse.data.longitude).toBe(103.84);

      // Step 3: Get location history
      const historyResponse = await axios.get(
        `${apiEndpoint}/history?driverId=${driverId}`
      );

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.locations.length).toBeGreaterThanOrEqual(3);

      // Verify locations are in descending order
      const timestamps = historyResponse.data.locations.map(
        (loc: any) => loc.timestamp
      );
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    }, 30000);
  });
});
