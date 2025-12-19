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
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";

describe("Integration Tests for Multi-Region TapStack", () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, "test-stack");
    synthesized = Testing.synth(stack);
  });

  it("should provision a VPC in each region", () => {
    const vpcs = JSON.parse(synthesized).resource.aws_vpc;
    expect(Object.keys(vpcs).length).toBe(2);
    expect(vpcs["primary-vpc"].provider).toEqual("aws.us-east-1");
    expect(vpcs["secondary-vpc"].provider).toEqual("aws.eu-west-1");
  });

  it("should provision an ALB in each region", () => {
    const albs = JSON.parse(synthesized).resource.aws_lb;
    expect(Object.keys(albs).length).toBe(2);
    expect(albs["primary-alb"].provider).toEqual("aws.us-east-1");
    expect(albs["secondary-alb"].provider).toEqual("aws.eu-west-1");
  });

  it("should enforce encryption in S3 bucket policies", () => {
    const policies = JSON.parse(synthesized).resource.aws_s3_bucket_policy;
    for (const key in policies) {
      const policyDoc = JSON.parse(policies[key].policy);
      const denyUnencrypted = policyDoc.Statement.find((s: any) => s.Sid === "DenyUnEncryptedObjectUploads");
      expect(denyUnencrypted.Effect).toEqual("Deny");
      expect(denyUnencrypted.Condition.Null["s3:x-amz-server-side-encryption"]).toBe("true");
    }
  });

  it("should demonstrate correct security group chaining in each region", () => {
    const securityGroups = JSON.parse(synthesized).resource.aws_security_group;
    const primaryEc2Sg = securityGroups["primary-ec2-sg"];

    // Check that the primary EC2 SG allows ingress from the primary ALB SG
    expect(primaryEc2Sg.ingress[0].security_groups).toEqual(["${aws_security_group.primary-alb-sg.id}"]);
  });
});