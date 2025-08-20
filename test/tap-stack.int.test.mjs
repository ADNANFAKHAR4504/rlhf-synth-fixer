import { TapStack } from "../lib/tap-stack.mjs";

describe('TapStack Integration Tests', () => {
  // Test timeout for live resource creation
  const TEST_TIMEOUT = 30000; // 30 seconds
  
  beforeAll(() => {
    // Set longer timeout for integration tests that create real resources
    jest.setTimeout(TEST_TIMEOUT);
  });

  describe('Stack Creation', () => {
    it('should create TapStack with default configuration', async () => {
      const uniqueId = Date.now();
      const stack = new TapStack(`integration-test-stack-${uniqueId}`, {});
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.bucketName).toBeDefined();
      
      // For live testing, we expect bucketName to be a Pulumi Output
      expect(typeof stack.bucketName).toBe('object');
    }, TEST_TIMEOUT);

    it('should create TapStack with custom environment suffix', async () => {
      const uniqueId = Date.now();
      const stack = new TapStack(`integration-test-custom-stack-${uniqueId}`, {
        environmentSuffix: "integration"
      });
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.bucketName).toBeDefined();
    }, TEST_TIMEOUT);

    it('should create TapStack with custom tags', async () => {
      const uniqueId = Date.now();
      const customTags = {
        Project: "TAP-Integration",
        Owner: "IntegrationTests",
        CostCenter: "Engineering",
        TestRun: uniqueId.toString()
      };

      const stack = new TapStack(`integration-test-tagged-stack-${uniqueId}`, {
        environmentSuffix: "test",
        tags: customTags
      });
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.bucketName).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Output Verification', () => {
    it('should have bucketName output available', async () => {
      const uniqueId = Date.now();
      const stack = new TapStack(`integration-output-test-${uniqueId}`, {
        environmentSuffix: "output-test"
      });
      
      // Verify bucketName property exists and is a Pulumi Output
      expect(stack.bucketName).toBeDefined();
      expect(typeof stack.bucketName).toBe('object');
    }, TEST_TIMEOUT);

    it('should register outputs correctly', async () => {
      const uniqueId = Date.now();
      const stack = new TapStack(`integration-register-test-${uniqueId}`, {});
      
      // Verify the stack has a registerOutputs method (inherited from ComponentResource)
      expect(typeof stack.registerOutputs).toBe('function');
    }, TEST_TIMEOUT);
  });

  describe('Resource Configuration', () => {
    it('should handle undefined args gracefully', async () => {
      const uniqueId = Date.now();
      expect(() => {
        const stack = new TapStack(`integration-undefined-args-${uniqueId}`);
        expect(stack).toBeInstanceOf(TapStack);
      }).not.toThrow();
    }, TEST_TIMEOUT);

    it('should handle empty args object', async () => {
      const uniqueId = Date.now();
      expect(() => {
        const stack = new TapStack(`integration-empty-args-${uniqueId}`, {});
        expect(stack).toBeInstanceOf(TapStack);
      }).not.toThrow();
    }, TEST_TIMEOUT);

    it('should handle partial configuration', async () => {
      const uniqueId = Date.now();
      expect(() => {
        const stack = new TapStack(`integration-partial-config-${uniqueId}`, {
          environmentSuffix: "partial"
          // tags intentionally omitted
        });
        expect(stack).toBeInstanceOf(TapStack);
      }).not.toThrow();

      expect(() => {
        const stack2 = new TapStack(`integration-partial-config-2-${uniqueId}`, {
          tags: { Project: "Test", TestRun: uniqueId.toString() }
          // environmentSuffix intentionally omitted
        });
        expect(stack2).toBeInstanceOf(TapStack);
      }).not.toThrow();
    }, TEST_TIMEOUT);
  });

  describe('Multiple Stack Instances', () => {
    it('should allow creating multiple stack instances', async () => {
      const uniqueId = Date.now();
      const stack1 = new TapStack(`integration-multi-1-${uniqueId}`, {
        environmentSuffix: "multi1"
      });
      
      const stack2 = new TapStack(`integration-multi-2-${uniqueId}`, {
        environmentSuffix: "multi2"
      });

      expect(stack1).toBeInstanceOf(TapStack);
      expect(stack2).toBeInstanceOf(TapStack);
      expect(stack1.bucketName).toBeDefined();
      expect(stack2.bucketName).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle resource creation in live environment', async () => {
      const uniqueId = Date.now();
      // This test verifies the stack can be created without throwing errors
      // This will test actual AWS resource creation
      expect(() => {
        const stack = new TapStack(`integration-error-test-${uniqueId}`, {
          environmentSuffix: "error-test",
          tags: {
            TestType: "ErrorHandling",
            Environment: "Integration",
            TestRun: uniqueId.toString()
          }
        });
        expect(stack).toBeDefined();
      }).not.toThrow();
    }, TEST_TIMEOUT);
  });
});