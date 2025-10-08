import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // =========================
  // Variables
  // =========================
  describe('Variables', () => {
    test('should define region, vpc_cidr, trusted_ssh_cidr, app_name', () => {
      expect(tfContent).toMatch(/variable\s+"region"/);
      expect(tfContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(tfContent).toMatch(/variable\s+"trusted_ssh_cidr"/);
      expect(tfContent).toMatch(/variable\s+"app_name"/);
    });

    test('should define instance scaling variables', () => {
      expect(tfContent).toMatch(/variable\s+"instance_type"/);
      expect(tfContent).toMatch(/variable\s+"min_instances"/);
      expect(tfContent).toMatch(/variable\s+"max_instances"/);
      expect(tfContent).toMatch(/variable\s+"desired_instances"/);
    });
  });

  // =========================
  // Locals
  // =========================
  describe('Locals', () => {
    test('should define common tags and AZs', () => {
      expect(tfContent).toMatch(/locals\s+{/);
      expect(tfContent).toMatch(/common_tags/);
      expect(tfContent).toMatch(/azs/);
      expect(tfContent).toMatch(/public_subnet_cidrs/);
      expect(tfContent).toMatch(/private_subnet_cidrs/);
    });
  });

  // =========================
  // Networking (VPC, IGW, Subnets, NAT)
  // =========================
  describe('VPC and Networking', () => {
    test('should define VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should define Internet Gateway and NAT Gateway', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('should define public and private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should define route tables and associations', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // =========================
  // Security Groups
  // =========================
  describe('Security Groups', () => {
    test('should define ALB security group with HTTP ingress', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tfContent).toMatch(/from_port\s+=\s+80/);
      expect(tfContent).toMatch(/cidr_blocks\s+=\s+\["0.0.0.0\/0"\]/);
    });

    test('should define EC2 security group with ALB HTTP and SSH from trusted CIDR', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/description\s+=\s+"HTTP from ALB"/);
      expect(tfContent).toMatch(/description\s+=\s+"SSH from trusted CIDR"/);
    });
  });

  // =========================
  // Load Balancer
  // =========================
  describe('Application Load Balancer', () => {
    test('should define ALB, target group, and listener', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });
  });

  // =========================
  // EC2 and Auto Scaling
  // =========================
  describe('EC2 and Auto Scaling', () => {
    test('should define launch template with user_data and monitoring', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tfContent).toMatch(/user_data/);
      expect(tfContent).toMatch(/monitoring\s+{/);
    });

    test('should define autoscaling group with metrics and tags', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/min_size/);
      expect(tfContent).toMatch(/max_size/);
      expect(tfContent).toMatch(/desired_capacity/);
      expect(tfContent).toMatch(/enabled_metrics/);
    });

    test('should define autoscaling policies scale up and down', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  // =========================
  // S3 Bucket
  // =========================
  describe('S3 Bucket', () => {
    test('should define static assets bucket with encryption and versioning', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"static_assets"/);
      expect(tfContent).toMatch(/aws_s3_bucket_versioning/);
      expect(tfContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test('should block public access', () => {
      expect(tfContent).toMatch(/aws_s3_bucket_public_access_block/);
      expect(tfContent).toMatch(/block_public_acls\s+=\s+true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s+=\s+true/);
    });

    test('should define bucket policy with restrictions', () => {
      expect(tfContent).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_bucket_policy"/);
      expect(tfContent).toMatch(/aws_s3_bucket_policy/);
      expect(tfContent).toMatch(/aws:SecureTransport/);
    });
  });

  // =========================
  // CloudWatch
  // =========================
  describe('CloudWatch Monitoring', () => {
    test('should define metric alarms for CPU high/low and response time', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"target_response_time"/);
    });

    test('should define CloudWatch dashboard', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test('should define CloudWatch log group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"/);
    });
  });

  // =========================
  // IAM Roles
  // =========================
  describe('IAM Roles', () => {
    test('should define EC2 IAM role and instance profile', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test('should attach CloudWatch and SSM policies', () => {
      expect(tfContent).toMatch(/aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/);
      expect(tfContent).toMatch(/aws_iam_role_policy_attachment"\s+"ec2_ssm"/);
    });
  });

  // =========================
  // Outputs
  // =========================
  describe('Outputs', () => {
    test('should export VPC ID and CIDR', () => {
      expect(tfContent).toMatch(/output\s+"vpc_id"/);
      expect(tfContent).toMatch(/output\s+"vpc_cidr"/);
    });

    test('should export subnet IDs', () => {
      expect(tfContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(tfContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('should export ALB details', () => {
      expect(tfContent).toMatch(/output\s+"alb_dns_name"/);
      expect(tfContent).toMatch(/output\s+"alb_zone_id"/);
      expect(tfContent).toMatch(/output\s+"alb_security_group_id"/);
    });

    test('should export S3 bucket details', () => {
      expect(tfContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(tfContent).toMatch(/output\s+"s3_bucket_arn"/);
    });

    test('should export autoscaling group and security group IDs', () => {
      expect(tfContent).toMatch(/output\s+"autoscaling_group_name"/);
      expect(tfContent).toMatch(/output\s+"ec2_security_group_id"/);
    });

    test('should export NAT and IGW IDs', () => {
      expect(tfContent).toMatch(/output\s+"nat_gateway_id"/);
      expect(tfContent).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('should export CloudWatch dashboard URL', () => {
      expect(tfContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
    });
  });
});

