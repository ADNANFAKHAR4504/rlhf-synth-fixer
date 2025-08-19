// Comprehensive unit tests for Terraform multi-region security baseline
import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Multi-Region Security Baseline", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("tap_stack.tf does NOT declare providers (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Required Variables", () => {
    test("declares org_prefix variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"org_prefix"\s*{/);
      expect(stackContent).toMatch(/length\(var\.org_prefix\)\s*<=\s*10/);
    });

    test("declares environment variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/contains\(\["prod",\s*"staging",\s*"dev"\]/);
    });

    test("declares environment_suffix variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/can\(regex\("\^\[a-z0-9\]\+\$"/);
    });

    test("declares vpc_cidr_primary variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares vpc_cidr_secondary variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test("declares allowed_ingress_cidrs variable", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ingress_cidrs"\s*{/);
      expect(stackContent).toMatch(/list\(string\)/);
    });

    test("declares allowed_ports variable", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ports"\s*{/);
      expect(stackContent).toMatch(/list\(number\)/);
      expect(stackContent).toMatch(/\[22,\s*443\]/);
    });

    test("declares flow_logs_retention_days variable", () => {
      expect(stackContent).toMatch(/variable\s+"flow_logs_retention_days"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*90/);
    });
  });

  describe("Local Values", () => {
    test("defines common_tags with required fields", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*merge\(/);
      expect(stackContent).toMatch(/Project\s*=\s*"IaC - AWS Nova Model Breaking"/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines name_prefix with environment_suffix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.org_prefix\}-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Multi-Region Setup", () => {
    test("has data sources for both regions", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.eu_west_1/);
    });
  });

  describe("Security Controls", () => {
    test("enables EBS encryption in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ebs_encryption_by_default"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_ebs_encryption_by_default"\s+"secondary"/);
      const ebsMatches = stackContent.match(/enabled\s*=\s*true/g);
      expect(ebsMatches?.length).toBeGreaterThanOrEqual(2);
    });

    test("creates IAM policy documents with specific ARNs (no wildcards)", () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"flow_logs_assume_role"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"flow_logs_policy_primary"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"flow_logs_policy_secondary"/);
      
      // Ensure no wildcards in actions except for justified S3 deny policies
      const wildcardMatches = stackContent.match(/"actions"\s*=\s*\[\s*"\*"/g);
      expect(wildcardMatches).toBeFalsy();
      
      // Check for specific resource ARNs
      expect(stackContent).toMatch(/arn:aws:logs:us-east-1:\*:log-group/);
      expect(stackContent).toMatch(/arn:aws:logs:eu-west-1:\*:log-group/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPCs in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.eu_west_1/);
    });

    test("creates internet gateways for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test("creates public and private subnets for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
    });

    test("creates route tables and routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
    });
  });

  describe("VPC Flow Logs", () => {
    test("creates CloudWatch log groups for flow logs in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs_secondary"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.flow_logs_retention_days/);
    });

    test("creates IAM roles for flow logs in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs_role_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs_role_secondary"/);
    });

    test("creates flow log resources for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs_secondary"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("Security Groups", () => {
    test("creates restrictive security groups for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"bastion_app_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"bastion_app_secondary"/);
    });

    test("creates security group rules with allowed_ports", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group_rule"/);
      expect(stackContent).toMatch(/for_each\s*=\s*{/);
      expect(stackContent).toMatch(/setproduct\(var\.allowed_ports/);
    });

    test("has egress rules for necessary traffic", () => {
      expect(stackContent).toMatch(/type\s*=\s*"egress"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*53/);
    });

    test("does not allow 0.0.0.0/0 ingress", () => {
      const ingressRules = stackContent.match(/type\s*=\s*"ingress"[\s\S]*?cidr_blocks\s*=\s*\[(.*?)\]/g);
      if (ingressRules) {
        ingressRules.forEach(rule => {
          expect(rule).not.toMatch(/"0\.0\.0\.0\/0"/);
        });
      }
    });
  });

  describe("S3 Security", () => {
    test("creates S3 audit buckets in both regions with unique names", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs_secondary"/);
      expect(stackContent).toMatch(/random_string\.bucket_suffix_primary\.result/);
      expect(stackContent).toMatch(/random_string\.bucket_suffix_secondary\.result/);
    });

    test("creates S3 bucket encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/algorithm\s*=\s*"AES256"/);
    });

    test("blocks public access on S3 buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enforces TLS-only access with bucket policies", () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_tls_only_primary"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_tls_only_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
      expect(stackContent).toMatch(/aws:SecureTransport/);
      expect(stackContent).toMatch(/effect\s*=\s*"Deny"/);
    });
  });

  describe("Random Resources", () => {
    test("creates random strings for S3 bucket uniqueness", () => {
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix_primary"/);
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix_secondary"/);
      expect(stackContent).toMatch(/length\s*=\s*8/);
      expect(stackContent).toMatch(/special\s*=\s*false/);
      expect(stackContent).toMatch(/upper\s*=\s*false/);
    });
  });

  describe("Outputs", () => {
    test("provides VPC outputs for both regions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_ids"/);
      expect(stackContent).toMatch(/primary\s*=\s*aws_vpc\.primary\.id/);
      expect(stackContent).toMatch(/secondary\s*=\s*aws_vpc\.secondary\.id/);
    });

    test("provides subnet outputs for both regions", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("provides flow log outputs", () => {
      expect(stackContent).toMatch(/output\s+"flow_log_ids"/);
      expect(stackContent).toMatch(/output\s+"flow_log_group_arns"/);
    });

    test("provides security group outputs", () => {
      expect(stackContent).toMatch(/output\s+"security_group_ids"/);
    });

    test("provides S3 bucket outputs", () => {
      expect(stackContent).toMatch(/output\s+"s3_audit_bucket_names"/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf has correct terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("provider.tf declares AWS and Random providers", () => {
      expect(providerContent).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/random\s*=\s*{\s*source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.0"/);
    });

    test("provider.tf configures AWS providers with correct regions", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*region\s*=\s*"us-east-1"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"eu_west_1"\s*region\s*=\s*"eu-west-1"/);
    });

    test("provider.tf does not have S3 backend configuration", () => {
      expect(providerContent).not.toMatch(/backend\s+"s3"/);
    });
  });

  describe("Best Practices and Compliance", () => {
    test("all resources have consistent naming with environment_suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}/);
      // Count resources that should have naming
      const namedResources = stackContent.match(/name\s*=\s*"\$\{local\.name_prefix\}/g);
      expect(namedResources?.length).toBeGreaterThan(5);
    });

    test("resources are properly tagged", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      const taggedResources = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(taggedResources?.length).toBeGreaterThan(10);
    });

    test("no hardcoded account IDs or sensitive data", () => {
      expect(stackContent).not.toMatch(/[0-9]{12}/); // 12-digit account IDs
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access keys
      expect(stackContent).not.toMatch(/password|secret/i);
    });

    test("IAM policies follow least privilege principle", () => {
      // Check that S3 wildcard actions are only in deny policies (justified)
      const s3WildcardActions = stackContent.match(/"actions"\s*=\s*\[\s*"s3:\*"/g);
      if (s3WildcardActions) {
        s3WildcardActions.forEach(() => {
          // These should only appear in deny statements
          expect(stackContent).toMatch(/effect\s*=\s*"Deny"/);
        });
      }
    });
  });
});
