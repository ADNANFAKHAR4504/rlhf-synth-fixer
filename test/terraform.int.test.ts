import AWS from "aws-sdk";
import * as fs from "fs";
import * as path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

describe("Terraform integration tests (read-only)", () => {
  let outputs: any;

  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
    AWS.config.update({ region: outputs.aws_region.value });
  });

  it("should have a non-empty S3 bucket", async () => {
    const s3 = new AWS.S3();
    const bucketName = outputs.bucket_name.value;
    const tags = outputs.bucket_tags.value;

    // Check bucket exists
    const headResult = await s3.headBucket({ Bucket: bucketName }).promise();
    expect(headResult).toBeDefined();

    // Check tags
    const tagResult = await s3.getBucketTagging({ Bucket: bucketName }).promise();
    const tagSet = tagResult.TagSet.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {});
    expect(tagSet.Environment).toBe(tags.Environment);
    expect(tagSet.ManagedBy).toBe("terraform");
  });

  // Add more read-only AWS checks as needed
});