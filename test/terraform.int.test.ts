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

type Env = "dev" | "staging" | "production";
const environments: Env[] = ["dev", "staging", "production"];

describe("Terraform Integration Tests", () => {
  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      let vpcId: string;
      let publicSubnetIds: string[];
      let privateSubnetIds: string[];
      let instanceIds: string[];
      let iamRoleName: string;
      let igwId: string;
      let natGwId: string;
      let expectedCidr: string;

      beforeAll(() => {
        if (!outputs.vpc_id?.[env]) {
          console.warn(`⚠ Skipping ${env} tests: no outputs found for this environment`);
          return;
        }

        vpcId = outputs.vpc_id[env];
        publicSubnetIds = Object.entries(outputs.public_subnet_ids?.value || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        privateSubnetIds = Object.entries(outputs.private_subnet_ids?.value || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        instanceIds = Object.entries(outputs.ec2_instance_ids?.value || {})
          .filter(([key]) => key.startsWith(env))
          .map(([, id]) => id as string);
        iamRoleName = outputs.iam_role_name?.[env] || "";
        igwId = outputs.internet_gateway_id?.[env] || "";
        natGwId = outputs.nat_gateway_id?.[env] || "";
        expectedCidr = outputs.vpc_cidr?.[env] || "";
      });

      const skipIfNoEnv = () => {
        if (!outputs.vpc_id?.[env]) {
          console.warn(`Skipping ${env} test`);
          return true;
        }
        return false;
      };

      it("VPC exists and is available", async () => {
        if (skipIfNoEnv()) return;
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs && resp.Vpcs.length).toBeGreaterThan(0);
        expect(resp.Vpcs![0].State).toBe("available");
      });

      it("Public subnets exist", async () => {
        if (skipIfNoEnv()) return;
        publicSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        expect(resp.Subnets!.length).toBe(publicSubnetIds.length);
      });

      it("Private subnets exist", async () => {
        if (skipIfNoEnv()) return;
        privateSubnetIds.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(resp.Subnets!.length).toBe(privateSubnetIds.length);
      });

      it("EC2 instances exist", async () => {
        if (skipIfNoEnv()) return;
        instanceIds.forEach((i) => expect(i).toMatch(/^i-[a-f0-9]+$/));
        const resp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
        const allInstances = resp.Reservations?.flatMap((r) => r.Instances || []) || [];
        expect(allInstances.length).toBe(instanceIds.length);
      });

      it("IAM role exists", async () => {
        if (skipIfNoEnv()) return;
        if (!iamRoleName) throw new Error("IAM role name missing in outputs");
        const resp = await iam.send(new GetRoleCommand({ RoleName: iamRoleName }));
        expect(resp.Role).toBeDefined();
      });

      it("Internet Gateway and NAT Gateway IDs exist", () => {
        if (skipIfNoEnv()) return;
        expect(igwId).toMatch(/^igw-[a-f0-9]+$/);
        expect(natGwId).toMatch(/^nat-[a-f0-9]+$/);
      });

      it("VPC CIDR matches expected", async () => {
        if (skipIfNoEnv()) return;
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs![0].CidrBlock).toBe(expectedCidr);
      });
    });
  });
});
