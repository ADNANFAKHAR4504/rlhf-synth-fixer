import { readFileSync } from "fs";
import path from "path";

interface TerraformOutput {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: TerraformOutput;
}

describe("Terraform Infrastructure Integration Tests", () => {
  let tf: TerraformOutputs;

  beforeAll(() => {
    const tfOutputPath = path.resolve(process.cwd(), "tf-output.json");
    const raw = readFileSync(tfOutputPath, "utf8");
    tf = JSON.parse(raw);
  });

  it("should output a valid VPC ID", () => {
    expect(tf.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
  });

  it("should output a valid S3 data bucket name", () => {
    expect(tf.s3_data_bucket_name.value).toMatch(/^[a-z0-9.-]{3,63}$/);
  });

  it("should output a valid NAT Gateway ID", () => {
    expect(tf.nat_gateway_id.value).toMatch(/^nat-[a-z0-9]+$/);
  });

  it("should output a valid KMS key ARN", () => {
    expect(tf.kms_key_arn.value).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-z0-9-]+$/);
  });

  it("should output a valid instance profile name", () => {
    expect(tf.instance_profile_name.value).toBeDefined();
  });
});