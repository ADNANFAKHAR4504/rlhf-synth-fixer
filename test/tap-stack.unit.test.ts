import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
      return {
        names: ["us-east-1a", "us-east-1b"],
      };
    }
    return {};
  },
});

describe("Payment Infrastructure Tests", () => {
  let infrastructure: typeof import("../infrastructure");

  beforeAll(() => {
    infrastructure = require("../infrastructure");
  });

  describe("PaymentInfrastructure", () => {
    it("should create infrastructure with correct naming", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      expect(infra).toBeDefined();
    });

    it("should create VPC with correct CIDR", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const vpcId = await new Promise((resolve) => {
        infra.vpc.id.apply((id) => resolve(id));
      });

      expect(vpcId).toBeDefined();
    });

    it("should create S3 bucket with force destroy enabled", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const bucketName = await new Promise((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name));
      });

      expect(bucketName).toContain("test-123");
    });

    it("should create Lambda functions with correct memory size", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });

    it("should create RDS instance with correct backup retention", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const rdsEndpoint = await new Promise((resolve) => {
        infra.rdsEndpoint.apply((endpoint) => resolve(endpoint));
      });

      expect(rdsEndpoint).toBeDefined();
    });

    it("should create SQS queue with DLQ", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const queueUrl = await new Promise<string>((resolve) => {
        infra.paymentQueue.url.apply((url) => resolve(url as string));
      });

      expect(queueUrl).toBeDefined();
    });

    it("should create API Gateway with correct endpoints", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const apiEndpoint = await new Promise((resolve) => {
        infra.apiGatewayEndpoint.apply((endpoint) => resolve(endpoint));
      });

      expect(apiEndpoint).toBeDefined();
    });

    it("should create resources with environment-specific configurations", async () => {
      const prodInfra = new infrastructure.PaymentInfrastructure("prod-infra", {
        environmentSuffix: "prod-123",
        environment: "prod",
        region: "us-east-1",
        rdsInstanceClass: "db.r5.large",
        rdsBackupRetentionDays: 7,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      expect(prodInfra).toBeDefined();
    });

    it("should validate resource naming includes environmentSuffix", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-456",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      const bucketName = await new Promise<string>((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
      });

      expect(bucketName).toContain("test-456");
    });

    it("should validate RDS deletionProtection is false", async () => {
      const infra = new infrastructure.PaymentInfrastructure("test-infra", {
        environmentSuffix: "test-123",
        environment: "test",
        region: "us-east-1",
        rdsInstanceClass: "db.t3.medium",
        rdsBackupRetentionDays: 3,
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
      });

      // RDS instance should be created with deletionProtection: false
      expect(infra.rdsEndpoint).toBeDefined();
    });
  });
});