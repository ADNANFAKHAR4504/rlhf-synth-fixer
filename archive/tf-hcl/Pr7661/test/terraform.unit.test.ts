// Unit tests for Terraform multi-environment infrastructure
// Tests validate Terraform configuration structure and syntax

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("main.tf exists and is valid", () => {
      const mainTf = path.join(LIB_DIR, "main.tf");
      expect(fs.existsSync(mainTf)).toBe(true);
      const content = fs.readFileSync(mainTf, "utf8");
      expect(content).toContain('module "vpc"');
      expect(content).toContain('module "compute"');
      expect(content).toContain('module "database"');
      expect(content).toContain('module "storage"');
    });

    test("variables.tf exists and defines required variables", () => {
      const variablesTf = path.join(LIB_DIR, "variables.tf");
      expect(fs.existsSync(variablesTf)).toBe(true);
      const content = fs.readFileSync(variablesTf, "utf8");
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('variable "vpc_cidr"');
      expect(content).toContain('variable "aws_region"');
    });

    test("provider.tf exists and configures AWS provider", () => {
      const providerTf = path.join(LIB_DIR, "provider.tf");
      expect(fs.existsSync(providerTf)).toBe(true);
      const content = fs.readFileSync(providerTf, "utf8");
      expect(content).toContain('provider "aws"');
      expect(content).toContain("required_version");
    });

    test("outputs.tf exists and defines outputs", () => {
      const outputsTf = path.join(LIB_DIR, "outputs.tf");
      expect(fs.existsSync(outputsTf)).toBe(true);
      const content = fs.readFileSync(outputsTf, "utf8");
      expect(content).toContain("output");
    });

    test("backend.tf exists", () => {
      const backendTf = path.join(LIB_DIR, "backend.tf");
      expect(fs.existsSync(backendTf)).toBe(true);
    });
  });

  describe("Environment-Specific Configuration Files", () => {
    test("dev.tfvars exists and contains development configuration", () => {
      const devTfvars = path.join(LIB_DIR, "dev.tfvars");
      expect(fs.existsSync(devTfvars)).toBe(true);
      const content = fs.readFileSync(devTfvars, "utf8");
      expect(content).toContain("environment_suffix");
      expect(content).toContain("vpc_cidr");
      expect(content).toContain('instance_type');
    });

    test("staging.tfvars exists and contains staging configuration", () => {
      const stagingTfvars = path.join(LIB_DIR, "staging.tfvars");
      expect(fs.existsSync(stagingTfvars)).toBe(true);
      const content = fs.readFileSync(stagingTfvars, "utf8");
      expect(content).toContain("environment_suffix");
      expect(content).toContain("vpc_cidr");
    });

    test("prod.tfvars exists and contains production configuration", () => {
      const prodTfvars = path.join(LIB_DIR, "prod.tfvars");
      expect(fs.existsSync(prodTfvars)).toBe(true);
      const content = fs.readFileSync(prodTfvars, "utf8");
      expect(content).toContain("environment_suffix");
      expect(content).toContain("vpc_cidr");
    });
  });

  describe("Module Structure", () => {
    const modules = ["vpc", "compute", "database", "storage"];

    modules.forEach((moduleName) => {
      describe(`${moduleName} module`, () => {
        const modulePath = path.join(LIB_DIR, "modules", moduleName);

        test(`${moduleName} module directory exists`, () => {
          expect(fs.existsSync(modulePath)).toBe(true);
        });

        test(`${moduleName}/main.tf exists`, () => {
          const mainTf = path.join(modulePath, "main.tf");
          expect(fs.existsSync(mainTf)).toBe(true);
        });

        test(`${moduleName}/variables.tf exists`, () => {
          const variablesTf = path.join(modulePath, "variables.tf");
          expect(fs.existsSync(variablesTf)).toBe(true);
        });

        test(`${moduleName}/outputs.tf exists`, () => {
          const outputsTf = path.join(modulePath, "outputs.tf");
          expect(fs.existsSync(outputsTf)).toBe(true);
        });
      });
    });
  });

  describe("Resource Naming Convention", () => {
    test("main.tf uses name_prefix with environment_suffix", () => {
      const mainTf = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("environment_suffix");
      expect(content).toMatch(/name_prefix\s*=.*environment_suffix/s);
    });

    test("VPC module uses name_prefix for resource naming", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("${var.name_prefix}");
    });

    test("Compute module uses name_prefix for resource naming", () => {
      const computeMain = path.join(LIB_DIR, "modules/compute/main.tf");
      const content = fs.readFileSync(computeMain, "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("${var.name_prefix}");
    });

    test("Database module uses name_prefix for resource naming", () => {
      const dbMain = path.join(LIB_DIR, "modules/database/main.tf");
      const content = fs.readFileSync(dbMain, "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("${var.name_prefix}");
    });

    test("Storage module uses name_prefix for resource naming", () => {
      const storageMain = path.join(LIB_DIR, "modules/storage/main.tf");
      const content = fs.readFileSync(storageMain, "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("${var.name_prefix}");
    });
  });

  describe("Terraform Syntax Validation", () => {
    test("terraform fmt -check passes", () => {
      const result = execSync("terraform fmt -check -recursive", { cwd: LIB_DIR, stdio: "pipe" });
      expect(result).toBeDefined();
    });
  });

  describe("Workspace Configuration", () => {
    test("main.tf uses terraform.workspace for environment", () => {
      const mainTf = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");
      expect(content).toContain("terraform.workspace");
    });

    test("provider.tf uses terraform.workspace for tagging", () => {
      const providerTf = path.join(LIB_DIR, "provider.tf");
      const content = fs.readFileSync(providerTf, "utf8");
      expect(content).toContain("terraform.workspace");
      expect(content).toContain("Environment");
    });
  });

  describe("Database Configuration", () => {
    test("RDS instance configured with proper settings", () => {
      const dbMain = path.join(LIB_DIR, "modules/database/main.tf");
      const content = fs.readFileSync(dbMain, "utf8");
      expect(content).toMatch(/engine\s*=\s*"postgres"/);
      expect(content).toContain("skip_final_snapshot");
      expect(content).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("Database parameter group configured correctly", () => {
      const dbMain = path.join(LIB_DIR, "modules/database/main.tf");
      const content = fs.readFileSync(dbMain, "utf8");
      expect(content).toContain("aws_db_parameter_group");
      expect(content).toMatch(/family\s*=\s*"postgres15"/);
    });

    test("Secrets Manager integration present", () => {
      const mainTf = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTf, "utf8");
      expect(content).toContain("aws_secretsmanager_secret");
      expect(content).toContain("db_credentials");
    });
  });

  describe("Storage Configuration", () => {
    test("S3 buckets configured with encryption", () => {
      const storageMain = path.join(LIB_DIR, "modules/storage/main.tf");
      const content = fs.readFileSync(storageMain, "utf8");
      expect(content).toContain("aws_s3_bucket_server_side_encryption_configuration");
    });

    test("S3 buckets use bucket_prefix for naming", () => {
      const storageMain = path.join(LIB_DIR, "modules/storage/main.tf");
      const content = fs.readFileSync(storageMain, "utf8");
      expect(content).toContain("bucket_prefix");
    });
  });

  describe("Compute Configuration", () => {
    test("Auto Scaling Group configured", () => {
      const computeMain = path.join(LIB_DIR, "modules/compute/main.tf");
      const content = fs.readFileSync(computeMain, "utf8");
      expect(content).toContain("aws_autoscaling_group");
      expect(content).toContain("min_size");
      expect(content).toContain("max_size");
      expect(content).toContain("desired_capacity");
    });

    test("Application Load Balancer configured", () => {
      const computeMain = path.join(LIB_DIR, "modules/compute/main.tf");
      const content = fs.readFileSync(computeMain, "utf8");
      expect(content).toContain("aws_lb");
      expect(content).toContain("aws_lb_target_group");
      expect(content).toContain("aws_lb_listener");
    });

    test("Launch Template configured", () => {
      const computeMain = path.join(LIB_DIR, "modules/compute/main.tf");
      const content = fs.readFileSync(computeMain, "utf8");
      expect(content).toContain("aws_launch_template");
    });

    test("IAM role for EC2 instances configured", () => {
      const computeMain = path.join(LIB_DIR, "modules/compute/main.tf");
      const content = fs.readFileSync(computeMain, "utf8");
      expect(content).toContain("aws_iam_role");
      expect(content).toContain("aws_iam_instance_profile");
    });
  });

  describe("Network Configuration", () => {
    test("VPC configured with proper settings", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_vpc");
      expect(content).toContain("enable_dns_hostnames");
      expect(content).toContain("enable_dns_support");
    });

    test("Public and private subnets configured", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_subnet");
      expect(content).toMatch(/public/i);
      expect(content).toMatch(/private/i);
    });

    test("NAT Gateway configured", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_nat_gateway");
      expect(content).toContain("aws_eip");
    });

    test("Internet Gateway configured", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_internet_gateway");
    });

    test("Security groups configured", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_security_group");
    });

    test("Route tables configured", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain("aws_route_table");
    });
  });

  describe("Tagging Strategy", () => {
    test("Provider default tags configured", () => {
      const providerTf = path.join(LIB_DIR, "provider.tf");
      const content = fs.readFileSync(providerTf, "utf8");
      expect(content).toContain("default_tags");
      expect(content).toContain("Environment");
      expect(content).toContain("Project");
      expect(content).toContain("ManagedBy");
    });

    test("VPC resources have Name tags", () => {
      const vpcMain = path.join(LIB_DIR, "modules/vpc/main.tf");
      const content = fs.readFileSync(vpcMain, "utf8");
      expect(content).toContain('Name = ');
    });
  });
});
