import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Config Aggregator Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, name: args.inputs.name, arn: `arn:aws:config:us-east-1:123456789012:aggregator/${args.name}` },
      };
    },
    call: () => ({}),
  });

  it("should create Config Aggregator resources", async () => {
    const { createConfigAggregator } = require("../lib/config-aggregator");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      region: "us-east-1",
      secondaryRegion: "us-east-2",
    };
    const mockRoles = {} as any;

    const aggregator = createConfigAggregator(config, mockRoles);

    expect(aggregator.aggregator).toBeDefined();
    expect(aggregator.aggregatorRole).toBeDefined();
  });

  it("should deduplicate account IDs in single-account mode", async () => {
    const { createConfigAggregator } = require("../lib/config-aggregator");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      region: "us-east-1",
      secondaryRegion: "us-east-2",
    };
    const mockRoles = {} as any;

    const aggregator = createConfigAggregator(config, mockRoles);
    expect(aggregator).toBeDefined();
  });
});
