import * as fs from "fs";
import * as path from "path";

// Path to the flat outputs JSON file
const outputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

let outputsRaw: any;
try {
  outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  throw new Error(`Cannot load flattened outputs JSON from ${outputPath}`);
}

// Helper: If a value is an encoded array-like string, convert it
function decode(val: any): any {
  if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// Decode array values from output
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(outputsRaw)) {
  outputs[key] = decode(val);
}

// Helper functions for validation
function isNonEmptyString(v: any): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isArn(str: string): boolean {
  return /^arn:aws:[\w\-]+:[\w\-]*:.*$/.test(str);
}

function isCidr(str: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(str);
}

function isAwsId(str: string, prefix: string): boolean {
  return str.startsWith(prefix) && str.length > prefix.length + 5;
}

function isDnsName(str: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*-\d+\.us-east-1\.elb\.amazonaws\.com$/.test(str);
}

function isHttpUrl(str: string): boolean {
  return /^https?:\/\/[^\s]+$/.test(str);
}

describe("Web App Infrastructure Integration Tests", () => {
  // Required outputs for web app stack
  const requiredKeys = [
    "load_balancer_url",
    "load_balancer_dns_name", 
    "load_balancer_zone_id",
    "vpc_id",
    "vpc_cidr",
    "public_subnet_ids",
    "private_subnet_ids", 
    "autoscaling_group_name",
    "s3_bucket_name",
    "s3_bucket_arn",
    "ec2_security_group_id",
    "alb_security_group_id",
    "rds_security_group_id",
    "ec2_iam_role_arn",
    "nat_gateway_ids",
    "resource_suffix"
  ];

  it("should have all required output keys and valid values", () => {
    requiredKeys.forEach((key: string) => {
      expect(outputs).toHaveProperty(key);
      const val = outputs[key];
      if (Array.isArray(val)) {
        expect(val.length).toBeGreaterThan(0);
        val.forEach((item: string) => expect(isNonEmptyString(item)).toBe(true));
      } else {
        expect(isNonEmptyString(val)).toBe(true);
      }
    });
  });

  describe("Load Balancer Outputs", () => {
    it("should have valid load balancer URL", () => {
      expect(isHttpUrl(outputs.load_balancer_url)).toBe(true);
      expect(outputs.load_balancer_url).toMatch(/^http:\/\//);
    });

    it("should have valid load balancer DNS name", () => {
      expect(isDnsName(outputs.load_balancer_dns_name)).toBe(true);
      expect(outputs.load_balancer_dns_name).toMatch(/-\d+\.us-east-1\.elb\.amazonaws\.com$/);
    });

    it("should have valid load balancer zone ID", () => {
      expect(outputs.load_balancer_zone_id).toMatch(/^Z[A-Z0-9]+$/);
      expect(outputs.load_balancer_zone_id.length).toBeGreaterThan(10);
    });
  });

  describe("VPC and Networking Outputs", () => {
    it("should have valid VPC ID", () => {
      expect(isAwsId(outputs.vpc_id, "vpc-")).toBe(true);
    });

    it("should have valid VPC CIDR", () => {
      expect(isCidr(outputs.vpc_cidr)).toBe(true);
      expect(outputs.vpc_cidr).toBe("10.0.0.0/16");
    });

    it("should have valid public subnet IDs", () => {
      const subnetIds: string[] = outputs.public_subnet_ids;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(2);
      subnetIds.forEach((id: string) => {
        expect(isAwsId(id, "subnet-")).toBe(true);
      });
    });

    it("should have valid private subnet IDs", () => {
      const subnetIds: string[] = outputs.private_subnet_ids;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(2);
      subnetIds.forEach((id: string) => {
        expect(isAwsId(id, "subnet-")).toBe(true);
      });
    });

    it("should have valid NAT gateway IDs", () => {
      const natIds: string[] = outputs.nat_gateway_ids;
      expect(Array.isArray(natIds)).toBe(true);
      expect(natIds.length).toBe(2);
      natIds.forEach((id: string) => {
        expect(isAwsId(id, "nat-")).toBe(true);
      });
    });
  });

  describe("Security Group Outputs", () => {
    it("should have valid EC2 security group ID", () => {
      expect(isAwsId(outputs.ec2_security_group_id, "sg-")).toBe(true);
    });

    it("should have valid ALB security group ID", () => {
      expect(isAwsId(outputs.alb_security_group_id, "sg-")).toBe(true);
    });

    it("should have valid RDS security group ID", () => {
      expect(isAwsId(outputs.rds_security_group_id, "sg-")).toBe(true);
    });

    it("should have different security group IDs", () => {
      const sgIds = [
        outputs.ec2_security_group_id,
        outputs.alb_security_group_id,
        outputs.rds_security_group_id
      ];
      const uniqueIds = new Set(sgIds);
      expect(uniqueIds.size).toBe(sgIds.length);
    });
  });

  describe("S3 and Storage Outputs", () => {
    it("should have valid S3 bucket name with resource suffix", () => {
      expect(outputs.s3_bucket_name).toMatch(/^proj-webapp-[a-z0-9]{8}-webapp-assets$/);
      expect(outputs.s3_bucket_name).toContain(outputs.resource_suffix);
    });

    it("should have valid S3 bucket ARN", () => {
      expect(isArn(outputs.s3_bucket_arn)).toBe(true);
      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.s3_bucket_arn).toContain(outputs.s3_bucket_name);
    });
  });

  describe("IAM and Identity Outputs", () => {
    it("should have valid EC2 IAM role ARN", () => {
      expect(isArn(outputs.ec2_iam_role_arn)).toBe(true);
      expect(outputs.ec2_iam_role_arn).toMatch(/^arn:aws:iam::/);
      expect(outputs.ec2_iam_role_arn).toMatch(/role\/proj-webapp-[a-z0-9]{8}-ec2-role$/);
    });
  });

  describe("Auto Scaling Outputs", () => {
    it("should have valid auto scaling group name", () => {
      expect(outputs.autoscaling_group_name).toMatch(/^proj-webapp-[a-z0-9]{8}-asg$/);
      expect(outputs.autoscaling_group_name).toContain(outputs.resource_suffix);
    });
  });

  describe("Resource Naming Consistency", () => {
    it("should have valid resource suffix", () => {
      expect(outputs.resource_suffix).toMatch(/^[a-z0-9]{8}$/);
    });

    it("should use resource suffix consistently across resources", () => {
      const suffix = outputs.resource_suffix;
      expect(outputs.s3_bucket_name).toContain(suffix);
      expect(outputs.autoscaling_group_name).toContain(suffix);
      expect(outputs.ec2_iam_role_arn).toContain(suffix);
    });
  });

  describe("Database Outputs (Sensitive)", () => {
    it("should have database endpoints in outputs for testing", () => {
      // Database endpoints are included in outputs for integration testing
      expect(outputs).toHaveProperty("database_endpoint");
      expect(isNonEmptyString(outputs.database_endpoint)).toBe(true);
      expect(outputs.database_endpoint).toMatch(/^proj-webapp-[a-z0-9]{8}-aurora-cluster\.cluster-.+\.us-east-1\.rds\.amazonaws\.com$/);
    });
  });

  describe("Regional Consistency", () => {
    it("should have resources in us-east-1 region", () => {
      // Check ARN regions
      expect(outputs.s3_bucket_arn).not.toMatch(/:us-east-1:/); // S3 ARNs don't have regions
      expect(outputs.ec2_iam_role_arn).not.toMatch(/:us-east-1:/); // IAM ARNs don't have regions
      
      // Check ELB DNS name region
      expect(outputs.load_balancer_dns_name).toMatch(/us-east-1/);
    });
  });

  describe("Infrastructure Completeness", () => {
    it("should have exactly 2 public subnets", () => {
      expect(outputs.public_subnet_ids.length).toBe(2);
    });

    it("should have exactly 2 private subnets", () => {
      expect(outputs.private_subnet_ids.length).toBe(2);
    });

    it("should have exactly 2 NAT gateways for HA", () => {
      expect(outputs.nat_gateway_ids.length).toBe(2);
    });

    it("should have unique subnet IDs", () => {
      const allSubnets = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(allSubnets.length);
    });
  });

  describe("Naming Convention Validation", () => {
    it("should follow proj-webapp-{suffix} naming pattern", () => {
      const suffix = outputs.resource_suffix;
      const expectedPattern = new RegExp(`^proj-webapp-${suffix}`);
      
      expect(outputs.s3_bucket_name).toMatch(expectedPattern);
      expect(outputs.autoscaling_group_name).toMatch(expectedPattern);
    });

    it("should have AWS resource IDs in correct format", () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]{8,}$/);
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[a-z0-9]{8,}$/);
      expect(outputs.alb_security_group_id).toMatch(/^sg-[a-z0-9]{8,}$/);
      expect(outputs.rds_security_group_id).toMatch(/^sg-[a-z0-9]{8,}$/);
      
      outputs.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-z0-9]{8,}$/);
      });
      
      outputs.private_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-z0-9]{8,}$/);
      });
      
      outputs.nat_gateway_ids.forEach((id: string) => {
        expect(id).toMatch(/^nat-[a-z0-9]{8,}$/);
      });
    });
  });

  describe("URL and Endpoint Validation", () => {
    it("should have accessible load balancer URL format", () => {
      const url = outputs.load_balancer_url;
      expect(url).toMatch(/^http:\/\/[a-zA-Z0-9\-]+-\d+\.us-east-1\.elb\.amazonaws\.com$/);
    });

    it("should have consistent DNS naming between URL and DNS name", () => {
      const url = outputs.load_balancer_url;
      const dnsName = outputs.load_balancer_dns_name;
      expect(url).toContain(dnsName);
    });
  });

  describe("Terraform State Consistency", () => {
    it("should have all outputs as strings or arrays", () => {
      Object.entries(outputs).forEach(([, value]) => {
        expect(typeof value === 'string' || Array.isArray(value)).toBe(true);
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            expect(typeof item).toBe('string');
          });
        }
      });
    });

    it("should not have null or undefined values", () => {
      Object.entries(outputs).forEach(([, value]) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            expect(item).not.toBeNull();
            expect(item).not.toBeUndefined();
          });
        }
      });
    });
  });
});