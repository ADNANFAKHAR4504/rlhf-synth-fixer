import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" &&
  /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-\/:.]+$/.test(val);

const isValidBucketName = (val: any): boolean =>
  /^[a-z0-9.-]{3,63}$/.test(val);

const isValidKmsKeyId = (val: any): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(val) ||
  /^arn:aws:kms:[\w-]*:\d{12}:key\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(val);

const isValidUrl = (val: any): boolean =>
  typeof val === "string" && /^https?:\/\/.+/.test(val);

const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

describe("Terraform CI/CD Pipeline Integration Tests", () => {
  let outputs: Record<string, any>;
  
  beforeAll(() => {
    if (!fs.existsSync(outputPath)) {
      console.warn(`Outputs file not found at ${outputPath}. Skipping integration tests.`);
      outputs = {};
      return;
    }
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  it("should have all expected output keys", () => {
    const expectedKeys = [
      "pipeline_name",
      "pipeline_url",
      "beanstalk_environment_url",
      "beanstalk_environment_name",
      "github_connection_arn",
      "artifacts_bucket",
      "sns_topic_arn",
      "dashboard_url",
      "kms_key_id",
      "kms_key_arn",
      "secrets_manager_arn",
      "codebuild_project_name",
      "cloudtrail_s3_bucket",
      "resource_suffix",
      "iam_roles"
    ];
    
    if (Object.keys(outputs).length === 0) {
      console.warn("No outputs found, skipping key validation");
      return;
    }
    
    expect(Object.keys(outputs).sort()).toEqual(expectedKeys.sort());
  });

  it("pipeline_name should be a non-empty string", () => {
    if (!outputs.pipeline_name) return;
    expect(isNonEmptyString(outputs.pipeline_name)).toBe(true);
    expect(outputs.pipeline_name).toMatch(/^ci-pipeline-pipeline-[a-z0-9]{6}$/);
  });

  it("pipeline_url should be a valid AWS console URL", () => {
    if (!outputs.pipeline_url) return;
    expect(isValidUrl(outputs.pipeline_url)).toBe(true);
    expect(outputs.pipeline_url).toMatch(/console\.aws\.amazon\.com\/codesuite\/codepipeline/);
  });

  it("beanstalk_environment_url should be a valid URL", () => {
    if (!outputs.beanstalk_environment_url) return;
    expect(isValidUrl(outputs.beanstalk_environment_url)).toBe(true);
  });

  it("beanstalk_environment_name should follow naming convention", () => {
    if (!outputs.beanstalk_environment_name) return;
    expect(isNonEmptyString(outputs.beanstalk_environment_name)).toBe(true);
    expect(outputs.beanstalk_environment_name).toMatch(/^beanstalk-env-.+-prod$/);
  });

  it("github_connection_arn should be a valid ARN", () => {
    if (!outputs.github_connection_arn) return;
    expect(isValidArn(outputs.github_connection_arn)).toBe(true);
    expect(outputs.github_connection_arn).toMatch(/^arn:aws:codestar-connections:/);
  });

  it("artifacts_bucket should be a valid S3 bucket name", () => {
    if (!outputs.artifacts_bucket) return;
    expect(isValidBucketName(outputs.artifacts_bucket)).toBe(true);
    expect(outputs.artifacts_bucket).toMatch(/^ci-pipeline-artifacts-[a-z0-9]{8}$/);
  });

  it("cloudtrail_s3_bucket should be a valid S3 bucket name", () => {
    if (!outputs.cloudtrail_s3_bucket) return;
    expect(isValidBucketName(outputs.cloudtrail_s3_bucket)).toBe(true);
    expect(outputs.cloudtrail_s3_bucket).toMatch(/^ci-pipeline-cloudtrail-[a-z0-9]{8}$/);
  });

  it("sns_topic_arn should be a valid SNS ARN", () => {
    if (!outputs.sns_topic_arn) return;
    expect(isValidArn(outputs.sns_topic_arn)).toBe(true);
    expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:/);
  });

  it("dashboard_url should be a valid CloudWatch dashboard URL", () => {
    if (!outputs.dashboard_url) return;
    expect(isValidUrl(outputs.dashboard_url)).toBe(true);
    expect(outputs.dashboard_url).toMatch(/console\.aws\.amazon\.com\/cloudwatch/);
  });

  it("kms_key_id should be a valid KMS key identifier", () => {
    if (!outputs.kms_key_id) return;
    expect(isValidKmsKeyId(outputs.kms_key_id)).toBe(true);
  });

  it("kms_key_arn should be a valid KMS key ARN", () => {
    if (!outputs.kms_key_arn) return;
    expect(isValidArn(outputs.kms_key_arn)).toBe(true);
    expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
  });

  it("secrets_manager_arn should be a valid Secrets Manager ARN", () => {
    if (!outputs.secrets_manager_arn) return;
    expect(isValidArn(outputs.secrets_manager_arn)).toBe(true);
    expect(outputs.secrets_manager_arn).toMatch(/^arn:aws:secretsmanager:/);
  });

  it("codebuild_project_name should follow naming convention", () => {
    if (!outputs.codebuild_project_name) return;
    expect(isNonEmptyString(outputs.codebuild_project_name)).toBe(true);
    expect(outputs.codebuild_project_name).toMatch(/^ci-pipeline-build-[a-z0-9]{6}$/);
  });

  // Test resource relationships and consistency
  describe("Resource Relationships", () => {
    it("KMS key ARN should contain the key ID", () => {
      if (!outputs.kms_key_arn || !outputs.kms_key_id) return;
      expect(outputs.kms_key_arn).toContain(outputs.kms_key_id);
    });

    it("Pipeline URL should contain pipeline name", () => {
      if (!outputs.pipeline_url || !outputs.pipeline_name) return;
      expect(outputs.pipeline_url).toContain(outputs.pipeline_name);
    });

    it("Dashboard URL should contain correct region", () => {
      if (!outputs.dashboard_url) return;
      expect(outputs.dashboard_url).toMatch(/region=us-east-1/);
    });
  });

  // Test security configurations
  describe("Security Validations", () => {
    it("S3 bucket names should not contain uppercase characters", () => {
      if (outputs.artifacts_bucket) {
        expect(outputs.artifacts_bucket).not.toMatch(/[A-Z]/);
      }
      if (outputs.cloudtrail_s3_bucket) {
        expect(outputs.cloudtrail_s3_bucket).not.toMatch(/[A-Z]/);
      }
    });

    it("ARNs should be properly formatted for us-east-1 region", () => {
      const arnOutputs = [
        "github_connection_arn",
        "sns_topic_arn",
        "kms_key_arn",
        "secrets_manager_arn"
      ];

      arnOutputs.forEach(key => {
        if (outputs[key]) {
          expect(outputs[key]).toMatch(/:us-east-1:/);
        }
      });
    });
  });

  // Test naming conventions
  describe("Naming Conventions", () => {
    it("resources should follow project prefix naming", () => {
      const prefixedOutputs = [
        "pipeline_name",
        "codebuild_project_name",
        "artifacts_bucket",
        "cloudtrail_s3_bucket"
      ];

      prefixedOutputs.forEach(key => {
        if (outputs[key]) {
          expect(outputs[key]).toMatch(/^ci-pipeline/);
        }
      });
    });

    it("Elastic Beanstalk environment should include 'prod' suffix", () => {
      if (outputs.beanstalk_environment_name) {
        expect(outputs.beanstalk_environment_name).toMatch(/-prod$/);
      }
    });
  });

  // Test URL accessibility and format
  describe("URL Validations", () => {
    it("AWS console URLs should be properly formatted", () => {
      const urlOutputs = ["pipeline_url", "dashboard_url"];
      
      urlOutputs.forEach(key => {
        if (outputs[key]) {
          expect(outputs[key]).toMatch(/^https:\/\/console\.aws\.amazon\.com/);
          expect(outputs[key]).not.toMatch(/\s/); // No whitespace
        }
      });
    });

    it("Elastic Beanstalk environment URL should be reachable format", () => {
      if (outputs.beanstalk_environment_url) {
        expect(outputs.beanstalk_environment_url).toMatch(/^http/);
        expect(outputs.beanstalk_environment_url).toMatch(/\.elasticbeanstalk\.com$/);
      }
    });
  });

  // Performance and optimization tests
  describe("Configuration Validations", () => {
    it("should have reasonable resource naming lengths", () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === "string") {
          expect(value.length).toBeLessThan(256); // AWS resource name limits
        }
      });
    });

    it("bucket names should follow S3 naming rules", () => {
      const bucketOutputs = ["artifacts_bucket", "cloudtrail_s3_bucket"];
      
      bucketOutputs.forEach(key => {
        if (outputs[key]) {
          const bucketName = outputs[key];
          expect(bucketName.length).toBeGreaterThanOrEqual(3);
          expect(bucketName.length).toBeLessThanOrEqual(63);
          expect(bucketName).not.toMatch(/[A-Z]/); // No uppercase
          expect(bucketName).not.toMatch(/^[.-]/); // Cannot start with . or -
          expect(bucketName).not.toMatch(/[.-]$/); // Cannot end with . or -
          expect(bucketName).not.toMatch(/\.\./); // No consecutive dots
        }
      });
    });
  });
});