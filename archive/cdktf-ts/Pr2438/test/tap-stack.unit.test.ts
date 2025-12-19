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
import { ElasticBeanstalkApplication } from "@cdktf/provider-aws/lib/elastic-beanstalk-application";
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";

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

  it("should create a Multi-AZ RDS instance", () => {
    expect(synthesized).toHaveResourceWithProperties(DbInstance, {
      multi_az: true,
    });
  });

  it("should create an Elastic Beanstalk application", () => {
    expect(synthesized).toHaveResource(ElasticBeanstalkApplication);
  });

  it("should create a Route 53 Zone", () => {
    expect(synthesized).toHaveResource(Route53Zone);
  });

  it("should create a CloudWatch alarm for environment health", () => {
    expect(synthesized).toHaveResourceWithProperties(CloudwatchMetricAlarm, {
      metric_name: "EnvironmentHealth",
      namespace: "AWS/ElasticBeanstalk",
    });
  });
});