// test/terraform-helpers.unit.test.ts
// Unit tests for Terraform helper functions

import {
  validateTerraformConfig,
  hasEnvironmentSuffix,
  validateLambdaArchitecture,
  validatePITR,
  validateStepFunctionsType,
  validateReservedConcurrency,
  parseTerraformOutputs,
  validateIAMPolicy,
  extractEnvironmentSuffix,
  validateLogRetention,
  hasEncryption,
  TerraformConfig,
  ValidationResult
} from "../lib/terraform-helpers";

describe("Terraform Helper Functions", () => {
  describe("validateTerraformConfig", () => {
    test("validates complete configuration", () => {
      const config: TerraformConfig = {
        provider: "aws",
        backend: "s3",
        resources: ["lambda", "dynamodb"]
      };

      const result = validateTerraformConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("detects missing provider", () => {
      const config: TerraformConfig = {
        provider: "",
        backend: "s3",
        resources: ["lambda"]
      };

      const result = validateTerraformConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Provider configuration is required");
    });

    test("detects missing backend", () => {
      const config: TerraformConfig = {
        provider: "aws",
        backend: "",
        resources: ["lambda"]
      };

      const result = validateTerraformConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Backend configuration is required");
    });

    test("warns about no resources", () => {
      const config: TerraformConfig = {
        provider: "aws",
        backend: "s3",
        resources: []
      };

      const result = validateTerraformConfig(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("No resources defined");
    });

    test("handles multiple errors", () => {
      const config: TerraformConfig = {
        provider: "",
        backend: "",
        resources: []
      };

      const result = validateTerraformConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("hasEnvironmentSuffix", () => {
    test("detects environment suffix in resource name", () => {
      expect(hasEnvironmentSuffix("lambda-dev", "dev")).toBe(true);
      expect(hasEnvironmentSuffix("lambda-prod", "prod")).toBe(true);
      expect(hasEnvironmentSuffix("my-resource-dev123", "dev123")).toBe(true);
    });

    test("returns false when suffix is not present", () => {
      expect(hasEnvironmentSuffix("lambda-dev", "prod")).toBe(false);
      expect(hasEnvironmentSuffix("my-resource", "dev")).toBe(false);
    });

    test("handles empty strings", () => {
      expect(hasEnvironmentSuffix("", "dev")).toBe(false);
      expect(hasEnvironmentSuffix("lambda-dev", "")).toBe(true);
    });
  });

  describe("validateLambdaArchitecture", () => {
    test("validates ARM64 architecture is present", () => {
      expect(validateLambdaArchitecture(["arm64"])).toBe(true);
      expect(validateLambdaArchitecture(["x86_64", "arm64"])).toBe(true);
    });

    test("returns false when ARM64 is not present", () => {
      expect(validateLambdaArchitecture(["x86_64"])).toBe(false);
      expect(validateLambdaArchitecture([])).toBe(false);
    });
  });

  describe("validatePITR", () => {
    test("validates PITR is enabled", () => {
      expect(validatePITR(true)).toBe(true);
    });

    test("returns false when PITR is disabled", () => {
      expect(validatePITR(false)).toBe(false);
    });
  });

  describe("validateStepFunctionsType", () => {
    test("validates EXPRESS workflow type", () => {
      expect(validateStepFunctionsType("EXPRESS")).toBe(true);
    });

    test("returns false for non-EXPRESS types", () => {
      expect(validateStepFunctionsType("STANDARD")).toBe(false);
      expect(validateStepFunctionsType("express")).toBe(false);
      expect(validateStepFunctionsType("")).toBe(false);
    });
  });

  describe("validateReservedConcurrency", () => {
    test("validates concurrency matches expected value", () => {
      expect(validateReservedConcurrency(100, 100)).toBe(true);
      expect(validateReservedConcurrency(50, 50)).toBe(true);
    });

    test("returns false when concurrency does not match", () => {
      expect(validateReservedConcurrency(100, 50)).toBe(false);
      expect(validateReservedConcurrency(0, 100)).toBe(false);
    });
  });

  describe("parseTerraformOutputs", () => {
    test("parses valid JSON outputs", () => {
      const json = '{"sns_topic_arn": "arn:aws:sns:us-east-1:123456789012:topic", "table_name": "events-dev"}';
      const result = parseTerraformOutputs(json);

      expect(result.sns_topic_arn).toBe("arn:aws:sns:us-east-1:123456789012:topic");
      expect(result.table_name).toBe("events-dev");
    });

    test("throws error on invalid JSON", () => {
      expect(() => parseTerraformOutputs("invalid json")).toThrow();
      expect(() => parseTerraformOutputs("")).toThrow();
    });

    test("parses empty object", () => {
      const result = parseTerraformOutputs("{}");
      expect(Object.keys(result)).toHaveLength(0);
    });

    test("parses nested objects", () => {
      const json = '{"lambda": {"arn": "arn:aws:lambda:us-east-1:123456789012:function:test"}}';
      const result = parseTerraformOutputs(json);

      expect(result.lambda.arn).toBeDefined();
    });
  });

  describe("validateIAMPolicy", () => {
    test("validates policy without wildcards", () => {
      const policy = '{"Resource": "arn:aws:s3:::my-bucket/*", "Action": "s3:GetObject"}';
      const result = validateIAMPolicy(policy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("warns about wildcard resources", () => {
      const policy = '{"Resource": "*", "Action": "s3:GetObject"}';
      const result = validateIAMPolicy(policy);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("IAM policy contains wildcard resource");
    });

    test("fails on wildcard actions", () => {
      const policy = '{"Resource": "arn:aws:s3:::my-bucket/*", "Action": "*"}';
      const result = validateIAMPolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("IAM policy contains wildcard action - violates least privilege");
    });

    test("detects both wildcard resource and action", () => {
      const policy = '{"Resource": "*", "Action": "*"}';
      const result = validateIAMPolicy(policy);

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("handles empty policy string", () => {
      const result = validateIAMPolicy("");

      expect(result.valid).toBe(true);
    });
  });

  describe("extractEnvironmentSuffix", () => {
    test("extracts suffix from resource name", () => {
      expect(extractEnvironmentSuffix("lambda-dev", "lambda")).toBe("dev");
      expect(extractEnvironmentSuffix("my-resource-prod", "my-resource")).toBe("prod");
      expect(extractEnvironmentSuffix("event-processing-dev123", "event-processing")).toBe("dev123");
    });

    test("returns null when suffix cannot be extracted", () => {
      expect(extractEnvironmentSuffix("lambda", "lambda")).toBeNull();
      expect(extractEnvironmentSuffix("lambda-dev", "resource")).toBeNull();
      expect(extractEnvironmentSuffix("", "lambda")).toBeNull();
    });

    test("handles complex prefixes", () => {
      expect(extractEnvironmentSuffix("my-complex-resource-name-staging", "my-complex-resource-name")).toBe("staging");
    });
  });

  describe("validateLogRetention", () => {
    test("validates retention within range", () => {
      expect(validateLogRetention(30, 1, 365)).toBe(true);
      expect(validateLogRetention(7, 7, 30)).toBe(true);
      expect(validateLogRetention(365, 1, 365)).toBe(true);
    });

    test("returns false for retention outside range", () => {
      expect(validateLogRetention(0, 1, 365)).toBe(false);
      expect(validateLogRetention(400, 1, 365)).toBe(false);
      expect(validateLogRetention(5, 7, 30)).toBe(false);
    });

    test("handles edge cases", () => {
      expect(validateLogRetention(1, 1, 1)).toBe(true);
      expect(validateLogRetention(-1, 0, 10)).toBe(false);
    });
  });

  describe("hasEncryption", () => {
    test("returns true when KMS key is provided", () => {
      expect(hasEncryption("arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012")).toBe(true);
      expect(hasEncryption("alias/aws/logs")).toBe(true);
      expect(hasEncryption("key-id")).toBe(true);
    });

    test("returns false when KMS key is not provided", () => {
      expect(hasEncryption(undefined)).toBe(false);
      expect(hasEncryption("")).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    test("validates complete Lambda configuration", () => {
      const architecture = validateLambdaArchitecture(["arm64"]);
      const concurrency = validateReservedConcurrency(100, 100);
      const resourceName = hasEnvironmentSuffix("validator-dev", "dev");

      expect(architecture).toBe(true);
      expect(concurrency).toBe(true);
      expect(resourceName).toBe(true);
    });

    test("validates complete DynamoDB configuration", () => {
      const pitr = validatePITR(true);
      const resourceName = hasEnvironmentSuffix("processed-events-dev", "dev");

      expect(pitr).toBe(true);
      expect(resourceName).toBe(true);
    });

    test("validates complete Step Functions configuration", () => {
      const workflowType = validateStepFunctionsType("EXPRESS");
      const resourceName = hasEnvironmentSuffix("workflow-dev", "dev");
      const logRetention = validateLogRetention(30, 1, 365);

      expect(workflowType).toBe(true);
      expect(resourceName).toBe(true);
      expect(logRetention).toBe(true);
    });

    test("validates complete security configuration", () => {
      const encryption = hasEncryption("arn:aws:kms:us-east-1:123456789012:key/test");
      const policy = validateIAMPolicy('{"Resource": "arn:aws:dynamodb:us-east-1:*:table/events-*", "Action": "dynamodb:PutItem"}');

      expect(encryption).toBe(true);
      expect(policy.valid).toBe(true);
    });
  });
});
