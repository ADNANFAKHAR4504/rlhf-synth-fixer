// Comprehensive unit tests for Terraform VPC infrastructure
// Tests parse and validate HCL configuration files without executing Terraform

import fs from "fs";
import path from "path";
import { parseToObject } from "hcl2-parser";

const libPath = path.resolve(__dirname, "../lib");

// Read all Terraform files
const mainTfPath = path.join(libPath, "main.tf");
const variablesTfPath = path.join(libPath, "variables.tf");
const outputsTfPath = path.join(libPath, "outputs.tf");
const providerTfPath = path.join(libPath, "provider.tf");

describe("Terraform VPC Infrastructure - File Structure", () => {
  test("main.tf exists", () => {
    expect(fs.existsSync(mainTfPath)).toBe(true);
  });

  test("variables.tf exists", () => {
    expect(fs.existsSync(variablesTfPath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    expect(fs.existsSync(outputsTfPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(providerTfPath)).toBe(true);
  });
});

describe("Terraform VPC Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesTfPath, "utf8");
  });

  test("declares vpc_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_name"/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
  });

  test("declares environment variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment"/);
  });

  test("declares project variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project"/);
  });

  test("declares vpc_cidr variable with correct default", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"/);
    expect(variablesContent).toMatch(/10\.0\.0\.0\/16/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"/);
    expect(variablesContent).toMatch(/10\.0\.1\.0\/24/);
    expect(variablesContent).toMatch(/10\.0\.3\.0\/24/);
    expect(variablesContent).toMatch(/10\.0\.5\.0\/24/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"/);
    expect(variablesContent).toMatch(/10\.0\.2\.0\/24/);
    expect(variablesContent).toMatch(/10\.0\.4\.0\/24/);
    expect(variablesContent).toMatch(/10\.0\.6\.0\/24/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    expect(variablesContent).toMatch(/us-east-1/);
  });
});

describe("Terraform VPC Infrastructure - Main Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainTfPath, "utf8");
  });

  test("data source for availability zones exists", () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("VPC resource exists with correct configuration", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC includes environmentSuffix in name", () => {
    expect(mainContent).toMatch(/Name\s*=\s*"\$\{var\.vpc_name\}-\$\{var\.environment_suffix\}"/);
  });

  test("Internet Gateway resource exists", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("Internet Gateway includes environmentSuffix in name", () => {
    const igwNamePattern = /Name\s*=\s*"\$\{var\.vpc_name\}-igw-\$\{var\.environment_suffix\}"/;
    expect(mainContent).toMatch(igwNamePattern);
  });

  test("public subnets resource exists with count of 3", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(mainContent).toMatch(/count\s*=\s*3/);
  });

  test("public subnets have map_public_ip_on_launch enabled", () => {
    const publicSubnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?(?=resource|$)/);
    expect(publicSubnetBlock).toBeTruthy();
    expect(publicSubnetBlock![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("private subnets resource exists with count of 3", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    const privateSubnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"private"[\s\S]*?(?=resource|$)/);
    expect(privateSubnetBlock![0]).toMatch(/count\s*=\s*3/);
  });

  test("Elastic IPs for NAT gateways exist with count of 2", () => {
    expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    const eipBlock = mainContent.match(/resource\s+"aws_eip"\s+"nat"[\s\S]*?(?=resource|$)/);
    expect(eipBlock![0]).toMatch(/count\s*=\s*2/);
    expect(eipBlock![0]).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("NAT Gateways exist with count of 2", () => {
    expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    const natBlock = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?(?=resource|$)/);
    expect(natBlock![0]).toMatch(/count\s*=\s*2/);
  });

  test("NAT Gateways depend on Internet Gateway", () => {
    const natBlock = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?(?=resource|$)/);
    expect(natBlock![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
  });

  test("public route table exists with IGW route", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    const publicRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"public"[\s\S]*?(?=resource|$)/);
    expect(publicRtBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    expect(publicRtBlock![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
  });

  test("private route tables exist with count of 3", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    const privateRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"private"[\s\S]*?(?=resource|$)/);
    expect(privateRtBlock![0]).toMatch(/count\s*=\s*3/);
  });

  test("private route tables route to NAT gateways", () => {
    const privateRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"private"[\s\S]*?(?=resource|$)/);
    expect(privateRtBlock![0]).toMatch(/nat_gateway_id/);
  });

  test("public route table associations exist with count of 3", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    const publicRtaBlock = mainContent.match(/resource\s+"aws_route_table_association"\s+"public"[\s\S]*?(?=resource|$)/);
    expect(publicRtaBlock![0]).toMatch(/count\s*=\s*3/);
  });

  test("private route table associations exist with count of 3", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    const privateRtaBlock = mainContent.match(/resource\s+"aws_route_table_association"\s+"private"[\s\S]*?(?=resource|$)/);
    expect(privateRtaBlock![0]).toMatch(/count\s*=\s*3/);
  });

  test("security group exists with HTTPS ingress", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"default"/);
    const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"default"[\s\S]*?(?=resource|$)/);
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*443/);
    expect(sgBlock![0]).toMatch(/to_port\s*=\s*443/);
    expect(sgBlock![0]).toMatch(/protocol\s*=\s*"tcp"/);
  });

  test("security group allows all egress", () => {
    const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"default"[\s\S]*?(?=$)/);
    expect(sgBlock![0]).toMatch(/egress/);
    expect(sgBlock![0]).toMatch(/protocol\s*=\s*"-1"/);
  });

  test("all resources include Environment and Project tags", () => {
    const resourceBlocks = mainContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*\{[\s\S]*?(?=^resource|\Z)/gm);
    resourceBlocks?.forEach((block) => {
      if (block.includes("tags")) {
        expect(block).toMatch(/Environment\s*=\s*var\.environment/);
        expect(block).toMatch(/Project\s*=\s*var\.project/);
      }
    });
  });

  test("resources include environment_suffix in names", () => {
    const namePatterns = mainContent.match(/Name\s*=\s*"[^"]*"/g);
    expect(namePatterns).toBeTruthy();
    namePatterns?.forEach((pattern) => {
      expect(pattern).toMatch(/environment_suffix/);
    });
  });
});

