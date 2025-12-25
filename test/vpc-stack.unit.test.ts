import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { VpcStack } from '../lib/vpc-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
  invoke: () => Promise.resolve({ id: 'vpc-123' }),
} as any;

describe('VpcStack', () => {
  let stack: VpcStack;
  const mockVpc = {
    id: 'vpc-0b094aa4091786d92',
    cidrBlock: '172.31.0.0/16',
  };
  const mockSubnet = {
    id: pulumi.Output.create('subnet-123'),
  };
  const mockSecurityGroup = {
    id: pulumi.Output.create('sg-123'),
  };
  const mockSubnetGroup = {
    name: pulumi.Output.create('db-subnet-group'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS resources
    jest.spyOn(aws.ec2, 'getVpc').mockResolvedValue(mockVpc as any);
    jest.spyOn(aws, 'getAvailabilityZones').mockResolvedValue({
      names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
    } as any);
    jest.spyOn(aws.ec2, 'Subnet').mockImplementation((() => mockSubnet) as any);
    jest
      .spyOn(aws.ec2, 'SecurityGroup')
      .mockImplementation((() => mockSecurityGroup) as any);
    jest
      .spyOn(aws.rds, 'SubnetGroup')
      .mockImplementation((() => mockSubnetGroup) as any);
  });

  describe('constructor', () => {
    it('should use the default VPC', () => {
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      // Should have a VPC ID assigned
      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.id).toBeDefined();
    });

    it('should create private subnets for RDS', () => {
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.Subnet).toHaveBeenCalledTimes(2);
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining('tap-private-subnet-1-test'),
        expect.objectContaining({
          vpcId: expect.any(Promise),
          cidrBlock: '172.31.96.0/24',
          availabilityZone: expect.any(Promise),
        }),
        expect.any(Object)
      );
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining('tap-private-subnet-2-test'),
        expect.objectContaining({
          vpcId: expect.any(Promise),
          cidrBlock: '172.31.97.0/24',
          availabilityZone: expect.any(Promise),
        }),
        expect.any(Object)
      );
    });

    it('should create DB subnet group', () => {
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
      });

      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-subnet-group-test'),
        expect.objectContaining({
          subnetIds: expect.arrayContaining([mockSubnet.id, mockSubnet.id]),
        }),
        expect.any(Object)
      );
    });

    it('should create security group for RDS', () => {
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-sg-test'),
        expect.objectContaining({
          vpcId: expect.any(Promise),
          description: 'Security group for RDS database',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp',
              cidrBlocks: ['172.31.0.0/16'],
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should use default environment suffix when not provided', () => {
      stack = new VpcStack('test-vpc', {});

      expect(aws.ec2.getVpc).toHaveBeenCalledWith({ default: true });
    });

    it('should expose VPC and other resources', () => {
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
      });

      expect(stack.vpc).toBeDefined();
      expect(stack.privateSubnet1).toBeDefined();
      expect(stack.privateSubnet2).toBeDefined();
      expect(stack.dbSubnetGroup).toBeDefined();
      expect(stack.dbSecurityGroup).toBeDefined();
    });

    it('should apply tags to all resources', () => {
      const tags = { Environment: 'test', Project: 'tap' };
      stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        tags,
      });

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: expect.stringContaining('tap-private-subnet'),
          }),
        }),
        expect.any(Object)
      );
    });
  });
});
