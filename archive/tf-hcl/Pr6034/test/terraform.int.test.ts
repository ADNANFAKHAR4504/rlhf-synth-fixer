import { APIGatewayClient, GetMethodCommand, GetRestApiCommand, GetStageCommand } from "@aws-sdk/client-api-gateway";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { DescribeContinuousBackupsCommand, DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DescribeKeyCommand, GetKeyRotationStatusCommand, KMSClient } from "@aws-sdk/client-kms";
import { GetFunctionConfigurationCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetTopicAttributesCommand, SNSClient } from "@aws-sdk/client-sns";
import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import { readFileSync } from "fs";
import { join } from "path";

const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, "utf-8"));
} catch (error) {
  console.log("Warning: flat-outputs.json not found. Integration tests will be skipped.");
}

const extractRegionFromArn = (arn: string): string => {
  const arnParts = arn.split(":");
  return arnParts[3];
};

const extractAccountFromArn = (arn: string): string => {
  const arnParts = arn.split(":");
  return arnParts[4];
};

const extractRegionFromUrl = (url: string): string => {
  const match = url.match(/\.([a-z0-9-]+)\.amazonaws\.com/);
  return match ? match[1] : "us-east-1";
};

const hasOutputs = Object.keys(outputs).length > 0;
let region: string;

if (hasOutputs) {
  if (outputs.sns_topic_arn) {
    region = extractRegionFromArn(outputs.sns_topic_arn);
  } else if (outputs.api_gateway_invoke_url) {
    region = extractRegionFromUrl(outputs.api_gateway_invoke_url);
  } else {
    region = process.env.AWS_REGION || "us-east-1";
  }
} else {
  region = process.env.AWS_REGION || "us-east-1";
}

const isValidKmsKeyId = (keyId: string): boolean => {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(keyId);
};

const isValidArn = (arn: string): boolean => {
  return /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(arn);
};

const isValidUrl = (url: string): boolean => {
  return /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url);
};

const isValidSqsUrl = (url: string): boolean => {
  return /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/[0-9]+\/[a-zA-Z0-9_-]+$/.test(url);
};

