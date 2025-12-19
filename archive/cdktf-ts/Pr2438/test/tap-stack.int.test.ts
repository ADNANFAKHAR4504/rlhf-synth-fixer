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
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { ElasticBeanstalkEnvironment } from "@cdktf/provider-aws/lib/elastic-beanstalk-environment";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";

describe("Integration Tests for TapStack", () => {
  let stack: TerraformStack;
  let synthesized: string;

  beforeAll(() => {
    const app = Testing.app();
    stack = new TapStack(app, "test-stack", {
      env: { region: "us-east-1" },
    });
    synthesized = Testing.synth(stack);
  });

  it("should configure the RDS security group to only allow traffic from Beanstalk", () => {
    expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
      name: expect.stringMatching(/^rds-sg-/),
      ingress: expect.arrayContaining([
        expect.objectContaining({
          security_groups: ["${aws_security_group.eb-sg.id}"],
        }),
      ]),
    });
  });

  it("should configure the Beanstalk environment in the correct VPC and subnets", () => {
    expect(synthesized).toHaveResourceWithProperties(ElasticBeanstalkEnvironment, {
      setting: expect.arrayContaining([
        expect.objectContaining({
          namespace: "aws:ec2:vpc",
          name: "VPCId",
          value: "${aws_vpc.main-vpc.id}"
        }),
        expect.objectContaining({
          namespace: "aws:ec2:vpc",
          name: "Subnets",
          value: "${aws_subnet.public-subnet-a.id},${aws_subnet.public-subnet-b.id}"
        })
      ])
    });
  });

  it("should create primary and secondary Route 53 failover records", () => {
    // FIX: The failover_routing_policy is an object, not an array
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: { type: "PRIMARY" },
    });
    expect(synthesized).toHaveResourceWithProperties(Route53Record, {
      failover_routing_policy: { type: "SECONDARY" },
    });
  });
});
