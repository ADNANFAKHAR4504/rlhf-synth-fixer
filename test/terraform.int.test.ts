import { AddJobFlowStepsCommand, DescribeClusterCommand, DescribeStepCommand, EMRClient } from "@aws-sdk/client-emr";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Expected Terraform outputs at ${outputsPath}. Ensure the deployment stage produces cfn-outputs/all-outputs.json before running integration tests.`
  );
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8")) as Record<string, string>;

const pickOutput = (...keys: string[]): string => {
  for (const key of keys) {
    if (outputs[key]) {
      return outputs[key];
    }
  }
  throw new Error(`Missing required output. Tried keys: ${keys.join(", ")}`);
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

const emrClient = new EMRClient({ region });
const s3Client = new S3Client({ region });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  jest.setTimeout(600_000); // allow up to 10 minutes for Spark step execution

  test("cluster is configured for secure, compliant big data processing", async () => {
    const describe = await emrClient.send(
      new DescribeClusterCommand({
        ClusterId: clusterId,
      })
    );

    const cluster = describe.Cluster;
    expect(cluster).toBeTruthy();
    expect(cluster?.ReleaseLabel).toMatch(/^emr-6\.9\./);
    expect(cluster?.TerminationProtected).toBe(true);
    expect(cluster?.StepConcurrencyLevel).toBeGreaterThanOrEqual(1);
    expect(cluster?.SecurityConfiguration).toBe(emrSecurityConfig);
    expect(cluster?.Ec2InstanceAttributes?.EmrManagedMasterSecurityGroup).toBeTruthy();
    expect(cluster?.Ec2InstanceAttributes?.EmrManagedSlaveSecurityGroup).toBeTruthy();
  });

  test("end-to-end testing: trading analytics workflow processes daily trades", async () => {
    const testId = `itest-${Date.now()}`;
    const rawKey = `integration-tests/${testId}/input/trades.csv`;
    const scriptKey = `integration-tests/${testId}/spark_job.py`;
    const outputPrefix = `integration-tests/${testId}/output`;

    const cleanup = async () => {
      await Promise.allSettled([
        s3Client.send(new DeleteObjectCommand({ Bucket: rawBucket, Key: rawKey })),
        s3Client.send(new DeleteObjectCommand({ Bucket: logsBucket, Key: scriptKey })),
        (async () => {
          const listed = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: curatedBucket,
              Prefix: `${outputPrefix}/`,
            })
          );
          if (listed.Contents && listed.Contents.length > 0) {
            await s3Client.send(
              new DeleteObjectsCommand({
                Bucket: curatedBucket,
                Delete: {
                  Objects: listed.Contents.map((object) => ({ Key: object.Key! })),
                },
              })
            );
          }
        })(),
      ]);
    };

    const sampleCsv = [
      "trade_id,symbol,price,quantity",
      "1,ABC,100.50,10",
      "2,ABC,101.25,5",
      "3,XYZ,55.10,20",
      "4,XYZ,56.40,4",
    ].join("\n");

    const sparkScript = `
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("integration-test-trading-dataset").getOrCreate()
df = spark.read.option("header", "true").csv("s3://${rawBucket}/${rawKey}")
df = df.selectExpr("symbol", "cast(price as double) as price", "cast(quantity as int) as quantity")
summary = df.groupBy("symbol").agg({"price": "avg", "quantity": "sum"}).withColumnRenamed("avg(price)", "avg_price").withColumnRenamed("sum(quantity)", "total_quantity")
summary.coalesce(1).write.mode("overwrite").option("header", "true").csv("s3://${curatedBucket}/${outputPrefix}")
spark.stop()
`.trim();

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: rawBucket,
          Key: rawKey,
          Body: sampleCsv,
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: logsBucket,
          Key: scriptKey,
          Body: sparkScript,
        })
      );

      const stepResponse = await emrClient.send(
        new AddJobFlowStepsCommand({
          JobFlowId: clusterId,
          Steps: [
            {
              Name: `integration-${testId}`,
              ActionOnFailure: "CONTINUE",
              HadoopJarStep: {
                Jar: "command-runner.jar",
                Args: [
                  "spark-submit",
                  "--deploy-mode",
                  "cluster",
                  `s3://${logsBucket}/${scriptKey}`,
                ],
              },
            },
          ],
        })
      );

      const stepId = stepResponse.StepIds?.[0];
      expect(stepId).toBeTruthy();

      let finalState: string | undefined;
      const maxAttempts = 80; // ~20 minutes total
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await sleep(15_000);
        const status = await emrClient.send(
          new DescribeStepCommand({
            ClusterId: clusterId,
            StepId: stepId!,
          })
        );
        finalState = status.Step?.Status?.State;
        if (finalState && ["COMPLETED", "FAILED", "CANCELLED", "INTERRUPTED"].includes(finalState)) {
          break;
        }
      }

      expect(finalState).toBe("COMPLETED");

      const outputListing = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: curatedBucket,
          Prefix: `${outputPrefix}/`,
        })
      );

      const dataObjects = (outputListing.Contents || []).filter((obj) => obj.Key && obj.Key.endsWith(".csv"));
      expect(dataObjects.length).toBeGreaterThan(0);

      const csvObject = dataObjects[0];
      expect(csvObject?.Key).toBeTruthy();

      const csvGet = await s3Client.send(
        new GetObjectCommand({
          Bucket: curatedBucket,
          Key: csvObject!.Key!,
        })
      );

      const csvContent = await streamToString(csvGet.Body as Readable);
      const rows = csvContent
        .trim()
        .split("\n")
        .map((line) => line.split(",").map((col) => col.trim()));

      expect(rows.length).toBeGreaterThan(1);
      const header = rows[0];
      expect(header).toEqual(["symbol", "avg_price", "total_quantity"]);

      const summary = Object.fromEntries(
        rows.slice(1).map((cols) => [
          cols[0],
          {
            avg: parseFloat(cols[1]),
            quantity: parseInt(cols[2], 10),
          },
        ])
      );

      expect(summary.ABC).toBeDefined();
      expect(summary.XYZ).toBeDefined();
      expect(summary.ABC.avg).toBeCloseTo(100.875, 3);
      expect(summary.ABC.quantity).toBe(15);
      expect(summary.XYZ.avg).toBeCloseTo(55.75, 2);
      expect(summary.XYZ.quantity).toBe(24);
    } finally {
      await cleanup();
    }
  });
});
