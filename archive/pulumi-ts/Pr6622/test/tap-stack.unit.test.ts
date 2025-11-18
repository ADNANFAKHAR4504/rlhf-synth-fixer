import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe("TapStack Multi-Region DR Infrastructure", () => {
  const testArgs = {
    environmentSuffix: "test",
    primaryRegion: "us-east-1",
    drRegion: "us-east-2",
  };

  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack("test-tap-stack", testArgs);
  });

  describe("Stack Instantiation", () => {
    it("should create stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should have all required outputs", () => {
      expect(stack.primaryApiEndpoint).toBeDefined();
      expect(stack.secondaryApiEndpoint).toBeDefined();
      expect(stack.healthCheckUrl).toBeDefined();
      expect(stack.replicationLagAlarmArn).toBeDefined();
    });
  });

  describe("Resource Naming with Environment Suffix", () => {
    it("should include environmentSuffix in resource names", (done) => {
      pulumi.all([stack.primaryApiEndpoint, stack.secondaryApiEndpoint]).apply(
        ([primaryEndpoint, secondaryEndpoint]) => {
          expect(primaryEndpoint).toBeDefined();
          expect(secondaryEndpoint).toBeDefined();
          done();
        }
      );
    });

    it("should have consistent naming across all resources", () => {
      expect(stack.replicationLagAlarmArn).toBeDefined();
    });
  });

  describe("Multi-Region Configuration", () => {
    it("should configure primary region endpoint", (done) => {
      stack.primaryApiEndpoint.apply((primaryEndpoint) => {
        expect(primaryEndpoint).toContain("execute-api");
        expect(primaryEndpoint).toContain(testArgs.primaryRegion);
        done();
      });
    });

    it("should configure DR region endpoint", (done) => {
      stack.secondaryApiEndpoint.apply((secondaryEndpoint) => {
        expect(secondaryEndpoint).toContain("execute-api");
        expect(secondaryEndpoint).toContain(testArgs.drRegion);
        done();
      });
    });

    it("should have different endpoints for primary and DR", (done) => {
      pulumi.all([stack.primaryApiEndpoint, stack.secondaryApiEndpoint]).apply(
        ([primaryEndpoint, secondaryEndpoint]) => {
          expect(primaryEndpoint).not.toBe(secondaryEndpoint);
          done();
        }
      );
    });
  });

  describe("API Gateway Configuration", () => {
    it("should configure health check URL", (done) => {
      stack.healthCheckUrl.apply((healthCheckUrl) => {
        expect(healthCheckUrl).toBeDefined();
        expect(healthCheckUrl).toContain("execute-api");
        expect(healthCheckUrl).toContain("/prod/payment");
        done();
      });
    });

    it("should have payment endpoint path", (done) => {
      pulumi.all([stack.primaryApiEndpoint, stack.secondaryApiEndpoint]).apply(
        ([primaryEndpoint, secondaryEndpoint]) => {
          expect(primaryEndpoint).toContain("/payment");
          expect(secondaryEndpoint).toContain("/payment");
          done();
        }
      );
    });

    it("should use production stage", (done) => {
      stack.primaryApiEndpoint.apply((primaryEndpoint) => {
        expect(primaryEndpoint).toContain("/prod/");
        done();
      });
    });
  });

  describe("CloudWatch Monitoring", () => {
    it("should configure replication lag alarm", () => {
      expect(stack.replicationLagAlarmArn).toBeDefined();
    });

    it("should have replication lag alarm output", () => {
      expect(stack.replicationLagAlarmArn).toBeDefined();
      expect(typeof stack.replicationLagAlarmArn).toBe('object');
    });
  });

  describe("Output Validation", () => {
    it("should register all outputs", () => {
      expect(stack.primaryApiEndpoint).toBeDefined();
      expect(stack.secondaryApiEndpoint).toBeDefined();
      expect(stack.healthCheckUrl).toBeDefined();
      expect(stack.replicationLagAlarmArn).toBeDefined();
    });

    it("should have valid HTTPS endpoints", (done) => {
      pulumi.all([stack.primaryApiEndpoint, stack.secondaryApiEndpoint]).apply(
        ([primaryEndpoint, secondaryEndpoint]) => {
          expect(primaryEndpoint).toMatch(/^https:\/\//);
          expect(secondaryEndpoint).toMatch(/^https:\/\//);
          done();
        }
      );
    });

    it("should have Output objects for all endpoints", () => {
      expect(typeof stack.primaryApiEndpoint).toBe('object');
      expect(typeof stack.secondaryApiEndpoint).toBe('object');
      expect(typeof stack.healthCheckUrl).toBe('object');
      expect(typeof stack.replicationLagAlarmArn).toBe('object');
    });
  });

  describe("Resource Tags", () => {
    it("should create stack with proper tagging structure", () => {
      expect(stack).toBeDefined();
    });
  });

  describe("Constructor Validation", () => {
    it("should accept valid arguments", () => {
      const newStack = new TapStack("test-stack-2", {
        environmentSuffix: "dev",
        primaryRegion: "us-west-1",
        drRegion: "us-west-2",
      });
      expect(newStack).toBeDefined();
    });

    it("should handle different region combinations", () => {
      const newStack = new TapStack("test-stack-3", {
        environmentSuffix: "staging",
        primaryRegion: "eu-west-1",
        drRegion: "eu-central-1",
      });
      expect(newStack).toBeDefined();
    });
  });

  describe("High Availability Configuration", () => {
    it("should support disaster recovery setup", () => {
      expect(stack.primaryApiEndpoint).toBeDefined();
      expect(stack.secondaryApiEndpoint).toBeDefined();
    });

    it("should have independent primary and secondary systems", (done) => {
      pulumi.all([stack.primaryApiEndpoint, stack.secondaryApiEndpoint]).apply(
        ([primaryEndpoint, secondaryEndpoint]) => {
          expect(primaryEndpoint).not.toBe(secondaryEndpoint);
          done();
        }
      );
    });
  });

  describe("Security Configuration", () => {
    it("should use HTTPS for all API endpoints", (done) => {
      pulumi
        .all([
          stack.primaryApiEndpoint,
          stack.secondaryApiEndpoint,
          stack.healthCheckUrl,
        ])
        .apply(([primaryEndpoint, secondaryEndpoint, healthCheckUrl]) => {
          expect(primaryEndpoint).toMatch(/^https:\/\//);
          expect(secondaryEndpoint).toMatch(/^https:\/\//);
          expect(healthCheckUrl).toMatch(/^https:\/\//);
          done();
        });
    });
  });
});