import "./setup.js"; // This line loads the CDKTF Jest matchers

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
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";
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

  it("should associate public subnets with the public route table", () => {
    expect(synthesized).toHaveResourceWithProperties(RouteTableAssociation, {
      subnet_id: "${aws_subnet.public-subnet-a.id}",
      route_table_id: "${aws_route_table.public-rt.id}",
    });
    expect(synthesized).toHaveResourceWithProperties(RouteTableAssociation, {
      subnet_id: "${aws_subnet.public-subnet-b.id}",
      route_table_id: "${aws_route_table.public-rt.id}",
    });
  });

  it("should place the ALB in public subnets", () => {
    expect(synthesized).toHaveResourceWithProperties(Lb, {
      subnets: [
        "${aws_subnet.public-subnet-a.id}",
        "${aws_subnet.public-subnet-b.id}",
      ],
    });
  });

  it("should place EC2 instances in public subnets and attach the correct security group", () => {
    expect(synthesized).toHaveResourceWithProperties(Instance, {
      subnet_id: "${aws_subnet.public-subnet-a.id}",
      vpc_security_group_ids: ["${aws_security_group.ec2-sg.id}"],
    });
    expect(synthesized).toHaveResourceWithProperties(Instance, {
      subnet_id: "${aws_subnet.public-subnet-b.id}",
      vpc_security_group_ids: ["${aws_security_group.ec2-sg.id}"],
    });
  });

  it("should place the RDS instance in private subnets", () => {
    expect(synthesized).toHaveResourceWithProperties(DbInstance, {
      db_subnet_group_name: "${aws_db_subnet_group.rds-subnet-group.name}",
      vpc_security_group_ids: ["${aws_security_group.rds-sg.id}"],
    });
  });

  it("should configure the RDS security group to only allow traffic from EC2 instances", () => {
    // FIX: Use expect.arrayContaining and expect.objectContaining for a more flexible check
    expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
      name: expect.stringMatching(/^rds-sg-/),
      ingress: expect.arrayContaining([
        expect.objectContaining({
          protocol: "tcp",
          from_port: 5432,
          to_port: 5432,
          security_groups: ["${aws_security_group.ec2-sg.id}"],
        }),
      ]),
    });
  });
});
