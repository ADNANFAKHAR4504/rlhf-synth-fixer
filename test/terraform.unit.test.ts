import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");

// Load the Terraform file once
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe("Healthcare Infrastructure - tap_stack.tf static structure", () => {
  it("exists and is sufficiently large for healthcare infrastructure", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(5000); // Healthcare stack is comprehensive
  });

  describe("Variables Declaration", () => {
    it("declares all required infrastructure variables", () => {
      expect(has(/variable\s+"aws_region"/)).toBe(true);
      expect(has(/variable\s+"environment"/)).toBe(true);
      expect(has(/variable\s+"environment_suffix"/)).toBe(true);
      expect(has(/variable\s+"cost_center"/)).toBe(true);
      expect(has(/variable\s+"project"/)).toBe(true);
      expect(has(/variable\s+"owner"/)).toBe(true);
    });

    it("declares networking variables", () => {
      expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
      expect(has(/variable\s+"availability_zones"/)).toBe(true);
      expect(has(/variable\s+"allowed_cidr_blocks"/)).toBe(true);
      expect(has(/variable\s+"allowed_countries"/)).toBe(true);
    });

    it("declares database configuration variables", () => {
      expect(has(/variable\s+"db_instance_class"/)).toBe(true);
      expect(has(/variable\s+"db_allocated_storage"/)).toBe(true);
      expect(has(/variable\s+"db_backup_retention"/)).toBe(true);
    });

    it("declares EC2 configuration variables", () => {
      expect(has(/variable\s+"instance_type"/)).toBe(true);
    });

    it("has appropriate default values for all variables", () => {
      expect(has(/default\s*=\s*"us-east-1"/)).toBe(true); // aws_region
      expect(has(/default\s*=\s*"production"/)).toBe(true); // environment
      expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true); // vpc_cidr
      expect(has(/default\s*=\s*35/)).toBe(true); // backup retention
    });
  });

  describe("Data Sources", () => {
    it("includes AWS data sources for current account and region", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });

    it("includes PostgreSQL version data source", () => {
      expect(has(/data\s+"aws_rds_engine_version"\s+"postgresql"/)).toBe(true);
      expect(has(/engine\s*=\s*"postgres"/)).toBe(true);
    });
  });

  describe("Locals Configuration", () => {
    it("defines locals for environment suffix and tags", () => {
      expect(has(/locals\s*{/)).toBe(true);
      expect(has(/env_suffix\s*=/)).toBe(true);
      expect(has(/common_tags\s*=/)).toBe(true);
    });

    it("includes HIPAA compliance tags", () => {
      expect(has(/Compliance\s*=\s*"HIPAA"/)).toBe(true);
      expect(has(/DataClass\s*=\s*"PHI"/)).toBe(true);
      expect(has(/ManagedBy\s*=\s*"Terraform"/)).toBe(true);
    });
  });

  describe("KMS Encryption", () => {
    it("creates KMS key for healthcare data encryption", () => {
      expect(has(/resource\s+"aws_kms_key"\s+"healthcare"/)).toBe(true);
      expect(has(/description\s*=\s*"KMS key for healthcare data encryption - HIPAA compliant"/)).toBe(true);
      expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
    });

    it("creates KMS alias", () => {
      expect(has(/resource\s+"aws_kms_alias"\s+"healthcare"/)).toBe(true);
      expect(has(/name\s*=\s*"alias\/\$\{var\.environment\}-healthcare-\$\{local\.env_suffix\}"/)).toBe(true);
    });

    it("includes proper KMS key policy for services", () => {
      expect(has(/"logs\.amazonaws\.com"/)).toBe(true);
      expect(has(/"cloudtrail\.amazonaws\.com"/)).toBe(true);
      expect(has(/"kms:\*"/)).toBe(true);
    });
  });

  describe("VPC and Networking", () => {
    it("creates VPC with DNS support", () => {
      expect(has(/resource\s+"aws_vpc"\s+"healthcare"/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    it("creates internet gateway", () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"healthcare"/)).toBe(true);
    });

    it("creates three-tier subnet architecture", () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"database"/)).toBe(true);
    });

    it("creates NAT gateways and EIPs", () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
      expect(has(/resource\s+"aws_nat_gateway"\s+"healthcare"/)).toBe(true);
    });

    it("creates route tables for all tiers", () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table"\s+"database"/)).toBe(true);
    });

    it("associates route tables with subnets", () => {
      expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"database"/)).toBe(true);
    });
  });

  describe("Security Groups", () => {
    it("creates security groups for three-tier architecture", () => {
      expect(has(/resource\s+"aws_security_group"\s+"web"/)).toBe(true);
      expect(has(/resource\s+"aws_security_group"\s+"application"/)).toBe(true);
      expect(has(/resource\s+"aws_security_group"\s+"database"/)).toBe(true);
    });

    it("configures HTTPS-only web access", () => {
      expect(has(/from_port\s*=\s*443/)).toBe(true);
      expect(has(/from_port\s*=\s*80/)).toBe(true); // HTTP redirect
      expect(has(/viewer_protocol_policy\s*=\s*"redirect-to-https"/)).toBe(true);
    });

    it("restricts database access to application tier only", () => {
      expect(has(/from_port\s*=\s*5432/)).toBe(true); // PostgreSQL port
      expect(has(/security_groups\s*=\s*\[aws_security_group\.application\.id\]/)).toBe(true);
    });

    it("includes lifecycle management for security groups", () => {
      expect(has(/create_before_destroy\s*=\s*true/)).toBe(true);
    });
  });

  describe("IAM Roles and Policies", () => {
    it("creates RDS enhanced monitoring role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/)).toBe(true);
      expect(has(/monitoring\.rds\.amazonaws\.com/)).toBe(true);
    });

    it("attaches AWS managed policies", () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/)).toBe(true);
      expect(has(/AmazonRDSEnhancedMonitoringRole/)).toBe(true);
    });

    it("creates EC2 healthcare role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"ec2_healthcare"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_healthcare"/)).toBe(true);
    });

    it("includes SSM and CloudWatch permissions for EC2", () => {
      expect(has(/AmazonSSMManagedInstanceCore/)).toBe(true);
      expect(has(/CloudWatchAgentServerPolicy/)).toBe(true);
    });

    it("creates VPC Flow Logs IAM role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"flow_log"/)).toBe(true);
      expect(has(/vpc-flow-logs\.amazonaws\.com/)).toBe(true);
    });
  });

  describe("Database Configuration", () => {
    it("generates secure random password without special characters", () => {
      expect(has(/resource\s+"random_password"\s+"db_password"/)).toBe(true);
      expect(has(/special\s*=\s*false/)).toBe(true);
      expect(has(/length\s*=\s*32/)).toBe(true);
    });

    it("stores credentials in Secrets Manager", () => {
      expect(has(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/)).toBe(true);
      expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/)).toBe(true);
      expect(has(/kms_key_id\s*=\s*aws_kms_key\.healthcare\.key_id/)).toBe(true);
    });

    it("creates PostgreSQL RDS instance with HIPAA compliance", () => {
      expect(has(/resource\s+"aws_db_instance"\s+"healthcare"/)).toBe(true);
      expect(has(/engine\s*=\s*"postgres"/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/deletion_protection\s*=\s*true/)).toBe(true);
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    });

    it("configures proper backup and monitoring", () => {
      expect(has(/backup_retention_period\s*=\s*var\.db_backup_retention/)).toBe(true);
      expect(has(/monitoring_interval\s*=\s*60/)).toBe(true);
      expect(has(/performance_insights_enabled\s*=\s*true/)).toBe(true);
      expect(has(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/)).toBe(true);
    });

    it("includes proper parameter group for audit logging", () => {
      expect(has(/resource\s+"aws_db_parameter_group"\s+"healthcare"/)).toBe(true);
      expect(has(/log_statement/)).toBe(true);
      expect(has(/log_connections/)).toBe(true);
      expect(has(/log_disconnections/)).toBe(true);
    });
  });

  describe("S3 Storage", () => {
    it("creates healthcare data bucket with encryption", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"healthcare_data"/)).toBe(true);
      expect(has(/DataClass\s*=\s*"PHI"/)).toBe(true);
      expect(has(/prevent_destroy\s*=\s*true/)).toBe(true);
    });

    it("enables bucket versioning", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"healthcare_data_versioning"/)).toBe(true);
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    it("configures KMS encryption for S3", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/)).toBe(true);
      expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.healthcare\.arn/)).toBe(true);
      expect(has(/sse_algorithm\s*=\s*"aws:kms"/)).toBe(true);
    });

    it("blocks all public access", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"/)).toBe(true);
      expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it("configures HIPAA compliant lifecycle policy", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"/)).toBe(true);
      expect(has(/days\s*=\s*2555/)).toBe(true); // 7 years retention
      expect(has(/DEEP_ARCHIVE/)).toBe(true);
    });

    it("creates audit trail bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"audit_trail"/)).toBe(true);
    });

    it("configures audit trail bucket encryption", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit_trail_encryption"/)).toBe(true);
      expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.healthcare\.arn/)).toBe(true);
      expect(has(/sse_algorithm\s*=\s*"aws:kms"/)).toBe(true);
    });

    it("enables audit trail bucket versioning", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"audit_trail_versioning"/)).toBe(true);
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    it("blocks public access for audit trail bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"audit_trail_pab"/)).toBe(true);
      expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    it("configures CloudTrail S3 bucket policy", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"audit_trail_policy"/)).toBe(true);
      expect(has(/AWSCloudTrailAclCheck/)).toBe(true);
      expect(has(/AWSCloudTrailWrite/)).toBe(true);
      expect(has(/cloudtrail\.amazonaws\.com/)).toBe(true);
    });
  });

  describe("CloudFront Distribution", () => {
    it("creates CloudFront Origin Access Identity", () => {
      expect(has(/resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"/)).toBe(true);
    });

    it("configures S3 bucket policy for OAI", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"healthcare_data_oai"/)).toBe(true);
      expect(has(/aws_cloudfront_origin_access_identity\.oai\.iam_arn/)).toBe(true);
    });

    it("creates healthcare CDN with proper configuration", () => {
      expect(has(/resource\s+"aws_cloudfront_distribution"\s+"healthcare_cdn"/)).toBe(true);
      expect(has(/viewer_protocol_policy\s*=\s*"redirect-to-https"/)).toBe(true);
      expect(has(/is_ipv6_enabled\s*=\s*true/)).toBe(true);
    });

    it("includes geographic restrictions", () => {
      expect(has(/geo_restriction/)).toBe(true);
      expect(has(/restriction_type\s*=\s*"whitelist"/)).toBe(true);
      expect(has(/locations\s*=\s*var\.allowed_countries/)).toBe(true);
    });
  });

  describe("Monitoring and Logging", () => {
    it("creates CloudWatch log groups with proper retention", () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"application"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/)).toBe(true);
      expect(has(/retention_in_days\s*=\s*2557/)).toBe(true); // 7 years
    });

    it("configures VPC Flow Logs", () => {
      expect(has(/resource\s+"aws_flow_log"\s+"healthcare"/)).toBe(true);
      expect(has(/traffic_type\s*=\s*"ALL"/)).toBe(true);
    });

    it("creates SNS topic for compliance alerts", () => {
      expect(has(/resource\s+"aws_sns_topic"\s+"compliance_alerts"/)).toBe(true);
      expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.healthcare\.id/)).toBe(true);
    });
  });

  describe("CloudTrail Audit Logging", () => {
    it("creates CloudTrail for audit logging", () => {
      expect(has(/resource\s+"aws_cloudtrail"\s+"healthcare_audit"/)).toBe(true);
      expect(has(/enable_logging\s*=\s*true/)).toBe(true);
      expect(has(/is_multi_region_trail\s*=\s*true/)).toBe(true);
      expect(has(/enable_log_file_validation\s*=\s*true/)).toBe(true);
    });

    it("includes data events for S3", () => {
      expect(has(/data_resource/)).toBe(true);
      expect(has(/AWS::S3::Object/)).toBe(true);
      expect(has(/read_write_type\s*=\s*"All"/)).toBe(true);
    });

    it("has proper dependency on S3 bucket policy", () => {
      expect(has(/depends_on\s*=\s*\[[\s\S]*aws_s3_bucket\.audit_trail[\s\S]*aws_s3_bucket_policy\.audit_trail_policy[\s\S]*\]/)).toBe(true);
    });
  });

  describe("Random String Generation", () => {
    it("generates random suffixes for unique naming", () => {
      expect(has(/resource\s+"random_string"\s+"environment_suffix"/)).toBe(true);
      expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
      expect(has(/length\s*=\s*16/)).toBe(true); // Sufficient randomness
      expect(has(/special\s*=\s*false/)).toBe(true);
      expect(has(/upper\s*=\s*false/)).toBe(true);
    });
  });

  describe("Output Values", () => {
    it("exports VPC and networking outputs", () => {
      expect(has(/output\s+"vpc_id"/)).toBe(true);
      expect(has(/output\s+"vpc_cidr_block"/)).toBe(true);
      expect(has(/output\s+"public_subnet_ids"/)).toBe(true);
      expect(has(/output\s+"private_subnet_ids"/)).toBe(true);
      expect(has(/output\s+"database_subnet_ids"/)).toBe(true);
    });

    it("exports security group outputs", () => {
      expect(has(/output\s+"web_security_group_id"/)).toBe(true);
      expect(has(/output\s+"application_security_group_id"/)).toBe(true);
      expect(has(/output\s+"database_security_group_id"/)).toBe(true);
    });

    it("exports database outputs", () => {
      expect(has(/output\s+"rds_instance_id"/)).toBe(true);
      expect(has(/output\s+"rds_instance_endpoint"/)).toBe(true);
      expect(has(/output\s+"rds_instance_port"/)).toBe(true);
      expect(has(/output\s+"database_name"/)).toBe(true);
    });

    it("exports S3 and storage outputs", () => {
      expect(has(/output\s+"s3_bucket_id"/)).toBe(true);
      expect(has(/output\s+"s3_bucket_arn"/)).toBe(true);
      expect(has(/output\s+"s3_bucket_domain_name"/)).toBe(true);
    });

    it("exports KMS outputs", () => {
      expect(has(/output\s+"kms_key_id"/)).toBe(true);
      expect(has(/output\s+"kms_key_arn"/)).toBe(true);
    });

    it("exports CloudFront outputs", () => {
      expect(has(/output\s+"cloudfront_distribution_id"/)).toBe(true);
      expect(has(/output\s+"cloudfront_domain_name"/)).toBe(true);
    });

    it("exports CloudTrail outputs", () => {
      expect(has(/output\s+"cloudtrail_trail_name"/)).toBe(true);
      expect(has(/output\s+"audit_trail_bucket_id"/)).toBe(true);
      expect(has(/output\s+"cloudtrail_trail_arn"/)).toBe(true);
    });

    it("exports environment and deployment outputs", () => {
      expect(has(/output\s+"environment_suffix"/)).toBe(true);
      expect(has(/output\s+"deployment_region"/)).toBe(true);
      expect(has(/output\s+"availability_zones"/)).toBe(true);
    });
  });

  describe("Resource Naming and Tagging", () => {
    it("uses consistent naming with environment suffix", () => {
      expect(has(/\$\{var\.environment\}-.*-\$\{local\.env_suffix\}/)).toBe(true);
    });

    it("applies common tags via merge function", () => {
      expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
      expect(has(/tags\s*=\s*local\.common_tags/)).toBe(true);
    });
  });

  describe("Security Best Practices", () => {
    it("does not contain hardcoded credentials", () => {
      expect(has(/aws_access_key_id\s*=/)).toBe(false);
      expect(has(/aws_secret_access_key\s*=/)).toBe(false);
      expect(has(/password\s*=\s*"[^"]+"/)).toBe(false); // No hardcoded passwords
    });

    it("uses latest PostgreSQL version from data source", () => {
      expect(has(/engine_version\s*=\s*data\.aws_rds_engine_version\.postgresql\.version/)).toBe(true);
    });

    it("includes proper depends_on clauses", () => {
      expect(has(/depends_on\s*=\s*\[/)).toBe(true);
    });

    it("uses lifecycle management appropriately", () => {
      expect(has(/prevent_destroy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_changes/)).toBe(true);
    });
  });

  describe("HIPAA Compliance Features", () => {
    it("enforces encryption everywhere", () => {
      expect(has(/kms_key_id/)).toBe(true);
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/bucket_key_enabled\s*=\s*true/)).toBe(true);
    });

    it("includes proper audit logging", () => {
      expect(has(/value\s*=\s*"all"/)).toBe(true);
      expect(has(/log_connections/)).toBe(true);
      expect(has(/enable_log_file_validation\s*=\s*true/)).toBe(true);
    });

    it("implements proper backup retention", () => {
      expect(has(/backup_retention_period/)).toBe(true);
      expect(has(/delete_automated_backups\s*=\s*false/)).toBe(true);
      expect(has(/deletion_protection\s*=\s*true/)).toBe(true);
    });

    it("enforces network isolation", () => {
      expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
      // map_public_ip_on_launch = true is only for public subnets (which is correct)
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true); // Expected for public subnets
    });
  });

  describe("Provider Independence", () => {
    it("does not declare providers (handled by provider.tf)", () => {
      expect(has(/provider\s+"aws"/)).toBe(false);
      expect(has(/provider\s+"random"/)).toBe(false);
    });
  });
});
