import { execFileSync, ExecFileSyncOptions } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

type TfPlan = {
  resource_changes?: Array<{
    address: string;
    type: string;
    change?: {
      actions?: string[];
      after?: Record<string, any>;
    };
  }>;
};

function parseTfvars(filePath: string): Record<string, any> {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const out: Record<string, any> = {};
    const inst = raw.match(/^[\t ]*instance_type[\t ]*=[\t ]*"([^"]+)"/m);
    if (inst) out.instance_type = inst[1];
    const dbAlloc = raw.match(/^[\t ]*db_allocated_storage[\t ]*=[\t ]*(\d+)/m);
    if (dbAlloc) out.db_allocated_storage = Number(dbAlloc[1]);
    return out;
  } catch {
    return {};
  }
}

const workspaceRoot = path.resolve(__dirname, "..");
const libDir = path.resolve(workspaceRoot, "lib");
const tapStackPath = path.resolve(libDir, "tap_stack.tf");

const tfvarsFiles = {
  dev: path.resolve(libDir, "dev.tfvars"),
  staging: path.resolve(libDir, "staging.tfvars"),
  prod: path.resolve(libDir, "prod.tfvars"),
};

const outputsJsonPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const providerTfPath = path.resolve(libDir, "provider.tf");
const backendEnforced = fs.existsSync(providerTfPath)
  ? /backend\s+"s3"/.test(fs.readFileSync(providerTfPath, "utf8"))
  : false;

function sandboxDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-sandbox-"));
  // copy core stack
  fs.copyFileSync(path.resolve(libDir, "tap_stack.tf"), path.resolve(tmp, "tap_stack.tf"));
  // copy tfvars if present
  ["dev.tfvars", "staging.tfvars", "prod.tfvars"].forEach((f) => {
    const src = path.resolve(libDir, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.resolve(tmp, f));
  });
  // write a minimal provider.tf without backend, with same aliases (multi-line blocks)
  const provider = `terraform {\n  required_version = ">= 1.4.0"\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = ">= 5.0"\n    }\n  }\n}\n\nprovider "aws" {\n  region = var.aws_region\n}\n\nprovider "aws" {\n  alias  = "us_east_1"\n  region = var.us_east_1_region\n}\n\nprovider "aws" {\n  alias  = "us_west_2"\n  region = var.us_west_2_region\n}\n`;
  fs.writeFileSync(path.resolve(tmp, "provider.tf"), provider, "utf8");
  return tmp;
}

