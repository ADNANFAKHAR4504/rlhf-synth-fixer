// tests/unit/unit-tests.ts
// Unit tests for production AWS infrastructure
// Tests Terraform file structure and basic syntax validation

import fs from "fs";
import path from "path";

const LIB_DIR = "../lib";
const libPath = path.resolve(__dirname, LIB_DIR);

describe("Production AWS Infrastructure - Unit Tests", () => {
  
  describe("File Structure", () => {
    test("provider.tf exists", () => {
      const providerPath = path.resolve(libPath, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      const variablesPath = path.resolve(libPath, "variables.tf");
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("main.tf exists", () => {
      const mainPath = path.resolve(libPath, "main.tf");
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test("tap_stack.tf exists", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      const outputsPath = path.resolve(libPath, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("data.tf exists", () => {
      const dataPath = path.resolve(libPath, "data.tf");
      expect(fs.existsSync(dataPath)).toBe(true);
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
  });

  describe("Infrastructure Resources", () => {
    test("tap_stack.tf declares VPC resource", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("tap_stack.tf declares Auto Scaling Group", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test("tap_stack.tf declares Application Load Balancer", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("tap_stack.tf declares S3 buckets with logging", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"log_bucket"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_bucket"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"/);
    });
  });

  describe("Security Configuration", () => {
    test("security groups restrict ALB to port 443", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/to_port\s*=\s*443/);
    });

    test("EC2 security group allows traffic from ALB security group", () => {
      const stackPath = path.resolve(libPath, "tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });
  });

  describe("Variables", () => {
    test("variables.tf defines required variables", () => {
      const variablesPath = path.resolve(libPath, "variables.tf");
      const content = fs.readFileSync(variablesPath, "utf8");
      
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"allowed_cidrs"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
    });

    test("aws_region defaults to us-west-2", () => {
      const variablesPath = path.resolve(libPath, "variables.tf");
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
    });
  });

  describe("Data Sources", () => {
    test("data.tf uses aws_availability_zones", () => {
      const dataPath = path.resolve(libPath, "data.tf");
      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("data.tf includes Amazon Linux AMI data source", () => {
      const dataPath = path.resolve(libPath, "data.tf");
      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });
  });

  describe("Naming Convention", () => {
    test("uses base-production naming pattern", () => {
      const mainPath = path.resolve(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      expect(content).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/);
    });
  });

});
