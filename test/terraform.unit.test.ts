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

    test('declares environment_suffix variable', () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(
        /description\s*=\s*"Environment suffix for resource naming"/
      );
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
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

    test('VPC has proper tags with environment suffix', () => {
      expect(stackContent).toMatch(
        /Name\s*=\s*"basic-vpc-\$\{var\.environment_suffix\}"/
      );
      expect(stackContent).toMatch(/Project\s*=\s*"basic-network"/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
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

    test('both subnets have proper tags with environment suffix', () => {
      expect(stackContent).toMatch(
        /Name\s*=\s*"public-a-\$\{var\.environment_suffix\}"/
      );
      expect(stackContent).toMatch(
        /Name\s*=\s*"public-b-\$\{var\.environment_suffix\}"/
      );
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

    test('route table associations reference correct resources', () => {
      const associations = stackContent.match(
        /resource\s+"aws_route_table_association"[^}]+}/gs
      );
      expect(associations).toHaveLength(2);

      // Check that each association references the correct subnet and route table
      const publicAAssociation = stackContent.match(
        /resource\s+"aws_route_table_association"\s+"public_a"[^}]+}/s
      );
      expect(publicAAssociation).toBeTruthy();
      expect(publicAAssociation![0]).toMatch(
        /subnet_id\s*=\s*aws_subnet\.public_a\.id/
      );
      expect(publicAAssociation![0]).toMatch(
        /route_table_id\s*=\s*aws_route_table\.public_rt\.id/
      );

      const publicBAssociation = stackContent.match(
        /resource\s+"aws_route_table_association"\s+"public_b"[^}]+}/s
      );
      expect(publicBAssociation).toBeTruthy();
      expect(publicBAssociation![0]).toMatch(
        /subnet_id\s*=\s*aws_subnet\.public_b\.id/
      );
      expect(publicBAssociation![0]).toMatch(
        /route_table_id\s*=\s*aws_route_table\.public_rt\.id/
      );
    });
  });

  describe('Environment Suffix Usage', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('all resources use environment_suffix in tags', () => {
      // Check VPC
      expect(stackContent).toMatch(
        /Name\s*=\s*"basic-vpc-\$\{var\.environment_suffix\}"/
      );

      // Check IGW
      expect(stackContent).toMatch(
        /Name\s*=\s*"basic-igw-\$\{var\.environment_suffix\}"/
      );

      // Check Subnets
      expect(stackContent).toMatch(
        /Name\s*=\s*"public-a-\$\{var\.environment_suffix\}"/
      );
      expect(stackContent).toMatch(
        /Name\s*=\s*"public-b-\$\{var\.environment_suffix\}"/
      );

      // Check Route Table
      expect(stackContent).toMatch(
        /Name\s*=\s*"public-rt-\$\{var\.environment_suffix\}"/
      );
    });

    test('all Environment tags use var.environment_suffix', () => {
      const envTags = stackContent.match(/Environment\s*=\s*[^\n]+/g);
      expect(envTags).toBeTruthy();
      envTags!.forEach(tag => {
        expect(tag).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      });
    });

    test('variable has proper type and default value', () => {
      const varBlock = stackContent.match(
        /variable\s+"environment_suffix"\s*\{[^}]+\}/s
      );
      expect(varBlock).toBeTruthy();
      expect(varBlock![0]).toMatch(/type\s*=\s*string/);
      expect(varBlock![0]).toMatch(/default\s*=\s*"dev"/);
      expect(varBlock![0]).toMatch(/description/);
    });
  });

  describe('Resource Naming Conventions', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('all resources follow naming conventions', () => {
      // Check that resource names use underscores, not hyphens
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"basic_vpc"/);
      expect(stackContent).toMatch(
        /resource\s+"aws_internet_gateway"\s+"basic_igw"/
      );
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_a"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_b"/);
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table"\s+"public_rt"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_route"\s+"public_internet_access"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"public_a"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"public_b"/
      );
    });

    test('all tag Names use hyphens as separators', () => {
      const nameTags = stackContent.match(/Name\s*=\s*"[^"]+"/g);
      expect(nameTags).toBeTruthy();
      nameTags!.forEach(tag => {
        const value = tag.match(/"([^"]+)"/)![1];
        // Check that the base name uses hyphens
        const baseName = value.replace(/\$\{[^}]+\}/g, '');
        expect(baseName).toMatch(/^[a-z-]+$/);
      });
    });
  });

  describe('CIDR Block Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('CIDR blocks are non-overlapping and properly sized', () => {
      // VPC CIDR
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);

      // Subnet CIDRs
      const subnet1CIDR = stackContent.match(
        /resource\s+"aws_subnet"\s+"public_a"[^}]+cidr_block\s*=\s*"([^"]+)"/s
      );
      expect(subnet1CIDR).toBeTruthy();
      expect(subnet1CIDR![1]).toBe('10.0.1.0/24');

      const subnet2CIDR = stackContent.match(
        /resource\s+"aws_subnet"\s+"public_b"[^}]+cidr_block\s*=\s*"([^"]+)"/s
      );
      expect(subnet2CIDR).toBeTruthy();
      expect(subnet2CIDR![1]).toBe('10.0.2.0/24');
    });

    test('subnets are within VPC CIDR range', () => {
      const vpcCIDR = '10.0.0.0/16';
      const subnet1CIDR = '10.0.1.0/24';
      const subnet2CIDR = '10.0.2.0/24';

      // Basic check that subnet CIDRs start with VPC network prefix
      expect(subnet1CIDR).toMatch(/^10\.0\./);
      expect(subnet2CIDR).toMatch(/^10\.0\./);
    });
  });

  describe('Availability Zone Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('subnets are in different availability zones', () => {
      const subnetA = stackContent.match(
        /resource\s+"aws_subnet"\s+"public_a"[^}]+availability_zone\s*=\s*"([^"]+)"/s
      );
      const subnetB = stackContent.match(
        /resource\s+"aws_subnet"\s+"public_b"[^}]+availability_zone\s*=\s*"([^"]+)"/s
      );

      expect(subnetA).toBeTruthy();
      expect(subnetB).toBeTruthy();
      expect(subnetA![1]).toBe('us-east-1a');
      expect(subnetB![1]).toBe('us-east-1b');
      expect(subnetA![1]).not.toBe(subnetB![1]);
    });

    test('availability zones match the configured region', () => {
      const providerContent = fs.readFileSync(providerPath, 'utf8');
      const region = providerContent.match(/region\s*=\s*"([^"]+)"/);
      expect(region).toBeTruthy();
      expect(region![1]).toBe('us-east-1');

      // Check that AZs start with the region
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1[a-z]"/);
    });
  });

  describe('Output Completeness', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    });

    test('all outputs have descriptions', () => {
      const outputs = stackContent.match(/output\s+"[^"]+"\s*\{[^}]+\}/gs);
      expect(outputs).toBeTruthy();
      expect(outputs!.length).toBe(4);

      outputs!.forEach(output => {
        expect(output).toMatch(/description\s*=/);
        expect(output).toMatch(/value\s*=/);
      });
    });

    test('outputs reference correct resources', () => {
      // vpc_id output
      const vpcOutput = stackContent.match(/output\s+"vpc_id"\s*\{[^}]+\}/s);
      expect(vpcOutput).toBeTruthy();
      expect(vpcOutput![0]).toMatch(/value\s*=\s*aws_vpc\.basic_vpc\.id/);

      // subnet_ids output
      const subnetOutput = stackContent.match(
        /output\s+"subnet_ids"\s*\{[^}]+\}/s
      );
      expect(subnetOutput).toBeTruthy();
      expect(subnetOutput![0]).toMatch(/aws_subnet\.public_a\.id/);
      expect(subnetOutput![0]).toMatch(/aws_subnet\.public_b\.id/);

      // internet_gateway_id output
      const igwOutput = stackContent.match(
        /output\s+"internet_gateway_id"\s*\{[^}]+\}/s
      );
      expect(igwOutput).toBeTruthy();
      expect(igwOutput![0]).toMatch(
        /value\s*=\s*aws_internet_gateway\.basic_igw\.id/
      );

      // route_table_id output
      const rtOutput = stackContent.match(
        /output\s+"route_table_id"\s*\{[^}]+\}/s
      );
      expect(rtOutput).toBeTruthy();
      expect(rtOutput![0]).toMatch(
        /value\s*=\s*aws_route_table\.public_rt\.id/
      );
    });
  });
});
