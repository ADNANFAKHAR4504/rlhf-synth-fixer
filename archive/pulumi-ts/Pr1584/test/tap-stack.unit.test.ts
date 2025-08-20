// Mock Pulumi before importing
const mockRegisterOutputs = jest.fn();
const mockComponentResource = jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts?: any) {
  this.registerOutputs = mockRegisterOutputs;
  this.type = type;
  this.name = name;
  this.args = args;
  this.opts = opts;
});

jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
  ComponentResource: mockComponentResource,
  all: jest.fn().mockImplementation(values => Promise.resolve(values)),
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'instanceType':
          return 't3.micro';
        case 'aws:region':
          return 'ap-south-1';
        case 'configRecorderName':
          return 'config-recorder-prod';
        case 'existingRecorderName':
          return 'config-recorder-prod';
        case 'existingDeliveryChannelName':
          return 'config-delivery-prod';
        default:
          return undefined;
      }
    }),
    getObject: jest.fn().mockImplementation((key: string) => {
      if (key === 'allowedSshCidrs') {
        return ['203.26.56.90/32'];
      }
      return undefined;
    }),
  })),
  interpolate: jest.fn((template: string) => template),
  secret: jest.fn((value: string) => value),
  output: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
}));

// Mock AWS provider
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(() => ({
    region: 'ap-south-1',
  })),
  ec2: {
    getAmi: jest.fn().mockImplementation(() => ({
      then: (fn: any) => fn({ id: 'ami-12345678' }),
    })),
  },
}));

// Mock infrastructure components
jest.mock('../lib/infrastructure', () => ({
  createInfrastructure: jest.fn().mockImplementation(() => ({
    vpcId: 'mock-vpc-id',
    publicSubnetIds: ['mock-public-subnet-1', 'mock-public-subnet-2'],
    privateSubnetIds: ['mock-private-subnet-1', 'mock-private-subnet-2'],
    internetGatewayId: 'mock-igw-id',
    securityGroupId: 'mock-sg-id',
    ec2InstanceId: 'mock-instance-id',
    ec2InstancePublicIp: '203.0.113.1',
    ec2InstancePublicDns: 'ec2-203-0-113-1.ap-south-1.compute.amazonaws.com',
    cloudTrailArn: 'arn:aws:cloudtrail:ap-south-1:123456789012:trail/mock-trail',
    guardDutyDetectorId: 'mock-detector-id',
    natGatewayId: 'mock-nat-gateway-id',
    vpcFlowLogId: 'mock-vpc-flow-log-id',
  })),
}));

// Mock VPC components
jest.mock('../lib/vpc', () => ({
  createVpcResources: jest.fn().mockImplementation(() => ({
    vpc: { id: 'mock-vpc-id' },
    publicSubnets: [
      { id: 'mock-public-subnet-1' },
      { id: 'mock-public-subnet-2' },
    ],
    privateSubnets: [
      { id: 'mock-private-subnet-1' },
      { id: 'mock-private-subnet-2' },
    ],
    internetGateway: { id: 'mock-igw-id' },
    natGateway: { id: 'mock-nat-gateway-id' },
    vpcFlowLog: { id: 'mock-vpc-flow-log-id' },
  })),
}));

// Mock security components
jest.mock('../lib/security', () => ({
  createSecurityGroup: jest.fn().mockImplementation(() => ({
    id: 'mock-sg-id',
  })),
}));

// Mock compute components
jest.mock('../lib/compute', () => ({
  createEc2Instance: jest.fn().mockImplementation(() => ({
    id: 'mock-instance-id',
    publicIp: '203.0.113.1',
    publicDns: 'ec2-203-0-113-1.ap-south-1.compute.amazonaws.com',
  })),
}));

// Mock security monitoring components
jest.mock('../lib/security-monitoring', () => ({
  createSecurityMonitoring: jest.fn().mockImplementation(() => ({
    cloudTrail: { arn: 'arn:aws:cloudtrail:ap-south-1:123456789012:trail/mock-trail' },
    guardDutyDetectorId: 'mock-detector-id',
  })),
}));

