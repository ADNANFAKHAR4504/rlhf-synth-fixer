// Static verification of lib/tap_stack.tf against PROMPT.md requirements (excluding additional services section)
// These tests never execute Terraform; they only check the rendered HCL for required constructs.

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform stack compliance", () => {
  let stackExists = false;
  let providerExists = false;
  let tf = "";
  let providerTf = "";

  const has = (pattern: RegExp) => pattern.test(tf);
  const providerHas = (pattern: RegExp) => pattern.test(providerTf);

  beforeAll(() => {
    stackExists = fs.existsSync(STACK_PATH);
    if (stackExists) {
      tf = fs.readFileSync(STACK_PATH, "utf8");
    }

    providerExists = fs.existsSync(PROVIDER_PATH);
    if (providerExists) {
      providerTf = fs.readFileSync(PROVIDER_PATH, "utf8");
    }
  });

  it("tap_stack.tf exists and is non-trivial", () => {
    expect(stackExists).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  it("sets aws_region default to us-west-2", () => {
    expect(has(/variable\s+"aws_region"[\s\S]*default\s*=\s*"us-west-2"/)).toBe(true);
  });

  it("configures Terraform S3 backend and reuses the aws_region variable", () => {
    expect(providerExists).toBe(true);
    expect(providerHas(/backend\s+"s3"/)).toBe(true);
    expect(providerHas(/region\s*=\s*var\.aws_region/)).toBe(true);
  });

  describe("Application S3 bucket", () => {
    it("uses secure naming convention derived from variables", () => {
      expect(has(/name_prefix\s*=\s*"\${var\.unique_id}-"/)).toBe(true);
      expect(has(/s3_bucket_name\s*=\s*"\${local\.name_prefix}secure-app-bucket"/)).toBe(true);
    });

    it("enforces encryption and blocks public access", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"app"/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app"[\s\S]*AES256/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"app"[\s\S]*block_public_acls\s*=\s*true[\s\S]*restrict_public_buckets\s*=\s*true/)).toBe(true);
    });
  });

  describe("CloudTrail logging bucket", () => {
    it("enables encryption and public access defenses", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"[\s\S]*AES256/)).toBe(true);
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"[\s\S]*block_public_acls\s*=\s*true[\s\S]*restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it("grants CloudTrail least-privilege bucket access", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
      expect(has(/cloudtrail\.amazonaws\.com/)).toBe(true);
      expect(has(/AWSLogs\/\$\{data\.aws_caller_identity\.current\.account_id}\//)).toBe(true);
      expect(has(/cloudtrail_bucket_name\s*=\s*"\${local\.name_prefix}secure-cloudtrail-logs"/)).toBe(true);
    });
  });

  describe("Networking (VPC, subnets, routing)", () => {
    it("creates VPC with segmented public and private subnets", () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*map_public_ip_on_launch\s*=\s*true/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*map_public_ip_on_launch\s*=\s*false/)).toBe(true);
    });

    it("routes public traffic through an internet gateway", () => {
      expect(has(/resource\s+"aws_route"\s+"public_igw"[\s\S]*destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.igw\.id/)).toBe(true);
    });

    it("keeps private subnets isolated without direct internet routes", () => {
      expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route"\s+"private_nat"/)).toBe(true);
    });
  });

  describe("Security groups", () => {
    it("exposes the load balancer over HTTPS only", () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"[\s\S]*ingress[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"]/)).toBe(true);
    });

    it("allows application instances to receive HTTPS traffic only from the ALB", () => {
      expect(has(/resource\s+"aws_security_group"\s+"web"[\s\S]*ingress[\s\S]*from_port\s*=\s*443[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id]/)).toBe(true);
    });

    it("restricts SSH ingress to the approved CIDR", () => {
      expect(has(/resource\s+"aws_security_group"\s+"web"[\s\S]*ingress[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\[var\.ssh_cidr]/)).toBe(true);
      expect(has(/variable\s+"ssh_cidr"[\s\S]*default\s*=\s*"203\.0\.113\.0\/24"/)).toBe(true);
    });

    it("permits database access only from application tier", () => {
      expect(has(/resource\s+"aws_security_group"\s+"db"[\s\S]*security_groups\s*=\s*\[aws_security_group\.web\.id]/)).toBe(true);
    });
  });

  describe("RDS PostgreSQL", () => {
    it("fetches latest engine version dynamically", () => {
      expect(has(/data\s+"aws_rds_engine_version"\s+"postgresql"/)).toBe(true);
      expect(has(/engine_version\s*=\s*data\.aws_rds_engine_version\.postgresql\.version/)).toBe(true);
    });

    it("encrypts storage with customer-managed KMS and enables best practices", () => {
      expect(has(/resource\s+"aws_kms_key"\s+"rds"/)).toBe(true);
      expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
      expect(has(/resource\s+"random_password"\s+"db_master"/)).toBe(true);
      expect(has(/resource\s+"aws_db_instance"\s+"postgres"/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/)).toBe(true);
      expect(has(/auto_minor_version_upgrade\s*=\s*true/)).toBe(true);
      expect(has(/vpc_security_group_ids\s*=\s*\[aws_security_group\.db\.id]/)).toBe(true);
      expect(has(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.default\.name/)).toBe(true);
    });
  });

  describe("CloudTrail", () => {
    it("creates an organization-wide trail with hardened settings", () => {
      expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
      expect(has(/is_multi_region_trail\s*=\s*true/)).toBe(true);
      expect(has(/enable_log_file_validation\s*=\s*true/)).toBe(true);
      expect(has(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/)).toBe(true);
    });
  });

  describe("Lambda data processing", () => {
    it("deploys latest runtime and least-privilege integration", () => {
      expect(has(/resource\s+"aws_lambda_function"\s+"app"/)).toBe(true);
      expect(has(/runtime\s*=\s*"nodejs16\.x"/)).toBe(true);
      expect(has(/environment\s*{[\s\S]*BUCKET_NAME\s*=\s*aws_s3_bucket\.app\.bucket/)).toBe(true);
      expect(has(/resource\s+"aws_lambda_permission"\s+"allow_bucket"/)).toBe(true);
    });

    it("wires S3 object create events to the Lambda function", () => {
      expect(has(/resource\s+"aws_s3_bucket_notification"\s+"bucket_notification"/)).toBe(true);
      expect(has(/events\s*=\s*\["s3:ObjectCreated:\*"]/)).toBe(true);
    });
  });

  describe("Tagging and parameterization", () => {
    it("defines core tagging variables and merges them into locals", () => {
      expect(has(/variable\s+"tags"[\s\S]*Environment[\s\S]*Department[\s\S]*Project/)).toBe(true);
      expect(has(/common_tags\s*=\s*merge\(var\.tags,/)).toBe(true);
    });

    it("avoids hard-coding account identifiers by using caller identity", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
      expect(has(/\$\{data\.aws_caller_identity\.current\.account_id}/)).toBe(true);
    });
  });
});
