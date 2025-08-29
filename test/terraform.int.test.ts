import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStagesCommand,
} from "@aws-sdk/client-api-gateway";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  GetRoleCommand,
  IAMClient,
} from "@aws-sdk/client-iam";
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  GetTopicAttributesCommand,
  SNSClient,
} from "@aws-sdk/client-sns";
import * as fs from "fs";
import * as path from "path";

const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

interface Outputs {
  api_gateway_url_dev: string;
  api_gateway_url_prod: string;
  dynamodb_table_name: string;
  lambda_function_name: string;
  sns_topic_arn: string;
  lambda_iam_role_arn?: string;
}

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" &&
  /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-\/:.]+$/.test(val);

const isValidApiGatewayUrl = (val: any): boolean =>
  typeof val === "string" &&
  /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9-]+$/.test(val);

describe("Serverless API Terraform live integration tests", () => {
  let outputs: Outputs;

  beforeAll(() => {
    const raw = fs.readFileSync(OUTPUTS_PATH, "utf-8");
    outputs = JSON.parse(raw);

    // Basic verification for presence of required outputs
    expect(typeof outputs.api_gateway_url_dev).toBe("string");
    expect(typeof outputs.api_gateway_url_prod).toBe("string");
    expect(typeof outputs.dynamodb_table_name).toBe("string");
    expect(typeof outputs.lambda_function_name).toBe("string");
    expect(typeof outputs.sns_topic_arn).toBe("string");
  });

  describe("Output validation", () => {
    it("should have all expected output keys", () => {
      const expectedKeys = [
        "api_gateway_url_dev",
        "api_gateway_url_prod",
        "dynamodb_table_name",
        "lambda_function_name",
        "sns_topic_arn"
      ];
      expect(Object.keys(outputs).sort()).toEqual(expectedKeys.sort());
    });

    it("should have valid API Gateway URLs", () => {
      expect(isValidApiGatewayUrl(outputs.api_gateway_url_dev)).toBe(true);
      expect(isValidApiGatewayUrl(outputs.api_gateway_url_prod)).toBe(true);
    });

    it("should have valid SNS topic ARN", () => {
      expect(isValidArn(outputs.sns_topic_arn)).toBe(true);
    });

    it("should have non-empty resource names", () => {
      expect(isNonEmptyString(outputs.dynamodb_table_name)).toBe(true);
      expect(isNonEmptyString(outputs.lambda_function_name)).toBe(true);
    });
  });

  describe("Lambda Function", () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region: "us-east-1" });
    });

    it("should exist and be accessible", async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );
      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
    });

    it("should be configured with Node.js runtime", async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.lambda_function_name })
      );
      expect(response.Runtime).toMatch(/nodejs/);
    });

    it("should have environment variables configured", async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.lambda_function_name })
      );
      expect(response.Environment).toBeDefined();
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBe(outputs.dynamodb_table_name);
    });

    it("should have proper timeout and memory settings", async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.lambda_function_name })
      );
      expect(response.Timeout).toBeGreaterThan(0);
      expect(response.MemorySize).toBeGreaterThan(0);
    });
  });

  describe("API Gateway", () => {
    let apiGatewayClient: APIGatewayClient;
    let restApiId: string;

    beforeAll(() => {
      apiGatewayClient = new APIGatewayClient({ region: "us-east-1" });
      // Extract API ID from URL
      restApiId = outputs.api_gateway_url_dev.split("/")[2].split(".")[0];
    });

    it("should exist and be accessible", async () => {
      const response = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId })
      );
      expect(response.id).toBe(restApiId);
    });

    it("should have both dev and prod stages", async () => {
      const response = await apiGatewayClient.send(
        new GetStagesCommand({ restApiId })
      );
      const stageNames = response.item?.map((stage: any) => stage.stageName) || [];
      expect(stageNames).toContain("dev");
      expect(stageNames).toContain("prod");
    });

    it("should be properly configured", async () => {
      const response = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId })
      );
      expect(response.name).toBeDefined();
      expect(response.createdDate).toBeDefined();
    });
  });

  describe("DynamoDB Table", () => {
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region: "us-east-1" });
    });

    it("should exist and be accessible", async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.TableName).toBe(outputs.dynamodb_table_name);
    });

    it("should have id as the primary key", async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      const hashKey = response.Table?.KeySchema?.find(key => key.KeyType === "HASH")?.AttributeName;
      expect(hashKey).toBe("id");
    });

    it("should have proper read/write capacity", async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
      expect(response.Table?.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
    });

    it("should be in us-east-1 region", async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.TableArn).toContain("us-east-1");
    });

    it("should have proper table status", async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.TableStatus).toBe("ACTIVE");
    });
  });

  describe("CloudWatch Logs", () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region: "us-east-1" });
    });

    it("should have log group for Lambda function", async () => {
      const logGroupName = `/aws/lambda/${outputs.lambda_function_name}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      const logGroup = response.logGroups?.find((group: any) => group.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    it("should have proper log retention configured", async () => {
      const logGroupName = `/aws/lambda/${outputs.lambda_function_name}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      const logGroup = response.logGroups?.find((group: any) => group.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe("SNS Topic", () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region: "us-east-1" });
    });

    it("should exist and be accessible", async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.sns_topic_arn })
      );
      expect(response.Attributes).toBeDefined();
    });

    it("should have valid ARN format", () => {
      expect(isValidArn(outputs.sns_topic_arn)).toBe(true);
    });

    it("should be in us-east-1 region", () => {
      expect(outputs.sns_topic_arn).toContain("us-east-1");
    });

    it("should have proper topic attributes", async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.sns_topic_arn })
      );
      expect(response.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
      expect(response.Attributes?.Owner).toBeDefined();
    });
  });

  describe("IAM Role", () => {
    let iamClient: IAMClient;

    beforeAll(() => {
      iamClient = new IAMClient({ region: "us-east-1" });
    });

    it("should have Lambda execution role if specified", async () => {
      if (outputs.lambda_iam_role_arn) {
        const roleName = outputs.lambda_iam_role_arn.split("/").pop()!;
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(response.Role).toBeDefined();
        expect(response.Role?.Arn).toEqual(outputs.lambda_iam_role_arn);
      }
    });
  });

  describe("Resource naming conventions", () => {
    it("should follow consistent naming pattern", () => {
      // Check if resources follow the expected naming pattern
      expect(outputs.dynamodb_table_name).toContain("tap-api");
      expect(outputs.lambda_function_name).toContain("tap-api");
      expect(outputs.sns_topic_arn).toContain("tap-api");
    });

    it("should include environment in resource names", () => {
      expect(outputs.dynamodb_table_name).toContain("-dev-");
      expect(outputs.lambda_function_name).toContain("-dev-");
      expect(outputs.sns_topic_arn).toContain("-dev-");
    });
  });

  describe("API Gateway configuration", () => {
    it("should have proper stage separation", () => {
      expect(outputs.api_gateway_url_dev).toContain("/dev");
      expect(outputs.api_gateway_url_prod).toContain("/prod");
    });

    it("should be deployed in us-east-1", () => {
      expect(outputs.api_gateway_url_dev).toContain("us-east-1");
      expect(outputs.api_gateway_url_prod).toContain("us-east-1");
    });

    it("should have valid execute-api domain", () => {
      expect(outputs.api_gateway_url_dev).toContain(".execute-api.");
      expect(outputs.api_gateway_url_prod).toContain(".execute-api.");
    });
  });

  describe("DynamoDB configuration", () => {
    it("should have valid table name format", () => {
      // DynamoDB table names should be lowercase, alphanumeric, and hyphens only
      expect(outputs.dynamodb_table_name).toMatch(/^[a-z0-9-]+$/);
    });

    it("should include project and environment in name", () => {
      expect(outputs.dynamodb_table_name).toContain("tap-api");
      expect(outputs.dynamodb_table_name).toContain("dev");
    });
  });

  describe("Lambda configuration", () => {
    it("should have valid function name format", () => {
      // Lambda function names should be alphanumeric and hyphens only
      expect(outputs.lambda_function_name).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    it("should include project and environment in name", () => {
      expect(outputs.lambda_function_name).toContain("tap-api");
      expect(outputs.lambda_function_name).toContain("dev");
    });
  });

  describe("SNS configuration", () => {
    it("should have proper ARN structure", () => {
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d{12}:.*$/);
    });

    it("should include project and environment in name", () => {
      expect(outputs.sns_topic_arn).toContain("tap-api");
      expect(outputs.sns_topic_arn).toContain("dev");
    });
  });

  describe("Cross-service integration", () => {
    it("should have consistent naming across services", () => {
      // All resources should follow the same naming pattern
      const resources = [
        outputs.dynamodb_table_name,
        outputs.lambda_function_name,
        outputs.sns_topic_arn
      ];

      resources.forEach(resource => {
        expect(resource).toContain("tap-api");
        expect(resource).toContain("dev");
      });
    });

    it("should have proper stage separation in API Gateway", () => {
      expect(outputs.api_gateway_url_dev).toContain("/dev");
      expect(outputs.api_gateway_url_prod).toContain("/prod");
    });
  });
});

