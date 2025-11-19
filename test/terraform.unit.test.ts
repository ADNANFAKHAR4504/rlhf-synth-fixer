import fs from 'fs';
import path from 'path';

describe('Payment App Infrastructure Complete Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const modulePath = path.join(libPath, 'modules', 'payment-app');

  // File contents
  let rootMain: string, rootVars: string, rootProvider: string, rootOutputs: string;
  let modNetworking: string, modEc2: string, modRds: string, modAlb: string, modSg: string, modCw: string, modOutputs: string, modUserData: string;

  beforeAll(() => {
    // Read Root Files
    rootMain = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    rootVars = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    rootProvider = fs.readFileSync(path.join(libPath, 'terraform.tf'), 'utf8');
    rootOutputs = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

    // Read Module Files
    modNetworking = fs.readFileSync(path.join(modulePath, 'networking.tf'), 'utf8');
    modEc2 = fs.readFileSync(path.join(modulePath, 'ec2.tf'), 'utf8');
    modRds = fs.readFileSync(path.join(modulePath, 'rds.tf'), 'utf8');
    modAlb = fs.readFileSync(path.join(modulePath, 'alb.tf'), 'utf8');
    modSg = fs.readFileSync(path.join(modulePath, 'security_groups.tf'), 'utf8');
    modCw = fs.readFileSync(path.join(modulePath, 'cloudwatch.tf'), 'utf8');
    modOutputs = fs.readFileSync(path.join(modulePath, 'outputs.tf'), 'utf8');
    modUserData = fs.readFileSync(path.join(modulePath, 'user_data.sh'), 'utf8');
  });

  // ---------------------------------------------------------------------------
  // 1. FILE STRUCTURE & EXISTENCE
  // ---------------------------------------------------------------------------
  describe('1. File Structure & Existence', () => {
    test('All required .tfvars files exist', () => {
      expect(fs.existsSync(path.join(libPath, 'dev.tfvars'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'staging.tfvars'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'prod.tfvars'))).toBe(true);
    });

    test('Module directory structure is correct', () => {
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ROOT CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('2. Root Configuration', () => {
    test('Provider uses AWS 5.x', () => {
      expect(rootProvider).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(rootProvider).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('Main module call passes all required variables', () => {
      const requiredVars = [
        'environment', 'vpc_cidr', 'db_instance_class', 'ec2_instance_type',
        'backup_retention_period', 'rds_cpu_threshold', 'instance_count',
        'db_username', 'db_password', 'ssh_key_name', 'ami_id'
      ];
      requiredVars.forEach(v => {
        expect(rootMain).toMatch(new RegExp(`${v}\\s*=`));
      });
    });

    test('Root variables define validation for environment', () => {
      expect(rootVars).toMatch(/condition\s*=\s*contains\(\["dev", "staging", "prod"\], var\.environment\)/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. NETWORKING MODULE
  // ---------------------------------------------------------------------------
  describe('3. Networking Module', () => {
    test('VPC creation with DNS support', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(modNetworking).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(modNetworking).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Creates 2 Public Subnets', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(modNetworking).toMatch(/count\s*=\s*2/);
      expect(modNetworking).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(modNetworking).toMatch(/Type\s*=\s*"public"/);
    });

    test('Creates 2 Private Subnets', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(modNetworking).toMatch(/count\s*=\s*2/);
      expect(modNetworking).toMatch(/Type\s*=\s*"private"/);
    });

    test('NAT Gateway and EIP are defined', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(modNetworking).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. COMPUTE (EC2) MODULE
  // ---------------------------------------------------------------------------
  describe('4. Compute Module (EC2)', () => {
    test('EC2 instances use private subnets', () => {
      expect(modEc2).toMatch(/subnet_id\s*=\s*local\.private_subnet_ids/);
    });

    test('User Data script is template-injected', () => {
      expect(modEc2).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(modEc2).toMatch(/db_endpoint\s*=\s*aws_db_instance\.main\.endpoint/);
    });

    test('User Data script installs correct packages', () => {
      expect(modUserData).toMatch(/amazon-linux-extras enable postgresql14/);
      expect(modUserData).toMatch(/amazon-linux-extras enable nginx1/);
      expect(modUserData).toMatch(/yum install -y postgresql nginx/);
    });

    test('User Data script configures Nginx health page', () => {
      expect(modUserData).toMatch(/location \/health {/);
      expect(modUserData).toMatch(/return 200 "healthy\\n";/);
    });

    test('IAM Role attached for SSM/CloudWatch', () => {
      expect(modEc2).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(modEc2).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/);
      expect(modEc2).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DATABASE (RDS) MODULE
  // ---------------------------------------------------------------------------
  describe('5. Database Module (RDS)', () => {
    test('RDS engine is PostgreSQL 15', () => {
      expect(modRds).toMatch(/engine\s*=\s*"postgres"/);
      expect(modRds).toMatch(/engine_version\s*=\s*"15\./);
    });

    test('Multi-AZ is environment dependent', () => {
      expect(modRds).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"/);
    });

    test('Storage is encrypted', () => {
      expect(modRds).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('Uses private subnet group', () => {
      expect(modRds).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
      expect(modRds).toMatch(/subnet_ids\s*=\s*local\.private_subnet_ids/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. LOAD BALANCER (ALB) MODULE
  // ---------------------------------------------------------------------------
  describe('6. Load Balancer Module', () => {
    test('ALB is application type and uses security group', () => {
      expect(modAlb).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(modAlb).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('HTTP Listener redirects to HTTPS if cert exists', () => {
      expect(modAlb).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(modAlb).toMatch(/type\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*"redirect"\s*:\s*"forward"/);
    });

    test('Target Group has health check', () => {
      expect(modAlb).toMatch(/health_check\s*{/);
      expect(modAlb).toMatch(/path\s*=\s*"\/health"/);
      expect(modAlb).toMatch(/matcher\s*=\s*"200"/);
    });

    test('Access logs are enabled', () => {
      expect(modAlb).toMatch(/access_logs\s*{/);
      expect(modAlb).toMatch(/enabled\s*=\s*true/);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. SECURITY GROUPS MODULE
  // ---------------------------------------------------------------------------
  describe('7. Security Groups Module', () => {
    test('ALB Security Group allows HTTP/HTTPS from world', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(modSg).toMatch(/from_port\s*=\s*80/);
      expect(modSg).toMatch(/from_port\s*=\s*443/);
      expect(modSg).toMatch(/cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/);
    });

    test('EC2 Security Group allows traffic ONLY from ALB', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(modSg).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('RDS Security Group allows traffic ONLY from EC2', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(modSg).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. CLOUDWATCH & MONITORING
  // ---------------------------------------------------------------------------
  describe('8. CloudWatch & Monitoring', () => {
    test('RDS CPU Alarm is configured', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(modCw).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(modCw).toMatch(/threshold\s*=\s*var\.rds_cpu_threshold/);
    });

    test('ALB Healthy Hosts Alarm is configured', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"/);
      expect(modCw).toMatch(/metric_name\s*=\s*"HealthyHostCount"/);
      expect(modCw).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
    });

    test('Dashboard is created', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. OUTPUTS
  // ---------------------------------------------------------------------------
  describe('9. Outputs', () => {
    test('Root outputs pass through module outputs', () => {
      expect(rootOutputs).toMatch(/value\s*=\s*module\.payment_app\.alb_dns_name/);
      expect(rootOutputs).toMatch(/value\s*=\s*module\.payment_app\.rds_endpoint/);
    });

    test('Module outputs define all critical values', () => {
      expect(modOutputs).toMatch(/output\s+"alb_dns_name"/);
      expect(modOutputs).toMatch(/output\s+"rds_endpoint"/);
      expect(modOutputs).toMatch(/output\s+"ec2_instance_ids"/);
      expect(modOutputs).toMatch(/output\s+"cloudwatch_alarm_arns"/);
    });
  });
});