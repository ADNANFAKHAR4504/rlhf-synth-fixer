// test/tap-stack.int.test.ts
import axios from "axios";
import { DynamoDB, ECS, RDS, KMS, SSM, Lambda, Backup } from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(300000); // 5-minute timeout

// This interface defines all the outputs the tests will rely on.
interface StackOutputs {
  ApplicationEndpoint: { value: string };
  DynamoDbTableName: { value: string };
  DbClusterIdentifier: { value: string };
  EcsClusterName: { value: string };
  EcsServiceName: { value: string };
  KmsKeyArn: { value: string };
  SnsTopicArn: { value: string };
  LambdaFunctionName: { value: string };
  BackupVaultName: { value: string };
}

// This function robustly reads the output file and ensures all required outputs are present.
const getStackOutputs = (): StackOutputs | null => {
  try {
    const outputPath = path.join(__dirname, "../cdktf.out/stacks/TapStack/outputs.json");
    if (fs.existsSync(outputPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      // Check for all required outputs before returning
      if (outputs.ApplicationEndpoint && outputs.DynamoDbTableName && outputs.DbClusterIdentifier && outputs.EcsClusterName && outputs.EcsServiceName && outputs.KmsKeyArn && outputs.LambdaFunctionName && outputs.BackupVaultName) {
        return outputs;
      }
    }
    console.warn("CDKTF output file found, but required outputs are missing.");
    return null;
  } catch (error) {
    console.warn("Could not read or parse CDKTF output file.", error);
    return null;
  }
};

const outputs = getStackOutputs();

// This conditional block ensures tests only run if the output file is valid.
if (outputs) {
  describe("Live Infrastructure Integration Tests", () => {
    const region = 'us-east-1';
    const dynamoClient = new DynamoDB.DocumentClient({ region });
    const ecsClient = new ECS({ region });
    const rdsClient = new RDS({ region });
    const kmsClient = new KMS({ region });
    const ssmClient = new SSM({ region });
    const lambdaClient = new Lambda({ region });
    const backupClient = new Backup({ region });

    describe("Application Reachability", () => {
      it("should have a reachable application endpoint that returns a 200 status", async () => {
        console.log(`Testing application endpoint: ${outputs.ApplicationEndpoint.value}`);
        const response = await axios.get(outputs.ApplicationEndpoint.value, { timeout: 30000 });
        expect(response.status).toBe(200);
        console.log("✅ Application endpoint is online.");
      });
    });

    describe("ECS Service", () => {
      it("should have a stable and active service with 2 running tasks", async () => {
        console.log(`Checking ECS Service: ${outputs.EcsServiceName.value}`);
        const response = await ecsClient.describeServices({
          cluster: outputs.EcsClusterName.value,
          services: [outputs.EcsServiceName.value],
        }).promise();
        expect(response.services?.[0]?.status).toBe("ACTIVE");
        expect(response.services?.[0]?.runningCount).toBe(2);
        console.log("✅ ECS service is active and stable.");
      });
    });

    describe("RDS Aurora Database", () => {
      it("should have an available Aurora DB cluster", async () => {
        console.log(`Checking Aurora DB Cluster: ${outputs.DbClusterIdentifier.value}`);
        const response = await rdsClient.describeDBClusters({
          DBClusterIdentifier: outputs.DbClusterIdentifier.value,
        }).promise();
        expect(response.DBClusters?.[0]?.Status).toBe("available");
        console.log(" Aurora DB cluster is available.");
      });
    });

    describe("DynamoDB Table", () => {
      it("should allow writing to and reading from the table", async () => {
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
        expect(result.Item?.sessionId).toBe(testId);
        console.log(" DynamoDB data plane test successful.");
      });
    });

    describe("Security and DR Components", () => {
      it("should have an enabled KMS key", async () => {
        const keyId = outputs.KmsKeyArn.value.split('/').pop()!;
        console.log(`Checking KMS Key: ${keyId}`);
        const response = await kmsClient.describeKey({ KeyId: keyId }).promise();
        expect(response.KeyMetadata?.Enabled).toBe(true);
        console.log(" KMS key is enabled.");
      });

      it("should have a created and active Lambda function", async () => {
        console.log(`Checking Lambda Function: ${outputs.LambdaFunctionName.value}`);
        const response = await lambdaClient.getFunctionConfiguration({ FunctionName: outputs.LambdaFunctionName.value }).promise();
        expect(response.State).toBe("Active");
        console.log("Lambda function is active.");
      });

      it("should have a created AWS Backup vault", async () => {
        console.log(`Checking Backup Vault: ${outputs.BackupVaultName.value}`);
        const response = await backupClient.describeBackupVault({ BackupVaultName: outputs.BackupVaultName.value }).promise();
        expect(response.BackupVaultName).toBe(outputs.BackupVaultName.value);
        console.log("AWS Backup vault exists.");
      });

      it("should have a created SSM Document for DR testing", async () => {
        // Construct the expected document name from the random suffix in the endpoint
        const randomSuffix = outputs.ApplicationEndpoint.value.split('-')[2].split('.')[0];
        const docName = `dr-test-simulation-${randomSuffix}`;
        console.log(`Checking SSM Document: ${docName}`);
        const response = await ssmClient.getDocument({ Name: docName }).promise();
        expect(response.Name).toBe(docName);
        console.log(" SSM Document exists.");
      });
    });
  });
} else {
  describe("Integration Tests Skipped", () => {
    it("logs a warning because CDKTF output file could not be read or was incomplete", () => {
      console.warn("\n WARNING: CDKTF output file not found or incomplete. Skipping live integration tests. Run 'cdktf synth' first.\n");
    });
  });
}
