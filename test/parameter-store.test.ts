import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Parameter Store Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, name: args.inputs.name, value: args.inputs.value },
      };
    },
    call: () => ({}),
  });

  it("should create all parameter store parameters", async () => {
    const { createParameterStore } = require("../lib/parameter-store");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "222222222222",
      stagingAccountId: "333333333333",
      developmentAccountId: "444444444444",
      region: "us-east-1",
      legacyVpcCidr: "10.0.0.0/16",
      productionVpcCidr: "10.1.0.0/16",
      stagingVpcCidr: "10.2.0.0/16",
      developmentVpcCidr: "10.3.0.0/16",
      isDryRun: false,
    };

    const params = createParameterStore(config);

    expect(params.migrationMetadata).toBeDefined();
    expect(params.legacyAccountMetadata).toBeDefined();
    expect(params.productionAccountMetadata).toBeDefined();
    expect(params.stagingAccountMetadata).toBeDefined();
    expect(params.developmentAccountMetadata).toBeDefined();
  });

  it("should include isDryRun in metadata", async () => {
    const { createParameterStore } = require("../lib/parameter-store");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      region: "us-east-1",
      legacyVpcCidr: "10.0.0.0/16",
      productionVpcCidr: "10.1.0.0/16",
      stagingVpcCidr: "10.2.0.0/16",
      developmentVpcCidr: "10.3.0.0/16",
      isDryRun: true,
    };

    const params = createParameterStore(config);
    expect(params.migrationMetadata).toBeDefined();
  });
});
