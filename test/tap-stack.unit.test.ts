import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { Ipv6OnlyVpc } from '../lib/modules';

// Helper function to extract synthesized resources by type
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

describe('IPv6-Only IoT Infrastructure Unit Tests (Default Props)', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStack');
    synthesized = Testing.synth(stack);
  });

  test('TapStack instantiates successfully', () => {
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  // All your existing tests go here. They already cover the default props.
  // ... (existing tests)

  test('should create a VPC with both IPv4 (dummy) and IPv6 CIDRs', () => {
    const vpcs = getResourcesByType(synthesized, 'aws_vpc');
    expect(vpcs.length).toBe(1);
    const vpc = vpcs[0];
    
    expect(vpc.cidr_block).toBe('10.0.0.0/16'); 
    expect(vpc.assign_generated_ipv6_cidr_block).toBe(true);
    expect(vpc.tags.Environment).toBe('dev');
    expect(vpc.tags.Project).toBe('IPv6-IoT');
    expect(vpc.tags.Cloud).toBe('AWS');
  });

  test('should create a public IPv6-only subnet', () => {
    const subnets = getResourcesByType(synthesized, 'aws_subnet');
    expect(subnets.length).toBe(1);
    const subnet = subnets[0];
    expect(subnet.ipv6_cidr_block).toBeDefined();
    expect(subnet.cidr_block).toBeUndefined();
    expect(subnet.assign_ipv6_address_on_creation).toBe(true);
    expect(subnet.tags.Environment).toBe('dev');
  });

  test('should create an IPv6 Internet Gateway and an IPv6 Egress-Only Internet Gateway', () => {
    const igws = getResourcesByType(synthesized, 'aws_internet_gateway');
    const eoigws = getResourcesByType(synthesized, 'aws_egress_only_internet_gateway');
    
    expect(igws.length).toBe(1);
    expect(eoigws.length).toBe(1);
    
    expect(igws[0].tags.Environment).toBe('dev');
    expect(eoigws[0].tags.Environment).toBe('dev');
  });

  test('should create a route table and a route for IPv6 internet access', () => {
    const routeTables = getResourcesByType(synthesized, 'aws_route_table');
    expect(routeTables.length).toBe(1);
    expect(routeTables[0].tags.Environment).toBe('dev');

    const routes = getResourcesByType(synthesized, 'aws_route');
    expect(routes.length).toBe(1);
    const route = routes[0];
    expect(route.destination_ipv6_cidr_block).toBe('::/0');
    expect(route.gateway_id).toBeDefined();
    expect(route.destination_cidr_block).toBeUndefined();
  });

  test('should associate the subnet with the public IPv6 route table', () => {
    const associations = getResourcesByType(synthesized, 'aws_route_table_association');
    expect(associations.length).toBe(1);
    const association = associations[0];
    expect(association.subnet_id).toBeDefined();
    expect(association.route_table_id).toBeDefined();
  });

  test('should create an IPv6-only Security Group with proper ingress/egress rules', () => {
    const sgs = getResourcesByType(synthesized, 'aws_security_group');
    expect(sgs.length).toBe(1);
    const sg = sgs[0];
    
    const ingressRule = sg.ingress[0];
    expect(ingressRule.protocol).toBe('tcp');
    expect(ingressRule.from_port).toBe(80);
    expect(ingressRule.to_port).toBe(80);
    expect(ingressRule.ipv6_cidr_blocks).toEqual(['::/0']);
    expect(ingressRule.cidr_blocks).toBeNull();
    
    const egressRule = sg.egress[0];
    expect(egressRule.protocol).toBe('-1');
    expect(egressRule.ipv6_cidr_blocks).toEqual(['::/0']);
    expect(egressRule.cidr_blocks).toBeNull();
    expect(sg.tags.Environment).toBe('dev');
  });

  test('should create an EC2 IAM role and instance profile', () => {
    const roles = getResourcesByType(synthesized, 'aws_iam_role');
    const profiles = getResourcesByType(synthesized, 'aws_iam_instance_profile');
    
    expect(roles.length).toBe(1);
    expect(profiles.length).toBe(1);
    
    expect(roles[0].tags.Environment).toBe('dev');
    expect(profiles[0].role).toBeDefined();
    expect(profiles[0].tags.Environment).toBe('dev');
  });

  test('should create a t3.micro EC2 instance with an IPv6 address', () => {
    const instances = getResourcesByType(synthesized, 'aws_instance');
    expect(instances.length).toBe(1);
    const instance = instances[0];
    
    expect(instance.instance_type).toBe('t3.micro');
    expect(instance.subnet_id).toBeDefined();
    expect(instance.iam_instance_profile).toBeDefined();
    expect(instance.ipv6_address_count).toBe(1);
    expect(instance.associate_public_ip_address).toBeUndefined();
    expect(instance.tags.Environment).toBe('dev');
  });

  test('should have all required Terraform outputs defined', () => {
    const synthJson = JSON.parse(synthesized);
    const outputs = synthJson.output;
    expect(outputs).toBeDefined();
    
    expect(outputs['vpc-id']).toBeDefined();
    expect(outputs['public-subnet-id']).toBeDefined();
    expect(outputs['ec2-instance-id']).toBeDefined();
    expect(outputs['ec2-ipv6-address']).toBeDefined();
  });
});

describe('IPv6-Only IoT Infrastructure Unit Tests (Custom Props)', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      awsRegion: 'us-east-1',
      stateBucket: 'my-custom-bucket',
      stateBucketRegion: 'us-east-1',
      defaultTags: {
        tags: {
          Environment: 'prod',
        },
      },
    });
    synthesized = Testing.synth(stack);
  });

  test('should use custom props for the state backend', () => {
    const synthJson = JSON.parse(synthesized);
    const backend = synthJson.terraform.backend;
    expect(backend.s3.bucket).toBe('my-custom-bucket');
    expect(backend.s3.key).toBe('prod/TestTapStackWithProps.tfstate');
    expect(backend.s3.region).toBe('us-east-1');
  });

  test('should apply custom default tags', () => {
    const vpcs = getResourcesByType(synthesized, 'aws_vpc');
    const vpc = vpcs[0];
    expect(vpc.tags.Environment).toBe('prod');
  });
});