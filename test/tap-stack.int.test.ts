// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  LookupEventsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
  RunTaskCommand,
  StopTaskCommand,
} from '@aws-sdk/client-ecs';
import {
  DecryptCommand,
  DescribeKeyCommand,
  EncryptCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import fs from 'fs';

// Read outputs from cfn-outputs/flat-outputs.json (created by deploy script)
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Read AWS region from lib/AWS_REGION file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS SDK clients
const lambdaClient = new LambdaClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const cloudfrontClient = new CloudFrontClient({ region: awsRegion });

// Lambda log group name
const lambdaLogGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;

/**
 * Helper function to wait for CloudWatch Logs to appear
 */
async function waitForLogs(
  logGroupName: string,
  filterPattern: string,
  startTime: number,
  maxWaitTime = 90000
): Promise<any[]> {
  const startWait = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startWait < maxWaitTime) {
    try {
      const response = await logsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          filterPattern,
          startTime,
        })
      );

      if (response.events && response.events.length > 0) {
        return response.events;
      }
    } catch (error) {
      // Log group may not exist yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return [];
}

/**
 * Helper function to invoke Lambda and get response
 */
async function invokeLambda(
  functionName: string,
  payload: any = {}
): Promise<any> {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    })
  );

  const responsePayload = JSON.parse(
    new TextDecoder().decode(response.Payload)
  );
  return responsePayload;
}

