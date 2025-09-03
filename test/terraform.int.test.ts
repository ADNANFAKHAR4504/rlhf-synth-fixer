import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "terraform.tfstate");
let outputs: any = {};

beforeAll(() => {
  const state = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  outputs = Object.fromEntries(
    Object.entries(state.outputs || {}).map(([k, v]: [string, any]) => [
      k,
      v.value,
    ])
  );

  const region = outputs?.aws_region || "us-east-1";
  AWS.config.update({ region });
});

describe("Terraform integration tests (read-only)", () => {
  it("should have a non-empty S3 bucket", async () => {
    const s3 = new AWS.S3();

    const bucketName = outputs?.s3_bucket_name;
    expect(bucketName).toBeDefined();

    const objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();

    expect(objects.Contents?.length).toBeGreaterThan(0);
  });
});
