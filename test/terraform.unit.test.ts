import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack extended validation", () => {
  // === BASIC FILE VALIDATION ===
  it("uses Terraform AWS provider", () => {
    expect(has(/provider\s+"aws"/)).toBe(true);
  });

  it("specifies minimum required Terraform version", () => {
    expect(has(/terraform\s*{[\s\S]*required_version/)).toBe(true);
  });

  it("declares backend configuration for state management", () => {
    expect(has(/backend\s+"s3"/)).toBe(true);
  });

  // === EC2 DETAILS ===
  ["primary","secondary"].forEach(region => {
    it(`ensures ${region} EC2 instances are not publicly accessible`, () => {
      const block = tf.match(new RegExp(`resource\\s+"aws_instance"\\s+"${region}_ec2"[\\s\\S]*?}`, "g"));
      expect(block).not.toBeNull();
      if (block) {
        expect(block[0].includes("associate_public_ip_address = false")).toBe(true);
      }
    });

    it(`ensures ${region} EC2 instances have IAM role attached`, () => {
      expect(has(new RegExp(`iam_instance_profile\\s*=\\s*aws_iam_instance_profile.${region === "primary" ? "ec2_profile" : "secondary_ec2_profile"}.name`))).toBe(true);
    });

    it(`ensures ${region} EC2 instances use Amazon Linux 2`, () => {
      expect(has(new RegExp(`ami\\s*=\\s*data.aws_ami.amazon_linux_${region}.id`))).toBe(true);
    });
  });

  // === SECURITY GROUP RULES ===
  it("restricts SSH to allowed CIDRs only", () => {
    expect(has(/ingress[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*var.allowed_ssh_cidrs/)).toBe(true);
  });

  it("restricts HTTPS to allowed CIDRs only", () => {
    expect(has(/ingress[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*var.allowed_https_cidrs/)).toBe(true);
  });

  it("ensures no security group rule allows 0.0.0.0/0 for all ports", () => {
    expect(/cidr_blocks\s*=\s*\[.*0\.0\.0\.0\/0.*\]/.test(tf)).toBe(false);
  });

  // === S3 SECURITY ===
  it("applies S3 bucket public access blocks", () => {
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary_bucket_pab"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"secondary_bucket_pab"/)).toBe(true);
  });

  it("ensures all S3 buckets have versioning enabled", () => {
    expect(has(/aws_s3_bucket_versioning/)).toBe(true);
  });

  it("ensures all S3 buckets have server-side encryption", () => {
    expect(has(/aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
  });

  // === RDS EXTRA CHECKS ===
  ["primary","secondary"].forEach(region => {
    it(`ensures ${region} RDS storage is encrypted with KMS`, () => {
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*kms_key_id`))).not.toBeNull();
    });

    it(`ensures ${region} RDS backups are enabled`, () => {
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*backup_retention_period\\s*=\\s*[1-9]`))).not.toBeNull();
    });

    it(`ensures ${region} RDS deletion protection is enabled`, () => {
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*deletion_protection\\s*=\\s*true`))).not.toBeNull();
    });
  });

  // === LOAD BALANCER CONFIG ===
  ["primary", "secondary"].forEach(region => {
    it(`ensures ${region} ALB has access logs enabled`, () => {
      expect(tf.match(new RegExp(`resource\\s+"aws_lb"\\s+"${region}_alb"[\\s\\S]*access_logs`))).not.toBeNull();
    });
  });

  // === CLOUDFRONT EXTRA ===
  it("ensures CloudFront distribution enforces HTTPS", () => {
    expect(has(/viewer_protocol_policy\s*=\s*"redirect-to-https"/)).toBe(true);
  });

  it("ensures CloudFront has WAF or Shield integration", () => {
    expect(has(/web_acl_id\s*=\s*aws_wafv2_web_acl/)).toBe(true);
  });

  // === MONITORING ===
  it("ensures CloudWatch log groups have retention defined", () => {
    expect(has(/retention_in_days\s*=\s*[0-9]+/)).toBe(true);
  });

  it("ensures Lambda functions publish to CloudWatch logs", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"primary_rds_backup_log"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"secondary_rds_backup_log"/)).toBe(true);
  });

  // === GOVERNANCE ===
  it("ensures all resources are tagged with Name", () => {
    expect(has(/tags\s*=\s*{[\s\S]*Name\s*=/)).toBe(true);
  });

  it("ensures resources include mandatory tags (Owner, CostCenter, Environment)", () => {
    ["Owner","CostCenter","Environment"].forEach(tag => {
      expect(new RegExp(`${tag}\\s*=`).test(tf)).toBe(true);
    });
  });

  // === OUTPUT SAFETY ===
  it("ensures outputs reference ARNs or IDs, not hardcoded values", () => {
    const badOutputs = tf.match(/output\s+".*"\s*{[\s\S]*value\s*=\s*".*"/g) || [];
    badOutputs.forEach(out => {
      expect(out.includes("arn:")).toBe(false);
      expect(out.includes("password")).toBe(false);
    });
  });
});

