// test/terraform.unit.test.ts
// Unit tests for Terraform main.tf configuration

import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Unit Tests", () => {
  const mainTfPath = path.resolve(__dirname, "../lib/main.tf");
  const providerTfPath = path.resolve(__dirname, "../lib/provider.tf");
  let mainContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read the main.tf file once
    if (fs.existsSync(mainTfPath)) {
      mainContent = fs.readFileSync(mainTfPath, "utf8");
    }
    if (fs.existsSync(providerTfPath)) {
      providerContent = fs.readFileSync(providerTfPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Terraform Configuration Block", () => {
    test("declares terraform block with required version", () => {
      expect(mainContent).toMatch(/terraform\s*{/);
      expect(mainContent).toMatch(/required_version\s*=\s*">=\s*1\.0\.0"/);
    });

    test("declares required providers", () => {
      expect(mainContent).toMatch(/required_providers\s*{/);
      expect(mainContent).toMatch(/aws\s*=\s*{[^}]*source\s*=\s*"hashicorp\/aws"/);
      expect(mainContent).toMatch(/random\s*=\s*{[^}]*source\s*=\s*"hashicorp\/random"/);
      expect(mainContent).toMatch(/archive\s*=\s*{[^}]*source\s*=\s*"hashicorp\/archive"/);
    });
  });

  describe("Variables", () => {
    test("declares environment_suffix variable", () => {
      expect(mainContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares aws_region variable with default us-west-1", () => {
      expect(mainContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(mainContent).toMatch(/default\s*=\s*"us-west-1"/);
    });

    test("declares allowed_https_cidrs variable", () => {
      expect(mainContent).toMatch(/variable\s+"allowed_https_cidrs"\s*{/);
      expect(mainContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares bastion_ingress_cidrs variable", () => {
      expect(mainContent).toMatch(/variable\s+"bastion_ingress_cidrs"\s*{/);
      expect(mainContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares vpc_cidr variable with default 10.20.0.0/16", () => {
      expect(mainContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(mainContent).toMatch(/default\s*=\s*"10\.20\.0\.0\/16"/);
    });

    test("declares instance type variables", () => {
      expect(mainContent).toMatch(/variable\s+"app_instance_type"\s*{/);
      expect(mainContent).toMatch(/variable\s+"bastion_instance_type"\s*{/);
    });

    test("declares ASG sizing variables", () => {
      expect(mainContent).toMatch(/variable\s+"asg_min_size"\s*{/);
      expect(mainContent).toMatch(/variable\s+"asg_max_size"\s*{/);
      expect(mainContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
    });

    test("declares RDS variables", () => {
      expect(mainContent).toMatch(/variable\s+"rds_instance_class"\s*{/);
      expect(mainContent).toMatch(/variable\s+"rds_allocated_storage"\s*{/);
      expect(mainContent).toMatch(/variable\s+"rds_username"\s*{/);
    });
  });

  describe("Locals", () => {
    test("defines env_suffix local", () => {
      expect(mainContent).toMatch(/locals\s*{/);
      expect(mainContent).toMatch(/env_suffix\s*=/);
    });

    test("defines common_tags with prod- prefix", () => {
      expect(mainContent).toMatch(/common_tags\s*=\s*{/);
      expect(mainContent).toMatch(/Environment\s*=\s*"prod"/);
      expect(mainContent).toMatch(/Project\s*=\s*"secure-stack"/);
      expect(mainContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("defines subnet CIDR calculations", () => {
      expect(mainContent).toMatch(/public_subnet_cidrs\s*=/);
      expect(mainContent).toMatch(/private_subnet_cidrs\s*=/);
      expect(mainContent).toMatch(/db_subnet_cidrs\s*=/);
    });

    test("defines security group change events", () => {
      expect(mainContent).toMatch(/sg_change_events\s*=\s*\[/);
      expect(mainContent).toMatch(/"CreateSecurityGroup"/);
      expect(mainContent).toMatch(/"AuthorizeSecurityGroupIngress"/);
      expect(mainContent).toMatch(/"DeleteSecurityGroup"/);
    });
  });

  describe("Networking - VPC and Subnets", () => {
    test("creates VPC resource", () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(mainContent).toMatch(/count\s*=\s*2/);
      expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(mainContent).toMatch(/count\s*=\s*2/);
    });

    test("creates database subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"db"\s*{/);
      expect(mainContent).toMatch(/count\s*=\s*2/);
    });

    test("creates NAT Gateways", () => {
      expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(mainContent).toMatch(/count\s*=\s*2/);
      expect(mainContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("creates Elastic IPs for NAT", () => {
      expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(mainContent).toMatch(/count\s*=\s*2/);
      expect(mainContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates route tables", () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(mainContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(mainContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });
  });

  describe("Security - NACLs and Security Groups", () => {
    test("creates public NACL with proper rules", () => {
      expect(mainContent).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
      expect(mainContent).toMatch(/from_port\s*=\s*22/);
      expect(mainContent).toMatch(/from_port\s*=\s*443/);
    });

    test("creates private NACL with proper rules", () => {
      expect(mainContent).toMatch(/resource\s+"aws_network_acl"\s+"private"\s*{/);
      expect(mainContent).toMatch(/from_port\s*=\s*5432/);
    });

    test("creates bastion security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"\s*{/);
      expect(mainContent).toMatch(/dynamic\s+"ingress"\s*{/);
      expect(mainContent).toMatch(/for_each\s*=\s*var\.bastion_ingress_cidrs/);
    });

    test("creates app security group with HTTPS only from allowed CIDRs", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      expect(mainContent).toMatch(/for_each\s*=\s*var\.allowed_https_cidrs/);
      expect(mainContent).toMatch(/from_port\s*=\s*443/);
      expect(mainContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates RDS security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(mainContent).toMatch(/from_port\s*=\s*5432/);
      expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("creates Lambda security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });
  });

  describe("KMS and Encryption", () => {
    test("creates KMS key with rotation enabled", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"general"\s*{/);
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(mainContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("creates KMS key policy", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key_policy"\s+"general"\s*{/);
      expect(mainContent).toMatch(/"Enable IAM User Permissions"/);
    });

    test("creates KMS alias", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"general"\s*{/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates S3 logs bucket", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test("configures S3 bucket encryption with KMS", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.arn/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enables S3 bucket versioning", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("blocks public access on S3 bucket", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("creates S3 bucket policy denying unencrypted puts and insecure connections", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/"DenyInsecureConnections"/);
      expect(mainContent).toMatch(/"DenyUnencryptedPuts"/);
      expect(mainContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
    });

    test("enables S3 server access logging", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"logs"\s*{/);
      expect(mainContent).toMatch(/target_prefix\s*=\s*"access-logs\/"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 app role with SSM and Secrets Manager access", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_app"\s*{/);
      expect(mainContent).toMatch(/"ssm:GetParameter"/);
      expect(mainContent).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(mainContent).toMatch(/"logs:CreateLogGroup"/);
    });

    test("creates EC2 instance profile", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_app"\s*{/);
    });

    test("creates bastion role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"bastion"\s*{/);
    });

    test("creates Lambda security role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_security"\s*{/);
      expect(mainContent).toMatch(/"sns:Publish"/);
      expect(mainContent).toMatch(/"ec2:DescribeSecurityGroups"/);
    });
  });

  describe("Compute - EC2 and Auto Scaling", () => {
    test("creates bastion host instance", () => {
      expect(mainContent).toMatch(/resource\s+"aws_instance"\s+"bastion"\s*{/);
      expect(mainContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
    });

    test("creates launch template for app instances", () => {
      expect(mainContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
      expect(mainContent).toMatch(/instance_type\s*=\s*var\.app_instance_type/);
      expect(mainContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(mainContent).toMatch(/monitoring\s*{\s*enabled\s*=\s*true/);
    });

    test("creates Auto Scaling Group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"\s*{/);
      expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(mainContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(mainContent).toMatch(/min_size\s*=\s*var\.asg_min_size/);
      expect(mainContent).toMatch(/max_size\s*=\s*var\.asg_max_size/);
    });

    test("creates scaling policies", () => {
      expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_out"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_in"\s*{/);
      expect(mainContent).toMatch(/adjustment_type\s*=\s*"ChangeInCapacity"/);
    });
  });

  describe("Load Balancing", () => {
    test("creates Network Load Balancer", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"app"\s*{/);
      expect(mainContent).toMatch(/load_balancer_type\s*=\s*"network"/);
      expect(mainContent).toMatch(/internal\s*=\s*false/);
      expect(mainContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("creates target group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
      expect(mainContent).toMatch(/port\s*=\s*443/);
      expect(mainContent).toMatch(/protocol\s*=\s*"TCP"/);
    });

    test("creates listener on port 443", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb_listener"\s+"app"\s*{/);
      expect(mainContent).toMatch(/port\s*=\s*"443"/);
      expect(mainContent).toMatch(/protocol\s*=\s*"TCP"/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates CPU high alarm for scale out", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*{/);
      expect(mainContent).toMatch(/threshold\s*=\s*"60"/);
      expect(mainContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });

    test("creates CPU low alarm for scale in", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"\s*{/);
      expect(mainContent).toMatch(/threshold\s*=\s*"30"/);
      expect(mainContent).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
    });

    test("creates CPU critical alarm at 80% for 5 minutes", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_critical"\s*{/);
      expect(mainContent).toMatch(/threshold\s*=\s*"80"/);
      expect(mainContent).toMatch(/period\s*=\s*"300"/);
      expect(mainContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/);
    });
  });

  describe("RDS Database", () => {
    test("creates RDS PostgreSQL instance", () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(mainContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.general\.arn/);
    });

    test("configures RDS backup retention", () => {
      expect(mainContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("disables deletion protection for destroyability", () => {
      expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(mainContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("creates DB subnet group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.db\[\*\]\.id/);
    });
  });

  describe("Lambda and EventBridge", () => {
    test("creates Lambda function for security automation", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"security_automation"\s*{/);
      expect(mainContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(mainContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test("configures Lambda VPC settings", () => {
      expect(mainContent).toMatch(/vpc_config\s*{/);
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(mainContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("creates EventBridge rule for security group changes", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_changes"\s*{/);
      expect(mainContent).toMatch(/"AWS API Call via CloudTrail"/);
      expect(mainContent).toMatch(/eventName\s*=\s*local\.sg_change_events/);
    });

    test("creates periodic compliance check rule", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"periodic_compliance"\s*{/);
      expect(mainContent).toMatch(/schedule_expression\s*=\s*"rate\(1 hour\)"/);
    });

    test("creates CloudWatch Log Group for security events", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security_events"\s*{/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.general\.arn/);
    });
  });

  describe("SNS Topic", () => {
    test("creates SNS topic for security alerts", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.id/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(mainContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs subnet IDs", () => {
      expect(mainContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(mainContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(mainContent).toMatch(/output\s+"db_subnet_ids"\s*{/);
    });

    test("outputs security group IDs", () => {
      expect(mainContent).toMatch(/output\s+"bastion_sg_id"\s*{/);
      expect(mainContent).toMatch(/output\s+"app_sg_id"\s*{/);
      expect(mainContent).toMatch(/output\s+"rds_sg_id"\s*{/);
    });

    test("outputs NLB DNS name", () => {
      expect(mainContent).toMatch(/output\s+"nlb_dns_name"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_lb\.app\.dns_name/);
    });

    test("outputs bastion public DNS", () => {
      expect(mainContent).toMatch(/output\s+"bastion_public_dns"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_instance\.bastion\.public_dns/);
    });

    test("outputs ASG name", () => {
      expect(mainContent).toMatch(/output\s+"asg_name"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_autoscaling_group\.app\.name/);
    });

    test("outputs RDS endpoint", () => {
      expect(mainContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    });

    test("outputs logs bucket name", () => {
      expect(mainContent).toMatch(/output\s+"logs_bucket_name"\s*{/);
      expect(mainContent).toMatch(/value\s*=\s*aws_s3_bucket\.logs\.id/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resources use prod- prefix", () => {
      const resourcePattern = /Name\s*=\s*"prod-[^"]+/g;
      const matches = mainContent.match(resourcePattern) || [];
      expect(matches.length).toBeGreaterThan(20);
    });

    test("all resources include environment suffix in names", () => {
      const suffixPattern = /Name\s*=\s*"[^"]*\$\{local\.env_suffix\}"/g;
      const matches = mainContent.match(suffixPattern) || [];
      expect(matches.length).toBeGreaterThan(15);
    });
  });

  describe("Security Requirements", () => {
    test("EC2 instances are only in private subnets", () => {
      expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(mainContent).not.toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public/);
    });

    test("app tier accepts HTTPS only from allowed_https_cidrs", () => {
      // Check that app security group has dynamic ingress based on allowed_https_cidrs
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      // Check for dynamic ingress block
      const dynamicIngressMatch = mainContent.match(/dynamic\s+"ingress"\s*{\s*for_each\s*=\s*var\.allowed_https_cidrs/);
      expect(dynamicIngressMatch).toBeTruthy();
    });

    test("RDS is not publicly accessible (private subnets only)", () => {
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.db\[\*\]\.id/);
    });

    test("all S3 buckets are encrypted with KMS", () => {
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.general\.arn/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("no CloudTrail resources are created", () => {
      expect(mainContent).not.toMatch(/resource\s+"aws_cloudtrail"/);
    });

    test("no ACM certificates are created", () => {
      expect(mainContent).not.toMatch(/resource\s+"aws_acm/);
    });

    test("no WAF resources are created", () => {
      expect(mainContent).not.toMatch(/resource\s+"aws_waf/);
    });
  });

  describe("State Management", () => {
    test("DynamoDB table for state locking is included", () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"\s*{/);
      expect(mainContent).toMatch(/hash_key\s*=\s*"LockID"/);
    });
  });

  describe("Data Sources", () => {
    test("uses data source for availability zones", () => {
      expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("uses data source for AMI", () => {
      expect(mainContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(mainContent).toMatch(/most_recent\s*=\s*true/);
    });

    test("uses data source for caller identity", () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });
});