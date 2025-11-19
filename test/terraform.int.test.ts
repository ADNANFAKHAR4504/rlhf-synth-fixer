import { DescribeClusterCommand, EMRClient } from "@aws-sdk/client-emr";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

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

const emrClient = new EMRClient({ region });
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
  jest.setTimeout(60_000); // allow up to 1 minute for integration tests

  test("cluster is configured for secure, compliant big data processing", async () => {
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
    expect(cluster?.TerminationProtected).toBe(true);
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
    
    // Verify cluster has instances
    expect(cluster?.Status?.StateMachine).toBeTruthy();
  });
});
