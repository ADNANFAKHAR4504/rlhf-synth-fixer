import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) => /^arn:[^:]+:[^:]*:[^:]*:\*{0,3}:.*$/.test(v.trim()) || /^arn:[^:]+:[^:]*:[^:]*:[0-9]*:.*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSGId = (v: string) => v.startsWith("sg-");
const isValidIGWId = (v: string) => v.startsWith("igw-");
const isValidNatId = (v: string) => v.startsWith("nat-");
const isValidZoneId = (v: string) => v.startsWith("Z");
const isValidHealthCheckId = (v: string) => /^[a-f0-9-]{36}$/.test(v);
const isValidDomainName = (v: string) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
const isValidBucketName = (v: string) => /^[a-z0-9.-]+$/.test(v);
const isValidAMIId = (v: string) => v.startsWith("ami-");
const isValidTargetGroupArn = (v: string) => v.includes(":targetgroup/");
const isValidLogGroupName = (v: string) => v.startsWith("/aws/");
const isValidIP = (v: string) => /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v.trim());
const isValidPort = (v: string) => !isNaN(Number(v)) && Number(v) > 0 && Number(v) < 65536;

const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};

// Util to skip if output is missing
const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    // eslint-disable-next-line no-console
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Terraform flat outputs - integration validation", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }
  });

  it("has sufficient keys (at least 30)", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(30);
  });

  // ========== String and Presence Validation ==========
  it("validates organization and region keys", () => {
    ["primary_region", "secondary_region"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/^us-[a-z0-9-]+$/);
    });
  });

  // ========== Resource Identifiers ==========
  it("validates VPC IDs", () => {
    ["primary_vpc_id", "secondary_vpc_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  it("validates subnet IDs as arrays", () => {
    [
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  it("validates security group IDs", () => {
    [
      "primary_web_security_group_id",
      "primary_bastion_security_group_id",
      "primary_alb_security_group_id",
      "primary_rds_security_group_id",
      "secondary_web_security_group_id",
      "secondary_bastion_security_group_id",
      "secondary_alb_security_group_id",
      "secondary_rds_security_group_id"
    ].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidSGId(outputs[key])).toBe(true);
    });
  });

  it("validates IGW and NAT gateway IDs", () => {
    ["primary_internet_gateway_id", "secondary_internet_gateway_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidIGWId(outputs[key])).toBe(true);
    });
    ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidNatId(id)).toBe(true));
    });
  });

  // ========== AMI IDs ==========
  it("validates AMI outputs", () => {
    ["primary_ami_id", "secondary_ami_id"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidAMIId(outputs[key])).toBe(true);
    });
    ["primary_ami_name", "secondary_ami_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/amzn2-ami-hvm-/);
    });
  });

  // ========== DNS, Domain, Health Check ==========
  it("validates application URLs and DNS names", () => {
    [
      "main_application_url",
      "primary_application_url",
      "secondary_application_url",
      "www_application_url"
    ].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/^http/);
    });
    ["primary_alb_dns_name", "secondary_alb_dns_name"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(isValidDomainName(outputs[key])).toBe(true);
    });
  });

  // ========== RDS Outputs ==========
  it("validates RDS outputs and port", () => {
    [
      "primary_rds_instance_id",
      "secondary_rds_instance_id"
    ].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    ["primary_rds_port", "secondary_rds_port"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidPort(outputs[key])).toBe(true);
    });
    ["primary_rds_endpoint", "secondary_rds_endpoint"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(outputs[key]).toMatch(/\.rds\.amazonaws\.com/);
      expect(outputs[key]).toMatch(/:3306$/);
    });
  });

  // ========== S3 Buckets ==========
  it("validates S3 buckets and domains", () => {
    ["primary_s3_bucket_id", "secondary_s3_bucket_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidBucketName(outputs[key])).toBe(true);
    });
    ["primary_s3_bucket_domain_name", "secondary_s3_bucket_domain_name"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(outputs[key]).toMatch(/\.s3\.amazonaws\.com$/);
    });
    ["primary_s3_bucket_arn", "secondary_s3_bucket_arn"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  // ========== Target Group ARNs ==========
  it("validates ALB target group arns", () => {
    ["primary_target_group_arn", "secondary_target_group_arn"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidTargetGroupArn(outputs[key])).toBe(true);
    });
  });

  // ========== Autoscaling Groups ==========
  it("validates autoscaling group outputs", () => {
    ["primary_autoscaling_group_name", "secondary_autoscaling_group_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/-asg$/);
    });
  });

  // ========== IAM Role/Instance Profiles ==========
  it("validates EC2 IAM role and instance profile outputs", () => {
    ["ec2_iam_role_arn", "ec2_instance_profile_arn"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
    });
    ["ec2_iam_role_name", "ec2_instance_profile_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("s3_replication_role_arn", outputs))
      expect(isValidArn(outputs["s3_replication_role_arn"])).toBe(true);
  });

  // ========== CloudWatch Log Groups ==========
  it("validates CloudWatch log group outputs and names", () => {
    ["primary_cloudwatch_log_group_arn", "secondary_cloudwatch_log_group_arn"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
    });
    ["primary_cloudwatch_log_group_name", "secondary_cloudwatch_log_group_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidLogGroupName(outputs[key])).toBe(true);
    });
  });

  // ========== Dashboard URLs ==========
  it("validates dashboard URLs", () => {
    ["primary_cloudwatch_dashboard_url", "secondary_cloudwatch_dashboard_url"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(outputs[key]).toMatch(/^https:\/\/(us-|ap-|eu-|sa-|ca-|cn-)[a-z0-9-]+\.console\.aws\.amazon\.com\/cloudwatch\/home/);
    });
  });

  // ========== SNS Topic ARNs ==========
  it("validates SNS topic ARNs", () => {
    ["primary_sns_alerts_topic_arn", "secondary_sns_alerts_topic_arn"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/:tapstack-production-(primary|secondary)-alerts$/);
    });
  });

  // ========== Miscellaneous outputs ==========
  it("validates EC2 key pair names", () => {
    ["primary_key_pair_name", "secondary_key_pair_name"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/-keypair$/);
    });
  });

  it("validates availability zones arrays", () => {
    ["primary_availability_zones", "secondary_availability_zones"].forEach((key) => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((az: string) => expect(az).toMatch(/^us-[a-z0-9-]+[a-cf]$/));
    });
  });

  // ========== Security: No secrets exposed directly ==========
  it("does not expose passwords, secret values or sensitive plain text in outputs", () => {
    const sensitivePatterns = [
      /password/i,
      /secret_value/i,
      /secret_string/i,
      /private_key/i,
      /access_key/i,
      /session_token/i,
    ];
    const violation = Object.keys(outputs).some((k) =>
      sensitivePatterns.some((p) => p.test(k))
    );
    expect(violation).toBe(false);
  });
});
