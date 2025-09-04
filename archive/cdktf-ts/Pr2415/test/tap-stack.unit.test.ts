import "./setup.js"; // This line loads the matchers for the Jest runtime

// This block tells the TypeScript compiler about the custom matcher types
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
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
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

  it("should create four subnets (2 public, 2 private)", () => {
    expect(synthesized).toHaveResourceWithProperties(Subnet, {
      cidr_block: "10.0.1.0/24",
    });
    expect(synthesized).toHaveResourceWithProperties(Subnet, {
      cidr_block: "10.0.2.0/24",
    });
    expect(synthesized).toHaveResourceWithProperties(Subnet, {
      cidr_block: "10.0.101.0/24",
    });
    expect(synthesized).toHaveResourceWithProperties(Subnet, {
      cidr_block: "10.0.102.0/24",
    });
  });

  it("should create a Multi-AZ RDS instance", () => {
    expect(synthesized).toHaveResourceWithProperties(DbInstance, {
      multi_az: true,
      storage_encrypted: true,
    });
  });

  it("should enable server-side encryption for the S3 bucket", () => {
    expect(synthesized).toHaveResourceWithProperties(
      S3BucketServerSideEncryptionConfigurationA,
      {
        rule: [
          {
            apply_server_side_encryption_by_default: {
              sse_algorithm: "AES256",
            },
          },
        ],
      }
    );
  });

  it("should configure the EC2 security group with restricted ingress", () => {
    expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
      name: expect.stringMatching(/^ec2-sg-/),
      ingress: expect.arrayContaining([
        expect.objectContaining({
          protocol: "tcp",
          from_port: 22,
          to_port: 22,
          cidr_blocks: ["10.0.0.0/16"],
        }),
        expect.objectContaining({
          protocol: "tcp",
          from_port: 80,
          to_port: 80,
          security_groups: ["${aws_security_group.alb-sg.id}"],
        }),
      ]),
    });
  });

  it("should create an IAM policy with least privilege", () => {
    expect(synthesized).toHaveResourceWithProperties(IamPolicy, {
      name: expect.stringMatching(/^ec2-policy-/),
      policy: expect.stringContaining(
        '"Resource":"${aws_s3_bucket.storage-bucket.arn}/*"'
      ),
    });
  });
});
