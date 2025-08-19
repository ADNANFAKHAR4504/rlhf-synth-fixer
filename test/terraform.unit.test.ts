// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/main.tf
// No Terraform or CDKTF commands are executed - only static validation.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/main.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: main.tf", () => {
  let content: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    content = fs.readFileSync(stackPath, "utf8");
  });

  // === File Structure & Basic Requirements ===
  
  test("main.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    expect(content).not.toMatch(/terraform\s*{/);
  });

  test("declares aws_region variable in main.tf", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  // === Variable Declarations ===
  
  describe("Variables", () => {
    test("declares all required variables", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/variable\s+"app_name"\s*{/);
      expect(content).toMatch(/variable\s+"environment"\s*{/);
      expect(content).toMatch(/variable\s+"domain_name"\s*{/);
      expect(content).toMatch(/variable\s+"db_password"\s*{/);
    });

    test("db_password variable is marked as sensitive", () => {
      const dbPasswordMatch = content.match(/variable\s+"db_password"\s*{[^}]*}/s);
      expect(dbPasswordMatch).toBeTruthy();
      expect(dbPasswordMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  // === Data Sources ===
  
  describe("Data Sources", () => {
    test("uses data source for availability zones", () => {
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("uses data source for AMI", () => {
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });
  });

  // === Locals ===
  
  describe("Locals", () => {
    test("defines common_tags local", () => {
      expect(content).toMatch(/locals\s*{[^}]*common_tags\s*=/s);
    });

    test("defines azs local", () => {
      expect(content).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names/s);
    });

    test("common_tags includes required tags", () => {
      const localsMatch = content.match(/locals\s*{[^}]*}/s);
      expect(localsMatch).toBeTruthy();
      expect(localsMatch![0]).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  // === VPC and Networking ===
  
  describe("VPC Infrastructure", () => {
    test("creates VPC with DNS support", () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates VPC with correct CIDR block", () => {
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("creates Internet Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates public subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates database subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test("creates public subnets in multiple AZs with correct CIDR", () => {
      expect(content).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
      expect(content).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });

    test("creates private subnets with correct CIDR", () => {
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/);
    });

    test("creates database subnets with correct CIDR", () => {
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 20\}\.0\/24"/);
    });

    test("subnets have proper type tags", () => {
      expect(content).toMatch(/Type\s*=\s*"Public"/);
      expect(content).toMatch(/Type\s*=\s*"Private"/);
      expect(content).toMatch(/Type\s*=\s*"Database"/);
    });

    test("creates NAT Gateways with EIPs", () => {
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("NAT gateways depend on internet gateway", () => {
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("creates route tables and associations", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test("public route table has internet gateway route", () => {
      const publicRtMatch = content.match(/resource\s+"aws_route_table"\s+"public"\s*{[^}]*}/s);
      expect(publicRtMatch).toBeTruthy();
      expect(publicRtMatch![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRtMatch![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private route tables have NAT gateway routes", () => {
      const privateRtMatch = content.match(/resource\s+"aws_route_table"\s+"private"\s*{[^}]*}/s);
      expect(privateRtMatch).toBeTruthy();
      expect(privateRtMatch![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("limits to 2 availability zones", () => {
      expect(content).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });
  });

  // === Security Groups ===
  
  describe("Security Groups", () => {
    test("creates ALB security group with HTTP/HTTPS access", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);
    });

    test("ALB security group allows HTTP from internet", () => {
      const httpIngressPattern = /ingress\s*{[^}]*from_port\s*=\s*80[^}]*}/s;
      const httpMatch = content.match(httpIngressPattern);
      expect(httpMatch).toBeTruthy();
      expect(httpMatch![0]).toMatch(/to_port\s*=\s*80/);
      expect(httpMatch![0]).toMatch(/protocol\s*=\s*"tcp"/);
      expect(httpMatch![0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("ALB security group allows HTTPS from internet", () => {
      const httpsIngressPattern = /ingress\s*{[^}]*from_port\s*=\s*443[^}]*}/s;
      const httpsMatch = content.match(httpsIngressPattern);
      expect(httpsMatch).toBeTruthy();
      expect(httpsMatch![0]).toMatch(/to_port\s*=\s*443/);
      expect(httpsMatch![0]).toMatch(/protocol\s*=\s*"tcp"/);
      expect(httpsMatch![0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("ALB security group has proper configuration", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/name\s*=.*alb-sg/);
      expect(content).toMatch(/description\s*=.*Application Load Balancer/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates EC2 security group with restricted access", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("EC2 security group only allows ALB traffic", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/to_port\s*=\s*80/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("creates RDS security group with database access", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(content).toMatch(/from_port\s*=\s*5432/); // PostgreSQL port
    });

    test("RDS security group only allows EC2 access", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(content).toMatch(/from_port\s*=\s*5432/);
      expect(content).toMatch(/to_port\s*=\s*5432/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("all security groups have proper names and descriptions", () => {
      expect(content).toMatch(/name\s*=.*alb-sg/);
      expect(content).toMatch(/name\s*=.*ec2-sg/);
      expect(content).toMatch(/name\s*=.*rds-sg/);
      expect(content).toMatch(/description\s*=.*Application Load Balancer/);
      expect(content).toMatch(/description\s*=.*EC2 instances/);
      expect(content).toMatch(/description\s*=.*RDS database/);
    });
  });

  // === IAM Roles and Policies ===
  
  describe("IAM Configuration", () => {
    test("creates EC2 IAM role with proper assume policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/ec2\.amazonaws\.com/);
      expect(content).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(content).toMatch(/"Action"\s*=\s*"sts:AssumeRole"|Action\s*=\s*"sts:AssumeRole"/);
    });

    test("creates IAM policy with least privilege", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/s3:GetObject/);
      expect(content).toMatch(/ssm:GetParameter/);
      expect(content).toMatch(/logs:CreateLogGroup/);
      expect(content).toMatch(/kms:Encrypt/);
      expect(content).toMatch(/kms:Decrypt/);
    });

    test("IAM policy grants specific S3 permissions to logs bucket only", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/aws_s3_bucket\.logs\.arn/);
    });

    test("IAM policy grants SSM parameter access with path restriction", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"ssm:GetParameter"/);
      expect(content).toMatch(/"ssm:GetParameters"/);
      expect(content).toMatch(/"ssm:GetParametersByPath"/);
      expect(content).toMatch(/parameter\/\$\{var\.app_name\}/);
    });

    test("IAM policy grants CloudWatch Logs permissions", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"logs:CreateLogStream"/);
      expect(content).toMatch(/"logs:PutLogEvents"/);
    });

    test("IAM policy grants specific KMS permissions", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"kms:Encrypt"/);
      expect(content).toMatch(/"kms:Decrypt"/);
      expect(content).toMatch(/"kms:ReEncrypt\*"/);
      expect(content).toMatch(/"kms:GenerateDataKey\*"/);
      expect(content).toMatch(/"kms:DescribeKey"/);
      expect(content).toMatch(/aws_kms_key\.main\.arn/);
    });

    test("Auto Scaling service role is managed by AWS", () => {
      expect(content).toMatch(/Auto Scaling Service Role - AWS creates this automatically/);
    });

    test("creates instance profile", () => {
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(content).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test("attaches policy to role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_policy"/);
      const attachmentMatch = content.match(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_policy"\s*{[^}]*}/s);
      expect(attachmentMatch).toBeTruthy();
      expect(attachmentMatch![0]).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(attachmentMatch![0]).toMatch(/policy_arn\s*=\s*aws_iam_policy\.ec2_policy\.arn/);
    });

    test("IAM policies follow principle of least privilege", () => {
      const policyMatch = content.match(/resource\s+"aws_iam_policy"\s+"ec2_policy"\s*{[^}]*}/s);
      expect(policyMatch).toBeTruthy();
      expect(policyMatch![0]).not.toMatch(/"Resource":\s*"\*"/);
      expect(policyMatch![0]).not.toMatch(/"s3:\*"/);
      expect(policyMatch![0]).not.toMatch(/"iam:\*"/);
    });
  });

  // === S3 Configuration ===
  
  describe("S3 Bucket", () => {
    test("creates S3 bucket for logs", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test("blocks all public access", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      const publicBlockMatch = content.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{[^}]*}/s);
      expect(publicBlockMatch).toBeTruthy();
      expect(publicBlockMatch![0]).toMatch(/block_public_acls\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/block_public_policy\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enables server-side encryption with KMS", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      const encryptionMatch = content.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{[^}]*}/s);
      expect(encryptionMatch).toBeTruthy();
      expect(encryptionMatch![0]).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enables versioning", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test("configures intelligent tiering for cost optimization", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"\s+"logs"/);
      const tieringMatch = content.match(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"\s+"logs"\s*{[^}]*}/s);
      expect(tieringMatch).toBeTruthy();
      expect(tieringMatch![0]).toMatch(/DEEP_ARCHIVE_ACCESS/);
      expect(tieringMatch![0]).toMatch(/ARCHIVE_ACCESS/);
    });

    test("configures lifecycle policy for archival", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(content).toMatch(/STANDARD_IA/);
      expect(content).toMatch(/GLACIER/);
      expect(content).toMatch(/DEEP_ARCHIVE/);
    });
  });

  // === KMS Encryption ===
  
  describe("KMS Configuration", () => {
    test("creates KMS key for encryption", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/description\s*=\s*"KMS key for.*encryption"/);
      expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("creates KMS alias", () => {
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(content).toMatch(/name\s*=\s*"alias\/.*key.*"/);
      expect(content).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test("KMS key has proper permissions for services", () => {
      expect(content).toMatch(/logs\..*\.amazonaws\.com/);
      expect(content).toMatch(/sns\.amazonaws\.com/);
    });

    test("KMS key policy allows root account access", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/Enable IAM User Permissions/);
      expect(content).toMatch(/data\.aws_caller_identity\.current\.account_id/);
      expect(content).toMatch(/"kms:\*"/);
    });

    test("KMS key policy allows CloudWatch Logs service", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/Allow CloudWatch Logs/);
      expect(content).toMatch(/kms:EncryptionContext:aws:logs:arn/);
    });

    test("KMS key policy allows SNS service", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/Allow SNS Service/);
      expect(content).toMatch(/sns\.amazonaws\.com/);
    });

    test("applies common tags to KMS resources", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/tags\s*=\s*local\.common_tags/);
    });
  });

  // === RDS Database ===
  
  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates PostgreSQL RDS instance with encryption", () => {
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(content).toMatch(/engine\s*=\s*"postgres"/);
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/kms_key_id/);
    });

    test("configures backup settings", () => {
      expect(content).toMatch(/backup_retention_period\s*=\s*7/);
      expect(content).toMatch(/backup_window/);
    });
  });

  // === SSL Certificate ===
  
  describe("SSL Certificate Configuration", () => {
    test("creates ACM certificate", () => {
      expect(content).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
      expect(content).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("creates Route53 validation records", () => {
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"/);
    });

    test("creates certificate validation resource", () => {
      expect(content).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"main"/);
    });
  });

  // === Load Balancer ===
  
  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("creates target group with health checks", () => {
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(content).toMatch(/health_check\s*{/);
    });

    test("creates HTTP listener with redirect to HTTPS", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(content).toMatch(/port\s*=\s*"80"/);
      // HTTP listener uses conditional redirect based on SSL certificate enablement
      expect(content).toMatch(/type\s*=\s*var\.enable_ssl_certificate/);
    });

    test("creates HTTPS listener with SSL certificate", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(content).toMatch(/port\s*=\s*"443"/);
      expect(content).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(content).toMatch(/certificate_arn/);
    });
  });

  // === Auto Scaling ===
  
  describe("Auto Scaling Configuration", () => {
    test("creates launch template with user data", () => {
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(content).toMatch(/user_data\s*=/);
    });

    test("creates auto scaling group", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(content).toMatch(/min_size\s*=\s*1/);
      expect(content).toMatch(/max_size\s*=\s*6/);
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("creates scaling policies", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  // === CloudWatch Monitoring ===
  
  describe("CloudWatch Configuration", () => {
    test("creates CPU utilization alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"/);
    });

    test("creates ALB performance monitoring alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_response_time"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_4xx_errors"/);
    });

    test("creates billing alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"billing"/);
      expect(content).toMatch(/metric_name\s*=\s*"EstimatedCharges"/);
    });

    test("ALB response time alarm monitors performance", () => {
      expect(content).toMatch(/metric_name\s*=\s*"ResponseTime"/);
      expect(content).toMatch(/threshold\s*=\s*"1\.0"/);
    });

    test("creates SNS topic for notifications", () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("creates CloudWatch log groups", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_access"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_error"/);
    });

    test("alarms include SNS notifications", () => {
      expect(content).toMatch(/aws_sns_topic\.alerts\.arn/);
    });
  });

  // === SSM Parameter Store ===
  
  describe("SSM Parameters", () => {
    test("creates database endpoint parameter", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_endpoint"/);
    });

    test("creates database name parameter", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_name"/);
    });

    test("creates S3 bucket parameter", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"s3_bucket"/);
    });
  });

  // === CloudFront ===
  
  describe("CloudFront Distribution", () => {
    test("creates CloudFront distribution", () => {
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test("configures origin to point to ALB", () => {
      expect(content).toMatch(/domain_name\s*=\s*aws_lb\.main\.dns_name/);
    });

    test("redirects to HTTPS", () => {
      expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });
  });

  // === Route 53 ===
  
  describe("Route 53 Configuration", () => {
    test("creates hosted zone", () => {
      expect(content).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
    });

    test("creates A record pointing to CloudFront", () => {
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"main"/);
      expect(content).toMatch(/type\s*=\s*"A"/);
      expect(content).toMatch(/alias\s*{/);
    });
  });

  // === AWS WAF ===
  
  describe("AWS WAF Configuration", () => {
    test("creates WAF WebACL", () => {
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test("includes comprehensive managed rule sets", () => {
      expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      expect(content).toMatch(/AWSManagedRulesSQLiRuleSet/);
      expect(content).toMatch(/AWSManagedRulesLinuxRuleSet/);
    });

    test("WAF WebACL uses CloudFront scope", () => {
      expect(content).toMatch(/scope\s*=\s*"CLOUDFRONT"/);
    });

    test("CloudFront distribution associates with WAF", () => {
      expect(content).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });
  });

  // === Outputs ===
  
  describe("Outputs", () => {
    test("includes all required outputs", () => {
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"load_balancer_dns"/);
      expect(content).toMatch(/output\s+"cloudfront_domain"/);
      expect(content).toMatch(/output\s+"database_endpoint"/);
      expect(content).toMatch(/output\s+"s3_logs_bucket"/);
      expect(content).toMatch(/output\s+"route53_nameservers"/);
      expect(content).toMatch(/output\s+"aws_region"/);
      expect(content).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("database endpoint is marked as sensitive", () => {
      const dbOutputMatch = content.match(/output\s+"database_endpoint"\s*{[^}]*}/s);
      expect(dbOutputMatch).toBeTruthy();
      expect(dbOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  // === Security Best Practices ===
  
  describe("Security Best Practices", () => {
    test("does not expose sensitive ports to the world", () => {
      // SSH (22), RDP (3389) should not be open to 0.0.0.0/0
      expect(content).not.toMatch(/from_port\s*=\s*22[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
      expect(content).not.toMatch(/from_port\s*=\s*3389[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test("uses consistent tagging", () => {
      // Should reference local.common_tags in multiple places
      const tagMatches = content.match(/tags\s*=\s*(?:local\.common_tags|merge\(local\.common_tags)/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(10); // Many resources should be tagged
    });

    test("user data script uses template file for security", () => {
      expect(content).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(content).toMatch(/"\$\{path\.module\}\/user_data\.tpl"/);
    });
  });

  // === Infrastructure Requirements Validation ===
  
  describe("Infrastructure Requirements", () => {
    test("deploys across multiple availability zones", () => {
      expect(content).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    test("separates tiers with different subnets", () => {
      expect(content).toMatch(/aws_subnet\.public/);
      expect(content).toMatch(/aws_subnet\.private/);
      expect(content).toMatch(/aws_subnet\.database/);
    });

    test("configures database in private subnets only", () => {
      expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test("places EC2 instances in private subnets", () => {
      expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private/);
    });
  });

  // === Additional Compute Tests ===
  
  describe("Launch Template and Auto Scaling", () => {
    test("creates launch template with proper configuration", () => {
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(content).toMatch(/name_prefix\s*=/);
      expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(content).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("launch template includes user data template", () => {
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(content).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(content).toMatch(/user_data\.tpl/);
      expect(content).toMatch(/app_name\s*=\s*var\.app_name/);
      expect(content).toMatch(/db_endpoint\s*=\s*aws_db_instance\.main\.endpoint/);
    });

    test("auto scaling group has reasonable capacity settings", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(content).toMatch(/min_size\s*=\s*1/);
      expect(content).toMatch(/max_size\s*=\s*6/);
      expect(content).toMatch(/desired_capacity\s*=\s*2/);
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("scaling policies have proper cooldown", () => {
      expect(content).toMatch(/cooldown\s*=\s*300/);
    });
  });

  // === Additional CloudWatch Tests ===
  
  describe("Advanced CloudWatch Monitoring", () => {
    test("creates comprehensive ALB monitoring", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_response_time"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_4xx_errors"/);
    });

    test("ALB response time alarm has proper configuration", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_response_time"/);
      expect(content).toMatch(/metric_name\s*=\s*"ResponseTime"/);
      expect(content).toMatch(/namespace\s*=\s*"AWS\/ApplicationELB"/);
      expect(content).toMatch(/threshold\s*=\s*"1\.0"/);
    });

    test("billing alarm monitors costs", () => {
      const billingMatch = content.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"billing"\s*{[\s\S]*?^}/m);
      expect(billingMatch).toBeTruthy();
      expect(billingMatch![0]).toMatch(/metric_name\s*=\s*"EstimatedCharges"/);
      expect(billingMatch![0]).toMatch(/namespace\s*=\s*"AWS\/Billing"/);
      expect(billingMatch![0]).toMatch(/threshold\s*=\s*"50"/);
    });

    test("log groups have encryption and retention", () => {
      expect(content).toMatch(/retention_in_days\s*=\s*14/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // === WAF and SSL Advanced Tests ===
  
  describe("Advanced WAF and SSL Configuration", () => {
    test("SSL certificate is conditional", () => {
      const certMatch = content.match(/resource\s+"aws_acm_certificate"\s+"main"\s*{[^}]*}/s);
      expect(certMatch).toBeTruthy();
      expect(certMatch![0]).toMatch(/count\s*=\s*var\.enable_ssl_certificate\s*\?\s*1\s*:\s*0/);
      expect(content).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("WAF includes comprehensive managed rule sets", () => {
      expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      expect(content).toMatch(/AWSManagedRulesSQLiRuleSet/);
      expect(content).toMatch(/AWSManagedRulesLinuxRuleSet/);
    });

    test("WAF has proper priority ordering", () => {
      expect(content).toMatch(/priority\s*=\s*1/);
      expect(content).toMatch(/priority\s*=\s*2/);
      expect(content).toMatch(/priority\s*=\s*3/);
      expect(content).toMatch(/priority\s*=\s*4/);
    });

    test("certificate validation has configurable timeout", () => {
      const validationMatch = content.match(/resource\s+"aws_acm_certificate_validation"\s+"main"\s*{[^}]*}/s);
      expect(validationMatch).toBeTruthy();
      expect(validationMatch![0]).toMatch(/timeouts\s*{[^}]*create\s*=\s*var\.certificate_validation_timeout[^}]*}/s);
    });

    test("database password has validation", () => {
      const dbVarMatch = content.match(/variable\s+"db_password"\s*{[^}]*}/s);
      expect(dbVarMatch).toBeTruthy();
      expect(dbVarMatch![0]).toMatch(/validation\s*{/);
      expect(dbVarMatch![0]).toMatch(/length\(var\.db_password\)\s*>=\s*12/);
      expect(dbVarMatch![0]).toMatch(/error_message.*least 12 characters/);
    });
  });

  // === Security Best Practices Enhanced ===
  
  describe("Enhanced Security Validation", () => {
    test("does not expose SSH or RDP to the world", () => {
      expect(content).not.toMatch(/from_port\s*=\s*22[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
      expect(content).not.toMatch(/from_port\s*=\s*3389[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test("does not expose database port to internet", () => {
      expect(content).not.toMatch(/from_port\s*=\s*5432[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test("uses security group references for internal traffic", () => {
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("all storage is encrypted", () => {
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("uses customer-managed KMS keys", () => {
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("database password is marked sensitive", () => {
      const dbVarMatch = content.match(/variable\s+"db_password"\s*{[^}]*}/s);
      expect(dbVarMatch).toBeTruthy();
      expect(dbVarMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("S3 buckets have public access blocked", () => {
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  // === Performance and Reliability Tests ===
  
  describe("Performance and Reliability", () => {
    test("instances are in private subnets", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private/);
    });

    test("load balancer is in public subnets", () => {
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/subnets\s*=\s*aws_subnet\.public/);
    });

    test("database has proper backup configuration", () => {
      expect(content).toMatch(/backup_retention_period\s*=\s*7/);
      expect(content).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(content).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("CloudFront enforces HTTPS", () => {
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
      expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("health check grace period allows startup time", () => {
      expect(content).toMatch(/health_check_grace_period\s*=\s*300/);
    });
  });

  // === Data Sources and Random Generation ===
  
  describe("Data Sources and Randomization", () => {
    test("uses caller identity data source", () => {
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses AMI data source with proper filters", () => {
      const amiMatch = content.match(/data\s+"aws_ami"\s+"amazon_linux"\s*{[^}]*}/s);
      expect(amiMatch).toBeTruthy();
      expect(amiMatch![0]).toMatch(/most_recent\s*=\s*true/);
      expect(amiMatch![0]).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(amiMatch![0]).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
    });

    test("generates random suffix for resource naming", () => {
      expect(content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(content).toMatch(/byte_length\s*=\s*4/);
      expect(content).toMatch(/suffix\s*=\s*random_id\.bucket_suffix\.hex/);
    });
  });

  test("validates Terraform syntax structure", () => {
    // Resource blocks should be properly structured
    const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
    expect(resourceBlocks).toBeTruthy();
    expect(resourceBlocks!.length).toBeGreaterThan(40); // Should have many resources
    
    // Should not have obvious syntax errors - simplified check
    expect(content.includes("resource")).toBe(true);
    expect(content.includes("variable")).toBe(true);
  });
});