import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const USER_DATA_TPL = path.join(LIB_DIR, "user_data.sh.tpl");

// Load the Terraform file once
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static structure", () => {
  it("exists and is sufficiently large", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(10000); // Web app stack file is large!
  });

  it("has user_data template file", () => {
    expect(fs.existsSync(USER_DATA_TPL)).toBe(true);
  });

  it("declares required variables", () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/variable\s+"project_name"/)).toBe(true);
    expect(has(/variable\s+"environment"/)).toBe(true);
    expect(has(/variable\s+"domain_name"/)).toBe(true);
    expect(has(/variable\s+"min_size"/)).toBe(true);
    expect(has(/variable\s+"max_size"/)).toBe(true);
    expect(has(/variable\s+"desired_capacity"/)).toBe(true);
    expect(has(/variable\s+"instance_type"/)).toBe(true);
    expect(has(/variable\s+"db_instance_class"/)).toBe(true);
    expect(has(/variable\s+"db_name"/)).toBe(true);
    expect(has(/variable\s+"db_username"/)).toBe(true);
  });

  it("has variable validation for db_instance_class", () => {
    expect(has(/validation\s*{[^}]*condition[^}]*db_instance_class/)).toBe(true);
    expect(has(/error_message.*Aurora-compatible/)).toBe(true);
  });

  it("defines locals for tags and resource naming", () => {
    expect(has(/locals\s*{/)).toBe(true);
    expect(has(/common_tags\s*=/)).toBe(true);
    expect(has(/resource_prefix\s*=/)).toBe(true);
  });

  it("has random string resource for unique naming", () => {
    expect(has(/resource\s+"random_string"\s+"suffix"/)).toBe(true);
    expect(has(/special\s*=\s*false/)).toBe(true);
    expect(has(/upper\s*=\s*false/)).toBe(true);
  });

  it("references data source for Amazon Linux 2 AMI", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
    expect(has(/values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/)).toBe(true);
  });

  it("defines VPC with DNS support", () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
  });

  it("defines Internet Gateway", () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
  });

  it("sets up EIPs and NAT gateways for HA", () => {
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/domain\s*=\s*"vpc"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
    expect(has(/count\s*=\s*2/)).toBe(true);
  });

  it("creates public and private subnets", () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it("creates route tables and associations", () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  it("defines DB subnet group", () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/)).toBe(true);
  });

  it("creates S3 bucket with security configurations", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"webapp_assets"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"webapp_assets"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"webapp_assets"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"webapp_assets"/)).toBe(true);
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
  });

  it("has security groups with proper rules", () => {
    expect(has(/resource\s+"aws_security_group"\s+"alb"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
  });

  it("ALB security group allows HTTP and HTTPS", () => {
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);
    expect(has(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/)).toBe(true);
  });

  it("EC2 security group allows traffic from ALB", () => {
    expect(has(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/)).toBe(true);
    expect(has(/from_port\s*=\s*5000/)).toBe(true);
  });

  it("RDS security group has egress rules", () => {
    expect(has(/egress\s*{[^}]*description\s*=\s*"Allow all outbound traffic"/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
  });

  it("defines comprehensive IAM roles and policies", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"rds_monitoring"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"secrets_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
  });

  it("IAM policies reference correct S3 bucket", () => {
    expect(has(/aws_s3_bucket\.webapp_assets\.arn/)).toBe(true);
    expect(has(/secretsmanager:GetSecretValue/)).toBe(true);
    expect(has(/logs:CreateLogGroup/)).toBe(true);
  });

  it("attaches managed policies for SSM", () => {
    expect(has(/AmazonSSMManagedInstanceCore/)).toBe(true);
    expect(has(/AmazonRDSEnhancedMonitoringRole/)).toBe(true);
  });

  it("creates CloudWatch Log Group", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"webapp"/)).toBe(true);
    expect(has(/retention_in_days\s*=\s*7/)).toBe(true);
  });

  it("uses Secrets Manager with unique naming", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/)).toBe(true);
    expect(has(/name_prefix\s*=.*db-password-/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"db_password"/)).toBe(true);
  });

  it("creates launch template with proper configuration", () => {
    expect(has(/resource\s+"aws_launch_template"\s+"main"/)).toBe(true);
    expect(has(/network_interfaces\s*{/)).toBe(true);
    expect(has(/associate_public_ip_address\s*=\s*false/)).toBe(true);
    expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
    expect(has(/encrypted\s*=\s*true/)).toBe(true);
  });

  it("references templatefile for user_data", () => {
    expect(has(/templatefile\(.*user_data\.sh\.tpl/)).toBe(true);
    expect(has(/db_secret_name\s*=/)).toBe(true);
    expect(has(/region\s*=/)).toBe(true);
    expect(has(/log_group_name\s*=/)).toBe(true);
  });

  it("creates Auto Scaling Group with proper settings", () => {
    expect(has(/resource\s+"aws_autoscaling_group"\s+"main"/)).toBe(true);
    expect(has(/health_check_type\s*=\s*"ELB"/)).toBe(true);
    expect(has(/health_check_grace_period\s*=\s*300/)).toBe(true);
    expect(has(/wait_for_capacity_timeout\s*=\s*"10m"/)).toBe(true);
  });

  it("uses target tracking auto scaling", () => {
    expect(has(/resource\s+"aws_autoscaling_policy"\s+"target_tracking"/)).toBe(true);
    expect(has(/policy_type\s*=\s*"TargetTrackingScaling"/)).toBe(true);
    expect(has(/ASGAverageCPUUtilization/)).toBe(true);
    expect(has(/target_value\s*=\s*50\.0/)).toBe(true);
  });

  it("uses data sources for Aurora version selection", () => {
    expect(has(/data\s+"aws_rds_engine_version"\s+"aurora_mysql"/)).toBe(true);
    expect(has(/data\s+"aws_rds_orderable_db_instance"\s+"aurora_mysql"/)).toBe(true);
    expect(has(/preferred_versions\s*=.*3\.04\.0.*3\.03\.0.*3\.02\.0/)).toBe(true);
    expect(has(/supports_clusters\s*=\s*true/)).toBe(true);
  });

  it("creates Aurora cluster with enhanced features", () => {
    expect(has(/resource\s+"aws_rds_cluster"\s+"main"/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    expect(has(/backtrack_window\s*=\s*24/)).toBe(true);
    expect(has(/enabled_cloudwatch_logs_exports/)).toBe(true);
    expect(has(/engine_version\s*=\s*data\.aws_rds_engine_version\.aurora_mysql\.version/)).toBe(true);
  });

  it("creates Aurora instances with monitoring and dependencies", () => {
    expect(has(/resource\s+"aws_rds_cluster_instance"\s+"cluster_instances"/)).toBe(true);
    expect(has(/performance_insights_enabled\s*=\s*true/)).toBe(true);
    expect(has(/monitoring_interval\s*=\s*60/)).toBe(true);
    expect(has(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_monitoring\.arn/)).toBe(true);
    expect(has(/depends_on\s*=\s*\[\s*aws_iam_role_policy_attachment\.rds_monitoring\s*\]/)).toBe(true);
  });

  it("creates Application Load Balancer with features", () => {
    expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
    expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    expect(has(/enable_http2\s*=\s*true/)).toBe(true);
    expect(has(/enable_cross_zone_load_balancing\s*=\s*true/)).toBe(true);
  });

  it("creates target group with health checks", () => {
    expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
    expect(has(/path\s*=\s*"\/health"/)).toBe(true);
    expect(has(/timeout\s*=\s*10/)).toBe(true);
    expect(has(/deregistration_delay\s*=\s*30/)).toBe(true);
  });

  it("has conditional SSL certificate configuration", () => {
    expect(has(/resource\s+"aws_acm_certificate"\s+"main"/)).toBe(true);
    expect(has(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/)).toBe(true);
    expect(has(/validation_method\s*=\s*"DNS"/)).toBe(true);
  });

  it("creates HTTP listener with conditional redirect", () => {
    expect(has(/resource\s+"aws_lb_listener"\s+"http"/)).toBe(true);
    expect(has(/type\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*"redirect"\s*:\s*"forward"/)).toBe(true);
    expect(has(/dynamic\s+"redirect"/)).toBe(true);
  });

  it("creates conditional HTTPS listener", () => {
    expect(has(/resource\s+"aws_lb_listener"\s+"https"/)).toBe(true);
    expect(has(/count\s*=\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/)).toBe(true);
    expect(has(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/)).toBe(true);
  });

  it("defines comprehensive outputs", () => {
    expect(has(/output\s+"load_balancer_url"/)).toBe(true);
    expect(has(/output\s+"database_endpoint"/)).toBe(true);
    expect(has(/output\s+"vpc_id"/)).toBe(true);
    expect(has(/output\s+"vpc_cidr"/)).toBe(true);
    expect(has(/output\s+"s3_bucket_name"/)).toBe(true);
    expect(has(/output\s+"s3_bucket_arn"/)).toBe(true);
    expect(has(/output\s+"ec2_security_group_id"/)).toBe(true);
    expect(has(/output\s+"alb_security_group_id"/)).toBe(true);
    expect(has(/output\s+"rds_security_group_id"/)).toBe(true);
    expect(has(/output\s+"ec2_iam_role_arn"/)).toBe(true);
    expect(has(/output\s+"nat_gateway_ids"/)).toBe(true);
    expect(has(/output\s+"resource_suffix"/)).toBe(true);
  });

  it("marks sensitive outputs appropriately", () => {
    expect(has(/output\s+"database_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    expect(has(/output\s+"database_reader_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  it("uses resource_prefix with random suffix consistently", () => {
    expect(has(/local\.resource_prefix/)).toBe(true);
    expect(has(/resource_prefix\s*=.*random_string\.suffix\.result/)).toBe(true);
  });

  it("has proper resource dependencies", () => {
    expect(has(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/)).toBe(true);
  });

  it("uses lifecycle rules for critical resources", () => {
    expect(has(/lifecycle\s*{[^}]*create_before_destroy\s*=\s*true/)).toBe(true);
  });

  it("has proper tagging throughout", () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
    expect(has(/tags\s*=\s*local\.common_tags/)).toBe(true);
  });

  it("has provider configuration with required providers", () => {
    expect(has(/required_providers\s*{/)).toBe(true);
    expect(has(/source\s*=\s*"hashicorp\/aws"/)).toBe(true);
    expect(has(/source\s*=\s*"hashicorp\/random"/)).toBe(true);
    expect(has(/backend\s+"s3"/)).toBe(true);
  });
});

describe("user_data.sh.tpl template", () => {
  const userData = fs.readFileSync(USER_DATA_TPL, "utf8");

  it("exists and has substantial content", () => {
    expect(userData.length).toBeGreaterThan(1000);
  });

  it("uses template variables", () => {
    expect(userData).toMatch(/\$\{db_secret_name\}/);
    expect(userData).toMatch(/\$\{region\}/);
    expect(userData).toMatch(/\$\{log_group_name\}/);
  });

  it("installs required packages", () => {
    expect(userData).toMatch(/yum install.*python3/);
    expect(userData).toMatch(/yum install.*nginx/);
    expect(userData).toMatch(/pip3 install.*flask/);
    expect(userData).toMatch(/pip3 install.*boto3/);
    expect(userData).toMatch(/amazon-cloudwatch-agent/);
  });

  it("configures CloudWatch Agent", () => {
    expect(userData).toMatch(/amazon-cloudwatch-agent\.json/);
    expect(userData).toMatch(/logs_collected/);
    expect(userData).toMatch(/metrics_collected/);
  });

  it("creates Flask application with proper logging", () => {
    expect(userData).toMatch(/app = Flask\(__name__\)/);
    expect(userData).toMatch(/logging\.basicConfig/);
    expect(userData).toMatch(/FileHandler/);
    expect(userData).toMatch(/StreamHandler/);
  });

  it("has health check endpoint", () => {
    expect(userData).toMatch(/@app\.route\('\/health'\)/);
    expect(userData).toMatch(/status.*healthy/);
  });

  it("has database test endpoint", () => {
    expect(userData).toMatch(/@app\.route\('\/db-test'\)/);
    expect(userData).toMatch(/get_secret\(\)/);
  });

  it("configures systemd service", () => {
    expect(userData).toMatch(/systemctl daemon-reload/);
    expect(userData).toMatch(/systemctl enable webapp/);
    expect(userData).toMatch(/systemctl start webapp/);
  });

  it("configures nginx reverse proxy", () => {
    expect(userData).toMatch(/proxy_pass.*127\.0\.0\.1:5000/);
    expect(userData).toMatch(/proxy_set_header Host/);
    expect(userData).toMatch(/systemctl enable nginx/);
  });

  it("sets up proper logging directories", () => {
    expect(userData).toMatch(/mkdir.*\/var\/log\/webapp/);
    expect(userData).toMatch(/chown.*ec2-user:ec2-user.*\/var\/log\/webapp/);
  });

  it("handles secrets properly", () => {
    expect(userData).toMatch(/secretsmanager/);
    expect(userData).toMatch(/get_secret_value/);
    expect(userData).toMatch(/ClientError/);
  });
});