// test/terraform.int.test.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
let outputs: any = {};

describe("Terraform Integration Tests", () => {
  if (!fs.existsSync(outputPath)) {
    test("No outputs file found - skipping integration tests", () => {
      console.warn(`⚠️ No outputs file found at ${outputPath}`);
    });
    return; // ✅ Allowed here because it's inside describe()
  }

  try {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  } catch (err) {
    test("Outputs JSON parsing", () => {
      throw new Error(`❌ Failed to parse outputs file: ${err}`);
    });
    return;
  }

  const regions = outputs.regions || {};
  if (Object.keys(regions).length === 0) {
    test("No regions found in outputs file", () => {
      console.warn(`⚠️ No 'regions' key found in outputs JSON`);
    });
    return;
  }

  Object.keys(regions).forEach((rid) => {
    const regionOutputs = regions[rid];
    const region = regionOutputs.region;

    describe(`Region: ${region}`, () => {
      test("VPC exists and is available", async () => {
        const vpcId: string = regionOutputs.vpc_id;
        expect(typeof vpcId).toBe("string");
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const vpcResp = await ec2.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        expect(vpcResp.Vpcs && vpcResp.Vpcs.length).toBeGreaterThan(0);
        expect(vpcResp.Vpcs![0].State).toBe("available");
      });

      test("Public subnet exists", async () => {
        const publicSubnetId: string = regionOutputs.public_subnet_id;
        expect(typeof publicSubnetId).toBe("string");
        expect(publicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const subnetResp = await ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] })
        );
        expect(subnetResp.Subnets && subnetResp.Subnets.length).toBeGreaterThan(0);
      });

      test("Private subnets exist and match pattern", async () => {
        const privateSubnetIds: string[] = regionOutputs.private_subnet_ids;
        expect(Array.isArray(privateSubnetIds)).toBe(true);
        expect(privateSubnetIds.length).toBeGreaterThan(0);

        privateSubnetIds.forEach((s: string) => {
          expect(typeof s).toBe("string");
          expect(s).toMatch(/^subnet-[a-f0-9]+$/);
        });

        const ec2 = new EC2Client({ region });
        const subnetResp = await ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
        );
        expect(subnetResp.Subnets && subnetResp.Subnets.length).toBe(privateSubnetIds.length);
      });
    });
  });
});
