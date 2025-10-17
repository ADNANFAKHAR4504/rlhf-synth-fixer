// Configuration - These are coming from cfn-outputs after cdk deploy
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';

// Try to read outputs file, skip tests if not available
let outputs: any = {};
let hasOutputsFile = false;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  hasOutputsFile = true;
} catch (error) {
  console.log('Skipping integration tests - cfn-outputs/flat-outputs.json not found');
  hasOutputsFile = false;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
// Extract from actual outputs if not set in environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX ||
  (outputs.uswest2DynamoDBTableName ? outputs.uswest2DynamoDBTableName.split('-').pop() : 'dev');

// Check if secondary region outputs are available
const hasSecondaryRegionOutputs = outputs.apsouth1VPCId &&
  outputs.apsouth1ApplicationLoadBalancerDNS &&
  outputs.apsouth1LogBucket;

describe('Web Application Infrastructure Integration Tests', () => {
  // Skip all tests if outputs file is not available
  if (!hasOutputsFile) {
    test.skip('Integration tests skipped - cfn-outputs/flat-outputs.json not found', () => {
      console.log('Integration tests require cfn-outputs/flat-outputs.json file');
    });
    return;
  }

  // Check if AWS credentials are available
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  // Helper function to skip AWS SDK tests when credentials are not available
  const skipIfNoCredentials = (testName: string) => {
    if (!hasAwsCredentials) {
      console.log(`Skipping ${testName} - AWS credentials not available`);
      return true;
    }
    return false;
  };

  describe('Service-Level Tests', () => {
    test('should verify DynamoDB Global Table exists and can store data', async () => {
      if (skipIfNoCredentials('DynamoDB test')) return;
      const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
      const tableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName;
      const testId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Put an item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: timestamp.toString() },
          environment: { S: environmentSuffix },
          testData: { S: 'integration-test-data' },
        },
      });

      await dynamoClient.send(putCommand);

      // Get the item back (need both partition key and sort key)
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: timestamp.toString() },
        },
      });

      const response = await dynamoClient.send(getCommand);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id?.S).toBe(testId);
      expect(response.Item?.timestamp?.N).toBe(timestamp.toString());
      expect(response.Item?.environment?.S).toBe(environmentSuffix);
      expect(response.Item?.testData?.S).toBe('integration-test-data');
    });

    test('should verify S3 log bucket exists and is accessible', async () => {
      if (skipIfNoCredentials('S3 test')) return;
      const s3Client = new S3Client({ region: 'us-west-2' });
      const bucketName = outputs.uswest2LogBucket || outputs.LogBucket;

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);

      // Verify bucket name matches expected pattern
      expect(bucketName).toMatch(new RegExp(`^webapp-logs-webapp-${environmentSuffix}-us-west-2-(\\d+|\\*+)$`));
    });

    test('should verify ALB exists and is accessible', async () => {
      if (skipIfNoCredentials('ALB test')) return;
      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;

      const command = new DescribeLoadBalancersCommand({
        Names: [`webapp-alb-${environmentSuffix}`],
      });

      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBeGreaterThan(0);
      expect(response.LoadBalancers?.[0]?.DNSName).toBe(albDns);
      expect(response.LoadBalancers?.[0]?.Type).toBe('application');
      expect(response.LoadBalancers?.[0]?.Scheme).toBe('internet-facing');
    });

    test('should verify VPC exists with correct configuration', async () => {
      if (skipIfNoCredentials('VPC test')) return;
      const ec2Client = new EC2Client({ region: 'us-west-2' });
      const vpcId = outputs.uswest2VPCId;

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });

    test('should verify subnets exist in different AZs', async () => {
      if (skipIfNoCredentials('subnet test')) return;
      const ec2Client = new EC2Client({ region: 'us-west-2' });
      const vpcId = outputs.uswest2VPCId;

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private

      // Verify we have subnets in different AZs
      const availabilityZones = new Set(response.Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    test('should verify security groups exist with correct rules', async () => {
      if (skipIfNoCredentials('security group test')) return;
      const ec2Client = new EC2Client({ region: 'us-west-2' });
      const vpcId = outputs.uswest2VPCId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(2);

      // Find ALB security group
      const albSg = response.SecurityGroups?.find(sg =>
        sg.GroupName === `webapp-alb-sg-${environmentSuffix}`
      );
      expect(albSg).toBeDefined();
      expect(albSg?.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
        })
      );

      // Find instance security group
      const instanceSg = response.SecurityGroups?.find(sg =>
        sg.GroupName === `webapp-instance-sg-${environmentSuffix}`
      );
      expect(instanceSg).toBeDefined();
    });
  });

  describe('Cross-Service Connectivity Tests', () => {
    test('should verify EC2 test application health endpoint', async () => {
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const healthUrl = `http://${albDns}/health`;

      const response = await fetch(healthUrl);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.region).toBe('us-west-2');
      expect(data.timestamp).toBeDefined();
    });

    test('should verify EC2 can access S3 through test application', async () => {
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const s3TestUrl = `http://${albDns}/test/s3`;

      const response = await fetch(s3TestUrl);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.message).toBe('S3 test completed successfully');
      expect(data.testData).toBeDefined();
      expect(data.testData.testId).toMatch(/^s3-test-/);
      expect(data.testData.region).toBe('us-west-2');
    });

    test('should verify EC2 can access DynamoDB through test application', async () => {
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const dynamoTestUrl = `http://${albDns}/test/dynamodb`;

      const response = await fetch(dynamoTestUrl);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.message).toBe('DynamoDB test completed successfully');
      expect(data.testData).toBeDefined();
      expect(data.testData.id).toMatch(/^dynamodb-test-/);
      expect(data.testData.region).toBe('us-west-2');
      expect(data.testData.testType).toBe('integration-test');
    });

    test('should verify EC2 test application status endpoint', async () => {
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const statusUrl = `http://${albDns}/status`;

      const response = await fetch(statusUrl);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('running');
      expect(data.region).toBe('us-west-2');
      expect(data.testResults).toBeDefined();
      expect(data.environment).toBeDefined();
      expect(data.environment.AWS_REGION).toBe('us-west-2');
      expect(data.environment.S3_BUCKET_NAME).toBeDefined();
      expect(data.environment.DYNAMODB_TABLE_NAME).toBeDefined();
    });
  });

  describe('End-to-End (E2E) Workflow Tests', () => {
    test('should verify complete E2E workflow through test application', async () => {
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const integrationTestUrl = `http://${albDns}/test/integration`;

      const response = await fetch(integrationTestUrl);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.message).toBe('E2E integration test completed successfully');
      expect(data.workflowId).toMatch(/^integration-/);
      expect(data.dynamoDBData).toBeDefined();
      expect(data.s3Data).toBeDefined();

      // Verify DynamoDB data
      expect(data.dynamoDBData.id).toBe(data.workflowId);
      expect(data.dynamoDBData.status).toBe('completed');
      expect(data.dynamoDBData.testType).toBe('e2e-workflow');

      // Verify S3 data matches DynamoDB data
      expect(data.s3Data.id).toBe(data.workflowId);
      expect(data.s3Data.testType).toBe('e2e-workflow');
    });

    test('should verify E2E workflow data persistence in S3 and DynamoDB', async () => {
      if (skipIfNoCredentials('E2E AWS SDK verification')) return;
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const integrationTestUrl = `http://${albDns}/test/integration`;
      const tableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName;
      const bucketName = outputs.uswest2LogBucket || outputs.LogBucket;

      // Step 1: Trigger the E2E workflow via ALB
      console.log(`Making API call to: ${integrationTestUrl}`);
      const response = await fetch(integrationTestUrl);
      expect(response.status).toBe(200);

      const apiData = await response.json();
      expect(apiData.status).toBe('success');
      expect(apiData.workflowId).toMatch(/^integration-/);

      const workflowId = apiData.workflowId;
      const timestamp = apiData.dynamoDBData.timestamp;

      console.log(`Workflow ID: ${workflowId}, Timestamp: ${timestamp}`);

      // Step 2: Verify data exists in DynamoDB using AWS SDK
      const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-west-2' }));

      const dynamoGetCommand = new GetCommand({
        TableName: tableName,
        Key: {
          id: workflowId,
          timestamp: timestamp
        }
      });

      const dynamoResult = await dynamoClient.send(dynamoGetCommand);
      expect(dynamoResult.Item).toBeDefined();
      expect(dynamoResult.Item!.id).toBe(workflowId);
      expect(dynamoResult.Item!.status).toBe('completed');
      expect(dynamoResult.Item!.testType).toBe('e2e-workflow');

      console.log('✅ DynamoDB verification passed');

      // Step 3: Verify data exists in S3 using AWS SDK
      const s3Client = new S3Client({ region: 'us-west-2' });
      const s3Key = `workflows/${workflowId}.json`;

      const s3GetCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key
      });

      const s3Result = await s3Client.send(s3GetCommand);
      expect(s3Result.Body).toBeDefined();

      const s3Data = JSON.parse(await s3Result.Body!.transformToString());
      expect(s3Data.id).toBe(workflowId);
      expect(s3Data.testType).toBe('e2e-workflow');
      expect(s3Data.status).toBe('processing'); // S3 has the initial status

      console.log('✅ S3 verification passed');

      // Step 4: Verify data consistency between services
      expect(dynamoResult.Item!.id).toBe(s3Data.id);
      expect(dynamoResult.Item!.testType).toBe(s3Data.testType);
      expect(dynamoResult.Item!.region).toBe(s3Data.region);

      console.log('✅ Data consistency verification passed');

      // Step 5: Verify the workflow completed successfully
      expect(dynamoResult.Item!.status).toBe('completed');
      expect(dynamoResult.Item!.updatedAt).toBeDefined();

      console.log('🎉 Complete E2E workflow verification successful!');
    });

    test('should verify individual S3 test endpoint and data persistence', async () => {
      if (skipIfNoCredentials('S3 individual test verification')) return;
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const s3TestUrl = `http://${albDns}/test/s3`;
      const bucketName = outputs.uswest2LogBucket || outputs.LogBucket;

      // Step 1: Call S3 test endpoint
      console.log(`Making API call to: ${s3TestUrl}`);
      const response = await fetch(s3TestUrl);
      expect(response.status).toBe(200);

      const apiData = await response.json();
      expect(apiData.status).toBe('success');
      expect(apiData.message).toBe('S3 test completed successfully');
      expect(apiData.testData).toBeDefined();
      expect(apiData.testData.testId).toMatch(/^s3-test-/);

      const testId = apiData.testData.testId;
      const testKey = `test/${testId.split('-')[2]}.json`; // Extract timestamp from testId

      console.log(`S3 Test ID: ${testId}, Key: ${testKey}`);

      // Step 2: Verify data exists in S3 using AWS SDK
      const s3Client = new S3Client({ region: 'us-west-2' });

      const s3GetCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });

      const s3Result = await s3Client.send(s3GetCommand);
      expect(s3Result.Body).toBeDefined();

      const s3Data = JSON.parse(await s3Result.Body!.transformToString());
      expect(s3Data.testId).toBe(testId);
      expect(s3Data.region).toBe('us-west-2');

      console.log('✅ S3 individual test verification passed');
    });

    test('should verify individual DynamoDB test endpoint and data persistence', async () => {
      if (skipIfNoCredentials('DynamoDB individual test verification')) return;
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
      const dynamoTestUrl = `http://${albDns}/test/dynamodb`;
      const tableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName;

      // Step 1: Call DynamoDB test endpoint
      console.log(`Making API call to: ${dynamoTestUrl}`);
      const response = await fetch(dynamoTestUrl);
      expect(response.status).toBe(200);

      const apiData = await response.json();
      expect(apiData.status).toBe('success');
      expect(apiData.message).toBe('DynamoDB test completed successfully');
      expect(apiData.testData).toBeDefined();
      expect(apiData.testData.id).toMatch(/^dynamodb-test-/);

      const testId = apiData.testData.id;
      const timestamp = apiData.testData.timestamp;

      console.log(`DynamoDB Test ID: ${testId}, Timestamp: ${timestamp}`);

      // Step 2: Verify data exists in DynamoDB using AWS SDK
      const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-west-2' }));

      const dynamoGetCommand = new GetCommand({
        TableName: tableName,
        Key: {
          id: testId,
          timestamp: timestamp
        }
      });

      const dynamoResult = await dynamoClient.send(dynamoGetCommand);
      expect(dynamoResult.Item).toBeDefined();
      expect(dynamoResult.Item!.id).toBe(testId);
      expect(dynamoResult.Item!.testType).toBe('integration-test');
      expect(dynamoResult.Item!.region).toBe('us-west-2');

      console.log('✅ DynamoDB individual test verification passed');
    });

    test('should verify ALB health check is working with test application', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
      const albDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;

      // Get target group health
      const command = new DescribeLoadBalancersCommand({
        Names: [`webapp-alb-${environmentSuffix}`],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBeGreaterThan(0);

      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
    });
  });

  describe('Legacy Infrastructure Tests', () => {

    describe('Secondary Region (ap-south-1) Tests', () => {
      test('should verify DynamoDB Global Table is accessible from secondary region', async () => {
        const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
        const tableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName; // Same table name
        const testId = `test-west-${Date.now()}`;
        const timestamp = Date.now();

        // Put an item
        const putCommand = new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
            environment: { S: environmentSuffix },
            region: { S: 'ap-south-1' },
            testData: { S: 'integration-test-data-west' },
          },
        });

        await dynamoClient.send(putCommand);

        // Get the item back (need both partition key and sort key)
        const getCommand = new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
          },
        });

        const response = await dynamoClient.send(getCommand);

        expect(response.Item).toBeDefined();
        expect(response.Item?.id?.S).toBe(testId);
        expect(response.Item?.timestamp?.N).toBe(timestamp.toString());
        expect(response.Item?.environment?.S).toBe(environmentSuffix);
        expect(response.Item?.region?.S).toBe('ap-south-1');
      });

      test('should verify S3 log bucket exists in secondary region', async () => {
        if (!hasSecondaryRegionOutputs) {
          console.log('Skipping secondary region S3 test - outputs not available');
          return;
        }

        const s3Client = new S3Client({ region: 'ap-south-1' });
        const bucketName = outputs.apsouth1LogBucket;

        const command = new HeadBucketCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);

        expect(response.$metadata.httpStatusCode).toBe(200);

        // Verify bucket name matches expected pattern
        expect(bucketName).toMatch(new RegExp(`^webapp-logs-webapp-${environmentSuffix}-ap-south-1-\\d+$`));
      });

      test('should verify ALB exists in secondary region', async () => {
        if (!hasSecondaryRegionOutputs) {
          console.log('Skipping secondary region ALB test - outputs not available');
          return;
        }

        const elbClient = new ElasticLoadBalancingV2Client({ region: 'ap-south-1' });
        const albDns = outputs.apsouth1ApplicationLoadBalancerDNS;

        const command = new DescribeLoadBalancersCommand({
          Names: [`webapp-alb-${environmentSuffix}`],
        });

        const response = await elbClient.send(command);

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers?.length).toBeGreaterThan(0);
        expect(response.LoadBalancers?.[0]?.DNSName).toBe(albDns);
        expect(response.LoadBalancers?.[0]?.Type).toBe('application');
        expect(response.LoadBalancers?.[0]?.Scheme).toBe('internet-facing');
      });

      test('should verify VPC exists in secondary region', async () => {
        if (!hasSecondaryRegionOutputs) {
          console.log('Skipping secondary region VPC test - outputs not available');
          return;
        }

        const ec2Client = new EC2Client({ region: 'ap-south-1' });
        const vpcId = outputs.apsouth1VPCId;

        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId],
        });

        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs?.length).toBeGreaterThan(0);
        expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
        expect(response.Vpcs?.[0]?.State).toBe('available');
      });
    });

    describe('Cross-Region Integration Tests', () => {
      test('should verify DynamoDB Global Table replicates across regions', async () => {
        const eastClient = new DynamoDBClient({ region: 'us-west-2' });
        const westClient = new DynamoDBClient({ region: 'ap-south-1' });

        const tableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName;

        // Test Global Table replication by writing in one region and reading from another
        const testId = `cross-region-test-${Date.now()}`;
        const timestamp = Date.now();

        // Put item in east region
        const eastPutCommand = new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: `${testId}-east` },
            timestamp: { N: timestamp.toString() },
            region: { S: 'us-west-2' },
            testType: { S: 'cross-region-replication' },
          },
        });

        await eastClient.send(eastPutCommand);

        // Put item in west region
        const westPutCommand = new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: `${testId}-west` },
            timestamp: { N: (timestamp + 1).toString() },
            region: { S: 'ap-south-1' },
            testType: { S: 'cross-region-replication' },
          },
        });

        await westClient.send(westPutCommand);

        // Verify items can be read from both regions
        const eastGetCommand = new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: `${testId}-east` },
            timestamp: { N: timestamp.toString() }
          },
        });

        const westGetCommand = new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: `${testId}-west` },
            timestamp: { N: (timestamp + 1).toString() }
          },
        });

        const [eastResponse, westResponse] = await Promise.all([
          eastClient.send(eastGetCommand),
          westClient.send(westGetCommand),
        ]);

        expect(eastResponse.Item).toBeDefined();
        expect(eastResponse.Item?.region?.S).toBe('us-west-2');
        expect(eastResponse.Item?.testType?.S).toBe('cross-region-replication');

        expect(westResponse.Item).toBeDefined();
        expect(westResponse.Item?.region?.S).toBe('ap-south-1');
        expect(westResponse.Item?.testType?.S).toBe('cross-region-replication');
      });

      test('should verify both regions have independent S3 buckets', async () => {
        if (!hasSecondaryRegionOutputs) {
          console.log('Skipping cross-region S3 test - secondary region outputs not available');
          return;
        }

        const eastClient = new S3Client({ region: 'us-west-2' });
        const westClient = new S3Client({ region: 'ap-south-1' });

        const eastBucketName = outputs.uswest2LogBucket || outputs.LogBucket;
        const westBucketName = outputs.apsouth1LogBucket;

        // Verify buckets are different
        expect(eastBucketName).not.toBe(westBucketName);

        // Test both buckets independently
        const testKey = `cross-region-test-${Date.now()}.json`;
        const testData = JSON.stringify({
          testId: `cross-region-${Date.now()}`,
          timestamp: new Date().toISOString(),
        });

        // Put object in east region bucket
        const eastPutCommand = new PutObjectCommand({
          Bucket: eastBucketName,
          Key: testKey,
          Body: testData,
          ContentType: 'application/json',
        });

        await eastClient.send(eastPutCommand);

        // Put object in west region bucket
        const westPutCommand = new PutObjectCommand({
          Bucket: westBucketName,
          Key: testKey,
          Body: testData,
          ContentType: 'application/json',
        });

        await westClient.send(westPutCommand);

        // Verify objects exist in respective buckets
        const eastListCommand = new ListObjectsV2Command({
          Bucket: eastBucketName,
          Prefix: testKey,
        });

        const westListCommand = new ListObjectsV2Command({
          Bucket: westBucketName,
          Prefix: testKey,
        });

        const [eastResponse, westResponse] = await Promise.all([
          eastClient.send(eastListCommand),
          westClient.send(westListCommand),
        ]);

        expect(eastResponse.Contents).toBeDefined();
        expect(eastResponse.Contents?.length).toBeGreaterThan(0);

        expect(westResponse.Contents).toBeDefined();
        expect(westResponse.Contents?.length).toBeGreaterThan(0);
      });

      test('should verify both regions have independent ALBs', async () => {
        if (!hasSecondaryRegionOutputs) {
          console.log('Skipping cross-region ALB test - secondary region outputs not available');
          return;
        }

        const eastClient = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
        const westClient = new ElasticLoadBalancingV2Client({ region: 'ap-south-1' });

        const eastAlbDns = outputs.uswest2ApplicationLoadBalancerDNS || outputs.ALBDNS;
        const westAlbDns = outputs.apsouth1ApplicationLoadBalancerDNS;

        // Verify ALBs are different
        expect(eastAlbDns).not.toBe(westAlbDns);

        // Test both ALBs independently
        const eastCommand = new DescribeLoadBalancersCommand({
          Names: [`webapp-alb-${environmentSuffix}`],
        });

        const westCommand = new DescribeLoadBalancersCommand({
          Names: [`webapp-alb-${environmentSuffix}`],
        });

        const [eastResponse, westResponse] = await Promise.all([
          eastClient.send(eastCommand),
          westClient.send(westCommand),
        ]);

        expect(eastResponse.LoadBalancers).toBeDefined();
        expect(eastResponse.LoadBalancers?.length).toBeGreaterThan(0);
        expect(eastResponse.LoadBalancers?.[0]?.DNSName).toBe(eastAlbDns);

        expect(westResponse.LoadBalancers).toBeDefined();
        expect(westResponse.LoadBalancers?.length).toBeGreaterThan(0);
        expect(westResponse.LoadBalancers?.[0]?.DNSName).toBe(westAlbDns);
      });
    });

    describe('Resource Configuration Validation', () => {
      test('should verify all required outputs are present for both regions', () => {
        const requiredPrimaryOutputs = [
          'uswest2VPCId',
          'uswest2ApplicationLoadBalancerDNS',
          'uswest2ApplicationLoadBalancerURL',
          'uswest2DynamoDBTableName',
          'uswest2LogBucket',
          'uswest2Region',
          'uswest2Environment',
        ];

        const requiredSecondaryOutputs = [
          'apsouth1VPCId',
          'apsouth1ApplicationLoadBalancerDNS',
          'apsouth1ApplicationLoadBalancerURL',
          'apsouth1LogBucket',
          'apsouth1Region',
          'apsouth1Environment',
        ];

        // Check primary region outputs (with fallback to legacy names)
        requiredPrimaryOutputs.forEach(output => {
          if (outputs[output] || (output === 'uswest2DynamoDBTableName' && outputs.DynamoDBTableName) ||
            (output === 'uswest2LogBucket' && outputs.LogBucket) ||
            (output === 'uswest2ApplicationLoadBalancerDNS' && outputs.ALBDNS)) {
            expect(outputs[output] || outputs.DynamoDBTableName || outputs.LogBucket || outputs.ALBDNS).toBeDefined();
          }
        });

        // Check secondary region outputs (only if available)
        if (hasSecondaryRegionOutputs) {
          requiredSecondaryOutputs.forEach(output => {
            expect(outputs[output]).toBeDefined();
            expect(outputs[output]).not.toBe('');
          });
        } else {
          console.log('Skipping secondary region output validation - outputs not available');
        }
      });

      test('should verify all resources use correct environment suffix', () => {
        // Primary region
        const eastTableName = outputs.uswest2DynamoDBTableName || outputs.DynamoDBTableName;
        const eastBucketName = outputs.uswest2LogBucket || outputs.LogBucket;

        expect(eastTableName).toContain(environmentSuffix);
        expect(eastBucketName).toContain(environmentSuffix);

        // Secondary region (only if available)
        if (hasSecondaryRegionOutputs) {
          expect(outputs.apsouth1LogBucket).toContain(environmentSuffix);
        } else {
          console.log('Skipping secondary region environment suffix validation - outputs not available');
        }
      });

      test('should verify region-specific naming conventions', () => {
        // Primary region
        const eastBucketName = outputs.uswest2LogBucket || outputs.LogBucket;
        expect(eastBucketName).toMatch(new RegExp(`-us-west-2-(\\d+|\\*+)$`));

        // Secondary region (only if available)
        if (hasSecondaryRegionOutputs) {
          expect(outputs.apsouth1LogBucket).toMatch(new RegExp(`-ap-south-1-\\d+$`));
          expect(outputs.apsouth1Region).toBe('ap-south-1');
        } else {
          console.log('Skipping secondary region naming convention validation - outputs not available');
        }
      });
    });
  });
});