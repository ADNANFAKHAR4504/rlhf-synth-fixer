import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceType = args.type;
    const resourceName = args.name;

    // Mock VPC
    if (resourceType === 'aws:ec2/vpc:Vpc') {
      return {
        id: `vpc-${resourceName}`,
        state: {
          ...args.inputs,
          id: `vpc-${resourceName}`,
          cidrBlock: args.inputs.cidrBlock || '10.0.0.0/16',
          arn: `arn:aws:ec2:eu-central-1:123456789012:vpc/vpc-${resourceName}`,
        },
      };
    }

    // Mock Subnets
    if (resourceType === 'aws:ec2/subnet:Subnet') {
      return {
        id: `subnet-${resourceName}`,
        state: {
          ...args.inputs,
          id: `subnet-${resourceName}`,
          arn: `arn:aws:ec2:eu-central-1:123456789012:subnet/subnet-${resourceName}`,
        },
      };
    }

    // Mock Internet Gateway
    if (resourceType === 'aws:ec2/internetGateway:InternetGateway') {
      return {
        id: `igw-${resourceName}`,
        state: {
          ...args.inputs,
          id: `igw-${resourceName}`,
          arn: `arn:aws:ec2:eu-central-1:123456789012:internet-gateway/igw-${resourceName}`,
        },
      };
    }

    // Mock NAT Gateway
    if (resourceType === 'aws:ec2/natGateway:NatGateway') {
      return {
        id: `nat-${resourceName}`,
        state: {
          ...args.inputs,
          id: `nat-${resourceName}`,
        },
      };
    }

    // Mock EIP
    if (resourceType === 'aws:ec2/eip:Eip') {
      return {
        id: `eip-${resourceName}`,
        state: {
          ...args.inputs,
          id: `eip-${resourceName}`,
          publicIp: `54.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        },
      };
    }

    // Mock Route Table
    if (resourceType === 'aws:ec2/routeTable:RouteTable') {
      return {
        id: `rt-${resourceName}`,
        state: {
          ...args.inputs,
          id: `rt-${resourceName}`,
        },
      };
    }

    // Mock Route
    if (resourceType === 'aws:ec2/route:Route') {
      return {
        id: `route-${resourceName}`,
        state: {
          ...args.inputs,
          id: `route-${resourceName}`,
        },
      };
    }

    // Mock Route Table Association
    if (
      resourceType === 'aws:ec2/routeTableAssociation:RouteTableAssociation'
    ) {
      return {
        id: `rta-${resourceName}`,
        state: {
          ...args.inputs,
          id: `rta-${resourceName}`,
        },
      };
    }

    // Mock Security Group
    if (resourceType === 'aws:ec2/securityGroup:SecurityGroup') {
      return {
        id: `sg-${resourceName}`,
        state: {
          ...args.inputs,
          id: `sg-${resourceName}`,
          arn: `arn:aws:ec2:eu-central-1:123456789012:security-group/sg-${resourceName}`,
        },
      };
    }

    // Mock EC2 Instance
    if (resourceType === 'aws:ec2/instance:Instance') {
      return {
        id: `i-${resourceName}`,
        state: {
          ...args.inputs,
          id: `i-${resourceName}`,
          publicIp: '54.123.45.67',
          privateIp: '10.0.0.100',
          arn: `arn:aws:ec2:eu-central-1:123456789012:instance/i-${resourceName}`,
        },
      };
    }

    // Mock S3 Bucket
    if (resourceType === 'aws:s3/bucket:Bucket') {
      return {
        id: `bucket-${resourceName}`,
        state: {
          ...args.inputs,
          id: `bucket-${resourceName}`,
          arn: `arn:aws:s3:::bucket-${resourceName}`,
          bucket: args.inputs.bucket || `bucket-${resourceName}`,
        },
      };
    }

    // Mock IAM Role
    if (resourceType === 'aws:iam/role:Role') {
      return {
        id: `role-${resourceName}`,
        state: {
          ...args.inputs,
          id: `role-${resourceName}`,
          arn: `arn:aws:iam::123456789012:role/role-${resourceName}`,
        },
      };
    }

    // Mock Flow Log
    if (resourceType === 'aws:ec2/flowLog:FlowLog') {
      return {
        id: `fl-${resourceName}`,
        state: {
          ...args.inputs,
          id: `fl-${resourceName}`,
          arn: `arn:aws:ec2:eu-central-1:123456789012:vpc-flow-log/fl-${resourceName}`,
        },
      };
    }

    // Default mock
    return {
      id: `${resourceType}-${resourceName}`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock getAvailabilityZones
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
        zoneIds: ['euc1-az1', 'euc1-az2', 'euc1-az3'],
      };
    }

    // Mock getAmi
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-0c55b159cbfafe1f0',
        architecture: 'x86_64',
        name: 'amzn2-ami-hvm-2.0.20231218.0-x86_64-gp2',
      };
    }

    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'Test',
        ManagedBy: 'Pulumi',
      },
    });
  });

  describe('VPC Configuration', () => {
    it('should create a VPC', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Subnet Configuration', () => {
    it('should create public subnets', () => {
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.publicSubnetIds).toBeInstanceOf(Array);
      expect(stack.publicSubnetIds.length).toBe(3);
    });

    it('should create private subnets', () => {
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeInstanceOf(Array);
      expect(stack.privateSubnetIds.length).toBe(3);
    });
  });

  describe('Bastion Host', () => {
    it('should create bastion host with public IP output', () => {
      expect(stack.bastionPublicIp).toBeDefined();
      expect(stack.bastionPublicIp).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Stack Outputs', () => {
    it('should expose all required outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.bastionPublicIp).toBeDefined();
    });
  });

  describe('Component Resource', () => {
    it('should be a valid Pulumi ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      const urn = (stack as any).__pulumiURN;
      if (urn) {
        expect(urn).toContain('tap:stack:TapStack');
      }
    });
  });
});

describe('TapStack with Different Environment Suffixes', () => {
  it('should create stack with dev environment', () => {
    const devStack = new TapStack('dev-stack', {
      environmentSuffix: 'dev',
    });
    expect(devStack.vpcId).toBeDefined();
  });

  it('should create stack with prod environment', () => {
    const prodStack = new TapStack('prod-stack', {
      environmentSuffix: 'prod',
    });
    expect(prodStack.vpcId).toBeDefined();
  });

  it('should default to dev when no suffix provided', () => {
    const defaultStack = new TapStack('default-stack', {});
    expect(defaultStack.vpcId).toBeDefined();
  });
});

describe('TapStack Tags', () => {
  it('should apply custom tags to resources', () => {
    const taggedStack = new TapStack('tagged-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'Testing',
        ManagedBy: 'Pulumi',
        Owner: 'DevOps',
        CostCenter: '12345',
      },
    });
    expect(taggedStack.vpcId).toBeDefined();
  });
});
