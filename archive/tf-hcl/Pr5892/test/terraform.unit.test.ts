import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests - Exact Coverage', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    [
      "primary_region",
      "secondary_region",
      "third_region",
      "environment",
      "project_name",
      "compliance_tag",
      "managed_by"
    ].forEach(variableName => {
      test(`Variable "${variableName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variableName}"`));
      });
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    [
      "current_env",
      "resource_suffix",
      "env_config",
      "current_config",
      "subnet_cidrs",
      "regions",
      "az_data",
      "common_tags",
    ].forEach(localName => {
      test(`Local "${localName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`${localName}\\s*=\\s*`));
      });
    });

    describe('Tag keys in common_tags', () => {
      ["Environment", "Project", "ManagedBy", "Compliance", "Workspace", "Timestamp"].forEach(tagKey => {
        test(`Tag key "${tagKey}" exists in common_tags`, () => {
          expect(tfContent).toMatch(new RegExp(`${tagKey}\\s*=\\s*`));
        });
      });
    });
  });

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    [
      // US-EAST-1
      "aws_vpc.us_east_1",
      "aws_internet_gateway.us_east_1",
      "aws_subnet.public_us_east_1",
      "aws_subnet.private_us_east_1",
      "aws_eip.nat_us_east_1",
      "aws_nat_gateway.us_east_1",
      "aws_route_table.public_us_east_1",
      "aws_route_table.private_us_east_1",
      "aws_route_table_association.public_us_east_1",
      "aws_route_table_association.private_us_east_1",
      "aws_security_group.app_us_east_1",
      "aws_security_group.database_us_east_1",

      // US-WEST-2
      "aws_vpc.us_west_2",
      "aws_internet_gateway.us_west_2",
      "aws_subnet.public_us_west_2",
      "aws_subnet.private_us_west_2",
      "aws_eip.nat_us_west_2",
      "aws_nat_gateway.us_west_2",
      "aws_route_table.public_us_west_2",
      "aws_route_table.private_us_west_2",
      "aws_route_table_association.public_us_west_2",
      "aws_route_table_association.private_us_west_2",
      "aws_security_group.app_us_west_2",
      "aws_security_group.database_us_west_2",

      // AP-SOUTHEAST-2
      "aws_vpc.ap_southeast_2",
      "aws_internet_gateway.ap_southeast_2",
      "aws_subnet.public_ap_southeast_2",
      "aws_subnet.private_ap_southeast_2",
      "aws_eip.nat_ap_southeast_2",
      "aws_nat_gateway.ap_southeast_2",
      "aws_route_table.public_ap_southeast_2",
      "aws_route_table.private_ap_southeast_2",
      "aws_route_table_association.public_ap_southeast_2",
      "aws_route_table_association.private_ap_southeast_2",
      "aws_security_group.app_ap_southeast_2",
      "aws_security_group.database_ap_southeast_2",
    ].forEach(resourceFullName => {
      const [resourceType, resourceName] = resourceFullName.split('.');
      test(`Resource "${resourceType}" named "${resourceName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`));
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    [
      // US-EAST-1
      "us_east_1_vpc_id",
      "us_east_1_vpc_cidr",
      "us_east_1_public_subnet_ids",
      "us_east_1_private_subnet_ids",
      "us_east_1_nat_gateway_ids",
      "us_east_1_nat_eip_addresses",
      "us_east_1_internet_gateway_id",
      "us_east_1_public_route_table_id",
      "us_east_1_private_route_table_ids",
      "us_east_1_app_security_group_id",
      "us_east_1_database_security_group_id",

      // US-WEST-2
      "us_west_2_vpc_id",
      "us_west_2_vpc_cidr",
      "us_west_2_public_subnet_ids",
      "us_west_2_private_subnet_ids",
      "us_west_2_nat_gateway_ids",
      "us_west_2_nat_eip_addresses",
      "us_west_2_internet_gateway_id",
      "us_west_2_public_route_table_id",
      "us_west_2_private_route_table_ids",
      "us_west_2_app_security_group_id",
      "us_west_2_database_security_group_id",

      // AP-SOUTHEAST-2
      "ap_southeast_2_vpc_id",
      "ap_southeast_2_vpc_cidr",
      "ap_southeast_2_public_subnet_ids",
      "ap_southeast_2_private_subnet_ids",
      "ap_southeast_2_nat_gateway_ids",
      "ap_southeast_2_nat_eip_addresses",
      "ap_southeast_2_internet_gateway_id",
      "ap_southeast_2_public_route_table_id",
      "ap_southeast_2_private_route_table_ids",
      "ap_southeast_2_app_security_group_id",
      "ap_southeast_2_database_security_group_id",

      // General/general
      "environment",
      "workspace",
      "vpc_cidr_block",
      "nat_gateway_strategy",
      "allowed_port_range_start",
      "allowed_port_range_end",
      "resource_tags",
      "aws_primary_region",
      "aws_secondary_region",
      "aws_third_region"
    ].forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});
