import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Unit Tests', () => {
  let resourcesByType: Record<string, any[]>;

  beforeAll(() => {
    const app = new App();
    const stack = new TapStack(app, 'test', {
    environmentSuffix: 'dev',
    stateBucket: 'iac-rlhf-tf-states',
    stateBucketRegion: 'us-east-1',
    awsRegion: 'us-east-1',
  });


    app.synth();
    const outPath = path.join(app.outdir, 'stacks', 'test', 'cdk.tf.json');
    const json = JSON.parse(fs.readFileSync(outPath, 'utf8'));

    // Properly extract resources by type
    const rawResources = json.resource || {};
    resourcesByType = {};

    for (const [resourceType, resourceArrayOrObject] of Object.entries(rawResources)) {
      if (!resourcesByType[resourceType]) {
        resourcesByType[resourceType] = [];
      }

      // Convert to array if it's a flat object
      if (Array.isArray(resourceArrayOrObject)) {
        resourcesByType[resourceType].push(...resourceArrayOrObject);
      } else {
        for (const [name, config] of Object.entries(resourceArrayOrObject as object)) {
          resourcesByType[resourceType].push({ name, ...config });
        }
      }
    }
  });

  it('should define a VPC with correct CIDR block', () => {
    const vpcs = resourcesByType['aws_vpc'] || [];
    expect(vpcs.length).toBe(1);
    expect(vpcs[0].cidr_block).toBe('10.0.0.0/16');
  });

  it('should create 2 public subnets', () => {
    const subnets = resourcesByType['aws_subnet'] || [];
    expect(subnets.length).toBe(2);
    const cidrs = subnets.map(s => s.cidr_block);
    expect(cidrs).toContain('10.0.0.0/24');
    expect(cidrs).toContain('10.0.1.0/24');
  });

  it('should create an Internet Gateway', () => {
    const igws = resourcesByType['aws_internet_gateway'] || [];
    expect(igws.length).toBe(1);
  });

  it('should define a route to the IGW', () => {
    const routes = resourcesByType['aws_route'] || [];
    expect(routes.length).toBe(1);
    expect(routes[0].destination_cidr_block).toBe('0.0.0.0/0');
    expect(routes[0].gateway_id).toBeDefined();
  });

  it('should associate the route table with public subnets', () => {
    const associations = resourcesByType['aws_route_table_association'] || [];
    expect(associations.length).toBe(2);
  });

  it('should create a security group with SSH and HTTP ingress rules', () => {
    const sgRules = resourcesByType['aws_security_group_rule'] || [];
    const ingressRules = sgRules.filter(rule => rule.type === 'ingress');
    const ports = ingressRules.map(rule => rule.from_port);
    expect(ports).toContain(22);
    expect(ports).toContain(80);
  });

  it('should define EC2 instances with correct AMI and instance type', () => {
    const instances = resourcesByType['aws_instance'] || [];
    expect(instances.length).toBe(2);
    instances.forEach(instance => {
      expect(instance.ami).toBe('${data.aws_ssm_parameter.iacProject-dev-ami-param.value}');
      expect(instance.instance_type).toBe('t3.micro');
    });
  });

  it('should create EIPs and associate them to instances', () => {
    const eips = resourcesByType['aws_eip'] || [];
    const eipAssociations = resourcesByType['aws_eip_association'] || [];
    expect(eips.length).toBe(2);
    expect(eipAssociations.length).toBe(2);
  });
});
