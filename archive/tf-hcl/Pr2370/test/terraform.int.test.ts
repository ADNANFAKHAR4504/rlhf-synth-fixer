import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  ConfigServiceClient,
  DescribeDeliveryChannelsCommand,
} from "@aws-sdk/client-config-service";

interface TerraformOutputs {
  cloudtrail_log_group_name: string;
  cloudwatch_log_group_name: string;
  config_delivery_channel: string;
  kms_key_arn: string;
  private_subnet_ids: string;
  public_subnet_ids: string;
  role_arn_cloudtrail: string;
  role_arn_config: string;
  role_arn_mfa: string;
  s3_cloudtrail_bucket: string;
  s3_config_bucket: string;
  s3_secure_bucket: string;
  scurity_group_id_bastion: string;
  security_group_id_private_instance: string;
  sns_topic_arn: string;
  vpc_id: string;
}

describe("Terraform TAP Stack Integration Tests", () => {
  let outputs: TerraformOutputs;
  let publicSubnets: string[];
  let privateSubnets: string[];

  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let s3Client: S3Client;
  let logsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  let kmsClient: KMSClient;
  let configClient: ConfigServiceClient;

  beforeAll(() => {
    const outputsPath = path.resolve(
      process.cwd(),
      "cfn-outputs/flat-outputs.json"
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Terraform outputs file not found: ${outputsPath}. Run 'terraform apply' first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

    if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) {
      throw new Error(
        `Missing subnet IDs in Terraform outputs. Found: ${Object.keys(outputs)}`
      );
    }

    publicSubnets = JSON.parse(outputs.public_subnet_ids);
    privateSubnets = JSON.parse(outputs.private_subnet_ids);

    // If aws_region output is missing, fall back to default
    const awsRegion = (outputs as any).aws_region || "us-west-2";

    ec2Client = new EC2Client({ region: awsRegion });
    iamClient = new IAMClient({ region: awsRegion });
    s3Client = new S3Client({ region: awsRegion });
    logsClient = new CloudWatchLogsClient({ region: awsRegion });
    snsClient = new SNSClient({ region: awsRegion });
    kmsClient = new KMSClient({ region: awsRegion });
    configClient = new ConfigServiceClient({ region: awsRegion });
  });

  describe("VPC & Subnets", () => {
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
      res.Subnets?.forEach((subnet) =>
        expect(subnet.VpcId).toBe(outputs.vpc_id)
      );
    });

    test("Private subnets belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnets })
      );
      res.Subnets?.forEach((subnet) =>
        expect(subnet.VpcId).toBe(outputs.vpc_id)
      );
    });
  });

  describe("Security Groups", () => {
    test("Bastion SG exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.scurity_group_id_bastion],
        })
      );
      expect(res.SecurityGroups?.[0].GroupId).toBe(
        outputs.scurity_group_id_bastion
      );
    });

    test("Private instance SG exists", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_id_private_instance],
        })
      );
      expect(res.SecurityGroups?.[0].GroupId).toBe(
        outputs.security_group_id_private_instance
      );
    });
  });

  describe("S3 Buckets", () => {
    const buckets = [
      "s3_secure_bucket",
      "s3_cloudtrail_bucket",
      "s3_config_bucket",
    ] as const;

    buckets.forEach((bucketKey) => {
      test(`${bucketKey} should exist and use correct KMS key`, async () => {
        if (process.env.RUN_LIVE_TESTS !== "true") return;
        const bucketName = outputs[bucketKey];
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        const encRes = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        const rules = encRes.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);

        const kmsRule = rules.find(
          (rule) =>
            rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms"
        );
        expect(kmsRule).toBeDefined();
        expect(
          kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
        ).toBe(outputs.kms_key_arn);
      });
    });
  });

  describe("SNS Topic", () => {
    test("SNS topic should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.sns_topic_arn })
      );
      expect(res.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
    });
  });

  describe("KMS Key", () => {
    test("KMS key should be enabled", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.kms_key_arn })
      );
      expect(res.KeyMetadata?.Arn).toBe(outputs.kms_key_arn);
      expect(res.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe("IAM Roles", () => {
    const roles: { key: keyof TerraformOutputs }[] = [
      { key: "role_arn_cloudtrail" },
      { key: "role_arn_config" },
      { key: "role_arn_mfa" },
    ];

    roles.forEach(({ key }) => {
      test(`${key} should exist`, async () => {
        if (process.env.RUN_LIVE_TESTS !== "true") return;
        const roleArn = outputs[key];
        const roleName = roleArn.split("/").pop()!;
        const res = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(res.Role?.Arn).toBe(roleArn);
      });
    });
  });

  describe("CloudWatch Logs", () => {
    const logGroups: { key: keyof TerraformOutputs }[] = [
      { key: "cloudtrail_log_group_name" },
      { key: "cloudwatch_log_group_name" },
    ];

    logGroups.forEach(({ key }) => {
      test(`${key} should exist`, async () => {
        if (process.env.RUN_LIVE_TESTS !== "true") return;
        const logGroupNameFull = outputs[key];
        const name = logGroupNameFull.split(":log-group:")[1];
        const res = await logsClient.send(
          new DescribeLogGroupsCommand({ logGroupNamePrefix: name })
        );
        expect(res.logGroups?.some((g) => g.logGroupName === name)).toBe(true);
      });
    });
  });

  describe("Config Service", () => {
    test("Delivery channel should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );
      expect(
        res.DeliveryChannels?.some(
          (dc) => dc.name === outputs.config_delivery_channel
        )
      ).toBe(true);
    });
  });
});
