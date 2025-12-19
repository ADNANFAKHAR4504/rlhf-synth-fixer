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
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";

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

  it("should place the ALB in public subnets", () => {
    expect(synthesized).toHaveResourceWithProperties(Lb, {
      subnets: [
        "${aws_subnet.public-subnet-a.id}",
        "${aws_subnet.public-subnet-b.id}",
      ],
    });
  });

  it("should place the ASG in private subnets", () => {
    expect(synthesized).toHaveResourceWithProperties(AutoscalingGroup, {
      vpc_zone_identifier: [
        "${aws_subnet.private-subnet-a.id}",
        "${aws_subnet.private-subnet-b.id}",
      ],
    });
  });

  it("should configure the App SG to only allow traffic from the ALB SG", () => {
    expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
      name: expect.stringMatching(/^app-sg-/),
      ingress: expect.arrayContaining([
        expect.objectContaining({
          security_groups: ["${aws_security_group.alb-sg.id}"],
        }),
      ]),
    });
  });

  it("should configure the DB SG to only allow traffic from the App SG", () => {
    expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
      name: expect.stringMatching(/^rds-sg-/),
      ingress: expect.arrayContaining([
        expect.objectContaining({
          security_groups: ["${aws_security_group.app-sg.id}"],
        }),
      ]),
    });
  });

  it("should associate the RDS instance with the DB security group", () => {
    expect(synthesized).toHaveResourceWithProperties(DbInstance, {
      vpc_security_group_ids: ["${aws_security_group.rds-sg.id}"]
    });
  });
});
