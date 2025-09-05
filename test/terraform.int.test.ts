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

  // --- SANITY/COVERAGE ---
  const requiredFlatKeys = [
    "alb_health_alarm_name", "alb_security_group_id", "autoscaling_group_name", "domain_name",
    "ec2_instance_profile_name", "load_balancer_arn", "load_balancer_dns_name",
    "primary_ami_id", "primary_availability_zones", "primary_cpu_alarm_name",
    "primary_internet_gateway_id", "primary_kms_key_id", "primary_nat_gateway_id",
    "primary_private_subnet_id", "primary_public_subnet_id", "primary_s3_bucket_arn",
    "primary_s3_bucket_name", "primary_security_group_id", "primary_vpc_cidr",
    "primary_vpc_id", "route53_health_check_id", "route53_zone_id", "route53_zone_name_servers",
    "s3_replication_role_arn", "secondary_ami_id", "secondary_availability_zones",
    "secondary_cpu_alarm_name", "secondary_internet_gateway_id", "secondary_kms_key_id",
    "secondary_nat_gateway_id", "secondary_private_subnet_id", "secondary_public_subnet_id",
    "secondary_s3_bucket_arn", "secondary_s3_bucket_name", "secondary_security_group_id",
    "secondary_vpc_cidr", "secondary_vpc_id", "sns_topic_arn", "target_group_arn"
  ];
  it("all required outputs are present and non-empty", () => {
    requiredFlatKeys.forEach(key => {
      expect(key in outputs).toBe(true);
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // --- ID/FORMAT VALIDATION ---
  it("validates VPC IDs", () => {
    ["primary_vpc_id", "secondary_vpc_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  it("validates subnet IDs", () => {
    ["primary_private_subnet_id", "primary_public_subnet_id", "secondary_private_subnet_id", "secondary_public_subnet_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidSubnetId(outputs[key])).toBe(true);
    });
  });

  it("validates security group IDs", () => {
    ["alb_security_group_id", "primary_security_group_id", "secondary_security_group_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidSGId(outputs[key])).toBe(true);
    });
  });

  it("validates IGW and NAT Gateway IDs", () => {
    ["primary_internet_gateway_id", "secondary_internet_gateway_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidIGWId(outputs[key])).toBe(true);
    });
    ["primary_nat_gateway_id", "secondary_nat_gateway_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidNatId(outputs[key])).toBe(true);
    });
  });

  it("validates AMI IDs", () => {
    ["primary_ami_id", "secondary_ami_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidAMIId(outputs[key])).toBe(true);
    });
  });

  it("validates Availability Zone arrays", () => {
    ["primary_availability_zones", "secondary_availability_zones"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      const arr = parseArray(outputs[key]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((az: string) => expect(az).toMatch(/^us-[a-z0-9-]+[a-cf]$/));
    });
  });

  it("validates S3 bucket ARNs and names", () => {
    ["primary_s3_bucket_arn", "secondary_s3_bucket_arn"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/arn:aws:s3:::/);
    });
    ["primary_s3_bucket_name", "secondary_s3_bucket_name"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidBucketName(outputs[key])).toBe(true);
    });
  });

  it("validates target group ARN", () => {
    if (!skipIfMissing("target_group_arn", outputs))
      expect(isValidTargetGroupArn(outputs["target_group_arn"])).toBe(true);
  });

  it("validates KMS key IDs", () => {
    ["primary_kms_key_id", "secondary_kms_key_id"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(outputs[key]).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });
  });

  it("validates Route53 health check ID and zone ID", () => {
    if (!skipIfMissing("route53_health_check_id", outputs))
      expect(isValidHealthCheckId(outputs["route53_health_check_id"])).toBe(true);
    if (!skipIfMissing("route53_zone_id", outputs))
      expect(isValidZoneId(outputs["route53_zone_id"])).toBe(true);
  });

  it("validates Route53 name servers array", () => {
    if (!skipIfMissing("route53_zone_name_servers", outputs)) {
      const arr = parseArray(outputs["route53_zone_name_servers"]);
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((ns: string) => expect(ns).toMatch(/^ns-[0-9]+\.awsdns-[0-9]+\.(com|net|org|co\.uk)$/));
    }
  });

  it("validates DNS names", () => {
    ["load_balancer_dns_name"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(isValidDomainName(outputs[key])).toBe(true);
    });
    if (!skipIfMissing("domain_name", outputs))
      expect(isValidDomainName(outputs["domain_name"])).toBe(true);
  });

  it("validates ARNs", () => {
    ["load_balancer_arn", "s3_replication_role_arn", "sns_topic_arn"].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  it("validates Alarm names are present and non-empty", () => {
    [
      "alb_health_alarm_name", "primary_cpu_alarm_name", "secondary_cpu_alarm_name"
    ].forEach(key => {
      if (skipIfMissing(key, outputs)) return;
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/(cpu|alb)[-_]/);
    });
  });

  it("validates EC2 ASG and IAM profile outputs are non-empty strings", () => {
    if (!skipIfMissing("autoscaling_group_name", outputs))
      expect(isNonEmptyString(outputs["autoscaling_group_name"])).toBe(true);
    if (!skipIfMissing("ec2_instance_profile_name", outputs))
      expect(isNonEmptyString(outputs["ec2_instance_profile_name"])).toBe(true);
  });

  // --- SENSITIVE DATA SANITIZATION ---
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
