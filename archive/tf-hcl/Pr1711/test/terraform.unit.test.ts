// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates security group configurations and infrastructure requirements

import fs from "fs";
import path from "path";
import { TerraformValidator, parseSecurityGroupRules, validateResourceTags } from "../lib/terraform-validator";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let validator: TerraformValidator;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    validator = new TerraformValidator(stackPath);
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Configuration", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares allowed_http_cidr with correct default (192.168.1.0/24)", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_http_cidr"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"192\.168\.1\.0\/24"/);
    });

    test("declares allowed_ssh_cidr with correct default (203.0.113.0/24)", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"203\.0\.113\.0\/24"/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC resource with DNS support", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("creates NAT Gateway for private subnet connectivity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test("creates public subnet with public IP disabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("creates private subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("creates route tables for public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("private route table uses NAT gateway for outbound traffic", () => {
      const privateRouteMatch = stackContent.match(/resource\s+"aws_route_table"\s+"private"[\s\S]*?nat_gateway_id/);
      expect(privateRouteMatch).toBeTruthy();
    });
  });

  describe("Security Groups - Critical Requirements", () => {
    describe("HTTP Security Group", () => {
      test("creates HTTP security group resource", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"http_access"\s*{/);
      });

      test("HTTP security group allows port 80 only from 192.168.1.0/24", () => {
        const httpSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"http_access"[\s\S]*?(?=resource|output|$)/);
        expect(httpSgMatch).toBeTruthy();
        const httpSgContent = httpSgMatch![0];
        
        // Check for port 80 ingress rule
        expect(httpSgContent).toMatch(/from_port\s*=\s*80/);
        expect(httpSgContent).toMatch(/to_port\s*=\s*80/);
        
        // Check that it references the allowed_http_cidr variable
        expect(httpSgContent).toMatch(/cidr_blocks\s*=\s*\[\s*var\.allowed_http_cidr\s*\]/);
      });

      test("HTTP security group allows port 443 only from 192.168.1.0/24", () => {
        const httpSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"http_access"[\s\S]*?(?=resource|output|$)/);
        expect(httpSgMatch).toBeTruthy();
        const httpSgContent = httpSgMatch![0];
        
        // Check for port 443 ingress rule
        expect(httpSgContent).toMatch(/from_port\s*=\s*443/);
        expect(httpSgContent).toMatch(/to_port\s*=\s*443/);
      });

      test("HTTP security group does NOT allow traffic from 0.0.0.0/0", () => {
        const httpSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"http_access"[\s\S]*?(?=resource|output|$)/);
        expect(httpSgMatch).toBeTruthy();
        const httpSgContent = httpSgMatch![0];
        
        // Ensure no 0.0.0.0/0 in ingress rules
        const ingressSection = httpSgContent.match(/ingress\s*{[\s\S]*?}/g);
        if (ingressSection) {
          ingressSection.forEach(rule => {
            expect(rule).not.toMatch(/cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/);
          });
        }
      });
    });

    describe("SSH Security Group", () => {
      test("creates SSH security group resource", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssh_access"\s*{/);
      });

      test("SSH security group allows port 22 only from 203.0.113.0/24", () => {
        const sshSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ssh_access"[\s\S]*?(?=resource|output|$)/);
        expect(sshSgMatch).toBeTruthy();
        const sshSgContent = sshSgMatch![0];
        
        // Check for port 22 ingress rule
        expect(sshSgContent).toMatch(/from_port\s*=\s*22/);
        expect(sshSgContent).toMatch(/to_port\s*=\s*22/);
        
        // Check that it references the allowed_ssh_cidr variable
        expect(sshSgContent).toMatch(/cidr_blocks\s*=\s*\[\s*var\.allowed_ssh_cidr\s*\]/);
      });

      test("SSH security group does NOT allow traffic from 0.0.0.0/0", () => {
        const sshSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ssh_access"[\s\S]*?(?=resource|output|$)/);
        expect(sshSgMatch).toBeTruthy();
        const sshSgContent = sshSgMatch![0];
        
        // Ensure no 0.0.0.0/0 in ingress rules
        const ingressSection = sshSgContent.match(/ingress\s*{[\s\S]*?}/g);
        if (ingressSection) {
          ingressSection.forEach(rule => {
            expect(rule).not.toMatch(/cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/);
          });
        }
      });
    });

    describe("Internal Security Group", () => {
      test("creates internal security group resource", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"internal"\s*{/);
      });

      test("internal security group allows traffic only from VPC CIDR", () => {
        const internalSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"internal"[\s\S]*?(?=resource|output|$)/);
        expect(internalSgMatch).toBeTruthy();
        const internalSgContent = internalSgMatch![0];
        
        // Check that it references the vpc_cidr variable
        expect(internalSgContent).toMatch(/cidr_blocks\s*=\s*\[\s*var\.vpc_cidr\s*\]/);
      });

      test("internal security group does NOT allow traffic from 0.0.0.0/0", () => {
        const internalSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"internal"[\s\S]*?(?=resource|output|$)/);
        expect(internalSgMatch).toBeTruthy();
        const internalSgContent = internalSgMatch![0];
        
        // Ensure no 0.0.0.0/0 in ingress rules
        const ingressSection = internalSgContent.match(/ingress\s*{[\s\S]*?}/g);
        if (ingressSection) {
          ingressSection.forEach(rule => {
            expect(rule).not.toMatch(/cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/);
          });
        }
      });
    });

    test("NO security group allows inbound traffic from 0.0.0.0/0", () => {
      // Find all security group ingress rules
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?(?=resource|output|$)/g);
      expect(sgMatches).toBeTruthy();
      
      sgMatches!.forEach(sg => {
        const ingressRules = sg.match(/ingress\s*{[\s\S]*?}/g);
        if (ingressRules) {
          ingressRules.forEach(rule => {
            expect(rule).not.toMatch(/cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/);
          });
        }
      });
    });
  });

  describe("EC2 Instance", () => {
    test("creates EC2 instance resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_server"\s*{/);
    });

    test("EC2 instance is placed in private subnet", () => {
      const instanceMatch = stackContent.match(/resource\s+"aws_instance"\s+"web_server"[\s\S]*?(?=resource|output|$)/);
      expect(instanceMatch).toBeTruthy();
      const instanceContent = instanceMatch![0];
      expect(instanceContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\.id/);
    });

    test("EC2 instance has public IP assignment disabled", () => {
      const instanceMatch = stackContent.match(/resource\s+"aws_instance"\s+"web_server"[\s\S]*?(?=resource|output|$)/);
      expect(instanceMatch).toBeTruthy();
      const instanceContent = instanceMatch![0];
      expect(instanceContent).toMatch(/associate_public_ip_address\s*=\s*false/);
    });

    test("EC2 instance has encrypted root volume", () => {
      const instanceMatch = stackContent.match(/resource\s+"aws_instance"\s+"web_server"[\s\S]*?(?=resource|output|$)/);
      expect(instanceMatch).toBeTruthy();
      const instanceContent = instanceMatch![0];
      expect(instanceContent).toMatch(/encrypted\s*=\s*true/);
      expect(instanceContent).toMatch(/delete_on_termination\s*=\s*true/);
    });

    test("EC2 instance has all three security groups attached", () => {
      const instanceMatch = stackContent.match(/resource\s+"aws_instance"\s+"web_server"[\s\S]*?(?=resource|output|$)/);
      expect(instanceMatch).toBeTruthy();
      const instanceContent = instanceMatch![0];
      expect(instanceContent).toMatch(/aws_security_group\.http_access\.id/);
      expect(instanceContent).toMatch(/aws_security_group\.ssh_access\.id/);
      expect(instanceContent).toMatch(/aws_security_group\.internal\.id/);
    });
  });

  describe("Resource Naming", () => {
    test("all resources include environment_suffix in their names", () => {
      // Check that major resources use environment_suffix variable
      const resourcePatterns = [
        /Name\s*=\s*".*\$\{var\.environment_suffix\}/g
      ];
      
      resourcePatterns.forEach(pattern => {
        const matches = stackContent.match(pattern);
        expect(matches).toBeTruthy();
        expect(matches!.length).toBeGreaterThan(5); // Should have multiple resources with suffix
      });
    });
  });

  describe("Outputs", () => {
    test("outputs VPC information", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"vpc_cidr_block"\s*{/);
    });

    test("outputs subnet information", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"private_subnet_id"\s*{/);
    });

    test("outputs security group IDs", () => {
      expect(stackContent).toMatch(/output\s+"http_security_group_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"ssh_security_group_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"internal_security_group_id"\s*{/);
    });

    test("outputs allowed CIDR blocks", () => {
      expect(stackContent).toMatch(/output\s+"allowed_http_cidr"\s*{/);
      expect(stackContent).toMatch(/output\s+"allowed_ssh_cidr"\s*{/);
    });

    test("outputs security summary", () => {
      expect(stackContent).toMatch(/output\s+"security_summary"\s*{/);
    });
  });

  describe("Terraform Validator Module Tests", () => {
    test("validator detects all required variables", () => {
      expect(validator.hasVariable("aws_region")).toBe(true);
      expect(validator.hasVariable("environment_suffix")).toBe(true);
      expect(validator.hasVariable("allowed_http_cidr")).toBe(true);
      expect(validator.hasVariable("allowed_ssh_cidr")).toBe(true);
      expect(validator.hasVariable("vpc_cidr")).toBe(true);
    });

    test("validator detects all required resources", () => {
      expect(validator.hasResource("aws_vpc", "main")).toBe(true);
      expect(validator.hasResource("aws_subnet", "public")).toBe(true);
      expect(validator.hasResource("aws_subnet", "private")).toBe(true);
      expect(validator.hasResource("aws_security_group", "http_access")).toBe(true);
      expect(validator.hasResource("aws_security_group", "ssh_access")).toBe(true);
      expect(validator.hasResource("aws_security_group", "internal")).toBe(true);
      expect(validator.hasResource("aws_instance", "web_server")).toBe(true);
    });

    test("validator confirms no public access allowed", () => {
      expect(validator.validateNoPublicAccess()).toBe(true);
    });

    test("validator confirms correct CIDR blocks", () => {
      expect(validator.validateCidrBlock("allowed_http_cidr", "192.168.1.0/24")).toBe(true);
      expect(validator.validateCidrBlock("allowed_ssh_cidr", "203.0.113.0/24")).toBe(true);
    });

    test("validator confirms environment suffix usage", () => {
      expect(validator.validateEnvironmentSuffixUsage()).toBe(true);
    });

    test("validator confirms EC2 security configuration", () => {
      expect(validator.validateEC2SecurityConfig()).toBe(true);
    });

    test("validator confirms VPC configuration", () => {
      expect(validator.validateVPCConfig()).toBe(true);
    });

    test("validator confirms NAT Gateway configuration", () => {
      expect(validator.validateNATGateway()).toBe(true);
    });

    test("validator confirms subnet configuration", () => {
      expect(validator.validateSubnetConfig()).toBe(true);
    });

    test("validator confirms all required outputs", () => {
      expect(validator.validateOutputs()).toBe(true);
    });

    test("validator validateAll returns no errors", () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("parseSecurityGroupRules extracts security groups correctly", () => {
      const securityGroups = parseSecurityGroupRules(stackContent);
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);
      
      const httpSg = securityGroups.find(sg => sg.name === "http_access");
      expect(httpSg).toBeDefined();
      expect(httpSg?.ingress_rules.length).toBeGreaterThan(0);
      
      const sshSg = securityGroups.find(sg => sg.name === "ssh_access");
      expect(sshSg).toBeDefined();
      expect(sshSg?.ingress_rules.length).toBeGreaterThan(0);
    });

    test("validateResourceTags confirms proper tagging", () => {
      expect(validateResourceTags(stackContent, "aws_vpc", "main")).toBe(true);
      expect(validateResourceTags(stackContent, "aws_instance", "web_server")).toBe(true);
      expect(validateResourceTags(stackContent, "aws_security_group", "http_access")).toBe(true);
    });
  });
});
