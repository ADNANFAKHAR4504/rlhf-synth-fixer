// test/terraform.int.test.ts

import path from "path";
import fs from "fs";
import dns from "dns/promises";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand
} from "@aws-sdk/client-ec2";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
  TargetHealthDescription
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  SNSClient,
  GetTopicAttributesCommand
} from "@aws-sdk/client-sns";

let outputs: Record<string, string>;
let ec2Client: EC2Client;
let secretsClient: SecretsManagerClient;
let iamClient: IAMClient;
let logsClient: CloudWatchLogsClient;
let elbv2Client: ElasticLoadBalancingV2Client;
let snsClient: SNSClient;

beforeAll(() => {
  const outputsPath = path.resolve(
    process.cwd(),
    "cfn-outputs/flat-outputs.json"
  );
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

  ec2Client = new EC2Client({ region: "us-east-1" });
  secretsClient = new SecretsManagerClient({ region: "us-east-1" });
  iamClient = new IAMClient({ region: "us-east-1" });
  logsClient = new CloudWatchLogsClient({ region: "us-east-1" });
  elbv2Client = new ElasticLoadBalancingV2Client({ region: "us-east-1" });
  snsClient = new SNSClient({ region: "us-east-1" });
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

  describe("Internet Gateway", () => {
    test("Internet Gateway should be attached to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.internet_gateway_id] })
      );
      expect(res.InternetGateways?.[0].Attachments?.some(att => att.VpcId === outputs.vpc_id)).toBe(true);
    });
  });

  describe("NAT Gateways", () => {
    const natGateways = JSON.parse(outputs.nat_gateway_ids) as string[];

    test("NAT Gateways should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGateways })
      );
      expect(res.NatGateways?.length).toBe(natGateways.length);
    });
  });

  describe("Secrets Manager", () => {
    const secrets = JSON.parse(outputs.secret_ids) as Record<string, string>;

    test("Secrets should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      for (const [name, arn] of Object.entries(secrets)) {
        const res = await secretsClient.send(
          new DescribeSecretCommand({ SecretId: arn })
        );
        expect(res.ARN).toBe(arn);
        expect(res.Name).toBe(name);
      }
    });
  });

  describe("IAM", () => {
    test("EC2 Role should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const roleName = outputs.ec2_role_name;
      const res = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.RoleName).toBe(roleName);
      expect(res.Role?.Arn).toBe(outputs.ec2_role_arn);
    });

    test("EC2 Instance Profile should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const profileName = outputs.ec2_instance_profile_name;
      const res = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );
      expect(res.InstanceProfile?.InstanceProfileName).toBe(profileName);
    });
  });

  describe("Monitoring", () => {
    test("Log group should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const logGroupName = outputs.log_group_name;
      const res = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      expect(res.logGroups?.some((lg) => lg.logGroupName === logGroupName)).toBe(true);
    });
  });

  describe("Load Balancer", () => {
    test("DNS should resolve", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const addresses = await dns.lookup(outputs.load_balancer_dns);
      expect(addresses.address).toBeDefined();
    });
  
    test("Target group should have healthy targets", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const tgArn = outputs.target_group_arn;
      const health = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: tgArn })
      );
      expect(health.TargetHealthDescriptions?.length).toBeGreaterThan(0);
      health.TargetHealthDescriptions?.forEach((t: TargetHealthDescription) => {
        expect(t.TargetHealth?.State).toBe("healthy");
      });
    });
  });


  describe("SNS", () => {
    test("SNS Topic should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const topicArn = outputs.sns_topic_arn;
      const res = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(res.Attributes?.TopicArn).toBe(topicArn);
    });
  });
});
