// Mock the modules before importing anything
let mockVpc;
let mockSubnet;
let mockInternetGateway;
let mockRouteTable;
let mockRouteTableAssociation;
let mockSecurityGroup;
let mockInstance;
let mockGetAvailabilityZones;
let mockGetAmi;

beforeAll(() => {
  mockVpc = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `vpc-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockSubnet = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `subnet-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockInternetGateway = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `igw-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockRouteTable = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `rtb-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockRouteTableAssociation = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `rtbassoc-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockSecurityGroup = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `sg-${Math.random().toString(36).substr(2, 9)}`;
    return this;
  });
  mockInstance = jest.fn().mockImplementation(function(name, args, opts) {
    this.id = `i-${Math.random().toString(36).substr(2, 9)}`;
    this.publicIp = `54.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    this.privateIp = `10.0.1.${Math.floor(Math.random() * 256)}`;
    return this;
  });
  mockGetAvailabilityZones = jest.fn().mockImplementation(() => 
    Promise.resolve({ names: ['us-east-1a', 'us-east-1b', 'us-east-1c'] })
  );
  mockGetAmi = jest.fn().mockImplementation(() => Promise.resolve({ id: 'ami-12345678' }));
});

jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
    this.registerOutputs = jest.fn();
  }),
  Output: {
    create: jest.fn((val) => val)
  }
}));

