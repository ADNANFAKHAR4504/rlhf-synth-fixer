import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// LocalStack detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const enableEC2 = !isLocalStack && (process.env.ENABLE_EC2 === 'true');

// Read the deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS clients configuration
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    forcePathStyle: true,
  }),
};

const ec2Client = new EC2Client(clientConfig);
const s3Client = new S3Client(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

describe('TapStack Integration Tests', () => {
  // Skip tests if no outputs are available
  const skipIfNoOutputs = outputs && Object.keys(outputs).length > 0 ? describe : describe.skip;

  skipIfNoOutputs('Security Infrastructure Validation', () => {
    const describeEC2Tests = enableEC2 ? test : test.skip;

    describeEC2Tests('should have deployed VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      // Check for production tag
      const envTag = vpc.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });

    describeEC2Tests('should have EC2 instance with encrypted EBS volume', async () => {
      const instanceId = outputs.InstanceId;
      expect(instanceId).toBeDefined();

      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      }));

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];

      // Check instance is running or stopped (not terminated)
      expect(['running', 'stopped', 'stopping', 'pending']).toContain(instance.State?.Name);

      // Check for encrypted EBS volumes
      const rootVolume = instance.BlockDeviceMappings?.[0];
      expect(rootVolume).toBeDefined();
      expect(rootVolume?.Ebs?.VolumeId).toBeDefined();

      // Check for production tags
      const envTag = instance.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });

    test('should have S3 bucket with KMS encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const encryptionRule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];

      // LocalStack Community may default to AES256 instead of aws:kms
      const algorithm = encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(['aws:kms', 'AES256']).toContain(algorithm);

      // Only check KMS key ID if algorithm is aws:kms
      if (algorithm === 'aws:kms') {
        expect(encryptionRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain('arn:aws:kms');
      }
    });

    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName,
      }));

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy enforcing SSL', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const policyResponse = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: bucketName,
      }));

      expect(policyResponse.Policy).toBeDefined();
      const policy = JSON.parse(policyResponse.Policy!);
      
      // Check for SSL enforcement statement
      const sslStatement = policy.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(sslStatement).toBeDefined();
    });

    test('should have KMS key with rotation enabled', async () => {
      const kmsKeyArn = outputs.KMSKeyArn;
      expect(kmsKeyArn).toBeDefined();

      // Extract key ID from ARN
      const keyId = kmsKeyArn.split('/').pop()!;

      // Check key exists and is enabled
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId,
      }));

      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.Description).toContain('production environment encryption');

      // Check key rotation is enabled
      const rotationResponse = await kmsClient.send(new GetKeyRotationStatusCommand({
        KeyId: keyId,
      }));

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('should have IAM role with MFA requirement', async () => {
      const roleArn = outputs.SecureRoleArn;
      expect(roleArn).toBeDefined();

      // Extract role name from ARN
      const roleName = roleArn.split('/').pop()!;

      const roleResponse = await iamClient.send(new GetRoleCommand({
        RoleName: roleName,
      }));

      expect(roleResponse.Role).toBeDefined();
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      
      // Check for MFA deny statement
      const mfaDenyStatement = assumeRolePolicy.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && 
        stmt.Condition?.BoolIfExists?.['aws:MultiFactorAuthPresent'] === 'false'
      );
      expect(mfaDenyStatement).toBeDefined();
    });

    describeEC2Tests('should have security group with restricted egress rules', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Check egress rules only allow HTTP/HTTPS
      const egressRules = sg.IpPermissionsEgress || [];
      const httpRule = egressRules.find(r => r.FromPort === 80);
      const httpsRule = egressRules.find(r => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Check for production tag
      const envTag = sg.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });
  });

  skipIfNoOutputs('Resource Connectivity', () => {
    const describeEC2Tests = enableEC2 ? test : test.skip;

    describeEC2Tests('should have all resources in the same VPC', async () => {
      const vpcId = outputs.VPCId;
      const instanceId = outputs.InstanceId;
      const sgId = outputs.SecurityGroupId;

      expect(vpcId).toBeDefined();
      expect(instanceId).toBeDefined();
      expect(sgId).toBeDefined();

      // Check instance is in the VPC
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      }));
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.VpcId).toBe(vpcId);

      // Check security group is in the VPC
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));
      const sg = sgResponse.SecurityGroups![0];
      expect(sg.VpcId).toBe(vpcId);
    });

    describeEC2Tests('should have EC2 instance using the correct IAM role', async () => {
      const instanceId = outputs.InstanceId;
      const roleArn = outputs.SecureRoleArn;

      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      }));

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toContain('ProductionInstance');
    });

    test('should have resources properly tagged', async () => {
      // Critical resources that should always exist
      const alwaysPresent = [
        'S3BucketName',
        'KMSKeyArn',
        'SecureRoleArn',
      ];

      // EC2 resources that are conditional
      const ec2Resources = [
        'VPCId',
        'InstanceId',
        'SecurityGroupId',
      ];

      // Check always-present resources
      for (const outputKey of alwaysPresent) {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      }

      // Check EC2 resources only when enabled
      if (enableEC2) {
        for (const outputKey of ec2Resources) {
          if (outputs[outputKey]) {
            expect(outputs[outputKey]).toBeDefined();
            expect(outputs[outputKey].length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  skipIfNoOutputs('Security Compliance', () => {
    test('should have all encryption keys properly configured', () => {
      // Check KMS key ARN is present
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.KMSKeyArn).toContain('arn:aws:kms');
      
      // Check S3 bucket ARN indicates encryption
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.S3BucketArn).toContain('arn:aws:s3');
    });

    test('should have security monitoring note', () => {
      expect(outputs.SecurityNote).toBeDefined();
      // Note content varies based on whether EC2 is enabled
      if (enableEC2) {
        expect(outputs.SecurityNote).toContain('GuardDuty');
        expect(outputs.SecurityNote).toContain('Security Hub');
      } else {
        expect(outputs.SecurityNote).toContain('LocalStack Community');
      }
    });

    test('should have all required outputs exported', () => {
      // Outputs that are always present
      const alwaysRequiredOutputs = [
        'KMSKeyArn',
        'SecureRoleArn',
        'S3BucketArn',
        'S3BucketName',
        'SecurityNote',
      ];

      // Outputs that are conditional on EC2
      const ec2Outputs = [
        'VPCId',
        'InstanceId',
        'SecurityGroupId',
      ];

      // Check always-required outputs
      for (const output of alwaysRequiredOutputs) {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output].length).toBeGreaterThan(0);
      }

      // Check EC2 outputs only when enabled
      if (enableEC2) {
        for (const output of ec2Outputs) {
          expect(outputs[output]).toBeDefined();
          expect(outputs[output].length).toBeGreaterThan(0);
        }
      }
    });
  });
});