import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

// Read Terraform code once for all tests
const tf = fs.readFileSync(TAP_STACK_TF, 'utf8');
const has = (regex: RegExp) => regex.test(tf);

describe('tap_stack.tf Full Coverage Unit Tests', () => {
  it('tap_stack.tf exists and is non-empty', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  it('declares region variable with default and description', () => {
    expect(has(/variable\s+"region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(/description\s*=\s*"AWS region for resources"/)).toBe(true);
  });

  it('declares vpc_cidr variable with default and description', () => {
    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/description\s*=\s*"CIDR block for VPC"/)).toBe(true);
  });

  it('declares domain_name variable with default and description', () => {
    expect(has(/variable\s+"domain_name"/)).toBe(true);
    expect(has(/default\s*=\s*"tapstacknewtest\.com"/)).toBe(true);
    expect(has(/description\s*=\s*"Domain name for Route 53"/)).toBe(true);
  });

  it('declares aws_availability_zones data source filtering available AZs', () => {
    expect(has(/data\s+"aws_availability_zones"\s+"available"/)).toBe(true);
    expect(has(/state\s*=\s*"available"/)).toBe(true);
  });

  it('declares aws_ami data source for Amazon Linux 2 with filters', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/most_recent\s*=\s*true/)).toBe(true);
    expect(has(/owners\s*=\s*\[\s*"amazon"\s*\]/)).toBe(true);
    expect(has(/filter\s+{[^}]*name\s*=\s*"name"[^}]*values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/)).toBe(true);
    expect(has(/filter\s+{[^}]*name\s*=\s*"virtualization-type"[^}]*values\s*=\s*\["hvm"\]/)).toBe(true);
  });

  it('defines locals for azs and common_tags', () => {
    expect(has(/locals\s*{[^}]*azs\s*=\s*slice\([^)]*\)/)).toBe(true);
    expect(has(/common_tags\s*=\s*{[^}]*Environment\s*=\s*"Production"/)).toBe(true);
  });

  it('defines random_string resources for db_username and bucket_suffix', () => {
    expect(has(/resource\s+"random_string"\s+"db_username"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  it('defines random_password resource for db_password with override_special', () => {
    expect(has(/resource\s+"random_password"\s+"db_password"/)).toBe(true);
    expect(has(/override_special\s*=\s*"!#\$%&\*\+\-=\?\^_`\{\|\}~"/)).toBe(true);
  });

  it('creates aws_vpc main with dns enabled and correct cidr', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/cidr_block\s*=\s*var.vpc_cidr/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
  });

  it('creates three public and three private subnets with correct CIDRs and AZs', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/)).toBe(true);
  });

  it('creates internet gateway and elastic IPs for NAT', () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
  });

  it('creates NAT gateways one per AZ and associates elastic IPs', () => {
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
  });

  it('defines public route table with 0.0.0.0/0 route to igw', () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/route\s*{[^}]*cidr_block\s*=\s*"0\.0\.0\.0\/0"[^}]*gateway_id\s*=\s*aws_internet_gateway.main.id/)).toBe(true);
  });

  // FIXED REGEX for private route tables test - match actual count index interpolation with optional spaces
  it('defines private route tables with NAT routes and associations', () => {
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
    expect(has(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[\s*count\.index\s*\]\.id/)).toBe(true);

    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
    expect(has(/count\s*=\s*3/)).toBe(true);
  });

  it('creates S3 bucket with suffix random_string and enables encryption, versioning, public access block', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"flow_logs"/)).toBe(true);
    expect(has(/bucket\s*=\s*"tap-stack-vpc-flow-logs-\${random_string.bucket_suffix.result}"/)).toBe(true);
    expect(has(/force_destroy\s*=\s*true/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs"/)).toBe(true);
    expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"/)).toBe(true);
    expect(has(/block_public_acls\s*=.*true/)).toBe(true);
  });

  it('creates CloudWatch log group, IAM role and policy, and flow logs resource', () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_flow_log"\s+"main"/)).toBe(true);
    expect(has(/traffic_type\s*=\s*"ALL"/)).toBe(true);
  });

  it('declares security groups for alb, ec2, and rds with correct ingress and egress rules', () => {
    expect(has(/resource\s+"aws_security_group"\s+"alb"/)).toBe(true);
    expect(has(/ingress\s*{[^}]*from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"ec2"/)).toBe(true);
    expect(has(/from_port\s*=\s*22/)).toBe(true);
    expect(has(/security_groups\s*=\s*\[aws_security_group.alb.id\]/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
    expect(has(/security_groups\s*=\s*\[aws_security_group.ec2.id\]/)).toBe(true);
  });

  it('sets up IAM role and policy for EC2 with S3 and CloudWatch permissions', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2"/)).toBe(true);
    expect(has(/s3:GetObject/)).toBe(true);
    expect(has(/cloudwatch:PutMetricData/)).toBe(true);
  });

  it('creates IAM instance profile for EC2', () => {
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2"/)).toBe(true);
    expect(has(/role\s*=\s*aws_iam_role.ec2.name/)).toBe(true);
  });

  it('defines launch template with user_data, security groups, monitoring enabled', () => {
    expect(has(/resource\s+"aws_launch_template"\s+"main"/)).toBe(true);
    expect(has(/instance_type\s*=\s*"t3.micro"/)).toBe(true);
    expect(has(/monitoring\s*{\s*enabled\s*=\s*true\s*}/)).toBe(true);
    expect(has(/base64encode\(/)).toBe(true);
    expect(has(/vpc_security_group_ids\s*=\s*\[aws_security_group.ec2.id\]/)).toBe(true);
  });

  it('creates Auto Scaling Group with 3 min/desired size across private subnets and attaches ALB target group', () => {
    expect(has(/resource\s+"aws_autoscaling_group"\s+"main"/)).toBe(true);
    expect(has(/min_size\s*=\s*3/)).toBe(true);
    expect(has(/max_size\s*=\s*9/)).toBe(true);
    expect(has(/desired_capacity\s*=\s*3/)).toBe(true);
    expect(has(/vpc_zone_identifier\s*=\s*aws_subnet.private\[\*\]\.id/)).toBe(true);
    expect(has(/target_group_arns\s*=\s*\[aws_lb_target_group.main.arn\]/)).toBe(true);
    expect(has(/instance_refresh/)).toBe(true);
  });

  it('defines ALB, target group, listener with HTTP and forwarding action', () => {
    expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
    expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    expect(has(/security_groups\s*=\s*\[aws_security_group.alb.id\]/)).toBe(true);

    expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
    expect(has(/health_check/)).toBe(true);

    expect(has(/resource\s+"aws_lb_listener"\s+"main"/)).toBe(true);
    expect(has(/port\s*=\s*"80"/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
  });

  it('creates Route53 hosted zone and A alias records for root and www', () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
    expect(has(/name\s*=\s*var.domain_name/)).toBe(true);

    expect(has(/resource\s+"aws_route53_record"\s+"main"/)).toBe(true);
    expect(has(/type\s*=\s*"A"/)).toBe(true);
    expect(has(/alias\s*{[^}]*name\s*=\s*aws_lb.main.dns_name/)).toBe(true);

    expect(has(/resource\s+"aws_route53_record"\s+"www"/)).toBe(true);
    expect(has(/name\s*=\s*"www\.\$\{var\.domain_name\}"/)).toBe(true);
  });

  it('creates secretsmanager secret and version with username and password', () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"/)).toBe(true);
    expect(has(/username\s*=\s*"a\$\{random_string.db_username.result\}"/)).toBe(true);
    expect(has(/password\s*=\s*random_password.db_password.result/)).toBe(true);
  });

  it('creates RDS subnet group and multi-AZ MySQL RDS instance with encryption', () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/subnet_ids\s*=\s*aws_subnet.private\[\*\].id/)).toBe(true);

    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
    expect(has(/engine\s*=\s*"mysql"/)).toBe(true);
    expect(has(/multi_az\s*=\s*true/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    expect(has(/username\s*=\s*jsondecode\(aws_secretsmanager_secret_version.db_credentials.secret_string\)\["username"\]/)).toBe(true);
    expect(has(/password\s*=\s*jsondecode\(aws_secretsmanager_secret_version.db_credentials.secret_string\)\["password"\]/)).toBe(true);
  });

  it('exports expected outputs matching major resources and important attributes', () => {
    [
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "load_balancer_arn",
      "load_balancer_dns_name",
      "load_balancer_zone_id",
      "autoscaling_group_arn",
      "launch_template_id",
      "ec2_security_group_id",
      "rds_security_group_id",
      "alb_security_group_id",
      "rds_endpoint",
      "rds_identifier",
      "rds_port",
      "s3_bucket_name",
      "s3_bucket_arn",
      "route53_zone_id",
      "route53_name_servers",
      "domain_name",
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "ami_id",
      "ami_name",
      "availability_zones",
      "secrets_manager_secret_arn",
      "cloudwatch_log_group_name",
      "vpc_flow_log_id",
      "target_group_arn",
    ].forEach(outputName => {
      expect(has(new RegExp(`output\\s+"${outputName}"`))).toBe(true);
    });
  });

  it('does not contain any hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });

  it('uses lifecycle create_before_destroy in critical resources', () => {
    expect(has(/lifecycle\s*{[^}]*create_before_destroy\s*=\s*true[^}]*}/)).toBe(true);
  });
});
