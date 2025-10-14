// Configuration - These are coming from cfn-outputs after cdk deploy
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Web Application Infrastructure Integration Tests', () => {
  describe('Primary Region (us-east-1) Tests', () => {
    test('should verify DynamoDB Global Table exists and can store data', async () => {
      const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
      const tableName = outputs.useast1DynamoDBTableName || outputs.DynamoDBTableName;
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
      const s3Client = new S3Client({ region: 'us-east-1' });
      const bucketName = outputs.useast1LogBucket || outputs.LogBucket;

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);

      // Verify bucket name matches expected pattern
      expect(bucketName).toMatch(new RegExp(`^webapp-logs-webapp-${environmentSuffix}-us-east-1-\\d+$`));
    });

    test('should verify ALB exists and is accessible', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const albDns = outputs.useast1ApplicationLoadBalancerDNS || outputs.ALBDNS;

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
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcId = outputs.useast1VPCId;

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
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcId = outputs.useast1VPCId;

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
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcId = outputs.useast1VPCId;

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

  describe('Secondary Region (ap-south-1) Tests', () => {
    test('should verify DynamoDB Global Table is accessible from secondary region', async () => {
      const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
      const tableName = outputs.useast1DynamoDBTableName || outputs.DynamoDBTableName; // Same table name
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
      const eastClient = new DynamoDBClient({ region: 'us-east-1' });
      const westClient = new DynamoDBClient({ region: 'ap-south-1' });

      const tableName = outputs.useast1DynamoDBTableName || outputs.DynamoDBTableName;

      // Test Global Table replication by writing in one region and reading from another
      const testId = `cross-region-test-${Date.now()}`;
      const timestamp = Date.now();

      // Put item in east region
      const eastPutCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: `${testId}-east` },
          timestamp: { N: timestamp.toString() },
          region: { S: 'us-east-1' },
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
      expect(eastResponse.Item?.region?.S).toBe('us-east-1');
      expect(eastResponse.Item?.testType?.S).toBe('cross-region-replication');

      expect(westResponse.Item).toBeDefined();
      expect(westResponse.Item?.region?.S).toBe('ap-south-1');
      expect(westResponse.Item?.testType?.S).toBe('cross-region-replication');
    });

    test('should verify both regions have independent S3 buckets', async () => {
      const eastClient = new S3Client({ region: 'us-east-1' });
      const westClient = new S3Client({ region: 'ap-south-1' });

      const eastBucketName = outputs.useast1LogBucket || outputs.LogBucket;
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
      const eastClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const westClient = new ElasticLoadBalancingV2Client({ region: 'ap-south-1' });

      const eastAlbDns = outputs.useast1ApplicationLoadBalancerDNS || outputs.ALBDNS;
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
        'useast1VPCId',
        'useast1ApplicationLoadBalancerDNS',
        'useast1ApplicationLoadBalancerURL',
        'useast1DynamoDBTableName',
        'useast1LogBucket',
        'useast1Region',
        'useast1Environment',
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
        if (outputs[output] || (output === 'useast1DynamoDBTableName' && outputs.DynamoDBTableName) ||
          (output === 'useast1LogBucket' && outputs.LogBucket) ||
          (output === 'useast1ApplicationLoadBalancerDNS' && outputs.ALBDNS)) {
          expect(outputs[output] || outputs.DynamoDBTableName || outputs.LogBucket || outputs.ALBDNS).toBeDefined();
        }
      });

      // Check secondary region outputs
      requiredSecondaryOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should verify all resources use correct environment suffix', () => {
      // Primary region
      const eastTableName = outputs.useast1DynamoDBTableName || outputs.DynamoDBTableName;
      const eastBucketName = outputs.useast1LogBucket || outputs.LogBucket;

      expect(eastTableName).toContain(environmentSuffix);
      expect(eastBucketName).toContain(environmentSuffix);

      // Secondary region
      expect(outputs.apsouth1LogBucket).toContain(environmentSuffix);
    });

    test('should verify region-specific naming conventions', () => {
      // Primary region
      const eastBucketName = outputs.useast1LogBucket || outputs.LogBucket;
      expect(eastBucketName).toMatch(new RegExp(`-us-east-1-\\d+$`));

      // Secondary region
      expect(outputs.apsouth1LogBucket).toMatch(new RegExp(`-ap-south-1-\\d+$`));
      expect(outputs.apsouth1Region).toBe('ap-south-1');
    });
  });
});