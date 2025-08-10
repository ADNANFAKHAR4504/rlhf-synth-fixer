// terraform-unit.ts
// Jest-based static unit tests for Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../lib/main.tf relative to this test file
const TF_PATH = process.env.TF_MAIN_PATH
  ? path.resolve(process.env.TF_MAIN_PATH)
  : path.resolve(__dirname, "../lib/main.tf");

describe("Terraform S3 config (static checks)", () => {
  let hcl: string;

  beforeAll(() => {
    const exists = fs.existsSync(TF_PATH);
    if (!exists) {
      throw new Error(`Terraform file not found at ${TF_PATH}`);
    }
    hcl = fs.readFileSync(TF_PATH, "utf8");
  });

  test("has required variables with correct defaults", () => {
    // aws_region
    expect(hcl).toMatch(
      new RegExp(
        String.raw`variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-east-1"[\s\S]*?}`,
        "m"
      )
    );

    // bucket_region
    expect(hcl).toMatch(
      new RegExp(
        String.raw`variable\s+"bucket_region"\s*{[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-west-2"[\s\S]*?}`,
        "m"
      )
    );

    // bucket_name
    expect(hcl).toMatch(
      new RegExp(
        String.raw`variable\s+"bucket_name"\s*{[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"turing-dev-s3-bucket-01"[\s\S]*?}`,
        "m"
      )
    );

    // bucket_tags with required keys
    expect(hcl).toMatch(
      new RegExp(
        String.raw`variable\s+"bucket_tags"\s*{[\s\S]*?type\s*=\s*map\(string\)[\s\S]*?default\s*=\s*{[\s\S]*?Project\s*=\s*"ExampleProject"[\s\S]*?Environment\s*=\s*"dev"[\s\S]*?ManagedBy\s*=\s*"terraform"[\s\S]*?}[\s\S]*?}`,
        "m"
      )
    );
  });

  test("defines aws_s3_bucket.this with name and tags from variables", () => {
    // Bucket block exists
    expect(hcl).toMatch(
      new RegExp(
        String.raw`resource\s+"aws_s3_bucket"\s+"this"\s*{[\s\S]*?}`,
        "m"
      )
    );

    // Uses var.bucket_name and var.bucket_tags
    const bucketBlock =
      hcl.match(
        new RegExp(
          String.raw`resource\s+"aws_s3_bucket"\s+"this"\s*{([\s\S]*?)}`,
          "m"
        )
      )?.[0] ?? "";

    expect(bucketBlock).toMatch(
      new RegExp(String.raw`bucket\s*=\s*var\.bucket_name`, "m")
    );
    expect(bucketBlock).toMatch(
      new RegExp(String.raw`tags\s*=\s*var\.bucket_tags`, "m")
    );
  });

  test("blocks all public access via aws_s3_bucket_public_access_block.this", () => {
    const pab = hcl.match(
      new RegExp(
        String.raw`resource\s+"aws_s3_bucket_public_access_block"\s+"this"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(pab).toBeTruthy();
    expect(pab!).toMatch(
      new RegExp(String.raw`bucket\s*=\s*aws_s3_bucket\.this\.id`, "m")
    );
    expect(pab!).toMatch(
      new RegExp(String.raw`block_public_acls\s*=\s*true`, "m")
    );
    expect(pab!).toMatch(
      new RegExp(String.raw`ignore_public_acls\s*=\s*true`, "m")
    );
    expect(pab!).toMatch(
      new RegExp(String.raw`block_public_policy\s*=\s*true`, "m")
    );
    expect(pab!).toMatch(
      new RegExp(String.raw`restrict_public_buckets\s*=\s*true`, "m")
    );
  });

  test("enables versioning", () => {
    const ver = hcl.match(
      new RegExp(
        String.raw`resource\s+"aws_s3_bucket_versioning"\s+"this"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(ver).toBeTruthy();
    expect(ver!).toMatch(
      new RegExp(String.raw`bucket\s*=\s*aws_s3_bucket\.this\.id`, "m")
    );
    expect(ver!).toMatch(
      new RegExp(
        String.raw`versioning_configuration\s*{[\s\S]*?status\s*=\s*"Enabled"[\s\S]*?}`,
        "m"
      )
    );
  });

  test("outputs are wired correctly", () => {
    // output "bucket_name"
    const outBucketName = hcl.match(
      new RegExp(String.raw`output\s+"bucket_name"\s*{([\s\S]*?)}`, "m")
    )?.[0];
    expect(outBucketName).toBeTruthy();
    expect(outBucketName!).toMatch(
      new RegExp(String.raw`value\s*=\s*aws_s3_bucket\.this\.bucket`, "m")
    );

    // output "bucket_tags"
    const outTags = hcl.match(
      new RegExp(String.raw`output\s+"bucket_tags"\s*{([\s\S]*?)}`, "m")
    )?.[0];
    expect(outTags).toBeTruthy();
    expect(outTags!).toMatch(
      new RegExp(String.raw`value\s*=\s*aws_s3_bucket\.this\.tags`, "m")
    );
  });

  test("security hygiene: no ACLs or public grants on bucket", () => {
    const bucketBlock =
      hcl.match(
        new RegExp(
          String.raw`resource\s+"aws_s3_bucket"\s+"this"\s*{([\s\S]*?)}`,
          "m"
        )
      )?.[0] ?? "";

    // Ensure we don't set bucket-level ACLs like "public-read" or any acl attribute
    expect(bucketBlock).not.toMatch(new RegExp(String.raw`acl\s*=`, "m"));

    // Ensure we never set any of the PAB booleans to false
    expect(hcl).not.toMatch(
      new RegExp(
        String.raw`resource\s+"aws_s3_bucket_public_access_block"\s+"this"[\s\S]*?(block_public_acls|ignore_public_acls|block_public_policy|restrict_public_buckets)\s*=\s*false`,
        "m"
      )
    );
  });

  test("does not hardcode region settings inside bucket resource", () => {
    // Region should be driven by provider; avoid create_bucket_configuration/location_constraint in this file
    expect(hcl).not.toMatch(/create_bucket_configuration|location_constraint/);
  });
});
