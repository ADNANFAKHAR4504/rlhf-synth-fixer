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
    it('should create VPC with correct CIDR block', done => {
      pulumi.output(vpc.vpc.cidrBlock).apply(cidrBlock => {
        expect(cidrBlock).toBe('10.0.0.0/16');
        done();
      });
    });

    it('should enable DNS hostnames', done => {
      pulumi.output(vpc.vpc.enableDnsHostnames).apply(dnsHostnames => {
        expect(dnsHostnames).toBe(true);
        done();
      });
    });

    it('should enable DNS support', done => {
      pulumi.output(vpc.vpc.enableDnsSupport).apply(dnsSupport => {
        expect(dnsSupport).toBe(true);
        done();
      });
    });

    it('should have proper tags including environment', done => {
      pulumi.output(vpc.vpc.tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-vpc-unit-test',
            Environment: 'test',
            ManagedBy: 'Pulumi',
            CostCenter: 'Platform',
            TestTag: 'TestValue',
          })
        );
        done();
      });
    });
  });

  describe('Public Subnets', () => {
    it('should create exactly 3 public subnets', () => {
      expect(vpc.publicSubnets).toHaveLength(3);
    });

    it('should configure public subnets with correct CIDR blocks', done => {
      pulumi.all(vpc.publicSubnets.map(s => s.cidrBlock)).apply(cidrBlocks => {
        expect(cidrBlocks).toEqual([
          '10.0.0.0/24',
          '10.0.2.0/24',
          '10.0.4.0/24',
        ]);
        done();
      });
    });

    it('should configure public subnets in correct availability zones', done => {
      pulumi.all(vpc.publicSubnets.map(s => s.availabilityZone)).apply(azs => {
        expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
        done();
      });
    });

    it('should enable public IP mapping on public subnets', done => {
      pulumi.all(vpc.publicSubnets.map(s => s.mapPublicIpOnLaunch)).apply(publicIpMappings => {
        expect(publicIpMappings).toEqual([true, true, true]);
        done();
      });
    });

    it('should tag public subnets with proper names', done => {
      pulumi.all(vpc.publicSubnets.map(s => s.tags)).apply(tags => {
        expect(tags[0]).toEqual(
          expect.objectContaining({
            Name: 'test-public-us-east-1a-unit-test',
            Type: 'Public',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('Private Subnets', () => {
    it('should create exactly 3 private subnets', () => {
      expect(vpc.privateSubnets).toHaveLength(3);
    });

    it('should configure private subnets with correct CIDR blocks', done => {
      pulumi.all(vpc.privateSubnets.map(s => s.cidrBlock)).apply(cidrBlocks => {
        expect(cidrBlocks).toEqual([
          '10.0.1.0/24',
          '10.0.3.0/24',
          '10.0.5.0/24',
        ]);
        done();
      });
    });

    it('should configure private subnets in correct availability zones', done => {
      pulumi.all(vpc.privateSubnets.map(s => s.availabilityZone)).apply(azs => {
        expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
        done();
      });
    });

    it('should tag private subnets with proper names', done => {
      pulumi.all(vpc.privateSubnets.map(s => s.tags)).apply(tags => {
        expect(tags[0]).toEqual(
          expect.objectContaining({
            Name: 'test-private-us-east-1a-unit-test',
            Type: 'Private',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('Internet Gateway', () => {
    it('should create internet gateway', () => {
      expect(vpc.internetGateway).toBeDefined();
    });

    it('should attach internet gateway to VPC', done => {
      pulumi.all([vpc.internetGateway.vpcId, vpc.vpc.id]).apply(([vpcId, expectedVpcId]) => {
        expect(vpcId).toBe(expectedVpcId);
        done();
      });
    });

    it('should tag internet gateway properly', done => {
      pulumi.output(vpc.internetGateway.tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-igw-unit-test',
            Environment: 'test',
            ManagedBy: 'Pulumi',
          })
        );
        done();
      });
    });
  });

  describe('NAT Gateways', () => {
    it('should create exactly 3 NAT gateways', () => {
      expect(vpc.natGateways).toHaveLength(3);
    });

    it('should place NAT gateways in public subnets', done => {
      pulumi.all([
        ...vpc.natGateways.map(nat => nat.subnetId),
        ...vpc.publicSubnets.map(s => s.id)
      ]).apply(results => {
        const subnetIds = results.slice(0, vpc.natGateways.length);
        const publicSubnetIds = results.slice(vpc.natGateways.length);
        subnetIds.forEach((id: any) => {
          expect(publicSubnetIds).toContain(id);
        });
        done();
      });
    });

    it('should tag NAT gateways properly', done => {
      pulumi.output(vpc.natGateways[0].tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-nat-us-east-1a-unit-test',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('Web Security Group', () => {
    it('should create web security group', () => {
      expect(vpc.webSecurityGroup).toBeDefined();
    });

    it('should configure HTTPS ingress rule', done => {
      pulumi.output(vpc.webSecurityGroup.ingress).apply(ingress => {
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
        done();
      });
    });

    it('should allow all outbound traffic', done => {
      pulumi.output(vpc.webSecurityGroup.egress).apply(egress => {
        expect(egress).toHaveLength(1);
        expect(egress[0]).toEqual(
          expect.objectContaining({
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          })
        );
        done();
      });
    });

    it('should tag web security group properly', done => {
      pulumi.output(vpc.webSecurityGroup.tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-web-sg-unit-test',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('App Security Group', () => {
    it('should create app security group', () => {
      expect(vpc.appSecurityGroup).toBeDefined();
    });

    it('should tag app security group properly', done => {
      pulumi.output(vpc.appSecurityGroup.tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-app-sg-unit-test',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    it('should create flow log group', () => {
      expect(vpc.flowLogGroup).toBeDefined();
    });

    it('should configure log group with 7-day retention', done => {
      pulumi.output(vpc.flowLogGroup.retentionInDays).apply(retention => {
        expect(retention).toBe(7);
        done();
      });
    });

    it('should name log group correctly', done => {
      pulumi.output(vpc.flowLogGroup.name).apply(name => {
        expect(name).toBe('/aws/vpc/flow-logs-test-unit-test');
        done();
      });
    });

    it('should tag flow log group properly', done => {
      pulumi.output(vpc.flowLogGroup.tags).apply(tags => {
        expect(tags).toEqual(
          expect.objectContaining({
            Name: 'test-flow-logs-unit-test',
            Environment: 'test',
          })
        );
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environment name and suffix in all resource names', done => {
      pulumi.output(vpc.vpc.tags).apply(tags => {
        const vpcName = tags?.Name;
        expect(vpcName).toContain('test');
        expect(vpcName).toContain('unit-test');
        done();
      });
    });
  });
});

describe('VpcComponent Multi-Environment Test', () => {
  it('should support multiple environment configurations', done => {
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

    pulumi.all([devVpc.vpc.cidrBlock, stagingVpc.vpc.cidrBlock, prodVpc.vpc.cidrBlock]).apply(([devCidr, stagingCidr, prodCidr]) => {
      expect(devCidr).toBe('10.0.0.0/16');
      expect(stagingCidr).toBe('10.1.0.0/16');
      expect(prodCidr).toBe('10.2.0.0/16');
      done();
    });
  });
});
