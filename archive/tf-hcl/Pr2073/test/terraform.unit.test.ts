import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  // 1. File validity check
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // 2. Required input variables
  it("declares required input variables", () => {
    [
      "aws_region",
      "environment",
      "project_name",
      "instance_type"
    ].forEach(variable => {
      const found = has(new RegExp(`variable\\s+"${variable}"`));
      expect(found).toBe(true);
    });
  });

  // 3. Local values
  it("defines expected locals (common_tags, regions, resource_names)", () => {
    [
      "common_tags",
      "regions",
      "resource_names"
    ].forEach(local => {
      const foundLocal = has(new RegExp(`local\\.${local}\\s*=`)) || has(new RegExp(`${local}\\s*=`, "m"));
      expect(foundLocal).toBe(true);
    });
  });

  // 4. Data sources declarations
  it("declares data sources for AMIs and availability zones", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/,
      /data\s+"aws_availability_zones"\s+"primary"/,
      /data\s+"aws_availability_zones"\s+"secondary"/,
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 5. Random string resource
  it("defines random_string resource for bucket suffix", () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  // 6. IAM resources
  it("declares IAM roles, policies, attachments, and profile", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"s3_replication_policy"/,
      /resource\s+"aws_iam_role"\s+"s3_replication_role"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"s3_replication_policy_attachment"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 7. Primary and secondary VPC, subnets, gateways
  it("defines VPCs, subnets, internet gateways, and NAT gateways for both regions", () => {
    [
      /resource\s+"aws_vpc"\s+"primary"/,
      /resource\s+"aws_vpc"\s+"secondary"/,
      /resource\s+"aws_subnet"\s+"primary_public"/,
      /resource\s+"aws_subnet"\s+"primary_private"/,
      /resource\s+"aws_subnet"\s+"secondary_public"/,
      /resource\s+"aws_subnet"\s+"secondary_private"/,
      /resource\s+"aws_internet_gateway"\s+"primary"/,
      /resource\s+"aws_internet_gateway"\s+"secondary"/,
      /resource\s+"aws_eip"\s+"primary_nat"/,
      /resource\s+"aws_eip"\s+"secondary_nat"/,
      /resource\s+"aws_nat_gateway"\s+"primary"/,
      /resource\s+"aws_nat_gateway"\s+"secondary"/,
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 8. Route tables and associations
  it("defines route tables and associations for primary and secondary regions", () => {
    [
      /resource\s+"aws_route_table"\s+"primary_public"/,
      /resource\s+"aws_route_table"\s+"primary_private"/,
      /resource\s+"aws_route_table"\s+"secondary_public"/,
      /resource\s+"aws_route_table"\s+"secondary_private"/,
      /resource\s+"aws_route_table_association"\s+"primary_public"/,
      /resource\s+"aws_route_table_association"\s+"primary_private"/,
      /resource\s+"aws_route_table_association"\s+"secondary_public"/,
      /resource\s+"aws_route_table_association"\s+"secondary_private"/,
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 9. Security groups for primary and secondary
  it("defines security groups for primary and secondary region EC2 instances", () => {
    [
      /resource\s+"aws_security_group"\s+"primary"/,
      /resource\s+"aws_security_group"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 10. EC2 instances
  it("declares EC2 instances for primary and secondary", () => {
    [
      /resource\s+"aws_instance"\s+"primary"/,
      /resource\s+"aws_instance"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 11. S3 buckets and related resources
  it("declares S3 buckets, versioning, encryption, public access block, and replication", () => {
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
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 12. Outputs
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
    ].forEach(output => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // 13. Sensitive outputs check
  it("does not output sensitive information", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
