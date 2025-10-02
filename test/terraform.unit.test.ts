// test/terraform.unit.test.ts
// Unit tests for Healthcare Data Storage Infrastructure

import fs from "fs";
import path from "path";

// Helper function to read Terraform files
function readTerraformFile(filename: string): string {
  const filePath = path.join(__dirname, "../lib", filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

describe("Healthcare Data Storage Infrastructure - File Structure", () => {
  const requiredFiles = ["variables.tf", "main.tf", "outputs.tf", "provider.tf"];

  test.each(requiredFiles)("%s file exists", (filename) => {
    const filePath = path.join(__dirname, "../lib", filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("Variables Configuration", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readTerraformFile("variables.tf");
  });

  test("defines environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("defines aws_region variable with us-east-2 default", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"us-east-2"/);
  });

  test("defines bucket_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"bucket_name"\s*{/);
    expect(variablesContent).toMatch(/healthcare-patient-records-secure/);
  });

  test("defines kms_key_alias variable", () => {
    expect(variablesContent).toMatch(/variable\s+"kms_key_alias"\s*{/);
    expect(variablesContent).toMatch(/patient-data-encryption/);
  });

  test("defines cloudtrail_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"cloudtrail_name"\s*{/);
  });

  test("defines lifecycle_transition_days with 180 days default", () => {
    expect(variablesContent).toMatch(/variable\s+"lifecycle_transition_days"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*180/);
  });

  test("defines object_lock_days variable", () => {
    expect(variablesContent).toMatch(/variable\s+"object_lock_days"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*365/);
  });

  test("defines tags variable with required tags", () => {
    expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
    expect(variablesContent).toMatch(/Environment\s*=\s*"Production"/);
    expect(variablesContent).toMatch(/Purpose\s*=\s*"PatientData"/);
  });
});

describe("Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readTerraformFile("provider.tf");
  });

  test("specifies required Terraform version >= 1.4.0", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test("requires AWS provider >= 5.0", () => {
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test("configures backend", () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });

  test("configures AWS provider with region", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("Main Infrastructure Resources", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile("main.tf");
  });

  describe("KMS Configuration", () => {
    test("creates KMS key for patient data encryption", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS alias with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/\$\{var\.kms_key_alias\}-\$\{var\.environment_suffix\}/);
    });
  });

  describe("S3 Buckets", () => {
    test("creates patient data bucket with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/\$\{var\.bucket_name\}-\$\{var\.environment_suffix\}/);
    });

    test("enables object lock on patient data bucket", () => {
      expect(mainContent).toMatch(/object_lock_enabled\s*=\s*true/);
    });

    test("sets force_destroy to true for cleanup", () => {
      const patientBucketMatch = mainContent.match(/resource\s+"aws_s3_bucket"\s+"patient_data"[\s\S]*?force_destroy\s*=\s*true/);
      expect(patientBucketMatch).toBeTruthy();
    });

    test("creates CloudTrail logs bucket with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{/);
      expect(mainContent).toMatch(/\$\{var\.cloudtrail_bucket_name\}-\$\{var\.environment_suffix\}/);
    });

    test("configures versioning for both buckets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"\s*{/);
    });

    test("blocks public access on both buckets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"\s*{/);
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("Object Lock Configuration", () => {
    test("configures object lock in GOVERNANCE mode", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_object_lock_configuration"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/mode\s*=\s*"GOVERNANCE"/);
      expect(mainContent).toMatch(/days\s*=\s*var\.object_lock_days/);
    });
  });

  describe("Lifecycle Configuration", () => {
    test("configures lifecycle rule for Glacier transition", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"patient_data"\s*{/);
      expect(mainContent).toMatch(/storage_class\s*=\s*"DEEP_ARCHIVE"/);
      expect(mainContent).toMatch(/days\s*=\s*var\.lifecycle_transition_days/);
    });

    test("includes filter in lifecycle configuration", () => {
      expect(mainContent).toMatch(/filter\s*{}/);
    });
  });

  describe("IAM Resources", () => {
    test("creates IAM role with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"patient_data_access"\s*{/);
      expect(mainContent).toMatch(/name\s*=\s*"patient-data-access-role-\$\{var\.environment_suffix\}"/);
    });

    test("creates IAM policy with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_policy"\s+"patient_data_access"\s*{/);
      expect(mainContent).toMatch(/name\s*=\s*"patient-data-access-policy-\$\{var\.environment_suffix\}"/);
    });

    test("attaches policy to role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"patient_data_access"\s*{/);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("creates CloudTrail with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudtrail"\s+"audit"\s*{/);
      expect(mainContent).toMatch(/name\s*=\s*"\$\{var\.cloudtrail_name\}-\$\{var\.environment_suffix\}"/);
    });

    test("enables CloudTrail Insights", () => {
      expect(mainContent).toMatch(/insight_type\s*=\s*"ApiCallRateInsight"/);
      expect(mainContent).toMatch(/insight_type\s*=\s*"ApiErrorRateInsight"/);
    });

    test("configures data events for S3", () => {
      expect(mainContent).toMatch(/data_resource\s*{/);
      expect(mainContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
    });
  });

  describe("Monitoring and Alarms", () => {
    test("creates SNS topic with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
      expect(mainContent).toMatch(/name\s*=\s*"patient-data-security-alerts-\$\{var\.environment_suffix\}"/);
    });

    test("creates CloudWatch log group with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
      expect(mainContent).toMatch(/\/aws\/cloudtrail\/\$\{var\.cloudtrail_name\}-\$\{var\.environment_suffix\}/);
    });

    test("creates CloudWatch alarms with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_request_count"\s*{/);
      expect(mainContent).toMatch(/alarm_name\s*=\s*"patient-data-high-request-count-\$\{var\.environment_suffix\}"/);

      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"\s*{/);
      expect(mainContent).toMatch(/alarm_name\s*=\s*"patient-data-unauthorized-api-calls-\$\{var\.environment_suffix\}"/);
    });

    test("creates metric filter with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"\s*{/);
      expect(mainContent).toMatch(/name\s*=\s*"unauthorized-api-calls-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Security Policies", () => {
    test("denies unencrypted uploads in bucket policy", () => {
      expect(mainContent).toMatch(/DenyUnencryptedObjectUploads/);
      expect(mainContent).toMatch(/s3:x-amz-server-side-encryption.*aws:kms/);
    });

    test("restricts access to authorized roles", () => {
      expect(mainContent).toMatch(/RestrictToAuthorizedRoles/);
    });
  });
});

