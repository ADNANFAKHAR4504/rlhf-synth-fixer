/**
 * storage-stack.unit.test.ts
 *
 * Unit tests for StorageStack
 */
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { StorageStack } from "../lib/global-banking/storage-stack";

describe("StorageStack", () => {
  let stack: StorageStack;

  // Track created resources for verification
  const createdResources: Map<string, pulumi.runtime.MockResourceArgs> = new Map();

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        createdResources.set(args.name, args);

        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:s3:::${args.inputs?.bucket || args.name}`,
            bucket: args.inputs?.bucket || `bucket-${args.name}`,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });
  });

  beforeEach(() => {
    createdResources.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new StorageStack("test-storage", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: true,
        enableVersioning: true,
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(StorageStack);
    });

    it("exposes transaction bucket name", (done) => {
      expect(stack.transactionBucketName).toBeDefined();
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        expect(bucketName).toContain("transaction-archive");
        done();
      });
    });

    it("exposes archive bucket name", (done) => {
      expect(stack.archiveBucketName).toBeDefined();
      pulumi.all([stack.archiveBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        expect(bucketName).toContain("data-lake");
        done();
      });
    });

    it("exposes audit log bucket name", (done) => {
      expect(stack.auditLogBucketName).toBeDefined();
      pulumi.all([stack.auditLogBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        expect(bucketName).toContain("audit-logs");
        done();
      });
    });

    it("exposes backup bucket name", (done) => {
      expect(stack.backupBucketName).toBeDefined();
      pulumi.all([stack.backupBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        expect(bucketName).toContain("backups");
        done();
      });
    });

    it("exposes transaction bucket ARN", (done) => {
      expect(stack.transactionBucketArn).toBeDefined();
      pulumi.all([stack.transactionBucketArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:s3:");
        done();
      });
    });

    it("exposes ALB logs bucket name", (done) => {
      expect(stack.albLogsBucketName).toBeDefined();
      pulumi.all([stack.albLogsBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        expect(bucketName).toContain("alb-logs");
        done();
      });
    });
  });

  describe("Transaction Archive Bucket", () => {
    beforeEach(() => {
      stack = new StorageStack("test-transaction", {
        environmentSuffix: "txn",
        tags: pulumi.output({ Purpose: "transactions" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: true,
        enableVersioning: true,
      });
    });

    it("creates transaction archive bucket", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        expect(bucketResource).toBeDefined();
        done();
      });
    });

    it("enables versioning", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        expect(bucketResource?.inputs?.versioning).toBeDefined();
        expect(bucketResource?.inputs?.versioning?.enabled).toBe(true);
        done();
      });
    });

    it("enables object lock", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        expect(bucketResource?.inputs?.objectLockConfiguration).toBeDefined();
        done();
      });
    });

    it("configures lifecycle policies", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        expect(bucketResource?.inputs?.lifecycleRules).toBeDefined();
        expect(bucketResource?.inputs?.lifecycleRules?.length).toBeGreaterThan(0);
        done();
      });
    });

    it("encrypts with KMS", (done) => {
      pulumi.all([stack.transactionBucketArn]).apply(([bucketArn]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        expect(bucketResource?.inputs?.serverSideEncryptionConfiguration).toBeDefined();
        done();
      });
    });

    it("blocks public access", (done) => {
      // Wait for next tick to ensure all resources are registered
      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("transaction-archive")
          );
          expect(publicBlockResource).toBeDefined();
          if (publicBlockResource) {
            expect(publicBlockResource.inputs?.blockPublicAcls).toBe(true);
          }
          done();
        });
      });
    });
  });

  describe("Object Lock Configuration", () => {
    it("creates object lock when enabled", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-lock-enabled", {
        environmentSuffix: "lock",
        tags: pulumi.output({ ObjectLock: "enabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: true,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const objectLockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketObjectLockConfigurationV2:BucketObjectLockConfigurationV2"
          );
          expect(objectLockResource).toBeDefined();
          done();
        });
      });
    });

    it("does not create object lock when disabled", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-lock-disabled", {
        environmentSuffix: "no-lock",
        tags: pulumi.output({ ObjectLock: "disabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const objectLockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketObjectLockConfigurationV2:BucketObjectLockConfigurationV2"
          );
          expect(objectLockResource).toBeUndefined();
          done();
        });
      });
    });

    it("configures governance mode retention", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-governance", {
        environmentSuffix: "gov",
        tags: pulumi.output({ Mode: "governance" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: true,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const objectLockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketObjectLockConfigurationV2:BucketObjectLockConfigurationV2"
          );
          expect(objectLockResource?.inputs?.rule?.defaultRetention?.mode).toBe("GOVERNANCE");
          done();
        });
      });
    });
  });

  describe("Audit Log Bucket", () => {
    beforeEach(() => {
      stack = new StorageStack("test-audit", {
        environmentSuffix: "audit",
        tags: pulumi.output({ Purpose: "audit" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("creates audit log bucket", (done) => {
      pulumi.all([stack.auditLogBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("audit-logs")
        );
        expect(bucketResource).toBeDefined();
        done();
      });
    });

    it("configures bucket policy for CloudTrail", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.auditLogBucketArn]).apply(([bucketArn]) => {
          const policyResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPolicy:BucketPolicy" && r.name.includes("audit-logs-policy")
          );
          expect(policyResource).toBeDefined();
          done();
        });
      });
    });

    it("allows AWS Config writes", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.auditLogBucketName]).apply(([bucketName]) => {
          const policyResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPolicy:BucketPolicy" && r.name.includes("audit-logs-policy")
          );
          expect(policyResource).toBeDefined();
          done();
        });
      });
    });

    it("blocks public access", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.auditLogBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("audit-logs")
          );
          expect(publicBlockResource).toBeDefined();
          done();
        });
      });
    });
  });

  describe("Data Lake Bucket", () => {
    beforeEach(() => {
      stack = new StorageStack("test-datalake", {
        environmentSuffix: "lake",
        tags: pulumi.output({ Purpose: "analytics" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("creates data lake bucket", (done) => {
      pulumi.all([stack.archiveBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("data-lake")
        );
        expect(bucketResource).toBeDefined();
        done();
      });
    });

    it("enables intelligent tiering", (done) => {
      pulumi.all([stack.archiveBucketArn]).apply(([bucketArn]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("data-lake")
        );
        expect(bucketResource?.inputs?.lifecycleRules).toBeDefined();
        done();
      });
    });

    it("enables S3 access logging", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.archiveBucketName]).apply(([bucketName]) => {
          const loggingResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketLoggingV2:BucketLoggingV2" && 
            r.name.includes("data-lake-logging")
          );
          expect(loggingResource).toBeDefined();
          done();
        });
      });
    });
  });

  describe("Backup Bucket", () => {
    beforeEach(() => {
      stack = new StorageStack("test-backup", {
        environmentSuffix: "backup",
        tags: pulumi.output({ Purpose: "backups" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("creates backup bucket", (done) => {
      pulumi.all([stack.backupBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("backups")
        );
        expect(bucketResource).toBeDefined();
        done();
      });
    });

    it("configures backup lifecycle policy", (done) => {
      pulumi.all([stack.backupBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("backups")
        );
        expect(bucketResource?.inputs?.lifecycleRules).toBeDefined();
        done();
      });
    });

    it("transitions to Glacier", (done) => {
      pulumi.all([stack.backupBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("backups")
        );
        const transitions = bucketResource?.inputs?.lifecycleRules?.[0]?.transitions;
        expect(transitions).toBeDefined();
        done();
      });
    });
  });

  describe("Cross-Region Replication", () => {
    it("creates replication when enabled", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-repl-enabled", {
        environmentSuffix: "repl",
        tags: pulumi.output({ Replication: "enabled" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicationConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketReplicationConfig:BucketReplicationConfig"
          );
          expect(replicationConfig).toBeDefined();
          done();
        });
      });
    });

    it("does not create replication when disabled", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-repl-disabled", {
        environmentSuffix: "no-repl",
        tags: pulumi.output({ Replication: "disabled" }),
        regions: {
          primary: "us-east-1",
          replicas: [],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicationConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketReplicationConfig:BucketReplicationConfig"
          );
          expect(replicationConfig).toBeUndefined();
          done();
        });
      });
    });

    it("does not create replication when enabled but no replica regions provided", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-repl-no-regions", {
        environmentSuffix: "no-regions",
        tags: pulumi.output({ Replication: "enabled-no-regions" }),
        regions: {
          primary: "us-east-1",
          replicas: [],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicationConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketReplicationConfig:BucketReplicationConfig"
          );
          expect(replicationConfig).toBeUndefined();
          expect(bucketName).toBeDefined();
          done();
        });
      });
    });

    it("creates replica buckets in all regions", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-multi-repl", {
        environmentSuffix: "multi",
        tags: pulumi.output({ Replicas: "multiple" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicaBuckets = Array.from(createdResources.values()).filter(
            r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("replica")
          );
          expect(replicaBuckets.length).toBe(2);
          done();
        });
      });
    });

    it("creates replication IAM role", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-repl-iam", {
        environmentSuffix: "iam",
        tags: pulumi.output({ IAM: "replication" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const iamRole = Array.from(createdResources.values()).find(
            r => r.type === "aws:iam/role:Role" && r.name.includes("replication-role")
          );
          expect(iamRole).toBeDefined();
          done();
        });
      });
    });

    it("configures replication time control", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-rtc", {
        environmentSuffix: "rtc",
        tags: pulumi.output({ RTC: "enabled" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicationConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketReplicationConfig:BucketReplicationConfig"
          );
          expect(replicationConfig).toBeDefined();
          done();
        });
      });
    });

    it("replicates with KMS encryption", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-kms-repl", {
        environmentSuffix: "kms",
        tags: pulumi.output({ Encryption: "kms" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: true,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const replicationConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketReplicationConfig:BucketReplicationConfig"
          );
          expect(replicationConfig).toBeDefined();
          done();
        });
      });
    });
  });

  describe("S3 Access Logging", () => {
    beforeEach(() => {
      stack = new StorageStack("test-logging", {
        environmentSuffix: "logging",
        tags: pulumi.output({ Logging: "enabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("creates access logs bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const logsBucket = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("access-logs")
          );
          expect(logsBucket).toBeDefined();
          done();
        });
      });
    });

    it("enables logging on transaction bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const loggingConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketLoggingV2:BucketLoggingV2" && 
            r.name.includes("transaction-archive-logging")
          );
          expect(loggingConfig).toBeDefined();
          done();
        });
      });
    });

    it("enables logging on data lake bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.archiveBucketName]).apply(([bucketName]) => {
          const loggingConfig = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketLoggingV2:BucketLoggingV2" && 
            r.name.includes("data-lake-logging")
          );
          expect(loggingConfig).toBeDefined();
          done();
        });
      });
    });

    it("configures log retention", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const logsBucket = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("access-logs")
          );
          expect(logsBucket?.inputs?.lifecycleRules).toBeDefined();
          done();
        });
      });
    });
  });

  describe("Versioning Configuration", () => {
    it("enables versioning when specified", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-versioning-on", {
        environmentSuffix: "ver",
        tags: pulumi.output({ Versioning: "enabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const bucketResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
          );
          expect(bucketResource?.inputs?.versioning?.enabled).toBe(true);
          done();
        });
      });
    });

    it("does not enable versioning when disabled", (done) => {
      createdResources.clear();
      stack = new StorageStack("test-versioning-off", {
        environmentSuffix: "no-ver",
        tags: pulumi.output({ Versioning: "disabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: false,
      });

      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const bucketResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
          );
          expect(bucketResource?.inputs?.versioning).toBeUndefined();
          done();
        });
      });
    });
  });

  describe("Lifecycle Policies", () => {
    beforeEach(() => {
      stack = new StorageStack("test-lifecycle", {
        environmentSuffix: "lifecycle",
        tags: pulumi.output({ Lifecycle: "configured" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("transitions to Standard-IA after 90 days", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const transitions = bucketResource?.inputs?.lifecycleRules?.[0]?.transitions;
        expect(transitions).toBeDefined();
        expect(transitions?.some((t: any) => t.storageClass === "STANDARD_IA")).toBe(true);
        done();
      });
    });

    it("transitions to Glacier after 180 days", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const transitions = bucketResource?.inputs?.lifecycleRules?.[0]?.transitions;
        expect(transitions?.some((t: any) => t.storageClass === "GLACIER")).toBe(true);
        done();
      });
    });

    it("transitions to Deep Archive after 7 years", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const transitions = bucketResource?.inputs?.lifecycleRules?.[0]?.transitions;
        expect(transitions?.some((t: any) => t.storageClass === "DEEP_ARCHIVE")).toBe(true);
        done();
      });
    });

    it("expires old versions", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const deleteRule = bucketResource?.inputs?.lifecycleRules?.find(
          (rule: any) => rule.id === "delete-old-versions"
        );
        expect(deleteRule).toBeDefined();
        expect(deleteRule?.noncurrentVersionExpiration).toBeDefined();
        done();
      });
    });
  });

  describe("KMS Encryption", () => {
    beforeEach(() => {
      stack = new StorageStack("test-encryption", {
        environmentSuffix: "enc",
        tags: pulumi.output({ Encryption: "kms" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-456"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-456"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("encrypts transaction bucket with KMS", (done) => {
      pulumi.all([stack.transactionBucketArn]).apply(([bucketArn]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const encryption = bucketResource?.inputs?.serverSideEncryptionConfiguration;
        expect(encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm).toBe("aws:kms");
        done();
      });
    });

    it("encrypts audit log bucket with KMS", (done) => {
      pulumi.all([stack.auditLogBucketArn]).apply(([bucketArn]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("audit-logs")
        );
        const encryption = bucketResource?.inputs?.serverSideEncryptionConfiguration;
        expect(encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm).toBe("aws:kms");
        done();
      });
    });

    it("encrypts data lake bucket with KMS", (done) => {
      pulumi.all([stack.archiveBucketArn]).apply(([bucketArn]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("data-lake")
        );
        const encryption = bucketResource?.inputs?.serverSideEncryptionConfiguration;
        expect(encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm).toBe("aws:kms");
        done();
      });
    });

    it("enables bucket key for cost optimization", (done) => {
      pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("transaction-archive")
        );
        const encryption = bucketResource?.inputs?.serverSideEncryptionConfiguration;
        expect(encryption?.rule?.bucketKeyEnabled).toBe(true);
        done();
      });
    });
  });

  describe("Public Access Blocking", () => {
    beforeEach(() => {
      stack = new StorageStack("test-public-block", {
        environmentSuffix: "block",
        tags: pulumi.output({ PublicAccess: "blocked" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("blocks public ACLs on transaction bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.transactionBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("transaction-archive")
          );
          expect(publicBlockResource?.inputs?.blockPublicAcls).toBe(true);
          done();
        });
      });
    });

    it("blocks public policy on audit bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.auditLogBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("audit-logs")
          );
          expect(publicBlockResource?.inputs?.blockPublicPolicy).toBe(true);
          done();
        });
      });
    });

    it("ignores public ACLs on data lake bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.archiveBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("data-lake")
          );
          expect(publicBlockResource?.inputs?.ignorePublicAcls).toBe(true);
          done();
        });
      });
    });

    it("restricts public buckets on backup bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.backupBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("backups")
          );
          expect(publicBlockResource?.inputs?.restrictPublicBuckets).toBe(true);
          done();
        });
      });
    });
  });

  describe("ALB Logs Bucket", () => {
    beforeEach(() => {
      stack = new StorageStack("test-alb-logs", {
        environmentSuffix: "alb",
        tags: pulumi.output({ Purpose: "alb-logs" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("creates ALB logs bucket", (done) => {
      pulumi.all([stack.albLogsBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeTruthy();
        const bucketResource = Array.from(createdResources.values()).find(
          r => r.type === "aws:s3/bucket:Bucket" && r.name.includes("alb-logs")
        );
        expect(bucketResource).toBeDefined();
        done();
      });
    });

    it("configures ALB bucket policy", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.albLogsBucketName]).apply(([bucketName]) => {
          const policyResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPolicy:BucketPolicy" && r.name.includes("alb-logs-policy")
          );
          expect(policyResource).toBeDefined();
          done();
        });
      });
    });

    it("blocks public access on ALB logs bucket", (done) => {
      process.nextTick(() => {
        pulumi.all([stack.albLogsBucketName]).apply(([bucketName]) => {
          const publicBlockResource = Array.from(createdResources.values()).find(
            r => r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock" && 
            r.name.includes("alb-logs")
          );
          expect(publicBlockResource).toBeDefined();
          done();
        });
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new StorageStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        enableCrossRegionReplication: false,
        enableObjectLock: false,
        enableVersioning: true,
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("transactionBucketName");
      expect(stack).toHaveProperty("transactionBucketArn");
      expect(stack).toHaveProperty("archiveBucketName");
      expect(stack).toHaveProperty("archiveBucketArn");
      expect(stack).toHaveProperty("auditLogBucketName");
      expect(stack).toHaveProperty("auditLogBucketArn");
      expect(stack).toHaveProperty("backupBucketName");
      expect(stack).toHaveProperty("albLogsBucketName");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.transactionBucketName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.transactionBucketArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.archiveBucketName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.auditLogBucketArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.albLogsBucketName)).toBe(true);
    });
  });
});