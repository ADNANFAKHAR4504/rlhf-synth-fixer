import fs from 'fs';
import path from 'path';

describe('Payment App Infrastructure - Static Unit Tests', () => {
  // Paths
  const libPath = path.join(__dirname, '..', 'lib');
  const modulePath = path.join(libPath, 'modules', 'payment-app');

  // File Contents
  let rootMain: string, rootVars: string, rootProvider: string, rootOutputs: string;
  let modNetworking: string, modEc2: string, modRds: string, modAlb: string;
  let modSg: string, modCw: string, modKeys: string, modKms: string;
  let modOutputs: string, modUserData: string;

  beforeAll(() => {
    // Load Root Files
    rootMain = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    rootVars = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    rootProvider = fs.readFileSync(path.join(libPath, 'terraform.tf'), 'utf8');
    rootOutputs = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

    // Load Module Files
    modNetworking = fs.readFileSync(path.join(modulePath, 'networking.tf'), 'utf8');
    modEc2 = fs.readFileSync(path.join(modulePath, 'ec2.tf'), 'utf8');
    modRds = fs.readFileSync(path.join(modulePath, 'rds.tf'), 'utf8');
    modAlb = fs.readFileSync(path.join(modulePath, 'alb.tf'), 'utf8');
    modSg = fs.readFileSync(path.join(modulePath, 'security_groups.tf'), 'utf8');
    modCw = fs.readFileSync(path.join(modulePath, 'cloudwatch.tf'), 'utf8');
    modKeys = fs.readFileSync(path.join(modulePath, 'keys.tf'), 'utf8');
    modKms = fs.readFileSync(path.join(modulePath, 'kms.tf'), 'utf8');
    modOutputs = fs.readFileSync(path.join(modulePath, 'outputs.tf'), 'utf8');
    modUserData = fs.readFileSync(path.join(modulePath, 'user_data.sh'), 'utf8');
  });

  // ---------------------------------------------------------------------------
  // 1. ROOT CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('Root Configuration', () => {
    test('Provider version is pinned to 5.x', () => {
      expect(rootProvider).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(rootProvider).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('S3 Backend is configured', () => {
      expect(rootProvider).toMatch(/backend\s+"s3"\s*{/);
    });

    test('Main module is called with correct source', () => {
      expect(rootMain).toMatch(/module\s+"payment_app"\s*{/);
      expect(rootMain).toMatch(/source\s*=\s*"\.\/modules\/payment-app"/);
    });

    test('Environment variable validation exists', () => {
      expect(rootVars).toMatch(/variable\s+"environment"\s*{/);
      expect(rootVars).toMatch(/condition\s*=\s*contains\(\["dev", "staging", "prod"\], var\.environment\)/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. NETWORKING (VPC & Subnets)
  // ---------------------------------------------------------------------------
  describe('Networking Module', () => {
    test('VPC is created with DNS support', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(modNetworking).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('Public Subnets are defined', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(modNetworking).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('Private Subnets are defined', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test('NAT Gateway is created for private access', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(modNetworking).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. COMPUTE (EC2 & Keys)
  // ---------------------------------------------------------------------------
  describe('Compute Module', () => {
    test('EC2 instances are defined', () => {
      expect(modEc2).toMatch(/resource\s+"aws_instance"\s+"app"\s*{/);
    });

    test('IAM Role and Instance Profile are attached', () => {
      expect(modEc2).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*{/);
      expect(modEc2).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2\.name/);
    });

    test('SSM and CloudWatch policies are attached', () => {
      expect(modEc2).toMatch(/arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore/);
      expect(modEc2).toMatch(/arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy/);
    });

    test('SSH Keys are generated if name is empty', () => {
      expect(modKeys).toMatch(/resource\s+"tls_private_key"\s+"generated"\s*{/);
      expect(modKeys).toMatch(/resource\s+"aws_key_pair"\s+"generated"\s*{/);
      expect(modKeys).toMatch(/resource\s+"aws_ssm_parameter"\s+"private_key"\s*{/);
    });

    test('User Data script template is used', () => {
      expect(modEc2).toMatch(/templatefile\("\$\{path\.module\}\/user_data\.sh"/);
      expect(modEc2).toMatch(/secret_name\s*=\s*aws_secretsmanager_secret\.db_password\.name/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. DATABASE (RDS)
  // ---------------------------------------------------------------------------
  describe('Database Module', () => {
    test('RDS Password is random and stored in Secrets Manager', () => {
      expect(modRds).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
      expect(modRds).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
    });

    test('RDS Instance is PostgreSQL', () => {
      expect(modRds).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(modRds).toMatch(/engine\s*=\s*"postgres"/);
      expect(modRds).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('Multi-AZ is conditional on environment', () => {
      expect(modRds).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"/);
    });

    test('Monitoring Role is created only for prod', () => {
      expect(modRds).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*{/);
      expect(modRds).toMatch(/count\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*1\s*:\s*0/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. LOAD BALANCER (ALB)
  // ---------------------------------------------------------------------------
  describe('ALB Module', () => {
    test('ALB is defined with S3 access logs', () => {
      expect(modAlb).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(modAlb).toMatch(/access_logs\s*{/);
      expect(modAlb).toMatch(/bucket\s*=\s*aws_s3_bucket\.alb_logs\.id/);
    });

    test('HTTP Listener redirects to HTTPS if certificate exists', () => {
      expect(modAlb).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
      expect(modAlb).toMatch(/type\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*"redirect"\s*:\s*"forward"/);
    });

    test('HTTPS Listener is conditional', () => {
      expect(modAlb).toMatch(/resource\s+"aws_lb_listener"\s+"https"\s*{/);
      expect(modAlb).toMatch(/count\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('Target Group Health Check matches 200', () => {
      expect(modAlb).toMatch(/matcher\s*=\s*"200"/);
      expect(modAlb).toMatch(/path\s*=\s*"\/health"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. SECURITY GROUPS
  // ---------------------------------------------------------------------------
  describe('Security Groups', () => {
    test('ALB SG allows HTTP/HTTPS from everywhere', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(modSg).toMatch(/from_port\s*=\s*80/);
      expect(modSg).toMatch(/from_port\s*=\s*443/);
      expect(modSg).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('EC2 SG allows traffic ONLY from ALB', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
      expect(modSg).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('RDS SG allows traffic ONLY from EC2', () => {
      expect(modSg).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(modSg).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. MONITORING (CloudWatch)
  // ---------------------------------------------------------------------------
  describe('CloudWatch Module', () => {
    test('SNS Topic is created', () => {
      expect(modCw).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"\s*{/);
    });

    test('RDS CPU Alarm uses variable threshold', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
      expect(modCw).toMatch(/threshold\s*=\s*var\.rds_cpu_threshold/);
    });

    test('ALB Healthy Host Alarm is defined', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"\s*{/);
      expect(modCw).toMatch(/metric_name\s*=\s*"HealthyHostCount"/);
    });

    test('Dashboard is created', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. USER DATA SCRIPT
  // ---------------------------------------------------------------------------
  describe('User Data Script', () => {
    test('Installs Amazon Linux Extras packages', () => {
      expect(modUserData).toMatch(/amazon-linux-extras enable postgresql14/);
      expect(modUserData).toMatch(/amazon-linux-extras enable nginx1/);
    });

    test('Installs CloudWatch Agent', () => {
      expect(modUserData).toMatch(/yum install -y .*amazon-cloudwatch-agent/);
    });

    test('Configures Nginx for Health Checks', () => {
      expect(modUserData).toMatch(/location \/health {/);
      expect(modUserData).toMatch(/return 200 "healthy\\n";/);
    });

    test('Creates Helper Script for DB Credentials', () => {
      expect(modUserData).toMatch(/cat > \/usr\/local\/bin\/get-db-credentials/);
      expect(modUserData).toMatch(/aws secretsmanager get-secret-value/);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. OUTPUTS
  // ---------------------------------------------------------------------------
  describe('Outputs', () => {
    test('Root outputs expose module values', () => {
      expect(rootOutputs).toMatch(/value\s*=\s*module\.payment_app\.alb_dns_name/);
      expect(rootOutputs).toMatch(/value\s*=\s*module\.payment_app\.rds_endpoint/);
    });

    test('Module outputs expose critical resources', () => {
      expect(modOutputs).toMatch(/output\s+"alb_dns_name"/);
      expect(modOutputs).toMatch(/output\s+"rds_endpoint"/);
      expect(modOutputs).toMatch(/output\s+"db_credentials_secret_arn"/);
      expect(modOutputs).toMatch(/output\s+"cloudwatch_alarm_arns"/);
    });
  });
});