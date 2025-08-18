// tests/unit/unit-tests.ts
// Unit tests for tap_stack.tf multi-region infrastructure
// Static analysis and structure validation without executing Terraform

import * as fs from "fs";
import * as path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Multi-Region Infrastructure Unit Tests: tap_stack.tf", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Load file contents once for all tests
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("provider configuration is in provider.tf, not tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Declaration", () => {
    test("declares required infrastructure variables", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"primary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(stackContent).toMatch(/variable\s+"min_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"max_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"desired_capacity"\s*{/);
    });

    test("has appropriate default values", () => {
      expect(stackContent).toMatch(/default\s*=\s*"prod"/);
      expect(stackContent).toMatch(/default\s*=\s*"multi-region-app"/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/default\s*=\s*"eu-west-2"/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.1\.0\.0\/16"/);
      expect(stackContent).toMatch(/default\s*=\s*"t3\.micro"/);
    });
  });

  describe("Security Components", () => {
    test("declares KMS keys for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares Secrets Manager resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"/);
    });

    test("declares random password for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds_master_password"/);
      expect(stackContent).toMatch(/length\s*=\s*16/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });
  });

  describe("Networking Components", () => {
    test("declares VPCs for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares subnets (public, private, database)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"db_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"db_secondary"/);
    });
  });

  describe("Database Components", () => {
    test("declares RDS database and subnet groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"secondary"/);
    });

    test("has proper database configurations", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/replicate_source_db/);
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  describe("Load Balancing Components", () => {
    test("declares Application Load Balancers", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("declares target groups and listeners", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_secondary"/);
    });
  });

  describe("Outputs", () => {
    test("declares useful output values", () => {
      expect(stackContent).toMatch(/output\s+"primary_alb_dns"/);
      expect(stackContent).toMatch(/output\s+"secondary_alb_dns"/);
      expect(stackContent).toMatch(/output\s+"primary_rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"secondary_rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"s3_bucket_primary"/);
      expect(stackContent).toMatch(/output\s+"s3_bucket_secondary"/);
    });

    test("marks sensitive outputs appropriately", () => {
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });
});

