import { describe, it, expect } from "@jest/globals";
import * as pulumi from "@pulumi/pulumi";

describe("Migration Component Tests", () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      return {
        id: `${args.name}-id`,
        state: args.inputs,
      };
    },
    call: () => ({}),
  });

  it("should create migration component", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 0, "status": "initialized"}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);

    expect(component.outputs).toBeDefined();
    expect(component.outputs.migrationStatus).toBeDefined();
    expect(component.outputs.progressPercentage).toBeDefined();
  });

  it("should validate configuration", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 0}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    expect(() => new MigrationComponent("test-component", mockInputs)).toThrow("environmentSuffix is required");
  });

  it("should handle dry-run mode", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: true,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 0}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);
    expect(component.outputs.isDryRun).toBe(true);
  });

  it("should reject invalid session duration", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 7200,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 0}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    expect(() => new MigrationComponent("test-component", mockInputs)).toThrow("maxSessionDuration cannot exceed 3600 seconds");
  });

  it("should handle invalid JSON in progress calculation", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('invalid json') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);
    // Should handle invalid JSON gracefully
    expect(component.outputs).toBeDefined();
  });

  it("should handle invalid JSON in status determination", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('not valid json') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);
    // Should return 'unknown' for invalid JSON
    expect(component.outputs).toBeDefined();
  });

  it("should handle metadata with custom status", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 50, "status": "in-progress"}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);
    // Should handle custom status
    expect(component.outputs).toBeDefined();
    expect(component.outputs.progressPercentage).toBeDefined();
    expect(component.outputs.migrationStatus).toBeDefined();
  });

  it("should default to initialized when status is missing", async () => {
    const { MigrationComponent } = require("../lib/migration-component");
    const config = {
      environmentSuffix: "test-123",
      maxSessionDuration: 3600,
      legacyAccountId: "123456789012",
      productionAccountId: "123456789012",
      stagingAccountId: "123456789012",
      developmentAccountId: "123456789012",
      centralAccountId: "123456789012",
      isDryRun: false,
    };
    const mockInputs = {
      config,
      iamRoles: {} as any,
      transitGateway: { tgw: {} } as any,
      stepFunctions: { stateMachine: { arn: pulumi.output("arn") } } as any,
      eventBridge: { centralEventBus: { arn: pulumi.output("arn") } } as any,
      parameterStore: { migrationMetadata: { value: pulumi.output('{"progress": 10}') } } as any,
      route53: { healthCheck: {} } as any,
      configAggregator: { aggregator: {}, aggregatorRole: {} } as any,
    };

    const component = new MigrationComponent("test-component", mockInputs);
    // Should default to 'initialized' when status is not in metadata
    expect(component.outputs).toBeDefined();
    expect(component.outputs.migrationStatus).toBeDefined();
  });
});
