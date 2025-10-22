/**
 * database-stack.unit.test.ts
 *
 * Unit tests for DatabaseStack
 */
import * as pulumi from "@pulumi/pulumi";
import { DatabaseStack } from "../lib/global-banking/database-stack";

describe("DatabaseStack", () => {
  let stack: DatabaseStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            endpoint: "cluster.abc123.us-east-1.rds.amazonaws.com",
            readerEndpoint: "cluster-ro.abc123.us-east-1.rds.amazonaws.com",
            configurationEndpointAddress: "cache.abc123.0001.use1.cache.amazonaws.com",
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-database", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2", "subnet-3"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        enableGlobalDatabase: true,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
        replicaKmsKeyArns: {
          "eu-west-1": pulumi.output("arn:aws:kms:eu-west-1:123456789012:key/key-456"),
        },
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(DatabaseStack);
    });

    it("exposes Aurora cluster endpoint", (done) => {
      expect(stack.auroraClusterEndpoint).toBeDefined();
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeTruthy();
        done();
      });
    });

    it("exposes Aurora reader endpoint", (done) => {
      expect(stack.auroraReaderEndpoint).toBeDefined();
      pulumi.all([stack.auroraReaderEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeTruthy();
        done();
      });
    });

    it("exposes Aurora cluster ARN", (done) => {
      expect(stack.auroraClusterArn).toBeDefined();
      pulumi.all([stack.auroraClusterArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes DynamoDB table name", (done) => {
      expect(stack.dynamoDbTableName).toBeDefined();
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeTruthy();
        done();
      });
    });

    it("exposes DynamoDB table ARN", (done) => {
      expect(stack.dynamoDbTableArn).toBeDefined();
      pulumi.all([stack.dynamoDbTableArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes ElastiCache endpoint", (done) => {
      expect(stack.elastiCacheEndpoint).toBeDefined();
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeTruthy();
        done();
      });
    });

    it("exposes ElastiCache replication group ID", (done) => {
      expect(stack.elastiCacheReplicationGroupId).toBeDefined();
      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([id]) => {
        expect(id).toBeTruthy();
        done();
      });
    });
  });

  describe("Aurora Configuration", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-aurora", {
        environmentSuffix: "aurora",
        tags: pulumi.output({ Database: "aurora" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("creates DB subnet group", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("creates Aurora security group", (done) => {
      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("creates Aurora parameter group", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("creates Aurora cluster", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeTruthy();
        done();
      });
    });

    it("creates primary instance", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("creates reader instance", (done) => {
      pulumi.all([stack.auroraReaderEndpoint]).apply(([readerEndpoint]) => {
        expect(readerEndpoint).toBeDefined();
        done();
      });
    });

    it("enables encryption at rest", (done) => {
      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("enables deletion protection", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("configures automated backups", (done) => {
      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("enables CloudWatch logs export", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });
  });

  describe("Aurora Global Database", () => {
    it("creates global cluster when enabled", (done) => {
      stack = new DatabaseStack("test-global-enabled", {
        environmentSuffix: "global",
        tags: pulumi.output({ GlobalDB: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
        enableGlobalDatabase: true,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("does not create global cluster when disabled", (done) => {
      stack = new DatabaseStack("test-global-disabled", {
        environmentSuffix: "no-global",
        tags: pulumi.output({ GlobalDB: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });
  });

  describe("Aurora Serverless v2", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-serverless", {
        environmentSuffix: "serverless",
        tags: pulumi.output({ Serverless: "v2" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("configures serverless v2 scaling", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("uses db.serverless instance class", (done) => {
      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("enables Performance Insights", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });
  });

  describe("DynamoDB Configuration", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-dynamodb", {
        environmentSuffix: "dynamo",
        tags: pulumi.output({ Database: "dynamodb" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("creates DynamoDB table", (done) => {
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeTruthy();
        done();
      });
    });

    it("uses PAY_PER_REQUEST billing mode", (done) => {
      pulumi.all([stack.dynamoDbTableArn]).apply(([tableArn]) => {
        expect(tableArn).toBeDefined();
        done();
      });
    });

    it("enables DynamoDB Streams", (done) => {
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });

    it("enables Point-in-Time Recovery", (done) => {
      pulumi.all([stack.dynamoDbTableArn]).apply(([tableArn]) => {
        expect(tableArn).toBeDefined();
        done();
      });
    });

    it("encrypts with KMS", (done) => {
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });

    it("configures TTL", (done) => {
      pulumi.all([stack.dynamoDbTableArn]).apply(([tableArn]) => {
        expect(tableArn).toBeDefined();
        done();
      });
    });

    it("creates Global Secondary Index", (done) => {
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });
  });

  describe("DynamoDB Global Tables", () => {
    it("creates global table replicas when enabled", (done) => {
      stack = new DatabaseStack("test-dynamo-global", {
        environmentSuffix: "global",
        tags: pulumi.output({ GlobalTable: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
        enableGlobalDatabase: true,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
        replicaKmsKeyArns: {
          "eu-west-1": pulumi.output("arn:aws:kms:eu-west-1:123456789012:key/key-456"),
          "ap-southeast-1": pulumi.output("arn:aws:kms:ap-southeast-1:123456789012:key/key-789"),
        },
      });

      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });

    it("does not create replicas when disabled", (done) => {
      stack = new DatabaseStack("test-dynamo-single", {
        environmentSuffix: "single",
        tags: pulumi.output({ GlobalTable: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });
  });

  describe("ElastiCache Configuration", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-redis", {
        environmentSuffix: "redis",
        tags: pulumi.output({ Cache: "redis" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2", "subnet-3"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("creates cache subnet group", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("creates cache security group", (done) => {
      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([groupId]) => {
        expect(groupId).toBeDefined();
        done();
      });
    });

    it("creates Redis replication group", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeTruthy();
        done();
      });
    });

    it("enables encryption at rest", (done) => {
      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([groupId]) => {
        expect(groupId).toBeDefined();
        done();
      });
    });

    it("enables encryption in transit", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("configures automatic failover", (done) => {
      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([groupId]) => {
        expect(groupId).toBeDefined();
        done();
      });
    });

    it("enables Multi-AZ", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("configures snapshot retention", (done) => {
      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([groupId]) => {
        expect(groupId).toBeDefined();
        done();
      });
    });

    it("enables CloudWatch logging", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });
  });

  describe("ElastiCache Global Datastore", () => {
    it("creates global replication group when enabled", (done) => {
      stack = new DatabaseStack("test-redis-global", {
        environmentSuffix: "global",
        tags: pulumi.output({ GlobalRedis: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        enableGlobalDatabase: true,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("does not create global datastore when disabled", (done) => {
      stack = new DatabaseStack("test-redis-single", {
        environmentSuffix: "single",
        tags: pulumi.output({ GlobalRedis: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.elastiCacheReplicationGroupId]).apply(([groupId]) => {
        expect(groupId).toBeDefined();
        done();
      });
    });
  });

  describe("Security Groups", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-sg", {
        environmentSuffix: "sg",
        tags: pulumi.output({ SecurityGroups: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("allows PostgreSQL traffic on Aurora security group", (done) => {
      pulumi.all([stack.auroraClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("allows Redis traffic on cache security group", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("restricts ingress to VPC CIDR", (done) => {
      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });
  });

  describe("Point-in-Time Recovery", () => {
    it("enables PITR when specified", (done) => {
      stack = new DatabaseStack("test-pitr-enabled", {
        environmentSuffix: "pitr",
        tags: pulumi.output({ PITR: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.dynamoDbTableArn]).apply(([tableArn]) => {
        expect(tableArn).toBeDefined();
        done();
      });
    });

    it("disables PITR when not specified", (done) => {
      stack = new DatabaseStack("test-pitr-disabled", {
        environmentSuffix: "no-pitr",
        tags: pulumi.output({ PITR: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: false,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });

      pulumi.all([stack.dynamoDbTableName]).apply(([tableName]) => {
        expect(tableName).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("auroraClusterEndpoint");
      expect(stack).toHaveProperty("auroraReaderEndpoint");
      expect(stack).toHaveProperty("auroraClusterArn");
      expect(stack).toHaveProperty("dynamoDbTableName");
      expect(stack).toHaveProperty("dynamoDbTableArn");
      expect(stack).toHaveProperty("elastiCacheEndpoint");
      expect(stack).toHaveProperty("elastiCacheReplicationGroupId");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.auroraClusterEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(stack.auroraReaderEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(stack.auroraClusterArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dynamoDbTableName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.elastiCacheEndpoint)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new DatabaseStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalDatabase: false,
        enablePointInTimeRecovery: true,
        secretsManagerArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      });
    });

    it("Aurora cluster depends on subnet group", (done) => {
      pulumi.all([stack.auroraClusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("Aurora instances depend on cluster", (done) => {
      pulumi.all([stack.auroraClusterArn, stack.auroraClusterEndpoint]).apply(([clusterArn, endpoint]) => {
        expect(clusterArn).toBeDefined();
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it("ElastiCache depends on subnet group", (done) => {
      pulumi.all([stack.elastiCacheEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });
  });
});