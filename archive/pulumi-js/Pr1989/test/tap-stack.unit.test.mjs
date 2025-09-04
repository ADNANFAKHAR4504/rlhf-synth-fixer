// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  output: jest.fn(val => val),
  interpolate: jest.fn(strings => strings),
  getStack: jest.fn(() => 'test')
}));

jest.mock("@pulumi/aws", () => ({
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({ 
      id: "mock-bucket-id-12345",
      arn: { apply: jest.fn(cb => cb('arn:aws:s3:::mock-bucket')) },
      websiteEndpoint: "mock-bucket.s3-website.amazonaws.com"
    })),
    BucketVersioningV2: jest.fn().mockImplementation(() => ({ id: "mock-versioning" })),
    BucketServerSideEncryptionConfigurationV2: jest.fn().mockImplementation(() => ({ id: "mock-encryption" })),
    BucketPublicAccessBlock: jest.fn().mockImplementation(() => ({ id: "mock-pab" })),
    BucketPolicy: jest.fn().mockImplementation(() => ({ id: "mock-policy" })),
    BucketWebsiteConfigurationV2: jest.fn().mockImplementation(() => ({ id: "mock-website" })),
    BucketObject: jest.fn().mockImplementation(() => ({ id: "mock-object" }))
  },
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({ id: "vpc-12345" })),
    InternetGateway: jest.fn().mockImplementation(() => ({ id: "igw-12345" })),
    Subnet: jest.fn().mockImplementation(() => ({ id: "subnet-12345" })),
    Eip: jest.fn().mockImplementation(() => ({ id: "eip-12345" })),
    NatGateway: jest.fn().mockImplementation(() => ({ id: "nat-12345" })),
    RouteTable: jest.fn().mockImplementation(() => ({ id: "rt-12345" })),
    Route: jest.fn().mockImplementation(() => ({ id: "route-12345" })),
    RouteTableAssociation: jest.fn().mockImplementation(() => ({ id: "rta-12345" })),
    SecurityGroup: jest.fn().mockImplementation(() => ({ id: "sg-12345" })),
    LaunchTemplate: jest.fn().mockImplementation(() => ({ id: "lt-12345" })),
    getAmi: jest.fn(() => Promise.resolve({ id: "ami-12345" }))
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test/1234567890",
      dnsName: "test-alb.us-east-1.elb.amazonaws.com"
    })),
    TargetGroup: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/1234567890",
      arnSuffix: "targetgroup/test/1234567890"
    })),
    Listener: jest.fn().mockImplementation(() => ({ id: "listener-12345" }))
  },
  autoscaling: {
    Group: jest.fn().mockImplementation(() => ({ 
      name: "webapp-asg-test",
      id: "asg-12345"
    })),
    Policy: jest.fn().mockImplementation(() => ({ id: "policy-12345" }))
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({ 
      name: "webapp-role",
      arn: "arn:aws:iam::123456789012:role/webapp-role"
    })),
    RolePolicyAttachment: jest.fn().mockImplementation(() => ({ id: "attachment-12345" })),
    InstanceProfile: jest.fn().mockImplementation(() => ({ name: "webapp-profile" }))
  },
  sns: {
    Topic: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:sns:us-east-1:123456789012:webapp-alarms"
    }))
  },
  cloudwatch: {
    MetricAlarm: jest.fn().mockImplementation(() => ({ id: "alarm-12345" })),
    Dashboard: jest.fn().mockImplementation(() => ({ id: "dashboard-12345" }))
  },
  getAvailabilityZones: jest.fn(() => Promise.resolve({ names: ["us-east-1a", "us-east-1b"] }))
}));

jest.mock("../lib/networking-stack.mjs", () => ({
  NetworkingStack: jest.fn().mockImplementation(function() {
    this.vpc = { id: "vpc-mock" };
    this.publicSubnets = [{ id: "subnet-public-1" }, { id: "subnet-public-2" }];
    this.privateSubnets = [{ id: "subnet-private-1" }, { id: "subnet-private-2" }];
    this.albSecurityGroup = { id: "sg-alb" };
    this.instanceSecurityGroup = { id: "sg-instance" };
    this.targetGroup = { arn: "arn:aws:targetgroup", arnSuffix: "targetgroup/test" };
    this.alb = { dnsName: "test-alb.elb.amazonaws.com" };
    this.registerOutputs = jest.fn();
  })
}));

