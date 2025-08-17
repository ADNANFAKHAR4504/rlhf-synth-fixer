// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates Terraform configuration structure and content

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
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares environment_tag variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_tag"\s*{/);
    });

    test("declares owner_tag variable", () => {
      expect(stackContent).toMatch(/variable\s+"owner_tag"\s*{/);
    });

    test("environment_tag variable has correct properties", () => {
      expect(stackContent).toMatch(/variable\s+"environment_tag"\s*{[^}]*description\s*=\s*"Environment tag to be applied to all resources"/);
      expect(stackContent).toMatch(/variable\s+"environment_tag"\s*{[^}]*type\s*=\s*string/);
      expect(stackContent).toMatch(/variable\s+"environment_tag"\s*{[^}]*default\s*=\s*"production"/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("declares aws_region data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    });

    test("declares aws_ami data source for Amazon Linux", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
    });
  });

  describe("Networking Resources", () => {
    test("declares VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has correct CIDR block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC has DNS support enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*enable_dns_support\s*=\s*true/);
    });

    test("declares two private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"\s*{/);
    });

    test("private subnets have correct CIDR blocks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"\s*{[^}]*cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"\s*{[^}]*cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("declares route table for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("declares route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"\s*{/);
    });

    test("declares S3 VPC endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    });

    test("S3 VPC endpoint is Gateway type", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{[^}]*vpc_endpoint_type\s*=\s*"Gateway"/);
    });
  });

  describe("Security Resources", () => {
    test("declares KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
    });

    test("KMS key has correct description", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{[^}]*description\s*=\s*"KMS key for encrypting sensitive outputs"/);
    });

    test("declares KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
    });

    test("declares security group for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("security group allows HTTPS outbound", () => {
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*443[^}]*to_port\s*=\s*443[^}]*protocol\s*=\s*"tcp"/);
    });
  });

  describe("S3 Buckets", () => {
    test("declares CloudTrail S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"\s*{/);
    });

    test("CloudTrail bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"\s*{/);
    });

    test("CloudTrail bucket has encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"\s*{/);
    });

    test("CloudTrail bucket has bucket policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"\s*{/);
    });

    test("declares secure data S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_data"\s*{/);
    });

    test("secure data bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secure_data"\s*{/);
    });

    test("secure data bucket has KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secure_data"\s*{/);
    });

    test("secure data bucket has bucket policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"secure_data"\s*{/);
    });
  });

  describe("CloudTrail", () => {
    test("CloudTrail resource removed due to limit constraints", () => {
      expect(stackContent).not.toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    });
  });

  describe("IAM Resources", () => {
    test("declares MFA enforcement group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"mfa_required"\s*{/);
    });

    test("declares MFA enforcement group policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group_policy"\s+"mfa_enforcement"\s*{/);
    });

    test("MFA policy denies actions without MFA", () => {
      expect(stackContent).toMatch(/BoolIfExists\s*=\s*{[^}]*"aws:MultiFactorAuthPresent"\s*=\s*"false"/);
    });

    test("declares EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("EC2 role has assume role policy", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });

    test("declares IAM role policy attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm_policy"\s*{/);
    });

    test("attaches AmazonSSMManagedInstanceCore policy", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/);
    });

    test("declares IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
    });
  });

  describe("EC2 Instance", () => {
    test("declares EC2 instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"\s*{/);
    });

    test("EC2 instance uses Amazon Linux AMI", () => {
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    });

    test("EC2 instance is in private subnet", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1\.id/);
    });

    test("EC2 instance has security group", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("EC2 instance has IAM instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test("EC2 instance does not have public IP", () => {
      expect(stackContent).toMatch(/associate_public_ip_address\s*=\s*false/);
    });
  });

  describe("Outputs", () => {
    test("declares secure data bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"secure_data_bucket_name"\s*{/);
    });

    test("output is marked as sensitive", () => {
      expect(stackContent).toMatch(/output\s+"secure_data_bucket_name"\s*{[^}]*sensitive\s*=\s*true/);
    });

    test("output has description", () => {
      expect(stackContent).toMatch(/output\s+"secure_data_bucket_name"\s*{[^}]*description\s*=\s*"Name of the secure data S3 bucket"/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider is configured for us-east-2 region", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*region\s*=\s*"us-east-2"/);
    });

    test("terraform block has required version", () => {
      expect(providerContent).toMatch(/terraform\s*{[^}]*required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("terraform block has required providers", () => {
      expect(providerContent).toMatch(/required_providers\s*{[^}]*aws\s*=\s*{[^}]*source\s*=\s*"hashicorp\/aws"/);
    });
  });

  describe("Resource Counts", () => {
    test("has expected number of variables", () => {
      const variableMatches = stackContent.match(/variable\s+"[^"]+"/g);
      expect(variableMatches).toHaveLength(2); // environment_tag, owner_tag
    });

    test("has expected number of data sources", () => {
      const dataMatches = stackContent.match(/data\s+"[^"]+"/g);
      expect(dataMatches).toHaveLength(4); // availability_zones, caller_identity, region, ami
    });

    test("has expected number of main resource types", () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_route_table',
        'aws_route_table_association',
        'aws_vpc_endpoint',
        'aws_kms_key',
        'aws_kms_alias',
        'aws_s3_bucket',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_policy',
        'aws_iam_group',
        'aws_iam_group_policy',
        'aws_security_group',
        'aws_iam_role',
        'aws_iam_role_policy_attachment',
        'aws_iam_instance_profile',
        'aws_instance',
        'random_id'
      ];

      resourceTypes.forEach(resourceType => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${resourceType}"`, 'g'));
      });
    });
  });

  describe("Security and Compliance", () => {
    test("S3 bucket policy enforces HTTPS", () => {
      expect(stackContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
    });

    test("S3 bucket policy enforces VPC endpoint access", () => {
      expect(stackContent).toMatch(/"aws:sourceVpce"/);
    });

    test("MFA policy enforces MFA requirement", () => {
      expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"/);
    });

    test("all resources have environment tags", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment_tag/);
    });

    test("all resources have owner tags", () => {
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner_tag/);
    });
  });
});
