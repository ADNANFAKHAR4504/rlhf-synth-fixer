// Comprehensive unit tests for Terraform multi-region security baseline
import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARS_PATH = path.resolve(__dirname, "../lib/vars.tf");
const LOCALS_PATH = path.resolve(__dirname, "../lib/locals.tf");
const TFVARS_PATH = path.resolve(__dirname, "../lib/terraform.tfvars");

describe("Terraform Multi-Region Security Baseline", () => {
  let stackContent: string;
  let providerContent: string;
  let varsContent: string;
  let localsContent: string;
  let tfvarsContent: string | null;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    varsContent = fs.readFileSync(VARS_PATH, "utf8");
    localsContent = fs.readFileSync(LOCALS_PATH, "utf8");
    tfvarsContent = fs.existsSync(TFVARS_PATH)
      ? fs.readFileSync(TFVARS_PATH, "utf8")
      : null;
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

  describe("Required Variables (vars.tf)", () => {
    test("vars.tf exists", () => {
      expect(fs.existsSync(VARS_PATH)).toBe(true);
    });
    test("declares org_prefix with validation", () => {
      expect(varsContent).toMatch(/variable\s+"org_prefix"\s*{/);
      expect(varsContent).toMatch(/length\(var\.org_prefix\)\s*<=\s*10/);
    });
    test("declares environment with validation", () => {
      expect(varsContent).toMatch(/variable\s+"environment"\s*{/);
      expect(varsContent).toMatch(/contains\(\["prod",\s*"staging",\s*"dev"\]/);
    });
    test("declares environment_suffix with validation", () => {
      expect(varsContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(varsContent).toMatch(/can\(regex\("\^\[a-z0-9\]\+\$"/);
    });
    test("declares vpc_cidr_primary variable", () => {
      expect(varsContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
    });
    test("declares vpc_cidr_secondary variable", () => {
      expect(varsContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
    });
    test("declares allowed_ingress_cidrs as list(string)", () => {
      expect(varsContent).toMatch(/variable\s+"allowed_ingress_cidrs"\s*{/);
      expect(varsContent).toMatch(/list\(string\)/);
    });
    test("declares allowed_ports as list(number)", () => {
      expect(varsContent).toMatch(/variable\s+"allowed_ports"\s*{/);
      expect(varsContent).toMatch(/list\(number\)/);
    });
    test("declares flow_logs_retention_days variable", () => {
      expect(varsContent).toMatch(/variable\s+"flow_logs_retention_days"\s*{/);
    });
  });

  describe("Defaults (terraform.tfvars)", () => {
    test("has sensible defaults for non-interactive plan/apply if terraform.tfvars exists", () => {
      if (!tfvarsContent) return; // skip when no tfvars
      expect(tfvarsContent).toMatch(/allowed_ports\s*=\s*\[\s*22,\s*443\s*\]/);
      expect(tfvarsContent).toMatch(/flow_logs_retention_days\s*=\s*90/);
    });
  });

  describe("Local Values (locals.tf)", () => {
    test("locals.tf exists", () => {
      expect(fs.existsSync(LOCALS_PATH)).toBe(true);
    });
    test("defines common_tags with required fields", () => {
      expect(localsContent).toMatch(/common_tags\s*=\s*merge\(/);
      expect(localsContent).toMatch(/Project\s*=\s*"IaC - AWS Nova Model Breaking"/);
      expect(localsContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(localsContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
    test("defines name_prefix with environment_suffix", () => {
      expect(localsContent).toMatch(/name_prefix\s*=\s*"\$\{var\.org_prefix\}-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Modules wiring in tap_stack.tf", () => {
    test("tap_stack.tf only contains modules and outputs (no direct resources)", () => {
      expect(stackContent).not.toMatch(/\bresource\s+"/);
    });
    test("declares encryption, iam, networking, logging, s3 modules", () => {
      ["encryption", "iam", "networking", "logging", "s3"].forEach(m => {
        expect(stackContent).toMatch(new RegExp(`module\\s+"${m}"\\s*{`));
      });
    });
    test("modules map aliased provider for eu_west_1", () => {
      const moduleProviderMaps = stackContent.match(/providers\s*=\s*{[\s\S]*?}/g) || [];
      expect(moduleProviderMaps.length).toBeGreaterThanOrEqual(4);
      expect(stackContent).toMatch(/aws\.eu_west_1\s*=\s*aws\.eu_west_1/);
    });
    test("networking module receives expected inputs", () => {
      expect(stackContent).toMatch(/module\s+"networking"[\s\S]*name_prefix\s*=\s*local\.name_prefix/);
      expect(stackContent).toMatch(/allowed_ingress_cidrs\s*=\s*var\.allowed_ingress_cidrs/);
      expect(stackContent).toMatch(/allowed_ports\s*=\s*var\.allowed_ports/);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });
    test("logging module is wired to networking and iam outputs", () => {
      expect(stackContent).toMatch(/vpc_id_primary\s*=\s*module\.networking\.vpc_ids\.primary/);
      expect(stackContent).toMatch(/vpc_id_secondary\s*=\s*module\.networking\.vpc_ids\.secondary/);
      expect(stackContent).toMatch(/flow_logs_role_primary_arn\s*=\s*module\.iam\.flow_logs_role_primary_arn/);
      expect(stackContent).toMatch(/flow_logs_role_secondary_arn\s*=\s*module\.iam\.flow_logs_role_secondary_arn/);
    });
  });

  describe("Security Controls (module presence)", () => {
    test("encryption module present to enable EBS encryption", () => {
      expect(stackContent).toMatch(/module\s+"encryption"\s*{/);
    });
    test("iam module present for flow logs roles", () => {
      expect(stackContent).toMatch(/module\s+"iam"\s*{/);
    });
  });

  describe("VPC and Networking (module)", () => {
    test("networking module present and aliased provider used", () => {
      expect(stackContent).toMatch(/module\s+"networking"\s*{/);
      expect(stackContent).toMatch(/providers\s*=\s*{[\s\S]*aws\.eu_west_1\s*=\s*aws\.eu_west_1[\s\S]*}/);
    });
  });

  describe("VPC Flow Logs (module)", () => {
    test("logging module present and wired with providers", () => {
      expect(stackContent).toMatch(/module\s+"logging"\s*{/);
      expect(stackContent).toMatch(/providers\s*=\s*{[\s\S]*aws\.eu_west_1\s*=\s*aws\.eu_west_1[\s\S]*}/);
    });
  });

  describe("Security Groups (module)", () => {
    test("networking module accepts allowed_ports", () => {
      expect(stackContent).toMatch(/module\s+"networking"[\s\S]*allowed_ports\s*=\s*var\.allowed_ports/);
    });
  });

  describe("S3 Security (module)", () => {
    test("s3 module present", () => {
      expect(stackContent).toMatch(/module\s+"s3"\s*{/);
    });
  });

  // Random string resources are encapsulated within modules; tap_stack.tf should not declare them directly.

  describe("Outputs (from modules)", () => {
    test("provides VPC outputs for both regions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_ids"/);
      expect(stackContent).toMatch(/value\s*=\s*module\.networking\.vpc_ids/);
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
    test("modules pass name_prefix and tags using locals", () => {
      expect(stackContent).toMatch(/module\s+"networking"[\s\S]*name_prefix\s*=\s*local\.name_prefix/);
      expect(stackContent).toMatch(/module\s+"logging"[\s\S]*tags\s*=\s*local\.common_tags/);
      expect(stackContent).toMatch(/module\s+"s3"[\s\S]*tags\s*=\s*local\.common_tags/);
    });
    test("no hardcoded account IDs or sensitive data", () => {
      expect(stackContent).not.toMatch(/[0-9]{12}/);
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(stackContent).not.toMatch(/password|secret/i);
    });
  });
});
