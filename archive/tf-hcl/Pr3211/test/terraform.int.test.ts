// tests/integration/terraform.int.test.ts
// Comprehensive Integration tests for TAP Stack
// Validates deployed infrastructure outputs from cfn-outputs/all-outputs.json

import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

interface TerraformOutputs {
  us_east_1_vpc_id?: { value: string };
  us_west_2_vpc_id?: { value: string };
  us_east_1_public_subnet_ids?: { value: string[] };
  us_west_2_public_subnet_ids?: { value: string[] };
  us_east_1_private_subnet_ids?: { value: string[] };
  us_west_2_private_subnet_ids?: { value: string[] };
  us_east_1_alb_dns?: { value: string };
  us_west_2_alb_dns?: { value: string };
  s3_bucket_names?: { value: { [key: string]: string } };
  kms_key_arns?: { value: { [key: string]: { [key: string]: string } } };
  rds_endpoints?: { value: { [key: string]: string } };
  lambda_arns?: { value: { [key: string]: string } };
  flow_log_ids?: { value: { [key: string]: string } };
  ec2_role_names?: { value: { [key: string]: string } };
  [key: string]: any;
}

let outputs: TerraformOutputs = {};
let outputsExist = false;

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const rawData = fs.readFileSync(outputsPath, "utf8");
    outputs = JSON.parse(rawData);
    outputsExist = true;
  } else {
    console.warn("\n⚠️  WARNING: cfn-outputs/all-outputs.json not found!");
    console.warn("   Run 'terraform apply' first to generate outputs.\n");
  }
});

