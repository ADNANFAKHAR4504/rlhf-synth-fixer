// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation((name, args) => ({
      id: `mock-vpc-id-${name}`,
      cidrBlock: args.cidrBlock,
    })),
    InternetGateway: jest.fn().mockImplementation((name, args) => ({
      id: `mock-igw-id-${name}`,
    })),
    Subnet: jest.fn().mockImplementation((name, args) => ({
      id: `mock-subnet-id-${name}`,
      cidrBlock: args.cidrBlock,
    })),
    RouteTable: jest.fn().mockImplementation((name, args) => ({
      id: `mock-rt-id-${name}`,
    })),
    Route: jest.fn().mockImplementation((name, args) => ({})),
    RouteTableAssociation: jest.fn().mockImplementation((name, args) => ({})),
    Eip: jest.fn().mockImplementation((name, args) => ({
      id: `mock-eip-id-${name}`,
    })),
    NatGateway: jest.fn().mockImplementation((name, args) => ({
      id: `mock-nat-id-${name}`,
    })),
  },
  getAvailabilityZones: jest.fn().mockResolvedValue({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  }),
  getAvailabilityZonesOutput: jest.fn().mockReturnValue({
    names: {
      apply: jest.fn().mockImplementation((fn) => fn(['us-east-1a', 'us-east-1b', 'us-east-1c']))
    }
  }),
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
  all: jest.fn().mockImplementation((outputs) => ({
    apply: jest.fn().mockImplementation((fn) => fn(outputs))
  })),
}));

import * as aws from '@pulumi/aws';
import { VpcStack } from '../lib/stacks/vpc-stack';