jest.mock("@pulumi/aws", () => ({
  ec2: {
    get Vpc() { return mockVpc; },
    get Subnet() { return mockSubnet; },
    get InternetGateway() { return mockInternetGateway; },
    get RouteTable() { return mockRouteTable; },
    get RouteTableAssociation() { return mockRouteTableAssociation; },
    get SecurityGroup() { return mockSecurityGroup; },
    get Instance() { return mockInstance; },
    get getAmi() { return mockGetAmi; }
  },
  get getAvailabilityZones() { return mockGetAvailabilityZones; }
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";
import { NetworkingStack } from "../lib/networking-stack.mjs";
import { ComputeStack } from "../lib/compute-stack.mjs";

describe("TapStack Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TapStack Structure", () => {
    it("should instantiate TapStack successfully", () => {
      const stack = new TapStack("TestTapStack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom environment suffix", () => {
      const stack = new TapStack("TestTapStackCustom", {
        environmentSuffix: "prod"
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom tags", () => {
      const stack = new TapStack("TestTapStackTagged", {
        environmentSuffix: "dev",
        tags: {
          Project: "TerraformSetup",
          Environment: "Development"
        }
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should call super constructor with correct parameters", () => {
      new TapStack("TestTapStackSuper", {});
      
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'TestTapStackSuper',
        {},
        undefined
      );
    });

    it("should have registerOutputs method", () => {
      const stack = new TapStack("TestTapStackOutputs", {});
      expect(typeof stack.registerOutputs).toBe('function');
    });

    it("should expose outputs correctly", () => {
      const stack = new TapStack("TestTapStackOutputs", {});
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnet1Id).toBeDefined();
      expect(stack.publicSubnet2Id).toBeDefined();
      expect(stack.instanceId).toBeDefined();
      expect(stack.publicIp).toBeDefined();
    });

    it("should register outputs correctly", () => {
      const stack = new TapStack("TestTapStackRegister", {});
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          publicSubnet1Id: expect.anything(),
          publicSubnet2Id: expect.anything(),
          instanceId: expect.anything(),
          publicIp: expect.anything()
        })
      );
    });
  });

  describe("NetworkingStack Tests", () => {
    it("should create VPC with correct configuration", () => {
      const stack = new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: { Project: "TerraformSetup" }
      });
      
      expect(mockVpc).toHaveBeenCalledWith(
        "tf-vpc-test",
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'tf-vpc-test',
            Project: 'TerraformSetup'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create two subnets in different AZs", () => {
      new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(mockSubnet).toHaveBeenCalledTimes(2);
      expect(mockSubnet).toHaveBeenCalledWith(
        "tf-public-subnet-1-test",
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true
        }),
        expect.any(Object)
      );
      expect(mockSubnet).toHaveBeenCalledWith(
        "tf-public-subnet-2-test",
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true
        }),
        expect.any(Object)
      );
    });

    it("should create Internet Gateway", () => {
      new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(mockInternetGateway).toHaveBeenCalledWith(
        "tf-igw-test",
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'tf-igw-test'
          })
        }),
        expect.any(Object)
      );
    });

    it("should create route table with internet route", () => {
      new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(mockRouteTable).toHaveBeenCalledWith(
        "tf-public-rt-test",
        expect.objectContaining({
          routes: expect.arrayContaining([
            expect.objectContaining({
              cidrBlock: '0.0.0.0/0'
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should associate subnets with route table", () => {
      new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(mockRouteTableAssociation).toHaveBeenCalledTimes(2);
      expect(mockRouteTableAssociation).toHaveBeenCalledWith(
        "tf-public-rta-1-test",
        expect.any(Object),
        expect.any(Object)
      );
      expect(mockRouteTableAssociation).toHaveBeenCalledWith(
        "tf-public-rta-2-test",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should create security group allowing SSH", () => {
      new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(mockSecurityGroup).toHaveBeenCalledWith(
        "tf-ec2-sg-test",
        expect.objectContaining({
          name: 'tf-ec2-sg-test',
          description: 'Security group for EC2 instance',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 22,
              toPort: 22,
              cidrBlocks: ['0.0.0.0/0']
            })
          ]),
          egress: expect.arrayContaining([
            expect.objectContaining({
              protocol: '-1',
              fromPort: 0,
              toPort: 0,
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should expose networking outputs", () => {
      const stack = new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnet1Id).toBeDefined();
      expect(stack.publicSubnet2Id).toBeDefined();
      expect(stack.securityGroupId).toBeDefined();
    });

    it("should register networking outputs", () => {
      const stack = new NetworkingStack("TestNetworkingStack", {
        environmentSuffix: "test",
        tags: {}
      });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          publicSubnet1Id: expect.anything(),
          publicSubnet2Id: expect.anything(),
          securityGroupId: expect.anything()
        })
      );
    });
  });

  describe("ComputeStack Tests", () => {
    it("should create EC2 instance with correct configuration", () => {
      new ComputeStack("TestComputeStack", {
        environmentSuffix: "test",
        subnetId: "subnet-123",
        securityGroupId: "sg-123",
        tags: { Project: "TerraformSetup" }
      });
      
      expect(mockInstance).toHaveBeenCalledWith(
        "tf-ec2-instance-test",
        expect.objectContaining({
          instanceType: 't3.micro',
          subnetId: "subnet-123",
          vpcSecurityGroupIds: ["sg-123"],
          associatePublicIpAddress: true,
          tags: expect.objectContaining({
            Name: 'tf-ec2-instance-test',
            Project: 'TerraformSetup'
          })
        }),
        expect.any(Object)
      );
    });

    it("should use latest Amazon Linux 2023 AMI", async () => {
      new ComputeStack("TestComputeStack", {
        environmentSuffix: "test",
        subnetId: "subnet-123",
        securityGroupId: "sg-123",
        tags: {}
      });
      
      expect(mockGetAmi).toHaveBeenCalledWith({
        mostRecent: true,
        owners: ['amazon'],
        filters: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            values: ['al2023-ami-*-x86_64']
          }),
          expect.objectContaining({
            name: 'state',
            values: ['available']
          })
        ])
      });
    });

    it("should expose compute outputs", () => {
      const stack = new ComputeStack("TestComputeStack", {
        environmentSuffix: "test",
        subnetId: "subnet-123",
        securityGroupId: "sg-123",
        tags: {}
      });
      
      expect(stack.instanceId).toBeDefined();
      expect(stack.publicIp).toBeDefined();
      expect(stack.privateIp).toBeDefined();
    });

    it("should register compute outputs", () => {
      const stack = new ComputeStack("TestComputeStack", {
        environmentSuffix: "test",
        subnetId: "subnet-123",
        securityGroupId: "sg-123",
        tags: {}
      });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: expect.anything(),
          publicIp: expect.anything(),
          privateIp: expect.anything()
        })
      );
    });
  });

  describe("Configuration Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackUndefined");
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should handle empty args object", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackEmpty", {});
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should handle partial configuration", () => {
      expect(() => {
        const stack1 = new TapStack("TestTapStackPartial1", {
          environmentSuffix: "partial"
          // tags intentionally omitted
        });
        expect(stack1).toBeDefined();

        const stack2 = new TapStack("TestTapStackPartial2", {
          tags: { Project: "Test" }
          // environmentSuffix intentionally omitted
        });
        expect(stack2).toBeDefined();
      }).not.toThrow();
    });

    it("should use default environment suffix when not provided", () => {
      const stack = new NetworkingStack("TestNetworkingStackDefault", {});
      expect(mockVpc).toHaveBeenCalledWith(
        "tf-vpc-dev",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should merge tags correctly", () => {
      new NetworkingStack("TestNetworkingStackTags", {
        environmentSuffix: "test",
        tags: { Custom: "Value" }
      });
      
      expect(mockVpc).toHaveBeenCalledWith(
        "tf-vpc-test",
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'TerraformSetup',
            Custom: 'Value'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Resource Tagging", () => {
    it("should tag all resources with Project: TerraformSetup", () => {
      new TapStack("TestTapStackTagging", {
        environmentSuffix: "test"
      });
      
      // Check VPC tags
      expect(mockVpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'TerraformSetup'
          })
        }),
        expect.any(Object)
      );
      
      // Check subnet tags
      expect(mockSubnet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'TerraformSetup'
          })
        }),
        expect.any(Object)
      );
      
      // Check instance tags
      expect(mockInstance).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'TerraformSetup'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Resource Naming", () => {
    it("should use tf- prefix for all resource names", () => {
      new TapStack("TestTapStackNaming", {
        environmentSuffix: "test"
      });
      
      expect(mockVpc).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-vpc-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(mockSubnet).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-public-subnet-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(mockInternetGateway).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-igw-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(mockRouteTable).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-public-rt-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(mockSecurityGroup).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-ec2-sg-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(mockInstance).toHaveBeenCalledWith(
        expect.stringMatching(/^tf-ec2-instance-/),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("High Availability", () => {
    it("should use multiple availability zones", async () => {
      new NetworkingStack("TestNetworkingStackHA", {
        environmentSuffix: "test"
      });
      
      expect(aws.getAvailabilityZones).toHaveBeenCalledWith({
        state: 'available'
      });
      
      // Verify two subnets are created
      expect(mockSubnet).toHaveBeenCalledTimes(2);
    });
  });
});