/**
 * Unit tests for the TapStack Pulumi component.
 * 
 * These tests verify the correct configuration and creation of all AWS resources
 * including VPC, subnets, EC2 instances, load balancer, S3 bucket, and IAM roles.
 */

// Mock modules before importing
jest.mock("@pulumi/pulumi", () => {
  const outputs = {};
  const mockOutput = (value) => ({
    apply: (fn) => mockOutput(fn ? fn(value) : value),
    get: () => Promise.resolve(value),
    value: value
  });
  
  return {
    ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
      this.type = type;
      this.name = name;
      this.args = args;
      this.opts = opts;
      this.registerOutputs = jest.fn((outputs) => {
        Object.assign(this, outputs);
      });
    }),
    Output: {
      create: jest.fn((value) => mockOutput(value))
    },
    output: jest.fn((value) => mockOutput(value)),
    getStack: jest.fn(() => 'teststack'),
    Config: jest.fn().mockImplementation(() => ({
      get: jest.fn((key) => {
        if (key === 'env') return 'test';
        return undefined;
      })
    }))
  };
});

jest.mock("@pulumi/aws", () => {
  const mockResource = (type, name, args) => ({
    id: mockOutput(`${name}-id`),
    arn: mockOutput(`arn:aws:${type}:::${name}`),
    name: mockOutput(name),
    bucket: mockOutput(args?.bucket || name),
    dnsName: mockOutput(`${name}.elb.amazonaws.com`),
    publicIp: mockOutput('1.2.3.4'),
    keyName: mockOutput(args?.keyName || name)
  });
  
  const mockOutput = (value) => ({
    apply: (fn) => mockOutput(fn ? fn(value) : value),
    get: () => Promise.resolve(value),
    value: value,
    then: (fn) => fn ? fn(value) : value
  });
  
  return {
    getAvailabilityZones: jest.fn(() => Promise.resolve({
      names: ['us-west-1a', 'us-west-1b'],
      then: (fn) => fn({ names: ['us-west-1a', 'us-west-1b'] })
    })),
    ec2: {
      getAmi: jest.fn(() => Promise.resolve({
        id: 'ami-12345678',
        then: (fn) => fn({ id: 'ami-12345678' })
      })),
      Vpc: jest.fn((name, args, opts) => mockResource('vpc', name, args)),
      Subnet: jest.fn((name, args, opts) => mockResource('subnet', name, args)),
      InternetGateway: jest.fn((name, args, opts) => mockResource('igw', name, args)),
      RouteTable: jest.fn((name, args, opts) => mockResource('routetable', name, args)),
      Route: jest.fn((name, args, opts) => mockResource('route', name, args)),
      RouteTableAssociation: jest.fn((name, args, opts) => mockResource('rtassoc', name, args)),
      SecurityGroup: jest.fn((name, args, opts) => mockResource('sg', name, args)),
      Instance: jest.fn((name, args, opts) => mockResource('instance', name, args)),
      Eip: jest.fn((name, args, opts) => mockResource('eip', name, args)),
      KeyPair: jest.fn((name, args, opts) => mockResource('keypair', name, args))
    },
    s3: {
      Bucket: jest.fn((name, args, opts) => mockResource('s3', name, args)),
      BucketVersioning: jest.fn((name, args, opts) => mockResource('s3versioning', name, args)),
      BucketPublicAccessBlock: jest.fn((name, args, opts) => mockResource('s3pab', name, args)),
      BucketServerSideEncryptionConfiguration: jest.fn((name, args, opts) => mockResource('s3encryption', name, args))
    },
    iam: {
      Role: jest.fn((name, args, opts) => mockResource('role', name, args)),
      Policy: jest.fn((name, args, opts) => mockResource('policy', name, args)),
      RolePolicyAttachment: jest.fn((name, args, opts) => mockResource('attachment', name, args)),
      InstanceProfile: jest.fn((name, args, opts) => mockResource('profile', name, args))
    },
    lb: {
      LoadBalancer: jest.fn((name, args, opts) => mockResource('alb', name, args)),
      TargetGroup: jest.fn((name, args, opts) => mockResource('tg', name, args)),
      TargetGroupAttachment: jest.fn((name, args, opts) => mockResource('tgattach', name, args)),
      Listener: jest.fn((name, args, opts) => mockResource('listener', name, args))
    }
  };
});

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack.mjs";

