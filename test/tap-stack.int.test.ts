import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
  DescribeRemediationConfigurationsCommand
} from "@aws-sdk/client-config-service";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import * as fs from "fs";
import * as path from "path";

describe("AWS Config Compliance System Integration Tests", () => {
  const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION || "us-east-1" });
  const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
  const snsClient = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || "us-east-1" });

  let outputs: any = {};
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

  beforeAll(async () => {
    const outputPath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (fs.existsSync(outputPath)) {
      const outputContent = fs.readFileSync(outputPath, "utf-8");
      outputs = JSON.parse(outputContent);
    }
  });

  describe("S3 Config Bucket", () => {
    it("should have versioning enabled", async () => {
      const bucketName = outputs.configBucketName || `config-bucket-${environmentSuffix}`;

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    it("should have encryption enabled", async () => {
      const bucketName = outputs.configBucketName || `config-bucket-${environmentSuffix}`;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });
  });

  describe("AWS Config Recorder", () => {
    it("should be configured and recording", async () => {
      const command = new DescribeConfigurationRecordersCommand({
        ConfigurationRecorderNames: [`config-recorder-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.name).toBe(`config-recorder-${environmentSuffix}`);
      expect(recorder.recordingGroup?.resourceTypes).toContain("AWS::EC2::Instance");
      expect(recorder.recordingGroup?.resourceTypes).toContain("AWS::S3::Bucket");
      expect(recorder.recordingGroup?.resourceTypes).toContain("AWS::IAM::Role");
    });
  });

  describe("Config Rules", () => {
    it("should have S3 encryption rule configured", async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`s3-bucket-encryption-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBe(1);

      const rule = response.ConfigRules![0];
      expect(rule.ConfigRuleName).toBe(`s3-bucket-encryption-${environmentSuffix}`);
      expect(rule.Source?.SourceIdentifier).toBe("S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED");
    });

    it("should have S3 versioning rule configured", async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`s3-bucket-versioning-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBe(1);

      const rule = response.ConfigRules![0];
      expect(rule.ConfigRuleName).toBe(`s3-bucket-versioning-${environmentSuffix}`);
      expect(rule.Source?.SourceIdentifier).toBe("S3_BUCKET_VERSIONING_ENABLED");
    });

    it("should have EC2 approved AMI rule configured", async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`ec2-approved-ami-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBe(1);

      const rule = response.ConfigRules![0];
      expect(rule.ConfigRuleName).toBe(`ec2-approved-ami-${environmentSuffix}`);
      expect(rule.Source?.SourceIdentifier).toBe("APPROVED_AMIS_BY_ID");
    });

    it("should have required tags rule configured", async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [`required-tags-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBe(1);

      const rule = response.ConfigRules![0];
      expect(rule.ConfigRuleName).toBe(`required-tags-${environmentSuffix}`);
      expect(rule.Source?.SourceIdentifier).toBe("REQUIRED_TAGS");
    });
  });

  describe("Remediation Configuration", () => {
    it("should have automatic remediation for S3 encryption", async () => {
      const command = new DescribeRemediationConfigurationsCommand({
        ConfigRuleNames: [`s3-bucket-encryption-${environmentSuffix}`]
      });

      const response = await configClient.send(command);
      expect(response.RemediationConfigurations).toBeDefined();
      expect(response.RemediationConfigurations!.length).toBe(1);

      const remediation = response.RemediationConfigurations![0];
      expect(remediation.ConfigRuleName).toBe(`s3-bucket-encryption-${environmentSuffix}`);
      expect(remediation.TargetType).toBe("SSM_DOCUMENT");
      expect(remediation.TargetIdentifier).toBe("AWS-ConfigureS3BucketServerSideEncryption");
      expect(remediation.Automatic).toBe(true);
    });
  });

  describe("SNS Topic", () => {
    it("should exist and be accessible", async () => {
      const topicArn = outputs.snsTopicArn || `arn:aws:sns:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:compliance-notifications-${environmentSuffix}`;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe("AWS Config Compliance Notifications");
    });
  });

  describe("Lambda Compliance Processor", () => {
    it("should exist with correct configuration", async () => {
      const functionName = outputs.complianceFunctionName || `compliance-processor-${environmentSuffix}`;

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toContain("nodejs20");
      expect(response.Configuration!.Handler).toBe("index.handler");
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(256);
      expect(response.Configuration!.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
    });
  });

  describe("Resource Naming", () => {
    it("should include environmentSuffix in all resource names", () => {
      expect(outputs.configBucketName).toContain(environmentSuffix);
      expect(outputs.snsTopicArn).toContain(environmentSuffix);
      expect(outputs.complianceFunctionArn || outputs.complianceFunctionName).toContain(environmentSuffix);
    });
  });
});
