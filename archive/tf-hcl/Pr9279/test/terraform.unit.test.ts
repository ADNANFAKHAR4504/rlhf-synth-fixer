// Unit tests for Terraform VPC Infrastructure
// Testing structure, variables, modules, and outputs

import fs from "fs";
import path from "path";
import { parse } from "hcl2-parser";

const LIB_DIR = path.resolve(__dirname, "../lib");
const stackPath = path.join(LIB_DIR, "tap_stack.tf");
const providerPath = path.join(LIB_DIR, "provider.tf");
const variablesPath = path.join(LIB_DIR, "variables.tf");
const outputsPath = path.join(LIB_DIR, "outputs.tf");
const vpcModulePath = path.join(LIB_DIR, "modules/vpc/main.tf");
const vpcVariablesPath = path.join(LIB_DIR, "modules/vpc/variables.tf");
const vpcOutputsPath = path.join(LIB_DIR, "modules/vpc/outputs.tf");
const sgModulePath = path.join(LIB_DIR, "modules/security-groups/main.tf");
const sgVariablesPath = path.join(LIB_DIR, "modules/security-groups/variables.tf");
const sgOutputsPath = path.join(LIB_DIR, "modules/security-groups/outputs.tf");

describe("Terraform Infrastructure Files", () => {
  describe("File Structure", () => {
    test("all required files exist", () => {
      const requiredFiles = [
        stackPath,
        providerPath,
        variablesPath,
        outputsPath,
        vpcModulePath,
        vpcVariablesPath,
        vpcOutputsPath,
        sgModulePath,
        sgVariablesPath,
        sgOutputsPath,
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("defines terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test("defines AWS provider with minimum version", () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.42\.0"/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("sets AWS region from variable", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesPath, "utf8");
    });

    test("defines aws_region variable with us-west-2 default", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("defines vpc_cidr variable", () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("defines project_name variable", () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"vpc-infrastructure"/);
    });

    test("defines allowed_ssh_cidr variable", () => {
      expect(variablesContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"203\.0\.113\.0\/24"/);
    });

    test("defines environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(variablesContent).toMatch(/description\s*=\s*"[^"]*suffix[^"]*"/i);
    });

    test("defines common_tags variable with Production environment", () => {
      expect(variablesContent).toMatch(/variable\s+"common_tags"\s*{/);
      expect(variablesContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(variablesContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("Main Stack Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares VPC module", () => {
      expect(stackContent).toMatch(/module\s+"vpc"\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test("VPC module uses environment suffix", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}"/);
    });

    test("VPC module configures public subnets", () => {
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\[/);
      expect(stackContent).toMatch(/"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.2\.0\/24"/);
    });

    test("VPC module configures private subnets", () => {
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\[/);
      expect(stackContent).toMatch(/"10\.0\.10\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.11\.0\/24"/);
    });

    test("declares Security Groups module", () => {
      expect(stackContent).toMatch(/module\s+"security_groups"\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/security-groups"/);
    });

    test("Security Groups module uses VPC ID from VPC module", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
    });

    test("Security Groups module uses environment suffix", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("VPC Module", () => {
    let vpcContent: string;
    let vpcVariables: string;
    let vpcOutputs: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(vpcModulePath, "utf8");
      vpcVariables = fs.readFileSync(vpcVariablesPath, "utf8");
      vpcOutputs = fs.readFileSync(vpcOutputsPath, "utf8");
    });

    test("creates VPC resource with DNS enabled", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates Elastic IPs for NAT Gateways", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(vpcContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(vpcContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates public subnets with auto-assign public IP", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(vpcContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("creates NAT Gateways in public subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(vpcContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test("creates route tables for public subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(vpcContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates route tables for private subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(vpcContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("creates VPC Lattice service network", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpclattice_service_network"\s+"main"\s*{/);
      expect(vpcContent).toMatch(/auth_type\s*=\s*"AWS_IAM"/);
    });

    test("associates VPC with Lattice service network", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpclattice_service_network_vpc_association"\s+"main"\s*{/);
    });

    test("defines required variables", () => {
      const requiredVars = ["vpc_cidr", "public_subnet_cidrs", "private_subnet_cidrs", "project_name", "tags"];
      requiredVars.forEach(varName => {
        expect(vpcVariables).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("exports required outputs", () => {
      const requiredOutputs = ["vpc_id", "vpc_cidr_block", "public_subnet_ids", "private_subnet_ids", "service_network_id"];
      requiredOutputs.forEach(output => {
        expect(vpcOutputs).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });
  });

  describe("Security Groups Module", () => {
    let sgContent: string;
    let sgVariables: string;
    let sgOutputs: string;

    beforeAll(() => {
      sgContent = fs.readFileSync(sgModulePath, "utf8");
      sgVariables = fs.readFileSync(sgVariablesPath, "utf8");
      sgOutputs = fs.readFileSync(sgOutputsPath, "utf8");
    });

    test("creates web security group", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"web"\s*{/);
      expect(sgContent).toMatch(/description\s*=\s*"Security group for web traffic"/);
    });

    test("web security group allows HTTP on port 80", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/to_port\s*=\s*80/);
      expect(sgContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(sgContent).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
    });

    test("web security group allows HTTPS on port 443", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
      expect(sgContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates SSH security group", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ssh"\s*{/);
      expect(sgContent).toMatch(/description\s*=\s*"Security group for SSH access"/);
    });

    test("SSH security group restricts access to allowed CIDR", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*22/);
      expect(sgContent).toMatch(/to_port\s*=\s*22/);
      expect(sgContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
    });

    test("both security groups allow all egress traffic", () => {
      const egressMatches = sgContent.match(/egress\s*{[^}]*from_port\s*=\s*0[^}]*}/g) || [];
      expect(egressMatches.length).toBeGreaterThanOrEqual(2);
      egressMatches.forEach(match => {
        expect(match).toMatch(/protocol\s*=\s*"-1"/);
        expect(match).toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
      });
    });

    test("defines required variables", () => {
      const requiredVars = ["vpc_id", "project_name", "allowed_ssh_cidr", "tags"];
      requiredVars.forEach(varName => {
        expect(sgVariables).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("exports security group IDs", () => {
      expect(sgOutputs).toMatch(/output\s+"web_security_group_id"\s*{/);
      expect(sgOutputs).toMatch(/output\s+"ssh_security_group_id"\s*{/);
    });
  });

  describe("Outputs Configuration", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(outputsPath, "utf8");
    });

    test("exports VPC outputs", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_id/);
      expect(outputsContent).toMatch(/output\s+"vpc_cidr_block"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_cidr_block/);
    });

    test("exports subnet IDs", () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.public_subnet_ids/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.private_subnet_ids/);
    });

    test("exports security group IDs", () => {
      expect(outputsContent).toMatch(/output\s+"web_security_group_id"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.security_groups\.web_security_group_id/);
      expect(outputsContent).toMatch(/output\s+"ssh_security_group_id"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.security_groups\.ssh_security_group_id/);
    });

    test("exports VPC Lattice service network ID", () => {
      expect(outputsContent).toMatch(/output\s+"service_network_id"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.service_network_id/);
    });
  });

  describe("Terraform Best Practices", () => {
    test("all resources use consistent tagging", () => {
      const vpcContent = fs.readFileSync(vpcModulePath, "utf8");
      const sgContent = fs.readFileSync(sgModulePath, "utf8");
      
      const resourceMatches = [...vpcContent.matchAll(/resource\s+"aws_[^"]+"\s+"[^"]+"\s*{[^}]*tags\s*=/g), 
                               ...sgContent.matchAll(/resource\s+"aws_[^"]+"\s+"[^"]+"\s*{[^}]*tags\s*=/g)];
      
      expect(resourceMatches.length).toBeGreaterThan(0);
    });

    test("modules use proper input validation", () => {
      const vpcVars = fs.readFileSync(vpcVariablesPath, "utf8");
      const sgVars = fs.readFileSync(sgVariablesPath, "utf8");
      
      // Check for type definitions
      expect(vpcVars).toMatch(/type\s*=\s*string/);
      expect(vpcVars).toMatch(/type\s*=\s*list\(string\)/);
      expect(sgVars).toMatch(/type\s*=\s*string/);
    });

    test("no hardcoded values in main configuration", () => {
      const stackContent = fs.readFileSync(stackPath, "utf8");
      
      // Should not have hardcoded AWS account IDs or regions
      expect(stackContent).not.toMatch(/\d{12}/); // AWS account ID pattern
      expect(stackContent).not.toMatch(/arn:aws:/); // Direct ARN references
    });

    test("uses data sources for availability zones", () => {
      const vpcContent = fs.readFileSync(vpcModulePath, "utf8");
      expect(vpcContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(vpcContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resources use project_name prefix", () => {
      const vpcContent = fs.readFileSync(vpcModulePath, "utf8");
      const sgContent = fs.readFileSync(sgModulePath, "utf8");
      
      // Check VPC resources
      expect(vpcContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-vpc"/);
      expect(vpcContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-igw"/);
      expect(vpcContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-public-subnet/);
      expect(vpcContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-private-subnet/);
      
      // Check Security Group resources
      expect(sgContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-web-sg"/);
      expect(sgContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-ssh-sg"/);
    });
  });
});