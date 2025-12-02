// Unit tests for Terraform configuration
// Validates structure, syntax, and resource definitions

import fs from "fs";
import path from "path";

describe("Terraform Configuration Tests", () => {
  const libPath = path.resolve(__dirname, "../lib");

  describe("Main Configuration Files", () => {
    test("main.tf exists and contains required providers", () => {
      const mainPath = path.join(libPath, "main.tf");
      expect(fs.existsSync(mainPath)).toBe(true);

      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test("variables.tf exists and defines required variables", () => {
      const varsPath = path.join(libPath, "variables.tf");
      expect(fs.existsSync(varsPath)).toBe(true);

      const content = fs.readFileSync(varsPath, "utf8");
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test("outputs.tf exists and defines outputs", () => {
      const outputsPath = path.join(libPath, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);

      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"/);
    });
  });

  describe("Module Structure", () => {
    const modulesPath = path.join(libPath, "modules");

    test("modules directory exists", () => {
      expect(fs.existsSync(modulesPath)).toBe(true);
    });

    test("networking module exists with required files", () => {
      const networkingPath = path.join(modulesPath, "networking");
      expect(fs.existsSync(networkingPath)).toBe(true);
      expect(fs.existsSync(path.join(networkingPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(networkingPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(networkingPath, "outputs.tf"))).toBe(true);
    });

    test("alb module exists with required files", () => {
      const albPath = path.join(modulesPath, "alb");
      expect(fs.existsSync(albPath)).toBe(true);
      expect(fs.existsSync(path.join(albPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(albPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(albPath, "outputs.tf"))).toBe(true);
    });

    test("ecs module exists with required files", () => {
      const ecsPath = path.join(modulesPath, "ecs");
      expect(fs.existsSync(ecsPath)).toBe(true);
      expect(fs.existsSync(path.join(ecsPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(ecsPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(ecsPath, "outputs.tf"))).toBe(true);
    });

    test("rds module exists with required files", () => {
      const rdsPath = path.join(modulesPath, "rds");
      expect(fs.existsSync(rdsPath)).toBe(true);
      expect(fs.existsSync(path.join(rdsPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(rdsPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(rdsPath, "outputs.tf"))).toBe(true);
    });
  });

  describe("Resource Naming Conventions", () => {
    test("main.tf uses environment_suffix variable", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/var\.environment_suffix/);
    });

    test("networking module uses environment_suffix", () => {
      const networkingMain = path.join(libPath, "modules", "networking", "main.tf");
      const content = fs.readFileSync(networkingMain, "utf8");
      expect(content).toMatch(/var\.environment_suffix/);
    });

    test("alb module uses environment_suffix", () => {
      const albMain = path.join(libPath, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMain, "utf8");
      expect(content).toMatch(/var\.environment_suffix/);
    });

    test("ecs module uses environment_suffix", () => {
      const ecsMain = path.join(libPath, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMain, "utf8");
      expect(content).toMatch(/var\.environment_suffix/);
    });

    test("rds module uses environment_suffix", () => {
      const rdsMain = path.join(libPath, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMain, "utf8");
      expect(content).toMatch(/var\.environment_suffix/);
    });
  });

  describe("AWS Resource Definitions", () => {
    test("networking module defines VPC resources", () => {
      const networkingMain = path.join(libPath, "modules", "networking", "main.tf");
      const content = fs.readFileSync(networkingMain, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_subnet"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test("alb module defines load balancer resources", () => {
      const albMain = path.join(libPath, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMain, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"/);
      expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
      expect(content).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test("ecs module defines ECS resources", () => {
      const ecsMain = path.join(libPath, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMain, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"/);
      expect(content).toMatch(/resource\s+"aws_ecs_service"/);
    });

    test("rds module defines RDS resources", () => {
      const rdsMain = path.join(libPath, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMain, "utf8");
      expect(content).toMatch(/resource\s+"aws_rds_cluster"/);
      expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"/);
    });
  });

  describe("Security and Compliance", () => {
    test("RDS module has skip_final_snapshot for destroyability", () => {
      const rdsMain = path.join(libPath, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMain, "utf8");
      expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("main.tf defines mandatory tags", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      // Check for common_tags or tags configuration
      expect(content.toLowerCase()).toMatch(/tag/);
    });
  });

  describe("Variable Validation", () => {
    test("variables.tf includes validation rules", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      // Check for validation blocks
      const hasValidation = content.includes("validation") ||
        content.includes("condition") ||
        content.includes("error_message");
      expect(hasValidation).toBe(true);
    });
  });

  describe("Module Dependencies", () => {
    test("main.tf references all modules", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/module\s+"networking"/);
      expect(content).toMatch(/module\s+"alb"/);
      expect(content).toMatch(/module\s+"ecs"/);
      expect(content).toMatch(/module\s+"rds"/);
    });

    test("module outputs are properly referenced", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      // Check for module output references
      expect(content).toMatch(/module\.\w+\./);
    });
  });

  describe("Terraform Version Constraints", () => {
    test("main.tf specifies required_version", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/required_version/);
    });

    test("AWS provider version is specified", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/aws\s*=\s*{[^}]*version/);
    });
  });

  describe("Environment Configuration", () => {
    test("dev.tfvars exists", () => {
      const devTfvarsPath = path.join(libPath, "dev.tfvars");
      expect(fs.existsSync(devTfvarsPath)).toBe(true);
    });
  });
});
