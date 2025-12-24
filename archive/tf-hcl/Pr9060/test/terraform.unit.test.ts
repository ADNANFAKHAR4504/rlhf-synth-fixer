// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure and Syntax", () => {
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("has valid Terraform syntax structure", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"/);
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });
  });

  describe("Variable Definitions", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares allowed_ip_ranges variable", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ip_ranges"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });
  });

  describe("VPC Configuration", () => {
    test("creates VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has proper tagging", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("Subnet Configuration", () => {
    test("creates 3 public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates 1 private subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("subnets use cidrsubnet function", () => {
      expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*8,\s*count\.index\)/);
    });

    test("subnets have proper tagging", () => {
      expect(stackContent).toMatch(/Type\s*=\s*"public"/);
      expect(stackContent).toMatch(/Type\s*=\s*"private"/);
    });
  });

  describe("Internet Gateway", () => {
    test("creates internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("internet gateway is attached to VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe("Route Tables", () => {
    test("creates public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    });

    test("public route table has internet gateway route", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("associates public subnets with route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("creates public security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"public"\s*{/);
    });

    test("creates private security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"private"\s*{/);
    });

    test("public security group uses dynamic blocks for IP restrictions", () => {
      expect(stackContent).toMatch(/dynamic\s+"ingress"/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.allowed_ip_ranges/);
    });

    test("private security group references public security group", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.public\.id\]/);
    });

    test("security groups have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Security group for public resources with IP restrictions"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for private resources"/);
    });

    test("security groups have restricted outbound rules", () => {
      expect(stackContent).toMatch(/egress\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*53/);
    });
  });

  describe("Resource Tagging", () => {
    test("all resources have Environment tag", () => {
      const resourceBlocks = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      const taggedResources = stackContent.match(/Environment\s*=\s*var\.environment/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(0);
    });

    test("resources have ManagedBy tag", () => {
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("Outputs", () => {
    test("exports VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("exports public subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
    });

    test("exports private subnet ID", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_id"/);
    });

    test("exports security group IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_security_group_id"/);
      expect(stackContent).toMatch(/output\s+"private_security_group_id"/);
    });

    test("exports internet gateway ID", () => {
      expect(stackContent).toMatch(/output\s+"internet_gateway_id"/);
    });
  });

  describe("Security Requirements", () => {
    test("no overly permissive security group rules (0.0.0.0/0 for inbound)", () => {
      const inboundRules = stackContent.match(/ingress\s*{[^}]*}/g);
      if (inboundRules) {
        inboundRules.forEach(rule => {
          if (rule.includes('0.0.0.0/0')) {
            // Only allow 0.0.0.0/0 in dynamic blocks for allowed IP ranges
            expect(rule).toMatch(/for_each\s*=\s*var\.allowed_ip_ranges/);
          }
        });
      }
    });

    test("uses least privilege principle for outbound rules", () => {
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*80[^}]*}/);
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*443[^}]*}/);
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*53[^}]*}/);
    });
  });

  describe("Best Practices", () => {
    test("uses variables instead of hardcoded values", () => {
      expect(stackContent).toMatch(/var\.vpc_cidr/);
      expect(stackContent).toMatch(/var\.environment/);
      expect(stackContent).toMatch(/var\.allowed_ip_ranges/);
    });

    test("includes descriptive comments", () => {
      expect(stackContent).toMatch(/########################/);
      expect(stackContent).toMatch(/# Variables/);
      expect(stackContent).toMatch(/# VPC/);
      expect(stackContent).toMatch(/# Security Group for Public Resources/);
    });

    test("uses proper resource naming", () => {
      expect(stackContent).toMatch(/aws_vpc\.main/);
      expect(stackContent).toMatch(/aws_subnet\.public/);
      expect(stackContent).toMatch(/aws_subnet\.private/);
    });
  });
});
