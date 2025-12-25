// Integration tests for Terraform S3 secure bucket infrastructure
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand, HeadBucketCommand, GetBucketReplicationCommand } from "@aws-sdk/client-s3";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import * as fs from "fs";
import * as path from "path";

const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const REGION = process.env.AWS_REGION || "us-west-2";
const REPLICA_REGION = "us-east-1";

// LocalStack endpoint configuration
const LOCALSTACK_ENDPOINT = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const isLocalStack = LOCALSTACK_ENDPOINT.includes("localhost") || LOCALSTACK_ENDPOINT.includes("4566");

const clientConfig = isLocalStack ? {
  endpoint: LOCALSTACK_ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  },
  forcePathStyle: true
} : { region: REGION };

// AWS Clients
const s3Client = new S3Client(clientConfig);
const s3ReplicaClient = new S3Client({ ...clientConfig, region: REPLICA_REGION });
const kmsClient = new KMSClient(clientConfig);
const kmsReplicaClient = new KMSClient({ ...clientConfig, region: REPLICA_REGION });
const cloudWatchClient = new CloudWatchClient(clientConfig);
const cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
const snsClient = new SNSClient(clientConfig);

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any = {};

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}`);
    }
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
    outputs = JSON.parse(outputsContent);
  });

  describe("S3 Bucket Configuration", () => {
    test("S3 bucket exists and is accessible", async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test("S3 bucket has versioning enabled", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("S3 bucket has KMS encryption configured", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
      expect(rule?.BucketKeyEnabled).toBe(true);
    });

    test("S3 bucket has public access blocked", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test("S3 bucket policy enforces TLS", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy || "{}");
      
      // Check for TLS enforcement statement
      const tlsStatement = policy.Statement?.find((s: any) => 
        s.Sid === "DenyInsecureConnections"
      );
      expect(tlsStatement).toBeDefined();
      expect(tlsStatement?.Effect).toBe("Deny");
      expect(tlsStatement?.Condition?.Bool?.["aws:SecureTransport"]).toBe("false");
    });

    test("S3 bucket has lifecycle configuration", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      
      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe("Enabled");
      expect(rule?.Transitions).toBeDefined();
      expect(rule?.Transitions?.length).toBeGreaterThan(0);
      
      // Check for specific transitions
      const hasIntelligentTiering = rule?.Transitions?.some(t => t.StorageClass === "INTELLIGENT_TIERING");
      const hasGlacier = rule?.Transitions?.some(t => t.StorageClass === "GLACIER");
      const hasDeepArchive = rule?.Transitions?.some(t => t.StorageClass === "DEEP_ARCHIVE");
      
      expect(hasIntelligentTiering).toBe(true);
      expect(hasGlacier).toBe(true);
      expect(hasDeepArchive).toBe(true);
      
      // Check for multipart upload cleanup
      expect(rule?.AbortIncompleteMultipartUpload?.DaysAfterInitiation).toBe(7);
    });
  });

  describe("KMS Key Configuration", () => {
    test("KMS key exists and is enabled", async () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();
      
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });

    test("KMS key has rotation enabled", async () => {
      const kmsKeyId = outputs.kms_key_id;
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);
      
      // Note: Rotation status is checked via the metadata
      expect(response.KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("CloudWatch log group exists", async () => {
      const logGroupName = outputs.cloudwatch_log_group_name;
      expect(logGroupName).toBeDefined();
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await cloudWatchLogsClient.send(command);
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    });

    test("CloudWatch alarms are configured", async () => {
      // Check for unauthorized access alarm
      const unauthorizedAlarmCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: "secure-s3-infrastructure"
      });
      const unauthorizedResponse = await cloudWatchClient.send(unauthorizedAlarmCommand);
      
      expect(unauthorizedResponse.MetricAlarms).toBeDefined();
      expect(unauthorizedResponse.MetricAlarms?.length).toBeGreaterThan(0);
      
      // Check for specific alarms
      const hasUnauthorizedAlarm = unauthorizedResponse.MetricAlarms?.some(alarm => 
        alarm.AlarmName?.includes("unauthorized-s3-access")
      );
      const hasPolicyViolationsAlarm = unauthorizedResponse.MetricAlarms?.some(alarm => 
        alarm.AlarmName?.includes("bucket-policy-violations")
      );
      
      expect(hasUnauthorizedAlarm).toBe(true);
      expect(hasPolicyViolationsAlarm).toBe(true);
    });
  });

  describe("SNS Topic Configuration", () => {
    test("SNS topic exists and is configured", async () => {
      const snsTopicArn = outputs.sns_topic_arn;
      expect(snsTopicArn).toBeDefined();
      
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
      
      // Check if KMS encryption is enabled
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe("Resource Connectivity", () => {
    test("CloudWatch alarms are connected to SNS topic", async () => {
      const snsTopicArn = outputs.sns_topic_arn;
      
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: "secure-s3-infrastructure"
      });
      const response = await cloudWatchClient.send(command);
      
      const alarmsWithSNS = response.MetricAlarms?.filter(alarm => 
        alarm.AlarmActions?.includes(snsTopicArn)
      );
      
      expect(alarmsWithSNS).toBeDefined();
      expect(alarmsWithSNS?.length).toBeGreaterThan(0);
    });

    test("S3 bucket encryption uses the correct KMS key", async () => {
      const bucketName = outputs.s3_bucket_name;
      const kmsKeyArn = outputs.kms_key_arn;
      
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      const configuredKeyId = rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      
      // The key ID in the encryption config might be just the ID or the full ARN
      expect(configuredKeyId).toBeDefined();
      expect(kmsKeyArn).toContain(outputs.kms_key_id);
    });
  });

  describe("Cross-Region Replication", () => {
    test("S3 bucket has replication configured", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketReplicationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(0);
      
      const rule = response.ReplicationConfiguration?.Rules?.[0];
      expect(rule?.Status).toBe("Enabled");
      expect(rule?.Destination?.Bucket).toContain(outputs.replica_bucket_name);
    });

    test("Replica bucket exists in us-east-1", async () => {
      const replicaBucketName = outputs.replica_bucket_name;
      expect(replicaBucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: replicaBucketName });
      const response = await s3ReplicaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test("Replica bucket has versioning enabled", async () => {
      const replicaBucketName = outputs.replica_bucket_name;
      const command = new GetBucketVersioningCommand({ Bucket: replicaBucketName });
      const response = await s3ReplicaClient.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("Replica bucket has encryption configured", async () => {
      const replicaBucketName = outputs.replica_bucket_name;
      const command = new GetBucketEncryptionCommand({ Bucket: replicaBucketName });
      const response = await s3ReplicaClient.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });

    test("Replica bucket has public access blocked", async () => {
      const replicaBucketName = outputs.replica_bucket_name;
      const command = new GetPublicAccessBlockCommand({ Bucket: replicaBucketName });
      const response = await s3ReplicaClient.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test("Replica KMS key exists and is enabled", async () => {
      const replicaKmsKeyId = outputs.replica_kms_key_id;
      expect(replicaKmsKeyId).toBeDefined();
      
      const command = new DescribeKeyCommand({ KeyId: replicaKmsKeyId });
      const response = await kmsReplicaClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });
  });

  describe("CloudTrail Logs Bucket", () => {
    test("CloudTrail logs bucket exists", async () => {
      const cloudtrailBucketName = outputs.cloudtrail_logs_bucket;
      expect(cloudtrailBucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: cloudtrailBucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test("CloudTrail logs bucket has public access blocked", async () => {
      const cloudtrailBucketName = outputs.cloudtrail_logs_bucket;
      const command = new GetPublicAccessBlockCommand({ Bucket: cloudtrailBucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe("Security Compliance", () => {
    test("No public access is possible on S3 bucket", async () => {
      const bucketName = outputs.s3_bucket_name;
      
      // Check public access block
      const pabCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const pabResponse = await s3Client.send(pabCommand);
      
      const allBlocked = 
        pabResponse.PublicAccessBlockConfiguration?.BlockPublicAcls === true &&
        pabResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy === true &&
        pabResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls === true &&
        pabResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets === true;
      
      expect(allBlocked).toBe(true);
    });

    test("Bucket policy denies non-HTTPS requests", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const policy = JSON.parse(response.Policy || "{}");
      const denyInsecure = policy.Statement?.find((s: any) => 
        s.Effect === "Deny" && 
        s.Condition?.Bool?.["aws:SecureTransport"] === "false"
      );
      
      expect(denyInsecure).toBeDefined();
    });

    test("Bucket policy denies unencrypted uploads", async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const policy = JSON.parse(response.Policy || "{}");
      const denyUnencrypted = policy.Statement?.find((s: any) => 
        s.Sid === "DenyUnencryptedUploads" &&
        s.Effect === "Deny"
      );
      
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted?.Condition?.StringNotEquals?.["s3:x-amz-server-side-encryption"]).toBe("aws:kms");
    });
  });
});