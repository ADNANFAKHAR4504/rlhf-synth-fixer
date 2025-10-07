import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Utility to count regex matches
  const countMatches = (regex: RegExp) => (tfContent.match(regex) || []).length;

  // =========================
  // VARIABLES
  // =========================
  describe('Variables', () => {
    test('defines expected variables', () => {
      ['region', 'environment', 'project_name'].forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // =========================
  // LOCALS
  // =========================
  describe('Locals', () => {
    test('defines random_suffix, common_tags, network config', () => {
      ['random_suffix', 'common_tags', 'vpc_cidr', 'azs', 'public_subnet_cidrs', 'private_subnet_cidrs', 'name_prefix'].forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });
  });

  // =========================
  // DATA SOURCES
  // =========================
  describe('Data Sources', () => {
    test('amazon_linux_2 AMI and caller identity exist', () => {
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // =========================
  // RANDOM RESOURCES FOR RDS
  // =========================
  describe('Random resources for RDS', () => {
    test('random_string for rds_username exists with valid properties', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username"/);
      expect(tfContent).toMatch(/length\s*=\s*8/);
      expect(tfContent).toMatch(/special\s*=\s*false/);
    });
  });
  // =========================
  // VPC AND NETWORKING RESOURCES
  // =========================
  describe('Networking resources', () => {
    test('VPC is defined with DNS hostnames and support enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway exists and associated with VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc.main.id/);
    });

    test('Public and Private subnets are created in two AZs', () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"public"/)).toBe(1); // counted as 1 block with count
      expect(countMatches(/resource\s+"aws_subnet"\s+"private"/)).toBe(1);
      expect(tfContent).toMatch(/count\s*=\s*length\(local.public_subnet_cidrs\)/);
      expect(tfContent).toMatch(/count\s*=\s*length\(local.private_subnet_cidrs\)/);
    });

    test('Elastic IPs and NAT Gateways are configured per public subnet', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('Public and Private route tables with routes and associations exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // =========================
  // SECURITY GROUPS
  // =========================
  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS from internet', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/);
    });

    test('EC2 security group allows HTTP from ALB and SSH from VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.alb.id\]/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\[local.vpc_cidr\]/);
    });

    test('RDS security group allows MySQL from EC2 SG and egress within VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.ec2.id\]/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*\[local.vpc_cidr\]/);
    });
  });

  // =========================
  // IAM ROLES AND POLICIES
  // =========================
  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role and instance profile exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });
  });

  // =========================
  // SECRETS MANAGER
  // =========================
  describe('Secrets Manager', () => {
    test('Secrets manager secret and version for RDS credentials exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/);
      expect(tfContent).toMatch(/secret_string\s*=/);
      expect(tfContent).toMatch(/username\s*=\s*local.rds_username/);
      expect(tfContent).toMatch(/password\s*=\s*random_password.rds_password.result/);
    });
  });

  // =========================
  // RDS DATABASE
  // =========================
  describe('RDS database', () => {
    test('DB subnet group and RDS instance exist with correct properties', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/username\s*=\s*local.rds_username/);
      expect(tfContent).toMatch(/password\s*=\s*random_password.rds_password.result/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  // =========================
  // APPLICATION LOAD BALANCER
  // =========================
  describe('Application Load Balancer', () => {
    test('ALB, Target Group and Listener resources exist and linked', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
      expect(tfContent).toMatch(/security_groups\s*=\s*\[aws_security_group.alb.id\]/);
      expect(tfContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group.main.arn/);
    });
  });

  // =========================
  // LAUNCH TEMPLATE AND AUTO SCALING
  // =========================
  describe('Launch Template and Auto Scaling', () => {
    test('Launch Template created with correct AMI and security groups', () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tfContent).toMatch(/image_id\s*=\s*data.aws_ami.amazon_linux_2.id/);
      expect(tfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group.ec2.id\]/);
      expect(tfContent).toMatch(/iam_instance_profile\s*{[^}]*name\s*=\s*aws_iam_instance_profile.ec2.name/);
      expect(tfContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test('Auto Scaling Group with target group and scaling policies exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group.main.arn\]/);
      expect(tfContent).toMatch(/desired_capacity\s*=\s*2/);
      expect(tfContent).toMatch(/launch_template\s*{[^}]*id\s*=\s*aws_launch_template.main.id/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  // =========================
  // OUTPUTS
  // =========================
  
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'public_subnet_cidrs', 'private_subnet_cidrs', 'nat_gateway_ids', 'nat_gateway_public_ips',
      'internet_gateway_id', 'alb_security_group_id', 'ec2_security_group_id', 'rds_security_group_id',
      'alb_dns_name', 'alb_arn', 'target_group_arn', 'rds_endpoint', 'rds_address',
      'rds_port', 'rds_database_name', 'rds_identifier', 'rds_resource_id',
      'secrets_manager_secret_arn', 'secrets_manager_secret_name',
      'ec2_iam_role_arn', 'ec2_iam_role_name', 'ec2_instance_profile_arn', 'ec2_instance_profile_name',
      'autoscaling_group_name', 'autoscaling_group_arn', 'launch_template_id', 'launch_template_latest_version',
      'ami_id', 'ami_name', 'public_route_table_id', 'private_route_table_ids', 'db_subnet_group_name',
      'resource_suffix', 'application_url'
    ];

    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
