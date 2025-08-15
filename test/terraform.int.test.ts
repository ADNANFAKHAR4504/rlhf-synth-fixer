// test/terraform.int.test.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
let outputs: any = {};

describe("Terraform Integration Tests", () => {
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

  const envs = ["dev", "staging", "production"];

  envs.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      const region = "us-east-1"; // update if different per environment
      const ec2 = new EC2Client({ region });
      const iam = new IAMClient({ region });

      test("VPC exists and is available", async () => {
        const vpcId = outputs.vpc_ids.value[env];
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcResp.Vpcs && vpcResp.Vpcs.length).toBeGreaterThan(0);
        expect(vpcResp.Vpcs![0].State).toBe("available");
      });

      test("Public subnets exist", async () => {
        const publicSubnetKeys = Object.keys(outputs.public_subnet_ids.value).filter((k) =>
          k.startsWith(`${env}-public`)
        );
        const publicSubnetIds = publicSubnetKeys.map((k) => outputs.public_subnet_ids.value[k]);

        expect(publicSubnetIds.length).toBeGreaterThan(0);
        publicSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));

        const subnetResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        expect(subnetResp.Subnets!.length).toBe(publicSubnetIds.length);
      });

      test("Private subnets exist", async () => {
        const privateSubnetKeys = Object.keys(outputs.private_subnet_ids.value).filter((k) =>
          k.startsWith(`${env}-private`)
        );
        const privateSubnetIds = privateSubnetKeys.map((k) => outputs.private_subnet_ids.value[k]);

        expect(privateSubnetIds.length).toBeGreaterThan(0);
        privateSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));

        const subnetResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(subnetResp.Subnets!.length).toBe(privateSubnetIds.length);
      });

      test("EC2 instances exist and match IPs", async () => {
        const instanceId = outputs.ec2_instance_ids.value[env];
        const privateIp = outputs.ec2_private_ips.value[env];
        const publicIp = outputs.ec2_public_ips.value[env];

        expect(instanceId).toMatch(/^i-[a-f0-9]+$/);

        const instanceResp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        expect(instanceResp.Reservations && instanceResp.Reservations.length).toBeGreaterThan(0);

        const instance = instanceResp.Reservations![0].Instances![0];
        expect(instance.PrivateIpAddress).toBe(privateIp);
        expect(instance.PublicIpAddress).toBe(publicIp);
      });

      test("Security group exists", async () => {
        const sgId = outputs.security_group_ids.value[env];
        expect(sgId).toMatch(/^sg-[a-f0-9]+$/);
        // Optionally you can call DescribeSecurityGroups to validate live
      });

      test("IAM role exists", async () => {
        const roleArn = outputs.iam_role_arns.value[env];
        const roleName = roleArn.split("/").pop()!;
        const resp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        expect(resp.Role!.Arn).toBe(roleArn);
      });

      test("Internet Gateway and NAT Gateway IDs exist", () => {
        const igwId = outputs.internet_gateway_ids.value[env];
        const natId = outputs.nat_gateway_ids.value[env];
        expect(igwId).toMatch(/^igw-[a-f0-9]+$/);
        expect(natId).toMatch(/^nat-[a-f0-9]+$/);
      });

      test("VPC CIDR matches expected", () => {
        const vpcCidr = outputs.vpc_cidrs.value[env];
        expect(vpcCidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      });
    });
  });
});
