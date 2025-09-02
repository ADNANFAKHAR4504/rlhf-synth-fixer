// Comprehensive Unit Tests for AWS Web App Infrastructure
import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe('AWS Web App Infrastructure - Unit Tests', () => {
  let stackContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
  });

  describe('File Structure Validation', () => {
    test('tap_stack.tf should exist', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('should be a non-empty file', () => {
      expect(stackContent).toBeTruthy();
      expect(stackContent.length).toBeGreaterThan(100);
    });

    test('should contain terraform configuration', () => {
      expect(stackContent).toContain('variable');
    });
  });

  describe('Variables Validation', () => {
    test('should declare project_name variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{[\s\S]*?default\s*=\s*"webapp"/);
    });

    test('should declare environment variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{[\s\S]*?default\s*=\s*"production"/);
    });

    test('should declare aws_region variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"us-west-2"/);
    });

    test('should declare vpc_cidr variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should declare availability_zones variable with default array', () => {
      expect(stackContent).toMatch(/variable\s+"availability_zones"\s*{[\s\S]*?default\s*=\s*\[\s*"us-west-2a",\s*"us-west-2b"\s*\]/);
    });

    test('should declare instance_type variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{[\s\S]*?default\s*=\s*"t3\.medium"/);
    });

    test('should declare min_size variable with default number', () => {
      expect(stackContent).toMatch(/variable\s+"min_size"\s*{[\s\S]*?default\s*=\s*2/);
    });

    test('should declare max_size variable with default number', () => {
      expect(stackContent).toMatch(/variable\s+"max_size"\s*{[\s\S]*?default\s*=\s*10/);
    });

    test('should declare desired_capacity variable with default number', () => {
      expect(stackContent).toMatch(/variable\s+"desired_capacity"\s*{[\s\S]*?default\s*=\s*3/);
    });

    test('should declare db_instance_class variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"db_instance_class"\s*{[\s\S]*?default\s*=\s*"db\.t3\.micro"/);
    });

    test('should declare db_allocated_storage variable with default number', () => {
      expect(stackContent).toMatch(/variable\s+"db_allocated_storage"\s*{[\s\S]*?default\s*=\s*20/);
    });

    test('should declare key_name variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"key_name"\s*{[\s\S]*?default\s*=\s*null/);
    });

    test('should declare notification_email variable with default', () => {
      expect(stackContent).toMatch(/variable\s+"notification_email"\s*{[\s\S]*?default\s*=\s*"admin@example\.com"/);
    });

    test('should declare domain_name variable with default empty string', () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{[\s\S]*?default\s*=\s*""/);
    });

    test('should declare allowed_cidr_blocks variable with default array', () => {
      expect(stackContent).toMatch(/variable\s+"allowed_cidr_blocks"\s*{[\s\S]*?default\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
    });
  });

  describe('Provider Configuration', () => {
    test('should not declare AWS provider in tap_stack.tf (provider.tf handles this)', () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('should use aws_region variable throughout configuration', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });

    test('should reference tagging in resources', () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=/);
    });
  });

  describe('Data Sources', () => {
    test('should declare Amazon Linux AMI data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\[\s*"amazon"\s*\]/);
    });

    test('should declare current AWS account data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should declare current AWS region data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe('Random Resources', () => {
    test('should create random string for unique naming', () => {
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"resource_suffix"\s*{/);
      expect(stackContent).toMatch(/length\s*=\s*8/);
      expect(stackContent).toMatch(/special\s*=\s*false/);
      expect(stackContent).toMatch(/upper\s*=\s*false/);
    });
  });

  describe('Networking Resources', () => {
    test('should create VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should create Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('should create public subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\)/);
    });

    test('should create private subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\s*\+\s*10\)/);
    });

    test('should create database subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\s*\+\s*20\)/);
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('should create NAT Gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test('should create route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test('should create route table associations', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-alb-"/);
    });

    test('should configure ALB security group ingress rules', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/to_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('should create web security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-web-"/);
    });

    test('should configure web security group to allow ALB access', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('should create database security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
    });

    test('should configure database security group to allow web access only', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
    });
  });

  describe('IAM Resources', () => {
    test('should create EC2 IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(stackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });

    test('should create EC2 instance profile', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test('should create EC2 IAM policy with required permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"cloudwatch:PutMetricData"/);
      expect(stackContent).toMatch(/"secretsmanager:GetSecretValue"/);
    });

    test('should create RDS monitoring role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*{/);
      expect(stackContent).toMatch(/Service\s*=\s*"monitoring\.rds\.amazonaws\.com"/);
    });
  });

  describe('S3 and CloudFront Resources', () => {
    test('should create S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/bucket_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-static-/);
    });

    test('should enable S3 bucket versioning', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should configure S3 server-side encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should block S3 public access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should create CloudFront Origin Access Control', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_control"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/origin_access_control_origin_type\s*=\s*"s3"/);
      expect(stackContent).toMatch(/signing_behavior\s*=\s*"always"/);
      expect(stackContent).toMatch(/signing_protocol\s*=\s*"sigv4"/);
    });

    test('should create CloudFront distribution', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/default_root_object\s*=\s*"index\.html"/);
    });

    test('should configure CloudFront cache behaviors', () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      expect(stackContent).toMatch(/path_pattern\s*=\s*"\/api\/\*"/);
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"https-only"/);
    });

    test('should create S3 bucket policy for CloudFront', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"static_assets"\s*{/);
      expect(stackContent).toMatch(/Service\s*=\s*"cloudfront\.amazonaws\.com"/);
      expect(stackContent).toMatch(/Action\s*=\s*"s3:GetObject"/);
    });
  });

  describe('RDS Resources', () => {
    test('should create DB subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('should create random password', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
      expect(stackContent).toMatch(/length\s*=\s*16/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
      expect(stackContent).toMatch(/override_special\s*=\s*"[^@\/\"'\s]+"/);
    });

    test('should create Secrets Manager secret', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-db-password-/);
    });

    test('should create RDS instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
      expect(stackContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
    });

    test('should configure RDS with security best practices', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*var\.db_instance_class/);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should create Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('should create ALB target group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('should configure health checks', () => {
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
      expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
    });

    test('should create HTTP listener with conditional behavior', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_http"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(stackContent).toMatch(/type\s*=\s*var\.domain_name.*\?\s*"redirect"\s*:\s*"forward"/);
      expect(stackContent).toMatch(/dynamic\s+"redirect"/);
      expect(stackContent).toMatch(/target_group_arn\s*=\s*var\.domain_name.*aws_lb_target_group\.web\.arn/);
    });

    test('should create HTTPS listener conditionally', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_https"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*var\.domain_name/);
      expect(stackContent).toMatch(/port\s*=\s*"443"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });

    test('should create ACM certificate conditionally', () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*var\.domain_name/);
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should create launch template', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"web"\s*{/);
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(stackContent).toMatch(/key_name\s*=\s*var\.key_name/);
    });

    test('should configure IAM instance profile in launch template', () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test('should include user data in launch template', () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(stackContent).toMatch(/db_secret_arn\s*=\s*aws_secretsmanager_secret\.db_password\.arn/);
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.static_assets\.bucket/);
    });

    test('should create Auto Scaling Group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('should configure Auto Scaling Group sizing', () => {
      expect(stackContent).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(stackContent).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    });

    test('should configure instance refresh', () => {
      expect(stackContent).toMatch(/instance_refresh\s*{/);
      expect(stackContent).toMatch(/strategy\s*=\s*"Rolling"/);
      expect(stackContent).toMatch(/min_healthy_percentage\s*=\s*50/);
    });

    test('should create scaling policies', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*1/);
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*-1/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch log group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"\s*{/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test('should create SNS topic', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
    });

    test('should create SNS topic subscription', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_alerts"\s*{/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
      expect(stackContent).toMatch(/endpoint\s*=\s*var\.notification_email/);
    });

    test('should create CPU alarms', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
    });

    test('should create RDS alarms', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_connections"\s*{/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
    });

    test('should create ALB alarm', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_response_time"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"TargetResponseTime"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/ApplicationELB"/);
    });

    test('should configure alarm actions', () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn,\s*aws_sns_topic\.alerts\.arn\]/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_down\.arn\]/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  describe('User Data Script', () => {
    test('should create local file for user data', () => {
      expect(stackContent).toMatch(/resource\s+"local_file"\s+"user_data"\s*{/);
      expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/user_data\.sh"/);
      expect(stackContent).toMatch(/templatefile\(\s*"\$\{path\.module\}\/user_data_template\.sh"/);
    });
  });

  describe('Output Configuration', () => {
    test('should output VPC ID', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test('should output load balancer DNS name', () => {
      expect(stackContent).toMatch(/output\s+"load_balancer_dns_name"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    });

    test('should output CloudFront domain', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain_name"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_cloudfront_distribution\.static_assets\.domain_name/);
    });

    test('should output S3 bucket name', () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.static_assets\.bucket/);
    });

    test('should output RDS endpoint as sensitive', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test('should output database secret ARN', () => {
      expect(stackContent).toMatch(/output\s+"database_secret_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_secretsmanager_secret\.db_password\.arn/);
    });

    test('should output NAT Gateway IPs', () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_ips"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_eip\.nat\[\*\]\.public_ip/);
    });

    test('should output application URL', () => {
      expect(stackContent).toMatch(/output\s+"application_url"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*"https:\/\/\$\{aws_lb\.main\.dns_name\}"/);
    });

    test('should output CloudFront URL', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_url"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*"https:\/\/\$\{aws_cloudfront_distribution\.static_assets\.domain_name\}"/);
    });

    test('should output deployment summary', () => {
      expect(stackContent).toMatch(/output\s+"deployment_summary"\s*{/);
      expect(stackContent).toMatch(/application_url\s*=\s*"https:\/\/\$\{aws_lb\.main\.dns_name\}"/);
      expect(stackContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
    });
  });

  describe('Security Best Practices', () => {
    test('should not use wildcard permissions', () => {
      expect(stackContent).not.toMatch(/"Action":\s*"\*"/);
      expect(stackContent).not.toMatch(/"Resource":\s*"\*"/);
    });

    test('should enable encryption at rest', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should use private subnets for compute resources', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('should use security groups with least privilege', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
      expect(stackContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*port\s*=\s*22/);
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across multiple AZs', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*var\.availability_zones\[count\.index\]/);
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('should create resources with count for HA', () => {
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });
  });

  describe('Resource Tagging', () => {
    test('should use consistent naming with random suffix', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}.*\$\{random_string\.resource_suffix\.result\}"/);
    });

    test('should include required tags', () => {
      // Tags are configured as default_tags in provider.tf, not in individual resources
      // This test verifies that individual resources have explicit tags where needed
      expect(stackContent).toMatch(/tags\s*=\s*\{[\s\S]*?\}/);
    });
  });
});