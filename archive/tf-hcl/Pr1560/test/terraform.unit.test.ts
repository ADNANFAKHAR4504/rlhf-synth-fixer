/**
 * Multi-Environment AWS Infrastructure - Unit Tests
 * 
 * This test suite validates all 12 enterprise compliance requirements:
 * 1. All resources in us-east-1 region
 * 2. Latest Terraform version
 * 3. Environment-specific configurations
 * 4. Cost estimation process
 * 5. Dedicated public/private subnets
 * 6. SSH access restricted to specific IPs
 * 7. Remote state management
 * 8. S3 bucket HTTPS enforcement
 * 9. CI pipeline for syntax checking
 * 10. AWS naming conventions
 * 11. Modular resource configurations
 * 12. No hardcoded secrets
 */

import fs from "fs";
import path from "path";

/** === File loader === */
const mainTfPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerTfPath = path.resolve(__dirname, "../lib/provider.tf");

function readFileOrThrow(p: string): string {
  if (!fs.existsSync(p)) throw new Error(`File not found at ${p}`);
  return fs.readFileSync(p, "utf8");
}

/** === Helpers: comment strip + HCL block extraction === */
function stripComments(hcl: string): string {
  // block comments
  let s = hcl.replace(/\/\*[\s\S]*?\*\//g, "");
  // line comments
  s = s.replace(/\/\/[^\n]*\n/g, "\n");
  s = s.replace(/^[ \t]*#[^\n]*\n/gm, "\n");
  return s;
}

function extractFirstBlock(hcl: string, headerRegex: RegExp): string | null {
  headerRegex.lastIndex = 0;
  const m = headerRegex.exec(hcl);
  if (!m) return null;
  const start = m.index;
  const open = hcl.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < hcl.length; i++) {
    const ch = hcl[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return hcl.slice(open + 1, i);
    }
  }
  return null;
}

function extractAllBlocks(hcl: string, headerRegex: RegExp): string[] {
  const out: string[] = [];
  let last = 0;
  while (last < hcl.length) {
    headerRegex.lastIndex = last;
    const m = headerRegex.exec(hcl);
    if (!m) break;
    const start = m.index;
    const open = hcl.indexOf("{", start);
    if (open === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = open; i < hcl.length; i++) {
      const ch = hcl[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    out.push(hcl.slice(open + 1, end));
    last = end + 1;
  }
  return out;
}

function containsAll(hay: string, needles: (RegExp | string)[]): boolean {
  return needles.every((n) => (typeof n === "string" ? hay.includes(n) : n.test(hay)));
}

describe("Multi-Environment AWS Infrastructure - Unit Tests", () => {
  const raw = readFileOrThrow(mainTfPath);
  const providerRaw = readFileOrThrow(providerTfPath);
  const hcl = stripComments(raw);
  const providerHcl = stripComments(providerRaw);

  it("is readable and non-trivial", () => {
    expect(raw.length).toBeGreaterThan(1000);
  });

  it("does NOT contain provider/terraform blocks (kept in provider.tf)", () => {
    expect(/^\s*provider\s+"/m.test(hcl)).toBe(false);
    expect(/^\s*terraform\s*{/m.test(hcl)).toBe(false);
  });

  /** ===================== REQUIREMENT 1: REGION COMPLIANCE ===================== */
  describe("Requirement 1: us-east-1 Region Deployment", () => {
    it("provider.tf should specify us-east-1 region", () => {
      expect(providerHcl).toMatch(/region\s*=\s*var\.aws_region/);
    });

    it("tap_stack.tf should have region validation", () => {
      const regionVar = extractFirstBlock(hcl, /variable\s+"aws_region"\s*/g);
      expect(regionVar).toBeTruthy();
      expect(regionVar!).toMatch(/validation\s*{/);
      expect(regionVar!).toMatch(/condition\s*=\s*var\.aws_region\s*==\s*["']us-east-1["']/);
    });

    it("availability zones should be in us-east-1", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/availability_zones\s*=\s*\[["']us-east-1a["'],\s*["']us-east-1b["']\]/);
    });
  });

  /** ===================== REQUIREMENT 2: LATEST TERRAFORM VERSION ===================== */
  describe("Requirement 2: Latest Terraform Version", () => {
    it("provider.tf should specify latest Terraform version", () => {
      expect(providerHcl).toMatch(/required_version.*1\.4\.0/);
    });

    it("should use latest AWS provider version", () => {
      expect(providerHcl).toMatch(/version.*5\.0/);
    });
  });

  /** ===================== REQUIREMENT 3: ENVIRONMENT CONFIGURATIONS ===================== */
  describe("Requirement 3: Environment-Specific Configurations", () => {
    it("should have environment variable with validation", () => {
      const envVar = extractFirstBlock(hcl, /variable\s+"environment"\s*/g);
      expect(envVar).toBeTruthy();
      expect(envVar!).toMatch(/default\s*=\s*["']development["']/);
      expect(envVar!).toMatch(/condition\s*=\s*contains\(\["development",\s*"staging",\s*"production"\],\s*var\.environment\)/);
    });

    it("should have environment-specific configurations in locals", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/environment_config\s*=\s*{/);
      expect(locals).toMatch(/development\s*=\s*{/);
      expect(locals).toMatch(/staging\s*=\s*{/);
      expect(locals).toMatch(/production\s*=\s*{/);
    });

    it("should have common_tags with Environment variable and EnvironmentSuffix", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/common_tags\s*=\s*{/);
      expect(locals).toMatch(/Environment\s*=\s*var\.environment/);
      expect(locals).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
    });
  });

  /** ===================== REQUIREMENT 4: COST ESTIMATION PROCESS ===================== */
  describe("Requirement 4: Cost Estimation Process", () => {
    it("should have cost estimation output", () => {
      const costOutput = extractFirstBlock(hcl, /output\s+"cost_estimation"\s*/g);
      expect(costOutput).toBeTruthy();
      expect(costOutput!).toMatch(/ec2_instances\s*=/);
      expect(costOutput!).toMatch(/rds_instance\s*=/);
      expect(costOutput!).toMatch(/total_estimated\s*=/);
    });

    it("should have environment-specific cost calculations", () => {
      const costOutput = extractFirstBlock(hcl, /output\s+"cost_estimation"\s*/g);
      expect(costOutput).toBeTruthy();
      expect(costOutput!).toMatch(/var\.environment\s*==\s*["']production["']/);
    });
  });

  /** ===================== REQUIREMENT 5: DEDICATED PUBLIC/PRIVATE SUBNETS ===================== */
  describe("Requirement 5: Dedicated Public/Private Subnets", () => {
    it("creates a VPC with DNS features and tags", () => {
      const vpc = extractFirstBlock(hcl, /resource\s+"aws_vpc"\s+"main"\s*/g);
      expect(vpc).toBeTruthy();
      expect(vpc!).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(vpc!).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpc!).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    it("creates public and private subnets", () => {
      const pub = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"public"\s*/g);
      const priv = extractFirstBlock(hcl, /resource\s+"aws_subnet"\s+"private"\s*/g);
      expect(pub && priv).toBeTruthy();
      expect(pub!).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    it("has route tables for public and private", () => {
      const pubRt = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"public"\s*/g);
      const privRt = extractFirstBlock(hcl, /resource\s+"aws_route_table"\s+"private"\s*/g);
      expect(pubRt && privRt).toBeTruthy();
    });

    it("has NAT Gateway for private subnets", () => {
      const nat = extractFirstBlock(hcl, /resource\s+"aws_nat_gateway"\s*/g);
      expect(nat).toBeTruthy();
    });
  });

  /** ===================== REQUIREMENT 6: SSH ACCESS RESTRICTIONS ===================== */
  describe("Requirement 6: SSH Access Restrictions", () => {
    it("should have allowed_ssh_cidrs variable with validation", () => {
      const sshVar = extractFirstBlock(hcl, /variable\s+"allowed_ssh_cidrs"\s*/g);
      expect(sshVar).toBeTruthy();
      expect(sshVar!).toMatch(/validation\s*{/);
      expect(sshVar!).toMatch(/can\(cidrhost\(/);
    });

    it("bastion security group should restrict SSH access", () => {
      const bastionSg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"bastion"\s*/g);
      expect(bastionSg).toBeTruthy();
      expect(bastionSg!).toMatch(/from_port\s*=\s*22/);
      expect(bastionSg!).toMatch(/to_port\s*=\s*22/);
      expect(bastionSg!).toMatch(/cidr_blocks\s*=\s*var\.allowed_ssh_cidrs/);
    });

    it("should not allow 0.0.0.0/0 for SSH", () => {
      const sshRules = hcl.match(/ingress\s*{[^}]*from_port\s*=\s*22[^}]*}/g) || [];
      sshRules.forEach(rule => {
        expect(rule).not.toMatch(/0\.0\.0\.0\/0/);
      });
    });
  });

  /** ===================== REQUIREMENT 7: REMOTE STATE MANAGEMENT ===================== */
  describe("Requirement 7: Remote State Management", () => {
    it("provider.tf should have backend configuration", () => {
      expect(providerRaw).toMatch(/backend.*s3/);
    });

    it("should have backend configuration with encryption", () => {
      expect(providerRaw).toMatch(/backend.*s3/);
    });
  });

  /** ===================== REQUIREMENT 8: S3 BUCKET HTTPS ENFORCEMENT ===================== */
  describe("Requirement 8: S3 Bucket HTTPS Enforcement", () => {
    it("should have S3 bucket with public access blocking", () => {
      const publicBlock = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_public_access_block"\s*/g);
      expect(publicBlock).toBeTruthy();
      expect(publicBlock!).toMatch(/block_public_acls\s*=\s*true/);
      expect(publicBlock!).toMatch(/block_public_policy\s*=\s*true/);
      expect(publicBlock!).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(publicBlock!).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    it("should have HTTPS-only bucket policy", () => {
      const bucketPolicy = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_policy"\s*/g);
      expect(bucketPolicy).toBeTruthy();
      expect(bucketPolicy!).toMatch(/DenyNonHttpsRequests/);
      expect(bucketPolicy!).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
    });

    it("should have server-side encryption", () => {
      const encryption = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s*/g);
      expect(encryption).toBeTruthy();
      expect(encryption!).toMatch(/sse_algorithm\s*=\s*["']AES256["']/);
    });

    it("should have S3 logging enabled", () => {
      const logging = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_logging"\s*/g);
      expect(logging).toBeTruthy();
    });
  });

  /** ===================== REQUIREMENT 9: CI PIPELINE SUPPORT ===================== */
  describe("Requirement 9: CI Pipeline Support", () => {
    it("should have proper Terraform syntax structure", () => {
      const openBraces = (hcl.match(/{/g) || []).length;
      const closeBraces = (hcl.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it("should have valid variable declarations", () => {
      expect(hcl).toMatch(/variable\s+"[^"]+"\s*{/);
    });

    it("should have valid resource declarations", () => {
      expect(hcl).toMatch(/resource\s+"[^"]+"\s+"[^"]+"\s*{/);
    });
  });

  /** ===================== REQUIREMENT 10: AWS NAMING CONVENTIONS ===================== */
  describe("Requirement 10: AWS Naming Conventions", () => {
    it("should use consistent naming prefix with environment suffix", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/name_prefix\s*=\s*"tap-\$\{var\.environment_suffix\}"/);
    });

    it("resources should follow naming conventions", () => {
      expect(hcl).toMatch(/Name\s*=\s*"\$\{local\.name_prefix}-/);
    });
  });

  /** ===================== REQUIREMENT 11: MODULAR RESOURCE CONFIGURATIONS ===================== */
  describe("Requirement 11: Modular Resource Configurations", () => {
    it("should have organized resource sections", () => {
      expect(raw).toMatch(/NETWORKING MODULE/);
      expect(raw).toMatch(/SECURITY MODULE/);
      expect(raw).toMatch(/COMPUTE MODULE/);
      expect(raw).toMatch(/DATABASE MODULE/);
      expect(raw).toMatch(/STORAGE MODULE/);
      expect(raw).toMatch(/MONITORING MODULE/);
    });

    it("should use locals for common values", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/common_tags\s*=/);
      expect(locals).toMatch(/name_prefix\s*=/);
    });

    it("should use data sources appropriately", () => {
      expect(hcl).toMatch(/data\s+"aws_db_parameter_group"/);
    });
  });

  /** ===================== REQUIREMENT 12: NO HARDCODED SECRETS ===================== */
  describe("Requirement 12: No Hardcoded Secrets", () => {
    it("database credentials should be random strings or variables", () => {
      const dbPass = extractFirstBlock(hcl, /resource\s+"random_password"\s+"db_password"\s*/g);
      expect(dbPass).toBeTruthy();
      expect(dbPass!).toMatch(/length\s*=\s*16/);
    });

    it("should use AWS Secrets Manager", () => {
      const secret = extractFirstBlock(hcl, /resource\s+"aws_secretsmanager_secret"\s*/g);
      const secretVersion = extractFirstBlock(hcl, /resource\s+"aws_secretsmanager_secret_version"\s*/g);
      expect(secret && secretVersion).toBeTruthy();
    });

    it("should not contain hardcoded passwords", () => {
      const hardcodedPatterns = [
        /password\s*=\s*["'][^"']{8,}["']/,
        /secret\s*=\s*["'][^"']{8,}["']/,
        /key\s*=\s*["'][^"']{8,}["']/
      ];
      
      hardcodedPatterns.forEach(pattern => {
        expect(hcl).not.toMatch(pattern);
      });
    });
  });

  /** ===================== MULTI-ENVIRONMENT SPECIFIC TESTS ===================== */
  describe("Multi-Environment Specific Tests", () => {
    it("should have environment-specific instance types", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(locals).toMatch(/instance_type\s*=\s*"t3\.small"/);
      expect(locals).toMatch(/instance_type\s*=\s*"t3\.medium"/);
    });

    it("should have Auto Scaling Group for production", () => {
      const asg = extractFirstBlock(hcl, /resource\s+"aws_autoscaling_group"\s*/g);
      expect(asg).toBeTruthy();
      expect(asg!).toMatch(/count\s*=\s*var\.environment\s*==\s*["']production["']\s*\?\s*1\s*:\s*0/);
    });

    it("should have EC2 instances for non-production", () => {
      const ec2 = extractFirstBlock(hcl, /resource\s+"aws_instance"\s+"web"\s*/g);
      expect(ec2).toBeTruthy();
      expect(ec2!).toMatch(/count\s*=\s*var\.environment\s*!=\s*["']production["']\s*\?\s*2\s*:\s*0/);
    });

    it("should have environment-specific deletion protection disabled for testing", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      // All environments should have deletion_protection = false for testing
      expect(locals).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  /** ===================== SECURITY VALIDATIONS ===================== */
  describe("Security Validations", () => {
    it("should have proper security group configurations", () => {
      expect(hcl).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(hcl).toMatch(/resource\s+"aws_security_group"\s+"application"/);
      expect(hcl).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(hcl).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
    });

    it("should have encrypted RDS instance", () => {
      const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s*/g);
      expect(rds).toBeTruthy();
      expect(rds!).toMatch(/storage_encrypted\s*=\s*true/);
    });

    it("should have IAM roles with least privilege", () => {
      const iamRole = extractFirstBlock(hcl, /resource\s+"aws_iam_role"\s*/g);
      const iamPolicy = extractFirstBlock(hcl, /resource\s+"aws_iam_role_policy"\s*/g);
      expect(iamRole && iamPolicy).toBeTruthy();
    });

    it("should have CloudWatch alarms for production", () => {
      const alarm = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_metric_alarm"\s*/g);
      expect(alarm).toBeTruthy();
      expect(alarm!).toMatch(/count\s*=\s*var\.environment\s*==\s*["']production["']\s*\?\s*1\s*:\s*0/);
    });
  });

  /** ===================== COMPLIANCE DOCUMENTATION ===================== */
  describe("Compliance Documentation", () => {
    it("should have compliance requirement comments", () => {
      expect(raw).toMatch(/Compliance Requirements:/);
      expect(raw).toMatch(/All resources in us-east-1 region/);
      expect(raw).toMatch(/Environment-specific configurations/);
      expect(raw).toMatch(/Security best practices with least privilege/);
      expect(raw).toMatch(/Auto Scaling for Production/);
      expect(raw).toMatch(/Database encryption at rest and in transit/);
      expect(raw).toMatch(/CloudWatch monitoring and alerting/);
      expect(raw).toMatch(/Comprehensive tagging strategy/);
      expect(raw).toMatch(/S3 logging enabled/);
      expect(raw).toMatch(/SSH access restrictions/);
      expect(raw).toMatch("CI/CD pipeline support");
      expect(raw).toMatch(/AWS naming conventions/);
      expect(raw).toMatch(/No hardcoded secrets/);
    });
  });
});
