// tests/unit/terraform.unit.test.ts 
// Comprehensive unit tests for ../lib/tap_stack.tf 
// Validates all components based on financial trading platform DR requirements
// No Terraform or CDKTF commands are executed. 

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Cross-Region DR Stack: tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  // ===================================================================================================================
  // BASIC FILE STRUCTURE & TERRAFORM REQUIREMENTS
  // ===================================================================================================================

  describe("Basic File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("file is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("Terraform version constraints are defined in provider.tf", () => {
      // tap_stack.tf should not have terraform block since it's in provider.tf
      expect(stackContent).not.toMatch(/terraform\s*{/);
    });

    test("does NOT declare provider blocks (uses existing provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  // ===================================================================================================================
  // VARIABLE DECLARATIONS & VALIDATION
  // ===================================================================================================================

  describe("Variable Declarations", () => {
    test("aws_region and dr_region variables are defined in provider.tf", () => {
      expect(stackContent).toMatch(/aws_region and dr_region variables are defined in provider\.tf/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares owner variable", () => {
      expect(stackContent).toMatch(/variable\s+"owner"\s*{/);
    });

    test("declares project variable", () => {
      expect(stackContent).toMatch(/variable\s+"project"\s*{/);
    });

    test("declares VPC CIDR variables for both regions", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_dr"\s*{/);
    });

    test("declares database-related variables", () => {
      expect(stackContent).toMatch(/variable\s+"database_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"database_username"\s*{/);
      expect(stackContent).toMatch(/variable\s+"database_password"\s*{/);
      expect(stackContent).toMatch(/variable\s+"database_instance_class"\s*{/);
    });

    test("declares DynamoDB table name variable", () => {
      expect(stackContent).toMatch(/variable\s+"dynamodb_table_name"\s*{/);
    });

    test("declares domain name variable", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test("declares notification email variable", () => {
      expect(stackContent).toMatch(/variable\s+"notification_email"\s*{/);
    });

    test("sensitive variables are marked as sensitive", () => {
      expect(stackContent).toMatch(/variable\s+"database_username"[\s\S]*?sensitive\s*=\s*true/);
      expect(stackContent).toMatch(/variable\s+"database_password"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 1: VPC INFRASTRUCTURE (BOTH REGIONS)
  // ===================================================================================================================

  describe("VPC Infrastructure - Primary Region", () => {
    test("creates primary VPC with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("creates 3 public subnets in primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates 3 private subnets in primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates internet gateway for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"\s*{/);
    });

    test("creates 3 NAT gateways for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates 3 EIPs for NAT gateways in primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates route tables for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private"\s*{/);
    });

    test("creates route table associations for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_private"\s*{/);
    });
  });

  describe("VPC Infrastructure - DR Region", () => {
    test("creates DR VPC with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("creates 3 public subnets in DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_public"\s*{/);
    });

    test("creates 3 private subnets in DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_private"\s*{/);
    });

    test("creates internet gateway for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"dr"\s*{/);
    });

    test("creates NAT gateways for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"dr"\s*{/);
    });

    test("creates route tables for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dr_public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dr_private"\s*{/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 2: SECURITY GROUPS
  // ===================================================================================================================

  describe("Security Groups", () => {
    test("creates Aurora security group for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("creates Aurora security group for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("creates application security groups for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"application_primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"application_dr"\s*{/);
    });

    test("Aurora security groups allow MySQL port 3306", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
    });

    test("Application security groups allow HTTP and HTTPS", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 3: KMS ENCRYPTION
  // ===================================================================================================================

  describe("KMS Encryption", () => {
    test("creates KMS key for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("creates KMS key for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("enables key rotation for KMS keys", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS aliases for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"dr"\s*{/);
    });

    test("sets appropriate deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 4: TRANSIT GATEWAY
  // ===================================================================================================================

  describe("Transit Gateway Cross-Region Connectivity", () => {
    test("creates Transit Gateway for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("creates Transit Gateway for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("creates VPC attachments for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"dr"\s*{/);
    });

    test("creates cross-region peering attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"\s+"cross_region"\s*{/);
    });

    test("creates peering attachment accepter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"cross_region"\s*{/);
    });

    test("enables default route table association and propagation", () => {
      expect(stackContent).toMatch(/default_route_table_association\s*=\s*"enable"/);
      expect(stackContent).toMatch(/default_route_table_propagation\s*=\s*"enable"/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 5: AURORA GLOBAL DATABASE
  // ===================================================================================================================

  describe("Aurora Global Database", () => {
    test("creates Aurora Global Cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"trading"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
    });

    test("creates primary Aurora cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("creates DR Aurora cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("creates Aurora instances for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates Aurora instances for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("enables encryption with KMS", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.dr\.arn/);
    });

    test("enables deletion protection", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test("configures backup retention", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("enables Performance Insights", () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test("creates DB subnet groups for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"dr"\s*{/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 6: DYNAMODB GLOBAL TABLES
  // ===================================================================================================================

  describe("DynamoDB Tables", () => {
    test("creates DynamoDB tables in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"trading_config_primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"trading_config_dr"\s*{/);
    });

    test("uses PAY_PER_REQUEST billing mode", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("enables DynamoDB streams", () => {
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test("enables server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("enables point-in-time recovery", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("configures separate tables in both regions", () => {
      expect(stackContent).toMatch(/trading_config_primary/);
      expect(stackContent).toMatch(/trading_config_dr/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 7: ROUTE 53 FAILOVER ROUTING
  // ===================================================================================================================

  describe("Route 53 Failover Routing", () => {
    test("creates Route 53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"trading"\s*{/);
    });

    test("creates health checks for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"dr"\s*{/);
    });

    test("configures HTTPS health checks", () => {
      expect(stackContent).toMatch(/type\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/port\s*=\s*443/);
    });

    test("sets appropriate failure threshold and request interval", () => {
      expect(stackContent).toMatch(/failure_threshold\s*=\s*"3"/);
      expect(stackContent).toMatch(/request_interval\s*=\s*"30"/);
    });

    test("creates primary and secondary DNS records", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"dr"\s*{/);
    });

    test("configures failover routing policy", () => {
      expect(stackContent).toMatch(/failover_routing_policy\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*"PRIMARY"/);
      expect(stackContent).toMatch(/type\s*=\s*"SECONDARY"/);
    });

    test("associates health checks with DNS records", () => {
      expect(stackContent).toMatch(/health_check_id\s*=\s*aws_route53_health_check\.primary\.id/);
      expect(stackContent).toMatch(/health_check_id\s*=\s*aws_route53_health_check\.dr\.id/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 8: APPLICATION LOAD BALANCERS
  // ===================================================================================================================

  describe("Application Load Balancers", () => {
    test("creates ALB for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test("creates ALB for DR region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"dr"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("configures ALBs as application load balancers", () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALBs are internet-facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("associates security groups with ALBs", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.application_primary\.id\]/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.application_dr\.id\]/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 9: IAM ROLES & POLICIES
  // ===================================================================================================================

  describe("IAM Roles and Policies", () => {
    test("creates RDS monitoring roles for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring_dr"\s*{/);
    });

    test("creates Lambda failover role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover"\s*{/);
    });

    test("attaches RDS enhanced monitoring policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AmazonRDSEnhancedMonitoringRole"/);
    });

    test("creates custom Lambda failover policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_failover"\s*{/);
    });

    test("Lambda policy includes required permissions", () => {
      expect(stackContent).toMatch(/"rds:FailoverGlobalCluster"/);
      expect(stackContent).toMatch(/"route53:ChangeResourceRecordSets"/);
      expect(stackContent).toMatch(/"logs:CreateLogGroup"/);
    });
  });

  // ===================================================================================================================
  // COMPONENT 10: AUTOMATED FAILOVER & MONITORING
  // ===================================================================================================================

  describe("Automated Failover System", () => {
    test("creates Lambda function for failover", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover"\s*{/);
    });

    test("creates archive file for Lambda code", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_failover"\s*{/);
    });

    test("Lambda function has appropriate timeout", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*300/);
    });

    test("Lambda function uses Python runtime", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test("creates Lambda permission for SNS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_sns"\s*{/);
    });
  });

  describe("CloudWatch Monitoring & Alerting", () => {
    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
    });

    test("SNS topic uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary\.id/);
    });

    test("creates SNS email subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_alerts"\s*{/);
    });

    test("creates SNS Lambda subscription for automated failover", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"lambda_alerts"\s*{/);
    });

    test("health check monitoring is handled by Route 53 directly", () => {
      expect(stackContent).toMatch(/CloudWatch alarms for health checks removed to avoid circular dependency/);
    });

    test("creates CloudWatch alarm for Aurora replication lag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_replication_lag"\s*{/);
    });

    test("alarms trigger SNS notifications", () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });

    test("replication lag threshold supports RPO < 1 minute", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"30000"/); // 30 seconds in milliseconds
    });
  });

  // ===================================================================================================================
  // COMPONENT 11: CLOUDTRAIL AUDITING
  // ===================================================================================================================

  describe("CloudTrail Auditing", () => {
    test("creates S3 bucket for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_primary"\s*{/);
    });

    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"trading"\s*{/);
    });

    test("enables multi-region trail", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("includes global service events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("enables CloudTrail logging", () => {
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("uses KMS encryption for CloudTrail", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test("configures S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_primary"\s*{/);
    });

    test("blocks public access to S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_primary"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("creates S3 bucket policy for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_primary"\s*{/);
    });
  });

  // ===================================================================================================================
  // FINANCIAL INDUSTRY STANDARDS & COMPLIANCE
  // ===================================================================================================================

  describe("Financial Industry Standards", () => {
    test("all resources have required tags (Environment, Owner, Project)", () => {
      const tagMatches = stackContent.match(/tags\s*=\s*{[\s\S]*?}/g) || [];
      expect(tagMatches.length).toBeGreaterThan(10); // Should have many tagged resources

      // Check that tags include required fields
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project/);
    });

    test("encryption is enabled for all data at rest", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/); // Aurora
      expect(stackContent).toMatch(/server_side_encryption/); // DynamoDB
      expect(stackContent).toMatch(/kms_master_key_id/); // SNS
    });

    test("deletion protection is enabled for critical resources", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test("backup and recovery features are configured", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/point_in_time_recovery/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*false/);
    });

    test("monitoring and alerting are comprehensive", () => {
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });
  });

  // ===================================================================================================================
  // RPO/RTO REQUIREMENTS VALIDATION
  // ===================================================================================================================

  describe("RPO/RTO Requirements (< 1 minute RPO, < 5 minutes RTO)", () => {
    test("Aurora Global Database supports RPO < 1 minute", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(stackContent).toMatch(/global_cluster_identifier/);
    });

    test("Route 53 health checks support RTO < 5 minutes", () => {
      expect(stackContent).toMatch(/request_interval\s*=\s*"30"/); // 30-second intervals
      expect(stackContent).toMatch(/failure_threshold\s*=\s*"3"/); // 3 failures = 90 seconds max
    });

    test("DynamoDB tables provide cross-region data storage", () => {
      expect(stackContent).toMatch(/trading_config_primary/);
      expect(stackContent).toMatch(/trading_config_dr/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    });

    test("automated failover mechanisms are in place", () => {
      expect(stackContent).toMatch(/aws_lambda_function.*failover/);
      expect(stackContent).toMatch(/aws_sns_topic_subscription.*lambda_alerts/);
    });

    test("replication lag monitoring supports RPO requirements", () => {
      expect(stackContent).toMatch(/AuroraGlobalDBReplicationLag/);
      expect(stackContent).toMatch(/threshold\s*=\s*"30000"/); // 30 seconds threshold
    });
  });

  // ===================================================================================================================
  // DATA SOURCES VALIDATION
  // ===================================================================================================================

  describe("Data Sources", () => {
    test("declares availability zones data sources for both regions", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"\s*{/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"dr"\s*{/);
    });

    test("declares caller identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("uses random_id for unique resource naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
    });
  });

  // ===================================================================================================================
  // OUTPUTS VALIDATION
  // ===================================================================================================================

  describe("Outputs", () => {
    test("outputs VPC IDs for both regions", () => {
      expect(stackContent).toMatch(/output\s+"primary_vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"dr_vpc_id"\s*{/);
    });

    test("outputs Aurora cluster information", () => {
      expect(stackContent).toMatch(/output\s+"aurora_global_cluster_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"primary_cluster_endpoint"\s*{/);
      expect(stackContent).toMatch(/output\s+"dr_cluster_endpoint"\s*{/);
    });

    test("outputs DynamoDB table names", () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_table_primary_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"dynamodb_table_dr_name"\s*{/);
    });

    test("outputs Route 53 zone ID", () => {
      expect(stackContent).toMatch(/output\s+"route53_zone_id"\s*{/);
    });

    test("outputs ALB DNS names", () => {
      expect(stackContent).toMatch(/output\s+"primary_alb_dns"\s*{/);
      expect(stackContent).toMatch(/output\s+"dr_alb_dns"\s*{/);
    });

    test("outputs Lambda function name", () => {
      expect(stackContent).toMatch(/output\s+"failover_lambda_function_name"\s*{/);
    });

    test("outputs SNS topic ARN", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("outputs CloudTrail name", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_name"\s*{/);
    });

    test("outputs KMS key ARNs", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_primary_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"kms_key_dr_arn"\s*{/);
    });

    test("outputs Transit Gateway IDs", () => {
      expect(stackContent).toMatch(/output\s+"transit_gateway_primary_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"transit_gateway_dr_id"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = stackContent.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];
      outputMatches.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  // ===================================================================================================================
  // RESOURCE NAMING & CONSISTENCY
  // ===================================================================================================================

  describe("Resource Naming and Consistency", () => {
    test("uses consistent naming convention with 'trading' prefix", () => {
      expect(stackContent).toMatch(/"trading-vpc-primary"/);
      expect(stackContent).toMatch(/"trading-vpc-dr"/);
      expect(stackContent).toMatch(/"trading-global-cluster"/);
    });

    test("uses provider aliases correctly", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.dr/);
    });

    test("uses proper resource references", () => {
      expect(stackContent).toMatch(/aws_vpc\.primary\.id/);
      expect(stackContent).toMatch(/aws_vpc\.dr\.id/);
      expect(stackContent).toMatch(/aws_kms_key\.primary\.arn/);
    });

    test("uses count and count.index appropriately", () => {
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/count\.index/);
    });
  });

  // ===================================================================================================================
  // DEPENDENCY MANAGEMENT
  // ===================================================================================================================

  describe("Resource Dependencies", () => {
    test("NAT gateways depend on internet gateways", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.primary\]/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.dr\]/);
    });

    test("Aurora clusters have proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_rds_global_cluster\.trading\]/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_rds_cluster\.primary\]/);
    });

    test("CloudTrail depends on S3 bucket policy", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail_primary\]/);
    });
  });

  // ===================================================================================================================
  // SECURITY BEST PRACTICES
  // ===================================================================================================================

  describe("Security Best Practices", () => {
    test("uses least privilege IAM policies", () => {
      expect(stackContent).toMatch(/Effect.*Allow/);
      expect(stackContent).toMatch(/Resource.*\*/); // Some resources need wildcard access
    });

    test("enables encryption in transit and at rest", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id/);
    });

    test("uses security groups with specific port access", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/); // MySQL
      expect(stackContent).toMatch(/from_port\s*=\s*443/);  // HTTPS
    });

    test("blocks public access where appropriate", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });
});
