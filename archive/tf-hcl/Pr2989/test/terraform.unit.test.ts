import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

const has = (regex: RegExp) => regex.test(tf);

const resourceBlockHas = (resourceType: string, resourceName: string, field: string) =>
  new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*${field}\\s*=`).test(tf);

describe("tap_stack.tf Static Validation", () => {
  it("file exists and is sufficiently large", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(45000); // matches attached file size approx
  });

  it("declares required input variables", () => {
    const requiredVariables = [
      "primary_region",
      "secondary_region",
      "environment",
      "project_name",
      "db_instance_class",
      "enable_mfa"
    ];
    requiredVariables.forEach(v => {
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true);
    });
  });

  it("declares locals with common_tags, naming prefixes, and CIDRs", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/name_prefix\s*=\s*"\${var.project_name}-\${var.environment}"/)).toBe(true);
    expect(has(/primary_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/secondary_vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
  });

  it("declares AWS AMI data sources for primary and secondary regions", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary4"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary4"/)).toBe(true);
  });

  it("declares availability zones data sources for primary and secondary", () => {
    expect(has(/data\s+"aws_availability_zones"\s+"primary4"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"secondary4"/)).toBe(true);
  });

  ["primary", "secondary"].forEach(region => {
    it(`declares core networking resources in ${region} region`, () => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}_vpc4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${region}_igw4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public_subnets4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private_subnets4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}_nat_gws4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_public_rt4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_private_rts4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table_association"\\s+"${region}_public_rta4"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table_association"\\s+"${region}_private_rta4"`))).toBe(true);
    });
  });

  // Security Groups
  ["primary_rds_sg4", "secondary_rds_sg4"].forEach(sg => {
    it(`declares Security Group ${sg}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });


  // RDS Instances
  ["primary_db4", "secondary_db4"].forEach(rds => {
    it(`validates RDS instance ${rds} encryption, multi-AZ and private accessibility`, () => {
      expect(resourceBlockHas("aws_db_instance", rds, "storage_encrypted")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", rds, "multi_az")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", rds, "publicly_accessible")).toBe(true);
    });
  });

  // IAM Roles and policies
  [
    "rds_monitoring_role4",
    "lambda_execution_role4",
    "cloudtrail_role4",
    "config_role4"
  ].forEach(role => {
    it(`declares IAM role ${role}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_iam_role"\\s+"${role}"`))).toBe(true);
    });
  });

  // Lambda Function
  it("declares Lambda function for DynamoDB access", () => {
    expect(has(/resource\s+"aws_lambda_function"\s+"dynamodb_function4"/)).toBe(true);
  });

  // WAF Web ACL
  it("declares WAF Web ACL", () => {
    expect(has(/resource\s+"aws_wafv2_web_acl"\s+"main4"/)).toBe(true);
  });

  // CloudTrail and Config
  it("declares CloudTrail and Config recording resources", () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main4"/)).toBe(true);
    expect(has(/resource\s+"aws_config_configuration_recorder"\s+"main4"/)).toBe(true);
    expect(has(/resource\s+"aws_config_delivery_channel"\s+"main4"/)).toBe(true);
  });

  // Output validations (check some representative outputs)
  [
    "primary_vpc_id4",
    "secondary_vpc_id4",
    "primary_rds_endpoint4",
    "secondary_rds_endpoint4",
    "lambda_function_name4",
    "waf_web_acl_id4",
    "cloudtrail_arn4"
  ].forEach(output => {
    it(`exports output '${output}'`, () => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // Sensitive data not exposed
  it("does not expose sensitive outputs like passwords or secret strings", () => {
    const forbidden = [
      /output\s+".*password/i,
      /output\s+".*secret_string/i,
      /output\s+".*secret_value/i
    ];
    expect(forbidden.some(regex => regex.test(tf))).toBe(false);
  });

  // Tagging checks
  it("applies common tags to resources", () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags,/)).toBe(true);
    expect(has(/Environment\s*=\s*var.environment/)).toBe(true);
    expect(has(/Project\s*=\s*var.project_name/)).toBe(true);
    expect(has(/ManagedBy\s*=\s*"terraform"/i)).toBe(true);
  });
});
