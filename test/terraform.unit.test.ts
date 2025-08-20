// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure code files
// No Terraform or CDKTF commands are executed - pure static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Code Unit Tests", () => {
  
  describe("File Structure and Existence", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      if (!exists) {
        console.error(`[unit] Expected provider at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });

    test("files have substantial content", () => {
      const stackContent = fs.readFileSync(stackPath, "utf8");
      const providerContent = fs.readFileSync(providerPath, "utf8");
      
      expect(stackContent.length).toBeGreaterThan(1000); // Substantial infrastructure
      expect(providerContent.length).toBeGreaterThan(50); // Basic provider config
    });
  });

  describe("Provider Configuration Validation", () => {
    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf correctly configures AWS provider", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("provider.tf includes required providers configuration", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable in tap_stack.tf", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
      expect(content).toMatch(/type\s*=\s*string/);
    });

    test("aws_region variable has proper description", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/description\s*=\s*"AWS region for resources"/);
    });
  });

  describe("Data Sources", () => {
    test("includes required data sources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test("AMI data source has proper filters", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/most_recent\s*=\s*true/);
      expect(content).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(content).toMatch(/name\s*=\s*"name"/);
      expect(content).toMatch(/values\s*=\s*\["amzn2-ami-hvm-.*x86_64-gp2"\]/);
    });
  });

  describe("Core Infrastructure Resources", () => {
    test("VPC resource is properly defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("public subnets are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test("private subnets are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/);
      expect(content).not.toMatch(/map_public_ip_on_launch\s*=\s*true.*private/);
    });

    test("internet gateway is defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("NAT gateways are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });
  });

  describe("Security Configuration", () => {
    test("security groups are defined with proper rules", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"private_instances"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("bastion security group allows SSH", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/from_port\s*=\s*22/);
      expect(content).toMatch(/to_port\s*=\s*22/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("KMS key is properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"tap_key"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("IAM roles follow least privilege", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
      expect(content).toMatch(/"logs:PutLogEvents"/);
    });
  });

  describe("Compute Resources", () => {
    test("EC2 instances are properly configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_instance"\s+"private"/);
      expect(content).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(content).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    });

    test("key pair is generated and stored securely", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"tls_private_key"\s+"main"/);
      expect(content).toMatch(/algorithm\s*=\s*"RSA"/);
      expect(content).toMatch(/rsa_bits\s*=\s*4096/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"private_key"/);
    });
  });

  describe("Storage and Encryption", () => {
    test("S3 bucket has proper security configuration", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });

    test("S3 bucket blocks public access", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("encryption is applied to storage resources", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.tap_key\.arn/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("CloudWatch resources are defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(content).toMatch(/resource\s+"aws_flow_log"/);
    });

    test("VPC Flow Logs are configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("CloudWatch alarms have proper thresholds", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/threshold\s*=\s*"80"/);
      expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });
  });

  describe("DNS and Service Discovery", () => {
    test("Route53 private zone is configured", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route53_zone"\s+"private"/);
      expect(content).toMatch(/name\s*=\s*"tap\.internal"/);
    });

    test("DNS records are properly defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"bastion"/);
      expect(content).toMatch(/resource\s+"aws_route53_record"\s+"private"/);
      expect(content).toMatch(/type\s*=\s*"A"/);
      expect(content).toMatch(/ttl\s*=\s*300/);
    });
  });

  describe("Outputs", () => {
    test("essential outputs are defined", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"bastion_public_ip"/);
      expect(content).toMatch(/output\s+"private_instance_ips"/);
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"kms_key_id"/);
    });

    test("outputs have proper descriptions", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(content).toMatch(/description\s*=\s*"Public IP of the bastion host"/);
      expect(content).toMatch(/description\s*=\s*"Private IPs of the private instances"/);
    });

    test("sensitive outputs are marked appropriately", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      // Check for any sensitive outputs that should be marked
      if (content.includes('output "rds_endpoint"')) {
        expect(content).toMatch(/sensitive\s*=\s*true/);
      }
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("resources use consistent naming patterns", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/random_id\.bucket_suffix\.hex/);
      expect(content).toMatch(/Name\s*=\s*"tap-/);
    });

    test("resources are properly tagged", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/tags\s*=\s*{/);
      expect(content).toMatch(/Name\s*=/);
      // Count tag occurrences to ensure comprehensive tagging
      const tagMatches = content.match(/tags\s*=\s*{/g);
      expect(tagMatches?.length).toBeGreaterThan(10); // Multiple resources tagged
    });
  });

  describe("High Availability and Redundancy", () => {
    test("resources are distributed across multiple AZs", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("NAT gateways provide redundancy", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/aws_nat_gateway.*count\s*=\s*2/s);
      expect(content).toMatch(/aws_eip.*count\s*=\s*2/s);
    });
  });

  describe("Dependencies and References", () => {
    test("resources properly reference each other", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/aws_vpc\.main\.id/);
      expect(content).toMatch(/aws_subnet\.(public|private)/);
      expect(content).toMatch(/aws_security_group\./);
      expect(content).toMatch(/aws_kms_key\.tap_key/);
    });

    test("explicit dependencies are defined where needed", () => {
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/depends_on\s*=\s*\[/);
    });
  });

});
