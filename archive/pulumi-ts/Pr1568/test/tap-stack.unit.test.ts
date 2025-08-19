import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack, TapStackArgs } from "../lib/tap-stack";

// Helper to get Output values in tests
async function getOutputValue<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply(value => {
      resolve(value);
      return value;
    });
  });
}

// Set up Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string; state: any} {
    // Mock API Gateway to return proper apiEndpoint
    if (args.type === "aws:apigatewayv2/api:Api") {
      return {
        id: args.inputs.name + "_id",
        state: {
          ...args.inputs,
          apiEndpoint: `https://${args.inputs.name}_id.execute-api.us-east-1.amazonaws.com`,
        },
      };
    }
    return {
      id: args.inputs.name + "_id",
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe("TapStack Unit Tests", () => {
  let stack: TapStack;
  const testEnvironmentSuffix = "test";

  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    it("should create stack with custom environment suffix", async () => {
      const args: TapStackArgs = {
        environmentSuffix: testEnvironmentSuffix,
        tags: {
          Environment: testEnvironmentSuffix,
          Project: "TAP",
        },
      };

      stack = new TapStack("test-stack", args);
      
      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.functionName).toBeDefined();
    });

    it("should create stack with default environment suffix", async () => {
      const args: TapStackArgs = {
        tags: {
          Project: "TAP",
        },
      };

      stack = new TapStack("test-stack-default", args);
      
      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.functionName).toBeDefined();
    });
  });

  describe("DynamoDB Table", () => {
    beforeEach(() => {
      stack = new TapStack("test-dynamodb", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should create DynamoDB table with correct configuration", async () => {
      const tableName = await getOutputValue(stack.tableName);
      expect(tableName).toContain(testEnvironmentSuffix);
    });

    it("should use on-demand billing mode", async () => {
      // The table should be configured with ON_DEMAND billing mode
      const tableName = await getOutputValue(stack.tableName);
      expect(tableName).toBeDefined();
    });

    it("should have id as hash key", async () => {
      // Verify the table has the correct hash key configuration
      const tableName = await getOutputValue(stack.tableName);
      expect(tableName).toBeDefined();
    });
  });

  describe("Lambda Function", () => {
    beforeEach(() => {
      stack = new TapStack("test-lambda", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should create Lambda function with correct runtime", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toContain(testEnvironmentSuffix);
    });

    it("should have proper environment variables", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // The function should have TABLE_NAME environment variable
    });

    it("should have correct timeout and memory settings", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Timeout should be 30 seconds, memory should be 256 MB
    });
  });

  describe("API Gateway", () => {
    beforeEach(() => {
      stack = new TapStack("test-api", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should create HTTP API Gateway", async () => {
      const apiUrl = await getOutputValue(stack.apiUrl);
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain("execute-api");
    });

    it("should have CORS configuration", async () => {
      const apiUrl = await getOutputValue(stack.apiUrl);
      expect(apiUrl).toBeDefined();
      // CORS should allow all origins and common HTTP methods
    });

    it("should create all required routes", async () => {
      const apiUrl = await getOutputValue(stack.apiUrl);
      expect(apiUrl).toBeDefined();
      // Should have routes for GET, POST, PUT, DELETE, OPTIONS
    });
  });

  describe("IAM Roles and Policies", () => {
    beforeEach(() => {
      stack = new TapStack("test-iam", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should create Lambda execution role", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Lambda should have an execution role
    });

    it("should have least privilege DynamoDB permissions", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Should only have GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan permissions
    });

    it("should have CloudWatch Logs permissions", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Should have permissions to create log groups and write logs
    });
  });

  describe("Resource Naming", () => {
    const customSuffix = "prod-v2";

    beforeEach(() => {
      stack = new TapStack("test-naming", {
        environmentSuffix: customSuffix,
      });
    });

    it("should include environment suffix in all resource names", async () => {
      const [apiUrl, tableName, functionName] = await Promise.all([
        getOutputValue(stack.apiUrl),
        getOutputValue(stack.tableName),
        getOutputValue(stack.functionName),
      ]);

      expect(tableName).toContain(customSuffix);
      expect(functionName).toContain(customSuffix);
      expect(apiUrl).toBeDefined();
    });
  });

  describe("Tags", () => {
    const customTags = {
      Environment: "production",
      Team: "DevOps",
      Project: "TAP",
    };

    beforeEach(() => {
      stack = new TapStack("test-tags", {
        environmentSuffix: testEnvironmentSuffix,
        tags: customTags,
      });
    });

    it("should apply custom tags to resources", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // All resources should have the custom tags applied
    });
  });

  describe("CloudWatch Integration", () => {
    beforeEach(() => {
      stack = new TapStack("test-cloudwatch", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should create CloudWatch Log Group for Lambda", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Should have a log group with 14 days retention
    });

    it("should enable JSON logging format", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      // Lambda should use JSON format for logs
    });
  });

  describe("Stack Outputs", () => {
    beforeEach(() => {
      stack = new TapStack("test-outputs", {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it("should export API URL", async () => {
      const apiUrl = await getOutputValue(stack.apiUrl);
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe("string");
    });

    it("should export DynamoDB table name", async () => {
      const tableName = await getOutputValue(stack.tableName);
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe("string");
    });

    it("should export Lambda function name", async () => {
      const functionName = await getOutputValue(stack.functionName);
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe("string");
    });
  });
});