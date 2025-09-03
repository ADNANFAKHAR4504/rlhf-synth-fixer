import path from "path";
import fs from "fs";
import dns from "dns/promises";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
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
  TargetHealthDescription,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  SNSClient,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";

let outputs: Record<string, string>;
let ec2Client: EC2Client;
let secretsClient: SecretsManagerClient;
let iamClient: IAMClient;
let logsClient: CloudWatchLogsClient;
let elbv2Client: ElasticLoadBalancingV2Client;
let snsClient: SNSClient;

// Parsed variables
let publicSubnets: string[];
let privateSubnets: string[];
let natGateways: string[];
let secrets: Record<string, string>;
let vpcId: string;
let igwId: string;
let ec2RoleName: string;
let ec2RoleArn: string;
let ec2InstanceProfileName: string;
let logGroupName: string;
let lbDns: string;
let tgArn: string;
let snsTopicArn: string;

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

  // Parse all outputs here
  publicSubnets = JSON.parse(outputs.public_subnet_ids) as string[];
  privateSubnets = JSON.parse(outputs.private_subnet_ids) as string[];
  natGateways = JSON.parse(outputs.nat_gateway_ids) as string[];
  secrets = JSON.parse(outputs.secret_ids) as Record<string, string>;
  vpcId = outputs.vpc_id;
  igwId = outputs.internet_gateway_id;
  ec2RoleName = outputs.ec2_role_name;
  ec2RoleArn = outputs.ec2_role_arn;
  ec2InstanceProfileName = outputs.ec2_instance_profile_name;
  logGroupName = outputs.log_group_name;
  lbDns = outputs.load_balancer_dns;
  tgArn = outputs.target_group_arn;
  snsTopicArn = outputs.sns_topic_arn;
});

describe("Terraform Stack Integration Tests", () => {
  describe("VPC & Subnets", () => {
    test("VPC should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
    });

    test("Public subnets belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnets }));
      res.Subnets?.forEach((subnet) => expect(subnet.VpcId).toBe(vpcId));
    });

    test("Private subnets belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnets }));
      res.Subnets?.forEach((subnet) => expect(subnet.VpcId).toBe(vpcId));
    });
  });

  describe("Internet Gateway", () => {
    test("Internet Gateway should be attached to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
      expect(res.InternetGateways?.[0].Attachments?.some(att => att.VpcId === vpcId)).toBe(true);
    });
  });

  describe("NAT Gateways", () => {
    test("NAT Gateways should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await ec2Client.send(new DescribeNatGatewaysCommand({ NatGatewayIds: natGateways }));
      expect(res.NatGateways?.length).toBe(natGateways.length);
    });
  });

  describe("Secrets Manager", () => {
    test("Secrets should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      for (const [name, arn] of Object.entries(secrets)) {
        const res = await secretsClient.send(new DescribeSecretCommand({ SecretId: arn }));
        expect(res.ARN).toBe(arn);
        expect(res.Name).toBe(name);
      }
    });
  });

  describe("IAM", () => {
    test("EC2 Role should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await iamClient.send(new GetRoleCommand({ RoleName: ec2RoleName }));
      expect(res.Role?.RoleName).toBe(ec2RoleName);
      expect(res.Role?.Arn).toBe(ec2RoleArn);
    });

    test("EC2 Instance Profile should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await iamClient.send(new GetInstanceProfileCommand({ InstanceProfileName: ec2InstanceProfileName }));
      expect(res.InstanceProfile?.InstanceProfileName).toBe(ec2InstanceProfileName);
    });
  });

  describe("Monitoring", () => {
    test("Log group should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await logsClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }));
      expect(res.logGroups?.some((lg) => lg.logGroupName === logGroupName)).toBe(true);
    });
  });

  describe("Load Balancer", () => {
    test("DNS should resolve", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const addresses = await dns.lookup(lbDns);
      expect(addresses.address).toBeDefined();
    });

    test("Target group should have healthy targets", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const health = await elbv2Client.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
      expect(health.TargetHealthDescriptions?.length).toBeGreaterThan(0);
      health.TargetHealthDescriptions?.forEach((t: TargetHealthDescription) => {
        expect(t.TargetHealth?.State).toBe("healthy");
      });
    });
  });

  describe("SNS", () => {
    test("SNS Topic should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;
      const res = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
      expect(res.Attributes?.TopicArn).toBe(snsTopicArn);
    });
  });
});
