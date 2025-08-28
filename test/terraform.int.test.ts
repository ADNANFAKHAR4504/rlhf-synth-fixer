import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
} from "@aws-sdk/client-config-service";
import {
  IAMClient,
  GetUserCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

interface TerraformOutputs {
  vpc_id: string;
  private_subnet_ids: string;
  public_subnet_ids: string;
  s3_bucket_name: string;
  security_alerts_topic_arn: string;
  kms_key_id: string;
  config_recorder_name: string;
  config_rules: string;
  terraform_user_arn: string;
  role_arn_cloudtrail: string;
  role_arn_config: string;
  role_arn_mfa: string;
  cloudtrail_log_group_name: string;
  cloudwatch_log_group_name: string;
}

const region = process.env.AWS_REGION || "us-west-2";

const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const kmsClient = new KMSClient({ region });
const configClient = new ConfigServiceClient({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe("Terraform Stack Integration Tests", () => {
  let outputs: TerraformOutputs;

  beforeAll(() => {
    const outputsPath = path.resolve(
      process.cwd(),
      "cfn-outputs/flat-outputs.json"
    );

    try {
      outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
      console.log("Loaded outputs from:", outputsPath);
    } catch (err) {
      throw new Error(
        "Could not load Terraform outputs. Run `terraform apply` first."
      );
    }
  });

  describe("VPC", () => {
    const vpcKeys: (keyof TerraformOutputs)[] = ["vpc_id"];

    test.each(vpcKeys)("VPC %s should exist", async (key) => {
      const vpcId = outputs[key];
      const res = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
    });
  });

  describe("Subnets", () => {
    const subnetKeys: (keyof TerraformOutputs)[] = [
      "private_subnet_ids",
      "public_subnet_ids",
    ];

    test.each(subnetKeys)("%s should exist", async (key) => {
      const subnetIds = JSON.parse(outputs[key]) as string[];
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );
      expect(res.Subnets?.length).toBe(subnetIds.length);
    });
  });

  describe("S3 Buckets", () => {
    const s3Keys: (keyof TerraformOutputs)[] = ["s3_bucket_name"];

    test.each(s3Keys)("%s should exist", async (key) => {
      const bucketName = outputs[key];
      const res = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(res.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe("SNS Topics", () => {
    const snsKeys: (keyof TerraformOutputs)[] = ["security_alerts_topic_arn"];

    test.each(snsKeys)("%s should exist", async (key) => {
      const topicArn = outputs[key];
      const res = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(res.Attributes?.TopicArn).toBe(topicArn);
    });
  });

  describe("KMS Keys", () => {
    const kmsKeys: (keyof TerraformOutputs)[] = ["kms_key_id"];

    test.each(kmsKeys)("%s should exist", async (key) => {
      const keyId = outputs[key];
      const res = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );
      expect(res.KeyMetadata?.KeyId).toBe(keyId);
    });
  });

  describe("AWS Config", () => {
    test("Config Recorder should exist", async () => {
      const recorderName = outputs.config_recorder_name;
      const res = await configClient.send(
        new DescribeConfigurationRecordersCommand({
          ConfigurationRecorderNames: [recorderName],
        })
      );
      expect(res.ConfigurationRecorders?.[0].name).toBe(recorderName);
    });

    test("Config Rules should exist", async () => {
      const rules = JSON.parse(outputs.config_rules) as string[];
      const res = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: rules })
      );
      expect(res.ConfigRules?.length).toBe(rules.length);
    });
  });

  describe("IAM Users", () => {
    const iamKeys: (keyof TerraformOutputs)[] = ["terraform_user_arn"];

    test.each(iamKeys)("%s should exist", async (key) => {
      const arn = outputs[key];
      const userName = arn.split("/").pop()!;
      const res = await iamClient.send(
        new GetUserCommand({ UserName: userName })
      );
      expect(res.User?.Arn).toBe(arn);
    });
  });

  describe("IAM Roles", () => {
    const roles: (keyof TerraformOutputs)[] = [
      "role_arn_cloudtrail",
      "role_arn_config",
      "role_arn_mfa",
    ];

    test.each(roles)("%s should exist", async (key) => {
      const roleArn = outputs[key];
      const roleName = roleArn.split("/").pop()!;
      const res = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(res.Role?.Arn).toBe(roleArn);
    });
  });

  describe("CloudWatch Logs", () => {
    const logGroups: (keyof TerraformOutputs)[] = [
      "cloudtrail_log_group_name",
      "cloudwatch_log_group_name",
    ];

    test.each(logGroups)("%s should exist", async (key) => {
      const logGroupNameFull = outputs[key];
      const name = logGroupNameFull.split(":log-group:")[1];
      const res = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: name })
      );
      expect(res.logGroups?.some(g => g.logGroupName === name)).toBe(true);
    });
  });
});
