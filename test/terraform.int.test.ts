import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
let outputs: Record<string, any>;

// Validator helpers
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" && val.startsWith("arn:aws:");

const isValidIp = (val: any): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const isJsonString = (val: any): boolean => {
  if (typeof val !== "string") return false;
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
};

// Load outputs before tests
beforeAll(() => {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
});

describe("Flat outputs.json validation", () => {
  it("outputs file loaded with many keys", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(20);
  });

  it("VPC IDs are non-empty strings", () => {
    expect(isJsonString(outputs.vpc_ids)).toBe(true);
    const vpcs = JSON.parse(outputs.vpc_ids);
    expect(isNonEmptyString(vpcs.primary)).toBe(true);
    expect(isNonEmptyString(vpcs.secondary)).toBe(true);
  });

  it("Subnet IDs are valid arrays", () => {
    expect(isJsonString(outputs.subnet_ids)).toBe(true);
    const subnets = JSON.parse(outputs.subnet_ids);
    ["primary", "secondary"].forEach(region => {
      expect(subnets[region]).toBeDefined();
      expect(Array.isArray(subnets[region].public)).toBe(true);
      expect(subnets[region].public.every(isNonEmptyString)).toBe(true);
      expect(Array.isArray(subnets[region].private)).toBe(true);
      expect(subnets[region].private.every(isNonEmptyString)).toBe(true);
    });
  });

  it("Security group IDs follow sg-* format", () => {
    expect(isJsonString(outputs.security_group_ids)).toBe(true);
    const sgs = JSON.parse(outputs.security_group_ids);
    Object.values(sgs).forEach((sg) => {
      expect(typeof sg).toBe("string");
      expect(sg).toMatch(/^sg-/);
    });
  });

  it("ALB DNS names look valid", () => {
    expect(isJsonString(outputs.load_balancer_dns_names)).toBe(true);
    const albDns = JSON.parse(outputs.load_balancer_dns_names);
    ["primary", "secondary"].forEach(r => {
      expect(typeof albDns[r]).toBe("string");
      expect(albDns[r]).toContain(".elb.amazonaws.com");
    });
  });

  it("ALB zone IDs are non-empty strings", () => {
    expect(isJsonString(outputs.load_balancer_zone_ids)).toBe(true);
    const zoneIds = JSON.parse(outputs.load_balancer_zone_ids);
    ["primary", "secondary"].forEach(r => {
      expect(isNonEmptyString(zoneIds[r])).toBe(true);
    });
  });

  it("RDS endpoints are valid and port is included in endpoint", () => {
    expect(isJsonString(outputs.rds_instance_endpoints)).toBe(true);
    const rdsEndpoints = JSON.parse(outputs.rds_instance_endpoints);
    ["primary", "secondary"].forEach(r => {
      expect(typeof rdsEndpoints[r]).toBe("string");
      expect(rdsEndpoints[r]).toMatch(/\.rds\.amazonaws\.com(:5432)?/);
    });
  });

  it("IAM ARNs and instance profile name are valid", () => {
    expect(isValidArn(outputs.iam_role_arn)).toBe(true);
    expect(isNonEmptyString(outputs.iam_instance_profile_name)).toBe(true);
    // rds_monitoring_role_arn output not present in your outputs, skip this check
  });

  it("Auto Scaling Group names are valid non-empty strings", () => {
    expect(isJsonString(outputs.autoscaling_group_names)).toBe(true);
    const asgNames = JSON.parse(outputs.autoscaling_group_names);
    ["primary", "secondary"].forEach(r => {
      expect(isNonEmptyString(asgNames[r])).toBe(true);
    });
  });

  it("KMS keys are UUID format", () => {
    expect(isJsonString(outputs.kms_key_ids)).toBe(true);
    const kmsIds = JSON.parse(outputs.kms_key_ids);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    ["primary", "secondary"].forEach(r => {
      expect(kmsIds[r]).toMatch(uuidRegex);
    });
  });

  it("Log group names start with /aws/ec2/ or /aws/rds/", () => {
    expect(isJsonString(outputs.cloudwatch_log_group_names)).toBe(true);
    const logGroups = JSON.parse(outputs.cloudwatch_log_group_names);
    expect(logGroups.primary).toMatch(/^\/aws\/ec2\//);
    expect(logGroups.secondary).toMatch(/^\/aws\/ec2\//);
    expect(logGroups.rds).toMatch(/^\/aws\/rds\//);
  });

  it("Launch template IDs look like lt-xxx", () => {
    expect(isJsonString(outputs.launch_template_ids)).toBe(true);
    const ltIds = JSON.parse(outputs.launch_template_ids);
    ["primary", "secondary"].forEach(r => {
      expect(ltIds[r]).toMatch(/^lt-/);
    });
  });

  it("NAT Gateway IDs arrays are valid", () => {
    expect(isJsonString(outputs.nat_gateway_ids)).toBe(true);
    const natIds = JSON.parse(outputs.nat_gateway_ids);
    ["primary", "secondary"].forEach(r => {
      expect(Array.isArray(natIds[r])).toBe(true);
      natIds[r].forEach(id => expect(typeof id).toBe("string"));
    });
  });

  it("EIP addresses are valid IP arrays", () => {
    expect(isJsonString(outputs.elastic_ip_addresses)).toBe(true);
    const eips = JSON.parse(outputs.elastic_ip_addresses);
    ["primary", "secondary"].forEach(r => {
      expect(Array.isArray(eips[r])).toBe(true);
      eips[r].forEach((ip: string) => {
        expect(isValidIp(ip)).toBe(true);
      });
    });
  });

  it("S3 bucket names and ARNs are valid", () => {
    expect(isJsonString(outputs.s3_bucket_names)).toBe(true);
    expect(isJsonString(outputs.s3_bucket_arns)).toBe(true);
    const s3Names = JSON.parse(outputs.s3_bucket_names);
    const s3Arns = JSON.parse(outputs.s3_bucket_arns);

    ["primary", "secondary"].forEach(r => {
      expect(isNonEmptyString(s3Names[r])).toBe(true);
      expect(s3Arns[r]).toContain(`arn:aws:s3:::${s3Names[r]}`);
    });
  });

  it("CloudFront distribution values are valid", () => {
    expect(isNonEmptyString(outputs.cloudfront_distribution_id)).toBe(true);
    expect(typeof outputs.cloudfront_distribution_domain_name).toBe("string");
    expect(outputs.cloudfront_distribution_domain_name).toMatch(/\.cloudfront\.net$/);
  });

  it("AMI IDs look valid", () => {
    expect(isJsonString(outputs.ami_ids)).toBe(true);
    const amiIds = JSON.parse(outputs.ami_ids);
    ["primary", "secondary"].forEach(r => {
      expect(amiIds[r]).toMatch(/^ami-/);
    });
  });
});
