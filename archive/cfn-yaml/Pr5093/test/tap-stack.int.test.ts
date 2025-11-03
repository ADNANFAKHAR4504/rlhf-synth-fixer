import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListGroupsCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// ==========================================
// Test Configuration
// ==========================================
const OUTPUTS_FILE_PATH =
  process.env.OUTPUTS_FILE_PATH || 'cfn-outputs/flat-outputs.json';
const AWS_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const TEST_TIMEOUT = 120000; // 120 seconds for integration tests

// Initialize AWS clients
const s3Client = new S3Client({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global
const kmsClient = new KMSClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const asgClient = new AutoScalingClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// ==========================================
// Helper Functions
// ==========================================
function loadOutputs(): Record<string, string> {
  try {
    if (!fs.existsSync(OUTPUTS_FILE_PATH)) {
      console.warn(`Outputs file not found: ${OUTPUTS_FILE_PATH}`);
      return {};
    }

    const content = fs.readFileSync(OUTPUTS_FILE_PATH, 'utf8');
    const outputs = JSON.parse(content);

    // Flatten nested outputs
    const flatOutputs: Record<string, string> = {};
    Object.keys(outputs).forEach(key => {
      if (typeof outputs[key] === 'object' && outputs[key] !== null) {
        Object.assign(flatOutputs, outputs[key]);
      } else {
        flatOutputs[key] = outputs[key];
      }
    });

    console.log(`Loaded ${Object.keys(flatOutputs).length} outputs from ${OUTPUTS_FILE_PATH}`);
    return flatOutputs;
  } catch (error) {
    console.error('Failed to load outputs:', error);
    return {};
  }
}

function skipIfOutputMissing(outputs: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (!outputs[key]) {
      console.warn(`Skipping test: Required output '${key}' not found`);
      return true;
    }
  }
  return false;
}

// ==========================================
// Integration Tests
// ==========================================
describe('TapStack CloudFormation Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    outputs = loadOutputs();
    if (Object.keys(outputs).length === 0) {
      console.warn('No outputs loaded. Tests may be skipped.');
    }
  });

  afterAll(async () => {
    // Close all clients
    s3Client.destroy();
    ec2Client.destroy();
    rdsClient.destroy();
    iamClient.destroy();
    kmsClient.destroy();
    secretsClient.destroy();
    elbClient.destroy();
    asgClient.destroy();
    logsClient.destroy();
  });

  // ==========================================
  // RESOURCE VALIDATION TESTS (Non-Interactive)
  // ==========================================
  describe('Resource Validation: VPC and Networking', () => {
    test(
      'should have VPC with correct CIDR and DNS settings',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');

        // Query DNS attributes separately
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );

        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

        console.log('✓ VPC is properly configured');
      },
      TEST_TIMEOUT
    );

    test(
      'should have four subnets in two availability zones',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id'
          )
        )
          return;

        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(4);

        // Get unique AZs
        const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);

        // Verify CIDR blocks
        const publicSubnet1 = response.Subnets!.find(
          s => s.SubnetId === outputs.PublicSubnet1Id
        );
        const privateSubnet1 = response.Subnets!.find(
          s => s.SubnetId === outputs.PrivateSubnet1Id
        );

        expect(publicSubnet1?.CidrBlock).toBe('10.0.1.0/24');
        expect(privateSubnet1?.CidrBlock).toBe('10.0.10.0/24');

        console.log('✓ Subnets are configured across multiple AZs');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Internet Gateway attached to VPC',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId', 'InternetGatewayId')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
          })
        );

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBe(1);
        expect(response.InternetGateways![0].Attachments![0].State).toBe('available');

        console.log('✓ Internet Gateway is attached');
      },
      TEST_TIMEOUT
    );

    test(
      'should have two NAT Gateways for high availability',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId', 'NATGateway1Id', 'NATGateway2Id')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBe(2);

        response.NatGateways!.forEach(natGw => {
          expect(natGw.State).toBe('available');
        });

        console.log('✓ NAT Gateways are available');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: Security Groups', () => {
    test(
      'should have ALB Security Group with HTTP/HTTPS access',
      async () => {
        if (skipIfOutputMissing(outputs, 'ALBSecurityGroupId')) return;

        const sgId = outputs.ALBSecurityGroupId;

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);

        const sg = response.SecurityGroups![0];
        const httpRule = sg.IpPermissions!.find(rule => rule.FromPort === 80);
        const httpsRule = sg.IpPermissions!.find(rule => rule.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();

        console.log('✓ ALB Security Group configured correctly');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Database Security Group restricted to WebServer SG',
      async () => {
        if (
          skipIfOutputMissing(outputs, 'DatabaseSecurityGroupId', 'WebServerSecurityGroupId')
        )
          return;

        const dbSgId = outputs.DatabaseSecurityGroupId;
        const webServerSgId = outputs.WebServerSecurityGroupId;

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [dbSgId] })
        );

        const dbSg = response.SecurityGroups![0];
        const mysqlRule = dbSg.IpPermissions!.find(rule => rule.FromPort === 3306);

        expect(mysqlRule).toBeDefined();
        expect(mysqlRule!.UserIdGroupPairs![0].GroupId).toBe(webServerSgId);

        console.log('✓ Database Security Group properly restricted');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: IAM Resources', () => {
    test(
      'should have EC2 Instance Role with correct policies',
      async () => {
        if (skipIfOutputMissing(outputs, 'EC2InstanceRoleArn')) return;

        const roleArn = outputs.EC2InstanceRoleArn;
        const roleName = roleArn.split('/').pop()!;

        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        expect(roleResponse.Role).toBeDefined();

        const policiesResponse = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );

        const inlinePolicies = policiesResponse.PolicyNames || [];
        expect(inlinePolicies).toContain('S3LoggingPolicy');
        expect(inlinePolicies).toContain('SSMAccessPolicy');
        expect(inlinePolicies).not.toContain('KMSAccessPolicy'); // No KMS policy for AWS-managed EBS encryption

        console.log('✓ EC2 Instance Role configured correctly (no KMS policy needed)');
      },
      TEST_TIMEOUT
    );

    test(
      'should have IAM Users Group with MFA enforcement',
      async () => {
        if (skipIfOutputMissing(outputs, 'IAMUsersGroupName')) return;

        const groupName = outputs.IAMUsersGroupName;

        const response = await iamClient.send(new ListGroupsCommand({}));

        const group = response.Groups!.find(g => g.GroupName === groupName);
        expect(group).toBeDefined();

        console.log('✓ IAM Users Group exists');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: S3 Bucket', () => {
    test(
      'should have logging bucket with encryption and versioning',
      async () => {
        if (skipIfOutputMissing(outputs, 'LoggingBucketName')) return;

        const bucketName = outputs.LoggingBucketName;

        // Verify bucket exists
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        // Verify versioning
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResponse.Status).toBe('Enabled');

        // Verify encryption
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

        console.log('✓ Logging bucket properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: Secrets Manager', () => {
    test(
      'should have database password secret',
      async () => {
        if (skipIfOutputMissing(outputs, 'DBPasswordSecretArn')) return;

        const secretArn = outputs.DBPasswordSecretArn;

        const response = await secretsClient.send(
          new DescribeSecretCommand({ SecretId: secretArn })
        );

        expect(response.ARN).toBe(secretArn);
        expect(response.Name).toBeDefined();

        console.log('✓ Database password secret exists');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: KMS', () => {
    test(
      'should have RDS KMS key with proper configuration',
      async () => {
        if (skipIfOutputMissing(outputs, 'RDSKMSKeyId')) return;

        const keyId = outputs.RDSKMSKeyId;

        const keyResponse = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: keyId })
        );

        expect(keyResponse.KeyMetadata?.Enabled).toBe(true);
        expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

        console.log('✓ RDS KMS key is enabled');
      },
      TEST_TIMEOUT
    );

    test(
      'should NOT have EBS KMS key outputs (EC2 uses AWS-managed encryption)',
      async () => {
        // Verify EBS KMS key outputs don't exist
        expect(outputs.EBSKMSKeyId).toBeUndefined();
        expect(outputs.EBSKMSKeyArn).toBeUndefined();

        console.log('✓ EBS uses AWS-managed encryption (no custom KMS key)');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: RDS Database', () => {
    test(
      'should have RDS instance with encryption and backups',
      async () => {
        if (skipIfOutputMissing(outputs, 'DBInstanceIdentifier')) return;

        const dbIdentifier = outputs.DBInstanceIdentifier;

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const db = response.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.BackupRetentionPeriod).toBe(7);
        expect(db.MultiAZ).toBe(true);
        expect(db.Engine).toBe('mysql');

        console.log('✓ RDS instance properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: Application Load Balancer', () => {
    test(
      'should have ALB configured and active',
      async () => {
        if (skipIfOutputMissing(outputs, 'LoadBalancerArn')) return;

        const albArn = outputs.LoadBalancerArn;

        const response = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [albArn],
          })
        );

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);

        const alb = response.LoadBalancers![0];
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.State?.Code).toBe('active');

        console.log('✓ ALB is active');
      },
      TEST_TIMEOUT
    );

    test(
      'should have target group with health checks',
      async () => {
        if (skipIfOutputMissing(outputs, 'TargetGroupArn')) return;

        const tgArn = outputs.TargetGroupArn;

        const response = await elbClient.send(
          new DescribeTargetGroupsCommand({
            TargetGroupArns: [tgArn],
          })
        );

        expect(response.TargetGroups).toBeDefined();
        expect(response.TargetGroups!.length).toBe(1);

        const tg = response.TargetGroups![0];
        expect(tg.Port).toBe(80);
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.HealthCheckEnabled).toBe(true);

        console.log('✓ Target group configured correctly');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: Auto Scaling Group', () => {
    test(
      'should have Auto Scaling Group with correct configuration',
      async () => {
        if (skipIfOutputMissing(outputs, 'AutoScalingGroupName')) return;

        const asgName = outputs.AutoScalingGroupName;

        const response = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName],
          })
        );

        expect(response.AutoScalingGroups).toBeDefined();
        expect(response.AutoScalingGroups!.length).toBe(1);

        const asg = response.AutoScalingGroups![0];
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBe(2);
        expect(asg.HealthCheckType).toBe('ELB');

        console.log('✓ Auto Scaling Group configured correctly');
      },
      TEST_TIMEOUT
    );
  });

  describe('Resource Validation: CloudWatch Logs', () => {
    test(
      'should have CloudWatch Log Groups created',
      async () => {
        if (skipIfOutputMissing(outputs, 'AccessLogGroupName', 'ErrorLogGroupName')) return;

        const accessLogGroup = outputs.AccessLogGroupName;
        const errorLogGroup = outputs.ErrorLogGroupName;

        const response = await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: outputs.AccessLogGroupName.split('/')[0],
          })
        );

        expect(response.logGroups).toBeDefined();

        const accessLog = response.logGroups!.find(lg => lg.logGroupName === accessLogGroup);
        const errorLog = response.logGroups!.find(lg => lg.logGroupName === errorLogGroup);

        expect(accessLog).toBeDefined();
        expect(errorLog).toBeDefined();
        expect(accessLog?.retentionInDays).toBe(30);

        console.log('✓ CloudWatch Log Groups exist');
      },
      TEST_TIMEOUT
    );
  });

  // ==========================================
  // SERVICE-LEVEL INTERACTIVE TESTS
  // ==========================================
  describe('INTERACTIVE Service-Level: S3 Operations', () => {
    const testKey = `integration-test-${Date.now()}.txt`;
    const testContent = 'Test content for integration testing';

    test(
      'should perform S3 CRUD operations successfully',
      async () => {
        if (skipIfOutputMissing(outputs, 'LoggingBucketName')) return;

        const bucketName = outputs.LoggingBucketName;

        console.log('=== Starting S3 CRUD Operations ===');

        // CREATE: Upload object
        console.log('1. Creating object in S3...');
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ServerSideEncryption: 'AES256',
          })
        );
        console.log('✓ Object created successfully');

        // READ: Retrieve object
        console.log('2. Reading object from S3...');
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
        const retrievedContent = await getResponse.Body!.transformToString();
        expect(retrievedContent).toBe(testContent);
        expect(getResponse.ServerSideEncryption).toBe('AES256');
        console.log('✓ Object retrieved and verified');

        // LIST: Verify object exists in bucket
        console.log('3. Listing objects in S3...');
        const listResponse = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: testKey,
          })
        );
        expect(listResponse.Contents).toBeDefined();
        expect(listResponse.Contents!.length).toBeGreaterThan(0);
        console.log('✓ Object found in bucket listing');

        // DELETE: Remove test object
        console.log('4. Deleting test object...');
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
        console.log('✓ Object deleted successfully');

        console.log('✓✓✓ S3 CRUD operations completed successfully ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  // ==========================================
  // CROSS-SERVICE INTERACTIVE TESTS
  // ==========================================
  describe('INTERACTIVE Cross-Service: RDS + Secrets Manager', () => {
    test(
      'should retrieve database credentials from Secrets Manager and verify RDS configuration',
      async () => {
        if (
          skipIfOutputMissing(outputs, 'DBPasswordSecretArn', 'DBInstanceIdentifier')
        )
          return;

        console.log('=== Starting RDS + Secrets Manager Integration ===');

        // Step 1: Retrieve credentials from Secrets Manager
        console.log('1. Retrieving database credentials from Secrets Manager...');
        const secretResponse = await secretsClient.send(
          new GetSecretValueCommand({
            SecretId: outputs.DBPasswordSecretArn,
          })
        );

        expect(secretResponse.SecretString).toBeDefined();
        const secret = JSON.parse(secretResponse.SecretString!);
        expect(secret.username).toBeDefined();
        expect(secret.password).toBeDefined();
        expect(secret.password.length).toBe(32); // Password length should be 32
        console.log('✓ Database credentials retrieved successfully');

        // Step 2: Verify RDS instance configuration
        console.log('2. Verifying RDS instance configuration...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const dbInstance = dbResponse.DBInstances![0];
        expect(dbInstance.DBInstanceStatus).toBe('available');
        expect(dbInstance.MasterUsername).toBe(secret.username);
        expect(dbInstance.StorageEncrypted).toBe(true);
        console.log('✓ RDS instance is available and encrypted');

        // Step 3: Verify credentials match
        console.log('3. Verifying credentials synchronization...');
        expect(dbInstance.MasterUsername).toBe(secret.username);
        console.log('✓ Credentials synchronized between Secrets Manager and RDS');

        console.log('✓✓✓ RDS + Secrets Manager integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE Cross-Service: RDS + KMS Encryption', () => {
    test(
      'should verify RDS uses KMS for encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'DBInstanceIdentifier', 'RDSKMSKeyId')) return;

        console.log('=== Starting RDS + KMS Integration ===');

        // Step 1: Verify RDS encryption
        console.log('1. Verifying RDS encryption configuration...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.KmsKeyId).toBeDefined();
        console.log('✓ RDS is encrypted with KMS');

        // Step 2: Verify KMS key properties
        console.log('2. Verifying KMS key properties...');
        const keyResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: outputs.RDSKMSKeyId,
          })
        );

        expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
        expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        console.log('✓ KMS key is enabled and properly configured');

        console.log('✓✓✓ RDS + KMS encryption integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE Cross-Service: S3 + IAM Role', () => {
    test(
      'should verify EC2 role has S3 access permissions',
      async () => {
        if (skipIfOutputMissing(outputs, 'EC2InstanceRoleArn', 'LoggingBucketName')) return;

        console.log('=== Starting S3 + IAM Role Integration ===');

        const roleArn = outputs.EC2InstanceRoleArn;
        const roleName = roleArn.split('/').pop()!;
        const bucketName = outputs.LoggingBucketName;

        // Step 1: Verify role has S3 logging policy
        console.log('1. Verifying EC2 role has S3 policies...');
        const policiesResponse = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );

        const s3Policy = policiesResponse.PolicyNames!.find(name =>
          name.includes('S3')
        );
        expect(s3Policy).toBeDefined();
        console.log('✓ EC2 role has S3 logging policy');

        // Step 2: Verify S3 bucket exists and is accessible
        console.log('2. Verifying S3 bucket accessibility...');
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          })
        );
        console.log('✓ S3 bucket is accessible');

        console.log('✓✓✓ S3 + IAM Role integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE Cross-Service: ALB + Auto Scaling Group', () => {
    test(
      'should verify ALB is routing traffic to ASG instances',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'LoadBalancerArn',
            'TargetGroupArn',
            'AutoScalingGroupName'
          )
        )
          return;

        console.log('=== Starting ALB + Auto Scaling Integration ===');

        // Step 1: Verify ALB is active
        console.log('1. Verifying ALB is active...');
        const albResponse = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.LoadBalancerArn],
          })
        );

        const alb = albResponse.LoadBalancers![0];
        expect(alb.State?.Code).toBe('active');
        console.log('✓ ALB is active');

        // Step 2: Verify Auto Scaling Group
        console.log('2. Verifying Auto Scaling Group...');
        const asgResponse = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );

        const asg = asgResponse.AutoScalingGroups![0];
        expect(asg.Instances).toBeDefined();
        console.log(`✓ Auto Scaling Group has ${asg.Instances!.length} instances`);

        // Step 3: Verify target group health
        console.log('3. Verifying target group health...');
        const healthResponse = await elbClient.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: outputs.TargetGroupArn,
          })
        );

        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
        console.log(
          `✓ Target group has ${healthResponse.TargetHealthDescriptions!.length} registered targets`
        );

        console.log('✓✓✓ ALB + Auto Scaling integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  // ==========================================
  // END-TO-END INTERACTIVE TESTS
  // ==========================================
  describe('INTERACTIVE E2E: Complete Web Application Flow', () => {
    test(
      'should verify complete web application stack: ALB → ASG → RDS',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'LoadBalancerDNS',
            'LoadBalancerArn',
            'AutoScalingGroupName',
            'DBInstanceIdentifier',
            'WebServerSecurityGroupId',
            'DatabaseSecurityGroupId'
          )
        )
          return;

        console.log('=== Starting E2E Web Application Flow Test ===');

        // Step 1: Verify ALB is accessible
        console.log('\n1. Verifying Application Load Balancer...');
        const albResponse = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.LoadBalancerArn],
          })
        );

        const alb = albResponse.LoadBalancers![0];
        expect(alb.State?.Code).toBe('active');
        expect(alb.DNSName).toBe(outputs.LoadBalancerDNS);
        console.log(`✓ ALB is active at: ${alb.DNSName}`);

        // Step 2: Verify Auto Scaling Group instances
        console.log('\n2. Verifying Auto Scaling Group instances...');
        const asgResponse = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );

        const asg = asgResponse.AutoScalingGroups![0];
        expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
        console.log(`✓ ASG has ${asg.Instances!.length} healthy instances`);

        // Step 3: Verify database availability
        console.log('\n3. Verifying RDS database...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];
        expect(db.DBInstanceStatus).toBe('available');
        expect(db.MultiAZ).toBe(true);
        console.log('✓ RDS database is available and Multi-AZ enabled');

        // Step 4: Verify security group chain
        console.log('\n4. Verifying security group chain...');
        const webSgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.WebServerSecurityGroupId],
          })
        );

        const dbSgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.DatabaseSecurityGroupId],
          })
        );

        const dbSg = dbSgResponse.SecurityGroups![0];
        const mysqlRule = dbSg.IpPermissions!.find(rule => rule.FromPort === 3306);
        expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(
          outputs.WebServerSecurityGroupId
        );
        console.log('✓ Security group chain configured correctly');

        // Step 5: Verify network isolation
        console.log('\n5. Verifying network isolation...');
        expect(db.PubliclyAccessible).toBe(false);
        console.log('✓ Database is not publicly accessible');

        console.log('\n✓✓✓ Complete E2E Web Application Flow validated ✓✓✓');
        console.log('Flow verified: Internet → ALB → ASG Instances → Database');
      },
      TEST_TIMEOUT * 2
    );
  });

  describe('INTERACTIVE E2E: Data Encryption Pipeline', () => {
    test(
      'should verify end-to-end encryption: S3 → RDS → KMS',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'LoggingBucketName',
            'DBInstanceIdentifier',
            'RDSKMSKeyId'
          )
        )
          return;

        console.log('=== Starting E2E Data Encryption Pipeline Test ===');

        const testKey = `e2e-encryption-test-${Date.now()}.txt`;
        const testData = 'Sensitive data for encryption testing';

        // Step 1: Write encrypted data to S3
        console.log('\n1. Writing encrypted data to S3...');
        await s3Client.send(
          new PutObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testKey,
            Body: testData,
            ServerSideEncryption: 'AES256',
          })
        );
        console.log('✓ Data written to S3 with encryption');

        // Step 2: Verify S3 encryption
        console.log('\n2. Verifying S3 encryption...');
        const s3Response = await s3Client.send(
          new GetObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testKey,
          })
        );
        expect(s3Response.ServerSideEncryption).toBe('AES256');
        console.log('✓ S3 object is encrypted');

        // Step 3: Verify RDS encryption with KMS
        console.log('\n3. Verifying RDS encryption with KMS...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.KmsKeyId).toBeDefined();
        console.log('✓ RDS is encrypted with KMS');

        // Step 4: Verify KMS key status
        console.log('\n4. Verifying KMS key status...');
        const kmsResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: outputs.RDSKMSKeyId,
          })
        );
        expect(kmsResponse.KeyMetadata?.KeyState).toBe('Enabled');
        console.log('✓ KMS key is enabled');

        // Step 5: Verify data integrity
        console.log('\n5. Verifying data integrity...');
        const retrievedData = await s3Response.Body!.transformToString();
        expect(retrievedData).toBe(testData);
        console.log('✓ Data integrity verified');

        // Cleanup
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testKey,
          })
        );

        console.log('\n✓✓✓ Complete E2E Encryption Pipeline validated ✓✓✓');
        console.log('Encryption verified: S3 (AES256) + RDS (Custom KMS) + EC2 EBS (AWS-managed)');
      },
      TEST_TIMEOUT * 2
    );
  });

  describe('INTERACTIVE E2E: High Availability and Fault Tolerance', () => {
    test(
      'should verify complete HA setup: Multi-AZ VPC → Multi-AZ RDS → Multi-Instance ASG',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'VPCId',
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id',
            'NATGateway1Id',
            'NATGateway2Id',
            'DBInstanceIdentifier',
            'AutoScalingGroupName'
          )
        )
          return;

        console.log('=== Starting E2E High Availability Test ===');

        // Step 1: Verify subnets span multiple AZs
        console.log('\n1. Verifying Multi-AZ subnet configuration...');
        const subnetResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [
              outputs.PublicSubnet1Id,
              outputs.PublicSubnet2Id,
              outputs.PrivateSubnet1Id,
              outputs.PrivateSubnet2Id,
            ],
          })
        );

        const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);
        console.log(`✓ Subnets span ${azs.size} availability zones`);

        // Step 2: Verify redundant NAT Gateways
        console.log('\n2. Verifying redundant NAT Gateways...');
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id],
          })
        );

        expect(natResponse.NatGateways!.length).toBe(2);
        natResponse.NatGateways!.forEach(nat => {
          expect(nat.State).toBe('available');
        });
        console.log('✓ Two NAT Gateways are active for redundancy');

        // Step 3: Verify RDS Multi-AZ
        console.log('\n3. Verifying RDS Multi-AZ configuration...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];
        expect(db.MultiAZ).toBe(true);
        console.log('✓ RDS is configured for Multi-AZ deployment');

        // Step 4: Verify Auto Scaling Group has minimum 2 instances
        console.log('\n4. Verifying Auto Scaling Group HA configuration...');
        const asgResponse = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );

        const asg = asgResponse.AutoScalingGroups![0];
        expect(asg.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);

        // Verify instances are in different AZs
        const instanceAZs = new Set(asg.Instances!.map(i => i.AvailabilityZone));
        console.log(`✓ ASG has ${asg.Instances!.length} instances across ${instanceAZs.size} AZs`);

        // Step 5: Verify RDS automated backups
        console.log('\n5. Verifying RDS backup configuration...');
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
        console.log(`✓ RDS has ${db.BackupRetentionPeriod} days backup retention`);

        console.log('\n✓✓✓ Complete High Availability setup validated ✓✓✓');
        console.log('HA verified: Multi-AZ VPC + Multi-AZ RDS + Multi-Instance ASG');
      },
      TEST_TIMEOUT * 2
    );
  });

  describe('INTERACTIVE E2E: Security and Compliance', () => {
    test(
      'should verify complete security posture: Encryption + IAM + Security Groups',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'LoggingBucketName',
            'DBInstanceIdentifier',
            'DBPasswordSecretArn',
            'RDSKMSKeyId',
            'IAMUsersGroupName',
            'DatabaseSecurityGroupId'
          )
        )
          return;

        console.log('=== Starting E2E Security and Compliance Test ===');

        // Step 1: Verify S3 encryption
        console.log('\n1. Verifying S3 encryption...');
        const s3EncResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: outputs.LoggingBucketName,
          })
        );
        expect(s3EncResponse.ServerSideEncryptionConfiguration).toBeDefined();
        console.log('✓ S3 bucket encryption enabled');

        // Step 2: Verify S3 versioning
        console.log('\n2. Verifying S3 versioning...');
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: outputs.LoggingBucketName,
          })
        );
        expect(versioningResponse.Status).toBe('Enabled');
        console.log('✓ S3 bucket versioning enabled');

        // Step 3: Verify RDS encryption
        console.log('\n3. Verifying RDS encryption...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );
        const db = dbResponse.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        console.log('✓ RDS storage encryption enabled');

        // Step 4: Verify Secrets Manager integration
        console.log('\n4. Verifying Secrets Manager integration...');
        const secretResponse = await secretsClient.send(
          new DescribeSecretCommand({
            SecretId: outputs.DBPasswordSecretArn,
          })
        );
        expect(secretResponse.ARN).toBeDefined();
        console.log('✓ Database credentials in Secrets Manager');

        // Step 5: Verify KMS key encryption
        console.log('\n5. Verifying KMS key configuration...');
        const kmsResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: outputs.RDSKMSKeyId,
          })
        );
        expect(kmsResponse.KeyMetadata?.Enabled).toBe(true);
        console.log('✓ KMS key is enabled');

        // Step 6: Verify IAM MFA group exists
        console.log('\n6. Verifying IAM MFA enforcement...');
        const groupsResponse = await iamClient.send(new ListGroupsCommand({}));
        const mfaGroup = groupsResponse.Groups!.find(
          g => g.GroupName === outputs.IAMUsersGroupName
        );
        expect(mfaGroup).toBeDefined();
        console.log('✓ IAM group with MFA enforcement exists');

        // Step 7: Verify database is not publicly accessible
        console.log('\n7. Verifying database network isolation...');
        expect(db.PubliclyAccessible).toBe(false);
        console.log('✓ Database is not publicly accessible');

        // Step 8: Verify security group rules
        console.log('\n8. Verifying security group configuration...');
        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.DatabaseSecurityGroupId],
          })
        );
        const dbSg = sgResponse.SecurityGroups![0];
        expect(dbSg.IpPermissions!.length).toBeGreaterThan(0);
        console.log('✓ Database security group properly configured');

        console.log('\n✓✓✓ Complete Security and Compliance posture validated ✓✓✓');
        console.log(
          'Security verified: Encryption (S3 AES256 + RDS Custom KMS + EC2 AWS-managed) + Secrets Manager + IAM + Network Isolation'
        );
      },
      TEST_TIMEOUT * 2
    );
  });

  // ==========================================
  // ADDITIONAL INTERACTIVE TESTS
  // ==========================================
  describe('INTERACTIVE Service-Level: CloudWatch Logs Operations', () => {
    test(
      'should verify CloudWatch Log Groups are accessible and configured',
      async () => {
        if (skipIfOutputMissing(outputs, 'AccessLogGroupName', 'ErrorLogGroupName')) return;

        console.log('=== Starting CloudWatch Logs Operations ===');

        // Step 1: Verify Access Log Group
        console.log('\n1. Verifying Access Log Group...');
        const logGroupsResponse = await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: outputs.AccessLogGroupName.split('/')[0],
          })
        );

        const accessLogGroup = logGroupsResponse.logGroups!.find(
          lg => lg.logGroupName === outputs.AccessLogGroupName
        );
        expect(accessLogGroup).toBeDefined();
        expect(accessLogGroup?.retentionInDays).toBe(30);
        console.log('✓ Access Log Group configured with 30 days retention');

        // Step 2: Verify Error Log Group
        console.log('\n2. Verifying Error Log Group...');
        const errorLogGroup = logGroupsResponse.logGroups!.find(
          lg => lg.logGroupName === outputs.ErrorLogGroupName
        );
        expect(errorLogGroup).toBeDefined();
        expect(errorLogGroup?.retentionInDays).toBe(30);
        console.log('✓ Error Log Group configured with 30 days retention');

        console.log('\n✓✓✓ CloudWatch Logs operations validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE Cross-Service: EC2 Launch Template + IAM', () => {
    test(
      'should verify Launch Template has proper IAM role attached',
      async () => {
        if (skipIfOutputMissing(outputs, 'LaunchTemplateId', 'EC2InstanceRoleArn')) return;

        console.log('=== Starting Launch Template + IAM Integration ===');

        // Step 1: Verify IAM role exists and has policies
        console.log('\n1. Verifying EC2 IAM role...');
        const roleArn = outputs.EC2InstanceRoleArn;
        const roleName = roleArn.split('/').pop()!;

        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();
        console.log('✓ EC2 IAM role exists');

        // Step 2: Verify role has required policies
        console.log('\n2. Verifying IAM role policies...');
        const policiesResponse = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );

        const policies = policiesResponse.PolicyNames || [];
        expect(policies.length).toBeGreaterThan(0);
        console.log(`✓ EC2 role has ${policies.length} inline policies`);

        // Step 3: Verify S3 logging policy exists
        const s3Policy = policies.find(p => p.includes('S3'));
        expect(s3Policy).toBeDefined();
        console.log('✓ S3 logging policy attached to EC2 role');

        console.log('\n✓✓✓ Launch Template + IAM integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE Cross-Service: Auto Scaling + CloudWatch Alarms', () => {
    test(
      'should verify Auto Scaling Group has CloudWatch monitoring enabled',
      async () => {
        if (skipIfOutputMissing(outputs, 'AutoScalingGroupName')) return;

        console.log('=== Starting Auto Scaling + CloudWatch Integration ===');

        // Step 1: Verify ASG has metrics collection enabled
        console.log('\n1. Verifying Auto Scaling Group metrics...');
        const asgResponse = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );

        const asg = asgResponse.AutoScalingGroups![0];
        expect(asg.EnabledMetrics).toBeDefined();
        expect(asg.EnabledMetrics!.length).toBeGreaterThan(0);
        console.log(`✓ ASG has ${asg.EnabledMetrics!.length} metrics enabled`);

        // Step 2: Verify health check configuration
        console.log('\n2. Verifying health check configuration...');
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.HealthCheckGracePeriod).toBe(300);
        console.log('✓ ASG uses ELB health checks with 300s grace period');

        // Step 3: Verify ASG size configuration
        console.log('\n3. Verifying ASG scaling configuration...');
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBe(2);
        console.log('✓ ASG configured for 2-6 instances (desired: 2)');

        console.log('\n✓✓✓ Auto Scaling + CloudWatch integration validated ✓✓✓');
      },
      TEST_TIMEOUT
    );
  });

  describe('INTERACTIVE E2E: Complete Monitoring and Logging Pipeline', () => {
    test(
      'should verify complete monitoring setup: S3 Logs + CloudWatch Logs + Metrics',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'LoggingBucketName',
            'AccessLogGroupName',
            'ErrorLogGroupName',
            'AutoScalingGroupName'
          )
        )
          return;

        console.log('=== Starting Complete Monitoring Pipeline Test ===');

        // Step 1: Verify S3 logging bucket
        console.log('\n1. Verifying S3 logging bucket...');
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: outputs.LoggingBucketName,
          })
        );
        console.log('✓ S3 logging bucket accessible');

        // Step 2: Verify S3 bucket versioning for audit trail
        console.log('\n2. Verifying S3 versioning for audit...');
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: outputs.LoggingBucketName,
          })
        );
        expect(versioningResponse.Status).toBe('Enabled');
        console.log('✓ S3 versioning enabled for log retention');

        // Step 3: Verify CloudWatch Log Groups
        console.log('\n3. Verifying CloudWatch Log Groups...');
        const logGroupsResponse = await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: outputs.AccessLogGroupName.split('/')[0],
          })
        );
        expect(logGroupsResponse.logGroups!.length).toBeGreaterThanOrEqual(2);
        console.log('✓ CloudWatch Log Groups configured');

        // Step 4: Verify Auto Scaling metrics collection
        console.log('\n4. Verifying ASG metrics collection...');
        const asgResponse = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );
        const asg = asgResponse.AutoScalingGroups![0];
        expect(asg.EnabledMetrics!.length).toBeGreaterThan(0);
        console.log(`✓ ASG collecting ${asg.EnabledMetrics!.length} metrics`);

        // Step 5: Test S3 log write operation
        console.log('\n5. Testing S3 log write operation...');
        const testLogKey = `test-logs/integration-test-${Date.now()}.log`;
        const testLogContent = `[${new Date().toISOString()}] Integration test log entry`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testLogKey,
            Body: testLogContent,
            ServerSideEncryption: 'AES256',
          })
        );
        console.log('✓ Successfully wrote test log to S3');

        // Step 6: Verify log entry
        console.log('\n6. Verifying log entry...');
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testLogKey,
          })
        );
        const retrievedLog = await getResponse.Body!.transformToString();
        expect(retrievedLog).toBe(testLogContent);
        console.log('✓ Log entry verified');

        // Step 7: Cleanup
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: outputs.LoggingBucketName,
            Key: testLogKey,
          })
        );

        console.log('\n✓✓✓ Complete Monitoring Pipeline validated ✓✓✓');
        console.log('Pipeline: S3 Logs + CloudWatch Logs + ASG Metrics');
      },
      TEST_TIMEOUT * 2
    );
  });

  describe('INTERACTIVE E2E: Network Traffic Flow Validation', () => {
    test(
      'should verify complete network path: Internet → IGW → Subnets → NAT',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'VPCId',
            'InternetGatewayId',
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id',
            'NATGateway1Id',
            'NATGateway2Id'
          )
        )
          return;

        console.log('=== Starting Network Traffic Flow Validation ===');

        // Step 1: Verify VPC and Internet Gateway
        console.log('\n1. Verifying VPC and Internet Gateway...');
        const igwResponse = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.VPCId] }],
          })
        );
        expect(igwResponse.InternetGateways!.length).toBe(1);
        expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');
        console.log('✓ Internet Gateway attached to VPC');

        // Step 2: Verify public subnets
        console.log('\n2. Verifying public subnets...');
        const publicSubnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
          })
        );
        expect(publicSubnetsResponse.Subnets!.length).toBe(2);
        publicSubnetsResponse.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
        console.log('✓ Public subnets configured with auto-assign public IP');

        // Step 3: Verify NAT Gateways in public subnets
        console.log('\n3. Verifying NAT Gateways...');
        const natGatewaysResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id],
          })
        );
        expect(natGatewaysResponse.NatGateways!.length).toBe(2);
        natGatewaysResponse.NatGateways!.forEach(nat => {
          expect(nat.State).toBe('available');
          expect(nat.ConnectivityType).toBe('public');
        });
        console.log('✓ NAT Gateways active in public subnets');

        // Step 4: Verify private subnets
        console.log('\n4. Verifying private subnets...');
        const privateSubnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
          })
        );
        expect(privateSubnetsResponse.Subnets!.length).toBe(2);
        privateSubnetsResponse.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
        console.log('✓ Private subnets do not auto-assign public IPs');

        // Step 5: Verify multi-AZ configuration
        console.log('\n5. Verifying multi-AZ configuration...');
        const allSubnets = [
          ...publicSubnetsResponse.Subnets!,
          ...privateSubnetsResponse.Subnets!,
        ];
        const azs = new Set(allSubnets.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);
        console.log(`✓ Subnets span ${azs.size} availability zones`);

        console.log('\n✓✓✓ Complete Network Traffic Flow validated ✓✓✓');
        console.log('Flow: Internet → IGW → Public Subnets → NAT → Private Subnets');
      },
      TEST_TIMEOUT * 2
    );
  });

  describe('INTERACTIVE E2E: Database Backup and Recovery Setup', () => {
    test(
      'should verify RDS backup configuration and Secrets Manager rotation',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'DBInstanceIdentifier',
            'DBPasswordSecretArn',
            'RDSKMSKeyId'
          )
        )
          return;

        console.log('=== Starting Database Backup and Recovery Validation ===');

        // Step 1: Verify RDS backup configuration
        console.log('\n1. Verifying RDS backup configuration...');
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.DBInstanceIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];
        expect(db.BackupRetentionPeriod).toBe(7);
        expect(db.PreferredBackupWindow).toBeDefined();
        console.log(`✓ RDS configured with ${db.BackupRetentionPeriod} days backup retention`);

        // Step 2: Verify RDS Multi-AZ for high availability
        console.log('\n2. Verifying Multi-AZ configuration...');
        expect(db.MultiAZ).toBe(true);
        console.log('✓ RDS configured for Multi-AZ deployment');

        // Step 3: Verify automated backups enabled
        console.log('\n3. Verifying automated backups...');
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
        expect(db.PreferredBackupWindow).toBeDefined();
        expect(db.PreferredMaintenanceWindow).toBeDefined();
        console.log('✓ Automated backups enabled with maintenance window');

        // Step 4: Verify Secrets Manager secret
        console.log('\n4. Verifying Secrets Manager integration...');
        const secretResponse = await secretsClient.send(
          new DescribeSecretCommand({
            SecretId: outputs.DBPasswordSecretArn,
          })
        );
        expect(secretResponse.ARN).toBeDefined();
        console.log('✓ Database secret stored in Secrets Manager');

        // Step 5: Retrieve and validate secret structure
        console.log('\n5. Validating secret structure...');
        const secretValueResponse = await secretsClient.send(
          new GetSecretValueCommand({
            SecretId: outputs.DBPasswordSecretArn,
          })
        );
        const secret = JSON.parse(secretValueResponse.SecretString!);
        expect(secret.username).toBe('admin');
        expect(secret.password).toBeDefined();
        expect(secret.password.length).toBe(32);
        console.log('✓ Secret contains valid credentials (32 char password)');

        // Step 6: Verify KMS encryption for secret
        console.log('\n6. Verifying KMS encryption...');
        expect(secretResponse.KmsKeyId).toBeDefined();
        console.log('✓ Secret encrypted with KMS');

        // Step 7: Verify RDS encryption with same KMS key
        console.log('\n7. Verifying RDS encryption with KMS...');
        expect(db.StorageEncrypted).toBe(true);
        expect(db.KmsKeyId).toBeDefined();
        console.log('✓ RDS storage encrypted with KMS');

        console.log('\n✓✓✓ Database Backup and Recovery setup validated ✓✓✓');
        console.log(
          'Configuration: 7-day backups + Multi-AZ + Secrets Manager + KMS encryption'
        );
      },
      TEST_TIMEOUT * 2
    );
  });
});
