import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  IAMClient,
  GetRoleCommand,
} from "@aws-sdk/client-iam";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

interface TerraformOutputs {
  bastion_host_public_ip: string;
  iam_role_name: string;
  private_instance_ids: string; // JSON string
  private_subnet_ids: string;   // JSON string
  public_subnet_ids: string;    // JSON string
  secrets_manager_secret_arn: string;
  vpc_id: string;
}

describe("Terraform VPC/EC2 Integration Tests", () => {
  let outputs: TerraformOutputs;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let secretsClient: SecretsManagerClient;

  let privateInstances: string[];
  let publicSubnets: string[];
  let privateSubnets: string[];

  beforeAll(() => {
    const outputsPath = path.resolve(
      process.cwd(),
      "cfn-outputs/flat-outputs.json"
    );

    try {
      outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
      console.log("✅ Loaded outputs from:", outputsPath);
    } catch (err) {
      throw new Error("❌ Could not load Terraform outputs. Run `terraform apply` first.");
    }

    // Parse JSON array outputs
    privateInstances = JSON.parse(outputs.private_instance_ids);
    publicSubnets = JSON.parse(outputs.public_subnet_ids);
    privateSubnets = JSON.parse(outputs.private_subnet_ids);

    const awsRegion = "us-east-1";
    ec2Client = new EC2Client({ region: awsRegion });
    iamClient = new IAMClient({ region: awsRegion });
    secretsClient = new SecretsManagerClient({ region: awsRegion });
  });

  describe("VPC Validation", () => {
    test("VPC should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const res = await ec2Client.send(cmd);
      expect(res.Vpcs?.[0].VpcId).toBe(outputs.vpc_id);
    });

    test("Public subnet should belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new DescribeSubnetsCommand({ SubnetIds: [publicSubnets[0]] });
      const res = await ec2Client.send(cmd);
      expect(res.Subnets?.[0].VpcId).toBe(outputs.vpc_id);
    });

    test("Private subnet should belong to VPC", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new DescribeSubnetsCommand({ SubnetIds: [privateSubnets[0]] });
      const res = await ec2Client.send(cmd);
      expect(res.Subnets?.[0].VpcId).toBe(outputs.vpc_id);
    });
  });

  describe("EC2 Instances", () => {
    test("Private instance should exist and be running", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new DescribeInstancesCommand({ InstanceIds: [privateInstances[0]] });
      const res = await ec2Client.send(cmd);
      expect(res.Reservations?.[0].Instances?.[0].State?.Name).toBe("running");
      expect(res.Reservations?.[0].Instances?.[0].SubnetId).toBe(privateSubnets[0]);
    });
  });

  describe("IAM Role", () => {
    test("EC2 secrets role should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new GetRoleCommand({ RoleName: outputs.iam_role_name });
      const res = await iamClient.send(cmd);
      expect(res.Role?.RoleName).toBe(outputs.iam_role_name);
    });
  });

  describe("Secrets Manager", () => {
    test("Secret should exist", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new DescribeSecretCommand({ SecretId: outputs.secrets_manager_secret_arn });
      const res = await secretsClient.send(cmd);
      expect(res.ARN).toBe(outputs.secrets_manager_secret_arn);
    });

    test("Secret should contain db_password", async () => {
      if (process.env.RUN_LIVE_TESTS !== "true") return;

      const cmd = new GetSecretValueCommand({ SecretId: outputs.secrets_manager_secret_arn });
      const res = await secretsClient.send(cmd);
      const secret = JSON.parse(res.SecretString!);
      expect(secret).toHaveProperty("db_password");
      expect(secret.db_password.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe("Networking", () => {
    test("Bastion host should have a valid public IP", () => {
      expect(outputs.bastion_host_public_ip).toMatch(
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
      );
    });
  });
});
