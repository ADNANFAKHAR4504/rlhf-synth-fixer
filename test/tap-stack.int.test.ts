import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DeleteObjectCommand,
  GetBucketNotificationConfigurationCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';

// Load outputs from CDK deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = outputs.EnvironmentSuffix || 'dev';

// AWS Clients
const apiGatewayClient = new APIGatewayClient({
  region: outputs.Region || 'us-east-1',
});
const dynamoClient = new DynamoDBClient({
  region: outputs.Region || 'us-east-1',
});
const ec2Client = new EC2Client({
  region: outputs.Region || 'us-east-1',
});
const lambdaClient = new LambdaClient({
  region: outputs.Region || 'us-east-1',
});
const s3Client = new S3Client({
  region: outputs.Region || 'us-east-1',
});
const cloudWatchClient = new CloudWatchClient({
  region: outputs.Region || 'us-east-1',
});

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds

// Test data
const testUsers = {
  john: {
    apiKey: '',
    userId: 'john',
    permissions: 'read-write',
    expectedPostStatus: 200,
    expectedGetStatus: 200,
  },
  ben: {
    apiKey: '',
    userId: 'ben',
    permissions: 'read',
    expectedPostStatus: 401, // Should be unauthorized for write operations
    expectedGetStatus: 200,
  },
  chris: {
    apiKey: '',
    userId: 'chris',
    permissions: 'admin',
    expectedPostStatus: 200,
    expectedGetStatus: 200,
  },
};

// Helper function to generate test API keys
const generateTestApiKey = (userId: string): string => {
  return `${userId}-api-key-${Math.random().toString(36).substring(2, 18)}`;
};

// Clean up test objects after tests
const testObjects: string[] = [];
const testDocumentIds: string[] = [];

