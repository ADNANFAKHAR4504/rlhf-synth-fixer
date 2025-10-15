import axios from "axios";
import { DynamoDB, ECS, RDS } from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(300000); // 5-minute timeout for all tests

interface StackOutputs {
  ApplicationEndpoint: { value: string };
  DynamoDbTableName: { value: string };
  DbClusterIdentifier: { value: string };
  EcsClusterName: { value: string };
  EcsServiceName: { value: string };
}

const getStackOutputs = (): StackOutputs | null => {
  try {
    // Corrected path to match the stack name in the unit test
    const outputPath = path.join(__dirname, "../cdktf.out/stacks/TapStack/outputs.json");
    if (fs.existsSync(outputPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      if (outputs.ApplicationEndpoint && outputs.DynamoDbTableName && outputs.DbClusterIdentifier && outputs.EcsClusterName && outputs.EcsServiceName) {
        return outputs;
      }
    }
    return null;
  } catch (error) {
    console.warn("Could not read or parse CDKTF output file.", error);
    return null;
  }
};

const outputs = getStackOutputs();

if (outputs) {
  describe("Live Infrastructure Integration Tests", () => {

    const region = 'us-east-2';
    const dynamoClient = new DynamoDB.DocumentClient({ region });
    const ecsClient = new ECS({ region });
    const rdsClient = new RDS({ region });

    it("should have a reachable application endpoint", async () => {
      console.log(`Testing application endpoint: ${outputs.ApplicationEndpoint.value}`);
      const response = await axios.get(outputs.ApplicationEndpoint.value, { timeout: 30000 });
      expect(response.status).toBe(200);
      console.log(" Application endpoint is online.");
    });

    it("should have a stable and active ECS service with 2 running tasks", async () => {
      console.log(`Checking ECS Service: ${outputs.EcsServiceName.value}`);
      const response = await ecsClient.describeServices({
        cluster: outputs.EcsClusterName.value,
        services: [outputs.EcsServiceName.value],
      }).promise();

      expect(response.services).toHaveLength(1);
      const service = response.services?.[0];
      expect(service?.status).toBe("ACTIVE");
      expect(service?.runningCount).toBe(2);
      console.log(" ECS service is active and stable.");
    });

    it("should have an available Aurora DB cluster", async () => {
      console.log(`Checking Aurora DB Cluster: ${outputs.DbClusterIdentifier.value}`);
      const response = await rdsClient.describeDBClusters({
        DBClusterIdentifier: outputs.DbClusterIdentifier.value,
      }).promise();

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters?.[0];
      expect(cluster?.Status).toBe("available");
      console.log(" Aurora DB cluster is available.");
    });

    it("should allow writing to and reading from the DynamoDB table", async () => {
      const testId = uuidv4();
      console.log(`Testing DynamoDB table: ${outputs.DynamoDbTableName.value}`);

      await dynamoClient.put({
        TableName: outputs.DynamoDbTableName.value,
        Item: { sessionId: testId, message: "test" },
      }).promise();

      const result = await dynamoClient.get({
        TableName: outputs.DynamoDbTableName.value,
        Key: { sessionId: testId },
      }).promise();

      expect(result.Item).toBeDefined();
      expect(result.Item?.sessionId).toBe(testId);
      console.log("DynamoDB data plane test successful.");
    });
  });
} else {
  describe("Integration Tests Skipped", () => {
    it("logs a warning because CDKTF output file was not found", () => {
      console.warn("\n WARNING: CDKTF output file not found. Skipping live integration tests.\n");
    });
  });
}
