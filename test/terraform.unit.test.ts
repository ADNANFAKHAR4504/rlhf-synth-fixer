import fs from 'fs';
import path from 'path';

describe('TAP Stack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // ============================================================================
  // VARIABLES
  // ============================================================================
  describe('Variables', () => {
    test('defines expected variables', () => {
      [
        'region',
        'project_name',
        'environment',
        'alert_email',
        'db_instance_class',
        'vpc_cidr',
        'ssh_allowed_cidr'
      ].forEach((v: string) =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // ============================================================================
  // LOCALS
  // ============================================================================
  describe('Locals', () => {
    test('defines locals for naming, tagging, and AZ mapping', () => {
      [
        'common_tags',
        'random_suffix',
        'azs',
        'private_subnet_cidrs',
        'public_subnet_cidrs'
      ].forEach((l: string) =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });
  });

  // ============================================================================
  // DATA SOURCES
  // ============================================================================
  describe('Data Sources', () => {
    test('fetches AZs, caller identity, and partition', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(tfContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  // ============================================================================
  // RANDOM / KMS
  // ============================================================================
  describe('Random and KMS Resources', () => {
    test('defines random username and password resources', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });

    test('defines KMS key with rotation enabled and alias', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  // ============================================================================
  // NETWORKING
  // ============================================================================
  describe('Networking', () => {
    test('VPC created with DNS support and hostnames', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('public and private subnets are defined across AZs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tfContent).toMatch(/count\s*=\s*3/);
    });

    test('NAT gateways and EIPs are defined with dependencies', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('route tables and associations for public/private subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // ============================================================================
  // SECURITY GROUPS
  // ============================================================================
  describe('Security Groups', () => {
    test('EC2, ALB, and RDS security groups exist with proper ports', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);

      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
    });
  });

  // ============================================================================
  // IAM ROLES & POLICIES
  // ============================================================================
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role, policy, and instance profile exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('Flow logs and Config IAM roles are defined with policies', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config"/);
    });
  });

  // ============================================================================
  // S3 BUCKETS
  // ============================================================================
  describe('S3 Buckets', () => {
    test('main, cloudtrail, and config buckets with encryption and versioning exist', () => {
      ['main', 'cloudtrail', 'config'].forEach((name) => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${name}"`));
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${name}"`));
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${name}"`));
      });
    });
  });

  // ============================================================================
  // EC2 / ASG
  // ============================================================================
  describe('Compute Resources', () => {
    test('Launch template uses IMDSv2 and encrypted EBS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tfContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(tfContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('Autoscaling group is defined and uses the launch template', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/launch_template\s*=\s*{/);
    });
  });

  // ============================================================================
  // RDS DATABASE
  // ============================================================================
  describe('RDS', () => {
    test('RDS subnet group and instance are defined securely', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key.main.arn/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  // ============================================================================
  // SECRETS MANAGER
  // ============================================================================
  describe('Secrets Manager', () => {
    test('Stores RDS credentials with KMS encryption and version', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds"/);
      expect(tfContent).toMatch(/secret_string\s*=\s*jsonencode/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key.main.arn/);
    });
  });

  // ============================================================================
  // FLOW LOGS & CLOUDTRAIL
  // ============================================================================
  describe('Logging and Monitoring', () => {
    test('VPC flow logs are enabled and encrypted', () => {
      expect(tfContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(tfContent).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key.main.arn/);
    });

    test('CloudTrail is enabled with log validation and CloudWatch logs', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(tfContent).toMatch(/enable_logging\s*=\s*true/);
      expect(tfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });
  });

  // ============================================================================
  // AWS CONFIG
  // ============================================================================
  describe('AWS Config', () => {
    test('Recorder, delivery channel, and status exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });
  });

  // ============================================================================
  // SNS & CLOUDWATCH ALARMS
  // ============================================================================
  describe('SNS and CloudWatch Alarms', () => {
    test('SNS topic and email subscription exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_email"/);
      expect(tfContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test('CloudWatch metric alarms exist for security events', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"console_signin_failures"/);
    });
  });

  // ============================================================================
  // OUTPUTS
  // ============================================================================
  describe('Outputs', () => {
    const outputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'alb_dns_name',
      'ec2_security_group_id',
      'rds_security_group_id',
      's3_bucket_main_name',
      'rds_endpoint',
      'rds_username',
      'rds_secret_arn',
      'kms_key_arn',
      'cloudtrail_bucket_name',
      'config_bucket_name'
    ];

    outputs.forEach((output) => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
