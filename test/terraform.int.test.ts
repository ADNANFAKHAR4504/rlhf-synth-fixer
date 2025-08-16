import * as fs from "fs";
import * as path from "path";

type Environment = "dev" | "staging" | "production";
const environments: Environment[] = ["dev", "staging", "production"];

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");

let rawOutputs: any;
try {
  rawOutputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  throw new Error("Cannot load Terraform raw outputs for integration tests");
}

// Helper function to strip .value wrapper transitively for testing
function flattenOutputs(raw: any): any {
  if (typeof raw !== "object" || raw === null) {
    // primitive value
    return raw;
  }
  if ("value" in raw && Object.keys(raw).length === 3 && "type" in raw && "sensitive" in raw) {
    // Assume this is a Terraform output object, extract .value and recursively flatten
    return flattenOutputs(raw.value);
  }
  // Otherwise recursively flatten each property
  const result: any = {};
  for (const [k, v] of Object.entries(raw)) {
    result[k] = flattenOutputs(v);
  }
  return result;
}

const outputs = flattenOutputs(rawOutputs);

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getSubnetIds(env: Environment, type: "public" | "private"): string[] {
  const subnetMap = type === "public" ? outputs.public_subnet_ids : outputs.private_subnet_ids;
  const prefix = `${env}-${type}`;
  return Object.entries(subnetMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, val]) => val as string);
}

describe("Terraform Outputs Integration Tests with transient flattening", () => {
  it("should contain all required outputs", () => {
    const requiredKeys = [
      "ec2_instance_ids",
      "ec2_private_ips",
      "ec2_public_ips",
      "environment_summary",
      "iam_role_arns",
      "internet_gateway_ids",
      "nat_gateway_ids",
      "private_subnet_ids",
      "public_subnet_ids",
      "security_group_ids",
      "vpc_cidrs",
      "vpc_ids"
    ];
    requiredKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  environments.forEach(env => {
    describe(`Env: ${env}`, () => {
      const envData = {
        vpcId: outputs.vpc_ids[env],
        vpcCidr: outputs.vpc_cidrs[env],
        instanceId: outputs.ec2_instance_ids[env],
        privateIp: outputs.ec2_private_ips[env],
        publicIp: outputs.ec2_public_ips[env],
        iamRoleArn: outputs.iam_role_arns[env],
        igwId: outputs.internet_gateway_ids[env],
        natGwId: outputs.nat_gateway_ids[env],
        sgId: outputs.security_group_ids[env],
        summary: outputs.environment_summary[env],
        publicSubnetIds: getSubnetIds(env, "public"),
        privateSubnetIds: getSubnetIds(env, "private")
      };

      it("should have non-empty VPC ID and CIDR", () => {
        expect(isNonEmptyString(envData.vpcId)).toBe(true);
        expect(isNonEmptyString(envData.vpcCidr)).toBe(true);
      });

      it("should have exactly 2 public and 2 private subnets", () => {
        expect(envData.publicSubnetIds.length).toBe(2);
        expect(envData.privateSubnetIds.length).toBe(2);
        envData.publicSubnetIds.forEach(id => expect(isNonEmptyString(id)).toBe(true));
        envData.privateSubnetIds.forEach(id => expect(isNonEmptyString(id)).toBe(true));
      });

      it("should have non-empty EC2 instance ID and summary matching", () => {
        expect(isNonEmptyString(envData.instanceId)).toBe(true);
        expect(isNonEmptyString(envData.summary.instance_id)).toBe(true);
        expect(isNonEmptyString(envData.summary.instance_type)).toBe(true);
        expect(isNonEmptyString(envData.privateIp)).toBe(true);
        expect(isNonEmptyString(envData.publicIp)).toBe(true);

        expect(envData.summary.instance_id).toBe(envData.instanceId);
        expect(envData.summary.private_ip).toBe(envData.privateIp);
        expect(envData.summary.public_ip).toBe(envData.publicIp);
        expect(envData.summary.vpc_id).toBe(envData.vpcId);
        expect(envData.summary.vpc_cidr).toBe(envData.vpcCidr);
      });

      it("should have non-empty IAM role ARN", () => {
        expect(isNonEmptyString(envData.iamRoleArn)).toBe(true);
      });

      it("should have non-empty security group ID", () => {
        expect(isNonEmptyString(envData.sgId)).toBe(true);
      });

      it("should have non-empty IGW and NAT Gateway IDs", () => {
        expect(isNonEmptyString(envData.igwId)).toBe(true);
        expect(isNonEmptyString(envData.natGwId)).toBe(true);
      });
    });
  });

  describe("Cross-environment uniqueness and standards", () => {
    it("should have unique VPC IDs, instance IDs, subnet IDs, and CIDRs", () => {
      expect(new Set(environments.map(env => outputs.vpc_ids[env])).size).toBe(environments.length);
      expect(new Set(environments.map(env => outputs.ec2_instance_ids[env])).size).toBe(environments.length);

      const allPublicSubnets = Object.values(outputs.public_subnet_ids);
      const allPrivateSubnets = Object.values(outputs.private_subnet_ids);
      const allSubnets = [...allPublicSubnets, ...allPrivateSubnets];
      expect(new Set(allSubnets).size).toBe(allSubnets.length);

      const cidrs = environments.map(env => outputs.vpc_cidrs[env]);
      expect(new Set(cidrs).size).toBe(environments.length);
    });

    it("should have correct IAM role naming and HA subnets", () => {
      environments.forEach(env => {
        expect(outputs.iam_role_arns[env]).toContain(`ec2-role-${env}`);
        expect(getSubnetIds(env, "public").length).toBe(2);
        expect(getSubnetIds(env, "private").length).toBe(2);
      });
    });
  });
});