jest.mock("../lib/compute-stack.mjs", () => ({
  ComputeStack: jest.fn().mockImplementation(function() {
    this.autoScalingGroup = { name: "webapp-asg-test" };
    this.launchTemplate = { id: "lt-test" };
    this.registerOutputs = jest.fn();
  })
}));

jest.mock("../lib/storage-stack.mjs", () => ({
  StorageStack: jest.fn().mockImplementation(function() {
    this.bucket = { id: "webapp-static-test", websiteEndpoint: "test.s3-website.amazonaws.com" };
    this.registerOutputs = jest.fn();
  })
}));

jest.mock("../lib/monitoring-stack.mjs", () => ({
  MonitoringStack: jest.fn().mockImplementation(function() {
    this.alarmTopicArn = "arn:aws:sns:us-east-1:123456789012:webapp-alarms";
    this.dashboardUrl = "https://console.aws.amazon.com/cloudwatch/home#dashboards";
    this.registerOutputs = jest.fn();
  })
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";
import { NetworkingStack } from "../lib/networking-stack.mjs";
import { ComputeStack } from "../lib/compute-stack.mjs";
import { StorageStack } from "../lib/storage-stack.mjs";
import { MonitoringStack } from "../lib/monitoring-stack.mjs";

describe("TapStack Structure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Stack Creation", () => {
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
      
      // Verify environment suffix is passed to child stacks
      expect(NetworkingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ environmentSuffix: "prod" }),
        expect.any(Object)
      );
    });

    it("should instantiate TapStack with custom tags", () => {
      const testTags = {
        Project: "TAP",
        Environment: "Development"
      };
      const stack = new TapStack("TestTapStackTagged", {
        environmentSuffix: "dev",
        tags: testTags
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      
      // Verify tags are passed to child stacks
      expect(NetworkingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags: testTags }),
        expect.any(Object)
      );
    });
  });

  describe("Component Resource Behavior", () => {
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
    
    it("should create all required child stacks", () => {
      new TapStack("TestTapStackChildren", { environmentSuffix: "test" });
      
      expect(NetworkingStack).toHaveBeenCalledTimes(1);
      expect(ComputeStack).toHaveBeenCalledTimes(1);
      expect(StorageStack).toHaveBeenCalledTimes(1);
      expect(MonitoringStack).toHaveBeenCalledTimes(1);
    });
    
    it("should pass networking outputs to compute stack", () => {
      new TapStack("TestTapStackDependencies", { environmentSuffix: "test" });
      
      expect(ComputeStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          vpc: expect.objectContaining({ id: "vpc-mock" }),
          privateSubnets: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
          publicSubnets: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
          albSecurityGroup: expect.objectContaining({ id: "sg-alb" }),
          instanceSecurityGroup: expect.objectContaining({ id: "sg-instance" }),
          targetGroup: expect.objectContaining({ arn: expect.any(String) })
        }),
        expect.any(Object)
      );
    });
    
    it("should pass compute outputs to monitoring stack", () => {
      new TapStack("TestTapStackMonitoring", { environmentSuffix: "test" });
      
      expect(MonitoringStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          autoScalingGroup: expect.objectContaining({ name: "webapp-asg-test" })
        }),
        expect.any(Object)
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
  });

  describe("Resource Creation and Outputs", () => {
    it("should expose all required outputs", () => {
      const stack = new TapStack("TestTapStackOutputs", { environmentSuffix: "test" });
      
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.autoScalingGroupName).toBeDefined();
    });

    it("should register outputs correctly", () => {
      const stack = new TapStack("TestTapStackRegister", { environmentSuffix: "test" });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          albDnsName: expect.anything(),
          bucketName: expect.anything(),
          autoScalingGroupName: expect.anything()
        })
      );
    });
    
    it("should use default environment suffix when not provided", () => {
      new TapStack("TestTapStackDefaults", {});
      
      expect(NetworkingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ environmentSuffix: "dev" }),
        expect.any(Object)
      );
    });
  });
  
  describe("Stack Integration", () => {
    it("should create stacks with parent relationship", () => {
      const stack = new TapStack("TestTapStackParent", { environmentSuffix: "test" });
      
      // Verify all stacks are created with proper parent
      expect(NetworkingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      
      expect(ComputeStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      
      expect(StorageStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      
      expect(MonitoringStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
    });
  })
});