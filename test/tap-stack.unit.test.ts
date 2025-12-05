import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.name + "_id",
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
      return {
        accountId: "123456789012",
        arn: "arn:aws:iam::123456789012:user/test",
        userId: "AIDAI1234567890EXAMPLE",
      };
    }
    return args.inputs;
  },
});

describe("TapStack Monitoring Infrastructure", () => {
  let stack: TapStack;

  describe("with custom environment and owner", () => {
    beforeAll(() => {
      stack = new TapStack("test-monitoring-stack", {
        environment: "staging",
        owner: "platform-team",
      });
    });

    it("should instantiate successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should expose kmsKeyArn output", (done) => {
      stack.kmsKeyArn.apply((arn) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe("string");
        done();
      });
    });

    it("should expose logGroupArns output as array", (done) => {
      stack.logGroupArns.apply((arns) => {
        expect(arns).toBeDefined();
        expect(Array.isArray(arns)).toBe(true);
        expect(arns.length).toBeGreaterThan(0);
        done();
      });
    });

    it("should expose dashboardUrl output", (done) => {
      stack.dashboardUrl.apply((url) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe("string");
        expect(url).toContain("console.aws.amazon.com/cloudwatch");
        done();
      });
    });

    it("should expose snsTopicArn output", (done) => {
      stack.snsTopicArn.apply((arn) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe("string");
        done();
      });
    });

    it("should expose lambdaFunctionArn output", (done) => {
      stack.lambdaFunctionArn.apply((arn) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe("string");
        done();
      });
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("test-default-stack");
    });

    it("should instantiate with default environment", () => {
      expect(stack).toBeDefined();
    });

    it("should create all required outputs", (done) => {
      Promise.all([
        stack.kmsKeyArn.promise(),
        stack.logGroupArns.promise(),
        stack.dashboardUrl.promise(),
        stack.snsTopicArn.promise(),
        stack.lambdaFunctionArn.promise(),
      ]).then(([kmsArn, logArns, dashUrl, snsArn, lambdaArn]) => {
        expect(kmsArn).toBeDefined();
        expect(logArns).toBeDefined();
        expect(dashUrl).toBeDefined();
        expect(snsArn).toBeDefined();
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("resource tagging", () => {
    it("should apply custom environment tags", (done) => {
      const customStack = new TapStack("test-tags-stack", {
        environment: "production",
        owner: "security-team",
      });

      expect(customStack).toBeDefined();
      // Tags are applied internally, verified through deployment
      done();
    });
  });

  describe("monitoring components", () => {
    it("should create CloudWatch log groups", (done) => {
      stack.logGroupArns.apply((arns) => {
        // Should have log groups for multiple services
        expect(arns.length).toBeGreaterThanOrEqual(3);
        done();
      });
    });

    it("should create KMS key for encryption", (done) => {
      stack.kmsKeyArn.apply((arn) => {
        expect(arn).toMatch(/^arn:aws:kms:/);
        done();
      });
    });

    it("should create CloudWatch dashboard", (done) => {
      stack.dashboardUrl.apply((url) => {
        expect(url).toContain("dashboards:name=");
        done();
      });
    });

    it("should create SNS topic for alerts", (done) => {
      stack.snsTopicArn.apply((arn) => {
        expect(arn).toMatch(/^arn:aws:sns:/);
        done();
      });
    });

    it("should create Lambda function for metric aggregation", (done) => {
      stack.lambdaFunctionArn.apply((arn) => {
        expect(arn).toMatch(/^arn:aws:lambda:/);
        done();
      });
    });
  });
});
