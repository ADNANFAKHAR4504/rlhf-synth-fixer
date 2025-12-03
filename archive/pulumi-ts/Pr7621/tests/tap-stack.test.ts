import * as pulumi from "@pulumi/pulumi";
import "mocha";

// Mock Pulumi config
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name + "_id",
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe("Infrastructure Compliance Analyzer Stack", function() {
  let stack: typeof import("../lib/tap-stack");

  before(async function() {
    // Set required config
    pulumi.runtime.setConfig("project:environmentSuffix", "test");

    stack = await import("../lib/tap-stack");
  });

  describe("S3 Bucket", function() {
    it("must include environmentSuffix in name", function(done) {
      pulumi.all([stack.bucketName]).apply(([name]) => {
        if (!name.includes("test")) {
          done(new Error("Bucket name must include environmentSuffix"));
        } else {
          done();
        }
      });
    });
  });

  describe("Lambda Function", function() {
    it("must include environmentSuffix in name", function(done) {
      pulumi.all([stack.lambdaFunctionName]).apply(([name]) => {
        if (!name.includes("test")) {
          done(new Error("Lambda name must include environmentSuffix"));
        } else {
          done();
        }
      });
    });
  });

  describe("SNS Topic", function() {
    it("must include environmentSuffix in ARN", function(done) {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        if (!arn.includes("test")) {
          done(new Error("SNS topic ARN must include environmentSuffix"));
        } else {
          done();
        }
      });
    });
  });

  describe("CloudWatch Log Group", function() {
    it("must include environmentSuffix in name", function(done) {
      pulumi.all([stack.logGroupName]).apply(([name]) => {
        if (!name.includes("test")) {
          done(new Error("Log group name must include environmentSuffix"));
        } else {
          done();
        }
      });
    });
  });
});
