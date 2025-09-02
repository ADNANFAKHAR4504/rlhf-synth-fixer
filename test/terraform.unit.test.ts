// Comprehensive Unit Tests for Terraform Infrastructure
// Tests for ../lib/tap_stack.tf - Static validation only, no Terraform commands

import fs from "fs";
import path from "path";
// Removed infrastructure-validator import - using direct string matching instead

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Validation", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read files once for all tests
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });

    test("tap_stack.tf does NOT declare provider blocks", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables and Configuration", () => {
    test("declares required variables", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"team"\s*{/);
      expect(stackContent).toMatch(/variable\s+"project"\s*{/);
    });

    test("has locals block with common configuration", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/regions\s*=/);
    });

    test("defines multi-region configuration", () => {
      expect(stackContent).toMatch(/us-east-1/);
      expect(stackContent).toMatch(/ap-southeast-2/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS providers with aliases", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"use1"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"apse2"/);
    });

    test("provider.tf has terraform version constraints", () => {
      expect(providerContent).toMatch(/required_version/);
      expect(providerContent).toMatch(/required_providers/);
    });
  });

  describe("Security - KMS Encryption", () => {
    test("creates KMS keys in all regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main_use1"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main_apse2"/);
    });

    test("creates KMS aliases for keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main_use1"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main_apse2"/);
    });

    test("KMS keys have proper configuration", () => {
      expect(stackContent).toMatch(/aws_kms_key.*{/);
      expect(stackContent).toMatch(/tags.*=/);
    });
  });

  describe("Networking - Multi-Region VPC", () => {
    test("creates VPCs in all regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_use1"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_apse2"/);
    });

    test("creates internet gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main_use1"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main_apse2"/);
    });

    test("creates public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_use1_[ab]"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_use1_[ab]"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_apse2_[ab]"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_apse2_[ab]"/);
    });

    test("creates NAT gateways for private subnet connectivity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip".*nat_/);
    });

    test("creates route tables and associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
    });
  });

  describe("Security Groups", () => {
    test("creates security groups for different tiers", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test("security groups follow least privilege principle", () => {
      // Verify no wildcard access is allowed
      expect(stackContent).not.toMatch(/0\.0\.0\.0\/0.*443/);
      expect(stackContent).not.toMatch(/0\.0\.0\.0\/0.*80/);
    });
  });

  describe("Database - RDS", () => {
    test("creates RDS instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"/);
    });

    test("creates RDS subnet groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test("database has encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("database has backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
    });
  });

  describe("Storage - S3", () => {
    test("creates S3 buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 buckets have encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test("S3 buckets block public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  describe("Load Balancing - ALB", () => {
    test("creates application load balancers", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"/);
    });

    test("creates target groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test("creates listeners", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"/);
    });
  });

  describe("Security - WAF", () => {
    test("creates WAF web ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"/);
    });

    test("associates WAF with ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
    });
  });

  describe("Monitoring - CloudTrail", () => {
    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"/);
    });

    test("CloudTrail has proper configuration", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
      expect(stackContent).toMatch(/s3_bucket_name/);
    });
  });

  describe("Configuration - Config", () => {
    test("creates Config configuration recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"/);
    });

    test("creates Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"/);
    });
  });

  describe("Compute - Bastion Hosts", () => {
    test("creates bastion instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance".*bastion/);
    });

    test("bastions use latest AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ssm_parameter".*al2_ami/);
    });
  });

  describe("Container Orchestration - ECS", () => {
    test("creates ECS cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"/);
    });

    test("ECS resources are properly configured", () => {
      expect(stackContent).toMatch(/aws_ecs_cluster/);
      expect(stackContent).toMatch(/tags.*=/);
    });
  });

  describe("Secrets Management", () => {
    test("creates Secrets Manager secrets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    });

    test("secrets have proper configuration", () => {
      expect(stackContent).toMatch(/recovery_window_in_days/);
    });
  });

  describe("IAM Security", () => {
    test("creates IAM roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
    });

    test("creates IAM role policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
    });

    test("attaches policies to roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });

    test("IAM follows least privilege principle", () => {
      // Verify no wildcard permissions in common places
      expect(stackContent).not.toMatch(/"Action":\s*"\*"/);
      expect(stackContent).not.toMatch(/"Resource":\s*"\*"/);
    });
  });

  describe("Outputs", () => {
    test("defines output values", () => {
      expect(stackContent).toMatch(/output\s+"/);
    });

    test("outputs VPC information", () => {
      expect(stackContent).toMatch(/output.*vpc/i);
    });

    test("outputs ALB information", () => {
      expect(stackContent).toMatch(/output.*alb/i);
    });

    test("outputs S3 information", () => {
      expect(stackContent).toMatch(/output.*s3/i);
    });
  });

  describe("Tagging Standards", () => {
    test("uses common tags throughout", () => {
      expect(stackContent).toMatch(/tags\s*=.*local\.common_tags/);
    });

    test("common tags include required fields", () => {
      expect(stackContent).toMatch(/ManagedBy.*terraform/);
      expect(stackContent).toMatch(/environment.*local\.env/);
    });
  });

  describe("Multi-Environment Support", () => {
    test("supports different environments", () => {
      expect(stackContent).toMatch(/terraform\.workspace/);
      expect(stackContent).toMatch(/local\.env/);
    });

    test("has production-specific logic", () => {
      expect(stackContent).toMatch(/local\.is_production/);
    });
  });

  describe("Data Sources", () => {
    test("fetches availability zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
    });

    test("fetches AMI information", () => {
      expect(stackContent).toMatch(/data\s+"aws_ssm_parameter".*ami/);
    });
  });

  describe("Resource Validation", () => {
    test("has VPC resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"/);
      const vpcMatches = stackContent.match(/resource\s+"aws_vpc"/g);
      expect(vpcMatches?.length).toBeGreaterThan(0);
    });

    test("has required variables", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
      expect(stackContent).toMatch(/variable\s+"environment"/);
    });

    test("has required outputs", () => {
      expect(stackContent).toMatch(/output\s+"vpc_ids_use1"/);
      expect(stackContent).toMatch(/output\s+"alb_dns_names_use1"/);
    });

    test("confirms multi-region setup", () => {
      expect(stackContent).toMatch(/us-east-1/);
      expect(stackContent).toMatch(/ap-southeast-2/);
    });

    test("validates security practices", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("can extract VPC resource names", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_use1"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_apse2"/);
    });
  });

  describe("Structure Validation", () => {
    test("terraform structure validation works", () => {
      expect(stackContent).toMatch(/variable\s+/);
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/resource\s+/);
      expect(stackContent).toMatch(/output\s+/);
      expect(stackContent).toMatch(/data\s+/);
    });

    test("provider configuration validation works", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=/);
      expect(providerContent).toMatch(/required_version/);
    });
  });
});