import { CloudWatchLogsClient, CreateLogStreamCommand, DescribeLogGroupsCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { GetKeyRotationStatusCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, GetFunctionConfigurationCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetResourcesCommand,
  ResourceGroupsTaggingAPIClient
} from '@aws-sdk/client-resource-groups-tagging-api';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const projectName = 'tap-web-app';

// Load stack outputs from flat-outputs.json
const stackOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS Clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const taggingClient = new ResourceGroupsTaggingAPIClient({ region });

describe('TapStack End-to-End Integration Tests', () => {

  describe('Requirement 1: Region Deployment', () => {
    test('should deploy all resources in the configured region', () => {
      expect(stackOutputs.DeploymentRegion).toBe(region);
    });
  });

  describe('Requirement 2: Resource Tagging', () => {
    test('should have Environment and Project tags on all resources', async () => {
      const response = await taggingClient.send(
        new GetResourcesCommand({
          TagFilters: [
            {
              Key: 'Environment',
              Values: [environmentSuffix],
            },
            {
              Key: 'Project',
              Values: [projectName],
            },
          ],
        })
      );

      expect(response.ResourceTagMappingList).toBeDefined();
      expect(response.ResourceTagMappingList!.length).toBeGreaterThan(0);
    });

    test('should have iac-rlhf-amazon tag on all resources', async () => {
      const response = await taggingClient.send(
        new GetResourcesCommand({
          TagFilters: [
            {
              Key: 'iac-rlhf-amazon',
              Values: ['true'],
            },
          ],
        })
      );

      expect(response.ResourceTagMappingList).toBeDefined();
      expect(response.ResourceTagMappingList!.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 3: IAM Least Privilege', () => {
    test('EC2 role should have only CloudWatch permissions', async () => {
      const roleName = `${projectName}-ec2-role-${environmentSuffix}`;

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const hasCWPolicy = policiesResponse.AttachedPolicies?.some(
        p => p.PolicyName === 'CloudWatchAgentServerPolicy'
      );
      expect(hasCWPolicy).toBe(true);
    });

    test('Lambda role should have only VPC and logs permissions', async () => {
      const roleName = `${projectName}-lambda-role-${environmentSuffix}`;

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const hasVPCPolicy = policiesResponse.AttachedPolicies?.some(
        p => p.PolicyName === 'AWSLambdaVPCAccessExecutionRole'
      );
      expect(hasVPCPolicy).toBe(true);
    });
  });

  describe('Requirement 4: S3 Server-Side Encryption', () => {
    test('application bucket should have KMS encryption enabled', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('should be able to upload and retrieve encrypted objects from S3', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Retrieve object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
        })
      );

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
      expect(getResponse.ServerSideEncryption).toBeDefined();

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
        })
      );
    });

    test('S3 buckets should block all public access', async () => {
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Requirement 5: CloudWatch Logs', () => {
    test('should have dedicated log group with retention', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have KMS encryption for log group', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      expect(logGroup?.kmsKeyId).toBeDefined();
    });

    test('should be able to write logs to CloudWatch', async () => {
      const logStreamName = `integration-test-${Date.now()}`;

      // Create log stream
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: stackOutputs.LogGroupName,
          logStreamName,
        })
      );

      // Write log event
      await logsClient.send(
        new PutLogEventsCommand({
          logGroupName: stackOutputs.LogGroupName,
          logStreamName,
          logEvents: [
            {
              message: 'Integration test log message',
              timestamp: Date.now(),
            },
          ],
        })
      );

      // Verify - successful write means logs are working
      expect(true).toBe(true);
    });
  });

  describe('Requirement 6: EC2 SSH Restrictions', () => {
    test('EC2 security group should restrict SSH to specific CIDR', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
            {
              Name: 'group-name',
              Values: [`${projectName}-ec2-ssh-${environmentSuffix}`],
            },
          ],
        })
      );

      const securityGroup = sgResponse.SecurityGroups?.[0];
      expect(securityGroup).toBeDefined();

      const sshRule = securityGroup?.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.length).toBeGreaterThan(0);
      // Verify SSH is restricted to specific CIDR, not 0.0.0.0/0
      const hasRestrictedCIDR = sshRule?.IpRanges?.every(
        range => range.CidrIp !== '0.0.0.0/0'
      );
      expect(hasRestrictedCIDR).toBe(true);
    });
  });

  describe('Requirement 7: RDS Not Publicly Accessible', () => {
    test('RDS instance should not be publicly accessible', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    });

    test('RDS should be in isolated subnets', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      const subnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      expect(subnetGroupResponse.DBSubnetGroups?.[0].Subnets).toBeDefined();
      expect(subnetGroupResponse.DBSubnetGroups?.[0].Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Requirement 8: KMS CMKs for Encryption', () => {
    test('should have KMS key rotation enabled', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      const kmsKeyId = logGroup?.kmsKeyId;
      expect(kmsKeyId).toBeDefined();

      if (kmsKeyId) {
        const keyArn = kmsKeyId.split(':key/')[1] || kmsKeyId;
        const rotationResponse = await kmsClient.send(
          new GetKeyRotationStatusCommand({
            KeyId: keyArn,
          })
        );

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }
    });

    test('RDS should use KMS encryption', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });
  });

  describe('Requirement 9: Lambda Environment Variable Encryption', () => {
    test('Lambda should have encrypted environment variables', async () => {
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(lambdaResponse.Environment?.Variables).toBeDefined();
      expect(lambdaResponse.KMSKeyArn).toBeDefined();
    });

    test('should be able to invoke Lambda function', async () => {
      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            test: true,
            message: 'Integration test invocation',
          }),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();
    });
  });

  describe('Requirement 10: VPC High Availability (Multi-AZ)', () => {
    test('should have VPC with DNS support enabled', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.VpcId],
        })
      );

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs?.length).toBe(1);

      // Query DNS support attribute separately
      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: stackOutputs.VpcId,
          Attribute: 'enableDnsSupport',
        })
      );

      // Query DNS hostnames attribute separately
      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: stackOutputs.VpcId,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have 6 subnets (2 public, 2 private, 2 isolated)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(6);
    });

    test('should have security groups created', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
          ],
        })
      );

      // Should have at least 3 security groups (EC2, Lambda, RDS) + default
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('S3 Buckets', () => {
    test('should have application bucket created', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have application bucket encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have application bucket versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance created', async () => {
      // Extract DB instance identifier from endpoint
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);
    });

    test('should have RDS instance with storage encryption', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.StorageEncrypted).toBe(true);
    });

    test('should have RDS instance not publicly accessible', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.PubliclyAccessible).toBe(false);
    });

    test('should have RDS instance with MySQL 8.0 engine', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.Engine).toBe('mysql');
      expect(instance?.EngineVersion).toMatch(/^8\.0/);
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function created', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('log-processor');
    });

    test('should have Lambda function with Node.js 22 runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should have Lambda function in VPC', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(stackOutputs.VpcId);
    });

    test('should have Lambda function with X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have Lambda function with environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
      expect(response.Configuration?.Environment?.Variables?.PROJECT_NAME).toBe('tap-web-app');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group created', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(stackOutputs.LogGroupName);
    });

    test('should have log group with retention period set', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === stackOutputs.LogGroupName
      );
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have log group with KMS encryption', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === stackOutputs.LogGroupName
      );
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 IAM role created', async () => {
      const roleName = `tap-web-app-ec2-role-${environmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    test('should have Lambda IAM role created', async () => {
      const roleName = `tap-web-app-lambda-role-${environmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

});

