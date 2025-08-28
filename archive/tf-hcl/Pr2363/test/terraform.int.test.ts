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
  // S3 buckets per region
  s3_bucket_id_us_east_1: string;
  s3_bucket_arn_us_east_1: string;
  s3_bucket_domain_name_us_east_1: string;
  s3_bucket_regional_domain_name_us_east_1: string;

  s3_bucket_id_eu_west_1: string;
  s3_bucket_arn_eu_west_1: string;
  s3_bucket_domain_name_eu_west_1: string;
  s3_bucket_regional_domain_name_eu_west_1: string;

  s3_bucket_id_ap_southeast_1: string;
  s3_bucket_arn_ap_southeast_1: string;
  s3_bucket_domain_name_ap_southeast_1: string;
  s3_bucket_regional_domain_name_ap_southeast_1: string;

  lambda_iam_role_arn: string;
  lambda_iam_role_name: string;
  s3_replication_role_arn: string;
  s3_replication_role_name: string;

  environment: string;
  project_name: string;
  // Add other outputs if needed
}

describe("tap_stack Terraform live integration tests", () => {
  let outputs: Outputs;

  beforeAll(() => {
    const raw = fs.readFileSync(OUTPUTS_PATH, "utf-8");
    outputs = JSON.parse(raw);

    // Basic verification for presence of required outputs
    expect(typeof outputs.s3_bucket_arn_us_east_1).toBe("string");
    expect(typeof outputs.s3_bucket_arn_eu_west_1).toBe("string");
    expect(typeof outputs.s3_bucket_arn_ap_southeast_1).toBe("string");
    expect(typeof outputs.lambda_iam_role_arn).toBe("string");
    expect(typeof outputs.s3_replication_role_arn).toBe("string");
  });

  const buckets = [
    {
      region: "us-east-1",
      bucketArn: "s3_bucket_arn_us_east_1",
      bucketId: "s3_bucket_id_us_east_1",
    },
    {
      region: "eu-west-1",
      bucketArn: "s3_bucket_arn_eu_west_1",
      bucketId: "s3_bucket_id_eu_west_1",
    },
    {
      region: "ap-southeast-1",
      bucketArn: "s3_bucket_arn_ap_southeast_1",
      bucketId: "s3_bucket_id_ap_southeast_1",
    },
  ];

  buckets.forEach(({ region, bucketArn, bucketId }) => {
    describe(`S3 bucket in ${region}`, () => {
      let s3Client: S3Client;
      let bucketName: string;

      beforeAll(() => {
        s3Client = new S3Client({ region });
        const arn = (outputs as any)[bucketArn];
        bucketName = arn.split(":::")[1];
      });

      it("should have versioning enabled", async () => {
        const versioning = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioning.Status).toBe("Enabled");
      });

      it("should have AES256 encryption enabled", async () => {
        const encryption = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        const rules = encryption.ServerSideEncryptionConfiguration?.Rules || [];
        const hasAES256 = rules.some(
          rule => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256"
        );
        expect(hasAES256).toBe(true);
      });
    });
  });

  it("should have the S3 replication IAM role existing", async () => {
    const iamClient = new IAMClient({ region: "us-east-1" });
    const roleArn = outputs.s3_replication_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });

  it("should have the Lambda execution IAM role existing", async () => {
    const iamClient = new IAMClient({ region: "us-east-1" });
    const roleArn = outputs.lambda_iam_role_arn;
    const roleName = roleArn.split("/").pop()!;
    const resp = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toEqual(roleArn);
  });
});
