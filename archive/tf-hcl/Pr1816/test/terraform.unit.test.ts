// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure code - tap_stack.tf

import fs from "fs";
import path from "path";

const tapStackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  describe("Infrastructure Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, "utf8");
    });

    test("declares locals block with unique naming", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/task_id\s*=\s*"task-229148"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.task_id\}-tap"/);
      expect(stackContent).toMatch(/common_tags\s*=/);
    });

    test("declares all required variables", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/variable\s+"public_subnet_cidr"\s*{/);
      expect(stackContent).toMatch(/variable\s+"private_subnet_cidr"\s*{/);
      expect(stackContent).toMatch(/variable\s+"trusted_ip_ranges"\s*{/);
    });

    test("trusted_ip_ranges variable has secure defaults and validation", () => {
      expect(stackContent).toMatch(/variable\s+"trusted_ip_ranges"\s*{[\s\S]*?default\s*=\s*\["10\.0\.0\.0\/8",\s*"172\.16\.0\.0\/12",\s*"192\.168\.0\.0\/16"\]/);
      expect(stackContent).toMatch(/validation\s*{/);
      expect(stackContent).toMatch(/condition\s*=\s*length\(var\.trusted_ip_ranges\)\s*>\s*0/);
      expect(stackContent).toMatch(/error_message\s*=\s*"At least one trusted IP range must be specified for SSH access\."/);
    });

    test("uses data source for availability zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("creates VPC resource with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test("creates Internet Gateway with proper naming", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-igw"/);
    });

    test("creates public subnet with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidr/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-public-subnet"/);
    });

    test("creates private subnet with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidr/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-private-subnet"/);
    });

    test("creates Elastic IP with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-nat-eip"/);
    });

    test("creates NAT Gateway with proper dependencies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\.id/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-nat-gateway"/);
    });

    test("creates public route table with internet gateway route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/route\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-public-route-table"/);
    });

    test("creates private route table with NAT gateway route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/route\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-private-route-table"/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\.id/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
      
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\.id/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.private\.id/);
    });

    test("creates application security group with correct rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"application"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-application-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for application servers"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // Check HTTP ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/description\s*=\s*"HTTP access from anywhere"/);
      
      // Check HTTPS ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/description\s*=\s*"HTTPS access from anywhere"/);
      
      // Check egress rule
      expect(stackContent).toMatch(/egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/);
      expect(stackContent).toMatch(/description\s*=\s*"All outbound traffic"/);
    });

    test("creates SSH security group with correct rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssh"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-ssh-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for SSH access"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // Check SSH ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*var\.trusted_ip_ranges/);
      expect(stackContent).toMatch(/description\s*=\s*"SSH access from trusted IP ranges"/);
    });

    test("creates Network ACL with correct rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // Check HTTP ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?rule_no\s*=\s*100[\s\S]*?action\s*=\s*"allow"[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/);
      
      // Check HTTPS ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?rule_no\s*=\s*110[\s\S]*?action\s*=\s*"allow"[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
      
      // Check SSH ingress rule for first trusted IP range
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?rule_no\s*=\s*120[\s\S]*?action\s*=\s*"allow"[\s\S]*?cidr_block\s*=\s*var\.trusted_ip_ranges\[0\][\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
      
      // Check for dynamic SSH rules for additional trusted IP ranges
      expect(stackContent).toMatch(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*length\(var\.trusted_ip_ranges\)\s*>\s*1\s*\?\s*slice\(var\.trusted_ip_ranges,\s*1,\s*length\(var\.trusted_ip_ranges\)\)\s*:\s*\[\]/);
      
      // Check ephemeral ports rule (rule number updated to 140)
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?rule_no\s*=\s*140[\s\S]*?action\s*=\s*"allow"[\s\S]*?from_port\s*=\s*1024[\s\S]*?to_port\s*=\s*65535/);
      
      // Check egress rule
      expect(stackContent).toMatch(/egress\s*{[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?rule_no\s*=\s*100[\s\S]*?action\s*=\s*"allow"/);
    });

    test("declares all required outputs with descriptions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      
      expect(stackContent).toMatch(/output\s+"public_subnet_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the public subnet"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.public\.id/);
      
      expect(stackContent).toMatch(/output\s+"private_subnet_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the private subnet"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.private\.id/);
      
      expect(stackContent).toMatch(/output\s+"internet_gateway_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the Internet Gateway"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_internet_gateway\.main\.id/);
      
      expect(stackContent).toMatch(/output\s+"nat_gateway_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the NAT Gateway"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_nat_gateway\.main\.id/);
      
      expect(stackContent).toMatch(/output\s+"application_security_group_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the application security group"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.application\.id/);
      
      expect(stackContent).toMatch(/output\s+"ssh_security_group_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the SSH security group"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.ssh\.id/);
      
      expect(stackContent).toMatch(/output\s+"vpc_cidr_block"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"CIDR block of the VPC"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.cidr_block/);
    });
  });

  describe("Code Quality and Best Practices", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, "utf8");
      if (fs.existsSync(providerPath)) {
        providerContent = fs.readFileSync(providerPath, "utf8");
      } else {
        providerContent = "";
      }
    });

    test("uses consistent unique naming throughout", () => {
      // All resources should use the name_prefix pattern
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-igw"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-public-subnet"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-private-subnet"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-application-sg"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-ssh-sg"/);
    });

    test("uses merge function for consistent tagging", () => {
      // Check that all taggable resources use merge with common_tags
      const mergePattern = /tags\s*=\s*merge\(local\.common_tags/g;
      const matches = stackContent.match(mergePattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(8); // VPC, IGW, Subnets, EIP, NAT, Route Tables, Network ACL
    });

    test("no hardcoded credentials in files", () => {
      const combinedContent = stackContent + providerContent;
      expect(combinedContent).not.toMatch(/aws_access_key_id/i);
      expect(combinedContent).not.toMatch(/aws_secret_access_key/i);
      expect(combinedContent).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS Access Key pattern
    });

    test("proper separation of concerns", () => {
      // Check that tap_stack.tf doesn't contain provider configuration
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
      expect(stackContent).not.toMatch(/^\s*terraform\s*{/m);
    });

    test("all variables have proper type definitions", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{[\s\S]*?type\s*=\s*string/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?type\s*=\s*string/);
      expect(stackContent).toMatch(/variable\s+"trusted_ip_ranges"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("all variables have descriptions", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?description\s*=/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{[\s\S]*?description\s*=/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?description\s*=/);
      expect(stackContent).toMatch(/variable\s+"public_subnet_cidr"\s*{[\s\S]*?description\s*=/);
      expect(stackContent).toMatch(/variable\s+"private_subnet_cidr"\s*{[\s\S]*?description\s*=/);
      expect(stackContent).toMatch(/variable\s+"trusted_ip_ranges"\s*{[\s\S]*?description\s*=/);
    });

    test("uses modern Terraform syntax", () => {
      // Check for domain = "vpc" instead of deprecated vpc = true
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).not.toMatch(/vpc\s*=\s*true/);
    });

    test("proper dependency management", () => {
      // Check explicit dependencies
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("consistent resource naming convention", () => {
      // All main infrastructure resources should use "main" as the name
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
    });
  });

  describe("Security Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, "utf8");
    });

    test("security groups follow principle of least privilege", () => {
      // Application security group should only have HTTP/HTTPS
      const appSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"application"\s*{([\s\S]*?)^}/m);
      expect(appSgMatch).toBeTruthy();
      
      if (appSgMatch) {
        const appSgContent = appSgMatch[1];
        // Should have HTTP and HTTPS but not SSH
        expect(appSgContent).toMatch(/from_port\s*=\s*80/);
        expect(appSgContent).toMatch(/from_port\s*=\s*443/);
        expect(appSgContent).not.toMatch(/from_port\s*=\s*22/);
      }
      
      // SSH security group should only have SSH
      const sshSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ssh"\s*{([\s\S]*?)^}/m);
      expect(sshSgMatch).toBeTruthy();
      
      if (sshSgMatch) {
        const sshSgContent = sshSgMatch[1];
        expect(sshSgContent).toMatch(/from_port\s*=\s*22/);
        expect(sshSgContent).not.toMatch(/from_port\s*=\s*80/);
        expect(sshSgContent).not.toMatch(/from_port\s*=\s*443/);
      }
    });

    test("Network ACL provides additional security layer", () => {
      // Should have restrictive rules for common ports
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/action\s*=\s*"allow"/);
      expect(stackContent).toMatch(/rule_no\s*=\s*100/); // HTTP
      expect(stackContent).toMatch(/rule_no\s*=\s*110/); // HTTPS
      expect(stackContent).toMatch(/rule_no\s*=\s*120/); // SSH
      expect(stackContent).toMatch(/rule_no\s*=\s*140/); // Ephemeral (updated from 130)
    });

    test("subnets are properly segregated", () => {
      // Public subnet should map public IPs
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      
      // Private subnet should NOT map public IPs (absence of the setting or false)
      const privateSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{([\s\S]*?)^}/m);
      expect(privateSubnetMatch).toBeTruthy();
      
      if (privateSubnetMatch) {
        const privateSubnetContent = privateSubnetMatch[1];
        expect(privateSubnetContent).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });
  });
});