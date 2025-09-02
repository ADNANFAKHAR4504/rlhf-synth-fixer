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
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3BucketReplicationConfigurationA as S3BucketReplicationConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-replication-configuration";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";

describe("Unit Tests for Multi-Region TapStack", () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, "test-stack");
    synthesized = Testing.synth(stack);
  });

  it("should create two distinct AWS providers for multi-region support", () => {
    const providers = JSON.parse(synthesized).provider.aws;
    expect(providers).toHaveLength(2);
    expect(providers.some((p: any) => p.region === "us-east-1")).toBe(true);
    expect(providers.some((p: any) => p.region === "eu-west-1")).toBe(true);
  });

  it("should configure S3 cross-region replication", () => {
    expect(synthesized).toHaveResource(S3BucketReplicationConfiguration);
    expect(synthesized).toHaveResourceWithProperties(S3BucketReplicationConfiguration, {
      rule: expect.arrayContaining([
        expect.objectContaining({
          status: "Enabled",
        }),
      ]),
    });
  });

  it("should create Route 53 failover records", () => {
    // Check for the PRIMARY failover record
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: {
        type: "PRIMARY",
      },
    });
    // Check for the SECONDARY failover record
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: {
        type: "SECONDARY",
      },
    });
  });

  it("should create SSM parameters in both regions", () => {
    const ssmParams = JSON.parse(synthesized).resource.aws_ssm_parameter;
    expect(Object.keys(ssmParams).length).toBe(2);
    // Check that one is associated with the primary provider and one with the secondary
    expect(ssmParams["primary-db-password"].provider).toEqual("aws.us-east-1");
    expect(ssmParams["secondary-db-password"].provider).toEqual("aws.eu-west-1");
  });
});
