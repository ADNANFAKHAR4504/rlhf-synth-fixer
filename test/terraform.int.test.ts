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

function isValidIP(ip: string): boolean {
  return /^(?:25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4][0-9]|1\d{2}|[1-9]?\d)){3}$/.test(ip);
}

function isValidCIDR(cidr: string): boolean {
  const cidrRegex = /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}\/(?:[0-9]|[1-2]\d|3[0-2])$/;
  return cidrRegex.test(cidr);
}

function isValidResourceId(id: string, type: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    vpc: /^vpc-[0-9a-f]{8,17}$/,
    subnet: /^subnet-[0-9a-f]{8,17}$/,
    igw: /^igw-[0-9a-f]{8,17}$/,
    nat: /^nat-[0-9a-f]{8,17}$/,
    sg: /^sg-[0-9a-f]{8,17}$/,
    instance: /^i-[0-9a-f]{8,17}$/,
    arn: /^arn:aws:iam::\d{12}:role\/ec2-role-(dev|staging|production)$/
  };
  return patterns[type]?.test(id) || false;
}

function getSubnetIds(env: Environment, type: 'public' | 'private'): string[] {
  const subnetMap = type === 'public' ? outputs.public_subnet_ids : outputs.private_subnet_ids;
  const prefix = `${env}-${type}`;
  return Object.entries(subnetMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, val]) => val);
}

describe("Outputs.json Infrastructure Coverage", () => {
  it("should contain all required keys", () => {
    const requiredKeys = [
      "ec2_instance_ids", "ec2_private_ips", "ec2_public_ips",
      "environment_summary", "iam_role_arns", "internet_gateway_ids",
      "nat_gateway_ids", "private_subnet_ids", "public_subnet_ids",
      "security_group_ids", "vpc_cidrs", "vpc_ids"
    ];
    requiredKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  environments.forEach(env => {
    describe(`Env: ${env} -- VPC, Subnets, EC2, IAM, Security Group`, () => {
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
        publicSubnetIds: getSubnetIds(env, 'public'),
        privateSubnetIds: getSubnetIds(env, 'private')
      };

      it("should have valid VPC ID and correct CIDR", () => {
        expect(isValidResourceId(envData.vpcId, 'vpc')).toBe(true);
        expect(isValidCIDR(envData.vpcCidr)).toBe(true);
      });

      it("should have two valid public and two valid private subnets", () => {
        expect(envData.publicSubnetIds.length).toBe(2);
        expect(envData.privateSubnetIds.length).toBe(2);
        envData.publicSubnetIds.forEach(id => expect(isValidResourceId(id, 'subnet')).toBe(true));
        envData.privateSubnetIds.forEach(id => expect(isValidResourceId(id, 'subnet')).toBe(true));
      });

      it("should have valid EC2 instance ID, correct instance type, and matching summary info", () => {
        expect(isValidResourceId(envData.instanceId, 'instance')).toBe(true);
        const expectedTypes = { dev: 't2.micro', staging: 't3.medium', production: 'm5.large' };
        expect(envData.summary.instance_type).toBe(expectedTypes[env]);
        expect(envData.summary.instance_id).toBe(envData.instanceId);
        expect(isValidIP(envData.privateIp)).toBe(true);
        expect(isValidIP(envData.publicIp)).toBe(true);
        expect(envData.summary.private_ip).toBe(envData.privateIp);
        expect(envData.summary.public_ip).toBe(envData.publicIp);
        expect(envData.summary.vpc_id).toBe(envData.vpcId);
        expect(envData.summary.vpc_cidr).toBe(envData.vpcCidr);
      });

      it("should have valid IAM role ARN for environment", () => {
        expect(isValidResourceId(envData.iamRoleArn, 'arn')).toBe(true);
      });

      it("should have valid security group ID", () => {
        expect(isValidResourceId(envData.sgId, 'sg')).toBe(true);
      });

      it("should have valid IGW and NAT gateway IDs", () => {
        expect(isValidResourceId(envData.igwId, 'igw')).toBe(true);
        expect(isValidResourceId(envData.natGwId, 'nat')).toBe(true);
      });
    });
  });

  describe("Cross-environment uniqueness and standards", () => {
    it("should have unique VPC IDs, instance IDs, subnet IDs, and non-overlapping CIDRs", () => {
      expect(new Set(environments.map(env => outputs.vpc_ids[env])).size).toBe(environments.length);
      expect(new Set(environments.map(env => outputs.ec2_instance_ids[env])).size).toBe(environments.length);

      const allPublicSubnets = Object.values(outputs.public_subnet_ids);
      const allPrivateSubnets = Object.values(outputs.private_subnet_ids);
      const allSubnets = [...allPublicSubnets, ...allPrivateSubnets];
      expect(new Set(allSubnets).size).toBe(allSubnets.length);

      const cidrs = environments.map(env => outputs.vpc_cidrs[env]);
      expect(new Set(cidrs).size).toBe(environments.length);
    });

    it("should follow naming conventions and standards for HA", () => {
      environments.forEach(env => {
        expect(outputs.iam_role_arns[env]).toContain(`ec2-role-${env}`);
        expect(getSubnetIds(env, 'public').length).toBe(2);
        expect(getSubnetIds(env, 'private').length).toBe(2);
      });
    });
  });
});
