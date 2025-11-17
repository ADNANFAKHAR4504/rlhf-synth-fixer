import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("EventBridge Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, arn: `arn:aws:events:us-east-1:123456789012:event-bus/${args.name}` },
      };
    },
    call: () => ({}),
  });

  it("should create EventBridge resources", async () => {
    const { createEventBridge } = require("../lib/eventbridge");
    const config = {
      environmentSuffix: "test-123",
    };
    const mockRoles = {} as any;

    const eb = createEventBridge(config, mockRoles);

    expect(eb.centralEventBus).toBeDefined();
    expect(eb.migrationEventRule).toBeDefined();
    expect(eb.eventLogGroup).toBeDefined();
    expect(eb.eventTarget).toBeDefined();
  });
});
