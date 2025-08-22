import * as fs from "fs";
import * as path from "path";

type Environment = "staging" | "production";
const environments: Environment[] = ["staging", "production"];

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Load JSON outputs
const outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// Parse JSON-string fields from the outputs file
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(outputsRaw)) {
  try {
    outputs[key] = JSON.parse(val as string);
  } catch {
    outputs[key] = val;
  }
}

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// For subnet IDs, filter keys beginning with environment-subnet-type prefix
function getSubnetIds(env: Environment, type: "public" | "private"): string[] {
  const subnetMap = type === "public" ? outputs.public_subnet_ids : outputs.private_subnet_ids;
  const prefix = `${env}-${type}`;
  return Object.entries(subnetMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, val]) => val as string);
}

describe("Terraform Flat Outputs Integration Tests", () => {
  it("should contain all expected output keys", () => {
    // List of keys you definitely have in your outputs JSON
    const requiredKeys = [
      "vpc_ids",
      "public_subnet_ids",
      "private_subnet_ids",
      "ec2_instance_ids",
      "ec2_private_ips",
      "alb_dns_names",
      "rds_endpoints",
      "vpc_peering_connection_id",
      "cloudwatch_log_groups"
    ];
    requiredKeys.forEach((key) => {
      expect(outputs).toHaveProperty(key);
    });
  });

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      // Gather all web instance keys for this environment (e.g., staging-web-0, staging-web-1)
      const envWebKeys = Object.keys(outputs.ec2_instance_ids).filter(k => k.startsWith(env));

      it("should have valid VPC ID", () => {
        expect(isNonEmptyString(outputs.vpc_ids[env])).toBe(true);
      });

      it("should have exactly 2 public and 2 private subnet IDs", () => {
        const publicSubs = getSubnetIds(env, "public");
        const privateSubs = getSubnetIds(env, "private");
        expect(publicSubs.length).toBe(2);
        expect(privateSubs.length).toBe(2);
        publicSubs.forEach((sub) => expect(isNonEmptyString(sub)).toBe(true));
        privateSubs.forEach((sub) => expect(isNonEmptyString(sub)).toBe(true));
      });

      it("should have EC2 instances with IDs and private IPs", () => {
        envWebKeys.forEach((key) => {
          expect(isNonEmptyString(outputs.ec2_instance_ids[key])).toBe(true);
          expect(isNonEmptyString(outputs.ec2_private_ips[key])).toBe(true);
        });
      });

      it("should have ALB DNS name for environment", () => {
        expect(isNonEmptyString(outputs.alb_dns_names[env])).toBe(true);
      });

      it("should have RDS endpoint for environment", () => {
        expect(isNonEmptyString(outputs.rds_endpoints[env])).toBe(true);
      });
    });
  });

  describe("Cross-environment uniqueness and consistency", () => {
    it("should have unique VPC IDs", () => {
      const ids = environments.map((env) => outputs.vpc_ids[env]);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should have unique EC2 instance IDs", () => {
      const allInstanceIds = Object.values(outputs.ec2_instance_ids);
      expect(new Set(allInstanceIds).size).toBe(allInstanceIds.length);
    });

    it("should have unique subnet IDs across public and private", () => {
      const allSubnets = [...Object.values(outputs.public_subnet_ids), ...Object.values(outputs.private_subnet_ids)];
      expect(new Set(allSubnets).size).toBe(allSubnets.length);
    });
  });
});
