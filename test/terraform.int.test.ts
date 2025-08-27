import * as fs from "fs";
import * as path from "path";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

interface Outputs {
  bucket_regions: string; // JSON string of region map
  s3_bucket_arns: string; // JSON string of bucket ARNs
  s3_replication_role_arn: string;
  lambda_iam_role_arn: string;
}

describe("tap_stack Terraform live integration tests", () => {
  let outputs: Outputs;
  let bucketRegions!: Record<string, string>;
  let bucketArns!: Record<string, string>;
 

  beforeAll(() => {
    const raw = fs.readFileSync(OUTPUTS_PATH, "utf-8");
    outputs = JSON.parse(raw);

    bucketRegions = JSON.parse(outputs.bucket_regions);
    bucketArns = JSON.parse(outputs.s3_bucket_arns);
  });

  it("has outputs file with expected keys", () => {
    expect(outputs).toHaveProperty("bucket_regions");
    expect(outputs).toHaveProperty("s3_bucket_arns");
    expect(outputs).toHaveProperty("s3_replication_role_arn");
    expect(outputs).toHaveProperty("lambda_iam_role_arn");
  });

  // Test each S3 bucket properties: versioning enabled and encryption (SSE_AES256)
  Object.keys(bucketArns).forEach((regionKey) => {
    const s3Region = bucketRegions[regionKey];
    const bucketArn = bucketArns[regionKey];
    // Extract bucket name from ARN: "arn:aws:s3:::bucket-name"
    const bucketName = bucketArn.split(":::")[1];
    const s3Client = new S3Client({ region: s3Region });

    describe(`S3 bucket ${bucketName} in region ${s3Region}`, () => {
      it("has versioning enabled", async () => {
        const versioningResp = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResp.Status).toBe("Enabled");
      });

      it("has AES256 encryption enabled", async () => {
        const encryptionResp = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        const rules = encryptionResp.ServerSideEncryptionConfiguration?.Rules || [];
        const hasAES256 = rules.some(
          (rule) =>
            rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256"
        );
        expect(hasAES256).toBe(true);
      });
    });
  });

  // Test IAM Role for S3 Replication exists and is correct
  it("S3 replication IAM role exists", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 });
    const roleArn = outputs.s3_replication_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

  // Test IAM Role for Lambda exists
  it("Lambda execution IAM role exists", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 });
    const roleArn = outputs.lambda_iam_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

});
