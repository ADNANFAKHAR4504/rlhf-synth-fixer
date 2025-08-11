import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

function getResourcesByType(synthJson: string, type: string): any[] {
  try {
    const parsed = JSON.parse(synthJson);
    const resourceBlock = parsed.resource ?? {};
    const typedBlock = resourceBlock[type] ?? {};
    return Object.values(typedBlock);
  } catch (e) {
    console.error('Error parsing synth JSON:', e);
    return [];
  }
}

function debugSynthOutput(synth: string) {
  try {
    const parsed = JSON.parse(synth);
    console.log('\n=== Synth Output Keys ===');
    console.log(Object.keys(parsed));
    console.log('=== Resource Keys ===');
    console.log(Object.keys(parsed.resource || {}));
  } catch (e) {
    console.error('Error parsing synth for debug:', e);
  }
}

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestTapStack');
    synthesized = Testing.synth(stack); // ✅ THIS IS CORRECT FOR CDKTF TYPESCRIPT
    debugSynthOutput(synthesized);
  });

  test('TapStack instantiates successfully via props', () => {
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('should create a VPC with CIDR 10.0.0.0/16', () => {
    const vpcs = getResourcesByType(synthesized, 'aws_vpc');
    expect(vpcs.length).toBeGreaterThan(0);
    const vpc = vpcs[0];
    expect(vpc.cidr_block).toBe('10.0.0.0/16');
    expect(vpc.tags.Environment).toBe('dev');
  });

  test('should create two public subnets in different AZs', () => {
    const subnets = getResourcesByType(synthesized, 'aws_subnet');
    expect(subnets.length).toBe(2);
    const azs = subnets.map((s) => s.availability_zone);
    expect(new Set(azs).size).toBe(2);
    subnets.forEach((subnet) => {
      expect(subnet.map_public_ip_on_launch).toBe(true);
      expect(subnet.tags.Environment).toBe('dev');
    });
  });

  test('should create an Internet Gateway and route table', () => {
    const igws = getResourcesByType(synthesized, 'aws_internet_gateway');
    expect(igws.length).toBeGreaterThan(0);
    expect(igws[0].tags.Environment).toBe('dev');

    const routeTables = getResourcesByType(synthesized, 'aws_route_table');
    expect(routeTables.length).toBeGreaterThan(0);
    expect(routeTables[0].tags.Environment).toBe('dev');

    const routes = getResourcesByType(synthesized, 'aws_route');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0].destination_cidr_block).toBe('0.0.0.0/0');
  });

  test('should associate both subnets with the route table', () => {
    const associations = getResourcesByType(synthesized, 'aws_route_table_association');
    expect(associations.length).toBe(2);
  });

  test('should create a t2.micro EC2 instance in a public subnet', () => {
    const instances = getResourcesByType(synthesized, 'aws_instance');
    expect(instances.length).toBeGreaterThan(0);
    const instance = instances[0];
    expect(instance.instance_type).toBe('t2.micro');
    expect(instance.subnet_id).toBeDefined();
    expect(instance.associate_public_ip_address).toBe(true);
    expect(instance.tags.Environment).toBe('dev');
  });
});
