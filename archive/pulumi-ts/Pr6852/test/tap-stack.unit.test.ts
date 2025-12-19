import { getEnvironmentConfig, getResourceTags, environmentConfigs } from "../lib/config";
import { generateConfigComparison, ConfigComparisonProvider } from "../lib/comparison-provider";

describe("Configuration Module Tests", () => {
  describe("environmentConfigs", () => {
    it("should have configurations for all three environments", () => {
      expect(environmentConfigs).toBeDefined();
      expect(environmentConfigs.dev).toBeDefined();
      expect(environmentConfigs.staging).toBeDefined();
      expect(environmentConfigs.prod).toBeDefined();
    });

    it("should have all required properties for dev environment", () => {
      const config = environmentConfigs.dev;
      expect(config.environment).toBe("dev");
      expect(config.vpcCidr).toBeDefined();
      expect(config.rdsInstanceClass).toBeDefined();
      expect(config.apiGatewayRateLimit).toBeDefined();
      expect(config.dynamoReadCapacity).toBeDefined();
      expect(config.dynamoWriteCapacity).toBeDefined();
      expect(config.s3RetentionDays).toBeDefined();
      expect(config.cloudWatchThreshold).toBeDefined();
      expect(config.kmsKeyAlias).toBeDefined();
    });

    it("should have all required properties for staging environment", () => {
      const config = environmentConfigs.staging;
      expect(config.environment).toBe("staging");
      expect(config.vpcCidr).toBeDefined();
      expect(config.rdsInstanceClass).toBeDefined();
      expect(config.apiGatewayRateLimit).toBeDefined();
      expect(config.dynamoReadCapacity).toBeDefined();
      expect(config.dynamoWriteCapacity).toBeDefined();
      expect(config.s3RetentionDays).toBeDefined();
      expect(config.cloudWatchThreshold).toBeDefined();
      expect(config.kmsKeyAlias).toBeDefined();
    });

    it("should have all required properties for prod environment", () => {
      const config = environmentConfigs.prod;
      expect(config.environment).toBe("prod");
      expect(config.vpcCidr).toBeDefined();
      expect(config.rdsInstanceClass).toBeDefined();
      expect(config.apiGatewayRateLimit).toBeDefined();
      expect(config.dynamoReadCapacity).toBeDefined();
      expect(config.dynamoWriteCapacity).toBeDefined();
      expect(config.s3RetentionDays).toBeDefined();
      expect(config.cloudWatchThreshold).toBeDefined();
      expect(config.kmsKeyAlias).toBeDefined();
    });

    it("should have different VPC CIDRs for each environment", () => {
      const devVpc = environmentConfigs.dev.vpcCidr;
      const stagingVpc = environmentConfigs.staging.vpcCidr;
      const prodVpc = environmentConfigs.prod.vpcCidr;

      expect(devVpc).not.toBe(stagingVpc);
      expect(stagingVpc).not.toBe(prodVpc);
      expect(devVpc).not.toBe(prodVpc);
    });

    it("should have different KMS key aliases for each environment", () => {
      const devKey = environmentConfigs.dev.kmsKeyAlias;
      const stagingKey = environmentConfigs.staging.kmsKeyAlias;
      const prodKey = environmentConfigs.prod.kmsKeyAlias;

      expect(devKey).not.toBe(stagingKey);
      expect(stagingKey).not.toBe(prodKey);
      expect(devKey).not.toBe(prodKey);
    });

    it("should have increasing capacity from dev to prod", () => {
      const devRead = environmentConfigs.dev.dynamoReadCapacity;
      const stagingRead = environmentConfigs.staging.dynamoReadCapacity;
      const prodRead = environmentConfigs.prod.dynamoReadCapacity;

      expect(devRead).toBeLessThan(stagingRead);
      expect(stagingRead).toBeLessThan(prodRead);
    });

    it("should have increasing retention days from dev to prod", () => {
      const devRetention = environmentConfigs.dev.s3RetentionDays;
      const stagingRetention = environmentConfigs.staging.s3RetentionDays;
      const prodRetention = environmentConfigs.prod.s3RetentionDays;

      expect(devRetention).toBeLessThan(stagingRetention);
      expect(stagingRetention).toBeLessThan(prodRetention);
    });

    it("should have decreasing cloudwatch thresholds from dev to prod", () => {
      const devThreshold = environmentConfigs.dev.cloudWatchThreshold;
      const stagingThreshold = environmentConfigs.staging.cloudWatchThreshold;
      const prodThreshold = environmentConfigs.prod.cloudWatchThreshold;

      expect(devThreshold).toBeGreaterThan(stagingThreshold);
      expect(stagingThreshold).toBeGreaterThan(prodThreshold);
    });
  });

  describe("getEnvironmentConfig function", () => {
    it("should return dev configuration", () => {
      const config = getEnvironmentConfig("dev");
      expect(config).toBeDefined();
      expect(config.environment).toBe("dev");
      expect(config.vpcCidr).toBe("10.0.0.0/16");
    });

    it("should return staging configuration", () => {
      const config = getEnvironmentConfig("staging");
      expect(config).toBeDefined();
      expect(config.environment).toBe("staging");
      expect(config.vpcCidr).toBe("10.1.0.0/16");
    });

    it("should return prod configuration", () => {
      const config = getEnvironmentConfig("prod");
      expect(config).toBeDefined();
      expect(config.environment).toBe("prod");
      expect(config.vpcCidr).toBe("10.2.0.0/16");
    });

    it("should throw error for invalid environment", () => {
      expect(() => {
        getEnvironmentConfig("invalid");
      }).toThrow("Unknown environment: invalid");
    });

    it("should throw error for missing environment", () => {
      expect(() => {
        getEnvironmentConfig("test");
      }).toThrow("Unknown environment: test");
    });

    it("should return correct RDS instance classes", () => {
      expect(getEnvironmentConfig("dev").rdsInstanceClass).toBe("db.t3.micro");
      expect(getEnvironmentConfig("staging").rdsInstanceClass).toBe("db.t3.small");
      expect(getEnvironmentConfig("prod").rdsInstanceClass).toBe("db.m5.large");
    });

    it("should return correct API Gateway rate limits", () => {
      expect(getEnvironmentConfig("dev").apiGatewayRateLimit).toBe(100);
      expect(getEnvironmentConfig("staging").apiGatewayRateLimit).toBe(500);
      expect(getEnvironmentConfig("prod").apiGatewayRateLimit).toBe(2000);
    });

    it("should return correct DynamoDB capacities", () => {
      const devConfig = getEnvironmentConfig("dev");
      expect(devConfig.dynamoReadCapacity).toBe(5);
      expect(devConfig.dynamoWriteCapacity).toBe(5);

      const prodConfig = getEnvironmentConfig("prod");
      expect(prodConfig.dynamoReadCapacity).toBe(50);
      expect(prodConfig.dynamoWriteCapacity).toBe(50);
    });

    it("should return correct S3 retention days", () => {
      expect(getEnvironmentConfig("dev").s3RetentionDays).toBe(7);
      expect(getEnvironmentConfig("staging").s3RetentionDays).toBe(30);
      expect(getEnvironmentConfig("prod").s3RetentionDays).toBe(90);
    });

    it("should return correct CloudWatch thresholds", () => {
      expect(getEnvironmentConfig("dev").cloudWatchThreshold).toBe(80);
      expect(getEnvironmentConfig("staging").cloudWatchThreshold).toBe(70);
      expect(getEnvironmentConfig("prod").cloudWatchThreshold).toBe(60);
    });

    it("should return correct KMS key aliases", () => {
      expect(getEnvironmentConfig("dev").kmsKeyAlias).toBe("alias/dev-key");
      expect(getEnvironmentConfig("staging").kmsKeyAlias).toBe("alias/staging-key");
      expect(getEnvironmentConfig("prod").kmsKeyAlias).toBe("alias/prod-key");
    });
  });

  describe("getResourceTags function", () => {
    it("should return tags for dev environment", () => {
      const tags = getResourceTags("dev");
      expect(tags).toBeDefined();
      expect(tags.Environment).toBe("dev");
      expect(tags.ManagedBy).toBe("Pulumi");
      expect(tags.CostCenter).toBe("Engineering");
    });

    it("should return tags for staging environment", () => {
      const tags = getResourceTags("staging");
      expect(tags).toBeDefined();
      expect(tags.Environment).toBe("staging");
      expect(tags.ManagedBy).toBe("Pulumi");
      expect(tags.CostCenter).toBe("Engineering");
    });

    it("should return tags for prod environment", () => {
      const tags = getResourceTags("prod");
      expect(tags).toBeDefined();
      expect(tags.Environment).toBe("prod");
      expect(tags.ManagedBy).toBe("Pulumi");
      expect(tags.CostCenter).toBe("Engineering");
    });

    it("should include all standard tag keys", () => {
      const tags = getResourceTags("dev");
      expect(tags).toHaveProperty("Environment");
      expect(tags).toHaveProperty("ManagedBy");
      expect(tags).toHaveProperty("CostCenter");
    });

    it("should have consistent ManagedBy tag", () => {
      expect(getResourceTags("dev").ManagedBy).toBe("Pulumi");
      expect(getResourceTags("staging").ManagedBy).toBe("Pulumi");
      expect(getResourceTags("prod").ManagedBy).toBe("Pulumi");
    });

    it("should have consistent CostCenter tag", () => {
      expect(getResourceTags("dev").CostCenter).toBe("Engineering");
      expect(getResourceTags("staging").CostCenter).toBe("Engineering");
      expect(getResourceTags("prod").CostCenter).toBe("Engineering");
    });

    it("should return object with exactly three properties", () => {
      const tags = getResourceTags("dev");
      expect(Object.keys(tags).length).toBe(3);
    });

    it("should only have string values", () => {
      const tags = getResourceTags("dev");
      Object.values(tags).forEach(value => {
        expect(typeof value).toBe("string");
      });
    });
  });

  describe("generateConfigComparison function", () => {
    it("should generate a comparison report", () => {
      const comparison = generateConfigComparison();
      expect(comparison).toBeDefined();
      expect(comparison.dev).toBeDefined();
      expect(comparison.staging).toBeDefined();
      expect(comparison.prod).toBeDefined();
      expect(comparison.differences).toBeDefined();
      expect(Array.isArray(comparison.differences)).toBe(true);
    });

    it("should include all environment configurations", () => {
      const comparison = generateConfigComparison();
      expect(comparison.dev).toEqual(environmentConfigs.dev);
      expect(comparison.staging).toEqual(environmentConfigs.staging);
      expect(comparison.prod).toEqual(environmentConfigs.prod);
    });

    it("should have differences array with multiple items", () => {
      const comparison = generateConfigComparison();
      expect(comparison.differences.length).toBeGreaterThan(0);
    });

    it("should include VPC CIDR comparison", () => {
      const comparison = generateConfigComparison();
      const vpcDiff = comparison.differences.find(d => d.includes("VPC CIDR"));
      expect(vpcDiff).toBeDefined();
      expect(vpcDiff).toContain("10.0.0.0/16");
      expect(vpcDiff).toContain("10.1.0.0/16");
      expect(vpcDiff).toContain("10.2.0.0/16");
    });

    it("should include RDS instance comparison", () => {
      const comparison = generateConfigComparison();
      const rdsDiff = comparison.differences.find(d => d.includes("RDS Instance"));
      expect(rdsDiff).toBeDefined();
      expect(rdsDiff).toContain("db.t3.micro");
      expect(rdsDiff).toContain("db.t3.small");
      expect(rdsDiff).toContain("db.m5.large");
    });

    it("should include API rate limit comparison", () => {
      const comparison = generateConfigComparison();
      const apiDiff = comparison.differences.find(d => d.includes("API Rate Limit"));
      expect(apiDiff).toBeDefined();
      expect(apiDiff).toContain("100");
      expect(apiDiff).toContain("500");
      expect(apiDiff).toContain("2000");
    });

    it("should include DynamoDB capacity comparisons", () => {
      const comparison = generateConfigComparison();
      const readDiff = comparison.differences.find(d => d.includes("DynamoDB Read Capacity"));
      const writeDiff = comparison.differences.find(d => d.includes("DynamoDB Write Capacity"));
      expect(readDiff).toBeDefined();
      expect(writeDiff).toBeDefined();
    });

    it("should include S3 retention comparison", () => {
      const comparison = generateConfigComparison();
      const s3Diff = comparison.differences.find(d => d.includes("S3 Retention"));
      expect(s3Diff).toBeDefined();
      expect(s3Diff).toContain("7 days");
      expect(s3Diff).toContain("30 days");
      expect(s3Diff).toContain("90 days");
    });

    it("should include CloudWatch threshold comparison", () => {
      const comparison = generateConfigComparison();
      const cwDiff = comparison.differences.find(d => d.includes("CloudWatch Threshold"));
      expect(cwDiff).toBeDefined();
      expect(cwDiff).toContain("80%");
      expect(cwDiff).toContain("70%");
      expect(cwDiff).toContain("60%");
    });

    it("should have exactly 7 differences", () => {
      const comparison = generateConfigComparison();
      expect(comparison.differences.length).toBe(7);
    });

    it("should return same structure on multiple calls", () => {
      const comparison1 = generateConfigComparison();
      const comparison2 = generateConfigComparison();
      expect(comparison1).toEqual(comparison2);
    });

    it("should have all differences as strings", () => {
      const comparison = generateConfigComparison();
      comparison.differences.forEach(diff => {
        expect(typeof diff).toBe("string");
      });
    });
  });

  describe("ConfigComparisonProvider", () => {
    let provider: ConfigComparisonProvider;

    beforeEach(() => {
      provider = new ConfigComparisonProvider();
    });

    it("should create a provider instance", () => {
      expect(provider).toBeDefined();
    });

    it("should implement create method", async () => {
      const result = await provider.create({});
      expect(result).toBeDefined();
      expect(result.id).toBe("config-comparison");
      expect(result.outs).toBeDefined();
      expect(result.outs.report).toBeDefined();
    });

    it("should return comparison report in create", async () => {
      const result = await provider.create({});
      expect(result.outs.report.dev).toBeDefined();
      expect(result.outs.report.staging).toBeDefined();
      expect(result.outs.report.prod).toBeDefined();
      expect(result.outs.report.differences).toBeDefined();
    });

    it("should implement update method", async () => {
      const result = await provider.update("config-comparison", {}, {});
      expect(result).toBeDefined();
      expect(result.outs).toBeDefined();
      expect(result.outs.report).toBeDefined();
    });

    it("should return comparison report in update", async () => {
      const result = await provider.update("config-comparison", {}, {});
      expect(result.outs.report.dev).toBeDefined();
      expect(result.outs.report.staging).toBeDefined();
      expect(result.outs.report.prod).toBeDefined();
      expect(result.outs.report.differences).toBeDefined();
    });

    it("should implement read method", async () => {
      const props = { report: generateConfigComparison() };
      const result = await provider.read("config-comparison", props);
      expect(result).toBeDefined();
      expect(result.id).toBe("config-comparison");
      expect(result.props).toEqual(props);
    });

    it("should implement delete method", async () => {
      // delete should not throw error
      await expect(provider.delete("config-comparison", {})).resolves.toBeUndefined();
    });

    it("should return same report structure in create and update", async () => {
      const createResult = await provider.create({});
      const updateResult = await provider.update("config-comparison", {}, {});

      expect(createResult.outs.report).toEqual(updateResult.outs.report);
    });

    it("should handle create with different inputs", async () => {
      const result1 = await provider.create({ someProp: "value1" });
      const result2 = await provider.create({ someProp: "value2" });

      // Both should return the same report since inputs are ignored
      expect(result1.outs.report).toEqual(result2.outs.report);
    });

    it("should handle update with different old/new values", async () => {
      const result = await provider.update("config-comparison", { old: "val" }, { new: "val" });
      expect(result.outs.report).toBeDefined();
    });

    it("should handle read with different ids", async () => {
      const props = { report: generateConfigComparison() };
      const result = await provider.read("different-id", props);
      expect(result.id).toBe("different-id");
    });
  });
});
