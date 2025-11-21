import { Testing } from "cdktf";
import * as path from "path";
import { execSync } from "child_process";
import * as fs from "fs";

describe("ECS Fargate Optimization - Unit Tests", () => {
  const terraformDir = path.join(__dirname, "../lib");

  beforeAll(() => {
    process.chdir(terraformDir);
  });

  test("Terraform configuration is valid", () => {
    expect(() => {
      execSync("terraform init -backend=false", { cwd: terraformDir });
      execSync("terraform validate", { cwd: terraformDir });
    }).not.toThrow();
  });

  test("All required variables are defined", () => {
    const varsContent = fs.readFileSync(path.join(terraformDir, "variables.tf"), "utf-8");

    expect(varsContent).toContain("variable \"environment_suffix\"");
    expect(varsContent).toContain("variable \"aws_region\"");
    expect(varsContent).toContain("variable \"api_cpu\"");
    expect(varsContent).toContain("variable \"worker_cpu\"");
    expect(varsContent).toContain("variable \"scheduler_cpu\"");
  });

  test("Environment suffix validation is present", () => {
    const varsContent = fs.readFileSync(path.join(terraformDir, "variables.tf"), "utf-8");

    expect(varsContent).toContain("validation");
    expect(varsContent).toContain("environment_suffix");
  });

  test("Provider configuration uses correct AWS provider version", () => {
    const providerContent = fs.readFileSync(path.join(terraformDir, "provider.tf"), "utf-8");

    expect(providerContent).toContain("hashicorp/aws");
    expect(providerContent).toMatch(/version.*5\.0/);
  });

  test("Main configuration includes all required ECS resources", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    // ECS Resources
    expect(mainContent).toContain("aws_ecs_cluster");
    expect(mainContent).toContain("aws_ecs_task_definition");
    expect(mainContent).toContain("aws_ecs_service");

    // Three services
    expect(mainContent).toContain("ecs-api");
    expect(mainContent).toContain("ecs-worker");
    expect(mainContent).toContain("ecs-scheduler");

    // Auto Scaling
    expect(mainContent).toContain("aws_appautoscaling_target");
    expect(mainContent).toContain("aws_appautoscaling_policy");

    // Load Balancer
    expect(mainContent).toContain("aws_lb");
    expect(mainContent).toContain("aws_lb_target_group");
    expect(mainContent).toContain("aws_lb_listener");
  });

  test("Circuit breaker is configured on all ECS services", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    const circuitBreakerMatches = mainContent.match(/deployment_circuit_breaker/g);
    expect(circuitBreakerMatches).not.toBeNull();
    expect(circuitBreakerMatches!.length).toBeGreaterThanOrEqual(3);

    expect(mainContent).toContain("enable   = true");
    expect(mainContent).toContain("rollback = true");
  });

  test("Lifecycle ignore_changes is set for task definitions", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("ignore_changes = [task_definition");
  });

  test("CloudWatch log groups have proper retention", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("aws_cloudwatch_log_group");
    expect(mainContent).toContain("retention_in_days = 30");
    expect(mainContent).toContain("retention_in_days = 7");
  });

  test("Target groups have proper deregistration delays", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("deregistration_delay = 30");
    expect(mainContent).toContain("deregistration_delay = 60");
  });

  test("Health checks are configured with correct parameters", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("healthy_threshold   = 2");
    expect(mainContent).toContain("timeout             = 10");
    expect(mainContent).toContain("interval            = 15");
  });

  test("Service discovery is configured", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("aws_service_discovery_private_dns_namespace");
    expect(mainContent).toContain("aws_service_discovery_service");
  });

  test("ALB has deletion protection disabled", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("enable_deletion_protection = false");
  });

  test("All resources use environment_suffix in naming", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    const suffixMatches = mainContent.match(/\$\{var\.environment_suffix\}/g);
    expect(suffixMatches).not.toBeNull();
    expect(suffixMatches!.length).toBeGreaterThan(50);
  });

  test("Task definitions use correct CPU/memory combinations", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    // API: 256/512
    expect(mainContent).toContain("cpu                      = var.api_cpu");
    expect(mainContent).toContain("memory                   = var.api_memory");

    // Worker: 512/1024
    expect(mainContent).toContain("cpu                      = var.worker_cpu");
    expect(mainContent).toContain("memory                   = var.worker_memory");

    // Scheduler: 256/512
    expect(mainContent).toContain("cpu                      = var.scheduler_cpu");
    expect(mainContent).toContain("memory                   = var.scheduler_memory");
  });

  test("Auto-scaling has proper cooldown periods", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("scale_in_cooldown  = 300");
    expect(mainContent).toContain("scale_out_cooldown = 60");
  });

  test("CloudWatch alarms are configured", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("aws_cloudwatch_metric_alarm");
    expect(mainContent).toContain("CPUUtilization");
    expect(mainContent).toContain("MemoryUtilization");
  });

  test("IAM roles are properly configured", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("aws_iam_role");
    expect(mainContent).toContain("ecs_task_execution");
    expect(mainContent).toContain("ecs_task");
    expect(mainContent).toContain("AmazonECSTaskExecutionRolePolicy");
  });

  test("Cost allocation tags are present", () => {
    const providerContent = fs.readFileSync(path.join(terraformDir, "provider.tf"), "utf-8");

    expect(providerContent).toContain("default_tags");
    expect(providerContent).toContain("Environment");
    expect(providerContent).toContain("CostCenter");
  });

  test("VPC configuration spans 3 availability zones", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");
    const varsContent = fs.readFileSync(path.join(terraformDir, "variables.tf"), "utf-8");

    expect(mainContent).toContain("aws_subnet.public");
    expect(mainContent).toContain("aws_subnet.private");
    expect(varsContent).toContain("us-east-1a");
    expect(varsContent).toContain("us-east-1b");
    expect(varsContent).toContain("us-east-1c");
  });

  test("Outputs file contains all required outputs", () => {
    const outputsContent = fs.readFileSync(path.join(terraformDir, "outputs.tf"), "utf-8");

    expect(outputsContent).toContain("output \"vpc_id\"");
    expect(outputsContent).toContain("output \"ecs_cluster_name\"");
    expect(outputsContent).toContain("output \"alb_dns_name\"");
    expect(outputsContent).toContain("output \"api_service_name\"");
    expect(outputsContent).toContain("output \"worker_service_name\"");
    expect(outputsContent).toContain("output \"scheduler_service_name\"");
  });

  test("Container Insights is enabled", () => {
    const mainContent = fs.readFileSync(path.join(terraformDir, "main.tf"), "utf-8");

    expect(mainContent).toContain("containerInsights");
    expect(mainContent).toContain("enabled");
  });
});
