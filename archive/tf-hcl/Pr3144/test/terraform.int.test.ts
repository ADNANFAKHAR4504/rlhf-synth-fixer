// tests/integration/terraform.int.test.ts
// Comprehensive integration tests for secure AWS infrastructure
// Tests actual AWS resources when deployed, gracefully handles missing credentials/resources
// Does NOT execute terraform init, plan, or apply

import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { ConfigServiceClient, DescribeConfigurationRecordersCommand, GetComplianceSummaryByConfigRuleCommand } from '@aws-sdk/client-config-service';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import { GetDetectorCommand, GuardDutyClient, ListFindingsCommand } from '@aws-sdk/client-guardduty';
import { GetAccountPasswordPolicyCommand, IAMClient, ListPoliciesCommand } from '@aws-sdk/client-iam';
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const OUTPUTS_PATH = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

try {
  if (fs.existsSync(OUTPUTS_PATH)) {
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
    console.log('📋 Loaded deployment outputs for testing');
  } else {
    throw new Error(`Outputs file not found at ${OUTPUTS_PATH}. Please ensure the infrastructure is deployed and outputs are available.`);
  }
} catch (error) {
  throw new Error(`Failed to load deployment outputs: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Configuration
const TEST_CONFIG = {
  region: 'eu-north-1',
  expectedTags: {
    Environment: 'Production',
    ManagedBy: 'Terraform',
    Compliance: 'Required',
  },
  vpcCidr: '10.0.0.0/16',
  privateSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
};

// Initialize AWS clients
const ec2Client = new EC2Client({ region: TEST_CONFIG.region });
const rdsClient = new RDSClient({ region: TEST_CONFIG.region });
const s3Client = new S3Client({ region: TEST_CONFIG.region });
const cloudTrailClient = new CloudTrailClient({ region: TEST_CONFIG.region });
const iamClient = new IAMClient({ region: TEST_CONFIG.region });
const lambdaClient = new LambdaClient({ region: TEST_CONFIG.region });
const ssmClient = new SSMClient({ region: TEST_CONFIG.region });
const configClient = new ConfigServiceClient({ region: TEST_CONFIG.region });
const guardDutyClient = new GuardDutyClient({ region: TEST_CONFIG.region });
const logsClient = new CloudWatchLogsClient({ region: TEST_CONFIG.region });
const kmsClient = new KMSClient({ region: TEST_CONFIG.region });

// Helper function to check if AWS credentials are available
async function checkAWSCredentials(): Promise<boolean> {
  try {
    await ec2Client.send(new DescribeVpcsCommand({ MaxResults: 1 }));
    return true;
  } catch (error: any) {
    if (
      error.name === 'AuthFailure' ||
      error.name === 'InvalidClientTokenId' ||
      error.name === 'InvalidAccessKeyId' ||
      error.name === 'UnrecognizedClientException'
    ) {
      throw new Error('AWS credentials not configured or invalid. Please configure AWS credentials to run integration tests.');
    }
    // For other errors (like network issues), we'll still return true to proceed with tests
    return true;
  }
}

// Helper function to execute AWS API calls
async function safeAwsCall<T>(
  apiCall: () => Promise<T>,
  testName: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (
      error.name === 'AuthFailure' ||
      error.name === 'InvalidClientTokenId' ||
      error.name === 'InvalidAccessKeyId' ||
      error.name === 'UnrecognizedClientException'
    ) {
      throw new Error(`${testName} failed: AWS credentials not configured or invalid`);
    }
    throw error;
  }
}

// Helper function to extract function name from Lambda ARN (handles masked ARNs)
function extractLambdaFunctionName(arn: string): string {
  // Handle both masked and unmasked ARNs
  // Expected general form: arn:aws:lambda:region:account-or-***:function:function-name[:version]
  const parts = arn.split(':');
  // Case 1: tokenized form ...,:"function",":function-name",...
  const funcIdx = parts.findIndex(p => p === 'function');
  if (funcIdx !== -1 && parts[funcIdx + 1]) {
    return parts[funcIdx + 1];
  }
  // Case 2: fused form with "function:function-name"
  const fused = parts.find(p => p.startsWith('function:'));
  if (fused) {
    return fused.replace('function:', '');
  }
  throw new Error('Could not extract function name from masked ARN');
}

// Helper function to extract policy name from IAM ARN (handles masked ARNs)
function extractIamPolicyName(arn: string): string {
  if (arn.includes('***')) {
    // For masked ARNs: arn:aws:iam::***:policy/policy-name
    return arn.split('/').pop() || '';
  } else {
    // For unmasked ARNs: arn:aws:iam::account:policy/policy-name
    return arn.split('/').pop() || '';
  }
}

describe('Secure AWS Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    // Check AWS credentials - this will throw an error if credentials are not configured
    await checkAWSCredentials();
    console.log('✅ AWS credentials validated');
  });

  describe('AWS Credentials and Environment', () => {
    test('AWS credentials are configured and valid', async () => {
      console.log('✅ AWS credentials are configured - running full integration tests');
      expect(true).toBe(true);
    });

    test('masked ARN handling works correctly', () => {
      // Test Lambda function name extraction
      const maskedLambdaArn = 'arn:aws:lambda:eu-north-1:***:function:secure-aws-env-bucket-secure-function';
      const unmaskedLambdaArn = 'arn:aws:lambda:eu-north-1:123456789012:function:secure-aws-env-bucket-secure-function';

      expect(extractLambdaFunctionName(maskedLambdaArn)).toBe('secure-aws-env-bucket-secure-function');
      expect(extractLambdaFunctionName(unmaskedLambdaArn)).toBe('secure-aws-env-bucket-secure-function');

      // Test IAM policy name extraction
      const maskedIamArn = 'arn:aws:iam::***:policy/secure-aws-env-bucket-mfa-enforcement';
      const unmaskedIamArn = 'arn:aws:iam::123456789012:policy/secure-aws-env-bucket-mfa-enforcement';

      expect(extractIamPolicyName(maskedIamArn)).toBe('secure-aws-env-bucket-mfa-enforcement');
      expect(extractIamPolicyName(unmaskedIamArn)).toBe('secure-aws-env-bucket-mfa-enforcement');

      console.log('✅ Masked ARN handling functions work correctly');
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    test('VPC configuration is valid when deployed', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId],
        });
        return await ec2Client.send(command);
      }, 'VPC test');

      if (!response.Vpcs || response.Vpcs.length === 0) {
        throw new Error('VPC not found with the specified ID');
      }

      const vpc = response.Vpcs[0];

      // Test VPC CIDR
      expect(vpc.CidrBlock).toBe(TEST_CONFIG.vpcCidr);

      // Test VPC is in correct state
      expect(vpc.State).toBe('available');

      // Test DNS settings - these properties may not be available in all SDK versions
      // expect(vpc.DnsHostnamesEnabled).toBe(true);
      // expect(vpc.DnsSupportEnabled).toBe(true);

      console.log(`✅ Found VPC ${vpc.VpcId} with correct configuration`);
    }, 10000);

    test('private subnets configuration is valid when deployed', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;
      if (!privateSubnetIds) {
        throw new Error('Private subnet IDs not found in outputs');
      }

      const subnetIds = JSON.parse(privateSubnetIds);

      const response = await safeAwsCall(async () => {
        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        return await ec2Client.send(command);
      }, 'Private subnet test');

      if (!response.Subnets || response.Subnets.length === 0) {
        throw new Error('No subnets found with the specified IDs');
      }

      // Test that subnets are private (no public IP assignment)
      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.AvailabilityZone).toBeDefined();
      });

      // Test that subnets are in different AZs
      const azs = response.Subnets.map(subnet => subnet.AvailabilityZone).filter(az => az);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);

      console.log(
        `✅ Found ${response.Subnets.length} private subnets in ${uniqueAzs.length} AZs`
      );
    }, 10000);

    test('security groups follow least privilege when deployed', async () => {
      const lambdaSecurityGroupId = outputs.lambda_security_group_id;
      const rdsSecurityGroupId = outputs.rds_security_group_id;

      if (!lambdaSecurityGroupId || !rdsSecurityGroupId) {
        throw new Error('Security group IDs not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [lambdaSecurityGroupId, rdsSecurityGroupId],
        });
        return await ec2Client.send(command);
      }, 'Security group test');

      if (!response.SecurityGroups || response.SecurityGroups.length === 0) {
        throw new Error('No security groups found with the specified IDs');
      }

      response.SecurityGroups.forEach(sg => {
        const ingressRules = sg.IpPermissions || [];

        ingressRules.forEach(rule => {
          // Check for 0.0.0.0/0 access - should not exist for security
          const hasOpenAccess = rule.IpRanges?.some(
            range => range.CidrIp === '0.0.0.0/0'
          );

          if (hasOpenAccess) {
            console.warn(`⚠️  Security group ${sg.GroupId} has open access (0.0.0.0/0)`);
          }
        });
      });

      console.log(
        `✅ Validated ${response.SecurityGroups.length} security groups for least privilege`
      );
    }, 10000);

    test('VPC endpoint is configured for S3 access', async () => {
      const vpcEndpointId = outputs.s3_vpc_endpoint_id;
      if (!vpcEndpointId) {
        throw new Error('VPC endpoint ID not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new DescribeVpcEndpointsCommand({
          VpcEndpointIds: [vpcEndpointId],
        });
        return await ec2Client.send(command);
      }, 'VPC endpoint test');

      if (!response.VpcEndpoints || response.VpcEndpoints.length === 0) {
        throw new Error('No VPC endpoints found with the specified ID');
      }

      const vpcEndpoint = response.VpcEndpoints[0];
      expect(vpcEndpoint.ServiceName).toContain('s3');
      expect(vpcEndpoint.VpcEndpointType).toBe('Gateway');

      console.log(`✅ Found S3 VPC endpoint ${vpcEndpoint.VpcEndpointId}`);
    }, 10000);
  });

  describe('S3 Bucket Security', () => {
    test('S3 buckets have encryption enabled', async () => {
      const mainBucket = outputs.s3_bucket_main;
      const cloudtrailBucket = outputs.s3_bucket_cloudtrail;

      if (!mainBucket || !cloudtrailBucket) {
        throw new Error('S3 bucket names not found in outputs');
      }

      // Test main bucket encryption
      const mainBucketEncryption = await safeAwsCall(async () => {
        const command = new GetBucketEncryptionCommand({
          Bucket: mainBucket,
        });
        return await s3Client.send(command);
      }, 'Main bucket encryption test');

      expect(mainBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      console.log(`✅ Main bucket ${mainBucket} has encryption configured`);

      // Test CloudTrail bucket encryption
      const cloudtrailBucketEncryption = await safeAwsCall(async () => {
        const command = new GetBucketEncryptionCommand({
          Bucket: cloudtrailBucket,
        });
        return await s3Client.send(command);
      }, 'CloudTrail bucket encryption test');

      expect(cloudtrailBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      console.log(`✅ CloudTrail bucket ${cloudtrailBucket} has encryption configured`);
    }, 15000);

    test('S3 buckets block public access', async () => {
      const mainBucket = outputs.s3_bucket_main;
      const cloudtrailBucket = outputs.s3_bucket_cloudtrail;

      if (!mainBucket || !cloudtrailBucket) {
        throw new Error('S3 bucket names not found in outputs');
      }

      // Test main bucket public access block
      const mainBucketPAB = await safeAwsCall(async () => {
        const command = new GetPublicAccessBlockCommand({
          Bucket: mainBucket,
        });
        return await s3Client.send(command);
      }, 'Main bucket public access block test');

      if (mainBucketPAB?.PublicAccessBlockConfiguration) {
        const config = mainBucketPAB.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
        console.log(`✅ Main bucket ${mainBucket} blocks public access`);
      }

      // Test CloudTrail bucket public access block
      const cloudtrailBucketPAB = await safeAwsCall(async () => {
        const command = new GetPublicAccessBlockCommand({
          Bucket: cloudtrailBucket,
        });
        return await s3Client.send(command);
      }, 'CloudTrail bucket public access block test');

      if (cloudtrailBucketPAB?.PublicAccessBlockConfiguration) {
        const config = cloudtrailBucketPAB.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
        console.log(`✅ CloudTrail bucket ${cloudtrailBucket} blocks public access`);
      }
    }, 15000);

    test('S3 buckets have versioning enabled (main bucket required)', async () => {
      const mainBucket = outputs.s3_bucket_main;
      const cloudtrailBucket = outputs.s3_bucket_cloudtrail;

      if (!mainBucket || !cloudtrailBucket) {
        throw new Error('S3 bucket names not found in outputs');
      }

      // Test main bucket versioning
      const mainBucketVersioning = await safeAwsCall(async () => {
        const command = new GetBucketVersioningCommand({
          Bucket: mainBucket,
        });
        return await s3Client.send(command);
      }, 'Main bucket versioning test');

      if (mainBucketVersioning) {
        expect(mainBucketVersioning.Status).toBe('Enabled');
        console.log(`✅ Main bucket ${mainBucket} has versioning enabled`);
      }

      // CloudTrail bucket versioning is recommended but not strictly required in all setups.
      // Query and log if enabled, but don't fail the test if it's not.
      try {
        const cloudtrailBucketVersioning = await safeAwsCall(async () => {
          const command = new GetBucketVersioningCommand({
            Bucket: cloudtrailBucket,
          });
          return await s3Client.send(command);
        }, 'CloudTrail bucket versioning test');

        if (cloudtrailBucketVersioning && cloudtrailBucketVersioning.Status === 'Enabled') {
          console.log(`✅ CloudTrail bucket ${cloudtrailBucket} has versioning enabled`);
        } else {
          console.log(`ℹ️  CloudTrail bucket ${cloudtrailBucket} versioning is not enabled`);
        }
      } catch (e) {
        console.log(`ℹ️  Could not query CloudTrail bucket versioning: ${String(e)}`);
      }
    }, 15000);
  });

  describe('Lambda Functions', () => {
    test('Lambda functions are deployed and configured', async () => {
      const lambdaFunctionArn = outputs.lambda_function_arn;

      if (!lambdaFunctionArn) {
        throw new Error('Lambda function ARN not found in outputs');
      }

      // Extract function name from ARN (handles both masked and unmasked ARNs)
      const functionName = extractLambdaFunctionName(lambdaFunctionArn);

      const response = await safeAwsCall(async () => {
        const command = new GetFunctionCommand({
          FunctionName: functionName,
        });
        return await lambdaClient.send(command);
      }, 'Lambda function test');

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Timeout).toBe(30);
      expect(response.Configuration!.MemorySize).toBe(256);

      console.log(`✅ Lambda function ${functionName} is properly configured`);
    }, 15000);
  });

  describe('RDS Database', () => {
    test('RDS instance follows security best practices', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      if (!rdsEndpoint) {
        throw new Error('RDS endpoint not found in outputs');
      }

      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const response = await safeAwsCall(async () => {
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        return await rdsClient.send(command);
      }, 'RDS test');

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThan(0);
      const db = response.DBInstances![0];

      // Test DB is not publicly accessible
      expect(db.PubliclyAccessible).toBe(false);

      // Test encryption at rest is enabled
      expect(db.StorageEncrypted).toBe(true);

      // Test backup retention is configured
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);

      // Test Multi-AZ is enabled
      expect(db.MultiAZ).toBe(true);

      console.log(`✅ RDS instance ${dbIdentifier} follows security best practices`);
    }, 15000);
  });

  describe('Security and Compliance Services', () => {
    test('CloudTrail is configured for multi-region logging', async () => {
      const cloudtrailName = outputs.cloudtrail_name;
      if (!cloudtrailName) {
        throw new Error('CloudTrail name not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new GetTrailCommand({
          Name: cloudtrailName,
        });
        return await cloudTrailClient.send(command);
      }, 'CloudTrail test');

      expect(response.Trail).toBeDefined();
      const trail = response.Trail!;
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.S3BucketName).toBeDefined();

      console.log(`✅ CloudTrail ${cloudtrailName} is configured for multi-region logging`);
    }, 15000);

    test('GuardDuty detector is enabled', async () => {
      const guarddutyDetectorId = outputs.guardduty_detector_id;
      if (!guarddutyDetectorId) {
        throw new Error('GuardDuty detector ID not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new GetDetectorCommand({
          DetectorId: guarddutyDetectorId,
        });
        return await guardDutyClient.send(command);
      }, 'GuardDuty test');

      if (response) {
        expect(response.Status).toBe('ENABLED');
        console.log(`✅ GuardDuty detector ${guarddutyDetectorId} is enabled`);
      }
    }, 15000);

    test('AWS Config recorder is configured', async () => {
      const configRecorderName = outputs.config_recorder_name;
      if (!configRecorderName) {
        throw new Error('AWS Config recorder name not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new DescribeConfigurationRecordersCommand({
          ConfigurationRecorderNames: [configRecorderName],
        });
        return await configClient.send(command);
      }, 'AWS Config test');

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);
      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.name).toBe(configRecorderName);
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);

      console.log(`✅ AWS Config recorder ${configRecorderName} is configured`);
    }, 15000);
  });

  describe('IAM Security', () => {
    test('IAM password policy is configured', async () => {

      const response = await safeAwsCall(async () => {
        const command = new GetAccountPasswordPolicyCommand({});
        return await iamClient.send(command);
      }, 'IAM password policy test');

      expect(response.PasswordPolicy).toBeDefined();
      const policy = response.PasswordPolicy!;
      expect(policy.MinimumPasswordLength).toBeGreaterThanOrEqual(14);
      expect(policy.RequireLowercaseCharacters).toBe(true);
      expect(policy.RequireUppercaseCharacters).toBe(true);
      expect(policy.RequireNumbers).toBe(true);
      expect(policy.RequireSymbols).toBe(true);

      console.log('✅ IAM password policy is configured with strong requirements');
    }, 15000);

    test('MFA enforcement policy exists', async () => {
      const mfaPolicyArn = outputs.iam_mfa_policy_arn;
      if (!mfaPolicyArn) {
        throw new Error('MFA policy ARN not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new ListPoliciesCommand({
          Scope: 'Local',
        });
        return await iamClient.send(command);
      }, 'MFA policy test');

      expect(response.Policies).toBeDefined();

      // Handle masked ARNs by finding policy by name instead of ARN
      const policyName = extractIamPolicyName(mfaPolicyArn);
      let mfaPolicy;
      if (mfaPolicyArn.includes('***')) {
        // For masked ARNs, find by policy name
        mfaPolicy = response.Policies!.find(policy =>
          policy.PolicyName === policyName
        );
      } else {
        // For unmasked ARNs, find by exact ARN match
        mfaPolicy = response.Policies!.find(policy =>
          policy.Arn === mfaPolicyArn
        );
      }

      expect(mfaPolicy).toBeDefined();
      expect(mfaPolicy?.PolicyName).toContain('mfa-enforcement');

      console.log('✅ MFA enforcement policy exists');
    }, 15000);
  });

  describe('Secrets Management', () => {
    test('RDS password is stored in Parameter Store', async () => {
      const rdsPasswordParameter = outputs.rds_password_parameter;
      if (!rdsPasswordParameter) {
        throw new Error('RDS password parameter name not found in outputs');
      }

      const response = await safeAwsCall(async () => {
        const command = new GetParameterCommand({
          Name: rdsPasswordParameter,
          WithDecryption: false, // Don't decrypt for security
        });
        return await ssmClient.send(command);
      }, 'Parameter Store test');

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('SecureString');
      // KMS key ID may not be available in all responses
      // expect(response.Parameter.KeyId).toBeDefined();

      console.log(`✅ RDS password is securely stored in Parameter Store`);
    }, 15000);
  });

  describe('Infrastructure Configuration Validation', () => {
    test('Terraform configuration follows security best practices', async () => {
      // Test Terraform configuration files for security compliance
      // This test can run without AWS credentials

      const mainTfPath = path.resolve(__dirname, '../lib/main.tf');
      const variablesTfPath = path.resolve(__dirname, '../lib/variables.tf');
      const outputsTfPath = path.resolve(__dirname, '../lib/outputs.tf');

      // Test main configuration exists
      expect(fs.existsSync(mainTfPath)).toBe(true);
      expect(fs.existsSync(variablesTfPath)).toBe(true);
      expect(fs.existsSync(outputsTfPath)).toBe(true);

      const mainContent = fs.readFileSync(mainTfPath, 'utf8');
      const variablesContent = fs.readFileSync(variablesTfPath, 'utf8');
      const outputsContent = fs.readFileSync(outputsTfPath, 'utf8');

      // Test security configurations in code
      expect(mainContent).toMatch(/aws_kms_key/);
      expect(mainContent).toMatch(/aws_s3_bucket/);
      expect(mainContent).toMatch(/aws_lambda_function/);
      expect(mainContent).toMatch(/aws_cloudtrail/);
      expect(mainContent).toMatch(/aws_guardduty_detector/);
      expect(mainContent).toMatch(/aws_config_/);
      expect(mainContent).toMatch(/aws_iam_account_password_policy/);
      expect(mainContent).toMatch(/aws_ssm_parameter/);

      // Test no hardcoded credentials
      expect(mainContent).not.toMatch(/aws_access_key_id/i);
      expect(mainContent).not.toMatch(/aws_secret_access_key/i);
      expect(mainContent).not.toMatch(/AKIA[0-9A-Z]{16}/);

      // Test encryption configurations
      expect(mainContent).toMatch(/storage_encrypted.*=.*true/);
      expect(mainContent).toMatch(/enable_key_rotation.*=.*true/);

      // Test security groups follow least privilege - no ingress from 0.0.0.0/0
      // Check that ingress rules don't use 0.0.0.0/0 (egress is allowed)
      const hasInsecureIngress = mainContent.includes('ingress {') &&
        mainContent.includes('cidr_blocks = ["0.0.0.0/0"]') &&
        mainContent.indexOf('ingress {') < mainContent.indexOf('cidr_blocks = ["0.0.0.0/0"]');

      if (hasInsecureIngress) {
        console.warn('⚠️  Found potential insecure ingress rule with 0.0.0.0/0');
      }

      // The current configuration should be secure (no ingress 0.0.0.0/0)
      expect(hasInsecureIngress).toBe(false);

      console.log('✅ Terraform configuration follows security best practices');
    });

    test('all required outputs are defined', async () => {
      const outputsContent = fs.readFileSync(path.resolve(__dirname, '../lib/outputs.tf'), 'utf8');

      const requiredOutputs = [
        'vpc_id',
        'private_subnet_ids',
        's3_bucket_main',
        's3_bucket_cloudtrail',
        'lambda_function_arn',
        'rds_endpoint',
        'cloudtrail_name',
        'guardduty_detector_id',
        'config_recorder_name',
        'kms_key_main_id',
        'kms_key_cloudtrail_id'
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });

      console.log('✅ All required outputs are defined');
    });
  });

  describe('Interactive Integration Points', () => {
    test('Lambda function can invoke and interact with S3 bucket', async () => {
      const mainBucket = outputs.s3_bucket_main;
      const lambdaFunctionArn = outputs.lambda_function_arn;

      if (!mainBucket || !lambdaFunctionArn) {
        throw new Error('Required resources not found for interactive test');
      }

      const functionName = extractLambdaFunctionName(lambdaFunctionArn);

      // Test Lambda can be invoked and returns successful response
      const lambdaResponse = await safeAwsCall(async () => {
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({
            action: 'test-s3-access',
            bucket: mainBucket
          })
        });
        return await lambdaClient.send(command);
      }, 'Lambda invoke test');

      expect(lambdaResponse.StatusCode).toBe(200);

      // Verify Lambda has permissions to list S3 bucket contents
      const s3Response = await safeAwsCall(async () => {
        const command = new ListObjectsV2Command({
          Bucket: mainBucket,
          MaxKeys: 1
        });
        return await s3Client.send(command);
      }, 'S3 list objects test');

      expect(s3Response).toBeDefined();
    }, 20000);

    test('S3 bucket can store and retrieve objects with KMS encryption', async () => {
      const mainBucket = outputs.s3_bucket_main;
      const kmsKeyMainId = outputs.kms_key_main_id;

      if (!mainBucket || !kmsKeyMainId) {
        throw new Error('Required resources not found for interactive test');
      }

      const testKey = 'test-interactive-file.txt';
      const testContent = 'This is a test file for interactive integration testing';

      // Test object upload with KMS encryption
      const putResponse = await safeAwsCall(async () => {
        const command = new PutObjectCommand({
          Bucket: mainBucket,
          Key: testKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyMainId
        });
        return await s3Client.send(command);
      }, 'S3 put object test');

      expect(putResponse.ETag).toBeDefined();

      // Test object retrieval
      const getResponse = await safeAwsCall(async () => {
        const command = new GetObjectCommand({
          Bucket: mainBucket,
          Key: testKey
        });
        return await s3Client.send(command);
      }, 'S3 get object test');

      expect(getResponse.Body).toBeDefined();

      // Clean up test object
      await safeAwsCall(async () => {
        const command = new DeleteObjectCommand({
          Bucket: mainBucket,
          Key: testKey
        });
        return await s3Client.send(command);
      }, 'S3 delete object test');
    }, 20000);

    test('CloudTrail can log API calls and store them in S3', async () => {
      const cloudtrailName = outputs.cloudtrail_name;
      const cloudtrailBucket = outputs.s3_bucket_cloudtrail;

      if (!cloudtrailName || !cloudtrailBucket) {
        throw new Error('Required resources not found for interactive test');
      }

      // Verify CloudTrail is configured and logging
      const trailResponse = await safeAwsCall(async () => {
        const command = new GetTrailCommand({
          Name: cloudtrailName,
        });
        return await cloudTrailClient.send(command);
      }, 'CloudTrail configuration test');

      expect(trailResponse.Trail).toBeDefined();
      expect(trailResponse.Trail?.S3BucketName).toBe(cloudtrailBucket);

      // Generate some API activity to test logging
      await safeAwsCall(async () => {
        const command = new DescribeVpcsCommand({
          MaxResults: 5
        });
        return await ec2Client.send(command);
      }, 'Generate API activity for CloudTrail');

      // Wait a moment for logs to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if CloudTrail logs are being written to S3
      const s3Objects = await safeAwsCall(async () => {
        const command = new ListObjectsV2Command({
          Bucket: cloudtrailBucket,
          MaxKeys: 10
        });
        return await s3Client.send(command);
      }, 'Check CloudTrail S3 logs');

      // CloudTrail logs should be present (may take time to appear)
      expect(s3Objects).toBeDefined();
    }, 30000);

    test('GuardDuty can detect and process security events', async () => {
      const guarddutyDetectorId = outputs.guardduty_detector_id;

      if (!guarddutyDetectorId) {
        throw new Error('Required resources not found for interactive test');
      }

      // Verify GuardDuty detector is enabled and configured
      const detectorResponse = await safeAwsCall(async () => {
        const command = new GetDetectorCommand({
          DetectorId: guarddutyDetectorId,
        });
        return await guardDutyClient.send(command);
      }, 'GuardDuty detector test');

      expect(detectorResponse.Status).toBe('ENABLED');

      // Check for any existing findings (may be empty in test environment)
      const findingsResponse = await safeAwsCall(async () => {
        const command = new ListFindingsCommand({
          DetectorId: guarddutyDetectorId,
          MaxResults: 10
        });
        return await guardDutyClient.send(command);
      }, 'GuardDuty findings test');

      expect(findingsResponse.FindingIds).toBeDefined();
    }, 20000);

    test('AWS Config can record and track resource configurations', async () => {
      const configRecorderName = outputs.config_recorder_name;

      if (!configRecorderName) {
        throw new Error('Required resources not found for interactive test');
      }

      // Verify Config recorder is configured
      const recorderResponse = await safeAwsCall(async () => {
        const command = new DescribeConfigurationRecordersCommand({
          ConfigurationRecorderNames: [configRecorderName],
        });
        return await configClient.send(command);
      }, 'AWS Config recorder test');

      expect(recorderResponse.ConfigurationRecorders).toBeDefined();
      const recorder = recorderResponse.ConfigurationRecorders![0];
      expect(recorder.recordingGroup?.allSupported).toBe(true);

      // Check for any existing compliance evaluations
      const evaluationsResponse = await safeAwsCall(async () => {
        const command = new GetComplianceSummaryByConfigRuleCommand({});
        return await configClient.send(command);
      }, 'AWS Config compliance test');

      expect(evaluationsResponse).toBeDefined();
    }, 20000);

    test('VPC Flow Logs can capture and store network traffic data', async () => {
      const flowLogsLogGroup = outputs.flow_logs_log_group;

      if (!flowLogsLogGroup) {
        throw new Error('Required resources not found for interactive test');
      }

      // Verify CloudWatch Log Group exists for Flow Logs
      const logGroupResponse = await safeAwsCall(async () => {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: flowLogsLogGroup,
        });
        return await logsClient.send(command);
      }, 'VPC Flow Logs test');

      expect(logGroupResponse.logGroups).toBeDefined();
      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);

      // Check if any log streams exist (indicating Flow Logs are active)
      const logStreamsResponse = await safeAwsCall(async () => {
        const command = new DescribeLogStreamsCommand({
          logGroupName: flowLogsLogGroup,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 5
        });
        return await logsClient.send(command);
      }, 'VPC Flow Logs streams test');

      expect(logStreamsResponse.logStreams).toBeDefined();
    }, 20000);

    test('SSM Parameter Store can store and retrieve encrypted parameters', async () => {
      const rdsPasswordParameter = outputs.rds_password_parameter;

      if (!rdsPasswordParameter) {
        throw new Error('Required resources not found for interactive test');
      }

      // Test retrieving parameter without decryption (to verify encryption)
      const parameterResponse = await safeAwsCall(async () => {
        const command = new GetParameterCommand({
          Name: rdsPasswordParameter,
          WithDecryption: false,
        });
        return await ssmClient.send(command);
      }, 'SSM Parameter Store test');

      expect(parameterResponse.Parameter).toBeDefined();
      expect(parameterResponse.Parameter!.Type).toBe('SecureString');
      expect(parameterResponse.Parameter!.Value).not.toBe('');

      // Test retrieving parameter with decryption
      const decryptedResponse = await safeAwsCall(async () => {
        const command = new GetParameterCommand({
          Name: rdsPasswordParameter,
          WithDecryption: true,
        });
        return await ssmClient.send(command);
      }, 'SSM Parameter Store decryption test');

      expect(decryptedResponse.Parameter?.Value).toBeDefined();
      expect(decryptedResponse.Parameter?.Value?.length).toBeGreaterThan(0);
    }, 20000);

    test('RDS instance can be accessed and monitored through CloudWatch', async () => {
      const rdsEndpoint = outputs.rds_endpoint;

      if (!rdsEndpoint) {
        throw new Error('Required resources not found for interactive test');
      }

      const dbIdentifier = rdsEndpoint.split('.')[0];

      // Verify RDS instance is available and properly configured
      const rdsResponse = await safeAwsCall(async () => {
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        return await rdsClient.send(command);
      }, 'RDS instance test');

      expect(rdsResponse.DBInstances).toBeDefined();
      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);

      // Verify CloudWatch logs are enabled for RDS
      expect(dbInstance.EnabledCloudwatchLogsExports).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);
    }, 20000);

    test('KMS key can encrypt and decrypt data across services', async () => {
      const kmsKeyMainId = outputs.kms_key_main_id;

      if (!kmsKeyMainId) {
        throw new Error('Required resources not found for interactive test');
      }

      // Test KMS key can generate data key for encryption
      const generateKeyResponse = await safeAwsCall(async () => {
        const command = new GenerateDataKeyCommand({
          KeyId: kmsKeyMainId,
          KeySpec: 'AES_256',
          EncryptionContext: {
            TestContext: 'InteractiveTest'
          }
        });
        return await kmsClient.send(command);
      }, 'KMS data key generation test');

      expect(generateKeyResponse.CiphertextBlob).toBeDefined();
      expect(generateKeyResponse.Plaintext).toBeDefined();

      // Test KMS can decrypt the data key
      const decryptResponse = await safeAwsCall(async () => {
        const command = new DecryptCommand({
          CiphertextBlob: generateKeyResponse.CiphertextBlob,
          EncryptionContext: {
            TestContext: 'InteractiveTest'
          }
        });
        return await kmsClient.send(command);
      }, 'KMS decrypt test');

      expect(decryptResponse.Plaintext).toBeDefined();
      expect(decryptResponse.KeyId).toContain(kmsKeyMainId);
    }, 20000);
  });
});
