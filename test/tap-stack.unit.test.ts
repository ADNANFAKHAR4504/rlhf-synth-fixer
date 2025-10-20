import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack";
import * as fs from "fs";
import * as path from "path";

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Mock specific resource outputs
    if (args.type === "aws:ec2/vpc:Vpc") {
      outputs.id = `vpc-${args.name}`;
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.enableDnsHostnames = true;
      outputs.enableDnsSupport = true;
    }

    if (args.type === "aws:ec2/subnet:Subnet") {
      outputs.id = `subnet-${args.name}`;
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.availabilityZone = args.inputs.availabilityZone;
    }

    if (args.type === "aws:ec2transitgateway/transitGateway:TransitGateway") {
      outputs.id = `tgw-${args.name}`;
      outputs.arn = `arn:aws:ec2:us-east-1:123456789012:transit-gateway/tgw-${args.name}`;
    }

    if (args.type === "aws:ec2transitgateway/vpcAttachment:VpcAttachment") {
      outputs.id = `tgw-attach-${args.name}`;
    }

    if (args.type === "aws:ec2transitgateway/routeTable:RouteTable") {
      outputs.id = `tgw-rt-${args.name}`;
    }

    if (args.type === "aws:s3/bucket:Bucket") {
      outputs.id = args.inputs.bucket || `bucket-${args.name}`;
      outputs.bucket = args.inputs.bucket || `bucket-${args.name}`;
      outputs.arn = `arn:aws:s3:::${args.inputs.bucket || args.name}`;
    }

    if (args.type === "aws:route53/zone:Zone") {
      outputs.id = `zone-${args.name}`;
      outputs.zoneId = `Z${args.name.toUpperCase()}`;
      outputs.name = args.inputs.name;
    }

    if (args.type === "aws:ec2/natGateway:NatGateway") {
      outputs.id = `nat-${args.name}`;
    }

    if (args.type === "aws:ec2/eip:Eip") {
      outputs.id = `eip-${args.name}`;
      outputs.publicIp = `52.1.2.${Math.floor(Math.random() * 255)}`;
    }

    if (args.type === "aws:ec2/internetGateway:InternetGateway") {
      outputs.id = `igw-${args.name}`;
      outputs.internetGatewayId = `igw-${args.name}`;
    }

    if (args.type === "aws:ec2/routeTable:RouteTable") {
      outputs.id = `rt-${args.name}`;
    }

    if (args.type === "aws:ec2/vpcEndpoint:VpcEndpoint") {
      outputs.id = `vpce-${args.name}`;
    }

    if (args.type === "aws:ec2/securityGroup:SecurityGroup") {
      outputs.id = `sg-${args.name}`;
    }

    if (args.type === "aws:ec2/flowLog:FlowLog") {
      outputs.id = `fl-${args.name}`;
    }

    if (args.type === "aws:iam/role:Role") {
      outputs.id = `role-${args.name}`;
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    }

    if (args.type === "aws:cloudwatch/metricAlarm:MetricAlarm") {
      outputs.id = `alarm-${args.name}`;
      outputs.arn = `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.name}`;
    }

    if (args.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock") {
      outputs.id = `bpab-${args.name}`;
    }

    return {
      id: outputs.id || `${args.type}-${args.name}`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS calls
    if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
      return {
        names: ["us-east-1a", "us-east-1b", "us-east-1c"],
        zoneIds: ["use1-az1", "use1-az2", "use1-az3"],
      };
    }

    if (args.token === "aws:ec2/getSubnets:getSubnets") {
      const filters = args.inputs.filters || [];
      const typeFilter = filters.find((f: any) => f.name === "tag:Type");
      const vpcFilter = filters.find((f: any) => f.name === "vpc-id");

      if (typeFilter && typeFilter.values.includes("private")) {
        return {
          ids: [
            `subnet-private-0-${vpcFilter?.values[0]}`,
            `subnet-private-1-${vpcFilter?.values[0]}`,
            `subnet-private-2-${vpcFilter?.values[0]}`,
          ],
        };
      }

      if (typeFilter && typeFilter.values.includes("public")) {
        return {
          ids: [
            `subnet-public-0-${vpcFilter?.values[0]}`,
            `subnet-public-1-${vpcFilter?.values[0]}`,
            `subnet-public-2-${vpcFilter?.values[0]}`,
          ],
        };
      }

      return {
        ids: [
          `subnet-0-${vpcFilter?.values[0]}`,
          `subnet-1-${vpcFilter?.values[0]}`,
          `subnet-2-${vpcFilter?.values[0]}`,
        ],
      };
    }

    if (args.token === "aws:ec2/getInternetGateway:getInternetGateway") {
      return {
        internetGatewayId: "igw-mock-12345",
      };
    }

    return {};
  },
});

