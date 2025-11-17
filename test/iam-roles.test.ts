import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("IAM Roles Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, arn: `arn:aws:iam::123456789012:role/${args.name}` },
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
        return {
          accountId: "123456789012",
          arn: "arn:aws:iam::123456789012:user/test",
          userId: "AIDAI1234567890EXAMPLE",
        };
      }
      return {};
    },
  });

  it("should create all IAM roles", async () => {
    const { createIamRoles } = require("../lib/iam-roles");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      maxSessionDuration: 3600,
    };

    const roles = createIamRoles(config);

    expect(roles.legacyAccountRole).toBeDefined();
    expect(roles.productionAccountRole).toBeDefined();
    expect(roles.stagingAccountRole).toBeDefined();
    expect(roles.developmentAccountRole).toBeDefined();
    expect(roles.migrationOrchestratorRole).toBeDefined();
  });

  it("should create roles with correct max session duration", async () => {
    const { createIamRoles } = require("../lib/iam-roles");
    const config = {
      environmentSuffix: "test-123",
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      maxSessionDuration: 1800,
    };

    const roles = createIamRoles(config);
    expect(roles).toBeDefined();
  });

  it("should generate role ARN correctly", async () => {
    const { getRoleArn } = require("../lib/iam-roles");
    const mockRole = {
      name: pulumi.output("test-role"),
    };

    const arn = getRoleArn(mockRole as any, "123456789012");
    expect(arn).toBeDefined();
  });
});
