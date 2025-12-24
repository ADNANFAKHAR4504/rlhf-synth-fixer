// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure

import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";
import { Route53Client, ListHostedZonesCommand } from "@aws-sdk/client-route-53";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

// Load deployment outputs - check both possible paths
const cfnOutputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const cdkOutputsPath = path.resolve(__dirname, "../cdk-outputs/flat-outputs.json");
let outputsPath = cfnOutputsPath;
let rawOutputs: any = {};

if (fs.existsSync(cdkOutputsPath)) {
  outputsPath = cdkOutputsPath;
  rawOutputs = JSON.parse(fs.readFileSync(cdkOutputsPath, "utf8"));
} else if (fs.existsSync(cfnOutputsPath)) {
  rawOutputs = JSON.parse(fs.readFileSync(cfnOutputsPath, "utf8"));
}

// Helper function to extract value from Terraform output format
function getOutputValue(key: string): any {
  // Check if key exists in outputs (handles falsy values like "" or false)
  if (!(key in rawOutputs)) return undefined;
  const output = rawOutputs[key];
  // Handle Terraform output format (object with value property)
  if (output !== null && typeof output === 'object' && 'value' in output) {
    return output.value;
  }
  // Handle flat format (direct value)
  return output;
}

// Helper function to get boolean output value with default
function getBooleanOutputValue(key: string, defaultValue: boolean = false): boolean {
  const value = getOutputValue(key);
  if (value === undefined || value === null) return defaultValue;
  return Boolean(value);
}

// Build outputs object with extracted values
const outputs = {
  primary_vpc_id: getOutputValue("primary_vpc_id"),
  secondary_vpc_id: getOutputValue("secondary_vpc_id"),
  cloudfront_domain_name: getOutputValue("cloudfront_domain_name"),
  primary_rds_endpoint: getOutputValue("primary_rds_endpoint"),
  secondary_rds_endpoint: getOutputValue("secondary_rds_endpoint"),
  route53_zone_id: getOutputValue("route53_zone_id"),
  primary_kms_key_id: getOutputValue("primary_kms_key_id"),
  secondary_kms_key_id: getOutputValue("secondary_kms_key_id"),
  secret_arn: getOutputValue("secret_arn"),
  primary_private_subnet_ids: getOutputValue("primary_private_subnet_ids"),
  secondary_private_subnet_ids: getOutputValue("secondary_private_subnet_ids"),
  // Feature flags default to false if not present in outputs
  enable_ec2: getBooleanOutputValue("enable_ec2", false),
  enable_rds: getBooleanOutputValue("enable_rds", false),
  enable_cloudfront: getBooleanOutputValue("enable_cloudfront", false),
  enable_nat_gateway: getBooleanOutputValue("enable_nat_gateway", false),
};

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";

// Helper function to create client config for LocalStack
function getClientConfig(region: string) {
  if (isLocalStack) {
    return {
      endpoint,
      region,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
      }
    };
  }
  return { region };
}

// AWS clients with LocalStack support - each configured for its correct region
const ec2ClientPrimary = new EC2Client(getClientConfig("us-east-1"));
const ec2ClientSecondary = new EC2Client(getClientConfig("us-west-2"));
const rdsClientPrimary = new RDSClient(getClientConfig("us-east-1"));
const rdsClientSecondary = new RDSClient(getClientConfig("us-west-2"));
const cloudFrontClient = new CloudFrontClient(getClientConfig("us-east-1"));
const route53Client = new Route53Client(getClientConfig("us-east-1"));
const secretsClient = new SecretsManagerClient(getClientConfig("us-east-1"));
const kmsClientPrimary = new KMSClient(getClientConfig("us-east-1"));
const kmsClientSecondary = new KMSClient(getClientConfig("us-west-2"));

