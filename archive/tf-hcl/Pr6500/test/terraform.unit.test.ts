import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

const readTf = (filename: string): string =>
  fs.readFileSync(path.join(LIB_DIR, filename), "utf8");

const hasAll = (content: string, snippets: string[]): boolean =>
  snippets.every((snippet) => content.includes(snippet));

describe("Terraform configuration sanity", () => {
  it("exposes all expected Terraform files", () => {
    const files = fs
      .readdirSync(LIB_DIR)
      .filter((file) => file.endsWith(".tf"))
      .sort();
    const expected = [
      "compute.tf",
      "iam.tf",
      "locals.tf",
      "monitoring.tf",
      "networking.tf",
      "outputs.tf",
      "provider.tf",
      "ssm.tf",
      "variables.tf",
    ];
    expect(files).toEqual(expected);
  });

  it("configures networking for three public and private subnets with NAT", () => {
    const networking = readTf("networking.tf");
    expect(networking).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(networking).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(networking).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(networking).toMatch(/aws_nat_gateway" "main"/);
    expect(hasAll(networking, [
      "count = length(local.availability_zones)",
      "cidr_block              = local.public_subnet_cidrs[count.index]",
      "cidr_block        = local.private_subnet_cidrs[count.index]",
    ])).toBe(true);
  });

  it("builds locals from regional availability zones and environment suffix", () => {
    const locals = readTf("locals.tf");
    expect(locals).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    expect(locals).toMatch(/name_prefix = "\${var.project_name}-\${var.environment}-\${var.environment_suffix}"/);
    expect(locals).toMatch(/fqdn = var.enable_route53/);
  });

  it("defines core variables including aws_region and environment_suffix", () => {
    const variables = readTf("variables.tf");
    expect(variables).toMatch(/variable\s+"aws_region"/);
    expect(variables).toMatch(/variable\s+"environment_suffix"/);
    expect(variables).toMatch(/variable\s+"db_engine_version"/);
    expect(variables).toMatch(/variable\s+"database_secret_arn"/);
  });

  it("configures ECS Fargate service, ALB, and health checks correctly", () => {
    const compute = readTf("compute.tf");
    expect(compute).toMatch(/resource\s+"aws_ecs_service"\s+"app"/);
    expect(compute).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(compute).toMatch(/desired_count\s*=\s*var\.min_capacity/);
    expect(compute).toMatch(/deployment_minimum_healthy_percent\s*=\s*100/);
    expect(compute).toMatch(/enable_deletion_protection\s*=\s*false/);
    expect(compute).toMatch(/interval\s*=\s*30/);
    expect(compute).toMatch(/unhealthy_threshold\s*=\s*10/);
  });

  it("enforces Auto Scaling bounds between two and ten tasks", () => {
    const compute = readTf("compute.tf");
    expect(compute).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs"/);
    expect(compute).toMatch(/min_capacity\s*=\s*var\.min_capacity/);
    expect(compute).toMatch(/max_capacity\s*=\s*var\.max_capacity/);
    expect(compute).toMatch(/target_value\s*=\s*var\.cpu_target_value/);
  });

  it("stores logs in CloudWatch with seven day retention", () => {
    const monitoring = readTf("monitoring.tf");
    expect(monitoring).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
    expect(monitoring).toMatch(/retention_in_days = 7/);
  });

  it("creates secure SSM parameters and references Secrets Manager", () => {
    const ssm = readTf("ssm.tf");
    expect(ssm).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"/);
    expect(ssm).toMatch(/type  = "SecureString"/);
    const iam = readTf("iam.tf");
    expect(iam).not.toMatch(/Resource\s*=\s*"\*"/);
    expect(iam).toMatch(/secretsmanager:GetSecretValue/);
  });

  it("provisions an RDS instance with managed password and deletion protection disabled", () => {
    const compute = readTf("compute.tf");
    expect(compute).toMatch(/resource\s+"aws_db_instance"\s+"app"/);
    expect(compute).toMatch(/manage_master_user_password\s*=\s*true/);
    expect(compute).toMatch(/deletion_protection\s*=\s*false/);
    expect(compute).toMatch(/performance_insights_enabled\s*=\s*local\.db_enable_performance_insights/);
  });

  it("hasAll helper evaluates both success and failure paths", () => {
    const sample = "alpha beta gamma";
    expect(hasAll(sample, ["alpha", "gamma"])).toBe(true);
    expect(hasAll(sample, ["alpha", "delta"])).toBe(false);
  });

  it("outputs ALB and ECR artefacts plus database endpoints", () => {
    const outputs = readTf("outputs.tf");
    expect(outputs).toMatch(/output "alb_dns_name"/);
    expect(outputs).toMatch(/output "ecr_repository_url"/);
    expect(outputs).toMatch(/output "rds_endpoint"/);
    expect(outputs).toMatch(/output "rds_master_secret_arn"/);
  });
});
