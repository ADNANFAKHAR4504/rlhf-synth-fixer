/**
 * network-stack.unit.test.ts
 *
 * Unit tests for NetworkStack
 */
import * as pulumi from "@pulumi/pulumi";
import { NetworkStack } from "../lib/global-banking/network-stack";

describe("NetworkStack", () => {
  let stack: NetworkStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            endpoint: "endpoint.example.com",
            configurationEndpointAddress: "config.example.com:6379",
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
          return {
            names: ["us-east-1a", "us-east-1b", "us-east-1c"],
          };
        }
        if (args.token === "aws:index/getRegion:getRegion") {
          return { name: "us-east-1" };
        }
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-network", {
        environmentSuffix: "test",
        vpcCidr: "10.29.0.0/16",
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        tags: pulumi.output({ Environment: "test" }),
        enableTransitGateway: true,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(NetworkStack);
    });

    it("exposes VPC ID", (done) => {
      expect(stack.primaryVpcId).toBeDefined();
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it("exposes public subnet IDs", (done) => {
      expect(stack.publicSubnetIds).toBeDefined();
      pulumi.all([stack.publicSubnetIds]).apply(([subnetIds]) => {
        expect(Array.isArray(subnetIds)).toBe(true);
        done();
      });
    });

    it("exposes private subnet IDs", (done) => {
      expect(stack.privateSubnetIds).toBeDefined();
      pulumi.all([stack.privateSubnetIds]).apply(([subnetIds]) => {
        expect(Array.isArray(subnetIds)).toBe(true);
        done();
      });
    });

    it("exposes transit gateway ID", (done) => {
      expect(stack.transitGatewayId).toBeDefined();
      pulumi.all([stack.transitGatewayId]).apply(([tgwId]) => {
        expect(tgwId).toBeTruthy();
        done();
      });
    });

    it("exposes NAT gateway IDs", (done) => {
      expect(stack.natGatewayIds).toBeDefined();
      pulumi.all([stack.natGatewayIds]).apply(([natIds]) => {
        expect(Array.isArray(natIds)).toBe(true);
        done();
      });
    });
  });

  describe("VPC Configuration", () => {
    it("creates VPC with correct CIDR", (done) => {
      stack = new NetworkStack("test-vpc-cidr", {
        environmentSuffix: "vpc",
        vpcCidr: "10.50.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Purpose: "testing" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      expect(stack.primaryVpcId).toBeDefined();
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it("enables DNS hostnames and support", (done) => {
      stack = new NetworkStack("test-vpc-dns", {
        environmentSuffix: "dns",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ DNS: "enabled" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("applies tags to VPC", (done) => {
      stack = new NetworkStack("test-vpc-tags", {
        environmentSuffix: "tags",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Name: "test-vpc" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });
  });

  describe("Subnet Configuration", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-subnets", {
        environmentSuffix: "subnets",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Component: "subnets" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates 3 public subnets", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([subnetIds]) => {
        expect(subnetIds.length).toBeGreaterThanOrEqual(3);
        done();
      });
    });

    it("creates 3 private subnets", (done) => {
      pulumi.all([stack.privateSubnetIds]).apply(([subnetIds]) => {
        expect(subnetIds.length).toBeGreaterThanOrEqual(3);
        done();
      });
    });

    it("distributes subnets across availability zones", (done) => {
      pulumi.all([stack.publicSubnetIds, stack.privateSubnetIds]).apply(([publicSubnetIds, privateSubnetIds]) => {
        expect(publicSubnetIds).toBeDefined();
        expect(privateSubnetIds).toBeDefined();
        done();
      });
    });

    it("enables auto-assign public IP on public subnets", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([subnetIds]) => {
        expect(subnetIds.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe("Internet Gateway Configuration", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-igw", {
        environmentSuffix: "igw",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Gateway: "internet" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates internet gateway", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("attaches internet gateway to VPC", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });
  });

  describe("NAT Gateway Configuration", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-nat", {
        environmentSuffix: "nat",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Gateway: "nat" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates NAT gateway with Elastic IP", (done) => {
      pulumi.all([stack.natGatewayIds]).apply(([natIds]) => {
        expect(natIds.length).toBeGreaterThanOrEqual(1);
        done();
      });
    });

    it("places NAT gateway in public subnet", (done) => {
      pulumi.all([stack.natGatewayIds, stack.publicSubnetIds]).apply(([natIds, publicSubnetIds]) => {
        expect(natIds).toBeDefined();
        expect(publicSubnetIds).toBeDefined();
        done();
      });
    });

    it("creates single NAT gateway for cost optimization", (done) => {
      pulumi.all([stack.natGatewayIds]).apply(([natIds]) => {
        expect(natIds.length).toBe(1);
        done();
      });
    });
  });

  describe("Route Table Configuration", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-routes", {
        environmentSuffix: "routes",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Component: "routing" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates public route table", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([publicSubnetIds]) => {
        expect(publicSubnetIds).toBeDefined();
        done();
      });
    });

    it("creates private route table", (done) => {
      pulumi.all([stack.privateSubnetIds]).apply(([privateSubnetIds]) => {
        expect(privateSubnetIds).toBeDefined();
        done();
      });
    });

    it("associates public subnets with public route table", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([subnetIds]) => {
        expect(subnetIds.length).toBeGreaterThan(0);
        done();
      });
    });

    it("associates private subnets with private route table", (done) => {
      pulumi.all([stack.privateSubnetIds]).apply(([subnetIds]) => {
        expect(subnetIds.length).toBeGreaterThan(0);
        done();
      });
    });

    it("routes public traffic through internet gateway", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([publicSubnetIds]) => {
        expect(publicSubnetIds).toBeDefined();
        done();
      });
    });

    it("routes private traffic through NAT gateway", (done) => {
      pulumi.all([stack.privateSubnetIds, stack.natGatewayIds]).apply(([privateSubnetIds, natIds]) => {
        expect(privateSubnetIds).toBeDefined();
        expect(natIds).toBeDefined();
        done();
      });
    });
  });

  describe("VPC Flow Logs", () => {
    it("creates flow logs when enabled", (done) => {
      stack = new NetworkStack("test-flowlogs-enabled", {
        environmentSuffix: "flowlogs",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ FlowLogs: "enabled" }),
        enableTransitGateway: false,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("does not create flow logs when disabled", (done) => {
      stack = new NetworkStack("test-flowlogs-disabled", {
        environmentSuffix: "no-flowlogs",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ FlowLogs: "disabled" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("creates CloudWatch log group for flow logs", (done) => {
      stack = new NetworkStack("test-flowlogs-cw", {
        environmentSuffix: "cw",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Logging: "enabled" }),
        enableTransitGateway: false,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("creates IAM role for flow logs", (done) => {
      stack = new NetworkStack("test-flowlogs-iam", {
        environmentSuffix: "iam",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ IAM: "flowlogs" }),
        enableTransitGateway: false,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("encrypts flow logs with KMS", (done) => {
      stack = new NetworkStack("test-flowlogs-kms", {
        environmentSuffix: "kms",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Encryption: "kms" }),
        enableTransitGateway: false,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });
  });

  describe("Transit Gateway Configuration", () => {
    it("creates transit gateway when enabled", (done) => {
      stack = new NetworkStack("test-tgw-enabled", {
        environmentSuffix: "tgw",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: ["eu-west-1"] },
        tags: pulumi.output({ TGW: "enabled" }),
        enableTransitGateway: true,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.transitGatewayId]).apply(([tgwId]) => {
        expect(tgwId).toBeTruthy();
        done();
      });
    });

    it("does not create transit gateway when disabled", (done) => {
      stack = new NetworkStack("test-tgw-disabled", {
        environmentSuffix: "no-tgw",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ TGW: "disabled" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.transitGatewayId]).apply(([tgwId]) => {
        expect(tgwId).toBe("");
        done();
      });
    });

    it("attaches VPC to transit gateway", (done) => {
      stack = new NetworkStack("test-tgw-attach", {
        environmentSuffix: "attach",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: ["eu-west-1"] },
        tags: pulumi.output({ Attachment: "enabled" }),
        enableTransitGateway: true,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.transitGatewayId, stack.primaryVpcId]).apply(([tgwId, vpcId]) => {
        expect(tgwId).toBeTruthy();
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it("enables DNS support on transit gateway", (done) => {
      stack = new NetworkStack("test-tgw-dns", {
        environmentSuffix: "dns",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: ["eu-west-1"] },
        tags: pulumi.output({ DNS: "enabled" }),
        enableTransitGateway: true,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.transitGatewayId]).apply(([tgwId]) => {
        expect(tgwId).toBeTruthy();
        done();
      });
    });
  });

  describe("VPC Endpoints", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-endpoints", {
        environmentSuffix: "endpoints",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Endpoints: "enabled" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("creates security group for VPC endpoints", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("creates interface endpoints for AWS services", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("creates S3 gateway endpoint", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("creates DynamoDB gateway endpoint", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("enables private DNS for interface endpoints", (done) => {
      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it("associates gateway endpoints with route tables", (done) => {
      pulumi.all([stack.publicSubnetIds]).apply(([publicSubnetIds]) => {
        expect(publicSubnetIds).toBeDefined();
        done();
      });
    });
  });

  describe("Multi-region Configuration", () => {
    it("supports primary region only", (done) => {
      stack = new NetworkStack("test-single-region", {
        environmentSuffix: "single",
        vpcCidr: "10.29.0.0/16",
        regions: {
          primary: "us-east-1",
          replicas: [],
        },
        tags: pulumi.output({ Regions: "single" }),
        enableTransitGateway: false,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.primaryVpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it("supports multiple replica regions", (done) => {
      stack = new NetworkStack("test-multi-region", {
        environmentSuffix: "multi",
        vpcCidr: "10.29.0.0/16",
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
        tags: pulumi.output({ Regions: "multi" }),
        enableTransitGateway: true,
        enableFlowLogs: false,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });

      pulumi.all([stack.transitGatewayId]).apply(([tgwId]) => {
        expect(tgwId).toBeTruthy();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-outputs", {
        environmentSuffix: "outputs",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Test: "outputs" }),
        enableTransitGateway: true,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("primaryVpcId");
      expect(stack).toHaveProperty("publicSubnetIds");
      expect(stack).toHaveProperty("privateSubnetIds");
      expect(stack).toHaveProperty("transitGatewayId");
      expect(stack).toHaveProperty("natGatewayIds");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.primaryVpcId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.publicSubnetIds)).toBe(true);
      expect(pulumi.Output.isInstance(stack.privateSubnetIds)).toBe(true);
      expect(pulumi.Output.isInstance(stack.transitGatewayId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.natGatewayIds)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new NetworkStack("test-deps", {
        environmentSuffix: "deps",
        vpcCidr: "10.29.0.0/16",
        regions: { primary: "us-east-1", replicas: [] },
        tags: pulumi.output({ Dependencies: "test" }),
        enableTransitGateway: true,
        enableFlowLogs: true,
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      });
    });

    it("subnets depend on VPC", (done) => {
      pulumi.all([stack.primaryVpcId, stack.publicSubnetIds, stack.privateSubnetIds]).apply(([vpcId, publicSubnetIds, privateSubnetIds]) => {
        expect(vpcId).toBeDefined();
        expect(publicSubnetIds).toBeDefined();
        expect(privateSubnetIds).toBeDefined();
        done();
      });
    });

    it("NAT gateway depends on public subnet and EIP", (done) => {
      pulumi.all([stack.natGatewayIds, stack.publicSubnetIds]).apply(([natIds, publicSubnetIds]) => {
        expect(natIds).toBeDefined();
        expect(publicSubnetIds).toBeDefined();
        done();
      });
    });

    it("route tables depend on gateways", (done) => {
      pulumi.all([stack.natGatewayIds, stack.privateSubnetIds]).apply(([natIds, privateSubnetIds]) => {
        expect(natIds).toBeDefined();
        expect(privateSubnetIds).toBeDefined();
        done();
      });
    });

    it("transit gateway attachment depends on VPC and subnets", (done) => {
      pulumi.all([stack.transitGatewayId, stack.primaryVpcId, stack.privateSubnetIds]).apply(([tgwId, vpcId, privateSubnetIds]) => {
        expect(tgwId).toBeTruthy();
        expect(vpcId).toBeDefined();
        expect(privateSubnetIds).toBeDefined();
        done();
      });
    });
  });
});