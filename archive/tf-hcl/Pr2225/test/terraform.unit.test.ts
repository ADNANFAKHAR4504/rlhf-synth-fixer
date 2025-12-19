// tests/unit/terraform-unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform commands are executed.

import fs from "fs";
import path from "path";

const TERRAFORM_FILE_REL = "../lib/tap_stack.tf";
const terraformFilePath = path.resolve(__dirname, TERRAFORM_FILE_REL);

describe("Terraform multi-region VPC configuration: tap_stack.tf", () => {
  let terraformContent: string;
  
  beforeAll(() => {
    terraformContent = fs.readFileSync(terraformFilePath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(terraformFilePath);
    if (!exists) {
      console.error(`[unit] Expected terraform file at: ${terraformFilePath}`);
    }
    expect(exists).toBe(true);
  });

  test("declares terraform required_version and required_providers", () => {
    expect(terraformContent).toMatch(/terraform\s*{/);
    expect(terraformContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    expect(terraformContent).toMatch(/required_providers\s*{/);
    expect(terraformContent).toMatch(/aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
  });

  test("declares AWS providers for all three regions with aliases", () => {
    expect(terraformContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_east_1"/);
    expect(terraformContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"eu_central_1"/);
    expect(terraformContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"ap_southeast_2"/);
  });

  test("declares environment variable", () => {
    expect(terraformContent).toMatch(/variable\s+"environment"\s*{/);
    expect(terraformContent).toMatch(/default\s*=\s*"prod"/);
  });

  test("declares aws_regions variable with all three regions", () => {
    expect(terraformContent).toMatch(/variable\s+"aws_regions"\s*{/);
    expect(terraformContent).toMatch(/"us-east-1"/);
    expect(terraformContent).toMatch(/"eu-central-1"/);
    expect(terraformContent).toMatch(/"ap-southeast-2"/);
    expect(terraformContent).toMatch(/"10\.0\.0\.0\/16"/);
    expect(terraformContent).toMatch(/"10\.1\.0\.0\/16"/);
    expect(terraformContent).toMatch(/"10\.2\.0\.0\/16"/);
  });

  test("declares common_tags variable", () => {
    expect(terraformContent).toMatch(/variable\s+"common_tags"\s*{/);
    expect(terraformContent).toMatch(/Project\s*=\s*"global-app"/);
  });

  // Test VPC resources for all regions
  test("declares VPC resources for all three regions", () => {
    expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"eu_central_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"ap_southeast_2"/);
  });

  test("declares Internet Gateway resources for all three regions", () => {
    expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"\s+"us_east_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"\s+"eu_central_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"\s+"ap_southeast_2"/);
  });

  test("declares public and private subnets for all regions", () => {
    // US East 1
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_public"/);
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_private"/);
    // EU Central 1
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"eu_central_1_public"/);
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"eu_central_1_private"/);
    // AP Southeast 2
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_2_public"/);
    expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_2_private"/);
  });

  test("declares route tables for all regions", () => {
    // Public route tables
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_public"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"eu_central_1_public"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"ap_southeast_2_public"/);
    // Private route tables
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_private"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"eu_central_1_private"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"ap_southeast_2_private"/);
  });

  test("declares security groups with least privilege access", () => {
    // Public security groups - should allow HTTP/HTTPS
    expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"us_east_1_public"/);
    expect(terraformContent).toMatch(/from_port\s*=\s*80/);
    expect(terraformContent).toMatch(/from_port\s*=\s*443/);
    expect(terraformContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    
    // Private security groups - should allow VPC internal traffic
    expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"us_east_1_private"/);
    expect(terraformContent).toMatch(/All traffic from VPC/);
  });

  test("uses data sources to get availability zones dynamically", () => {
    expect(terraformContent).toMatch(/data\s+"aws_availability_zones"\s+"us_east_1"/);
    expect(terraformContent).toMatch(/data\s+"aws_availability_zones"\s+"eu_central_1"/);
    expect(terraformContent).toMatch(/data\s+"aws_availability_zones"\s+"ap_southeast_2"/);
    expect(terraformContent).toMatch(/state\s*=\s*"available"/);
  });

  test("declares outputs for all regions", () => {
    expect(terraformContent).toMatch(/output\s+"us_east_1"/);
    expect(terraformContent).toMatch(/output\s+"eu_central_1"/);
    expect(terraformContent).toMatch(/output\s+"ap_southeast_2"/);
    expect(terraformContent).toMatch(/output\s+"summary"/);
  });

  test("uses proper naming conventions with environment and region tags", () => {
    expect(terraformContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(terraformContent).toMatch(/Region\s*=\s*var\.aws_regions/);
    expect(terraformContent).toMatch(/\$\{var\.environment\}-vpc-\$\{var\.aws_regions/);
  });

  test("configuration follows Infrastructure as Code best practices", () => {
    // Check for proper tagging
    expect(terraformContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
    // Check for DNS settings
    expect(terraformContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(terraformContent).toMatch(/enable_dns_support\s*=\s*true/);
    // Check for public IP assignment
    expect(terraformContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });
});
