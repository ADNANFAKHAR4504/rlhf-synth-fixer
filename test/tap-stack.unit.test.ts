// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {
      // Mock implementation
    }
    registerOutputs(outputs: any) {
      // Mock implementation
    }
  },
  all: jest.fn(),
  Output: jest.fn(),
}));

jest.mock('@pulumi/aws', () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: 'mock-vpc-id',
    })),
    InternetGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-igw-id',
    })),
    Subnet: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-id',
    })),
    RouteTable: jest.fn().mockImplementation(() => ({
      id: 'mock-rt-id',
    })),
    Route: jest.fn().mockImplementation(() => ({
      id: 'mock-route-id',
    })),
    RouteTableAssociation: jest.fn().mockImplementation(() => ({
      id: 'mock-rta-id',
    })),
    NatGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-nat-id',
    })),
    Eip: jest.fn().mockImplementation(() => ({
      id: 'mock-eip-id',
    })),
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-sg-id',
    })),
    LaunchTemplate: jest.fn().mockImplementation(() => ({
      id: 'mock-lt-id',
    })),
    getAmi: jest.fn().mockResolvedValue({
      id: 'ami-12345678',
      name: 'amzn2-ami-hvm-2.0.20231218.0-x86_64-gp2',
    }),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      id: 'mock-role-id',
      name: 'mock-role-name',
    })),
    RolePolicy: jest.fn().mockImplementation(() => ({
      id: 'mock-policy-id',
    })),
    InstanceProfile: jest.fn().mockImplementation(() => ({
      id: 'mock-profile-id',
      name: 'mock-profile-name',
    })),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({
      keyId: 'mock-key-id',
      arn: 'mock-key-arn',
    })),
    Alias: jest.fn().mockImplementation(() => ({
      id: 'mock-alias-id',
    })),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-group-id',
      name: 'mock-subnet-group-name',
    })),
    Instance: jest.fn().mockImplementation(() => ({
      id: 'mock-rds-id',
      endpoint: 'mock-rds-endpoint.amazonaws.com',
    })),
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({
      id: 'mock-alb-id',
      arn: 'mock-alb-arn',
      dnsName: 'mock-alb-dns.amazonaws.com',
    })),
    TargetGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-tg-id',
      arn: 'mock-tg-arn',
    })),
    Listener: jest.fn().mockImplementation(() => ({
      id: 'mock-listener-id',
    })),
  },
  autoscaling: {
    Group: jest.fn().mockImplementation(() => ({
      id: 'mock-asg-id',
      name: 'mock-asg-name',
    })),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-id',
    })),
    BucketVersioningV2: jest.fn().mockImplementation(() => ({
      id: 'mock-versioning-id',
    })),
    BucketPublicAccessBlock: jest.fn().mockImplementation(() => ({
      id: 'mock-pab-id',
    })),
  },
  getAvailabilityZones: jest.fn().mockResolvedValue({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
    state: 'available',
  }),
}));

import { TapStack } from "../lib/tap-stack";

describe("TapStack Structure", () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("with props", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackWithProps", {
        environmentSuffix: "prod",
        tags: {
          Environment: "test",
          Project: "tap-test"
        }
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("creates production web app stack", () => {
      expect(stack.webAppStack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });

    it("exposes correct outputs", () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault", {});
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("uses default environment suffix", () => {
      expect(stack).toBeDefined();
      expect(stack.webAppStack).toBeDefined();
    });
  });
});