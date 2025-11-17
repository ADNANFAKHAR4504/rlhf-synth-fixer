import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi Config
class MockConfig {
  private values: Map<string, string>;

  constructor() {
    this.values = new Map();
  }

  require(key: string): string {
    const value = this.values.get(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  getNumber(key: string): number | undefined {
    const value = this.values.get(key);
    return value ? parseInt(value, 10) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.values.get(key);
    return value === "true" ? true : value === "false" ? false : undefined;
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("Configuration Tests", () => {
  let mockConfig: MockConfig;

  beforeEach(() => {
    mockConfig = new MockConfig();
    // Mock Pulumi Config constructor
    jest
      .spyOn(pulumi, "Config")
      .mockImplementation(() => mockConfig as any);
  });

  it("should load required configuration", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig } = require("../lib/config");
    const config = getConfig();

    expect(config.environmentSuffix).toBe("test-123");
    expect(config.legacyAccountId).toBe("123456789012");
  });

  it("should default to single-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig } = require("../lib/config");
    const config = getConfig();

    expect(config.productionAccountId).toBe("123456789012");
    expect(config.stagingAccountId).toBe("123456789012");
    expect(config.developmentAccountId).toBe("123456789012");
    expect(config.centralAccountId).toBe("123456789012");
  });

  it("should support multi-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "111111111111");
    mockConfig.set("productionAccountId", "222222222222");
    mockConfig.set("stagingAccountId", "333333333333");
    mockConfig.set("developmentAccountId", "444444444444");
    mockConfig.set("centralAccountId", "555555555555");

    const { getConfig } = require("../lib/config");
    const config = getConfig();

    expect(config.legacyAccountId).toBe("111111111111");
    expect(config.productionAccountId).toBe("222222222222");
    expect(config.stagingAccountId).toBe("333333333333");
    expect(config.developmentAccountId).toBe("444444444444");
    expect(config.centralAccountId).toBe("555555555555");
  });

  it("should detect single-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig, isSingleAccountMode } = require("../lib/config");
    const config = getConfig();

    expect(isSingleAccountMode(config)).toBe(true);
  });

  it("should detect multi-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "111111111111");
    mockConfig.set("productionAccountId", "222222222222");

    const { getConfig, isSingleAccountMode } = require("../lib/config");
    const config = getConfig();

    expect(isSingleAccountMode(config)).toBe(false);
  });

  it("should validate max session duration", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");
    mockConfig.set("maxSessionDuration", "7200");

    const { getConfig, validateConfig } = require("../lib/config");
    const config = getConfig();

    expect(() => validateConfig(config)).toThrow(
      "maxSessionDuration must not exceed 3600 seconds"
    );
  });

  it("should validate environment suffix requirement", () => {
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig } = require("../lib/config");

    expect(() => getConfig()).toThrow();
  });

  it("should validate empty environment suffix", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig, validateConfig } = require("../lib/config");
    const config = getConfig();
    // Manually set environmentSuffix to empty to test validation
    config.environmentSuffix = "";

    expect(() => validateConfig(config)).toThrow(
      "environmentSuffix is required for resource naming"
    );
  });

  it("should use default values", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");

    const { getConfig } = require("../lib/config");
    const config = getConfig();

    expect(config.region).toBe("us-east-1");
    expect(config.secondaryRegion).toBe("us-east-2");
    expect(config.maxSessionDuration).toBe(3600);
    expect(config.isDryRun).toBe(false);
  });

  it("should support dry-run mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");
    mockConfig.set("isDryRun", "true");

    const { getConfig } = require("../lib/config");
    const config = getConfig();

    expect(config.isDryRun).toBe(true);
  });

  it("should validate CIDR overlap in multi-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "111111111111");
    mockConfig.set("productionAccountId", "222222222222");
    mockConfig.set("legacyVpcCidr", "10.0.0.0/16");
    mockConfig.set("productionVpcCidr", "10.0.0.0/16"); // Duplicate CIDR

    const { getConfig, validateConfig } = require("../lib/config");
    const config = getConfig();

    expect(() => validateConfig(config)).toThrow(
      "VPC CIDR blocks must not overlap in multi-account mode"
    );
  });

  it("should allow CIDR overlap in single-account mode", () => {
    mockConfig.set("environmentSuffix", "test-123");
    mockConfig.set("legacyAccountId", "123456789012");
    mockConfig.set("legacyVpcCidr", "10.0.0.0/16");
    mockConfig.set("productionVpcCidr", "10.0.0.0/16"); // Duplicate CIDR

    const { getConfig, validateConfig } = require("../lib/config");
    const config = getConfig();

    // Should not throw in single-account mode
    expect(() => validateConfig(config)).not.toThrow();
  });
});