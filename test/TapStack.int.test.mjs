import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  OrganizationsClient,
  DescribeOrganizationCommand,
  ListOrganizationalUnitsForParentCommand,
} from '@aws-sdk/client-organizations';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecorderStatusCommand,
} from '@aws-sdk/client-config-service';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { readFileSync, existsSync } from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const secondaryRegion = 'eu-west-1';

// Load stack outputs if they exist
let stackOutputs = {};
if (existsSync('cfn-outputs/flat-outputs.json')) {
  stackOutputs = JSON.parse(readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
}

// AWS Clients
const organizationsClient = new OrganizationsClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const kmsClientSecondary = new KMSClient({ region: secondaryRegion });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const configClient = new ConfigServiceClient({ region });
const dynamodbClient = new DynamoDBClient({ region });

describe('Multi-Account Security Framework Integration Tests', () => {
  describe('AWS Organizations', () => {
    test('should have organization created with all features enabled', async () => {
      const command = new DescribeOrganizationCommand({});
      const response = await organizationsClient.send(command);

      expect(response.Organization).toBeDefined();
      expect(response.Organization.FeatureSet).toBe('ALL');
      expect(response.Organization.Id).toBeDefined();

      if (stackOutputs.organization_id) {
        expect(response.Organization.Id).toBe(stackOutputs.organization_id);
      }
    });

    test('should have three organizational units created', async () => {
      const orgCommand = new DescribeOrganizationCommand({});
      const orgResponse = await organizationsClient.send(orgCommand);
      const rootId = orgResponse.Organization.MasterAccountArn.split('/')[1];

      const command = new ListOrganizationalUnitsForParentCommand({
        ParentId: rootId,
      });
      const response = await organizationsClient.send(command);

      expect(response.OrganizationalUnits).toBeDefined();
      expect(response.OrganizationalUnits.length).toBeGreaterThanOrEqual(3);

      const ouNames = response.OrganizationalUnits.map(ou => ou.Name);
      expect(ouNames.some(name => name.includes('Security'))).toBe(true);
      expect(ouNames.some(name => name.includes('Production'))).toBe(true);
      expect(ouNames.some(name => name.includes('Development'))).toBe(true);
    });

    test('should have service access principals enabled', async () => {
      const command = new DescribeOrganizationCommand({});
      const response = await organizationsClient.send(command);

      const enabledServices = response.Organization.AvailablePolicyTypes;
      expect(enabledServices).toBeDefined();
      expect(enabledServices.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Configuration', () => {
    test('should have primary KMS key with rotation enabled', async () => {
      if (!stackOutputs.primary_kms_key_id) {
        console.log('Skipping: No primary_kms_key_id in stack outputs');
        return;
      }

      const describeCommand = new DescribeKeyCommand({
        KeyId: stackOutputs.primary_kms_key_id,
      });
      const describeResponse = await kmsClient.send(describeCommand);

      expect(describeResponse.KeyMetadata.KeyState).toBe('Enabled');
      expect(describeResponse.KeyMetadata.MultiRegion).toBe(true);

      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: stackOutputs.primary_kms_key_id,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('should have secondary replica KMS key in eu-west-1', async () => {
      if (!stackOutputs.secondary_kms_key_id) {
        console.log('Skipping: No secondary_kms_key_id in stack outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: stackOutputs.secondary_kms_key_id,
      });
      const response = await kmsClientSecondary.send(command);

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.MultiRegion).toBe(true);
    });

    test('should have Terraform state KMS key with rotation', async () => {
      if (!stackOutputs.terraform_state_kms_key_id) {
        console.log('Skipping: No terraform_state_kms_key_id in stack outputs');
        return;
      }

      const describeCommand = new DescribeKeyCommand({
        KeyId: stackOutputs.terraform_state_kms_key_id,
      });
      const describeResponse = await kmsClient.send(describeCommand);

      expect(describeResponse.KeyMetadata.KeyState).toBe('Enabled');

      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: stackOutputs.terraform_state_kms_key_id,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('should have KMS aliases created', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const aliases = response.Aliases.map(alias => alias.AliasName);
      expect(aliases.some(alias => alias.includes('primary-key'))).toBe(true);
      expect(aliases.some(alias => alias.includes('terraform-state'))).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have security audit role with MFA enforcement', async () => {
      if (!stackOutputs.security_audit_role_arn) {
        console.log('Skipping: No security_audit_role_arn in stack outputs');
        return;
      }

      const roleName = stackOutputs.security_audit_role_arn.split('/')[1];
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role.AssumeRolePolicyDocument)
      );
      expect(assumeRolePolicy.Statement[0].Condition).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Condition.Bool).toHaveProperty(
        'aws:MultiFactorAuthPresent'
      );
    });

    test('should have cross-account access role with MFA', async () => {
      if (!stackOutputs.cross_account_access_role_arn) {
        console.log('Skipping: No cross_account_access_role_arn in stack outputs');
        return;
      }

      const roleName = stackOutputs.cross_account_access_role_arn.split('/')[1];
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role.AssumeRolePolicyDocument)
      );
      expect(assumeRolePolicy.Statement[0].Condition).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Condition.Bool).toHaveProperty(
        'aws:MultiFactorAuthPresent'
      );
    });

    test('should have security audit policy with read-only permissions', async () => {
      if (!stackOutputs.security_audit_role_arn) {
        console.log('Skipping: No security_audit_role_arn in stack outputs');
        return;
      }

      const roleName = stackOutputs.security_audit_role_arn.split('/')[1];
      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies.length).toBeGreaterThan(0);

      const policy = response.AttachedPolicies[0];
      const policyCommand = new GetPolicyCommand({ PolicyArn: policy.PolicyArn });
      const policyResponse = await iamClient.send(policyCommand);

      expect(policyResponse.Policy).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have Config bucket with versioning enabled', async () => {
      if (!stackOutputs.config_bucket_name) {
        console.log('Skipping: No config_bucket_name in stack outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: stackOutputs.config_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('should have Config bucket with KMS encryption', async () => {
      if (!stackOutputs.config_bucket_name) {
        console.log('Skipping: No config_bucket_name in stack outputs');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.config_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have Config bucket with public access blocked', async () => {
      if (!stackOutputs.config_bucket_name) {
        console.log('Skipping: No config_bucket_name in stack outputs');
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: stackOutputs.config_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have Config bucket policy for AWS Config service', async () => {
      if (!stackOutputs.config_bucket_name) {
        console.log('Skipping: No config_bucket_name in stack outputs');
        return;
      }

      const command = new GetBucketPolicyCommand({
        Bucket: stackOutputs.config_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy);
      expect(policy.Statement).toBeDefined();
      expect(
        policy.Statement.some(
          stmt => stmt.Principal && stmt.Principal.Service === 'config.amazonaws.com'
        )
      ).toBe(true);
    });

    test('should have Terraform state bucket with versioning and encryption', async () => {
      if (!stackOutputs.terraform_state_bucket_name) {
        console.log('Skipping: No terraform_state_bucket_name in stack outputs');
        return;
      }

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: stackOutputs.terraform_state_bucket_name,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.terraform_state_bucket_name,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have IAM activity log group with retention', async () => {
      if (!stackOutputs.iam_activity_log_group_name) {
        console.log('Skipping: No iam_activity_log_group_name in stack outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: stackOutputs.iam_activity_log_group_name,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);
      expect(response.logGroups[0].retentionInDays).toBe(90);
      expect(response.logGroups[0].kmsKeyId).toBeDefined();
    });

    test('should have Organizations activity log group', async () => {
      if (!stackOutputs.organizations_activity_log_group_name) {
        console.log('Skipping: No organizations_activity_log_group_name in stack outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: stackOutputs.organizations_activity_log_group_name,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);
    });

    test('should have Config activity log group', async () => {
      if (!stackOutputs.config_activity_log_group_name) {
        console.log('Skipping: No config_activity_log_group_name in stack outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: stackOutputs.config_activity_log_group_name,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config', () => {
    test('should have configuration recorder enabled', async () => {
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders[0];
      expect(recorder.recordingGroup.allSupported).toBe(true);
      expect(recorder.recordingGroup.includeGlobalResourceTypes).toBe(true);
    });

    test('should have configuration recorder status as recording', async () => {
      const command = new DescribeConfigurationRecorderStatusCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigurationRecordersStatus).toBeDefined();
      expect(response.ConfigurationRecordersStatus.length).toBeGreaterThan(0);
      expect(response.ConfigurationRecordersStatus[0].recording).toBe(true);
    });

    test('should have delivery channel configured', async () => {
      const command = new DescribeDeliveryChannelsCommand({});
      const response = await configClient.send(command);

      expect(response.DeliveryChannels).toBeDefined();
      expect(response.DeliveryChannels.length).toBeGreaterThan(0);

      if (stackOutputs.config_bucket_name) {
        expect(response.DeliveryChannels[0].s3BucketName).toBe(
          stackOutputs.config_bucket_name
        );
      }
    });

    test('should have Config rules for encryption compliance', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules.length).toBeGreaterThan(0);

      const ruleNames = response.ConfigRules.map(rule => rule.Source.SourceIdentifier);
      expect(ruleNames).toContain('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
      expect(ruleNames).toContain('ENCRYPTED_VOLUMES');
      expect(ruleNames).toContain('RDS_STORAGE_ENCRYPTED');
      expect(ruleNames).toContain('CLOUDWATCH_LOG_GROUP_ENCRYPTED');
    });

    test('should have Config rules for IAM security', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      const ruleNames = response.ConfigRules.map(rule => rule.Source.SourceIdentifier);
      expect(ruleNames).toContain('IAM_PASSWORD_POLICY');
      expect(ruleNames).toContain('ROOT_ACCOUNT_MFA_ENABLED');
    });
  });

  describe('DynamoDB State Locking', () => {
    test('should have DynamoDB table for Terraform state locking', async () => {
      if (!stackOutputs.terraform_state_lock_table_name) {
        console.log('Skipping: No terraform_state_lock_table_name in stack outputs');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: stackOutputs.terraform_state_lock_table_name,
      });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table.SSEDescription).toBeDefined();
      expect(response.Table.SSEDescription.Status).toBe('ENABLED');
    });
  });

  describe('Multi-Region Configuration', () => {
    test('should have resources in primary region (us-east-1)', async () => {
      expect(region).toBe('us-east-1');

      if (stackOutputs.primary_kms_key_id) {
        const command = new DescribeKeyCommand({
          KeyId: stackOutputs.primary_kms_key_id,
        });
        const response = await kmsClient.send(command);
        expect(response.KeyMetadata).toBeDefined();
      }
    });

    test('should have replica KMS key in secondary region (eu-west-1)', async () => {
      if (!stackOutputs.secondary_kms_key_id) {
        console.log('Skipping: No secondary_kms_key_id in stack outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: stackOutputs.secondary_kms_key_id,
      });
      const response = await kmsClientSecondary.send(command);
      expect(response.KeyMetadata).toBeDefined();
    });
  });

  describe('Security Compliance', () => {
    test('should enforce encryption for all S3 buckets', async () => {
      const buckets = [
        stackOutputs.config_bucket_name,
        stackOutputs.terraform_state_bucket_name,
      ].filter(Boolean);

      for (const bucket of buckets) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      }
    });

    test('should have MFA enforcement for IAM roles', async () => {
      const roles = [
        stackOutputs.security_audit_role_arn,
        stackOutputs.cross_account_access_role_arn,
      ].filter(Boolean);

      for (const roleArn of roles) {
        const roleName = roleArn.split('/')[1];
        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role.AssumeRolePolicyDocument)
        );
        expect(assumeRolePolicy.Statement[0].Condition).toBeDefined();
      }
    });

    test('should have 90-day retention for audit logs', async () => {
      const logGroups = [
        stackOutputs.iam_activity_log_group_name,
        stackOutputs.organizations_activity_log_group_name,
        stackOutputs.config_activity_log_group_name,
      ].filter(Boolean);

      for (const logGroup of logGroups) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroup,
        });
        const response = await logsClient.send(command);

        if (response.logGroups && response.logGroups.length > 0) {
          expect(response.logGroups[0].retentionInDays).toBe(90);
        }
      }
    });
  });
});