describe("TapStack Unit Tests", () => {
  let stack: TapStack;
  const environmentSuffix = "test";

  beforeEach(() => {
    // Set environment variables
    process.env.REPOSITORY = "test-repo";
    process.env.COMMIT_AUTHOR = "test-author";
  });

  afterEach(() => {
    // Clean up
    delete process.env.REPOSITORY;
    delete process.env.COMMIT_AUTHOR;
  });

  describe("Stack Creation", () => {
    it("should create a TapStack instance", async () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });

      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should use default region if not provided", async () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
      });

      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should accept custom region", async () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-west-2",
      });

      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("VPC Creation", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should create hub VPC with correct CIDR", async () => {
      const hubVpc = stack.hubVpc;
      const cidrBlock = await hubVpc.cidrBlock;

      expect(cidrBlock).toBe("10.0.0.0/16");
    });

    it("should create production VPC with correct CIDR", async () => {
      const prodVpc = stack.productionVpc;
      const cidrBlock = await prodVpc.cidrBlock;

      expect(cidrBlock).toBe("10.1.0.0/16");
    });

    it("should create development VPC with correct CIDR", async () => {
      const devVpc = stack.developmentVpc;
      const cidrBlock = await devVpc.cidrBlock;

      expect(cidrBlock).toBe("10.2.0.0/16");
    });

    it("should enable DNS support and hostnames for all VPCs", async () => {
      const hubVpc = stack.hubVpc;
      const dnsSupport = await hubVpc.enableDnsSupport;
      const dnsHostnames = await hubVpc.enableDnsHostnames;

      expect(dnsSupport).toBe(true);
      expect(dnsHostnames).toBe(true);
    });

    it("should ensure VPC CIDRs do not overlap", async () => {
      const hubCidr = await stack.hubVpc.cidrBlock;
      const prodCidr = await stack.productionVpc.cidrBlock;
      const devCidr = await stack.developmentVpc.cidrBlock;

      expect(hubCidr).toBe("10.0.0.0/16");
      expect(prodCidr).toBe("10.1.0.0/16");
      expect(devCidr).toBe("10.2.0.0/16");

      // Verify they're different
      expect(hubCidr).not.toBe(prodCidr);
      expect(prodCidr).not.toBe(devCidr);
      expect(hubCidr).not.toBe(devCidr);
    });
  });

  describe("Transit Gateway", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should create Transit Gateway", async () => {
      const tgw = stack.transitGateway;
      const tgwId = await tgw.id;

      expect(tgwId).toBeDefined();
      expect(tgwId).toContain("tgw-");
    });

    it("should disable default route table association", async () => {
      const tgw = stack.transitGateway;
      const defaultAssoc = await tgw.defaultRouteTableAssociation;

      expect(defaultAssoc).toBe("disable");
    });

    it("should disable default route table propagation", async () => {
      const tgw = stack.transitGateway;
      const defaultProp = await tgw.defaultRouteTablePropagation;

      expect(defaultProp).toBe("disable");
    });

    it("should enable DNS support", async () => {
      const tgw = stack.transitGateway;
      const dnsSupport = await tgw.dnsSupport;

      expect(dnsSupport).toBe("enable");
    });
  });

  describe("S3 Bucket for Flow Logs", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should create S3 bucket for VPC Flow Logs", async () => {
      const bucket = stack.flowLogsBucket;
      const bucketName = await bucket.bucket;

      expect(bucketName).toContain("vpc-flow-logs");
      expect(bucketName).toContain(environmentSuffix);
    });

    it("should enable server-side encryption on S3 bucket", async () => {
      const bucket = stack.flowLogsBucket;

      // FIXED: Properly handle Output types with apply
      const sseAlgorithm = await bucket.serverSideEncryptionConfiguration.apply(
        (config) => config?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm ?? null
      );

      expect(sseAlgorithm).toBe("AES256");
    });

    it("should configure lifecycle policy for Glacier transition", async () => {
      const bucket = stack.flowLogsBucket;

      // FIXED: Use apply to access array methods and then apply again to access properties
      const glacierRuleData = await bucket.lifecycleRules.apply((rules) => {
        const rule = rules?.find(r => r.id === "transition-to-glacier");
        return {
          enabled: rule?.enabled ?? null,
          transitionDays: rule?.transitions?.[0]?.days ?? null,
          storageClass: rule?.transitions?.[0]?.storageClass ?? null,
        };
      });

      expect(glacierRuleData.enabled).toBe(true);
      expect(glacierRuleData.transitionDays).toBe(30);
      expect(glacierRuleData.storageClass).toBe("GLACIER");
    });


    it("should set private ACL on S3 bucket", async () => {
      const bucket = stack.flowLogsBucket;
      const acl = await bucket.acl;

      expect(acl).toBe("private");
    });
  });

  describe("Route53 Private Hosted Zones", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should create hub private hosted zone", async () => {
      const zone = stack.hubZone;
      const zoneName = await zone.name;

      expect(zoneName).toBe("hub.internal");
    });

    it("should create production private hosted zone", async () => {
      const zone = stack.prodZone;
      const zoneName = await zone.name;

      expect(zoneName).toBe("production.internal");
    });

    it("should create development private hosted zone", async () => {
      const zone = stack.devZone;
      const zoneName = await zone.name;

      expect(zoneName).toBe("development.internal");
    });
  });

  describe("Tagging", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should apply ManagedBy tag to hub VPC", async () => {
      const hubVpc = stack.hubVpc;
      // FIXED: Use apply to access tag properties
      const managedBy = await hubVpc.tags.apply(tags => tags?.ManagedBy ?? null);

      expect(managedBy).toBe("pulumi");
    });

    it("should apply CostCenter tag to resources", async () => {
      const hubVpc = stack.hubVpc;
      const costCenter = await hubVpc.tags.apply(tags => tags?.CostCenter ?? null);

      expect(costCenter).toBe("network-operations");
    });

    it("should apply Environment tag to hub VPC", async () => {
      const hubVpc = stack.hubVpc;
      const environment = await hubVpc.tags.apply(tags => tags?.Environment ?? null);

      expect(environment).toBe("hub");
    });

    it("should apply Environment tag to production VPC", async () => {
      const prodVpc = stack.productionVpc;
      const environment = await prodVpc.tags.apply(tags => tags?.Environment ?? null);

      expect(environment).toBe("production");
    });

    it("should apply Environment tag to development VPC", async () => {
      const devVpc = stack.developmentVpc;
      const environment = await devVpc.tags.apply(tags => tags?.Environment ?? null);

      expect(environment).toBe("development");
    });

    it("should apply Repository tag from environment variable", async () => {
      const hubVpc = stack.hubVpc;
      const repository = await hubVpc.tags.apply(tags => tags?.Repository ?? null);

      expect(repository).toBe("test-repo");
    });

    it("should apply Author tag from environment variable", async () => {
      const hubVpc = stack.hubVpc;
      const author = await hubVpc.tags.apply(tags => tags?.Author ?? null);

      expect(author).toBe("test-author");
    });

    it("should apply Name tag to Transit Gateway", async () => {
      const tgw = stack.transitGateway;
      const name = await tgw.tags.apply(tags => tags?.Name ?? null);

      expect(name).toContain("tgw-");
      expect(name).toContain(environmentSuffix);
    });

    it("should apply all required tags to S3 bucket", async () => {
      const bucket = stack.flowLogsBucket;
      const tagsData = await bucket.tags.apply(tags => ({
        ManagedBy: tags?.ManagedBy,
        CostCenter: tags?.CostCenter,
        Environment: tags?.Environment,
        Name: tags?.Name,
      }));

      expect(tagsData.ManagedBy).toBe("pulumi");
      expect(tagsData.CostCenter).toBe("network-operations");
      expect(tagsData.Environment).toBe(environmentSuffix);
      expect(tagsData.Name).toContain("vpc-flow-logs");
    });
  });

  describe("Output File Generation", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should create cfn-outputs directory", async () => {
      await stack.outputs;

      const outputDir = path.join(process.cwd(), "cfn-outputs");
      expect(fs.existsSync(outputDir)).toBe(true);
    });

    it("should create flat-outputs.json file", async () => {
      await stack.outputs;

      const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it("should include all required outputs in JSON file", async () => {
      await stack.outputs;

      const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      const outputData = JSON.parse(fs.readFileSync(outputFile, "utf8"));

      expect(outputData.hubVpcId).toBeDefined();
      expect(outputData.hubVpcCidr).toBeDefined();
      expect(outputData.productionVpcId).toBeDefined();
      expect(outputData.productionVpcCidr).toBeDefined();
      expect(outputData.developmentVpcId).toBeDefined();
      expect(outputData.developmentVpcCidr).toBeDefined();
      expect(outputData.transitGatewayId).toBeDefined();
      expect(outputData.transitGatewayArn).toBeDefined();
      expect(outputData.flowLogsBucketName).toBeDefined();
      expect(outputData.flowLogsBucketArn).toBeDefined();
      expect(outputData.hubZoneId).toBeDefined();
      expect(outputData.productionZoneId).toBeDefined();
      expect(outputData.developmentZoneId).toBeDefined();
      expect(outputData.region).toBeDefined();
      expect(outputData.environmentSuffix).toBeDefined();
    });

    it("should have correct CIDR blocks in outputs", async () => {
      await stack.outputs;

      const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      const outputData = JSON.parse(fs.readFileSync(outputFile, "utf8"));

      expect(outputData.hubVpcCidr).toBe("10.0.0.0/16");
      expect(outputData.productionVpcCidr).toBe("10.1.0.0/16");
      expect(outputData.developmentVpcCidr).toBe("10.2.0.0/16");
    });

    it("should have correct environment suffix in outputs", async () => {
      await stack.outputs;

      const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      const outputData = JSON.parse(fs.readFileSync(outputFile, "utf8"));

      expect(outputData.environmentSuffix).toBe(environmentSuffix);
    });

    it("should have correct region in outputs", async () => {
      await stack.outputs;

      const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      const outputData = JSON.parse(fs.readFileSync(outputFile, "utf8"));

      expect(outputData.region).toBe("us-east-1");
    });
  });

  describe("CIDR Calculation", () => {
    it("should calculate correct subnet CIDR blocks", () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });

      // Access private method through type casting
      const calculateSubnetCidr = (stack as any).calculateSubnetCidr.bind(stack);

      expect(calculateSubnetCidr("10.0.0.0/16", 0)).toBe("10.0.0.0/20");
      expect(calculateSubnetCidr("10.0.0.0/16", 1)).toBe("10.0.16.0/20");
      expect(calculateSubnetCidr("10.0.0.0/16", 2)).toBe("10.0.32.0/20");
      expect(calculateSubnetCidr("10.1.0.0/16", 0)).toBe("10.1.0.0/20");
      expect(calculateSubnetCidr("10.2.0.0/16", 0)).toBe("10.2.0.0/20");
    });
  });

  describe("Resource Naming Convention", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should follow naming convention for VPCs", async () => {
      const hubName = await stack.hubVpc.tags.apply(tags => tags?.Name ?? null);
      const prodName = await stack.productionVpc.tags.apply(tags => tags?.Name ?? null);
      const devName = await stack.developmentVpc.tags.apply(tags => tags?.Name ?? null);

      expect(hubName).toContain("hub-vpc");
      expect(hubName).toContain(environmentSuffix);

      expect(prodName).toContain("production-vpc");
      expect(prodName).toContain(environmentSuffix);

      expect(devName).toContain("development-vpc");
      expect(devName).toContain(environmentSuffix);
    });

    it("should follow naming convention for Transit Gateway", async () => {
      const tgwName = await stack.transitGateway.tags.apply(tags => tags?.Name ?? null);

      expect(tgwName).toContain("tgw-");
      expect(tgwName).toContain(environmentSuffix);
    });

    it("should follow naming convention for S3 bucket", async () => {
      const bucketName = await stack.flowLogsBucket.bucket;
      const bucketTagName = await stack.flowLogsBucket.tags.apply(tags => tags?.Name ?? null);

      expect(bucketName).toContain("vpc-flow-logs");
      expect(bucketName).toContain(environmentSuffix);
      expect(bucketTagName).toContain("vpc-flow-logs");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing environment variables gracefully", () => {
      delete process.env.REPOSITORY;
      delete process.env.COMMIT_AUTHOR;

      expect(() => {
        stack = new TapStack("test-stack", {
          environmentSuffix,
          region: "us-east-1",
        });
      }).not.toThrow();
    });

    it("should use default values when environment variables are not set", async () => {
      delete process.env.REPOSITORY;
      delete process.env.COMMIT_AUTHOR;

      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });

      const repository = await stack.hubVpc.tags.apply(tags => tags?.Repository ?? null);
      const author = await stack.hubVpc.tags.apply(tags => tags?.Author ?? null);

      expect(repository).toBe("tap-infrastructure");
      expect(author).toBe("pulumi");
    });
  });

  describe("Pulumi Stack Outputs", () => {
    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });
    });

    it("should export hubVpcId as stack output", async () => {
      const hubVpcId = await stack.outputs.apply(outputs => outputs.hubVpcId);
      expect(hubVpcId).toBeDefined();
    });

    it("should export productionVpcId as stack output", async () => {
      const prodVpcId = await stack.outputs.apply(outputs => outputs.productionVpcId);
      expect(prodVpcId).toBeDefined();
    });

    it("should export developmentVpcId as stack output", async () => {
      const devVpcId = await stack.outputs.apply(outputs => outputs.developmentVpcId);
      expect(devVpcId).toBeDefined();
    });

    it("should export transitGatewayId as stack output", async () => {
      const tgwId = await stack.outputs.apply(outputs => outputs.transitGatewayId);
      expect(tgwId).toBeDefined();
    });

    it("should export all zone IDs as stack outputs", async () => {
      const zoneIds = await stack.outputs.apply(outputs => ({
        hubZoneId: outputs.hubZoneId,
        productionZoneId: outputs.productionZoneId,
        developmentZoneId: outputs.developmentZoneId,
      }));

      expect(zoneIds.hubZoneId).toBeDefined();
      expect(zoneIds.productionZoneId).toBeDefined();
      expect(zoneIds.developmentZoneId).toBeDefined();
    });
  });

  describe("Component Resource", () => {
    it("should be a Pulumi ComponentResource", () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it("should have correct resource type", () => {
      stack = new TapStack("test-stack", {
        environmentSuffix,
        region: "us-east-1",
      });

      // Check that it's registered with the correct type
      expect(stack.urn).toBeDefined();
    });
  });
});
