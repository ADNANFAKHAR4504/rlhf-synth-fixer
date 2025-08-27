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
  bucket_regions: string; // JSON string, must parse again to object
  s3_bucket_arns: string; // JSON string, must parse again to object
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

    // Because bucket_regions and s3_bucket_arns are JSON strings (escaped in JSON),
    // we parse them once more to convert them into JS objects
    bucketRegions = parseJsonString(outputs.bucket_regions, "bucket_regions");
    bucketArns = parseJsonString(outputs.s3_bucket_arns, "s3_bucket_arns");

    if (!bucketRegions || Object.keys(bucketRegions).length === 0) {
      throw new Error("Parsed bucket_regions is empty or invalid");
    }
    if (!bucketArns || Object.keys(bucketArns).length === 0) {
      throw new Error("Parsed s3_bucket_arns is empty or invalid");
    }
  });

  it("has all expected outputs keys", () => {
    expect(outputs).toHaveProperty("bucket_regions");
    expect(outputs).toHaveProperty("s3_bucket_arns");
    expect(outputs).toHaveProperty("s3_replication_role_arn");
    expect(outputs).toHaveProperty("lambda_iam_role_arn");
  });

  Object.keys(bucketArns).forEach((regionKey) => {
    const s3Region = bucketRegions[regionKey];
    const bucketArn = bucketArns[regionKey];

    const bucketName = bucketArn.split(":::")[1];
    const s3Client = new S3Client({ region: s3Region });

    describe(`S3 bucket ${bucketName} in region ${s3Region}`, () => {
      it("should have versioning enabled", async () => {
        const versioningResp = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResp.Status).toBe("Enabled");
      });

      it("should have AES256 encryption enabled", async () => {
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

  it("replication IAM role exists", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 }); // replication role is in us-east-1
    const roleArn = outputs.s3_replication_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));

    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

  it("lambda IAM role exists", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 }); // lambda role in us-east-1
    const roleArn = outputs.lambda_iam_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));

    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });
});

// Helper function to parse a JSON string field safely
function parseJsonString(input: string | undefined, fieldName: string): any {
  if (!input) throw new Error(`Missing ${fieldName} output`);
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error(`Failed to parse ${fieldName} JSON string: ${err}`);
  }
}
