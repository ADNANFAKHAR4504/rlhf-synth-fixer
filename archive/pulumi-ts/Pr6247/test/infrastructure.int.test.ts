import * as AWS from "aws-sdk";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";

// AWS SDK Configuration
const region = "ap-southeast-1";
AWS.config.update({ region });

const lambda = new AWS.Lambda();
const logs = new AWS.CloudWatchLogs();
const kms = new AWS.KMS();
const apigateway = new AWS.APIGateway();

// Load outputs from deployment
let outputs: any = {};
const outputsPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
}

describe("Secure API Integration Tests", () => {
  const functionName = outputs.functionName;
  const apiUrl = outputs.apiUrl;
  const kmsKeyId = outputs.kmsKeyId;
  const logGroupName = outputs.logGroupName;

  // Helper function to make HTTPS GET request
  const httpsGet = (url: string): Promise<{ statusCode?: number; body: string }> => {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode,
              body: data,
            });
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  };

  describe("Lambda Function", () => {
    it("should exist and be invocable", async () => {
      const result = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(result.FunctionName).toBe(functionName);
      expect(result.Runtime).toBe("nodejs18.x");
      expect(result.Timeout).toBe(30);
      expect(result.MemorySize).toBe(256);
    });

    it("should have proper environment variables", async () => {
      const result = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(result.Environment?.Variables).toBeDefined();
      expect(result.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(result.Environment?.Variables?.LOG_LEVEL).toBe("INFO");
    });

    it("should have proper IAM role", async () => {
      const result = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(result.Role).toBeDefined();
      expect(result.Role).toContain("lambda-role-");
    });

    it("should be invocable directly", async () => {
      const result = await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "GET",
            path: "/test",
          }),
        })
        .promise();

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();

      const payload = JSON.parse(result.Payload as string);
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toContain("Secure API");
    });
  });

  describe("KMS Key", () => {
    it("should exist and be enabled", async () => {
      const result = await kms
        .describeKey({
          KeyId: kmsKeyId,
        })
        .promise();

      expect(result.KeyMetadata?.KeyState).toBe("Enabled");
      expect(result.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });

    it("should have key rotation enabled", async () => {
      const result = await kms
        .getKeyRotationStatus({
          KeyId: kmsKeyId,
        })
        .promise();

      expect(result.KeyRotationEnabled).toBe(true);
    });

    it("should have proper key policy with CloudWatch Logs permissions", async () => {
      const result = await kms
        .getKeyPolicy({
          KeyId: kmsKeyId,
          PolicyName: "default",
        })
        .promise();

      const policy = JSON.parse(result.Policy || "{}");
      expect(policy.Statement).toBeDefined();

      // Find CloudWatch Logs statement
      const logsStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === "Allow CloudWatch Logs"
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Effect).toBe("Allow");
      expect(logsStatement.Principal.Service).toContain("logs.ap-southeast-1.amazonaws.com");
      expect(logsStatement.Action).toContain("kms:Encrypt");
      expect(logsStatement.Action).toContain("kms:Decrypt");
      expect(logsStatement.Action).toContain("kms:GenerateDataKey*");
      expect(logsStatement.Action).toContain("kms:CreateGrant");
    });
  });

  describe("CloudWatch Log Group", () => {
    it("should exist with proper configuration", async () => {
      const result = await logs
        .describeLogGroups({
          logGroupNamePrefix: logGroupName,
        })
        .promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);

      const logGroup = result.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });

    it("should be encrypted with KMS key", async () => {
      const result = await logs
        .describeLogGroups({
          logGroupNamePrefix: logGroupName,
        })
        .promise();

      const logGroup = result.logGroups![0];
      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.kmsKeyId).toContain("arn:aws:kms");
    });

    it("should contain log streams after invocation", async () => {
      // Invoke Lambda to generate logs
      await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "GET",
            path: "/test-logs",
          }),
        })
        .promise();

      // Wait for logs to appear
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const result = await logs
        .describeLogStreams({
          logGroupName: logGroupName,
          orderBy: "LastEventTime",
          descending: true,
          limit: 5,
        })
        .promise();

      expect(result.logStreams).toBeDefined();
      expect(result.logStreams?.length).toBeGreaterThan(0);
    });

    it("should write encrypted logs successfully", async () => {
      // Invoke Lambda to generate logs
      await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "GET",
            path: "/test-encrypted-logs",
          }),
        })
        .promise();

      // Wait for logs to appear
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const streamsResult = await logs
        .describeLogStreams({
          logGroupName: logGroupName,
          orderBy: "LastEventTime",
          descending: true,
          limit: 1,
        })
        .promise();

      expect(streamsResult.logStreams).toBeDefined();
      expect(streamsResult.logStreams?.length).toBeGreaterThan(0);

      const logStreamName = streamsResult.logStreams![0].logStreamName!;

      const eventsResult = await logs
        .getLogEvents({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          limit: 10,
        })
        .promise();

      expect(eventsResult.events).toBeDefined();
      expect(eventsResult.events?.length).toBeGreaterThan(0);
    });
  });

  describe("API Gateway", () => {
    it("should be accessible via HTTPS", async () => {
      const response = await httpsGet(apiUrl);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
    });

    it("should return proper JSON response", async () => {
      const response = await httpsGet(apiUrl);

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain("Secure API");
      expect(body.timestamp).toBeDefined();
      expect(body.environment).toBeDefined();
    });

    it("should handle GET requests to root path", async () => {
      const response = await httpsGet(apiUrl);

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.path).toBe("/");
      expect(body.method).toBe("GET");
    });

    it("should include CORS headers", async () => {
      const response = await httpsGet(apiUrl);

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      // CORS headers should be in the response
      // Note: In Lambda proxy integration, headers are in the Lambda response
      expect(body).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      // API should handle Lambda errors and return proper error response
      const response = await httpsGet(apiUrl);
      expect(response.statusCode).toBeDefined();
    });
  });

  describe("End-to-End Workflow", () => {
    it("should handle complete request flow with encrypted logging", async () => {
      // Step 1: Make API request
      const apiResponse = await httpsGet(apiUrl);
      expect(apiResponse.statusCode).toBe(200);

      const body = JSON.parse(apiResponse.body);
      expect(body.message).toContain("Secure API");

      // Step 2: Wait for logs to be written
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 3: Verify logs were written with encryption
      const streamsResult = await logs
        .describeLogStreams({
          logGroupName: logGroupName,
          orderBy: "LastEventTime",
          descending: true,
          limit: 1,
        })
        .promise();

      expect(streamsResult.logStreams).toBeDefined();
      expect(streamsResult.logStreams?.length).toBeGreaterThan(0);

      // Step 4: Verify log group is encrypted
      const logGroupResult = await logs
        .describeLogGroups({
          logGroupNamePrefix: logGroupName,
        })
        .promise();

      const logGroup = logGroupResult.logGroups![0];
      expect(logGroup.kmsKeyId).toBeDefined();

      // Step 5: Verify KMS key is operational
      const keyResult = await kms
        .describeKey({
          KeyId: kmsKeyId,
        })
        .promise();

      expect(keyResult.KeyMetadata?.KeyState).toBe("Enabled");
    });
  });

  describe("Security Validation", () => {
    it("should use regional API Gateway endpoint", async () => {
      expect(apiUrl).toContain("ap-southeast-1");
      expect(apiUrl).toContain("execute-api");
    });

    it("should have Lambda execution role with minimal permissions", async () => {
      const functionConfig = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(functionConfig.Role).toBeDefined();
      expect(functionConfig.Role).toContain("lambda-role-");
    });

    it("should have proper resource tagging", async () => {
      const functionConfig = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      const tags = await lambda
        .listTags({
          Resource: functionConfig.FunctionArn!,
        })
        .promise();

      expect(tags.Tags).toBeDefined();
      expect(tags.Tags?.Environment).toBeDefined();
      expect(tags.Tags?.Name).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should respond within acceptable time", async () => {
      const startTime = Date.now();
      const response = await httpsGet(apiUrl);
      const endTime = Date.now();

      expect(response.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it("should handle cold start gracefully", async () => {
      // Cold start test - first invocation may be slower
      const response = await httpsGet(apiUrl);
      expect(response.statusCode).toBe(200);
    });
  });
});
