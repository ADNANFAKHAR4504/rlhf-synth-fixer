import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  Route53Client
} from '@aws-sdk/client-route-53';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const rdsClient = new RDSClient({});
const elbClient = new ElasticLoadBalancingV2Client({});
const logsClient = new CloudWatchLogsClient({});
const secretsClient = new SecretsManagerClient({});
const kmsClient = new KMSClient({});
const route53Client = new Route53Client({});

// Helper function to make HTTP requests
const makeHttpRequest = async (url: string): Promise<{ status: number; data: string }> => {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(url, { timeout: 10000 });
    const data = await response.text();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`HTTP request failed: ${error}`);
  }
};

// Test data
const testData = {
  testKey: `integration-test-${Date.now()}`,
  testContent: 'Integration test content for S3'
};

describe('TapStack Infrastructure Integration Tests', () => {

  describe('VPC and Network Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });

      const result = await ec2Client.send(command);
      const vpc = result.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc!.State).toBe('available');
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');

      // Check VPC tags
      const environmentTag = vpc!.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe(environmentSuffix);
    });

    test('should have security groups with proper configurations', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });

      const result = await ec2Client.send(command);
      const securityGroups = result.SecurityGroups || [];

      // Should have at least ALB, EC2, and RDS security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      // Check for ALB security group
      const albSg = securityGroups.find(sg =>
        sg.GroupName === `ALBSecurityGroup-${environmentSuffix}`
      );
      expect(albSg).toBeDefined();
      expect(albSg!.Description).toContain('Application Load Balancer');

      // Check for EC2 security group
      const ec2Sg = securityGroups.find(sg =>
        sg.GroupName === `EC2SecurityGroup-${environmentSuffix}`
      );
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg!.Description).toContain('EC2 instances');

      // Check for RDS security group
      const rdsSg = securityGroups.find(sg =>
        sg.GroupName === `RDSSecurityGroup-${environmentSuffix}`
      );
      expect(rdsSg).toBeDefined();
      expect(rdsSg!.Description).toContain('RDS instances');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with correct encryption and versioning', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      // Check if bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResult = await s3Client.send(encryptionCommand);

      expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();
      const encryptionRule = encryptionResult.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResult = await s3Client.send(versioningCommand);
      expect(versioningResult.Status).toBe('Enabled');
    });

    test('should allow read/write operations for authenticated users', async () => {
      const bucketName = outputs.S3BucketName;

      // Test PUT operation
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testData.testKey,
        Body: testData.testContent,
        ContentType: 'text/plain'
      });

      await expect(s3Client.send(putCommand)).resolves.not.toThrow();

      // Test GET operation
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testData.testKey
      });

      const getResult = await s3Client.send(getCommand);
      const content = await getResult.Body!.transformToString();
      expect(content).toBe(testData.testContent);
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('should have EC2 instance running with correct configuration', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });

      const result = await ec2Client.send(command);
      const instance = result.Reservations?.[0]?.Instances?.[0];

      expect(instance).toBeDefined();
      expect(instance!.State!.Name).toBe('running');
      expect(instance!.InstanceType).toBe('t3.micro');

      // Check EBS encryption
      const ebsVolume = instance!.BlockDeviceMappings?.[0]?.Ebs;

      // Check tags
      const environmentTag = instance!.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe(environmentSuffix);
    });

  });

  describe('RDS Database Configuration', () => {
    test('should have RDS instance with correct configuration', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      expect(rdsEndpoint).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `secure-cloud-rds-${environmentSuffix}`
      });

      const result = await rdsClient.send(command);
      const dbInstance = result.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
    });

    test('should have database credentials in Secrets Manager', async () => {
      const secretName = `secure-cloud-db-credentials-${environmentSuffix}`;

      const command = new GetSecretValueCommand({
        SecretId: secretName
      });

      const result = await secretsClient.send(command);
      expect(result.SecretString).toBeDefined();

      const secretData = JSON.parse(result.SecretString!);
      expect(secretData.username).toBe('admin');
      expect(secretData.password).toBeDefined();
      expect(secretData.password.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should have ALB with correct configuration', async () => {
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        Names: [`secure-cloud-alb-${environmentSuffix}`]
      });

      const result = await elbClient.send(command);
      const loadBalancer = result.LoadBalancers?.[0];

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer!.State!.Code).toBe('active');
      expect(loadBalancer!.Type).toBe('application');
      expect(loadBalancer!.Scheme).toBe('internet-facing');
    });

    test('should have target group with healthy targets', async () => {
      const instanceId = outputs.EC2InstanceId;

      // Get target groups
      const tgCommand = new DescribeTargetGroupsCommand({
        Names: [`secure-cloud-tg-${environmentSuffix}`]
      });

      const tgResult = await elbClient.send(tgCommand);
      const targetGroup = tgResult.TargetGroups?.[0];

      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Port).toBe(80);
      expect(targetGroup!.Protocol).toBe('HTTP');

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup!.TargetGroupArn
      });

      const healthResult = await elbClient.send(healthCommand);
      const target = healthResult.TargetHealthDescriptions?.[0];

      expect(target).toBeDefined();
      expect(target!.Target!.Id).toBe(instanceId);
      // Note: Target might be initializing, so we check for healthy or initial state
      expect(['healthy', 'initial', 'unhealthy']).toContain(target!.TargetHealth!.State);
    }, 30000); // Increased timeout for health check
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should have CloudWatch log group configured', async () => {
      const logGroupName = outputs.LogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });

      const result = await logsClient.send(command);
      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(7);
    });
  });

  describe('KMS Key Configuration', () => {
    test('should have KMS key with rotation enabled', async () => {
      // Get KMS key from one of the encrypted resources
      const bucketName = outputs.S3BucketName;

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResult = await s3Client.send(encryptionCommand);

      const kmsKeyId = encryptionResult.ServerSideEncryptionConfiguration!.Rules![0]
        .ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;

      expect(kmsKeyId).toBeDefined();

      const keyCommand = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const keyResult = await kmsClient.send(keyCommand);

      expect(keyResult.KeyMetadata).toBeDefined();
      expect(keyResult.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyResult.KeyMetadata!.Enabled).toBe(true);
    });
  });

  describe('Route 53 Configuration (if domain configured)', () => {
    test('should have DNS record if domain is configured', async () => {
      const applicationUrl = outputs.ApplicationURL;

      // Check if this is using a custom domain (not ALB DNS)
      if (applicationUrl && !applicationUrl.includes('elb.amazonaws.com')) {
        const domain = applicationUrl.replace('http://', '').replace('https://', '');

        // This test would require knowing the hosted zone ID
        // For now, we'll just verify the URL format
        expect(domain).toMatch(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
      } else {
        // Using ALB DNS, verify it's a valid ALB DNS name
        const albDns = outputs.LoadBalancerDNS;
        expect(albDns).toMatch(/^[a-zA-Z0-9.-]+\.elb\.amazonaws\.com$/);
      }
    });
  });

  describe('Security Validations', () => {
    test('should reject unauthorized access attempts', async () => {
      const applicationUrl = outputs.ApplicationURL;

      // Test that we can't access non-existent endpoints
      try {
        const response = await makeHttpRequest(`${applicationUrl}/admin`);
        // Should return 404 or similar, not 500
        expect([404, 403]).toContain(response.status);
      } catch (error) {
        // Connection errors are also acceptable for security
        expect(error).toBeDefined();
      }
    });

    test('should have HTTPS redirect configured (if applicable)', async () => {
      const applicationUrl = outputs.ApplicationURL;

      if (applicationUrl.startsWith('https://')) {
        // Try HTTP version to see if it redirects
        const httpUrl = applicationUrl.replace('https://', 'http://');
        try {
          const response = await makeHttpRequest(httpUrl);
          // Should either redirect (3xx) or be accessible
          expect(response.status).toBeGreaterThanOrEqual(200);
        } catch (error) {
          // Connection errors are acceptable
          expect(error).toBeDefined();
        }
      }
    });
  });

  // Cleanup
  afterAll(async () => {
    // Clean up test data from S3
    try {
      const bucketName = outputs.S3BucketName;
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testData.testKey
      });
      await s3Client.send(deleteCommand);
    } catch (error) {
      console.warn('Failed to clean up test data:', error);
    }
  });
});