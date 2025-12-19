import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name + "_id",
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe("Infrastructure Stack Tests", () => {
  let stack: typeof import("../lib/tap-stack");

  beforeAll(async () => {
    // Set required config
    process.env.PULUMI_CONFIG = JSON.stringify({
      "tap:environmentSuffix": "test",
    });

    stack = await import("../lib/tap-stack");
  });

  describe("VPC Configuration", () => {
    it("should export VPC ID", async () => {
      const vpcId = await stack.vpcId;
      expect(vpcId).toBeDefined();
    });

    it("should export public subnet IDs", async () => {
      const publicSubnetIds = await stack.publicSubnetIds;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
    });

    it("should export private subnet IDs", async () => {
      const privateSubnetIds = await stack.privateSubnetIds;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
    });
  });

  describe("Load Balancer Configuration", () => {
    it("should export ALB DNS name", async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });

    it("should export ALB ARN", async () => {
      const albArn = await stack.albArn;
      expect(albArn).toBeDefined();
    });
  });

  describe("ECS Configuration", () => {
    it("should export ECS cluster ARN", async () => {
      const ecsClusterArn = await stack.ecsClusterArn;
      expect(ecsClusterArn).toBeDefined();
    });

    it("should export ECS service ARN", async () => {
      const ecsServiceArn = await stack.ecsServiceArn;
      expect(ecsServiceArn).toBeDefined();
    });
  });

  describe("Database Configuration", () => {
    it("should export RDS cluster endpoint", async () => {
      const rdsEndpoint = await stack.rdsClusterEndpoint;
      expect(rdsEndpoint).toBeDefined();
    });

    it("should export RDS reader endpoint", async () => {
      const rdsReaderEndpoint = await stack.rdsClusterReaderEndpoint;
      expect(rdsReaderEndpoint).toBeDefined();
    });
  });

  describe("Storage Configuration", () => {
    it("should export S3 bucket name", async () => {
      const s3BucketName = await stack.s3BucketName;
      expect(s3BucketName).toBeDefined();
    });
  });

  describe("Monitoring Configuration", () => {
    it("should export dashboard name", async () => {
      const dashboardName = await stack.dashboardName;
      expect(dashboardName).toBeDefined();
    });

    it("should export SNS topic ARN", async () => {
      const snsTopicArn = await stack.snsTopicArn;
      expect(snsTopicArn).toBeDefined();
    });
  });
});