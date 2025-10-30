import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_TF = path.resolve(__dirname, "../lib/provider.tf");
const USER_DATA_SH = path.resolve(__dirname, "../lib/user_data.sh");

const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const provider = fs.readFileSync(PROVIDER_TF, "utf8");

const has = (regex: RegExp) => regex.test(tf);
const hasProvider = (regex: RegExp) => regex.test(provider);

const resourceBlockHas = (resourceType: string, resourceName: string, field: string) =>
  new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*${field}\\s*=`).test(tf);

const countResourceType = (resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"`, "g");
  const matches = tf.match(regex);
  return matches ? matches.length : 0;
};

describe("Payment Processing Infrastructure Static Validation", () => {
  describe("File Structure and Existence", () => {
    test("tap_stack.tf exists and has substantial content", () => {
      expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
      expect(tf.length).toBeGreaterThan(20000);
    });

    test("provider.tf exists and is configured", () => {
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
      expect(provider.length).toBeGreaterThan(100);
    });

    test("user_data.sh exists for EC2 initialization", () => {
      expect(fs.existsSync(USER_DATA_SH)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("declares required Terraform version", () => {
      expect(hasProvider(/required_version\s*=\s*">=\s*1\.[0-9]+/)).toBe(true);
    });

    test("configures AWS provider with version constraint", () => {
      expect(hasProvider(/aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/)).toBe(true);
      expect(hasProvider(/version\s*=\s*">=\s*5\.0"/)).toBe(true);
    });

    test("configures S3 backend", () => {
      expect(hasProvider(/backend\s+"s3"/)).toBe(true);
    });

    test("uses variable for AWS region", () => {
      expect(hasProvider(/region\s*=\s*var\.aws_region/)).toBe(true);
    });
  });

  describe("Variable Declarations", () => {
    const requiredVariables = [
      "aws_region",
      "environment",
      "project_name",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "instance_type",
      "asg_min_size",
      "asg_max_size",
      "asg_desired_capacity",
      "db_instance_class",
      "db_name",
      "db_username",
      "db_password",
      "acm_certificate_arn",
      "domain_name",
      "key_pair_name"
    ];

    requiredVariables.forEach(variable => {
      test(`declares variable ${variable}`, () => {
        expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true);
      });
    });

    test("sensitive variables are marked as sensitive", () => {
      expect(has(/variable\s+"db_username"[\s\S]*sensitive\s*=\s*true/)).toBe(true);
      expect(has(/variable\s+"db_password"[\s\S]*sensitive\s*=\s*true/)).toBe(true);
    });

    test("variables have appropriate defaults", () => {
      expect(has(/default\s*=\s*"us-west-1"/)).toBe(true);
      expect(has(/default\s*=\s*"production"/)).toBe(true);
      expect(has(/default\s*=\s*"payment-processor"/)).toBe(true);
      expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    });
  });

  describe("Local Values Configuration", () => {
    test("declares common tags with required fields", () => {
      expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
      expect(has(/Environment\s*=\s*var\.environment/)).toBe(true);
      expect(has(/Project\s*=\s*var\.project_name/)).toBe(true);
      expect(has(/ManagedBy\s*=\s*"terraform"/)).toBe(true);
    });

    test("declares name prefix for resource naming", () => {
      expect(has(/name_prefix\s*=\s*"\${var\.project_name}-\${var\.environment}"/)).toBe(true);
    });

    test("declares conditional HTTPS configuration", () => {
      expect(has(/use_https\s*=\s*var\.acm_certificate_arn\s*!=\s*""/)).toBe(true);
      expect(has(/alb_protocol\s*=\s*local\.use_https\s*\?\s*"HTTPS"\s*:\s*"HTTP"/)).toBe(true);
      expect(has(/alb_port\s*=\s*local\.use_https\s*\?\s*443\s*:\s*80/)).toBe(true);
    });
  });

  describe("Data Sources", () => {
    test("declares availability zones data source", () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"/)).toBe(true);
      expect(has(/state\s*=\s*"available"/)).toBe(true);
    });

    test("declares caller identity data source", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test("uses region agnostic AMI data source", () => {
      expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
      expect(has(/most_recent\s*=\s*true/)).toBe(true);
      expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
      expect(has(/values\s*=\s*\["al2023-ami-\*-x86_64"\]/)).toBe(true);
    });
  });

  describe("KMS Key Configuration", () => {
    test("creates KMS keys for EBS and RDS encryption", () => {
      expect(has(/resource\s+"aws_kms_key"\s+"ebs_key"/)).toBe(true);
      expect(has(/resource\s+"aws_kms_key"\s+"rds_key"/)).toBe(true);
    });

    test("enables key rotation for KMS keys", () => {
      expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
    });

    test("creates KMS aliases for keys", () => {
      expect(has(/resource\s+"aws_kms_alias"\s+"ebs_key"/)).toBe(true);
      expect(has(/resource\s+"aws_kms_alias"\s+"rds_key"/)).toBe(true);
    });

    test("KMS keys have proper IAM policies", () => {
      expect(has(/policy\s*=\s*jsonencode/)).toBe(true);
      expect(has(/EnableIAMUserPermissions/)).toBe(true);
    });
  });

  describe("VPC and Network Configuration", () => {
    test("creates VPC with DNS support", () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    test("creates Internet Gateway", () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    });

    test("creates public and private subnets with proper configuration", () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
      expect(has(/count\s*=\s*length\(var\.public_subnet_cidrs\)/)).toBe(true);
      expect(has(/count\s*=\s*length\(var\.private_subnet_cidrs\)/)).toBe(true);
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
    });

    test("creates NAT Gateways with Elastic IPs", () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
      expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
      expect(has(/domain\s*=\s*"vpc"/)).toBe(true);
      expect(has(/count\s*=\s*length\(aws_subnet\.public\)/)).toBe(true);
    });

    test("creates route tables and associations", () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
    });

    test("routes internet traffic through IGW and NAT", () => {
      expect(has(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/)).toBe(true);
      expect(has(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/)).toBe(true);
      expect(has(/nat_gateway_id\s*=\s*aws_nat_gateway\.main/)).toBe(true);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group with HTTP/HTTPS rules", () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"/)).toBe(true);
      expect(has(/from_port\s*=\s*80/)).toBe(true);
      expect(has(/from_port\s*=\s*443/)).toBe(true);
      expect(has(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/)).toBe(true);
    });

    test("creates web tier security group allowing ALB traffic only", () => {
      expect(has(/resource\s+"aws_security_group"\s+"web"/)).toBe(true);
      expect(has(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/)).toBe(true);
    });

    test("creates database security group allowing web tier only", () => {
      expect(has(/resource\s+"aws_security_group"\s+"database"/)).toBe(true);
      expect(has(/from_port\s*=\s*5432/)).toBe(true);
      expect(has(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/)).toBe(true);
    });

    test("follows least privilege access principle", () => {
      expect(has(/create_before_destroy\s*=\s*true/)).toBe(true);
    });

    test("does not expose SSH to internet", () => {
      const sshExposed = /from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/.test(tf);
      expect(sshExposed).toBe(false);
    });
  });

  describe("IAM Configuration", () => {
    test("creates EC2 instance role and profile", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    });

    test("creates RDS enhanced monitoring role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/)).toBe(true);
    });

    test("attaches proper policies to roles", () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/)).toBe(true);
    });

    test("IAM policies allow CloudWatch and logs operations", () => {
      expect(has(/cloudwatch:PutMetricData/)).toBe(true);
      expect(has(/logs:CreateLogGroup/)).toBe(true);
      expect(has(/logs:CreateLogStream/)).toBe(true);
      expect(has(/logs:PutLogEvents/)).toBe(true);
    });
  });

  describe("RDS Aurora Cluster Configuration", () => {
    test("creates Aurora PostgreSQL cluster", () => {
      expect(has(/resource\s+"aws_rds_cluster"\s+"main"/)).toBe(true);
      expect(has(/engine\s*=\s*"aurora-postgresql"/)).toBe(true);
    });

    test("creates cluster instances with proper configuration", () => {
      expect(has(/resource\s+"aws_rds_cluster_instance"\s+"cluster_instances"/)).toBe(true);
      expect(has(/count\s*=\s*2/)).toBe(true);
      expect(has(/instance_class\s*=\s*var\.db_instance_class/)).toBe(true);
    });

    test("creates DB subnet group using private subnets", () => {
      expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
      expect(has(/subnet_ids\s*=\s*aws_subnet\.private/)).toBe(true);
    });

    test("enables storage encryption with KMS", () => {
      expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
      expect(has(/kms_key_id\s*=\s*aws_kms_key\.rds_key\.arn/)).toBe(true);
    });

    test("configures backup retention and maintenance windows", () => {
      expect(has(/backup_retention_period\s*=\s*30/)).toBe(true);
      expect(has(/preferred_backup_window/)).toBe(true);
      expect(has(/preferred_maintenance_window/)).toBe(true);
    });

    test("enables CloudWatch logs exports", () => {
      expect(has(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/)).toBe(true);
    });

    test("enables Performance Insights", () => {
      expect(has(/performance_insights_enabled\s*=\s*true/)).toBe(true);
    });
  });

  describe("Application Load Balancer Configuration", () => {
    test("creates Application Load Balancer", () => {
      expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
      expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
      expect(has(/internal\s*=\s*false/)).toBe(true);
    });

    test("creates target group with health checks", () => {
      expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
      expect(has(/health_check\s*{/)).toBe(true);
      expect(has(/healthy_threshold\s*=\s*2/)).toBe(true);
      expect(has(/unhealthy_threshold\s*=\s*2/)).toBe(true);
    });

    test("creates HTTP listener with conditional behavior", () => {
      expect(has(/resource\s+"aws_lb_listener"\s+"http"/)).toBe(true);
      expect(has(/port\s*=\s*"80"/)).toBe(true);
    });

    test("creates conditional HTTPS listener", () => {
      expect(has(/resource\s+"aws_lb_listener"\s+"https"/)).toBe(true);
      expect(has(/count\s*=\s*local\.use_https\s*\?\s*1\s*:\s*0/)).toBe(true);
      expect(has(/ssl_policy/)).toBe(true);
    });

    test("configures redirect from HTTP to HTTPS when certificate available", () => {
      expect(has(/type\s*=\s*local\.use_https\s*\?\s*"redirect"\s*:\s*"forward"/)).toBe(true);
      expect(has(/protocol\s*=\s*"HTTPS"/)).toBe(true);
      expect(has(/status_code\s*=\s*"HTTP_301"/)).toBe(true);
    });
  });

  describe("Auto Scaling Configuration", () => {
    test("creates launch template with security configuration", () => {
      expect(has(/resource\s+"aws_launch_template"\s+"main"/)).toBe(true);
      expect(has(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/)).toBe(true);
      expect(has(/instance_type\s*=\s*var\.instance_type/)).toBe(true);
    });

    test("enables IMDSv2 for enhanced security", () => {
      expect(has(/http_endpoint\s*=\s*"enabled"/)).toBe(true);
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    test("configures encrypted EBS volumes", () => {
      expect(has(/block_device_mappings/)).toBe(true);
      expect(has(/encrypted\s*=\s*true/)).toBe(true);
      expect(has(/kms_key_id\s*=\s*aws_kms_key\.ebs_key\.arn/)).toBe(true);
    });

    test("creates Auto Scaling Group in private subnets", () => {
      expect(has(/resource\s+"aws_autoscaling_group"\s+"main"/)).toBe(true);
      expect(has(/vpc_zone_identifier\s*=\s*aws_subnet\.private/)).toBe(true);
      expect(has(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/)).toBe(true);
    });

    test("configures scaling policies", () => {
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/)).toBe(true);
      expect(has(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/)).toBe(true);
      expect(has(/scaling_adjustment\s*=\s*1/)).toBe(true);
      expect(has(/scaling_adjustment\s*=\s*-1/)).toBe(true);
    });

    test("uses ELB health checks", () => {
      expect(has(/health_check_type\s*=\s*"ELB"/)).toBe(true);
      expect(has(/health_check_grace_period\s*=\s*300/)).toBe(true);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates CloudWatch alarms for scaling", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/)).toBe(true);
    });

    test("alarms trigger scaling policies", () => {
      expect(has(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn\]/)).toBe(true);
      expect(has(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_down\.arn\]/)).toBe(true);
    });

    test("monitors CPU utilization metrics", () => {
      expect(has(/metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
      expect(has(/namespace\s*=\s*"AWS\/EC2"/)).toBe(true);
      expect(has(/threshold\s*=\s*"80"/)).toBe(true);
      expect(has(/threshold\s*=\s*"10"/)).toBe(true);
    });
  });

  describe("Route 53 Configuration", () => {
    test("creates hosted zone conditionally", () => {
      expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
      expect(has(/count\s*=\s*var\.domain_name\s*!=\s*"payment-app\.example\.com"\s*\?\s*1\s*:\s*0/)).toBe(true);
    });

    test("creates DNS record pointing to ALB", () => {
      expect(has(/resource\s+"aws_route53_record"\s+"main"/)).toBe(true);
      expect(has(/type\s*=\s*"A"/)).toBe(true);
      expect(has(/alias/)).toBe(true);
      expect(has(/name\s*=\s*aws_lb\.main\.dns_name/)).toBe(true);
    });
  });

  describe("Output Configuration", () => {
    const expectedOutputs = [
      "vpc_id",
      "public_subnet_ids",
      "private_subnet_ids",
      "alb_dns_name",
      "alb_zone_id",
      "rds_cluster_endpoint",
      "rds_cluster_reader_endpoint",
      "kms_key_ebs_arn",
      "kms_key_rds_arn",
      "route53_zone_id",
      "application_url"
    ];

    expectedOutputs.forEach(output => {
      test(`exports output ${output}`, () => {
        expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
      });
    });

    test("sensitive outputs are marked as sensitive", () => {
      expect(has(/output\s+"rds_cluster_endpoint"[\s\S]*sensitive\s*=\s*true/)).toBe(true);
      expect(has(/output\s+"rds_cluster_reader_endpoint"[\s\S]*sensitive\s*=\s*true/)).toBe(true);
    });

    test("application URL uses conditional HTTPS/HTTP", () => {
      expect(has(/value\s*=\s*local\.use_https\s*\?\s*"https:\/\/\${var\.domain_name}"\s*:\s*"http:\/\/\${aws_lb\.main\.dns_name}"/)).toBe(true);
    });
  });

  describe("Resource Tagging", () => {
    test("applies common tags using merge function", () => {
      expect(has(/tags\s*=\s*merge\(local\.common_tags,/)).toBe(true);
    });

    test("resources have proper naming convention", () => {
      expect(has(/Name\s*=\s*"\${local\.name_prefix}-/)).toBe(true);
    });

    test("Auto Scaling Group has propagate at launch tags", () => {
      expect(has(/propagate_at_launch\s*=\s*true/)).toBe(true);
      expect(has(/propagate_at_launch\s*=\s*false/)).toBe(true);
    });
  });

  describe("Security Best Practices", () => {
    test("uses create_before_destroy lifecycle for security groups", () => {
      expect(has(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true/)).toBe(true);
    });

    test("does not expose database ports to internet", () => {
      const dbExposed = /from_port\s*=\s*5432[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/.test(tf);
      expect(dbExposed).toBe(false);
    });

    test("uses GP3 volume type for better performance", () => {
      expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
    });

    test("configures proper SSL policy for HTTPS", () => {
      expect(has(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS13-1-2-2021-06"/)).toBe(true);
    });
  });

  describe("Security Enhancements", () => {
    describe("AWS WAF Configuration", () => {
      test("creates WAF Web ACL for ALB protection", () => {
        expect(has(/resource\s+"aws_wafv2_web_acl"\s+"main"/)).toBe(true);
        expect(has(/scope\s*=\s*"REGIONAL"/)).toBe(true);
      });

      test("configures rate limiting rule", () => {
        expect(has(/rate_based_statement\s*{/)).toBe(true);
        expect(has(/limit\s*=\s*10000/)).toBe(true);
        expect(has(/aggregate_key_type\s*=\s*"IP"/)).toBe(true);
      });

      test("includes AWS managed rule sets", () => {
        expect(has(/AWSManagedRulesCommonRuleSet/)).toBe(true);
        expect(has(/AWSManagedRulesKnownBadInputsRuleSet/)).toBe(true);
      });

      test("configures geographic blocking", () => {
        expect(has(/geo_match_statement\s*{/)).toBe(true);
        expect(has(/country_codes\s*=\s*\[.*"CN".*"RU".*"KP".*"IR".*\]/)).toBe(true);
      });

      test("associates WAF with ALB", () => {
        expect(has(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/)).toBe(true);
        expect(has(/resource_arn\s*=\s*aws_lb\.main\.arn/)).toBe(true);
        expect(has(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/)).toBe(true);
      });
    });

    describe("Secrets Management", () => {
      test("generates secure random password", () => {
        expect(has(/resource\s+"random_password"\s+"db_master_password"/)).toBe(true);
        expect(has(/length\s*=\s*16/)).toBe(true);
        expect(has(/special\s*=\s*true/)).toBe(true);
        expect(has(/upper\s*=\s*true/)).toBe(true);
        expect(has(/lower\s*=\s*true/)).toBe(true);
        expect(has(/numeric\s*=\s*true/)).toBe(true);
      });

      test("creates encrypted secrets manager secret", () => {
        expect(has(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/)).toBe(true);
        expect(has(/kms_key_id\s*=\s*aws_kms_key\.rds_key\.arn/)).toBe(true);
        expect(has(/recovery_window_in_days\s*=\s*7/)).toBe(true);
      });

      test("stores database credentials in secrets manager", () => {
        expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"/)).toBe(true);
        expect(has(/password.*random_password\.db_master_password\.result/)).toBe(true);
      });

      test("RDS uses managed master user password", () => {
        expect(has(/manage_master_user_password\s*=\s*true/)).toBe(true);
        expect(has(/master_user_secret_kms_key_id\s*=\s*aws_kms_key\.rds_key\.arn/)).toBe(true);
      });

      test("removes hardcoded database password", () => {
        expect(has(/master_password\s*=\s*var\.db_password/)).toBe(false);
        expect(tf.includes('default     = "ChangeMe123!"') && !tf.includes('#   default     = "ChangeMe123!"')).toBe(false);
      });
    });

    describe("Audit Logging and Compliance", () => {
      test("configures VPC Flow Logs", () => {
        expect(has(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/)).toBe(true);
        expect(has(/traffic_type\s*=\s*"ALL"/)).toBe(true);
        expect(has(/vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      });

      test("creates CloudWatch log group for VPC Flow Logs", () => {
        expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"/)).toBe(true);
        expect(has(/retention_in_days\s*=\s*90/)).toBe(true);
        expect(has(/kms_key_id\s*=\s*aws_kms_key\.logs_key\.arn/)).toBe(true);
      });

      test("creates IAM role for VPC Flow Logs", () => {
        expect(has(/resource\s+"aws_iam_role"\s+"flow_log"/)).toBe(true);
        expect(has(/Service.*vpc-flow-logs\.amazonaws\.com/)).toBe(true);
      });

      test("configures CloudTrail for API audit logging", () => {
        expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
        expect(has(/include_management_events\s*=\s*true/)).toBe(true);
        expect(has(/kms_key_id\s*=\s*aws_kms_key\.logs_key\.arn/)).toBe(true);
      });

      test("creates S3 bucket for CloudTrail logs", () => {
        expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/)).toBe(true);
        expect(has(/force_destroy\s*=\s*true/)).toBe(true);
      });

      test("encrypts CloudTrail S3 bucket", () => {
        expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/)).toBe(true);
        expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.logs_key\.arn/)).toBe(true);
      });

      test("blocks public access to CloudTrail S3 bucket", () => {
        expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/)).toBe(true);
        expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
        expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      });
    });

    describe("Enhanced KMS Configuration", () => {
      test("creates dedicated KMS key for logs", () => {
        expect(has(/resource\s+"aws_kms_key"\s+"logs_key"/)).toBe(true);
        expect(has(/description.*=.*"KMS key for logs encryption"/)).toBe(true);
        expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
      });

      test("configures logs KMS key policy for CloudWatch and CloudTrail", () => {
        expect(has(/AllowCloudWatchLogs/)).toBe(true);
        expect(has(/AllowCloudTrail/)).toBe(true);
        expect(has(/Service.*logs\.\$\{var\.aws_region\}\.amazonaws\.com/)).toBe(true);
        expect(has(/Service.*cloudtrail\.amazonaws\.com/)).toBe(true);
      });

      test("creates KMS alias for logs key", () => {
        expect(has(/resource\s+"aws_kms_alias"\s+"logs_key"/)).toBe(true);
        expect(has(/name\s*=\s*"alias\/\$\{local\.name_prefix\}-logs"/)).toBe(true);
      });
    });

    describe("PCI DSS Compliance Tagging", () => {
      test("includes comprehensive compliance tags", () => {
        expect(has(/Compliance\s*=\s*"PCI-DSS"/)).toBe(true);
        expect(has(/DataClass\s*=\s*"Sensitive"/)).toBe(true);
        expect(has(/BackupRequired\s*=\s*"true"/)).toBe(true);
        expect(has(/MonitoringLevel\s*=\s*"Enhanced"/)).toBe(true);
        expect(has(/Owner\s*=\s*"security-team"/)).toBe(true);
        expect(has(/CostCenter\s*=\s*"payment-processing"/)).toBe(true);
        expect(has(/Application\s*=\s*"payment-processor"/)).toBe(true);
      });
    });

    describe("Enhanced ALB Security", () => {
      test("enables security features on ALB", () => {
        expect(has(/drop_invalid_header_fields\s*=\s*true/)).toBe(true);
        expect(has(/enable_deletion_protection\s*=\s*true/)).toBe(true);
        expect(has(/enable_http2\s*=\s*true/)).toBe(true);
      });

      test("uses modern TLS policy", () => {
        expect(has(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS13-1-2-2021-06"/)).toBe(true);
      });
    });

    describe("Enhanced Monitoring and Alerting", () => {
      test("creates CloudWatch alarms for critical metrics", () => {
        expect(has(/resource\s+"aws_cloudwatch_metric_alarm"/)).toBe(true);
        expect(has(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/)).toBe(true);
      });

      test("creates SNS topic for critical alerts", () => {
        expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
        expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.logs_key\.arn/)).toBe(true);
      });

      test("monitors RDS CPU and connections", () => {
        expect(has(/metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
        expect(has(/metric_name\s*=\s*"DatabaseConnections"/)).toBe(true);
      });

      test("monitors ALB response times and error rates", () => {
        expect(has(/metric_name\s*=\s*"TargetResponseTime"/)).toBe(true);
        expect(has(/metric_name\s*=\s*"HTTPCode_Target_5XX_Count"/)).toBe(true);
      });
    });
  });

  describe("Resource Count Validation", () => {
    test("has appropriate number of each resource type", () => {
      expect(countResourceType("aws_vpc")).toBe(1);
      expect(countResourceType("aws_internet_gateway")).toBe(1);
      expect(countResourceType("aws_subnet")).toBe(2);
      expect(countResourceType("aws_security_group")).toBe(3);
      expect(countResourceType("aws_kms_key")).toBeGreaterThanOrEqual(3); // EBS, RDS, and Logs keys
      expect(countResourceType("aws_rds_cluster")).toBe(1);
      expect(countResourceType("aws_lb")).toBe(1);
      expect(countResourceType("aws_autoscaling_group")).toBe(1);
      expect(countResourceType("aws_wafv2_web_acl")).toBe(1);
      expect(countResourceType("aws_secretsmanager_secret")).toBe(1);
      expect(countResourceType("aws_cloudtrail")).toBe(1);
      expect(countResourceType("aws_flow_log")).toBe(1);
      expect(countResourceType("random_password")).toBe(1);
    });

    test("has appropriate security and compliance resources", () => {
      expect(countResourceType("aws_s3_bucket")).toBeGreaterThanOrEqual(1); // CloudTrail logs bucket
      expect(countResourceType("aws_cloudwatch_log_group")).toBeGreaterThanOrEqual(1); // VPC Flow Logs
      expect(countResourceType("aws_sns_topic")).toBeGreaterThanOrEqual(1); // Alerts topic
      expect(countResourceType("aws_cloudwatch_metric_alarm")).toBeGreaterThanOrEqual(4); // Multiple monitoring alarms
    });
  });

  describe("Region Agnostic Configuration", () => {
    test("uses dynamic availability zone data source", () => {
      expect(has(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names/)).toBe(true);
    });

    test("does not hardcode region-specific values in resource definitions", () => {
      const resourceRegions = tf.replace(/variable\s+"aws_region"[\s\S]*?}/, "");
      const hardcodedRegions = /us-west-2|us-east-1|eu-west-1/.test(resourceRegions);
      expect(hardcodedRegions).toBe(false);
    });

    test("uses region agnostic AMI selection", () => {
      expect(has(/filter[\s\S]*name.*=.*"name"[\s\S]*values.*=.*\["al2023-ami-\*-x86_64"\]/)).toBe(true);
      expect(has(/filter[\s\S]*name.*=.*"virtualization-type"[\s\S]*values.*=.*\["hvm"\]/)).toBe(true);
    });
  });
});
