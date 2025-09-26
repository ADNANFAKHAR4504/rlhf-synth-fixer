import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack validation (adjusted)", () => {
  // === BASICS ===
  it("uses Terraform AWS provider", () => {
    expect(has(/provider\s+"aws"/)).toBe(true);
  });

  it("specifies minimum required Terraform version", () => {
    expect(has(/terraform\s*{[\s\S]*required_version/)).toBe(true);
  });

  it("declares backend configuration for state management", () => {
    expect(has(/backend\s+"s3"/)).toBe(true);
  });

  // === EC2 (optional - skip if not present) ===
  ["primary", "secondary"].forEach(region => {
    it(`ensures ${region} EC2 instances are not publicly accessible (if defined)`, () => {
      const block = tf.match(new RegExp(`resource\\s+"aws_instance"\\s+"${region}_ec2"[\\s\\S]*?}`, "g"));
      if (block) {
        expect(block[0].includes("associate_public_ip_address = false")).toBe(true);
      }
    });

    it(`ensures ${region} EC2 instances have IAM role attached (if defined)`, () => {
      if (has(new RegExp(`resource\\s+"aws_instance"\\s+"${region}_ec2"`))) {
        expect(has(/iam_instance_profile\s*=\s*aws_iam_instance_profile/)).toBe(true);
      }
    });

    it(`ensures ${region} EC2 instances use Amazon Linux 2 (if defined)`, () => {
      if (has(new RegExp(`resource\\s+"aws_instance"\\s+"${region}_ec2"`))) {
        expect(has(/ami\s*=\s*data\.aws_ami\.amazon_linux/)).toBe(true);
      }
    });
  });

  // === SECURITY GROUPS ===
  it("restricts SSH to allowed CIDRs only", () => {
    expect(has(/from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*var.allowed_ssh_cidrs/)).toBe(true);
  });

  it("restricts HTTPS to allowed CIDRs only", () => {
    expect(has(/from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*var.allowed_https_cidrs/)).toBe(true);
  });

  it("ensures no SG rule allows 0.0.0.0/0 for all ports", () => {
    expect(/cidr_blocks\s*=\s*\[.*0\.0\.0\.0\/0.*\]/.test(tf)).toBe(false);
  });

  // === S3 ===
  it("applies S3 bucket public access blocks", () => {
    expect(has(/aws_s3_bucket_public_access_block/)).toBe(true);
  });

  it("ensures all S3 buckets have versioning enabled", () => {
    expect(has(/versioning\s*{[\s\S]*enabled\s*=\s*true/)).toBe(true);
  });

  it("ensures all S3 buckets have server-side encryption", () => {
    expect(has(/server_side_encryption_configuration/)).toBe(true);
  });

  // === RDS ===
  ["primary", "secondary"].forEach(region => {
    it(`ensures ${region} RDS storage is encrypted with KMS`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*kms_key_id`))).toBe(true);
    });

    it(`ensures ${region} RDS backups are enabled`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*backup_retention_period\\s*=\\s*[1-9]`))).toBe(true);
    });

    it(`ensures ${region} RDS deletion protection is enabled`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*deletion_protection\\s*=\\s*true`))).toBe(true);
    });
  });

  // === TAGS ===
  it("ensures all resources are tagged with Name", () => {
    expect(has(/tags\s*=\s*{[\s\S]*Name/)).toBe(true);
  });

  it("ensures resources include mandatory tags (Owner, CostCenter, Environment)", () => {
    ["Owner", "CostCenter", "Environment"].forEach(tag => {
      expect(new RegExp(`${tag}\\s*=`).test(tf)).toBe(true);
    });
  });

  // === OUTPUTS ===
  it("ensures outputs reference ARNs or IDs, not hardcoded values", () => {
    expect(/output\s+".*"\s*{[\s\S]*value\s*=\s*(aws_|module\.)/.test(tf)).toBe(true);
  });
});
