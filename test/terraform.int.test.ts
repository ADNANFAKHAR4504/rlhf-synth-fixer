import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";

// Path to CI/CD pipeline outputs
const outputPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Load outputs file
let outputs: any = {};
let hasDeployedResources = false;

try {
  if (fs.existsSync(outputPath)) {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    hasDeployedResources = true;
  } else {
    console.warn(`⚠️ No outputs file found at ${outputPath}, skipping integration tests`);
  }
} catch (err) {
  console.error(`❌ Failed to read outputs file: ${err}`);
}

if (hasDeployedResources) {
  describe("Terraform Integration Tests", () => {
    Object.keys(outputs.regions || {}).forEach((regionKey) => {
      const region = outputs.regions[regionKey];
      const rid = regionKey; // same key used in vpc_ids / subnet_ids maps

      describe(`Region: ${region}`, () => {
        test("VPC exists and is available", async () => {
          const vpcId = outputs.vpc_ids?.[rid]?.value ?? outputs.vpc_ids?.[rid];
          expect(typeof vpcId).toBe("string");
          expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

          const ec2 = new EC2Client({ region });
          const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
          expect(res.Vpcs?.length).toBeGreaterThan(0);
          expect(res.Vpcs?.[0].State).toBe("available");
        });

        test("Public subnet exists", async () => {
          const publicSubnetId =
            outputs.public_subnet_ids?.[rid]?.value ?? outputs.public_subnet_ids?.[rid];
          expect(typeof publicSubnetId).toBe("string");
          expect(publicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);

          const ec2 = new EC2Client({ region });
          const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
          expect(res.Subnets?.length).toBeGreaterThan(0);
        });

        test("Private subnets exist and match pattern", async () => {
          const privateSubnetIds =
            outputs.private_subnet_ids?.[rid]?.value ?? outputs.private_subnet_ids?.[rid];
          expect(Array.isArray(privateSubnetIds)).toBe(true);
          expect(privateSubnetIds.length).toBeGreaterThan(0);

          privateSubnetIds.forEach((s: string) => {
            expect(typeof s).toBe("string");
            expect(s).toMatch(/^subnet-[a-f0-9]+$/);
          });

          const ec2 = new EC2Client({ region });
          const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
          expect(res.Subnets?.length).toBeGreaterThan(0);
        });
      });
    });
  });
} else {
  describe("Terraform Integration Tests", () => {
    test.skip("No deployed resources found — skipping all tests", () => {});
  });
}

