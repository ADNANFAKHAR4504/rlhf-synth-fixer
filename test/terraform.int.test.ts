import path from "path";
import fs from "fs";

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
import { IAMClient, GetUserCommand } from "@aws-sdk/client-iam";

// Match your Terraform outputs JSON structure
interface TerraformOutputs {
  config_recorder_name: string;
  config_rules: string;
  kms_key_id: string;
  private_subnet_ids: string;
  public_subnet_ids: string;
  s3_bucket_name: string;
  security_alerts_topic_arn: string;
  terraform_user_arn: string;
  vpc_id: string;
}

// Use Terraform's aws_region default
const awsRegion = "us-west-2";

// AWS SDK clients
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const configClient = new ConfigServiceClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

let outputs: TerraformOutputs;

beforeAll(() => {
  const outputsPath = path.resolve(
    process.cwd(),
    "cfn-outputs/flat-outputs.json"
  );
  const fileContents = fs.readFileSync(outputsPath, "utf8");
  outputs = JSON.parse(fileContents) as TerraformOutputs;
});

describe("Terraform Stack Integration Tests", () => {
  describe("VPC & Subnets", () => {
    const publicSubnets = JSON.parse(outputs.public_subnet_ids) as string[];
    const privateSubnets = JSON.parse(outputs.private_subnet_ids) as string[];
  
    test("VPC should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })
      );
      expect(res.Vpcs?.[0].VpcId).toBe(outputs.vpc_id);
    });
  
    test("Public subnets belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnets })
      );
      res.Subnets?.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
  
    test("Private subnets belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnets })
      );
      res.Subnets?.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
  });

  describe("S3 Buckets", () => {
    test("S3 bucket should exist", async () => {
      const bucketName = outputs.s3_bucket_name;
      const res = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(res.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe("SNS Topics", () => {
    test("Security alerts topic should exist", async () => {
      const topicArn = outputs.security_alerts_topic_arn;
      const res = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(res.Attributes?.TopicArn).toBe(topicArn);
    });
  });

  describe("KMS Keys", () => {
    test("KMS key should exist", async () => {
      const keyId = outputs.kms_key_id;
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
    test("Terraform user should exist", async () => {
      const arn = outputs.terraform_user_arn;
      const userName = arn.split("/").pop()!;
      const res = await iamClient.send(
        new GetUserCommand({ UserName: userName })
      );
      expect(res.User?.Arn).toBe(arn);
    });
  });
});
