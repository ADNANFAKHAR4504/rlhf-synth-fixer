import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi modules
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(() => ({
    registerOutputs: jest.fn(),
  })),
  Config: jest.fn(() => ({
    get: jest.fn(),
  })),
  Output: {
    create: jest.fn((value) => Promise.resolve(value)),
  },
  all: jest.fn((values) => Promise.resolve(values)),
}));

jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn(),
  getAvailabilityZones: jest.fn(() => Promise.resolve({ names: ['us-east-1a', 'us-east-1b'] })),
  ec2: {
    getAmi: jest.fn(() => Promise.resolve({ id: 'ami-12345678' })),
    Vpc: jest.fn(),
    InternetGateway: jest.fn(),
    Subnet: jest.fn(),
    RouteTable: jest.fn(),
    Route: jest.fn(),
    RouteTableAssociation: jest.fn(),
    Eip: jest.fn(),
    NatGateway: jest.fn(),
    SecurityGroup: jest.fn(),
    Instance: jest.fn(),
  },
  iam: {
    Role: jest.fn(),
    RolePolicyAttachment: jest.fn(),
    InstanceProfile: jest.fn(),
  },
  secretsmanager: {
    Secret: jest.fn(),
    SecretVersion: jest.fn(),
  },
  cloudwatch: {
    LogGroup: jest.fn(),
  },
  rds: {
    SubnetGroup: jest.fn(),
    Instance: jest.fn(),
  },
  lb: {
    LoadBalancer: jest.fn(),
    TargetGroup: jest.fn(),
    TargetGroupAttachment: jest.fn(),
    Listener: jest.fn(),
  },
}));

describe('TapStack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('with required props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        region: 'us-west-2',
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'infrastructure',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('creates AWS provider with correct region', () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws-us-west-2',
        { region: 'us-west-2' },
        expect.any(Object)
      );
    });

    it('creates VPC with correct CIDR', () => {
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'prod-prod-vpc-us-west-2',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it('creates Internet Gateway', () => {
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'prod-prod-igw-us-west-2',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('creates public subnets', () => {
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'prod-prod-public-subnet-1-us-west-2',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'prod-prod-public-subnet-2-us-west-2',
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );
    });

    it('creates private subnets', () => {
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'prod-prod-private-subnet-1-us-west-2',
        expect.objectContaining({
          cidrBlock: '10.0.10.0/24',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'prod-prod-private-subnet-2-us-west-2',
        expect.objectContaining({
          cidrBlock: '10.0.11.0/24',
        }),
        expect.any(Object)
      );
    });

    it('creates security groups', () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'prod-prod-alb-sg-us-west-2',
        expect.objectContaining({
          name: 'prod-prod-alb-sg-us-west-2',
          description: 'Security group for Application Load Balancer',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'prod-prod-ec2-sg-us-west-2',
        expect.objectContaining({
          name: 'prod-prod-ec2-sg-us-west-2',
          description: 'Security group for EC2 instances',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'prod-prod-rds-sg-us-west-2',
        expect.objectContaining({
          name: 'prod-prod-rds-sg-us-west-2',
          description: 'Security group for RDS database',
        }),
        expect.any(Object)
      );
    });

    it('creates RDS instance', () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(
        'prod-prod-database-us-west-2',
        expect.objectContaining({
          identifier: 'prod-prod-database-us-west-2',
          engine: 'mysql',
          instanceClass: 'db.t3.micro',
          username: 'admin',
        }),
        expect.any(Object)
      );
    });

    it('creates Load Balancer', () => {
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        'prod-prod-alb-us-west-2',
        expect.objectContaining({
          name: 'prod-prod-alb-us-west-2',
          loadBalancerType: 'application',
          internal: false,
        }),
        expect.any(Object)
      );
    });
  });

  describe('with minimal props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackMinimal', {
        region: 'us-east-1',
        environmentSuffix: 'dev',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('uses provided region', () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws-us-east-1',
        { region: 'us-east-1' },
        expect.any(Object)
      );
    });
  });
});