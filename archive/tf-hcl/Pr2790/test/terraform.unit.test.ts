// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Stack Validation", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists", () => {
    const exists = fs.existsSync(providerPath);
    if (!exists) {
      console.error(`[unit] Expected provider at: ${providerPath}`);
    }
    expect(exists).toBe(true);
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains AWS provider configuration", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test("provider.tf contains random provider configuration", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"random"/);
    });

    test("provider.tf defines us-east-1 and us-west-2 providers", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/alias\s*=\s*"us_east_1"/);
      expect(content).toMatch(/alias\s*=\s*"us_west_2"/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares required variables", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/variable\s+"allowed_ssh_cidr"/);
      expect(content).toMatch(/variable\s+"company_name"/);
      expect(content).toMatch(/variable\s+"db_instance_class"/);
      expect(content).toMatch(/variable\s+"ec2_instance_type"/);
    });

    test("variables have proper descriptions", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/description\s*=\s*"CIDR block allowed for SSH access"/);
      expect(content).toMatch(/description\s*=\s*"Company name for resource naming"/);
      expect(content).toMatch(/description\s*=\s*"RDS instance class"/);
      expect(content).toMatch(/description\s*=\s*"EC2 instance type"/);
    });
  });

  describe("Environment Configuration", () => {
    test("defines three environments (dev, staging, prod)", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/environments\s*=\s*{/);
      expect(content).toMatch(/dev\s*=\s*{/);
      expect(content).toMatch(/staging\s*=\s*{/);
      expect(content).toMatch(/prod\s*=\s*{/);
    });

    test("each environment has required configuration", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/name\s*=\s*"dev"/);
      expect(content).toMatch(/name\s*=\s*"staging"/);
      expect(content).toMatch(/name\s*=\s*"prod"/);
      expect(content).toMatch(/region/);
      expect(content).toMatch(/vpc_cidr/);
      expect(content).toMatch(/cost_center/);
    });
  });

  describe("Core Infrastructure Resources", () => {
    test("defines VPC resources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_subnet"/);
      expect(content).toMatch(/resource\s+"aws_route_table"/);
    });

    test("defines VPC and subnets", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_subnet"/);
    });

    test("defines Internet Gateway", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
    });
  });

  describe("Security and Compliance", () => {
    test("defines Security Groups", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"/);
      expect(content).toMatch(/ingress\s*{/);
      expect(content).toMatch(/egress\s*{/);
    });

    test("defines security groups for web and database", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group".*web/);
      expect(content).toMatch(/resource\s+"aws_security_group".*rds/);
    });
  });

  describe("Monitoring and Automation", () => {
    test("defines route tables and associations", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route_table"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test("defines basic infrastructure components", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      // Test for basic infrastructure that exists in the simplified version
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_subnet"/);
      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });
  });

  describe("Storage and Parameters", () => {
    test("defines random password for future database use", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"random_password"/);
    });
  });

  describe("Outputs", () => {
    test("defines environment outputs", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/output\s+"environment_info"/);
    });
  });

  describe("Code Quality", () => {
    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("uses proper tagging strategy", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/common_tags/);
      expect(content).toMatch(/merge\(local\.common_tags/);
    });

    test("uses for_each for environment resources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/for_each\s*=\s*local\.environments/);
    });
  });
});
