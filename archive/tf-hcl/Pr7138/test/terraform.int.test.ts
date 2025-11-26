import {
  CloudTrailClient,
  DescribeTrailsCommand
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeResourcePoliciesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecordersCommand,
  DescribeConformancePacksCommand,
  DescribeDeliveryChannelsCommand,
} from "@aws-sdk/client-config-service";
import {
  GetRoleCommand,
  IAMClient
} from "@aws-sdk/client-iam";
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from "@aws-sdk/client-kms";
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetTopicAttributesCommand,
  SNSClient,
} from "@aws-sdk/client-sns";
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

// Helper functions
const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};

const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj) || !obj[key]) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

const isValidArn = (arn: string) => {
  return /^arn:aws:[^:]+:[^:]*:[^:]*:.+$/.test(arn);
};

const isValidKmsKeyId = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
};

describe("Multi-Account AWS Security Framework - Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;
  let primaryRegion: string;
  let secondaryRegion: string;

  beforeAll(() => {
    if (process.env.RUN_LIVE_TESTS !== "true") {
      console.log("Skipping live integration tests. Set RUN_LIVE_TESTS=true to run.");
      return;
    }

    try {
      const data = fs.readFileSync(outputFile, "utf8");
      const parsed = JSON.parse(data);
      outputs = {};
      for (const [k, v] of Object.entries(parsed)) {
        outputs[k] = parseArray(v);
      }

      primaryRegion = outputs.primary_region || "us-east-1";
      secondaryRegion = outputs.secondary_region || "us-west-2";
      region = primaryRegion;
    } catch (error) {
      console.warn(`Could not read output file ${outputFile}: ${error}`);
      outputs = {};
    }
  });

  describe("Output Structure Validation", () => {
    it("should have essential infrastructure outputs", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const requiredOutputs = [
        "organization_id",
        "primary_kms_key_arn",
        "secondary_kms_key_arn",
        "cross_account_security_role_arn",
        "cloudtrail_bucket_name",
        "config_bucket_name",
        "central_logs_group_name",
        "environment_suffix",
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should not expose sensitive information in outputs", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /private_key/i,
        /access_key/i,
        /session_token/i,
        /credentials/i,
      ];

      const sensitiveKeys = Object.keys(outputs).filter((key) =>
        sensitivePatterns.some((pattern) => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe("KMS Key Management", () => {
    let kmsPrimaryClient: KMSClient;
    let kmsSecondaryClient: KMSClient;

    beforeAll(() => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      kmsPrimaryClient = new KMSClient({ region: primaryRegion });
      kmsSecondaryClient = new KMSClient({ region: secondaryRegion });
    });

    it("validates primary KMS key exists and is configured", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("primary_kms_key_arn", outputs)) return;

      const command = new DescribeKeyCommand({
        KeyId: outputs.primary_kms_key_arn,
      });
      const response = await kmsPrimaryClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Arn).toBe(outputs.primary_kms_key_arn);
      expect(response.KeyMetadata?.KeyState).toBe("Enabled");
    });

    it("validates primary KMS key has rotation enabled", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("primary_kms_key_id", outputs)) return;

      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.primary_kms_key_id,
      });
      const response = await kmsPrimaryClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    it("validates primary KMS key alias exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("primary_kms_key_alias", outputs)) return;

      const command = new ListAliasesCommand({});
      const response = await kmsPrimaryClient.send(command);

      const aliases = response.Aliases?.map((a) => a.AliasName) || [];
      expect(aliases).toContain(outputs.primary_kms_key_alias);
    });

    it("validates secondary KMS replica key exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("secondary_kms_key_arn", outputs)) return;

      const command = new DescribeKeyCommand({
        KeyId: outputs.secondary_kms_key_arn,
      });
      const response = await kmsSecondaryClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Arn).toBe(outputs.secondary_kms_key_arn);
      expect(response.KeyMetadata?.KeyState).toBe("Enabled");
    });
  });

  describe("IAM Cross-Account Roles", () => {
    let iamClient: IAMClient;

    beforeAll(() => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      iamClient = new IAMClient({ region });
    });

    it("validates cross-account security role exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cross_account_security_role_arn", outputs)) return;

      const roleName = outputs.cross_account_security_role_arn.split("/").pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.cross_account_security_role_arn);
    });

    it("validates security role has MFA enforcement in assume policy", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cross_account_security_role_arn", outputs)) return;

      const roleName = outputs.cross_account_security_role_arn.split("/").pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumePolicy = JSON.parse(response.Role?.AssumeRolePolicyDocument || "{}");
      const statements = assumePolicy.Statement || [];

      const mfaStatement = statements.find(
        (s: any) =>
          s.Condition?.Bool?.["aws:MultiFactorAuthPresent"] === "true"
      );
      expect(mfaStatement).toBeDefined();
    });

    it("validates cross-account operations role exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cross_account_operations_role_arn", outputs)) return;

      const roleName = outputs.cross_account_operations_role_arn.split("/").pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.cross_account_operations_role_arn);
    });

    it("validates cross-account developer role exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cross_account_developer_role_arn", outputs)) return;

      const roleName = outputs.cross_account_developer_role_arn.split("/").pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.cross_account_developer_role_arn);
    });
  });

  describe("CloudTrail Configuration", () => {
    let cloudtrailClient: CloudTrailClient;
    let s3Client: S3Client;

    beforeAll(() => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      cloudtrailClient = new CloudTrailClient({ region });
      s3Client = new S3Client({ region });
    });

    it("validates CloudTrail exists and is configured as organization trail", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cloudtrail_arn", outputs)) return;

      const command = new DescribeTrailsCommand({
        trailNameList: [outputs.cloudtrail_arn.split("/").pop() || ""],
      });
      const response = await cloudtrailClient.send(command);

      expect(response.trailList).toBeDefined();
      expect(response.trailList?.length).toBeGreaterThan(0);

      const trail = response.trailList?.[0];
      expect(trail?.IsOrganizationTrail).toBe(true);
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });

    it("validates CloudTrail S3 bucket exists and is encrypted", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cloudtrail_bucket_name", outputs)) return;

      try {
        const headCommand = new HeadBucketCommand({
          Bucket: outputs.cloudtrail_bucket_name,
        });
        await s3Client.send(headCommand);
      } catch (error) {
        fail(`CloudTrail S3 bucket ${outputs.cloudtrail_bucket_name} not accessible: ${error}`);
      }

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.cloudtrail_bucket_name,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe("aws:kms");
    });

    it("validates CloudTrail S3 bucket has versioning enabled", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cloudtrail_bucket_name", outputs)) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.cloudtrail_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe("Enabled");
    });

    it("validates CloudTrail S3 bucket blocks public access", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("cloudtrail_bucket_name", outputs)) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.cloudtrail_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe("CloudWatch Logs", () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      logsClient = new CloudWatchLogsClient({ region });
    });

    it("validates central log group exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("central_logs_group_name", outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.central_logs_group_name,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.central_logs_group_name
      );
      expect(logGroup).toBeDefined();
    });

    it("validates log groups have KMS encryption", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("central_logs_group_name", outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.central_logs_group_name,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.central_logs_group_name
      );
      expect(logGroup?.kmsKeyId).toBeDefined();
    });

    it("validates log groups have correct retention period", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("central_logs_group_name", outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.central_logs_group_name,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.central_logs_group_name
      );
      expect(logGroup?.retentionInDays).toBe(90);
    });

    it("validates cross-account log resource policy exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const command = new DescribeResourcePoliciesCommand({});
      const response = await logsClient.send(command);

      const policies = response.resourcePolicies || [];
      const crossAccountPolicy = policies.find((p) =>
        p.policyName?.includes("cross-account-logs-policy")
      );
      expect(crossAccountPolicy).toBeDefined();
    });
  });

  describe("AWS Config", () => {
    let configClient: ConfigServiceClient;
    let s3Client: S3Client;
    let snsClient: SNSClient;

    beforeAll(() => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      configClient = new ConfigServiceClient({ region });
      s3Client = new S3Client({ region });
      snsClient = new SNSClient({ region });
    });

    it("validates Config recorder exists and is enabled", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("config_recorder_name", outputs)) return;

      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      const recorder = response.ConfigurationRecorders?.find(
        (r) => r.name === outputs.config_recorder_name
      );
      expect(recorder).toBeDefined();
      expect(recorder?.recordingGroup?.allSupported).toBe(true);
    });

    it("validates Config delivery channel exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const command = new DescribeDeliveryChannelsCommand({});
      const response = await configClient.send(command);

      expect(response.DeliveryChannels?.length).toBeGreaterThan(0);
    });

    it("validates Config rules are deployed", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      const ruleNames = response.ConfigRules?.map((r) => r.ConfigRuleName) || [];
      expect(ruleNames.length).toBeGreaterThanOrEqual(7);

      // Check for specific rules
      expect(
        ruleNames.some((name) => name?.includes("s3-bucket-server-side-encryption"))
      ).toBe(true);
      expect(ruleNames.some((name) => name?.includes("encrypted-volumes"))).toBe(true);
      expect(ruleNames.some((name) => name?.includes("rds-encryption"))).toBe(true);
    });

    it("validates Config conformance pack exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const command = new DescribeConformancePacksCommand({});
      const response = await configClient.send(command);

      const packDetails = response.ConformancePackDetails || [];
      expect(packDetails.length).toBeGreaterThan(0);

      // Extract pack names from details
      const packNames = packDetails.map((pack) => pack.ConformancePackName).filter(Boolean);
      expect(packNames.length).toBeGreaterThan(0);
    });

    it("validates Config S3 bucket exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("config_bucket_name", outputs)) return;

      try {
        const command = new HeadBucketCommand({
          Bucket: outputs.config_bucket_name,
        });
        await s3Client.send(command);
      } catch (error) {
        fail(`Config S3 bucket ${outputs.config_bucket_name} not accessible: ${error}`);
      }
    });

    it("validates Config SNS topic exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("config_notification_topic_arn", outputs)) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.config_notification_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(outputs.config_notification_topic_arn);
    });
  });

  describe("Resource Naming Consistency", () => {
    it("validates all resources use environment_suffix", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      if (skipIfMissing("environment_suffix", outputs)) return;

      const suffix = outputs.environment_suffix;

      // Check key resource names contain the suffix
      if (outputs.cloudtrail_bucket_name) {
        expect(outputs.cloudtrail_bucket_name).toContain(suffix);
      }
      if (outputs.config_bucket_name) {
        expect(outputs.config_bucket_name).toContain(suffix);
      }
      if (outputs.central_logs_group_name) {
        expect(outputs.central_logs_group_name).toContain(suffix);
      }
    });
  });

  describe("Security and Compliance Validation", () => {
    it("validates KMS keys are properly configured", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      if (outputs.primary_kms_key_arn) {
        expect(isValidArn(outputs.primary_kms_key_arn)).toBe(true);
      }
      if (outputs.secondary_kms_key_arn) {
        expect(isValidArn(outputs.secondary_kms_key_arn)).toBe(true);
      }
    });

    it("validates IAM role ARNs are properly formatted", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      if (outputs.cross_account_security_role_arn) {
        expect(isValidArn(outputs.cross_account_security_role_arn)).toBe(true);
        expect(outputs.cross_account_security_role_arn).toContain("cross-account-security-role");
      }
    });

    it("validates S3 bucket names follow naming convention", () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      if (outputs.cloudtrail_bucket_name) {
        expect(outputs.cloudtrail_bucket_name).toMatch(/^cloudtrail-logs-/);
      }
      if (outputs.config_bucket_name) {
        expect(outputs.config_bucket_name).toMatch(/^config-bucket-/);
      }
    });
  });
});