describe("TapStack Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENVIRONMENT_SUFFIX = 'test';
  });

  describe("Stack Creation and Configuration", () => {
    it("should create stack with default configuration", () => {
      const stack = new TapStack("test-stack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        undefined
      );
    });

    it("should use environment suffix from args", () => {
      const stack = new TapStack("test-stack", { 
        environmentSuffix: "staging" 
      });
      expect(stack).toBeDefined();
    });

    it("should use environment suffix from environment variable", () => {
      process.env.ENVIRONMENT_SUFFIX = 'envtest';
      const stack = new TapStack("test-stack", {});
      expect(stack).toBeDefined();
    });

    it("should apply custom tags", () => {
      const stack = new TapStack("test-stack", {
        environmentSuffix: "dev",
        tags: {
          Project: "TestProject",
          Owner: "TestOwner"
        }
      });
      expect(stack).toBeDefined();
    });
  });

  describe("VPC and Networking Resources", () => {
    it("should create VPC with correct CIDR block", () => {
      new TapStack("test-vpc", { environmentSuffix: "test" });
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.stringContaining("myapp-test-vpc"),
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true
        }),
        expect.any(Object)
      );
    });

    it("should create Internet Gateway", () => {
      new TapStack("test-igw", { environmentSuffix: "test" });
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        expect.stringContaining("myapp-test-igw"),
        expect.objectContaining({
          vpcId: expect.any(Object)
        }),
        expect.any(Object)
      );
    });

    it("should create two public subnets in different AZs", () => {
      new TapStack("test-subnets", { environmentSuffix: "test" });
      expect(aws.ec2.Subnet).toHaveBeenCalledTimes(2);
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining("public-subnet-1"),
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true
        }),
        expect.any(Object)
      );
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining("public-subnet-2"),
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true
        }),
        expect.any(Object)
      );
    });

    it("should create and configure route table", () => {
      new TapStack("test-routes", { environmentSuffix: "test" });
      expect(aws.ec2.RouteTable).toHaveBeenCalled();
      expect(aws.ec2.Route).toHaveBeenCalledWith(
        expect.stringContaining("public-route"),
        expect.objectContaining({
          destinationCidrBlock: '0.0.0.0/0'
        }),
        expect.any(Object)
      );
      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalledTimes(2);
    });
  });

  describe("S3 Bucket Configuration", () => {
    it("should create S3 bucket with proper naming", () => {
      new TapStack("test-s3", { environmentSuffix: "test" });
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining("myapp-test-logs-bucket"),
        expect.objectContaining({
          bucket: expect.stringContaining("myapp-test-logs")
        }),
        expect.any(Object)
      );
    });

    it("should enable versioning on S3 bucket", () => {
      new TapStack("test-s3-versioning", { environmentSuffix: "test" });
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        expect.stringContaining("logs-versioning"),
        expect.objectContaining({
          versioningConfiguration: {
            status: 'Enabled'
          }
        }),
        expect.any(Object)
      );
    });

    it("should configure S3 bucket encryption", () => {
      new TapStack("test-s3-encryption", { environmentSuffix: "test" });
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        expect.stringContaining("logs-encryption"),
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256'
              }
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should block public access to S3 bucket", () => {
      new TapStack("test-s3-public-access", { environmentSuffix: "test" });
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining("logs-pab"),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        }),
        expect.any(Object)
      );
    });
  });

  describe("EC2 Instances and Key Pair", () => {
    it("should create EC2 instances without key pairs for demo purposes", () => {
      new TapStack("test-no-keypair", { environmentSuffix: "test" });
      // KeyPair creation is removed - instances launch without SSH access
      expect(aws.ec2.KeyPair).not.toHaveBeenCalled();
    });

    it("should create two EC2 instances", () => {
      new TapStack("test-ec2", { environmentSuffix: "test" });
      expect(aws.ec2.Instance).toHaveBeenCalledTimes(2);
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.stringContaining("instance-1"),
        expect.objectContaining({
          instanceType: 't3.micro',
          userData: expect.stringContaining("httpd")
        }),
        expect.any(Object)
      );
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        expect.stringContaining("instance-2"),
        expect.objectContaining({
          instanceType: 't3.micro',
          userData: expect.stringContaining("httpd")
        }),
        expect.any(Object)
      );
    });

    it("should create and associate Elastic IPs", () => {
      new TapStack("test-eips", { environmentSuffix: "test" });
      expect(aws.ec2.Eip).toHaveBeenCalledTimes(2);
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        expect.stringContaining("eip-1"),
        expect.objectContaining({
          domain: 'vpc'
        }),
        expect.any(Object)
      );
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        expect.stringContaining("eip-2"),
        expect.objectContaining({
          domain: 'vpc'
        }),
        expect.any(Object)
      );
    });
  });

  describe("Load Balancer Configuration", () => {
    it("should create Application Load Balancer", () => {
      new TapStack("test-alb", { environmentSuffix: "test" });
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        expect.stringContaining("alb"),
        expect.objectContaining({
          loadBalancerType: 'application',
          enableDeletionProtection: false
        }),
        expect.any(Object)
      );
    });

    it("should create target group with health checks", () => {
      new TapStack("test-tg", { environmentSuffix: "test" });
      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(
        expect.stringContaining("tg"),
        expect.objectContaining({
          port: 80,
          protocol: 'HTTP',
          healthCheck: expect.objectContaining({
            enabled: true,
            healthyThreshold: 2,
            unhealthyThreshold: 2,
            interval: 30,
            timeout: 5,
            path: '/',
            matcher: '200'
          })
        }),
        expect.any(Object)
      );
    });

    it("should attach instances to target group", () => {
      new TapStack("test-tg-attachments", { environmentSuffix: "test" });
      expect(aws.lb.TargetGroupAttachment).toHaveBeenCalledTimes(2);
      expect(aws.lb.TargetGroupAttachment).toHaveBeenCalledWith(
        expect.stringContaining("tg-attachment-1"),
        expect.objectContaining({
          port: 80
        }),
        expect.any(Object)
      );
    });

    it("should create listener on port 80", () => {
      new TapStack("test-listener", { environmentSuffix: "test" });
      expect(aws.lb.Listener).toHaveBeenCalledWith(
        expect.stringContaining("listener"),
        expect.objectContaining({
          port: '80',
          protocol: 'HTTP',
          defaultActions: expect.arrayContaining([
            expect.objectContaining({
              type: 'forward'
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("IAM Resources", () => {
    it("should create IAM role for EC2", () => {
      new TapStack("test-iam-role", { environmentSuffix: "test" });
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining("ec2-role"),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining("ec2.amazonaws.com")
        }),
        expect.any(Object)
      );
    });

    it("should create S3 access policy", () => {
      new TapStack("test-iam-policy", { environmentSuffix: "test" });
      expect(aws.iam.Policy).toHaveBeenCalledWith(
        expect.stringContaining("s3-logs-policy"),
        expect.objectContaining({
          description: 'Allow access to application logs bucket'
        }),
        expect.any(Object)
      );
    });

    it("should attach policy to role", () => {
      new TapStack("test-policy-attachment", { environmentSuffix: "test" });
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
    });

    it("should create instance profile", () => {
      new TapStack("test-instance-profile", { environmentSuffix: "test" });
      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        expect.stringContaining("instance-profile"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Security Groups", () => {
    it("should create security group for EC2 instances", () => {
      new TapStack("test-sg-ec2", { environmentSuffix: "test" });
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        expect.stringContaining("ec2-sg"),
        expect.objectContaining({
          description: 'Security group for EC2 instances',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80
            }),
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 443,
              toPort: 443
            }),
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 22,
              toPort: 22,
              cidrBlocks: ['10.0.0.0/16']
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should create security group for ALB", () => {
      new TapStack("test-sg-alb", { environmentSuffix: "test" });
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        expect.stringContaining("alb-sg"),
        expect.objectContaining({
          description: 'Security group for Application Load Balancer',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              cidrBlocks: ['0.0.0.0/0']
            }),
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 443,
              toPort: 443,
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should register all required outputs", () => {
      const stack = new TapStack("test-outputs", { environmentSuffix: "test" });
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: expect.any(Object),
          albDnsName: expect.any(Object),
          vpcId: expect.any(Object),
          elasticIp1: expect.any(Object),
          elasticIp2: expect.any(Object),
          instance1Id: expect.any(Object),
          instance2Id: expect.any(Object)
        })
      );
    });

    it("should store outputs as instance properties", () => {
      const stack = new TapStack("test-props", { environmentSuffix: "test" });
      expect(stack.bucketName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.eip1Address).toBeDefined();
      expect(stack.eip2Address).toBeDefined();
      expect(stack.instance1Id).toBeDefined();
      expect(stack.instance2Id).toBeDefined();
    });
  });

  describe("Resource Tagging", () => {
    it("should apply default tags to resources", () => {
      new TapStack("test-tags", { 
        environmentSuffix: "staging",
        tags: { CustomTag: "CustomValue" }
      });
      
      // Check VPC was created with tags
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'myapp',
            Environment: 'staging',
            ManagedBy: 'Pulumi',
            CustomTag: 'CustomValue'
          })
        }),
        expect.any(Object)
      );
    });
  });
});