function haveTerraform(): boolean {
  try {
    execFileSync("terraform", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function haveAwsCreds(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.AWS_WEB_IDENTITY_TOKEN_FILE);
}

function runTf(args: string[], opts?: ExecFileSyncOptions): string {
  console.log(`[tf] exec: terraform ${args.join(" ")}`);
  const result = execFileSync("terraform", args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    ...opts,
  });
  return result.toString();
}

function planEnv(env: keyof typeof tfvarsFiles): TfPlan {
  const workDir = backendEnforced ? sandboxDir() : libDir;
  const chdirArg = `-chdir=${workDir}`;
  console.log(`[tf] planning env=${env} backendEnforced=${backendEnforced} workDir=${workDir}`);

  // init (no backend to avoid remote state) – safe to repeat
  runTf([chdirArg, "init", "-input=false", "-no-color", "-backend=false", "-reconfigure"]);
  console.log(`[tf] init completed for ${env}`);

  const planOut = `plan-${env}.tfplan`;
  const varFileUsed = backendEnforced ? path.resolve(workDir, `${env}.tfvars`) : tfvarsFiles[env];
  console.log(`[tf] plan var-file=${varFileUsed}`);
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
  console.log(`[tf] plan completed for ${env} -> ${planOut}`);

  const json = runTf([chdirArg, "show", "-json", planOut]);
  console.log(`[tf] show -json parsed for ${env}`);
  return JSON.parse(json) as TfPlan;
}

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

function getCreatedByType(plan: TfPlan, type: string) {
  return (plan.resource_changes ?? []).filter(
    (rc) => rc.type === type && (rc.change?.actions ?? []).includes("create")
  );
}

describe("Terraform integration - tap_stack", () => {
  const tfOk = haveTerraform();
  const credsOk = haveAwsCreds();

  if (!tfOk) {
    it("skipped: terraform not installed", () => {
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

  if (!credsOk) {
    it("skipped: AWS credentials not detected (plan requires data sources)", () => {
      expect(credsOk).toBe(true);
    });
    return;
  }

  const plans: Record<"dev" | "staging" | "prod", TfPlan> = { dev: {}, staging: {}, prod: {} } as any;

  it("can generate plans for dev/staging/prod without apply", () => {
    plans.dev = planEnv("dev");
    plans.staging = planEnv("staging");
    plans.prod = planEnv("prod");

    const devLen = (plans.dev.resource_changes ?? []).length;
    const stgLen = (plans.staging.resource_changes ?? []).length;
    const prodLen = (plans.prod.resource_changes ?? []).length;
    console.log(`[tf] resource_changes counts dev=${devLen} staging=${stgLen} prod=${prodLen}`);
    expect(devLen).toBeGreaterThan(0);
    expect(stgLen).toBeGreaterThan(0);
    expect(prodLen).toBeGreaterThan(0);
  }, 120000);

  it("has identical resource type counts across environments (structure parity)", () => {
    const devCounts = getCreateCounts(plans.dev);
    const stgCounts = getCreateCounts(plans.staging);
    const prodCounts = getCreateCounts(plans.prod);
    console.log("[tf] dev create counts:", devCounts);
    console.log("[tf] stg create counts:", stgCounts);
    console.log("[tf] prod create counts:", prodCounts);

    expect(devCounts).toEqual(stgCounts);
    expect(devCounts).toEqual(prodCounts);
  });

  it("allowed diffs only on parameterized fields (spot checks)", () => {
    // EC2 instance type differs per env
    const devInstances = getCreatedByType(plans.dev, "aws_instance");
    const stgInstances = getCreatedByType(plans.staging, "aws_instance");
    const prodInstances = getCreatedByType(plans.prod, "aws_instance");
    console.log(`[tf] instance create counts dev=${devInstances.length} stg=${stgInstances.length} prod=${prodInstances.length}`);

    // If no instances are being created (e.g., plan constrained), skip spot checks
    if (
      devInstances.length === 0 ||
      stgInstances.length === 0 ||
      prodInstances.length === 0
    ) {
      console.warn("No instance creations found in plans; skipping diff spot checks");
      return;
    }

    // Compare a representative instance (index 0) instance_type
    const devType = devInstances[0].change?.after?.instance_type;
    const stgType = stgInstances[0].change?.after?.instance_type;
    const prodType = prodInstances[0].change?.after?.instance_type;
    const devVars = parseTfvars(tfvarsFiles.dev);
    const stgVars = parseTfvars(tfvarsFiles.staging);
    const prodVars = parseTfvars(tfvarsFiles.prod);
    console.log(`[tf] instance types dev=${devType} (exp=${devVars.instance_type}) stg=${stgType} (exp=${stgVars.instance_type}) prod=${prodType} (exp=${prodVars.instance_type})`);
    if (devVars.instance_type) expect(devType).toBe(devVars.instance_type);
    if (stgVars.instance_type) expect(stgType).toBe(stgVars.instance_type);
    if (prodVars.instance_type) expect(prodType).toBe(prodVars.instance_type);

    // RDS allocated_storage should reflect tfvars per env
    const devDb = getCreatedByType(plans.dev, "aws_db_instance")[0];
    const stgDb = getCreatedByType(plans.staging, "aws_db_instance")[0];
    const prodDb = getCreatedByType(plans.prod, "aws_db_instance")[0];
    console.log(`[tf] db allocated_storage dev=${devDb?.change?.after?.allocated_storage} (exp=${devVars.db_allocated_storage}) stg=${stgDb?.change?.after?.allocated_storage} (exp=${stgVars.db_allocated_storage}) prod=${prodDb?.change?.after?.allocated_storage} (exp=${prodVars.db_allocated_storage})`);
    if (devVars.db_allocated_storage) expect(devDb.change?.after?.allocated_storage).toBe(devVars.db_allocated_storage);
    if (stgVars.db_allocated_storage) expect(stgDb.change?.after?.allocated_storage).toBe(stgVars.db_allocated_storage);
    if (prodVars.db_allocated_storage) expect(prodDb.change?.after?.allocated_storage).toBe(prodVars.db_allocated_storage);
  });

  it("validates outputs JSON shape when present", () => {
    if (!fs.existsSync(outputsJsonPath)) {
      console.warn(`outputs file not found at ${outputsJsonPath}; skipping outputs validation`);
      return;
    }
    const raw = fs.readFileSync(outputsJsonPath, "utf8");
    const json = JSON.parse(raw);
    console.log(`[tf] outputs keys: ${Object.keys(json).join(", ")}`);

    // Validate per-region non-secret outputs present; exclude VPC-related fields
    [
      "alb_dns_name_us_east_1",
      "alb_dns_name_us_west_2",
      "kms_key_arn_us_east_1",
      "kms_key_arn_us_west_2",
      "lambda_arn_us_east_1",
      "lambda_arn_us_west_2",
      "rds_endpoint_us_east_1",
      "rds_endpoint_us_west_2",
      "vpc_flow_log_id_us_east_1",
      "vpc_flow_log_id_us_west_2",
    ].forEach((k) => expect(json).toHaveProperty(k));
  });
});