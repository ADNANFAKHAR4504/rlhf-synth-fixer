import * as pulumi from "@pulumi/pulumi";

class MockOutput<T> {
  constructor(private value: T) {}
  
  apply<U>(func: (value: T) => U): MockOutput<U> {
    const result = func(this.value);
    return new MockOutput(result) as any;
  }
  
  async promise(): Promise<T> {
    return this.value;
  }
}

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {id: string; state: any} => {
    // Return mock resource with common properties
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}_id`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): {outputs: any} => {
    // Mock aws.getCallerIdentity
    if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
      return {
        outputs: {
          accountId: "123456789012",
          arn: "arn:aws:iam::123456789012:user/test",
          userId: "AIDAI123456789012",
        },
      };
    }
    return {outputs: {}};
  },
});

import {TapStack} from "../lib/tap-stack";

describe("TapStack AWS Config Compliance System", () => {
  let stack: TapStack;

  describe("Infrastructure Creation with Custom Props", () => {
    beforeAll(() => {
      stack = new TapStack("TestConfigStack", {
        environmentSuffix: "test",
        awsRegion: "us-east-1",
        approvedAmiIds: ["ami-test123", "ami-test456"],
        requiredTags: ["Environment", "Owner", "CostCenter"],
      });
    });

    it("should create stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack.configBucket).toBeDefined();
    });

    it("should create S3 bucket", () => {
      expect(stack.configBucket).toBeDefined();
    });

    it("should have Config recorder name", () => {
      expect(stack.configRecorderName).toBeDefined();
    });

    it("should create SNS topic", () => {
      expect(stack.snsTopic).toBeDefined();
    });

    it("should create Lambda function", () => {
      expect(stack.complianceFunction).toBeDefined();
    });

    it("should create Config aggregator", () => {
      expect(stack.configAggregator).toBeDefined();
    });

    it("should have bucket output", async () => {
      expect(stack.configBucketOutput).toBeDefined();
      const bucketId = await stack.configBucketOutput.promise();
      expect(bucketId).toBeDefined();
    });

    it("should have SNS topic ARN output", async () => {
      expect(stack.snsTopicArn).toBeDefined();
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain("arn:aws");
    });
  });

  describe("Default Values", () => {
    beforeAll(() => {
      stack = new TapStack("TestConfigStackDefault");
    });

    it("should use default configuration", () => {
      expect(stack).toBeDefined();
    });

    it("should create all required resources with defaults", () => {
      expect(stack.configBucket).toBeDefined();
      expect(stack.configRecorderName).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
      expect(stack.complianceFunction).toBeDefined();
      expect(stack.configAggregator).toBeDefined();
    });
  });
});
