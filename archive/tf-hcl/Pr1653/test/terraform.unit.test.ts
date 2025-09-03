// Unit tests for Terraform infrastructure
import fs from "fs";
import path from "path";
import { parse } from "hcl2-parser";

const libPath = path.resolve(__dirname, "../lib");
const tapStackPath = path.join(libPath, "tap_stack.tf");
const variablesPath = path.join(libPath, "variables.tf");
const outputsPath = path.join(libPath, "outputs.tf");
const localsPath = path.join(libPath, "locals.tf");
const providerPath = path.join(libPath, "provider.tf");

describe("Terraform Infrastructure - File Structure", () => {
  test("all required Terraform files exist", () => {
    expect(fs.existsSync(tapStackPath)).toBe(true);
    expect(fs.existsSync(variablesPath)).toBe(true);
    expect(fs.existsSync(outputsPath)).toBe(true);
    expect(fs.existsSync(localsPath)).toBe(true);
    expect(fs.existsSync(providerPath)).toBe(true);
  });
});

describe("Terraform Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares bucket_name variable with corp- prefix", () => {
    expect(variablesContent).toMatch(/variable\s+"bucket_name"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"corp-s3-bucket"/);
  });

  test("declares lambda_function_name variable with corp- prefix", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_function_name"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"corp-s3-processor"/);
  });

  test("declares common_tags variable", () => {
    expect(variablesContent).toMatch(/variable\s+"common_tags"\s*{/);
  });
});

describe("Terraform Infrastructure - Local Values", () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = fs.readFileSync(localsPath, "utf8");
  });

  test("defines local values for resource naming with environment suffix", () => {
    expect(localsContent).toMatch(/locals\s*{/);
    expect(localsContent).toMatch(/actual_bucket_name/);
    expect(localsContent).toMatch(/actual_lambda_name/);
    expect(localsContent).toMatch(/actual_iam_role_name/);
    expect(localsContent).toMatch(/actual_iam_policy_name/);
    expect(localsContent).toMatch(/actual_log_group_name/);
  });

  test("local values use conditional logic for environment suffix", () => {
    expect(localsContent).toMatch(/var\.environment_suffix\s*!=\s*""/);
  });
});

describe("Terraform Infrastructure - S3 Resources", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(tapStackPath, "utf8");
  });

  test("declares S3 bucket resource", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"corp_bucket"\s*{/);
  });

  test("S3 bucket uses local.actual_bucket_name", () => {
    expect(tapStackContent).toMatch(/bucket\s*=\s*"\$\{local\.actual_bucket_name\}-\$\{random_id\.bucket_suffix\.hex\}"/);
  });

  test("declares S3 bucket versioning resource", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"corp_bucket_versioning"\s*{/);
    expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("declares S3 bucket public access block resource", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"corp_bucket_pab"\s*{/);
    expect(tapStackContent).toMatch(/block_public_policy\s*=\s*false/);
  });

  test("declares S3 bucket policy for public read access", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"corp_bucket_policy"\s*{/);
    expect(tapStackContent).toMatch(/Action\s*=\s*"s3:GetObject"/);
    expect(tapStackContent).toMatch(/Principal\s*=\s*"\*"/);
  });

  test("declares S3 bucket notification for Lambda trigger", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"corp_bucket_notification"\s*{/);
    expect(tapStackContent).toMatch(/events\s*=\s*\["s3:ObjectCreated:\*"\]/);
  });

  test("declares random_id for bucket uniqueness", () => {
    expect(tapStackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
    expect(tapStackContent).toMatch(/byte_length\s*=\s*4/);
  });
});

describe("Terraform Infrastructure - Lambda Resources", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(tapStackPath, "utf8");
  });

  test("declares Lambda function resource", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_lambda_function"\s+"corp_s3_processor"\s*{/);
  });

  test("Lambda function uses local.actual_lambda_name", () => {
    expect(tapStackContent).toMatch(/function_name\s*=\s*local\.actual_lambda_name/);
  });

  test("Lambda function has correct runtime and handler", () => {
    expect(tapStackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    expect(tapStackContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
  });

  test("Lambda function has reserved concurrent executions", () => {
    expect(tapStackContent).toMatch(/reserved_concurrent_executions\s*=\s*100/);
  });

  test("declares Lambda permission for S3 to invoke", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_s3_invoke"\s*{/);
    expect(tapStackContent).toMatch(/principal\s*=\s*"s3\.amazonaws\.com"/);
  });

  test("declares CloudWatch log group for Lambda", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"corp_lambda_logs"\s*{/);
    expect(tapStackContent).toMatch(/retention_in_days\s*=\s*14/);
  });

  test("declares archive_file data source for Lambda code", () => {
    expect(tapStackContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"\s*{/);
    expect(tapStackContent).toMatch(/type\s*=\s*"zip"/);
  });
});

