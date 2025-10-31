// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform multi-environment infrastructure stack
// No Terraform or AWS commands are executed.

import fs from "fs";
import path from "path";

const LIB_PATH = "../lib";
const MAIN_REL = "../lib/main.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";
const OUTPUTS_REL = "../lib/outputs.tf";
const IAM_REL = "../lib/iam.tf";
const ECS_REL = "../lib/ecs.tf";
const ALB_REL = "../lib/alb.tf";
const S3_REL = "../lib/s3.tf";
const ROUTE53_REL = "../lib/route53.tf";

const mainPath = path.resolve(__dirname, MAIN_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);
const outputsPath = path.resolve(__dirname, OUTPUTS_REL);
const iamPath = path.resolve(__dirname, IAM_REL);
const ecsPath = path.resolve(__dirname, ECS_REL);
const albPath = path.resolve(__dirname, ALB_REL);
const s3Path = path.resolve(__dirname, S3_REL);
const route53Path = path.resolve(__dirname, ROUTE53_REL);

const TFVARS_DEV_REL = "../lib/terraform.tfvars.dev";
const TFVARS_STAGING_REL = "../lib/terraform.tfvars.staging";
const TFVARS_PROD_REL = "../lib/terraform.tfvars.prod";

const tfvarsDevPath = path.resolve(__dirname, TFVARS_DEV_REL);
const tfvarsStagingPath = path.resolve(__dirname, TFVARS_STAGING_REL);
const tfvarsProdPath = path.resolve(__dirname, TFVARS_PROD_REL);

