import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Route53 Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs },
      };
    },
    call: () => ({}),
  });

  it("should create Route53 health check", async () => {
    const { createRoute53 } = require("../lib/route53");
    const config = {
      environmentSuffix: "test-123",
    };

    const r53 = createRoute53(config);

    expect(r53.healthCheck).toBeDefined();
  });
});
