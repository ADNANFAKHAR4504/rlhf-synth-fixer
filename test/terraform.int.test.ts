import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";

// Path to flat outputs JSON file
const outputPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Load and auto-parse structured values
function loadOutputs(filePath: string) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      try {
        const maybeParsed = JSON.parse(value);
        // Only use parsed if it’s actually an object or array
        if (typeof maybeParsed === "object" && maybeParsed !== null) {
          parsed[key] = maybeParsed;
          continue;
        }
      } catch {
        // Not JSON — keep as string
      }
    }
    parsed[key] = value;
  }

  return parsed;
}

const outputs = loadOutputs(outputPath);

describe("Terraform Integration Tests", () => {
  const regions = Object.keys(outputs.vpc_ids); // now works because vpc_ids is parsed

  regions.forEach((rid) => {
    const region = rid.replace(/_/g, "-");

    describe(`Region: ${rid}`, () => {
      test("VPC exists and is available", async () => {
        const vpcId: string = outputs.vpc_ids[rid];
        expect(typeof vpcId).toBe("string");
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcResp.Vpcs?.[0]?.State).toBe("available");
      });

      test("Public subnet exists", async () => {
        const publicSubnetId: string = outputs.public_subnet_ids[rid];
        expect(typeof publicSubnetId).toBe("string");
        expect(publicSubnetId).toMatch(/^subnet-[a-f0-9]+$/);

        const ec2 = new EC2Client({ region });
        const subnetResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
        expect(subnetResp.Subnets?.[0]?.State).toBe("available");
      });

      test("Private subnets exist and match pattern", async () => {
        const privateSubnetIds: string[] = outputs.private_subnet_ids[rid];
        expect(Array.isArray(privateSubnetIds)).toBe(true);
        expect(privateSubnetIds.length).toBeGreaterThan(0);

        privateSubnetIds.forEach((s: string) => {
          expect(typeof s).toBe("string");
          expect(s).toMatch(/^subnet-[a-f0-9]+$/);
        });
      });
    });
  });
});

