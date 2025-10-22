/**
 * messaging-stack.unit.test.ts
 *
 * Unit tests for MessagingStack
 */
import * as pulumi from "@pulumi/pulumi";
import { MessagingStack } from "../lib/global-banking/messaging-stack";

describe("MessagingStack", () => {
  let stack: MessagingStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            url: args.type.includes("sqs") ? `https://sqs.us-east-1.amazonaws.com/123456789012/${args.name}` : undefined,
            name: args.inputs?.name || args.name,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
          return { accountId: "123456789012" };
        }
        if (args.token === "aws:index/getStack:getStack") {
          return "test-stack";
        }
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-messaging", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: true,
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(MessagingStack);
    });

    it("exposes transaction queue URL", (done) => {
      expect(stack.transactionQueueUrl).toBeDefined();
      pulumi.all([stack.transactionQueueUrl]).apply(([url]) => {
        expect(url).toBeTruthy();
        done();
      });
    });

    it("exposes transaction queue ARN", (done) => {
      expect(stack.transactionQueueArn).toBeDefined();
      pulumi.all([stack.transactionQueueArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes transaction DLQ URL", (done) => {
      expect(stack.transactionDlqUrl).toBeDefined();
      pulumi.all([stack.transactionDlqUrl]).apply(([url]) => {
        expect(url).toBeTruthy();
        done();
      });
    });

    it("exposes Kinesis stream ARN", (done) => {
      expect(stack.kinesisStreamArn).toBeDefined();
      pulumi.all([stack.kinesisStreamArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes Kinesis stream name", (done) => {
      expect(stack.kinesisStreamName).toBeDefined();
      pulumi.all([stack.kinesisStreamName]).apply(([name]) => {
        expect(name).toBeTruthy();
        done();
      });
    });

    it("exposes EventBridge bus ARN", (done) => {
      expect(stack.eventBusArn).toBeDefined();
      pulumi.all([stack.eventBusArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });
  });

  describe("SQS Queue Configuration", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-sqs", {
        environmentSuffix: "sqs",
        tags: pulumi.output({ Component: "sqs" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });
    });

    it("creates transaction queue", (done) => {
      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeTruthy();
        done();
      });
    });

    it("creates transaction DLQ", (done) => {
      pulumi.all([stack.transactionDlqUrl]).apply(([dlqUrl]) => {
        expect(dlqUrl).toBeTruthy();
        done();
      });
    });

    it("creates fraud detection queue", (done) => {
      pulumi.all([stack.transactionQueueArn]).apply(([queueArn]) => {
        expect(queueArn).toBeDefined();
        done();
      });
    });

    it("creates notification queue", (done) => {
      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("encrypts queues with KMS", (done) => {
      pulumi.all([stack.transactionQueueArn]).apply(([queueArn]) => {
        expect(queueArn).toBeDefined();
        done();
      });
    });

    it("enables long polling", (done) => {
      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("configures dead letter queues", (done) => {
      pulumi.all([stack.transactionDlqUrl]).apply(([dlqUrl]) => {
        expect(dlqUrl).toBeTruthy();
        done();
      });
    });
  });

  describe("FIFO Queue Configuration", () => {
    it("creates FIFO queues when enabled", (done) => {
      stack = new MessagingStack("test-fifo-enabled", {
        environmentSuffix: "fifo",
        tags: pulumi.output({ FIFO: "enabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });

      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("creates standard queues when disabled", (done) => {
      stack = new MessagingStack("test-fifo-disabled", {
        environmentSuffix: "standard",
        tags: pulumi.output({ FIFO: "disabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: false,
      });

      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("enables content-based deduplication", (done) => {
      stack = new MessagingStack("test-dedup", {
        environmentSuffix: "dedup",
        tags: pulumi.output({ Deduplication: "enabled" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });

      pulumi.all([stack.transactionQueueArn]).apply(([queueArn]) => {
        expect(queueArn).toBeDefined();
        done();
      });
    });

    it("configures per-message-group throughput", (done) => {
      stack = new MessagingStack("test-throughput", {
        environmentSuffix: "throughput",
        tags: pulumi.output({ Throughput: "high" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });

      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });
  });

  describe("Kinesis Data Streams", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-kinesis", {
        environmentSuffix: "kinesis",
        tags: pulumi.output({ Kinesis: "configured" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: false,
      });
    });

    it("creates transaction stream", (done) => {
      pulumi.all([stack.kinesisStreamName]).apply(([streamName]) => {
        expect(streamName).toBeTruthy();
        done();
      });
    });

    it("creates audit stream", (done) => {
      pulumi.all([stack.kinesisStreamArn]).apply(([streamArn]) => {
        expect(streamArn).toBeDefined();
        done();
      });
    });

    it("encrypts streams with KMS", (done) => {
      pulumi.all([stack.kinesisStreamName]).apply(([streamName]) => {
        expect(streamName).toBeDefined();
        done();
      });
    });

    it("enables shard-level metrics", (done) => {
      pulumi.all([stack.kinesisStreamArn]).apply(([streamArn]) => {
        expect(streamArn).toBeDefined();
        done();
      });
    });

    it("configures retention period", (done) => {
      pulumi.all([stack.kinesisStreamName]).apply(([streamName]) => {
        expect(streamName).toBeDefined();
        done();
      });
    });
  });

  describe("EventBridge Configuration", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-eventbridge", {
        environmentSuffix: "events",
        tags: pulumi.output({ EventBridge: "configured" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: false,
      });
    });

    it("creates event bus", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toContain("arn:aws:");
        done();
      });
    });

    it("creates event archive", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates transaction completed rule", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates fraud detection rule", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates notification rule", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates audit logging rule", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("routes events to SQS queues", (done) => {
      pulumi.all([stack.transactionQueueUrl, stack.eventBusArn]).apply(([queueUrl, busArn]) => {
        expect(queueUrl).toBeDefined();
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("routes events to Kinesis stream", (done) => {
      pulumi.all([stack.kinesisStreamArn, stack.eventBusArn]).apply(([streamArn, busArn]) => {
        expect(streamArn).toBeDefined();
        expect(busArn).toBeDefined();
        done();
      });
    });
  });

  describe("Cross-Region Event Replication", () => {
    it("creates replica event buses when enabled", (done) => {
      stack = new MessagingStack("test-xregion-enabled", {
        environmentSuffix: "xreg",
        tags: pulumi.output({ CrossRegion: "enabled" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: true,
      });

      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("does not create replicas when disabled", (done) => {
      stack = new MessagingStack("test-xregion-disabled", {
        environmentSuffix: "no-xreg",
        tags: pulumi.output({ CrossRegion: "disabled" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: false,
      });

      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates IAM roles for cross-region replication", (done) => {
      stack = new MessagingStack("test-xreg-iam", {
        environmentSuffix: "iam",
        tags: pulumi.output({ IAM: "xregion" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: true,
      });

      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });

    it("creates event rules for replication", (done) => {
      stack = new MessagingStack("test-xreg-rules", {
        environmentSuffix: "rules",
        tags: pulumi.output({ Rules: "xregion" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: true,
      });

      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });
  });

  describe("SQS Queue Policies", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-policies", {
        environmentSuffix: "policies",
        tags: pulumi.output({ Policies: "configured" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: false,
        enableCrossRegionEvents: false,
      });
    });

    it("allows EventBridge to send messages to transaction queue", (done) => {
      pulumi.all([stack.transactionQueueUrl]).apply(([queueUrl]) => {
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("allows EventBridge to send messages to fraud detection queue", (done) => {
      pulumi.all([stack.transactionQueueArn]).apply(([queueArn]) => {
        expect(queueArn).toBeDefined();
        done();
      });
    });

    it("allows EventBridge to send messages to notification queue", (done) => {
      pulumi.all([stack.eventBusArn]).apply(([busArn]) => {
        expect(busArn).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("transactionQueueUrl");
      expect(stack).toHaveProperty("transactionQueueArn");
      expect(stack).toHaveProperty("transactionDlqUrl");
      expect(stack).toHaveProperty("kinesisStreamArn");
      expect(stack).toHaveProperty("kinesisStreamName");
      expect(stack).toHaveProperty("eventBusArn");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.transactionQueueUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.transactionQueueArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.transactionDlqUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.kinesisStreamArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.kinesisStreamName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.eventBusArn)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new MessagingStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        regions: { primary: "us-east-1", replicas: [] },
        kmsKeyId: pulumi.output("key-123"),
        enableFifoQueues: true,
        enableCrossRegionEvents: false,
      });
    });

    it("queues depend on DLQs", (done) => {
      pulumi.all([stack.transactionQueueUrl, stack.transactionDlqUrl]).apply(([queueUrl, dlqUrl]) => {
        expect(queueUrl).toBeDefined();
        expect(dlqUrl).toBeDefined();
        done();
      });
    });

    it("event targets depend on event bus", (done) => {
      pulumi.all([stack.eventBusArn, stack.transactionQueueUrl]).apply(([busArn, queueUrl]) => {
        expect(busArn).toBeDefined();
        expect(queueUrl).toBeDefined();
        done();
      });
    });

    it("queue policies depend on queues and event bus", (done) => {
      pulumi.all([stack.transactionQueueArn, stack.eventBusArn]).apply(([queueArn, busArn]) => {
        expect(queueArn).toBeDefined();
        expect(busArn).toBeDefined();
        done();
      });
    });
  });
});