describe("Terraform VPC Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsTfPath, "utf8");
  });

  test("outputs vpc_id", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    expect(outputsContent).toMatch(/aws_vpc\.main\.id/);
  });

  test("outputs vpc_cidr", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_cidr"/);
    expect(outputsContent).toMatch(/aws_vpc\.main\.cidr_block/);
  });

  test("outputs public_subnet_ids", () => {
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
    expect(outputsContent).toMatch(/aws_subnet\.public\[\*\]\.id/);
  });

  test("outputs private_subnet_ids", () => {
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
    expect(outputsContent).toMatch(/aws_subnet\.private\[\*\]\.id/);
  });

  test("outputs internet_gateway_id", () => {
    expect(outputsContent).toMatch(/output\s+"internet_gateway_id"/);
    expect(outputsContent).toMatch(/aws_internet_gateway\.main\.id/);
  });

  test("outputs nat_gateway_ids", () => {
    expect(outputsContent).toMatch(/output\s+"nat_gateway_ids"/);
    expect(outputsContent).toMatch(/aws_nat_gateway\.main\[\*\]\.id/);
  });

  test("outputs nat_gateway_eips", () => {
    expect(outputsContent).toMatch(/output\s+"nat_gateway_eips"/);
    expect(outputsContent).toMatch(/aws_eip\.nat\[\*\]\.public_ip/);
  });

  test("outputs default_security_group_id", () => {
    expect(outputsContent).toMatch(/output\s+"default_security_group_id"/);
    expect(outputsContent).toMatch(/aws_security_group\.default\.id/);
  });

  test("outputs availability_zones", () => {
    expect(outputsContent).toMatch(/output\s+"availability_zones"/);
    expect(outputsContent).toMatch(/data\.aws_availability_zones\.available\.names/);
  });
});

describe("Terraform VPC Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerTfPath, "utf8");
  });

  test("terraform block exists with correct version", () => {
    expect(providerContent).toMatch(/terraform\s*\{/);
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.[4-9]/);
  });

  test("AWS provider configured correctly", () => {
    expect(providerContent).toMatch(/required_providers\s*\{/);
    expect(providerContent).toMatch(/aws\s*=\s*\{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test("provider block uses aws_region variable", () => {
    expect(providerContent).toMatch(/provider\s+"aws"/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("S3 backend configured", () => {
    expect(providerContent).toMatch(/backend\s+"s3"/);
  });
});
