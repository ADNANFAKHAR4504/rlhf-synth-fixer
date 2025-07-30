import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TAP Stack Infrastructure', () => {
  let app: App;
  let stack: TapStack;
  let synth: any[];

  beforeEach(() => {
    app = new App();
    synth = Testing.synthScope((scope) => {
      stack = new TapStack(scope, 'TestTapStack');
      return stack;
    });
  });

  test('should create a VPC with CIDR 10.0.0.0/16', () => {
    const vpc = synth.find((r) => r.type === 'aws_vpc');
    expect(vpc).toBeDefined();
    expect(vpc.values.cidr_block).toBe('10.0.0.0/16');
    expect(vpc.values.tags.Environment).toBe('Dev');
  });

  test('should create two public subnets in different AZs', () => {
    const subnets = synth.filter((r) => r.type === 'aws_subnet');
    expect(subnets.length).toBe(2);

    const azs = subnets.map((s) => s.values.availability_zone);
    expect(new Set(azs).size).toBe(2); // Ensure different AZs

    subnets.forEach((subnet) => {
      expect(subnet.values.map_public_ip_on_launch).toBe(true);
      expect(subnet.values.tags.Environment).toBe('Dev');
    });
  });

  test('should create an Internet Gateway and route table', () => {
    const igw = synth.find((r) => r.type === 'aws_internet_gateway');
    expect(igw).toBeDefined();
    expect(igw.values.tags.Environment).toBe('Dev');

    const routeTable = synth.find((r) => r.type === 'aws_route_table');
    expect(routeTable).toBeDefined();
    expect(routeTable.values.tags.Environment).toBe('Dev');

    const route = synth.find((r) => r.type === 'aws_route');
    expect(route).toBeDefined();
    expect(route.values.destination_cidr_block).toBe('0.0.0.0/0');
    expect(route.values.gateway_id).toBeDefined();
  });

  test('should associate both subnets with the route table', () => {
    const associations = synth.filter((r) => r.type === 'aws_route_table_association');
    expect(associations.length).toBe(2);
  });

  test('should create a t2.micro EC2 instance in a public subnet', () => {
    const instance = synth.find((r) => r.type === 'aws_instance');
    expect(instance).toBeDefined();
    expect(instance.values.instance_type).toBe('t2.micro');
    expect(instance.values.subnet_id).toBeDefined();
    expect(instance.values.tags.Environment).toBe('Dev');
  });

  test('all resources are tagged with Environment: Dev', () => {
    const resourcesWithTags = synth.filter((r) => r.values?.tags?.Environment);
    expect(resourcesWithTags.length).toBeGreaterThan(0);

    resourcesWithTags.forEach((res) => {
      expect(res.values.tags.Environment).toBe('Dev');
    });
  });
});
