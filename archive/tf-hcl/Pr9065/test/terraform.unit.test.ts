// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure code

import fs from "fs";
import path from "path";

const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares terraform version requirement", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test("provider.tf declares AWS provider requirement", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test("provider.tf declares multiple AWS provider aliases", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"primary"/);
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"/);
      expect(providerContent).toMatch(/alias\s*=\s*"global"/);
    });

    test("provider.tf includes default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares primary_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"primary_region"\s*{/);
    });

    test("declares secondary_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
    });

    test("declares owner variable", () => {
      expect(stackContent).toMatch(/variable\s+"owner"\s*{/);
    });

    test("declares VPC CIDR variables", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
    });

    test("declares LocalStack compatibility flags", () => {
      expect(stackContent).toMatch(/variable\s+"enable_ec2"\s*{/);
      expect(stackContent).toMatch(/variable\s+"enable_rds"\s*{/);
      expect(stackContent).toMatch(/variable\s+"enable_nat_gateway"\s*{/);
      expect(stackContent).toMatch(/variable\s+"enable_cloudfront"\s*{/);
    });
  });

  describe("Locals", () => {
    test("defines project_name local", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*"iac-aws-nova-model-breaking"/);
    });

    test("defines name_prefix with environment suffix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=.*local\.project_name.*local\.env_suffix/);
    });

    test("defines common_tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
    });

    test("defines availability zones for both regions", () => {
      expect(stackContent).toMatch(/primary_azs\s*=/);
      expect(stackContent).toMatch(/secondary_azs\s*=/);
    });
  });

  describe("Security Resources", () => {
    test("creates KMS keys for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
    });

    test("creates KMS aliases", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"/);
    });

    test("creates Secrets Manager secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
    });

    test("creates random password for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });

    test("KMS keys have deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe("Network Resources - Primary Region", () => {
    test("creates primary VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
    });

    test("creates primary internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
    });

    test("creates primary NAT gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
    });

    test("creates primary subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database_primary"/);
    });

    test("creates primary route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_primary"/);
    });

    test("creates primary security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database_primary"/);
    });
  });

  describe("Network Resources - Secondary Region", () => {
    test("creates secondary VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test("creates secondary internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test("creates secondary NAT gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
    });

    test("creates secondary subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database_secondary"/);
    });

    test("creates secondary route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_secondary"/);
    });

    test("creates secondary security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database_secondary"/);
    });
  });

  describe("Compute Resources", () => {
    test("creates EC2 instances in primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_primary"/);
    });

    test("creates EC2 instances in secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_secondary"/);
    });

    test("EC2 instances are in private subnets", () => {
      expect(stackContent).toMatch(/associate_public_ip_address\s*=\s*false/);
    });

    test("EC2 instances use conditional count for LocalStack compatibility", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_primary"[\s\S]*?count\s*=\s*var\.enable_ec2/);
    });
  });

  describe("Database Resources", () => {
    test("creates RDS instance in primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"primary"/);
    });

    test("creates RDS instance in secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"secondary"/);
    });

    test("creates DB subnet groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
    });

    test("RDS instances have encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS instances have backup retention", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("RDS instances have skip_final_snapshot for testing", () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS instances have deletion_protection disabled for testing", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Global Services", () => {
    test("creates Route 53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
    });

    test("creates CloudFront distribution", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test("CloudFront uses HTTPS", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });
  });

  describe("Outputs", () => {
    test("outputs primary VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"primary_vpc_id"/);
    });

    test("outputs secondary VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"secondary_vpc_id"/);
    });

    test("outputs RDS endpoints", () => {
      expect(stackContent).toMatch(/output\s+"primary_rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"secondary_rds_endpoint"/);
    });

    test("outputs CloudFront domain", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain_name"/);
    });

    test("outputs KMS key IDs", () => {
      expect(stackContent).toMatch(/output\s+"primary_kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"secondary_kms_key_id"/);
    });

    test("outputs Secret ARN", () => {
      expect(stackContent).toMatch(/output\s+"secret_arn"/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded passwords in code", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^${\s]+"/);
    });

    test("uses random password generation", () => {
      expect(stackContent).toMatch(/random_password\.db_password\.result/);
    });

    test("security groups use least privilege", () => {
      const dbSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"database_primary"[\s\S]*?ingress\s*{[\s\S]*?from_port\s*=\s*3306/);
      expect(dbSgMatch).toBeTruthy();
    });

    test("uses provider aliases for multi-region", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe("Resource Naming", () => {
    test("resources use name_prefix local", () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
    });

    test("resources include environment in names", () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}-\$\{var\.environment\}/);
    });

    test("resources are tagged properly", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe("High Availability", () => {
    test("uses multiple availability zones", () => {
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates redundant NAT gateways", () => {
      const natMatches = stackContent.match(/resource\s+"aws_nat_gateway"/g);
      expect(natMatches?.length).toBeGreaterThanOrEqual(2);
    });

    test("deploys to multiple regions", () => {
      expect(stackContent).toMatch(/us-east-1/);
      expect(stackContent).toMatch(/us-west-2/);
    });
  });
});