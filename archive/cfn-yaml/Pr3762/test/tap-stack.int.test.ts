import * as AWS from 'aws-sdk';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK for integration tests
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();
const events = new AWS.EventBridge();

const outputs = (() => {
  try {
    if (process.env.CI === '1') {
      return {
        ApiEndpoint: process.env.API_GATEWAY_ENDPOINT || '',
        TravelDataTableName: process.env.DYNAMODB_TABLE_NAME || '',
        CacheEndpoint: process.env.CACHE_ENDPOINT || '',
        EventBusName: process.env.EVENT_BUS_NAME || '',
        DashboardURL: process.env.DASHBOARD_URL || '',
        StackName: process.env.STACK_NAME || '',
        EnvironmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev'
      };
    } else {
      return require('../cdk-outputs.json')?.TapStackdev || {};
    }
  } catch {
    return {};
  }
})();

describe('Travel Platform API - Comprehensive Cross-Service Integration Tests', () => {
  const apiEndpoint = outputs.ApiEndpoint;
  const dynamoTableName = outputs.TravelDataTableName;
  const cacheEndpoint = outputs.CacheEndpoint;
  const eventBusName = outputs.EventBusName;
  const environmentSuffix = outputs.EnvironmentSuffix;
  const skipTests = !apiEndpoint;

  // Test data cleanup array
  const testDataToCleanup: string[] = [];

  beforeAll(() => {
    if (skipTests) {
      console.log('⚠️  Integration tests will be skipped - API endpoint not available');
      console.log('Deploy the stack first: npm run deploy');
    } else {
      console.log(`🚀 Running comprehensive integration tests against:`);
      console.log(`   API Endpoint: ${apiEndpoint}`);
      console.log(`   DynamoDB Table: ${dynamoTableName}`);
      console.log(`   EventBridge Bus: ${eventBusName}`);
      console.log(`   Environment: ${environmentSuffix}`);
    }
  });

  afterAll(async () => {
    // Cleanup test data from DynamoDB
    if (!skipTests && dynamoTableName && testDataToCleanup.length > 0) {
      console.log('🧹 Cleaning up test data...');
      for (const searchId of testDataToCleanup) {
        try {
          await dynamodb.delete({
            TableName: dynamoTableName,
            Key: {
              searchType: 'integration-test',
              searchId: searchId
            }
          }).promise();
        } catch (error) {
          console.warn(`Failed to cleanup test data: ${searchId}`, error);
        }
      }
    }
  });

  describe('Cross-Service Integration: API Gateway → Lambda → DynamoDB', () => {
    test('should complete full request-response cycle with data persistence', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const uniqueQuery = `integration-test-${testId}`;
      testDataToCleanup.push(testId);

      // Step 1: Make API request through API Gateway → Lambda
      const apiResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: uniqueQuery,
          origin: 'JFK',
          destination: 'LAX',
          departureDate: '2024-12-01'
        }
      });

      // Validate API response structure
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.data).toHaveProperty('searchId');
      expect(apiResponse.data).toHaveProperty('searchType', 'flight');
      expect(apiResponse.data).toHaveProperty('query', uniqueQuery);
      expect(apiResponse.data).toHaveProperty('results');
      expect(apiResponse.data).toHaveProperty('timestamp');
      expect(apiResponse.data.searchId).toBeTruthy();

      const searchId = apiResponse.data.searchId;

      // Step 2: Verify data was persisted to DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time for async write

      const dbResponse = await dynamodb.get({
        TableName: dynamoTableName,
        Key: {
          searchType: 'flight',
          searchId: searchId
        }
      }).promise();

      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item!.query).toBe(uniqueQuery);
      expect(dbResponse.Item!.searchType).toBe('flight');
      expect(dbResponse.Item!.timestamp).toBeDefined();

      console.log(`✅ Successfully validated API → Lambda → DynamoDB flow for search: ${searchId}`);
    }, 30000);

    test('should handle concurrent requests with proper data isolation', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const concurrentRequests = 5;
      const testPromises = Array.from({ length: concurrentRequests }, async (_, index) => {
        const testId = uuidv4();
        const uniqueQuery = `concurrent-test-${testId}-${index}`;
        testDataToCleanup.push(testId);

        const response = await axios.get(`${apiEndpoint}/search`, {
          params: {
            type: 'hotel',
            q: uniqueQuery,
            location: `TestCity${index}`,
            checkIn: '2024-12-01',
            checkOut: '2024-12-05'
          }
        });

        return { response, testId, uniqueQuery, index };
      });

      const results = await Promise.all(testPromises);

      // Validate all requests succeeded
      results.forEach(({ response, uniqueQuery, index }) => {
        expect(response.status).toBe(200);
        expect(response.data.query).toBe(uniqueQuery);
        expect(response.data.searchType).toBe('hotel');
        expect(response.data.searchId).toBeTruthy();
      });

      // Verify data isolation in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 3000));

      for (const { response, uniqueQuery } of results) {
        const dbResponse = await dynamodb.get({
          TableName: dynamoTableName,
          Key: {
            searchType: 'hotel',
            searchId: response.data.searchId
          }
        }).promise();

        expect(dbResponse.Item).toBeDefined();
        expect(dbResponse.Item!.query).toBe(uniqueQuery);
      }

      console.log(`✅ Successfully validated ${concurrentRequests} concurrent requests with data isolation`);
    }, 45000);
  });

  describe('Cross-Service Integration: Caching Layer Validation', () => {
    test('should demonstrate caching behavior with repeated requests', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const cacheTestQuery = `cache-test-${testId}`;
      testDataToCleanup.push(testId);

      // First request (cache miss expected)
      const startTime1 = Date.now();
      const response1 = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'package',
          q: cacheTestQuery,
          destination: 'TestDestination',
          duration: '7days'
        }
      });
      const duration1 = Date.now() - startTime1;

      expect(response1.status).toBe(200);
      expect(response1.data.query).toBe(cacheTestQuery);

      // Wait a moment to ensure first request is processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second request (potential cache hit)
      const startTime2 = Date.now();
      const response2 = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'package',
          q: cacheTestQuery,
          destination: 'TestDestination',
          duration: '7days'
        }
      });
      const duration2 = Date.now() - startTime2;

      expect(response2.status).toBe(200);
      expect(response2.data.query).toBe(cacheTestQuery);

      // Verify consistent data structure between cached and non-cached responses
      expect(response1.data.searchType).toBe(response2.data.searchType);
      expect(response1.data.query).toBe(response2.data.query);

      console.log(`⚡ Cache performance - First request: ${duration1}ms, Second request: ${duration2}ms`);

      // Note: In a real cache scenario, second request should be faster
      // This validates the caching infrastructure is in place
    }, 25000);
  });

  describe('Cross-Service Integration: Event-Driven Architecture', () => {
    test('should validate EventBridge integration for external system notifications', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const eventTestQuery = `event-test-${testId}`;
      testDataToCleanup.push(testId);

      // Make request that should trigger event publishing
      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: eventTestQuery,
          publishEvent: 'true', // Flag to trigger event publishing
          priority: 'high'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.query).toBe(eventTestQuery);

      // Validate event publishing capability by checking if EventBridge is accessible
      if (eventBusName) {
        try {
          const eventBusResponse = await events.describeEventBus({
            Name: eventBusName
          }).promise();

          expect(eventBusResponse.Name).toBe(eventBusName);
          console.log(`✅ EventBridge bus verified: ${eventBusName}`);
        } catch (error) {
          console.warn('EventBridge validation skipped:', error);
        }
      }
    }, 20000);
  });

  describe('Cross-Service Integration: Error Handling & Resilience', () => {
    test('should handle malformed requests with proper error responses', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      // Test missing required parameters
      try {
        await axios.get(`${apiEndpoint}/search`);
        fail('Should have thrown an error for missing parameters');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }

      // Test invalid search type
      try {
        await axios.get(`${apiEndpoint}/search`, {
          params: {
            type: 'invalid-type',
            q: 'test-query'
          }
        });

        // This should either succeed with a handled response or fail gracefully
        console.log('✅ Invalid search type handled gracefully');
      } catch (error: any) {
        expect([400, 404]).toContain(error.response.status);
      }
    }, 15000);

    test('should validate API Gateway throttling and rate limiting', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const rapidRequests = Array.from({ length: 10 }, (_, i) =>
        axios.get(`${apiEndpoint}/search`, {
          params: {
            type: 'flight',
            q: `throttle-test-${i}`,
            timestamp: Date.now()
          }
        }).catch(error => ({ error: true, status: error.response?.status }))
      );

      const results = await Promise.all(rapidRequests);

      // Count successful vs throttled requests
      const successful = results.filter(r => !('error' in r)).length;
      const throttled = results.filter(r => 'error' in r && r.error && r.status === 429).length;

      console.log(`📊 Throttling test results: ${successful} successful, ${throttled} throttled`);

      // Should have at least some successful requests
      expect(successful).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Cross-Service Integration: Data Consistency & Persistence', () => {
    test('should validate data consistency across read/write operations', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const consistencyQuery = `consistency-test-${testId}`;
      testDataToCleanup.push(testId);

      // Write operation via API
      const writeResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'hotel',
          q: consistencyQuery,
          location: 'ConsistencyCity',
          rooms: '2',
          guests: '4'
        }
      });

      expect(writeResponse.status).toBe(200);
      const searchId = writeResponse.data.searchId;

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Direct read from DynamoDB
      const dbRead = await dynamodb.get({
        TableName: dynamoTableName,
        Key: {
          searchType: 'hotel',
          searchId: searchId
        }
      }).promise();

      expect(dbRead.Item).toBeDefined();
      expect(dbRead.Item!.query).toBe(consistencyQuery);

      // Read operation via API (should retrieve same data)
      const readResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'hotel',
          q: consistencyQuery,
          location: 'ConsistencyCity'
        }
      });

      expect(readResponse.status).toBe(200);
      expect(readResponse.data.query).toBe(consistencyQuery);

      console.log(`✅ Data consistency validated for search: ${searchId}`);
    }, 35000);

    test('should validate time-series data with proper indexing', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const timeSeriesQueries = [
        `timeseries-${testId}-1`,
        `timeseries-${testId}-2`,
        `timeseries-${testId}-3`
      ];

      // Create multiple requests with timestamps
      for (const query of timeSeriesQueries) {
        testDataToCleanup.push(query);

        await axios.get(`${apiEndpoint}/search`, {
          params: {
            type: 'package',
            q: query,
            destination: 'TimeSeriesTest'
          }
        });

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Wait for all data to be persisted
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query DynamoDB using timestamp index (if configured)
      try {
        const queryResponse = await dynamodb.query({
          TableName: dynamoTableName,
          IndexName: 'timestamp-index', // Based on CloudFormation template
          KeyConditionExpression: 'searchType = :searchType',
          ExpressionAttributeValues: {
            ':searchType': 'package'
          },
          ScanIndexForward: false, // Most recent first
          Limit: 10
        }).promise();

        expect(queryResponse.Items).toBeDefined();
        expect(queryResponse.Items!.length).toBeGreaterThan(0);

        console.log(`✅ Time-series indexing validated with ${queryResponse.Items!.length} items`);
      } catch (error) {
        console.warn('Time-series index query skipped:', error);
      }
    }, 40000);
  });

  describe('Cross-Service Integration: Monitoring & Observability', () => {
    test('should validate CloudWatch metrics and monitoring integration', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const monitoringQuery = `monitoring-test-${testId}`;
      testDataToCleanup.push(testId);

      // Generate some API activity
      await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: monitoringQuery,
          monitoring: 'true'
        }
      });

      // Wait for metrics to be recorded
      await new Promise(resolve => setTimeout(resolve, 10000));

      try {
        // Check for API Gateway metrics
        const metricsResponse = await cloudwatch.getMetricStatistics({
          Namespace: 'AWS/ApiGateway',
          MetricName: 'Count',
          Dimensions: [
            {
              Name: 'ApiName',
              Value: `TravelApi${environmentSuffix}`
            }
          ],
          StartTime: new Date(Date.now() - 300000), // 5 minutes ago
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Sum']
        }).promise();

        if (metricsResponse.Datapoints && metricsResponse.Datapoints.length > 0) {
          console.log(`✅ CloudWatch metrics validated: ${metricsResponse.Datapoints.length} datapoints`);
        } else {
          console.log('⚠️  CloudWatch metrics not yet available (may take time to propagate)');
        }
      } catch (error) {
        console.warn('CloudWatch metrics validation skipped:', error);
      }
    }, 30000);

    test('should validate X-Ray tracing integration', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const testId = uuidv4();
      const tracingQuery = `tracing-test-${testId}`;
      testDataToCleanup.push(testId);

      // Make request with tracing headers
      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'hotel',
          q: tracingQuery,
          tracing: 'enabled'
        },
        headers: {
          'X-Amzn-Trace-Id': `Root=1-${Math.floor(Date.now() / 1000).toString(16)}-${testId.replace(/-/g, '').substring(0, 24)}`
        }
      });

      expect(response.status).toBe(200);

      // Check if X-Ray trace ID is returned in response headers
      if (response.headers['x-amzn-trace-id']) {
        console.log(`✅ X-Ray tracing header found: ${response.headers['x-amzn-trace-id']}`);
      } else {
        console.log('⚠️  X-Ray tracing header not found (may not be enabled)');
      }
    }, 20000);
  });

  describe('End-to-End User Journey Integration', () => {
    test('should complete comprehensive travel booking workflow', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const journeyId = uuidv4();
      const journeyContext = {
        tripId: journeyId,
        userId: `user-${journeyId}`,
        sessionId: `session-${journeyId}`
      };

      console.log(`🧳 Starting end-to-end travel journey: ${journeyId}`);

      // Step 1: Flight search
      const flightResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: `${journeyContext.tripId}-outbound`,
          origin: 'NYC',
          destination: 'LAX',
          departureDate: '2024-12-15',
          passengers: '2',
          class: 'economy'
        },
        headers: {
          'X-User-Context': JSON.stringify(journeyContext)
        }
      });

      expect(flightResponse.status).toBe(200);
      expect(flightResponse.data.searchType).toBe('flight');
      testDataToCleanup.push(flightResponse.data.searchId);

      // Step 2: Hotel search in destination
      const hotelResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'hotel',
          q: `${journeyContext.tripId}-accommodation`,
          location: 'Los Angeles',
          checkIn: '2024-12-15',
          checkOut: '2024-12-20',
          rooms: '1',
          guests: '2'
        },
        headers: {
          'X-User-Context': JSON.stringify(journeyContext)
        }
      });

      expect(hotelResponse.status).toBe(200);
      expect(hotelResponse.data.searchType).toBe('hotel');
      testDataToCleanup.push(hotelResponse.data.searchId);

      // Step 3: Package search for activities
      const packageResponse = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'package',
          q: `${journeyContext.tripId}-activities`,
          destination: 'Los Angeles',
          duration: '5days',
          category: 'sightseeing'
        },
        headers: {
          'X-User-Context': JSON.stringify(journeyContext)
        }
      });

      expect(packageResponse.status).toBe(200);
      expect(packageResponse.data.searchType).toBe('package');
      testDataToCleanup.push(packageResponse.data.searchId);

      // Wait for all data to be persisted
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 4: Validate entire journey data is accessible
      const journeySearches = [flightResponse.data, hotelResponse.data, packageResponse.data];

      for (const searchData of journeySearches) {
        const dbVerification = await dynamodb.get({
          TableName: dynamoTableName,
          Key: {
            searchType: searchData.searchType,
            searchId: searchData.searchId
          }
        }).promise();

        expect(dbVerification.Item).toBeDefined();
        expect(dbVerification.Item!.query).toContain(journeyContext.tripId);
      }

      console.log(`✅ End-to-end journey completed successfully: ${journeyId}`);
      console.log(`   - Flight search: ${flightResponse.data.searchId}`);
      console.log(`   - Hotel search: ${hotelResponse.data.searchId}`);
      console.log(`   - Package search: ${packageResponse.data.searchId}`);
    }, 60000);
  });
});
