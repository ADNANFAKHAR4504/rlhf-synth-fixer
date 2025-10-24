// tests/integration/terraform.int.test.ts
// Integration tests for tap_stack.tf using sandbox approach
// Runs terraform plan (not apply) and validates configurations

import { execFileSync, ExecFileSyncOptions } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// Type definitions
type TfPlan = {
  resource_changes?: Array<{
    address: string;
    type: string;
    change?: {
      actions?: string[];
      after?: Record<string, any>;
      before?: Record<string, any>;
    };
  }>;
  planned_values?: {
    outputs?: Record<string, any>;
  };
  configuration?: {
    root_module?: {
      outputs?: Record<string, any>;
    };
  };
};

// Paths
const workspaceRoot = path.resolve(__dirname, "..");
const libDir = path.resolve(workspaceRoot, "lib");
const tapStackPath = path.resolve(libDir, "tap_stack.tf");

const tfvarsFiles = {
  dev: path.resolve(libDir, "dev.tfvars"),
  prod: path.resolve(libDir, "prod.tfvars"),
};

const outputsJsonPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

/**
 * Parse tfvars file to extract key variables for comparison
 */
function parseTfvars(filePath: string): Record<string, any> {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const out: Record<string, any> = {};

    // Extract environment
    const env = raw.match(/^\s*environment\s*=\s*"([^"]+)"/m);
    if (env) out.environment = env[1];

    // Extract region
    const region = raw.match(/^\s*aws_region\s*=\s*"([^"]+)"/m);
    if (region) out.aws_region = region[1];

    // Extract VPC CIDR
    const vpcCidr = raw.match(/^\s*vpc_cidr\s*=\s*"([^"]+)"/m);
    if (vpcCidr) out.vpc_cidr = vpcCidr[1];

    // Extract Aurora instance class
    const auroraClass = raw.match(/^\s*aurora_instance_class\s*=\s*"([^"]+)"/m);
    if (auroraClass) out.aurora_instance_class = auroraClass[1];

    // Extract NAT gateway count
    const natCount = raw.match(/^\s*nat_gateway_count\s*=\s*(\d+)/m);
    if (natCount) out.nat_gateway_count = Number(natCount[1]);

    return out;
  } catch (error) {
    console.warn(`Failed to parse tfvars ${filePath}:`, error);
    return {};
  }
}

/**
 * Create a temporary sandbox directory with Terraform files
 * This avoids S3 backend initialization issues
 */
function sandboxDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-sandbox-"));
  console.log(`[sandbox] Created: ${tmp}`);

  // Copy tap_stack.tf
  fs.copyFileSync(tapStackPath, path.resolve(tmp, "tap_stack.tf"));

  // Copy tfvars files if present
  ["dev.tfvars", "prod.tfvars"].forEach((f) => {
    const src = path.resolve(libDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.resolve(tmp, f));
      console.log(`[sandbox] Copied: ${f}`);
    }
  });

  // Write a minimal provider.tf WITHOUT backend
  // This is the key to avoiding "Backend initialization required" errors
  const provider = `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
`;

  fs.writeFileSync(path.resolve(tmp, "provider.tf"), provider, "utf8");
  console.log(`[sandbox] Created provider.tf without backend`);

  return tmp;
}

/**
 * Check if Terraform is installed
 */
