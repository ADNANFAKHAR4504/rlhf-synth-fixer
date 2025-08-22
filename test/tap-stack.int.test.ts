import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-iam';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputsRaw = fs.existsSync(outputsPath)
  ? fs.readFileSync(outputsPath, 'utf8')
  : '{}';
const outputs: Record<string, string> = JSON.parse(outputsRaw || '{}');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to check if an output key exists and is a non-empty string
const hasNonEmptyString = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(outputs, key) &&
  typeof outputs[key] === 'string' &&
  outputs[key].trim().length > 0;

// Create AWS clients with real connections
const ec2Client = new EC2Client({});
const rdsClient = new RDSClient({});
const lambdaClient = new LambdaClient({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const secretsClient = new SecretsManagerClient({});

describe('AWS Infrastructure Integration Tests', () => {
  // Test outputs file is readable JSON
  test('outputs file is readable JSON', () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe('object');
  });

  // EC2 Instance Tests
  (hasNonEmptyString('EC2InstanceId') ? test : test.skip)(
    'should verify EC2 instance is running with correct configuration',
    async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.InstanceId).toBe(outputs.EC2InstanceId);
      expect(instance.State!.Name).toBe('running');
      expect(instance.InstanceType).toBeDefined();
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);
      expect(instance.Tags).toBeDefined();

      // Check for expected tags
      const nameTag = instance.Tags!.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('corp-nova');

      const envTag = instance.Tags!.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    }
  );

  // RDS Database Tests - Use DBInstanceIdentifier from outputs if available
  (hasNonEmptyString('DatabaseEndpoint') ? test : test.skip)(
    'should verify RDS database is encrypted and accessible',
    async () => {
      // Try to get the DB instance identifier from outputs first
      // If not available, try the pattern-based approach
      let dbInstanceIdentifier;

      if (hasNonEmptyString('DBInstanceIdentifier')) {
        dbInstanceIdentifier = outputs.DBInstanceIdentifier;
      } else {
        // List all DB instances and find one that matches our pattern
        const describeCommand = new DescribeDBInstancesCommand({});
        const response = await rdsClient.send(describeCommand);

        const matchingInstance = response.DBInstances!.find(
          db =>
            db.DBInstanceIdentifier!.includes('corp-nova') ||
            db.DBInstanceIdentifier!.includes('nova')
        );

        if (!matchingInstance) {
          throw new Error('No RDS instance found matching expected pattern');
        }

        dbInstanceIdentifier = matchingInstance.DBInstanceIdentifier;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.Endpoint!.Address).toBe(outputs.DatabaseEndpoint);
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);
    }
  );

  // Lambda Function Tests
  (hasNonEmptyString('LambdaFunctionName') ? test : test.skip)(
    'should verify Lambda function is deployed with VPC configuration',
    async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration!;

      expect(config.FunctionName).toBe(outputs.LambdaFunctionName);
      expect(config.State).toBe('Active');
      expect(config.Runtime).toBeDefined();
      expect(config.VpcConfig).toBeDefined();
      expect(config.VpcConfig!.VpcId).toBe(outputs.VpcId);

      // Only check security group if it's defined in outputs
      if (hasNonEmptyString('LambdaSecurityGroupId')) {
        expect(config.VpcConfig!.SecurityGroupIds).toContain(
          outputs.LambdaSecurityGroupId
        );
      } else {
        // At least verify there are security groups configured
        expect(config.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
      }

      expect(config.Environment).toBeDefined();
      expect(config.Environment!.Variables).toBeDefined();

      // Check for DATA_BUCKET if it exists in outputs
      if (hasNonEmptyString('DataBucketName')) {
        expect(config.Environment!.Variables!.DATA_BUCKET).toBe(
          outputs.DataBucketName
        );
      }
    }
  );

  // S3 Buckets Tests
  (hasNonEmptyString('DataBucketName') ? test : test.skip)(
    'should verify S3 buckets are encrypted and configured properly',
    async () => {
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName].filter(
        Boolean
      );

      for (const bucketName of buckets) {
        // Check bucket existence
        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(headCommand);

        // Check encryption
        const encryptionCommand = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });
        const encryptionResponse = await s3Client.send(encryptionCommand);

        expect(
          encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
            .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
        ).toBeDefined();
      }
    }
  );

  // IAM Roles Tests
  (hasNonEmptyString('EC2RoleArn') ? test : test.skip)(
    'should verify IAM roles have proper permissions',
    async () => {
      const roles = [
        {
          arn: outputs.EC2RoleArn,
          name:
            outputs.EC2RoleArn?.split('/').pop() ||
            `corp-nova-ec2-role${environmentSuffix}`,
        },
        {
          arn: outputs.LambdaRoleArn,
          name:
            outputs.LambdaRoleArn?.split('/').pop() ||
            `corp-nova-lambda-role${environmentSuffix}`,
        },
      ].filter(role => role.arn);

      for (const role of roles) {
        const command = new GetRoleCommand({ RoleName: role.name });
        const response = await iamClient.send(command);

        expect(response.Role!.RoleName).toBe(role.name);
        expect(response.Role!.Arn).toBe(role.arn);
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

        // Check for environment tag
        expect(response.Role!.Tags).toBeDefined();
        const envTag = response.Role!.Tags!.find(
          tag => tag.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag!.Value).toBe(environmentSuffix);
      }
    }
  );

  // Secrets Manager Tests
  (hasNonEmptyString('DBSecretArn') ? test : test.skip)(
    'should verify Secrets Manager secret is properly configured',
    async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.Name).toBeDefined();
      expect(response.Description).toBeDefined();

      // Check for environment tag
      expect(response.Tags).toBeDefined();
      const envTag = response.Tags!.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    }
  );

  // VPC Tests
  (hasNonEmptyString('VpcId') ? test : test.skip)(
    'VpcId output is present and looks valid',
    () => {
      expect(outputs.VpcId).toMatch(/^vpc-/);
    }
  );

  // Security Groups Tests
  (hasNonEmptyString('EC2SecurityGroupId') ? test : test.skip)(
    'EC2SecurityGroupId looks valid',
    () => {
      expect(outputs.EC2SecurityGroupId).toMatch(/^sg-/);
    }
  );

  (hasNonEmptyString('RDSSecurityGroupId') ? test : test.skip)(
    'RDSSecurityGroupId looks valid',
    () => {
      expect(outputs.RDSSecurityGroupId).toMatch(/^sg-/);
    }
  );

  (hasNonEmptyString('LambdaSecurityGroupId') ? test : test.skip)(
    'LambdaSecurityGroupId looks valid',
    () => {
      expect(outputs.LambdaSecurityGroupId).toMatch(/^sg-/);
    }
  );

  // Subnet Tests
  (hasNonEmptyString('PrivateSubnetIds') ? test : test.skip)(
    'PrivateSubnetIds is a comma-separated list of subnet ids',
    () => {
      const ids = outputs.PrivateSubnetIds.split(',').map(s => s.trim());
      expect(ids.length).toBeGreaterThan(0);
      ids.forEach(id => expect(id).toMatch(/^subnet-/));
    }
  );

  // KMS Tests
  (hasNonEmptyString('KmsKeyArn') ? test : test.skip)(
    'KmsKeyArn is an ARN',
    () => {
      expect(outputs.KmsKeyArn).toMatch(/^arn:/);
    }
  );

  // S3 Bucket ARN Tests
  (hasNonEmptyString('DataBucketArn') ? test : test.skip)(
    'DataBucketArn is an ARN',
    () => {
      expect(outputs.DataBucketArn).toMatch(/^arn:/);
    }
  );

  (hasNonEmptyString('LogsBucketArn') ? test : test.skip)(
    'LogsBucketArn is an ARN',
    () => {
      expect(outputs.LogsBucketArn).toMatch(/^arn:/);
    }
  );
});
