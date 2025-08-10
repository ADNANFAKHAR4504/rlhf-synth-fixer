// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import AWS from 'aws-sdk';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Security Infrastructure Integration Tests', () => {
  let s3: AWS.S3;
  let lambda: AWS.Lambda;
  let kms: AWS.KMS;
  let ec2: AWS.EC2;

  beforeAll(() => {
    // Initialize AWS SDK clients
    s3 = new AWS.S3();
    lambda = new AWS.Lambda();
    kms = new AWS.KMS();
    ec2 = new AWS.EC2();
  });

  describe('S3 Bucket Security Tests', () => {
    test('S3 bucket should exist and be encrypted', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      // Test bucket encryption configuration
      const encryptionConfig = await s3.getBucketEncryption({
        Bucket: bucketName
      }).promise();

      expect(encryptionConfig.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = encryptionConfig.ServerSideEncryptionConfiguration.Rules;
      expect(rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });

    test('S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should enforce encryption via bucket policy', async () => {
      const bucketName = outputs.S3BucketName;
      
      const bucketPolicy = await s3.getBucketPolicy({
        Bucket: bucketName
      }).promise();

      const policy = JSON.parse(bucketPolicy.Policy);
      
      // Check for denial of unencrypted uploads
      const denyUnencryptedStmt = policy.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyUnencryptedUploads'
      );
      expect(denyUnencryptedStmt).toBeDefined();
      expect(denyUnencryptedStmt.Effect).toBe('Deny');
      
      // Check for HTTPS enforcement
      const denyInsecureStmt = policy.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStmt).toBeDefined();
      expect(denyInsecureStmt.Effect).toBe('Deny');
    });

    test('should be able to upload encrypted objects only', async () => {
      const bucketName = outputs.S3BucketName;
      const kmsKeyId = outputs.KmsKeyId;
      const testKey = `test-encrypted-${Date.now()}.txt`;

      // Upload with encryption should succeed
      await expect(s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: 'test content',
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId
      }).promise()).resolves.toBeDefined();

      // Verify object is encrypted
      const headObject = await s3.headObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      expect(headObject.ServerSideEncryption).toBe('aws:kms');
      expect(headObject.SSEKMSKeyId).toBeDefined();

      // Clean up
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
    });
  });

  describe('KMS Key Security Tests', () => {
    test('KMS key should exist and be customer-managed', async () => {
      const kmsKeyId = outputs.KmsKeyId;
      expect(kmsKeyId).toBeDefined();

      const keyInfo = await kms.describeKey({
        KeyId: kmsKeyId
      }).promise();

      expect(keyInfo.KeyMetadata.KeyManager).toBe('CUSTOMER');
      expect(keyInfo.KeyMetadata.KeyState).toBe('Enabled');
      expect(keyInfo.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have appropriate policies', async () => {
      const kmsKeyId = outputs.KmsKeyId;

      const keyPolicy = await kms.getKeyPolicy({
        KeyId: kmsKeyId,
        PolicyName: 'default'
      }).promise();

      const policy = JSON.parse(keyPolicy.Policy);
      
      // Should allow S3 and Lambda services
      const s3Statement = policy.Statement.find((stmt: any) => 
        stmt.Sid === 'Allow S3 Service'
      );
      const lambdaStatement = policy.Statement.find((stmt: any) => 
        stmt.Sid === 'Allow Lambda Service'
      );

      expect(s3Statement).toBeDefined();
      expect(lambdaStatement).toBeDefined();
    });
  });

  describe('VPC Security Tests', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcInfo = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();

      expect(vpcInfo.Vpcs[0].State).toBe('available');
      expect(vpcInfo.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('private subnets should exist and be private', async () => {
      const subnet1Id = outputs.PrivateSubnet1Id;
      const subnet2Id = outputs.PrivateSubnet2Id;
      
      expect(subnet1Id).toBeDefined();
      expect(subnet2Id).toBeDefined();

      const subnetsInfo = await ec2.describeSubnets({
        SubnetIds: [subnet1Id, subnet2Id]
      }).promise();

      subnetsInfo.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('Lambda security group should have restrictive rules', async () => {
      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const sgInfo = await ec2.describeSecurityGroups({
        GroupIds: [securityGroupId]
      }).promise();

      const sg = sgInfo.SecurityGroups[0];
      
      // Should have no inbound rules
      expect(sg.IpPermissions).toHaveLength(0);
      
      // Should have only HTTPS and DNS outbound rules
      expect(sg.IpPermissionsEgress).toHaveLength(2);
      
      const httpsRule = sg.IpPermissionsEgress.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      const dnsRule = sg.IpPermissionsEgress.find(rule => 
        rule.FromPort === 53 && rule.ToPort === 53
      );
      
      expect(httpsRule).toBeDefined();
      expect(dnsRule).toBeDefined();
    });
  });

  describe('Lambda Function Security Tests', () => {
    test('Lambda function should exist and be in VPC', async () => {
      const lambdaArn = outputs.LambdaFunctionArn;
      expect(lambdaArn).toBeDefined();

      const functionName = lambdaArn.split(':')[6];
      const functionInfo = await lambda.getFunction({
        FunctionName: functionName
      }).promise();

      // Should be in VPC
      expect(functionInfo.Configuration.VpcConfig).toBeDefined();
      expect(functionInfo.Configuration.VpcConfig.VpcId).toBe(outputs.VpcId);
      
      // Should have correct subnets and security groups
      expect(functionInfo.Configuration.VpcConfig.SubnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(functionInfo.Configuration.VpcConfig.SubnetIds).toContain(outputs.PrivateSubnet2Id);
      expect(functionInfo.Configuration.VpcConfig.SecurityGroupIds).toContain(outputs.SecurityGroupId);
    });

    test('Lambda function should be able to execute', async () => {
      const lambdaArn = outputs.LambdaFunctionArn;
      const functionName = lambdaArn.split(':')[6];

      const invokeResult = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify({})
      }).promise();

      expect(invokeResult.StatusCode).toBe(200);
      
      const response = JSON.parse(invokeResult.Payload as string);
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Secure Lambda function executed successfully');
    });

    test('Lambda execution role should have least privilege permissions', async () => {
      const roleArn = outputs.LambdaExecutionRoleArn;
      expect(roleArn).toBeDefined();

      // Role should exist and be assumable by Lambda service
      const roleName = roleArn.split('/')[1];
      const iam = new AWS.IAM();
      
      const roleInfo = await iam.getRole({
        RoleName: roleName
      }).promise();

      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleInfo.Role.AssumeRolePolicyDocument));
      const lambdaAssumeStmt = assumeRolePolicy.Statement.find((stmt: any) => 
        stmt.Principal.Service === 'lambda.amazonaws.com'
      );
      
      expect(lambdaAssumeStmt).toBeDefined();
      expect(lambdaAssumeStmt.Action).toBe('sts:AssumeRole');
    });
  });

  describe('CloudWatch Logs Security Tests', () => {
    test('Lambda logs should be encrypted', async () => {
      const lambdaArn = outputs.LambdaFunctionArn;
      const functionName = lambdaArn.split(':')[6];
      const expectedLogGroup = `/aws/lambda/${functionName}`;

      const cloudwatchLogs = new AWS.CloudWatchLogs();
      
      const logGroups = await cloudwatchLogs.describeLogGroups({
        logGroupNamePrefix: expectedLogGroup
      }).promise();

      expect(logGroups.logGroups.length).toBeGreaterThan(0);
      
      const logGroup = logGroups.logGroups[0];
      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.retentionInDays).toBe(14);
    });
  });

  describe('Network Connectivity Tests', () => {
    test('VPC endpoint for S3 should exist and be functional', async () => {
      const vpcId = outputs.VpcId;

      const vpcEndpoints = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS.config.region}.s3`]
          }
        ]
      }).promise();

      expect(vpcEndpoints.VpcEndpoints.length).toBeGreaterThan(0);
      expect(vpcEndpoints.VpcEndpoints[0].State).toBe('Available');
      expect(vpcEndpoints.VpcEndpoints[0].VpcEndpointType).toBe('Gateway');
    });
  });

  describe('Resource Tagging Validation', () => {
    test('all resources should have consistent tags', async () => {
      const vpcId = outputs.VpcId;
      
      // Check VPC tags
      const vpcTags = await ec2.describeTags({
        Filters: [
          {
            Name: 'resource-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const requiredTags = ['Environment', 'Owner', 'Project'];
      requiredTags.forEach(tagKey => {
        const tag = vpcTags.Tags.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag.Value).toBeTruthy();
      });
    });
  });
});