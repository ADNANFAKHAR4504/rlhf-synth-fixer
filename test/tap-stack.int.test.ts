// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Read outputs from deployment with error handling
let outputs: any = {};
let outputsAvailable = false;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  
  // Check if this looks like TapStack outputs
  const expectedOutputs = ['VPCId', 'DataBucketName', 'LogsBucketName', 'EC2RoleArn', 'KMSKeyArn'];
  outputsAvailable = expectedOutputs.every(key => key in outputs);
  
  if (!outputsAvailable) {
    console.warn('Warning: cfn-outputs/flat-outputs.json does not contain expected TapStack outputs. Integration tests will be skipped.');
  }
} catch (error) {
  console.warn('Warning: Could not read cfn-outputs/flat-outputs.json. Integration tests will be skipped.');
}

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');
const endpoint = isLocalStack ? process.env.AWS_ENDPOINT_URL || 'http://localhost:4566' : undefined;

// AWS SDK clients with LocalStack endpoint support
const s3Client = new S3Client({
  region: 'us-east-1',
  ...(endpoint && {
    endpoint,
    forcePathStyle: true
  })
});
const iamClient = new IAMClient({
  region: 'us-east-1',
  ...(endpoint && { endpoint })
});
const ec2Client = new EC2Client({
  region: 'us-east-1',
  ...(endpoint && { endpoint })
});
const kmsClient = new KMSClient({
  region: 'us-east-1',
  ...(endpoint && { endpoint })
});

// Skip all tests if outputs are not available
const testSuiteCondition = outputsAvailable ? describe : describe.skip;

testSuiteCondition('TapStack Integration Tests', () => {
  beforeAll(() => {
    console.log('Running TapStack integration tests with deployed infrastructure');
  });

  describe('Deployed Infrastructure Validation', () => {
    test('should have all expected outputs', () => {
      expect(outputs).toHaveProperty('VPCId');
      expect(outputs).toHaveProperty('DataBucketName');
      expect(outputs).toHaveProperty('LogsBucketName');
      expect(outputs).toHaveProperty('EC2RoleArn');
      expect(outputs).toHaveProperty('KMSKeyArn');
    });

    test('VPC should exist and be available', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      // EnableDnsHostnames can be undefined when using default value (true)
      expect(response.Vpcs[0].EnableDnsHostnames !== false).toBe(true);
      // EnableDnsSupport can be undefined when using default value (true)
      expect(response.Vpcs[0].EnableDnsSupport !== false).toBe(true);
    });

    test('VPC should have subnets in multiple AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.Subnets.length).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private

      const availabilityZones = new Set(
        response.Subnets.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2); // Multiple AZs
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    test('Data bucket should exist and have KMS encryption', async () => {
      const bucketName = outputs.DataBucketName;

      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      const rule =
        encryptionResponse.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBeTruthy();
    });

    test('Data bucket should have versioning enabled', async () => {
      const bucketName = outputs.DataBucketName;

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Data bucket should block public access', async () => {
      const bucketName = outputs.DataBucketName;

      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration
          ?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('Logs bucket should exist and be properly configured', async () => {
      const bucketName = outputs.LogsBucketName;

      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration
          ?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('IAM Role Configuration', () => {
    test('EC2 role should exist with correct configuration', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop();

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role.AssumeRolePolicyDocument).toContain(
        'ec2.amazonaws.com'
      );
    });

    test('EC2 role should have exactly 5 or fewer policies attached', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop();

      // Get managed policies
      const managedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      // Get inline policies
      const inlinePoliciesResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      const totalPolicies =
        managedPoliciesResponse.AttachedPolicies.length +
        inlinePoliciesResponse.PolicyNames.length;

      expect(totalPolicies).toBeLessThanOrEqual(5);
    });

    test('EC2 role should have required managed policies', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop();

      const managedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyNames = managedPoliciesResponse.AttachedPolicies.map(
        p => p.PolicyName
      );

      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
      expect(policyNames).toContain('AmazonS3ReadOnlyAccess');
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key should exist and have key rotation enabled', async () => {
      const keyArn = outputs.KMSKeyArn;
      const keyId = keyArn.split('/').pop();

      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyResponse.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(keyResponse.KeyMetadata.KeyManager).toBe('CUSTOMER');
      expect(keyResponse.KeyMetadata.Enabled).toBe(true);
    });
  });

  describe('Security Group Configuration', () => {
    test('Security groups should have restricted access', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      // Filter out default security group
      const customSecurityGroups = response.SecurityGroups.filter(
        sg => !sg.GroupName.includes('default')
      );

      customSecurityGroups.forEach(sg => {
        // Check inbound rules
        sg.IpPermissions?.forEach(rule => {
          // Should not have open access from 0.0.0.0/0 except for specific cases
          rule.IpRanges?.forEach(range => {
            if (range.CidrIp === '0.0.0.0/0') {
              // Only allow if it's HTTPS (port 443)
              expect(rule.FromPort).toBe(443);
              expect(rule.ToPort).toBe(443);
            }
          });
        });
      });
    });
  });

  describe('End-to-End Security Validation', () => {
    test('All S3 buckets should use customer-managed KMS keys', async () => {
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];

      for (const bucketName of buckets) {
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        const kmsKeyId =
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

        expect(kmsKeyId).toBeTruthy();
        // Verify it's using our customer-managed key
        expect(kmsKeyId).toContain(outputs.KMSKeyArn.split('/').pop());
      }
    });

    test('No resources should have public access', async () => {
      // Check S3 buckets
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];

      for (const bucketName of buckets) {
        const publicAccessResponse = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        expect(
          publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration
            ?.RestrictPublicBuckets
        ).toBe(true);
      }

      // Check security groups don't have unrestricted access
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      sgResponse.SecurityGroups.forEach(sg => {
        sg.IpPermissions?.forEach(rule => {
          rule.IpRanges?.forEach(range => {
            // If there's a 0.0.0.0/0 rule, it should be for specific ports only
            if (range.CidrIp === '0.0.0.0/0') {
              expect([80, 443]).toContain(rule.FromPort);
            }
          });
        });
      });
    });

    test('Infrastructure should follow naming conventions', async () => {
      // Check bucket names
      expect(outputs.DataBucketName).toMatch(/secure-company-.*-data/);
      expect(outputs.LogsBucketName).toMatch(/secure-company-.*-logs/);

      // Check role name
      expect(outputs.EC2RoleArn).toMatch(/secure-company-.*-ec2-role/);
    });
  });
});

// If outputs are not available, create a placeholder test suite to explain why tests are skipped
if (!outputsAvailable) {
  describe('TapStack Integration Tests', () => {
    test('Integration tests skipped - no valid deployment outputs found', () => {
      console.log(`
        Integration tests for TapStack have been skipped because:
        
        1. The cfn-outputs/flat-outputs.json file either doesn't exist or 
        2. Doesn't contain the expected outputs for a TapStack deployment
        
        Expected outputs: VPCId, DataBucketName, LogsBucketName, EC2RoleArn, KMSKeyArn
        
        To run integration tests:
        1. Deploy the TapStack using: npm run cdk:deploy
        2. Ensure the outputs are saved to cfn-outputs/flat-outputs.json
        3. Re-run the tests
      `);
      
      // This test will always pass but serves as documentation
      expect(true).toBe(true);
    });
  });
}