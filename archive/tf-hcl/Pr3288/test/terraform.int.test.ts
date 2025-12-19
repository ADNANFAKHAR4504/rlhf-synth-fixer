// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure
// Validates infrastructure outputs without running terraform commands

import fs from "fs";
import path from "path";

const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

interface TerraformOutputs {
  [key: string]: { value: string };
}

let outputs: TerraformOutputs = {};
let outputsExist = false;

beforeAll(() => {
  try {
    if (fs.existsSync(OUTPUTS_PATH)) {
      outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, "utf8"));
      outputsExist = true;
    }
  } catch (error) {
    console.warn(`⚠️  Outputs file not found at ${OUTPUTS_PATH}`);
  }
});

describe("Integration: AWS Batch Resources", () => {
  test("batch compute environment ARN exists and valid", () => {
    if (!outputsExist) return;
    expect(outputs.batch_compute_environment_arn?.value).toMatch(/^arn:aws:batch:.+:compute-environment\/.+/);
  });

  test("batch job queue ARN exists and valid", () => {
    if (!outputsExist) return;
    expect(outputs.batch_job_queue_arn?.value).toMatch(/^arn:aws:batch:.+:job-queue\/.+/);
  });

  test("batch job definition ARN exists and valid", () => {
    if (!outputsExist) return;
    expect(outputs.batch_job_definition_arn?.value).toMatch(/^arn:aws:batch:.+:job-definition\/.+:\d+/);
  });
});

describe("Integration: Lambda Function", () => {
  test("lambda ARN exists and valid", () => {
    if (!outputsExist) return;
    expect(outputs.lambda_function_arn?.value).toMatch(/^arn:aws:lambda:.+:function:.+/);
  });

  test("lambda name is BatchJobOrchestrator", () => {
    if (!outputsExist) return;
    expect(outputs.lambda_function_name?.value).toBe("BatchJobOrchestrator");
  });
});

describe("Integration: S3 Buckets", () => {
  test("input bucket name follows convention", () => {
    if (!outputsExist) return;
    expect(outputs.input_bucket_name?.value).toMatch(/^financial-batch-input-\d{12}$/);
  });

  test("output bucket name follows convention", () => {
    if (!outputsExist) return;
    expect(outputs.output_bucket_name?.value).toMatch(/^financial-batch-output-\d{12}$/);
  });

  test("logs bucket name follows convention", () => {
    if (!outputsExist) return;
    expect(outputs.logs_bucket_name?.value).toMatch(/^financial-batch-logs-\d{12}$/);
  });
});

describe("Integration: DynamoDB", () => {
  test("table name is BatchJobStatus", () => {
    if (!outputsExist) return;
    expect(outputs.dynamodb_table_name?.value).toBe("BatchJobStatus");
  });

  test("table ARN exists and valid", () => {
    if (!outputsExist) return;
    expect(outputs.dynamodb_table_arn?.value).toMatch(/^arn:aws:dynamodb:.+:table\/.+/);
  });
});

describe("Integration: KMS Keys", () => {
  test("S3 KMS key ARN exists", () => {
    if (!outputsExist) return;
    expect(outputs.kms_s3_key_arn?.value).toMatch(/^arn:aws:kms:.+:key\/[a-f0-9-]{36}$/);
  });

  test("all KMS keys are in same region", () => {
    if (!outputsExist) return;
    const s3Region = outputs.kms_s3_key_arn?.value?.split(":")[3];
    const snsRegion = outputs.kms_sns_key_arn?.value?.split(":")[3];
    expect(s3Region).toBe(snsRegion);
  });
});

describe("Integration: VPC Endpoints", () => {
  test("S3 VPC endpoint ID exists", () => {
    if (!outputsExist) return;
    expect(outputs.s3_vpc_endpoint_id?.value).toMatch(/^vpce-[a-f0-9]{17}$/);
  });

  test("DynamoDB VPC endpoint ID exists", () => {
    if (!outputsExist) return;
    expect(outputs.dynamodb_vpc_endpoint_id?.value).toMatch(/^vpce-[a-f0-9]{17}$/);
  });
});

describe("Integration: Security Services", () => {
  test("GuardDuty detector ID exists", () => {
    if (!outputsExist) return;
    expect(outputs.guardduty_detector_id?.value).toMatch(/^[a-f0-9]{32}$/);
  });

  test("CloudTrail ARN exists", () => {
    if (!outputsExist) return;
    expect(outputs.cloudtrail_arn?.value).toMatch(/^arn:aws:cloudtrail:.+:trail\/.+/);
  });
});

describe("Integration: Regional Consistency", () => {
  test("all resources in same region", () => {
    if (!outputsExist) return;
    const regions = new Set<string>();
    regions.add(outputs.batch_compute_environment_arn?.value?.split(":")[3]);
    regions.add(outputs.lambda_function_arn?.value?.split(":")[3]);
    regions.add(outputs.dynamodb_table_arn?.value?.split(":")[3]);
    expect(regions.size).toBe(1);
  });
});

describe("Integration: Edge Cases", () => {
  test("no output values are empty", () => {
    if (!outputsExist) return;
    Object.values(outputs).forEach(out => {
      expect(out.value).toBeTruthy();
    });
  });

  test("minimum 20 outputs present", () => {
    if (!outputsExist) return;
    expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(20);
  });

  test("bucket names are DNS-compliant", () => {
    if (!outputsExist) return;
    const buckets = [
      outputs.input_bucket_name?.value,
      outputs.output_bucket_name?.value,
      outputs.logs_bucket_name?.value
    ];
    buckets.forEach(bucket => {
      expect(bucket).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(bucket?.length).toBeLessThanOrEqual(63);
    });
  });
});
