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

  // Variables
  it('declares required input variables', () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/variable\s+"primary_region"/)).toBe(true);
    expect(has(/variable\s+"secondary_region"/)).toBe(true);
    expect(has(/variable\s+"primary_vpc_cidr"/)).toBe(true);
    expect(has(/variable\s+"secondary_vpc_cidr"/)).toBe(true);
    expect(has(/variable\s+"instance_type"/)).toBe(true);
    expect(has(/variable\s+"domain_name"/)).toBe(true);
    expect(has(/variable\s+"subdomain"/)).toBe(true);
  });

  // Locals
  it("defines locals for AZs, subnets, and tags", () => {
    expect(has(/locals\s*{/)).toBe(true);
    expect(has(/common_tags\s*=/)).toBe(true);
    expect(has(/primary_azs\s*=/)).toBe(true);
    expect(has(/secondary_azs\s*=/)).toBe(true);
  });

  // Data source aws_ami
  it("uses aws_ami data source for Amazon Linux 2 in both regions", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });

  // VPCs
  it("creates VPC for primary and secondary regions", () => {
    expect(has(/resource\s+"aws_vpc"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_vpc"\s+"secondary"/)).toBe(true);
  });

  // Subnets: public and private (primary and secondary)
  it("creates public and private subnets for both regions", () => {
    expect(has(/resource\s+"aws_subnet"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"primary_private"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"secondary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"secondary_private"/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  // NAT Gateway and EIP
  it("creates NAT Gateways and Elastic IPs for both regions", () => {
    expect(has(/resource\s+"aws_nat_gateway"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"primary_nat"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"secondary_nat"/)).toBe(true);
  });

  // Route tables and associations
  it("creates route tables and associates them with subnets", () => {
    expect(has(/resource\s+"aws_route_table"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"primary_private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"secondary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"secondary_private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"primary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"primary_private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"secondary_public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"secondary_private"/)).toBe(true);
  });

  // VPC Peering Connection
  it("creates vpc peering connection and accepter", () => {
    expect(has(/resource\s+"aws_vpc_peering_connection"/)).toBe(true);
    expect(has(/resource\s+"aws_vpc_peering_connection_accepter"/)).toBe(true);
  });

  // Security Groups for EC2; best practice rules
  it("defines EC2 security groups for both regions", () => {
    expect(has(/resource\s+"aws_security_group"\s+"primary_ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"secondary_ec2"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);
    expect(has(/from_port\s*=\s*22/)).toBe(true);
    expect(has(/from_port\s*=\s*-1/)).toBe(true); // ICMP
  });

  // IAM Roles and CloudWatch monitoring for EC2
  it("defines EC2 IAM roles, policies, attachments, and profiles", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"ec2_cloudwatch_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch_attach"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
  });

  // KMS CMKs for encryption
  it("creates KMS keys and aliases for both regions", () => {
    expect(has(/resource\s+"aws_kms_key"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"secondary"/)).toBe(true);
  });

  // S3 Buckets & Replication
  it("creates S3 buckets and cross-region replication configuration", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"/)).toBe(true);
    expect(has(/replica_kms_key_id/)).toBe(true);
  });

  // EC2 Instances and Elastic IPs
  it("defines EC2 instances and associates Elastic IPs", () => {
    expect(has(/resource\s+"aws_instance"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_instance"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"primary_ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"secondary_ec2"/)).toBe(true);
  });

  // Route53 Hosted Zones and Failover DNS
  it("creates Route53 Hosted Zones and failover records", () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_zone"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"primary_failover"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"secondary_failover"/)).toBe(true);
    expect(has(/failover_routing_policy/)).toBe(true);
  });

  // Outputs are present and not leaking sensitive info
  it("declares outputs for VPCs, Subnets, EC2s, Peering, DNS, without credentials", () => {
    expect(has(/output\s+"primary_vpc_id"/)).toBe(true);
    expect(has(/output\s+"secondary_vpc_id"/)).toBe(true);
    expect(has(/output\s+"primary_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"secondary_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"primary_ec2_instance"/)).toBe(true);
    expect(has(/output\s+"secondary_ec2_instance"/)).toBe(true);
    expect(has(/output\s+"vpc_peering_id"/)).toBe(true);
    expect(has(/output\s+"primary_route53_zone_id"/)).toBe(true);
    expect(has(/output\s+"secondary_route53_zone_id"/)).toBe(true);
    expect(has(/output\s+"route53_record"/)).toBe(true);
    expect(has(/^.*aws_access_key_id.*$/m)).toBe(false);
    expect(has(/^.*aws_secret_access_key.*$/m)).toBe(false);
  });
});
