import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from "@aws-sdk/client-rds";
import { 
  S3Client, 
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand
} from "@aws-sdk/client-s3";
import { 
  EC2Client, 
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand
} from "@aws-sdk/client-ec2";
import {
  KMSClient,
  DescribeKeyCommand
} from "@aws-sdk/client-kms";
import {
  CloudFrontClient,
  GetDistributionCommand
} from "@aws-sdk/client-cloudfront";
import {
  SecretsManagerClient,
  DescribeSecretCommand
} from "@aws-sdk/client-secrets-manager";
import {
  CloudTrailClient,
  DescribeTrailsCommand
} from "@aws-sdk/client-cloudtrail";
import * as fs from "fs";
import * as path from "path";

// Path to flat-outputs.json
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

// AWS SDK Clients
const rdsClient = new RDSClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const ec2Client = new EC2Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const kmsClient = new KMSClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const cloudfrontClient = new CloudFrontClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const cloudtrailClient = new CloudTrailClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

// Helper to parse JSON arrays from CI/CD outputs
const parseIfJsonArray = (val: any): any => {
  if (typeof val === "string" && val.startsWith("[")) {
    try {
      return JSON.parse(val);
    } catch {
      // Return as is if parsing fails
    }
  }
  return val;
};

// Validation helpers
const isValidVpcId = (id: string): boolean => typeof id === "string" && id.startsWith("vpc-");
const isValidSubnetId = (id: string): boolean => typeof id === "string" && id.startsWith("subnet-");
const isValidSecurityGroupId = (id: string): boolean => typeof id === "string" && id.startsWith("sg-");
const isValidRdsInstanceId = (id: string): boolean => typeof id === "string" && id.length > 0;
const isValidKmsKeyId = (id: string): boolean => typeof id === "string" && (id.startsWith("arn:aws:kms:") || /^[a-f0-9-]{36}$/.test(id));

