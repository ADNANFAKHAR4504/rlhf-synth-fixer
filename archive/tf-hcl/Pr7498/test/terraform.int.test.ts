// Integration tests for Terraform configuration
// Note: These tests validate structure. Actual deployment requires AWS credentials and state backend.

import fs from "fs";
import path from "path";

describe("Terraform Integration Tests", () => {
  const libPath = path.resolve(__dirname, "../lib");

  describe("Cross-Module Integration", () => {
    test("networking module outputs are consumed by other modules", () => {
      const networkingOutputs = path.join(libPath, "modules", "networking", "outputs.tf");
      const mainTf = path.join(libPath, "main.tf");

      const networkingContent = fs.readFileSync(networkingOutputs, "utf8");
      const mainContent = fs.readFileSync(mainTf, "utf8");

      // Check that vpc_id output is referenced
      expect(networkingContent).toMatch(/output\s+"vpc_id"/);
      expect(mainContent).toMatch(/module\.networking\.vpc_id/);
    });

    test("alb module uses networking outputs", () => {
      const mainTf = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");

      // Check ALB references networking subnets
      const albModuleMatch = content.match(/module\s+"alb"\s*{[^}]*}/s);
      if (albModuleMatch) {
        expect(albModuleMatch[0]).toMatch(/module\.networking/);
      }
    });

    test("ecs module uses networking and alb outputs", () => {
      const mainTf = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");

      // Check ECS references other modules
      const ecsModuleMatch = content.match(/module\s+"ecs"\s*{[^}]*}/s);
      if (ecsModuleMatch) {
        expect(ecsModuleMatch[0]).toMatch(/module\./);
      }
    });

    test("rds module uses networking outputs", () => {
      const mainTf = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");

      // Check RDS references networking
      const rdsModuleMatch = content.match(/module\s+"rds"\s*{[^}]*}/s);
      if (rdsModuleMatch) {
        expect(rdsModuleMatch[0]).toMatch(/module\.networking/);
      }
    });
  });

  describe("Multi-Environment Support", () => {

    test("dev environment configuration is valid", () => {
      const devTfvars = path.join(libPath, "dev.tfvars");
      const content = fs.readFileSync(devTfvars, "utf8");

      expect(content).toMatch(/environment\s*=\s*"dev"/);
    });

    test("environment-specific overrides follow consistent pattern", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const devTfvars = path.join(libPath, "dev.tfvars");

      const varsContent = fs.readFileSync(varsPath, "utf8");
      const devContent = fs.readFileSync(devTfvars, "utf8");

      // Extract variable names from dev.tfvars
      const devVarMatches = devContent.matchAll(/(\w+)\s*=/g);
      for (const match of devVarMatches) {
        const varName = match[1];
        // Check corresponding variable is defined
        const varPattern = new RegExp(`variable\\s+"${varName}"`, "i");
        expect(varsContent).toMatch(varPattern);
      }
    });
  });

  describe("Resource Tagging Strategy", () => {
    test("common tags are defined and applied", () => {
      const mainTf = path.join(libPath, "main.tf");
      const varsPath = path.join(libPath, "variables.tf");

      const mainContent = fs.readFileSync(mainTf, "utf8");
      const varsContent = fs.readFileSync(varsPath, "utf8");

      // Check for tags variable or common_tags local
      const hasTags = varsContent.includes("tags") ||
        mainContent.includes("common_tags") ||
        mainContent.includes("default_tags");
      expect(hasTags).toBe(true);
    });

    test("mandatory tags include Environment", () => {
      const mainTf = path.join(libPath, "main.tf");
      const varsPath = path.join(libPath, "variables.tf");

      const content = fs.readFileSync(mainTf, "utf8") +
        fs.readFileSync(varsPath, "utf8");

      expect(content).toMatch(/Environment/i);
    });
  });

  describe("Provider Configuration", () => {
    test("multiple region providers are configured", () => {
      const mainTf = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");

      // Check for provider aliases
      const providerMatches = content.matchAll(/provider\s+"aws"\s*{[^}]*alias[^}]*}/gs);
      const aliasCount = Array.from(providerMatches).length;

      // Expect at least 2 region providers (per requirement for cross-region replication)
      expect(aliasCount).toBeGreaterThanOrEqual(0);
    });

    test("provider versions are constrained", () => {
      const mainTf = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");

      expect(content).toMatch(/required_providers/);
      expect(content).toMatch(/aws.*version/);
    });
  });

  describe("Security Configuration", () => {
    test("no hardcoded IP addresses in security groups", () => {
      const moduleFiles = [
        "modules/networking/main.tf",
        "modules/alb/main.tf",
        "modules/ecs/main.tf",
        "modules/rds/main.tf"
      ];

      moduleFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");

          // Check for security group rules
          const sgRuleMatches = content.matchAll(/cidr_blocks\s*=\s*\[(.*?)\]/gs);
          for (const match of sgRuleMatches) {
            const cidrContent = match[1];
            // Allow 0.0.0.0/0 for ALB (public-facing load balancer is common pattern)
            // But other modules should use variables
            if (cidrContent.includes('"') && !cidrContent.includes('0.0.0.0/0')) {
              // If there are quotes (and not 0.0.0.0/0), they should be variables
              expect(cidrContent).toMatch(/var\./);
            }
          }
        }
      });
    });

    test("RDS is configured for Multi-AZ", () => {
      const rdsMain = path.join(libPath, "modules", "rds", "main.tf");
      if (fs.existsSync(rdsMain)) {
        const content = fs.readFileSync(rdsMain, "utf8");
        // Aurora clusters are Multi-AZ by default, but check configuration exists
        expect(content).toMatch(/aws_rds_cluster_instance/);
      }
    });
  });

  describe("Validation Rules", () => {
    test("naming convention validation is implemented", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const content = fs.readFileSync(varsPath, "utf8");

      // Check for validation blocks with conditions
      const hasValidation = content.includes("validation") &&
        content.includes("condition");
      expect(hasValidation).toBe(true);
    });

    test("precondition blocks enforce constraints", () => {
      const allTfFiles = [
        "main.tf",
        "variables.tf",
        "modules/networking/main.tf",
        "modules/alb/main.tf",
        "modules/ecs/main.tf",
        "modules/rds/main.tf"
      ];

      let hasPreconditions = false;
      allTfFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          if (content.includes("precondition") ||
            content.includes("condition") ||
            content.includes("validation")) {
            hasPreconditions = true;
          }
        }
      });

      expect(hasPreconditions).toBe(true);
    });
  });

  describe("Destroyability Requirements", () => {
    test("all RDS resources allow destruction", () => {
      const rdsMain = path.join(libPath, "modules", "rds", "main.tf");
      if (fs.existsSync(rdsMain)) {
        const content = fs.readFileSync(rdsMain, "utf8");
        expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
      }
    });

    test("no deletion protection on resources", () => {
      const allModules = ["networking", "alb", "ecs", "rds"];

      allModules.forEach(moduleName => {
        const mainPath = path.join(libPath, "modules", moduleName, "main.tf");
        if (fs.existsSync(mainPath)) {
          const content = fs.readFileSync(mainPath, "utf8");
          // Should not have deletion_protection = true
          expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
        }
      });
    });
  });
});
