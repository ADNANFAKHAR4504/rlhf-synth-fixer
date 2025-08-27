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
  bucket_regions: string; // JSON string mapping region keys to AWS regions
  s3_bucket_arns: string;  // JSON string mapping region keys to bucket ARNs
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

    // Defensive parsing: default to empty object if missing or invalid
    bucketRegions = safeJsonParse(outputs.bucket_regions, {});
    bucketArns = safeJsonParse(outputs.s3_bucket_arns, {});
  });

  it("has outputs file with expected keys", () => {
    expect(outputs).toHaveProperty("bucket_regions");
    expect(outputs).toHaveProperty("s3_bucket_arns");
    expect(outputs).toHaveProperty("s3_replication_role_arn");
    expect(outputs).toHaveProperty("lambda_iam_role_arn");
  });

  it("bucket regions and ARNs should be non-empty objects", () => {
    expect(bucketRegions).toBeDefined();
    expect(typeof bucketRegions).toBe("object");
    expect(Object.keys(bucketRegions).length).toBeGreaterThan(0);

    expect(bucketArns).toBeDefined();
    expect(typeof bucketArns).toBe("object");
    expect(Object.keys(bucketArns).length).toBeGreaterThan(0);
  });

  // Test each S3 bucket properties: verify versioning enabled + AES256 encryption enabled
  Object.keys(bucketArns).forEach((regionKey) => {
    const s3Region = bucketRegions[regionKey];
    const bucketArn = bucketArns[regionKey];

    if (!s3Region || !bucketArn) {
      // Skip test if data missing for this regionKey
      return;
    }

    const bucketName = bucketArn.split(":::")[1];
    const s3Client = new S3Client({ region: s3Region });

    describe(`S3 bucket ${bucketName} in region ${s3Region}`, () => {
      it("should have versioning enabled", async () => {
        const versioningResp = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResp.Status).toBe("Enabled");
      });

      it("should have AES256 server-side encryption enabled", async () => {
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

  it("should have the S3 replication IAM role existing", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 });
    const roleArn = outputs.s3_replication_role_arn;
    expect(roleArn).toBeDefined();

    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));

    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

  it("should have the Lambda execution IAM role existing", async () => {
    const iamClient = new IAMClient({ region: bucketRegions.us_east_1 });
    const roleArn = outputs.lambda_iam_role_arn;
    expect(roleArn).toBeDefined();

    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));

    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

});

// Helper to safely parse JSON strings returning default if failed
function safeJsonParse<T>(jsonStr: string | undefined, defaultValue: T): T {
  if (!jsonStr || typeof jsonStr !== "string") return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}
