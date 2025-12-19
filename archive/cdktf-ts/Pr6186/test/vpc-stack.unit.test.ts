import { App, Testing, TerraformStack } from 'cdktf';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack Unit Tests', () => {
  let app: App;
  let stack: TerraformStack;
  let vpcStack: VpcStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TerraformStack(app, 'TestStack');
  });

  test('VpcStack creates VPC with correct CIDR block', () => {
    vpcStack = new VpcStack(stack, 'test-vpc', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(vpcStack.vpc).toBeDefined();
    expect(synthesized).toContain('"cidr_block": "10.0.0.0/16"');
  });

  test('VpcStack enables DNS hostnames and support', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-dns', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"enable_dns_hostnames": true');
    expect(synthesized).toContain('"enable_dns_support": true');
  });

  test('VpcStack creates Internet Gateway', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-igw', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_internet_gateway');
    expect(synthesized).toContain('eks-igw-test');
  });

  test('VpcStack creates 3 public subnets', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-public', {
      environmentSuffix: 'prod',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(vpcStack.publicSubnetIds).toBeDefined();
    expect(vpcStack.publicSubnetIds.length).toBe(3);
    expect(synthesized).toContain('eks-public-subnet-0-prod');
    expect(synthesized).toContain('eks-public-subnet-1-prod');
    expect(synthesized).toContain('eks-public-subnet-2-prod');
    expect(synthesized).toContain('"cidr_block": "10.0.0.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.1.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.2.0/24"');
  });

  test('VpcStack creates 3 private subnets', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-private', {
      environmentSuffix: 'dev',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(vpcStack.privateSubnetIds).toBeDefined();
    expect(vpcStack.privateSubnetIds.length).toBe(3);
    expect(synthesized).toContain('eks-private-subnet-0-dev');
    expect(synthesized).toContain('eks-private-subnet-1-dev');
    expect(synthesized).toContain('eks-private-subnet-2-dev');
    expect(synthesized).toContain('"cidr_block": "10.0.10.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.11.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.12.0/24"');
  });

  test('VpcStack creates 3 NAT Gateways', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-nat', {
      environmentSuffix: 'staging',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_nat_gateway');
    expect(synthesized).toContain('eks-nat-gateway-0-staging');
    expect(synthesized).toContain('eks-nat-gateway-1-staging');
    expect(synthesized).toContain('eks-nat-gateway-2-staging');
  });

  test('VpcStack creates 3 Elastic IPs for NAT Gateways', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-eip', {
      environmentSuffix: 'qa',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_eip');
    expect(synthesized).toContain('eks-nat-eip-0-qa');
    expect(synthesized).toContain('eks-nat-eip-1-qa');
    expect(synthesized).toContain('eks-nat-eip-2-qa');
    expect(synthesized).toContain('"domain": "vpc"');
  });

  test('VpcStack creates public route table with IGW route', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-public-rt', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_route_table');
    expect(synthesized).toContain('eks-public-rt-test');
    expect(synthesized).toContain('aws_route');
    expect(synthesized).toContain('"destination_cidr_block": "0.0.0.0/0"');
  });

  test('VpcStack creates 3 private route tables with NAT routes', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-private-rt', {
      environmentSuffix: 'prod',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-private-rt-0-prod');
    expect(synthesized).toContain('eks-private-rt-1-prod');
    expect(synthesized).toContain('eks-private-rt-2-prod');
  });

  test('VpcStack creates route table associations', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-rta', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_route_table_association');
  });

  test('VpcStack tags all resources with environment suffix', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-tags', {
      environmentSuffix: 'custom',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-vpc-custom');
    expect(synthesized).toContain('eks-igw-custom');
    expect(synthesized).toContain('eks-public-subnet-0-custom');
    expect(synthesized).toContain('eks-private-subnet-0-custom');
    expect(synthesized).toContain('eks-nat-gateway-0-custom');
    expect(synthesized).toContain('eks-nat-eip-0-custom');
  });

  test('VpcStack tags resources with standard tags', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-std-tags', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"Environment": "production"');
    expect(synthesized).toContain('"Team": "platform"');
    expect(synthesized).toContain('"CostCenter": "engineering"');
  });

  test('VpcStack public subnets have ELB role tag', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-elb-tag', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"kubernetes.io/role/elb": "1"');
  });

  test('VpcStack private subnets have internal-elb role tag', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-internal-elb', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"kubernetes.io/role/internal-elb": "1"');
  });

  test('VpcStack public subnets have map_public_ip_on_launch enabled', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-public-ip', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"map_public_ip_on_launch": true');
  });

  test('VpcStack uses availability zones data source', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-azs', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('data.aws_availability_zones');
    expect(synthesized).toContain('"state": "available"');
  });

  test('VpcStack exports public subnet IDs', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-export-public', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });

    expect(vpcStack.publicSubnetIds).toBeDefined();
    expect(Array.isArray(vpcStack.publicSubnetIds)).toBe(true);
    expect(vpcStack.publicSubnetIds.length).toBe(3);
  });

  test('VpcStack exports private subnet IDs', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-export-private', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });

    expect(vpcStack.privateSubnetIds).toBeDefined();
    expect(Array.isArray(vpcStack.privateSubnetIds)).toBe(true);
    expect(vpcStack.privateSubnetIds.length).toBe(3);
  });

  test('VpcStack exports VPC object', () => {
    vpcStack = new VpcStack(stack, 'test-vpc-export', {
      environmentSuffix: 'test',
      region: 'us-east-2',
    });

    expect(vpcStack.vpc).toBeDefined();
  });
});
