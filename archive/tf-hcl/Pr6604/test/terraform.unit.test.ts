// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for Terraform payment processing infrastructure
// Tests structure, configuration, and security compliance without deployment

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");

describe("Terraform Payment Processing Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
  });

  // ==================== FILE EXISTENCE TESTS ====================
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("lambda.zip exists for deployment", () => {
      const lambdaZipPath = path.resolve(__dirname, "../lib/lambda.zip");
      expect(fs.existsSync(lambdaZipPath)).toBe(true);
    });
  });

  // ==================== PROVIDER CONFIGURATION TESTS ====================
  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider with correct version", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("provider includes region mapping and backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
      expect(providerContent).toMatch(/region_map\s*=\s*{/);
      expect(providerContent).toMatch(/dev\s*=\s*"eu-west-1"/);
      expect(providerContent).toMatch(/staging\s*=\s*"us-west-2"/);
      expect(providerContent).toMatch(/prod\s*=\s*"us-east-1"/);
    });

    test("provider does NOT appear in tap_stack.tf (separated properly)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });

    test("provider has proper default tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
    });
  });

  // ==================== VARIABLES CONFIGURATION TESTS ====================
  describe("Variables Configuration", () => {
    test("environment variable has proper validation", () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("all required variables are defined", () => {
      const requiredVars = [
        "environment", "cost_center", "data_classification", 
        "container_image", "lambda_source_path", "repository",
        "commit_author", "pr_number", "team"
      ];
      
      requiredVars.forEach(varName => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("security-sensitive variables have appropriate defaults", () => {
      expect(variablesContent).toMatch(/data_classification[\s\S]*"confidential"/);
      expect(variablesContent).toMatch(/cost_center[\s\S]*"FINTECH-001"/);
    });
  });

  // ==================== LOCALS AND MAPPINGS TESTS ====================
  describe("Locals and Environment Mappings", () => {
    test("environment code mapping is correctly defined", () => {
      expect(stackContent).toMatch(/env_code_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*1/);
      expect(stackContent).toMatch(/staging\s*=\s*2/);
      expect(stackContent).toMatch(/prod\s*=\s*3/);
    });

    test("RDS instance size mapping follows requirements", () => {
      expect(stackContent).toMatch(/rds_instance_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*"db\.t3\.micro"/);
      expect(stackContent).toMatch(/staging\s*=\s*"db\.t3\.small"/);
      expect(stackContent).toMatch(/prod\s*=\s*"db\.t3\.medium"/);
    });

    test("ECS task count mapping is environment-appropriate", () => {
      expect(stackContent).toMatch(/ecs_task_count_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*1/);
      expect(stackContent).toMatch(/staging\s*=\s*2/);
      expect(stackContent).toMatch(/prod\s*=\s*4/);
    });

    test("Lambda concurrency mapping scales properly", () => {
      expect(stackContent).toMatch(/lambda_concurrency_map\s*=\s*{/);
      expect(stackContent).toMatch(/dev\s*=\s*10/);
      expect(stackContent).toMatch(/staging\s*=\s*50/);
      expect(stackContent).toMatch(/prod\s*=\s*200/);
    });

    test("CloudWatch alarm thresholds are environment-tuned", () => {
      expect(stackContent).toMatch(/alarm_thresholds\s*=\s*{/);
      expect(stackContent).toMatch(/dev[\s\S]*cpu_high\s*=\s*80/);
      expect(stackContent).toMatch(/staging[\s\S]*cpu_high\s*=\s*75/);
      expect(stackContent).toMatch(/prod[\s\S]*cpu_high\s*=\s*70/);
    });
  });

  // ==================== VPC AND NETWORKING TESTS ====================
  describe("VPC and Networking Resources", () => {
    test("VPC is defined with environment-specific CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC CIDR calculation uses environment code", () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.\$\{local\.env_code\}\.0\.0\/16"/);
    });

    test("Internet Gateway is properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("Public subnets are created across 3 AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("Private subnets are created across 3 AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.\$\{local\.env_code\}\.\$\{count\.index \+ 10\}\.0\/24"/);
    });

    test("NAT Gateways provide HA with 1 per AZ", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("Route tables are properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("VPC endpoints for S3 and DynamoDB are configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{data\.aws_region\.current\.name\}\.s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{data\.aws_region\.current\.name\}\.dynamodb"/);
    });
  });

  // ==================== SECURITY GROUPS TESTS ====================
  describe("Security Groups", () => {
    test("ALB security group allows HTTPS and HTTP", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("ECS tasks security group restricts access to ALB only", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
      expect(stackContent).toMatch(/from_port\s*=\s*8080/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("RDS security group allows PostgreSQL from ECS and Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*5432/);
      expect(stackContent).toMatch(/to_port\s*=\s*5432/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ecs_tasks\.id,\s*aws_security_group\.lambda\.id\]/);
    });

    test("Lambda security group allows outbound traffic", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
      expect(stackContent).toMatch(/egress\s*{/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
    });
  });

  // ==================== IAM ROLES TESTS ====================
  describe("IAM Roles and Policies", () => {
    test("ECS task execution role follows naming convention", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-ECS-TaskExecution-Role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test("ECS task role has required permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-ECS-Task-Role"/);
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:GetObject/);
    });

    test("Lambda execution role follows naming convention", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-Lambda-PaymentValidation-Role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("Secrets rotation role is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"secrets_rotation"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-SecretsManager-Rotation-Role"/);
    });
  });

  // ==================== SECRETS MANAGER TESTS ====================
  describe("Secrets Manager", () => {
    test("Database credentials secret is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-payment-db-credentials"/);
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("API keys secret is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"api_keys"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-payment-api-keys"/);
    });

    test("Secret rotation is configured for 30 days", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"/);
      expect(stackContent).toMatch(/automatically_after_days\s*=\s*30/);
    });

    test("Random passwords are properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"api_key"/);
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"webhook_secret"/);
      expect(stackContent).toMatch(/length\s*=\s*32/);
    });
  });

  // ==================== RDS TESTS ====================
  describe("RDS PostgreSQL Configuration", () => {
    test("RDS instance uses required PostgreSQL version", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"14\.7"/);
    });

    test("RDS instance class uses environment mapping", () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*local\.rds_instance_map\[var\.environment\]/);
    });

    test("RDS has proper security configuration", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test("RDS Multi-AZ is production-only", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test("RDS backup configuration is appropriate", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test("DB subnet group uses private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  // ==================== APPLICATION LOAD BALANCER TESTS ====================
  describe("Application Load Balancer", () => {
    test("ALB is properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("Target group has proper health checks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(stackContent).toMatch(/port\s*=\s*8080/);
      expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test("HTTP listener redirects to HTTPS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/type\s*=\s*"redirect"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });

    test("HTTPS listener is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(stackContent).toMatch(/port\s*=\s*"443"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });

    test("ACM certificate is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
      expect(stackContent).toMatch(/domain_name\s*=\s*var\.domain_name/);
    });
  });

  // ==================== ECS FARGATE TESTS ====================
  describe("ECS Fargate Configuration", () => {
    test("ECS cluster has container insights enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-payment-cluster"/);
      expect(stackContent).toMatch(/containerInsights/);
      expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
    });

    test("ECS task definition uses environment mappings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"main"/);
      expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
      expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
      expect(stackContent).toMatch(/cpu\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"1024"\s*:\s*"512"/);
      expect(stackContent).toMatch(/memory\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"2048"\s*:\s*"1024"/);
    });

    test("ECS service uses proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"main"/);
      expect(stackContent).toMatch(/desired_count\s*=\s*local\.ecs_task_count_map\[var\.environment\]/);
      expect(stackContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
    });

    test("ECS service has load balancer configuration", () => {
      expect(stackContent).toMatch(/load_balancer\s*{/);
      expect(stackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
      expect(stackContent).toMatch(/container_name\s*=\s*"payment-processor"/);
      expect(stackContent).toMatch(/container_port\s*=\s*8080/);
    });
  });

  // ==================== LAMBDA FUNCTIONS TESTS ====================
  describe("Lambda Functions", () => {
    test("Payment validation Lambda is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_validation"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{var\.environment\}-payment-validation"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(stackContent).toMatch(/handler\s*=\s*"lambda\.handler"/);
    });

    test("Lambda reserved concurrency uses environment mapping", () => {
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*local\.lambda_concurrency_map\[var\.environment\]/);
    });

    test("Secrets rotation Lambda is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"secrets_rotation"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{var\.environment\}-secrets-rotation"/);
    });

    test("Lambda permissions are configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"secrets_rotation"/);
      expect(stackContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(stackContent).toMatch(/principal\s*=\s*"secretsmanager\.amazonaws\.com"/);
    });
  });

  // ==================== S3 BUCKET TESTS ====================
  describe("S3 Bucket Configuration", () => {
    test("Payment logs bucket is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"payment_logs"/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{data\.aws_caller_identity\.current\.account_id\}-\$\{var\.environment\}-payment-logs"/);
    });

    test("S3 bucket has AES-256 encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"payment_logs"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("S3 bucket blocks public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"payment_logs"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 lifecycle policy transitions to Glacier after 90 days", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"payment_logs"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });
  });

  // ==================== CLOUDWATCH TESTS ====================
  describe("CloudWatch Configuration", () => {
    test("CloudWatch log groups have 30-day retention", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("CloudWatch dashboard includes all required metrics", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      expect(stackContent).toMatch(/AWS\/ECS.*CPUUtilization/);
      expect(stackContent).toMatch(/AWS\/RDS.*CPUUtilization/);
      expect(stackContent).toMatch(/AWS\/Lambda.*Invocations/);
      expect(stackContent).toMatch(/AWS\/ApplicationELB.*TargetResponseTime/);
    });

    test("CloudWatch alarms use environment-specific thresholds", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(stackContent).toMatch(/threshold\s*=\s*local\.alarm_thresholds\[var\.environment\]/);
    });
  });

  // ==================== OUTPUTS TESTS ====================
  describe("Outputs Configuration", () => {
    test("all required outputs are defined", () => {
      const requiredOutputs = [
        "vpc_id", "public_subnet_ids", "private_subnet_ids",
        "alb_dns_name", "alb_arn", "ecs_cluster_arn", "ecs_service_name",
        "rds_endpoint", "rds_arn", "db_secret_arn", "api_keys_secret_arn",
        "s3_bucket_arn", "s3_bucket_name", "lambda_function_arn",
        "cloudwatch_dashboard_url"
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*{`));
      });
    });

    test("critical outputs have proper descriptions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{[\s\S]*description\s*=\s*"VPC ID"/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{[\s\S]*description\s*=\s*"RDS instance endpoint"/);
      expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{[\s\S]*description\s*=\s*"ALB DNS name"/);
    });
  });

  // ==================== SECURITY COMPLIANCE TESTS ====================
  describe("Security Compliance", () => {
    test("no hardcoded secrets or credentials", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*[a-zA-Z0-9]/);
      expect(stackContent).not.toMatch(/secret_key\s*=\s*"[^"]*[a-zA-Z0-9]/);
      expect(stackContent).not.toMatch(/access_key\s*=\s*"[^"]*[a-zA-Z0-9]/);
    });

    test("deletion protection is explicitly disabled as required", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("proper tagging is enforced", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(stackContent).toMatch(/DataClassification\s*=\s*var\.data_classification/);
    });

    test("security groups follow least privilege principle", () => {
      // ALB should only allow 80/443
      const albSection = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?^}/m)?.[0] || "";
      expect(albSection).toMatch(/from_port\s*=\s*443/);
      expect(albSection).toMatch(/from_port\s*=\s*80/);
      
      // ECS should only allow from ALB
      const ecsSection = stackContent.match(/resource\s+"aws_security_group"\s+"ecs_tasks"[\s\S]*?^}/m)?.[0] || "";
      expect(ecsSection).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });
  });

  // ==================== ENVIRONMENT-SPECIFIC TESTS ====================
  describe("Environment-Specific Configuration", () => {
    test("CIDR blocks use environment codes correctly", () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.\$\{local\.env_code\}\.0\.0\/16"/);
      // Dev should be 10.1.0.0/16, Staging 10.2.0.0/16, Prod 10.3.0.0/16
    });

    test("resource sizing scales appropriately by environment", () => {
      // Verify mappings exist and are logical
      expect(stackContent).toMatch(/dev\s*=\s*"db\.t3\.micro"/);
      expect(stackContent).toMatch(/prod\s*=\s*"db\.t3\.medium"/);
      expect(stackContent).toMatch(/dev\s*=\s*1[\s\S]*staging\s*=\s*2[\s\S]*prod\s*=\s*4/);
    });

    test("alarm thresholds are more permissive in dev, strict in prod", () => {
      expect(stackContent).toMatch(/dev[\s\S]*cpu_high\s*=\s*80[\s\S]*prod[\s\S]*cpu_high\s*=\s*70/);
      expect(stackContent).toMatch(/dev[\s\S]*error_rate\s*=\s*10[\s\S]*prod[\s\S]*error_rate\s*=\s*1/);
    });
  });

  // ==================== DATA SOURCES TESTS ====================
  describe("Data Sources", () => {
    test("availability zones data source limits to available zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("current region and caller identity data sources are defined", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  // ==================== ADVANCED VPC TESTS ====================
  describe("Advanced VPC Configuration", () => {
    test("public subnets have correct CIDR calculation", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.\$\{local\.env_code\}\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test("private subnets have correct CIDR calculation", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.\$\{local\.env_code\}\.\$\{count\.index \+ 10\}\.0\/24"/);
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("internet gateway is attached to VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("NAT gateways depend on internet gateway", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("EIP allocation for NAT gateways", () => {
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test("route table associations are properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test("VPC endpoints have proper route table configuration", () => {
      expect(stackContent).toMatch(/route_table_ids\s*=\s*concat\(\[aws_route_table\.public\.id\], aws_route_table\.private\[\*\]\.id\)/);
    });
  });

  // ==================== DETAILED SECURITY GROUP TESTS ====================
  describe("Detailed Security Group Configuration", () => {
    test("ALB security group has proper egress rules", () => {
      expect(stackContent).toMatch(/egress\s*{[\s\S]*from_port\s*=\s*0[\s\S]*to_port\s*=\s*0/);
    });

    test("ECS security group allows traffic only from ALB", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*8080[\s\S]*to_port\s*=\s*8080/);
    });

    test("RDS security group allows PostgreSQL port", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/);
    });

    test("security groups have descriptive names", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-alb-sg"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-ecs-tasks-sg"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-rds-sg"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.environment\}-lambda-sg"/);
    });

    test("security groups have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Application Load Balancer"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for ECS tasks"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for RDS database"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Lambda functions"/);
    });

    test("ingress rules have descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"HTTPS from Internet"/);
      expect(stackContent).toMatch(/description\s*=\s*"HTTP from Internet \(redirect to HTTPS\)"/);
      expect(stackContent).toMatch(/description\s*=\s*"Traffic from ALB"/);
    });
  });

  // ==================== ADVANCED IAM TESTS ====================
  describe("Advanced IAM Configuration", () => {
    test("ECS task execution role has proper trust policy", () => {
      expect(stackContent).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test("Lambda execution role has proper trust policy", () => {
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("IAM policies use least privilege principle", () => {
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/secretsmanager:DescribeSecret/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:GetObject/);
    });

    test("Lambda VPC access permissions", () => {
      expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
      expect(stackContent).toMatch(/ec2:DescribeNetworkInterfaces/);
      expect(stackContent).toMatch(/ec2:DeleteNetworkInterface/);
    });

    test("CloudWatch logs permissions", () => {
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("IAM role policy attachments", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AmazonECSTaskExecutionRolePolicy"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWSLambdaVPCAccessExecutionRole"/);
    });
  });

  // ==================== SECRETS MANAGER DETAILED TESTS ====================
  describe("Secrets Manager Detailed Configuration", () => {
    test("secrets have proper recovery window", () => {
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("database secret contains all required fields", () => {
      expect(stackContent).toMatch(/username\s*=\s*"paymentadmin"/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(stackContent).toMatch(/port\s*=\s*5432/);
      expect(stackContent).toMatch(/dbname\s*=\s*"paymentdb"/);
    });

    test("API keys secret structure", () => {
      expect(stackContent).toMatch(/payment_gateway_key/);
      expect(stackContent).toMatch(/webhook_signing_secret/);
    });

    test("random passwords have proper configuration", () => {
      expect(stackContent).toMatch(/length\s*=\s*32/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
      expect(stackContent).toMatch(/special\s*=\s*false/);
    });

    test("secret rotation references correct Lambda", () => {
      expect(stackContent).toMatch(/rotation_lambda_arn\s*=\s*aws_lambda_function\.secrets_rotation\.arn/);
    });
  });

  // ==================== RDS DETAILED CONFIGURATION TESTS ====================
  describe("RDS Detailed Configuration", () => {
    test("RDS uses proper storage configuration", () => {
      expect(stackContent).toMatch(/allocated_storage\s*=\s*20/);
      expect(stackContent).toMatch(/max_allocated_storage\s*=\s*100/);
      expect(stackContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test("RDS backup configuration varies by environment", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test("RDS maintenance and backup windows", () => {
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(stackContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS performance insights for production", () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test("RDS database credentials", () => {
      expect(stackContent).toMatch(/username\s*=\s*"paymentadmin"/);
      expect(stackContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test("RDS skip final snapshot for demo", () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });
  });

  // ==================== ALB DETAILED TESTS ====================
  describe("ALB Detailed Configuration", () => {
    test("ALB has proper load balancer features", () => {
      expect(stackContent).toMatch(/enable_http2\s*=\s*true/);
      expect(stackContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test("target group health check configuration", () => {
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/unhealthy_threshold\s*=\s*3/);
      expect(stackContent).toMatch(/timeout\s*=\s*30/);
      expect(stackContent).toMatch(/interval\s*=\s*60/);
    });

    test("target group deregistration delay", () => {
      expect(stackContent).toMatch(/deregistration_delay\s*=\s*30/);
    });

    test("SSL policy configuration", () => {
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });

    test("certificate validation method", () => {
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("certificate lifecycle management", () => {
      expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true/);
    });
  });

  // ==================== ECS DETAILED TESTS ====================
  describe("ECS Detailed Configuration", () => {
    test("ECS cluster has container insights", () => {
      expect(stackContent).toMatch(/name\s*=\s*"containerInsights"/);
      expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
    });

    test("ECS task definition family naming", () => {
      expect(stackContent).toMatch(/family\s*=\s*"\$\{var\.environment\}-payment-task"/);
    });

    test("ECS task definition network mode", () => {
      expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
    });

    test("ECS container port mappings", () => {
      expect(stackContent).toMatch(/containerPort\s*=\s*8080/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("ECS container environment variables", () => {
      expect(stackContent).toMatch(/name\s*=\s*"ENVIRONMENT"/);
      expect(stackContent).toMatch(/name\s*=\s*"AWS_REGION"/);
      expect(stackContent).toMatch(/name\s*=\s*"LOG_LEVEL"/);
    });

    test("ECS container secrets configuration", () => {
      expect(stackContent).toMatch(/name\s*=\s*"DB_CONNECTION"/);
      expect(stackContent).toMatch(/name\s*=\s*"API_KEYS"/);
    });

    test("ECS container health check", () => {
      expect(stackContent).toMatch(/healthCheck\s*=\s*{/);
      expect(stackContent).toMatch(/command\s*=\s*\["CMD-SHELL"/);
      expect(stackContent).toMatch(/interval\s*=\s*30/);
      expect(stackContent).toMatch(/timeout\s*=\s*5/);
      expect(stackContent).toMatch(/retries\s*=\s*3/);
      expect(stackContent).toMatch(/startPeriod\s*=\s*60/);
    });

    test("ECS service network configuration", () => {
      expect(stackContent).toMatch(/assign_public_ip\s*=\s*false/);
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("ECS service dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_lb_listener\.https/);
      expect(stackContent).toMatch(/aws_iam_role_policy\.ecs_task/);
    });
  });

  // ==================== LAMBDA DETAILED TESTS ====================
  describe("Lambda Detailed Configuration", () => {
    test("Lambda runtime consistency", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("Lambda timeout configuration", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*30/);
    });

    test("Lambda memory allocation by environment", () => {
      expect(stackContent).toMatch(/memory_size\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*512\s*:\s*256/);
    });

    test("Lambda environment variables", () => {
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/DB_SECRET_ARN/);
      expect(stackContent).toMatch(/API_SECRET_ARN/);
      expect(stackContent).toMatch(/S3_BUCKET/);
    });

    test("Lambda VPC configuration", () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("Lambda dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_cloudwatch_log_group\.lambda/);
      expect(stackContent).toMatch(/aws_iam_role_policy\.lambda_execution/);
    });

    test("Lambda permissions for Secrets Manager", () => {
      expect(stackContent).toMatch(/principal\s*=\s*"secretsmanager\.amazonaws\.com"/);
      expect(stackContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
    });
  });

  // ==================== S3 DETAILED TESTS ====================
  describe("S3 Detailed Configuration", () => {
    test("S3 bucket naming convention", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{data\.aws_caller_identity\.current\.account_id\}-\$\{var\.environment\}-payment-logs"/);
    });

    test("S3 encryption algorithm", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(stackContent).toMatch(/apply_server_side_encryption_by_default/);
    });

    test("S3 versioning enabled", () => {
      expect(stackContent).toMatch(/versioning_configuration\s*{[\s\S]*status\s*=\s*"Enabled"/);
    });

    test("S3 lifecycle rule configuration", () => {
      expect(stackContent).toMatch(/id\s*=\s*"transition-to-glacier"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 lifecycle transitions", () => {
      expect(stackContent).toMatch(/transition\s*{[\s\S]*days\s*=\s*90/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("S3 object expiration for compliance", () => {
      expect(stackContent).toMatch(/expiration\s*{[\s\S]*days\s*=\s*2555/);
    });
  });

  // ==================== CLOUDWATCH DETAILED TESTS ====================
  describe("CloudWatch Detailed Configuration", () => {
    test("CloudWatch log group naming conventions", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/ecs\/\$\{var\.environment\}-payment"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\$\{var\.environment\}-payment-validation"/);
    });

    test("CloudWatch dashboard widgets configuration", () => {
      expect(stackContent).toMatch(/type\s*=\s*"metric"/);
      expect(stackContent).toMatch(/period\s*=\s*300/);
      expect(stackContent).toMatch(/stat\s*=\s*"Average"/);
      expect(stackContent).toMatch(/stat\s*=\s*"Sum"/);
    });

    test("CloudWatch alarm evaluation periods", () => {
      expect(stackContent).toMatch(/evaluation_periods\s*=\s*"2"/);
    });

    test("CloudWatch alarm period configuration", () => {
      expect(stackContent).toMatch(/period\s*=\s*"300"/);
    });

    test("CloudWatch alarm statistics", () => {
      expect(stackContent).toMatch(/statistic\s*=\s*"Average"/);
      expect(stackContent).toMatch(/statistic\s*=\s*"Sum"/);
    });

    test("CloudWatch alarm dimensions", () => {
      expect(stackContent).toMatch(/ClusterName\s*=\s*aws_ecs_cluster\.main\.name/);
      expect(stackContent).toMatch(/ServiceName\s*=\s*aws_ecs_service\.main\.name/);
      expect(stackContent).toMatch(/DBInstanceIdentifier\s*=\s*aws_db_instance\.main\.id/);
    });

    test("ALB response time threshold conversion", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*local\.alarm_thresholds\[var\.environment\]\.response_time \/ 1000/);
    });
  });

  // ==================== TAGGING DETAILED TESTS ====================
  describe("Detailed Tagging Configuration", () => {
    test("common tags include all required fields", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(stackContent).toMatch(/DataClassification\s*=\s*var\.data_classification/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Project\s*=\s*"PaymentProcessing"/);
    });

    test("resources use merge function for tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags,\s*{/);
    });

    test("individual resource tags have descriptive names", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.environment\}-payment-vpc"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.environment\}-payment-igw"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.environment\}-payment-cluster"/);
    });

    test("subnet tags include type information", () => {
      expect(stackContent).toMatch(/Type\s*=\s*"public"/);
      expect(stackContent).toMatch(/Type\s*=\s*"private"/);
    });
  });

  // ==================== VALIDATION AND ERROR HANDLING TESTS ====================
  describe("Validation and Error Handling", () => {
    test("no TODO or FIXME comments in production code", () => {
      expect(stackContent).not.toMatch(/TODO/i);
      expect(stackContent).not.toMatch(/FIXME/i);
    });

    test("no debug or console statements", () => {
      expect(stackContent).not.toMatch(/console\.log/);
      expect(stackContent).not.toMatch(/print\(/);
    });

    test("proper JSON encoding for policies", () => {
      expect(stackContent).toMatch(/jsonencode\(\{/);
    });

    test("no hardcoded account IDs", () => {
      expect(stackContent).not.toMatch(/\b\d{12}\b/);
    });

    test("uses data sources for dynamic values", () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
      expect(stackContent).toMatch(/data\.aws_region\.current\.name/);
    });

    test("proper string interpolation syntax", () => {
      expect(stackContent).toMatch(/\$\{var\./);
      expect(stackContent).toMatch(/\$\{local\./);
      expect(stackContent).toMatch(/\$\{data\./);
    });
  });

  // ==================== INTEGRATION AND DEPENDENCY TESTS ====================
  describe("Integration and Dependencies", () => {
    test("resources reference each other correctly", () => {
      expect(stackContent).toMatch(/aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/aws_subnet\.public\[\*\]\.id/);
      expect(stackContent).toMatch(/aws_subnet\.private\[\*\]\.id/);
    });

    test("security group references are correct", () => {
      expect(stackContent).toMatch(/aws_security_group\.alb\.id/);
      expect(stackContent).toMatch(/aws_security_group\.ecs_tasks\.id/);
      expect(stackContent).toMatch(/aws_security_group\.rds\.id/);
      expect(stackContent).toMatch(/aws_security_group\.lambda\.id/);
    });

    test("IAM role references are correct", () => {
      expect(stackContent).toMatch(/aws_iam_role\.ecs_task_execution\.arn/);
      expect(stackContent).toMatch(/aws_iam_role\.ecs_task\.arn/);
      expect(stackContent).toMatch(/aws_iam_role\.lambda_execution\.arn/);
    });

    test("secret references are correct", () => {
      expect(stackContent).toMatch(/aws_secretsmanager_secret\.db_credentials\.arn/);
      expect(stackContent).toMatch(/aws_secretsmanager_secret\.api_keys\.arn/);
    });

    test("load balancer integration", () => {
      expect(stackContent).toMatch(/aws_lb_target_group\.main\.arn/);
      expect(stackContent).toMatch(/aws_lb\.main\.arn/);
      // Certificate can be either conditional (with [0]) or provided via variable
      expect(stackContent).toMatch(/aws_acm_certificate(\.main\[0\]\.arn|_validation\.main\[0\]\.certificate_arn)|var\.acm_certificate_arn/);
    });
  });
});
