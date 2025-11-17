import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Transit Gateway Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, arn: `arn:aws:ec2:us-east-1:123456789012:transit-gateway/${args.name}` },
      };
    },
    call: () => ({}),
  });

  it("should create Transit Gateway resources", async () => {
    const { createTransitGateway } = require("../lib/transit-gateway");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
    };
    const mockRoles = {} as any;

    const tgw = createTransitGateway(config, mockRoles);

    expect(tgw.tgw).toBeDefined();
    expect(tgw.ramShare).toBeDefined();
    expect(tgw.ramAssociation).toBeDefined();
    expect(tgw.ramPrincipalAssociations).toBeDefined();
  });

  it("should handle single-account mode correctly", async () => {
    const { createTransitGateway } = require("../lib/transit-gateway");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
    };
    const mockRoles = {} as any;

    const tgw = createTransitGateway(config, mockRoles);

    expect(tgw.ramPrincipalAssociations.length).toBe(1);
  });
});
