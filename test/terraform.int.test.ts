// test/terraform.int.test.ts
import path from "path";
import fs from "fs";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";

// Use the exact path from your CI/CD setup
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const outputsRaw = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

// Parse JSON strings in flat outputs into objects
function parseIfJson(val: unknown): unknown {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

// Convert all stringified JSON values to proper JS objects/arrays
const outputs = Object.fromEntries(
  Object.entries(outputsRaw).map(([k, v]) => [k, parseIfJson(v)])
) as {
  vpc_ids: Record<string, string>;
  public_subnet_ids: Record<string, string>;
  private_subnet_ids: Record<string, string[]>;
};

// Map of Terraform region keys to AWS SDK region names
const REGION_KEYS: Record<string, string> = {
  us_east_2: "us-east-2",
  us_west_1: "us-west-1",
};

describe("Terraform Integration Tests", () => {
  Object.keys(REGION_KEYS).forEach((rid) => {
    const region = REGION_KEYS[rid];

    describe(`Region: ${rid}`, () => {
      test("VPC exists and is available", async () => {
        const vpcId: string = outputs.vpc_ids[rid];
        expect(typeof vpcId).toBe("string");
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const vpcResult = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcResult.Vpcs && vpcResult.Vpcs.length).toBeGreaterThan(0);
      });

      test("Public subnet exists", async () => {
        const publicSubnetId: string = outputs.public_subnet_ids[rid];
        expect(typeof publicSubnetId).toBe("string");
        expect(publicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const subnetResult = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
        expect(subnetResult.Subnets && subnetResult.Subnets.length).toBeGreaterThan(0);
      });

      test("Private subnets exist and match pattern", async () => {
        const privateSubnetIds: string[] = outputs.private_subnet_ids[rid];
        expect(Array.isArray(privateSubnetIds)).toBe(true);
        expect(privateSubnetIds.length).toBeGreaterThan(0);

        privateSubnetIds.forEach((s: string) => {
          expect(typeof s).toBe("string");
          expect(s).toMatch(/^subnet-[a-f0-9]+$/);
        });

        const ec2 = new EC2Client({ region });
        const subnetResult = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(subnetResult.Subnets && subnetResult.Subnets.length).toBe(privateSubnetIds.length);
      });
    });
  });
});

