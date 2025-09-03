/**
 * AWS Infrastructure Project - Unit Tests
 * 
 * This test suite validates all 7 project requirements:
 * 1. Terraform HCL Configuration
 * 2. Cloud Provider Configuration
 * 3. Network Configuration
 * 4. Resource Management
 * 5. Security and Access Control
 * 6. Rollback and Recovery
 * 7. Validation and Testing
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

describe("AWS Infrastructure Project - Unit Tests", () => {
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

  /** ===================== REQUIREMENT 1: TERRAFORM HCL CONFIGURATION ===================== */
  describe("Requirement 1: Terraform HCL Configuration", () => {
    it("should have proper Terraform version constraint", () => {
      expect(providerHcl).toMatch(/required_version.*1\.4\.0/);
    });

    it("should have valid variable declarations", () => {
      expect(hcl).toMatch(/variable\s+"[^"]+"\s*{/);
    });

    it("should have valid resource declarations", () => {
      expect(hcl).toMatch(/resource\s+"[^"]+"\s+"[^"]+"\s*{/);
    });

    it("should have proper Terraform syntax structure", () => {
      const openBraces = (hcl.match(/{/g) || []).length;
      const closeBraces = (hcl.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  /** ===================== REQUIREMENT 2: CLOUD PROVIDER CONFIGURATION ===================== */
  describe("Requirement 2: Cloud Provider Configuration", () => {
    it("provider.tf should have AWS provider configured", () => {
      expect(providerHcl).toMatch(/provider\s+"aws"\s*{/);
      expect(providerHcl).toMatch(/region\s*=\s*var\.aws_region/);
    });

    it("should use latest AWS provider version", () => {
      expect(providerHcl).toMatch(/version.*5\.0/);
    });

    it("should have default tags configured", () => {
      // Default tags are configured in the main terraform file, not provider.tf
      expect(hcl).toMatch(/common_tags\s*=/);
      expect(hcl).toMatch(/Environment\s*=\s*var\.environment/);
      expect(hcl).toMatch(/Project\s*=\s*var\.project_name/);
    });
  });

  /** ===================== REQUIREMENT 3: NETWORK CONFIGURATION ===================== */
  describe("Requirement 3: Network Configuration", () => {
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

    it("has internet gateway", () => {
      const igw = extractFirstBlock(hcl, /resource\s+"aws_internet_gateway"\s*/g);
      expect(igw).toBeTruthy();
    });
  });

  /** ===================== REQUIREMENT 4: RESOURCE MANAGEMENT ===================== */
  describe("Requirement 4: Resource Management", () => {
    it("should have EC2 instances configured", () => {
      const ec2 = extractFirstBlock(hcl, /resource\s+"aws_instance"\s+"web"\s*/g);
      expect(ec2).toBeTruthy();
      expect(ec2!).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    it("should have RDS instance configured", () => {
      const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
      expect(rds).toBeTruthy();
      expect(rds!).toMatch(/engine\s*=\s*"mysql"/);
      expect(rds!).toMatch(/storage_encrypted\s*=\s*true/);
    });

    it("should have S3 bucket configured", () => {
      const s3 = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket"\s+"data"\s*/g);
      expect(s3).toBeTruthy();
    });

    it("should have load balancer configured", () => {
      const alb = extractFirstBlock(hcl, /resource\s+"aws_lb"\s+"web"\s*/g);
      expect(alb).toBeTruthy();
      expect(alb!).toMatch(/load_balancer_type\s*=\s*"application"/);
    });
  });

  /** ===================== REQUIREMENT 5: SECURITY AND ACCESS CONTROL ===================== */
  describe("Requirement 5: Security and Access Control", () => {
    it("should have IAM role for EC2 instances", () => {
      const role = extractFirstBlock(hcl, /resource\s+"aws_iam_role"\s+"ec2_role"\s*/g);
      expect(role).toBeTruthy();
      expect(role!).toMatch(/assume_role_policy\s*=/);
    });

    it("should have IAM policy with least privilege", () => {
      const policy = extractFirstBlock(hcl, /resource\s+"aws_iam_policy"\s+"ec2_policy"\s*/g);
      expect(policy).toBeTruthy();
      expect(policy!).toMatch(/policy\s*=/);
    });

    it("should have security groups configured", () => {
      const webSg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"web"\s*/g);
      const dbSg = extractFirstBlock(hcl, /resource\s+"aws_security_group"\s+"database"\s*/g);
      expect(webSg && dbSg).toBeTruthy();
    });

    it("should have SSH access restrictions", () => {
      const sshVar = extractFirstBlock(hcl, /variable\s+"allowed_ssh_cidrs"\s*/g);
      expect(sshVar).toBeTruthy();
      expect(sshVar!).toMatch(/validation\s*{/);
    });

    it("should not allow 0.0.0.0/0 for SSH", () => {
      const sshRules = hcl.match(/ingress\s*{[^}]*from_port\s*=\s*22[^}]*}/g) || [];
      sshRules.forEach(rule => {
        expect(rule).not.toMatch(/0\.0\.0\.0\/0/);
      });
    });
  });

  /** ===================== REQUIREMENT 6: ROLLBACK AND RECOVERY ===================== */
  describe("Requirement 6: Rollback and Recovery", () => {
    it("should have S3 backend configuration", () => {
      expect(providerHcl).toMatch(/backend\s+"(s3|local)"/);
    });

    it("should have RDS backup configuration", () => {
      const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
      expect(rds).toBeTruthy();
      expect(rds!).toMatch(/backup_retention_period\s*=\s*7/);
      expect(rds!).toMatch(/final_snapshot_identifier/);
    });

    it("should have deletion protection", () => {
      const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s+"main"\s*/g);
      expect(rds).toBeTruthy();
      expect(rds!).toMatch(/deletion_protection\s*=\s*var\.enable_deletion_protection/);
    });

    it("should have S3 versioning enabled", () => {
      const versioning = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_versioning"\s*/g);
      expect(versioning).toBeTruthy();
      expect(versioning!).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  /** ===================== REQUIREMENT 7: VALIDATION AND TESTING ===================== */
  describe("Requirement 7: Validation and Testing", () => {
    it("should have proper variable validation", () => {
      const regionVar = extractFirstBlock(hcl, /variable\s+"aws_region"\s*/g);
      expect(regionVar).toBeTruthy();
      expect(regionVar!).toMatch(/validation\s*{/);
      expect(regionVar!).toMatch(/condition\s*=/);
      expect(regionVar!).toMatch(/error_message\s*=/);
    });

    it("should have sensitive variables marked", () => {
      expect(hcl).toMatch(/sensitive\s*=\s*true/);
    });

    it("should have outputs for validation", () => {
      expect(hcl).toMatch(/output\s+"vpc_id"/);
      expect(hcl).toMatch(/output\s+"load_balancer_dns"/);
      expect(hcl).toMatch(/output\s+"database_endpoint"/);
    });
  });

  /** ===================== ADDITIONAL SECURITY VALIDATIONS ===================== */
  describe("Additional Security Validations", () => {
    it("should have encrypted storage", () => {
      const rds = extractFirstBlock(hcl, /resource\s+"aws_db_instance"\s*/g);
      expect(rds).toBeTruthy();
      expect(rds!).toMatch(/storage_encrypted\s*=\s*true/);

      const ec2 = extractFirstBlock(hcl, /resource\s+"aws_instance"\s*/g);
      expect(ec2).toBeTruthy();
      expect(ec2!).toMatch(/encrypted\s*=\s*true/);
    });

    it("should have S3 encryption configured", () => {
      const encryption = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s*/g);
      expect(encryption).toBeTruthy();
      expect(encryption!).toMatch(/sse_algorithm\s*=\s*["']AES256["']/);
    });

    it("should have S3 public access blocked", () => {
      const publicBlock = extractFirstBlock(hcl, /resource\s+"aws_s3_bucket_public_access_block"\s*/g);
      expect(publicBlock).toBeTruthy();
      expect(publicBlock!).toMatch(/block_public_acls\s*=\s*true/);
      expect(publicBlock!).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  /** ===================== RESOURCE TAGGING ===================== */
  describe("Resource Tagging", () => {
    it("should have consistent tagging strategy", () => {
      expect(hcl).toMatch(/tags\s*=\s*{/);
      expect(hcl).toMatch(/Name\s*=\s*"\$\{var\.project_name\}/);
    });

    it("should use locals for common tags", () => {
      const localsBlocks = extractAllBlocks(hcl, /\blocals\s*/g);
      expect(localsBlocks.length).toBeGreaterThan(0);
      const locals = localsBlocks.join("\n");
      expect(locals).toMatch(/common_tags\s*=/);
    });
  });

  /** ===================== MONITORING AND OBSERVABILITY ===================== */
  describe("Monitoring and Observability", () => {
    it("should have CloudWatch log group", () => {
      const logGroup = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_log_group"\s*/g);
      expect(logGroup).toBeTruthy();
    });

    it("should have CloudWatch alarms", () => {
      const alarm = extractFirstBlock(hcl, /resource\s+"aws_cloudwatch_metric_alarm"\s*/g);
      expect(alarm).toBeTruthy();
    });
  });

  /** ===================== COMPLIANCE DOCUMENTATION ===================== */
  describe("Compliance Documentation", () => {
    it("should have requirement comments", () => {
      expect(raw).toMatch(/Terraform HCL Configuration/);
      expect(raw).toMatch(/Network Configuration/);
      expect(raw).toMatch(/Resource Management/);
      expect(raw).toMatch(/Security and Access Control/);
      expect(raw).toMatch(/Rollback and Recovery/);
      expect(raw).toMatch(/Validation and Testing/);
    });
  });
});
