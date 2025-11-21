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
      expect(modUserData).toMatch(/yum install -y postgresql nginx amazon-cloudwatch-agent python3 python3-pip/);
    });

    test('Configures Nginx for Health Checks', () => {
      expect(modUserData).toMatch(/location \/ {/);
      expect(modUserData).toMatch(/proxy_pass http:\/\/127\.0\.0\.1:8080;/);
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

  // ---------------------------------------------------------------------------
  // 10. KMS ENCRYPTION
  // ---------------------------------------------------------------------------
  describe('KMS Encryption', () => {
    test('KMS key is created with rotation enabled', () => {
      expect(modKms).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(modKms).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS deletion window varies by environment', () => {
      expect(modKms).toMatch(/deletion_window_in_days\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('KMS alias is created', () => {
      expect(modKms).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(modKms).toMatch(/name\s*=\s*"alias\/payment-app-\$\{var\.pr_number\}"/);
    });

    test('KMS key policy allows EC2 role access', () => {
      expect(modKms).toMatch(/Principal\s*=\s*{\s*AWS\s*=\s*aws_iam_role\.ec2\.arn/);
      expect(modKms).toMatch(/kms:Decrypt/);
      expect(modKms).toMatch(/kms:GenerateDataKey/);
    });

    test('KMS key policy allows RDS service access', () => {
      expect(modKms).toMatch(/Principal\s*=\s*{\s*Service\s*=\s*"rds\.amazonaws\.com"/);
    });

    test('KMS key policy allows S3 service access', () => {
      expect(modKms).toMatch(/Principal\s*=\s*{\s*Service\s*=\s*"s3\.amazonaws\.com"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. S3 BUCKET FOR ALB LOGS
  // ---------------------------------------------------------------------------
  describe('S3 Bucket for ALB Logs', () => {
    test('S3 bucket is created for ALB logs', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"\s*{/);
    });

    test('S3 bucket versioning is enabled', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"alb_logs"\s*{/);
      expect(modAlb).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket encryption uses AES256', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"alb_logs"\s*{/);
      expect(modAlb).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('S3 bucket has lifecycle policy with transitions', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"alb_logs"\s*{/);
      expect(modAlb).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(modAlb).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('S3 bucket blocks public access', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"alb_logs"\s*{/);
      expect(modAlb).toMatch(/block_public_acls\s*=\s*true/);
      expect(modAlb).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('S3 bucket policy allows ELB service account', () => {
      expect(modAlb).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"\s*{/);
      expect(modAlb).toMatch(/data\.aws_elb_service_account\.main\.arn/);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. ALB ADVANCED CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('ALB Advanced Configuration', () => {
    test('ALB deletion protection enabled for prod', () => {
      expect(modAlb).toMatch(/enable_deletion_protection\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test('ALB enables HTTP/2 and cross-zone load balancing', () => {
      expect(modAlb).toMatch(/enable_http2\s*=\s*true/);
      expect(modAlb).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test('Target group has stickiness enabled', () => {
      expect(modAlb).toMatch(/stickiness\s*{/);
      expect(modAlb).toMatch(/type\s*=\s*"lb_cookie"/);
      expect(modAlb).toMatch(/enabled\s*=\s*true/);
    });

    test('Deregistration delay varies by environment', () => {
      expect(modAlb).toMatch(/deregistration_delay\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*300\s*:\s*30/);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. NETWORKING ADVANCED
  // ---------------------------------------------------------------------------
  describe('Networking Advanced', () => {
    test('Internet Gateway is created', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('Route tables are defined for public and private', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(modNetworking).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test('Public route table routes to Internet Gateway', () => {
      expect(modNetworking).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('Private route table routes to NAT Gateway', () => {
      expect(modNetworking).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
    });

    test('Route table associations exist for subnets', () => {
      expect(modNetworking).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(modNetworking).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. EC2 IAM POLICIES
  // ---------------------------------------------------------------------------
  describe('EC2 IAM Policies', () => {
    test('EC2 has KMS policy for encryption', () => {
      expect(modEc2).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_kms"\s*{/);
      expect(modEc2).toMatch(/kms:Decrypt/);
      expect(modEc2).toMatch(/kms:Encrypt/);
    });

    test('EC2 has Secrets Manager policy', () => {
      expect(modEc2).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_secrets"\s*{/);
      expect(modEc2).toMatch(/secretsmanager:GetSecretValue/);
    });

    test('EC2 Instance Profile is created', () => {
      expect(modEc2).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 15. RDS ADVANCED CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('RDS Advanced Configuration', () => {
    test('RDS DB Subnet Group is created', () => {
      expect(modRds).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test('RDS uses PostgreSQL version 15.14', () => {
      expect(modRds).toMatch(/engine_version\s*=\s*"15\.14"/);
    });

    test('RDS storage size varies by environment', () => {
      expect(modRds).toMatch(/allocated_storage\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*100\s*:\s*20/);
    });

    test('RDS storage type varies by environment', () => {
      expect(modRds).toMatch(/storage_type\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"gp3"\s*:\s*"gp2"/);
    });

    test('RDS uses KMS for encryption', () => {
      expect(modRds).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('RDS has backup window configured', () => {
      expect(modRds).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(modRds).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test('RDS skip final snapshot only in dev', () => {
      expect(modRds).toMatch(/skip_final_snapshot\s*=\s*var\.environment\s*==\s*"dev"\s*\?\s*true\s*:\s*false/);
    });

    test('RDS Performance Insights enabled for prod', () => {
      expect(modRds).toMatch(/performance_insights_enabled\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test('RDS auto minor version upgrade disabled for prod', () => {
      expect(modRds).toMatch(/auto_minor_version_upgrade\s*=\s*var\.environment\s*!=\s*"prod"/);
    });

    test('RDS CloudWatch logs exports conditional', () => {
      expect(modRds).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*var\.environment\s*!=\s*"dev"\s*\?\s*\["postgresql"\]\s*:\s*\[\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 16. CLOUDWATCH ALARMS ADVANCED
  // ---------------------------------------------------------------------------
  describe('CloudWatch Alarms Advanced', () => {
    test('SNS Topic subscription for email alerts', () => {
      expect(modCw).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*{/);
      expect(modCw).toMatch(/protocol\s*=\s*"email"/);
    });

    test('RDS Storage alarm is defined', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"\s*{/);
      expect(modCw).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
    });

    test('EC2 CPU alarm is defined with count', () => {
      expect(modCw).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu"\s*{/);
      expect(modCw).toMatch(/count\s*=\s*var\.instance_count/);
    });

    test('ALB healthy hosts alarm treats missing data as breaching', () => {
      expect(modCw).toMatch(/treat_missing_data\s*=\s*"breaching"/);
    });

    test('ALB healthy hosts threshold is 50% of instances', () => {
      expect(modCw).toMatch(/threshold\s*=\s*var\.instance_count\s*\*\s*0\.5/);
    });
  });

  // ---------------------------------------------------------------------------
  // 17. SECRETS MANAGER
  // ---------------------------------------------------------------------------
  describe('Secrets Manager', () => {
    test('Secrets Manager secret created for DB password', () => {
      expect(modRds).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
    });

    test('Secret recovery window varies by environment', () => {
      expect(modRds).toMatch(/recovery_window_in_days\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('Secret version stores database connection details', () => {
      expect(modRds).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"\s*{/);
      expect(modRds).toMatch(/username/);
      expect(modRds).toMatch(/password/);
      expect(modRds).toMatch(/engine/);
    });
  });
});