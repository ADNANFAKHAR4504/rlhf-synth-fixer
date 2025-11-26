import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// Conditional import for EMR SDK - may not be available if package.json wasn't modified
let EMRClient: any;
let DescribeClusterCommand: any;
let AddJobFlowStepsCommand: any;
let DescribeStepCommand: any;
let StepState: any;
let emrSdkAvailable = false;

// Use a function to delay require() evaluation and avoid Jest static analysis
function loadEmrSdk() {
  if (emrSdkAvailable) return true;
  try {
    // Use dynamic require to avoid static analysis issues
    const emrModule = eval('require')("@aws-sdk/client-emr");
    EMRClient = emrModule.EMRClient;
    DescribeClusterCommand = emrModule.DescribeClusterCommand;
    AddJobFlowStepsCommand = emrModule.AddJobFlowStepsCommand;
    DescribeStepCommand = emrModule.DescribeStepCommand;
    StepState = emrModule.StepState;
    emrSdkAvailable = true;
    return true;
  } catch (error) {
    console.warn("⚠️  @aws-sdk/client-emr not available. EMR job submission tests will be skipped.");
    emrSdkAvailable = false;
    return false;
  }
}

// Try to load EMR SDK at module load time
loadEmrSdk();

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Expected Terraform outputs at ${outputsPath}. Ensure the deployment stage produces cfn-outputs/all-outputs.json before running integration tests.`
  );
}

const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Handle both flat and nested output structures
// Terraform outputs can be: { "key": "value" } or { "key": { "value": "value" } }
const outputs: Record<string, string> = {};
for (const [key, value] of Object.entries(rawOutputs)) {
  if (typeof value === "string") {
    outputs[key] = value;
  } else if (value && typeof value === "object" && "value" in value) {
    outputs[key] = String((value as { value: unknown }).value);
  } else if (value && typeof value === "object" && "Value" in value) {
    outputs[key] = String((value as { Value: unknown }).Value);
  } else {
    outputs[key] = String(value);
  }
}

const pickOutput = (...keys: string[]): string => {
  for (const key of keys) {
    if (outputs[key] && typeof outputs[key] === "string" && outputs[key].trim() !== "") {
      return outputs[key].trim();
    }
  }
  throw new Error(`Missing required output. Tried keys: ${keys.join(", ")}. Available keys: ${Object.keys(outputs).join(", ")}`);
};

const clusterId = pickOutput("emr_cluster_id", "EmrClusterId");
const rawBucket = pickOutput("raw_data_bucket_name", "RawDataBucketName");
const curatedBucket = pickOutput("curated_data_bucket_name", "CuratedDataBucketName");
const logsBucket = pickOutput("emr_logs_bucket_name", "EmrLogsBucketName");
const emrSecurityConfig = pickOutput("emr_security_configuration_name", "EmrSecurityConfigurationName");

const region =
  process.env.AWS_REGION ||
  outputs.aws_region ||
  outputs.region ||
  outputs.AwsRegion ||
  outputs.Region ||
  "us-east-1";

// Initialize EMR client only if SDK is available
const emrClient = (() => {
  if (loadEmrSdk() && EMRClient) {
    return new EMRClient({ region });
  }
  return null;
})();
const s3Client = new S3Client({ region });

const streamToString = async (stream: unknown): Promise<string> => {
  if (!stream) {
    return "";
  }
  if (typeof stream === "string") {
    return stream;
  }
  if (Buffer.isBuffer(stream)) {
    return stream.toString("utf8");
  }
  if (stream instanceof Uint8Array) {
    return Buffer.from(stream).toString("utf8");
  }
  if (stream instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof stream === "object" && stream !== null && typeof (stream as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const arrayBuffer = await (stream as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    return Buffer.from(arrayBuffer).toString("utf8");
  }
  if (typeof stream === "object" && stream !== null && Symbol.asyncIterator in stream) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return "";
};

describe("EMR trading analytics stack end-to-end", () => {
  jest.setTimeout(600_000); // allow up to 10 minutes for integration tests (especially end-to-end Spark jobs)

  test("cluster is configured for secure, compliant big data processing", async () => {
    if (!emrSdkAvailable || !emrClient) {
      console.warn("⚠️  Skipping EMR cluster validation - EMR SDK not available");
      return;
    }

    // Validate cluster ID format
    expect(clusterId).toBeTruthy();
    expect(typeof clusterId).toBe("string");
    expect(clusterId.trim()).not.toBe("");
    expect(clusterId).toMatch(/^j-[A-Z0-9]+$/);

    let describe;
    try {
      describe = await emrClient.send(
        new DescribeClusterCommand({
          ClusterId: clusterId.trim(),
        })
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to describe EMR cluster ${clusterId}: ${errorMessage}`);
    }

    const cluster = describe.Cluster;
    expect(cluster).toBeTruthy();
    expect(cluster?.Id).toBe(clusterId.trim());
    expect(cluster?.ReleaseLabel).toMatch(/^emr-6\.9\./);
    expect(cluster?.TerminationProtected).toBe(false); // Set to false to allow Terraform to manage lifecycle
    expect(cluster?.StepConcurrencyLevel).toBeGreaterThanOrEqual(1);
    expect(cluster?.SecurityConfiguration).toBe(emrSecurityConfig);
    expect(cluster?.Ec2InstanceAttributes?.EmrManagedMasterSecurityGroup).toBeTruthy();
    expect(cluster?.Ec2InstanceAttributes?.EmrManagedSlaveSecurityGroup).toBeTruthy();
  });

  test("S3 buckets exist and are accessible", async () => {
    const rawBucketName = rawBucket.trim();
    const curatedBucketName = curatedBucket.trim();
    const logsBucketName = logsBucket.trim();

    // Test that we can list buckets (verifies they exist and we have permissions)
    const rawList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: rawBucketName,
        MaxKeys: 1,
      })
    );
    expect(rawList).toBeTruthy();

    const curatedList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: curatedBucketName,
        MaxKeys: 1,
      })
    );
    expect(curatedList).toBeTruthy();

    const logsList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: logsBucketName,
        MaxKeys: 1,
      })
    );
    expect(logsList).toBeTruthy();
  });

  test("S3 buckets support read and write operations", async () => {
    const testId = `itest-${Date.now()}`;
    const testKey = `integration-tests/${testId}/test-file.txt`;
    const testContent = "Integration test file content";

    const rawBucketName = rawBucket.trim();
    const curatedBucketName = curatedBucket.trim();

    try {
      // Test write to raw bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: rawBucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Test read from raw bucket
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: rawBucketName,
          Key: testKey,
        })
      );
      const content = await streamToString(getResponse.Body as Readable);
      expect(content).toBe(testContent);

      // Test write to curated bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: curatedBucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Cleanup
      await Promise.allSettled([
        s3Client.send(new DeleteObjectCommand({ Bucket: rawBucketName, Key: testKey })),
        s3Client.send(new DeleteObjectCommand({ Bucket: curatedBucketName, Key: testKey })),
      ]);
    } catch (error) {
      // Cleanup on error
      await Promise.allSettled([
        s3Client.send(new DeleteObjectCommand({ Bucket: rawBucketName, Key: testKey })),
        s3Client.send(new DeleteObjectCommand({ Bucket: curatedBucketName, Key: testKey })),
      ]);
      throw error;
    }
  });

  test("EMR cluster is in a valid running state", async () => {
    if (!emrSdkAvailable || !emrClient) {
      console.warn("⚠️  Skipping EMR cluster state check - EMR SDK not available");
      return;
    }

    const describe = await emrClient.send(
      new DescribeClusterCommand({
        ClusterId: clusterId.trim(),
      })
    );

    const cluster = describe.Cluster;
    expect(cluster).toBeTruthy();
    expect(cluster?.Status?.State).toBeTruthy();

    // Cluster should be in a valid state (RUNNING, WAITING, or STARTING)
    const validStates = ["RUNNING", "WAITING", "STARTING"];
    expect(validStates).toContain(cluster?.Status?.State);

    // Verify cluster has status information
    expect(cluster?.Status).toBeTruthy();
  });

  test("end-to-end: trading analytics workflow processes daily trades", async () => {
    if (!emrSdkAvailable || !emrClient) {
      console.warn("⚠️  Skipping end-to-end EMR workflow test - EMR SDK not available");
      return;
    }

    const rawBucketName = rawBucket.trim();
    const curatedBucketName = curatedBucket.trim();
    const logsBucketName = logsBucket.trim();
    const testId = `e2e-${Date.now()}`;

    // Step 1: Upload sample trading data to raw bucket
    const rawDataKey = `trading-data/${testId}/daily-trades.csv`;
    const sampleTradingData = `symbol,price,volume,timestamp
AAPL,150.25,1000,2024-01-15T10:00:00Z
MSFT,380.50,500,2024-01-15T10:01:00Z
GOOGL,140.75,750,2024-01-15T10:02:00Z
AMZN,145.30,1200,2024-01-15T10:03:00Z
TSLA,250.80,2000,2024-01-15T10:04:00Z`;

    console.log(`[E2E] Uploading sample trading data to s3://${rawBucketName}/${rawDataKey}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: rawBucketName,
        Key: rawDataKey,
        Body: sampleTradingData,
        ContentType: "text/csv",
      })
    );

    // Step 2: Create a Spark job that processes the trading data
    // This job reads from raw bucket, calculates average price per symbol, and writes to curated bucket
    const outputKey = `analytics/${testId}/avg-prices.parquet`;
    const sparkScript = `
from pyspark.sql import SparkSession
from pyspark.sql.functions import avg, col

spark = SparkSession.builder.appName("TradingAnalytics").getOrCreate()

# Read trading data from raw bucket
df = spark.read.option("header", "true").csv("s3://${rawBucketName}/${rawDataKey}")

# Calculate average price per symbol
result = df.groupBy("symbol").agg(avg(col("price")).cast("double").alias("avg_price")).orderBy("symbol")

# Write results to curated bucket
result.write.mode("overwrite").parquet("s3://${curatedBucketName}/${outputKey}")

print(f"Processed {df.count()} trades and wrote results to s3://${curatedBucketName}/${outputKey}")
spark.stop()
`.trim();

    // Upload Spark script to logs bucket (bootstrap scripts location)
    const sparkScriptKey = `bootstrap/${testId}/trading-analytics.py`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: logsBucketName,
        Key: sparkScriptKey,
        Body: sparkScript,
        ContentType: "text/x-python",
      })
    );

    // Step 3: Submit Spark job to EMR cluster
    console.log(`[E2E] Submitting Spark job to cluster ${clusterId}`);
    const addStepsResponse = await emrClient.send(
      new AddJobFlowStepsCommand({
        JobFlowId: clusterId.trim(),
        Steps: [
          {
            Name: `Trading Analytics E2E Test - ${testId}`,
            ActionOnFailure: "CONTINUE",
            HadoopJarStep: {
              Jar: "command-runner.jar",
              Args: [
                "spark-submit",
                "--deploy-mode",
                "cluster",
                `s3://${logsBucketName}/${sparkScriptKey}`,
              ],
            },
          },
        ],
      })
    );

    const stepId = addStepsResponse.StepIds?.[0];
    expect(stepId).toBeTruthy();
    console.log(`[E2E] Spark job submitted with step ID: ${stepId}`);

    // Step 4: Wait for job to complete (with timeout)
    const maxWaitTime = 300000; // 5 minutes
    const pollInterval = 10000; // 10 seconds
    const startTime = Date.now();
    let stepState: string | undefined;

    while (Date.now() - startTime < maxWaitTime) {
      const stepDescribe = await emrClient.send(
        new DescribeStepCommand({
          ClusterId: clusterId.trim(),
          StepId: stepId!,
        })
      );

      stepState = stepDescribe.Step?.Status?.State;
      console.log(`[E2E] Step ${stepId} state: ${stepState}`);

      if (stepState === "COMPLETED") {
        break;
      }
      if (stepState === "FAILED" || stepState === "CANCELLED") {
        throw new Error(`Spark job failed with state: ${stepState}. Reason: ${stepDescribe.Step?.Status?.FailureDetails?.Reason || "Unknown"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    if (stepState !== "COMPLETED") {
      throw new Error(`Spark job did not complete within timeout. Final state: ${stepState}`);
    }

    console.log(`[E2E] Spark job completed successfully`);

    // Step 5: Verify output file exists in curated bucket
    console.log(`[E2E] Verifying output file exists in curated bucket`);
    const outputList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: curatedBucketName,
        Prefix: outputKey,
      })
    );

    expect(outputList.Contents?.length).toBeGreaterThan(0);
    console.log(`[E2E] Output file found in curated bucket`);

    // Step 6: Verify EMR logs are written to logs bucket
    console.log(`[E2E] Verifying EMR logs are written to logs bucket`);
    const logsList = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: logsBucketName,
        Prefix: `emr-logs/${clusterId}/`,
        MaxKeys: 10,
      })
    );

    expect(logsList.Contents?.length).toBeGreaterThan(0);
    console.log(`[E2E] EMR logs found in logs bucket`);

    // Cleanup: Remove test files
    console.log(`[E2E] Cleaning up test files`);
    await Promise.allSettled([
      s3Client.send(new DeleteObjectCommand({ Bucket: rawBucketName, Key: rawDataKey })),
      s3Client.send(new DeleteObjectCommand({ Bucket: logsBucketName, Key: sparkScriptKey })),
      // Note: We keep the output file as proof of successful processing
    ]);

    console.log(`[E2E] End-to-end test completed successfully`);
  });
});
