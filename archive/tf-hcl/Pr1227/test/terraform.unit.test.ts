import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

const file = (filePath: string) => fs.readFileSync(filePath, 'utf8');
const has = (content: string, re: RegExp) => re.test(content);

const s = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('Terraform Configuration Structure', () => {
  it('main.tf exists and has content', () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
    expect(file(MAIN_TF).length).toBeGreaterThan(500);
  });

  it('provider.tf exists and has content', () => {
    expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    expect(file(PROVIDER_TF).length).toBeGreaterThan(50);
  });

  it('has project_name variable with default value', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"project_name"[\s\S]*?default\s*=\s*"myproject"/)).toBe(true);
  });

  it('has environment variable with default value', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"environment"[\s\S]*?default\s*=\s*"dev"/)).toBe(true);
  });

  it('has vpc_cidr_blocks variable with map type', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"vpc_cidr_blocks"[\s\S]*?type\s*=\s*map\(string\)/)).toBe(true);
  });

  it('has public_subnet_cidrs variable with map of list type', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"public_subnet_cidrs"[\s\S]*?type\s*=\s*map\(list\(string\)\)/)).toBe(true);
  });

  it('has private_subnet_cidrs variable with map of list type', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"private_subnet_cidrs"[\s\S]*?type\s*=\s*map\(list\(string\)\)/)).toBe(true);
  });

  it('has regions variable with list type', () => {
    const content = file(MAIN_TF);
    expect(has(content, /variable\s+"regions"[\s\S]*?type\s*=\s*list\(string\)/)).toBe(true);
  });

  it('has AWS provider aliases for us-east-2 and us-west-2', () => {
    const content = file(PROVIDER_TF);
    expect(has(content, /provider\s+"aws"\s*\{\s*alias\s*=\s*"us_east_2"[\s\S]*?region\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(content, /provider\s+"aws"\s*\{\s*alias\s*=\s*"us_west_2"[\s\S]*?region\s*=\s*"us-west-2"/)).toBe(true);
  });

  it('has VPC resources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_vpc"\s+"us_east_2"[\s\S]*?provider\s*=\s*aws\.us_east_2/)).toBe(true);
    expect(has(content, /resource\s+"aws_vpc"\s+"us_west_2"[\s\S]*?provider\s*=\s*aws\.us_west_2/)).toBe(true);
  });

  it('has Internet Gateway resources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_internet_gateway"\s+"us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_internet_gateway"\s+"us_west_2"/)).toBe(true);
  });

  it('has public and private subnet resources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_subnet"\s+"public_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_subnet"\s+"private_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_subnet"\s+"public_us_west_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_subnet"\s+"private_us_west_2"/)).toBe(true);
  });

  it('has route table resources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_route_table"\s+"public_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table"\s+"private_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table"\s+"public_us_west_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table"\s+"private_us_west_2"/)).toBe(true);
  });

  it('has NAT Gateway resources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_nat_gateway"\s+"us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_nat_gateway"\s+"us_west_2"/)).toBe(true);
  });

  it('has Elastic IP resources for NAT Gateways', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_eip"\s+"nat_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_eip"\s+"nat_us_west_2"/)).toBe(true);
  });

  it('has route table associations for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /resource\s+"aws_route_table_association"\s+"public_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table_association"\s+"private_us_east_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table_association"\s+"public_us_west_2"/)).toBe(true);
    expect(has(content, /resource\s+"aws_route_table_association"\s+"private_us_west_2"/)).toBe(true);
  });

  it('has outputs for us-east-2 infrastructure', () => {
    const content = file(MAIN_TF);
    expect(has(content, /output\s+"us_east_2_infrastructure"[\s\S]*?description\s*=\s*"Infrastructure details for us-east-2 region"/)).toBe(true);
    expect(has(content, /output\s+"us_east_2_vpc_id"/)).toBe(true);
    expect(has(content, /output\s+"us_east_2_internet_gateway_id"/)).toBe(true);
    expect(has(content, /output\s+"us_east_2_public_subnet_ids"/)).toBe(true);
    expect(has(content, /output\s+"us_east_2_private_subnet_ids"/)).toBe(true);
  });

  it('has outputs for us-west-2 infrastructure', () => {
    const content = file(MAIN_TF);
    expect(has(content, /output\s+"us_west_2_infrastructure"[\s\S]*?description\s*=\s*"Infrastructure details for us-west-2 region"/)).toBe(true);
    expect(has(content, /output\s+"us_west_2_vpc_id"/)).toBe(true);
    expect(has(content, /output\s+"us_west_2_internet_gateway_id"/)).toBe(true);
    expect(has(content, /output\s+"us_west_2_public_subnet_ids"/)).toBe(true);
    expect(has(content, /output\s+"us_west_2_private_subnet_ids"/)).toBe(true);
  });

  it('has availability zone data sources for both regions', () => {
    const content = file(MAIN_TF);
    expect(has(content, /data\s+"aws_availability_zones"\s+"us_east_2"[\s\S]*?provider\s*=\s*aws\.us_east_2/)).toBe(true);
    expect(has(content, /data\s+"aws_availability_zones"\s+"us_west_2"[\s\S]*?provider\s*=\s*aws\.us_west_2/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    const content = file(MAIN_TF);
    expect(has(content, /aws_access_key_id\s*=/)).toBe(false);
    expect(has(content, /aws_secret_access_key\s*=/)).toBe(false);
  });

  it('uses proper tagging with project_name and environment variables', () => {
    const content = file(MAIN_TF);
    expect(has(content, /\$\{var\.project_name\}/)).toBe(true);
    expect(has(content, /\$\{var\.environment\}/)).toBe(true);
  });

  it('has proper CIDR block configuration for multi-region setup', () => {
    const content = file(MAIN_TF);
    expect(has(content, /var\.vpc_cidr_blocks\["us-east-2"\]/)).toBe(true);
    expect(has(content, /var\.vpc_cidr_blocks\["us-west-2"\]/)).toBe(true);
  });
});
