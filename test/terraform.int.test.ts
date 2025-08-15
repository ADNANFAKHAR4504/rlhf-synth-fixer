// test/terraform.int.test.ts
import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";

interface TerraformOutputs {
  vpc_ids: Record<string, string>;
  public_subnet_ids: Record<string, string>;
  private_subnet_ids: Record<string, string[]>;
  [key: string]: unknown; // allow extra keys
}

interface RegionMap {
  [regionKey: string]: string; // e.g. { "us-east-1": "us-east-1" }
}

const REGION_KEYS: RegionMap = {
  "us-east-1": "us-east-1",
  "us-west-2": "us-west-2"
};

function loadOutputs(): TerraformOutputs {
  const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
  const raw = fs.readFileSync(outputsPath, "utf8");
  const parsed = JSON.parse(raw);

  // runtime validation for required keys
  ["vpc_ids", "public_subnet_ids", "private_subnet_ids"].forEach((key) => {
    if (!(key in parsed)) {
      throw new Error(`Missing required output key: ${key}`);
    }
  });

  return parsed as TerraformOutputs;
}

describe("Terraform Integration Tests", () => {
  let outputs: TerraformOutputs;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  Object.keys(REGION_KEYS).forEach((rid) => {
    const region = REGION_KEYS[rid];

    describe(`Region: ${region}`, () => {
      test("VPC exists and is available", async () => {
        const vpcId: string = outputs.vpc_ids[rid];
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const vpcResult = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcResult.Vpcs?.length).toBe(1);
        expect(vpcResult.Vpcs?.[0].State).toBe("available");
      });

      test("Public subnet exists", async () => {
        const publicSubnetId: string = outputs.public_subnet_ids[rid];
        expect(publicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const subnetResult = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
        expect(subnetResult.Subnets?.length).toBe(1);
      });

      test("Private subnets exist and match pattern", async () => {
        const privateSubnetIds: string[] = outputs.private_subnet_ids[rid];
        expect(Array.isArray(privateSubnetIds)).toBe(true);
        expect(privateSubnetIds.length).toBeGreaterThan(0);

        privateSubnetIds.forEach((s: string) => {
          expect(s).toMatch(/^subnet-[a-f0-9]+$/);
        });

        const ec2 = new EC2Client({ region });
        const subnetResult = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(subnetResult.Subnets?.length).toBe(privateSubnetIds.length);
      });
    });
  });
});

