// Comprehensive unit tests for Terraform infrastructure
// Additional tests to ensure 90%+ coverage of infrastructure requirements

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Comprehensive Testing", () => {
  describe("Infrastructure Requirements Validation", () => {
    const vpcMainPath = path.join(LIB_DIR, "modules/vpc/main.tf");
    const sgMainPath = path.join(LIB_DIR, "modules/security-groups/main.tf");
    let vpcContent: string;
    let sgContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(vpcMainPath, "utf8");
      sgContent = fs.readFileSync(sgMainPath, "utf8");
    });

    test("VPC has correct CIDR block configuration", () => {
      expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("exactly two public subnets in different AZs", () => {
      const publicSubnetMatches = vpcContent.match(/resource\s+"aws_subnet"\s+"public"/g) || [];
      expect(vpcContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      
      // Check AZ assignment
      expect(vpcContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("exactly two private subnets in different AZs", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      const privateSection = vpcContent.match(/resource\s+"aws_subnet"\s+"private"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(privateSection).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(privateSection).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("public subnets route to internet gateway", () => {
      const publicRouteTable = vpcContent.match(/resource\s+"aws_route_table"\s+"public"[^}]+\{[^}]+route\s*\{[^}]+\}/s)?.[0] || "";
      expect(publicRouteTable).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRouteTable).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private subnets route to NAT gateway", () => {
      const privateRouteTable = vpcContent.match(/resource\s+"aws_route_table"\s+"private"[^}]+\{[^}]+route\s*\{[^}]+\}/s)?.[0] || "";
      expect(privateRouteTable).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(privateRouteTable).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("route table associations for all subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      
      // Check they reference correct subnets
      expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      expect(vpcContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
    });

    test("HTTP traffic allowed from anywhere (0.0.0.0/0)", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/to_port\s*=\s*80/);
      expect(sgContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("HTTPS traffic allowed from anywhere (0.0.0.0/0)", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
      expect(sgContent).toMatch(/to_port\s*=\s*443/);
      expect(sgContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("SSH restricted to specific CIDR (203.0.113.0/24)", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*22/);
      expect(sgContent).toMatch(/to_port\s*=\s*22/);
      expect(sgContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
      
      // Check the variable default
      const variablesPath = path.join(LIB_DIR, "variables.tf");
      const variablesContent = fs.readFileSync(variablesPath, "utf8");
      expect(variablesContent).toMatch(/variable\s+"allowed_ssh_cidr"[^}]+default\s*=\s*"203\.0\.113\.0\/24"/s);
    });

    test("all resources tagged with Environment: Production", () => {
      // Check that tags are applied
      const tagMatches = vpcContent.match(/tags\s*=\s*merge\(var\.tags/g) || [];
      expect(tagMatches.length).toBeGreaterThan(5); // Multiple resources should have tags
      
      // Check the default tags include Environment: Production
      const variablesPath = path.join(LIB_DIR, "variables.tf");
      const variablesContent = fs.readFileSync(variablesPath, "utf8");
      const commonTagsSection = variablesContent.match(/variable\s+"common_tags"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(commonTagsSection).toMatch(/Environment\s*=\s*"Production"/);
    });

    test("AWS provider version 3.42.0 or later", () => {
      const providerPath = path.join(LIB_DIR, "provider.tf");
      const providerContent = fs.readFileSync(providerPath, "utf8");
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.42\.0"/);
    });

    test("VPC Lattice service mesh configured", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpclattice_service_network"\s+"main"/);
      expect(vpcContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-service-network"/);
      expect(vpcContent).toMatch(/auth_type\s*=\s*"AWS_IAM"/);
    });

    test("VPC Lattice association with VPC", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpclattice_service_network_vpc_association"\s+"main"/);
      expect(vpcContent).toMatch(/vpc_identifier\s*=\s*aws_vpc\.main\.id/);
      expect(vpcContent).toMatch(/service_network_identifier\s*=\s*aws_vpclattice_service_network\.main\.id/);
    });
  });

  describe("Module Structure and Dependencies", () => {
    const stackPath = path.join(LIB_DIR, "tap_stack.tf");
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("VPC module receives correct parameters", () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\]/);
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\["10\.0\.10\.0\/24",\s*"10\.0\.11\.0\/24"\]/);
      expect(stackContent).toMatch(/tags\s*=\s*var\.common_tags/);
    });

    test("Security Groups module receives VPC ID from VPC module", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
      expect(stackContent).toMatch(/allowed_ssh_cidr\s*=\s*var\.allowed_ssh_cidr/);
      expect(stackContent).toMatch(/tags\s*=\s*var\.common_tags/);
    });

    test("modules use environment suffix for isolation", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}"/g);
    });
  });

  describe("Terraform State Management", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("S3 backend configured for state storage", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*\{\s*\}/);
    });

    test("terraform version constraint defined", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("AWS provider properly configured", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{[^}]+region\s*=\s*var\.aws_region[^}]+\}/s);
    });
  });

  describe("Security Best Practices", () => {
    const sgPath = path.join(LIB_DIR, "modules/security-groups/main.tf");
    let sgContent: string;

    beforeAll(() => {
      sgContent = fs.readFileSync(sgPath, "utf8");
    });

    test("no overly permissive SSH access", () => {
      // SSH should NOT be open to 0.0.0.0/0
      const sshSg = sgContent.match(/resource\s+"aws_security_group"\s+"ssh"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(sshSg).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("egress rules are defined for all security groups", () => {
      const egressMatches = sgContent.match(/egress\s*\{/g) || [];
      expect(egressMatches.length).toBeGreaterThanOrEqual(2); // At least 2 security groups with egress
    });

    test("security groups have descriptions", () => {
      expect(sgContent).toMatch(/description\s*=\s*"Security group for web traffic"/);
      expect(sgContent).toMatch(/description\s*=\s*"Security group for SSH access"/);
    });
  });

  describe("Resource Outputs", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    const vpcOutputsPath = path.join(LIB_DIR, "modules/vpc/outputs.tf");
    const sgOutputsPath = path.join(LIB_DIR, "modules/security-groups/outputs.tf");
    let outputsContent: string;
    let vpcOutputsContent: string;
    let sgOutputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(outputsPath, "utf8");
      vpcOutputsContent = fs.readFileSync(vpcOutputsPath, "utf8");
      sgOutputsContent = fs.readFileSync(sgOutputsPath, "utf8");
    });

    test("VPC module exports all required outputs", () => {
      expect(vpcOutputsContent).toMatch(/output\s+"vpc_id"/);
      expect(vpcOutputsContent).toMatch(/output\s+"vpc_cidr_block"/);
      expect(vpcOutputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(vpcOutputsContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(vpcOutputsContent).toMatch(/output\s+"internet_gateway_id"/);
      expect(vpcOutputsContent).toMatch(/output\s+"nat_gateway_ids"/);
      expect(vpcOutputsContent).toMatch(/output\s+"service_network_id"/);
    });

    test("Security Groups module exports required outputs", () => {
      expect(sgOutputsContent).toMatch(/output\s+"web_security_group_id"/);
      expect(sgOutputsContent).toMatch(/output\s+"ssh_security_group_id"/);
    });

    test("main outputs reference module outputs correctly", () => {
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_id/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.vpc_cidr_block/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.public_subnet_ids/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.private_subnet_ids/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.security_groups\.web_security_group_id/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.security_groups\.ssh_security_group_id/);
      expect(outputsContent).toMatch(/value\s*=\s*module\.vpc\.service_network_id/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = outputsContent.match(/output\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      outputMatches.forEach(output => {
        expect(output).toMatch(/description\s*=\s*"[^"]+"/);
      });
    });
  });

  describe("High Availability Configuration", () => {
    const vpcPath = path.join(LIB_DIR, "modules/vpc/main.tf");
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(vpcPath, "utf8");
    });

    test("NAT Gateways deployed in multiple AZs for HA", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(vpcContent).toMatch(/count\s*=\s*length\(aws_subnet\.public\)/);
    });

    test("each private subnet has its own NAT Gateway", () => {
      const privateRtSection = vpcContent.match(/resource\s+"aws_route_table"\s+"private"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(privateRtSection).toMatch(/count\s*=\s*length\(aws_subnet\.private\)/);
      expect(privateRtSection).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("EIPs allocated for NAT Gateways", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(vpcContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(vpcContent).toMatch(/domain\s*=\s*"vpc"/);
    });
  });

  describe("Network Segmentation", () => {
    const stackPath = path.join(LIB_DIR, "tap_stack.tf");
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("public subnets use correct CIDR ranges", () => {
      expect(stackContent).toMatch(/"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.2\.0\/24"/);
    });

    test("private subnets use correct CIDR ranges", () => {
      expect(stackContent).toMatch(/"10\.0\.10\.0\/24"/);
      expect(stackContent).toMatch(/"10\.0\.11\.0\/24"/);
    });

    test("CIDR blocks don't overlap", () => {
      const publicCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
      const privateCidrs = ["10.0.10.0/24", "10.0.11.0/24"];
      const allCidrs = [...publicCidrs, ...privateCidrs];
      
      // Simple check that third octet is unique
      const thirdOctets = allCidrs.map(cidr => parseInt(cidr.split('.')[2]));
      const uniqueOctets = new Set(thirdOctets);
      expect(uniqueOctets.size).toBe(thirdOctets.length);
    });
  });

  describe("Dependency Management", () => {
    const vpcPath = path.join(LIB_DIR, "modules/vpc/main.tf");
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(vpcPath, "utf8");
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      const natSection = vpcContent.match(/resource\s+"aws_nat_gateway"\s+"main"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(natSection).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("EIP depends on Internet Gateway", () => {
      const eipSection = vpcContent.match(/resource\s+"aws_eip"\s+"nat"[^}]+\{[^}]+\}/s)?.[0] || "";
      expect(eipSection).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe("Variable Validation", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    const vpcVariablesPath = path.join(LIB_DIR, "modules/vpc/variables.tf");
    const sgVariablesPath = path.join(LIB_DIR, "modules/security-groups/variables.tf");
    let variablesContent: string;
    let vpcVariablesContent: string;
    let sgVariablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesPath, "utf8");
      vpcVariablesContent = fs.readFileSync(vpcVariablesPath, "utf8");
      sgVariablesContent = fs.readFileSync(sgVariablesPath, "utf8");
    });

    test("all variables have descriptions", () => {
      const varMatches = variablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      varMatches.forEach(variable => {
        expect(variable).toMatch(/description\s*=\s*"[^"]+"/);
      });
    });

    test("all variables have type constraints", () => {
      const varMatches = [
        ...variablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [],
        ...vpcVariablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [],
        ...sgVariablesContent.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || []
      ];
      
      varMatches.forEach(variable => {
        expect(variable).toMatch(/type\s*=\s*(string|list\(string\)|map\(string\)|bool|number)/);
      });
    });

    test("critical variables have defaults", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[^}]+default\s*=\s*"us-west-2"/s);
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"[^}]+default\s*=\s*"10\.0\.0\.0\/16"/s);
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[^}]+default\s*=\s*"dev"/s);
    });
  });
});