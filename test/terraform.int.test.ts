import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

const ec2 = new EC2Client({});
const iam = new IAMClient({});

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// Dynamically get envs from vpc_ids keys
const environments = Object.keys(outputs.vpc_ids || {});

describe("Terraform Integration Tests", () => {
  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      let vpcId: string;
      let publicSubnetIds: string[];
      let privateSubnetIds: string[];
      let instanceIds: string[];
      let iamRoleArn: string;
      let iamRoleName: string;
      let igwId: string;
      let natGwId: string;
      let expectedCidr: string;

      beforeAll(() => {
        vpcId = outputs.vpc_ids[env];
        publicSubnetIds = Object.entries(outputs.public_subnet_ids || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        privateSubnetIds = Object.entries(outputs.private_subnet_ids || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        instanceIds = Object.entries(outputs.ec2_instance_ids || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        iamRoleArn = outputs.iam_role_arns?.[env] || "";
        iamRoleName = iamRoleArn.split("/").pop() || "";
        igwId = outputs.internet_gateway_ids?.[env] || "";
        natGwId = outputs.nat_gateway_ids?.[env] || "";
        expectedCidr = outputs.vpc_cidrs?.[env] || "";
      });

      it("VPC exists and is available", async () => {
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs && resp.Vpcs.length).toBeGreaterThan(0);
        expect(resp.Vpcs![0].State).toBe("available");
      });

      it("Public subnets exist", async () => {
        publicSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        expect(resp.Subnets!.length).toBe(publicSubnetIds.length);
      });

      it("Private subnets exist", async () => {
        privateSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(resp.Subnets!.length).toBe(privateSubnetIds.length);
      });

      it("EC2 instances exist", async () => {
        instanceIds.forEach((i) => expect(i).toMatch(/^i-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
        const allInstances = resp.Reservations?.flatMap((r) => r.Instances || []) || [];
        expect(allInstances.length).toBe(instanceIds.length);
      });

      it("IAM role exists", async () => {
        expect(iamRoleName).toBeTruthy();
        const resp = await iam.send(new GetRoleCommand({ RoleName: iamRoleName }));
        expect(resp.Role).toBeDefined();
      });

      it("Internet Gateway and NAT Gateway IDs exist", () => {
        expect(igwId).toMatch(/^igw-[a-f0-9]+$/);
        expect(natGwId).toMatch(/^nat-[a-f0-9]+$/);
      });

      it("VPC CIDR matches expected", async () => {
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs![0].CidrBlock).toBe(expectedCidr);
      });
    });
  });
});
