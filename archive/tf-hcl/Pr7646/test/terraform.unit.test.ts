// test/terraform.unit.test.ts
// Unit tests for Terraform VPC infrastructure configuration

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform VPC Infrastructure - Unit Tests", () => {
  describe("File Structure", () => {
    test("main.tf exists", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      expect(fs.existsSync(outputsTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      const providerTfPath = path.join(LIB_DIR, "provider.tf");
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test("backend.tf exists", () => {
      const backendTfPath = path.join(LIB_DIR, "backend.tf");
      expect(fs.existsSync(backendTfPath)).toBe(true);
    });
  });

  describe("main.tf - VPC Configuration", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares aws_vpc resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has DNS support enabled", () => {
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC uses environment_suffix in naming", () => {
      expect(mainTfContent).toMatch(/vpc-\$\{var\.environment_suffix\}/);
    });
  });

  describe("main.tf - Internet Gateway", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares aws_internet_gateway resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("IGW is attached to VPC", () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("IGW uses environment_suffix in naming", () => {
      expect(mainTfContent).toMatch(/igw-\$\{var\.environment_suffix\}/);
    });
  });

  describe("main.tf - Subnets", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares public subnets", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test("declares private subnets", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("public subnets use count for multi-AZ", () => {
      expect(mainTfContent).toMatch(/aws_subnet"\s+"public"[\s\S]*?count\s*=\s*var\.az_count/);
    });

    test("private subnets use count for multi-AZ", () => {
      expect(mainTfContent).toMatch(/aws_subnet"\s+"private"[\s\S]*?count\s*=\s*var\.az_count/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      expect(mainTfContent).toMatch(/aws_subnet"\s+"public"[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
    });

    test("public subnets use environment_suffix in naming", () => {
      expect(mainTfContent).toMatch(/subnet-public-.*\$\{var\.environment_suffix\}/);
    });

    test("private subnets use environment_suffix in naming", () => {
      expect(mainTfContent).toMatch(/subnet-private-.*\$\{var\.environment_suffix\}/);
    });
  });

  describe("main.tf - NAT Gateway", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares Elastic IP for NAT", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("EIP is for VPC domain", () => {
      expect(mainTfContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("declares NAT Gateway", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("NAT Gateway uses EIP allocation", () => {
      expect(mainTfContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
    });

    test("NAT Gateway is in public subnet", () => {
      expect(mainTfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
    });

    test("NAT Gateway uses environment_suffix in naming", () => {
      expect(mainTfContent).toMatch(/nat-\$\{var\.environment_suffix\}/);
    });
  });

  describe("main.tf - Route Tables", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares public route table", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("declares private route table", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("declares public internet route", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
    });

    test("public route points to Internet Gateway", () => {
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("declares private internet route", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route"\s+"private_internet"/);
    });

    test("private route points to NAT Gateway", () => {
      expect(mainTfContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
    });

    test("declares public route table associations", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("declares private route table associations", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("main.tf - Data Sources", () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("uses availability zones data source", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("filters for available AZs only", () => {
      expect(mainTfContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("variables.tf - Required Variables", () => {
    let variablesTfContent: string;

    beforeAll(() => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      variablesTfContent = fs.readFileSync(variablesTfPath, "utf8");
    });

    test("declares environment_suffix variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test("environment_suffix has validation", () => {
      expect(variablesTfContent).toMatch(/environment_suffix"[\s\S]*?validation\s*\{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"vpc_cidr"/);
    });

    test("vpc_cidr has default value", () => {
      expect(variablesTfContent).toMatch(/vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares az_count variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"az_count"/);
    });

    test("az_count has validation", () => {
      expect(variablesTfContent).toMatch(/az_count"[\s\S]*?validation\s*\{/);
    });

    test("declares region variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"region"/);
    });
  });

  describe("outputs.tf - Required Outputs", () => {
    let outputsTfContent: string;

    beforeAll(() => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      outputsTfContent = fs.readFileSync(outputsTfPath, "utf8");
    });

    test("outputs vpc_id", () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsTfContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs vpc_cidr", () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_cidr"/);
    });

    test("outputs public_subnet_ids", () => {
      expect(outputsTfContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsTfContent).toMatch(/aws_subnet\.public\[\*\]\.id/);
    });

    test("outputs private_subnet_ids", () => {
      expect(outputsTfContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(outputsTfContent).toMatch(/aws_subnet\.private\[\*\]\.id/);
    });

    test("outputs internet_gateway_id", () => {
      expect(outputsTfContent).toMatch(/output\s+"internet_gateway_id"/);
    });

    test("outputs nat_gateway_id", () => {
      expect(outputsTfContent).toMatch(/output\s+"nat_gateway_id"/);
    });

    test("outputs nat_gateway_eip", () => {
      expect(outputsTfContent).toMatch(/output\s+"nat_gateway_eip"/);
      expect(outputsTfContent).toMatch(/aws_eip\.nat\.public_ip/);
    });

    test("outputs route table IDs", () => {
      expect(outputsTfContent).toMatch(/output\s+"public_route_table_id"/);
      expect(outputsTfContent).toMatch(/output\s+"private_route_table_id"/);
    });

    test("outputs availability_zones", () => {
      expect(outputsTfContent).toMatch(/output\s+"availability_zones"/);
    });
  });

  describe("provider.tf - Provider Configuration", () => {
    let providerTfContent: string;

    beforeAll(() => {
      const providerTfPath = path.join(LIB_DIR, "provider.tf");
      providerTfContent = fs.readFileSync(providerTfPath, "utf8");
    });

    test("specifies Terraform version requirement", () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\./);
    });

    test("declares AWS provider requirement", () => {
      expect(providerTfContent).toMatch(/aws\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    });

    test("configures AWS provider with region", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"[\s\S]*?region\s*=\s*var\.region/);
    });

    test("AWS provider has default_tags", () => {
      expect(providerTfContent).toMatch(/default_tags\s*\{/);
    });

    test("default_tags includes environment_suffix", () => {
      expect(providerTfContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe("backend.tf - Backend Configuration", () => {
    let backendTfContent: string;

    beforeAll(() => {
      const backendTfPath = path.join(LIB_DIR, "backend.tf");
      backendTfContent = fs.readFileSync(backendTfPath, "utf8");
    });

    test("configures S3 backend", () => {
      expect(backendTfContent).toMatch(/backend\s+"s3"/);
    });

    test("S3 backend has bucket configured", () => {
      expect(backendTfContent).toMatch(/bucket\s*=\s*"/);
    });

    test("S3 backend has key configured", () => {
      expect(backendTfContent).toMatch(/key\s*=\s*"/);
    });

    test("S3 backend has region configured", () => {
      expect(backendTfContent).toMatch(/region\s*=\s*"/);
    });
  });

  describe("Infrastructure Quality Checks", () => {
    let allContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      const providerTfPath = path.join(LIB_DIR, "provider.tf");

      allContent =
        fs.readFileSync(mainTfPath, "utf8") +
        fs.readFileSync(variablesTfPath, "utf8") +
        fs.readFileSync(outputsTfPath, "utf8") +
        fs.readFileSync(providerTfPath, "utf8");
    });

    test("no hardcoded environment names", () => {
      expect(allContent).not.toMatch(/['"](dev|prod|staging|test)[-_]/);
    });

    test("no DeletionProtection or Retain policies", () => {
      expect(allContent).not.toMatch(/deletion_protection\s*=\s*true/);
      expect(allContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test("all resources use environment_suffix", () => {
      const resourceNames = allContent.match(/Name\s*=\s*"[^"]+"/g) || [];
      for (const name of resourceNames) {
        expect(name).toMatch(/environment_suffix|var\.environment_suffix/);
      }
    });
  });
});
