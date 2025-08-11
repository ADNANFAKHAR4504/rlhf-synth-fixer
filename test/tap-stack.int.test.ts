import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { APIGatewayClient, GetStageCommand } from '@aws-sdk/client-api-gateway'; // FIX 1: Corrected case
import { SSMClient, GetPatchBaselineCommand } from '@aws-sdk/client-ssm';
import * as fs from 'fs';

// --- Test Configuration ---
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const apiGatewayClient = new APIGatewayClient({ region: REGION }); // FIX 1: Corrected case
const ssmClient = new SSMClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
// Assumes a CI/CD process has run `aws cloudformation describe-stacks` and saved outputs
let outputs: { [key: string]: string } = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs.json', 'utf8'));
} catch (error) {
  console.warn('cfn-outputs.json not found, skipping integration tests.');
}

const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('Secure Financial App Stack Integration Tests', () => {
  describe('🛡️ Core Security Requirements Verification', () => {
    test('S3 bucket should have AES256 server-side encryption enabled', async () => {
      const bucketName = outputs.ApplicationDataBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      // FIX 2: Safely handle potentially undefined properties
      const rules = response.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);

      const sseRule = rules![0];
      expect(sseRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('RDS instance should be encrypted with the correct KMS key', async () => {
      const dbInstanceIdentifier = outputs.RDSInstanceId; // Assuming RDSInstanceId is an output
      const kmsKeyId = outputs.KMSKeyId;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toContain(kmsKeyId);
    });

    test('CriticalOperationsRole should enforce MFA on assume role policy', async () => {
      const roleName = outputs.CriticalOperationsRoleName; // Assuming RoleName is an output
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
    });

    test('API Gateway stage should have logging enabled', async () => {
      const restApiId = outputs.ApiGatewayRestApiId; // Assuming these are outputs
      const stageName = outputs.ApiGatewayStageName;
      const command = new GetStageCommand({ restApiId, stageName });
      const response = await apiGatewayClient.send(command);

      expect(response.accessLogSettings).toBeDefined();
      expect(response.accessLogSettings?.destinationArn).toBeDefined();
      expect(response.methodSettings?.['*/*']?.loggingLevel).toBe('INFO');
    });

    test('EC2 instances should be deployed in a secure VPC', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].State).toBe('available');
    });
  });

  describe('🔧 Systems Manager Patch Management', () => {
    test('SSM Patch Baseline should be created and configured correctly', async () => {
      const baselineId = outputs.PatchBaselineId; // Assuming this is an output
      const command = new GetPatchBaselineCommand({ BaselineId: baselineId });
      const response = await ssmClient.send(command);

      expect(response.OperatingSystem).toBe('AMAZON_LINUX_2');
      const securityRule = response.ApprovalRules?.PatchRules?.find(r =>
        r.PatchFilterGroup?.PatchFilters?.some(f =>
          f.Values?.includes('Security')
        )
      );
      expect(securityRule).toBeDefined();
    });
  });
});
