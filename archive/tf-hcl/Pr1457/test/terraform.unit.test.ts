import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");

// Read the whole terraform file content
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper function to test regex presence
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  it("file exists and has content over 500 chars", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(500);
  });

  // Variables check
  it("declares aws_region variable with default 'us-west-2'", () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-west-2"/)).toBe(true);
  });

  it("declares environments variable with staging and production", () => {
    expect(has(/variable\s+"environments"/)).toBe(true);
    expect(has(/staging\s*=\s*{/)).toBe(true);
    expect(has(/production\s*=\s*{/)).toBe(true);
  });

  it("declares common_tags variable", () => {
    expect(has(/variable\s+"common_tags"/)).toBe(true);
  });

  it("declares db_username and db_password variables", () => {
    expect(has(/variable\s+"db_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"db_password"/)).toBe(true);
  });

  // Locals presence
  it("defines locals block with availability_zones and common_tags", () => {
    expect(has(/locals\s*{/)).toBe(true);
    expect(has(/availability_zones\s*=/)).toBe(true);
    expect(has(/common_tags\s*=/)).toBe(true);
  });

  // Data source aws_ami
  it("defines aws_ami data source for Amazon Linux 2", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
  });

  // VPC Resource
  it("creates aws_vpc resource for each environment", () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  // Internet Gateway Resource
  it("creates aws_internet_gateway resource for each environment", () => {
    expect(has(/resource\s+"aws_internet_gateway"/)).toBe(true);
  });

  // Subnets - public and private
  it("creates public subnets with map_public_ip_on_launch", () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it("creates private subnets", () => {
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
  });

  // NAT Gateway and EIP
  it("creates aws_eip and aws_nat_gateway resources", () => {
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"/)).toBe(true);
  });

  // Route tables and associations
  it("creates public and private route tables and associates them with subnets", () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  // VPC Peering Connection & Routes
  it("creates aws_vpc_peering_connection and peering routes", () => {
    expect(has(/resource\s+"aws_vpc_peering_connection"/)).toBe(true);
    expect(has(/resource\s+"aws_route"\s+"staging_to_production_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route"\s+"production_to_staging_public"/)).toBe(true);
  });

  // Security Groups - EC2, ELB, RDS
  it("defines security groups for EC2 HTTPS, ELB HTTPS, and RDS", () => {
    expect(has(/resource\s+"aws_security_group"\s+"ec2_https"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"elb_https"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true); // Check HTTPS port open in SG
    expect(has(/from_port\s*=\s*22/)).toBe(true);  // SSH port in EC2 SG
  });

  // IAM Roles, Policies, Attachments, Profiles
  it("defines IAM role, policies, role policy attachments, and instance profile for EC2", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"/)).toBe(true);
  });

  // EC2 Instances configuration
  it("defines aws_instance with correct instance_type, subnet, and IAM profile", () => {
    expect(has(/resource\s+"aws_instance"\s+"web"/)).toBe(true);
    expect(has(/instance_type\s*=\s*var\.environments\[each\.value\.environment\]\.instance_type/)).toBe(true);
    expect(has(/subnet_id\s*=\s*aws_subnet\.private/)).toBe(true);
    expect(has(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile/)).toBe(true);
  });

  // ALB and Target Groups
  it("defines aws_lb and aws_lb_target_group with HTTPS settings", () => {
    expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTPS"/)).toBe(true);
  });

  // RDS Subnet Group and Instance
  it("defines aws_db_subnet_group and aws_db_instance for PostgreSQL", () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"postgres"/)).toBe(true);
    expect(has(/engine\s*=\s*"postgres"/)).toBe(true);
  });

  // CloudWatch Log Groups and Alarms
  it("defines CloudWatch log groups for EC2 and ALB", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"ec2_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"alb_logs"/)).toBe(true);
  });
  it("defines CloudWatch metric alarms for EC2, RDS, and ALB", () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_target_health"/)).toBe(true);
  });

  // Common tagging applied
  it("applies common tags merged with environment tags across resources", () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
  });

  // Outputs validity
  it("defines required outputs for VPCs, subnets, EC2, ALBs, RDS, peering", () => {
    expect(has(/output\s+"vpc_ids"/)).toBe(true);
    expect(has(/output\s+"public_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"private_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_ids"/)).toBe(true);
    expect(has(/output\s+"alb_dns_names"/)).toBe(true);
    expect(has(/output\s+"vpc_peering_connection_id"/)).toBe(true);
    expect(has(/output\s+"rds_endpoints"/)).toBe(true);
  });

  // AWS credential exposure check
  it("does not contain AWS access keys in the file", () => {
    expect(has(/^\s*aws_access_key_id\s*=/m)).toBe(false);
    expect(has(/^\s*aws_secret_access_key\s*=/m)).toBe(false);
  });
});
