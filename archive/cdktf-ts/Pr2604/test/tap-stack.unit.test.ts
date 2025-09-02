import "./setup.js";

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveResource(construct: any): R;
      toHaveResourceWithProperties(construct: any, properties: any): R;
    }
  }
}

import { Testing, TerraformStack } from "cdktf";
import { TapStack } from "../lib/tap-stack";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";

describe("Unit Tests for TapStack", () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, "test-stack", {
      env: { region: "us-east-1" },
    });
    synthesized = Testing.synth(stack);
  });

  it("should create a VPC", () => {
    expect(synthesized).toHaveResource(Vpc);
  });

  it("should create a Multi-AZ RDS instance with backups", () => {
    expect(synthesized).toHaveResourceWithProperties(DbInstance, {
      multi_az: true,
      backup_retention_period: 30,
    });
  });

  it("should create an Auto Scaling Group with correct capacity", () => {
    expect(synthesized).toHaveResourceWithProperties(AutoscalingGroup, {
      min_size: 2,
      max_size: 10,
    });
  });

  it("should create an Application Load Balancer", () => {
    expect(synthesized).toHaveResource(Lb);
  });

  it("should create an IAM policy with least privilege for CloudWatch", () => {
    expect(synthesized).toHaveResourceWithProperties(IamPolicy, {
      policy: expect.stringContaining('"Resource":"${aws_cloudwatch_log_group.app-log-group.arn}:*"'),
    });
    // Ensure it doesn't have wildcard resource permissions for other services
    expect(synthesized).not.toHaveResourceWithProperties(IamPolicy, {
      policy: expect.stringContaining('"Resource":"*"'),
    });
  });
});
