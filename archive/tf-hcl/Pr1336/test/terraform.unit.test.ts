import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

// Load the Terraform file once
const tf = fs.readFileSync(TAP_STACK_TF, 'utf8');

// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe('tap_stack.tf static structure', () => {
  it('exists and has sufficient content', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(500);
  });

  it('declares AWS region variable', () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-west-2"/)).toBe(true);
  });

  it('declares environments variable with dev, staging, production', () => {
    expect(has(/variable\s+"environments"/)).toBe(true);
    expect(has(/dev\s*=\s*{/)).toBe(true);
    expect(has(/staging\s*=\s*{/)).toBe(true);
    expect(has(/production\s*=\s*{/)).toBe(true);
  });

  it('defines VPC resources for each environment', () => {
    expect(has(/resource\s+"aws_vpc"\s+"environment_vpc"/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  it('creates public subnets in each environment', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public_subnets"/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it('creates private subnets in each environment', () => {
    expect(has(/resource\s+"aws_subnet"\s+"private_subnets"/)).toBe(true);
  });

  it('creates Internet Gateway for each environment', () => {
    expect(has(/resource\s+"aws_internet_gateway"/)).toBe(true);
  });

  it('creates NAT Gateway for each environment', () => {
    expect(has(/resource\s+"aws_nat_gateway"/)).toBe(true);
  });

  it('creates public and private route tables and associates them', () => {
    expect(has(/resource\s+"aws_route_table"\s+"public_rt"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private_rt"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public_rta"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private_rta"/)).toBe(true);
  });

  it('defines network ACLs to isolate environments', () => {
    expect(has(/resource\s+"aws_network_acl"\s+"environment_nacl"/)).toBe(true);
    expect(has(/action\s*=\s*"deny"/)).toBe(true); // Deny cross-env
  });

  it('defines security group for web servers', () => {
    expect(has(/resource\s+"aws_security_group"\s+"web_sg"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);
    expect(has(/from_port\s*=\s*22/)).toBe(true);
  });

  it('defines IAM roles, policies, and instance profiles for EC2', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"/)).toBe(true);
  });

  it('defines EC2 instances with correct instance types and subnets', () => {
    expect(has(/resource\s+"aws_instance"\s+"web_servers"/)).toBe(true);
    expect(has(/instance_type\s*=\s*each.value.instance_type/)).toBe(true);
    expect(has(/subnet_id\s*=\s*aws_subnet.public_subnets/)).toBe(true);
    expect(has(/iam_instance_profile\s*=\s*aws_iam_instance_profile.ec2_profile/)).toBe(true);
  });

  it('applies common tags to all resources', () => {
    expect(has(/tags\s*=\s*merge\(var\.common_tags/)).toBe(true);
  });

  it('defines outputs for VPCs, subnets, EC2, SGs, NAT, IGW', () => {
    expect(has(/output\s+"vpc_ids"/)).toBe(true);
    expect(has(/output\s+"public_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"private_subnet_ids"/)).toBe(true);
    expect(has(/output\s+"ec2_instance_ids"/)).toBe(true);
    expect(has(/output\s+"security_group_ids"/)).toBe(true);
    expect(has(/output\s+"nat_gateway_ids"/)).toBe(true);
    expect(has(/output\s+"internet_gateway_ids"/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
