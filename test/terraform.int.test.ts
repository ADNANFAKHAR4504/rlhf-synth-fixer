import * as fs from "fs";
import * as path from "path";

type Environment = "dev" | "staging" | "production";
const environments: Environment[] = ["dev", "staging", "production"];

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
let outputs: any;
try {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  throw new Error("Cannot load Terraform outputs for integration tests");
}

// Helper functions - simple non-empty checks
function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getSubnetIds(env: Environment, type: "public" | "private"): string[] {
  const subnetMap = type === "public" ? outputs.public_subnet_ids.value : outputs.private_subnet_ids.value;
  const prefix = `${env}-${type}`;
  return Object.entries(subnetMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, val]) => val as string);
}

describe("Outputs.json Infrastructure Coverage (Simplified)", () => {
  it("should contain all required keys", () => {
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
      expect(outputs[key]).toHaveProperty("value");
    });
  });

  environments.forEach(env => {
    describe(`Env: ${env} -- basic presence checks`, () => {
      const envData = {
        vpcId: outputs.vpc_ids.value[env],
        vpcCidr: outputs.vpc_cidrs.value[env],
        instanceId: outputs.ec2_instance_ids.value[env],
        privateIp: outputs.ec2_private_ips.value[env],
        publicIp: outputs.ec2_public_ips.value[env],
        iamRoleArn: outputs.iam_role_arns.value[env],
        igwId: outputs.internet_gateway_ids.value[env],
        natGwId: outputs.nat_gateway_ids.value[env],
        sgId: outputs.security_group_ids.value[env],
        summary: outputs.environment_summary.value[env],
        publicSubnetIds: getSubnetIds(env, "public"),
        privateSubnetIds: getSubnetIds(env, "private")
      };

      it("should have non-empty VPC ID and CIDR", () => {
        expect(isNonEmptyString(envData.vpcId)).toBe(true);
        expect(isNonEmptyString(envData.vpcCidr)).toBe(true);
      });

      it("should have two public and two private subnets", () => {
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
        expect(isNonEmptyString(envData.summary.private_ip)).toBe(true);
        expect(isNonEmptyString(envData.summary.public_ip)).toBe(true);
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

  describe("Cross-environment uniqueness and presence", () => {
    it("should have unique VPC and instance IDs, and unique subnet IDs and CIDRs", () => {
      expect(new Set(environments.map(env => outputs.vpc_ids.value[env])).size).toBe(environments.length);
      expect(new Set(environments.map(env => outputs.ec2_instance_ids.value[env])).size).toBe(environments.length);

      const allPublicSubnets = Object.values(outputs.public_subnet_ids.value);
      const allPrivateSubnets = Object.values(outputs.private_subnet_ids.value);
      const allSubnets = [...allPublicSubnets, ...allPrivateSubnets];
      expect(new Set(allSubnets).size).toBe(allSubnets.length);

      const cidrs = environments.map(env => outputs.vpc_cidrs.value[env]);
      expect(new Set(cidrs).size).toBe(environments.length);
    });

    it("should have proper subnet counts and IAM role naming", () => {
      environments.forEach(env => {
        expect(outputs.iam_role_arns.value[env]).toContain(`ec2-role-${env}`);
        expect(getSubnetIds(env, "public").length).toBe(2);
        expect(getSubnetIds(env, "private").length).toBe(2);
      });
    });
  });
});