describe("Terraform Multi-Environment Infrastructure Stack", () => {
  let mainContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let iamContent: string;
  let ecsContent: string;
  let albContent: string;
  let s3Content: string;
  let route53Content: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
    outputsContent = fs.readFileSync(outputsPath, "utf8");
    iamContent = fs.readFileSync(iamPath, "utf8");
    ecsContent = fs.readFileSync(ecsPath, "utf8");
    albContent = fs.readFileSync(albPath, "utf8");
    s3Content = fs.readFileSync(s3Path, "utf8");
    route53Content = fs.readFileSync(route53Path, "utf8");
  });

  describe("File Existence and Structure", () => {
    test("all Terraform files exist", () => {
      expect(fs.existsSync(mainPath)).toBe(true);
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(fs.existsSync(variablesPath)).toBe(true);
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(fs.existsSync(iamPath)).toBe(true);
      expect(fs.existsSync(ecsPath)).toBe(true);
      expect(fs.existsSync(albPath)).toBe(true);
      expect(fs.existsSync(s3Path)).toBe(true);
      expect(fs.existsSync(route53Path)).toBe(true);
    });

    test("all environment tfvars files exist", () => {
      expect(fs.existsSync(tfvarsDevPath)).toBe(true);
      expect(fs.existsSync(tfvarsStagingPath)).toBe(true);
      expect(fs.existsSync(tfvarsProdPath)).toBe(true);
    });

    test("all files contain content", () => {
      expect(mainContent.length).toBeGreaterThan(500);
      expect(providerContent.length).toBeGreaterThan(100);
      expect(variablesContent.length).toBeGreaterThan(500);
      expect(outputsContent.length).toBeGreaterThan(500);
      expect(iamContent.length).toBeGreaterThan(500);
      expect(ecsContent.length).toBeGreaterThan(500);
      expect(albContent.length).toBeGreaterThan(200);
      expect(s3Content.length).toBeGreaterThan(500);
      expect(route53Content.length).toBeGreaterThan(200);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains terraform block with correct version constraint", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("provider.tf contains AWS provider with correct version", () => {
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("provider.tf has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("provider configuration uses variable for region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    test("declares aws_region variable with default", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("declares project_name variable", () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"fintech-startup"/);
    });

    test("declares domain_name variable", () => {
      expect(variablesContent).toMatch(/variable\s+"domain_name"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test("declares container configuration variables", () => {
      expect(variablesContent).toMatch(/variable\s+"container_image"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"container_port"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*number/);
    });

    test("declares database configuration variables", () => {
      expect(variablesContent).toMatch(/variable\s+"db_name"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"db_username"\s*{/);
    });
  });

  describe("Local Variables and Environment Configuration", () => {
    test("defines environment detection from workspace", () => {
      expect(variablesContent).toMatch(/environment\s*=\s*terraform\.workspace\s*==\s*"default"\s*\?\s*"dev"\s*:\s*terraform\.workspace/);
    });

    test("defines environment-specific VPC CIDR blocks", () => {
      expect(variablesContent).toMatch(/vpc_cidrs\s*=\s*{/);
      expect(variablesContent).toMatch(/dev\s*=\s*"10\.0\.0\.0\/16"/);
      expect(variablesContent).toMatch(/staging\s*=\s*"10\.1\.0\.0\/16"/);
      expect(variablesContent).toMatch(/prod\s*=\s*"10\.2\.0\.0\/16"/);
    });

    test("defines environment-specific RDS instance classes", () => {
      expect(variablesContent).toMatch(/rds_instance_classes\s*=\s*{/);
      expect(variablesContent).toMatch(/dev\s*=\s*"db\.t3\.micro"/);
      expect(variablesContent).toMatch(/staging\s*=\s*"db\.t3\.small"/);
      expect(variablesContent).toMatch(/prod\s*=\s*"db\.t3\.micro"/);
    });

    test("defines environment-specific ECS scaling policies", () => {
      expect(variablesContent).toMatch(/ecs_scaling\s*=\s*{/);
      expect(variablesContent).toMatch(/min_capacity\s*=\s*1/);
      expect(variablesContent).toMatch(/max_capacity\s*=\s*2/);
      expect(variablesContent).toMatch(/min_capacity\s*=\s*3/);
      expect(variablesContent).toMatch(/max_capacity\s*=\s*10/);
    });

    test("defines environment-specific log retention periods", () => {
      expect(variablesContent).toMatch(/log_retention\s*=\s*{/);
      expect(variablesContent).toMatch(/dev\s*=\s*7/);
      expect(variablesContent).toMatch(/staging\s*=\s*30/);
      expect(variablesContent).toMatch(/prod\s*=\s*90/);
    });

    test("defines common tags with required fields", () => {
      expect(variablesContent).toMatch(/common_tags\s*=\s*{/);
      expect(variablesContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(variablesContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(variablesContent).toMatch(/ManagedBy\s*=\s*var\.managed_by/);
    });

    test("defines availability zones dynamically", () => {
      expect(variablesContent).toMatch(/azs\s*=\s*\["\$\{var\.aws_region\}a",\s*"\$\{var\.aws_region\}b"\]/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("creates VPC with environment-specific CIDR", () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidrs\[local\.environment\]/);
      expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets with count", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(local\.vpc_cidrs\[local\.environment\]/);
    });

    test("creates private subnets with count", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(local\.vpc_cidrs\[local\.environment\]/);
    });

    test("creates database subnets with count", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });

    test("creates NAT gateways with EIPs", () => {
      expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(mainContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(mainContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates route tables for public and private subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(mainContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(mainContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main/);
    });

    test("creates route table associations", () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"database"/);
    });

    test("creates DB subnet group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });
  });

  describe("Security Groups", () => {
    test("creates RDS security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(mainContent).toMatch(/name_prefix\s*=.*rds/);
      expect(mainContent).toMatch(/from_port\s*=\s*5432/);
      expect(mainContent).toMatch(/to_port\s*=\s*5432/);
    });

    test("creates ECS tasks security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
      expect(mainContent).toMatch(/name_prefix\s*=.*ecs-tasks/);
      expect(mainContent).toMatch(/from_port\s*=\s*var\.container_port/);
    });

    test("creates ALB security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(mainContent).toMatch(/name_prefix\s*=.*alb/);
      expect(mainContent).toMatch(/from_port\s*=\s*80/);
      expect(mainContent).toMatch(/from_port\s*=\s*443/);
    });

    test("security groups have proper egress rules", () => {
      expect(mainContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*0[^}]*to_port\s*=\s*0[^}]*protocol\s*=\s*"-1"/);
    });
  });

  describe("RDS Database Configuration", () => {
    test("creates RDS instance with environment-specific settings", () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(mainContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(mainContent).toMatch(/instance_class\s*=\s*local\.rds_instance_classes\[local\.environment\]/);
    });

    test("RDS has proper backup configuration", () => {
      expect(mainContent).toMatch(/backup_retention_period\s*=\s*local\.rds_backup_retention\[local\.environment\]/);
      expect(mainContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(mainContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS has proper security configuration", () => {
      expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(mainContent).toMatch(/publicly_accessible\s*=\s*false/);
      expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("creates random password for RDS", () => {
      expect(mainContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(mainContent).toMatch(/length\s*=\s*16/);
      expect(mainContent).toMatch(/special\s*=\s*true/);
    });

    test("stores DB password in Systems Manager", () => {
      expect(mainContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
      expect(mainContent).toMatch(/type\s*=\s*"SecureString"/);
      expect(mainContent).toMatch(/value\s*=\s*random_password\.db_password\.result/);
    });
  });

  describe("IAM Resources", () => {
    test("creates ECS task execution role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(iamContent).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test("creates ECS task role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
      expect(iamContent).toMatch(/AssumeRole/);
    });

    test("attaches managed policy for ECS task execution", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_task_execution"/);
      expect(iamContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
    });

    test("creates environment-specific IAM policies", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ecs_task"/);
      expect(iamContent).toMatch(/ssm:GetParameters/);
      expect(iamContent).toMatch(/s3:GetObject/);
    });

    test("IAM policies use environment-specific ARNs", () => {
      expect(iamContent).toMatch(/\$\{var\.project_name\}\/\$\{local\.environment\}/);
    });
  });

  describe("ECS Configuration", () => {
    test("creates ECS cluster", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
      expect(ecsContent).toMatch(/containerInsights/);
    });

    test("creates CloudWatch log group with environment-specific retention", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
      expect(ecsContent).toMatch(/retention_in_days\s*=\s*local\.log_retention\[local\.environment\]/);
    });

    test("creates ECS task definition", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"api"/);
      expect(ecsContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
      expect(ecsContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
    });

    test("ECS task definition uses variables for configuration", () => {
      expect(ecsContent).toMatch(/var\.container_image/);
      expect(ecsContent).toMatch(/var\.container_port/);
    });

    test("creates ECS service with environment-specific scaling", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_ecs_service"\s+"api"/);
      expect(ecsContent).toMatch(/desired_count\s*=\s*local\.ecs_scaling\[local\.environment\]\.desired_count/);
      expect(ecsContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
    });

    test("creates auto scaling configuration", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs"/);
      expect(ecsContent).toMatch(/min_capacity\s*=\s*local\.ecs_scaling\[local\.environment\]\.min_capacity/);
      expect(ecsContent).toMatch(/max_capacity\s*=\s*local\.ecs_scaling\[local\.environment\]\.max_capacity/);
    });

    test("creates auto scaling policies", () => {
      expect(ecsContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_cpu"/);
      expect(ecsContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_memory"/);
      expect(ecsContent).toMatch(/ECSServiceAverageCPUUtilization/);
      expect(ecsContent).toMatch(/ECSServiceAverageMemoryUtilization/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB with proper configuration", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(albContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(albContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB has access logging enabled", () => {
      expect(albContent).toMatch(/access_logs\s*{/);
      expect(albContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.alb_logs\.bucket/);
      expect(albContent).toMatch(/enabled\s*=\s*true/);
    });

    test("ALB depends on S3 bucket policy", () => {
      expect(albContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.alb_logs\]/);
    });

    test("creates target group with health checks", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"api"/);
      expect(albContent).toMatch(/target_type\s*=\s*"ip"/);
      expect(albContent).toMatch(/health_check\s*{/);
      expect(albContent).toMatch(/path\s*=\s*"\/"/);
    });

    test("creates ALB listener", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"api"/);
      expect(albContent).toMatch(/port\s*=\s*"80"/);
      expect(albContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test("deletion protection disabled for cost savings", () => {
      expect(albContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });

  describe("S3 Configuration", () => {
    test("creates S3 buckets for logs", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_logs"/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
    });

    test("S3 buckets have unique names with random suffix", () => {
      expect(s3Content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(s3Content).toMatch(/\$\{random_id\.bucket_suffix\.hex\}/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 buckets have encryption configured", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("S3 buckets block public access", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("S3 lifecycle policies use environment-specific retention", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(s3Content).toMatch(/days\s*=\s*local\.log_retention\[local\.environment\]/);
    });

    test("ALB logs bucket has proper policy", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"/);
      expect(s3Content).toMatch(/data\.aws_elb_service_account\.main\.arn/);
      expect(s3Content).toMatch(/s3:PutObject/);
      expect(s3Content).toMatch(/s3:GetBucketAcl/);
    });
  });

  describe("Route53 Configuration", () => {
    test("creates hosted zone with environment subdomain", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
      expect(route53Content).toMatch(/name\s*=\s*"\$\{local\.environment\}\.\$\{var\.domain_name\}"/);
    });

    test("creates DNS records for ALB", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"\s+"alb"/);
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"\s+"api"/);
      expect(route53Content).toMatch(/type\s*=\s*"A"/);
    });

    test("DNS records use ALB alias", () => {
      expect(route53Content).toMatch(/alias\s*{/);
      expect(route53Content).toMatch(/name\s*=\s*aws_lb\.main\.dns_name/);
      expect(route53Content).toMatch(/zone_id\s*=\s*aws_lb\.main\.zone_id/);
      expect(route53Content).toMatch(/evaluate_target_health\s*=\s*true/);
    });

    test("creates health check for ALB", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"alb"/);
      expect(route53Content).toMatch(/fqdn\s*=\s*aws_lb\.main\.dns_name/);
      expect(route53Content).toMatch(/type\s*=\s*"HTTP"/);
    });

    test("supports parent hosted zone delegation", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"\s+"parent_ns"/);
      expect(route53Content).toMatch(/count\s*=\s*var\.parent_hosted_zone_id\s*!=\s*null/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs VPC information", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"vpc_cidr_block"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs subnet information", () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"database_subnet_ids"/);
      expect(outputsContent).toMatch(/aws_subnet\.public\[\*\]\.id/);
    });

    test("outputs ALB information", () => {
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
      expect(outputsContent).toMatch(/output\s+"alb_zone_id"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    });

    test("outputs RDS information with sensitive flag", () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"rds_username"/);
      expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("outputs ECS information", () => {
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_id"/);
      expect(outputsContent).toMatch(/output\s+"ecs_service_name"/);
    });

    test("outputs environment and region information", () => {
      expect(outputsContent).toMatch(/output\s+"environment"/);
      expect(outputsContent).toMatch(/output\s+"region"/);
      expect(outputsContent).toMatch(/value\s*=\s*local\.environment/);
      expect(outputsContent).toMatch(/value\s*=\s*var\.aws_region/);
    });
  });

  describe("Environment Variables Files", () => {
    test("tfvars files contain required variables", () => {
      const devContent = fs.readFileSync(tfvarsDevPath, "utf8");
      const stagingContent = fs.readFileSync(tfvarsStagingPath, "utf8");
      const prodContent = fs.readFileSync(tfvarsProdPath, "utf8");

      [devContent, stagingContent, prodContent].forEach(content => {
        expect(content).toMatch(/project_name\s*=\s*"fintech-startup"/);
        expect(content).toMatch(/aws_region\s*=\s*"us-east-1"/);
        expect(content).toMatch(/domain_name\s*=/);
        expect(content).toMatch(/container_image\s*=/);
        expect(content).toMatch(/db_name\s*=/);
        expect(content).toMatch(/db_username\s*=/);
      });
    });

    test("tfvars files have consistent configuration", () => {
      const devContent = fs.readFileSync(tfvarsDevPath, "utf8");
      const stagingContent = fs.readFileSync(tfvarsStagingPath, "utf8");
      const prodContent = fs.readFileSync(tfvarsProdPath, "utf8");

      expect(devContent).toMatch(/container_port\s*=\s*80/);
      expect(stagingContent).toMatch(/container_port\s*=\s*80/);
      expect(prodContent).toMatch(/container_port\s*=\s*80/);
    });
  });

  describe("Security and Best Practices", () => {
    test("no hardcoded sensitive values", () => {
      const allContent = [
        mainContent, providerContent, variablesContent, outputsContent,
        iamContent, ecsContent, albContent, s3Content, route53Content
      ].join("\n");

      expect(allContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(allContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(allContent).not.toMatch(/key\s*=\s*"[^"]+"/i);
    });

    test("all resources have proper tagging", () => {
      const allContent = [
        mainContent, iamContent, ecsContent, albContent, s3Content, route53Content
      ].join("\n");

      expect(allContent).toMatch(/tags\s*=.*local\.common_tags/);
      expect(allContent).toMatch(/tags\s*=.*merge\(local\.common_tags/);
    });

    test("uses variables instead of hardcoded values", () => {
      const allContent = [
        mainContent, iamContent, ecsContent, albContent, s3Content, route53Content
      ].join("\n");

      expect(allContent).toMatch(/var\.aws_region/);
      expect(allContent).toMatch(/var\.project_name/);
      expect(allContent).toMatch(/local\.environment/);
    });

    test("security groups follow least privilege", () => {
      expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
      expect(mainContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*port\s*=\s*22/);
    });

    test("RDS is in private subnets", () => {
      expect(mainContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("S3 buckets block public access", () => {
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("Multi-Environment Consistency", () => {
    test("uses workspace-based environment detection", () => {
      expect(variablesContent).toMatch(/terraform\.workspace/);
    });

    test("environment-specific configurations are complete", () => {
      const envSpecificConfigs = [
        'vpc_cidrs', 'rds_instance_classes', 'ecs_scaling',
        'log_retention', 'rds_backup_retention', 'rds_multi_az'
      ];

      envSpecificConfigs.forEach(config => {
        expect(variablesContent).toMatch(new RegExp(`${config}\\s*=\\s*{`));
        expect(variablesContent).toMatch(new RegExp(`dev\\s*=`));
        expect(variablesContent).toMatch(new RegExp(`staging\\s*=`));
        expect(variablesContent).toMatch(new RegExp(`prod\\s*=`));
      });
    });

    test("resources use environment-specific values", () => {
      expect(mainContent).toMatch(/local\.vpc_cidrs\[local\.environment\]/);
      expect(mainContent).toMatch(/local\.rds_instance_classes\[local\.environment\]/);
      expect(ecsContent).toMatch(/local\.ecs_scaling\[local\.environment\]/);
    });
  });

  describe("Regional Agnostic Configuration", () => {
    test("uses variables for region-specific values", () => {
      expect(variablesContent).toMatch(/\$\{var\.aws_region\}/);
    });

    test("availability zones are dynamically generated", () => {
      expect(variablesContent).toMatch(/"\$\{var\.aws_region\}a"/);
      expect(variablesContent).toMatch(/"\$\{var\.aws_region\}b"/);
    });

    test("no hardcoded region values except default", () => {
      const allContent = [
        mainContent, providerContent, outputsContent,
        iamContent, ecsContent, albContent, s3Content, route53Content
      ].join("\n");

      expect(allContent).not.toMatch(/us-west-/);
      expect(allContent).not.toMatch(/eu-/);
      expect(allContent).not.toMatch(/ap-/);

      // Check that non-default hardcoded regions are not used
      expect(mainContent).not.toMatch(/us-east-1/);
      expect(providerContent).not.toMatch(/us-east-1/);
      expect(iamContent).not.toMatch(/us-east-1/);
      expect(ecsContent).not.toMatch(/us-east-1/);
    });
  });
});
