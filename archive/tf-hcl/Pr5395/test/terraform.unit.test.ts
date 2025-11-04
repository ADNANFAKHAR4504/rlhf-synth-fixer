// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates Terraform configuration structure without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*?required_version/);
    });

    test("provider.tf declares terraform required_version", () => {
      expect(providerContent).toMatch(/required_version/);
    });

    test("provider.tf declares AWS provider version constraint", () => {
      expect(providerContent).toMatch(/hashicorp\/aws/);
    });
  });

  describe("Variables Declaration", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region variable defaults to us-west-1", () => {
      const match = stackContent.match(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe("us-west-1");
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("vpc_cidr defaults to 10.0.0.0/16", () => {
      const match = stackContent.match(/variable\s+"vpc_cidr"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe("10.0.0.0/16");
    });

    test("declares public_subnet_1_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"public_subnet_1_cidr"\s*{/);
    });

    test("public_subnet_1_cidr defaults to 10.0.1.0/24", () => {
      const match = stackContent.match(/variable\s+"public_subnet_1_cidr"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe("10.0.1.0/24");
    });

    test("declares public_subnet_2_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"public_subnet_2_cidr"\s*{/);
    });

    test("public_subnet_2_cidr defaults to 10.0.2.0/24", () => {
      const match = stackContent.match(/variable\s+"public_subnet_2_cidr"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe("10.0.2.0/24");
    });

    test("declares instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("availability zones filtered by available state", () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("VPC Configuration", () => {
    test("declares aws_vpc resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC uses vpc_cidr variable", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has proper tags", () => {
      const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?Name[\s\S]*?}/);
      expect(vpcMatch).toBeTruthy();
      expect(vpcMatch![0]).toMatch(/Name/);
      
      // Check for Environment tag in a broader context
      const vpcSection = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
      expect(vpcSection).toBeTruthy();
      expect(vpcSection![0]).toMatch(/Environment/);
      expect(vpcSection![0]).toMatch(/Project/);
    });
  });

  describe("Internet Gateway Configuration", () => {
    test("declares aws_internet_gateway resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("Internet Gateway attached to VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("Internet Gateway has proper tags", () => {
      const igwMatch = stackContent.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?tags\s*=\s*{([\s\S]*?)}/);
      expect(igwMatch).toBeTruthy();
    });
  });

  describe("Subnet Configuration", () => {
    test("declares public_subnet_1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"\s*{/);
    });

    test("declares public_subnet_2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"\s*{/);
    });

    test("public_subnet_1 uses correct CIDR variable", () => {
      const subnet1Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?cidr_block\s*=\s*var\.public_subnet_1_cidr/);
      expect(subnet1Match).toBeTruthy();
    });

    test("public_subnet_2 uses correct CIDR variable", () => {
      const subnet2Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_2"\s*{[\s\S]*?cidr_block\s*=\s*var\.public_subnet_2_cidr/);
      expect(subnet2Match).toBeTruthy();
    });

    test("public_subnet_1 in first availability zone", () => {
      const subnet1Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
      expect(subnet1Match).toBeTruthy();
    });

    test("public_subnet_2 in second availability zone", () => {
      const subnet2Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_2"\s*{[\s\S]*?availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
      expect(subnet2Match).toBeTruthy();
    });

    test("subnets have map_public_ip_on_launch enabled", () => {
      const matches = stackContent.match(/map_public_ip_on_launch\s*=\s*true/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test("subnets attached to VPC", () => {
      const matches = stackContent.match(/vpc_id\s*=\s*aws_vpc\.main\.id/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3); // VPC + 2 subnets + security group
    });
  });

  describe("Route Table Configuration", () => {
    test("declares aws_route_table for public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    });

    test("route table attached to VPC", () => {
      const rtMatch = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(rtMatch).toBeTruthy();
    });

    test("declares aws_route for internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"public_internet"\s*{/);
    });

    test("route points to internet (0.0.0.0/0)", () => {
      expect(stackContent).toMatch(/destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("route uses internet gateway", () => {
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("route depends on internet gateway", () => {
      const routeMatch = stackContent.match(/resource\s+"aws_route"\s+"public_internet"\s*{[\s\S]*?depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      expect(routeMatch).toBeTruthy();
    });
  });

  describe("Route Table Associations", () => {
    test("declares route table association for public_subnet_1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"\s*{/);
    });

    test("declares route table association for public_subnet_2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"\s*{/);
    });

    test("public_subnet_1 associated with public route table", () => {
      const assoc1Match = stackContent.match(/resource\s+"aws_route_table_association"\s+"public_1"\s*{[\s\S]*?subnet_id\s*=\s*aws_subnet\.public_1\.id/);
      expect(assoc1Match).toBeTruthy();
    });

    test("public_subnet_2 associated with public route table", () => {
      const assoc2Match = stackContent.match(/resource\s+"aws_route_table_association"\s+"public_2"\s*{[\s\S]*?subnet_id\s*=\s*aws_subnet\.public_2\.id/);
      expect(assoc2Match).toBeTruthy();
    });
  });

  describe("Security Group Configuration", () => {
    test("declares aws_security_group resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"main"\s*{/);
    });

    test("security group has name", () => {
      const sgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"main"\s*{[\s\S]*?name\s*=/);
      expect(sgMatch).toBeTruthy();
    });

    test("security group attached to VPC", () => {
      const sgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"main"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(sgMatch).toBeTruthy();
    });

    test("security group allows HTTP (port 80)", () => {
      const sgMatch = stackContent.match(/ingress\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/);
      expect(sgMatch).toBeTruthy();
    });

    test("security group allows SSH (port 22)", () => {
      const sgMatch = stackContent.match(/ingress\s*{[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
      expect(sgMatch).toBeTruthy();
    });

    test("security group has egress rules", () => {
      expect(stackContent).toMatch(/egress\s*{/);
    });

    test("security group allows all outbound traffic", () => {
      const egressMatch = stackContent.match(/egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/);
      expect(egressMatch).toBeTruthy();
    });
  });

  describe("IAM Role Configuration", () => {
    test("declares aws_iam_role for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("IAM role has name", () => {
      const roleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?name\s*=/);
      expect(roleMatch).toBeTruthy();
    });

    test("IAM role has assume_role_policy", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=/);
    });

    test("IAM role allows EC2 service to assume role", () => {
      const roleMatch = stackContent.match(/assume_role_policy[\s\S]*?Service.*ec2\.amazonaws\.com/);
      expect(roleMatch).toBeTruthy();
    });

    test("IAM role has tags", () => {
      const roleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?tags\s*=/);
      expect(roleMatch).toBeTruthy();
    });
  });

  describe("IAM Policy Attachments", () => {
    test("declares S3 ReadOnly policy attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_readonly"\s*{/);
    });

    test("S3 ReadOnly policy attached to EC2 role", () => {
      const attachMatch = stackContent.match(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_readonly"\s*{[\s\S]*?role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(attachMatch).toBeTruthy();
    });

    test("S3 ReadOnly uses correct AWS managed policy", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonS3ReadOnlyAccess"/);
    });

    test("declares EC2 Full Access policy attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_full"\s*{/);
    });

    test("EC2 Full Access policy attached to EC2 role", () => {
      const attachMatch = stackContent.match(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_full"\s*{[\s\S]*?role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(attachMatch).toBeTruthy();
    });

    test("EC2 Full Access uses correct AWS managed policy", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEC2FullAccess"/);
    });
  });

  describe("IAM Instance Profile", () => {
    test("declares aws_iam_instance_profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
    });

    test("instance profile has name", () => {
      const profileMatch = stackContent.match(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{[\s\S]*?name\s*=/);
      expect(profileMatch).toBeTruthy();
    });

    test("instance profile references IAM role", () => {
      const profileMatch = stackContent.match(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{[\s\S]*?role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(profileMatch).toBeTruthy();
    });

    test("instance profile has tags", () => {
      const profileMatch = stackContent.match(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{[\s\S]*?tags\s*=/);
      expect(profileMatch).toBeTruthy();
    });
  });

  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares public_subnet_1_id output", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_1_id"\s*{/);
    });

    test("declares public_subnet_2_id output", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_2_id"\s*{/);
    });

    test("declares internet_gateway_id output", () => {
      expect(stackContent).toMatch(/output\s+"internet_gateway_id"\s*{/);
    });

    test("declares public_route_table_id output", () => {
      expect(stackContent).toMatch(/output\s+"public_route_table_id"\s*{/);
    });

    test("declares security_group_id output", () => {
      expect(stackContent).toMatch(/output\s+"security_group_id"\s*{/);
    });

    test("declares iam_role_arn output", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_arn"\s*{/);
    });

    test("declares iam_instance_profile_name output", () => {
      expect(stackContent).toMatch(/output\s+"iam_instance_profile_name"\s*{/);
    });

    test("declares availability_zones output", () => {
      expect(stackContent).toMatch(/output\s+"availability_zones"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = stackContent.match(/output\s+"[^"]+"\s*{[\s\S]*?description\s*=/g);
      expect(outputMatches).toBeTruthy();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(9);
    });

    test("vpc_id output references correct resource", () => {
      const outputMatch = stackContent.match(/output\s+"vpc_id"\s*{[\s\S]*?value\s*=\s*aws_vpc\.main\.id/);
      expect(outputMatch).toBeTruthy();
    });

    test("iam_role_arn output references correct resource", () => {
      const outputMatch = stackContent.match(/output\s+"iam_role_arn"\s*{[\s\S]*?value\s*=\s*aws_iam_role\.ec2_role\.arn/);
      expect(outputMatch).toBeTruthy();
    });
  });

  describe("Tagging Standards", () => {
    test("all major resources have tags", () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_route_table',
        'aws_security_group',
        'aws_iam_role',
        'aws_iam_instance_profile'
      ];

      resourceTypes.forEach(resourceType => {
        const resourceMatch = stackContent.match(new RegExp(`resource\\s+"${resourceType}"\\s+"\\w+"\\s*{[\\s\\S]*?tags\\s*=`, 'g'));
        expect(resourceMatch).toBeTruthy();
      });
    });

    test("resources use consistent tagging with variables", () => {
      const tagMatches = stackContent.match(/\$\{var\.project_name\}/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(10);
    });
  });

  describe("Best Practices", () => {
    test("uses Terraform interpolation syntax correctly", () => {
      expect(stackContent).toMatch(/\$\{var\.\w+\}/);
    });

    test("resources have meaningful names", () => {
      const resourceNames = ['main', 'public_1', 'public_2', 'ec2_role', 'ec2_profile'];
      resourceNames.forEach(name => {
        expect(stackContent).toMatch(new RegExp(`"${name}"`));
      });
    });

    test("uses data sources for dynamic values", () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available/);
    });

    test("follows HCL formatting conventions", () => {
      // Check for proper resource block structure
      expect(stackContent).toMatch(/resource\s+"[\w_]+"\s+"[\w_]+"\s*{/);
    });
  });

  describe("Security Best Practices Validation", () => {
    test("VPC uses private IP address space (RFC 1918)", () => {
      expect(stackContent).toMatch(/10\.0\.0\.0\/16/);
    });

    test("IAM role uses AWS managed policies", () => {
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy/);
    });

    test("subnets distributed across multiple AZs", () => {
      expect(stackContent).toMatch(/availability_zone.*names\[0\]/);
      expect(stackContent).toMatch(/availability_zone.*names\[1\]/);
    });

    test("route has explicit dependency on IGW", () => {
      expect(stackContent).toMatch(/depends_on.*aws_internet_gateway/);
    });
  });

  describe("No Retain Policies", () => {
    test("no resources have DeletionPolicy or Retain", () => {
      expect(stackContent).not.toMatch(/DeletionPolicy/i);
      expect(stackContent).not.toMatch(/Retain/i);
      expect(stackContent).not.toMatch(/prevent_destroy/i);
    });
  });
});
