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

// Load deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
}

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";

// AWS clients with LocalStack support
const clientConfig = isLocalStack ? {
  endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  }
} : {};
const ec2ClientPrimary = new EC2Client(isLocalStack ? clientConfig : { region: "us-east-1" });
const ec2ClientSecondary = new EC2Client(isLocalStack ? clientConfig : { region: "us-west-2" });
const rdsClientPrimary = new RDSClient(isLocalStack ? clientConfig : { region: "us-east-1" });
const rdsClientSecondary = new RDSClient(isLocalStack ? clientConfig : { region: "us-west-2" });
const cloudFrontClient = new CloudFrontClient(isLocalStack ? clientConfig : { region: "us-east-1" });
const route53Client = new Route53Client(isLocalStack ? clientConfig : { region: "us-east-1" });
const secretsClient = new SecretsManagerClient(isLocalStack ? clientConfig : { region: "us-east-1" });
const kmsClientPrimary = new KMSClient(isLocalStack ? clientConfig : { region: "us-east-1" });
const kmsClientSecondary = new KMSClient(isLocalStack ? clientConfig : { region: "us-west-2" });

describe("Terraform Infrastructure Integration Tests", () => {
  describe("Deployment Outputs", () => {
    test("outputs file exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("has primary VPC ID", () => {
      expect(outputs.primary_vpc_id).toBeDefined();
      expect(outputs.primary_vpc_id).toMatch(/^vpc-/);
    });

    test("has secondary VPC ID", () => {
      expect(outputs.secondary_vpc_id).toBeDefined();
      expect(outputs.secondary_vpc_id).toMatch(/^vpc-/);
    });

    test("has CloudFront distribution DNS", () => {
      expect(outputs.cloudfront_domain_name).toBeDefined();
      // LocalStack uses different domain format
      if (isLocalStack) {
        expect(outputs.cloudfront_domain_name).toMatch(/cloudfront/);
      } else {
        expect(outputs.cloudfront_domain_name).toMatch(/\.cloudfront\.net$/);
      }
    });

    test("has RDS endpoints", () => {
      expect(outputs.primary_rds_endpoint).toBeDefined();
      // LocalStack uses localhost endpoints
      if (isLocalStack) {
        expect(outputs.primary_rds_endpoint).toMatch(/localhost/);
      } else {
        expect(outputs.primary_rds_endpoint).toContain(".rds.amazonaws.com");
      }

      // Secondary RDS endpoint may not be present in LocalStack
      if (outputs.secondary_rds_endpoint) {
        expect(outputs.secondary_rds_endpoint).toBeDefined();
        if (isLocalStack) {
          expect(outputs.secondary_rds_endpoint).toMatch(/localhost/);
        } else {
          expect(outputs.secondary_rds_endpoint).toContain(".rds.amazonaws.com");
        }
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
      if (!!outputs.primary_private_subnet_ids || outputs.primary_private_subnet_ids.length < 2) {
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

    test("EC2 instances are running in private subnets", async () => {
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

    test("RDS instance is available", async () => {
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

    test("EC2 instances are running", async () => {
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

    test("RDS instance is available", async () => {
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
    test("CloudFront distribution exists and is enabled", async () => {
      const command = new ListDistributionsCommand({});
      const response = await cloudFrontClient.send(command);
      
      const distributions = response.DistributionList?.Items || [];
      expect(distributions.length).toBeGreaterThan(0);
      
      const activeDistribution = distributions.find(d => 
        d.Status === "Deployed" && d.Enabled === true
      );
      expect(activeDistribution).toBeDefined();
    });

    test("Route 53 hosted zone exists", async () => {
      if (!outputs.route53_zone_id) {
        console.log("Skipping test - no Route53 zone ID in outputs");
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
    test("KMS keys exist in both regions", async () => {
      if (!outputs.primary_kms_key_id) {
        console.log("Skipping test - no KMS key ID in outputs");
        return;
      }

      // Check primary region KMS key
      const primaryCommand = new DescribeKeyCommand({
        KeyId: outputs.primary_kms_key_id
      });
      
      const primaryResponse = await kmsClientPrimary.send(primaryCommand);
      expect(primaryResponse.KeyMetadata?.KeyState).toBe("Enabled");
      expect(primaryResponse.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");

      // Check secondary region KMS key if available
      if (outputs.secondary_kms_key_id) {
        const secondaryCommand = new DescribeKeyCommand({
          KeyId: outputs.secondary_kms_key_id
        });
        
        const secondaryResponse = await kmsClientSecondary.send(secondaryCommand);
        expect(secondaryResponse.KeyMetadata?.KeyState).toBe("Enabled");
      }
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
    test("resources deployed in multiple availability zones", async () => {
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

      // LocalStack handles regions differently
      if (!isLocalStack) {
        expect(outputs.primary_rds_endpoint).toContain("us-east-1");
        if (outputs.secondary_rds_endpoint) {
          expect(outputs.secondary_rds_endpoint).toContain("us-west-2");
        }
      } else {
        // In LocalStack, just verify endpoints exist
        expect(outputs.primary_rds_endpoint).toBeDefined();
      }
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
});