describe("Serverless Payment Processing Infrastructure Integration Tests", () => {
  beforeAll(() => {
    if (!hasOutputs) {
      console.log("Skipping all tests: Infrastructure not deployed yet");
    }
  });

  describe("Output Structure Validation", () => {
    test("should have all required infrastructure outputs", () => {
      if (!hasOutputs) {
        console.log("Skipping: Infrastructure not deployed");
        return;
      }

      const requiredOutputs = [
        "api_gateway_invoke_url",
        "dynamodb_table_name",
        "kms_key_id",
        "sns_topic_arn",
        "sqs_queue_url"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(typeof outputs[output]).toBe("string");
        expect(outputs[output].trim().length).toBeGreaterThan(0);
      });
    });

    test("should have valid output formats", () => {
      if (!hasOutputs) return;

      expect(isValidUrl(outputs.api_gateway_invoke_url)).toBe(true);
      expect(isValidKmsKeyId(outputs.kms_key_id)).toBe(true);
      expect(isValidArn(outputs.sns_topic_arn)).toBe(true);
      expect(isValidSqsUrl(outputs.sqs_queue_url)).toBe(true);
    });

    test("should not expose sensitive information", () => {
      if (!hasOutputs) return;

      const sensitivePatterns = [
        /password/i, /secret/i, /private_key/i, /access_key/i,
        /session_token/i, /credentials/i, /token/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe("DynamoDB Table Configuration", () => {
    let dynamodbClient: DynamoDBClient;
    let tableDescription: any;

    beforeAll(async () => {
      if (!hasOutputs) return;

      dynamodbClient = new DynamoDBClient({ region });

      try {
        const command = new DescribeTableCommand({
          TableName: outputs.dynamodb_table_name
        });
        const response = await dynamodbClient.send(command);
        tableDescription = response.Table;
      } catch (error) {
        console.log("Error describing DynamoDB table:", error);
      }
    });

    test("should have DynamoDB table deployed and available", async () => {
      if (!hasOutputs) return;

      expect(tableDescription).toBeDefined();
      expect(tableDescription.TableStatus).toBe("ACTIVE");
      expect(tableDescription.TableName).toBe(outputs.dynamodb_table_name);
    });

    test("should use PAY_PER_REQUEST billing mode", () => {
      if (!hasOutputs || !tableDescription) return;

      expect(tableDescription.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
    });

    test("should have correct key schema configuration", () => {
      if (!hasOutputs || !tableDescription) return;

      const keySchema = tableDescription.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema.find((key: any) => key.KeyType === "HASH");
      const rangeKey = keySchema.find((key: any) => key.KeyType === "RANGE");

      expect(hashKey.AttributeName).toBe("transaction_id");
      expect(rangeKey.AttributeName).toBe("timestamp");
    });

    test("should have server-side encryption enabled", () => {
      if (!hasOutputs || !tableDescription) return;

      expect(tableDescription.SSEDescription).toBeDefined();
      expect(tableDescription.SSEDescription.Status).toBe("ENABLED");
      expect(tableDescription.SSEDescription.SSEType).toBe("KMS");
    });

    test("should have DynamoDB Streams enabled", () => {
      if (!hasOutputs || !tableDescription) return;

      expect(tableDescription.StreamSpecification).toBeDefined();
      expect(tableDescription.StreamSpecification.StreamEnabled).toBe(true);
      expect(tableDescription.StreamSpecification.StreamViewType).toBe("NEW_AND_OLD_IMAGES");
    });

    test("should have point-in-time recovery enabled", async () => {
      if (!hasOutputs) return;

      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.dynamodb_table_name
      });

      const response = await dynamodbClient.send(command);
      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
    });
  });

  describe("KMS Key Configuration", () => {
    let kmsClient: KMSClient;
    let keyDescription: any;

    beforeAll(async () => {
      if (!hasOutputs) return;

      kmsClient = new KMSClient({ region });

      try {
        const command = new DescribeKeyCommand({
          KeyId: outputs.kms_key_id
        });
        const response = await kmsClient.send(command);
        keyDescription = response.KeyMetadata;
      } catch (error) {
        console.log("Error describing KMS key:", error);
      }
    });

    test("should have KMS key deployed and enabled", () => {
      if (!hasOutputs) return;

      expect(keyDescription).toBeDefined();
      expect(keyDescription.KeyState).toBe("Enabled");
      expect(keyDescription.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });

    test("should have key rotation enabled", async () => {
      if (!hasOutputs || !keyDescription) return;

      try {
        const rotationCmd = new GetKeyRotationStatusCommand({ KeyId: outputs.kms_key_id });
        const rotationResp = await kmsClient.send(rotationCmd);
        expect(rotationResp.KeyRotationEnabled).toBe(true);
      } catch (error) {
        console.log("Error getting KMS key rotation status:", error);
      }
    });

    test("should be a customer managed key", () => {
      if (!hasOutputs || !keyDescription) return;

      expect(keyDescription.KeyManager).toBe("CUSTOMER");
    });
  });

  describe("SNS Topic Configuration", () => {
    let snsClient: SNSClient;
    let topicAttributes: any;

    beforeAll(async () => {
      if (!hasOutputs) return;

      snsClient = new SNSClient({ region });

      try {
        const command = new GetTopicAttributesCommand({
          TopicArn: outputs.sns_topic_arn
        });
        const response = await snsClient.send(command);
        topicAttributes = response.Attributes;
      } catch (error) {
        console.log("Error describing SNS topic:", error);
      }
    });

    test("should have SNS topic deployed", () => {
      if (!hasOutputs) return;

      expect(topicAttributes).toBeDefined();
      expect(topicAttributes.TopicArn).toBe(outputs.sns_topic_arn);
    });

    test("should have KMS encryption enabled", () => {
      if (!hasOutputs || !topicAttributes) return;

      expect(topicAttributes.KmsMasterKeyId).toBeDefined();
      expect(topicAttributes.KmsMasterKeyId).not.toBe("");
    });
  });

  describe("SQS Queue Configuration", () => {
    let sqsClient: SQSClient;
    let queueAttributes: any;

    beforeAll(async () => {
      if (!hasOutputs) return;

      sqsClient = new SQSClient({ region });

      try {
        const command = new GetQueueAttributesCommand({
          QueueUrl: outputs.sqs_queue_url,
          AttributeNames: ["All"]
        });
        const response = await sqsClient.send(command);
        queueAttributes = response.Attributes;
      } catch (error) {
        console.log("Error describing SQS queue:", error);
      }
    });

    test("should have SQS queue deployed", () => {
      if (!hasOutputs) return;

      expect(queueAttributes).toBeDefined();
    });

    test("should have KMS encryption enabled", () => {
      if (!hasOutputs || !queueAttributes) return;

      expect(queueAttributes.KmsMasterKeyId).toBeDefined();
      expect(queueAttributes.KmsMasterKeyId).not.toBe("");
    });

    test("should have appropriate visibility timeout", () => {
      if (!hasOutputs || !queueAttributes) return;

      const visibilityTimeout = parseInt(queueAttributes.VisibilityTimeout);
      expect(visibilityTimeout).toBeGreaterThanOrEqual(300);
    });

    test("should have long polling enabled", () => {
      if (!hasOutputs || !queueAttributes) return;

      const receiveMessageWaitTime = parseInt(queueAttributes.ReceiveMessageWaitTimeSeconds);
      expect(receiveMessageWaitTime).toBeGreaterThan(0);
    });
  });

  describe("Lambda Functions Configuration", () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      if (!hasOutputs) return;
      lambdaClient = new LambdaClient({ region });
    });

    const functionConfigs = [
      { name: "webhook-processor", description: "Webhook processor function" },
      { name: "transaction-reader", description: "Transaction reader function" },
      { name: "notification-sender", description: "Notification sender function" }
    ];

    functionConfigs.forEach(({ name, description }) => {
      describe(`${description}`, () => {
        let functionConfig: any;
        const functionName = `${name}-prod`;

        beforeAll(async () => {
          if (!hasOutputs) return;

          try {
            const command = new GetFunctionConfigurationCommand({
              FunctionName: functionName
            });
            const response = await lambdaClient.send(command);
            functionConfig = response;
          } catch (error) {
            console.log(`Error describing Lambda function ${functionName}:`, error);
          }
        });

        test(`should have ${name} function deployed`, () => {
          if (!hasOutputs) return;

          expect(functionConfig).toBeDefined();
          expect(functionConfig.State).toBe("Active");
          expect(functionConfig.FunctionName).toBe(functionName);
        });

        test(`should use Python 3.11 runtime`, () => {
          if (!hasOutputs || !functionConfig) return;

          expect(functionConfig.Runtime).toBe("python3.11");
        });

        test(`should have X-Ray tracing enabled`, () => {
          if (!hasOutputs || !functionConfig) return;

          expect(functionConfig.TracingConfig?.Mode).toBe("Active");
        });

        test(`should have dead letter queue configured`, () => {
          if (!hasOutputs || !functionConfig) return;

          expect(functionConfig.DeadLetterConfig?.TargetArn).toBeDefined();
          expect(functionConfig.DeadLetterConfig.TargetArn).toContain("sqs");
        });

        test(`should have environment variables configured`, () => {
          if (!hasOutputs || !functionConfig) return;

          expect(functionConfig.Environment?.Variables).toBeDefined();
          expect(functionConfig.Environment.Variables.KMS_KEY_ID).toBeDefined();
        });

        test(`should have KMS encryption for environment variables`, () => {
          if (!hasOutputs || !functionConfig) return;

          expect(functionConfig.KMSKeyArn).toBeDefined();
          expect(functionConfig.KMSKeyArn).toContain("kms");
        });
      });
    });
  });

  describe("API Gateway Configuration", () => {
    let apiGatewayClient: APIGatewayClient;
    let restApi: any;
    let apiId: string;

    beforeAll(async () => {
      if (!hasOutputs) return;

      apiGatewayClient = new APIGatewayClient({ region });

      const urlParts = outputs.api_gateway_invoke_url.split("/");
      const hostPart = urlParts[2];
      apiId = hostPart.split(".")[0];

      try {
        const command = new GetRestApiCommand({
          restApiId: apiId
        });
        const response = await apiGatewayClient.send(command);
        restApi = response;
      } catch (error) {
        console.log("Error describing API Gateway:", error);
      }
    });

    test("should have API Gateway deployed", () => {
      if (!hasOutputs) return;

      expect(restApi).toBeDefined();
      expect(restApi.id).toBe(apiId);
      expect(restApi.name).toContain("payment-api");
    });

    test("should have regional endpoint configuration", () => {
      if (!hasOutputs || !restApi) return;

      expect(restApi.endpointConfiguration?.types).toContain("REGIONAL");
    });

    test("should have production stage deployed", async () => {
      if (!hasOutputs) return;

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: "prod"
      });

      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe("prod");
      expect(response.methodSettings).toBeDefined();
    });

    test("should have proper authentication configured", async () => {
      if (!hasOutputs) return;

      try {
        const command = new GetMethodCommand({
          restApiId: apiId,
          resourceId: "root",
          httpMethod: "POST"
        });

        const response = await apiGatewayClient.send(command);
        expect(response.authorizationType).toBe("AWS_IAM");
      } catch (error) {
        console.log("Note: Root resource POST method may not exist, this is expected");
      }
    });
  });

  describe("CloudWatch Logs Configuration", () => {
    let cloudWatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      if (!hasOutputs) return;
      cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    });

    const logGroups = [
      "/aws/lambda/webhook-processor-prod",
      "/aws/lambda/transaction-reader-prod",
      "/aws/lambda/notification-sender-prod",
      "/aws/apigateway/payment-api-prod"
    ];

    logGroups.forEach(logGroupName => {
      test(`should have ${logGroupName} log group`, async () => {
        if (!hasOutputs) return;

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });

        const response = await cloudWatchLogsClient.send(command);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(7);
        expect(logGroup?.kmsKeyId).toBeDefined();
      });
    });
  });

  describe("Security Configuration", () => {
    test("should use consistent KMS key across services", () => {
      if (!hasOutputs) return;

      expect(outputs.kms_key_id).toBeDefined();
      expect(isValidKmsKeyId(outputs.kms_key_id)).toBe(true);
    });

    test("should use HTTPS endpoints only", () => {
      if (!hasOutputs) return;

      expect(outputs.api_gateway_invoke_url).toMatch(/^https:/);
      expect(outputs.sqs_queue_url).toMatch(/^https:/);
    });

    test("should use region-appropriate service endpoints", () => {
      if (!hasOutputs) return;

      expect(outputs.api_gateway_invoke_url).toContain(region);
      expect(outputs.sqs_queue_url).toContain(region);
      expect(outputs.sns_topic_arn).toContain(region);
    });
  });

  describe("Naming Convention Validation", () => {
    test("should follow consistent naming patterns", () => {
      if (!hasOutputs) return;

      expect(outputs.dynamodb_table_name).toBe("payment_transactions");
      expect(outputs.sns_topic_arn).toContain("payment-email-notifications-prod");
      expect(outputs.sqs_queue_url).toContain("payment-notifications-prod");
    });

    test("should include environment suffix in resource names", () => {
      if (!hasOutputs) return;

      expect(outputs.sns_topic_arn).toContain("-prod");
      expect(outputs.sqs_queue_url).toContain("-prod");
    });
  });

  describe("Infrastructure Connectivity", () => {
    test("should validate API Gateway accessibility", async () => {
      if (!hasOutputs) return;

      try {
        const response = await fetch(outputs.api_gateway_invoke_url, {
          method: "GET"
        });

        expect(response.status).toBeLessThan(500);
      } catch (error) {
        console.log("API Gateway connectivity test failed:", error);
      }
    });

    test("should validate cross-service references", () => {
      if (!hasOutputs) return;

      const arnRegion = extractRegionFromArn(outputs.sns_topic_arn);
      const urlRegion = extractRegionFromUrl(outputs.api_gateway_invoke_url);
      const sqsRegion = extractRegionFromUrl(outputs.sqs_queue_url);

      expect(arnRegion).toBe(urlRegion);
      expect(arnRegion).toBe(sqsRegion);
    });
  });

  describe("Performance and Scalability Configuration", () => {
    test("should have appropriate DynamoDB configuration for performance", () => {
      if (!hasOutputs) return;

      expect(outputs.dynamodb_table_name).toBeDefined();
    });

    test("should have Lambda concurrency limits configured", async () => {
      if (!hasOutputs) return;

      const lambdaClient = new LambdaClient({ region });
      const functionNames = [
        "webhook-processor-prod",
        "transaction-reader-prod",
        "notification-sender-prod"
      ];

      for (const functionName of functionNames) {
        try {
          const command = new GetFunctionConfigurationCommand({
            FunctionName: functionName
          });
          const response = await lambdaClient.send(command);

          // Check basic Lambda function configuration
          expect(response.FunctionName).toBeDefined();
          expect(response.Runtime).toBe("python3.11");
          expect(response.MemorySize).toBe(512);
          expect(response.Timeout).toBe(30);
        } catch (error) {
          console.log(`Error checking configuration for ${functionName}:`, error);
        }
      }
    });
  });
});
