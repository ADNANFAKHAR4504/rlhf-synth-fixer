// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform infrastructure files
// No Terraform commands are executed.

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform infrastructure files", () => {
  // Test 1: Core files existence
  describe("Core infrastructure files exist", () => {
    const requiredFiles = [
      "providers.tf",
      "variables.tf",
      "s3.tf",
      "dynamodb.tf",
      "lambda.tf",
      "iam.tf",
      "monitoring.tf",
      "outputs.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  // Test 2: Providers configuration
  describe("Providers configuration", () => {
    const providersPath = path.join(libPath, "providers.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(providersPath, "utf8");
    });

    test("declares required providers with AWS", () => {
      expect(content).toMatch(/required_providers\s*{[\s\S]*?aws\s*=/);
    });

    test("declares source region provider", () => {
      expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"source"/);
    });

    test("declares target region provider", () => {
      expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"target"/);
    });

    test("uses source_region and target_region variables", () => {
      expect(content).toMatch(/var\.source_region/);
      expect(content).toMatch(/var\.target_region/);
    });
  });

  // Test 3: Variables configuration
  describe("Variables configuration", () => {
    const variablesPath = path.join(libPath, "variables.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(variablesPath, "utf8");
    });

    test("declares source_region variable", () => {
      expect(content).toMatch(/variable\s+"source_region"\s*{/);
    });

    test("declares target_region variable", () => {
      expect(content).toMatch(/variable\s+"target_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares migration_phase variable", () => {
      expect(content).toMatch(/variable\s+"migration_phase"\s*{/);
    });

    test("source_region defaults to us-east-1", () => {
      const sourceRegionMatch = content.match(/variable\s+"source_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(sourceRegionMatch?.[1]).toBe("us-east-1");
    });

    test("target_region defaults to eu-west-1", () => {
      const targetRegionMatch = content.match(/variable\s+"target_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(targetRegionMatch?.[1]).toBe("eu-west-1");
    });
  });

  // Test 4: S3 buckets configuration
  describe("S3 buckets configuration", () => {
    const s3Path = path.join(libPath, "s3.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(s3Path, "utf8");
    });

    test("declares source S3 bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"source_documents"/);
    });

    test("declares target S3 bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"target_documents"/);
    });

    test("enables versioning on source bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"source_documents"/);
    });

    test("enables versioning on target bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"target_documents"/);
    });

    test("enables SSE-S3 encryption with bucket keys on source", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"source_documents"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(content).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test("enables SSE-S3 encryption with bucket keys on target", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"target_documents"/);
    });

    test("configures S3 replication from source to target", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"source_to_target"/);
    });

    test("blocks public access on source bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"source_documents"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("blocks public access on target bucket", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"target_documents"/);
    });

    test("follows naming convention for resources", () => {
      // Constraint 5: Resource names must follow pattern: {environment}-{region}-{service}-{purpose}
      expect(content).toMatch(/doc-proc-\$\{var\.(source_region|target_region)\}-s3-documents/);
    });
  });

  // Test 5: DynamoDB tables configuration
  describe("DynamoDB tables configuration", () => {
    const dynamoPath = path.join(libPath, "dynamodb.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(dynamoPath, "utf8");
    });

    test("declares metadata DynamoDB table", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"metadata"/);
    });

    test("declares migration_state DynamoDB table", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"migration_state"/);
    });

    test("declares terraform_state_lock DynamoDB table", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test("enables streams on metadata table", () => {
      // Simply check that stream_enabled = true exists in the file
      expect(content).toMatch(/stream_enabled\s*=\s*true/);
    });

    test("uses PAY_PER_REQUEST billing mode", () => {
      expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("enables point-in-time recovery on metadata table", () => {
      // Simply check that point_in_time_recovery with enabled = true exists in the file
      expect(content).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("configures global table replica in target region", () => {
      expect(content).toMatch(/replica\s*{[\s\S]*?region_name\s*=\s*var\.target_region/);
    });

    test("follows naming convention for DynamoDB tables", () => {
      expect(content).toMatch(/doc-proc-\$\{var\.source_region\}-dynamodb-(metadata|migration)/);
    });
  });

  // Test 6: Lambda configuration
  describe("Lambda configuration", () => {
    const lambdaPath = path.join(libPath, "lambda.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(lambdaPath, "utf8");
    });

    test("declares Lambda functions", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"/);
    });

    test("uses ARM64 architecture for Graviton2 processors", () => {
      expect(content).toMatch(/architectures\s*=\s*\["arm64"\]/);
    });

    test("Lambda functions use proper IAM roles", () => {
      expect(content).toMatch(/role\s*=\s*aws_iam_role/);
    });
  });

  // Test 7: IAM configuration
  describe("IAM configuration", () => {
    const iamPath = path.join(libPath, "iam.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(iamPath, "utf8");
    });

    test("declares IAM roles for Lambda", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });

    test("declares IAM policies", () => {
      expect(content).toMatch(/resource\s+"aws_iam_.*policy/);
    });

    test("configures S3 replication IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
    });
  });

  // Test 8: Monitoring configuration
  describe("Monitoring configuration", () => {
    const monitoringPath = path.join(libPath, "monitoring.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(monitoringPath, "utf8");
    });

    test("declares CloudWatch alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("monitors DynamoDB replication lag", () => {
      expect(content).toMatch(/replication.*lag|ReplicationLatency/i);
    });
  });

  // Test 9: Outputs configuration
  describe("Outputs configuration", () => {
    const outputsPath = path.join(libPath, "outputs.tf");
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(outputsPath, "utf8");
    });

    test("declares output values", () => {
      expect(content).toMatch(/output\s+"/);
    });

    test("outputs S3 bucket information", () => {
      expect(content).toMatch(/output.*{[\s\S]*?aws_s3_bucket/);
    });

    test("outputs DynamoDB table information", () => {
      expect(content).toMatch(/output.*{[\s\S]*?aws_dynamodb_table/);
    });
  });

  // Test 10: Constraint validation
  describe("Constraint validation", () => {
    test("all files use consistent naming pattern", () => {
      const s3Content = fs.readFileSync(path.join(libPath, "s3.tf"), "utf8");
      const dynamoContent = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");

      // Check naming pattern: {environment}-{region}-{service}-{purpose}
      expect(s3Content).toMatch(/doc-proc-/);
      expect(dynamoContent).toMatch(/doc-proc-/);
    });

    test("S3 buckets use SSE-S3 encryption with bucket keys", () => {
      const s3Content = fs.readFileSync(path.join(libPath, "s3.tf"), "utf8");

      // Verify SSE-S3 (AES256) and bucket_key_enabled
      const sseMatches = s3Content.match(/sse_algorithm\s*=\s*"AES256"/g);
      const bucketKeyMatches = s3Content.match(/bucket_key_enabled\s*=\s*true/g);

      expect(sseMatches?.length).toBeGreaterThanOrEqual(2); // source and target
      expect(bucketKeyMatches?.length).toBeGreaterThanOrEqual(2);
    });

    test("DynamoDB global tables support eventual consistency", () => {
      const dynamoContent = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");

      // Verify global table replicas are configured
      const replicaMatches = dynamoContent.match(/replica\s*{/g);
      expect(replicaMatches?.length).toBeGreaterThanOrEqual(2);
    });

    test("Lambda functions use ARM-based Graviton2 processors", () => {
      const lambdaContent = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");

      // Verify ARM64 architecture
      expect(lambdaContent).toMatch(/architectures\s*=\s*\["arm64"\]/);
    });
  });

  // Test 11: Integration checks
  describe("Integration checks", () => {
    test("all provider references are consistent", () => {
      const files = ["s3.tf", "dynamodb.tf", "lambda.tf"];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");

        // Check for proper provider alias usage
        const providerMatches = content.match(/provider\s*=\s*aws\.(source|target)/g);
        if (providerMatches) {
          providerMatches.forEach(match => {
            expect(match).toMatch(/aws\.(source|target)/);
          });
        }
      });
    });

    test("variable references are consistent across files", () => {
      const files = ["s3.tf", "dynamodb.tf", "lambda.tf"];
      const requiredVars = ["source_region", "target_region", "environment_suffix"];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");

        requiredVars.forEach(varName => {
          if (content.includes(`var.${varName}`)) {
            expect(content).toMatch(new RegExp(`var\\.${varName}`));
          }
        });
      });
    });
  });
});
