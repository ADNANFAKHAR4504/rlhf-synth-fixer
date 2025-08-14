import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');

const file = () => fs.readFileSync(MAIN_TF, 'utf8');
const has = (re: RegExp) => re.test(file());

const s = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('main.tf static structure', () => {
  it('exists and has content', () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
    expect(file().length).toBeGreaterThan(200);
  });

  it('has aws_ami data source for Amazon Linux 2 (most recent, owner amazon)', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"[\s\S]*?most_recent\s*=\s*true/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"[\s\S]*?owners\s*=\s*\[\s*"amazon"\s*\]/)).toBe(true);
    expect(has(/filter\s*{[\s\S]*?name\s*=\s*"name"[\s\S]*?values\s*=\s*\[\s*"amzn2-ami-hvm-.*-x86_64-gp2"\s*\][\s\S]*?}/)).toBe(true);
  });

  it('creates TLS private key conditionally and AWS key pair with fallback logic', () => {
    // Check for locals block that determines key usage
    expect(has(/locals\s*{[\s\S]*?ssh_key_path\s*=\s*"~\/\.ssh\/id_rsa\.pub"[\s\S]*?use_existing_key\s*=\s*fileexists\(pathexpand\(local\.ssh_key_path\)\)[\s\S]*?}/)).toBe(true);
    
    // Check conditional TLS private key resource
    expect(has(/resource\s+"tls_private_key"\s+"main"[\s\S]*?count\s*=\s*local\.use_existing_key\s*\?\s*0\s*:\s*1[\s\S]*?algorithm\s*=\s*"RSA"[\s\S]*?rsa_bits\s*=\s*4096/)).toBe(true);
    
    // Check AWS key pair with conditional public key
    expect(has(/resource\s+"aws_key_pair"\s+"main"[\s\S]*?public_key\s*=\s*local\.use_existing_key\s*\?\s*file\(pathexpand\(local\.ssh_key_path\)\)\s*:\s*tls_private_key\.main\[0\]\.public_key_openssh/)).toBe(true);
  });

  it('creates VPC with DNS support/hostnames', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  it('creates IGW and attaches to VPC', () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
  });

  it('creates two public subnets with map_public_ip_on_launch=true', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*2/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it('creates two private subnets for RDS', () => {
    expect(has(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*2/)).toBe(true);
  });

  it('public RT + default route to IGW + associations for all public subnets', () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    expect(has(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id[\s\S]*?}/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"[\s\S]*?count\s*=\s*length\(aws_subnet\.public\)/)).toBe(true);
  });

  it('EC2 SG allows SSH from specific IP, HTTP/HTTPS from world, and egress all', () => {
    expect(has(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?cidr_blocks\s*=\s*\[\s*var\.my_ip_address\s*\]/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/)).toBe(true);
    expect(has(/egress[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/)).toBe(true);
  });

  it('RDS SG allows MySQL access only from EC2 SG; egress all', () => {
    expect(has(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    expect(has(new RegExp(`ingress[\\s\\S]*?from_port\\s*=\\s*3306[\\s\\S]*?to_port\\s*=\\s*3306[\\s\\S]*?protocol\\s*=\\s*"tcp"[\\s\\S]*?security_groups\\s*=\\s*\\[\\s*aws_security_group\\.ec2\\.id\\s*\\]`))).toBe(true);
    expect(has(/egress[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/)).toBe(true);
  });

  it('creates RDS MySQL instance with proper configuration', () => {
    expect(has(/resource\s+"aws_db_instance"\s+"mysql"/)).toBe(true);
    expect(has(/engine\s*=\s*"mysql"/)).toBe(true);
    expect(has(/engine_version\s*=\s*"8\.0"/)).toBe(true);
    expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    expect(has(/allocated_storage\s*=\s*20/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
  });

  it('creates EC2 instance with proper configuration', () => {
    expect(has(/resource\s+"aws_instance"\s+"main"/)).toBe(true);
    expect(has(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/)).toBe(true);
    expect(has(/instance_type\s*=\s*var\.instance_type/)).toBe(true);
    expect(has(/key_name\s*=\s*aws_key_pair\.main\.key_name/)).toBe(true);
    expect(has(/associate_public_ip_address\s*=\s*true/)).toBe(true);
  });

  it('creates S3 bucket for Terraform state with proper security', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"terraform_state"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"terraform_state"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"terraform_state"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"terraform_state"/)).toBe(true);
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
    expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
  });

  it('declares required outputs including sensitive key', () => {
    const outputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'ec2_instance_id',
      'ec2_public_ip',
      'ec2_public_dns',
      'rds_endpoint',
      'rds_port',
      's3_bucket_name',
      'private_key_pem'
    ];
    outputs.forEach(o => {
      expect(has(new RegExp(`output\\s+"${s(o)}"`))).toBe(true);
    });
    expect(has(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    expect(has(/output\s+"private_key_pem"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  it('declares required variables with proper types and defaults', () => {
    expect(has(/variable\s+"aws_region"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(/variable\s+"environment"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"dev"/)).toBe(true);
    expect(has(/variable\s+"project_name"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"foundational-env"/)).toBe(true);
    expect(has(/variable\s+"instance_type"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"t3\.micro"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    expect(has(/variable\s+"db_username"[\s\S]*?type\s*=\s*string[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    expect(has(/variable\s+"db_password"[\s\S]*?type\s*=\s*string[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
    expect(has(/variable\s+"my_ip_address"[\s\S]*?type\s*=\s*string/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