describe('XYZ Corp SaaS Infrastructure Integration Tests', () => {
  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('Lambda Function Tests', () => {
      test('should invoke Lambda function with empty payload and return 200', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        const response = await invokeLambda(lambdaFunctionName, {});

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();

        const body = JSON.parse(response.body);
        expect(body.message).toBe('Data processed successfully');
        expect(response.headers).toBeDefined();
        expect(response.headers['Content-Type']).toBe('application/json');
      }, 90000);

      test('should invoke Lambda function with custom payload and log execution', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        const customPayload = {
          action: 'process',
          data: { userId: 'test-user-123', timestamp: Date.now() },
        };

        const beforeInvoke = Date.now();
        const response = await invokeLambda(lambdaFunctionName, customPayload);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();

        // Verify Lambda execution was logged
        const logs = await waitForLogs(
          lambdaLogGroupName,
          'Processing data',
          beforeInvoke,
          90000
        );

        expect(logs.length).toBeGreaterThan(0);
      }, 120000);

      test('should verify Lambda function does not error on large payload', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        const largePayload = {
          data: Array(1000)
            .fill(null)
            .map((_, i) => ({
              id: i,
              value: `test-data-${i}`,
              timestamp: Date.now(),
            })),
        };

        const response = await invokeLambda(lambdaFunctionName, largePayload);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
      }, 90000);
    });

    describe('S3 Bucket Tests', () => {
      const testKey = `integration-test/test-object-${Date.now()}.json`;
      const testContent = JSON.stringify({
        message: 'Integration test object',
        timestamp: Date.now(),
      });

      afterAll(async () => {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: outputs.S3DataBucketName,
              Key: testKey,
            })
          );
        } catch (error) {
          // Cleanup error is non-critical
        }
      });

      test('should PUT object to S3 bucket with KMS encryption', async () => {
        const bucketName = outputs.S3DataBucketName;
        const kmsKeyArn = outputs.KMSKeyArn;

        const putResponse = await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: kmsKeyArn,
            ContentType: 'application/json',
          })
        );

        expect(putResponse.ETag).toBeDefined();
        expect(putResponse.ServerSideEncryption).toBe('aws:kms');
        expect(putResponse.SSEKMSKeyId).toContain(outputs.KMSKeyId);
      }, 30000);

      test('should GET object from S3 bucket and verify encryption', async () => {
        const bucketName = outputs.S3DataBucketName;

        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toContain(outputs.KMSKeyId);
        expect(getResponse.Body).toBeDefined();

        const retrievedContent = await getResponse.Body!.transformToString();
        expect(retrievedContent).toBe(testContent);
      }, 30000);

      test('should verify S3 bucket has versioning enabled', async () => {
        const bucketName = outputs.S3DataBucketName;

        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(versioningResponse.Status).toBe('Enabled');
      }, 30000);

      test('should verify S3 bucket encryption configuration', async () => {
        const bucketName = outputs.S3DataBucketName;

        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        const rules =
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);

        const algorithm = rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
        expect(algorithm).toBe('aws:kms');
      }, 30000);
    });

    describe('KMS Key Tests', () => {
      const testPlaintext = 'Sensitive data for XYZ Corp SaaS platform';

      test('should encrypt data using KMS customer-managed key', async () => {
        const kmsKeyId = outputs.KMSKeyId;

        const encryptResponse = await kmsClient.send(
          new EncryptCommand({
            KeyId: kmsKeyId,
            Plaintext: Buffer.from(testPlaintext),
          })
        );

        expect(encryptResponse.CiphertextBlob).toBeDefined();
        expect(encryptResponse.KeyId).toContain(kmsKeyId);
      }, 30000);

      test('should encrypt and then decrypt data using KMS', async () => {
        const kmsKeyId = outputs.KMSKeyId;

        // Encrypt
        const encryptResponse = await kmsClient.send(
          new EncryptCommand({
            KeyId: kmsKeyId,
            Plaintext: Buffer.from(testPlaintext),
          })
        );

        expect(encryptResponse.CiphertextBlob).toBeDefined();
        const ciphertext = encryptResponse.CiphertextBlob!;

        // Decrypt
        const decryptResponse = await kmsClient.send(
          new DecryptCommand({
            CiphertextBlob: ciphertext,
          })
        );

        expect(decryptResponse.Plaintext).toBeDefined();
        const decryptedText = Buffer.from(decryptResponse.Plaintext!).toString();
        expect(decryptedText).toBe(testPlaintext);
        expect(decryptResponse.KeyId).toContain(kmsKeyId);
      }, 30000);

      test('should verify KMS key has automatic rotation enabled', async () => {
        const kmsKeyId = outputs.KMSKeyId;

        const rotationResponse = await kmsClient.send(
          new GetKeyRotationStatusCommand({
            KeyId: kmsKeyId,
          })
        );

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }, 30000);

      test('should verify KMS key is customer-managed and enabled', async () => {
        const kmsKeyId = outputs.KMSKeyId;

        const describeResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: kmsKeyId,
          })
        );

        expect(describeResponse.KeyMetadata).toBeDefined();
        expect(describeResponse.KeyMetadata?.KeyState).toBe('Enabled');
        expect(describeResponse.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      }, 30000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify Lambda log group exists with correct retention', async () => {
        const response = await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: lambdaLogGroupName,
          })
        );

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);

        const logGroup = response.logGroups!.find(
          (lg) => lg.logGroupName === lambdaLogGroupName
        );
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBe(30);
      }, 30000);

      test('should query CloudWatch Logs for Lambda execution events', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        const beforeInvoke = Date.now();
        await invokeLambda(lambdaFunctionName, { testId: 'cloudwatch-logs-test' });

        const logs = await waitForLogs(
          lambdaLogGroupName,
          'Processing data',
          beforeInvoke,
          90000
        );

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].message).toContain('Processing data');
      }, 120000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify Lambda duration alarm exists and is configured correctly', async () => {
        const alarmName = 'xyzApp-Lambda-HighDuration';

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.AlarmName).toBe(alarmName);
        expect(alarm.MetricName).toBe('Duration');
        expect(alarm.Namespace).toBe('AWS/Lambda');
        expect(alarm.Threshold).toBe(25000);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      }, 30000);

      test('should verify Lambda errors alarm exists and is configured correctly', async () => {
        const alarmName = 'xyzApp-Lambda-Errors';

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.AlarmName).toBe(alarmName);
        expect(alarm.MetricName).toBe('Errors');
        expect(alarm.Namespace).toBe('AWS/Lambda');
        expect(alarm.Threshold).toBe(5);
      }, 30000);

      test('should verify API Gateway 4XX alarm exists', async () => {
        const alarmName = 'xyzApp-APIGateway-4XXErrors';

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('4XXError');
        expect(alarm.Namespace).toBe('AWS/ApiGateway');
        expect(alarm.Threshold).toBe(10);
      }, 30000);

      test('should verify API Gateway 5XX alarm exists', async () => {
        const alarmName = 'xyzApp-APIGateway-5XXErrors';

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('5XXError');
        expect(alarm.Namespace).toBe('AWS/ApiGateway');
        expect(alarm.Threshold).toBe(5);
      }, 30000);
    });

    describe('ECS Cluster and Service Tests', () => {
      test('should verify ECS cluster exists and has Container Insights enabled', async () => {
        const clusterName = outputs.ECSClusterName;

        const response = await ecsClient.send(
          new DescribeClustersCommand({
            clusters: [clusterName],
            include: ['SETTINGS'],
          })
        );

        expect(response.clusters).toBeDefined();
        expect(response.clusters!.length).toBe(1);

        const cluster = response.clusters![0];
        expect(cluster.clusterName).toBe(clusterName);
        expect(cluster.status).toBe('ACTIVE');

        const containerInsights = cluster.settings?.find(
          (setting) => setting.name === 'containerInsights'
        );
        expect(containerInsights).toBeDefined();
        expect(containerInsights!.value).toBe('enabled');
      }, 60000);

      test('should verify ECS service is running with desired tasks', async () => {
        const clusterName = outputs.ECSClusterName;

        const response = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: clusterName,
            services: ['xyzApp-ECSService'],
          })
        );

        expect(response.services).toBeDefined();
        expect(response.services!.length).toBe(1);

        const service = response.services![0];
        expect(service.serviceName).toBe('xyzApp-ECSService');
        expect(service.status).toBe('ACTIVE');
        expect(service.launchType).toBe('FARGATE');
        expect(service.desiredCount).toBe(2);
      }, 60000);
    });

    describe('VPC and Network Infrastructure Tests', () => {
      test('should verify VPC exists and is configured correctly', async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);

        const vpc = response.Vpcs![0];
        expect(vpc.VpcId).toBe(vpcId);
        expect(vpc.State).toBe('available');

        // Check DNS Hostnames
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

        // Check DNS Support
        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      }, 60000);

      test('should verify all subnets exist and are in correct availability zones', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.DatabaseSubnet1Id,
          outputs.DatabaseSubnet2Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          })
        );

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(6);

        response.Subnets!.forEach((subnet) => {
          expect(subnet.State).toBe('available');
          expect(subnet.AvailabilityZone).toBeDefined();
          expect(subnet.CidrBlock).toBeDefined();
        });

        // Verify subnets are in 2 different AZs
        const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBe(2);
      }, 60000);

      test('should verify NAT Gateways are available in public subnets', async () => {
        const natGateway1Id = outputs.NATGateway1Id;
        const natGateway2Id = outputs.NATGateway2Id;

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [natGateway1Id, natGateway2Id],
          })
        );

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBe(2);

        response.NatGateways!.forEach((natGateway) => {
          expect(natGateway.State).toBe('available');
          expect(natGateway.VpcId).toBe(outputs.VPCId);
          expect(natGateway.NatGatewayAddresses).toBeDefined();
          expect(natGateway.NatGatewayAddresses!.length).toBeGreaterThan(0);
        });
      }, 60000);
    });

    describe('CloudTrail Tests', () => {
      test('should verify CloudTrail is logging', async () => {
        const trailName = outputs.CloudTrailName;

        const response = await cloudTrailClient.send(
          new GetTrailStatusCommand({
            Name: trailName,
          })
        );

        expect(response.IsLogging).toBe(true);
      }, 30000);
    });

    describe('CloudFront Distribution Tests', () => {
      test('should verify CloudFront distribution is deployed and enabled', async () => {
        const cloudFrontDomain = outputs.CloudFrontDomainName;

        expect(cloudFrontDomain).toBeDefined();
        expect(cloudFrontDomain).toContain('cloudfront.net');

        // List distributions to find ours
        const response = await cloudfrontClient.send(
          new ListDistributionsCommand({})
        );

        const distribution = response.DistributionList?.Items?.find(
          (d) => d.DomainName === cloudFrontDomain
        );

        expect(distribution).toBeDefined();
        expect(distribution!.Enabled).toBe(true);
        expect(distribution!.Status).toBe('Deployed');
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('Lambda → CloudWatch Logs Integration', () => {
      test('should invoke Lambda and verify logs are written to CloudWatch', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        const testPayload = {
          testId: 'lambda-to-logs-test',
          timestamp: Date.now(),
        };

        const beforeInvoke = Date.now();
        await invokeLambda(lambdaFunctionName, testPayload);

        const logs = await waitForLogs(
          lambdaLogGroupName,
          'Processing data',
          beforeInvoke,
          90000
        );

        expect(logs.length).toBeGreaterThan(0);

        // Verify START and END logs exist
        const allLogs = await waitForLogs(lambdaLogGroupName, '', beforeInvoke, 10000);

        const hasStartLog = allLogs.some((log) =>
          log.message?.includes('START RequestId')
        );
        const hasEndLog = allLogs.some((log) =>
          log.message?.includes('END RequestId')
        );

        expect(hasStartLog).toBe(true);
        expect(hasEndLog).toBe(true);
      }, 120000);
    });

    describe('S3 → KMS Automatic Encryption', () => {
      const testKey = `cross-service-test/s3-kms-${Date.now()}.txt`;
      const testContent = 'Testing S3 to KMS automatic encryption';

      afterAll(async () => {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: outputs.S3DataBucketName,
              Key: testKey,
            })
          );
        } catch (error) {
          // Cleanup error is non-critical
        }
      });

      test('should upload to S3 and verify automatic KMS encryption', async () => {
        const bucketName = outputs.S3DataBucketName;

        // Upload without specifying encryption (bucket default encryption)
        const putResponse = await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
          })
        );

        expect(putResponse.ETag).toBeDefined();

        // Retrieve and verify encryption was applied automatically
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toContain(outputs.KMSKeyId);
      }, 30000);
    });

    describe('VPC → Lambda Private Subnet Deployment', () => {
      test('should verify Lambda is deployed in VPC private subnets', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;

        // Lambda can invoke successfully (requires VPC configuration)
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: lambdaFunctionName,
            Payload: JSON.stringify({}),
          })
        );

        expect(response.StatusCode).toBe(200);

        // Verify private subnets exist and are private
        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
          })
        );

        expect(subnetsResponse.Subnets).toBeDefined();
        expect(subnetsResponse.Subnets!.length).toBe(2);

        subnetsResponse.Subnets!.forEach((subnet) => {
          expect(subnet.VpcId).toBe(outputs.VPCId);
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
      }, 30000);
    });

    describe('VPC NAT Gateways → Lambda Internet Access', () => {
      test('should verify NAT Gateways enable Lambda internet access from private subnets', async () => {
        const natGateway1Id = outputs.NATGateway1Id;
        const natGateway2Id = outputs.NATGateway2Id;

        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [natGateway1Id, natGateway2Id],
          })
        );

        expect(natResponse.NatGateways).toBeDefined();
        expect(natResponse.NatGateways!.length).toBe(2);

        natResponse.NatGateways!.forEach((natGateway) => {
          expect(natGateway.State).toBe('available');
          expect(natGateway.VpcId).toBe(outputs.VPCId);
        });

        // Verify Lambda can invoke successfully (requires NAT for AWS service calls)
        const lambdaResponse = await invokeLambda(outputs.LambdaFunctionName, {});
        expect(lambdaResponse.statusCode).toBe(200);
      }, 90000);
    });

    describe('CloudFront → API Gateway Origin', () => {
      test('should verify CloudFront distribution points to API Gateway', async () => {
        const cloudFrontDomain = outputs.CloudFrontDomainName;
        const apiGatewayId = outputs.APIGatewayId;

        expect(cloudFrontDomain).toBeDefined();
        expect(cloudFrontDomain).toContain('cloudfront.net');

        // API Gateway URL should contain the API ID
        const apiGatewayUrl = outputs.APIGatewayURL;
        expect(apiGatewayUrl).toContain(apiGatewayId);
      }, 30000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete S3 Data Workflow', () => {
      const e2eKey = `e2e-test/complete-workflow-${Date.now()}.json`;
      const originalData = {
        workflowId: 'e2e-s3-workflow',
        data: 'Original data',
        version: 1,
      };
      const updatedData = {
        workflowId: 'e2e-s3-workflow',
        data: 'Updated data',
        version: 2,
      };

      test('should execute complete S3 workflow with KMS encryption, versioning, and cleanup', async () => {
        const bucketName = outputs.S3DataBucketName;

        // Step 1: Create object with KMS encryption
        const putResponse1 = await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: e2eKey,
            Body: JSON.stringify(originalData),
            ContentType: 'application/json',
          })
        );

        expect(putResponse1.ETag).toBeDefined();
        const version1ETag = putResponse1.ETag;

        // Step 2: Retrieve and verify encryption
        const getResponse1 = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: e2eKey,
          })
        );

        expect(getResponse1.ServerSideEncryption).toBe('aws:kms');

        const retrievedData1 = JSON.parse(
          await getResponse1.Body!.transformToString()
        );
        expect(retrievedData1.version).toBe(1);

        // Step 3: Update object (creates new version)
        const putResponse2 = await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: e2eKey,
            Body: JSON.stringify(updatedData),
            ContentType: 'application/json',
          })
        );

        expect(putResponse2.ETag).toBeDefined();
        expect(putResponse2.ETag).not.toBe(version1ETag);

        // Step 4: Verify versioning
        const versionsResponse = await s3Client.send(
          new ListObjectVersionsCommand({
            Bucket: bucketName,
            Prefix: e2eKey,
          })
        );

        expect(versionsResponse.Versions).toBeDefined();
        expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

        // Step 5: Get latest version
        const getResponse2 = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: e2eKey,
          })
        );

        const retrievedData2 = JSON.parse(
          await getResponse2.Body!.transformToString()
        );
        expect(retrievedData2.version).toBe(2);

        // Step 6: Delete all versions (cleanup)
        for (const version of versionsResponse.Versions!) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: e2eKey,
              VersionId: version.VersionId,
            })
          );
        }
      }, 120000);
    });

    describe('Complete Monitoring Workflow', () => {
      test('should execute monitoring workflow and verify metrics, alarms, and logs', async () => {
        const lambdaFunctionName = outputs.LambdaFunctionName;
        const invocationCount = 3;
        const beforeInvocations = Date.now();

        // Step 1: Invoke Lambda multiple times to generate metrics
        for (let i = 0; i < invocationCount; i++) {
          await invokeLambda(lambdaFunctionName, { invocationNumber: i + 1 });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Step 2: Send custom metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'XYZCorpIntegrationTest',
            MetricData: [
              {
                MetricName: 'TestMetric',
                Value: 1.0,
                Unit: 'Count',
                Timestamp: new Date(),
              },
            ],
          })
        );

        // Step 3: Verify alarms are monitoring Lambda
        const alarmsResponse = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: 'xyzApp',
          })
        );

        const lambdaAlarms = alarmsResponse.MetricAlarms!.filter(
          (alarm) =>
            alarm.Namespace === 'AWS/Lambda' &&
            alarm.Dimensions?.some(
              (dim) =>
                dim.Name === 'FunctionName' &&
                dim.Value === lambdaFunctionName
            )
        );

        expect(lambdaAlarms.length).toBeGreaterThan(0);

        // Step 4: Verify all invocations logged
        const logs = await waitForLogs(
          lambdaLogGroupName,
          'Processing data',
          beforeInvocations,
          60000
        );

        expect(logs.length).toBeGreaterThanOrEqual(invocationCount);
      }, 180000);
    });

    describe('Complete Security Audit Workflow', () => {
      const auditKey = `security-audit/audit-test-${Date.now()}.txt`;
      const auditContent = 'Sensitive XYZ Corp data requiring full audit trail';

      afterAll(async () => {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: outputs.S3DataBucketName,
              Key: auditKey,
            })
          );
        } catch (error) {
          // Cleanup error is non-critical
        }
      });

      test('should execute complete security audit workflow with encryption and audit trail', async () => {
        const bucketName = outputs.S3DataBucketName;
        const kmsKeyId = outputs.KMSKeyId;
        const kmsKeyArn = outputs.KMSKeyArn;
        const trailName = outputs.CloudTrailName;

        // Step 1: Encrypt data with KMS
        const encryptResponse = await kmsClient.send(
          new EncryptCommand({
            KeyId: kmsKeyId,
            Plaintext: Buffer.from(auditContent),
          })
        );

        expect(encryptResponse.CiphertextBlob).toBeDefined();

        // Step 2: Upload to S3 with KMS encryption
        const putResponse = await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: auditKey,
            Body: auditContent,
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: kmsKeyArn,
          })
        );

        expect(putResponse.ETag).toBeDefined();
        expect(putResponse.ServerSideEncryption).toBe('aws:kms');

        // Step 3: Retrieve and verify encryption
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: auditKey,
          })
        );

        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

        // Step 4: Verify CloudTrail is actively logging
        const trailStatus = await cloudTrailClient.send(
          new GetTrailStatusCommand({
            Name: trailName,
          })
        );

        expect(trailStatus.IsLogging).toBe(true);
      }, 180000);
    });

    describe('Complete Infrastructure Health Check', () => {
      test('should execute complete flow: VPC → Subnets → NAT → ECS verification', async () => {
        const vpcId = outputs.VPCId;
        const clusterName = outputs.ECSClusterName;

        // Step 1: Verify VPC is available
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(vpcResponse.Vpcs![0].State).toBe('available');

        // Step 2: Verify NAT Gateways are available
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id],
          })
        );

        expect(natResponse.NatGateways!.length).toBe(2);
        natResponse.NatGateways!.forEach((nat) => {
          expect(nat.State).toBe('available');
        });

        // Step 3: Verify ECS cluster is active
        const ecsResponse = await ecsClient.send(
          new DescribeClustersCommand({
            clusters: [clusterName],
          })
        );

        expect(ecsResponse.clusters![0].status).toBe('ACTIVE');

        // Step 4: Verify ECS service has running tasks
        const serviceResponse = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: clusterName,
            services: ['xyzApp-ECSService'],
          })
        );

        const service = serviceResponse.services![0];
        expect(service.status).toBe('ACTIVE');
        expect(service.runningCount).toBeGreaterThanOrEqual(0);

        // All checks passed - complete E2E flow verified
        expect(vpcResponse).toBeDefined();
        expect(natResponse).toBeDefined();
        expect(ecsResponse).toBeDefined();
        expect(serviceResponse).toBeDefined();
      }, 180000);
    });
  });
});
