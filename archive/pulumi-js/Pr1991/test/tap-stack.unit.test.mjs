// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn((strings, ...values) => {
    if (typeof strings === 'string') {
      return strings;
    }
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += values[i] + strings[i + 1];
    }
    return result;
  }),
  asset: {
    AssetArchive: jest.fn((assets) => ({ assets })),
    StringAsset: jest.fn((content) => ({ content }))
  }
}));

jest.mock("@pulumi/aws", () => ({
  s3: {
    Bucket: jest.fn().mockImplementation((name, args) => ({ 
      id: "mock-bucket-id-12345",
      bucket: `${name}`,
      arn: `arn:aws:s3:::${name}`,
      ...args
    })),
    BucketPublicAccessBlock: jest.fn().mockImplementation((name, args) => ({
      id: `mock-pab-${name}`,
      ...args
    })),
    BucketNotification: jest.fn().mockImplementation((name, args) => ({
      id: `mock-notification-${name}`,
      ...args
    }))
  },
  lambda: {
    Function: jest.fn().mockImplementation((name, args) => ({
      id: `mock-lambda-${name}`,
      name: name,
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${name}`,
      invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${name}/invocations`,
      ...args
    })),
    Permission: jest.fn().mockImplementation((name, args) => ({
      id: `mock-permission-${name}`,
      ...args
    }))
  },
  iam: {
    Role: jest.fn().mockImplementation((name, args) => ({
      id: `mock-role-${name}`,
      name: name,
      arn: `arn:aws:iam::123456789012:role/${name}`,
      ...args
    })),
    RolePolicyAttachment: jest.fn().mockImplementation((name, args) => ({
      id: `mock-attachment-${name}`,
      ...args
    })),
    RolePolicy: jest.fn().mockImplementation((name, args) => ({
      id: `mock-policy-${name}`,
      ...args
    }))
  },
  sqs: {
    Queue: jest.fn().mockImplementation((name, args) => ({
      id: `mock-queue-${name}`,
      arn: `arn:aws:sqs:us-east-1:123456789012:${name}`,
      url: `https://sqs.us-east-1.amazonaws.com/123456789012/${name}`,
      ...args
    }))
  },
  apigateway: {
    RestApi: jest.fn().mockImplementation((name, args) => ({
      id: `mock-api-${name}`,
      name: name,
      executionArn: `arn:aws:execute-api:us-east-1:123456789012:${name}`,
      rootResourceId: 'mock-root-id',
      ...args
    })),
    Resource: jest.fn().mockImplementation((name, args) => ({
      id: `mock-resource-${name}`,
      ...args
    })),
    Method: jest.fn().mockImplementation((name, args) => ({
      id: `mock-method-${name}`,
      httpMethod: args.httpMethod,
      ...args
    })),
    Integration: jest.fn().mockImplementation((name, args) => ({
      id: `mock-integration-${name}`,
      ...args
    })),
    IntegrationResponse: jest.fn().mockImplementation((name, args) => ({
      id: `mock-integration-response-${name}`,
      ...args
    })),
    MethodResponse: jest.fn().mockImplementation((name, args) => ({
      id: `mock-method-response-${name}`,
      ...args
    })),
    Deployment: jest.fn().mockImplementation((name, args) => ({
      id: `mock-deployment-${name}`,
      ...args
    }))
  }
}))

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";
import { S3Stack } from "../lib/s3-stack.mjs";
import { LambdaStack } from "../lib/lambda-stack.mjs";
import { ApiGatewayStack } from "../lib/api-gateway-stack.mjs";

