import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack static validation", () => {
  // General checks
  it("file exists and has sufficient length", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(60000); // matches large config attached
  });

  // ==== VARIABLES ====
  // Corrected to actual variables in your tap_stack.tf
  const expectedVariables = [
    "primary_region",
    "secondary_region",
    "allowed_cidr_blocks",
    "notification_email"
  ];
  it("declares required input variables", () => {
    expectedVariables.forEach(v =>
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // ==== LOCALS ====
  it("declares common locals like common_tags and naming prefixes", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/primary_prefix\s*=\s*"tap-primary-\${var.primary_region}"/)).toBe(true);
    expect(has(/secondary_prefix\s*=\s*"tap-secondary-\${var.secondary_region}"/)).toBe(true);
  });

  // ==== DATA SOURCES ====
  it("declares AMI data sources per region", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });

  // ==== NETWORKING ====
  ["primary", "secondary"].forEach(region => {
    it(`declares networking resources for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_eip"\\s+"${region}_nat"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_private"`))).toBe(true);
    });
  });

  // ==== SECURITY GROUPS ====
  it("declares SGs for EC2 and RDS in both regions", () => {
    [
      "rds_primary",
      "rds_secondary",
      "ec2_primary",
      "ec2_secondary"
    ].forEach(sg => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  // ==== IAM ====
  it("declares EC2 IAM role and profile", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
  });

  it("declares IAM roles and policies for Lambda RDS backups and S3 replication", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_rds_backup_primary"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_rds_backup_secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"lambda_rds_backup_primary"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"lambda_rds_backup_secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"s3_replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"s3_replication"/)).toBe(true);
  });

  // ==== SECRETS MANAGER ====
  it("declares Secrets Manager secrets for primary and secondary RDS", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials_primary"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials_secondary"/)).toBe(true);
  });

  // ==== RDS ====
  ["primary", "secondary"].forEach(region => {
    it(`declares RDS instance and subnet group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}"`))).toBe(true);
      // enforce encryption, multi_az and private accessibility
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*storage_encrypted\\s*=\\s*true`))
      ).not.toBeNull();
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*multi_az\\s*=\\s*true`))
      ).not.toBeNull();
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*publicly_accessible\\s*=\\s*false`))
      ).not.toBeNull();
    });
  });

  // ==== S3 ====
  it("declares S3 buckets, with versioning, encryption, public access block, and replication", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/)).toBe(true);
  });

  // ==== LAMBDA FUNCTIONS ====
  it("declares Lambda functions for RDS backups in both regions", () => {
    ["rds_backup_primary","rds_backup_secondary"].forEach(lf => {
      expect(has(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lf}"`))).toBe(true);
      expect(has(new RegExp(`runtime\\s+=\\s+"python3.9"`))).toBe(true);
    });
  });

  // ==== DYNAMODB TABLES ====
  it("declares DynamoDB tables with point-in-time recovery enabled", () => {
    ["primary","secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_dynamodb_table"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`point_in_time_recovery\\s*{[\\s\\S]*enabled\\s*=\\s*true`))).toBe(true);
    });
  });

  // ==== API GATEWAY ====
  it("declares API Gateway and its resources with IAM auth", () => {
    expect(has(/resource\s+"aws_api_gateway_rest_api"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_api_gateway_resource"\s+"api_resource"/)).toBe(true);
    expect(has(/resource\s+"aws_api_gateway_method"\s+"api_method"/)).toBe(true);
    expect(has(/authorization\s+=\s+"AWS_IAM"/)).toBe(true);
  });

  // ==== CLOUDWATCH ALARMS ====
  ["ec2_cpu_primary","ec2_cpu_secondary","rds_cpu_primary","rds_cpu_secondary"].forEach(alarm => {
    it(`declares CloudWatch alarm ${alarm}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))).toBe(true);
    });
  });

  // ==== CLOUDTRAIL ====
  it("declares CloudTrail for multi-region and global events", () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
    expect(has(/is_multi_region_trail\s+=\s+true/)).toBe(true);
    expect(has(/include_global_service_events\s+=\s+true/)).toBe(true);
  });

  // ==== TAG STANDARDS ====
  it("applies common tags consistently", () => {
    expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
    expect(has(/Environment\s+=\s+"Production"/)).toBe(true);
  });

  // ==== OUTPUTS ====
  it("has required outputs for VPCs, RDS, S3, Lambdas, DynamoDB, API Gateway, CloudFront, SNS etc", () => {
    const mustHaveOutputs = [
      "primary_vpc_id", "secondary_vpc_id",
      "primary_rds_endpoint", "secondary_rds_endpoint",
      "primary_s3_bucket_name", "secondary_s3_bucket_name",
      "primary_lambda_function_name", "secondary_lambda_function_name",
      "primary_dynamodb_table_name", "secondary_dynamodb_table_name",
      "api_gateway_rest_api_id", "cloudfront_distribution_id",
      "primary_sns_topic_arn", "secondary_sns_topic_arn"
    ];
    mustHaveOutputs.forEach(o => expect(has(new RegExp(`output\\s+"${o}"`))).toBe(true));
  });

  // ==== SECURITY - no secrets in outputs ====
 it("does not expose sensitive outputs such as passwords or direct secret values", () => {
  // Allow outputs referencing secret ARNs, disallow outputs exposing "password" or "secret_value" or "secret_string"
  const disallowedSensitivePatterns = [
    /output\s+.*password/i,
    /output\s+.*secret_value/i,
    /output\s+.*secret_string/i,
    // exclude pure ARNs (common pattern ending with _secret_arn)
  ];

  const matchesDisallowed = disallowedSensitivePatterns.some(pattern => pattern.test(tf));
  expect(matchesDisallowed).toBe(false);
});
});
