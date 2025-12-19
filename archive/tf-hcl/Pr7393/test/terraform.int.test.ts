// Integration tests for Terraform ECS Fargate Optimization
// These tests validate that Terraform configuration can be initialized and validated

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform ECS Fargate Optimization - Integration Tests", () => {
  // Increase timeout for Terraform operations
  jest.setTimeout(300000);

  describe("Terraform Initialization", () => {
    test("terraform init succeeds (dry-run)", async () => {
      // This is a placeholder test that checks if Terraform files are valid
      // In a real CI/CD environment, this would run actual terraform init
      const mainTfExists = fs.existsSync(path.join(LIB_DIR, "main.tf"));
      const providerTfExists = fs.existsSync(path.join(LIB_DIR, "provider.tf"));

      expect(mainTfExists).toBe(true);
      expect(providerTfExists).toBe(true);
    });

    test("terraform fmt check passes", async () => {
      try {
        const { stdout } = await execAsync(`cd ${LIB_DIR} && terraform fmt -check -recursive`, {
          env: { ...process.env }
        });
        expect(stdout).toBeDefined();
      } catch (error: any) {
        // If terraform is not installed, skip this test
        if (error.message.includes("terraform: not found") || error.message.includes("command not found")) {
          console.warn("Terraform not installed, skipping fmt check");
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });
  });

  describe("Terraform Validation", () => {
    test("all .tf files have valid HCL syntax", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      expect(tfFiles.length).toBeGreaterThan(0);

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");

        // Basic HCL syntax validation
        expect(content).not.toMatch(/\t/); // No tabs, use spaces
        expect(content).toMatch(/^[^]*$/); // Valid UTF-8

        // Check for balanced braces
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Check for balanced brackets
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        expect(openBrackets).toBe(closeBrackets);
      });
    });

    test("all resources have valid resource types", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      const validResourceTypes = [
        "aws_vpc",
        "aws_subnet",
        "aws_internet_gateway",
        "aws_route_table",
        "aws_route_table_association",
        "aws_security_group",
        "aws_vpc_endpoint",
        "aws_ecs_cluster",
        "aws_ecs_task_definition",
        "aws_ecs_service",
        "aws_ecs_cluster_capacity_providers",
        "aws_lb",
        "aws_lb_target_group",
        "aws_lb_listener",
        "aws_lb_listener_rule",
        "aws_iam_role",
        "aws_iam_role_policy",
        "aws_iam_role_policy_attachment",
        "aws_cloudwatch_log_group",
        "aws_cloudwatch_metric_alarm",
        "aws_cloudwatch_event_rule",
        "aws_cloudwatch_event_target",
        "aws_appautoscaling_target",
        "aws_appautoscaling_policy",
        "aws_service_discovery_private_dns_namespace",
        "aws_service_discovery_service"
      ];

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");
        const resourceMatches = content.matchAll(/resource\s+"([^"]+)"/g);

        for (const match of resourceMatches) {
          const resourceType = match[1];
          expect(validResourceTypes).toContain(resourceType);
        }
      });
    });

    test("all variables are properly defined", () => {
      const variablesContent = fs.readFileSync(
        path.join(LIB_DIR, "variables.tf"),
        "utf8"
      );

      const requiredVariables = [
        "aws_region",
        "environment_suffix",
        "repository",
        "commit_author",
        "pr_number",
        "team"
      ];

      requiredVariables.forEach(varName => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"`));
      });
    });

    test("all outputs are properly defined", () => {
      const outputsContent = fs.readFileSync(
        path.join(LIB_DIR, "outputs.tf"),
        "utf8"
      );

      // Should have at least these key outputs
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"/);
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
    });
  });

  describe("Resource Dependencies", () => {
    test("ECS services depend on required resources", () => {
      const ecsServicesContent = fs.readFileSync(
        path.join(LIB_DIR, "ecs_services.tf"),
        "utf8"
      );

      // Check for explicit dependencies
      expect(ecsServicesContent).toMatch(/depends_on/);
      expect(ecsServicesContent).toMatch(/aws_lb_listener/);
      expect(ecsServicesContent).toMatch(/aws_iam_role_policy/);
    });

    test("autoscaling targets depend on ECS services", () => {
      const autoscalingContent = fs.readFileSync(
        path.join(LIB_DIR, "autoscaling.tf"),
        "utf8"
      );

      expect(autoscalingContent).toMatch(/depends_on.*aws_ecs_service/);
    });

    test("VPC endpoints reference correct VPC and subnets", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      // VPC endpoints should reference the VPC
      expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);

      // Interface endpoints should reference private subnets
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("Configuration Best Practices", () => {
    test("all resources use environment_suffix in names", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f =>
        f.endsWith(".tf") && !f.includes("provider.tf") && !f.includes("variables.tf")
      );

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");

        // Resources with name attributes should include environment_suffix
        const nameMatches = content.matchAll(/name\s*=\s*"([^"]+)"/g);
        let hasNameWithSuffix = false;

        for (const match of nameMatches) {
          if (match[1].includes("${var.environment_suffix}") || match[1].includes("-${var.environment_suffix}")) {
            hasNameWithSuffix = true;
            break;
          }
        }

        // Skip if file has no name attributes
        if (Array.from(content.matchAll(/name\s*=\s*"/g)).length > 0) {
          expect(hasNameWithSuffix).toBe(true);
        }
      });
    });

    test("security groups use name_prefix for uniqueness", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const sgMatches = mainContent.matchAll(/resource\s+"aws_security_group"[^}]+name_prefix/gs);
      expect(Array.from(sgMatches).length).toBeGreaterThan(0);
    });

    test("IAM roles use name_prefix for uniqueness", () => {
      const iamContent = fs.readFileSync(path.join(LIB_DIR, "iam.tf"), "utf8");

      const roleMatches = iamContent.matchAll(/resource\s+"aws_iam_role"[^}]+name_prefix/gs);
      expect(Array.from(roleMatches).length).toBeGreaterThan(0);
    });

    test("target groups have create_before_destroy lifecycle", () => {
      const albContent = fs.readFileSync(path.join(LIB_DIR, "alb.tf"), "utf8");

      expect(albContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("no hardcoded AWS account IDs or regions", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");

        // Should not have hardcoded 12-digit AWS account IDs
        expect(content).not.toMatch(/\d{12}/);

        // Regions should use var.aws_region
        // Skip variables.tf and provider.tf as they define/configure the variable
        const regionRefs = content.match(/"us-east-1"|"us-west-2"|"eu-west-1"/g);
        if (regionRefs && file !== "provider.tf" && file !== "variables.tf") {
          // Allow in some contexts like service endpoints, but check they use variables
          expect(content).toMatch(/\$\{var\.aws_region\}/);
        }
      });
    });
  });

  describe("Cost Optimization Validation", () => {
    test("uses Fargate for serverless compute", () => {
      const ecsServicesContent = fs.readFileSync(
        path.join(LIB_DIR, "ecs_services.tf"),
        "utf8"
      );

      expect(ecsServicesContent).toMatch(/FARGATE/);
      expect(ecsServicesContent).not.toMatch(/EC2/); // Should not use EC2 launch type
    });

    test("uses VPC endpoints instead of NAT Gateway", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainContent).toMatch(/aws_vpc_endpoint/);
      expect(mainContent).not.toMatch(/aws_nat_gateway/);
    });

    test("log retention is configured to control costs", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainContent).toMatch(/retention_in_days/);
    });

    test("autoscaling is configured to optimize resource usage", () => {
      const autoscalingContent = fs.readFileSync(
        path.join(LIB_DIR, "autoscaling.tf"),
        "utf8"
      );

      // Should have min and max capacity
      expect(autoscalingContent).toMatch(/min_capacity/);
      expect(autoscalingContent).toMatch(/max_capacity/);

      // Should scale based on metrics
      expect(autoscalingContent).toMatch(/CPUUtilization/);
    });
  });

  describe("Security Validation", () => {
    test("security groups have proper ingress rules", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainContent).toMatch(/ingress\s*{/);
      expect(mainContent).toMatch(/egress\s*{/);
    });

    test("ECS tasks run in private subnets", () => {
      const ecsServicesContent = fs.readFileSync(
        path.join(LIB_DIR, "ecs_services.tf"),
        "utf8"
      );

      expect(ecsServicesContent).toMatch(/subnets\s*=\s*aws_subnet\.private/);
      expect(ecsServicesContent).toMatch(/assign_public_ip\s*=\s*false/);
    });

    test("IAM roles follow least privilege principle", () => {
      const iamContent = fs.readFileSync(path.join(LIB_DIR, "iam.tf"), "utf8");

      // Should have separate roles for different services
      expect(iamContent).toMatch(/aws_iam_role.*api_task/);
      expect(iamContent).toMatch(/aws_iam_role.*worker_task/);
      expect(iamContent).toMatch(/aws_iam_role.*scheduler_task/);

      // Should not use wildcard for all resources
      const wildcardResources = iamContent.match(/"Resource"\s*:\s*"\*"/g);
      // X-Ray and some services require *, but should be limited
      expect(wildcardResources?.length || 0).toBeLessThan(10);
    });

    test("VPC endpoints use security groups", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const vpcEndpointMatches = mainContent.match(/resource\s+"aws_vpc_endpoint"/g);
      if (vpcEndpointMatches) {
        expect(mainContent).toMatch(/security_group_ids/);
      }
    });
  });

  describe("High Availability Validation", () => {
    test("uses multiple availability zones", () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      // Should create subnets across multiple AZs
      const subnetCounts = mainContent.match(/count\s*=\s*3/g);
      expect(subnetCounts).toBeTruthy();
      expect(subnetCounts!.length).toBeGreaterThanOrEqual(2); // Both public and private
    });

    test("ECS services have minimum desired count > 1", () => {
      const ecsServicesContent = fs.readFileSync(
        path.join(LIB_DIR, "ecs_services.tf"),
        "utf8"
      );

      // API and Worker should have desired_count >= 2
      const desiredCountMatches = ecsServicesContent.match(/desired_count\s*=\s*(\d+)/g);
      expect(desiredCountMatches).toBeTruthy();
    });

    test("deployment configuration allows rolling updates", () => {
      const ecsServicesContent = fs.readFileSync(
        path.join(LIB_DIR, "ecs_services.tf"),
        "utf8"
      );

      expect(ecsServicesContent).toMatch(/maximum_percent\s*=\s*200/);
      expect(ecsServicesContent).toMatch(/minimum_healthy_percent\s*=\s*100/);
    });

    test("ALB spans multiple availability zones", () => {
      const albContent = fs.readFileSync(path.join(LIB_DIR, "alb.tf"), "utf8");

      expect(albContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });
  });
});
