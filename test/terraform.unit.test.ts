/**
 * Database Migration Infrastructure Unit Tests
 *
 * These tests validate the Terraform configuration files for correctness,
 * security best practices, and proper resource configuration.
 */

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Database Migration Infrastructure - File Presence", () => {
  test("provider.tf exists", () => {
    const filePath = path.join(LIB_DIR, "provider.tf");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("variables.tf exists", () => {
    const filePath = path.join(LIB_DIR, "variables.tf");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("main.tf exists", () => {
    const filePath = path.join(LIB_DIR, "main.tf");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    const filePath = path.join(LIB_DIR, "outputs.tf");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("backend.tf exists", () => {
    const filePath = path.join(LIB_DIR, "backend.tf");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("terraform.tfvars.example exists", () => {
    const filePath = path.join(LIB_DIR, "terraform.tfvars.example");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("README.md exists", () => {
    const filePath = path.join(LIB_DIR, "README.md");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("AWS_REGION file exists with us-east-1", () => {
    const filePath = path.join(LIB_DIR, "AWS_REGION");
    expect(fs.existsSync(filePath)).toBe(true);
    const region = fs.readFileSync(filePath, "utf8").trim();
    expect(region).toBe("us-east-1");
  });
});

describe("Database Migration Infrastructure - Provider Configuration", () => {
  const providerPath = path.join(LIB_DIR, "provider.tf");
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("requires Terraform >= 1.5.0", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("requires AWS provider ~> 5.0", () => {
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
  });

  test("uses var.aws_region", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
  });
});

describe("Database Migration Infrastructure - Variables", () => {
  const variablesPath = path.join(LIB_DIR, "variables.tf");
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares environment_suffix variable (required)", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares Aurora configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s+"aurora_engine_version"/);
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_class"/);
    expect(variablesContent).toMatch(/variable\s+"aurora_master_password"/);
  });

  test("declares DMS configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s+"dms_replication_instance_class"/);
    expect(variablesContent).toMatch(/variable\s+"dms_source_endpoint_host"/);
    expect(variablesContent).toMatch(/variable\s+"dms_source_password"/);
  });

  test("declares S3 lifecycle variables", () => {
    expect(variablesContent).toMatch(/variable\s+"s3_lifecycle_ia_transition_days"/);
    expect(variablesContent).toMatch(/variable\s+"s3_lifecycle_glacier_transition_days"/);
  });

  test("declares CloudWatch alarm variables", () => {
    expect(variablesContent).toMatch(/variable\s+"alarm_replication_lag_threshold"/);
    expect(variablesContent).toMatch(/variable\s+"alarm_cpu_threshold"/);
  });

  test("marks sensitive variables as sensitive", () => {
    const passwordVars = variablesContent.match(/variable\s+"(\w+password\w*)"\s*{[^}]*}/gi);
    expect(passwordVars).toBeTruthy();
    if (passwordVars) {
      passwordVars.forEach(varBlock => {
        expect(varBlock).toMatch(/sensitive\s*=\s*true/);
      });
    }
  });
});

describe("Database Migration Infrastructure - Main Resources", () => {
  const mainPath = path.join(LIB_DIR, "main.tf");
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("creates KMS keys for encryption", () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates VPC with proper configuration", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates public and private subnets", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("creates security groups for Aurora and DMS", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"dms"/);
  });

  test("creates IAM roles for DMS", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_vpc_role"/);
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_cloudwatch_role"/);
    expect(mainContent).toMatch(/AmazonDMSVPCManagementRole/);
    expect(mainContent).toMatch(/AmazonDMSCloudWatchLogsRole/);
  });

  test("creates Aurora cluster with Multi-AZ", () => {
    expect(mainContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
    expect(mainContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  test("creates Aurora cluster instances", () => {
    expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"/);
    expect(mainContent).toMatch(/performance_insights_enabled\s*=\s*true/);
  });

  test("creates Aurora parameter groups for PostgreSQL 13", () => {
    expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_parameter_group"\s+"aurora"/);
    expect(mainContent).toMatch(/family\s*=\s*"aurora-postgresql13"/);
    expect(mainContent).toMatch(/pg_stat_statements/);
  });

  test("creates DMS replication instance with Multi-AZ", () => {
    expect(mainContent).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    expect(mainContent).toMatch(/multi_az\s*=\s*true/);
    expect(mainContent).toMatch(/publicly_accessible\s*=\s*false/);
  });

  test("creates DMS source endpoint", () => {
    expect(mainContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
    expect(mainContent).toMatch(/endpoint_type\s*=\s*"source"/);
    expect(mainContent).toMatch(/engine_name\s*=\s*"postgres"/);
    expect(mainContent).toMatch(/ssl_mode\s*=\s*"require"/);
  });

  test("creates DMS target endpoint for Aurora", () => {
    expect(mainContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
    expect(mainContent).toMatch(/endpoint_type\s*=\s*"target"/);
    expect(mainContent).toMatch(/engine_name\s*=\s*"aurora-postgresql"/);
  });

  test("creates DMS replication task with full-load-and-cdc", () => {
    expect(mainContent).toMatch(/resource\s+"aws_dms_replication_task"\s+"main"/);
    expect(mainContent).toMatch(/migration_type\s*=\s*"full-load-and-cdc"/);
    expect(mainContent).toMatch(/table_mappings/);
  });

  test("creates S3 bucket with versioning", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"migration"/);
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"migration"/);
    expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures S3 encryption with KMS", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
  });

  test("configures S3 lifecycle policies", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    expect(mainContent).toMatch(/STANDARD_IA/);
    expect(mainContent).toMatch(/GLACIER/);
  });

  test("blocks S3 public access", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("creates SNS topic for alerts", () => {
    expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"migration_alerts"/);
    expect(mainContent).toMatch(/kms_master_key_id/);
  });

  test("creates CloudWatch alarms for DMS replication lag", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dms_replication_lag"/);
    expect(mainContent).toMatch(/CDCLatencyTarget/);
    expect(mainContent).toMatch(/AWS\/DMS/);
  });

  test("creates CloudWatch alarms for Aurora metrics", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_cpu"/);
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections"/);
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_storage"/);
  });

  test("creates CloudWatch dashboard", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"migration"/);
    expect(mainContent).toMatch(/dashboard_body/);
    expect(mainContent).toMatch(/DMS Replication Lag/);
  });
});

describe("Database Migration Infrastructure - Resource Naming with environmentSuffix", () => {
  const mainPath = path.join(LIB_DIR, "main.tf");
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("Aurora cluster uses environment_suffix", () => {
    expect(mainContent).toMatch(/cluster_identifier\s*=\s*"aurora-cluster-\$\{var\.environment_suffix\}"/);
  });

  test("DMS instance uses environment_suffix", () => {
    expect(mainContent).toMatch(/replication_instance_id\s*=\s*"dms-instance-\$\{var\.environment_suffix\}"/);
  });

  test("S3 bucket uses environment_suffix", () => {
    expect(mainContent).toMatch(/bucket\s*=\s*"inventory-migration-\$\{var\.environment_suffix\}"/);
  });

  test("KMS keys use environment_suffix in tags", () => {
    expect(mainContent).toMatch(/Name\s*=\s*"rds-kms-key-\$\{var\.environment_suffix\}"/);
    expect(mainContent).toMatch(/Name\s*=\s*"s3-kms-key-\$\{var\.environment_suffix\}"/);
  });

  test("Security groups use environment_suffix", () => {
    expect(mainContent).toMatch(/name_prefix\s*=\s*"aurora-sg-\$\{var\.environment_suffix\}-"/);
    expect(mainContent).toMatch(/name_prefix\s*=\s*"dms-sg-\$\{var\.environment_suffix\}-"/);
  });
});

describe("Database Migration Infrastructure - Destroyability", () => {
  const mainPath = path.join(LIB_DIR, "main.tf");
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("Aurora cluster has deletion protection disabled", () => {
    expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("Aurora cluster skips final snapshot", () => {
    expect(mainContent).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test("does NOT use Retain deletion policy", () => {
    expect(mainContent).not.toMatch(/RETAIN/i);
  });
});

describe("Database Migration Infrastructure - Outputs", () => {
  const outputsPath = path.join(LIB_DIR, "outputs.tf");
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("exports VPC outputs", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
  });

  test("exports Aurora cluster outputs", () => {
    expect(outputsContent).toMatch(/output\s+"aurora_cluster_id"/);
    expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
    expect(outputsContent).toMatch(/output\s+"aurora_cluster_reader_endpoint"/);
    expect(outputsContent).toMatch(/output\s+"aurora_cluster_port"/);
    expect(outputsContent).toMatch(/output\s+"aurora_database_name"/);
  });

  test("exports DMS outputs", () => {
    expect(outputsContent).toMatch(/output\s+"dms_replication_instance_arn"/);
    expect(outputsContent).toMatch(/output\s+"dms_replication_instance_private_ip"/);
    expect(outputsContent).toMatch(/output\s+"dms_replication_task_arn"/);
    expect(outputsContent).toMatch(/output\s+"dms_source_endpoint_arn"/);
    expect(outputsContent).toMatch(/output\s+"dms_target_endpoint_arn"/);
  });

  test("exports S3 outputs", () => {
    expect(outputsContent).toMatch(/output\s+"s3_migration_bucket_name"/);
    expect(outputsContent).toMatch(/output\s+"s3_migration_bucket_arn"/);
  });

  test("exports monitoring outputs", () => {
    expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_name"/);
    expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
  });

  test("exports security outputs", () => {
    expect(outputsContent).toMatch(/output\s+"kms_rds_key_id"/);
    expect(outputsContent).toMatch(/output\s+"kms_s3_key_id"/);
    expect(outputsContent).toMatch(/output\s+"security_group_aurora_id"/);
    expect(outputsContent).toMatch(/output\s+"security_group_dms_id"/);
  });
});

describe("Database Migration Infrastructure - Documentation", () => {
  test("README.md contains deployment instructions", () => {
    const readmePath = path.join(LIB_DIR, "README.md");
    const content = fs.readFileSync(readmePath, "utf8");
    expect(content).toMatch(/Deployment Instructions/i);
    expect(content).toMatch(/terraform init/i);
    expect(content).toMatch(/terraform apply/i);
  });
});

describe("Database Migration Infrastructure - Terraform Syntax", () => {
  const mainPath = path.join(LIB_DIR, "main.tf");
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("uses proper HCL syntax for resources", () => {
    const resourcePattern = /resource\s+"[a-z_]+"\s+"[a-z_]+"\s*{/g;
    const matches = mainContent.match(resourcePattern);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThan(20);
  });

  test("uses jsonencode for complex JSON objects", () => {
    expect(mainContent).toMatch(/jsonencode\s*\(/);
  });

  test("uses depends_on for resource dependencies", () => {
    expect(mainContent).toMatch(/depends_on\s*=\s*\[/);
  });

  test("uses count for multi-resource creation", () => {
    expect(mainContent).toMatch(/count\s*=\s*length\(/);
  });
});
