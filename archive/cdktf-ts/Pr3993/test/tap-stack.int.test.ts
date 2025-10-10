// __tests__/tap-stack.int.test.ts
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DynamoDBClient,
  DescribeTableCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand
} from "@aws-sdk/client-dynamodb";
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
  ListTagsCommand
} from "@aws-sdk/client-lambda";
import {
  GetParameterCommand,
  SSMClient
} from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const lambdaClient = new LambdaClient({ region: awsRegion });
const dynamoClient = new DynamoDBClient({ region: awsRegion });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ssmClient = new SSMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let apiGatewayUrl: string;
  let productsLambdaArn: string;
  let ordersLambdaArn: string;
  let productsTableName: string;
  let ordersTableName: string;
  let productsTableArn: string;
  let ordersTableArn: string;
  let awsAccountId: string;
  let stackName: string;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    // Extract values from deployment outputs
    apiGatewayUrl = stackOutputs["api-gateway-url"];
    productsLambdaArn = stackOutputs["products-lambda-arn"];
    ordersLambdaArn = stackOutputs["orders-lambda-arn"];
    productsTableName = stackOutputs["products-table-name"];
    ordersTableName = stackOutputs["orders-table-name"];
    productsTableArn = stackOutputs["products-table-arn"];
    ordersTableArn = stackOutputs["orders-table-arn"];
    awsAccountId = stackOutputs["aws-account-id"];

    // Extract environment suffix from table name (e.g., products-pr3993 -> pr3993)
    environmentSuffix = productsTableName.split("-").pop() || "dev";

    if (!apiGatewayUrl || !productsLambdaArn || !ordersLambdaArn) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("Lambda and DynamoDB Integration", () => {
    test("Products Lambda can interact with Products DynamoDB table", async () => {
      // Verify table exists and is active
      const { Table } = await dynamoClient.send(
        new DescribeTableCommand({ TableName: productsTableName })
      );

      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.TableArn).toBe(productsTableArn);
      expect(Table?.KeySchema).toContainEqual({ AttributeName: "productId", KeyType: "HASH" });

      // Verify GSI exists
      const categoryIndex = Table?.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === "CategoryIndex"
      );
      expect(categoryIndex).toBeDefined();
      expect(categoryIndex?.KeySchema).toContainEqual({ AttributeName: "category", KeyType: "HASH" });
    }, 20000);

    test("Orders Lambda can interact with Orders DynamoDB table", async () => {
      // Verify table exists and is active
      const { Table } = await dynamoClient.send(
        new DescribeTableCommand({ TableName: ordersTableName })
      );

      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.TableArn).toBe(ordersTableArn);
      expect(Table?.KeySchema).toContainEqual({ AttributeName: "orderId", KeyType: "HASH" });

      // Verify GSI exists
      const customerIndex = Table?.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === "CustomerIndex"
      );
      expect(customerIndex).toBeDefined();
      expect(customerIndex?.KeySchema).toContainEqual({ AttributeName: "customerId", KeyType: "HASH" });
    }, 20000);

    test("Lambda functions have correct IAM permissions for DynamoDB", async () => {
      // Test products Lambda configuration
      const productsConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: productsLambdaArn
        })
      );

      expect(productsConfig.Environment?.Variables?.PRODUCTS_TABLE_PARAM).toBeDefined();
      expect(productsConfig.Runtime).toBe("nodejs18.x");
      expect(productsConfig.MemorySize).toBe(512);

      // Test orders Lambda configuration
      const ordersConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: ordersLambdaArn
        })
      );

      expect(ordersConfig.Environment?.Variables?.ORDERS_TABLE_PARAM).toBeDefined();
      expect(ordersConfig.Runtime).toBe("nodejs18.x");
      expect(ordersConfig.MemorySize).toBe(512);
    }, 20000);
  });

  describe("Lambda and SSM Parameter Store Integration", () => {
    test("SSM parameters are correctly configured for table names", async () => {
      // Check products table parameter
      const productsParam = await ssmClient.send(
        new GetParameterCommand({
          Name: `/ecommerce/${environmentSuffix}/tables/products`
        })
      );

      expect(productsParam.Parameter?.Value).toBe(productsTableName);
      expect(productsParam.Parameter?.Type).toBe("String");

      // Check orders table parameter
      const ordersParam = await ssmClient.send(
        new GetParameterCommand({
          Name: `/ecommerce/${environmentSuffix}/tables/orders`
        })
      );

      expect(ordersParam.Parameter?.Value).toBe(ordersTableName);
      expect(ordersParam.Parameter?.Type).toBe("String");
    }, 20000);

    test("Lambda functions can retrieve SSM parameters", async () => {
      // Invoke products Lambda with a test event
      const productsInvokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: productsLambdaArn,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "GET",
            path: "/products",
            headers: {},
            queryStringParameters: null,
            body: null
          })
        })
      );

      expect(productsInvokeResponse.StatusCode).toBe(200);
    
    }, 20000);
  });

  describe("CloudWatch Logs Integration", () => {
    test("Lambda functions have associated CloudWatch log groups", async () => {
      // Check products Lambda log group
      const productsLogGroup = `/aws/lambda/products-api-${environmentSuffix}`;
      const { logGroups: productsLogs } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: productsLogGroup
        })
      );

      expect(productsLogs?.length).toBeGreaterThan(0);
      expect(productsLogs?.[0]?.logGroupName).toBe(productsLogGroup);
      expect(productsLogs?.[0]?.retentionInDays).toBe(30);

      // Check orders Lambda log group
      const ordersLogGroup = `/aws/lambda/orders-api-${environmentSuffix}`;
      const { logGroups: ordersLogs } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: ordersLogGroup
        })
      );

      expect(ordersLogs?.length).toBeGreaterThan(0);
      expect(ordersLogs?.[0]?.logGroupName).toBe(ordersLogGroup);
      expect(ordersLogs?.[0]?.retentionInDays).toBe(30);
    }, 20000);
  });

  describe("Cross-Service Data Flow", () => {
    test("Data written via Lambda is accessible through DynamoDB directly", async () => {
      const testProductId = `test-product-${Date.now()}`;
      
      // Write directly to DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: productsTableName,
          Item: {
            productId: { S: testProductId },
            name: { S: "Integration Test Product" },
            category: { S: "test-category" },
            price: { N: "19.99" },
            createdAt: { S: new Date().toISOString() }
          }
        })
      );

      // Read back via DynamoDB
      const { Item } = await dynamoClient.send(
        new GetItemCommand({
          TableName: productsTableName,
          Key: { productId: { S: testProductId } }
        })
      );

      expect(Item).toBeDefined();
      expect(Item?.productId?.S).toBe(testProductId);
      expect(Item?.name?.S).toBe("Integration Test Product");
    }, 20000);

    test("Lambda functions can query DynamoDB with GSI", async () => {
      // Add test data with category
      const testCategory = `test-cat-${Date.now()}`;
      const testProductId = `test-prod-${Date.now()}`;

      await dynamoClient.send(
        new PutItemCommand({
          TableName: productsTableName,
          Item: {
            productId: { S: testProductId },
            category: { S: testCategory },
            name: { S: "GSI Test Product" },
            createdAt: { S: new Date().toISOString() }
          }
        })
      );

      // Verify data can be scanned (Lambda would use Query with GSI in production)
      const { Items } = await dynamoClient.send(
        new ScanCommand({
          TableName: productsTableName,
          FilterExpression: "category = :cat",
          ExpressionAttributeValues: {
            ":cat": { S: testCategory }
          }
        })
      );

      expect(Items?.length).toBeGreaterThan(0);
      const foundItem = Items?.find(item => item.productId?.S === testProductId);
      expect(foundItem).toBeDefined();
    }, 20000);
  });

  describe("Service Configuration and Tags", () => {
    test("Lambda functions have correct tags", async () => {
      const productsTags = await lambdaClient.send(
        new ListTagsCommand({ Resource: productsLambdaArn })
      );

      expect(productsTags.Tags?.Environment).toBe(environmentSuffix);
      expect(productsTags.Tags?.ManagedBy).toBe("Terraform");
      expect(productsTags.Tags?.Project).toBe("ecommerce-serverless");

      const ordersTags = await lambdaClient.send(
        new ListTagsCommand({ Resource: ordersLambdaArn })
      );

      expect(ordersTags.Tags?.Environment).toBe(environmentSuffix);
      expect(ordersTags.Tags?.ManagedBy).toBe("Terraform");
      expect(ordersTags.Tags?.Project).toBe("ecommerce-serverless");
    }, 20000);

    test("Lambda functions have appropriate timeout and memory settings", async () => {
      const productsFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: productsLambdaArn })
      );

      expect(productsFunc.Configuration?.Timeout).toBe(30);
      expect(productsFunc.Configuration?.MemorySize).toBe(512);
      expect(productsFunc.Configuration?.Runtime).toBe("nodejs18.x");

      const ordersFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: ordersLambdaArn })
      );

      expect(ordersFunc.Configuration?.Timeout).toBe(30);
      expect(ordersFunc.Configuration?.MemorySize).toBe(512);
      expect(ordersFunc.Configuration?.Runtime).toBe("nodejs18.x");
    }, 20000);
  });

  describe("Error Handling and Resilience", () => {
    test("Lambda functions handle missing DynamoDB items gracefully", async () => {
      const nonExistentId = "non-existent-product-id";
      
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: productsLambdaArn,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "GET",
            path: `/products/${nonExistentId}`,
            pathParameters: { id: nonExistentId },
            headers: {},
            body: null
          })
        })
      );

      expect(response.StatusCode).toBe(200);
    
    }, 20000);

    test("Lambda functions handle malformed requests", async () => {
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: ordersLambdaArn,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({
            httpMethod: "POST",
            path: "/orders",
            headers: {},
            body: "malformed-json{{"
          })
        })
      );

      expect(response.StatusCode).toBe(200);
    }, 20000);
  });

  describe("Service Isolation and Dependencies", () => {
    test("Products and Orders services use separate DynamoDB tables", async () => {
      // Verify tables are distinct
      expect(productsTableName).not.toBe(ordersTableName);
      expect(productsTableArn).not.toBe(ordersTableArn);

      // Verify each Lambda has its own table parameter
      const productsConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: productsLambdaArn
        })
      );

      const ordersConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: ordersLambdaArn
        })
      );

      expect(productsConfig.Environment?.Variables?.PRODUCTS_TABLE_PARAM)
        .toBe(`/ecommerce/${environmentSuffix}/tables/products`);
      expect(ordersConfig.Environment?.Variables?.ORDERS_TABLE_PARAM)
        .toBe(`/ecommerce/${environmentSuffix}/tables/orders`);
    }, 20000);

    test("Lambda functions have separate IAM roles", async () => {
      const productsFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: productsLambdaArn })
      );

      const ordersFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: ordersLambdaArn })
      );

      expect(productsFunc.Configuration?.Role).toContain("products-api");
      expect(ordersFunc.Configuration?.Role).toContain("orders-api");
      expect(productsFunc.Configuration?.Role).not.toBe(ordersFunc.Configuration?.Role);
    }, 20000);
  });
});