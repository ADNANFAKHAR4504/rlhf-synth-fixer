import * as fs from "fs";
import * as path from "path";

type Environment = "dev" | "staging" | "production";
const environments: Environment[] = ["dev", "staging", "production"];

const outputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

let outputsRaw: any;
try {
  outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  throw new Error("Cannot load flattened outputs JSON");
}

// Your flat-outputs.json has JSON strings as values, so parse each now:
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(outputsRaw)) {
  try {
    outputs[key] = JSON.parse(val as string);
  } catch {
    // fallback: If parsing fails, keep original
    outputs[key] = val;
  }
}

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

describe("Flattened JSON Outputs Integration Tests", () => {
  it("should contain all required output keys", () => {
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
    describe(`Environment: ${env}`, () => {
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

      it("should have non-empty EC2 instance ID and matching summary info", () => {
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

      it("should have non-empty IGW and NAT gateway IDs", () => {
        expect(isNonEmptyString(envData.igwId)).toBe(true);
        expect(isNonEmptyString(envData.natGwId)).toBe(true);
      });
    });
  });

  describe("Cross-environment uniqueness and standards", () => {
    it("should have unique VPC and instance IDs, unique subnet IDs and CIDRs", () => {
      const vpcs = environments.map(env => outputs.vpc_ids[env]);
      expect(new Set(vpcs).size).toBe(vpcs.length);

      const instances = environments.map(env => outputs.ec2_instance_ids[env]);
      expect(new Set(instances).size).toBe(instances.length);

      const allPublicSubnets = Object.values(outputs.public_subnet_ids);
      const allPrivateSubnets = Object.values(outputs.private_subnet_ids);
      const allSubnets = [...allPublicSubnets, ...allPrivateSubnets];
      expect(new Set(allSubnets).size).toBe(allSubnets.length);

      const cidrs = environments.map(env => outputs.vpc_cidrs[env]);
      expect(new Set(cidrs).size).toBe(cidrs.length);
    });

    it("should have consistent IAM role naming and correct subnet counts", () => {
      environments.forEach(env => {
        expect(outputs.iam_role_arns[env]).toContain(`ec2-role-${env}`);
        expect(getSubnetIds(env, "public").length).toBe(2);
        expect(getSubnetIds(env, "private").length).toBe(2);
      });
    });
  });
});