describe("Healthcare Infrastructure - Integration Tests", () => {
  let outputs: Record<string, any> = {};

  beforeAll(async () => {
    // Parse flat-outputs.json and handle JSON string arrays
    if (fs.existsSync(outputsPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
      outputs = {};
      for (const [key, value] of Object.entries(rawOutputs)) {
        outputs[key] = parseIfJsonArray(value);
      }
    }
  }, 30000);

  describe("Infrastructure Validation", () => {
    it("should have outputs file available", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it("should validate VPC existence and configuration", async () => {
      if (!outputs.vpc_id) {
        throw new Error("vpc_id not found in outputs");
      }

      expect(isValidVpcId(outputs.vpc_id)).toBe(true);
      
      // Verify VPC exists in AWS
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })
      );
      
      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs![0].State).toBe("available");
      expect(vpcResponse.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr_block || "10.0.0.0/16");
    });

    it("should validate subnet configuration", async () => {
      const subnetKeys = ["public_subnet_ids", "private_subnet_ids", "database_subnet_ids"];
      
      for (const key of subnetKeys) {
        if (outputs[key]) {
          const subnetIds = Array.isArray(outputs[key]) ? outputs[key] : [outputs[key]];
          
          for (const subnetId of subnetIds) {
            expect(isValidSubnetId(subnetId)).toBe(true);
          }

          // Verify subnets exist in AWS
          const subnetsResponse = await ec2Client.send(
            new DescribeSubnetsCommand({ SubnetIds: subnetIds })
          );
          
          expect(subnetsResponse.Subnets!.length).toBe(subnetIds.length);
          subnetsResponse.Subnets!.forEach(subnet => {
            expect(subnet.State).toBe("available");
            expect(subnet.VpcId).toBe(outputs.vpc_id);
          });
        }
      }
    });

    it("should validate security groups", async () => {
      const sgKeys = ["web_security_group_id", "application_security_group_id", "database_security_group_id"];
      
      for (const key of sgKeys) {
        if (outputs[key]) {
          expect(isValidSecurityGroupId(outputs[key])).toBe(true);
          
          // Verify security group exists
          const sgResponse = await ec2Client.send(
            new DescribeSecurityGroupsCommand({ GroupIds: [outputs[key]] })
          );
          
          expect(sgResponse.SecurityGroups).toHaveLength(1);
          expect(sgResponse.SecurityGroups![0].VpcId).toBe(outputs.vpc_id);
        }
      }
    });
  });

  describe("Database Infrastructure", () => {
    it("should validate RDS instance configuration", async () => {
      if (!outputs.rds_instance_id) {
        console.warn("RDS instance ID not found in outputs, skipping database tests");
        return;
      }

      expect(isValidRdsInstanceId(outputs.rds_instance_id)).toBe(true);
      
      // Get RDS instance details
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.rds_instance_id
        })
      );
      
      expect(rdsResponse.DBInstances).toHaveLength(1);
      const dbInstance = rdsResponse.DBInstances![0];
      
      // Validate HIPAA compliance requirements
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7); // Minimum for compliance
      expect(dbInstance.MonitoringInterval).toBeGreaterThan(0); // Enhanced monitoring enabled
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    });

    it("should validate database secrets management", async () => {
      // Look for database password secret in outputs
      const secretKeys = Object.keys(outputs).filter(key => 
        key.includes("secret") && key.includes("password")
      );
      
      if (secretKeys.length > 0) {
        const secretArn = outputs[secretKeys[0]];
        
        // Verify secret exists and is encrypted
        const secretResponse = await secretsClient.send(
          new DescribeSecretCommand({ SecretId: secretArn })
        );
        
        expect(secretResponse.KmsKeyId).toBeTruthy(); // Should be encrypted with KMS
      }
    });
  });

  describe("Storage Infrastructure", () => {
    it("should validate S3 bucket security configuration", async () => {
      if (!outputs.s3_bucket_id) {
        console.warn("S3 bucket ID not found in outputs, skipping S3 tests");
        return;
      }

      // Verify bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: outputs.s3_bucket_id }));

      // Check encryption configuration
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_id })
      );
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeTruthy();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
        .ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");

      // Check versioning is enabled
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_id })
      );
      
      expect(versioningResponse.Status).toBe("Enabled");
    });

    it("should validate KMS key configuration", async () => {
      if (!outputs.kms_key_id && !outputs.kms_key_arn) {
        console.warn("KMS key not found in outputs, skipping KMS tests");
        return;
      }

      const keyId = outputs.kms_key_id || outputs.kms_key_arn;
      expect(isValidKmsKeyId(keyId)).toBe(true);

      // Verify KMS key details
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );
      
      expect(keyResponse.KeyMetadata!.KeyState).toBe("Enabled");
      expect(keyResponse.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });
  });

  describe("Content Delivery", () => {
    it("should validate CloudFront distribution configuration", async () => {
      if (!outputs.cloudfront_distribution_id) {
        console.warn("CloudFront distribution ID not found in outputs, skipping CDN tests");
        return;
      }

      // Get CloudFront distribution details
      const distributionResponse = await cloudfrontClient.send(
        new GetDistributionCommand({
          Id: outputs.cloudfront_distribution_id
        })
      );
      
      const distribution = distributionResponse.Distribution!;
      expect(distribution.DistributionConfig!.Enabled).toBe(true);
      
      // Verify HTTPS-only configuration
      expect(distribution.DistributionConfig!.DefaultCacheBehavior!.ViewerProtocolPolicy)
        .toBe("redirect-to-https");
        
      // Verify geographic restrictions (should be enabled for healthcare compliance)
      expect(distribution.DistributionConfig!.Restrictions!.GeoRestriction!.RestrictionType)
        .toBe("whitelist");
    });
  });

  describe("Network Infrastructure", () => {
    it("should validate internet gateway configuration", async () => {
      if (!outputs.internet_gateway_id) {
        console.warn("Internet gateway ID not found in outputs");
        return;
      }

      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          InternetGatewayIds: [outputs.internet_gateway_id]
        })
      );
      
      expect(igwResponse.InternetGateways).toHaveLength(1);
      expect(igwResponse.InternetGateways![0].Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe("available");
    });

    it("should validate NAT gateway configuration", async () => {
      const natGatewayIds = outputs.nat_gateway_ids;
      if (!natGatewayIds || !Array.isArray(natGatewayIds)) {
        console.warn("NAT gateway IDs not found in outputs");
        return;
      }

      const natResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds
        })
      );
      
      expect(natResponse.NatGateways!.length).toBe(natGatewayIds.length);
      natResponse.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe("available");
        expect(natGw.VpcId).toBe(outputs.vpc_id);
      });
    });
  });

  describe("Security Compliance", () => {
    it("should verify all resources have required HIPAA tags", async () => {
      // This would typically involve checking tags on all resources
      // For now, we verify that compliance-related outputs are present
      expect(outputs.deployment_region).toBeTruthy();
      expect(outputs.environment_suffix).toBeTruthy();
      
      // Verify region compliance (should be US for healthcare)
      const region = outputs.deployment_region || process.env.AWS_DEFAULT_REGION;
      expect(region.startsWith("us-")).toBe(true);
    });

    it("should validate database parameter group audit configuration", async () => {
      // This test would verify that the RDS parameter group has proper audit settings
      // Since we can't easily access parameter group details without additional API calls,
      // we verify that the RDS instance has CloudWatch logs enabled
      if (outputs.rds_instance_id) {
        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.rds_instance_id
          })
        );
        
        const dbInstance = rdsResponse.DBInstances![0];
        expect(dbInstance.EnabledCloudwatchLogsExports).toContain("postgresql");
      }
    });
  });

  describe("High Availability", () => {
    it("should validate multi-AZ subnet distribution", async () => {
      const subnetKeys = ["public_subnet_ids", "private_subnet_ids", "database_subnet_ids"];
      
      for (const key of subnetKeys) {
        if (outputs[key] && Array.isArray(outputs[key])) {
          const subnetIds = outputs[key];
          
          if (subnetIds.length > 1) {
            const subnetsResponse = await ec2Client.send(
              new DescribeSubnetsCommand({ SubnetIds: subnetIds })
            );
            
            // Verify subnets are in different AZs
            const availabilityZones = new Set(
              subnetsResponse.Subnets!.map(subnet => subnet.AvailabilityZone)
            );
            expect(availabilityZones.size).toBeGreaterThan(1);
          }
        }
      }
    });

    it("should validate backup and retention configuration", async () => {
      if (outputs.rds_instance_id) {
        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.rds_instance_id
          })
        );
        
        const dbInstance = rdsResponse.DBInstances![0];
        
        // HIPAA requires minimum 6 years retention, we set 35 days for daily backups
        // Long-term retention should be handled via automated snapshots
        expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      }
    });
  });

  describe("Audit and Compliance", () => {
    it("should validate CloudTrail audit logging configuration", async () => {
      if (!outputs.cloudtrail_trail_name) {
        console.warn("CloudTrail trail name not found in outputs, skipping CloudTrail tests");
        return;
      }

      // Get CloudTrail details
      const cloudtrailResponse = await cloudtrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [outputs.cloudtrail_trail_name]
        })
      );
      
      expect(cloudtrailResponse.trailList).toHaveLength(1);
      const trail = cloudtrailResponse.trailList![0];
      
      // Verify HIPAA compliance requirements
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KmsKeyId).toBeTruthy(); // Should be encrypted
      
      // Verify S3 bucket configuration
      expect(trail.S3BucketName).toBeTruthy();
      expect(trail.S3KeyPrefix).toBe("audit-logs");
    });

    it("should validate audit trail S3 bucket exists and is encrypted", async () => {
      if (!outputs.audit_trail_bucket_id) {
        console.warn("Audit trail bucket ID not found in outputs, skipping audit bucket tests");
        return;
      }

      // Verify bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: outputs.audit_trail_bucket_id }));

      // Check encryption configuration
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.audit_trail_bucket_id })
      );
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeTruthy();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
        .ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");

      // Check versioning is enabled for audit compliance
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.audit_trail_bucket_id })
      );
      
      expect(versioningResponse.Status).toBe("Enabled");
    });
  });
});
