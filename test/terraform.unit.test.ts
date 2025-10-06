import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp) => (tfContent.match(regex) || []).length;

  // =========================
  // VARIABLES
  // =========================
  describe('Variables', () => {
    test('defines expected variables', () => {
      ['region','ssh_allowed_cidr','ec2_instance_type','rds_instance_class','rds_allocated_storage',
       'rds_engine','rds_engine_version','environment'].forEach(v =>
         expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // =========================
  // DATA SOURCES
  // =========================
  describe('Data Sources', () => {
    test('AZs, AMI, caller identity exist', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // =========================
  // LOCALS
  // =========================
  describe('Locals', () => {
    test('defines VPC CIDR, AZs, subnets, common_tags', () => {
      ['vpc_cidr','azs','public_subnet_cidrs','private_subnet_cidrs','common_tags'].forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });
  });

  // =========================
  // RANDOM & SECRETS
  // =========================
  describe('Random & Secrets', () => {
    test('RDS random username and password exist', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });

    test('Secrets Manager secret for RDS exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
    });
  });

  // =========================
  // VPC & Networking
  // =========================
  describe('VPC & Networking', () => {
    test('VPC, IGW, public/private subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_subnet"\s+"private"/g)).toBe(3);
    });

    test('NAT gateways and EIPs exist', () => {
      expect(countMatches(/resource\s+"aws_eip"\s+"nat"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_nat_gateway"\s+"main"/g)).toBe(3);
    });

    test('route tables and associations exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(countMatches(/resource\s+"aws_route_table"\s+"private"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_route_table_association"/g)).toBe(6);
    });
  });

  // =========================
  // SECURITY GROUPS
  // =========================
  describe('Security Groups', () => {
    test('EC2 SG allows SSH, HTTP, HTTPS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
    });

    test('RDS SG allows MySQL from EC2 SG', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
    });
  });

  // =========================
  // IAM ROLES & POLICIES
  // =========================
  describe('IAM', () => {
    test('EC2 IAM role and instance profile exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test('CloudWatch logs policy exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/);
      expect(tfContent).toMatch(/aws_iam_role_policy_attachment/);
    });

    test('DynamoDB autoscaling role exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"dynamodb_autoscaling_role"/);
      expect(tfContent).toMatch(/aws_iam_role_policy_attachment\s+"dynamodb_autoscaling"/);
    });
  });

  // =========================
  // KMS & S3
  // =========================
  describe('KMS & S3', () => {
    test('KMS key and alias exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_key"/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_key_alias"/);
    });

    test('S3 bucket, encryption, versioning, public block exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(tfContent).toMatch(/aws_s3_bucket_versioning/);
      expect(tfContent).toMatch(/aws_s3_bucket_public_access_block/);
    });
  });

  // =========================
  // EC2 Instances
  // =========================
  describe('EC2 Instances', () => {
    test('public and private EC2 instances exist with IAM profile and monitoring', () => {
      expect(countMatches(/resource\s+"aws_instance"\s+"public"/g)).toBe(3);
      expect(countMatches(/resource\s+"aws_instance"\s+"private"/g)).toBe(3);
      expect(tfContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile.ec2_profile.name/);
      expect(tfContent).toMatch(/monitoring\s*=\s*true/);
    });
  });

  // =========================
  // RDS Database
  // =========================
  describe('RDS', () => {
    test('DB subnet group and instance exist with correct properties', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*var.rds_engine/);
      expect(tfContent).toMatch(/username\s*=\s*"a\$\{random_string\.rds_username\.result\}"/);
      expect(tfContent).toMatch(/password\s*=\s*random_password\.rds_password\.result/);
    });
  });

  // =========================
  // DynamoDB
  // =========================
  describe('DynamoDB', () => {
    test('table exists with encryption and point-in-time recovery', () => {
      expect(tfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
      expect(tfContent).toMatch(/point_in_time_recovery\s*{[\s\S]*enabled\s*=\s*true/);
      expect(tfContent).toMatch(/server_side_encryption\s*{[\s\S]*enabled\s*=\s*true/);
    });
  });

  // =========================
  // CloudWatch Alarms
  // =========================
  describe('CloudWatch Alarms', () => {
    test('RDS CPU alarm exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });
  });

  // =========================
  // OUTPUTS
  // =========================
  describe('Outputs', () => {
    const expectedOutputs = [
      "vpc_id","vpc_cidr","public_subnet_ids","private_subnet_ids",
      "public_subnet_cidrs","private_subnet_cidrs","internet_gateway_id","nat_gateway_ids",
      "nat_gateway_public_ips","ec2_security_group_id","rds_security_group_id",
      "ec2_role_arn","ec2_instance_profile_name","s3_bucket_id","s3_bucket_arn",
      "kms_key_id","kms_key_arn","public_ec2_instance_ids","private_ec2_instance_ids",
      "public_ec2_instance_private_ips","private_ec2_instance_private_ips","ami_id","ami_name",
      "rds_instance_id","rds_instance_endpoint","rds_instance_port","rds_instance_arn",
      "rds_subnet_group_name","secrets_manager_secret_arn","secrets_manager_secret_name",
      "dynamodb_table_name","dynamodb_table_arn","dynamodb_autoscaling_role_arn",
      "cloudwatch_alarm_rds_cpu_name","cloudwatch_alarm_rds_cpu_arn","availability_zones",
      "region","account_id"
    ];

    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });

  // =========================
  // TAGGING
  // =========================
  describe('Tags', () => {
    test('common_tags include Environment/ManagedBy/Stack', () => {
      expect(tfContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(tfContent).toMatch(/Stack\s*=\s*"tap-stack"/);
    });
  });
});
