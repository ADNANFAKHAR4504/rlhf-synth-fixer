import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (comprehensive)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // helper to count occurrences with flexible whitespace
  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  // =========================
  // Variables & Data Sources
  // =========================
  describe('Variables & Data Sources', () => {
    test('defines core variables', () => {
      expect(tfContent).toMatch(/variable\s+"region"/);
      expect(tfContent).toMatch(/variable\s+"environment"/);
      expect(tfContent).toMatch(/variable\s+"project_name"/);
      expect(tfContent).toMatch(/variable\s+"allowed_ips"/);
      expect(tfContent).toMatch(/variable\s+"domain_name"/);
      expect(tfContent).toMatch(/variable\s+"alert_email"/);
    });

    test('contains data sources for availability zones and AMI', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/most_recent\s*=\s*true/);
    });
  });

  // =========================
  // Locals
  // =========================
  describe('Locals', () => {
    test('defines expected locals including azs and subnet CIDRs', () => {
      expect(tfContent).toMatch(/locals\s*{/);
      expect(tfContent).toMatch(/azs\s*=/);
      expect(tfContent).toMatch(/vpc_cidr\s*=/);
      expect(tfContent).toMatch(/public_subnets\s*=/);
      expect(tfContent).toMatch(/private_subnets\s*=/);
      expect(tfContent).toMatch(/db_subnets\s*=/);
      expect(tfContent).toMatch(/common_tags\s*=/);
    });
  });

  // =========================
  // Random / Secrets
  // =========================
  describe('Random & Secrets', () => {
    test('creates random username suffix and random password', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username_suffix"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
      expect(tfContent).toMatch(/override_special\s*=\s*["']!#\$%\^&\*\(\)_\+\-=["']/);
    });
   });
  // =========================
  // VPC & Networking
  // =========================
  describe('VPC and Networking', () => {
    test('defines VPC and internet gateway', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('creates three public, private and database subnets (count = 3)', () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/g)).toBeGreaterThanOrEqual(1);
      // check count = 3 specifically in the public subnet block
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*3/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*3/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"database"[\s\S]*?count\s*=\s*3/);
    });

    test('creates NAT gateways and EIPs with count 3', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"[\s\S]*?count\s*=\s*3/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*3/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('route tables and associations exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"database"/);
    });
  });

  // =========================
  // Security Groups
  // =========================
  describe('Security Groups', () => {
    test('ALB SG allows HTTP/HTTPS from allowed_ips and egress all', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*var.allowed_ips/);
      expect(tfContent).toMatch(/egress\s*{[\s\S]*?cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/);
    });

    test('EC2 SG references ALB SG and allows HTTP', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      // security_groups reference to alb
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.alb.id\]/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
    });

    test('RDS SG allows MySQL from EC2 security group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.ec2.id\]/);
    });
  });

  // =========================
  // IAM Roles & Policies
  // =========================
  describe('IAM Roles & Policies', () => {
    test('EC2 role and instance profile exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tfContent).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
    });

    test('EC2 inline policy allows S3, CloudWatch and secretsmanager:GetSecretValue', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(tfContent).toMatch(/s3:PutObject/);
      expect(tfContent).toMatch(/logs:CreateLogGroup/);
      expect(tfContent).toMatch(/cloudwatch:PutMetricData/);
      expect(tfContent).toMatch(/secretsmanager:GetSecretValue/);
    });
  });

  // =========================
  // S3 Bucket & Versioning / Encryption
  // =========================
  describe('S3 Logs Bucket', () => {
    test('logs bucket exists with random suffix and versioning & encryption & public block', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(tfContent).toMatch(/random_string"\s+"bucket_suffix"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  // =========================
  // ACM & Load Balancer
  // =========================
  describe('ACM & ALB', () => {
    test('ACM certificate configured for domain and wildcard alt name', () => {
      expect(tfContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
      expect(tfContent).toMatch(/domain_name\s*=\s*var.domain_name/);
      expect(tfContent).toMatch(/\*\.\${var\.domain_name}/);
    });

    test('ALB, target group, and listeners exist and HTTP redirects to HTTPS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(tfContent).toMatch(/type\s*=\s*"redirect"/);
      expect(tfContent).toMatch(/port\s*=\s*"443"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(tfContent).toMatch(/certificate_arn\s*=\s*aws_acm_certificate.main.arn/);
      expect(tfContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group.main.arn/);
    });
  });

  // =========================
  // Launch Template & ASG
  // =========================
  describe('Launch Template & Auto Scaling Group', () => {
    test('launch template uses AMI data and user_data is base64encoded', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tfContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(tfContent).toMatch(/user_data\s*=\s*base64encode\(/);
      expect(tfContent).toMatch(/iam_instance_profile\s*{[\s\S]*?name\s*=\s*aws_iam_instance_profile.ec2_profile.name/);
    });

    test('autoscaling group configured with min/max/desired and target group', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/min_size\s*=\s*2/);
      expect(tfContent).toMatch(/max_size\s*=\s*4/);
      expect(tfContent).toMatch(/desired_capacity\s*=\s*2/);
      expect(tfContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group.main.arn\]/);
      expect(tfContent).toMatch(/launch_template\s*{[\s\S]*?version\s*=\s*"\$Latest"/);
    });

    test('autoscaling policies scale_up and scale_down exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  // =========================
  // RDS Database & DB Subnet Group
  // =========================
  describe('RDS Database', () => {
    test('DB subnet group and instance exist with expected properties', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/subnet_ids\s*=\s*aws_subnet.database\[\*\]\.id/);

      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/engine_version\s*=\s*"8.0"/);
      expect(tfContent).toMatch(/instance_class\s*=\s*"db.t3.micro"/);
      expect(tfContent).toMatch(/allocated_storage\s*=\s*20/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/publicly_accessible\s*=\s*false/);
      // username and password should reference random resources
      expect(tfContent).toMatch(/username\s*=\s*"a\$\{random_string\.rds_username_suffix\.result\}"/);
      expect(tfContent).toMatch(/password\s*=\s*random_password\.rds_password\.result/);
    });
  });

  // =========================
  // CloudWatch / SNS / Alarms
  // =========================
  describe('CloudWatch, SNS & Alarms', () => {
    test('SNS topic and subscription exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"/);
      expect(tfContent).toMatch(/endpoint\s*=\s*var.alert_email/);
    });

    test('cloudwatch alarms for ASG and RDS exist and reference policies/topics', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(tfContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic.alerts.arn,\s*aws_autoscaling_policy.scale_up.arn\]/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"/);
    });
  });

  // =========================
  // Outputs
  // =========================
  describe('Outputs', () => {
    test('exports VPC, subnet and gateway outputs', () => {
      expect(tfContent).toMatch(/output\s+"vpc_id"/);
      expect(tfContent).toMatch(/output\s+"vpc_cidr"/);
      expect(tfContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(tfContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(tfContent).toMatch(/output\s+"database_subnet_ids"/);
      expect(tfContent).toMatch(/output\s+"nat_gateway_ids"/);
      expect(tfContent).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('exports security group, alb and target group outputs', () => {
      expect(tfContent).toMatch(/output\s+"alb_security_group_id"/);
      expect(tfContent).toMatch(/output\s+"ec2_security_group_id"/);
      expect(tfContent).toMatch(/output\s+"rds_security_group_id"/);
      expect(tfContent).toMatch(/output\s+"alb_arn"/);
      expect(tfContent).toMatch(/output\s+"alb_dns_name"/);
      expect(tfContent).toMatch(/output\s+"target_group_arn"/);
    });

    test('exports ASG, launch template and RDS outputs', () => {
      expect(tfContent).toMatch(/output\s+"autoscaling_group_id"/);
      expect(tfContent).toMatch(/output\s+"autoscaling_group_name"/);
      expect(tfContent).toMatch(/output\s+"launch_template_id"/);
      expect(tfContent).toMatch(/output\s+"rds_instance_id"/);
      expect(tfContent).toMatch(/output\s+"rds_instance_endpoint"/);
      expect(tfContent).toMatch(/output\s+"rds_instance_arn"/);
    });

    test('exports S3, IAM and secrets outputs', () => {
      expect(tfContent).toMatch(/output\s+"s3_logs_bucket_id"/);
      expect(tfContent).toMatch(/output\s+"s3_logs_bucket_arn"/);
      expect(tfContent).toMatch(/output\s+"ec2_role_arn"/);
      expect(tfContent).toMatch(/output\s+"ec2_role_name"/);
      expect(tfContent).toMatch(/output\s+"rds_secret_arn"/);
      expect(tfContent).toMatch(/output\s+"rds_secret_name"/);
    });

    test('exports ACM and AMI outputs', () => {
      expect(tfContent).toMatch(/output\s+"acm_certificate_arn"/);
      expect(tfContent).toMatch(/output\s+"acm_certificate_domain"/);
      expect(tfContent).toMatch(/output\s+"ami_id"/);
      expect(tfContent).toMatch(/output\s+"ami_name"/);
    });

    test('exports route table and AZ outputs', () => {
      expect(tfContent).toMatch(/output\s+"public_route_table_id"/);
      expect(tfContent).toMatch(/output\s+"private_route_table_ids"/);
      expect(tfContent).toMatch(/output\s+"availability_zones"/);
    });
  });

  // =========================
  // Sanity / Tagging
  // =========================
  describe('Tagging & Sanity checks', () => {
    test('common_tags used throughout and includes Environment/Project/ManagedBy', () => {
      // verify local.common_tags exists and merged tags with resource Name exist in a couple of resources
      expect(tfContent).toMatch(/common_tags/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(tfContent).toMatch(/\$\{var\.project_name\}-vpc/); // check Name usage pattern on VPC
      expect(tfContent).toMatch(/\$\{var\.project_name\}-alb/);
    });
  });
});
