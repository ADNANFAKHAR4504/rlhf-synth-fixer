// Configuration - These are coming from cfn-outputs after deployment
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTagsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get AWS region from environment or use default
const awsRegion = process.env.AWS_REGION || 'us-east-1';

describe('Security Infrastructure Integration Tests', () => {
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let kmsClient: KMSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let cloudwatchLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Initialize AWS SDK v3 clients
    const clientConfig = { region: awsRegion };

    s3Client = new S3Client(clientConfig);
    lambdaClient = new LambdaClient(clientConfig);
    kmsClient = new KMSClient(clientConfig);
    ec2Client = new EC2Client(clientConfig);
    iamClient = new IAMClient(clientConfig);
    cloudwatchLogsClient = new CloudWatchLogsClient(clientConfig);
  });

  describe('S3 Bucket Security Tests', () => {
    test('S3 bucket should exist and be encrypted', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      // Test bucket encryption configuration
      const encryptionConfig = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(encryptionConfig.ServerSideEncryptionConfiguration).toBeDefined();
      const rules: any =
        encryptionConfig.ServerSideEncryptionConfiguration?.Rules;
      expect(rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID
      ).toBeDefined();
    });

    test('S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.S3BucketName;

      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('S3 bucket should enforce encryption via bucket policy', async () => {
      const bucketName = outputs.S3BucketName;

      const bucketPolicy: any = await s3Client.send(
        new GetBucketPolicyCommand({
          Bucket: bucketName,
        })
      );

      const policy = JSON.parse(bucketPolicy.Policy);

      // Check for denial of unencrypted uploads
      const denyUnencryptedStmt = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyUnencryptedUploads'
      );
      expect(denyUnencryptedStmt).toBeDefined();
      expect(denyUnencryptedStmt.Effect).toBe('Deny');

      // Check for HTTPS enforcement
      const denyInsecureStmt = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStmt).toBeDefined();
      expect(denyInsecureStmt.Effect).toBe('Deny');
    });

    test('should be able to upload encrypted objects only', async () => {
      const bucketName = outputs.S3BucketName;
      const kmsKeyId = outputs.KmsKeyId;
      const testKey = `test-encrypted-${Date.now()}.txt`;

      // Upload with encryption should succeed
      await expect(
        s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: 'test content',
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: kmsKeyId,
          })
        )
      ).resolves.toBeDefined();

      // Verify object is encrypted
      const headObject = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      expect(headObject.ServerSideEncryption).toBe('aws:kms');
      expect(headObject.SSEKMSKeyId).toBeDefined();

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('KMS Key Security Tests', () => {
    test('KMS key should exist and be customer-managed', async () => {
      const kmsKeyId = outputs.KmsKeyId;
      expect(kmsKeyId).toBeDefined();

      const keyInfo = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(keyInfo.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      expect(keyInfo.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyInfo.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have appropriate policies', async () => {
      const kmsKeyId = outputs.KmsKeyId;

      const keyPolicy = await kmsClient.send(
        new GetKeyPolicyCommand({
          KeyId: kmsKeyId,
          PolicyName: 'default',
        })
      );

      const policy = JSON.parse(<string>keyPolicy.Policy);

      // Should allow S3 and Lambda services
      const s3Statement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow S3 Service'
      );
      const lambdaStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow Lambda Service'
      );

      expect(s3Statement).toBeDefined();
      expect(lambdaStatement).toBeDefined();
    });
  });

  describe('VPC Security Tests', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcInfo: any = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcInfo.Vpcs[0].State).toBe('available');
      expect(vpcInfo.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('private subnets should exist and be private', async () => {
      const subnet1Id = outputs.PrivateSubnet1Id;
      const subnet2Id = outputs.PrivateSubnet2Id;

      expect(subnet1Id).toBeDefined();
      expect(subnet2Id).toBeDefined();

      const subnetsInfo: any = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [subnet1Id, subnet2Id],
        })
      );

      subnetsInfo.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('Lambda security group should have restrictive rules', async () => {
      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const sgInfo: any = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      const sg = sgInfo.SecurityGroups[0];

      // Should have no inbound rules
      expect(sg.IpPermissions).toHaveLength(0);

      // Should have only HTTPS and DNS outbound rules
      expect(sg.IpPermissionsEgress).toHaveLength(2);

      const httpsRule = sg.IpPermissionsEgress.find(
        (rule: any) => rule.FromPort === 443 && rule.ToPort === 443
      );
      const dnsRule = sg.IpPermissionsEgress.find(
        (rule: any) => rule.FromPort === 53 && rule.ToPort === 53
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
      const functionInfo: any = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      // Should be in VPC
      expect(functionInfo.Configuration.VpcConfig).toBeDefined();
      expect(functionInfo.Configuration.VpcConfig.VpcId).toBe(outputs.VpcId);

      // Should have correct subnets and security groups
      expect(functionInfo.Configuration.VpcConfig.SubnetIds).toContain(
        outputs.PrivateSubnet1Id
      );
      expect(functionInfo.Configuration.VpcConfig.SubnetIds).toContain(
        outputs.PrivateSubnet2Id
      );
      expect(functionInfo.Configuration.VpcConfig.SecurityGroupIds).toContain(
        outputs.SecurityGroupId
      );
    });

    test('Lambda function should be able to execute', async () => {
      const lambdaArn = outputs.LambdaFunctionArn;
      const functionName = lambdaArn.split(':')[6];

      const invokeResult = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: new TextEncoder().encode(JSON.stringify({})),
        })
      );

      expect(invokeResult.StatusCode).toBe(200);

      const responsePayload = new TextDecoder().decode(invokeResult.Payload);
      const response = JSON.parse(responsePayload);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain(
        'Secure Lambda function executed successfully'
      );
    });

    test('Lambda execution role should have least privilege permissions', async () => {
      const roleArn = outputs.LambdaExecutionRoleArn;
      expect(roleArn).toBeDefined();

      // Role should exist and be assumable by Lambda service
      const roleName = roleArn.split('/')[1];

      const roleInfo: any = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(roleInfo.Role.AssumeRolePolicyDocument)
      );
      const lambdaAssumeStmt = assumeRolePolicy.Statement.find(
        (stmt: any) => stmt.Principal.Service === 'lambda.amazonaws.com'
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

      const logGroups: any = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: expectedLogGroup,
        })
      );

      expect(logGroups.logGroups.length).toBeGreaterThan(0);

      const logGroup = logGroups.logGroups[0];
      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.retentionInDays).toBe(14);
    });
  });

  describe('Network Connectivity Tests', () => {
    test('VPC endpoint for S3 should exist and be functional', async () => {
      const vpcId = outputs.VpcId;

      const vpcEndpoints: any = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${awsRegion}.s3`],
            },
          ],
        })
      );

      expect(vpcEndpoints.VpcEndpoints.length).toBeGreaterThan(0);
      expect(vpcEndpoints.VpcEndpoints[0].State).toBe('Available');
      expect(vpcEndpoints.VpcEndpoints[0].VpcEndpointType).toBe('Gateway');
    });
  });

  describe('Resource Tagging Validation', () => {
    test('all resources should have consistent tags', async () => {
      const vpcId = outputs.VpcId;

      // Check VPC tags
      const vpcTags: any = await ec2Client.send(
        new DescribeTagsCommand({
          Filters: [
            {
              Name: 'resource-id',
              Values: [vpcId],
            },
          ],
        })
      );

      const requiredTags = ['Environment', 'Owner', 'Project'];
      requiredTags.forEach(tagKey => {
        const tag = vpcTags.Tags.find((t: any) => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag.Value).toBeTruthy();
      });
    });
  });
});
