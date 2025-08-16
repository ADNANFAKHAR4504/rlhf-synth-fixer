// test/terraform.int.test.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const tfPath = path.resolve(__dirname, "../lib/tap_stack.tf");

let outputs: any = {};

describe("Terraform Infrastructure Integration Tests (us-west-2)", () => {
  // --- Load outputs.json ---
  if (!fs.existsSync(outputPath)) {
    test("No outputs file found - skipping integration tests", () => {
      console.warn(`⚠️ No outputs file found at ${outputPath}`);
    });
    return;
  }

  try {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  } catch (err) {
    test("Outputs JSON parsing", () => {
      throw new Error(`❌ Failed to parse outputs file: ${err}`);
    });
    return;
  }

  // --- Ensure Terraform file exists ---
  test("Terraform main.tf file should exist", () => {
    expect(fs.existsSync(tfPath)).toBe(true);
  });

  // --- Validate top-level keys exist ---
  test("Outputs JSON should contain expected keys", () => {
    expect(outputs).toHaveProperty("vpc_ids.value");
    expect(outputs).toHaveProperty("public_subnet_ids.value");
    expect(outputs).toHaveProperty("private_subnet_ids.value");
    expect(outputs).toHaveProperty("iam_role_arns.value");
    expect(outputs).toHaveProperty("internet_gateway_ids.value");
    expect(outputs).toHaveProperty("security_group_ids.value");
  });

  // ✅ Lock region to us-west-2
  const region = "us-west-2";
  const ec2 = new EC2Client({ region });
  const iam = new IAMClient({ region });

  const environments = Object.keys(outputs.vpc_ids.value || {});
  if (environments.length === 0) {
    test("No environments found in outputs JSON", () => {
      console.warn("⚠️ No environments defined in vpc_ids.value");
    });
    return;
  }

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      const vpcId = outputs.vpc_ids.value[env];
      const igwId = outputs.internet_gateway_ids.value[env];
      const roleArn = outputs.iam_role_arns.value[env];
      const sgId = outputs.security_group_ids.value[env];
      const instanceId = outputs.ec2_instance_ids?.value?.[env];
      const instancePrivateIp = outputs.ec2_private_ips?.value?.[env];
      const instancePublicIp = outputs.ec2_public_ips?.value?.[env];

      const publicSubnetIds = Object.entries(outputs.public_subnet_ids.value)
        .filter(([k]) => k.startsWith(env))
        .map(([, id]) => id as string);

      const privateSubnetIds = Object.entries(outputs.private_subnet_ids.value)
        .filter(([k]) => k.startsWith(env))
        .map(([, id]) => id as string);

      test("VPC exists and is available", async () => {
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs?.[0]?.VpcId).toBe(vpcId);
        expect(resp.Vpcs?.[0]?.State).toBe("available");
      });

      test("Public and Private subnets exist", async () => {
        const allSubnets = [...publicSubnetIds, ...privateSubnetIds];
        if (allSubnets.length === 0) return;

        const resp = await ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: allSubnets })
        );
        expect(resp.Subnets?.length).toBe(allSubnets.length);
      });

      test("Internet Gateway exists", async () => {
        const resp = await ec2.send(
          new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
        );
        expect(resp.InternetGateways?.[0]?.InternetGatewayId).toBe(igwId);
      });

      test("IAM Role exists and matches ARN", async () => {
        const roleName = roleArn.split("/").pop() as string;
        const resp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        expect(resp.Role?.Arn).toBe(roleArn);
      });

      test("Security Group ID format check", () => {
        expect(sgId).toMatch(/^sg-[a-f0-9]+$/);
      });

      if (instanceId) {
        test("EC2 Instance exists and matches outputs", async () => {
          const resp = await ec2.send(
            new DescribeInstancesCommand({ InstanceIds: [instanceId] })
          );
          const inst = resp.Reservations?.[0]?.Instances?.[0];
          expect(inst?.InstanceId).toBe(instanceId);
          if (instancePrivateIp) expect(inst?.PrivateIpAddress).toBe(instancePrivateIp);
          if (instancePublicIp) expect(inst?.PublicIpAddress).toBe(instancePublicIp);
          expect(inst?.VpcId).toBe(vpcId);
        });
      }
    });
  });
});

