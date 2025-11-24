// tests/terraform.unit.test.ts
// Unit tests for Terraform configuration - Payment Processing Platform
// These tests validate the Terraform code structure without deployment

import fs from 'fs';
import path from 'path';

describe('Payment Processing Platform - Terraform Unit Tests', () => {
  // Paths
  const libPath = path.join(__dirname, '..', 'lib');
  const modulesPath = path.join(libPath, 'modules');

  // File Contents
  let rootMain: string, rootVars: string, rootProvider: string, rootOutputs: string;
  let networkMain: string, networkVars: string, networkOutputs: string;
  let computeMain: string, computeVars: string, computeOutputs: string;
  let databaseMain: string, databaseVars: string, databaseOutputs: string;
  let storageMain: string, storageVars: string, storageOutputs: string;
  let kmsMain: string, kmsVars: string, kmsOutputs: string;
  let wafMain: string, wafVars: string, wafOutputs: string;
  let devTfvars: string, stagingTfvars: string, prodTfvars: string;

  beforeAll(() => {
    // Load Root Files
    rootMain = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    rootVars = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    rootProvider = fs.readFileSync(path.join(libPath, 'providers.tf'), 'utf8');
    rootOutputs = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

    // Load tfvars files
    devTfvars = fs.readFileSync(path.join(libPath, 'dev.tfvars'), 'utf8');
    stagingTfvars = fs.readFileSync(path.join(libPath, 'staging.tfvars'), 'utf8');
    prodTfvars = fs.readFileSync(path.join(libPath, 'prod.tfvars'), 'utf8');

    // Load Network Module
    networkMain = fs.readFileSync(path.join(modulesPath, 'network', 'main.tf'), 'utf8');
    networkVars = fs.readFileSync(path.join(modulesPath, 'network', 'variables.tf'), 'utf8');
    networkOutputs = fs.readFileSync(path.join(modulesPath, 'network', 'outputs.tf'), 'utf8');

    // Load Compute Module
    computeMain = fs.readFileSync(path.join(modulesPath, 'compute', 'main.tf'), 'utf8');
    computeVars = fs.readFileSync(path.join(modulesPath, 'compute', 'variables.tf'), 'utf8');
    computeOutputs = fs.readFileSync(path.join(modulesPath, 'compute', 'outputs.tf'), 'utf8');

    // Load Database Module
    databaseMain = fs.readFileSync(path.join(modulesPath, 'database', 'main.tf'), 'utf8');
    databaseVars = fs.readFileSync(path.join(modulesPath, 'database', 'variables.tf'), 'utf8');
    databaseOutputs = fs.readFileSync(path.join(modulesPath, 'database', 'outputs.tf'), 'utf8');

    // Load Storage Module
    storageMain = fs.readFileSync(path.join(modulesPath, 'storage', 'main.tf'), 'utf8');
    storageVars = fs.readFileSync(path.join(modulesPath, 'storage', 'variables.tf'), 'utf8');
    storageOutputs = fs.readFileSync(path.join(modulesPath, 'storage', 'outputs.tf'), 'utf8');

    // Load KMS Module
    kmsMain = fs.readFileSync(path.join(modulesPath, 'kms', 'main.tf'), 'utf8');
    kmsVars = fs.readFileSync(path.join(modulesPath, 'kms', 'variables.tf'), 'utf8');
    kmsOutputs = fs.readFileSync(path.join(modulesPath, 'kms', 'outputs.tf'), 'utf8');

    // Load WAF Module
    wafMain = fs.readFileSync(path.join(modulesPath, 'waf', 'main.tf'), 'utf8');
    wafVars = fs.readFileSync(path.join(modulesPath, 'waf', 'variables.tf'), 'utf8');
    wafOutputs = fs.readFileSync(path.join(modulesPath, 'waf', 'outputs.tf'), 'utf8');
  });

  // ---------------------------------------------------------------------------
  // 1. ROOT CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('Root Configuration', () => {
    test('Provider version is pinned to 5.x', () => {
      expect(rootProvider).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(rootProvider).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('Random provider is configured', () => {
      expect(rootProvider).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(rootProvider).toMatch(/version\s*=\s*"~>\s*3\.6"/);
    });

    test('Terraform version is >= 1.5.0', () => {
      expect(rootProvider).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('All modules are called in main.tf', () => {
      expect(rootMain).toMatch(/module\s+"kms"\s*{/);
      expect(rootMain).toMatch(/module\s+"network"\s*{/);
      expect(rootMain).toMatch(/module\s+"storage"\s*{/);
      expect(rootMain).toMatch(/module\s+"compute"\s*{/);
      expect(rootMain).toMatch(/module\s+"database"\s*{/);
      expect(rootMain).toMatch(/module\s+"waf"\s*{/);
    });

    test('pr_number variable exists and is required', () => {
      expect(rootVars).toMatch(/variable\s+"pr_number"\s*{/);
      expect(rootVars).toMatch(/description\s*=\s*"PR number for resource identification/);
    });

    test('Environment-specific configurations exist', () => {
      expect(rootMain).toMatch(/env_config\s*=\s*{/);
      expect(rootMain).toMatch(/dev\s*=\s*{/);
      expect(rootMain).toMatch(/staging\s*=\s*{/);
      expect(rootMain).toMatch(/prod\s*=\s*{/);
    });

    test('Common tags include PRNumber', () => {
      expect(rootMain).toMatch(/PRNumber\s*=\s*var\.pr_number/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TFVARS FILES
  // ---------------------------------------------------------------------------
  describe('Tfvars Files Configuration', () => {
    test('Dev tfvars has pr_number pr7072dev', () => {
      expect(devTfvars).toMatch(/pr_number\s*=\s*"pr7072dev"/);
    });

    test('Staging tfvars has pr_number pr7072stag', () => {
      expect(stagingTfvars).toMatch(/pr_number\s*=\s*"pr7072stag"/);
    });

    test('Prod tfvars has pr_number pr7072prod', () => {
      expect(prodTfvars).toMatch(/pr_number\s*=\s*"pr7072prod"/);
    });

    test('No hardcoded passwords in dev tfvars', () => {
      expect(devTfvars).not.toMatch(/db_password\s*=\s*"[^"]+"/);
      expect(devTfvars).toMatch(/db_password is auto-generated/);
    });

    test('No hardcoded passwords in staging tfvars', () => {
      expect(stagingTfvars).not.toMatch(/db_password\s*=\s*"[^"]+"/);
      expect(stagingTfvars).toMatch(/db_password is auto-generated/);
    });

    test('No hardcoded passwords in prod tfvars', () => {
      expect(prodTfvars).not.toMatch(/db_password\s*=\s*"[^"]+"/);
      expect(prodTfvars).toMatch(/db_password is auto-generated/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. NETWORKING MODULE
  // ---------------------------------------------------------------------------
  describe('Networking Module', () => {
    test('VPC is created with DNS support', () => {
      expect(networkMain).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(networkMain).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(networkMain).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Two public subnets are defined', () => {
      expect(networkMain).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(networkMain).toMatch(/count\s*=\s*2/);
      expect(networkMain).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('Two private subnets are defined', () => {
      expect(networkMain).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(networkMain).toMatch(/count\s*=\s*2/);
    });

    test('NAT Gateway exists', () => {
      expect(networkMain).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(networkMain).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test('Internet Gateway is created', () => {
      expect(networkMain).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('Network ACLs restrict database access', () => {
      expect(networkMain).toMatch(/resource\s+"aws_network_acl"\s+"database"\s*{/);
      expect(networkMain).toMatch(/from_port\s*=\s*5432/);
      expect(networkMain).toMatch(/to_port\s*=\s*5432/);
    });

    test('pr_number variable exists in network module', () => {
      expect(networkVars).toMatch(/variable\s+"pr_number"\s*{/);
    });

    test('Network outputs expose VPC and subnet IDs', () => {
      expect(networkOutputs).toMatch(/output\s+"vpc_id"\s*{/);
      expect(networkOutputs).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(networkOutputs).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. KMS MODULE
  // ---------------------------------------------------------------------------
  describe('KMS Module', () => {
    test('KMS key is created with rotation enabled', () => {
      expect(kmsMain).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(kmsMain).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS deletion window varies by environment', () => {
      expect(kmsMain).toMatch(/deletion_window_in_days\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('KMS alias is created', () => {
      expect(kmsMain).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
    });

    test('KMS key policy allows RDS service', () => {
      expect(kmsMain).toMatch(/Allow RDS to use the key/);
      expect(kmsMain).toMatch(/Service\s*=\s*"rds\.amazonaws\.com"/);
    });

    test('KMS key policy allows S3 service', () => {
      expect(kmsMain).toMatch(/Allow S3 to use the key/);
      expect(kmsMain).toMatch(/Service\s*=\s*"s3\.amazonaws\.com"/);
    });

    test('KMS key policy allows CloudWatch Logs', () => {
      expect(kmsMain).toMatch(/Allow CloudWatch Logs to use the key/);
      expect(kmsMain).toMatch(/logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DATABASE MODULE
  // ---------------------------------------------------------------------------
  describe('Database Module', () => {
    test('Random password is generated', () => {
      expect(databaseMain).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
      expect(databaseMain).toMatch(/length\s*=\s*32/);
      expect(databaseMain).toMatch(/special\s*=\s*true/);
    });

    test('Secrets Manager secret is created', () => {
      expect(databaseMain).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
      expect(databaseMain).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"\s*{/);
    });

    test('Secret recovery window varies by environment', () => {
      expect(databaseMain).toMatch(/recovery_window_in_days\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('RDS instance is PostgreSQL 15.14', () => {
      expect(databaseMain).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(databaseMain).toMatch(/engine\s*=\s*"postgres"/);
      expect(databaseMain).toMatch(/engine_version\s*=\s*"15\.14"/);
    });

    test('RDS storage is encrypted with KMS', () => {
      expect(databaseMain).toMatch(/storage_encrypted\s*=\s*true/);
      expect(databaseMain).toMatch(/kms_key_id\s*=\s*var\.kms_key_arn/);
    });

    test('Multi-AZ is conditional on environment', () => {
      expect(databaseMain).toMatch(/multi_az\s*=\s*var\.multi_az/);
    });

    test('RDS is not publicly accessible', () => {
      expect(databaseMain).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('CloudWatch logs exports enabled', () => {
      expect(databaseMain).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test('Database outputs include secret ARN', () => {
      expect(databaseOutputs).toMatch(/output\s+"db_secret_arn"\s*{/);
      expect(databaseOutputs).toMatch(/output\s+"db_secret_name"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. STORAGE MODULE
  // ---------------------------------------------------------------------------
  describe('Storage Module', () => {
    test('S3 bucket includes pr_number in name', () => {
      expect(storageMain).toMatch(/bucket_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.pr_number\}-transaction-logs/);
    });

    test('S3 versioning is enabled', () => {
      expect(storageMain).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_logs"\s*{/);
      expect(storageMain).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 encryption uses KMS', () => {
      expect(storageMain).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_logs"\s*{/);
      expect(storageMain).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(storageMain).toMatch(/kms_master_key_id\s*=\s*var\.kms_key_arn/);
    });

    test('S3 lifecycle policy has filter', () => {
      expect(storageMain).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"transaction_logs"\s*{/);
      expect(storageMain).toMatch(/filter\s*\{\}/);
    });

    test('S3 lifecycle transitions to STANDARD_IA and GLACIER', () => {
      expect(storageMain).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(storageMain).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('S3 public access is blocked', () => {
      expect(storageMain).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"transaction_logs"\s*{/);
      expect(storageMain).toMatch(/block_public_acls\s*=\s*true/);
      expect(storageMain).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. COMPUTE MODULE (ECS)
  // ---------------------------------------------------------------------------
  describe('Compute Module (ECS)', () => {
    test('CloudWatch log group is created', () => {
      expect(computeMain).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"\s*{/);
      expect(computeMain).toMatch(/retention_in_days\s*=\s*var\.log_retention/);
    });

    test('ECS task execution role is created', () => {
      expect(computeMain).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"\s*{/);
      expect(computeMain).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test('ECS task role is created', () => {
      expect(computeMain).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"\s*{/);
    });

    test('ECS task has S3 access policy', () => {
      expect(computeMain).toMatch(/s3:PutObject/);
      expect(computeMain).toMatch(/s3:GetObject/);
      expect(computeMain).toMatch(/s3:ListBucket/);
    });

    test('ALB is created', () => {
      expect(computeMain).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(computeMain).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB deletion protection enabled for prod', () => {
      expect(computeMain).toMatch(/enable_deletion_protection\s*=\s*var\.environment\s*==\s*"prod"/);
    });

    test('ALB target group has health check', () => {
      expect(computeMain).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
      expect(computeMain).toMatch(/health_check\s*{/);
      expect(computeMain).toMatch(/path\s*=\s*"\/health"/);
    });

    test('HTTP listener forwards or redirects based on certificate', () => {
      expect(computeMain).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
      expect(computeMain).toMatch(/type\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*"redirect"\s*:\s*"forward"/);
    });

    test('ECS cluster is created', () => {
      expect(computeMain).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"\s*{/);
    });

    test('Container Insights conditional on environment', () => {
      expect(computeMain).toMatch(/value\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"enabled"\s*:\s*"disabled"/);
    });

    test('ECS task definition uses Fargate', () => {
      expect(computeMain).toMatch(/resource\s+"aws_ecs_task_definition"\s+"main"\s*{/);
      expect(computeMain).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
      expect(computeMain).toMatch(/network_mode\s*=\s*"awsvpc"/);
    });

    test('ECS task retrieves DB password from Secrets Manager', () => {
      expect(computeMain).toMatch(/secrets\s*=\s*\[/);
      expect(computeMain).toMatch(/valueFrom\s*=\s*"\$\{var\.db_secret_arn\}:password::"/);
    });

    test('ECS task has environment variables', () => {
      expect(computeMain).toMatch(/environment\s*=\s*\[/);
      expect(computeMain).toMatch(/ENVIRONMENT/);
      expect(computeMain).toMatch(/DB_HOST/);
      expect(computeMain).toMatch(/S3_BUCKET/);
      expect(computeMain).toMatch(/AWS_REGION/);
    });

    test('ECS service uses private subnets', () => {
      expect(computeMain).toMatch(/resource\s+"aws_ecs_service"\s+"main"\s*{/);
      expect(computeMain).toMatch(/subnets\s*=\s*var\.private_subnet_ids/);
      expect(computeMain).toMatch(/assign_public_ip\s*=\s*false/);
    });

    test('Auto scaling is configured', () => {
      expect(computeMain).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs"\s*{/);
      expect(computeMain).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"cpu"\s*{/);
      expect(computeMain).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"memory"\s*{/);
    });

    test('Secrets Manager access policy exists', () => {
      expect(computeMain).toMatch(/secretsmanager:GetSecretValue/);
      expect(computeMain).toMatch(/secretsmanager:DescribeSecret/);
    });

    test('Compute outputs include ALB ARN', () => {
      expect(computeOutputs).toMatch(/output\s+"alb_arn"\s*{/);
      expect(computeOutputs).toMatch(/output\s+"alb_dns_name"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. WAF MODULE
  // ---------------------------------------------------------------------------
  describe('WAF Module', () => {
    test('WAF WebACL is created', () => {
      expect(wafMain).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
      expect(wafMain).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test('WAF has rate limiting rule', () => {
      expect(wafMain).toMatch(/RateLimitRule/);
      expect(wafMain).toMatch(/rate_based_statement/);
      expect(wafMain).toMatch(/limit\s*=\s*var\.rate_limit/);
    });

    test('WAF has SQL Injection protection', () => {
      expect(wafMain).toMatch(/SQLiProtection/);
      expect(wafMain).toMatch(/sqli_match_statement/);
      expect(wafMain).toMatch(/all_query_arguments/);
    });

    test('WAF has Cross-Site Scripting protection', () => {
      expect(wafMain).toMatch(/XSSProtection/);
      expect(wafMain).toMatch(/xss_match_statement/);
    });

    test('WAF has text transformations for SQLi and XSS', () => {
      expect(wafMain).toMatch(/text_transformation/);
      expect(wafMain).toMatch(/URL_DECODE/);
      expect(wafMain).toMatch(/HTML_ENTITY_DECODE/);
    });

    test('WAF is associated with ALB', () => {
      expect(wafMain).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"alb"\s*{/);
      expect(wafMain).toMatch(/resource_arn\s*=\s*var\.alb_arn/);
    });

    test('WAF has CloudWatch logging', () => {
      expect(wafMain).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"waf"\s*{/);
      expect(wafMain).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"main"\s*{/);
    });

    test('WAF logs redact sensitive headers', () => {
      expect(wafMain).toMatch(/redacted_fields/);
      expect(wafMain).toMatch(/authorization/);
      expect(wafMain).toMatch(/cookie/);
    });

    test('WAF supports optional geo-blocking', () => {
      expect(wafMain).toMatch(/geo_match_statement/);
      expect(wafMain).toMatch(/country_codes\s*=\s*var\.blocked_countries/);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. SECURITY GROUPS
  // ---------------------------------------------------------------------------
  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS', () => {
      expect(computeMain).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(computeMain).toMatch(/from_port\s*=\s*80/);
      expect(computeMain).toMatch(/from_port\s*=\s*443/);
      expect(computeMain).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('ECS security group allows traffic only from ALB', () => {
      expect(computeMain).toMatch(/resource\s+"aws_security_group"\s+"ecs"\s*{/);
      expect(computeMain).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('RDS security group allows traffic only from ECS', () => {
      expect(databaseMain).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(databaseMain).toMatch(/security_groups\s*=\s*\[var\.app_security_group_id\]/);
      expect(databaseMain).toMatch(/from_port\s*=\s*5432/);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. OUTPUTS
  // ---------------------------------------------------------------------------
  describe('Root Outputs', () => {
    test('All critical outputs are defined', () => {
      expect(rootOutputs).toMatch(/output\s+"alb_dns_name"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"vpc_id"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"s3_bucket_name"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"ecs_cluster_name"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"waf_web_acl_id"\s*{/);
      expect(rootOutputs).toMatch(/output\s+"db_secret_name"\s*{/);
    });

    test('Sensitive outputs are marked as sensitive', () => {
      expect(rootOutputs).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);
      expect(rootOutputs).toMatch(/output\s+"db_secret_arn"[\s\S]*?sensitive\s*=\s*true/);
    });
  });
});
