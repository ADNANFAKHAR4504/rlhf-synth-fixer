import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';

// Initialize AWS SDK clients
AWS.config.update({ region: 'us-east-1' });
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const rds = new AWS.RDS();
const secretsmanager = new AWS.SecretsManager();
const cloudtrail = new AWS.CloudTrail();
const lambda = new AWS.Lambda();
const iam = new AWS.IAM();
const elbv2 = new AWS.ELBv2();

// Load stack outputs
const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

describe('TapStack Integration Tests', () => {
  let accountId: string;
  let outputs: { [key: string]: string };

  beforeAll(async () => {
    // Transform nested outputs to flat key-value pairs
    if (!rawOutputs.TapStackpr2053 || !Array.isArray(rawOutputs.TapStackpr2053)) {
      throw new Error('Invalid all-outputs.json format: Expected TapStackpr2053 array');
    }
    outputs = rawOutputs.TapStackpr2053.reduce((acc: { [key: string]: string }, output: { OutputKey: string; OutputValue: string }) => {
      acc[output.OutputKey] = output.OutputValue;
      return acc;
    }, {});

    // Add EnvironmentName, inferred from ExportName prefixes
    outputs.EnvironmentName = 'production';

    // Ensure all required outputs are present
    const requiredOutputs = [
      'VPCId',
      'DataBucketName',
      'LogBucketName',
      'DynamoDBTableName',
      'RDSEndpoint',
      'RDSSecretArn',
      'LambdaFunctionArn',
      'ALBArn',
    ];
    const missingOutputs = requiredOutputs.filter(key => !outputs[key]);
    if (missingOutputs.length > 0) {
      throw new Error(`Missing required outputs in all-outputs.json: ${missingOutputs.join(', ')}`);
    }

    // Get account ID for IAM tests
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    accountId = identity.Account!;
  });

  // VPC Configuration Tests
  describe('VPC Configuration', () => {
    it('should have a VPC with correct CIDR and DNS settings', async () => {
      const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.VPCId] }).promise();
      expect(vpcResponse.Vpcs).toHaveLength(1);
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Tags).toContainEqual({ Key: 'Name', Value: `${outputs.EnvironmentName}-fintech-vpc` });

      // Check DNS settings using describeVpcAttribute
      const dnsHostnames = await ec2.describeVpcAttribute({ VpcId: outputs.VPCId, Attribute: 'enableDnsHostnames' }).promise();
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      const dnsSupport = await ec2.describeVpcAttribute({ VpcId: outputs.VPCId, Attribute: 'enableDnsSupport' }).promise();
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    it('should have public and private subnets', async () => {
      const response = await ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] }).promise();
      expect(response.Subnets).toHaveLength(4);
      const subnets = response.Subnets!;
      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      expect(publicSubnets[0].CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnets[1].CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnets[0].CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnets[1].CidrBlock).toBe('10.0.4.0/24');
    });

    it('should have an Internet Gateway attached to the VPC', async () => {
      const response = await ec2.describeInternetGateways({ Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.VPCId] }] }).promise();
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Tags).toContainEqual({ Key: 'Name', Value: `${outputs.EnvironmentName}-internet-gateway` });
    });

    it('should have a NAT Gateway in a public subnet', async () => {
      const response = await ec2.describeNatGateways({ Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] }).promise();
      expect(response.NatGateways).toHaveLength(1);
      const nat = response.NatGateways![0];
      expect(nat.State).toBe('available');
      const subnetResponse = await ec2.describeSubnets({ SubnetIds: [nat.SubnetId!] }).promise();
      expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
    });

    // Edge Case: Attempt to describe a non-existent VPC
    it('should fail to describe a non-existent VPC', async () => {
      await expect(ec2.describeVpcs({ VpcIds: ['vpc-nonexistent'] }).promise()).rejects.toThrow('InvalidVpcID.NotFound');
    });
  });

  // VPC Flow Logs Tests
  describe('VPC Flow Logs', () => {
    it('should have VPC Flow Logs enabled with CloudWatch destination', async () => {
      const response = await ec2.describeFlowLogs({ Filter: [{ Name: 'resource-id', Values: [outputs.VPCId] }] }).promise();
      expect(response.FlowLogs).toHaveLength(1);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.LogGroupName).toBe(`/aws/vpc/${outputs.EnvironmentName}-flow-logs`);
    });

    // Edge Case: Verify Flow Logs are not enabled for a non-existent VPC
    it('should not have Flow Logs for a non-existent VPC', async () => {
      const response = await ec2.describeFlowLogs({ Filter: [{ Name: 'resource-id', Values: ['vpc-nonexistent'] }] }).promise();
      expect(response.FlowLogs).toHaveLength(0);
    });
  });

  // S3 Buckets Tests
  describe('S3 Buckets', () => {
    it('should have DataBucket with encryption and public access block', async () => {
      const response = await s3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toContainEqual({
        ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms', KMSMasterKeyID: expect.stringContaining('key') },
      });

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: outputs.DataBucketName }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    it('should have LogBucket with encryption and public access block', async () => {
      const response = await s3.getBucketEncryption({ Bucket: outputs.LogBucketName }).promise();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toContainEqual({
        ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms', KMSMasterKeyID: expect.stringContaining('key') },
      });

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: outputs.LogBucketName }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    it('should deny public access to DataBucket', async () => {
      await expect(
        s3.putObjectAcl({ Bucket: outputs.DataBucketName, Key: 'test.txt', ACL: 'public-read' }).promise()
      ).rejects.toThrow('AccessDenied');
    });

    // Edge Case: Attempt to access a non-existent bucket
    it('should fail to access a non-existent bucket', async () => {
      await expect(s3.headBucket({ Bucket: 'nonexistent-bucket' }).promise()).rejects.toThrow('NotFound');
    });
  });

  // DynamoDB Table Tests
  describe('DynamoDB Table', () => {
    it('should have a DynamoDB table with KMS encryption', async () => {
      const response = await dynamodb.describeTable({ TableName: outputs.DynamoDBTableName }).promise();
      const table = response.Table!;
      expect(table.TableName).toBe(`${outputs.EnvironmentName}-fintech-table`);
      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.SSEDescription).toEqual({
        Status: 'ENABLED',
        SSEType: 'KMS',
        KMSMasterKeyArn: expect.stringContaining('key'),
      });
    });

    // Edge Case: Attempt to describe a non-existent table
    it('should fail to describe a non-existent table', async () => {
      await expect(dynamodb.describeTable({ TableName: 'nonexistent-table' }).promise()).rejects.toThrow('ResourceNotFoundException');
    });
  });

  // RDS Instance Tests
  describe('RDS Instance', () => {
    it('should have an RDS instance with correct configuration', async () => {
      const response = await rds.describeDBInstances({ DBInstanceIdentifier: `${outputs.EnvironmentName}-fintech-db` }).promise();
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBe('15.8');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.Endpoint?.Address).toBe(outputs.RDSEndpoint);
    });

    it('should have a security group allowing VPC CIDR ingress', async () => {
      const response = await ec2.describeSecurityGroups({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'group-name', Values: [`${outputs.EnvironmentName}-rds-security-group*`] }],
      }).promise();
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        IpRanges: [{ CidrIp: '10.0.0.0/16' }],
      });
    });

    // Edge Case: Attempt to describe a non-existent RDS instance
    it('should fail to describe a non-existent RDS instance', async () => {
      await expect(rds.describeDBInstances({ DBInstanceIdentifier: 'nonexistent-db' }).promise()).rejects.toThrow('DBInstanceNotFound');
    });
  });

  // Secrets Manager Tests
  describe('Secrets Manager', () => {
    it('should have a secret for RDS credentials', async () => {
      const response = await secretsmanager.describeSecret({ SecretId: outputs.RDSSecretArn }).promise();
      expect(response.Name).toBe(`${outputs.EnvironmentName}-fintech-rds-credentials`);
      expect(response.KmsKeyId).toContain('key');
      expect(response.Tags).toContainEqual({ Key: 'Environment', Value: outputs.EnvironmentName });
    });

    // Edge Case: Attempt to access a non-existent secret
    it('should fail to access a non-existent secret', async () => {
      await expect(secretsmanager.describeSecret({ SecretId: 'nonexistent-secret' }).promise()).rejects.toThrow('ResourceNotFoundException');
    });
  });

  // IAM Roles Tests
  describe('IAM Roles', () => {
    it('should have an AdminRole with MFA condition', async () => {
      const response = await iam.getRole({ RoleName: `${outputs.EnvironmentName}-admin-role` }).promise();
      const policy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument!));
      expect(policy.Statement).toContainEqual({
        Effect: 'Allow',
        Principal: { AWS: `arn:aws:iam::${accountId}:root` },
        Action: 'sts:AssumeRole',
        Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
      });
    });

    it('should have a DeveloperRole with limited permissions', async () => {
      const response = await iam.getRole({ RoleName: `${outputs.EnvironmentName}-developer-role` }).promise();
      const policies = await iam.listRolePolicies({ RoleName: `${outputs.EnvironmentName}-developer-role` }).promise();
      expect(policies.PolicyNames).toContain('developer-access-policy');
      const policyDoc = await iam.getRolePolicy({
        RoleName: `${outputs.EnvironmentName}-developer-role`,
        PolicyName: 'developer-access-policy',
      }).promise();
      const doc = JSON.parse(decodeURIComponent(policyDoc.PolicyDocument!));
      expect(doc.Statement).toContainEqual({
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        Resource: [expect.stringContaining('fintech-data'), expect.stringContaining('fintech-data/*')],
      });
      expect(doc.Statement).toContainEqual({
        Effect: 'Allow',
        Action: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:Scan'],
        Resource: expect.stringContaining('fintech-table'),
      });
    });

    // Edge Case: Attempt to access a non-existent role
    it('should fail to access a non-existent role', async () => {
      await expect(iam.getRole({ RoleName: 'nonexistent-role' }).promise()).rejects.toThrow('NoSuchEntity');
    });
  });

  // CloudTrail Tests
  describe('CloudTrail', () => {
    it('should have a CloudTrail with global events and S3 logging', async () => {
      const response = await cloudtrail.getTrail({ Name: `${outputs.EnvironmentName}-fintech-trail` }).promise();
      const trail = response.Trail!;
      expect(trail.S3BucketName).toBe(outputs.LogBucketName);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);

      const status = await cloudtrail.getTrailStatus({ Name: `${outputs.EnvironmentName}-fintech-trail` }).promise();
      expect(status.IsLogging).toBe(true);
    });

    // Edge Case: Attempt to get a non-existent trail
    it('should fail to get a non-existent trail', async () => {
      await expect(cloudtrail.getTrail({ Name: 'nonexistent-trail' }).promise()).rejects.toThrow('TrailNotFoundException');
    });
  });

  // Lambda Tests
  describe('Lambda', () => {
    it('should invoke the remediation Lambda successfully', async () => {
      const response = await lambda.invoke({ FunctionName: outputs.LambdaFunctionArn }).promise();
      expect(response.StatusCode).toBe(200);
      const payload = JSON.parse(response.Payload as string);
      expect(payload.Status).toBe('SUCCESS');
    });

    // Edge Case: Attempt to invoke a non-existent Lambda
    it('should fail to invoke a non-existent Lambda', async () => {
      await expect(lambda.invoke({ FunctionName: 'nonexistent-lambda' }).promise()).rejects.toThrow('ResourceNotFoundException');
    });
  });

  // Application Load Balancer Tests
  describe('Application Load Balancer', () => {
    it('should have an ALB in public subnets with correct security group', async () => {
      const response = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.ALBArn] }).promise();
      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      const subnetResponse = await ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] }).promise();
      const publicSubnetIds = subnetResponse.Subnets!.filter(s => s.MapPublicIpOnLaunch).map(s => s.SubnetId!);
      expect(alb.AvailabilityZones!.map(az => az.SubnetId!)).toEqual(expect.arrayContaining(publicSubnetIds));
      expect(alb.SecurityGroups).toHaveLength(1);

      const sgResponse = await ec2.describeSecurityGroups({ GroupIds: alb.SecurityGroups! }).promise();
      const sg = sgResponse.SecurityGroups![0];
      expect(sg.IpPermissions).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        IpRanges: [{ CidrIp: '0.0.0.0/0' }],
      });
      expect(sg.IpPermissions).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        IpRanges: [{ CidrIp: '0.0.0.0/0' }],
      });
    });

    // Edge Case: Attempt to describe a non-existent ALB
    it('should fail to describe a non-existent ALB', async () => {
      await expect(elbv2.describeLoadBalancers({ LoadBalancerArns: ['arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/nonexistent-alb/1234567890abcdef'] }).promise()).rejects.toThrow('LoadBalancerNotFound');
    });
  });

  // Compliance and Best Practices Tests
  describe('Compliance and Best Practices', () => {
    it('should enforce KMS encryption for S3, DynamoDB, and RDS', async () => {
      const s3Encryption = await s3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(s3Encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      const table = await dynamodb.describeTable({ TableName: outputs.DynamoDBTableName }).promise();
      expect(table.Table!.SSEDescription?.Status).toBe('ENABLED');

      const rdsInstance = await rds.describeDBInstances({ DBInstanceIdentifier: `${outputs.EnvironmentName}-fintech-db` }).promise();
      expect(rdsInstance.DBInstances![0].StorageEncrypted).toBe(true);
    });

    it('should enforce MFA for IAM roles', async () => {
      const adminRole = await iam.getRole({ RoleName: `${outputs.EnvironmentName}-admin-role` }).promise();
      const adminPolicy = JSON.parse(decodeURIComponent(adminRole.Role.AssumeRolePolicyDocument!));
      expect(adminPolicy.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');

      const devRole = await iam.getRole({ RoleName: `${outputs.EnvironmentName}-developer-role` }).promise();
      const devPolicy = JSON.parse(decodeURIComponent(devRole.Role.AssumeRolePolicyDocument!));
      expect(devPolicy.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
    });

    it('should have secure S3 bucket policies denying non-secure transport', async () => {
      const policy = await s3.getBucketPolicy({ Bucket: outputs.DataBucketName }).promise();
      const policyDoc = JSON.parse(policy.Policy!);
      expect(policyDoc.Statement).toContainEqual({
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:*',
        Resource: [expect.stringContaining('fintech-data'), expect.stringContaining('fintech-data/*')],
        Condition: { Bool: { 'aws:SecureTransport': 'false' } },
      });
    });
  });
});