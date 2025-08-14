import * as fs from 'fs';
import * as path from 'path';

const CFN_OUTPUTS_DIR = path.resolve(__dirname, '../cfn-outputs');
const FLAT_OUTPUTS_FILE = path.join(CFN_OUTPUTS_DIR, 'flat-outputs.json');

type InfrastructureOutput = {
  region: string;
  vpc_id: string;
  vpc_cidr_block: string;
  internet_gateway_id: string;
  public_subnet_ids: string[];
  private_subnet_ids: string[];
  public_route_table_id: string;
  private_route_table_id: string;
  nat_gateway_id: string;
  nat_gateway_eip_id: string;
};

type FlatOutputs = {
  us_east_2_infrastructure: string;
  us_west_2_infrastructure: string;
};

function readFlatOutputs(): FlatOutputs {
  if (!fs.existsSync(FLAT_OUTPUTS_FILE)) {
    throw new Error(`Flat outputs file not found at ${FLAT_OUTPUTS_FILE}`);
  }
  return JSON.parse(fs.readFileSync(FLAT_OUTPUTS_FILE, 'utf8'));
}

function parseInfrastructureOutput(outputString: string): InfrastructureOutput {
  return JSON.parse(outputString);
}

describe('Terraform Infrastructure Integration Tests', () => {
  let flatOutputs: FlatOutputs;
  let usEast2Infra: InfrastructureOutput;
  let usWest2Infra: InfrastructureOutput;

  beforeAll(() => {
    flatOutputs = readFlatOutputs();
    usEast2Infra = parseInfrastructureOutput(flatOutputs.us_east_2_infrastructure);
    usWest2Infra = parseInfrastructureOutput(flatOutputs.us_west_2_infrastructure);
  });

  it('flat-outputs.json exists and contains expected regions', () => {
    expect(fs.existsSync(FLAT_OUTPUTS_FILE)).toBe(true);
    expect(flatOutputs).toHaveProperty('us_east_2_infrastructure');
    expect(flatOutputs).toHaveProperty('us_west_2_infrastructure');
  });

  it('us-east-2 infrastructure has all required components', () => {
    expect(usEast2Infra.region).toBe('us-east-2');
    expect(usEast2Infra.vpc_id).toMatch(/^vpc-/);
    expect(usEast2Infra.vpc_cidr_block).toBe('10.0.0.0/16');
    expect(usEast2Infra.internet_gateway_id).toMatch(/^igw-/);
    expect(usEast2Infra.public_route_table_id).toMatch(/^rtb-/);
    expect(usEast2Infra.private_route_table_id).toMatch(/^rtb-/);
    expect(usEast2Infra.public_subnet_ids).toHaveLength(2);
    expect(usEast2Infra.private_subnet_ids).toHaveLength(2);
    expect(usEast2Infra.nat_gateway_id).toMatch(/^nat-/);
    expect(usEast2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
    
    // Validate subnet IDs format
    usEast2Infra.public_subnet_ids.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-/);
    });
    usEast2Infra.private_subnet_ids.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-/);
    });

    // Validate NAT Gateway ID format
    expect(usEast2Infra.nat_gateway_id).toMatch(/^nat-/);

    // Validate EIP ID format
    expect(usEast2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
  });

  it('us-west-2 infrastructure has all required components', () => {
    expect(usWest2Infra.region).toBe('us-west-2');
    expect(usWest2Infra.vpc_id).toMatch(/^vpc-/);
    expect(usWest2Infra.vpc_cidr_block).toBe('10.1.0.0/16');
    expect(usWest2Infra.internet_gateway_id).toMatch(/^igw-/);
    expect(usWest2Infra.public_route_table_id).toMatch(/^rtb-/);
    expect(usWest2Infra.private_route_table_id).toMatch(/^rtb-/);
    expect(usWest2Infra.public_subnet_ids).toHaveLength(2);
    expect(usWest2Infra.private_subnet_ids).toHaveLength(2);
    expect(usWest2Infra.nat_gateway_id).toMatch(/^nat-/);
    expect(usWest2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
    
    // Validate subnet IDs format
    usWest2Infra.public_subnet_ids.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-/);
    });
    usWest2Infra.private_subnet_ids.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-/);
    });

    // Validate NAT Gateway ID format
    expect(usWest2Infra.nat_gateway_id).toMatch(/^nat-/);

    // Validate EIP ID format
    expect(usWest2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
  });

  it('both regions have unique resource IDs', () => {
    // VPCs should be different
    expect(usEast2Infra.vpc_id).not.toBe(usWest2Infra.vpc_id);
    
    // Internet Gateways should be different
    expect(usEast2Infra.internet_gateway_id).not.toBe(usWest2Infra.internet_gateway_id);
    
    // Route Tables should be different
    expect(usEast2Infra.public_route_table_id).not.toBe(usWest2Infra.public_route_table_id);
    expect(usEast2Infra.private_route_table_id).not.toBe(usWest2Infra.private_route_table_id);
    
    // Subnets should be different
    const eastSubnets = [...usEast2Infra.public_subnet_ids, ...usEast2Infra.private_subnet_ids];
    const westSubnets = [...usWest2Infra.public_subnet_ids, ...usWest2Infra.private_subnet_ids];
    
    eastSubnets.forEach(eastSubnet => {
      expect(westSubnets).not.toContain(eastSubnet);
    });

    // NAT Gateways should be different
    expect(usEast2Infra.nat_gateway_id).not.toBe(usWest2Infra.nat_gateway_id);

    // EIPs should be different
    expect(usEast2Infra.nat_gateway_eip_id).not.toBe(usWest2Infra.nat_gateway_eip_id);
  });

  it('CIDR blocks are correctly configured for each region', () => {
    // us-east-2 should use 10.0.x.x range
    expect(usEast2Infra.vpc_cidr_block).toBe('10.0.0.0/16');
    
    // us-west-2 should use 10.1.x.x range
    expect(usWest2Infra.vpc_cidr_block).toBe('10.1.0.0/16');
  });

  it('each region has the expected number of subnets', () => {
    // Both regions should have 2 public and 2 private subnets (as per main.tf)
    expect(usEast2Infra.public_subnet_ids).toHaveLength(2);
    expect(usEast2Infra.private_subnet_ids).toHaveLength(2);
    expect(usWest2Infra.public_subnet_ids).toHaveLength(2);
    expect(usWest2Infra.private_subnet_ids).toHaveLength(2);
  });

  it('each region has the expected number of NAT Gateways', () => {
    // Both regions should have 1 NAT Gateway (one per public subnet)
    expect(usEast2Infra.nat_gateway_id).toMatch(/^nat-/);
    expect(usWest2Infra.nat_gateway_id).toMatch(/^nat-/);
  });

  it('each region has the expected number of Elastic IPs', () => {
    // Both regions should have 1 Elastic IP (one per NAT Gateway)
    expect(usEast2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
    expect(usWest2Infra.nat_gateway_eip_id).toMatch(/^eipalloc-/);
  });

  it('infrastructure outputs contain all required fields', () => {
    const requiredFields = [
      'region', 'vpc_id', 'vpc_cidr_block', 'internet_gateway_id',
      'public_subnet_ids', 'private_subnet_ids', 'public_route_table_id',
      'private_route_table_id', 'nat_gateway_id', 'nat_gateway_eip_id'
    ];

    requiredFields.forEach(field => {
      expect(usEast2Infra).toHaveProperty(field);
      expect(usWest2Infra).toHaveProperty(field);
    });
  });
});
