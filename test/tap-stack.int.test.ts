import * as path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { ApiGatewayV2Client, GetApiCommand } from "@aws-sdk/client-apigatewayv2";

// AWS clients for integration testing
const dynamoClient = new DynamoDBClient({});
const lambdaClient = new LambdaClient({});
const apiGatewayClient = new ApiGatewayV2Client({});

describe("TapStack Integration Tests", () => {
  let apiUrl: string;
  let tableName: string;
  let functionName: string;
  
  // Test data
  const testItem = {
    id: "test-item-1",
    name: "Integration Test Item",
    description: "This is a test item for integration testing"
  };

  beforeAll(async () => {
    // Read deployment outputs from CI/CD pipeline
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    let outputs: any = {};
    
    try {
      if (fs.existsSync(outputsPath)) {
        const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
        outputs = JSON.parse(outputsContent);
        console.log('Successfully loaded deployment outputs from:', outputsPath);
      } else {
        console.warn('Deployment outputs file not found at:', outputsPath);
        console.warn('This is expected for local testing without CI/CD deployment');
        return;
      }
    } catch (error) {
      console.warn('Failed to read deployment outputs:', error);
      return;
    }

    // Extract resource information from outputs
    // Look for outputs that contain the stack resources
    apiUrl = outputs.apiUrl || outputs.ApiUrl || outputs.TapStackApiUrl;
    tableName = outputs.tableName || outputs.TableName || outputs.TapStackTableName;
    functionName = outputs.functionName || outputs.FunctionName || outputs.TapStackFunctionName;

    if (!apiUrl || !tableName || !functionName) {
      console.warn('Required outputs not found in deployment outputs:', {
        apiUrl: !!apiUrl,
        tableName: !!tableName,
        functionName: !!functionName
      });
      console.warn('Available outputs:', Object.keys(outputs));
      return;
    }

    console.log(`Integration test setup complete:
    - API URL: ${apiUrl}
    - Table Name: ${tableName}
    - Function Name: ${functionName}`);
  }, 30000); // 30 seconds timeout for reading outputs

  afterAll(async () => {
    if (tableName) {
      // Clean up test data
      try {
        const scanResult = await dynamoClient.send(new ScanCommand({
          TableName: tableName,
        }));
        
        if (scanResult.Items) {
          for (const item of scanResult.Items) {
            if (item.id?.S?.startsWith("test-")) {
              await dynamoClient.send(new DeleteItemCommand({
                TableName: tableName,
                Key: { id: { S: item.id.S } }
              }));
            }
          }
        }
      } catch (error) {
        console.warn("Failed to clean up test data:", error);
      }
    }
  });

  describe("Infrastructure Validation", () => {
    test("should have all required deployment outputs", async () => {
      expect(apiUrl).toBeDefined();
      expect(tableName).toBeDefined();
      expect(functionName).toBeDefined();
      
      expect(apiUrl).toContain("execute-api");
      expect(typeof tableName).toBe("string");
      expect(typeof functionName).toBe("string");
    });

    test("should have API Gateway accessible", async () => {
      if (!apiUrl) {
        console.warn("Skipping API Gateway test - no API URL available");
        return;
      }

      // Extract API ID from the URL
      const apiId = apiUrl.match(/https:\/\/([a-z0-9]+)\.execute-api/)?.[1];
      expect(apiId).toBeDefined();

      const response = await apiGatewayClient.send(new GetApiCommand({
        ApiId: apiId!
      }));

      expect(response.Name).toBeDefined();
      expect(response.ProtocolType).toBe("HTTP");
    });

    test("should have Lambda function accessible", async () => {
      if (!functionName) {
        console.warn("Skipping Lambda test - no function name available");
        return;
      }

      const testPayload = {
        httpMethod: "OPTIONS",
        pathParameters: null,
        body: null
      };

      const response = await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testPayload)
      }));

      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
    });
  });

  describe("API Endpoints Integration", () => {
    test("should handle OPTIONS request for CORS", async () => {
      if (!apiUrl) {
        console.warn("Skipping OPTIONS test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("access-control-allow-methods")).toContain("GET");
    });

    test("should create a new item via POST /items", async () => {
      if (!apiUrl) {
        console.warn("Skipping POST test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testItem),
      });

      expect(response.status).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe("Item created successfully");
      expect(responseBody.id).toBe(testItem.id);
    });

    test("should retrieve the created item via GET /items/{id}", async () => {
      if (!apiUrl) {
        console.warn("Skipping GET test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items/${testItem.id}`);

      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.id).toBe(testItem.id);
      expect(responseBody.name).toBe(testItem.name);
      expect(responseBody.description).toBe(testItem.description);
      expect(responseBody.createdAt).toBeDefined();
      expect(responseBody.updatedAt).toBeDefined();
    });

    test("should list all items via GET /items", async () => {
      if (!apiUrl) {
        console.warn("Skipping GET all test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items`);

      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.items).toBeDefined();
      expect(responseBody.count).toBeGreaterThan(0);
      expect(Array.isArray(responseBody.items)).toBe(true);
      
      // Find our test item
      const foundItem = responseBody.items.find((item: any) => item.id === testItem.id);
      expect(foundItem).toBeDefined();
    });

    test("should update an item via PUT /items/{id}", async () => {
      if (!apiUrl) {
        console.warn("Skipping PUT test - no API URL available");
        return;
      }

      const updateData = {
        name: "Updated Integration Test Item",
        description: "This item has been updated during integration testing"
      };

      const response = await fetch(`${apiUrl}/items/${testItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe("Item updated successfully");

      // Verify the update by retrieving the item
      const getResponse = await fetch(`${apiUrl}/items/${testItem.id}`);
      const updatedItem = await getResponse.json();
      
      expect(updatedItem.name).toBe(updateData.name);
      expect(updatedItem.description).toBe(updateData.description);
      expect(updatedItem.updatedAt).not.toBe(updatedItem.createdAt);
    });

    test("should return 404 for non-existent item", async () => {
      if (!apiUrl) {
        console.warn("Skipping 404 test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items/non-existent-id`);

      expect(response.status).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBe("Item not found");
    });

    test("should delete an item via DELETE /items/{id}", async () => {
      if (!apiUrl) {
        console.warn("Skipping DELETE test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items/${testItem.id}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe("Item deleted successfully");

      // Verify the item is deleted by trying to retrieve it
      const getResponse = await fetch(`${apiUrl}/items/${testItem.id}`);
      expect(getResponse.status).toBe(404);
    });

    test("should return 400 for PUT without ID parameter", async () => {
      if (!apiUrl) {
        console.warn("Skipping PUT validation test - no API URL available");
        return;
      }

      // This should fail because we can't PUT to /items without an ID
      const response = await fetch(`${apiUrl}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Test" }),
      });

      // The API should return 405 Method Not Allowed for PUT /items (without ID)
      expect(response.status).toBe(405);
    });

    test("should return 400 for DELETE without ID parameter", async () => {
      if (!apiUrl) {
        console.warn("Skipping DELETE validation test - no API URL available");
        return;
      }

      // This should fail because we can't DELETE /items without an ID
      const response = await fetch(`${apiUrl}/items`, {
        method: "DELETE",
      });

      // The API should return 405 Method Not Allowed for DELETE /items (without ID)
      expect(response.status).toBe(405);
    });
  });

  describe("DynamoDB Integration", () => {
    test("should store and retrieve data correctly", async () => {
      if (!tableName) {
        console.warn("Skipping DynamoDB test - no table name available");
        return;
      }

      // Create a test item directly via API
      const testDirectItem = {
        id: "test-direct-db-item",
        name: "Direct DB Test Item",
        value: 42
      };

      if (apiUrl) {
        const createResponse = await fetch(`${apiUrl}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testDirectItem),
        });

        expect(createResponse.status).toBe(201);

        // Verify the item is in DynamoDB
        const scanResult = await dynamoClient.send(new ScanCommand({
          TableName: tableName,
          FilterExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": { S: testDirectItem.id }
          }
        }));

        expect(scanResult.Items).toBeDefined();
        expect(scanResult.Items!.length).toBe(1);
        expect(scanResult.Items![0].id.S).toBe(testDirectItem.id);
        expect(scanResult.Items![0].name.S).toBe(testDirectItem.name);
      }
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed JSON in POST request", async () => {
      if (!apiUrl) {
        console.warn("Skipping JSON error test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json",
      });

      expect(response.status).toBe(500);
      
      const responseBody = await response.json();
      expect(responseBody.error).toBe("Internal server error");
    });

    test("should handle unsupported HTTP methods", async () => {
      if (!apiUrl) {
        console.warn("Skipping method error test - no API URL available");
        return;
      }

      const response = await fetch(`${apiUrl}/items`, {
        method: "PATCH",
      });

      expect(response.status).toBe(405);
    });
  });

  describe("Performance and Load", () => {
    test("should handle multiple concurrent requests", async () => {
      if (!apiUrl) {
        console.warn("Skipping concurrent test - no API URL available");
        return;
      }

      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        fetch(`${apiUrl}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: `test-concurrent-${i}`,
            name: `Concurrent Test Item ${i}`,
            timestamp: Date.now()
          }),
        })
      );

      const responses = await Promise.all(concurrentRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Clean up concurrent test items
      for (let i = 0; i < 5; i++) {
        await fetch(`${apiUrl}/items/test-concurrent-${i}`, {
          method: "DELETE",
        });
      }
    });
  });
});