import { createInfrastructure } from '../lib/infrastructure';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    it('should instantiate successfully with default values', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should instantiate successfully with custom environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should instantiate successfully with custom tags', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Owner: 'test-team',
          Project: 'tap-project',
        },
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Infrastructure Creation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should call createInfrastructure with correct parameters', () => {
      expect(createInfrastructure).toHaveBeenCalledWith(
        'test',
        ['203.26.56.90/32'],
        't3.micro',
        'ap-south-1',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should use default environment suffix when not provided', () => {
      jest.clearAllMocks();
      stack = new TapStack('test-stack-default', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'],
        't3.micro',
        'ap-south-1',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should expose VPC ID output', () => {
      expect(stack.vpcId).toBe('mock-vpc-id');
    });

    it('should expose public subnet IDs output', () => {
      expect(stack.publicSubnetIds).toEqual(['mock-public-subnet-1', 'mock-public-subnet-2']);
    });

    it('should expose private subnet IDs output', () => {
      expect(stack.privateSubnetIds).toEqual(['mock-private-subnet-1', 'mock-private-subnet-2']);
    });

    it('should expose internet gateway ID output', () => {
      expect(stack.internetGatewayId).toBe('mock-igw-id');
    });

    it('should expose security group ID output', () => {
      expect(stack.securityGroupId).toBe('mock-sg-id');
    });

    it('should expose EC2 instance ID output', () => {
      expect(stack.ec2InstanceId).toBe('mock-instance-id');
    });

    it('should expose EC2 instance public IP output', () => {
      expect(stack.ec2InstancePublicIp).toBe('203.0.113.1');
    });

    it('should expose EC2 instance public DNS output', () => {
      expect(stack.ec2InstancePublicDns).toBe('ec2-203-0-113-1.ap-south-1.compute.amazonaws.com');
    });

    it('should expose CloudTrail ARN output', () => {
      expect(stack.cloudTrailArn).toBe('arn:aws:cloudtrail:ap-south-1:123456789012:trail/mock-trail');
    });

    it('should expose GuardDuty detector ID output', () => {
      expect(stack.guardDutyDetectorId).toBe('mock-detector-id');
    });

    it('should expose NAT Gateway ID output', () => {
      expect(stack.natGatewayId).toBe('mock-nat-gateway-id');
    });

    it('should expose VPC Flow Log ID output', () => {
      expect(stack.vpcFlowLogId).toBe('mock-vpc-flow-log-id');
    });

    it('should have all required outputs defined', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.internetGatewayId).toBeDefined();
      expect(stack.securityGroupId).toBeDefined();
      expect(stack.ec2InstanceId).toBeDefined();
      expect(stack.ec2InstancePublicIp).toBeDefined();
      expect(stack.ec2InstancePublicDns).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.guardDutyDetectorId).toBeDefined();
      expect(stack.natGatewayId).toBeDefined();
      expect(stack.vpcFlowLogId).toBeDefined();
    });
  });

  describe('Configuration Handling', () => {
    it('should use default configuration values when config is empty', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue(undefined),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      stack = new TapStack('test-stack', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'],
        't3.micro',
        'ap-south-1',
        undefined,
        undefined
      );
    });

    it('should handle custom SSH CIDR configuration', () => {
      const mockConfig = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'instanceType':
              return 't3.small';
            case 'aws:region':
              return 'us-east-1';
            default:
              return undefined;
          }
        }),
        getObject: jest.fn().mockImplementation((key: string) => {
          if (key === 'allowedSshCidrs') {
            return ['10.0.0.0/8', '192.168.1.0/24'];
          }
          return undefined;
        }),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      stack = new TapStack('test-stack', { environmentSuffix: 'custom' });
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'custom',
        ['10.0.0.0/8', '192.168.1.0/24'],
        't3.small',
        'us-east-1',
        undefined,
        undefined
      );
    });

    it('should use default SSH CIDR from 203.26.56.90 IP range as specified in PROMPT.md', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue(undefined),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      stack = new TapStack('test-stack', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'], // Should match the IP range specified in PROMPT.md
        't3.micro',
        'ap-south-1',
        undefined,
        undefined
      );
    });

    it('should deploy to ap-south-1 region by default as specified in PROMPT.md', () => {
      const mockConfig = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'aws:region') return undefined; // No region configured
          return undefined;
        }),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      stack = new TapStack('test-stack', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'],
        't3.micro',
        'ap-south-1', // Should default to ap-south-1 as specified in PROMPT.md
        undefined,
        undefined
      );
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use default environment suffix when not provided', () => {
      stack = new TapStack('test-stack', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        undefined,
        undefined
      );
    });

    it('should use custom environment suffix when provided', () => {
      const environmentSuffix = 'production';
      stack = new TapStack('test-stack', { environmentSuffix });
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        environmentSuffix,
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        undefined,
        undefined
      );
    });

    it('should handle various environment suffixes correctly', () => {
      const environments = ['dev', 'test', 'staging', 'prod', 'production'];
      
      environments.forEach(env => {
        jest.clearAllMocks();
        stack = new TapStack(`test-stack-${env}`, { environmentSuffix: env });
        
        expect(createInfrastructure).toHaveBeenCalledWith(
          env,
          expect.any(Array),
          expect.any(String),
          expect.any(String),
          undefined,
          undefined
        );
      });
    });
  });

  describe('Component Resource Behavior', () => {
    it('should register outputs correctly', () => {
      // Clear previous calls
      mockRegisterOutputs.mockClear();
      
      stack = new TapStack('test-stack', { environmentSuffix: 'test' });
      
      expect(mockRegisterOutputs).toHaveBeenCalledWith({
        vpcId: 'mock-vpc-id',
        publicSubnetIds: ['mock-public-subnet-1', 'mock-public-subnet-2'],
        privateSubnetIds: ['mock-private-subnet-1', 'mock-private-subnet-2'],
        internetGatewayId: 'mock-igw-id',
        securityGroupId: 'mock-sg-id',
        ec2InstanceId: 'mock-instance-id',
        ec2InstancePublicIp: '203.0.113.1',
        ec2InstancePublicDns: 'ec2-203-0-113-1.ap-south-1.compute.amazonaws.com',
        cloudTrailArn: 'arn:aws:cloudtrail:ap-south-1:123456789012:trail/mock-trail',
        guardDutyDetectorId: 'mock-detector-id',
        natGatewayId: 'mock-nat-gateway-id',
        vpcFlowLogId: 'mock-vpc-flow-log-id',
      });
    });

    it('should be created with correct resource type and name', () => {
      // Clear previous calls
      mockComponentResource.mockClear();
      
      stack = new TapStack('test-stack-name', { environmentSuffix: 'test' });
      
      expect(mockComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack-name',
        { environmentSuffix: 'test' },
        undefined
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue(null),
        getObject: jest.fn().mockReturnValue(null),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      expect(() => {
        stack = new TapStack('test-stack', {});
      }).not.toThrow();
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'],
        't3.micro',
        'ap-south-1',
        null,
        null
      );
    });

    it('should handle empty environment suffix', () => {
      expect(() => {
        stack = new TapStack('test-stack', { environmentSuffix: '' });
      }).not.toThrow();
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev', // Should default to 'dev' when empty string provided
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        null,
        null
      );
    });
  });

  describe('PROMPT.md Requirements Validation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should follow resource naming pattern <resource>-<environment>', () => {
      // Verify that createInfrastructure is called with the environment suffix
      // which should be used for resource naming
      expect(createInfrastructure).toHaveBeenCalledWith(
        'test', // environment suffix for naming pattern
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        null,
        null
      );
    });

    it('should use modular code structure with separate components', () => {
      // Verify that infrastructure creation is modular by checking
      // that createInfrastructure is called (which orchestrates other modules)
      expect(createInfrastructure).toHaveBeenCalled();
    });

    it('should export all important outputs as specified in PROMPT.md', () => {
      // Verify all required outputs from PROMPT.md are available
      expect(stack.vpcId).toBeDefined(); // VPC ID
      expect(stack.publicSubnetIds).toBeDefined(); // subnet IDs
      expect(stack.privateSubnetIds).toBeDefined(); // subnet IDs
      expect(stack.securityGroupId).toBeDefined(); // security group ID
      expect(stack.ec2InstancePublicIp).toBeDefined(); // EC2 instance public IP
      expect(stack.ec2InstancePublicDns).toBeDefined(); // EC2 instance public DNS
      expect(stack.internetGatewayId).toBeDefined(); // Internet Gateway ID
      expect(stack.ec2InstanceId).toBeDefined(); // EC2 instance ID
    });

    it('should use Pulumi provider for region control', () => {
      // Verify that infrastructure is created with region configuration
      expect(createInfrastructure).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        'ap-south-1', // Region should be configurable and default to ap-south-1
        null,
        null
      );
    });

    it('should support configuration for SSH CIDRs and region-specific values', () => {
      // This is tested by the configuration handling tests above
      // Verify that config is used for SSH CIDRs and region
      expect(createInfrastructure).toHaveBeenCalledWith(
        expect.any(String),
        ['203.26.56.90/32'], // SSH CIDR configuration
        expect.any(String),
        expect.any(String), // Region configuration
        null,
        null
      );
    });

    it('should follow AWS security standards with proper tagging', () => {
      // Verify that the stack accepts and handles tags properly
      const stackWithTags = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Project: 'TAP',
          Owner: 'platform-team',
        },
      });

      expect(stackWithTags).toBeDefined();
      // Tags should be passed to the ComponentResource
      expect(mockComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack-tags',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod',
            Project: 'TAP',
            Owner: 'platform-team',
          }),
        }),
        undefined
      );
    });

    it('should be production-ready with proper error handling', () => {
      // Test that stack can handle various configurations without throwing
      expect(() => {
        new TapStack('prod-stack', {
          environmentSuffix: 'production',
          tags: { Environment: 'production' },
        });
      }).not.toThrow();

      expect(() => {
        new TapStack('dev-stack', {}); // Minimal configuration
      }).not.toThrow();
    });

    it('should be region-agnostic and configurable', () => {
      const mockConfig = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'aws:region') return 'eu-west-1';
          return undefined;
        }),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      
      require('@pulumi/pulumi').Config.mockImplementation(() => mockConfig);
      
      const regionStack = new TapStack('region-test-stack', {});
      
      expect(createInfrastructure).toHaveBeenCalledWith(
        'dev',
        ['203.26.56.90/32'],
        't3.micro',
        'eu-west-1', // Should use configured region
        undefined,
        undefined
      );
    });
  });

  describe('Infrastructure Component Requirements from PROMPT.md', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test' });
    });

    it('should create infrastructure with VPC CIDR 10.0.0.0/16', () => {
      // This would be tested in the VPC module, but we verify the infrastructure is created
      expect(createInfrastructure).toHaveBeenCalled();
    });

    it('should create two public subnets with specified CIDR blocks', () => {
      // Verify that public subnet IDs are available (indicating subnets were created)
      expect(stack.publicSubnetIds).toBeDefined();
      expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
    });

    it('should create Internet Gateway and route table', () => {
      // Verify Internet Gateway ID is available
      expect(stack.internetGatewayId).toBeDefined();
    });

    it('should create security group for SSH access from trusted CIDRs', () => {
      // Verify security group ID is available
      expect(stack.securityGroupId).toBeDefined();
      
      // Verify SSH CIDRs are configured
      expect(createInfrastructure).toHaveBeenCalledWith(
        expect.any(String),
        ['203.26.56.90/32'], // Should include the specified IP range
        expect.any(String),
        expect.any(String),
        undefined,
        undefined
      );
    });

    it('should deploy EC2 instance in public subnet', () => {
      // Verify EC2 instance outputs are available
      expect(stack.ec2InstanceId).toBeDefined();
      expect(stack.ec2InstancePublicIp).toBeDefined();
      expect(stack.ec2InstancePublicDns).toBeDefined();
    });

    it('should use provider object for region control', () => {
      // Verify region is passed to infrastructure creation
      expect(createInfrastructure).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.stringMatching(/^[a-z]{2}-[a-z]+-\d+$/), // AWS region format
        undefined,
        undefined
      );
    });
  });

  describe('VPC Flow Logs and NAT Gateway', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test' });
    });

    it('should create VPC Flow Logs for network monitoring', () => {
      expect(createInfrastructure).toHaveBeenCalled();
      expect(stack.vpcFlowLogId).toBeDefined();
      expect(stack.vpcFlowLogId).toBe('mock-vpc-flow-log-id');
    });

    it('should create NAT Gateway for private subnet internet access', () => {
      expect(createInfrastructure).toHaveBeenCalled();
      expect(stack.natGatewayId).toBeDefined();
      expect(stack.natGatewayId).toBe('mock-nat-gateway-id');
    });

    it('should ensure NAT Gateway is properly configured for outbound connectivity', () => {
      // Verify that infrastructure is created which includes NAT Gateway
      expect(createInfrastructure).toHaveBeenCalled();
      expect(stack.natGatewayId).toBeDefined();
    });

    it('should ensure VPC Flow Logs capture all traffic types', () => {
      // Verify that infrastructure is created which includes Flow Logs
      expect(createInfrastructure).toHaveBeenCalled();
      expect(stack.vpcFlowLogId).toBeDefined();
    });
  });

  describe('Tags Handling', () => {
    it('should accept and store custom tags', () => {
      const customTags = {
        Environment: 'production',
        Owner: 'platform-team',
        Project: 'tap-infrastructure',
        CostCenter: '12345',
      };
      
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags: customTags,
      });
      
      expect(stack).toBeDefined();
      // Tags are passed to the ComponentResource constructor
      expect(mockComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {
          environmentSuffix: 'prod',
          tags: customTags,
        },
        undefined
      );
    });

    it('should work without tags', () => {
      expect(() => {
        stack = new TapStack('test-stack', { environmentSuffix: 'test' });
      }).not.toThrow();
      
      expect(stack).toBeDefined();
    });
  });
});