/**
 * Comprehensive Terraform Infrastructure Integration Tests
 * Author: ngwakoleslieelijah
 * Updated: 2025-08-17 07:45:46 UTC
 *
 * This file validates the outputs and basic operation of the main.tf infrastructure.
 * It is designed to run post-deployment, using outputs from `terraform output -json`.
 */

import { readFileSync } from "fs";
import path from "path";

interface TerraformOutput {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: TerraformOutput;
}

describe("Comprehensive Terraform Infrastructure Integration Tests", () => {
  let tf: TerraformOutputs;

  beforeAll(() => {
    // Use relative path so this works in CI/CD and locally
    let tfOutputPath = process.env.TF_OUTPUT_PATH ||
      path.resolve(process.cwd(), "tf-output.json");
    if (!path.isAbsolute(tfOutputPath)) {
      tfOutputPath = path.resolve(process.cwd(), tfOutputPath);
    }
    const raw = readFileSync(tfOutputPath, "utf8");
    tf = JSON.parse(raw);
  });

  it("should output a valid ALB DNS name", () => {
    expect(tf.alb_dns_name.value).toMatch(/^([a-zA-Z0-9-]+\.)+elb\.amazonaws\.com$/);
  });

  it("should output a valid RDS endpoint", () => {
    expect(tf.rds_endpoint.value).toMatch(/\.rds\.amazonaws\.com$/);
  });

  it("should have two web instance IDs", () => {
    expect(tf.web_instance_ids.value.length).toBe(2);
    tf.web_instance_ids.value.forEach((id: string) => {
      expect(id).toMatch(/^i-[a-zA-Z0-9]+$/);
    });
  });

  it("should output a valid VPC ID", () => {
    expect(tf.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
  });

  it("should have correct deployment info", () => {
    expect(tf.deployment_info.value.user).toBe("ngwakoleslieelijah");
    expect(tf.deployment_info.value.compliance_level).toMatch(/standard|high|strict/);
    // Allow for timestamp format (updated for UTC date/time)
    expect(tf.deployment_info.value.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("should have all compliance features enabled", () => {
    const c = tf.compliance_features.value;
    expect(c.encryption_enabled).toBe(true);
    expect(c.vpc_flow_logs_enabled).toBe(true);
    expect(c.cloudtrail_enabled).toBe(true);
    expect(c.imdsv2_required).toBe(true);
    expect(c.vpc_endpoints_enabled).toBe(true);
    expect(c.mfa_enforcement).toBe(true);
    expect(c.private_subnets_used).toBe(true);
    expect(c.rds_encryption).toBe(true);
    expect(c.backup_retention_days).toBeGreaterThanOrEqual(1);
    expect(c.log_retention_days).toBeGreaterThanOrEqual(1);
  });

  it("should not expose sensitive outputs in plaintext", () => {
    // rds_endpoint is not considered sensitive, but db password should not be output as plaintext
    Object.entries(tf).forEach(([key, output]) => {
      if (output.sensitive) {
        // Sensitive outputs should not be a string with an obvious secret or password
        if (typeof output.value === "string") {
          expect(output.value).not.toMatch(/password|secret|key/i);
        }
      }
    });
  });
});

// Placeholder for future tests
describe("Resource Verification Tests", () => {
  it.todo("should verify ALB is reachable and returns a 200 status for the health check");
  it.todo("should verify web instances are in 'running' state");
  it.todo("should verify RDS instance is in 'available' state");
  it.todo("should verify S3 bucket for logs has server-side encryption enabled");
  it.todo("should verify the backup vault exists");
  it.todo("should verify the KMS key is enabled and has key rotation enabled");
  it.todo("should verify that the VPC has the correct number of subnets");
  it.todo("should verify that the NAT gateways are available");
  it.todo("should verify that the Internet Gateway is attached to the VPC");
  it.todo("should verify that the security groups are correctly configured");
  it.todo("should verify that the IAM roles have the correct trust policies");
  it.todo("should verify that the CloudWatch log groups have the correct retention policies");
});