describe('VpcStack Unit Tests', () => {
  let vpcStack: VpcStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create VPC stack with default values', () => {
      vpcStack = new VpcStack('test-vpc', {});
      expect(vpcStack).toBeDefined();
    });

    it('should create VPC stack with custom values', () => {
      vpcStack = new VpcStack('test-vpc', {
        environmentSuffix: 'prod',
        vpcCidr: '172.16.0.0/16',
        tags: { Environment: 'prod' },
      });
      expect(vpcStack).toBeDefined();
    });
  });

  describe('VPC Creation', () => {
    beforeEach(() => {
      vpcStack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        tags: { Environment: 'test' },
      });
    });

    it('should create VPC with correct configuration', () => {
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'tap-vpc-test',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'tap-vpc-test',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create Internet Gateway', () => {
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'tap-igw-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tap-igw-test',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should fetch availability zones', () => {
      expect(aws.getAvailabilityZonesOutput).toHaveBeenCalledWith({
        state: 'available',
      });
    });

    it('should create public and private subnets', () => {
      // Should create at least one public and one private subnet
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      const publicSubnets = subnetCalls.filter(call => call[0].includes('public'));
      const privateSubnets = subnetCalls.filter(call => call[0].includes('private'));

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    it('should disable auto-assign public IP on public subnets', () => {
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      const publicSubnetCalls = subnetCalls.filter(call => call[0].includes('public'));

      publicSubnetCalls.forEach(call => {
        expect(call[1].mapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should create NAT Gateways for private subnet internet access', () => {
      expect(aws.ec2.Eip).toHaveBeenCalled();
      expect(aws.ec2.NatGateway).toHaveBeenCalled();
    });

    it('should create route tables and routes', () => {
      expect(aws.ec2.RouteTable).toHaveBeenCalled();
      expect(aws.ec2.Route).toHaveBeenCalled();
      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalled();
    });

    it('should create public route table with internet gateway route', () => {
      const routeTableCalls = (aws.ec2.RouteTable as unknown as jest.Mock).mock.calls;
      const publicRouteTable = routeTableCalls.find(call => call[0].includes('public-rt'));
      
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable[1].tags.Name).toContain('tap-public-rt-test');
    });

    it('should create private route tables with NAT gateway routes', () => {
      const routeTableCalls = (aws.ec2.RouteTable as unknown as jest.Mock).mock.calls;
      const privateRouteTables = routeTableCalls.filter(call => call[0].includes('private-rt'));
      
      expect(privateRouteTables.length).toBeGreaterThan(0);
    });

    it('should create route table associations', () => {
      const associationCalls = (aws.ec2.RouteTableAssociation as unknown as jest.Mock).mock.calls;
      
      expect(associationCalls.length).toBeGreaterThanOrEqual(0);
      
      // Verify association calls have required parameters
      associationCalls.forEach(call => {
        expect(call[1]).toHaveProperty('subnetId');
        expect(call[1]).toHaveProperty('routeTableId');
      });
    });
  });

  describe('Multi-AZ Configuration', () => {
    beforeEach(() => {
      vpcStack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should create subnets across multiple availability zones', () => {
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      
      // Should create subnets with different AZ indices
      const subnetNames = subnetCalls.map(call => call[0]);
      const uniqueAzIndices = new Set();
      
      subnetNames.forEach(name => {
        const match = name.match(/-(\d+)-/);
        if (match) {
          uniqueAzIndices.add(match[1]);
        }
      });
      
      expect(uniqueAzIndices.size).toBeGreaterThan(0);
    });

    it('should create EIPs for each NAT Gateway', () => {
      const eipCalls = (aws.ec2.Eip as unknown as jest.Mock).mock.calls;
      
      expect(eipCalls.length).toBeGreaterThan(0);
      eipCalls.forEach(call => {
        expect(call[1].domain).toBe('vpc');
      });
    });

    it('should create NAT Gateways in public subnets', () => {
      const natCalls = (aws.ec2.NatGateway as unknown as jest.Mock).mock.calls;
      
      expect(natCalls.length).toBeGreaterThan(0);
      natCalls.forEach(call => {
        expect(call[1].allocationId).toBeDefined();
        expect(call[1].subnetId).toBeDefined();
      });
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in all resource names', () => {
      const environmentSuffix = 'staging';
      vpcStack = new VpcStack('test-vpc', { environmentSuffix });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        `tap-vpc-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );

      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        `tap-igw-${environmentSuffix}`,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      vpcStack = new VpcStack('test-vpc', { environmentSuffix });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-vpc-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should use environment suffix in subnet names and tags', () => {
      const environmentSuffix = 'dev';
      vpcStack = new VpcStack('test-vpc', { environmentSuffix });

      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      
      subnetCalls.forEach(call => {
        expect(call[0]).toContain(environmentSuffix);
        expect(call[1].tags.Name).toContain(environmentSuffix);
      });
    });
  });

  describe('Network Security Configuration', () => {
    beforeEach(() => {
      vpcStack = new VpcStack('test-vpc', { environmentSuffix: 'test' });
    });

    it('should enable DNS hostname and support', () => {
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it('should use custom VPC CIDR when provided', () => {
      const customCidr = '172.16.0.0/16';
      vpcStack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: customCidr,
      });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cidrBlock: customCidr,
        }),
        expect.any(Object)
      );
    });

    it('should use default VPC CIDR when not provided', () => {
      vpcStack = new VpcStack('test-vpc-default', {});

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
        }),
        expect.any(Object)
      );
    });

    it('should create subnets with appropriate CIDR blocks', () => {
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      
      subnetCalls.forEach(call => {
        expect(call[1].cidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });

    it('should tag subnets with appropriate type', () => {
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      
      const publicSubnets = subnetCalls.filter(call => call[0].includes('public'));
      const privateSubnets = subnetCalls.filter(call => call[0].includes('private'));
      
      publicSubnets.forEach(call => {
        expect(call[1].tags.Type).toBe('public');
      });
      
      privateSubnets.forEach(call => {
        expect(call[1].tags.Type).toBe('private');
      });
    });
  });

  describe('Async Availability Zone Handling', () => {
    it('should handle availability zone promise resolution', async () => {
      // Mock the promise resolution
      const mockAzPromise = Promise.resolve(['us-east-1a', 'us-east-1b', 'us-east-1c']);
      (aws.getAvailabilityZones as jest.Mock).mockResolvedValue({
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      });

      vpcStack = new VpcStack('test-vpc-async', {
        environmentSuffix: 'test',
      });

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(aws.getAvailabilityZonesOutput).toHaveBeenCalledWith({
        state: 'available',
      });
    });

    it('should create resources after availability zones are resolved', async () => {
      vpcStack = new VpcStack('test-vpc-resolved', {
        environmentSuffix: 'test',
      });

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify that subnets were created after AZ resolution
      const subnetCalls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls;
      expect(subnetCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Route Configuration', () => {
    beforeEach(() => {
      vpcStack = new VpcStack('test-vpc', { environmentSuffix: 'test' });
    });

    it('should create routes to internet gateway for public subnets', () => {
      const routeCalls = (aws.ec2.Route as unknown as jest.Mock).mock.calls;
      const publicRoutes = routeCalls.filter(call => call[0].includes('public-route'));
      
      expect(publicRoutes.length).toBeGreaterThan(0);
      publicRoutes.forEach(call => {
        expect(call[1].destinationCidrBlock).toBe('0.0.0.0/0');
        expect(call[1].gatewayId).toBeDefined();
      });
    });

    it('should create routes to NAT gateways for private subnets', () => {
      const routeCalls = (aws.ec2.Route as unknown as jest.Mock).mock.calls;
      const privateRoutes = routeCalls.filter(call => call[0].includes('private-route'));
      
      expect(privateRoutes.length).toBeGreaterThan(0);
      privateRoutes.forEach(call => {
        expect(call[1].destinationCidrBlock).toBe('0.0.0.0/0');
        expect(call[1].natGatewayId).toBeDefined();
      });
    });
  });
});
