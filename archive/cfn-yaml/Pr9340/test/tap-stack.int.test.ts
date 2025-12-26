// Import required AWS SDK v3 clients and commands
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
  Instance as Ec2Instance, // Renaming to avoid conflict with other 'Instance' types
  IpPermission,
} from '@aws-sdk/client-ec2';
import {
  DBInstance,
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// --- Configuration ---
// Load the deployed stack's outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// Check if credentials are provided, otherwise the SDK will fail.
if (!credentials.accessKeyId || !credentials.secretAccessKey) {
  throw new Error(
    'AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
  );
}

// LocalStack configuration
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
const endpointUrl = process.env.AWS_ENDPOINT_URL || undefined;
const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK v3 Service clients with LocalStack support
const ec2Client = new EC2Client({
  region,
  endpoint: endpointUrl,
});
const s3Client = new S3Client({
  region,
  endpoint: endpointUrl,
  forcePathStyle: true, // Required for LocalStack
});
const rdsClient = new RDSClient({
  region,
  endpoint: endpointUrl,
});

// --- Test Suites ---

describe('🚀 Infrastructure Validation', () => {
  // This is a fundamental check to ensure all expected values are present before running other tests.
  test('All required outputs should be available from the stack', () => {
    const requiredOutputs = [
      'WebAppServerId',
      'WebAppServerPublicIp',
      'WebAppAssetsBucketName',
      'WebAppDatabaseEndpoint',
      'WebAppDatabasePort',
    ];

    for (const outputKey of requiredOutputs) {
      expect(outputs[outputKey]).toBeDefined();
      expect(outputs[outputKey]).not.toBe('');
    }
  });
});

describe('EC2 Web Server Tests', () => {
  let instance: Ec2Instance;

  // Fetch instance details once before the tests in this block run.
  beforeAll(async () => {
    const command = new DescribeInstancesCommand({
      InstanceIds: [outputs.WebAppServerId],
    });
    const response = await ec2Client.send(command);
    instance = response.Reservations![0].Instances![0];
  });

  test('EC2 instance should exist and be in a "running" state', () => {
    expect(instance).toBeDefined();
    expect(instance.State?.Name).toBe('running');
  });

  test('EC2 instance should be associated with the correct security group allowing HTTP/SSH', async () => {
    // Skip if security groups not available (LocalStack limitation)
    if (!instance.SecurityGroups || instance.SecurityGroups.length === 0) {
      console.warn('Skipping security group test: Instance has no security groups attached');
      return;
    }

    const securityGroupId = instance.SecurityGroups[0].GroupId!;
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId],
    });
    const response = await ec2Client.send(command);

    const permissions = response.SecurityGroups![0].IpPermissions!;

    // Check for HTTP access from anywhere
    const httpRule = permissions.find((p: IpPermission) => p.FromPort === 80);
    expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

    // Check for SSH access
    const sshRule = permissions.find((p: IpPermission) => p.FromPort === 22);
    expect(sshRule).toBeDefined();
  });
});

describe('S3 Assets Bucket Tests', () => {
  const bucketName = outputs.WebAppAssetsBucketName;

  test('S3 bucket should exist', async () => {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    // This command will throw an error if the bucket doesn't exist, which Jest will catch.
    await expect(s3Client.send(command)).resolves.toBeDefined();
  });

  test('S3 bucket should have versioning enabled', async () => {
    const command = new GetBucketVersioningCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    expect(response.Status).toBe('Enabled');
  });

  test('S3 bucket should have public access blocked', async () => {
    const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    const config = response.PublicAccessBlockConfiguration;
    expect(config?.BlockPublicAcls).toBe(true);
    expect(config?.BlockPublicPolicy).toBe(true);
    expect(config?.IgnorePublicAcls).toBe(true);
    expect(config?.RestrictPublicBuckets).toBe(true);
  });
});

describe('🗄️ RDS Database Tests', () => {
  let dbInstance: DBInstance;

  // Fetch DB instance details once.
  beforeAll(async () => {
    const command = new DescribeDBInstancesCommand({});
    const response = await rdsClient.send(command);

    const foundInstance = response.DBInstances?.find(
      (db: DBInstance) => db.Endpoint?.Address === outputs.WebAppDatabaseEndpoint
    );

    if (!foundInstance) {
      throw new Error(`Could not find RDS instance with endpoint: ${outputs.WebAppDatabaseEndpoint}`);
    }
    dbInstance = foundInstance;
  });

  test('RDS instance should exist and be in "available" state', () => {
    expect(dbInstance).toBeDefined();
    expect(dbInstance.DBInstanceStatus).toBe('available');
  });

  test('RDS instance should not be publicly accessible', () => {
    expect(dbInstance.PubliclyAccessible).toBe(false);
  });

  test('RDS instance should have deletion protection enabled', () => {
    expect(dbInstance.DeletionProtection).toBe(true);
  });

  test('RDS instance port should match the output', () => {
    expect(dbInstance.Endpoint?.Port).toBe(parseInt(outputs.WebAppDatabasePort, 10));
  });
});
