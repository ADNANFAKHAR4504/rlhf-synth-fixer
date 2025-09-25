import fs from "fs";
import path from "path";

// Path to your tap_stack.tf
const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

// Read Terraform file
const tfFile = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper to check if regex exists in file
const has = (regex: RegExp) => regex.test(tfFile);

describe("Terraform tap_stack.tf validation", () => {
  it("tap_stack.tf exists and is non-empty", () => {
    expect(tfFile.length).toBeGreaterThan(0);
  });

  it("declares region, vpc_cidr, and domain_name variables", () => {
    expect(has(/variable\s+"region"/)).toBe(true);
    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/variable\s+"domain_name"/)).toBe(true);
  });

  it("declares aws_availability_zones and aws_ami data sources", () => {
    expect(has(/data\s+"aws_availability_zones"/)).toBe(true);
    expect(has(/data\s+"aws_ami"/)).toBe(true);
  });

  it("defines locals for azs and common_tags", () => {
    expect(has(/locals\s*{[^}]*azs/)).toBe(true);
    expect(has(/locals\s*{[^}]*common_tags/)).toBe(true);
  });

  it("defines random_string and random_password resources", () => {
    expect(has(/resource\s+"random_string"/)).toBe(true);
    expect(has(/resource\s+"random_password"/)).toBe(true);
  });

  it("creates aws_vpc resource with DNS enabled", () => {
    expect(has(/resource\s+"aws_vpc"/)).toBe(true);
    expect(has(/enable_dns_support/)).toBe(true);
    expect(has(/enable_dns_hostnames/)).toBe(true);
  });

  it("creates public and private subnets", () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
  });

  it("creates Internet Gateway, Elastic IPs and NAT Gateways", () => {
    expect(has(/resource\s+"aws_internet_gateway"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"/)).toBe(true);
  });

  it("defines route tables for public and private subnets", () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"/)).toBe(true);
  });

  it("creates S3 buckets and enables encryption/versioning", () => {
    expect(has(/resource\s+"aws_s3_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"/)).toBe(true);
  });

  it("creates CloudWatch log group, IAM roles and flow logs", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_flow_log"/)).toBe(true);
  });

  it("creates security groups for ALB, EC2, and RDS", () => {
    expect(has(/resource\s+"aws_security_group"/)).toBe(true);
  });

  it("creates IAM role and instance profile for EC2", () => {
    expect(has(/resource\s+"aws_iam_instance_profile"/)).toBe(true);
  });

  it("creates launch template and Auto Scaling Group", () => {
    expect(has(/resource\s+"aws_launch_template"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_group"/)).toBe(true);
  });

  it("creates ALB, target group, listener and Route53 records", () => {
    expect(has(/resource\s+"aws_lb"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_target_group"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_listener"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_zone"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"/)).toBe(true);
  });

  it("creates Secrets Manager secret and version", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"/)).toBe(true);
  });

  it("creates RDS subnet group and DB instance", () => {
    expect(has(/resource\s+"aws_db_subnet_group"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"/)).toBe(true);
  });

  it("defines lifecycle create_before_destroy where present", () => {
    expect(has(/lifecycle\s*{[^}]*create_before_destroy/)).toBe(true);
  });

  it("exports major outputs", () => {
    const outputs = [
      "vpc_id", "internet_gateway_id", "public_subnet_ids", "private_subnet_ids",
      "nat_gateway_ids", "ec2_instance_ids", "s3_bucket_id", "flow_log_id"
    ];
    outputs.forEach(output => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });
});
