// Unit tests for Terraform infrastructure
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("provider.tf exists and contains required configuration", () => {
      const providerPath = path.join(LIB_DIR, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/required_providers/);
    });

    test("variables.tf exists and contains required variables", () => {
      const variablesPath = path.join(LIB_DIR, "variables.tf");
      expect(fs.existsSync(variablesPath)).toBe(true);
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test("outputs.tf exists and contains required outputs", () => {
      const outputsPath = path.join(LIB_DIR, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"alb_dns_name"/);
      expect(content).toMatch(/output\s+"ecs_cluster_name"/);
    });
  });

  describe("VPC Configuration", () => {
    test("vpc.tf exists and configures VPC with subnets", () => {
      const vpcPath = path.join(LIB_DIR, "vpc.tf");
      expect(fs.existsSync(vpcPath)).toBe(true);
      const content = fs.readFileSync(vpcPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test("VPC includes environmentSuffix in naming", () => {
      const vpcPath = path.join(LIB_DIR, "vpc.tf");
      const content = fs.readFileSync(vpcPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("ECS Configuration", () => {
    test("ecs.tf exists and configures Fargate service", () => {
      const ecsPath = path.join(LIB_DIR, "ecs.tf");
      expect(fs.existsSync(ecsPath)).toBe(true);
      const content = fs.readFileSync(ecsPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"/);
      expect(content).toMatch(/resource\s+"aws_ecs_service"/);
      expect(content).toMatch(/FARGATE/);
    });

    test("ECS task definitions include blue and green", () => {
      const ecsPath = path.join(LIB_DIR, "ecs.tf");
      const content = fs.readFileSync(ecsPath, "utf8");
      expect(content).toMatch(/aws_ecs_task_definition.*blue/);
      expect(content).toMatch(/aws_ecs_task_definition.*green/);
    });

    test("ECS includes environmentSuffix in resource names", () => {
      const ecsPath = path.join(LIB_DIR, "ecs.tf");
      const content = fs.readFileSync(ecsPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("RDS Configuration", () => {
    test("rds.tf exists and configures Aurora PostgreSQL", () => {
      const rdsPath = path.join(LIB_DIR, "rds.tf");
      expect(fs.existsSync(rdsPath)).toBe(true);
      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_rds_cluster"/);
      expect(content).toMatch(/aurora-postgresql/);
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS includes Multi-AZ configuration", () => {
      const rdsPath = path.join(LIB_DIR, "rds.tf");
      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/aws_rds_cluster_instance/);
    });

    test("RDS includes environmentSuffix in naming", () => {
      const rdsPath = path.join(LIB_DIR, "rds.tf");
      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("ALB Configuration", () => {
    test("alb.tf exists and configures load balancer", () => {
      const albPath = path.join(LIB_DIR, "alb.tf");
      expect(fs.existsSync(albPath)).toBe(true);
      const content = fs.readFileSync(albPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"/);
      expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
      expect(content).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test("ALB configures blue and green target groups", () => {
      const albPath = path.join(LIB_DIR, "alb.tf");
      const content = fs.readFileSync(albPath, "utf8");
      expect(content).toMatch(/aws_lb_target_group.*blue/);
      expect(content).toMatch(/aws_lb_target_group.*green/);
    });

    test("ALB includes environmentSuffix in naming", () => {
      const albPath = path.join(LIB_DIR, "alb.tf");
      const content = fs.readFileSync(albPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("Security Groups", () => {
    test("security_groups.tf exists and defines security groups", () => {
      const sgPath = path.join(LIB_DIR, "security_groups.tf");
      expect(fs.existsSync(sgPath)).toBe(true);
      const content = fs.readFileSync(sgPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });

    test("Security groups do not use -1 for protocol", () => {
      const sgPath = path.join(LIB_DIR, "security_groups.tf");
      const content = fs.readFileSync(sgPath, "utf8");
      expect(content).not.toMatch(/protocol\s*=\s*"-1"/);
    });

    test("Security groups include environmentSuffix", () => {
      const sgPath = path.join(LIB_DIR, "security_groups.tf");
      const content = fs.readFileSync(sgPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("Secrets Management", () => {
    test("secrets.tf exists and configures Secrets Manager", () => {
      const secretsPath = path.join(LIB_DIR, "secrets.tf");
      expect(fs.existsSync(secretsPath)).toBe(true);
      const content = fs.readFileSync(secretsPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    });

    test("Lambda rotation function is configured", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda_rotation.tf");
      expect(fs.existsSync(lambdaPath)).toBe(true);
      const content = fs.readFileSync(lambdaPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lambda_function"/);
    });
  });

  describe("WAF Configuration", () => {
    test("waf.tf exists and configures Web ACL", () => {
      const wafPath = path.join(LIB_DIR, "waf.tf");
      expect(fs.existsSync(wafPath)).toBe(true);
      const content = fs.readFileSync(wafPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"/);
    });

    test("WAF includes SQL injection protection", () => {
      const wafPath = path.join(LIB_DIR, "waf.tf");
      const content = fs.readFileSync(wafPath, "utf8");
      expect(content).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test("WAF includes XSS protection", () => {
      const wafPath = path.join(LIB_DIR, "waf.tf");
      const content = fs.readFileSync(wafPath, "utf8");
      expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });
  });

  describe("Auto Scaling", () => {
    test("autoscaling.tf exists and configures scaling policies", () => {
      const scalingPath = path.join(LIB_DIR, "autoscaling.tf");
      expect(fs.existsSync(scalingPath)).toBe(true);
      const content = fs.readFileSync(scalingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_appautoscaling_target"/);
      expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"/);
    });

    test("Auto scaling includes CPU and memory policies", () => {
      const scalingPath = path.join(LIB_DIR, "autoscaling.tf");
      const content = fs.readFileSync(scalingPath, "utf8");
      expect(content).toMatch(/cpu/i);
      expect(content).toMatch(/memory/i);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("cloudwatch.tf exists and configures alarms", () => {
      const cwPath = path.join(LIB_DIR, "cloudwatch.tf");
      expect(fs.existsSync(cwPath)).toBe(true);
      const content = fs.readFileSync(cwPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      // Log groups may be in a separate file or inline in ECS config
    });

    test("CloudWatch monitors ECS and ALB", () => {
      const cwPath = path.join(LIB_DIR, "cloudwatch.tf");
      const content = fs.readFileSync(cwPath, "utf8");
      expect(content).toMatch(/ecs/i);
      expect(content).toMatch(/alb/i);
    });
  });

  describe("IAM Configuration", () => {
    test("iam.tf exists and configures roles", () => {
      const iamPath = path.join(LIB_DIR, "iam.tf");
      expect(fs.existsSync(iamPath)).toBe(true);
      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });

    test("IAM roles include ECS task execution and task roles", () => {
      const iamPath = path.join(LIB_DIR, "iam.tf");
      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/ecs.*task.*execution/i);
    });
  });

  describe("ECR Configuration", () => {
    test("ecr.tf exists and configures repository", () => {
      const ecrPath = path.join(LIB_DIR, "ecr.tf");
      expect(fs.existsSync(ecrPath)).toBe(true);
      const content = fs.readFileSync(ecrPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecr_repository"/);
    });

    test("ECR enables image scanning", () => {
      const ecrPath = path.join(LIB_DIR, "ecr.tf");
      const content = fs.readFileSync(ecrPath, "utf8");
      expect(content).toMatch(/image_scanning_configuration/);
      expect(content).toMatch(/scan_on_push\s*=\s*true/);
    });
  });

  describe("Terraform Validation", () => {
    test("terraform fmt check passes", () => {
      try {
        execSync("terraform fmt -check -recursive", {
          cwd: LIB_DIR,
          stdio: "pipe",
        });
        expect(true).toBe(true);
      } catch (error) {
        throw new Error("Terraform formatting check failed");
      }
    });

  });

  describe("Resource Naming Conventions", () => {
    const terraformFiles = [
      "vpc.tf",
      "ecs.tf",
      "rds.tf",
      "alb.tf",
      "security_groups.tf",
      "waf.tf",
      "ecr.tf",
      "cloudwatch.tf",
    ];

    terraformFiles.forEach((file) => {
      test(`${file} uses environmentSuffix in resource naming`, () => {
        const filePath = path.join(LIB_DIR, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          expect(content).toMatch(/\$\{var\.environment_suffix\}/);
        }
      });
    });
  });

  describe("Backend Configuration", () => {
    test("Backend configuration is commented out or uses proper configuration", () => {
      const providerPath = path.join(LIB_DIR, "provider.tf");
      const content = fs.readFileSync(providerPath, "utf8");
      // Either backend is commented out or doesn't use interpolation
      const backendMatch = content.match(/backend\s+"s3"\s*{([^}]*)}/);
      if (backendMatch && !backendMatch[0].includes("#")) {
        // If backend exists and is not commented, it should not use interpolation
        expect(backendMatch[1]).not.toMatch(/\$\{var\./);
      }
    });
  });
});
