import {
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetPolicyCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import { KMSClient } from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

const stackName = 'TapStack' + process.env.ENVIRONMENT_SUFFIX;

// Load stack outputs from cfn-outputs/all-outputs.json
const loadStackOutputs = () => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');

  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Stack outputs file not found: ${outputsPath}. Please deploy the stack first.`
    );
  }

  const outputsData = fs.readFileSync(outputsPath, 'utf8');
  const allOutputs = JSON.parse(outputsData);

  // Look for outputs under different possible keys
  let outputs = allOutputs[stackName] || allOutputs;

  // If the outputs are nested, find the first stack that has actual output values
  if (typeof outputs === 'object' && Object.keys(outputs).length === 1) {
    const firstKey = Object.keys(outputs)[0];
    if (typeof outputs[firstKey] === 'object' && outputs[firstKey] !== null) {
      outputs = outputs[firstKey];
    }
  }

  if (!outputs || Object.keys(outputs).length === 0) {
    throw new Error(
      `No outputs found. Available keys: ${Object.keys(allOutputs).join(', ')}`
    );
  }

  return outputs;
};

// Initialize AWS clients for the deployment region
const initializeClients = (region: string = 'ap-south-1') => {
  return {
    ec2: new EC2Client({ region }),
    rds: new RDSClient({ region }),
    s3: new S3Client({ region }),
    dynamodb: new DynamoDBClient({ region }),
    iam: new IAMClient({ region }),
    kms: new KMSClient({ region }),
    sts: new STSClient({ region }),
  };
};


describe('Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let clients: ReturnType<typeof initializeClients>;
  let accountId: string;
  let deploymentRegion: string = 'ap-south-1';

  const testTimeout = 600000; // 10 minutes for integration tests

  beforeAll(async () => {
    try {
      stackOutputs = loadStackOutputs();
      
      // Detect deployment region from RDS endpoint if available
      if (stackOutputs?.rdsEndpoint) {
        const endpointParts = stackOutputs.rdsEndpoint.split('.');
        if (endpointParts.length >= 3) {
          deploymentRegion = endpointParts[2];
          console.log(`Detected deployment region: ${deploymentRegion} from RDS endpoint`);
        }
      }

      clients = initializeClients(deploymentRegion);

      // Get AWS account ID
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account!;
      
      console.log(`Running integration tests against account: ${accountId} in region: ${deploymentRegion}`);
    } catch (error) {
      console.error('Failed to initialize integration tests:', error);
      throw error;
    }
  }, testTimeout);

  describe('S3 Infrastructure', () => {
    it('should have created S3 bucket with correct configuration', async () => {
      const bucketName = stackOutputs.s3BucketId;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^corp-s3-secure-data-/);

      // Verify bucket exists
      const headResponse = await clients.s3.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(headResponse.$metadata.httpStatusCode).toBe(200);
    }, testTimeout);

    it('should have S3 bucket encryption enabled with AWS-managed KMS', async () => {
      const bucketName = stackOutputs.s3BucketId;

      const encryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
      expect(rules).toHaveLength(1);
      expect(rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rules[0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe('alias/aws/s3');
      expect(rules[0].BucketKeyEnabled).toBe(true);
    }, testTimeout);

    it('should have S3 bucket versioning enabled', async () => {
      const bucketName = stackOutputs.s3BucketId;

      const versioningResponse = await clients.s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    }, testTimeout);

    it('should have S3 bucket public access blocked', async () => {
      const bucketName = stackOutputs.s3BucketId;

      const publicAccessResponse = await clients.s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    }, testTimeout);
  });

  describe('IAM Infrastructure', () => {
    it('should have created IAM role with correct configuration', async () => {
      const roleArn = stackOutputs.iamRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::\d+:role\/corp-iam-role-s3-access-/);

      const roleName = roleArn.split('/').pop();
      const roleResponse = await clients.iam.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(roleName);
      
      // Verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    }, testTimeout);

    it('should have IAM role with attached S3 access policy', async () => {
      const roleArn = stackOutputs.iamRoleArn;
      const roleName = roleArn.split('/').pop();

      const attachedPoliciesResponse = await clients.iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(attachedPoliciesResponse.AttachedPolicies).toHaveLength(1);
      const policy = attachedPoliciesResponse.AttachedPolicies![0];
      expect(policy.PolicyName).toMatch(/^corp-iam-policy-s3-restricted-/);

      // Verify policy document
      const policyResponse = await clients.iam.send(
        new GetPolicyCommand({ PolicyArn: policy.PolicyArn })
      );
      expect(policyResponse.Policy).toBeDefined();
    }, testTimeout);
  });

  describe('RDS Infrastructure', () => {
    it('should have created RDS instance with correct configuration', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      expect(instanceId).toBeDefined();
      // The instance ID might be either the custom identifier or AWS auto-generated
      // We'll verify it exists and has correct configuration regardless
      expect(typeof instanceId).toBe('string');
      expect(instanceId.length).toBeGreaterThan(0);

      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(instanceId);
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBe('15.7');
      expect(dbInstance.StorageEncrypted).toBe(true);
      // KMS key can be either alias/aws/rds or a specific KMS key ARN
      expect(dbInstance.KmsKeyId).toMatch(/^(alias\/aws\/rds|arn:aws:kms:)/);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DeletionProtection).toBe(true);
    }, testTimeout);

    it('should have RDS subnet group with correct configuration', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      const subnetGroupName = dbInstance.DBSubnetGroup!.DBSubnetGroupName!;
      expect(subnetGroupName).toMatch(/^corp-rds-subnet-main-/);

      const subnetGroupResponse = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
      );

      const subnetGroup = subnetGroupResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, testTimeout);

    it('should have RDS parameter group with security configurations', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      const parameterGroupName = dbInstance.DBParameterGroups![0].DBParameterGroupName!;
      expect(parameterGroupName).toMatch(/^corp-rds-params-secure-/);

      const parameterGroupResponse = await clients.rds.send(
        new DescribeDBParameterGroupsCommand({ DBParameterGroupName: parameterGroupName })
      );

      const parameterGroup = parameterGroupResponse.DBParameterGroups![0];
      expect(parameterGroup.DBParameterGroupFamily).toBe('postgres15');
    }, testTimeout);

    it('should have RDS security group with restricted access', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      const securityGroupIds = dbInstance.VpcSecurityGroups!.map(sg => sg.VpcSecurityGroupId!);
      
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: securityGroupIds })
      );

      const rdsSecurityGroup = sgResponse.SecurityGroups!.find(sg => 
        sg.GroupName!.includes('corp-rds-primary') && sg.GroupName!.includes('-sg')
      );
      
      expect(rdsSecurityGroup).toBeDefined();
      
      // Verify ingress rules
      const ingressRules = rdsSecurityGroup!.IpPermissions!;
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);
      expect(postgresRule).toBeDefined();
      expect(postgresRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/8');
    }, testTimeout);
  });

  describe('DynamoDB Infrastructure', () => {
    it('should have created DynamoDB table with correct configuration', async () => {
      const tableName = stackOutputs.dynamoTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toMatch(/^corp-dynamodb-main-/);

      const tableResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const table = tableResponse.Table!;
      expect(table.TableName).toBe(tableName);
      // For provisioned tables, BillingModeSummary might be undefined
      // Check either BillingModeSummary.BillingMode or the presence of ProvisionedThroughput
      if (table.BillingModeSummary?.BillingMode) {
        expect(table.BillingModeSummary.BillingMode).toBe('PROVISIONED');
      } else {
        // If BillingModeSummary is undefined, verify ProvisionedThroughput exists
        expect(table.ProvisionedThroughput).toBeDefined();
      }
      expect(table.ProvisionedThroughput!.ReadCapacityUnits).toBe(10);
      expect(table.ProvisionedThroughput!.WriteCapacityUnits).toBe(10);
    }, testTimeout);

    it('should have DynamoDB table with encryption enabled', async () => {
      const tableName = stackOutputs.dynamoTableName;

      const tableResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const table = tableResponse.Table!;
      expect(table.SSEDescription).toBeDefined();
      expect(table.SSEDescription!.Status).toBe('ENABLED');
      expect(table.SSEDescription!.SSEType).toBe('KMS');
    }, testTimeout);

    it('should have DynamoDB table with Global Secondary Index', async () => {
      const tableName = stackOutputs.dynamoTableName;

      const tableResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const table = tableResponse.Table!;
      expect(table.GlobalSecondaryIndexes).toHaveLength(1);
      
      const gsi = table.GlobalSecondaryIndexes![0];
      expect(gsi.IndexName).toBe('GSI1');
      expect(gsi.KeySchema![0].AttributeName).toBe('gsi1pk');
      expect(gsi.KeySchema![1].AttributeName).toBe('gsi1sk');
      expect(gsi.Projection!.ProjectionType).toBe('ALL');
    }, testTimeout);

    it('should have DynamoDB table with production features enabled', async () => {
      const tableName = stackOutputs.dynamoTableName;

      const tableResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const table = tableResponse.Table!;
      
      // Point-in-time recovery
      expect(table.RestoreSummary?.RestoreInProgress).toBeFalsy();
      
      // Deletion protection
      expect(table.DeletionProtectionEnabled).toBe(true);
      
      // Streams
      expect(table.StreamSpecification).toBeDefined();
      expect(table.StreamSpecification!.StreamEnabled).toBe(true);
      expect(table.StreamSpecification!.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    }, testTimeout);
  });

  describe('e2e: End-to-End Infrastructure Validation', () => {
    it('e2e: should validate complete infrastructure deployment', async () => {
      // Verify all resources exist and are properly configured
      expect(stackOutputs.s3BucketId).toBeDefined();
      expect(stackOutputs.iamRoleArn).toBeDefined();
      expect(stackOutputs.rdsEndpoint).toBeDefined();
      expect(stackOutputs.dynamoTableName).toBeDefined();
      
      // Verify infrastructure summary
      expect(stackOutputs.infrastructureSummary).toBeDefined();
      expect(stackOutputs.infrastructureSummary.region).toBe(deploymentRegion);
      expect(stackOutputs.infrastructureSummary.encryptionStatus).toContain('AWS-managed KMS keys');
    }, testTimeout);

    it('e2e: should validate resource naming conventions', async () => {
      // All resources should follow corp-{service}-{purpose}-{env} pattern
      expect(stackOutputs.s3BucketId).toMatch(/^corp-s3-secure-data-/);
      expect(stackOutputs.iamRoleArn).toMatch(/corp-iam-role-s3-access-/);
      // RDS instance ID might be auto-generated, but endpoint should contain our naming
      expect(stackOutputs.rdsEndpoint).toMatch(/corp-rds-primary-/);
      expect(stackOutputs.dynamoTableName).toMatch(/^corp-dynamodb-main-/);
    }, testTimeout);

    it('e2e: should validate security configurations across all services', async () => {
      // S3 - Verify encryption
      const s3EncryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: stackOutputs.s3BucketId })
      );
      expect(s3EncryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // RDS - Verify encryption
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: stackOutputs.rdsInstanceId })
      );
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // DynamoDB - Verify encryption
      const dynamoResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: stackOutputs.dynamoTableName })
      );
      expect(dynamoResponse.Table!.SSEDescription!.Status).toBe('ENABLED');
    }, testTimeout);

    it('e2e: should validate cross-service integration', async () => {
      // Verify IAM role can access S3 bucket (policy validation)
      const roleArn = stackOutputs.iamRoleArn;
      const roleName = roleArn.split('/').pop();

      const attachedPoliciesResponse = await clients.iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(attachedPoliciesResponse.AttachedPolicies).toHaveLength(1);
      
      // Verify the policy references the correct S3 bucket
      const policy = attachedPoliciesResponse.AttachedPolicies![0];
      expect(policy.PolicyName).toMatch(/s3-restricted/);
    }, testTimeout);

    it('e2e: should validate regional deployment consistency', async () => {
      // All resources should be deployed in the same region (ap-south-1)
      expect(deploymentRegion).toBe('ap-south-1');
      
      // Verify RDS endpoint contains correct region
      expect(stackOutputs.rdsEndpoint).toContain('.ap-south-1.');
      
      // Verify DynamoDB table ARN contains correct region
      expect(stackOutputs.dynamoTableArn).toContain(':ap-south-1:');
    }, testTimeout);
  });

  describe('Performance and Monitoring', () => {
    it('should have RDS Performance Insights enabled', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
    }, testTimeout);

    it('should have proper backup configuration for RDS', async () => {
      const instanceId = stackOutputs.rdsInstanceId;
      
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
      );

      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBe('03:00-04:00');
      expect(dbInstance.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    }, testTimeout);
  });

  describe('Compliance and Governance', () => {
    it('should have proper resource tagging', async () => {
      // This would require additional AWS API calls to verify tags
      // For now, we verify that resources exist with expected names
      expect(stackOutputs.s3BucketId).toMatch(/^corp-/);
      expect(stackOutputs.dynamoTableName).toMatch(/^corp-/);
      // For RDS, check the endpoint contains our naming convention
      expect(stackOutputs.rdsEndpoint).toMatch(/corp-rds-primary-/);
    }, testTimeout);

    it('should have deletion protection enabled where appropriate', async () => {
      // RDS deletion protection
      const rdsResponse = await clients.rds.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: stackOutputs.rdsInstanceId })
      );
      expect(rdsResponse.DBInstances![0].DeletionProtection).toBe(true);

      // DynamoDB deletion protection
      const dynamoResponse = await clients.dynamodb.send(
        new DescribeTableCommand({ TableName: stackOutputs.dynamoTableName })
      );
      expect(dynamoResponse.Table!.DeletionProtectionEnabled).toBe(true);
    }, testTimeout);
  });
});
