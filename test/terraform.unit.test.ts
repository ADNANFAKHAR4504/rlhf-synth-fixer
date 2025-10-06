import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  // =========================
  // VARIABLES
  // =========================
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const vars = [
        'region',
        'ssh_allowed_cidr',
        'ec2_instance_type',
        'rds_instance_class',
        'rds_allocated_storage',
        'rds_engine',
        'rds_engine_version',
        'environment'
      ];
      vars.forEach(v => expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`)));
    });
  });

  // =========================
  // DATA SOURCES
  // =========================
  describe('Data Sources', () => {
    test('availability zones and AMI data sources exist', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/data\.aws_ami\.amazon_linux_2\.most_recent\s*=\s*true/);
    });

    test('aws_caller_identity exists', () => {
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // =========================
  // LOCALS
  // =========================
  describe('Locals', () => {
    test('defines azs, VPC CIDR, subnet CIDRs and common_tags', () => {
      expect(tfContent).toMatch(/locals\s*{/);
      ['vpc_cidr', 'azs', 'public_subnet_cidrs', 'private_subnet_cidrs', 'common_tags'].forEach(l => {
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`));
      });
    });
  });

  // =========================
  // RANDOM / SECRETS
  // =========================
  describe('Random & Secrets', () => {
    test('creates random username and password for RDS', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
      expect(tfContent).toMatch(/override_special\s*=\s*["']!#\$%\^&\*\(\)-_=+\[\]\{\}:?["']/);
    });

    test('Secrets Manager secret for RDS credentials exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
    });
  });

  // =========================
  // VPC & Networking
  // =========================
  describe('VPC and Networking', () => {
    test('defines VPC, IGW, public/private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_subnet"\s+"private"/g)).toBe(3);
    });

    test('NAT gateways and EIPs count 3', () => {
      expect(countMatches(/resource\s+"aws_eip"\s+"nat"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_nat_gateway"\s+"main"/g)).toBe(3);
    });

    test('route tables and associations exist', () => {
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
    test('EC2 SG allows SSH, HTTP, HTTPS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      ['22', '80', '443'].forEach(p => expect(tfContent).toMatch(new RegExp(`from_port\\s*=\\s*${p}`)));
    });

    test('RDS SG allows MySQL from EC2 SG', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.ec2.id\]/);
    });
  });

  // =========================
  // IAM Roles & Policies
  // =========================
  describe('IAM', () => {
    test('EC2 role, instance profile, and CloudWatch policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/);
    });

    test('DynamoDB autoscaling role exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"dynamodb_autoscaling_role"/);
      expect(tfContent).toMatch(/aws_iam_role_policy_attachment\s+"dynamodb_autoscaling"/);
    });
  });

  // =========================
  // S3 & KMS
  // =========================
  describe('S3 & KMS', () => {
    test('S3 bucket, versioning, encryption, public access block', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
    });

    test('KMS key and alias exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_key"/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_key_alias"/);
    });
  });

  // =========================
  // EC2 Instances
  // =========================
  describe('EC2 Instances', () => {
    test('public and private EC2 instances exist with expected properties', () => {
      expect(countMatches(/resource\s+"aws_instance"\s+"public"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_instance"\s+"private"/g)).toBe(3);
      expect(tfContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile.ec2_profile.name/);
      expect(tfContent).toMatch(/monitoring\s*=\s*true/);
    });
  });

  // =========================
  // RDS
  // =========================
  describe('RDS', () => {
    test('DB subnet group and instance exist with proper engine, class, storage', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*var.rds_engine/);
      expect(tfContent).toMatch(/instance_class\s*=\s*var.rds_instance_class/);
      expect(tfContent).toMatch(/allocated_storage\s*=\s*var.rds_allocated_storage/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
    });
  });

  // =========================
  // DynamoDB
  // =========================
  describe('DynamoDB', () => {
    test('table exists with encryption and point-in-time recovery', () => {
      expect(tfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
      expect(tfContent).toMatch(/point_in_time_recovery\s*{/);
      expect(tfContent).toMatch(/server_side_encryption\s*{/);
    });
  });

  // =========================
  // CloudWatch, SNS, Alarms
  // =========================
  describe('CloudWatch, SNS & Alarms', () => {
    test('CloudWatch metric alarms exist for EC2, RDS, ALB', () => {
      ['high_cpu', 'low_cpu', 'rds_cpu', 'rds_storage', 'alb_healthy_hosts'].forEach(a => {
        expect(tfContent).toMatch(new RegExp(`aws_cloudwatch_metric_alarm"\\s+"${a}"`));
      });
    });

    test('SNS topic and subscription exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"/);
    });
  });

  // =========================
  // Outputs
  // =========================
  describe('Outputs', () => {
    const outputs = [
      'vpc_id', 'public_subnet_ids', 'private_subnet_ids', 'database_subnet_ids', 'nat_gateway_ids',
      'internet_gateway_id', 'alb_security_group_id', 'ec2_security_group_id', 'rds_security_group_id',
      'alb_arn', 'alb_dns_name', 'target_group_arn', 'autoscaling_group_id', 'launch_template_id',
      'rds_instance_id', 'rds_instance_endpoint', 's3_logs_bucket_id', 'ec2_role_arn', 'rds_secret_arn'
    ];
    outputs.forEach(o => {
      test(`output ${o} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${o}"`));
      });
    });
  });

  // =========================
  // Tags
  // =========================
  describe('Tagging', () => {
    test('common_tags include Environment/Project/ManagedBy', () => {
      expect(tfContent).toMatch(/common_tags/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(tfContent).toMatch(/\$\{var\.project_name\}-vpc/);
    });
  });
});
