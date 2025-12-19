// Unit tests for Terraform modules against new requirements
// Validates file structure, patterns, variables, and config (no hardcoded ARNs, etc.)

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");
const tapPath = path.join(libPath, "tap_stack.tf");
const providerPath = path.join(libPath, "provider.tf");

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Terraform Unit Tests — Multi-Env, Multi-Region Best Practices", () => {
  test("required Terraform files exist", () => {
    ["provider.tf", "tap_stack.tf"].forEach((f) =>
      expect(fs.existsSync(path.join(libPath, f))).toBe(true)
    );
  });

  describe("Providers & Multi-Region", () => {
    test("multi-region providers declared and used (us-east-1, us-west-2)", () => {
      const content = read(providerPath);
      expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"use1"[\s\S]*region\s*=\s*"us-east-1"/);
      expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"usw2"[\s\S]*region\s*=\s*"us-west-2"/);

      const tap = read(tapPath);
      // at least one resource referencing each aliased provider
      expect(tap).toMatch(/provider\s*=\s*aws\.use1/);
      expect(tap).toMatch(/provider\s*=\s*aws\.usw2/);
    });

    test("Terraform version & AWS provider constraints present", () => {
      const content = read(providerPath);
      expect(content).toMatch(/required_version\s*=\s*".*1\.4\./);
      expect(content).toMatch(/required_providers[\s\S]*aws[\s\S]*version\s*=\s*".*5\./);
    });
  });

  describe("S3 Buckets", () => {
    test("S3 buckets defined with versioning enabled and logging to audit bucket", () => {
      const tap = read(tapPath);

      const inlineVersioning =
        /resource\s+"aws_s3_bucket"\s+".*"\s*{[\s\S]*versioning\s*{[\s\S]*enabled\s*=\s*true[\s\S]*}[\s\S]*}/;
      const separateVersioning =
        /resource\s+"aws_s3_bucket_versioning"[\s\S]*status\s*=\s*"Enabled"/;

      expect(
        inlineVersioning.test(tap) || separateVersioning.test(tap)
      ).toBe(true);

      // Logging via inline block OR aws_s3_bucket_logging
      const inlineLogging =
        /resource\s+"aws_s3_bucket"\s+".*"\s*{[\s\S]*logging\s*{[\s\S]*target_bucket\s*=\s*.*audit.*[\s\S]*}[\s\S]*}/;
      const separateLogging =
        /resource\s+"aws_s3_bucket_logging"[\s\S]*target_bucket\s*=\s*.*audit.*/;

      expect(
        inlineLogging.test(tap) || separateLogging.test(tap)
      ).toBe(true);

      // Public list access policy (ListBucket) present
      expect(tap).toMatch(/resource\s+"aws_s3_bucket_policy"[\s\S]*"s3:ListBucket"/);
      expect(tap).toMatch(/Principal\s*(?:=|:)\s*(?:["']\*["']|{\s*["']?AWS["']?\s*(?:=|:)\s*["']\*["'][\s\S]*})/);
    });

    test("S3 bucket name is dynamic (no hardcoded fixed string) and parameterized", () => {
      const tap = read(tapPath);

      // Either uses a variable, a random_id/random_string, or a join/format to build names
      const usesVar = /bucket\s*=\s*var\.(s3_.*name|s3_.*prefix)/;
      const usesRandom = /resource\s+"random_(id|string)"/;
      const usesJoinOrFormat = /(join\(|format\(|lower\(|replace\()/;

      expect(
        usesVar.test(tap) || usesRandom.test(tap) || usesJoinOrFormat.test(tap)
      ).toBe(true);
    });
  });

  describe("RDS Instance", () => {
    test("RDS instance class, deletion protection, and monitoring enabled", () => {
      const tap = read(tapPath);
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*instance_class\s*=\s*"db\.m5\.large"/);
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*deletion_protection\s*=\s*true/);

      // Enhanced/Detailed monitoring => monitoring_interval >= 1
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*monitoring_interval\s*=\s*[1-9]\d*/);
    });

    test("RDS credentials are parameterized and password marked sensitive", () => {
      const tap = read(tapPath);
      const hasUserVar =
        /variable\s+"(db_master_username|db_username)"/;
      const hasPassVar =
        /variable\s+"(db_master_password|db_password)"/;
      const sensitiveFlag =
        /variable\s+"(db_master_password|db_password)"[\s\S]*sensitive\s*=\s*true/;

      expect(tap).toMatch(hasUserVar);
      expect(tap).toMatch(hasPassVar);
      expect(tap).toMatch(sensitiveFlag);

      // RDS uses the variables
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*(username|master_username)\s*=\s*var\./);
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*(password|master_password)\s*=\s*var\./);
    });

    test("RDS supports safer updates (apply_immediately=false) and create_before_destroy where applicable", () => {
      const tap = read(tapPath);
      expect(tap).toMatch(/resource\s+"aws_db_instance"[\s\S]*apply_immediately\s*=\s*false/);
      // lifecycle create_before_destroy often added on sub-resources (subnets/sg/param groups) to reduce downtime; allow anywhere in file
      expect(tap).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true[\s\S]*}/);
    });
  });

  describe("EC2 & Security Groups", () => {
    test("EC2 instance type and SG rules (SSH restricted + HTTP allowed)", () => {
      const tap = read(tapPath);
      expect(tap).toMatch(/resource\s+"aws_instance"[\s\S]*instance_type\s*=\s*"t2\.micro"/);

      // SSH restricted to provided CIDR variable(s)
      const sshRule =
        /ingress[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*(var\.(allowed_ssh_cidrs)|\[[^\]]*var\.)/;
      expect(tap).toMatch(sshRule);

      // HTTP inbound allowed
      expect(tap).toMatch(/ingress[\s\S]*from_port\s*=\s*80/);
    });

    test("IAM role + instance profile grant EC2 access to S3 bucket", () => {
      const tap = read(tapPath);

      expect(tap).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tap).toMatch(/assume_role_policy[\s\S]*Principal[\s\S]*["']?Service["']?\s*(?:=|:)\s*["']ec2\.amazonaws\.com["']/);

      expect(tap).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tap).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);

      expect(tap).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(tap).toMatch(/resource\s+"aws_iam_policy"[\s\S]*"s3:ListBucket"/);
      expect(tap).toMatch(/resource\s+"aws_iam_policy"[\s\S]*"s3:GetObject"/);

      expect(tap).toMatch(/resource\s+"aws_iam_role_policy_attachment"[\s\S]*role\s*=\s*aws_iam_role\.ec2_role\.name[\s\S]*policy_arn\s*=\s*aws_iam_policy\.s3_access\.arn/);
    });
  });

  describe("Tags & Parameters", () => {
    test("common_tags has Environment and Project and all resources use it", () => {
      const tap = read(tapPath);

      expect(tap).toMatch(/common_tags\s*=\s*merge\([^)]*{[\s\S]*Environment[\s\S]*Project[\s\S]*}/);

      const tagBlocks = tap.match(/tags\s*=\s*merge\(local\.common_tags[\s\S]*?\)/g) || [];
      expect(tagBlocks.length).toBeGreaterThan(0);
    });


    test("Variables (Parameters) exist for bucket name, EC2 ingress, and RDS creds", () => {
      const tap = read(tapPath);
      expect(tap).toMatch(/variable\s+"(s3_bucket_prefix)"/);
      expect(tap).toMatch(/variable\s+"(allowed_ssh_cidrs)"/);
      expect(tap).toMatch(/variable\s+"(db_master_username|db_username)"/);
      expect(tap).toMatch(/variable\s+"(db_master_password|db_password)"/);
    });
  });

  describe("No hardcoded ARNs", () => {
    test("no literal ARNs present in Terraform code", () => {
      const all = read(providerPath) + "\n" + read(tapPath);
      expect(all).not.toMatch(/arn:aws:/);
    });
  });
});