describe("Terraform Infrastructure - IAM Resources", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(tapStackPath, "utf8");
  });

  test("declares IAM role for Lambda", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"corp_lambda_role"\s*{/);
  });

  test("IAM role uses local.actual_iam_role_name", () => {
    expect(tapStackContent).toMatch(/name\s*=\s*local\.actual_iam_role_name/);
  });

  test("IAM role has correct assume role policy", () => {
    expect(tapStackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
  });

  test("declares IAM policy for Lambda", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_iam_policy"\s+"corp_lambda_policy"\s*{/);
  });

  test("IAM policy uses local.actual_iam_policy_name", () => {
    expect(tapStackContent).toMatch(/name\s*=\s*local\.actual_iam_policy_name/);
  });

  test("IAM policy includes S3 permissions", () => {
    expect(tapStackContent).toMatch(/"s3:GetObject"/);
    expect(tapStackContent).toMatch(/"s3:GetObjectVersion"/);
    expect(tapStackContent).toMatch(/"s3:ListBucket"/);
  });

  test("IAM policy includes CloudWatch logs permissions", () => {
    expect(tapStackContent).toMatch(/"logs:CreateLogGroup"/);
    expect(tapStackContent).toMatch(/"logs:CreateLogStream"/);
    expect(tapStackContent).toMatch(/"logs:PutLogEvents"/);
  });

  test("declares IAM role policy attachment", () => {
    expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"corp_lambda_policy_attachment"\s*{/);
  });
});

describe("Terraform Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("declares bucket_name output", () => {
    expect(outputsContent).toMatch(/output\s+"bucket_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.corp_bucket\.bucket/);
  });

  test("declares bucket_arn output", () => {
    expect(outputsContent).toMatch(/output\s+"bucket_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.corp_bucket\.arn/);
  });

  test("declares lambda_function_name output", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_function_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_lambda_function\.corp_s3_processor\.function_name/);
  });

  test("declares lambda_function_arn output", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_lambda_function\.corp_s3_processor\.arn/);
  });

  test("declares lambda_role_arn output", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_role_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_iam_role\.corp_lambda_role\.arn/);
  });

  test("declares lambda_log_group output", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_log_group"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_cloudwatch_log_group\.corp_lambda_logs\.name/);
  });
});

describe("Terraform Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("declares terraform block with required version", () => {
    expect(providerContent).toMatch(/terraform\s*{/);
    expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
  });

  test("declares required AWS provider", () => {
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
  });

  test("declares required random provider", () => {
    expect(providerContent).toMatch(/random\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
  });

  test("declares required archive provider", () => {
    expect(providerContent).toMatch(/archive\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
  });

  test("declares S3 backend configuration", () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
  });

  test("configures AWS provider with region", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("Terraform Infrastructure - Best Practices", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(tapStackPath, "utf8");
  });

  test("all resources follow corp- naming convention", () => {
    const variablesContent = fs.readFileSync(variablesPath, "utf8");
    expect(variablesContent).toMatch(/"corp-s3-bucket"/);
    expect(variablesContent).toMatch(/"corp-s3-processor"/);
    const localsContent = fs.readFileSync(localsPath, "utf8");
    expect(localsContent).toMatch(/"corp-lambda-s3-processor-role/);
    expect(localsContent).toMatch(/"corp-lambda-s3-policy/);
  });

  test("uses tags for resource management", () => {
    const tagMatches = tapStackContent.match(/tags\s*=\s*var\.common_tags/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(3);
  });

  test("Lambda function has appropriate dependencies", () => {
    expect(tapStackContent).toMatch(/depends_on\s*=\s*\[/);
    expect(tapStackContent).toMatch(/aws_iam_role_policy_attachment\.corp_lambda_policy_attachment/);
    expect(tapStackContent).toMatch(/aws_cloudwatch_log_group\.corp_lambda_logs/);
  });

  test("S3 notification depends on Lambda permission", () => {
    const notificationMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_notification"[\s\S]*?\n\}/);
    expect(notificationMatch).toBeTruthy();
    expect(notificationMatch![0]).toMatch(/depends_on\s*=\s*\[aws_lambda_permission\.allow_s3_invoke\]/);
  });
});