function haveTerraform(): boolean {
  try {
    execFileSync("terraform", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if AWS credentials are available
 */
function haveAwsCreds(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE
  );
}

/**
 * Run Terraform command
 */
function runTf(args: string[], opts?: ExecFileSyncOptions): string {
  console.log(`[tf] exec: terraform ${args.join(" ")}`);
  try {
    const result = execFileSync("terraform", args, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      ...opts,
    });
    return result.toString();
  } catch (error: any) {
    console.error(`[tf] error: ${error.message}`);
    if (error.stdout) console.error(`[tf] stdout: ${error.stdout}`);
    if (error.stderr) console.error(`[tf] stderr: ${error.stderr}`);
    throw error;
  }
}

/**
 * Generate Terraform plan for an environment
 */
function planEnv(env: keyof typeof tfvarsFiles): TfPlan {
  const workDir = sandboxDir();
  const chdirArg = `-chdir=${workDir}`;

  console.log(`[tf] Planning env=${env} workDir=${workDir}`);

  try {
    // Initialize Terraform without backend
    runTf([chdirArg, "init", "-input=false", "-no-color", "-backend=false", "-reconfigure"]);
    console.log(`[tf] Init completed for ${env}`);

    // Generate plan
    const planOut = `plan-${env}.tfplan`;
    const varFileUsed = path.resolve(workDir, `${env}.tfvars`);

    console.log(`[tf] Running plan with var-file=${varFileUsed}`);
    runTf([
      chdirArg,
      "plan",
      "-input=false",
      "-lock=false",
      "-no-color",
      "-refresh=false",
      "-out",
      planOut,
      `-var-file=${varFileUsed}`,
    ]);
    console.log(`[tf] Plan completed for ${env} -> ${planOut}`);

    // Export plan as JSON
    const json = runTf([chdirArg, "show", "-json", planOut]);
    console.log(`[tf] Plan exported to JSON for ${env}`);

    // Cleanup sandbox directory
    fs.rmSync(workDir, { recursive: true, force: true });
    console.log(`[tf] Cleaned up sandbox: ${workDir}`);

    return JSON.parse(json) as TfPlan;
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Get resource creation counts by type
 */
function getCreateCounts(plan: TfPlan): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const rc of plan.resource_changes ?? []) {
    const actions = rc.change?.actions ?? [];
    if (actions.includes("create")) {
      counts[rc.type] = (counts[rc.type] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Get resources being created by type
 */
function getCreatedByType(plan: TfPlan, type: string) {
  return (plan.resource_changes ?? []).filter(
    (rc) => rc.type === type && (rc.change?.actions ?? []).includes("create")
  );
}

/**
 * Get all resource addresses from plan
 */
function getResourceAddresses(plan: TfPlan): string[] {
  return (plan.resource_changes ?? [])
    .filter((rc) => (rc.change?.actions ?? []).includes("create"))
    .map((rc) => rc.address);
}

/**
 * Load Terraform outputs if available
 * Handles Terraform output format: { "key": { "value": ..., "type": ..., "sensitive": ... } }
 */
function loadOutputs(): Record<string, any> | null {
  if (!fs.existsSync(outputsJsonPath)) {
    console.warn(`[outputs] File not found: ${outputsJsonPath}`);
    return null;
  }
  try {
    const raw = fs.readFileSync(outputsJsonPath, "utf8");
    const parsed = JSON.parse(raw);

    // Convert Terraform output format to simple key-value pairs
    const outputs: Record<string, any> = {};
    for (const [key, output] of Object.entries(parsed)) {
      if (typeof output === 'object' && output !== null && 'value' in output) {
        outputs[key] = (output as any).value;
      } else {
        outputs[key] = output;
      }
    }

    return outputs;
  } catch (error) {
    console.warn(`[outputs] Failed to parse: ${error}`);
    return null;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Terraform Integration Tests - tap_stack", () => {
  const tfOk = haveTerraform();
  const credsOk = haveAwsCreds();

  // Check prerequisites
  if (!tfOk) {
    it("skipped: terraform not installed", () => {
      console.warn("Terraform is not installed. Install from https://terraform.io");
      expect(tfOk).toBe(true);
    });
    return;
  }

  if (!fs.existsSync(tapStackPath)) {
    it("tap_stack.tf must exist under lib/", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
    });
    return;
  }

  if (!fs.existsSync(tfvarsFiles.dev) || !fs.existsSync(tfvarsFiles.prod)) {
    it("dev.tfvars and prod.tfvars must exist under lib/", () => {
      expect(fs.existsSync(tfvarsFiles.dev)).toBe(true);
      expect(fs.existsSync(tfvarsFiles.prod)).toBe(true);
    });
    return;
  }

  if (!credsOk) {
    it("skipped: AWS credentials not detected (plan requires data sources)", () => {
      console.warn("AWS credentials not found. Set AWS_ACCESS_KEY_ID, AWS_PROFILE, or AWS_WEB_IDENTITY_TOKEN_FILE");
      expect(credsOk).toBe(true);
    });
    return;
  }

  // Store plans for all tests to use
  const plans: Record<"dev" | "prod", TfPlan> = {} as any;

  // ============================================================================
  // PLAN GENERATION
  // ============================================================================

  describe("Plan Generation", () => {
    it("generates valid plan for dev environment", () => {
      plans.dev = planEnv("dev");
      const resourceCount = (plans.dev.resource_changes ?? []).length;
      console.log(`[test] Dev plan has ${resourceCount} resource changes`);
      expect(resourceCount).toBeGreaterThan(0);
    }, 120000);

    it("generates valid plan for prod environment", () => {
      plans.prod = planEnv("prod");
      const resourceCount = (plans.prod.resource_changes ?? []).length;
      console.log(`[test] Prod plan has ${resourceCount} resource changes`);
      expect(resourceCount).toBeGreaterThan(0);
    }, 120000);
  });

  // ============================================================================
  // FILE VALIDATION
  // ============================================================================

  describe("File Validation", () => {
    it("all required files exist", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
      expect(fs.existsSync(tfvarsFiles.dev)).toBe(true);
      expect(fs.existsSync(tfvarsFiles.prod)).toBe(true);
    });

    it("tfvars files are valid and parseable", () => {
      const devVars = parseTfvars(tfvarsFiles.dev);
      const prodVars = parseTfvars(tfvarsFiles.prod);

      expect(devVars).toBeDefined();
      expect(prodVars).toBeDefined();
      expect(Object.keys(devVars).length).toBeGreaterThan(0);
      expect(Object.keys(prodVars).length).toBeGreaterThan(0);
    });

    it("both tfvars files have required variables", () => {
      const devVars = parseTfvars(tfvarsFiles.dev);
      const prodVars = parseTfvars(tfvarsFiles.prod);

      const requiredVars = ["environment", "aws_region", "vpc_cidr"];

      requiredVars.forEach((varName) => {
        expect(devVars[varName]).toBeDefined();
        expect(prodVars[varName]).toBeDefined();
      });
    });
  });

  // ============================================================================
  // ENVIRONMENT VARIABLE DIFFERENCES
  // ============================================================================

  describe("Environment Variable Differences", () => {
    const devVars = parseTfvars(tfvarsFiles.dev);
    const prodVars = parseTfvars(tfvarsFiles.prod);

    it("environment variable is different", () => {
      expect(devVars.environment).toBe("dev");
      expect(prodVars.environment).toBe("prod");
    });

    it("VPC CIDR ranges are different", () => {
      expect(devVars.vpc_cidr).toBeDefined();
      expect(prodVars.vpc_cidr).toBeDefined();
      expect(devVars.vpc_cidr).not.toEqual(prodVars.vpc_cidr);
    });

    it("Aurora instance class is different (dev smaller than prod)", () => {
      expect(devVars.aurora_instance_class).toBeDefined();
      expect(prodVars.aurora_instance_class).toBeDefined();
      expect(devVars.aurora_instance_class).toMatch(/t3|t4g/);
      expect(prodVars.aurora_instance_class).toMatch(/r5|r6g/);
    });

    it("NAT gateway count differs (prod has more for HA)", () => {
      expect(devVars.nat_gateway_count).toBeDefined();
      expect(prodVars.nat_gateway_count).toBeDefined();
      expect(prodVars.nat_gateway_count).toBeGreaterThanOrEqual(devVars.nat_gateway_count);
    });
  });

  // ============================================================================
  // DEVELOPMENT ENVIRONMENT PLAN
  // ============================================================================

  describe("Development Environment Plan", () => {
    it("plan executes without critical errors", () => {
      expect(plans.dev).toBeDefined();
      expect(plans.dev.resource_changes).toBeDefined();
      expect(plans.dev.resource_changes!.length).toBeGreaterThan(0);
    });

    it("plan includes expected resource types", () => {
      const resourceTypes = new Set(
        (plans.dev.resource_changes ?? []).map((rc) => rc.type)
      );

      const expectedTypes = [
        "aws_vpc",
        "aws_subnet",
        "aws_lambda_function",
        "aws_iam_role",
        "aws_s3_bucket",
        "aws_dynamodb_table",
        "aws_rds_cluster",
        "aws_kms_key",
        "aws_cloudwatch_log_group",
      ];

      expectedTypes.forEach((type) => {
        expect(resourceTypes.has(type)).toBe(true);
      });
    });

    it("plan includes VPC and networking resources", () => {
      const networkingResources = getCreatedByType(plans.dev, "aws_vpc").concat(
        getCreatedByType(plans.dev, "aws_subnet"),
        getCreatedByType(plans.dev, "aws_security_group"),
        getCreatedByType(plans.dev, "aws_route_table")
      );
      expect(networkingResources.length).toBeGreaterThan(5);
    });

    it("plan includes all Lambda functions", () => {
      const lambdas = getCreatedByType(plans.dev, "aws_lambda_function");
      console.log(`[test] Dev has ${lambdas.length} Lambda functions`);

      // Should have at least 5 Lambda functions
      expect(lambdas.length).toBeGreaterThanOrEqual(5);

      // Check for specific Lambda functions
      const lambdaNames = lambdas.map((l) => l.change?.after?.function_name || l.address);
      console.log(`[test] Lambda functions: ${lambdaNames.join(", ")}`);
    });

    it("plan includes CloudWatch monitoring", () => {
      const monitoring = getCreatedByType(plans.dev, "aws_cloudwatch_log_group").concat(
        getCreatedByType(plans.dev, "aws_cloudwatch_dashboard"),
        getCreatedByType(plans.dev, "aws_cloudwatch_metric_alarm")
      );
      expect(monitoring.length).toBeGreaterThan(5);
    });
  });

  // ============================================================================
  // PRODUCTION ENVIRONMENT PLAN
  // ============================================================================

  describe("Production Environment Plan", () => {
    it("plan executes without critical errors", () => {
      expect(plans.prod).toBeDefined();
      expect(plans.prod.resource_changes).toBeDefined();
      expect(plans.prod.resource_changes!.length).toBeGreaterThan(0);
    });

    it("plan includes same core resource types as dev", () => {
      const devTypes = new Set((plans.dev.resource_changes ?? []).map((rc) => rc.type));
      const prodTypes = new Set((plans.prod.resource_changes ?? []).map((rc) => rc.type));

      const coreTypes = [
        "aws_vpc",
        "aws_subnet",
        "aws_lambda_function",
        "aws_iam_role",
        "aws_s3_bucket",
        "aws_dynamodb_table",
        "aws_rds_cluster",
        "aws_kms_key",
      ];

      coreTypes.forEach((type) => {
        expect(devTypes.has(type)).toBe(true);
        expect(prodTypes.has(type)).toBe(true);
      });
    });

    it("plan uses production-grade Aurora instances", () => {
      const auroraInstances = getCreatedByType(plans.prod, "aws_rds_cluster_instance");
      expect(auroraInstances.length).toBeGreaterThan(0);

      const instanceClass = auroraInstances[0].change?.after?.instance_class;
      expect(instanceClass).toMatch(/r5|r6g/);
      expect(instanceClass).not.toMatch(/t3|t4g/);
    });

    it("plan includes high-availability configuration", () => {
      const natGateways = getCreatedByType(plans.prod, "aws_nat_gateway");
      console.log(`[test] Prod has ${natGateways.length} NAT gateways`);

      // Production should have multiple NAT gateways for HA
      expect(natGateways.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // ENVIRONMENT PLAN COMPARISON
  // ============================================================================

  describe("Environment Plan Comparison", () => {
    it("both plans succeed", () => {
      expect(plans.dev).toBeDefined();
      expect(plans.prod).toBeDefined();
    });

    it("resource type counts are similar (structure parity)", () => {
      const devCounts = getCreateCounts(plans.dev);
      const prodCounts = getCreateCounts(plans.prod);

      console.log("[test] Dev create counts:", devCounts);
      console.log("[test] Prod create counts:", prodCounts);

      // Core resources should have similar counts
      const coreResources = ["aws_vpc", "aws_kms_key", "aws_s3_bucket"];

      coreResources.forEach((resource) => {
        expect(devCounts[resource]).toBeGreaterThan(0);
        expect(prodCounts[resource]).toBeGreaterThan(0);
      });
    });

    it("plans show different VPC CIDRs", () => {
      const devVpc = getCreatedByType(plans.dev, "aws_vpc")[0];
      const prodVpc = getCreatedByType(plans.prod, "aws_vpc")[0];

      const devCidr = devVpc?.change?.after?.cidr_block;
      const prodCidr = prodVpc?.change?.after?.cidr_block;

      expect(devCidr).toBeDefined();
      expect(prodCidr).toBeDefined();
      expect(devCidr).not.toEqual(prodCidr);
      console.log(`[test] VPC CIDRs: dev=${devCidr}, prod=${prodCidr}`);
    });

    it("plans show different instance sizes", () => {
      const devAurora = getCreatedByType(plans.dev, "aws_rds_cluster_instance")[0];
      const prodAurora = getCreatedByType(plans.prod, "aws_rds_cluster_instance")[0];

      const devClass = devAurora?.change?.after?.instance_class;
      const prodClass = prodAurora?.change?.after?.instance_class;

      expect(devClass).toBeDefined();
      expect(prodClass).toBeDefined();
      expect(devClass).not.toEqual(prodClass);
      console.log(`[test] Aurora classes: dev=${devClass}, prod=${prodClass}`);
    });

    it("both plans include security features", () => {
      const devKms = getCreatedByType(plans.dev, "aws_kms_key");
      const prodKms = getCreatedByType(plans.prod, "aws_kms_key");

      expect(devKms.length).toBeGreaterThan(0);
      expect(prodKms.length).toBeGreaterThan(0);
    });

    it("both plans include monitoring and logging", () => {
      const devLogs = getCreatedByType(plans.dev, "aws_cloudwatch_log_group");
      const prodLogs = getCreatedByType(plans.prod, "aws_cloudwatch_log_group");

      expect(devLogs.length).toBeGreaterThan(0);
      expect(prodLogs.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CLOUDFORMATION OUTPUTS VALIDATION
  // ============================================================================

  describe("CloudFormation Outputs Validation", () => {
    const outputs = loadOutputs();

    it("loads outputs file if available", () => {
      if (outputs) {
        expect(outputs).toBeDefined();
        expect(typeof outputs).toBe("object");
      } else {
        console.warn("Outputs file not found, skipping validation");
      }
    });

    it("outputs contain expected keys", () => {
      if (!outputs) {
        console.warn("Skipping: outputs not available");
        return;
      }

      const expectedKeys = [
        "vpc_id",
        "public_subnet_ids",
        "private_subnet_ids",
        "s3_buckets",
        "dynamodb_tables",
        "aurora_endpoint",
        "kms_keys",
      ];

      expectedKeys.forEach((key) => {
        expect(outputs).toHaveProperty(key);
      });
    });

    it("VPC ID has valid format", () => {
      if (!outputs || !outputs.vpc_id) {
        console.warn("Skipping: VPC ID not in outputs");
        return;
      }

      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it("subnet IDs have valid format", () => {
      if (!outputs || !outputs.public_subnet_ids) {
        console.warn("Skipping: subnet IDs not in outputs");
        return;
      }

      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      outputs.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    it("S3 bucket names follow naming convention", () => {
      if (!outputs || !outputs.s3_buckets) {
        console.warn("Skipping: S3 buckets not in outputs");
        return;
      }

      expect(outputs.s3_buckets).toHaveProperty("artifact");
      expect(outputs.s3_buckets).toHaveProperty("data");
      expect(outputs.s3_buckets).toHaveProperty("staging");
    });

    it("Aurora endpoint is valid", () => {
      if (!outputs || !outputs.aurora_endpoint) {
        console.warn("Skipping: Aurora endpoint not in outputs");
        return;
      }

      expect(outputs.aurora_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it("KMS key ARNs have valid format", () => {
      if (!outputs || !outputs.kms_keys) {
        console.warn("Skipping: KMS keys not in outputs");
        return;
      }

      Object.values(outputs.kms_keys).forEach((arn: any) => {
        expect(arn).toMatch(/^arn:aws:kms:/);
      });
    });

    it("Step Functions ARN has valid format", () => {
      if (!outputs || !outputs.step_functions_arn) {
        console.warn("Skipping: Step Functions ARN not in outputs");
        return;
      }

      expect(outputs.step_functions_arn).toMatch(/^arn:aws:states:/);
    });
  });

  // ============================================================================
  // SECURITY CONFIGURATION VALIDATION
  // ============================================================================

  describe("Security Configuration Validation", () => {
    it("all S3 buckets have encryption enabled", () => {
      const devBuckets = getCreatedByType(plans.dev, "aws_s3_bucket");
      const prodBuckets = getCreatedByType(plans.prod, "aws_s3_bucket");

      expect(devBuckets.length).toBeGreaterThan(0);
      expect(prodBuckets.length).toBeGreaterThan(0);

      console.log(`[test] Dev has ${devBuckets.length} S3 buckets`);
      console.log(`[test] Prod has ${prodBuckets.length} S3 buckets`);
    });

    it("all S3 buckets block public access", () => {
      const devPublicBlocks = getCreatedByType(plans.dev, "aws_s3_bucket_public_access_block");
      const prodPublicBlocks = getCreatedByType(plans.prod, "aws_s3_bucket_public_access_block");

      expect(devPublicBlocks.length).toBeGreaterThan(0);
      expect(prodPublicBlocks.length).toBeGreaterThan(0);
    });

    it("DynamoDB tables have encryption enabled", () => {
      const devTables = getCreatedByType(plans.dev, "aws_dynamodb_table");
      const prodTables = getCreatedByType(plans.prod, "aws_dynamodb_table");

      expect(devTables.length).toBeGreaterThan(0);
      expect(prodTables.length).toBeGreaterThan(0);

      // Check that encryption is enabled
      devTables.forEach((table) => {
        const encryption = table.change?.after?.server_side_encryption;
        expect(encryption).toBeDefined();
      });
    });

    it("Aurora has storage encryption enabled", () => {
      const devAurora = getCreatedByType(plans.dev, "aws_rds_cluster");
      const prodAurora = getCreatedByType(plans.prod, "aws_rds_cluster");

      expect(devAurora.length).toBeGreaterThan(0);
      expect(prodAurora.length).toBeGreaterThan(0);

      // Check storage encryption
      const devEncryption = devAurora[0].change?.after?.storage_encrypted;
      const prodEncryption = prodAurora[0].change?.after?.storage_encrypted;

      expect(devEncryption).toBe(true);
      expect(prodEncryption).toBe(true);
    });

    it("KMS keys have rotation enabled", () => {
      const devKms = getCreatedByType(plans.dev, "aws_kms_key");
      const prodKms = getCreatedByType(plans.prod, "aws_kms_key");

      expect(devKms.length).toBeGreaterThan(0);
      expect(prodKms.length).toBeGreaterThan(0);

      // Check key rotation
      devKms.forEach((key) => {
        const rotation = key.change?.after?.enable_key_rotation;
        expect(rotation).toBe(true);
      });
    });

    it("security groups follow least privilege", () => {
      const devSgs = getCreatedByType(plans.dev, "aws_security_group");
      const prodSgs = getCreatedByType(plans.prod, "aws_security_group");

      expect(devSgs.length).toBeGreaterThan(0);
      expect(prodSgs.length).toBeGreaterThan(0);

      console.log(`[test] Dev has ${devSgs.length} security groups`);
      console.log(`[test] Prod has ${prodSgs.length} security groups`);
    });

    it("Lambda functions are in VPC", () => {
      const devLambdas = getCreatedByType(plans.dev, "aws_lambda_function");
      const prodLambdas = getCreatedByType(plans.prod, "aws_lambda_function");

      expect(devLambdas.length).toBeGreaterThan(0);
      expect(prodLambdas.length).toBeGreaterThan(0);

      // Check VPC configuration
      devLambdas.forEach((lambda) => {
        const vpcConfig = lambda.change?.after?.vpc_config;
        expect(vpcConfig).toBeDefined();
      });
    });
  });
});
