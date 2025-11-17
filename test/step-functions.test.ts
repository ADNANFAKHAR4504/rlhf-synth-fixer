import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Step Functions Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: { ...args.inputs, arn: `arn:aws:states:us-east-1:123456789012:stateMachine:${args.name}` },
      };
    },
    call: () => ({}),
  });

  it("should create Step Functions resources", async () => {
    const { createStepFunctions } = require("../lib/step-functions");
    const config = {
      environmentSuffix: "test-123",
      isDryRun: false,
    };
    const mockRoles = {
      legacyAccountRole: { arn: pulumi.output("arn:aws:iam::111111111111:role/legacy") },
      productionAccountRole: { arn: pulumi.output("arn:aws:iam::222222222222:role/production") },
      stagingAccountRole: { arn: pulumi.output("arn:aws:iam::333333333333:role/staging") },
      developmentAccountRole: { arn: pulumi.output("arn:aws:iam::444444444444:role/development") },
      migrationOrchestratorRole: { arn: pulumi.output("arn:aws:iam::555555555555:role/orchestrator") },
    } as any;
    const mockParameterStore = {
      migrationMetadata: { name: pulumi.output("/migration-test-123/metadata") },
    } as any;

    const sf = createStepFunctions(config, mockRoles, mockParameterStore);

    expect(sf.stateMachine).toBeDefined();
    expect(sf.logGroup).toBeDefined();
  });

  it("should handle dry-run mode", async () => {
    const { createStepFunctions } = require("../lib/step-functions");
    const config = {
      environmentSuffix: "test-123",
      isDryRun: true,
    };
    const mockRoles = {
      legacyAccountRole: { arn: pulumi.output("arn:aws:iam::111111111111:role/legacy") },
      productionAccountRole: { arn: pulumi.output("arn:aws:iam::222222222222:role/production") },
      stagingAccountRole: { arn: pulumi.output("arn:aws:iam::333333333333:role/staging") },
      developmentAccountRole: { arn: pulumi.output("arn:aws:iam::444444444444:role/development") },
      migrationOrchestratorRole: { arn: pulumi.output("arn:aws:iam::555555555555:role/orchestrator") },
    } as any;
    const mockParameterStore = {
      migrationMetadata: { name: pulumi.output("/migration-test-123/metadata") },
    } as any;

    const sf = createStepFunctions(config, mockRoles, mockParameterStore);
    expect(sf.stateMachine).toBeDefined();
  });

  it("should test getMigrationProgress function", async () => {
    const { getMigrationProgress } = require("../lib/step-functions");

    const stateMachineArn = pulumi.output("arn:aws:states:us-east-1:123456789012:stateMachine:test");
    const parameterName = pulumi.output("/migration/metadata");

    const progress = getMigrationProgress(stateMachineArn, parameterName);

    expect(progress).toBeDefined();
    // The function returns pulumi.output(0) for now
    const progressValue = await progress.promise();
    expect(progressValue).toBe(0);
  });
});
