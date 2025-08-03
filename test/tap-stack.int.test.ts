// Import required AWS SDK clients and libraries
import fs from 'fs';
import { EC2, S3, RDS } from 'aws-sdk';
import axios from 'axios';
import {
  EC2ServiceException,
  S3ServiceException,
  RDSServiceException,
} from '@aws-sdk/client-ec2';

// --- Configuration ---
// Load the deployed stack's outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// AWS Service clients
const ec2 = new EC2();
const s3 = new S3();
const rds = new RDS();

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

  // This is a simple end-to-end test to confirm the web server is responsive.
  test('Web server should be reachable via HTTP', async () => {
    const url = `http://${outputs.WebAppServerPublicIp}`;
    // A 200 OK response indicates the instance is running and the security group allows HTTP traffic.
    const response = await axios.get(url);
    expect(response.status).toBe(200);
  });
});

---

describe('🖥️ EC2 Web Server Tests', () => {
  let instance: EC2.Instance;

  // Fetch instance details once before the tests in this block run.
  beforeAll(async () => {
    const instanceDetails = await ec2
      .describeInstances({
        InstanceIds: [outputs.WebAppServerId],
      })
      .promise();
    instance = instanceDetails.Reservations![0].Instances![0];
  });

  test('EC2 instance should exist and be in a "running" state', () => {
    expect(instance).toBeDefined();
    expect(instance.State?.Name).toBe('running');
  });

  test('EC2 instance should be associated with the correct security group allowing HTTP/SSH', async () => {
    const securityGroupId = instance.SecurityGroups![0].GroupId!;
    const sgDetails = await ec2
      .describeSecurityGroups({
        GroupIds: [securityGroupId],
      })
      .promise();

    const permissions = sgDetails.SecurityGroups![0].IpPermissions!;

    // Check for HTTP access from anywhere
    const httpRule = permissions.find(p => p.FromPort === 80);
    expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

    // Check for SSH access
    const sshRule = permissions.find(p => p.FromPort === 22);
    expect(sshRule).toBeDefined();
  });
});

---

describe('🗃️ S3 Assets Bucket Tests', () => {
  const bucketName = outputs.WebAppAssetsBucketName;

  test('S3 bucket should exist', async () => {
    // headBucket returns an error if the bucket doesn't exist or you don't have permission.
    await expect(s3.headBucket({ Bucket: bucketName }).promise()).resolves.toBeDefined();
  });

  test('S3 bucket should have versioning enabled', async () => {
    const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    expect(versioning.Status).toBe('Enabled');
  });

  test('S3 bucket should have public access blocked', async () => {
    const publicAccessBlock = await s3
      .getPublicAccessBlock({ Bucket: bucketName })
      .promise();
    const config = publicAccessBlock.PublicAccessBlockConfiguration;
    expect(config?.BlockPublicAcls).toBe(true);
    expect(config?.BlockPublicPolicy).toBe(true);
    expect(config?.IgnorePublicAcls).toBe(true);
    expect(config?.RestrictPublicBuckets).toBe(true);
  });
});

---

describe('🗄️ RDS Database Tests', () => {
  let dbInstance: RDS.DBInstance;

  // Fetch DB instance details once. We find it by looking for the one with the matching endpoint.
  // NOTE: Adding 'WebAppDatabaseIdentifier' to your CloudFormation outputs would make this lookup more direct.
  beforeAll(async () => {
    const allDbInstances = await rds.describeDBInstances().promise();
    const foundInstance = allDbInstances.DBInstances?.find(
      db => db.Endpoint?.Address === outputs.WebAppDatabaseEndpoint
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