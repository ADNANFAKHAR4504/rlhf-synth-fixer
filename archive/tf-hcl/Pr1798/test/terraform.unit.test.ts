// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure
// Tests validate configuration requirements without executing Terraform

import fs from "fs";
import path from "path";
// import { parse } from 'hcl2-parser';

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let stackConfig: any;
  let providerConfig: any;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    
    try {
      stackConfig = stackContent;
      providerConfig = providerContent;
    } catch (error) {
      console.error("Failed to parse HCL files:", error);
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
    });
  });

  describe("Provider Configuration", () => {
    test("AWS provider version >= 3.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.0"/);
    });

    test("random provider configured", () => {
      expect(providerContent).toMatch(/provider\s+"random"/);
    });

    test("S3 backend configured", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("AWS region set from variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables", () => {
    test("aws_region variable with default us-east-1", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("environment_suffix variable defined", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });
  });

  describe("VPC Configuration", () => {
    test("VPC with CIDR 10.0.0.0/16", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("DNS hostnames and support enabled", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Internet Gateway created", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });
  });

  describe("Subnets", () => {
    test("public subnet in us-east-1a (10.0.1.0/24)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1a"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1a"/);
    });

    test("public subnet in us-east-1b (10.0.2.0/24)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1b"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1b"/);
    });

    test("private subnet in us-east-1a (10.0.3.0/24)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1a"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.3\.0\/24"/);
    });

    test("private subnet in us-east-1b (10.0.4.0/24)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1b"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.4\.0\/24"/);
    });

    test("public subnets have map_public_ip_on_launch", () => {
      const publicSubnetRegex = /resource\s+"aws_subnet"\s+"public_[^"]+"\s*{[^}]*map_public_ip_on_launch\s*=\s*true/g;
      const matches = stackContent.match(publicSubnetRegex);
      expect(matches).toHaveLength(2);
    });
  });

  describe("NAT Gateways", () => {
    test("NAT Gateway in AZ 1a", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1a"/);
    });

    test("NAT Gateway in AZ 1b", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1b"/);
    });

    test("Elastic IPs for NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1a"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1b"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });
  });

  describe("Route Tables", () => {
    test("public route table with internet gateway route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private route tables with NAT gateway routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1a"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1b"/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1a\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1b\.id/);
    });

    test("route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1a"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1b"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1a"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1b"/);
    });
  });

  describe("Security Groups", () => {
    test("app servers security group created", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_servers"/);
    });

    test("SSH access restricted to 203.0.113.0/24", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["203\.0\.113\.0\/24"\]/);
    });

    test("HTTP and HTTPS allowed from VPC", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/16"\]/);
    });

    test("all egress traffic allowed", () => {
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*0/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe("S3 Bucket for Logs", () => {
    test("S3 bucket resource created", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(stackContent).toMatch(/bucket\s*=\s*"production-logs-bucket-/);
    });

    test("server-side encryption enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("random string for bucket suffix", () => {
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix"/);
    });
  });

  describe("IAM Configuration", () => {
    test("IAM role for EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_log_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });

    test("IAM policy for S3 access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_log_access"/);
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"s3:DeleteObject"/);
      expect(stackContent).toMatch(/"s3:ListBucket"/);
    });

    test("policy attached to role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_log_access"/);
    });

    test("instance profile created", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_log_profile"/);
    });
  });

  describe("EC2 Instances", () => {
    test("data source for Amazon Linux 2 AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("EC2 instance in AZ 1a", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app_server_1a"/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t2\.micro"/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1a\.id/);
    });

    test("EC2 instance in AZ 1b", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app_server_1b"/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t2\.micro"/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1b\.id/);
    });

    test("instances use IAM instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_log_profile\.name/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("CPU alarm for instance 1a", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_alarm_1a"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"70"/);
    });

    test("CPU alarm for instance 1b", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_alarm_1b"/);
    });

    test("alarm configuration", () => {
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
      expect(stackContent).toMatch(/statistic\s*=\s*"Average"/);
      expect(stackContent).toMatch(/period\s*=\s*"300"/);
      expect(stackContent).toMatch(/evaluation_periods\s*=\s*"2"/);
    });
  });

  describe("Resource Tagging", () => {
    test("Environment = Production tags", () => {
      const tagMatches = stackContent.match(/Environment\s*=\s*"Production"/g);
      expect(tagMatches).toBeDefined();
      expect(tagMatches!.length).toBeGreaterThan(10); // Should have many resources tagged
    });

    test("resource names include environment suffix", () => {
      const nameMatches = stackContent.match(/Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g);
      expect(nameMatches).toBeDefined();
      expect(nameMatches!.length).toBeGreaterThan(10);
    });
  });

  describe("Outputs", () => {
    test("VPC outputs", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("subnet outputs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_1a_id"/);
      expect(stackContent).toMatch(/output\s+"public_subnet_1b_id"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_1a_id"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_1b_id"/);
    });

    test("NAT Gateway outputs", () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_1a_id"/);
      expect(stackContent).toMatch(/output\s+"nat_gateway_1b_id"/);
    });

    test("S3 bucket outputs", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(stackContent).toMatch(/output\s+"s3_bucket_arn"/);
    });

    test("EC2 instance outputs", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_1a_id"/);
      expect(stackContent).toMatch(/output\s+"ec2_instance_1b_id"/);
    });

    test("IAM outputs", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_arn"/);
      expect(stackContent).toMatch(/output\s+"security_group_id"/);
    });
  });
});
