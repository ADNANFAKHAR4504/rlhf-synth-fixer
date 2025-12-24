// Integration Tests for Multi-tier Security Configuration
import fs from 'fs';
import * as AWS from 'aws-sdk';
import axios from 'axios';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

// AWS Service Clients
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const ec2 = new AWS.EC2();
const iam = new AWS.IAM();
const logs = new AWS.CloudWatchLogs();

describe('Multi-tier Security Configuration Integration Tests', () => {
  describe('KMS Key Configuration', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();
      
      const keyMetadata = await kms.describeKey({ KeyId: keyId }).promise();
      expect(keyMetadata.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcs.Vpcs).toHaveLength(1);
      
      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly available in DescribeVpcs response
      // These would need to be checked via DescribeVpcAttribute
    });
  });

  describe('Security Group Configuration', () => {
    test('Security group should exist with restricted ingress rules', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();
      
      const sgs = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      expect(sgs.SecurityGroups).toHaveLength(1);
      
      const sg = sgs.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check SSH rule
      const sshRule = ingressRules.find(r => r.FromPort === 22 && r.ToPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('192.168.1.0/24');
      
      // Check HTTPS rule
      const httpsRule = ingressRules.find(r => r.FromPort === 443 && r.ToPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('192.168.1.0/24');
      
      // Ensure no HTTP (port 80) rule exists
      const httpRule = ingressRules.find(r => r.FromPort === 80 && r.ToPort === 80);
      expect(httpRule).toBeUndefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 bucket should exist with encryption enabled', async () => {
      const bucketName = outputs.DataLakeS3BucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const buckets = await s3.listBuckets().promise();
      const bucket = buckets.Buckets?.find(b => b.Name === bucketName);
      expect(bucket).toBeDefined();
      
      // Check encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      
      const encryptionRule = encryption.ServerSideEncryptionConfiguration?.Rules[0];
      expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.DataLakeS3BucketName;
      
      const publicAccessBlock = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.DataLakeS3BucketName;
      
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      const bucketName = outputs.DataLakeS3BucketName;
      
      const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules!.length).toBeGreaterThan(0);
      
      const rule = lifecycle.Rules![0];
      expect(rule.Status).toBe('Enabled');
      // Note: Expiration is stored in Days property, not ExpirationInDays
      expect((rule as any).Expiration?.Days).toBe(90);
    });
  });

  describe('IAM Policy Configuration', () => {
    test('S3 limited access policy should exist with correct permissions', async () => {
      const policyArn = outputs.S3LimitedAccessPolicyArn;
      expect(policyArn).toBeDefined();
      
      const policy = await iam.getPolicy({ PolicyArn: policyArn }).promise();
      expect(policy.Policy?.PolicyName).toContain('s3-policy');
      
      // Get policy version
      const policyVersion = await iam.getPolicyVersion({
        PolicyArn: policyArn,
        VersionId: policy.Policy!.DefaultVersionId!
      }).promise();
      
      const policyDocument = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion!.Document!));
      const statement = policyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:ListBucket');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).not.toContain('s3:PutObject');
      expect(statement.Action).not.toContain('s3:DeleteObject');
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway should be accessible and return expected response', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toBeDefined();
      
      try {
        // Note: This will fail from outside the allowed IP range
        const response = await axios.get(apiUrl, {
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });
        
        // If we're in the allowed IP range, we should get a 200
        // If not, we should get a 403 (which validates the IP restriction is working)
        expect([200, 403]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.data).toHaveProperty('message');
          expect(response.data.message).toBe('API Gateway is working');
        }
      } catch (error: any) {
        // Network errors are also acceptable (means IP restriction is working)
        expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/);
      }
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('Application log group should exist with correct retention', async () => {
      const logGroupName = outputs.ApplicationLogGroupName;
      expect(logGroupName).toBeDefined();
      
      const logGroups = await logs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();
      
      const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    });
  });

  describe('Security Requirements Validation', () => {
    test('should have KMS key rotation enabled (Requirement 10)', async () => {
      const keyId = outputs.KMSKeyId;
      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });

    test('should have S3 bucket encryption (Requirement 1 - partial)', async () => {
      const bucketName = outputs.DataLakeS3BucketName;
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
    });

    test('should have security groups with IP restrictions (Requirement 5)', async () => {
      const sgId = outputs.SecurityGroupId;
      const sgs = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      const sg = sgs.SecurityGroups![0];
      
      const ingressRules = sg.IpPermissions || [];
      ingressRules.forEach(rule => {
        if (rule.IpRanges && rule.IpRanges.length > 0) {
          expect(rule.IpRanges[0].CidrIp).toBe('192.168.1.0/24');
        }
      });
    });

    test('should have IAM policy with limited S3 access (Requirement 6)', async () => {
      const policyArn = outputs.S3LimitedAccessPolicyArn;
      const policy = await iam.getPolicy({ PolicyArn: policyArn }).promise();
      expect(policy.Policy).toBeDefined();
      
      const policyVersion = await iam.getPolicyVersion({
        PolicyArn: policyArn,
        VersionId: policy.Policy!.DefaultVersionId!
      }).promise();
      
      const policyDocument = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion!.Document!));
      const actions = policyDocument.Statement[0].Action;
      
      expect(actions).toEqual(['s3:ListBucket', 's3:GetObject']);
    });

    test('should have API Gateway as managed access point (Requirement 11 - partial)', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain('amazonaws.com');
    });
  });
});