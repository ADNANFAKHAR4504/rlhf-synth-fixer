import * as pulumi from '@pulumi/pulumi';
import { VpcComponent } from '../lib/vpc-component';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('VpcComponent Unit Tests', () => {
  let vpc: VpcComponent;

  beforeAll(async () => {
    vpc = new VpcComponent('test-vpc', {
      environmentName: 'test',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      environmentSuffix: 'unit-test',
      tags: { TestTag: 'TestValue' },
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      const cidrBlock = await pulumi.output(vpc.vpc.cidrBlock).promise();
      expect(cidrBlock).toBe('10.0.0.0/16');
    });

    it('should enable DNS hostnames', async () => {
      const dnsHostnames = await pulumi.output(vpc.vpc.enableDnsHostnames).promise();
      expect(dnsHostnames).toBe(true);
    });

    it('should enable DNS support', async () => {
      const dnsSupport = await pulumi.output(vpc.vpc.enableDnsSupport).promise();
      expect(dnsSupport).toBe(true);
    });

    it('should have proper tags including environment', async () => {
      const tags = await pulumi.output(vpc.vpc.tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-vpc-unit-test',
          Environment: 'test',
          ManagedBy: 'Pulumi',
          CostCenter: 'Platform',
          TestTag: 'TestValue',
        })
      );
    });
  });

  describe('Public Subnets', () => {
    it('should create exactly 3 public subnets', () => {
      expect(vpc.publicSubnets).toHaveLength(3);
    });

    it('should configure public subnets with correct CIDR blocks', async () => {
      const cidrBlocks = await Promise.all(
        vpc.publicSubnets.map(s => pulumi.output(s.cidrBlock).promise())
      );
      expect(cidrBlocks).toEqual([
        '10.0.0.0/24',
        '10.0.2.0/24',
        '10.0.4.0/24',
      ]);
    });

    it('should configure public subnets in correct availability zones', async () => {
      const azs = await Promise.all(vpc.publicSubnets.map(s => pulumi.output(s.availabilityZone).promise()));
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    it('should enable public IP mapping on public subnets', async () => {
      const publicIpMappings = await Promise.all(
        vpc.publicSubnets.map(s => pulumi.output(s.mapPublicIpOnLaunch).promise())
      );
      expect(publicIpMappings).toEqual([true, true, true]);
    });

    it('should tag public subnets with proper names', async () => {
      const tags = await Promise.all(vpc.publicSubnets.map(s => pulumi.output(s.tags).promise()));
      expect(tags[0]).toEqual(
        expect.objectContaining({
          Name: 'test-public-us-east-1a-unit-test',
          Type: 'Public',
          Environment: 'test',
        })
      );
    });
  });

  describe('Private Subnets', () => {
    it('should create exactly 3 private subnets', () => {
      expect(vpc.privateSubnets).toHaveLength(3);
    });

    it('should configure private subnets with correct CIDR blocks', async () => {
      const cidrBlocks = await Promise.all(
        vpc.privateSubnets.map(s => pulumi.output(s.cidrBlock).promise())
      );
      expect(cidrBlocks).toEqual([
        '10.0.1.0/24',
        '10.0.3.0/24',
        '10.0.5.0/24',
      ]);
    });

    it('should configure private subnets in correct availability zones', async () => {
      const azs = await Promise.all(
        vpc.privateSubnets.map(s => pulumi.output(s.availabilityZone).promise())
      );
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    it('should tag private subnets with proper names', async () => {
      const tags = await Promise.all(vpc.privateSubnets.map(s => pulumi.output(s.tags).promise()));
      expect(tags[0]).toEqual(
        expect.objectContaining({
          Name: 'test-private-us-east-1a-unit-test',
          Type: 'Private',
          Environment: 'test',
        })
      );
    });
  });

  describe('Internet Gateway', () => {
    it('should create internet gateway', () => {
      expect(vpc.internetGateway).toBeDefined();
    });

    it('should attach internet gateway to VPC', async () => {
      const vpcId = await pulumi.output(vpc.internetGateway.vpcId).promise();
      const expectedVpcId = await pulumi.output(vpc.vpc.id).promise();
      expect(vpcId).toBe(expectedVpcId);
    });

    it('should tag internet gateway properly', async () => {
      const tags = await pulumi.output(vpc.internetGateway.tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-igw-unit-test',
          Environment: 'test',
          ManagedBy: 'Pulumi',
        })
      );
    });
  });

  describe('NAT Gateways', () => {
    it('should create exactly 3 NAT gateways', () => {
      expect(vpc.natGateways).toHaveLength(3);
    });

    it('should place NAT gateways in public subnets', async () => {
      const subnetIds = await Promise.all(
        vpc.natGateways.map(nat => pulumi.output(nat.subnetId).promise())
      );
      const publicSubnetIds = await Promise.all(
        vpc.publicSubnets.map(s => pulumi.output(s.id).promise())
      );
      subnetIds.forEach(id => {
        expect(publicSubnetIds).toContain(id);
      });
    });

    it('should tag NAT gateways properly', async () => {
      const tags = await pulumi.output(vpc.natGateways[0].tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-nat-us-east-1a-unit-test',
          Environment: 'test',
        })
      );
    });
  });

  describe('Web Security Group', () => {
    it('should create web security group', () => {
      expect(vpc.webSecurityGroup).toBeDefined();
    });

    it('should configure HTTPS ingress rule', async () => {
      const ingress = await pulumi.output(vpc.webSecurityGroup.ingress).promise();
      expect(ingress).toHaveLength(1);
      expect(ingress[0]).toEqual(
        expect.objectContaining({
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        })
      );
    });

    it('should allow all outbound traffic', async () => {
      const egress = await pulumi.output(vpc.webSecurityGroup.egress).promise();
      expect(egress).toHaveLength(1);
      expect(egress[0]).toEqual(
        expect.objectContaining({
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
        })
      );
    });

    it('should tag web security group properly', async () => {
      const tags = await pulumi.output(vpc.webSecurityGroup.tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-web-sg-unit-test',
          Environment: 'test',
        })
      );
    });
  });

  describe('App Security Group', () => {
    it('should create app security group', () => {
      expect(vpc.appSecurityGroup).toBeDefined();
    });

    it('should tag app security group properly', async () => {
      const tags = await pulumi.output(vpc.appSecurityGroup.tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-app-sg-unit-test',
          Environment: 'test',
        })
      );
    });
  });

  describe('VPC Flow Logs', () => {
    it('should create flow log group', () => {
      expect(vpc.flowLogGroup).toBeDefined();
    });

    it('should configure log group with 7-day retention', async () => {
      const retention = await pulumi.output(vpc.flowLogGroup.retentionInDays).promise();
      expect(retention).toBe(7);
    });

    it('should name log group correctly', async () => {
      const name = await pulumi.output(vpc.flowLogGroup.name).promise();
      expect(name).toBe('/aws/vpc/flow-logs-test-unit-test');
    });

    it('should tag flow log group properly', async () => {
      const tags = await pulumi.output(vpc.flowLogGroup.tags).promise();
      expect(tags).toEqual(
        expect.objectContaining({
          Name: 'test-flow-logs-unit-test',
          Environment: 'test',
        })
      );
    });
  });

  describe('Resource Naming', () => {
    it('should include environment name and suffix in all resource names', async () => {
      const tags = await pulumi.output(vpc.vpc.tags).promise();
      const vpcName = tags.Name;
      expect(vpcName).toContain('test');
      expect(vpcName).toContain('unit-test');
    });
  });
});

describe('VpcComponent Multi-Environment Test', () => {
  it('should support multiple environment configurations', async () => {
    const devVpc = new VpcComponent('dev-vpc', {
      environmentName: 'dev',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      environmentSuffix: 'test',
    });

    const stagingVpc = new VpcComponent('staging-vpc', {
      environmentName: 'staging',
      vpcCidr: '10.1.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      environmentSuffix: 'test',
    });

    const prodVpc = new VpcComponent('prod-vpc', {
      environmentName: 'production',
      vpcCidr: '10.2.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      environmentSuffix: 'test',
    });

    const devCidr = await pulumi.output(devVpc.vpc.cidrBlock).promise();
    const stagingCidr = await pulumi.output(stagingVpc.vpc.cidrBlock).promise();
    const prodCidr = await pulumi.output(prodVpc.vpc.cidrBlock).promise();

    expect(devCidr).toBe('10.0.0.0/16');
    expect(stagingCidr).toBe('10.1.0.0/16');
    expect(prodCidr).toBe('10.2.0.0/16');
  });
});
