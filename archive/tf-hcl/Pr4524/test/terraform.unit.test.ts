import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Complete Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Helper
  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'environment',
        'project_name',
        'vpc_cidr',
        'instance_type',
        'min_size',
        'max_size',
        'desired_capacity',
        'db_instance_class'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines all expected locals', () => {
      const expectedLocals = [
        'random_suffix',
        'common_tags',
        'name_prefix',
        'azs',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'db_subnet_cidrs'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags contains standard tag keys', () => {
      ['Environment', 'Project', 'ManagedBy', 'Stack'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
      );
    });
  });

  // -------------------------
  // Random Resources
  // -------------------------
  describe('Random Resources', () => {
    test('random_string and random_password are present', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    test('aws_ami and aws_caller_identity data sources exist', () => {
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // -------------------------
  // KMS Resources
  // -------------------------
  describe('KMS Resources', () => {
    test('KMS key and alias present with rotation enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC, Internet Gateway, and subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test('Elastic IPs and NAT Gateways configured with IGW dependency', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Route tables and associations exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    ['alb', 'ec2', 'rds', 'lambda'].forEach(sg =>
      test(`${sg} security group defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      })
    );

    test('RDS security group ingress on port 3306 from EC2 and Lambda security groups', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[.*aws_security_group\.ec2\.id.*aws_security_group\.lambda\.id.*\]/);
    });
  });

  // -------------------------
  // IAM Roles and Policies
  // -------------------------
  describe('IAM Roles and Policies', () => {
    test('EC2 and Lambda roles, policies, instance profile, and policy attachments exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);

      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_vpc"/);
    });
  });

  // -------------------------
  // S3 Bucket and Related
  // -------------------------
  describe('S3 Bucket and Configurations', () => {
    test('S3 bucket exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
    });

    test('S3 bucket encryption configured with KMS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(tfContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('S3 bucket versioning enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(tfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 public access block is configured', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
    });

    test('S3 bucket notification for Lambda trigger exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"lambda_trigger"/);
    });
  });

  // -------------------------
  // Lambda Function and Permissions
  // -------------------------
  describe('Lambda Function and Permissions', () => {
    test('Lambda function resource and permission for S3 exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
      expect(tfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"s3"/);
    });

    test('Lambda function uses environment variables including KMS key ID', () => {
      expect(tfContent).toMatch(/environment\s*{[^}]*KMS_KEY_ID/);
    });
  });

  // -------------------------
  // Application Load Balancer and Target Group
  // -------------------------
  describe('Application Load Balancer (ALB)', () => {
    test('ALB, target group and listener exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });

    test('ALB uses security group alb', () => {
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });
  });

  // -------------------------
  // Auto Scaling Group and Policies
  // -------------------------
  describe('Auto Scaling Group and Policies', () => {
    test('Launch template and auto scaling group resources exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test('Auto scaling policies for scale up and down exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });

    test('Auto scaling group health check type and target group specified', () => {
      expect(tfContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(tfContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
    });
  });

  // -------------------------
  // CloudWatch Alarms
  // -------------------------
  describe('CloudWatch Metric Alarms', () => {
    ['cpu_high', 'cpu_low'].forEach(alarm => {
      test(`CloudWatch alarm ${alarm} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`));
      });
    });
  });

  // -------------------------
  // RDS Database Resources
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group, master RDS instance and read replica defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"master"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"read_replica"/);
    });

    test('RDS master uses MySQL engine, multi-AZ, encrypted storage, backups and KMS', () => {
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // -------------------------
  // Secrets Manager and Parameter Store
  // -------------------------
  describe('Secrets Manager and Parameter Store', () => {
    test('Secrets Manager secret and version for RDS present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds"/);
    });

    test('Parameter Store parameters for RDS username and password exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"rds_username"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"rds_password"/);
    });
  });

  // -------------------------
  // WAF Web ACL and Association
  // -------------------------
  describe('WAF', () => {
    test('WAF Web ACL and association to ALB exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  // -------------------------
  // CloudWatch Log Groups
  // -------------------------
  describe('CloudWatch Log Group', () => {
    test('CloudWatch log group for Lambda exists with KMS encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids', 'database_subnet_ids',
      'nat_gateway_ids', 'internet_gateway_id', 'alb_dns_name', 'alb_arn', 'alb_zone_id',
      'target_group_arn', 'autoscaling_group_name', 'launch_template_id',
      'ec2_security_group_id', 'alb_security_group_id', 'rds_security_group_id', 'lambda_security_group_id',
      'rds_master_endpoint', 'rds_master_address', 'rds_replica_endpoint', 'rds_replica_address',
      'rds_database_name', 'secrets_manager_secret_arn', 'ssm_parameter_username_name', 'ssm_parameter_password_name',
      's3_bucket_name', 's3_bucket_arn', 'lambda_function_name', 'lambda_function_arn',
      'ec2_iam_role_arn', 'lambda_iam_role_arn', 'kms_key_id', 'kms_key_arn',
      'waf_web_acl_id', 'waf_web_acl_arn', 'ami_id', 'random_suffix', 'stack_name', 'region'
    ];
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