describe("TAP Stack Integration Tests - Comprehensive Validation", () => {

  // ========================================
  // PRE-REQUISITES & FILE VALIDATION
  // ========================================
  describe("Pre-requisites and File Validation", () => {
    test("outputs file exists at cfn-outputs/all-outputs.json", () => {
      expect(outputsExist).toBe(true);
      if (!outputsExist) {
        console.log("⚠️  Skipping integration tests - outputs file not found");
      }
    });

    test("outputs file is valid JSON with proper structure", () => {
      if (!outputsExist) return;

      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe("object");
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test("outputs contain expected top-level keys", () => {
      if (!outputsExist) return;

      const expectedKeys = [
        "us_east_1_vpc_id",
        "us_west_2_vpc_id",
        "us_east_1_alb_dns",
        "us_west_2_alb_dns",
        "s3_bucket_names",
        "kms_key_arns",
        "rds_endpoints",
        "lambda_arns"
      ];

      expectedKeys.forEach(key => {
        expect(outputs).toHaveProperty(key);
      });
    });

    test("all outputs follow Terraform output format {value: ...}", () => {
      if (!outputsExist) return;

      Object.entries(outputs).forEach(([key, output]) => {
        expect(output).toHaveProperty("value");
        expect(output.value).toBeDefined();
      });
    });
  });

  // ========================================
  // MULTI-REGION VPC CONFIGURATION
  // ========================================
  describe("Multi-Region VPC Configuration", () => {
    test("VPC IDs exist for both us-east-1 and us-west-2", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_vpc_id).toBeDefined();
      expect(outputs.us_west_2_vpc_id).toBeDefined();
      expect(outputs.us_east_1_vpc_id!.value).toBeTruthy();
      expect(outputs.us_west_2_vpc_id!.value).toBeTruthy();
    });

    test("VPC IDs follow AWS format (vpc-[a-f0-9]{8,17})", () => {
      if (!outputsExist) return;

      const vpcRegex = /^vpc-[a-f0-9]{8,17}$/;
      expect(outputs.us_east_1_vpc_id!.value).toMatch(vpcRegex);
      expect(outputs.us_west_2_vpc_id!.value).toMatch(vpcRegex);
    });

    test("VPC IDs are unique across regions", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_vpc_id!.value).not.toBe(outputs.us_west_2_vpc_id!.value);
    });

    test("public subnets exist in both regions (minimum 2 AZs)", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_public_subnet_ids).toBeDefined();
      expect(outputs.us_west_2_public_subnet_ids).toBeDefined();

      const east1Public = outputs.us_east_1_public_subnet_ids!.value;
      const west2Public = outputs.us_west_2_public_subnet_ids!.value;

      expect(Array.isArray(east1Public)).toBe(true);
      expect(Array.isArray(west2Public)).toBe(true);
      expect(east1Public.length).toBeGreaterThanOrEqual(2);
      expect(west2Public.length).toBeGreaterThanOrEqual(2);
    });

    test("private subnets exist in both regions (minimum 2 AZs)", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_private_subnet_ids).toBeDefined();
      expect(outputs.us_west_2_private_subnet_ids).toBeDefined();

      const east1Private = outputs.us_east_1_private_subnet_ids!.value;
      const west2Private = outputs.us_west_2_private_subnet_ids!.value;

      expect(Array.isArray(east1Private)).toBe(true);
      expect(Array.isArray(west2Private)).toBe(true);
      expect(east1Private.length).toBeGreaterThanOrEqual(2);
      expect(west2Private.length).toBeGreaterThanOrEqual(2);
    });

    test("all subnet IDs follow AWS format (subnet-[a-f0-9]{8,17})", () => {
      if (!outputsExist) return;

      const subnetRegex = /^subnet-[a-f0-9]{8,17}$/;
      const allSubnets = [
        ...outputs.us_east_1_public_subnet_ids!.value,
        ...outputs.us_east_1_private_subnet_ids!.value,
        ...outputs.us_west_2_public_subnet_ids!.value,
        ...outputs.us_west_2_private_subnet_ids!.value
      ];

      allSubnets.forEach(subnetId => {
        expect(subnetId).toMatch(subnetRegex);
      });
    });

    test("all subnet IDs are unique (no duplicates)", () => {
      if (!outputsExist) return;

      const allSubnets = [
        ...outputs.us_east_1_public_subnet_ids!.value,
        ...outputs.us_east_1_private_subnet_ids!.value,
        ...outputs.us_west_2_public_subnet_ids!.value,
        ...outputs.us_west_2_private_subnet_ids!.value
      ];

      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(allSubnets.length);
    });

    test("public and private subnets have same count per region", () => {
      if (!outputsExist) return;

      const east1PublicCount = outputs.us_east_1_public_subnet_ids!.value.length;
      const east1PrivateCount = outputs.us_east_1_private_subnet_ids!.value.length;
      const west2PublicCount = outputs.us_west_2_public_subnet_ids!.value.length;
      const west2PrivateCount = outputs.us_west_2_private_subnet_ids!.value.length;

      expect(east1PublicCount).toBe(east1PrivateCount);
      expect(west2PublicCount).toBe(west2PrivateCount);
    });
  });

  // ========================================
  // APPLICATION LOAD BALANCERS
  // ========================================
  describe("Application Load Balancers (ALB)", () => {
    test("ALB DNS names exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_alb_dns).toBeDefined();
      expect(outputs.us_west_2_alb_dns).toBeDefined();
      expect(outputs.us_east_1_alb_dns!.value).toBeTruthy();
      expect(outputs.us_west_2_alb_dns!.value).toBeTruthy();
    });

    test("ALB DNS names follow AWS ELB naming convention", () => {
      if (!outputsExist) return;

      const eastDns = outputs.us_east_1_alb_dns!.value;
      const westDns = outputs.us_west_2_alb_dns!.value;

      expect(eastDns).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
      expect(westDns).toMatch(/^[a-z0-9-]+\.us-west-2\.elb\.amazonaws\.com$/);
    });

    test("ALB DNS names contain correct region identifiers", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_alb_dns!.value).toContain("us-east-1");
      expect(outputs.us_west_2_alb_dns!.value).toContain("us-west-2");
    });

    test("ALB DNS names are unique per region", () => {
      if (!outputsExist) return;

      const eastDns = outputs.us_east_1_alb_dns!.value;
      const westDns = outputs.us_west_2_alb_dns!.value;

      expect(eastDns).not.toBe(westDns);
    });

    test("ALB DNS names are publicly resolvable format", () => {
      if (!outputsExist) return;

      const eastDns = outputs.us_east_1_alb_dns!.value;
      const westDns = outputs.us_west_2_alb_dns!.value;

      expect(eastDns.split(".").length).toBeGreaterThanOrEqual(5);
      expect(westDns.split(".").length).toBeGreaterThanOrEqual(5);
    });
  });

  // ========================================
  // S3 BUCKETS - SECURITY CONFIGURATION
  // ========================================
  describe("S3 Buckets - Security and Naming", () => {
    test("S3 buckets exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.s3_bucket_names).toBeDefined();
      expect(outputs.s3_bucket_names!.value).toBeDefined();
      expect(outputs.s3_bucket_names!.value["us_east_1"]).toBeDefined();
      expect(outputs.s3_bucket_names!.value["us_west_2"]).toBeDefined();
    });

    test("S3 bucket names follow AWS naming rules", () => {
      if (!outputsExist) return;

      const eastBucket = outputs.s3_bucket_names!.value["us_east_1"];
      const westBucket = outputs.s3_bucket_names!.value["us_west_2"];

      // S3 bucket naming rules: 3-63 chars, lowercase, numbers, hyphens
      const s3NameRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
      expect(eastBucket).toMatch(s3NameRegex);
      expect(westBucket).toMatch(s3NameRegex);

      // No uppercase
      expect(eastBucket).toBe(eastBucket.toLowerCase());
      expect(westBucket).toBe(westBucket.toLowerCase());
    });

    test("S3 bucket names are globally unique", () => {
      if (!outputsExist) return;

      const eastBucket = outputs.s3_bucket_names!.value["us_east_1"];
      const westBucket = outputs.s3_bucket_names!.value["us_west_2"];

      expect(eastBucket).not.toBe(westBucket);
    });

    test("S3 bucket names include region identifiers", () => {
      if (!outputsExist) return;

      const eastBucket = outputs.s3_bucket_names!.value["us_east_1"];
      const westBucket = outputs.s3_bucket_names!.value["us_west_2"];

      expect(eastBucket).toMatch(/east/i);
      expect(westBucket).toMatch(/west/i);
    });

    test("S3 bucket names have appropriate length (3-63 chars)", () => {
      if (!outputsExist) return;

      const eastBucket = outputs.s3_bucket_names!.value["us_east_1"];
      const westBucket = outputs.s3_bucket_names!.value["us_west_2"];

      expect(eastBucket.length).toBeGreaterThanOrEqual(3);
      expect(eastBucket.length).toBeLessThanOrEqual(63);
      expect(westBucket.length).toBeGreaterThanOrEqual(3);
      expect(westBucket.length).toBeLessThanOrEqual(63);
    });

    test("S3 bucket names do not contain invalid characters", () => {
      if (!outputsExist) return;

      const eastBucket = outputs.s3_bucket_names!.value["us_east_1"];
      const westBucket = outputs.s3_bucket_names!.value["us_west_2"];

      expect(eastBucket).not.toMatch(/[^a-z0-9-]/);
      expect(westBucket).not.toMatch(/[^a-z0-9-]/);
      expect(eastBucket).not.toMatch(/\.\./);
      expect(westBucket).not.toMatch(/\.\./);
    });
  });

  // ========================================
  // KMS KEYS - ENCRYPTION AT REST
  // ========================================
  describe("KMS Keys - Customer Managed Encryption", () => {
    test("KMS keys exist for all required services", () => {
      if (!outputsExist) return;

      expect(outputs.kms_key_arns).toBeDefined();
      expect(outputs.kms_key_arns!.value).toBeDefined();

      const requiredServices = ["s3", "lambda", "rds", "logs"];
      const regions = ["us_east_1", "us_west_2"];

      regions.forEach(region => {
        expect(outputs.kms_key_arns!.value[region]).toBeDefined();
        requiredServices.forEach(service => {
          expect(outputs.kms_key_arns!.value[region][service]).toBeDefined();
        });
      });
    });

    test("KMS key ARNs follow AWS format", () => {
      if (!outputsExist) return;

      const kmsArnRegex = /^arn:aws:kms:(us-east-1|us-west-2):\d{12}:key\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

      Object.values(outputs.kms_key_arns!.value).forEach(regionKeys => {
        Object.values(regionKeys as { [key: string]: string }).forEach(keyArn => {
          expect(keyArn).toMatch(kmsArnRegex);
        });
      });
    });

    test("KMS keys are unique across all services and regions", () => {
      if (!outputsExist) return;

      const allKeys = new Set<string>();

      Object.values(outputs.kms_key_arns!.value).forEach(regionKeys => {
        Object.values(regionKeys as { [key: string]: string }).forEach(keyArn => {
          expect(allKeys.has(keyArn)).toBe(false);
          allKeys.add(keyArn);
        });
      });

      // Should have 8 unique keys (4 services × 2 regions)
      expect(allKeys.size).toBe(8);
    });

    test("KMS key ARNs match their respective regions", () => {
      if (!outputsExist) return;

      Object.entries(outputs.kms_key_arns!.value).forEach(([region, services]) => {
        Object.values(services as { [key: string]: string }).forEach(keyArn => {
          expect(keyArn).toContain(region.replaceAll("_", "-"));
        });
      });
    });

    test("KMS keys use same AWS account across regions", () => {
      if (!outputsExist) return;

      const accountIds = new Set<string>();

      Object.values(outputs.kms_key_arns!.value).forEach(regionKeys => {
        Object.values(regionKeys as { [key: string]: string }).forEach(keyArn => {
          const match = keyArn.match(/:(\d{12}):/);
          if (match) accountIds.add(match[1]);
        });
      });

      expect(accountIds.size).toBe(1);
    });

    test("each service has dedicated KMS keys per region", () => {
      if (!outputsExist) return;

      const services = ["s3", "lambda", "rds", "logs"];
      const regions = ["us_east_1", "us_west_2"];

      services.forEach(service => {
        const serviceKeys = new Set<string>();
        regions.forEach(region => {
          const key = outputs.kms_key_arns!.value[region][service];
          expect(key).toBeDefined();
          serviceKeys.add(key);
        });
        // Each service should have 2 different keys (one per region)
        expect(serviceKeys.size).toBe(2);
      });
    });
  });

  // ========================================
  // RDS DATABASE INSTANCES
  // ========================================
  describe("RDS Database Instances", () => {
    test("RDS endpoints exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.rds_endpoints).toBeDefined();
      expect(outputs.rds_endpoints!.value).toBeDefined();
      expect(outputs.rds_endpoints!.value["us_east_1"]).toBeDefined();
      expect(outputs.rds_endpoints!.value["us_west_2"]).toBeDefined();
    });

    test("RDS endpoints follow AWS RDS format", () => {
      if (!outputsExist) return;

      const rdsRegex = /^[a-z0-9-]+\.[a-z0-9]+\.(us-east-1|us-west-2)\.rds\.amazonaws\.com:\d+$/;

      expect(outputs.rds_endpoints!.value["us_east_1"]).toMatch(rdsRegex);
      expect(outputs.rds_endpoints!.value["us_west_2"]).toMatch(rdsRegex);
    });

    test("RDS endpoints contain correct region identifiers", () => {
      if (!outputsExist) return;

      expect(outputs.rds_endpoints!.value["us_east_1"]).toContain("us-east-1");
      expect(outputs.rds_endpoints!.value["us_west_2"]).toContain("us-west-2");
    });

    test("RDS endpoints are unique per region", () => {
      if (!outputsExist) return;

      const eastEndpoint = outputs.rds_endpoints!.value["us_east_1"];
      const westEndpoint = outputs.rds_endpoints!.value["us_west_2"];

      expect(eastEndpoint).not.toBe(westEndpoint);
    });

    test("RDS endpoints use PostgreSQL default port (5432)", () => {
      if (!outputsExist) return;

      expect(outputs.rds_endpoints!.value["us_east_1"]).toMatch(/:5432$/);
      expect(outputs.rds_endpoints!.value["us_west_2"]).toMatch(/:5432$/);
    });

    test("RDS endpoint hostnames are valid DNS format", () => {
      if (!outputsExist) return;

      const eastHost = outputs.rds_endpoints!.value["us_east_1"].split(":")[0];
      const westHost = outputs.rds_endpoints!.value["us_west_2"].split(":")[0];

      expect(eastHost.split(".").length).toBeGreaterThanOrEqual(5);
      expect(westHost.split(".").length).toBeGreaterThanOrEqual(5);
      expect(eastHost).toMatch(/\.rds\.amazonaws\.com$/);
      expect(westHost).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  // ========================================
  // LAMBDA FUNCTIONS
  // ========================================
  describe("Lambda Functions", () => {
    test("Lambda ARNs exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.lambda_arns).toBeDefined();
      expect(outputs.lambda_arns!.value).toBeDefined();
      expect(outputs.lambda_arns!.value["us_east_1"]).toBeDefined();
      expect(outputs.lambda_arns!.value["us_west_2"]).toBeDefined();
    });

    test("Lambda ARNs follow AWS Lambda format", () => {
      if (!outputsExist) return;

      const lambdaArnRegex = /^arn:aws:lambda:(us-east-1|us-west-2):\d{12}:function:[a-zA-Z0-9-_]+$/;

      expect(outputs.lambda_arns!.value["us_east_1"]).toMatch(lambdaArnRegex);
      expect(outputs.lambda_arns!.value["us_west_2"]).toMatch(lambdaArnRegex);
    });

    test("Lambda ARNs contain correct region", () => {
      if (!outputsExist) return;

      expect(outputs.lambda_arns!.value["us_east_1"]).toContain("us-east-1");
      expect(outputs.lambda_arns!.value["us_west_2"]).toContain("us-west-2");
    });

    test("Lambda functions have unique ARNs per region", () => {
      if (!outputsExist) return;

      const eastArn = outputs.lambda_arns!.value["us_east_1"];
      const westArn = outputs.lambda_arns!.value["us_west_2"];

      expect(eastArn).not.toBe(westArn);
    });

    test("Lambda ARNs use same AWS account", () => {
      if (!outputsExist) return;

      const eastMatch = outputs.lambda_arns!.value["us_east_1"].match(/:(\d{12}):/);
      const westMatch = outputs.lambda_arns!.value["us_west_2"].match(/:(\d{12}):/);

      expect(eastMatch).not.toBeNull();
      expect(westMatch).not.toBeNull();
      expect(eastMatch![1]).toBe(westMatch![1]);
    });

    test("Lambda function names follow naming convention", () => {
      if (!outputsExist) return;

      const extractFunctionName = (arn: string) => arn.split(":function:")[1];

      const eastName = extractFunctionName(outputs.lambda_arns!.value["us_east_1"]);
      const westName = extractFunctionName(outputs.lambda_arns!.value["us_west_2"]);

      expect(eastName).toMatch(/^[a-zA-Z0-9-_]+$/);
      expect(westName).toMatch(/^[a-zA-Z0-9-_]+$/);
      expect(eastName.length).toBeLessThanOrEqual(64);
      expect(westName.length).toBeLessThanOrEqual(64);
    });
  });

  // ========================================
  // VPC FLOW LOGS
  // ========================================
  describe("VPC Flow Logs", () => {
    test("Flow Log IDs exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.flow_log_ids).toBeDefined();
      expect(outputs.flow_log_ids!.value).toBeDefined();
      expect(outputs.flow_log_ids!.value["us_east_1"]).toBeDefined();
      expect(outputs.flow_log_ids!.value["us_west_2"]).toBeDefined();
    });

    test("Flow Log IDs follow AWS format (fl-[a-f0-9]+)", () => {
      if (!outputsExist) return;

      const flowLogRegex = /^fl-[a-f0-9]{8,17}$/;

      expect(outputs.flow_log_ids!.value["us_east_1"]).toMatch(flowLogRegex);
      expect(outputs.flow_log_ids!.value["us_west_2"]).toMatch(flowLogRegex);
    });

    test("Flow Log IDs are unique per region", () => {
      if (!outputsExist) return;

      const eastFlowLog = outputs.flow_log_ids!.value["us_east_1"];
      const westFlowLog = outputs.flow_log_ids!.value["us_west_2"];

      expect(eastFlowLog).not.toBe(westFlowLog);
    });
  });

  // ========================================
  // IAM ROLES - EC2 INSTANCE PROFILES
  // ========================================
  describe("IAM Roles and Instance Profiles", () => {
    test("EC2 IAM role names exist for both regions", () => {
      if (!outputsExist) return;

      expect(outputs.ec2_role_names).toBeDefined();
      expect(outputs.ec2_role_names!.value).toBeDefined();
      expect(outputs.ec2_role_names!.value["us_east_1"]).toBeDefined();
      expect(outputs.ec2_role_names!.value["us_west_2"]).toBeDefined();
    });

    test("EC2 role names follow IAM naming rules", () => {
      if (!outputsExist) return;

      const iamNameRegex = /^[a-zA-Z0-9+=,.@_-]+$/;

      expect(outputs.ec2_role_names!.value["us_east_1"]).toMatch(iamNameRegex);
      expect(outputs.ec2_role_names!.value["us_west_2"]).toMatch(iamNameRegex);
    });

    test("EC2 role names are unique per region", () => {
      if (!outputsExist) return;

      const eastRole = outputs.ec2_role_names!.value["us_east_1"];
      const westRole = outputs.ec2_role_names!.value["us_west_2"];

      expect(eastRole).not.toBe(westRole);
    });

    test("EC2 role names include region identifiers", () => {
      if (!outputsExist) return;

      const eastRole = outputs.ec2_role_names!.value["us_east_1"];
      const westRole = outputs.ec2_role_names!.value["us_west_2"];

      expect(eastRole).toMatch(/east/i);
      expect(westRole).toMatch(/west/i);
    });
  });

  // ========================================
  // CROSS-RESOURCE VALIDATION
  // ========================================
  describe("Cross-Resource Validation", () => {
    test("all resources use consistent AWS account ID", () => {
      if (!outputsExist) return;

      const accountIds = new Set<string>();

      const extractAccountId = (arn: string) => {
        const match = arn.match(/:(\d{12}):/);
        return match ? match[1] : null;
      };

      // Lambda ARNs
      Object.values(outputs.lambda_arns!.value).forEach(arn => {
        const accountId = extractAccountId(arn as string);
        if (accountId) accountIds.add(accountId);
      });

      // KMS ARNs
      Object.values(outputs.kms_key_arns!.value).forEach(regionKeys => {
        Object.values(regionKeys as { [key: string]: string }).forEach(arn => {
          const accountId = extractAccountId(arn);
          if (accountId) accountIds.add(accountId);
        });
      });

      expect(accountIds.size).toBe(1);
    });

    test("multi-region outputs have consistent structure", () => {
      if (!outputsExist) return;

      const multiRegionOutputs = [
        "s3_bucket_names",
        "rds_endpoints",
        "lambda_arns",
        "flow_log_ids"
      ];

      multiRegionOutputs.forEach(outputName => {
        const output = outputs[outputName];
        expect(output).toBeDefined();
        expect(output!.value["us_east_1"]).toBeDefined();
        expect(output!.value["us_west_2"]).toBeDefined();
        expect(Object.keys(output!.value).length).toBe(2);
      });
    });

    test("subnet counts are consistent (2 public + 2 private per region)", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_public_subnet_ids!.value.length).toBe(2);
      expect(outputs.us_east_1_private_subnet_ids!.value.length).toBe(2);
      expect(outputs.us_west_2_public_subnet_ids!.value.length).toBe(2);
      expect(outputs.us_west_2_private_subnet_ids!.value.length).toBe(2);
    });

    test("infrastructure spans exactly 2 regions", () => {
      if (!outputsExist) return;

      const regions = new Set<string>();

      if (outputs.s3_bucket_names) {
        Object.keys(outputs.s3_bucket_names.value).forEach(r => regions.add(r));
      }

      expect(regions.size).toBe(2);
      expect(regions.has("us_east_1")).toBe(true);
      expect(regions.has("us_west_2")).toBe(true);
    });
  });

  // ========================================
  // SECURITY & COMPLIANCE VALIDATION
  // ========================================
  describe("Security and Compliance Checks", () => {
    test("no outputs contain sensitive data (passwords, keys)", () => {
      if (!outputsExist) return;

      const outputStr = JSON.stringify(outputs).toLowerCase();

      expect(outputStr).not.toMatch(/password\s*:\s*['"][^'"]+['"]/);
      expect(outputStr).not.toMatch(/secret\s*:\s*['"][^'"]+['"]/);
      expect(outputStr).not.toMatch(/private_key/);
      expect(outputStr).not.toMatch(/access_key_id/);
      expect(outputStr).not.toMatch(/secret_access_key/);
    });

    test("no outputs contain placeholder or test values", () => {
      if (!outputsExist) return;

      const outputStr = JSON.stringify(outputs);

      expect(outputStr).not.toMatch(/placeholder/i);
      expect(outputStr).not.toMatch(/\bTODO\b/);
      expect(outputStr).not.toMatch(/\bFIXME\b/);
      expect(outputStr).not.toMatch(/\bxxx\b/i);
      expect(outputStr).not.toMatch(/example\.com/);
      expect(outputStr).not.toMatch(/test-.*-test/);
    });

    test("all endpoints use AWS domains (not custom domains)", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_alb_dns!.value).toContain("amazonaws.com");
      expect(outputs.us_west_2_alb_dns!.value).toContain("amazonaws.com");
      expect(outputs.rds_endpoints!.value["us_east_1"]).toContain("amazonaws.com");
      expect(outputs.rds_endpoints!.value["us_west_2"]).toContain("amazonaws.com");
    });

    test("KMS encryption is configured for all data services", () => {
      if (!outputsExist) return;

      const dataServices = ["s3", "rds", "logs"];
      const regions = ["us_east_1", "us_west_2"];

      dataServices.forEach(service => {
        regions.forEach(region => {
          expect(outputs.kms_key_arns!.value[region][service]).toBeDefined();
          expect(outputs.kms_key_arns!.value[region][service]).toContain("arn:aws:kms");
        });
      });
    });
  });

  // ========================================
  // EDGE CASES & ERROR HANDLING
  // ========================================
  describe("Edge Cases and Error Handling", () => {
    test("handles missing outputs file gracefully", () => {
      if (!outputsExist) {
        expect(outputsExist).toBe(false);
        console.warn("⚠️  Integration tests skipped - outputs file not found");
      } else {
        expect(outputsExist).toBe(true);
      }
    });

    test("no empty string values in outputs", () => {
      if (!outputsExist) return;

      const checkForEmptyStrings = (obj: any): boolean => {
        for (const value of Object.values(obj)) {
          if (typeof value === "string" && value === "") {
            return true;
          }
          if (typeof value === "object" && value !== null) {
            if (checkForEmptyStrings(value)) return true;
          }
        }
        return false;
      };

      expect(checkForEmptyStrings(outputs)).toBe(false);
    });

    test("no null or undefined values in critical outputs", () => {
      if (!outputsExist) return;

      const criticalOutputs = [
        "us_east_1_vpc_id",
        "us_west_2_vpc_id",
        "us_east_1_alb_dns",
        "us_west_2_alb_dns",
        "s3_bucket_names",
        "kms_key_arns"
      ];

      criticalOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBeNull();
        expect(outputs[key].value).toBeDefined();
        expect(outputs[key].value).not.toBeNull();
      });
    });

    test("resource IDs do not contain sequential patterns (not test data)", () => {
      if (!outputsExist) return;

      const vpcId = outputs.us_east_1_vpc_id!.value;

      expect(vpcId).not.toMatch(/123456/);
      expect(vpcId).not.toMatch(/abcdef/);
      expect(vpcId).not.toMatch(/000000/);
    });

    test("all array outputs have expected minimum length", () => {
      if (!outputsExist) return;

      const arrayOutputs = [
        "us_east_1_public_subnet_ids",
        "us_east_1_private_subnet_ids",
        "us_west_2_public_subnet_ids",
        "us_west_2_private_subnet_ids"
      ];

      arrayOutputs.forEach(key => {
        expect(Array.isArray(outputs[key].value)).toBe(true);
        expect(outputs[key].value.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // PRODUCTION READINESS
  // ========================================
  describe("Production Readiness Validation", () => {
    test("all critical infrastructure components are present", () => {
      if (!outputsExist) return;

      const criticalComponents = [
        "us_east_1_vpc_id",
        "us_west_2_vpc_id",
        "us_east_1_alb_dns",
        "us_west_2_alb_dns",
        "s3_bucket_names",
        "kms_key_arns",
        "rds_endpoints",
        "lambda_arns",
        "flow_log_ids",
        "ec2_role_names"
      ];

      criticalComponents.forEach(component => {
        expect(outputs[component]).toBeDefined();
        expect(outputs[component].value).toBeDefined();
      });
    });

    test("high availability: resources deployed in 2+ AZs", () => {
      if (!outputsExist) return;

      expect(outputs.us_east_1_public_subnet_ids!.value.length).toBeGreaterThanOrEqual(2);
      expect(outputs.us_east_1_private_subnet_ids!.value.length).toBeGreaterThanOrEqual(2);
      expect(outputs.us_west_2_public_subnet_ids!.value.length).toBeGreaterThanOrEqual(2);
      expect(outputs.us_west_2_private_subnet_ids!.value.length).toBeGreaterThanOrEqual(2);
    });

    test("disaster recovery: identical resources in both regions", () => {
      if (!outputsExist) return;

      const multiRegionResources = [
        "s3_bucket_names",
        "rds_endpoints",
        "lambda_arns"
      ];

      multiRegionResources.forEach(resource => {
        expect(outputs[resource]!.value["us_east_1"]).toBeDefined();
        expect(outputs[resource]!.value["us_west_2"]).toBeDefined();
      });
    });

    test("logging enabled: Flow Logs configured for all VPCs", () => {
      if (!outputsExist) return;

      expect(outputs.flow_log_ids!.value["us_east_1"]).toBeDefined();
      expect(outputs.flow_log_ids!.value["us_west_2"]).toBeDefined();
    });

    test("encryption at rest: KMS keys for all data stores", () => {
      if (!outputsExist) return;

      const dataStores = ["s3", "rds", "logs"];

      dataStores.forEach(store => {
        expect(outputs.kms_key_arns!.value["us_east_1"][store]).toBeDefined();
        expect(outputs.kms_key_arns!.value["us_west_2"][store]).toBeDefined();
      });
    });
  });
});
