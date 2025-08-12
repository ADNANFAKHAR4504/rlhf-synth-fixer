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
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"[\s\S]*?most_recent\s*=\s*true/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"[\s\S]*?owners\s*=\s*\[\s*"amazon"\s*\]/)).toBe(true);
    expect(has(/filter\s*{[\s\S]*?name\s*=\s*"name"[\s\S]*?values\s*=\s*\[\s*"amzn2-ami-hvm-.*-x86_64-gp2"\s*\][\s\S]*?}/)).toBe(true);
  });

  it('creates TLS private key and AWS key pair referencing it', () => {
    expect(has(/resource\s+"tls_private_key"\s+"bastion_key"[\s\S]*?algorithm\s*=\s*"RSA"[\s\S]*?rsa_bits\s*=\s*4096/)).toBe(true);
    expect(has(new RegExp(`resource\\s+"aws_key_pair"\\s+"bastion_key_pair"[\\s\\S]*?public_key\\s*=\\s*tls_private_key\\.bastion_key\\.public_key_openssh`))).toBe(true);
  });

  it('creates VPC with DNS support/hostnames', () => {
    expect(has(/resource\s+"aws_vpc"\s+"project_vpc"[\s\S]*?cidr_block\s*=\s*var\.vpc_cidr/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  it('creates IGW and attaches to VPC', () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"project_igw"[\s\S]*?vpc_id\s*=\s*aws_vpc\.project_vpc\.id/)).toBe(true);
  });

  it('creates two public subnets with map_public_ip_on_launch=true', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public_subnets"[\s\S]*?count\s*=\s*length\(var\.public_subnet_cidrs\)/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it('creates two private subnets with map_public_ip_on_launch=false', () => {
    expect(has(/resource\s+"aws_subnet"\s+"private_subnets"[\s\S]*?count\s*=\s*length\(var\.private_subnet_cidrs\)/)).toBe(true);
    expect(has(/map_public_ip_on_launch\s*=\s*false/)).toBe(true);
  });

  it('public RT + default route to IGW + associations for all public subnets', () => {
    expect(has(/resource\s+"aws_route_table"\s+"public_rt"[\s\S]*?vpc_id\s*=\s*aws_vpc\.project_vpc\.id/)).toBe(true);
    expect(has(/resource\s+"aws_route"\s+"public_internet_access"[\s\S]*?destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.project_igw\.id/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public_associations"[\s\S]*?count\s*=\s*length\(aws_subnet\.public_subnets\)/)).toBe(true);
  });

  it('bastion SG allows SSH from anywhere (IPv4+IPv6) and egress all', () => {
    expect(has(/resource\s+"aws_security_group"\s+"bastion_sg"[\s\S]*?vpc_id\s*=\s*aws_vpc\.project_vpc\.id/)).toBe(true);
    expect(has(/ingress[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?protocol\s*=\s*"tcp"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][\s\S]*?ipv6_cidr_blocks\s*=\s*\[\s*"::\/0"\s*\]/)).toBe(true);
    expect(has(/egress[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][\s\S]*?ipv6_cidr_blocks\s*=\s*\[\s*"::\/0"\s*\]/)).toBe(true);
  });

  it('private SG allows SSH only from bastion SG; egress all', () => {
    expect(has(/resource\s+"aws_security_group"\s+"private_sg"[\s\S]*?vpc_id\s*=\s*aws_vpc\.project_vpc\.id/)).toBe(true);
    expect(has(new RegExp(`ingress[\\s\\S]*?from_port\\s*=\\s*22[\\s\\S]*?to_port\\s*=\\s*22[\\s\\S]*?protocol\\s*=\\s*"tcp"[\\s\\S]*?security_groups\\s*=\\s*\\[\\s*aws_security_group\\.bastion_sg\\.id\\s*\\]`))).toBe(true);
    expect(has(/egress[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/)).toBe(true);
  });

  it('private instances: count per private subnets, no public IP, right SG and key', () => {
    expect(has(/resource\s+"aws_instance"\s+"private_instances"/)).toBe(true);
    expect(has(/count\s*=\s*length\(aws_subnet\.private_subnets\)/)).toBe(true);
    expect(has(/subnet_id\s*=\s*aws_subnet\.private_subnets\[count\.index]\.id/)).toBe(true);
    expect(has(/associate_public_ip_address\s*=\s*false/)).toBe(true);
    expect(has(new RegExp(`vpc_security_group_ids\\s*=\\s*\\[\\s*aws_security_group\\.private_sg\\.id\\s*\\]`))).toBe(true);
    expect(has(new RegExp(`key_name\\s*=\\s*aws_key_pair\\.bastion_key_pair\\.key_name`))).toBe(true);
  });

  it('declares required outputs including sensitive key', () => {
    const outputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'bastion_public_ip',
      'private_instance_ids',
      'bastion_private_key_pem'
    ];
    outputs.forEach(o => {
      expect(has(new RegExp(`output\\s+"${s(o)}"`))).toBe(true);
    });
    expect(has(/output\s+"bastion_private_key_pem"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
