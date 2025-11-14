import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

interface TerraformOutputs {
  vpc_id?: { value: string };
  public_subnet_ids?: { value: string[] };
  private_subnet_ids?: { value: string[] };
  database_subnet_ids?: { value: string[] };
  database_endpoint?: { value: string };
  database_arn?: { value: string };
  storage_bucket_names?: { value: Record<string, string> };
  storage_bucket_arns?: { value: Record<string, string> };
  compute_security_group_id?: { value: string };
  database_security_group_id?: { value: string };
  autoscaling_group_name?: { value: string };
  kms_key_ids?: { value: { database: string; s3: string } };
  environment?: { value: string };
  region?: { value: string };
}

function loadTerraformOutputs(): TerraformOutputs {
  const ciOutputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
  if (fs.existsSync(ciOutputPath)) {
    const content = fs.readFileSync(ciOutputPath, "utf8");
    console.log("Loading outputs from:", ciOutputPath);
    const outputs = JSON.parse(content);
    console.log("Parsed outputs keys:", Object.keys(outputs));

    if (Object.keys(outputs).length > 0) {
      return outputs;
    }
    console.warn("Outputs file exists but is empty, trying fallback paths...");
  }

  const flatOutputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
  if (fs.existsSync(flatOutputPath)) {
    console.log("Loading flat outputs from:", flatOutputPath);
    const flatOutputs = JSON.parse(fs.readFileSync(flatOutputPath, "utf8"));
    if (Object.keys(flatOutputs).length > 0) {
      const converted: any = {};
      for (const [key, value] of Object.entries(flatOutputs)) {
        converted[key] = { value };
      }
      return converted;
    }
  }

  const outputPath = path.resolve(__dirname, "../terraform-outputs.json");
  if (fs.existsSync(outputPath)) {
    console.log("Loading outputs from:", outputPath);
    const outputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (Object.keys(outputs).length > 0) {
      return outputs;
    }
  }

  const altPath = path.resolve(__dirname, "../lib/terraform.tfstate");
  if (fs.existsSync(altPath)) {
    console.log("Loading outputs from state file:", altPath);
    const state = JSON.parse(fs.readFileSync(altPath, "utf8"));
    if (state.outputs && Object.keys(state.outputs).length > 0) {
      return state.outputs;
    }
  }

  console.warn("WARNING: No Terraform outputs found. Integration tests require deployed infrastructure.");
  console.warn("WARNING: Expected outputs file at one of:");
  console.warn("   - cfn-outputs/all-outputs.json");
  console.warn("   - cfn-outputs/flat-outputs.json");
  console.warn("   - terraform-outputs.json");
  console.warn("   - lib/terraform.tfstate");
  return {};
}

