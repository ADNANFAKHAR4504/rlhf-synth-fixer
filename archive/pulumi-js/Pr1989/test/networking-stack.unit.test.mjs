// Mock Pulumi modules
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  output: jest.fn(val => val),
  interpolate: jest.fn(strings => strings)
}));

jest.mock("@pulumi/aws", () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({ id: "vpc-test" })),
    InternetGateway: jest.fn().mockImplementation(() => ({ id: "igw-test" })),
    Subnet: jest.fn().mockImplementation(() => ({ id: "subnet-test" })),
    Eip: jest.fn().mockImplementation(() => ({ id: "eip-test" })),
    NatGateway: jest.fn().mockImplementation(() => ({ id: "nat-test" })),
    RouteTable: jest.fn().mockImplementation(() => ({ id: "rt-test" })),
    Route: jest.fn().mockImplementation(() => ({ id: "route-test" })),
    RouteTableAssociation: jest.fn().mockImplementation(() => ({ id: "rta-test" })),
    SecurityGroup: jest.fn().mockImplementation(() => ({ id: "sg-test" }))
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test",
      dnsName: "test-alb.us-east-1.elb.amazonaws.com"
    })),
    TargetGroup: jest.fn().mockImplementation(() => ({ 
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test",
      arnSuffix: "targetgroup/test"
    })),
    Listener: jest.fn().mockImplementation(() => ({ id: "listener-test" }))
  },
  getAvailabilityZones: jest.fn(() => Promise.resolve({ names: ["us-east-1a", "us-east-1b"] }))
}));

import * as aws from "@pulumi/aws";
import { NetworkingStack } from "../lib/networking-stack.mjs";

describe("NetworkingStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("VPC and Core Networking", () => {
    it("should create VPC with correct configuration", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        "webapp-vpc-test",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: "webapp-vpc-test",
            Component: "networking"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create Internet Gateway", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        "webapp-igw-test",
        expect.objectContaining({
          vpcId: stack.vpc.id,
          tags: expect.objectContaining({
            Name: "webapp-igw-test"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Subnet Creation", () => {
    it("should create 2 public subnets", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(stack.publicSubnets).toHaveLength(2);
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining("webapp-public-"),
        expect.objectContaining({
          vpcId: stack.vpc.id,
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Type: "public"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create 2 private subnets", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(stack.privateSubnets).toHaveLength(2);
      // Check that private subnets were created with correct tags
      const subnetCalls = aws.ec2.Subnet.mock.calls.filter(call => 
        call[0].includes("webapp-private-")
      );
      expect(subnetCalls).toHaveLength(2);
      subnetCalls.forEach(call => {
        expect(call[1]).toEqual(
          expect.objectContaining({
            vpcId: stack.vpc.id,
            tags: expect.objectContaining({
              Type: "private"
            })
          })
        );
      });
    });

    it("should use correct CIDR blocks for subnets", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      // Check public subnet CIDR blocks
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "webapp-public-1-test",
        expect.objectContaining({
          cidrBlock: "10.0.1.0/24"
        }),
        expect.any(Object)
      );
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "webapp-public-2-test",
        expect.objectContaining({
          cidrBlock: "10.0.2.0/24"
        }),
        expect.any(Object)
      );
      
      // Check private subnet CIDR blocks
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "webapp-private-1-test",
        expect.objectContaining({
          cidrBlock: "10.0.10.0/24"
        }),
        expect.any(Object)
      );
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "webapp-private-2-test",
        expect.objectContaining({
          cidrBlock: "10.0.11.0/24"
        }),
        expect.any(Object)
      );
    });
  });

  describe("NAT Gateway Setup", () => {
    it("should create 2 NAT gateways with EIPs", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      // Check EIP creation
      expect(aws.ec2.Eip).toHaveBeenCalledTimes(2);
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        expect.stringContaining("webapp-nat-eip-"),
        expect.objectContaining({
          domain: "vpc"
        }),
        expect.any(Object)
      );
      
      // Check NAT Gateway creation
      expect(aws.ec2.NatGateway).toHaveBeenCalledTimes(2);
    });
  });

  describe("Security Groups", () => {
    it("should create ALB security group with correct rules", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "webapp-alb-sg-test",
        expect.objectContaining({
          name: "webapp-alb-sg-test",
          description: "Security group for Application Load Balancer",
          vpcId: stack.vpc.id,
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: "tcp",
              cidrBlocks: ["0.0.0.0/0"]
            }),
            expect.objectContaining({
              fromPort: 443,
              toPort: 443,
              protocol: "tcp",
              cidrBlocks: ["0.0.0.0/0"]
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should create instance security group with restricted access", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "webapp-instance-sg-test",
        expect.objectContaining({
          name: "webapp-instance-sg-test",
          description: "Security group for EC2 instances",
          vpcId: stack.vpc.id,
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: "tcp",
              securityGroups: [stack.albSecurityGroup.id]
            }),
            expect.objectContaining({
              fromPort: 22,
              toPort: 22,
              protocol: "tcp",
              cidrBlocks: ["10.0.0.0/16"]
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Load Balancer Configuration", () => {
    it("should create Application Load Balancer", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        "webapp-alb-test",
        expect.objectContaining({
          name: "webapp-alb-test",
          internal: false,
          loadBalancerType: "application",
          securityGroups: [stack.albSecurityGroup.id],
          enableDeletionProtection: false
        }),
        expect.any(Object)
      );
    });

    it("should create target group with health check", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(
        "webapp-tg-test",
        expect.objectContaining({
          name: "webapp-tg-test",
          port: 80,
          protocol: "HTTP",
          vpcId: stack.vpc.id,
          targetType: "instance",
          healthCheck: expect.objectContaining({
            enabled: true,
            healthyThreshold: 2,
            unhealthyThreshold: 2,
            timeout: 5,
            interval: 30,
            path: "/",
            matcher: "200"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create ALB listener", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.lb.Listener).toHaveBeenCalledWith(
        "webapp-alb-listener-test",
        expect.objectContaining({
          loadBalancerArn: stack.alb.arn,
          port: "80",
          protocol: "HTTP",
          defaultActions: expect.arrayContaining([
            expect.objectContaining({
              type: "forward",
              targetGroupArn: stack.targetGroup.arn
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should register all required outputs", () => {
      const stack = new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: stack.vpc.id,
          publicSubnets: expect.anything(),
          privateSubnets: expect.anything(),
          albDnsName: stack.alb.dnsName,
          targetGroupArn: stack.targetGroup.arn
        })
      );
    });
  });

  describe("Route Tables and Associations", () => {
    it("should create public route table with internet gateway route", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        "webapp-public-rt-test",
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.ec2.Route).toHaveBeenCalledWith(
        "webapp-public-route-test",
        expect.objectContaining({
          destinationCidrBlock: "0.0.0.0/0"
        }),
        expect.any(Object)
      );
    });

    it("should create private route tables with NAT gateway routes", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      // Should create 2 private route tables (one for each private subnet)
      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        expect.stringContaining("webapp-private-rt-"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should associate subnets with route tables", () => {
      new NetworkingStack("test-networking", { environmentSuffix: "test" });
      
      // Check for route table associations
      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalled();
    });
  });
});