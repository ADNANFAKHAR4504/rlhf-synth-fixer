import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");

// Load the Terraform file once
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static structure", () => {
  it("exists and is sufficiently large", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000); // Tap stack file is big!
  });

  it("declares required variables", () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/variable\s+"instance_type"/)).toBe(true);
    expect(has(/variable\s+"cost_center"/)).toBe(true);
    expect(has(/variable\s+"environment"/)).toBe(true);
    expect(has(/variable\s+"project"/)).toBe(true);
  });

  it("defines locals for tags and network setup", () => {
    expect(has(/locals\s*{/)).toBe(true);
    expect(has(/common_tags\s*=/)).toBe(true);
    expect(has(/availability_zones\s*=/)).toBe(true);
    expect(has(/public_subnet_cidrs\s*=/)).toBe(true);
    expect(has(/private_subnet_cidrs\s*=/)).toBe(true);
  });

  it("references data source for Amazon Linux 2 AMI", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"/)).toBe(true);
    expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
    expect(has(/values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/)).toBe(true);
  });

  it("defines VPC, IGW, and subnets", () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
  });

  it("sets up NAT gateway and EIP resources", () => {
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
  });

  it("creates route tables and associations", () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  it("has security group for EC2 with correct ingress/egress", () => {
    expect(has(/resource\s+"aws_security_group"\s+"ec2_sg"/)).toBe(true);
    expect(has(/ingress\s*{[^}]*from_port\s*=\s*22/)).toBe(true);
    expect(has(/ingress\s*{[^}]*from_port\s*=\s*80/)).toBe(true);
    expect(has(/ingress\s*{[^}]*from_port\s*=\s*443/)).toBe(true);
    expect(has(/egress\s*{[^}]*protocol\s*=\s*"-1"/)).toBe(true);
  });

  it("defines IAM roles, policies, and instance profiles", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
  });

  it("creates private EC2 instances with required settings", () => {
    expect(has(/resource\s+"aws_instance"\s+"private_instances"/)).toBe(true);
    expect(has(/subnet_id\s*=\s*aws_subnet\.private\[count\.index % 2\]\.id/)).toBe(true);
    expect(has(/vpc_security_group_ids\s*=/)).toBe(true);
    expect(has(/instance_type\s*=\s*var\.instance_type/)).toBe(true);
    expect(has(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/)).toBe(true);
    expect(has(/iam_instance_profile\s*=/)).toBe(true);
    expect(has(/user_data\s*=/)).toBe(true);
    expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
    expect(has(/encrypted\s*=\s*true/)).toBe(true);
  });

  it("defines random string for S3 bucket suffix", () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  it("defines application S3 bucket with standards", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"tap_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"/)).toBe(true);
    expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"/)).toBe(true);
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
    expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
  });

  it("exports output values for all core resources", () => {
    expect(has(/output\s+"vpc_id"/)).toBe(true);
    expect(has(/output\s+"public_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"private_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"internet_gateway_id"/)).toBe(true);
    expect(has(/output\s+"nat_gateway_ids"/)).toBe(true);
    expect(has(/output\s+"nat_gateway_eip_addresses"/)).toBe(true);
    expect(has(/output\s+"public_route_table_id"/)).toBe(true);
    expect(has(/output\s+"private_route_table_ids"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_ids"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_private_ips"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_availability_zones"/)).toBe(true);
    expect(has(/output\s+"amazon_linux_2_ami_id"/)).toBe(true);
    expect(has(/output\s+"amazon_linux_2_ami_name"/)).toBe(true);
    expect(has(/output\s+"ec2_security_group_id"/)).toBe(true);
    expect(has(/output\s+"ec2_iam_role_arn"/)).toBe(true);
    expect(has(/output\s+"ec2_iam_role_name"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_profile_name"/)).toBe(true);
    expect(has(/output\s+"s3_bucket_id"/)).toBe(true);
    expect(has(/output\s+"s3_bucket_arn"/)).toBe(true);
    expect(has(/output\s+"s3_bucket_domain_name"/)).toBe(true);
    expect(has(/output\s+"deployment_region"/)).toBe(true);
    expect(has(/output\s+"availability_zones"/)).toBe(true);
  });

  it("uses tags via merge(local.common_tags) on resources", () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
  });

  it("does not contain hardcoded AWS credentials", () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
