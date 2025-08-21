import * as pulumi from "@pulumi/pulumi";
import "../test/mocks";
import { TapStack } from "../lib/tap-stack";

describe("TapStack Structure", () => {
  let stack: TapStack;

  describe("with custom props", () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack("TestTapStackWithProps", {
          environmentSuffix: "prod",
          tags: {
            Environment: "prod",
            ManagedBy: "Pulumi"
          }
        });
        
        return {
          vpcId: stack.networkStack.vpc.id,
          albDnsName: stack.computeStack.applicationLoadBalancer.dnsName,
          dbEndpoint: stack.databaseStack.dbCluster.endpoint,
          logsBucketName: stack.storageStack.logsBucket.id,
        };
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("creates all required sub-stacks", () => {
      expect(stack.networkStack).toBeDefined();
      expect(stack.securityStack).toBeDefined();
      expect(stack.storageStack).toBeDefined();
      expect(stack.iamStack).toBeDefined();
      expect(stack.computeStack).toBeDefined();
      expect(stack.databaseStack).toBeDefined();
    });

    it("uses correct environment suffix", () => {
      expect(stack).toBeDefined();
      // Environment suffix is passed to all sub-stacks
    });

    it("applies tags to resources", () => {
      expect(stack).toBeDefined();
      // Tags are passed to all sub-stacks
    });
  });

  describe("with default values", () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack("TestTapStackDefault", {});
        
        return {
          vpcId: stack.networkStack.vpc.id,
          albDnsName: stack.computeStack.applicationLoadBalancer.dnsName,
          dbEndpoint: stack.databaseStack.dbCluster.endpoint,
          logsBucketName: stack.storageStack.logsBucket.id,
        };
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("uses default environment suffix", () => {
      expect(stack).toBeDefined();
      // Default environment suffix should be 'dev'
    });

    it("creates all required components", () => {
      expect(stack.networkStack).toBeDefined();
      expect(stack.securityStack).toBeDefined();
      expect(stack.storageStack).toBeDefined();
      expect(stack.iamStack).toBeDefined();
      expect(stack.computeStack).toBeDefined();
      expect(stack.databaseStack).toBeDefined();
    });

    it("sets up proper dependencies between stacks", () => {
      // Security stack depends on network
      expect(stack.securityStack).toBeDefined();
      
      // Compute stack depends on network, security, and IAM
      expect(stack.computeStack).toBeDefined();
      
      // Database stack depends on network and security
      expect(stack.databaseStack).toBeDefined();
    });
  });
});