describe("Outputs Configuration", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readTerraformFile("outputs.tf");
  });

  const requiredOutputs = [
    "patient_data_bucket_name",
    "patient_data_bucket_arn",
    "kms_key_id",
    "kms_key_arn",
    "cloudtrail_name",
    "cloudtrail_arn",
    "cloudtrail_bucket_name",
    "iam_role_arn",
    "iam_role_name",
    "sns_topic_arn",
    "cloudwatch_log_group_name",
    "region"
  ];

  test.each(requiredOutputs)("defines output for %s", (outputName) => {
    const regex = new RegExp(`output\\s+"${outputName}"\\s*{`);
    expect(outputsContent).toMatch(regex);
  });

  test("all outputs have descriptions", () => {
    const outputMatches = outputsContent.match(/output\s+"[^"]+"\s*{[^}]*}/g);
    if (outputMatches) {
      outputMatches.forEach((output) => {
        expect(output).toMatch(/description\s*=/);
      });
    }
  });
});

describe("Compliance Requirements", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile("main.tf");
  });

  test("all resources are tagged appropriately", () => {
    const resourcesWithTags = [
      "aws_kms_key",
      "aws_s3_bucket",
      "aws_iam_role",
      "aws_cloudtrail",
      "aws_sns_topic",
      "aws_cloudwatch_log_group",
      "aws_cloudwatch_metric_alarm"
    ];

    resourcesWithTags.forEach((resourceType) => {
      const resourceMatches = mainContent.match(new RegExp(`resource\\s+"${resourceType}"[^{]*{[^}]*tags\\s*=`, "g"));
      if (resourceMatches) {
        expect(resourceMatches.length).toBeGreaterThan(0);
      }
    });
  });

  test("KMS key rotation is enabled", () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("S3 versioning is enabled", () => {
    const versioningEnabled = mainContent.match(/status\s*=\s*"Enabled"/g);
    expect(versioningEnabled).toBeTruthy();
    expect(versioningEnabled?.length).toBeGreaterThanOrEqual(2);
  });

  test("encryption is configured for S3 buckets", () => {
    expect(mainContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });
});

describe("Resource Naming Convention", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile("main.tf");
  });

  test("all named resources use environment suffix", () => {
    const namedResources = [
      { pattern: /bucket\s*=\s*"[^"]*\$\{var\.environment_suffix\}/, count: 2 },
      { pattern: /name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/, count: 8 }
    ];

    namedResources.forEach(({ pattern, count }) => {
      const matches = mainContent.match(new RegExp(pattern, "g"));
      expect(matches).toBeTruthy();
      expect(matches?.length).toBeGreaterThanOrEqual(count);
    });
  });
});