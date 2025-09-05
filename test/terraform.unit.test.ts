// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform configuration files
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe('Terraform Configuration Unit Tests', () => {
  describe('File Existence', () => {
    test('tap_stack.tf exists', () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test('provider.tf exists', () => {
      const exists = fs.existsSync(providerPath);
      if (!exists) {
        console.error(`[unit] Expected provider at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, 'utf8');
    });

    test('declares terraform block with required_providers', () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
    });

    test('configures AWS provider with correct source and version', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~> 5\.0"/);
    });

    test('sets AWS region to us-east-1', () => {
      expect(providerContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test('sets minimum Terraform version', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.0"/);
    });
  });

  describe('Stack Configuration Structure', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('declares VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"basic_vpc"\s*{/);
    });

    test('declares Internet Gateway resource', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_internet_gateway"\s+"basic_igw"\s*{/
      );
    });

    test('declares two public subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_a"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_b"\s*{/);
    });

    test('declares route table resource', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table"\s+"public_rt"\s*{/
      );
    });

    test('declares route resource', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_route"\s+"public_internet_access"\s*{/
      );
    });

    test('declares route table associations', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"public_a"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"public_b"\s*{/
      );
    });

    test('declares all required outputs', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"subnet_ids"\s*{/);
      expect(stackContent).toMatch(/output\s+"internet_gateway_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"route_table_id"\s*{/);
    });
  });

  describe('VPC Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('VPC has correct CIDR block', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('VPC enables DNS hostnames', () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC enables DNS support', () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC has proper tags', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"basic-vpc"/);
      expect(stackContent).toMatch(/Project\s*=\s*"basic-network"/);
      expect(stackContent).toMatch(/Environment\s*=\s*"dev"/);
    });
  });

  describe('Subnet Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('subnet A has correct CIDR and AZ', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1a"/);
    });

    test('subnet B has correct CIDR and AZ', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1b"/);
    });

    test('both subnets have map_public_ip_on_launch enabled', () => {
      const subnetMatches = stackContent.match(
        /map_public_ip_on_launch\s*=\s*true/g
      );
      expect(subnetMatches).toHaveLength(2);
    });

    test('both subnets have proper tags', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"public-a"/);
      expect(stackContent).toMatch(/Name\s*=\s*"public-b"/);
    });
  });

  describe('Networking Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('Internet Gateway is attached to VPC', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/);
    });

    test('route table has default route to Internet Gateway', () => {
      expect(stackContent).toMatch(
        /destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/
      );
      expect(stackContent).toMatch(
        /gateway_id\s*=\s*aws_internet_gateway\.basic_igw\.id/
      );
    });

    test('both subnets are associated with route table', () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_a\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_b\.id/);
      expect(stackContent).toMatch(
        /route_table_id\s*=\s*aws_route_table\.public_rt\.id/
      );
    });
  });

  describe('Output Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('vpc_id output has correct description and value', () => {
      expect(stackContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.basic_vpc\.id/);
    });

    test('subnet_ids output has correct description and value', () => {
      expect(stackContent).toMatch(
        /description\s*=\s*"List of public subnet IDs"/
      );
      expect(stackContent).toMatch(
        /value\s*=\s*\[aws_subnet\.public_a\.id,\s*aws_subnet\.public_b\.id\]/
      );
    });

    test('internet_gateway_id output has correct description and value', () => {
      expect(stackContent).toMatch(
        /description\s*=\s*"ID of the Internet Gateway"/
      );
      expect(stackContent).toMatch(
        /value\s*=\s*aws_internet_gateway\.basic_igw\.id/
      );
    });

    test('route_table_id output has correct description and value', () => {
      expect(stackContent).toMatch(
        /description\s*=\s*"ID of the public route table"/
      );
      expect(stackContent).toMatch(
        /value\s*=\s*aws_route_table\.public_rt\.id/
      );
    });
  });

  describe('Resource Dependencies', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('Internet Gateway references VPC', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/);
    });

    test('subnets reference VPC', () => {
      const vpcRefs = stackContent.match(
        /vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/g
      );
      expect(vpcRefs).toHaveLength(4); // IGW + 2 subnets + route table
    });

    test('route table references VPC', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.basic_vpc\.id/);
    });

    test('route references route table and IGW', () => {
      expect(stackContent).toMatch(
        /route_table_id\s*=\s*aws_route_table\.public_rt\.id/
      );
      expect(stackContent).toMatch(
        /gateway_id\s*=\s*aws_internet_gateway\.basic_igw\.id/
      );
    });
  });
});
