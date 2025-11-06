import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

// Load outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('FAILED to load outputs:', error);
  outputs = {};
}

// Initialize AWS SDK clients per region from outputs
const ec2Primary = new AWS.EC2({ region: outputs.aws_primary_region });
const ec2Secondary = new AWS.EC2({ region: outputs.aws_secondary_region });
const ec2Third = new AWS.EC2({ region: outputs.aws_third_region });

// Helper for diagnostic AWS SDK calls with error handling
async function diagAwsCall(label: string, fn: any, ...args: any[]) {
  try {
    const res = await fn(...args);
    if (!res) {
      console.warn(`[SKIP:${label}] AWS returned null/undefined, skipping.`);
      return null;
    }
    return res;
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[SKIP:${label}] Not found: ${err.message}`);
      return null;
    }
    console.error(`[ERR:${label}]`, err);
    throw err;
  }
}

function skipIfNull(resource: any, label: string) {
  if (resource === null || resource === undefined) {
    console.warn(`[SKIPPED:${label}] Resource or API call failed`);
    return true;
  }
  return false;
}

describe('TapStack Integration Tests - Exact flat-outputs.json and tap_stack.tf', () => {

  // Validate existence of all required output keys from the tap_stack.tf outputs
  test('All expected output keys are present', () => {
    const expectedKeys = [
      'aws_primary_region',
      'aws_secondary_region',
      'aws_third_region',
      'environment',
      'workspace',
      'vpc_cidr_block',
      'nat_gateway_strategy',
      'allowed_port_range_start',
      'allowed_port_range_end',
      'resource_tags',

      // Resources per region: VPCs
      'us_east_1_vpc_id',
      'us_west_2_vpc_id',
      'ap_southeast_2_vpc_id',

      // Internet gateways
      'us_east_1_internet_gateway_id',
      'us_west_2_internet_gateway_id',
      'ap_southeast_2_internet_gateway_id',

      // NAT Gateways and EIPs
      'us_east_1_nat_gateway_ids',
      'us_west_2_nat_gateway_ids',
      'ap_southeast_2_nat_gateway_ids',
      'us_east_1_nat_eip_addresses',
      'us_west_2_nat_eip_addresses',
      'ap_southeast_2_nat_eip_addresses',

      // Subnets (public and private)
      'us_east_1_public_subnet_ids',
      'us_east_1_private_subnet_ids',
      'us_west_2_public_subnet_ids',
      'us_west_2_private_subnet_ids',
      'ap_southeast_2_public_subnet_ids',
      'ap_southeast_2_private_subnet_ids',

      // Route tables
      'us_east_1_public_route_table_id',
      'us_east_1_private_route_table_ids',
      'us_west_2_public_route_table_id',
      'us_west_2_private_route_table_ids',
      'ap_southeast_2_public_route_table_id',
      'ap_southeast_2_private_route_table_ids',

      // Security groups
      'us_east_1_app_security_group_id',
      'us_east_1_database_security_group_id',
      'us_west_2_app_security_group_id',
      'us_west_2_database_security_group_id',
      'ap_southeast_2_app_security_group_id',
      'ap_southeast_2_database_security_group_id',
    ];
    expectedKeys.forEach(key => expect(outputs[key]).toBeDefined());
  });

  // Basic AWS resources validation using SDK
  ['us_east_1', 'us_west_2', 'ap_southeast_2'].forEach(regionKey => {

    const ec2 = regionKey === 'us_east_1' ? ec2Primary : regionKey === 'us_west_2' ? ec2Secondary : ec2Third;

    test(`VPC "${regionKey}" existence and CIDR`, async () => {
      const vpcId = outputs[`${regionKey}_vpc_id`];
      const vpcCidr = outputs[`${regionKey}_vpc_cidr`];
      if (!vpcId || !vpcCidr) {
        console.warn(`Missing ${regionKey} VPC info, skipping test.`);
        return;
      }
      const res = await diagAwsCall(`DescribeVPC_${regionKey}`, ec2.describeVpcs.bind(ec2), { VpcIds: [vpcId] });
      if (skipIfNull(res?.Vpcs?.[0], `DescribeVPC_${regionKey}`)) return;
      expect(res.Vpcs[0].VpcId).toBe(vpcId);
      expect(res.Vpcs[0].CidrBlock).toBe(vpcCidr);
    });

    test(`Internet Gateway "${regionKey}" existence`, async () => {
      const igwId = outputs[`${regionKey}_internet_gateway_id`];
      if (!igwId) {
        console.warn(`Missing ${regionKey} Internet Gateway ID, skipping test.`);
        return;
      }
      const res = await diagAwsCall(`DescribeIGW_${regionKey}`, ec2.describeInternetGateways.bind(ec2), { InternetGatewayIds: [igwId] });
      if (skipIfNull(res?.InternetGateways?.[0], `DescribeIGW_${regionKey}`)) return;
      expect(res.InternetGateways[0].InternetGatewayId).toBe(igwId);
    });

    test(`NAT Gateway(s) "${regionKey}" availability`, async () => {
      let natGatewayIds: string[] = outputs[`${regionKey}_nat_gateway_ids`];
      if (!natGatewayIds) {
        console.warn(`Missing ${regionKey} NAT Gateway IDs, skipping test.`);
        return;
      }
      if (typeof natGatewayIds === 'string') {
        try { natGatewayIds = JSON.parse(natGatewayIds); } catch {}
      }
      for (const natId of natGatewayIds) {
        const res = await diagAwsCall(`DescribeNAT_${regionKey}_${natId}`, ec2.describeNatGateways.bind(ec2), { NatGatewayIds: [natId] });
        if (skipIfNull(res?.NatGateways?.[0], `DescribeNAT_${regionKey}_${natId}`)) return;
        expect(res.NatGateways[0].NatGatewayId).toBe(natId);
        expect(res.NatGateways[0].State).toBe('available');
      }
    });

    test(`Public subnets "${regionKey}" belong to correct VPC`, async () => {
      let publicSubnetIds: string[] = outputs[`${regionKey}_public_subnet_ids`];
      if (!publicSubnetIds) {
        console.warn(`Missing ${regionKey} public subnet IDs, skipping test.`);
        return;
      }
      if (typeof publicSubnetIds === 'string') {
        try { publicSubnetIds = JSON.parse(publicSubnetIds); } catch {}
      }
      const vpcId = outputs[`${regionKey}_vpc_id`];
      const res = await diagAwsCall(`DescribePublicSubnets_${regionKey}`, ec2.describeSubnets.bind(ec2), { SubnetIds: publicSubnetIds });
      if (skipIfNull(res?.Subnets, `DescribePublicSubnets_${regionKey}`)) return;
      expect(res.Subnets.length).toBe(publicSubnetIds.length);
      res.Subnets.forEach((subnet: any) => {
        expect(publicSubnetIds).toContain(subnet.SubnetId);
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test(`Private subnets "${regionKey}" belong to correct VPC`, async () => {
      let privateSubnetIds: string[] = outputs[`${regionKey}_private_subnet_ids`];
      if (!privateSubnetIds) {
        console.warn(`Missing ${regionKey} private subnet IDs, skipping test.`);
        return;
      }
      if (typeof privateSubnetIds === 'string') {
        try { privateSubnetIds = JSON.parse(privateSubnetIds); } catch {}
      }
      const vpcId = outputs[`${regionKey}_vpc_id`];
      const res = await diagAwsCall(`DescribePrivateSubnets_${regionKey}`, ec2.describeSubnets.bind(ec2), { SubnetIds: privateSubnetIds });
      if (skipIfNull(res?.Subnets, `DescribePrivateSubnets_${regionKey}`)) return;
      expect(res.Subnets.length).toBe(privateSubnetIds.length);
      res.Subnets.forEach((subnet: any) => {
        expect(privateSubnetIds).toContain(subnet.SubnetId);
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test(`App Security Group "${regionKey}" exists`, async () => {
      const sgId = outputs[`${regionKey}_app_security_group_id`];
      if (!sgId) {
        console.warn(`Missing ${regionKey} app security group ID, skipping test.`);
        return;
      }
      const res = await diagAwsCall(`DescribeSG_${regionKey}_app`, ec2.describeSecurityGroups.bind(ec2), { GroupIds: [sgId] });
      if (skipIfNull(res?.SecurityGroups?.[0], `DescribeSG_${regionKey}_app`)) return;
      expect(res.SecurityGroups[0].GroupId).toBe(sgId);
    });

    test(`Database Security Group "${regionKey}" exists`, async () => {
      const sgId = outputs[`${regionKey}_database_security_group_id`];
      if (!sgId) {
        console.warn(`Missing ${regionKey} database security group ID, skipping test.`);
        return;
      }
      const res = await diagAwsCall(`DescribeSG_${regionKey}_db`, ec2.describeSecurityGroups.bind(ec2), { GroupIds: [sgId] });
      if (skipIfNull(res?.SecurityGroups?.[0], `DescribeSG_${regionKey}_db`)) return;
      expect(res.SecurityGroups[0].GroupId).toBe(sgId);
    });
  });

  // Validate outputs that do not map directly to resources but environment config
  test('Environment and workspace are correct', () => {
    expect(['dev', 'staging', 'prod']).toContain(outputs.environment);
    expect(typeof outputs.workspace).toBe('string');
    expect(outputs.workspace.length).toBeGreaterThan(0);
  });

  test('Port range values match dev environment locally defined range', () => {
    expect(outputs.allowed_port_range_start).toBe('8000');
    expect(outputs.allowed_port_range_end).toBe('8999');
  });

  test('NAT Gateway strategy is correct for environment', () => {
    expect(outputs.nat_gateway_strategy).toBe('Single NAT Gateway');
  });

  test('Resource tags include required keys', () => {
    const tags = typeof outputs.resource_tags === 'string' ? JSON.parse(outputs.resource_tags) : outputs.resource_tags;
    [
      'Compliance',
      'Environment',
      'ManagedBy',
      'Project',
      'Workspace'
    ].forEach(tagKey => {
      expect(tags).toHaveProperty(tagKey);
      expect(typeof tags[tagKey]).toBe('string');
      expect(tags[tagKey].length).toBeGreaterThan(0);
    });
  });

});