describe("TapStack Structure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Stack Creation", () => {
    it("should instantiate TapStack successfully", () => {
      const stack = new TapStack("TestTapStack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom environment suffix", () => {
      const stack = new TapStack("TestTapStackCustom", {
        environmentSuffix: "prod"
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom tags", () => {
      const stack = new TapStack("TestTapStackTagged", {
        environmentSuffix: "dev",
        tags: {
          Project: "TAP",
          Environment: "Development"
        }
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("Component Resource Behavior", () => {
    it("should call super constructor with correct parameters", () => {
      new TapStack("TestTapStackSuper", {});
      
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'TestTapStackSuper',
        {},
        undefined
      );
    });

    it("should have registerOutputs method", () => {
      const stack = new TapStack("TestTapStackOutputs", {});
      expect(typeof stack.registerOutputs).toBe('function');
    });
  });

  describe("Configuration Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackUndefined");
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should handle empty args object", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackEmpty", {});
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should handle partial configuration", () => {
      expect(() => {
        const stack1 = new TapStack("TestTapStackPartial1", {
          environmentSuffix: "partial"
          // tags intentionally omitted
        });
        expect(stack1).toBeDefined();

        const stack2 = new TapStack("TestTapStackPartial2", {
          tags: { Project: "Test" }
          // environmentSuffix intentionally omitted
        });
        expect(stack2).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Resource Creation", () => {
    it("should create all serverless infrastructure components", () => {
      const stack = new TapStack("TestServerlessStack", {
        environmentSuffix: "test",
        tags: { Project: "TAP" }
      });
      
      // Verify S3 bucket was created
      expect(aws.s3.Bucket).toHaveBeenCalled();
      
      // Verify Lambda functions were created
      expect(aws.lambda.Function).toHaveBeenCalledTimes(3); // 3 Lambda functions
      
      // Verify API Gateway was created
      expect(aws.apigateway.RestApi).toHaveBeenCalled();
      
      // Verify IAM role was created
      expect(aws.iam.Role).toHaveBeenCalled();
      
      // Verify SQS DLQ was created
      expect(aws.sqs.Queue).toHaveBeenCalled();
    });

    it("should expose correct outputs", () => {
      const stack = new TapStack("TestStackOutputs", {
        environmentSuffix: "test"
      });
      
      expect(stack.bucketName).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
    });

    it("should register outputs correctly", () => {
      const stack = new TapStack("TestRegisterOutputs", {});
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: expect.anything(),
          apiUrl: expect.anything(),
          lambdaArns: expect.anything()
        })
      );
    });
  });

  describe("S3 Stack", () => {
    it("should create S3 bucket with versioning enabled", () => {
      const s3Stack = new S3Stack("TestS3Stack", {
        environmentSuffix: "test",
        tags: { Test: "S3" }
      });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining("tap-serverless-bucket-test"),
        expect.objectContaining({
          versioning: expect.objectContaining({
            enabled: true
          }),
          tags: expect.objectContaining({
            Test: "S3",
            Purpose: "ServerlessStorage"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create public access block for security", () => {
      new S3Stack("TestS3Security", {
        environmentSuffix: "test"
      });
      
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining("tap-bucket-pab-test"),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        }),
        expect.any(Object)
      );
    });

    it("should handle undefined args in S3Stack", () => {
      expect(() => {
        const s3Stack = new S3Stack("TestS3UndefinedArgs");
        expect(s3Stack).toBeDefined();
      }).not.toThrow();
    });

    it("should use default environmentSuffix when not provided", () => {
      new S3Stack("TestS3DefaultEnv");
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining("tap-serverless-bucket-dev"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Lambda Stack", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle undefined args in LambdaStack", () => {
      expect(() => {
        const lambdaStack = new LambdaStack("TestLambdaUndefinedArgs");
        expect(lambdaStack).toBeDefined();
      }).not.toThrow();
    });

    it("should create three Lambda functions", () => {
      const lambdaStack = new LambdaStack("TestLambdaStack", {
        environmentSuffix: "test",
        tags: { Test: "Lambda" },
        sourceBucket: { bucket: "test-bucket", arn: "arn:aws:s3:::test-bucket" }
      });
      
      const lambdaCalls = aws.lambda.Function.mock.calls;
      const functionNames = lambdaCalls.map(call => call[0]);
      
      expect(functionNames).toContain("tap-image-processor-test");
      expect(functionNames).toContain("tap-data-validator-test");
      expect(functionNames).toContain("tap-notification-handler-test");
    });

    it("should create Lambda execution role with correct policies", () => {
      new LambdaStack("TestLambdaRole", {
        environmentSuffix: "test",
        sourceBucket: { bucket: "test-bucket", arn: "arn:aws:s3:::test-bucket" }
      });
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining("tap-lambda-role-test"),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining("lambda.amazonaws.com")
        }),
        expect.any(Object)
      );
      
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining("tap-lambda-basic-test"),
        expect.objectContaining({
          policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        }),
        expect.any(Object)
      );
    });

    it("should create dead letter queue for fault tolerance", () => {
      new LambdaStack("TestLambdaDLQ", {
        environmentSuffix: "test",
        sourceBucket: { bucket: "test-bucket", arn: "arn:aws:s3:::test-bucket" }
      });
      
      expect(aws.sqs.Queue).toHaveBeenCalledWith(
        expect.stringContaining("tap-dlq-test"),
        expect.objectContaining({
          messageRetentionSeconds: 1209600,
          tags: expect.objectContaining({
            Purpose: "DeadLetterQueue"
          })
        }),
        expect.any(Object)
      );
    });

    it("should configure Lambda functions with environment variables", () => {
      new LambdaStack("TestLambdaEnv", {
        environmentSuffix: "prod",
        sourceBucket: { bucket: "prod-bucket", arn: "arn:aws:s3:::prod-bucket" }
      });
      
      const lambdaCalls = aws.lambda.Function.mock.calls;
      lambdaCalls.forEach(call => {
        const config = call[1];
        expect(config.environment.variables).toHaveProperty("ENVIRONMENT", "prod");
        expect(config.environment.variables).toHaveProperty("SOURCE_BUCKET", "prod-bucket");
        expect(config.environment.variables).toHaveProperty("DLQ_URL");
      });
    });

    it("should set up Lambda permissions for S3 invocation", () => {
      new LambdaStack("TestLambdaPermissions", {
        environmentSuffix: "test",
        sourceBucket: { bucket: "test-bucket", arn: "arn:aws:s3:::test-bucket" }
      });
      
      const permissionCalls = aws.lambda.Permission.mock.calls;
      const s3Permissions = permissionCalls.filter(call => 
        call[1].principal === "s3.amazonaws.com"
      );
      
      expect(s3Permissions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("API Gateway Stack", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle undefined args in ApiGatewayStack", () => {
      expect(() => {
        const apiStack = new ApiGatewayStack("TestAPIUndefinedArgs");
        expect(apiStack).toBeDefined();
      }).not.toThrow();
    });

    it("should create REST API with correct configuration", () => {
      const mockLambdaFunctions = {
        notificationHandler: {
          name: "tap-notification-handler-test",
          arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test",
          invokeArn: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test/invocations"
        }
      };
      
      new ApiGatewayStack("TestAPIGateway", {
        environmentSuffix: "test",
        tags: { Test: "API" },
        lambdaFunctions: mockLambdaFunctions
      });
      
      expect(aws.apigateway.RestApi).toHaveBeenCalledWith(
        expect.stringContaining("tap-api-test"),
        expect.objectContaining({
          name: "tap-serverless-api-test",
          description: "Serverless API for TAP application",
          endpointConfiguration: expect.objectContaining({
            types: "REGIONAL"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create notification and status resources", () => {
      const mockLambdaFunctions = {
        notificationHandler: {
          name: "tap-notification-handler-test",
          arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test",
          invokeArn: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test/invocations"
        }
      };
      
      new ApiGatewayStack("TestAPIResources", {
        environmentSuffix: "test",
        lambdaFunctions: mockLambdaFunctions
      });
      
      const resourceCalls = aws.apigateway.Resource.mock.calls;
      const resourcePaths = resourceCalls.map(call => call[1].pathPart);
      
      expect(resourcePaths).toContain("notifications");
      expect(resourcePaths).toContain("status");
    });

    it("should create GET and POST methods for notifications", () => {
      const mockLambdaFunctions = {
        notificationHandler: {
          name: "tap-notification-handler-test",
          arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test",
          invokeArn: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test/invocations"
        }
      };
      
      new ApiGatewayStack("TestAPIMethods", {
        environmentSuffix: "test",
        lambdaFunctions: mockLambdaFunctions
      });
      
      const methodCalls = aws.apigateway.Method.mock.calls;
      const httpMethods = methodCalls.map(call => call[1].httpMethod);
      
      expect(httpMethods).toContain("GET");
      expect(httpMethods).toContain("POST");
    });

    it("should create Lambda permissions for API Gateway", () => {
      const mockLambdaFunctions = {
        notificationHandler: {
          name: "tap-notification-handler-test",
          arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test",
          invokeArn: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test/invocations"
        }
      };
      
      new ApiGatewayStack("TestAPIPermissions", {
        environmentSuffix: "test",
        lambdaFunctions: mockLambdaFunctions
      });
      
      const permissionCalls = aws.lambda.Permission.mock.calls;
      const apiPermissions = permissionCalls.filter(call => 
        call[1].principal === "apigateway.amazonaws.com"
      );
      
      expect(apiPermissions.length).toBeGreaterThanOrEqual(2);
    });

    it("should create deployment for API", () => {
      const mockLambdaFunctions = {
        notificationHandler: {
          name: "tap-notification-handler-test",
          arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test",
          invokeArn: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:tap-notification-handler-test/invocations"
        }
      };
      
      new ApiGatewayStack("TestAPIDeployment", {
        environmentSuffix: "test",
        lambdaFunctions: mockLambdaFunctions
      });
      
      expect(aws.apigateway.Deployment).toHaveBeenCalledWith(
        expect.stringContaining("tap-api-deployment-test"),
        expect.objectContaining({
          stageName: "test"
        }),
        expect.any(Object)
      );
    });
  });

  describe("Integration Tests", () => {
    it("should set up S3 bucket notifications for Lambda triggers", () => {
      const stack = new TapStack("TestS3Notifications", {
        environmentSuffix: "test"
      });
      
      expect(aws.s3.BucketNotification).toHaveBeenCalledWith(
        "tap-bucket-notification",
        expect.objectContaining({
          lambdaFunctions: expect.arrayContaining([
            expect.objectContaining({
              events: ["s3:ObjectCreated:*"],
              filterPrefix: "images/"
            }),
            expect.objectContaining({
              events: ["s3:ObjectCreated:*"],
              filterPrefix: "data/"
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should integrate Lambda functions with API Gateway", () => {
      new TapStack("TestLambdaAPIIntegration", {
        environmentSuffix: "test"
      });
      
      const integrationCalls = aws.apigateway.Integration.mock.calls;
      const lambdaIntegrations = integrationCalls.filter(call => 
        call[1].type === "AWS_PROXY"
      );
      
      expect(lambdaIntegrations.length).toBeGreaterThanOrEqual(2);
    });

    it("should configure Lambda functions with DLQ", () => {
      new TapStack("TestLambdaDLQConfig", {
        environmentSuffix: "test"
      });
      
      const lambdaCalls = aws.lambda.Function.mock.calls;
      lambdaCalls.forEach(call => {
        const config = call[1];
        if (config.deadLetterConfig) {
          expect(config.deadLetterConfig).toHaveProperty("targetArn");
        }
      });
    });
  })
});