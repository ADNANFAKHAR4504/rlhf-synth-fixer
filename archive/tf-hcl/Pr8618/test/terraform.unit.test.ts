import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_FILE = path.join(LIB_DIR, "main.tf");
const PROVIDER_FILE = path.join(LIB_DIR, "provider.tf");
const VARIABLES_FILE = path.join(LIB_DIR, "variables.tf");
const OUTPUTS_FILE = path.join(LIB_DIR, "outputs.tf");

describe("Terraform Infrastructure - File Structure", () => {
  test("main.tf file exists", () => {
    expect(fs.existsSync(MAIN_FILE)).toBe(true);
  });

  test("provider.tf file exists", () => {
    expect(fs.existsSync(PROVIDER_FILE)).toBe(true);
  });

  test("variables.tf file exists", () => {
    expect(fs.existsSync(VARIABLES_FILE)).toBe(true);
  });

  test("outputs.tf file exists", () => {
    expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);
  });

  test("main.tf has meaningful content", () => {
    const stats = fs.statSync(MAIN_FILE);
    expect(stats.size).toBeGreaterThan(500);
  });
});

describe("Terraform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(PROVIDER_FILE, "utf8");
  });

  test("declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*\">=\s*1\.4\.0\"/);
  });

  test("declares AWS provider constraint", () => {
    expect(providerContent).toMatch(/required_providers\s*\{[\s\S]*aws\s*=\s*\{/);
    expect(providerContent).toMatch(/source\s*=\s*\"hashicorp\/aws\"/);
    expect(providerContent).toMatch(/version\s*=\s*\">=\s*5\.0\"/);
  });

  test("configures AWS provider region using variable", () => {
    expect(providerContent).toMatch(/provider\s+\"aws\"\s*\{[\s\S]*region\s*=\s*var\.aws_region/);
  });
});

describe("Terraform Infrastructure - Variable Definitions", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_FILE, "utf8");
  });

  test("declares core string variables", () => {
    expect(variablesContent).toMatch(/variable\s+\"aws_region\"\s*\{[\s\S]*type\s*=\s*string/);
    expect(variablesContent).toMatch(/variable\s+\"environment_suffix\"\s*\{[\s\S]*type\s*=\s*string/);
    expect(variablesContent).toMatch(/variable\s+\"project_name\"\s*\{[\s\S]*type\s*=\s*string/);
  });

  test("declares VPC CIDR variable", () => {
    expect(variablesContent).toMatch(/variable\s+\"vpc_cidr\"\s*\{[\s\S]*default\s*=\s*\"10\.0\.0\.0\/16\"/);
  });

  test("declares subnet CIDR lists", () => {
    expect(variablesContent).toMatch(/variable\s+\"public_subnet_cidrs\"\s*\{[\s\S]*type\s*=\s*list\(string\)/);
    expect(variablesContent).toMatch(/variable\s+\"private_subnet_cidrs\"\s*\{[\s\S]*type\s*=\s*list\(string\)/);
  });

  test("declares availability zones list", () => {
    expect(variablesContent).toMatch(/variable\s+\"availability_zones\"\s*\{[\s\S]*default\s*=\s*\[\s*\"us-east-1a\"/);
  });

  test("declares common_tags map", () => {
    expect(variablesContent).toMatch(/variable\s+\"common_tags\"\s*\{[\s\S]*type\s*=\s*map\(string\)/);
    expect(variablesContent).toMatch(/ManagedBy\s*=\s*\"terraform\"/i);
  });
});

describe("Terraform Infrastructure - Core Networking", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_FILE, "utf8");
  });

  test("creates primary VPC", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_vpc\"\s+\"main\"\s*\{/);
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates internet gateway attached to VPC", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_internet_gateway\"\s+\"main\"\s*\{[\s\S]*vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("defines public subnets with map_public_ip_on_launch true", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_subnet\"\s+\"public\"\s*\{[\s\S]*count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("defines private subnets across availability zones", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_subnet\"\s+\"private\"\s*\{[\s\S]*availability_zone\s*=\s*var\.availability_zones\[count\.index\]/);
  });

  test("provisions elastic IPs and NAT gateways per public subnet", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_eip\"\s+\"nat\"\s*\{[\s\S]*domain\s*=\s*\"vpc\"/);
    expect(mainContent).toMatch(/resource\s+\"aws_nat_gateway\"\s+\"main\"\s*\{[\s\S]*allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
  });

  test("creates route tables with appropriate routes", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_route_table\"\s+\"public\"\s*\{[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    expect(mainContent).toMatch(/resource\s+\"aws_route_table\"\s+\"private\"\s*\{[\s\S]*nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
  });

  test("associates route tables with all subnets", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_route_table_association\"\s+\"public\"\s*\{[\s\S]*subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    expect(mainContent).toMatch(/resource\s+\"aws_route_table_association\"\s+\"private\"\s*\{[\s\S]*subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
  });
});

describe("Terraform Infrastructure - Security Groups", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_FILE, "utf8");
  });

  test("defines web security group with HTTPS and HTTP rules", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_security_group\"\s+\"web\"\s*\{/);
    expect(mainContent).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\[\s*\"0\.0\.0\.0\/0\"\s*\]/);
    expect(mainContent).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*\[var\.vpc_cidr\]/);
    expect(mainContent).toMatch(/egress\s*{[\s\S]*cidr_blocks\s*=\s*\[\s*\"0\.0\.0\.0\/0\"\s*\]/);
  });

  test("defines database security group restricted to web SG", () => {
    expect(mainContent).toMatch(/resource\s+\"aws_security_group\"\s+\"database\"\s*\{/);
    expect(mainContent).toMatch(/ingress\s*{[\s\S]*from_port\s*=\s*5432[\s\S]*security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
  });
});

describe("Terraform Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
  });

  test("exports VPC identifiers", () => {
    expect(outputsContent).toMatch(/output\s+\"vpc_id\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"vpc_cidr\"\s*\{/);
  });

  test("exports subnet identifiers", () => {
    expect(outputsContent).toMatch(/output\s+\"public_subnet_ids\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"private_subnet_ids\"\s*\{/);
  });

  test("exports gateway and route table details", () => {
    expect(outputsContent).toMatch(/output\s+\"internet_gateway_id\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"nat_gateway_ids\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"public_route_table_id\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"private_route_table_ids\"\s*\{/);
  });

  test("exports security group identifiers", () => {
    expect(outputsContent).toMatch(/output\s+\"web_security_group_id\"\s*\{/);
    expect(outputsContent).toMatch(/output\s+\"database_security_group_id\"\s*\{/);
  });

  test("confirms availability_zones output", () => {
    expect(outputsContent).toMatch(/output\s+\"availability_zones\"\s*\{/);
  });
});
