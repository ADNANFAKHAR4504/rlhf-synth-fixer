import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
let outputs: Record<string, any>;

// Helper validators
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" && val.startsWith("arn:");

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

beforeAll(() => {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
});

describe("Flat Outputs Validation", () => {

  it("loads outputs file with sufficient keys", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(20);
  });

  it("validates VPC IDs", () => {
    expect(isJsonString(outputs["vpc_ids"])).toBe(true);
    const vpcs: Record<string, string> = JSON.parse(outputs["vpc_ids"]);
    expect(isNonEmptyString(vpcs["primary"])).toBe(true);
    expect(isNonEmptyString(vpcs["secondary"])).toBe(true);
  });

  it("validates subnet IDs structure", () => {
    expect(isJsonString(outputs["subnet_ids"])).toBe(true);
    const subnets: Record<string, {public: string[]; private: string[]}> = JSON.parse(outputs["subnet_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(subnets[region]).toBeDefined();
      expect(Array.isArray(subnets[region].public)).toBe(true);
      expect(subnets[region].public.every(id => isNonEmptyString(id))).toBe(true);
      expect(Array.isArray(subnets[region].private)).toBe(true);
      expect(subnets[region].private.every(id => isNonEmptyString(id))).toBe(true);
    });
  });

  it("validates security group IDs", () => {
    expect(isJsonString(outputs["security_group_ids"])).toBe(true);
    const sgIds: Record<string, string> = JSON.parse(outputs["security_group_ids"]);
    Object.values(sgIds).forEach((id: string) => {
      expect(typeof id).toBe("string");
      expect(id.startsWith("sg-")).toBe(true);
    });
  });

  it("validates load balancer DNS names", () => {
    expect(isJsonString(outputs["load_balancer_dns_names"])).toBe(true);
    const dnsNames: Record<string, string> = JSON.parse(outputs["load_balancer_dns_names"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(dnsNames[region])).toBe(true);
      expect(dnsNames[region].includes(".elb.amazonaws.com")).toBe(true);
    });
  });

  it("validates load balancer zone IDs", () => {
    expect(isJsonString(outputs["load_balancer_zone_ids"])).toBe(true);
    const zoneIds: Record<string, string> = JSON.parse(outputs["load_balancer_zone_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(zoneIds[region])).toBe(true);
    });
  });

  it("validates RDS endpoints", () => {
    expect(isJsonString(outputs["rds_instance_endpoints"])).toBe(true);
    const endpoints: Record<string, string> = JSON.parse(outputs["rds_instance_endpoints"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(endpoints[region])).toBe(true);
      expect(endpoints[region].includes(".rds")).toBe(true);
      expect(endpoints[region]).toMatch(/:\d+$/);
    });
  });

  it("validates IAM details", () => {
    expect(isValidArn(outputs["iam_role_arn"])).toBe(true);
    expect(isNonEmptyString(outputs["iam_instance_profile_name"])).toBe(true);
  });

  it("validates autoscaling group names", () => {
    expect(isJsonString(outputs["autoscaling_group_names"])).toBe(true);
    const asgs: Record<string, string> = JSON.parse(outputs["autoscaling_group_names"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(asgs[region])).toBe(true);
    });
  });

  it("validates KMS key IDs format", () => {
    expect(isJsonString(outputs["kms_key_ids"])).toBe(true);
    const kmsIds: Record<string, string> = JSON.parse(outputs["kms_key_ids"]);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    ["primary", "secondary"].forEach((region: string) => {
      expect(kmsIds[region]).toMatch(uuidRegex);
    });
  });

  it("validates CloudWatch log group names", () => {
    expect(isJsonString(outputs["cloudwatch_log_group_names"])).toBe(true);
    const logGroups: Record<string, string> = JSON.parse(outputs["cloudwatch_log_group_names"]);
    expect(logGroups["primary"]).toMatch(/^\/aws\/ec2\//);
    expect(logGroups["secondary"]).toMatch(/^\/aws\/ec2\//);
    expect(logGroups["rds"]).toMatch(/^\/aws\/rds\//);
  });

  it("validates launch template IDs", () => {
    expect(isJsonString(outputs["launch_template_ids"])).toBe(true);
    const lts: Record<string, string> = JSON.parse(outputs["launch_template_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(lts[region]).toMatch(/^lt-/);
    });
  });

  it("validates NAT gateway IDs arrays", () => {
    expect(isJsonString(outputs["nat_gateway_ids"])).toBe(true);
    const natGatewayIds: Record<string, string[]> = JSON.parse(outputs["nat_gateway_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(Array.isArray(natGatewayIds[region])).toBe(true);
      natGatewayIds[region].forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));
    });
  });

  it("validates Elastic IP addresses", () => {
    expect(isJsonString(outputs["elastic_ip_addresses"])).toBe(true);
    const eips: Record<string, string[]> = JSON.parse(outputs["elastic_ip_addresses"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(Array.isArray(eips[region])).toBe(true);
      eips[region].forEach((ip: string) => expect(isValidIp(ip)).toBe(true));
    });
  });

  it("validates S3 bucket names and ARNs", () => {
    expect(isJsonString(outputs["s3_bucket_names"])).toBe(true);
    expect(isJsonString(outputs["s3_bucket_arns"])).toBe(true);
    const bucketNames: Record<string, string> = JSON.parse(outputs["s3_bucket_names"]);
    const bucketArns: Record<string, string> = JSON.parse(outputs["s3_bucket_arns"]);

    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(bucketNames[region])).toBe(true);
      expect(bucketArns[region]).toContain(bucketNames[region]);
    });
  });

  it("validates CloudFront outputs", () => {
    expect(isNonEmptyString(outputs["cloudfront_distribution_id"])).toBe(true);
    expect(isNonEmptyString(outputs["cloudfront_distribution_domain_name"])).toBe(true);
    expect(outputs["cloudfront_distribution_domain_name"]).toMatch(/\.cloudfront\.net$/);
  });

  it("validates AMI IDs", () => {
    expect(isJsonString(outputs["ami_ids"])).toBe(true);
    const amiIds: Record<string, string> = JSON.parse(outputs["ami_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(amiIds[region]).toMatch(/^ami-/);
    });
  });

  it("validates route53 details", () => {
    expect(isNonEmptyString(outputs["route53_zone_id"])).toBe(true);
    expect(isNonEmptyString(outputs["route53_zone_name"])).toBe(true);

    expect(isJsonString(outputs["route53_health_check_ids"])).toBe(true);
    const healthChecks: Record<string, string> = JSON.parse(outputs["route53_health_check_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(healthChecks[region])).toBe(true);
    });
  });

  it("validates internet gateway IDs", () => {
    expect(isJsonString(outputs["internet_gateway_ids"])).toBe(true);
    const igwIds: Record<string, string> = JSON.parse(outputs["internet_gateway_ids"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isNonEmptyString(igwIds[region])).toBe(true);
      expect(igwIds[region].startsWith("igw-")).toBe(true);
    });
  });

  it("validates target group ARNs", () => {
    expect(isJsonString(outputs["target_group_arns"])).toBe(true);
    const tgArns: Record<string, string> = JSON.parse(outputs["target_group_arns"]);
    ["primary", "secondary"].forEach((region: string) => {
      expect(isValidArn(tgArns[region])).toBe(true);
    });
  });

  it("validates application URL", () => {
    expect(isNonEmptyString(outputs["application_url"])).toBe(true);
    expect(outputs["application_url"]).toMatch(/^http:\/\//);
  });

});
