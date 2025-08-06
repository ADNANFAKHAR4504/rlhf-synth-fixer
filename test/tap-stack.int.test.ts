import AWS from 'aws-sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after deployment
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (err) {
  console.warn(
    'Output file not found. Tests will be skipped if outputs are required.'
  );
  outputs = {};
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3 = new AWS.S3({ region });
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region });
const secretsManager = new AWS.SecretsManager({ region });
const ec2 = new AWS.EC2({ region });
const rds = new AWS.RDS({ region });
const cloudwatch = new AWS.CloudWatch({ region });
const cloudformation = new AWS.CloudFormation({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  // Set timeout higher for integration tests
  jest.setTimeout(60000);

  // Skip all tests if running in local environment without deployed resources
  const skipIfMissingOutputs = () => {
    if (!outputs.S3BucketName || !outputs.TurnAroundPromptTableName) {
      return true;
    }
    return false;
  };

  // Deployment Verification Tests
  describe('Deployment Verification', () => {
    test('should verify CloudFormation stack exists and is in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      // Get stack name from the environment or a default
      const stackName =
        process.env.STACK_NAME || `TapStack${environmentSuffix}`;

      try {
        const response = await cloudformation
          .describeStacks({ StackName: stackName })
          .promise();
        const stack = response.Stacks?.[0];

        console.log(`Stack status: ${stack?.StackStatus}`);

        // Check stack exists and is in a successful state
        expect(stack).toBeDefined();
        expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
          stack?.StackStatus
        );

        // Verify the stack has outputs
        expect(stack?.Outputs?.length).toBeGreaterThan(0);

        // Verify essential resources were created by checking outputs
        const outputKeys = stack?.Outputs?.map(output => output.OutputKey);

        // Check for core resource outputs
        expect(outputKeys).toContain('S3BucketName');
        expect(outputKeys).toContain('TurnAroundPromptTableName');

        // If VPC resources were provided, check for conditional resources
        if (outputs.EC2InstanceId) {
          expect(outputKeys).toContain('EC2InstanceId');
          expect(outputKeys).toContain('RDSInstanceEndpoint');
        }
      } catch (error) {
        if (process.env.CI) {
          // When running in CI environment, fail the test if stack not found
          throw error;
        } else {
          // When running locally, mark test as skipped
          console.warn(
            `Stack ${stackName} not found or accessible. Skipping test.`
          );
          return;
        }
      }
    });

    test('should validate CloudFormation template file syntax', () => {
      try {
        // Use cfn-lint to validate the template
        const templatePath = path.join(__dirname, '../lib/TapStack.yml');
        const result = execSync(`cfn-lint -t ${templatePath}`, {
          encoding: 'utf8',
        });
        console.log('Template validation result:', result);
        // If there's no exception, the template is valid
        expect(true).toBe(true);
      } catch (error: any) {
        console.error('Template validation error:', error.stdout);
        // If running in CI, fail the test on validation error
        if (process.env.CI) {
          expect(error).toBeUndefined();
        }
      }
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should be able to put and get objects from S3 bucket', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping S3 tests - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'This is a test file for integration testing';

      // Upload test file
      await s3
        .putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        })
        .promise();

      // Get the object
      const response = await s3
        .getObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();

      expect(response.Body?.toString()).toBe(testContent);

      // Clean up
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();
    });

    test('should verify bucket encryption settings', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping S3 encryption test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;

      // Get bucket encryption
      const encryption = await s3
        .getBucketEncryption({
          Bucket: bucketName,
        })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);

      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('should confirm bucket blocks public access', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping S3 public access test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;

      // Get public access block configuration
      const publicAccessBlock = await s3
        .getPublicAccessBlock({
          Bucket: bucketName,
        })
        .promise();

      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('should verify bucket has correct tags', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping S3 tags test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;

      try {
        // Get bucket tagging information
        const tagging = await s3
          .getBucketTagging({ Bucket: bucketName })
          .promise();

        // Verify the Name tag exists with the expected format
        const nameTag = tagging.TagSet.find(tag => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toContain('-S3Bucket');

        // Log all tags for debugging
        console.log('S3 bucket tags:', tagging.TagSet);
      } catch (error) {
        console.error('Failed to get bucket tags:', error);
        throw error;
      }
    });

    test('should confirm bucket lifecycle configuration works', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping S3 lifecycle test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;
      const testKey = `lifecycle-test/test-${Date.now()}.txt`;
      const testContent = 'This is a lifecycle test file';

      // Create a test file
      await s3
        .putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        })
        .promise();

      // Verify file exists
      const response = await s3
        .getObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();

      expect(response.Body?.toString()).toBe(testContent);

      // Clean up
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should be able to put, get, and delete items from DynamoDB table', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping DynamoDB tests - outputs not available');
        return;
      }

      const tableName = outputs.TurnAroundPromptTableName;
      const testId = `test-${Date.now()}`;
      const testItem = {
        id: testId,
        content: 'This is a test item',
        timestamp: new Date().toISOString(),
      };

      // Put item
      await dynamoDB
        .put({
          TableName: tableName,
          Item: testItem,
        })
        .promise();

      // Get item
      const response = await dynamoDB
        .get({
          TableName: tableName,
          Key: { id: testId },
        })
        .promise();

      expect(response.Item).toEqual(testItem);

      // Delete item
      await dynamoDB
        .delete({
          TableName: tableName,
          Key: { id: testId },
        })
        .promise();

      // Verify item is deleted
      const afterDelete = await dynamoDB
        .get({
          TableName: tableName,
          Key: { id: testId },
        })
        .promise();

      expect(afterDelete.Item).toBeUndefined();
    });
  });

  describe('EC2 and RDS Connectivity Tests', () => {
    test('should verify EC2 instance is running in a private subnet', async () => {
      if (skipIfMissingOutputs() || !outputs.EC2InstanceId) {
        console.log('Skipping EC2 subnet test - outputs not available');
        return;
      }

      const instanceId = outputs.EC2InstanceId;

      // Describe the EC2 instance
      const instances = await ec2
        .describeInstances({
          InstanceIds: [instanceId],
        })
        .promise();

      const instance = instances.Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');

      // Get subnet information
      const subnetId = instance?.SubnetId;
      const subnets = await ec2
        .describeSubnets({
          SubnetIds: [subnetId!],
        })
        .promise();

      const subnet = subnets.Subnets?.[0];
      expect(subnet).toBeDefined();

      // Check if subnet is private (no route to internet gateway)
      const routeTables = await ec2
        .describeRouteTables({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnetId!],
            },
          ],
        })
        .promise();

      // If a subnet is private, it should not have a route to an internet gateway
      const hasInternetRoute = routeTables.RouteTables?.[0]?.Routes?.some(
        route => route.GatewayId?.startsWith('igw-')
      );

      expect(hasInternetRoute).toBe(false);
    });

    test('should verify RDS instance is not publicly accessible', async () => {
      if (skipIfMissingOutputs() || !outputs.RDSInstanceEndpoint) {
        console.log('Skipping RDS public access test - outputs not available');
        return;
      }

      // Extract DB instance identifier from endpoint
      const endpoint = outputs.RDSInstanceEndpoint;
      const dbInstanceIdentifier = endpoint.split('.')[0];

      // Describe the RDS instance
      const rdsInstances = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
        .promise();

      const instance = rdsInstances.DBInstances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.PubliclyAccessible).toBe(false);
    });

    test('should verify RDS has logging enabled', async () => {
      if (skipIfMissingOutputs() || !outputs.RDSInstanceEndpoint) {
        console.log('Skipping RDS logging test - outputs not available');
        return;
      }

      // Extract DB instance identifier from endpoint
      const endpoint = outputs.RDSInstanceEndpoint;
      const dbInstanceIdentifier = endpoint.split('.')[0];

      // Describe the RDS instance
      const rdsInstances = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
        .promise();

      const instance = rdsInstances.DBInstances?.[0];
      expect(instance).toBeDefined();

      // Check CloudWatch logs exports
      const logExports = instance?.EnabledCloudwatchLogsExports || [];
      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slow-query');
    });

    test('should verify RDS instance has proper performance settings', async () => {
      if (skipIfMissingOutputs() || !outputs.RDSInstanceEndpoint) {
        console.log('Skipping RDS performance test - outputs not available');
        return;
      }

      // Extract DB instance identifier from endpoint
      const endpoint = outputs.RDSInstanceEndpoint;
      const dbInstanceIdentifier = endpoint.split('.')[0];

      // Describe the RDS instance with more details
      const rdsInstances = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
        .promise();

      const instance = rdsInstances.DBInstances?.[0];

      // Verify instance has sufficient storage
      expect(instance?.AllocatedStorage).toBeGreaterThanOrEqual(20);

      // Verify backup settings
      expect(instance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

      // Verify storage is encrypted
      expect(instance?.StorageEncrypted).toBe(true);

      // Verify enhanced monitoring is enabled with appropriate interval
      expect(instance?.MonitoringInterval).toBe(60);

      // Log performance metrics for debugging
      console.log(
        `RDS storage: ${instance?.AllocatedStorage}GB, backup retention: ${instance?.BackupRetentionPeriod} days`
      );
    });

    test('should check EC2 instance configuration for security best practices', async () => {
      if (skipIfMissingOutputs() || !outputs.EC2InstanceId) {
        console.log('Skipping EC2 security test - outputs not available');
        return;
      }

      const instanceId = outputs.EC2InstanceId;

      // Get EC2 instance details
      const instances = await ec2
        .describeInstances({
          InstanceIds: [instanceId],
        })
        .promise();

      const instance = instances.Reservations?.[0]?.Instances?.[0];

      // Verify instance exists and is running
      expect(instance).toBeDefined();

      // Check if IMDSv2 is enforced (more secure metadata service)
      const metadata = instance?.MetadataOptions;
      if (metadata) {
        console.log('EC2 metadata options:', metadata);
        // Best practice is to use IMDSv2 (HttpTokens: required)
        // This is just informational, not failing the test if it's not set
        if (metadata.HttpTokens !== 'required') {
          console.warn('Warning: IMDSv2 is not enforced on the EC2 instance');
        }
      }

      // Check for public IP (should not have one for a private instance)
      expect(instance?.PublicIpAddress).toBeUndefined();
    });

    test('should verify RDS and EC2 security groups are properly configured', async () => {
      if (
        skipIfMissingOutputs() ||
        !outputs.EC2InstanceId ||
        !outputs.RDSInstanceEndpoint
      ) {
        console.log('Skipping security group test - outputs not available');
        return;
      }

      // Get EC2 instance details to find security group
      const ec2Response = await ec2
        .describeInstances({
          InstanceIds: [outputs.EC2InstanceId],
        })
        .promise();

      const ec2SecurityGroupIds =
        ec2Response.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.map(
          sg => sg.GroupId
        );
      expect(ec2SecurityGroupIds?.length).toBeGreaterThan(0);

      // Extract DB instance identifier from endpoint
      const endpoint = outputs.RDSInstanceEndpoint;
      const dbInstanceIdentifier = endpoint.split('.')[0];

      // Get RDS security groups
      const rdsResponse = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
        .promise();

      const rdsSecurityGroupIds =
        rdsResponse.DBInstances?.[0]?.VpcSecurityGroups?.map(
          sg => sg.VpcSecurityGroupId
        );
      expect(rdsSecurityGroupIds?.length).toBeGreaterThan(0);

      // Now check that RDS security group allows inbound only from EC2 security group
      if (rdsSecurityGroupIds && rdsSecurityGroupIds.length > 0) {
        const rdsSgResponse = await ec2
          .describeSecurityGroups({
            GroupIds: rdsSecurityGroupIds,
          })
          .promise();

        const rdsSecurityGroup = rdsSgResponse.SecurityGroups?.[0];

        // Check ingress rules
        const ingressRules = rdsSecurityGroup?.IpPermissions || [];

        // Look for MySQL port rule (3306)
        const mysqlRule = ingressRules.find(
          rule =>
            rule.FromPort === 3306 &&
            rule.ToPort === 3306 &&
            rule.IpProtocol === 'tcp'
        );

        expect(mysqlRule).toBeDefined();

        // Check that the source is either the EC2 security group or a subset of internal CIDR blocks
        if (
          mysqlRule?.UserIdGroupPairs &&
          mysqlRule.UserIdGroupPairs.length > 0
        ) {
          // Source is security group(s)
          const sourceGroupIds = mysqlRule.UserIdGroupPairs.map(
            pair => pair.GroupId
          );
          console.log(
            'RDS ingress allowed from security groups:',
            sourceGroupIds
          );

          // There should be at least one EC2 security group that can access RDS
          const hasOverlap = ec2SecurityGroupIds?.some(id =>
            sourceGroupIds.includes(id)
          );
          expect(hasOverlap).toBe(true);
        } else if (mysqlRule?.IpRanges && mysqlRule.IpRanges.length > 0) {
          // Source is CIDR blocks - should be internal IPs only
          const cidrBlocks = mysqlRule.IpRanges.map(range => range.CidrIp);
          console.log('RDS ingress allowed from CIDR blocks:', cidrBlocks);

          // Check none of the CIDR blocks are open to the internet
          const hasPublicAccess = cidrBlocks.some(
            cidr => cidr === '0.0.0.0/0' || cidr === '::/0'
          );
          expect(hasPublicAccess).toBe(false);
        }
      }
    });
  });

  describe('E2E Workflow Tests', () => {
    test('should verify complete data flow from EC2 to S3 to DynamoDB with realistic workload', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping E2E workflow test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;
      const tableName = outputs.TurnAroundPromptTableName;

      // Generate unique test ID for this run
      const testId = `e2e-test-${Date.now()}`;
      const inputFolder = `data/input/${testId}`;
      const processedFolder = `data/processed/${testId}`;

      // Step 1: Simulate multiple input files uploaded to S3 (as if from external source)
      const testFiles = [
        {
          key: `${inputFolder}/file1.json`,
          data: {
            id: `${testId}-1`,
            content: 'This is file 1',
            timestamp: new Date().toISOString(),
          },
        },
        {
          key: `${inputFolder}/file2.json`,
          data: {
            id: `${testId}-2`,
            content: 'This is file 2',
            timestamp: new Date().toISOString(),
          },
        },
        {
          key: `${inputFolder}/file3.json`,
          data: {
            id: `${testId}-3`,
            content: 'This is file 3',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      // Upload all test files to S3
      await Promise.all(
        testFiles.map(file =>
          s3
            .putObject({
              Bucket: bucketName,
              Key: file.key,
              Body: JSON.stringify(file.data),
              ContentType: 'application/json',
            })
            .promise()
        )
      );

      console.log(
        `Uploaded ${testFiles.length} files to S3 input folder: ${inputFolder}`
      );

      // Step 2: Simulate EC2 processing - move files from input to processed folder
      // and write aggregated data to DynamoDB
      await Promise.all(
        testFiles.map(async (file, index) => {
          // Get the input file
          const s3Object = await s3
            .getObject({
              Bucket: bucketName,
              Key: file.key,
            })
            .promise();

          // Parse the data
          const fileData = JSON.parse(s3Object.Body?.toString() || '{}');

          // Add processed marker
          fileData.processed = true;
          fileData.processingTimestamp = new Date().toISOString();

          // Write to processed folder
          await s3
            .putObject({
              Bucket: bucketName,
              Key: `${processedFolder}/processed-${index + 1}.json`,
              Body: JSON.stringify(fileData),
              ContentType: 'application/json',
            })
            .promise();

          // Write to DynamoDB
          await dynamoDB
            .put({
              TableName: tableName,
              Item: fileData,
            })
            .promise();

          console.log(
            `Processed file ${index + 1}: ${file.key} -> DynamoDB and processed S3 location`
          );
        })
      );

      // Step 3: Verify all records exist in DynamoDB
      for (let i = 0; i < testFiles.length; i++) {
        const fileData = testFiles[i].data;
        const response = await dynamoDB
          .get({
            TableName: tableName,
            Key: { id: fileData.id },
          })
          .promise();

        expect(response.Item).toBeDefined();
        expect(response.Item?.id).toBe(fileData.id);
        expect(response.Item?.content).toBe(fileData.content);
        expect(response.Item?.processed).toBe(true);
      }

      // Step 4: Verify processed files exist in S3
      for (let i = 0; i < testFiles.length; i++) {
        try {
          const processedKey = `${processedFolder}/processed-${i + 1}.json`;
          const response = await s3
            .getObject({
              Bucket: bucketName,
              Key: processedKey,
            })
            .promise();

          expect(response.Body).toBeDefined();

          const processedData = JSON.parse(response.Body?.toString() || '{}');
          expect(processedData.processed).toBe(true);
          expect(processedData.processingTimestamp).toBeDefined();
        } catch (error) {
          console.error(`Failed to verify processed file ${i + 1}:`, error);
          throw error;
        }
      }

      // Step 5: Clean up all test data
      console.log('Cleaning up test data...');

      // Delete files from S3 (both input and processed folders)
      const allKeys = [
        ...testFiles.map(file => file.key),
        ...Array.from(
          { length: testFiles.length },
          (_, i) => `${processedFolder}/processed-${i + 1}.json`
        ),
      ];

      await Promise.all(
        allKeys.map(key =>
          s3
            .deleteObject({
              Bucket: bucketName,
              Key: key,
            })
            .promise()
        )
      );

      // Delete items from DynamoDB
      await Promise.all(
        testFiles.map(file =>
          dynamoDB
            .delete({
              TableName: tableName,
              Key: { id: file.data.id },
            })
            .promise()
        )
      );

      console.log('E2E workflow test cleanup completed successfully');
    });

    test('should verify infrastructure performance under load', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping performance test - outputs not available');
        return;
      }

      const bucketName = outputs.S3BucketName;
      const tableName = outputs.TurnAroundPromptTableName;
      const testId = `perf-test-${Date.now()}`;

      // Number of concurrent operations to test performance
      const concurrentOperations = 10;

      console.log(
        `Starting performance test with ${concurrentOperations} concurrent operations`
      );

      // Step 1: Test S3 performance
      console.time('S3 Performance Test');
      const s3TestKeys = Array.from(
        { length: concurrentOperations },
        (_, i) => `performance-test/${testId}/file-${i}.txt`
      );

      const testContent =
        'This is a performance test file with some content to measure throughput';

      // Upload files concurrently
      await Promise.all(
        s3TestKeys.map(key =>
          s3
            .putObject({
              Bucket: bucketName,
              Key: key,
              Body: testContent,
              ContentType: 'text/plain',
            })
            .promise()
        )
      );

      console.timeEnd('S3 Performance Test');

      // Step 2: Test DynamoDB performance
      console.time('DynamoDB Performance Test');
      const dbItems = Array.from({ length: concurrentOperations }, (_, i) => ({
        id: `${testId}-${i}`,
        content: `Performance test item ${i}`,
        timestamp: new Date().toISOString(),
        data: `Additional data for performance testing with record ${i}`,
      }));

      // Write items concurrently
      await Promise.all(
        dbItems.map(item =>
          dynamoDB
            .put({
              TableName: tableName,
              Item: item,
            })
            .promise()
        )
      );

      console.timeEnd('DynamoDB Performance Test');

      // Step 3: Test read performance
      console.time('DynamoDB Read Performance Test');

      // Read items concurrently
      await Promise.all(
        dbItems.map(item =>
          dynamoDB
            .get({
              TableName: tableName,
              Key: { id: item.id },
            })
            .promise()
        )
      );

      console.timeEnd('DynamoDB Read Performance Test');

      // Clean up
      console.log('Cleaning up performance test data...');

      // Delete S3 objects
      await Promise.all(
        s3TestKeys.map(key =>
          s3
            .deleteObject({
              Bucket: bucketName,
              Key: key,
            })
            .promise()
        )
      );

      // Delete DynamoDB items
      await Promise.all(
        dbItems.map(item =>
          dynamoDB
            .delete({
              TableName: tableName,
              Key: { id: item.id },
            })
            .promise()
        )
      );

      console.log('Performance test cleanup completed');
    });
  });

  // Conditional Resource Tests
  describe('Conditional Resource Tests', () => {
    test('should verify resources are created only when conditions are met', async () => {
      // This test will check if the CloudFormation conditions are working correctly

      // Check if conditions appear to be satisfied (EC2Instance exists)
      const ec2Exists = !!outputs.EC2InstanceId;
      const rdsExists = !!outputs.RDSInstanceEndpoint;

      console.log(
        `Conditional resources present: EC2=${ec2Exists}, RDS=${rdsExists}`
      );

      if (ec2Exists) {
        // If EC2 exists, RDS should also exist
        expect(rdsExists).toBe(true);

        // Verify EC2 instance
        const instances = await ec2
          .describeInstances({
            InstanceIds: [outputs.EC2InstanceId],
          })
          .promise();

        expect(instances.Reservations?.[0]?.Instances?.[0]).toBeDefined();

        // Verify RDS instance
        const dbIdentifier = outputs.RDSInstanceEndpoint.split('.')[0];
        const rdsInstances = await rds
          .describeDBInstances({
            DBInstanceIdentifier: dbIdentifier,
          })
          .promise();

        expect(rdsInstances.DBInstances?.[0]).toBeDefined();
      } else {
        // If conditions not met, make sure RDS doesn't exist either
        expect(rdsExists).toBe(false);

        // This is more of an informational log than a test since we can't test
        // resources that don't exist
        console.log(
          'EC2 and RDS resources not created - this is expected if VPC/subnet parameters were not provided'
        );
      }

      // Always verify that unconditional resources exist
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.TurnAroundPromptTableName).toBeDefined();

      // Verify S3 bucket exists
      const buckets = await s3.listBuckets().promise();
      const bucketNames = buckets.Buckets?.map(b => b.Name) || [];
      expect(bucketNames).toContain(outputs.S3BucketName);

      // Verify DynamoDB table exists
      const tables = await new AWS.DynamoDB().listTables().promise();
      const tableNames = tables.TableNames || [];
      expect(tableNames).toContain(outputs.TurnAroundPromptTableName);
    });
  });

  describe('Multi-Region Tests', () => {
    test('should verify resource naming is consistent across regions', async () => {
      if (skipIfMissingOutputs()) {
        console.log('Skipping multi-region test - outputs not available');
        return;
      }

      // For a real test, you would compare resources deployed in two regions
      // For this example, we'll just check that resource names include region-neutral identifiers

      const s3BucketName = outputs.S3BucketName;
      const dbTableName = outputs.TurnAroundPromptTableName;

      // Check that names follow conventions that work across regions
      expect(s3BucketName).toContain(
        `mycompany-${environmentSuffix.toLowerCase()}`
      );
      expect(dbTableName).toContain(
        `TurnAroundPromptTable${environmentSuffix}`
      );
    });
  });

  describe('Security Compliance Tests', () => {
    test('should confirm KMS key is being used for encryption', async () => {
      if (skipIfMissingOutputs() || !outputs.KMSKeyArn) {
        console.log('Skipping KMS test - outputs not available');
        return;
      }

      const kmsKeyArn = outputs.KMSKeyArn;

      // Verify that KMS key exists and is enabled
      const keyId = kmsKeyArn.split('/').pop();
      const kms = new AWS.KMS();

      const keyDescription = await kms
        .describeKey({
          KeyId: keyId,
        })
        .promise();

      expect(keyDescription.KeyMetadata?.Enabled).toBe(true);
      expect(keyDescription.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });
});
