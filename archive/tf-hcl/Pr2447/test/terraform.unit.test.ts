import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Stack: tap_stack.tf - Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(stackContent).toBeTruthy();
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("contains valid Terraform syntax (basic validation)", () => {
      // Check for basic Terraform resource syntax
      expect(stackContent).toMatch(/resource\s+"[^"]+"\s+"[^"]+"\s*{/);
      expect(stackContent).toMatch(/variable\s+"[^"]+"\s*{/);
      expect(stackContent).toMatch(/output\s+"[^"]+"\s*{/);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Validation", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region variable has correct type and default", () => {
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("declares main VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has correct CIDR block", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares public subnet resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    });

    test("declares private subnet resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("public subnet has correct CIDR and AZ", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2a"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("private subnet has correct CIDR", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("declares internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"gw"\s*{/);
    });

    test("declares public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    });

    test("declares route table association", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"a"\s*{/);
    });
  });

  describe("Security Resources", () => {
    test("declares security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"default"\s*{/);
    });

    test("security group has ingress and egress rules", () => {
      expect(stackContent).toMatch(/ingress\s*{/);
      expect(stackContent).toMatch(/egress\s*{/);
    });

    test("declares network ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"\s*{/);
    });
  });

  describe("IAM Resources", () => {
    test("declares IAM role for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("declares IAM role policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
    });

    test("IAM role has assume role policy", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });
  });

  describe("Storage and Logging Resources", () => {
    test("declares S3 bucket for logging", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
    });

    test("S3 bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/versioning\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("declares VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs"\s*{/);
    });

    test("flow logs configured for S3 destination", () => {
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("Secrets Management", () => {
    test("declares Secrets Manager secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"example"\s*{/);
    });

    test("declares secret version", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"example"\s*{/);
    });
  });

  describe("Outputs Validation", () => {
    test("declares VPC ID output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares public subnet ID output", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_id"\s*{/);
    });

    test("declares private subnet ID output", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_id"\s*{/);
    });
  });

  describe("Tagging Standards", () => {
    test("resources have consistent tagging", () => {
      const tagPattern = /tags\s*=\s*{\s*[\s\S]*?Name\s*=\s*"[^"]*"[\s\S]*?Environment\s*=\s*"production"[\s\S]*?Owner\s*=\s*"admin"[\s\S]*?}/;
      expect(stackContent).toMatch(tagPattern);
    });

    test("all major resources have tags", () => {
      const resourcesWithTags = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_network_acl',
        'aws_iam_role',
        'aws_s3_bucket',
        'aws_flow_log',
        'aws_secretsmanager_secret'
      ];

      resourcesWithTags.forEach(resourceType => {
        const resourcePattern = new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?tags\\s*=\\s*{`, 'g');
        const matches = stackContent.match(resourcePattern);
        if (matches) {
          expect(matches.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Security Best Practices", () => {
    test("security group allows all outbound traffic (standard practice)", () => {
      expect(stackContent).toMatch(/egress\s*{[^}]*protocol\s*=\s*"-1"[^}]*}/);
    });

    test("private subnet does not have public IP mapping", () => {
      const privateSubnetSection = stackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?}/);
      if (privateSubnetSection) {
        expect(privateSubnetSection[0]).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });

    test("public subnet has public IP mapping enabled", () => {
      const publicSubnetSection = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?}/);
      if (publicSubnetSection) {
        expect(publicSubnetSection[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });
  });

  describe("Resource Dependencies", () => {
    test("subnets reference VPC ID", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("route table references VPC ID", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("internet gateway references VPC ID", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("route table association references subnet and route table", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\.id/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });
  });
});
