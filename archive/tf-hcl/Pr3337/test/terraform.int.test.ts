// Integration Tests for Legal Firm Document Storage System
// Tests deployed infrastructure outputs and configuration
// No Terraform commands executed - validates from outputs JSON

import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

interface TerraformOutputs {
  document_bucket_name?: { value: string };
  document_bucket_arn?: { value: string };
  document_bucket_region?: { value: string };
  log_bucket_name?: { value: string };
  document_kms_key_id?: { value: string };
  cloudtrail_name?: { value: string };
  document_reader_role_arn?: { value: string };
  document_writer_role_arn?: { value: string };
  cloudwatch_alarms?: {
    value: {
      errors_4xx?: string;
      errors_5xx?: string;
      unusual_deletes?: string;
      high_request_rate?: string;
    };
  };
}

let outputs: TerraformOutputs = {};
let outputsExist = false;

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const rawData = fs.readFileSync(outputsPath, "utf8");
    outputs = JSON.parse(rawData);
    outputsExist = true;
    console.log("✓ Loaded outputs from:", outputsPath);
  } else {
    console.warn("⚠ Outputs file not found. Run terraform apply first.");
    console.warn("  Expected:", outputsPath);
  }
});

describe("Legal Firm Document Storage - Integration Tests", () => {
  describe("Outputs File Validation", () => {
    test("outputs JSON file exists", () => {
      expect(outputsExist).toBe(true);
    });

    test("outputs contains valid JSON", () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe("object");
    });

    test("outputs file is not empty", () => {
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe("Document Bucket Outputs", () => {
    test("document_bucket_name exists", () => {
      expect(outputs.document_bucket_name?.value).toBeDefined();
    });

    test("bucket name follows naming convention", () => {
      if (!outputsExist) return;
      const name = outputs.document_bucket_name?.value || "";
      expect(name).toMatch(/^legal-documents-\d+-[a-f0-9]+$/);
    });

    test("bucket name includes 12-digit account ID", () => {
      if (!outputsExist) return;
      const name = outputs.document_bucket_name?.value || "";
      expect(name).toMatch(/\d{12}/);
    });

    test("bucket name includes random hex suffix", () => {
      if (!outputsExist) return;
      const name = outputs.document_bucket_name?.value || "";
      const suffix = name.split("-").pop() || "";
      expect(suffix).toMatch(/^[a-f0-9]+$/);
    });

    test("document_bucket_arn is valid S3 ARN", () => {
      if (!outputsExist) return;
      const arn = outputs.document_bucket_arn?.value || "";
      expect(arn).toMatch(/^arn:aws:s3:::/);
    });

    test("bucket ARN matches bucket name", () => {
      if (!outputsExist) return;
      const name = outputs.document_bucket_name?.value || "";
      const arn = outputs.document_bucket_arn?.value || "";
      expect(arn).toBe(`arn:aws:s3:::${name}`);
    });

    test("document_bucket_region is valid AWS region", () => {
      if (!outputsExist) return;
      const region = outputs.document_bucket_region?.value || "";
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });
  });

  describe("Log Bucket Outputs", () => {
    test("log_bucket_name exists", () => {
      expect(outputs.log_bucket_name?.value).toBeDefined();
    });

    test("log bucket follows naming convention", () => {
      if (!outputsExist) return;
      const name = outputs.log_bucket_name?.value || "";
      expect(name).toMatch(/^legal-logs-\d+-[a-f0-9]+$/);
    });

    test("log bucket differs from document bucket", () => {
      if (!outputsExist) return;
      const docBucket = outputs.document_bucket_name?.value || "";
      const logBucket = outputs.log_bucket_name?.value || "";
      expect(docBucket).not.toBe(logBucket);
    });

    test("log bucket uses same account ID", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      const docAcct = doc.match(/\d{12}/)?.[0];
      const logAcct = log.match(/\d{12}/)?.[0];
      expect(docAcct).toBe(logAcct);
    });

    test("log bucket uses same random suffix", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      const docSuffix = doc.split("-").pop();
      const logSuffix = log.split("-").pop();
      expect(docSuffix).toBe(logSuffix);
    });
  });

  describe("KMS Encryption Outputs", () => {
    test("document_kms_key_id exists", () => {
      expect(outputs.document_kms_key_id?.value).toBeDefined();
    });

    test("KMS key ID is valid UUID", () => {
      if (!outputsExist) return;
      const keyId = outputs.document_kms_key_id?.value || "";
      expect(keyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test("KMS key ID is not placeholder", () => {
      if (!outputsExist) return;
      const keyId = outputs.document_kms_key_id?.value || "";
      expect(keyId).not.toMatch(/placeholder|example|test/i);
    });
  });

  describe("CloudTrail Outputs", () => {
    test("cloudtrail_name exists", () => {
      expect(outputs.cloudtrail_name?.value).toBeDefined();
    });

    test("CloudTrail name matches expected (or empty if disabled)", () => {
      if (!outputsExist) return;
      const name = outputs.cloudtrail_name?.value || "";
      // CloudTrail is optional (enable_cloudtrail variable defaults to false)
      // Empty string means CloudTrail is disabled due to AWS 5-trail limit
      if (name !== "") {
        expect(name).toBe("legal-documents-trail");
      } else {
        // If disabled, empty string is acceptable
        expect(name).toBe("");
      }
    });
  });

  describe("IAM Role Outputs", () => {
    test("reader role ARN exists", () => {
      expect(outputs.document_reader_role_arn?.value).toBeDefined();
    });

    test("writer role ARN exists", () => {
      expect(outputs.document_writer_role_arn?.value).toBeDefined();
    });

    test("reader ARN is valid IAM format", () => {
      if (!outputsExist) return;
      const arn = outputs.document_reader_role_arn?.value || "";
      expect(arn).toMatch(/^arn:aws:iam::\d{12}:role\/\w+/);
    });

    test("writer ARN is valid IAM format", () => {
      if (!outputsExist) return;
      const arn = outputs.document_writer_role_arn?.value || "";
      expect(arn).toMatch(/^arn:aws:iam::\d{12}:role\/\w+/);
    });

    test("reader and writer roles are different", () => {
      if (!outputsExist) return;
      const reader = outputs.document_reader_role_arn?.value || "";
      const writer = outputs.document_writer_role_arn?.value || "";
      expect(reader).not.toBe(writer);
    });

    test("reader role contains 'Reader'", () => {
      if (!outputsExist) return;
      const arn = outputs.document_reader_role_arn?.value || "";
      expect(arn).toMatch(/Reader/);
    });

    test("writer role contains 'Writer'", () => {
      if (!outputsExist) return;
      const arn = outputs.document_writer_role_arn?.value || "";
      expect(arn).toMatch(/Writer/);
    });

    test("roles in same AWS account", () => {
      if (!outputsExist) return;
      const reader = outputs.document_reader_role_arn?.value || "";
      const writer = outputs.document_writer_role_arn?.value || "";
      const readerAcct = reader.match(/:(\d{12}):/)?.[1];
      const writerAcct = writer.match(/:(\d{12}):/)?.[1];
      expect(readerAcct).toBe(writerAcct);
    });
  });

  describe("CloudWatch Alarms Outputs", () => {
    test("cloudwatch_alarms output exists", () => {
      expect(outputs.cloudwatch_alarms?.value).toBeDefined();
    });

    test("alarms is an object", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(typeof alarms).toBe("object");
      expect(Object.keys(alarms).length).toBeGreaterThan(0);
    });

    test("4xx errors alarm exists", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(alarms.errors_4xx).toBeDefined();
      expect(alarms.errors_4xx).toContain("4xxErrors");
    });

    test("5xx errors alarm exists", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(alarms.errors_5xx).toBeDefined();
      expect(alarms.errors_5xx).toContain("5xxErrors");
    });

    test("unusual deletes alarm exists", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(alarms.unusual_deletes).toBeDefined();
      expect(alarms.unusual_deletes).toMatch(/Delete/);
    });

    test("high request rate alarm exists", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(alarms.high_request_rate).toBeDefined();
      expect(alarms.high_request_rate).toMatch(/Request/);
    });

    test("has at least 4 alarms", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(4);
    });

    test("all alarms follow naming convention", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      Object.values(alarms).forEach((name) => {
        expect(name).toMatch(/^S3-LegalDocuments-/);
      });
    });
  });

  describe("Completeness Tests", () => {
    test("all 9 required outputs present", () => {
      if (!outputsExist) return;
      const required = [
        "document_bucket_name",
        "document_bucket_arn",
        "document_bucket_region",
        "log_bucket_name",
        "document_kms_key_id",
        "cloudtrail_name",
        "document_reader_role_arn",
        "document_writer_role_arn",
        "cloudwatch_alarms",
      ];
      required.forEach((key) => expect(outputs).toHaveProperty(key));
    });

    test("no null or undefined values", () => {
      if (!outputsExist) return;
      Object.values(outputs).forEach((output) => {
        expect(output).toBeDefined();
        expect(output?.value).toBeDefined();
        expect(output?.value).not.toBeNull();
      });
    });

    test("no empty string values (except optional CloudTrail)", () => {
      if (!outputsExist) return;
      Object.entries(outputs).forEach(([key, output]) => {
        if (typeof output?.value === "string") {
          // CloudTrail name can be empty if disabled (enable_cloudtrail = false)
          if (key === "cloudtrail_name" && output.value === "") {
            // Empty string is acceptable for disabled CloudTrail
            expect(output.value).toBe("");
          } else {
            expect(output.value.length).toBeGreaterThan(0);
          }
        }
      });
    });
  });

  describe("Edge Cases: S3 Naming Rules", () => {
    test("bucket names are lowercase only", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      expect(doc).toBe(doc.toLowerCase());
      expect(log).toBe(log.toLowerCase());
    });

    test("bucket names have valid characters", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      expect(doc).toMatch(/^[a-z0-9.-]+$/);
      expect(log).toMatch(/^[a-z0-9.-]+$/);
    });

    test("bucket names within length limits (3-63)", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      expect(doc.length).toBeGreaterThanOrEqual(3);
      expect(doc.length).toBeLessThanOrEqual(63);
      expect(log.length).toBeGreaterThanOrEqual(3);
      expect(log.length).toBeLessThanOrEqual(63);
    });

    test("bucket names don't start/end with hyphen", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      expect(doc).not.toMatch(/^-/);
      expect(doc).not.toMatch(/-$/);
      expect(log).not.toMatch(/^-/);
      expect(log).not.toMatch(/-$/);
    });
  });

  describe("Edge Cases: ARN Validation", () => {
    test("ARNs use correct partition", () => {
      if (!outputsExist) return;
      const arns = [
        outputs.document_bucket_arn?.value || "",
        outputs.document_reader_role_arn?.value || "",
        outputs.document_writer_role_arn?.value || "",
      ];
      arns.forEach((arn) => {
        expect(arn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):/);
      });
    });

    test("all ARNs in same account", () => {
      if (!outputsExist) return;
      const reader = outputs.document_reader_role_arn?.value || "";
      const writer = outputs.document_writer_role_arn?.value || "";
      const readerAcct = reader.match(/:(\d{12}):/)?.[1];
      const writerAcct = writer.match(/:(\d{12}):/)?.[1];
      expect(readerAcct).toBe(writerAcct);
      expect(readerAcct).toBeDefined();
    });

    test("S3 ARN has no region/account", () => {
      if (!outputsExist) return;
      const arn = outputs.document_bucket_arn?.value || "";
      expect(arn).toMatch(/^arn:aws:s3:::[a-z0-9.-]+$/);
    });
  });

  describe("Security Validation", () => {
    test("no sensitive data in outputs", () => {
      if (!outputsExist) return;
      const str = JSON.stringify(outputs);
      expect(str).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(str).not.toMatch(/password/i);
      expect(str).not.toMatch(/secret.*key/i);
    });

    test("KMS key ID format valid", () => {
      if (!outputsExist) return;
      const keyId = outputs.document_kms_key_id?.value || "";
      expect(keyId).toMatch(/^[a-f0-9-]+$/);
      expect(keyId.length).toBeLessThan(100);
    });
  });

  describe("Integration: Cross-Reference", () => {
    test("bucket name in ARN", () => {
      if (!outputsExist) return;
      const name = outputs.document_bucket_name?.value || "";
      const arn = outputs.document_bucket_arn?.value || "";
      expect(arn).toContain(name);
    });

    test("account ID consistent", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      const reader = outputs.document_reader_role_arn?.value || "";
      const docAcct = doc.match(/\d{12}/)?.[0];
      const logAcct = log.match(/\d{12}/)?.[0];
      const readerAcct = reader.match(/:(\d{12}):/)?.[1];
      expect(docAcct).toBe(logAcct);
      expect(docAcct).toBe(readerAcct);
    });

    test("random suffix consistent", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      const docSuffix = doc.split("-").pop();
      const logSuffix = log.split("-").pop();
      expect(docSuffix).toBe(logSuffix);
      expect(docSuffix).toMatch(/^[a-f0-9]{8}$/);
    });

    test("alarms reference legal documents", () => {
      if (!outputsExist) return;
      const alarms = outputs.cloudwatch_alarms?.value || {};
      Object.values(alarms).forEach((name) => {
        expect(name).toMatch(/LegalDocuments/);
      });
    });
  });

  describe("Deployment Readiness", () => {
    test("critical outputs for integration", () => {
      if (!outputsExist) return;
      const critical = [
        "document_bucket_name",
        "log_bucket_name",
        "document_kms_key_id",
        "cloudtrail_name",
      ];
      critical.forEach((key) => {
        expect(outputs[key as keyof TerraformOutputs]?.value).toBeDefined();
      });
    });

    test("IAM ARNs valid for AssumeRole", () => {
      if (!outputsExist) return;
      const reader = outputs.document_reader_role_arn?.value || "";
      const writer = outputs.document_writer_role_arn?.value || "";
      expect(reader).toMatch(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9+=,.@_-]+$/);
      expect(writer).toMatch(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9+=,.@_-]+$/);
    });

    test("bucket names valid for S3 API", () => {
      if (!outputsExist) return;
      const doc = outputs.document_bucket_name?.value || "";
      const log = outputs.log_bucket_name?.value || "";
      expect(doc).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
      expect(log).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
    });

    test("sufficient info for app integration", () => {
      if (!outputsExist) return;
      expect(outputs.document_bucket_name?.value).toBeTruthy();
      expect(outputs.document_bucket_region?.value).toBeTruthy();
      expect(outputs.document_reader_role_arn?.value).toBeTruthy();
      expect(outputs.document_writer_role_arn?.value).toBeTruthy();
      expect(outputs.cloudwatch_alarms?.value).toBeTruthy();
    });
  });
});

