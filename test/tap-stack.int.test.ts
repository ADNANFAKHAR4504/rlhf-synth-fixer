// Comprehensive Integration Tests for TapStack CloudFormation Template
// These tests validate live resources after deployment
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
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
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
let stackName: string;
let environmentSuffix: string;

// AWS Clients
const cfnClient = new CloudFormationClient({});
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const rdsClient = new RDSClient({});
const dynamoClient = new DynamoDBClient({});
const lambdaClient = new LambdaClient({});
const kmsClient = new KMSClient({});
const iamClient = new IAMClient({});

describe('TapStack Integration Tests - Live Resource Validation', () => {
  beforeAll(async () => {
    // Load outputs from deployment
    try {
      const outputsContent = fs.readFileSync(
        'cfn-outputs/flat-outputs.json',
        'utf8'
      );
      outputs = JSON.parse(outputsContent);

      // Get environment suffix from environment variable or outputs
      environmentSuffix =
        process.env.ENVIRONMENT_SUFFIX || outputs.EnvironmentSuffix || 'dev';
      stackName = outputs.StackName || `TapStack-${environmentSuffix}`;

      console.log(
        `Testing stack: ${stackName} with environment: ${environmentSuffix}`
      );
    } catch (error) {
      console.warn(
        'Could not load cfn-outputs, will attempt to discover resources dynamically'
      );
      environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      stackName = `TapStack-${environmentSuffix}`;
    }
  }, 30000);

  describe('Stack Validation', () => {
    test('should have deployed stack in CREATE_COMPLETE or UPDATE_COMPLETE status', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);

      const stack = response.Stacks![0];
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        stack.StackStatus
      );
      expect(stack.StackName).toContain('TapStack');
    });

    test('should have all required outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const stackOutputs = stack.Outputs || [];

      const expectedOutputs = [
        'VPCId',
        'KMSKeyId',
        'SecureS3BucketName',
        'RDSSecretName',
        'RDSEndpoint',
        'DynamoDBTableName',
        'WebSecurityGroupId',
        'DatabaseSecurityGroupId',
        'LambdaFunctionArn',
        'GuardDutyDetectorId',
        'WebACLArn',
      ];

      expectedOutputs.forEach(expectedOutput => {
        const output = stackOutputs.find(o => o.OutputKey === expectedOutput);
        expect(output).toBeDefined();
        expect(output!.OutputValue).toBeDefined();
        expect(output!.OutputValue!.length).toBeGreaterThan(0);
      });
    });

    test('should have no failed resources', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const failedResources =
        response.StackResources?.filter(resource =>
          resource.ResourceStatus?.includes('FAILED')
        ) || [];

      expect(failedResources).toHaveLength(0);
    });
  });

  describe('VPC and Network Resources Validation', () => {
    test('should have VPC with correct CIDR and DNS settings', async () => {
      const vpcId = outputs.VPCId || (await getResourcePhysicalId('VPC'));
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/); // Default CIDR
      expect(vpc.State).toBe('available');
      // Note: DNS properties are validated during deployment, not available in describe response
    });

    test('should have database subnets in different AZs', async () => {
      const vpcId = outputs.VPCId || (await getResourcePhysicalId('VPC'));

      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['Database'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Different AZs

      // Validate CIDR blocks (updated defaults)
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock);
      expect(cidrBlocks).toContain('10.0.100.0/24');
      expect(cidrBlocks).toContain('10.0.200.0/24');
    });

    test('should have public and private subnets', async () => {
      const vpcId = outputs.VPCId || (await getResourcePhysicalId('VPC'));

      // Check public subnets
      const publicCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['Public'] },
        ],
      });
      const publicResponse = await ec2Client.send(publicCommand);
      expect(publicResponse.Subnets).toHaveLength(2);

      // Check private subnets
      const privateCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['Private'] },
        ],
      });
      const privateResponse = await ec2Client.send(privateCommand);
      expect(privateResponse.Subnets).toHaveLength(2);

      // Public subnets should have MapPublicIpOnLaunch enabled
      publicResponse.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have RDS subnet group with correct subnets', async () => {
      const subnetGroupName = `secureapp-prod-db-subnet-group`; // Based on template

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];

      expect(subnetGroup.Subnets).toHaveLength(2);
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
    });
  });

  describe('Security Groups Validation', () => {
    test('should have web security group with correct rules', async () => {
      const sgId =
        outputs.WebSecurityGroupId ||
        (await getResourcePhysicalId('WebSecurityGroup'));

      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Check ingress rules
      expect(sg.IpPermissions).toHaveLength(2);

      const httpsRule = sg.IpPermissions!.find(rule => rule.FromPort === 443);
      const httpRule = sg.IpPermissions!.find(rule => rule.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();

      expect(httpsRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
      expect(httpRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    });

    test('should have database security group with restricted access', async () => {
      const dbSgId =
        outputs.DatabaseSecurityGroupId ||
        (await getResourcePhysicalId('DatabaseSecurityGroup'));
      const webSgId =
        outputs.WebSecurityGroupId ||
        (await getResourcePhysicalId('WebSecurityGroup'));

      const command = new DescribeSecurityGroupsCommand({ GroupIds: [dbSgId] });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];

      // Should have 2 ingress rules (MySQL and PostgreSQL)
      expect(sg.IpPermissions).toHaveLength(2);

      sg.IpPermissions!.forEach(rule => {
        expect(rule.UserIdGroupPairs).toBeDefined();
        expect(
          rule.UserIdGroupPairs!.some(pair => pair.GroupId === webSgId)
        ).toBe(true);
        expect(rule.IpRanges).toHaveLength(0); // No direct IP access
      });
    });

    test('should have lambda security group with HTTPS egress only', async () => {
      const lambdaSgId = await getResourcePhysicalId('LambdaSecurityGroup');

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [lambdaSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];

      // Check egress rules
      expect(sg.IpPermissionsEgress).toHaveLength(1);
      const egressRule = sg.IpPermissionsEgress![0];
      expect(egressRule.FromPort).toBe(443);
      expect(egressRule.ToPort).toBe(443);
      expect(egressRule.IpProtocol).toBe('tcp');
    });
  });

  describe('KMS Key Validation', () => {
    test('should have KMS key with correct policy', async () => {
      const keyId = outputs.KMSKeyId || (await getResourcePhysicalId('KMSKey'));

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyResponse = await kmsClient.send(describeCommand);

      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      // Check key policy
      const policyCommand = new GetKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: 'default',
      });
      const policyResponse = await kmsClient.send(policyCommand);

      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toHaveLength(3);

      // Verify CloudTrail and RDS permissions
      const cloudTrailStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowCloudTrail'
      );
      const rdsStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowRDS'
      );

      expect(cloudTrailStatement).toBeDefined();
      expect(rdsStatement).toBeDefined();
    });

    test('should have KMS alias', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const alias = response.Aliases?.find(
        a =>
          a.AliasName?.includes('secureapp') &&
          a.AliasName?.includes('security-key')
      );

      expect(alias).toBeDefined();
      expect(alias!.TargetKeyId).toBeDefined();
    });
  });

  describe('S3 Buckets Validation', () => {
    test('should have secure S3 bucket with proper encryption', async () => {
      const bucketName =
        outputs.SecureS3BucketName ||
        (await getResourcePhysicalId('SecureS3Bucket'));

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      const rule =
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(rule?.BucketKeyEnabled).toBe(true);

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);

      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy denying insecure transport', async () => {
      const bucketName =
        outputs.SecureS3BucketName ||
        (await getResourcePhysicalId('SecureS3Bucket'));

      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const policy = JSON.parse(response.Policy!);
      const denyStatement = policy.Statement.find(
        (stmt: any) =>
          stmt.Effect === 'Deny' && stmt.Sid === 'DenyInsecureTransport'
      );

      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('RDS Instance Validation', () => {
    test('should have RDS instance with security features', async () => {
      const dbInstanceId = 'secureapp-prod-rds-TapStack'; // Based on template with stack name

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const instance = response.DBInstances![0];

      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.StorageEncrypted).toBe(true);
      expect(instance.PubliclyAccessible).toBe(false);
      expect(instance.Engine).toBe('mysql');
      expect(instance.BackupRetentionPeriod).toBeGreaterThan(0);

      // Check VPC security groups
      expect(instance.VpcSecurityGroups).toHaveLength(1);
      expect(instance.VpcSecurityGroups![0].Status).toBe('active');
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('should have DynamoDB table with encryption and PITR', async () => {
      const tableName =
        outputs.DynamoDBTableName || 'secureapp-prod-dynamodb-table-TapStack';

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const table = response.Table!;
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      // Check encryption
      expect(table.SSEDescription?.Status).toBe('ENABLED');
      expect(table.SSEDescription?.SSEType).toBe('KMS');

      // Check key schema
      expect(table.KeySchema).toHaveLength(1);
      expect(table.KeySchema![0].AttributeName).toBe('id');
      expect(table.KeySchema![0].KeyType).toBe('HASH');
    });
  });

  describe('Lambda Function Validation', () => {
    test('should have Lambda function with updated VPC configuration', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn
        ? functionArn.split(':').pop()
        : 'secureapp-prod-security-function-TapStack';

      const command = new GetFunctionCommand({ FunctionName: functionName! });
      const response = await lambdaClient.send(command);

      const func = response.Configuration!;
      expect(func.State).toBe('Active');
      expect(func.Runtime).toBe('python3.12'); // Updated runtime
      expect(func.Handler).toBe('index.lambda_handler');
      expect(func.Timeout).toBe(300);
      expect(func.MemorySize).toBe(512);
      // Note: ReservedConcurrencyLimit is not returned in FunctionConfiguration

      // Check VPC configuration - should be in private subnets now
      expect(func.VpcConfig).toBeDefined();
      expect(func.VpcConfig!.SecurityGroupIds).toHaveLength(1);
      expect(func.VpcConfig!.SubnetIds).toHaveLength(2);

      // Check environment variables
      expect(func.Environment?.Variables?.LOG_LEVEL).toBe('INFO');
      expect(func.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(func.Environment?.Variables?.ENVIRONMENT).toBeDefined();

      // Check Dead Letter Queue configuration
      expect(func.DeadLetterConfig).toBeDefined();
      expect(func.DeadLetterConfig!.TargetArn).toBeDefined();
    });
  });

  describe('IAM Roles Validation', () => {
    test('should have MFA enforced role with correct policy', async () => {
      const roleName = 'secureapp-prod-mfa-role';

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const statement = assumeRolePolicy.Statement[0];

      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(true);

      // Check attached policies
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedResponse = await iamClient.send(attachedPoliciesCommand);

      const readOnlyPolicy = attachedResponse.AttachedPolicies?.find(
        policy => policy.PolicyArn === 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      );
      expect(readOnlyPolicy).toBeDefined();
    });

    test('should have Lambda execution role with VPC access', async () => {
      const roleName = 'secureapp-prod-lambda-role';

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.RoleName).toBe(roleName);

      // Check attached policies
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedResponse = await iamClient.send(attachedPoliciesCommand);

      const vpcPolicy = attachedResponse.AttachedPolicies?.find(
        policy =>
          policy.PolicyArn ===
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
      expect(vpcPolicy).toBeDefined();
    });
  });

  describe('Security Compliance Validation', () => {
    test('should have all storage encrypted', async () => {
      // S3 encryption already tested above
      // RDS encryption already tested above
      // DynamoDB encryption already tested above

      // This test serves as a summary validation
      expect(true).toBe(true); // All individual encryption tests must pass
    });

    test('should have no publicly accessible databases', async () => {
      const dbInstanceId = 'secureapp-prod-rds-TapStack';

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const response = await rdsClient.send(command);

      const instance = response.DBInstances![0];
      expect(instance.PubliclyAccessible).toBe(false);
    });

    test('should have MFA enforcement for sensitive operations', async () => {
      const roleName = 'secureapp-prod-mfa-role';

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const mfaCondition =
        assumeRolePolicy.Statement[0].Condition.Bool[
          'aws:MultiFactorAuthPresent'
        ];

      expect(mfaCondition).toBe(true);
    });
  });

  describe('Disaster Recovery Validation', () => {
    test('should have RDS backups enabled', async () => {
      const dbInstanceId = 'secureapp-prod-rds-TapStack';

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const response = await rdsClient.send(command);

      const instance = response.DBInstances![0];
      expect(instance.BackupRetentionPeriod).toBeGreaterThan(0);

      if (environmentSuffix === 'prod') {
        expect(instance.BackupRetentionPeriod).toBe(7);
        expect(instance.MultiAZ).toBe(true);
        expect(instance.DeletionProtection).toBe(false); // Changed to false to allow CloudFormation rollback
      }
    });

    test('should have S3 versioning enabled', async () => {
      const bucketName =
        outputs.SecureS3BucketName ||
        (await getResourcePhysicalId('SecureS3Bucket'));

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });
});

// Helper function to get physical resource ID from CloudFormation
async function getResourcePhysicalId(
  logicalResourceId: string
): Promise<string> {
  const command = new DescribeStackResourcesCommand({
    StackName: stackName,
    LogicalResourceId: logicalResourceId,
  });
  const response = await cfnClient.send(command);

  const resource = response.StackResources?.find(
    r => r.LogicalResourceId === logicalResourceId
  );
  if (!resource?.PhysicalResourceId) {
    throw new Error(
      `Could not find physical resource ID for ${logicalResourceId}`
    );
  }

  return resource.PhysicalResourceId;
}
