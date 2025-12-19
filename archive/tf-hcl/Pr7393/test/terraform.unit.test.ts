// Unit tests for Terraform ECS Fargate Optimization
// Tests verify file existence, structure, and key configuration settings

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform ECS Fargate Optimization - Unit Tests", () => {
  // Test file existence
  describe("File Existence", () => {
    test("main.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "main.tf"));
      expect(exists).toBe(true);
    });

    test("alb.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "alb.tf"));
      expect(exists).toBe(true);
    });

    test("iam.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "iam.tf"));
      expect(exists).toBe(true);
    });

    test("ecs_services.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "ecs_services.tf"));
      expect(exists).toBe(true);
    });

    test("autoscaling.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "autoscaling.tf"));
      expect(exists).toBe(true);
    });

    test("eventbridge.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "eventbridge.tf"));
      expect(exists).toBe(true);
    });

    test("outputs.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "outputs.tf"));
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "provider.tf"));
      expect(exists).toBe(true);
    });

    test("variables.tf exists", () => {
      const exists = fs.existsSync(path.join(LIB_DIR, "variables.tf"));
      expect(exists).toBe(true);
    });
  });

  // Test ECS Task Definitions have correct CPU/Memory
  describe("ECS Task Definition Configuration", () => {
    const ecsServicesContent = fs.readFileSync(
      path.join(LIB_DIR, "ecs_services.tf"),
      "utf8"
    );

    test("API task definition has correct CPU (256) and Memory (512)", () => {
      expect(ecsServicesContent).toMatch(/family\s*=\s*"api-/);
      expect(ecsServicesContent).toMatch(/cpu\s*=\s*"256"/);
      expect(ecsServicesContent).toMatch(/memory\s*=\s*"512"/);
    });

    test("Worker task definition has correct CPU (512) and Memory (1024)", () => {
      expect(ecsServicesContent).toMatch(/family\s*=\s*"worker-/);
      expect(ecsServicesContent).toMatch(/cpu\s*=\s*"512"/);
      expect(ecsServicesContent).toMatch(/memory\s*=\s*"1024"/);
    });

    test("Scheduler task definition has correct CPU (256) and Memory (512)", () => {
      expect(ecsServicesContent).toMatch(/family\s*=\s*"scheduler-/);
      // Should have at least 2 instances of 256/512 (API and Scheduler)
      const cpuMatches = ecsServicesContent.match(/cpu\s*=\s*"256"/g);
      const memoryMatches = ecsServicesContent.match(/memory\s*=\s*"512"/g);
      expect(cpuMatches).toBeTruthy();
      expect(memoryMatches).toBeTruthy();
      expect(cpuMatches!.length).toBeGreaterThanOrEqual(2);
      expect(memoryMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("All task definitions use FARGATE launch type", () => {
      const fargateMatches = ecsServicesContent.match(
        /requires_compatibilities\s*=\s*\["FARGATE"\]/g
      );
      expect(fargateMatches).toBeTruthy();
      expect(fargateMatches!.length).toBe(3); // API, Worker, Scheduler
    });
  });

  // Test ALB Configuration
  describe("Application Load Balancer Configuration", () => {
    const albContent = fs.readFileSync(path.join(LIB_DIR, "alb.tf"), "utf8");

    test("ALB health check interval is 15 seconds", () => {
      expect(albContent).toMatch(/interval\s*=\s*15/);
    });

    test("ALB health check timeout is 10 seconds", () => {
      expect(albContent).toMatch(/timeout\s*=\s*10/);
    });

    test("ALB health check healthy_threshold is 2", () => {
      expect(albContent).toMatch(/healthy_threshold\s*=\s*2/);
    });

    test("API target group deregistration_delay is 30 seconds", () => {
      const apiTgMatch = albContent.match(
        /resource\s+"aws_lb_target_group"\s+"api"[\s\S]*?deregistration_delay\s*=\s*(\d+)/
      );
      expect(apiTgMatch).toBeTruthy();
      expect(apiTgMatch![1]).toBe("30");
    });

    test("Worker target group deregistration_delay is 60 seconds", () => {
      const workerTgMatch = albContent.match(
        /resource\s+"aws_lb_target_group"\s+"worker"[\s\S]*?deregistration_delay\s*=\s*(\d+)/
      );
      expect(workerTgMatch).toBeTruthy();
      expect(workerTgMatch![1]).toBe("60");
    });
  });

  // Test Circuit Breaker Configuration
  describe("ECS Service Circuit Breaker", () => {
    const ecsServicesContent = fs.readFileSync(
      path.join(LIB_DIR, "ecs_services.tf"),
      "utf8"
    );

    test("All services have circuit breaker enabled", () => {
      const circuitBreakerMatches = ecsServicesContent.match(
        /deployment_circuit_breaker\s*{/g
      );
      expect(circuitBreakerMatches).toBeTruthy();
      expect(circuitBreakerMatches!.length).toBe(3); // API, Worker, Scheduler
    });

    test("Circuit breaker rollback is enabled", () => {
      const rollbackMatches = ecsServicesContent.match(/rollback\s*=\s*true/g);
      expect(rollbackMatches).toBeTruthy();
      expect(rollbackMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Test Lifecycle Configuration
  describe("Lifecycle Configuration", () => {
    const ecsServicesContent = fs.readFileSync(
      path.join(LIB_DIR, "ecs_services.tf"),
      "utf8"
    );

    test("Services use lifecycle ignore_changes for task_definition", () => {
      expect(ecsServicesContent).toMatch(/ignore_changes\s*=\s*\[/);
      expect(ecsServicesContent).toMatch(/task_definition/);
    });

    test("Services use lifecycle ignore_changes for desired_count", () => {
      expect(ecsServicesContent).toMatch(/desired_count/);
    });
  });

  // Test CloudWatch Log Groups
  describe("CloudWatch Log Groups", () => {
    const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

    test("Log groups have retention periods configured", () => {
      expect(mainContent).toMatch(/retention_in_days/);
    });

    test("Production retention is 30 days, dev is 7 days", () => {
      expect(mainContent).toMatch(/environment_suffix\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test("All three services have log groups (api, worker, scheduler)", () => {
      const logGroupMatches = mainContent.match(
        /resource\s+"aws_cloudwatch_log_group"/g
      );
      expect(logGroupMatches).toBeTruthy();
      expect(logGroupMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Test Cost Allocation Tags
  describe("Cost Allocation Tags", () => {
    const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
    const albContent = fs.readFileSync(path.join(LIB_DIR, "alb.tf"), "utf8");
    const ecsServicesContent = fs.readFileSync(
      path.join(LIB_DIR, "ecs_services.tf"),
      "utf8"
    );
    const providerContent = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");

    test("Resources have Environment tag", () => {
      // Environment tag can be in provider default_tags or individual resources
      const hasEnvironmentTag = mainContent.match(/Environment\s*=/) ||
                                 providerContent.match(/Environment\s*=/);
      expect(hasEnvironmentTag).toBeTruthy();
    });

    test("Resources have Service tag", () => {
      expect(mainContent).toMatch(/Service\s*=/);
      expect(albContent).toMatch(/Service\s*=/);
      expect(ecsServicesContent).toMatch(/Service\s*=/);
    });

    test("Resources have CostCenter tag", () => {
      expect(mainContent).toMatch(/CostCenter\s*=/);
      expect(albContent).toMatch(/CostCenter\s*=/);
      expect(ecsServicesContent).toMatch(/CostCenter\s*=/);
    });
  });

  // Test Auto Scaling Configuration
  describe("Auto Scaling Configuration", () => {
    const autoscalingContent = fs.readFileSync(
      path.join(LIB_DIR, "autoscaling.tf"),
      "utf8"
    );

    test("API service has autoscaling target configured", () => {
      expect(autoscalingContent).toMatch(
        /resource\s+"aws_appautoscaling_target"\s+"api"/
      );
    });

    test("Worker service has autoscaling target configured", () => {
      expect(autoscalingContent).toMatch(
        /resource\s+"aws_appautoscaling_target"\s+"worker"/
      );
    });

    test("Scheduler service has autoscaling target configured", () => {
      expect(autoscalingContent).toMatch(
        /resource\s+"aws_appautoscaling_target"\s+"scheduler"/
      );
    });

    test("Step scaling policies have cooldown periods", () => {
      const cooldownMatches = autoscalingContent.match(/cooldown\s*=\s*\d+/g);
      expect(cooldownMatches).toBeTruthy();
      expect(cooldownMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("CPU and Memory based scaling policies exist", () => {
      expect(autoscalingContent).toMatch(/CPUUtilization/);
      expect(autoscalingContent).toMatch(/MemoryUtilization/);
    });
  });

  // Test Container Insights
  describe("Container Insights", () => {
    const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

    test("ECS cluster has Container Insights enabled", () => {
      expect(mainContent).toMatch(/containerInsights/);
      expect(mainContent).toMatch(/value\s*=\s*"enabled"/);
    });
  });

  // Test EventBridge Configuration
  describe("EventBridge Configuration", () => {
    const eventbridgeContent = fs.readFileSync(
      path.join(LIB_DIR, "eventbridge.tf"),
      "utf8"
    );

    test("EventBridge rule for task state changes exists", () => {
      expect(eventbridgeContent).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"ecs_task_state_change"/
      );
    });

    test("EventBridge monitors ECS Task State Change events", () => {
      expect(eventbridgeContent).toMatch(/ECS Task State Change/);
    });

    test("EventBridge has deployment failure monitoring", () => {
      expect(eventbridgeContent).toMatch(/ecs_deployment_failure/);
    });
  });

  // Test VPC Endpoints for Cost Optimization
  describe("VPC Endpoints for Cost Optimization", () => {
    const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

    test("VPC endpoint for ECR API exists", () => {
      expect(mainContent).toMatch(/aws_vpc_endpoint.*ecr_api/);
      expect(mainContent).toMatch(/ecr\.api/);
    });

    test("VPC endpoint for ECR DKR exists", () => {
      expect(mainContent).toMatch(/aws_vpc_endpoint.*ecr_dkr/);
      expect(mainContent).toMatch(/ecr\.dkr/);
    });

    test("VPC endpoint for CloudWatch Logs exists", () => {
      expect(mainContent).toMatch(/aws_vpc_endpoint.*logs/);
      expect(mainContent).toMatch(/\.logs/);
    });

    test("VPC endpoint for S3 exists (Gateway type)", () => {
      expect(mainContent).toMatch(/aws_vpc_endpoint.*s3/);
      expect(mainContent).toMatch(/\.s3/);
    });

    test("No NAT Gateway defined (cost optimization)", () => {
      expect(mainContent).not.toMatch(/aws_nat_gateway/);
    });
  });

  // Test Provider Configuration
  describe("Provider Configuration", () => {
    const providerContent = fs.readFileSync(
      path.join(LIB_DIR, "provider.tf"),
      "utf8"
    );

    test("Terraform version is >= 1.4.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("AWS provider version is >= 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("Provider uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  // Test Service Discovery
  describe("Service Discovery Configuration", () => {
    const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
    const ecsServicesContent = fs.readFileSync(
      path.join(LIB_DIR, "ecs_services.tf"),
      "utf8"
    );

    test("Private DNS namespace exists", () => {
      expect(mainContent).toMatch(
        /aws_service_discovery_private_dns_namespace/
      );
    });

    test("Services have service discovery configured", () => {
      expect(ecsServicesContent).toMatch(/service_registries/);
    });
  });
});
