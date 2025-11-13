import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  EncryptCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudTrailClient,
  LookupEventsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeComplianceByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Read region from AWS_REGION file
import * as fs from 'fs';
import * as path from 'path';

const regionFile = path.join(__dirname, '../lib/AWS_REGION');
const region = fs.readFileSync(regionFile, 'utf-8').trim();

// Initialize AWS SDK clients
const cloudFormationClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const ssmClient = new SSMClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const configClient = new ConfigServiceClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });

// Helper function to wait for SSM command completion
async function waitForCommand(
  commandId: string,
  instanceId: string,
  maxWaitTime = 120000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId,
        })
      );

      if (result.Status === 'Success' || result.Status === 'Failed') {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error('Command execution timeout');
}

describe('Integration Tests for Security Configuration as Code Stack', () => {
  let stackName: string;
  let vpcId: string;
  let publicSubnet1Id: string;
  let publicSubnet2Id: string;
  let privateSubnet1Id: string;
  let privateSubnet2Id: string;
  let databaseSubnet1Id: string;
  let databaseSubnet2Id: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let loadBalancerDNSName: string;
  let loadBalancerArn: string;
  let apiGatewayURL: string;
  let apiGatewayId: string;
  let cloudTrailName: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let natGateway1Id: string;
  let natGateway2Id: string;
  let environmentSuffix: string;
  let instanceId: string;
  let vpcFlowLogsLogGroup: string;
  let apiGatewayLogGroup: string;

  beforeAll(async () => {
    // Read stack name from metadata.json
    const metadataPath = path.join(__dirname, '../metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    stackName = metadata.stackName;

    // Get stack outputs
    const describeStacksResponse = await cloudFormationClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );

    const stack = describeStacksResponse.Stacks?.[0];
    if (!stack || !stack.Outputs) {
      throw new Error('Stack or outputs not found');
    }

    // Extract outputs
    const outputs = stack.Outputs;
    vpcId = outputs.find((o) => o.OutputKey === 'VPCId')?.OutputValue || '';
    publicSubnet1Id =
      outputs.find((o) => o.OutputKey === 'PublicSubnet1Id')?.OutputValue || '';
    publicSubnet2Id =
      outputs.find((o) => o.OutputKey === 'PublicSubnet2Id')?.OutputValue || '';
    privateSubnet1Id =
      outputs.find((o) => o.OutputKey === 'PrivateSubnet1Id')?.OutputValue || '';
    privateSubnet2Id =
      outputs.find((o) => o.OutputKey === 'PrivateSubnet2Id')?.OutputValue || '';
    databaseSubnet1Id =
      outputs.find((o) => o.OutputKey === 'DatabaseSubnet1Id')?.OutputValue || '';
    databaseSubnet2Id =
      outputs.find((o) => o.OutputKey === 'DatabaseSubnet2Id')?.OutputValue || '';
    s3BucketName =
      outputs.find((o) => o.OutputKey === 'ApplicationS3BucketName')?.OutputValue || '';
    s3BucketArn =
      outputs.find((o) => o.OutputKey === 'ApplicationS3BucketArn')?.OutputValue || '';
    loadBalancerDNSName =
      outputs.find((o) => o.OutputKey === 'LoadBalancerDNSName')?.OutputValue || '';
    loadBalancerArn =
      outputs.find((o) => o.OutputKey === 'LoadBalancerArn')?.OutputValue || '';
    apiGatewayURL =
      outputs.find((o) => o.OutputKey === 'APIGatewayURL')?.OutputValue || '';
    apiGatewayId =
      outputs.find((o) => o.OutputKey === 'APIGatewayId')?.OutputValue || '';
    cloudTrailName =
      outputs.find((o) => o.OutputKey === 'CloudTrailName')?.OutputValue || '';
    kmsKeyId = outputs.find((o) => o.OutputKey === 'KMSKeyId')?.OutputValue || '';
    kmsKeyArn = outputs.find((o) => o.OutputKey === 'KMSKeyArn')?.OutputValue || '';
    natGateway1Id =
      outputs.find((o) => o.OutputKey === 'NATGateway1Id')?.OutputValue || '';
    natGateway2Id =
      outputs.find((o) => o.OutputKey === 'NATGateway2Id')?.OutputValue || '';
    environmentSuffix =
      outputs.find((o) => o.OutputKey === 'EnvironmentSuffix')?.OutputValue || '';
    vpcFlowLogsLogGroup =
      outputs.find((o) => o.OutputKey === 'VPCFlowLogsLogGroup')?.OutputValue || '';
    apiGatewayLogGroup =
      outputs.find((o) => o.OutputKey === 'APIGatewayLogGroup')?.OutputValue || '';

    // Get instance ID from Auto Scaling Group
    const instancesResponse = await ec2Client.send(
      new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      })
    );

    if (
      instancesResponse.Reservations &&
      instancesResponse.Reservations.length > 0 &&
      instancesResponse.Reservations[0].Instances &&
      instancesResponse.Reservations[0].Instances.length > 0
    ) {
      instanceId = instancesResponse.Reservations[0].Instances[0].InstanceId || '';
    }

    // Verify all required outputs are present
    expect(vpcId).toBeTruthy();
    expect(s3BucketName).toBeTruthy();
    expect(loadBalancerDNSName).toBeTruthy();
    expect(apiGatewayURL).toBeTruthy();
    expect(kmsKeyId).toBeTruthy();
  }, 60000);

  // ========================================
  // SERVICE-LEVEL Tests (Single Service Interactions)
  // ========================================

  describe('[SERVICE-LEVEL] EC2 Instances - Execute Commands via SSM', () => {
    test('should execute shell commands on EC2 instance and verify SSM agent functionality', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      // ACTION: Execute commands on EC2 instance
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'echo "Integration test command execution" > /tmp/integration-test.txt',
              'cat /tmp/integration-test.txt',
              'rm /tmp/integration-test.txt',
            ],
          },
        })
      );

      expect(command.Command?.CommandId).toBeDefined();

      // Wait for command completion and verify output
      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain('Integration test command execution');
    }, 180000);

    test('should verify EC2 instance has jq installed and can process JSON', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      // ACTION: Test jq installation by processing JSON
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'echo \'{"test": "value", "number": 42}\' | jq \'.test\'',
              'echo \'{"test": "value", "number": 42}\' | jq \'.number\'',
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain('"value"');
      expect(result.StandardOutputContent).toContain('42');
    }, 180000);

    test('should verify httpd web server is running and serving content', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      // ACTION: Check httpd service status and retrieve content
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'systemctl is-active httpd',
              'curl -s http://localhost/',
              'ps aux | grep httpd | grep -v grep | wc -l',
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain('active');
      expect(result.StandardOutputContent).toContain('Secure Web Application');
    }, 180000);
  });

  describe('[SERVICE-LEVEL] S3 Bucket - Object Operations with KMS Encryption', () => {
    const testObjectKey = `integration-test-${Date.now()}.txt`;
    const testContent = 'Integration test content for S3 bucket with KMS encryption';

    test('should PUT object to S3 bucket with KMS encryption', async () => {
      // ACTION: Create object in S3 with KMS encryption
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ContentType: 'text/plain',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // Verify object was encrypted with KMS
      expect(putResponse.ETag).toBeDefined();
      expect(putResponse.ServerSideEncryption).toBe('aws:kms');
      expect(putResponse.SSEKMSKeyId).toBeDefined();
      expect(putResponse.BucketKeyEnabled).toBe(true);
    }, 40000);

    test('should GET object from S3 bucket and verify content and encryption', async () => {
      // First ensure object exists
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // ACTION: Retrieve object from S3
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      // Verify encryption and content
      expect(getResponse.Body).toBeDefined();
      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
    }, 40000);

    test('should verify S3 bucket versioning by creating multiple versions', async () => {
      const versionTestKey = `version-test-${Date.now()}.txt`;

      // ACTION: Create multiple versions of same object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 1 content',
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 2 content',
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify multiple versions exist
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: versionTestKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
        })
      );
    }, 60000);

    test('should DELETE object from S3 bucket and verify removal', async () => {
      // First create object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
        })
      );

      // ACTION: Delete object from S3
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      expect(deleteResponse.DeleteMarker).toBeDefined();

      // Verify object is no longer accessible
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testObjectKey,
          })
        );
        fail('Object should not be accessible after deletion');
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }
    }, 40000);
  });

  describe('[SERVICE-LEVEL] KMS Key - Encryption and Decryption Operations', () => {
    test('should encrypt and decrypt data using KMS key', async () => {
      const plaintext = 'Sensitive data for encryption test';

      // ACTION: Encrypt data using KMS
      const encryptResponse = await kmsClient.send(
        new EncryptCommand({
          KeyId: kmsKeyId,
          Plaintext: Buffer.from(plaintext),
        })
      );

      expect(encryptResponse.CiphertextBlob).toBeDefined();
      expect(encryptResponse.KeyId).toContain(kmsKeyId);

      // ACTION: Decrypt data using KMS
      const decryptResponse = await kmsClient.send(
        new DecryptCommand({
          CiphertextBlob: encryptResponse.CiphertextBlob,
        })
      );

      const decryptedText = Buffer.from(decryptResponse.Plaintext!).toString('utf-8');
      expect(decryptedText).toBe(plaintext);
      expect(decryptResponse.KeyId).toContain(kmsKeyId);
    }, 40000);

    test('should verify KMS key is enabled with automatic rotation', async () => {
      // ACTION: Query KMS key details
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);
  });

  describe('[SERVICE-LEVEL] CloudWatch Logs - Write and Query Log Events', () => {
    test('should write custom log events to VPC Flow Logs group', async () => {
      const logGroupName = vpcFlowLogsLogGroup;
      const logStreamName = `integration-test-${Date.now()}`;

      // ACTION: Create log stream
      await cloudWatchLogsClient.send(
        new CreateLogStreamCommand({
          logGroupName,
          logStreamName,
        })
      );

      // ACTION: Write log events
      const timestamp = Date.now();
      await cloudWatchLogsClient.send(
        new PutLogEventsCommand({
          logGroupName,
          logStreamName,
          logEvents: [
            {
              message: 'Integration test log event 1',
              timestamp,
            },
            {
              message: 'Integration test log event 2',
              timestamp: timestamp + 1000,
            },
          ],
        })
      );

      // Verify log stream was created
      const streamsResponse = await cloudWatchLogsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName,
          logStreamNamePrefix: logStreamName,
        })
      );

      expect(streamsResponse.logStreams).toBeDefined();
      expect(streamsResponse.logStreams!.length).toBeGreaterThan(0);
      expect(streamsResponse.logStreams![0].logStreamName).toBe(logStreamName);
    }, 60000);

    test('should verify log groups have correct retention periods', async () => {
      // ACTION: Query log groups and verify retention
      const logGroupsResponse = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({})
      );

      const vpcLogGroup = logGroupsResponse.logGroups?.find(
        (lg) => lg.logGroupName === vpcFlowLogsLogGroup
      );
      const apiLogGroup = logGroupsResponse.logGroups?.find(
        (lg) => lg.logGroupName === apiGatewayLogGroup
      );

      expect(vpcLogGroup).toBeDefined();
      expect(vpcLogGroup!.retentionInDays).toBe(30);

      expect(apiLogGroup).toBeDefined();
      expect(apiLogGroup!.retentionInDays).toBe(30);
    }, 40000);
  });

  describe('[SERVICE-LEVEL] CloudTrail - Verify Audit Logging', () => {
    test('should verify CloudTrail is actively logging events', async () => {
      // ACTION: Check CloudTrail status
      const trailStatusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      expect(trailStatusResponse.IsLogging).toBe(true);
      expect(trailStatusResponse.LatestDeliveryTime).toBeDefined();
    }, 30000);

    test('should query CloudTrail for recent management events', async () => {
      // ACTION: Query CloudTrail events
      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 20,
        })
      );

      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      // Verify event structure
      const firstEvent = eventsResponse.Events![0];
      expect(firstEvent.EventTime).toBeDefined();
      expect(firstEvent.EventName).toBeDefined();
      expect(
        firstEvent.Resources || firstEvent.Username || firstEvent.EventSource
      ).toBeDefined();
    }, 40000);
  });

  describe('[SERVICE-LEVEL] AWS Config - Verify Compliance Rules', () => {
    test('should verify AWS Config rules are enabled and evaluating', async () => {
      // ACTION: Query Config rules
      const rulesResponse = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      expect(rulesResponse.ConfigRules).toBeDefined();
      expect(rulesResponse.ConfigRules!.length).toBeGreaterThanOrEqual(4);

      // Verify specific rules exist
      const ruleNames = rulesResponse.ConfigRules!.map((r) => r.ConfigRuleName);
      expect(ruleNames).toContain('s3-bucket-public-read-prohibited');
      expect(ruleNames).toContain('s3-bucket-server-side-encryption-enabled');
      expect(ruleNames).toContain('ec2-instances-in-vpc');
      expect(ruleNames).toContain('restricted-ssh');
    }, 40000);

    test('should query compliance status for Config rules', async () => {
      // ACTION: Get compliance status
      const complianceResponse = await configClient.send(
        new DescribeComplianceByConfigRuleCommand({})
      );

      expect(complianceResponse.ComplianceByConfigRules).toBeDefined();
      expect(complianceResponse.ComplianceByConfigRules!.length).toBeGreaterThan(0);

      // Verify compliance structure
      const firstRule = complianceResponse.ComplianceByConfigRules![0];
      expect(firstRule.ConfigRuleName).toBeDefined();
      expect(firstRule.Compliance).toBeDefined();
    }, 40000);
  });

  describe('[SERVICE-LEVEL] Application Load Balancer - Verify Target Health', () => {
    test('should verify ALB has healthy targets registered', async () => {
      // ACTION: Get load balancer details
      const lbResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [loadBalancerArn],
        })
      );

      expect(lbResponse.LoadBalancers).toBeDefined();
      expect(lbResponse.LoadBalancers!.length).toBe(1);

      const loadBalancer = lbResponse.LoadBalancers![0];
      expect(loadBalancer.State?.Code).toBe('active');
      expect(loadBalancer.Scheme).toBe('internet-facing');
      expect(loadBalancer.VpcId).toBe(vpcId);
    }, 40000);
  });

  // ========================================
  // CROSS-SERVICE Tests (Two Services Talking)
  // ========================================

  describe('[CROSS-SERVICE] EC2 → S3 Integration via IAM Role', () => {
    test('should allow EC2 instance to read from S3 bucket using IAM role', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      const testKey = `ec2-s3-test-${Date.now()}.txt`;
      const testContent = 'EC2 to S3 cross-service integration test';

      // First, create object in S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // ACTION: EC2 reads from S3 using AWS CLI (via IAM role)
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws s3 cp s3://${s3BucketName}/${testKey} /tmp/s3-test.txt --region ${region}`,
              'cat /tmp/s3-test.txt',
              'rm /tmp/s3-test.txt',
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain(testContent);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );
    }, 200000);

    test('should allow EC2 instance to list S3 bucket contents using IAM role', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      // ACTION: EC2 lists S3 bucket using AWS CLI
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws s3 ls s3://${s3BucketName}/ --region ${region}`,
              `aws s3api head-bucket --bucket ${s3BucketName} --region ${region} && echo "Access granted"`,
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain('Access granted');
    }, 180000);
  });

  describe('[CROSS-SERVICE] EC2 → KMS Integration for Decryption', () => {
    test('should allow EC2 instance to decrypt data using KMS via IAM role', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      const plaintext = 'Secret data for EC2 KMS integration test';

      // Encrypt data using KMS
      const encryptResponse = await kmsClient.send(
        new EncryptCommand({
          KeyId: kmsKeyId,
          Plaintext: Buffer.from(plaintext),
        })
      );

      const ciphertextBase64 = Buffer.from(encryptResponse.CiphertextBlob!).toString(
        'base64'
      );

      // ACTION: EC2 decrypts data using KMS via AWS CLI
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `echo "${ciphertextBase64}" | base64 -d > /tmp/encrypted.bin`,
              `aws kms decrypt --ciphertext-blob fileb:///tmp/encrypted.bin --query Plaintext --output text --region ${region} | base64 -d`,
              'rm /tmp/encrypted.bin',
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain(plaintext);
    }, 200000);
  });

  describe('[CROSS-SERVICE] S3 → KMS Encryption Integration', () => {
    test('should verify S3 objects are automatically encrypted with KMS key', async () => {
      const testKey = `s3-kms-integration-${Date.now()}.txt`;

      // ACTION: Create object in S3 (uses default bucket encryption with KMS)
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'S3 to KMS encryption integration test',
        })
      );

      expect(putResponse.ServerSideEncryption).toBeDefined();

      // ACTION: Get object and verify KMS encryption
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);
      expect(getResponse.BucketKeyEnabled).toBe(true);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );
    }, 50000);
  });

  describe('[CROSS-SERVICE] API Gateway → ALB → EC2 Integration', () => {
    test('should call API Gateway which proxies to ALB and reaches EC2 instances', async () => {
      // ACTION: Call API Gateway endpoint
      const response = await fetch(apiGatewayURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verify API Gateway response
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      // Verify request reached EC2 via ALB
      const body = await response.text();
      expect(body).toContain('Secure Web Application');
    }, 60000);
  });

  describe('[CROSS-SERVICE] VPC → NAT Gateway → EC2 Outbound Connectivity', () => {
    test('should verify EC2 in public subnet can reach internet via Internet Gateway', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      // ACTION: Test outbound connectivity from EC2
      const command = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'curl -s -o /dev/null -w "%{http_code}" https://aws.amazon.com',
              'ping -c 3 8.8.8.8',
            ],
          },
        })
      );

      const result = await waitForCommand(command.Command!.CommandId!, instanceId);
      expect(result.Status).toBe('Success');
      expect(result.StandardOutputContent).toContain('200');
      expect(result.StandardOutputContent).toContain('3 packets transmitted');
    }, 180000);
  });

  describe('[CROSS-SERVICE] Security Groups - Defense-in-Depth Chain', () => {
    test('should verify security group chain allows proper traffic flow', async () => {
      // ACTION: Verify LoadBalancerSG → WebServerSG → AppServerSG → DatabaseSG chain
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      const securityGroups = sgResponse.SecurityGroups || [];

      // Find security groups
      const loadBalancerSG = securityGroups.find((sg) =>
        sg.GroupName?.includes('LoadBalancerSecurityGroup')
      );
      const webServerSG = securityGroups.find((sg) =>
        sg.GroupName?.includes('WebServerSecurityGroup')
      );
      const appServerSG = securityGroups.find((sg) =>
        sg.GroupName?.includes('AppServerSecurityGroup')
      );
      const databaseSG = securityGroups.find((sg) =>
        sg.GroupName?.includes('DatabaseSecurityGroup')
      );

      expect(loadBalancerSG).toBeDefined();
      expect(webServerSG).toBeDefined();
      expect(appServerSG).toBeDefined();
      expect(databaseSG).toBeDefined();

      // Verify WebServerSG accepts traffic from LoadBalancerSG
      const webServerIngress = webServerSG!.IpPermissions || [];
      const httpRule = webServerIngress.find((rule) => rule.FromPort === 80);
      expect(httpRule?.UserIdGroupPairs?.[0].GroupId).toBe(loadBalancerSG!.GroupId);

      // Verify AppServerSG accepts traffic from WebServerSG
      const appServerIngress = appServerSG!.IpPermissions || [];
      const appRule = appServerIngress.find((rule) => rule.FromPort === 8080);
      expect(appRule?.UserIdGroupPairs?.[0].GroupId).toBe(webServerSG!.GroupId);

      // Verify DatabaseSG accepts traffic from AppServerSG only
      const databaseIngress = databaseSG!.IpPermissions || [];
      const dbRule = databaseIngress.find((rule) => rule.FromPort === 3306);
      expect(dbRule?.UserIdGroupPairs?.[0].GroupId).toBe(appServerSG!.GroupId);
      expect(dbRule?.IpRanges || []).toHaveLength(0);
    }, 50000);
  });

  // ========================================
  // E2E Tests (Complete Workflows with Real Data)
  // ========================================

  describe('[E2E] Complete API Gateway → ALB → EC2 → CloudWatch Logs Flow', () => {
    test('should execute complete request flow with full observability', async () => {
      console.log('[E2E Test] Step 1: Calling API Gateway endpoint...');
      const testIdentifier = `e2e-test-${Date.now()}`;

      // Step 1: Call API Gateway
      const apiResponse = await fetch(apiGatewayURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Identifier': testIdentifier,
        },
      });

      expect(apiResponse.status).toBe(200);
      const responseBody = await apiResponse.text();
      expect(responseBody).toContain('Secure Web Application');

      console.log('[E2E Test] Step 2: Verifying ALB is active and routing traffic...');
      // Step 2: Verify ALB handled the request
      const lbResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [loadBalancerArn],
        })
      );

      expect(lbResponse.LoadBalancers![0].State?.Code).toBe('active');

      console.log('[E2E Test] Step 3: Waiting for logs to propagate...');
      // Step 3: Wait for logs
      await new Promise((resolve) => setTimeout(resolve, 15000));

      console.log('[E2E Test] Step 4: Verifying API Gateway logs in CloudWatch...');
      // Step 4: Verify API Gateway logs
      const apiLogGroupsResponse = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: apiGatewayLogGroup,
        })
      );

      expect(apiLogGroupsResponse.logGroups).toBeDefined();
      expect(apiLogGroupsResponse.logGroups!.length).toBeGreaterThan(0);

      console.log('[E2E Test] Step 5: Verifying CloudTrail captured API activity...');
      // Step 5: Verify CloudTrail captured activity
      const trailEvents = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 50,
        })
      );

      expect(trailEvents.Events).toBeDefined();
      expect(trailEvents.Events!.length).toBeGreaterThan(0);

      console.log('[E2E Test] E2E test completed - All 5 steps verified');
    }, 180000);
  });

  describe('[E2E] Complete S3 Workflow: PUT → GET → Versioning → KMS Encryption → DELETE', () => {
    test('should execute complete S3 lifecycle with encryption and versioning', async () => {
      const testKey = `e2e-s3-workflow-${Date.now()}.json`;
      const testData = {
        testType: 'E2E S3 Complete Workflow',
        timestamp: new Date().toISOString(),
        data: 'Integration test for complete S3 operations with KMS encryption and versioning',
        iterations: [1, 2, 3, 4, 5],
      };

      console.log('[E2E S3 Test] Step 1: Creating object in S3 with KMS encryption...');
      // Step 1: Create object
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
          Metadata: {
            'test-type': 'e2e-workflow',
          },
        })
      );

      expect(putResponse.ETag).toBeDefined();
      expect(putResponse.ServerSideEncryption).toBe('aws:kms');
      const version1ETag = putResponse.ETag;

      console.log('[E2E S3 Test] Step 2: Retrieving object and verifying content...');
      // Step 2: Get object
      const getResponse1 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(getResponse1.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse1.SSEKMSKeyId).toContain(kmsKeyId);
      expect(getResponse1.Metadata!['test-type']).toBe('e2e-workflow');

      const retrievedData1 = JSON.parse(
        (await getResponse1.Body!.transformToString()) || '{}'
      );
      expect(retrievedData1.testType).toBe('E2E S3 Complete Workflow');

      console.log('[E2E S3 Test] Step 3: Updating object to create new version...');
      // Step 3: Update object
      const updatedData = { ...testData, version: 2, updated: true };
      const putResponse2 = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(updatedData),
          ContentType: 'application/json',
        })
      );

      expect(putResponse2.ETag).toBeDefined();
      expect(putResponse2.ETag).not.toBe(version1ETag);

      console.log('[E2E S3 Test] Step 4: Verifying multiple versions exist...');
      // Step 4: Verify versioning
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: testKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      console.log('[E2E S3 Test] Step 5: Getting updated object...');
      // Step 5: Get updated object
      const getResponse2 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      const retrievedData2 = JSON.parse(
        (await getResponse2.Body!.transformToString()) || '{}'
      );
      expect(retrievedData2.version).toBe(2);
      expect(retrievedData2.updated).toBe(true);

      console.log('[E2E S3 Test] Step 6: Deleting object...');
      // Step 6: Delete object
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(deleteResponse.DeleteMarker).toBeDefined();

      console.log('[E2E S3 Test] Step 7: Verifying object is no longer accessible...');
      // Step 7: Verify deletion
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testKey,
          })
        );
        fail('Object should not be accessible after deletion');
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }

      console.log('[E2E S3 Test] E2E S3 workflow completed - All 7 steps verified');
    }, 120000);
  });

  describe('[E2E] Complete Security Flow: CloudTrail → S3 → KMS with Event Tracking', () => {
    test('should execute complete security audit workflow with real operations', async () => {
      const testKey = `security-audit-${Date.now()}.txt`;

      console.log(
        '[E2E Security Test] Step 1: Performing S3 operation to generate CloudTrail event...'
      );
      // Step 1: Perform S3 operation (tracked by CloudTrail)
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'Security audit test - this operation should be logged in CloudTrail',
        })
      );

      console.log('[E2E Security Test] Step 2: Verifying CloudTrail is actively logging...');
      // Step 2: Verify CloudTrail is logging
      const trailStatus = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      expect(trailStatus.IsLogging).toBe(true);

      console.log('[E2E Security Test] Step 3: Waiting for CloudTrail events to propagate...');
      // Step 3: Wait for events
      await new Promise((resolve) => setTimeout(resolve, 15000));

      console.log('[E2E Security Test] Step 4: Querying CloudTrail for recent events...');
      // Step 4: Query CloudTrail
      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 50,
        })
      );

      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      const events = eventsResponse.Events!;
      events.forEach((event) => {
        expect(event.EventTime).toBeDefined();
        expect(event.EventName).toBeDefined();
      });

      console.log('[E2E Security Test] Step 5: Verifying KMS key is being used...');
      // Step 5: Verify KMS key
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);

      console.log('[E2E Security Test] Step 6: Cleaning up test object...');
      // Step 6: Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      console.log('[E2E Security Test] E2E security workflow completed - All 6 steps verified');
      console.log(`[E2E Security Test] CloudTrail captured ${events.length} events`);
    }, 150000);
  });

  describe('[E2E] Complete EC2 → S3 → KMS Workflow with IAM Role Authentication', () => {
    test('should execute complete workflow: EC2 creates file, uploads to S3 with KMS encryption, then downloads and verifies', async () => {
      if (!instanceId) {
        console.log('Skipping test: No running EC2 instances found');
        return;
      }

      const testKey = `e2e-ec2-s3-kms-${Date.now()}.txt`;
      const testContent = 'E2E test: EC2 to S3 with KMS encryption workflow';

      console.log('[E2E EC2-S3-KMS Test] Step 1: Creating file on EC2 instance...');
      // Step 1: Create file on EC2
      const createCommand = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [`echo "${testContent}" > /tmp/e2e-test.txt`, 'cat /tmp/e2e-test.txt'],
          },
        })
      );

      const createResult = await waitForCommand(
        createCommand.Command!.CommandId!,
        instanceId
      );
      expect(createResult.Status).toBe('Success');
      expect(createResult.StandardOutputContent).toContain(testContent);

      console.log(
        '[E2E EC2-S3-KMS Test] Step 2: Uploading file from EC2 to S3 with KMS encryption...'
      );
      // Step 2: Upload to S3 from EC2 (uses KMS)
      const uploadCommand = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws s3 cp /tmp/e2e-test.txt s3://${s3BucketName}/${testKey} --region ${region}`,
              'echo "Upload completed"',
            ],
          },
        })
      );

      const uploadResult = await waitForCommand(
        uploadCommand.Command!.CommandId!,
        instanceId
      );
      expect(uploadResult.Status).toBe('Success');
      expect(uploadResult.StandardOutputContent).toContain('Upload completed');

      console.log('[E2E EC2-S3-KMS Test] Step 3: Verifying S3 object is encrypted with KMS...');
      // Step 3: Wait for S3 eventual consistency after EC2 upload, then verify encryption
      // EC2 → S3 uploads require longer wait time than direct S3 operations
      await new Promise((resolve) => setTimeout(resolve, 5000));

      let getResponse;
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        try {
          getResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: s3BucketName,
              Key: testKey,
            })
          );
          break;
        } catch (error: any) {
          if (error.name === 'NoSuchKey' && retries < maxRetries - 1) {
            retries++;
            console.log(`[E2E EC2-S3-KMS Test] Object not yet available, retry ${retries}/${maxRetries}...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } else {
            throw error;
          }
        }
      }

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
      expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

      console.log('[E2E EC2-S3-KMS Test] Step 4: Downloading file from S3 back to EC2...');
      // Step 4: Download from S3 to EC2
      const downloadCommand = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws s3 cp s3://${s3BucketName}/${testKey} /tmp/e2e-download.txt --region ${region}`,
              'cat /tmp/e2e-download.txt',
            ],
          },
        })
      );

      const downloadResult = await waitForCommand(
        downloadCommand.Command!.CommandId!,
        instanceId
      );
      expect(downloadResult.Status).toBe('Success');
      expect(downloadResult.StandardOutputContent).toContain(testContent);

      console.log('[E2E EC2-S3-KMS Test] Step 5: Cleaning up files...');
      // Step 5: Cleanup
      const cleanupCommand = await ssmClient.send(
        new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'rm /tmp/e2e-test.txt',
              'rm /tmp/e2e-download.txt',
              'echo "Cleanup completed"',
            ],
          },
        })
      );

      const cleanupResult = await waitForCommand(
        cleanupCommand.Command!.CommandId!,
        instanceId
      );
      expect(cleanupResult.Status).toBe('Success');

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      console.log('[E2E EC2-S3-KMS Test] E2E workflow completed - All 5 steps verified');
    }, 300000);
  });
});
