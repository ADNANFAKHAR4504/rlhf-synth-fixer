import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
let outputs: any = {};

beforeAll(() => {
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  const region = outputs?.aws_region?.value || "us-east-1";
  AWS.config.update({ region });
});

describe("Terraform integration tests (read-only)", () => {
  it("should have a non-empty S3 bucket", async () => {
    const s3 = new AWS.S3();

    const bucketName = outputs?.s3_bucket_name?.value;
    expect(bucketName).toBeDefined();

    const objects = await s3
      .listObjectsV2({ Bucket: bucketName })
      .promise();

    expect(objects.Contents?.length).toBeGreaterThan(0);
  });
});