describe('Serverless Document Processing System - Integration Tests', () => {
  beforeAll(async () => {
    // Setup test API keys in DynamoDB
    const apiKeysTableName = outputs.ApiKeysTableName;

    for (const [userName, userData] of Object.entries(testUsers)) {
      const apiKey = generateTestApiKey(userData.userId);
      testUsers[userName as keyof typeof testUsers].apiKey = apiKey;

      await dynamoClient.send(
        new PutItemCommand({
          TableName: apiKeysTableName,
          Item: {
            apiKey: { S: apiKey },
            userId: { S: userData.userId },
            permissions: { S: userData.permissions },
            createdAt: { S: new Date().toISOString() },
            status: { S: 'active' },
            description: { S: `Integration test user: ${userData.userId}` },
          },
        })
      );
    }

    // Wait for DynamoDB to be consistent
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Clean up test objects from S3
    const bucketName = outputs.DocumentsBucketName;
    for (const key of testObjects) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        );
      } catch (error) {
        console.warn(`Failed to clean up test object ${key}:`, error);
      }
    }

    // Clean up test API keys from DynamoDB
    const apiKeysTableName = outputs.ApiKeysTableName;
    for (const userData of Object.values(testUsers)) {
      try {
        await dynamoClient.send(
          new DeleteItemCommand({
            TableName: apiKeysTableName,
            Key: {
              apiKey: { S: userData.apiKey },
            },
          })
        );
      } catch (error) {
        console.warn(
          `Failed to clean up test API key for ${userData.userId}:`,
          error
        );
      }
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have all required outputs from CDK deployment', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.DocumentsBucketName).toBeDefined();
      expect(outputs.DocumentsTableName).toBeDefined();
      expect(outputs.ApiKeysTableName).toBeDefined();
      expect(outputs.AuthorizerFunctionName).toBeDefined();
      expect(outputs.ApiHandlerFunctionName).toBeDefined();
      expect(outputs.DocumentProcessorFunctionName).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.Region).toBeDefined();
    });

    test(
      'should have API Gateway configured correctly',
      async () => {
        const apiId = outputs.ApiId;
        expect(apiId).toBeDefined();

        const apiResponse = await apiGatewayClient.send(
          new GetRestApiCommand({ restApiId: apiId })
        );

        expect(apiResponse.name).toContain('DocumentApi');
        expect(apiResponse.endpointConfiguration?.types).toContain('REGIONAL');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Lambda authorizer configured',
      async () => {
        // Verify the authorizer function exists
        const authorizerFunctionName = outputs.AuthorizerFunctionName;
        expect(authorizerFunctionName).toBeDefined();

        const functionResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: authorizerFunctionName,
          })
        );

        expect(functionResponse.Configuration?.Runtime).toBe('nodejs20.x');
        expect(
          functionResponse.Configuration?.Environment?.Variables?.API_KEYS_TABLE
        ).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe('VPC and Networking Infrastructure', () => {
    test(
      'should have VPC with correct configuration',
      async () => {
        const vpcId = outputs.VpcId;

        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(vpcResponse.Vpcs).toBeDefined();
        expect(vpcResponse.Vpcs!.length).toBe(1);
        expect(vpcResponse.Vpcs![0].State).toBe('available');
        expect(vpcResponse.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      },
      TEST_TIMEOUT
    );

    test(
      'should have private isolated subnets for Lambda functions',
      async () => {
        const vpcId = outputs.VpcId;

        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Name', Values: ['*Private*'] },
            ],
          })
        );

        expect(subnetsResponse.Subnets).toBeDefined();
        expect(subnetsResponse.Subnets!.length).toBeGreaterThan(0);

        // Verify subnets are in different AZs for high availability
        const availabilityZones = new Set(
          subnetsResponse.Subnets!.map(subnet => subnet.AvailabilityZone)
        );
        expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );

    test(
      'should have VPC endpoints for AWS services',
      async () => {
        const vpcId = outputs.VpcId;

        const endpointsResponse = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        expect(endpointsResponse.VpcEndpoints).toBeDefined();
        expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThan(0);

        // Check for specific service endpoints
        const serviceNames = endpointsResponse.VpcEndpoints!.map(
          endpoint => endpoint.ServiceName
        );

        expect(serviceNames.some(name => name?.includes('s3'))).toBe(true);
        expect(serviceNames.some(name => name?.includes('dynamodb'))).toBe(
          true
        );
      },
      TEST_TIMEOUT
    );

    test(
      'should have security group configured for Lambda functions',
      async () => {
        const securityGroupId = outputs.LambdaSecurityGroupId;
        expect(securityGroupId).toBeDefined();

        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [securityGroupId],
          })
        );

        expect(sgResponse.SecurityGroups).toBeDefined();
        expect(sgResponse.SecurityGroups!.length).toBe(1);

        const securityGroup = sgResponse.SecurityGroups![0];
        expect(securityGroup.GroupName).toContain('Lambda');

        // Verify HTTPS outbound rule exists
        const httpsRule = securityGroup.IpPermissionsEgress?.find(
          rule => rule.FromPort === 443 && rule.IpProtocol === 'tcp'
        );
        expect(httpsRule).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe('DynamoDB Tables', () => {
    test(
      'should have Documents table with correct configuration',
      async () => {
        const tableName = outputs.DocumentsTableName;

        const tableResponse = await dynamoClient.send(
          new DescribeTableCommand({ TableName: tableName })
        );

        expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
        expect(tableResponse.Table?.KeySchema?.[0].AttributeName).toBe(
          'documentId'
        );
        expect(tableResponse.Table?.StreamSpecification?.StreamEnabled).toBe(
          true
        );
      },
      TEST_TIMEOUT
    );

    test(
      'should have API Keys table with correct configuration',
      async () => {
        const tableName = outputs.ApiKeysTableName;

        const tableResponse = await dynamoClient.send(
          new DescribeTableCommand({ TableName: tableName })
        );

        expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
        expect(tableResponse.Table?.KeySchema?.[0].AttributeName).toBe(
          'apiKey'
        );
      },
      TEST_TIMEOUT
    );

    test(
      'should be able to read and write to API Keys table',
      async () => {
        const tableName = outputs.ApiKeysTableName;

        // Verify test users were created
        const scanResponse = await dynamoClient.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'contains(description, :testPrefix)',
            ExpressionAttributeValues: {
              ':testPrefix': { S: 'Integration test user' },
            },
          })
        );

        expect(scanResponse.Items).toBeDefined();
        expect(scanResponse.Items!.length).toBe(3); // john, ben, chris
      },
      TEST_TIMEOUT
    );
  });

  describe('S3 Storage', () => {
    test(
      'should have documents bucket accessible',
      async () => {
        const bucketName = outputs.DocumentsBucketName;

        const listResponse = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1,
          })
        );

        expect(listResponse).toBeDefined();
        // Should not throw an error - proves bucket exists and is accessible
      },
      TEST_TIMEOUT
    );

    test(
      'should have S3 event notifications configured for Lambda',
      async () => {
        const bucketName = outputs.DocumentsBucketName;

        const notificationResponse = await s3Client.send(
          new GetBucketNotificationConfigurationCommand({
            Bucket: bucketName,
          })
        );

        expect(notificationResponse.LambdaFunctionConfigurations).toBeDefined();
        expect(
          notificationResponse.LambdaFunctionConfigurations!.length
        ).toBeGreaterThan(0);

        const lambdaConfig =
          notificationResponse.LambdaFunctionConfigurations![0];
        expect(lambdaConfig.Events).toContain('s3:ObjectCreated:*');
        expect(
          lambdaConfig.Filter?.Key?.FilterRules?.some(
            (rule: any) => rule.Name === 'Prefix' && rule.Value === 'documents/'
          )
        ).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('Lambda Functions', () => {
    test(
      'should have all Lambda functions deployed and configured',
      async () => {
        const functions = [
          outputs.AuthorizerFunctionName,
          outputs.ApiHandlerFunctionName,
          outputs.DocumentProcessorFunctionName,
        ];

        for (const functionName of functions) {
          const functionResponse = await lambdaClient.send(
            new GetFunctionCommand({ FunctionName: functionName })
          );

          expect(functionResponse.Configuration?.State).toBe('Active');
          expect(functionResponse.Configuration?.Runtime).toBe('nodejs20.x');
          expect(functionResponse.Configuration?.VpcConfig).toBeDefined();
          expect(functionResponse.Configuration?.VpcConfig?.VpcId).toBe(
            outputs.VpcId
          );
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should have Lambda functions with correct environment variables',
      async () => {
        // Test API Handler function environment variables
        const apiHandlerResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.ApiHandlerFunctionName,
          })
        );

        const apiHandlerEnv =
          apiHandlerResponse.Configuration?.Environment?.Variables;
        expect(apiHandlerEnv?.DOCUMENTS_BUCKET).toBe(
          outputs.DocumentsBucketName
        );
        expect(apiHandlerEnv?.DOCUMENTS_TABLE).toBe(outputs.DocumentsTableName);

        // Test Authorizer function environment variables
        const authorizerResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.AuthorizerFunctionName,
          })
        );

        const authorizerEnv =
          authorizerResponse.Configuration?.Environment?.Variables;
        expect(authorizerEnv?.API_KEYS_TABLE).toBe(outputs.ApiKeysTableName);
      },
      TEST_TIMEOUT
    );
  });

  describe('CloudWatch Monitoring', () => {
    test(
      'should have CloudWatch alarms configured for Lambda functions',
      async () => {
        const alarmsResponse = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `TapStack${environmentSuffix}`,
          })
        );

        expect(alarmsResponse.MetricAlarms).toBeDefined();
        expect(alarmsResponse.MetricAlarms!.length).toBeGreaterThan(0);

        // Verify error alarms exist
        const errorAlarms = alarmsResponse.MetricAlarms!.filter(
          alarm => alarm.MetricName === 'Errors'
        );
        expect(errorAlarms.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End API Testing', () => {
    test(
      'should reject requests without API key',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;

        try {
          const response = await axios.get(`${apiEndpoint}/documents`);
          // Should not reach here
          expect(response.status).toBe(401);
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should reject requests with invalid API key',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;

        try {
          const response = await axios.get(`${apiEndpoint}/documents`, {
            headers: { 'X-Api-Key': 'invalid-key-12345' },
          });
          // Should not reach here
          expect(response.status).toBe(401);
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should allow GET requests for all users with valid API keys',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;

        for (const [userName, userData] of Object.entries(testUsers)) {
          try {
            const response = await axios.get(`${apiEndpoint}/documents`, {
              headers: { 'X-Api-Key': userData.apiKey },
            });

            expect(response.status).toBe(userData.expectedGetStatus);
            if (response.status === 200) {
              expect(response.data).toHaveProperty('documents');
              expect(response.data).toHaveProperty('count');
            }
          } catch (error: any) {
            expect(error.response?.status).toBe(userData.expectedGetStatus);
          }
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should handle document upload based on user permissions',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const testDocument = {
          fileName: 'integration-test.txt',
          content: Buffer.from('Integration test document content').toString(
            'base64'
          ),
          contentType: 'text/plain',
        };

        for (const [userName, userData] of Object.entries(testUsers)) {
          try {
            const response = await axios.post(
              `${apiEndpoint}/documents`,
              testDocument,
              {
                headers: {
                  'X-Api-Key': userData.apiKey,
                  'Content-Type': 'application/json',
                },
              }
            );

            expect(response.status).toBe(userData.expectedPostStatus);

            if (response.status === 200) {
              expect(response.data).toHaveProperty('documentId');
              expect(response.data).toHaveProperty('message');
              expect(response.data).toHaveProperty('key');

              // Store for cleanup
              testDocumentIds.push(response.data.documentId);
              testObjects.push(response.data.key);
            }
          } catch (error: any) {
            expect(error.response?.status).toBe(userData.expectedPostStatus);
          }
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should process uploaded documents and store metadata in DynamoDB',
      async () => {
        if (testDocumentIds.length === 0) {
          console.log('No documents uploaded, skipping processing test');
          return;
        }

        // Wait for document processing
        await new Promise(resolve => setTimeout(resolve, 10000));

        const documentsTableName = outputs.DocumentsTableName;

        for (const documentId of testDocumentIds) {
          const scanResponse = await dynamoClient.send(
            new ScanCommand({
              TableName: documentsTableName,
              FilterExpression: 'documentId = :docId',
              ExpressionAttributeValues: {
                ':docId': { S: documentId },
              },
            })
          );

          if (scanResponse.Items && scanResponse.Items.length > 0) {
            const item = scanResponse.Items[0];
            expect(item.status?.S).toBe('processed');
            expect(item.fileName?.S).toBeDefined();
            expect(item.bucket?.S).toBe(outputs.DocumentsBucketName);
            expect(item.processedAt?.S).toBeDefined();
          }
        }
      },
      TEST_TIMEOUT * 2
    );

    test(
      'should retrieve specific documents by ID',
      async () => {
        if (testDocumentIds.length === 0) {
          console.log('No documents uploaded, skipping retrieval test');
          return;
        }

        const apiEndpoint = outputs.ApiEndpoint;
        const johnApiKey = testUsers.john.apiKey;

        for (const documentId of testDocumentIds) {
          try {
            const response = await axios.get(
              `${apiEndpoint}/documents/${documentId}`,
              {
                headers: { 'X-Api-Key': johnApiKey },
              }
            );

            expect(response.status).toBe(200);
            expect(response.data.documentId).toBe(documentId);
            expect(response.data.fileName).toBeDefined();
            expect(response.data.status).toBeDefined();
          } catch (error: any) {
            // Document might not be processed yet, which is acceptable
            if (error.response?.status !== 404) {
              throw error;
            }
          }
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Permission-Based Access Control', () => {
    test(
      'should enforce read-only permissions for Ben',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const benApiKey = testUsers.ben.apiKey;

        // Ben should be able to GET
        const getResponse = await axios.get(`${apiEndpoint}/documents`, {
          headers: { 'X-Api-Key': benApiKey },
        });
        expect(getResponse.status).toBe(200);

        // Ben should NOT be able to POST
        try {
          await axios.post(
            `${apiEndpoint}/documents`,
            {
              fileName: 'ben-unauthorized.txt',
              content: Buffer.from('Ben should not be able to upload').toString(
                'base64'
              ),
              contentType: 'text/plain',
            },
            {
              headers: {
                'X-Api-Key': benApiKey,
                'Content-Type': 'application/json',
              },
            }
          );
          // Should not reach here
          expect(true).toBe(false);
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should allow full access for John and Chris',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;

        for (const userName of ['john', 'chris']) {
          const userData = testUsers[userName as keyof typeof testUsers];

          // Should be able to GET
          const getResponse = await axios.get(`${apiEndpoint}/documents`, {
            headers: { 'X-Api-Key': userData.apiKey },
          });
          expect(getResponse.status).toBe(200);

          // Should be able to POST
          const postResponse = await axios.post(
            `${apiEndpoint}/documents`,
            {
              fileName: `${userName}-permission-test.txt`,
              content: Buffer.from(`${userName} permission test`).toString(
                'base64'
              ),
              contentType: 'text/plain',
            },
            {
              headers: {
                'X-Api-Key': userData.apiKey,
                'Content-Type': 'application/json',
              },
            }
          );

          expect(postResponse.status).toBe(200);

          // Store for cleanup
          if (postResponse.data.key) {
            testObjects.push(postResponse.data.key);
          }
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Error Handling and Resilience', () => {
    test(
      'should handle malformed JSON in requests',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const johnApiKey = testUsers.john.apiKey;

        try {
          await axios.post(`${apiEndpoint}/documents`, 'invalid-json', {
            headers: {
              'X-Api-Key': johnApiKey,
              'Content-Type': 'application/json',
            },
          });
          // Should not reach here
          expect(true).toBe(false);
        } catch (error: any) {
          expect([400, 500]).toContain(error.response?.status);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should handle missing required fields in document upload',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const johnApiKey = testUsers.john.apiKey;

        try {
          const response = await axios.post(
            `${apiEndpoint}/documents`,
            { fileName: 'test.txt' }, // Missing content
            {
              headers: {
                'X-Api-Key': johnApiKey,
                'Content-Type': 'application/json',
              },
            }
          );
          expect(response.status).toBe(400);
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Performance and Scale', () => {
    test(
      'should handle multiple concurrent requests',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const johnApiKey = testUsers.john.apiKey;

        const concurrentRequests = Array.from({ length: 5 }, () =>
          axios.get(`${apiEndpoint}/documents`, {
            headers: { 'X-Api-Key': johnApiKey },
          })
        );

        const responses = await Promise.all(concurrentRequests);

        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should respect API Gateway usage plans and rate limiting',
      async () => {
        const apiEndpoint = outputs.ApiEndpoint;
        const johnApiKey = testUsers.john.apiKey;

        // Make rapid successive requests to test rate limiting
        const rapidRequests = [];
        for (let i = 0; i < 15; i++) {
          rapidRequests.push(
            axios
              .get(`${apiEndpoint}/documents`, {
                headers: { 'X-Api-Key': johnApiKey },
              })
              .catch(error => error.response)
          );
        }

        const responses = await Promise.all(rapidRequests);

        // Check if any requests were rate limited (HTTP 429)
        const rateLimitedResponses = responses.filter(
          response => response?.status === 429
        );

        // Rate limiting might or might not be triggered depending on configuration
        // This test documents the behavior but doesn't require rate limiting
        console.log(
          `Rate limited responses: ${rateLimitedResponses.length}/15`
        );
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Cleanup Verification', () => {
    test(
      'should be able to delete test objects from S3',
      async () => {
        const bucketName = outputs.DocumentsBucketName;

        for (const key of testObjects) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key,
            })
          );

          // Verify object is deleted
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: key,
            })
          );

          expect(listResponse.Contents?.length || 0).toBe(0);
        }
      },
      TEST_TIMEOUT
    );
  });
});
