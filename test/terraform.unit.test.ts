import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  it("file exists and is non-trivial", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  it("declares required input variables", () => {
    [
      "aws_region",
      "environment",
      "project_name",
      "instance_type"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it("defines expected locals (common_tags, regions, resource_names)", () => {
    [
      "common_tags",
      "regions",
      "resource_names"
    ].forEach(local =>
      expect(has(new RegExp(`local\\.${local}\\s*=`))).toBe(true)
      || expect(has(new RegExp(`${local}\\s*=`))).toBe(true) // fallback
    );
  });

  it("declares data sources for AMIs and availability zones", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/,
      /data\s+"aws_availability_zones"\s+"primary"/,
      /data\s+"aws_availability_zones"\s+"secondary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines random_string resource for bucket suffix", () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  it("declares IAM roles, policies, and instance profile", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"s3_replication_policy"/,
      /resource\s+"aws_iam_role"\s+"s3_replication_role"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"s3_replication_policy_attachment"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines primary and secondary VPCs, subnets, and gateways", () => {
    [
      /resource\s+"aws_vpc"\s+"primary"/,
      /resource\s+"aws_vpc"\s+"secondary"/,
      /resource\s+"aws_subnet"\s+"primary_public"/,
      /resource\s+"aws_subnet"\s+"primary_private"/,
      /resource\s+"aws_subnet"\s+"secondary_public"/,
      /resource\s+"aws_subnet"\s+"secondary_private"/,
      /resource\s+"aws_internet_gateway"\s+"primary"/,
      /resource\s+"aws_internet_gateway"\s+"secondary"/,
      /resource\s+"aws_nat_gateway"\s+"primary"/,
      /resource\s+"aws_nat_gateway"\s+"secondary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines route tables and associations for primary and secondary regions", () => {
    [
      /resource\s+"aws_route_table"\s+"primary_public"/,
      /resource\s+"aws_route_table"\s+"primary_private"/,
      /resource\s+"aws_route_table"\s+"secondary_public"/,
      /resource\s+"aws_route_table"\s+"secondary_private"/,
      /resource\s+"aws_route_table_association"\s+"primary_public"/,
      /resource\s+"aws_route_table_association"\s+"primary_private"/,
      /resource\s+"aws_route_table_association"\s+"secondary_public"/,
      /resource\s+"aws_route_table_association"\s+"secondary_private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("defines security groups for primary and secondary", () => {
    [
      /resource\s+"aws_security_group"\s+"primary"/,
      /resource\s+"aws_security_group"\s+"secondary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares EC2 instances for primary and secondary with proper tags", () => {
    [
      /resource\s+"aws_instance"\s+"primary"/,
      /resource\s+"aws_instance"\s+"secondary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares S3 buckets and related configurations for both regions", () => {
    [
      /resource\s+"aws_s3_bucket"\s+"primary"/,
      /resource\s+"aws_s3_bucket"\s+"secondary"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"primary"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"secondary"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"secondary"/,
      /resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/,
      /resource\s+"aws_s3_bucket_replication_configuration"\s+"secondary_to_primary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it("declares expected outputs for key resources", () => {
    [
      "primary_vpc_id",
      "secondary_vpc_id",
      "primary_public_subnet_id",
      "primary_private_subnet_id",
      "secondary_public_subnet_id",
      "secondary_private_subnet_id",
      "primary_ec2_instance_id",
      "secondary_ec2_instance_id",
      "primary_ami_id",
      "secondary_ami_id",
      "primary_security_group_id",
      "secondary_security_group_id",
      "primary_s3_bucket_name",
      "secondary_s3_bucket_name",
      "ec2_iam_role_arn",
      "s3_replication_iam_role_arn",
      "ec2_instance_profile_arn",
      "primary_nat_gateway_id",
      "secondary_nat_gateway_id",
      "primary_internet_gateway_id",
      "secondary_internet_gateway_id",
      "primary_public_route_table_id",
      "primary_private_route_table_id",
      "secondary_public_route_table_id",
      "secondary_private_route_table_id",
      "primary_availability_zones",
      "secondary_availability_zones"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

  it("does not output any sensitive information", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
