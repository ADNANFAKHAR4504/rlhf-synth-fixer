// tests/unit/unit-tests.ts
// Unit tests for production AWS infrastructure
// Tests Terraform file structure and basic syntax validation

import fs from "fs";
import path from "path";

const MAIN_TF_REL = "../lib/main.tf"; // Single consolidated file
const mainTfPath = path.resolve(__dirname, MAIN_TF_REL);
const libPath = path.resolve(__dirname, "../lib");

describe("Production AWS Infrastructure - Unit Tests", () => {
  
  describe("File Structure", () => {
    test("main.tf exists (single consolidated file)", () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      const providerPath = path.resolve(libPath, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("does NOT use split files (following team standards)", () => {
      const variablesPath = path.resolve(libPath, "variables.tf");
      const outputsPath = path.resolve(libPath, "outputs.tf");
      const dataPath = path.resolve(libPath, "data.tf");
      const tapStackPath = path.resolve(libPath, "tap_stack.tf");
      
      // These should not exist in single-file approach
      expect(fs.existsSync(variablesPath)).toBe(false);
      expect(fs.existsSync(outputsPath)).toBe(false);
      expect(fs.existsSync(dataPath)).toBe(false);
      expect(fs.existsSync(tapStackPath)).toBe(false);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf has correct Terraform version constraint", () => {
      const providerPath = path.resolve(libPath, "provider.tf");
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.1\.0"/);
    });

    test("provider.tf includes default_tags with Environment = Production", () => {
      const providerPath = path.resolve(libPath, "provider.tf");
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
    });

    test("main.tf does NOT declare provider (provider.tf owns providers)", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Single File Structure", () => {
    test("main.tf declares aws_region variable", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("main.tf contains all required sections", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      
      // Variables section
      expect(content).toMatch(/# Variables/);
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"allowed_cidrs"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
      
      // Data sources section
      expect(content).toMatch(/# Data Sources/);
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      
      // Locals section
      expect(content).toMatch(/# Locals/);
      expect(content).toMatch(/locals\s*{/);
      
      // Outputs section
      expect(content).toMatch(/# Outputs/);
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"load_balancer_dns"/);
    });
  });

  describe("Infrastructure Resources", () => {
    test("main.tf declares VPC resource", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("main.tf declares Auto Scaling Group", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test("main.tf declares Application Load Balancer", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("main.tf declares S3 buckets with logging", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"log_bucket"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_bucket"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"/);
    });

    test("main.tf declares multiple subnets across AZs", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });
  });

  describe("Security Configuration", () => {
    test("security groups restrict ALB to port 80", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/to_port\s*=\s*80/);
    });

    test("EC2 security group allows traffic from ALB security group", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("S3 buckets have public access blocked", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  describe("Variables and Defaults", () => {
    test("aws_region defaults to us-west-2", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-west-2"/);
    });

    test("project_name defaults to base", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/variable\s+"project_name"[\s\S]*?default\s*=\s*"base"/);
    });

    test("environment defaults to production", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"production"/);
    });
  });

  describe("Naming Convention", () => {
    test("uses base-production naming pattern", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/);
    });

    test("resources use consistent naming with name_prefix", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/);
      expect(content).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-alb"/);
      expect(content).toMatch(/value\s*=\s*"\$\{local\.name_prefix\}-asg"/);
    });
  });

  describe("Required Outputs", () => {
    test("outputs all required values for integration tests", () => {
      const content = fs.readFileSync(mainTfPath, "utf8");
      
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"load_balancer_dns"/);
      expect(content).toMatch(/output\s+"load_balancer_name"/);
      expect(content).toMatch(/output\s+"load_balancer_arn"/);
      expect(content).toMatch(/output\s+"target_group_name"/);
      expect(content).toMatch(/output\s+"target_group_arn"/);
      expect(content).toMatch(/output\s+"s3_app_bucket_name"/);
      expect(content).toMatch(/output\s+"s3_log_bucket_name"/);
      expect(content).toMatch(/output\s+"autoscaling_group_name"/);
      expect(content).toMatch(/output\s+"security_group_alb_id"/);
      expect(content).toMatch(/output\s+"security_group_ec2_id"/);
      expect(content).toMatch(/output\s+"aws_region"/);
    });
  });

});