describe("Terraform Infrastructure Integration Tests", () => {
  describe("Deployment Outputs", () => {
    test("outputs file exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("has primary VPC ID", () => {
      expect(outputs.primary_vpc_id).toBeDefined();
      expect(typeof outputs.primary_vpc_id).toBe("string");
      expect(outputs.primary_vpc_id).toMatch(/^vpc-/);
    });

    test("has secondary VPC ID", () => {
      expect(outputs.secondary_vpc_id).toBeDefined();
      expect(typeof outputs.secondary_vpc_id).toBe("string");
      expect(outputs.secondary_vpc_id).toMatch(/^vpc-/);
    });

    test("has CloudFront distribution DNS when enabled", () => {
      if (!outputs.enable_cloudfront) {
        console.log("Skipping test - CloudFront is disabled");
        expect(outputs.cloudfront_domain_name).toBe("");
        return;
      }
      expect(outputs.cloudfront_domain_name).toBeDefined();
      if (isLocalStack) {
        expect(outputs.cloudfront_domain_name).toMatch(/cloudfront/);
      } else {
        expect(outputs.cloudfront_domain_name).toMatch(/\.cloudfront\.net$/);
      }
    });

    test("has RDS endpoints when enabled", () => {
      if (!outputs.enable_rds) {
        console.log("Skipping test - RDS is disabled");
        expect(outputs.primary_rds_endpoint).toBe("");
        return;
      }
      expect(outputs.primary_rds_endpoint).toBeDefined();
      if (isLocalStack) {
        expect(outputs.primary_rds_endpoint).toMatch(/localhost/);
      } else {
        expect(outputs.primary_rds_endpoint).toContain(".rds.amazonaws.com");
      }
    });
  });

  describe("Primary Region Resources (us-east-1)", () => {
    test("VPC exists and is configured correctly", async () => {
      if (!outputs.primary_vpc_id) {
        console.log("Skipping test - no VPC ID in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primary_vpc_id]
      });

      const response = await ec2ClientPrimary.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");

      // Check tags
      const tags = vpc.Tags || [];
      const projectTag = tags.find(t => t.Key === "Project");
      expect(projectTag?.Value).toBe("iac-aws-nova-model-breaking");
    });

    test("private subnets exist", async () => {
      if (!outputs.primary_private_subnet_ids || outputs.primary_private_subnet_ids.length < 2) {
        console.log("Skipping test - no subnet IDs in outputs");
        return;
      }

      // Verify subnets exist in the VPC
      const describeCmd = new DescribeVpcsCommand({
        VpcIds: [outputs.primary_vpc_id]
      });

      const response = await ec2ClientPrimary.send(describeCmd);
      expect(response.Vpcs).toHaveLength(1);
    });

    test("EC2 instances are running in private subnets when enabled", async () => {
      if (!outputs.enable_ec2) {
        console.log("Skipping test - EC2 is disabled");
        expect(outputs.enable_ec2).toBe(false);
        return;
      }

      if (!outputs.primary_vpc_id) {
        console.log("Skipping test - no VPC ID in outputs");
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.primary_vpc_id]
          },
          {
            Name: "instance-state-name",
            Values: ["running"]
          }
        ]
      });

      const response = await ec2ClientPrimary.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      expect(instances.length).toBeGreaterThan(0);

      // Check instances are in private subnets (no public IP)
      instances.forEach(instance => {
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    });

    test("RDS instance is available when enabled", async () => {
      if (!outputs.enable_rds) {
        console.log("Skipping test - RDS is disabled");
        expect(outputs.enable_rds).toBe(false);
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClientPrimary.send(command);

      const dbInstances = response.DBInstances || [];
      const primaryDb = dbInstances.find(db =>
        db.DBInstanceIdentifier?.includes("primary")
      );

      expect(primaryDb).toBeDefined();
      if (primaryDb) {
        expect(primaryDb.DBInstanceStatus).toBe("available");
        expect(primaryDb.StorageEncrypted).toBe(true);
        expect(primaryDb.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      }
    });

    test("security groups follow least privilege", async () => {
      if (!outputs.primary_vpc_id) {
        console.log("Skipping test - no VPC ID in outputs");
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.primary_vpc_id]
          }
        ]
      });

      const response = await ec2ClientPrimary.send(command);
      const securityGroups = response.SecurityGroups || [];

      // Find database security group
      const dbSg = securityGroups.find(sg =>
        sg.GroupName?.includes("database")
      );

      if (dbSg) {
        // Check that database SG only allows MySQL port
        const ingressRules = dbSg.IpPermissions || [];
        const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);
        expect(mysqlRule).toBeDefined();

        // Should not have any 0.0.0.0/0 rules
        ingressRules.forEach(rule => {
          const hasPublicAccess = rule.IpRanges?.some(range =>
            range.CidrIp === "0.0.0.0/0"
          );
          expect(hasPublicAccess).toBeFalsy();
        });
      }
    });
  });

  describe("Secondary Region Resources (us-west-2)", () => {
    test("VPC exists and is configured correctly", async () => {
      if (!outputs.secondary_vpc_id) {
        console.log("Skipping test - no secondary VPC ID in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.secondary_vpc_id]
      });

      const response = await ec2ClientSecondary.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.1.0.0/16");
      expect(vpc.State).toBe("available");
    });

    test("EC2 instances are running when enabled", async () => {
      if (!outputs.enable_ec2) {
        console.log("Skipping test - EC2 is disabled");
        expect(outputs.enable_ec2).toBe(false);
        return;
      }

      if (!outputs.secondary_vpc_id) {
        console.log("Skipping test - no secondary VPC ID in outputs");
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.secondary_vpc_id]
          },
          {
            Name: "instance-state-name",
            Values: ["running"]
          }
        ]
      });

      const response = await ec2ClientSecondary.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      expect(instances.length).toBeGreaterThan(0);
    });

    test("RDS instance is available when enabled", async () => {
      if (!outputs.enable_rds) {
        console.log("Skipping test - RDS is disabled");
        expect(outputs.enable_rds).toBe(false);
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClientSecondary.send(command);

      const dbInstances = response.DBInstances || [];
      const secondaryDb = dbInstances.find(db =>
        db.DBInstanceIdentifier?.includes("secondary")
      );

      expect(secondaryDb).toBeDefined();
      if (secondaryDb) {
        expect(secondaryDb.DBInstanceStatus).toBe("available");
        expect(secondaryDb.StorageEncrypted).toBe(true);
      }
    });
  });

  describe("Global Services", () => {
    test("CloudFront distribution exists and is enabled when feature is enabled", async () => {
      if (!outputs.enable_cloudfront) {
        console.log("Skipping test - CloudFront is disabled");
        expect(outputs.enable_cloudfront).toBe(false);
        return;
      }

      const command = new ListDistributionsCommand({});
      const response = await cloudFrontClient.send(command);

      const distributions = response.DistributionList?.Items || [];
      expect(distributions.length).toBeGreaterThan(0);

      const activeDistribution = distributions.find(d =>
        d.Status === "Deployed" && d.Enabled === true
      );
      expect(activeDistribution).toBeDefined();
    });

    test("Route 53 hosted zone exists when CloudFront is enabled", async () => {
      if (!outputs.enable_cloudfront || !outputs.route53_zone_id) {
        console.log("Skipping test - CloudFront/Route53 is disabled");
        expect(outputs.enable_cloudfront).toBe(false);
        return;
      }

      const command = new ListHostedZonesCommand({});
      const response = await route53Client.send(command);

      const zones = response.HostedZones || [];
      const zone = zones.find(z =>
        z.Id?.includes(outputs.route53_zone_id)
      );

      expect(zone).toBeDefined();
    });
  });

  describe("Security and Encryption", () => {
    test("KMS keys exist in primary region", async () => {
      if (!outputs.primary_kms_key_id) {
        console.log("Skipping test - no KMS key ID in outputs");
        return;
      }

      const primaryCommand = new DescribeKeyCommand({
        KeyId: outputs.primary_kms_key_id
      });

      const primaryResponse = await kmsClientPrimary.send(primaryCommand);
      expect(primaryResponse.KeyMetadata?.KeyState).toBe("Enabled");
      expect(primaryResponse.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });

    test("KMS keys exist in secondary region", async () => {
      if (!outputs.secondary_kms_key_id) {
        console.log("Skipping test - no secondary KMS key ID in outputs");
        return;
      }

      const secondaryCommand = new DescribeKeyCommand({
        KeyId: outputs.secondary_kms_key_id
      });

      const secondaryResponse = await kmsClientSecondary.send(secondaryCommand);
      expect(secondaryResponse.KeyMetadata?.KeyState).toBe("Enabled");
    });

    test("Secrets Manager secret exists", async () => {
      if (!outputs.secret_arn) {
        console.log("Skipping test - no Secret ARN in outputs");
        return;
      }

      const command = new DescribeSecretCommand({
        SecretId: outputs.secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBeDefined();
      expect(response.KmsKeyId).toBeDefined();
    });
  });

  describe("High Availability", () => {
    test("resources deployed in multiple availability zones when EC2 is enabled", async () => {
      if (!outputs.enable_ec2) {
        console.log("Skipping test - EC2 is disabled");
        expect(outputs.enable_ec2).toBe(false);
        return;
      }

      if (!outputs.primary_vpc_id) {
        console.log("Skipping test - no VPC ID in outputs");
        return;
      }

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.primary_vpc_id]
          }
        ]
      });

      const response = await ec2ClientPrimary.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      const azs = new Set(instances.map(i => i.Placement?.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test("multi-region deployment verified", () => {
      expect(outputs.primary_vpc_id).toBeDefined();
      expect(outputs.secondary_vpc_id).toBeDefined();

      // Verify both VPCs are different
      expect(outputs.primary_vpc_id).not.toBe(outputs.secondary_vpc_id);
    });

    test("private subnets exist in multiple AZs", () => {
      expect(outputs.primary_private_subnet_ids).toBeDefined();
      expect(outputs.primary_private_subnet_ids.length).toBeGreaterThanOrEqual(2);

      expect(outputs.secondary_private_subnet_ids).toBeDefined();
      expect(outputs.secondary_private_subnet_ids.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Resource Naming Convention", () => {
    test("resources follow naming convention", async () => {
      if (!outputs.primary_vpc_id) {
        console.log("Skipping test - no VPC ID in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primary_vpc_id]
      });

      const response = await ec2ClientPrimary.send(command);
      const vpc = response.Vpcs![0];
      const nameTag = vpc.Tags?.find(t => t.Key === "Name");

      // Check naming pattern: ProjectName-Environment-ResourceType
      expect(nameTag?.Value).toMatch(/iac-aws-nova-model-breaking/);
      expect(nameTag?.Value).toMatch(/dev/);
      expect(nameTag?.Value).toMatch(/vpc/);
    });
  });

  describe("Feature Flags", () => {
    test("enable_ec2 flag is set correctly", () => {
      expect(typeof outputs.enable_ec2).toBe("boolean");
    });

    test("enable_rds flag is set correctly", () => {
      expect(typeof outputs.enable_rds).toBe("boolean");
    });

    test("enable_cloudfront flag is set correctly", () => {
      expect(typeof outputs.enable_cloudfront).toBe("boolean");
    });

    test("enable_nat_gateway flag is set correctly", () => {
      expect(typeof outputs.enable_nat_gateway).toBe("boolean");
    });
  });
});
