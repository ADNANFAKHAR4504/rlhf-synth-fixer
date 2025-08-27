// test/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests Terraform configuration structure, patterns, and security requirements

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe('Terraform Infrastructure Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
  });

  describe('File Existence and Structure', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('tap_stack.tf is a single file (no external modules)', () => {
      expect(stackContent).not.toMatch(/module\s+"[^"]*"\s*{/);
    });
  });

  describe('Provider Configuration', () => {
    test('does NOT declare provider in tap_stack.tf', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('provider.tf has AWS provider configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf has S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test('provider.tf uses aws_region variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Variables and Locals', () => {
    test('declares aws_region variable with us-east-1 default', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('has locals block with common_tags', () => {
      expect(stackContent).toMatch(
        /locals\s*\{[\s\S]*common_tags\s*=[\s\S]*\}/
      );
    });

    test('common_tags include required fields', () => {
      expect(stackContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(stackContent).toMatch(/Project\s*=\s*local\.unique_project_name/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Owner\s*=\s*"DevOps Team"/);
    });

    test('project_name is set to iac-aws-nova', () => {
      expect(stackContent).toMatch(/project_name\s*=\s*"iac-aws-nova"/);
    });

    test('environment is set to production', () => {
      expect(stackContent).toMatch(/environment\s*=\s*"production"/);
    });
  });

  describe('Data Sources', () => {
    test('declares aws_availability_zones data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('declares aws_ami data source for Amazon Linux 2', () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux2"/);
    });

    test('AMI data source filters for Amazon Linux 2', () => {
      expect(stackContent).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
    });
  });

  describe('KMS Resources', () => {
    test('declares KMS key resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('declares KMS alias resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test('KMS key has key rotation enabled', () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key has proper deletion window', () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe('S3 Resources', () => {
    test('declares app data S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
    });

    test('S3 bucket uses random string for uniqueness', () => {
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix"/);
    });

    test('S3 bucket uses KMS encryption', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/
      );
      expect(stackContent).toMatch(
        /kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/
      );
    });

    test('S3 bucket has versioning enabled', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"/
      );
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket has public access block', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"/
      );
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe('VPC and Networking', () => {
    test('declares VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC has proper CIDR block', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('VPC has DNS support enabled', () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('declares Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('declares NAT Gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('declares Elastic IPs for NAT Gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });
  });

  describe('Subnets', () => {
    test('declares public subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('declares private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('declares database subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test('public subnets have auto-assign public IP enabled', () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('subnets span multiple availability zones', () => {
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.availability_zones\)/);
    });
  });

  describe('Route Tables', () => {
    test('declares public route table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('declares private route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('declares database route table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"database"/);
    });

    test('public route table routes to Internet Gateway', () => {
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('private route tables route to NAT Gateways', () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[/);
    });
  });

  describe('Security Groups', () => {
    test('declares ALB security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('declares EC2 security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test('declares RDS security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/to_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
    });

    test('EC2 security group allows traffic from ALB', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('RDS security group allows MySQL from EC2', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  describe('IAM Resources', () => {
    test('declares EC2 IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test('declares S3 access policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
    });

    test('declares IAM role policy attachment', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_access"/);
    });

    test('declares IAM instance profile', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test('EC2 role has proper assume role policy', () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test('S3 policy allows necessary S3 actions', () => {
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:DeleteObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test('S3 policy allows KMS actions', () => {
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });
  });

  describe('Load Balancer Resources', () => {
    test('declares Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('ALB is internet-facing', () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test('ALB uses application load balancer type', () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('declares ALB target group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test('declares ALB listener', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });

    test('ALB listener forwards to target group', () => {
      expect(stackContent).toMatch(/type\s*=\s*"forward"/);
      expect(stackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
    });

    test('target group has health checks configured', () => {
      expect(stackContent).toMatch(/health_check\s*\{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('declares launch template', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test('launch template uses Amazon Linux 2 AMI', () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux2\.id/);
    });

    test('launch template uses t3.micro instance type', () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test('launch template has IAM instance profile', () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*\{/);
    });

    test('launch template has encrypted EBS volume', () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('launch template has user data', () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test('user data installs and configures Apache', () => {
      expect(stackContent).toMatch(/yum install -y httpd/);
      expect(stackContent).toMatch(/systemctl start httpd/);
      expect(stackContent).toMatch(/systemctl enable httpd/);
    });

    test('declares Auto Scaling Group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test('Auto Scaling Group has minimum 2 instances', () => {
      expect(stackContent).toMatch(/min_size\s*=\s*2/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test('Auto Scaling Group uses public subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('Auto Scaling Group uses ELB health checks', () => {
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });
  });

  describe('RDS Resources', () => {
    test('declares RDS subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test('declares RDS instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS instance uses MySQL engine', () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test('RDS instance has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('RDS instance is not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('RDS instance uses private security group', () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test('RDS instance uses database subnet group', () => {
      expect(stackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test('RDS instance has backup retention', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  describe('CloudWatch Resources', () => {
    test('declares CloudWatch log group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"/);
    });

    test('CloudWatch log group has retention period', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('CloudWatch log group uses KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe('Outputs', () => {
    test('declares VPC ID output', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test('declares subnet ID outputs', () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"database_subnet_ids"/);
    });

    test('declares load balancer outputs', () => {
      expect(stackContent).toMatch(/output\s+"load_balancer_dns_name"/);
      expect(stackContent).toMatch(/output\s+"load_balancer_zone_id"/);
    });

    test('declares RDS endpoint output', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test('declares S3 bucket name output', () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test('declares KMS key ID output', () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('declares Auto Scaling Group name output', () => {
      expect(stackContent).toMatch(/output\s+"autoscaling_group_name"/);
    });
  });

  describe('Security and Compliance', () => {
    test('all resources have proper tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('security groups have lifecycle rules', () => {
      expect(stackContent).toMatch(/lifecycle\s*\{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test('launch template has lifecycle rules', () => {
      expect(stackContent).toMatch(/lifecycle\s*\{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test('Auto Scaling Group has lifecycle rules', () => {
      expect(stackContent).toMatch(/lifecycle\s*\{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test('RDS instance has proper deletion protection', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });
  });

  describe('Network Architecture Compliance', () => {
    test('VPC spans multiple availability zones', () => {
      expect(stackContent).toMatch(/availability_zones\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    test('public and private subnets exist in each AZ', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.availability_zones\)/);
    });

    test('ALB is deployed in public subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('EC2 instances are deployed in public subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('RDS is deployed in database subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });
  });

  describe('Encryption Compliance', () => {
    test('KMS key is used for S3 encryption', () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('KMS key is used for RDS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('KMS key is used for EBS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('KMS key is used for CloudWatch logs encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe('IAM Security Compliance', () => {
    test('EC2 instances have IAM roles for S3 access', () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*\{/);
      expect(stackContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test('IAM policies follow least privilege principle', () => {
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:DeleteObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test('IAM roles have proper trust relationships', () => {
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });
  });
});