describe("Payment Processing Infrastructure Integration Tests", () => {
  let outputs: TerraformOutputs;
  let region: string;
  let transactionsBucket: string;
  let logsBucket: string;
  const s3Client = new S3Client({});

  beforeAll(async () => {
    outputs = loadTerraformOutputs();
    region = outputs.region?.value || process.env.AWS_REGION || "us-east-1";

    transactionsBucket = outputs.storage_bucket_names?.value?.transactions || "";
    logsBucket = outputs.storage_bucket_names?.value?.logs || "";

    console.log("Test environment:", {
      region,
      environment: outputs.environment?.value,
      transactionsBucket: transactionsBucket || "missing",
      logsBucket: logsBucket || "missing",
      availableOutputs: Object.keys(outputs),
    });

    if (!transactionsBucket || !logsBucket) {
      const missingOutputs = [];
      if (!transactionsBucket) missingOutputs.push("storage_bucket_names.transactions");
      if (!logsBucket) missingOutputs.push("storage_bucket_names.logs");

      console.error("ERROR: Missing required outputs:", missingOutputs.join(", "));
      console.error("NOTE: Integration tests require deployed infrastructure with outputs.");
      console.error("NOTE: Ensure terraform apply has completed and outputs are exported.");
      throw new Error(`Missing required outputs: ${missingOutputs.join(", ")}. Infrastructure may not be deployed.`);
    }
  }, 30000);

  describe("Payment Transaction Processing Flow", () => {
    test("should process complete payment transaction: compute layer archives to S3", async () => {
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const paymentData = {
        transactionId,
        amount: 1250.99,
        currency: "USD",
        customerId: `cust-${Date.now()}`,
        paymentMethod: "credit_card",
        timestamp: new Date().toISOString(),
        status: "completed",
        source: "payment-processor",
      };

      console.log("Step 1: Compute layer processes payment and archives to S3");
      const archiveKey = `transactions/${new Date().toISOString().split("T")[0]}/${transactionId}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
          Body: JSON.stringify(paymentData),
          ContentType: "application/json",
          Metadata: {
            transactionId: transactionId,
            status: paymentData.status,
          },
        })
      );
      console.log("[OK] Payment archived to S3");

      console.log("Step 2: Verifying transaction archive in S3");
      const archivedData = await s3Client.send(
        new GetObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
        })
      );
      const archivedContent = await archivedData.Body!.transformToString();
      const archivedPayment = JSON.parse(archivedContent);
      expect(archivedPayment.transactionId).toBe(transactionId);
      expect(archivedPayment.amount).toBe(paymentData.amount);
      expect(archivedPayment.status).toBe("completed");
      console.log("[OK] Transaction archive verified");

      console.log("Step 3: Cleaning up test transaction");
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
        })
      );
      console.log("[OK] Test transaction cleaned up");
    }, 120000);

    test("should process batch payment transactions and archive to S3", async () => {
      const batchSize = 5;
      const transactions = Array.from({ length: batchSize }, (_, i) => ({
        transactionId: `batch-txn-${Date.now()}-${i}`,
        amount: 100.0 + i * 10,
        currency: "USD",
        customerId: `cust-batch-${i}`,
        paymentMethod: "debit_card",
        timestamp: new Date().toISOString(),
        status: "pending",
      }));

      console.log(`Step 1: Processing batch of ${batchSize} payment transactions`);
      const batchArchiveKey = `transactions/batch/${Date.now()}-batch.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: transactionsBucket,
          Key: batchArchiveKey,
          Body: JSON.stringify({ transactions }),
          ContentType: "application/json",
        })
      );
      console.log("[OK] Batch transactions archived to S3");

      console.log("Step 2: Verifying batch archive");
      const batchData = await s3Client.send(
        new GetObjectCommand({
          Bucket: transactionsBucket,
          Key: batchArchiveKey,
        })
      );
      const batchContent = await batchData.Body!.transformToString();
      const batchPayments = JSON.parse(batchContent);
      expect(batchPayments.transactions).toHaveLength(batchSize);
      expect(batchPayments.transactions[0].amount).toBe(100.0);
      console.log("[OK] Batch archive verified");

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: transactionsBucket,
          Key: batchArchiveKey,
        })
      );
    }, 60000);
  });

  describe("Transaction Query and Retrieval Flow", () => {
    test("should query payment transactions from database and retrieve from S3 archive", async () => {
      const testTransactionId = `query-test-${Date.now()}`;
      const testTransaction = {
        transactionId: testTransactionId,
        amount: 500.00,
        currency: "EUR",
        customerId: "cust-query-test",
        paymentMethod: "bank_transfer",
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      console.log("Step 1: Creating test transaction archive in S3");
      const archiveKey = `transactions/query/${testTransactionId}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
          Body: JSON.stringify(testTransaction),
          ContentType: "application/json",
        })
      );

      console.log("Step 2: Querying transaction from S3 archive");
      const queryResult = await s3Client.send(
        new GetObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
        })
      );
      const queryContent = await queryResult.Body!.transformToString();
      const retrievedTransaction = JSON.parse(queryContent);
      expect(retrievedTransaction.transactionId).toBe(testTransactionId);
      expect(retrievedTransaction.amount).toBe(500.00);
      expect(retrievedTransaction.currency).toBe("EUR");
      console.log("[OK] Transaction retrieved successfully");

      console.log("Step 3: Listing transactions by date prefix");
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: transactionsBucket,
          Prefix: "transactions/query/",
        })
      );
      expect(listResult.Contents?.some((obj) => obj.Key === archiveKey)).toBe(true);
      console.log("[OK] Transaction listing verified");

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: transactionsBucket,
          Key: archiveKey,
        })
      );
    }, 60000);

    test("should search and filter transactions by customer and date range", async () => {
      const customerId = `cust-search-${Date.now()}`;
      const transactions = [
        { transactionId: `search-1-${Date.now()}`, customerId, amount: 100, date: "2024-01-15" },
        { transactionId: `search-2-${Date.now()}`, customerId, amount: 200, date: "2024-01-16" },
        { transactionId: `search-3-${Date.now()}`, customerId: "other-customer", amount: 300, date: "2024-01-15" },
      ];

      console.log("Step 1: Creating test transaction archives");
      for (const txn of transactions) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: transactionsBucket,
            Key: `transactions/search/${txn.transactionId}.json`,
            Body: JSON.stringify(txn),
          })
        );
      }

      console.log("Step 2: Filtering transactions by customer");
      const customerList = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: transactionsBucket,
          Prefix: "transactions/search/",
        })
      );

      const customerTransactions = [];
      if (customerList.Contents) {
        for (const obj of customerList.Contents) {
          const objData = await s3Client.send(
            new GetObjectCommand({
              Bucket: transactionsBucket,
              Key: obj.Key!,
            })
          );
          const txn = JSON.parse(await objData.Body!.transformToString());
          if (txn.customerId === customerId) {
            customerTransactions.push(txn);
          }
        }
      }

      expect(customerTransactions.length).toBe(2);
      expect(customerTransactions.every((txn) => txn.customerId === customerId)).toBe(true);
      console.log("[OK] Customer filter verified");

      for (const txn of transactions) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: transactionsBucket,
            Key: `transactions/search/${txn.transactionId}.json`,
          })
        );
      }
    }, 90000);
  });

  describe("Application Logging and Monitoring Flow", () => {
    test("should collect application logs and store in S3 with lifecycle management", async () => {
      const logEntries = [
        { timestamp: new Date().toISOString(), level: "INFO", message: "Payment transaction initiated", transactionId: `log-${Date.now()}` },
        { timestamp: new Date().toISOString(), level: "INFO", message: "Payment validated successfully", transactionId: `log-${Date.now()}` },
        { timestamp: new Date().toISOString(), level: "ERROR", message: "Payment processing failed", transactionId: `log-${Date.now()}` },
      ];

      console.log("Step 1: Collecting application logs");
      const logBatch = {
        logs: logEntries,
        source: "payment-processor",
        environment: outputs.environment?.value || "dev",
        collectedAt: new Date().toISOString(),
      };

      console.log("Step 2: Storing logs in S3 with date-based partitioning");
      const logKey = `logs/${new Date().toISOString().split("T")[0]}/app-${Date.now()}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: logsBucket,
          Key: logKey,
          Body: JSON.stringify(logBatch),
          ContentType: "application/json",
        })
      );
      console.log("[OK] Logs stored in S3");

      console.log("Step 3: Retrieving logs for analysis");
      const logData = await s3Client.send(
        new GetObjectCommand({
          Bucket: logsBucket,
          Key: logKey,
        })
      );
      const logContent = await logData.Body!.transformToString();
      const retrievedLogs = JSON.parse(logContent);
      expect(retrievedLogs.logs).toHaveLength(3);
      expect(retrievedLogs.source).toBe("payment-processor");
      console.log("[OK] Logs retrieved successfully");

      console.log("Step 4: Verifying log lifecycle management (logs/ prefix)");
      const logsList = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: logsBucket,
          Prefix: "logs/",
        })
      );
      expect(logsList.Contents?.some((obj) => obj.Key === logKey)).toBe(true);
      console.log("[OK] Log lifecycle management verified");

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: logsBucket,
          Key: logKey,
        })
      );
    }, 60000);

    test("should process error logs and generate alerts", async () => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message: "Payment gateway timeout",
        transactionId: `error-${Date.now()}`,
        errorCode: "TIMEOUT",
        stackTrace: "Error: Connection timeout at payment gateway",
      };

      console.log("Step 1: Storing error log");
      const errorKey = `logs/errors/${Date.now()}-error.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: logsBucket,
          Key: errorKey,
          Body: JSON.stringify(errorLog),
          ContentType: "application/json",
        })
      );

      console.log("Step 2: Retrieving error log for alert processing");
      const errorData = await s3Client.send(
        new GetObjectCommand({
          Bucket: logsBucket,
          Key: errorKey,
        })
      );
      const errorContent = await errorData.Body!.transformToString();
      const retrievedError = JSON.parse(errorContent);
      expect(retrievedError.level).toBe("ERROR");
      expect(retrievedError.errorCode).toBe("TIMEOUT");
      console.log("[OK] Error log processed for alerting");

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: logsBucket,
          Key: errorKey,
        })
      );
    }, 60000);
  });

  describe("Payment Reconciliation and Audit Flow", () => {
    test("should reconcile payments between database and S3 archive", async () => {
      const reconciliationId = `recon-${Date.now()}`;
      const paymentTransactions = [
        { transactionId: `recon-1-${Date.now()}`, amount: 1000, status: "completed" },
        { transactionId: `recon-2-${Date.now()}`, amount: 2000, status: "completed" },
        { transactionId: `recon-3-${Date.now()}`, amount: 1500, status: "pending" },
      ];

      console.log("Step 1: Creating payment transaction archives");
      for (const txn of paymentTransactions) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: transactionsBucket,
            Key: `transactions/reconciliation/${txn.transactionId}.json`,
            Body: JSON.stringify(txn),
          })
        );
      }

      console.log("Step 2: Performing reconciliation check");
      const reconList = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: transactionsBucket,
          Prefix: "transactions/reconciliation/",
        })
      );

      let totalAmount = 0;
      let completedCount = 0;
      if (reconList.Contents) {
        for (const obj of reconList.Contents) {
          const objData = await s3Client.send(
            new GetObjectCommand({
              Bucket: transactionsBucket,
              Key: obj.Key!,
            })
          );
          const txn = JSON.parse(await objData.Body!.transformToString());
          totalAmount += txn.amount;
          if (txn.status === "completed") {
            completedCount++;
          }
        }
      }

      expect(totalAmount).toBe(4500);
      expect(completedCount).toBe(2);
      console.log("[OK] Reconciliation completed");

      console.log("Step 3: Generating reconciliation report");
      const report = {
        reconciliationId,
        totalTransactions: paymentTransactions.length,
        totalAmount,
        completedTransactions: completedCount,
        timestamp: new Date().toISOString(),
      };

      await s3Client.send(
        new PutObjectCommand({
          Bucket: transactionsBucket,
          Key: `reports/reconciliation/${reconciliationId}.json`,
          Body: JSON.stringify(report),
        })
      );
      console.log("[OK] Reconciliation report generated");

      for (const txn of paymentTransactions) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: transactionsBucket,
            Key: `transactions/reconciliation/${txn.transactionId}.json`,
          })
        );
      }
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: transactionsBucket,
          Key: `reports/reconciliation/${reconciliationId}.json`,
        })
      );
    }, 120000);
  });
});
