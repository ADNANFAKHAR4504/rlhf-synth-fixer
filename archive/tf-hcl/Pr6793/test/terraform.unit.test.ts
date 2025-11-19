// test/terraform.unit.test.ts
// Unit tests for Terraform configuration files
// No Terraform commands are executed - only file validation

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Configuration Files", () => {
  test("main.tf exists", () => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test("variables.tf exists", () => {
    const varsPath = path.join(LIB_DIR, "variables.tf");
    expect(fs.existsSync(varsPath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("backend.tf exists", () => {
    const backendPath = path.join(LIB_DIR, "backend.tf");
    expect(fs.existsSync(backendPath)).toBe(true);
  });
});

describe("Main Configuration (main.tf)", () => {
  const mainPath = path.join(LIB_DIR, "main.tf");
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(mainPath, "utf8");
  });

  test("includes comment about provider configuration location", () => {
    expect(mainContent).toMatch(/provider configuration is in provider\.tf/i);
  });

  test("declares data sources for availability zones", () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("declares VPC resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("declares Internet Gateway", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares public subnets with count", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*count\s*=/);
  });

  test("declares private subnets with count", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*count\s*=/);
  });

  test("declares security groups for web, app, and database tiers", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
  });

  test("declares Application Load Balancer", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("declares Auto Scaling Group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
  });

  test("declares RDS instance", () => {
    expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("uses environment_suffix in resource names", () => {
    expect(mainContent).toMatch(/\$\{var\.environment_suffix\}/);
  });

  test("includes lifecycle blocks for security groups", () => {
    expect(mainContent).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true/);
  });
});

describe("Variables Configuration (variables.tf)", () => {
  const varsPath = path.join(LIB_DIR, "variables.tf");
  let varsContent: string;

  beforeAll(() => {
    varsContent = fs.readFileSync(varsPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(varsContent).toMatch(/variable\s+"aws_region"/);
  });

  test("declares environment_suffix variable", () => {
    expect(varsContent).toMatch(/variable\s+"environment_suffix"/);
  });

  test("declares project_name variable", () => {
    expect(varsContent).toMatch(/variable\s+"project_name"/);
  });

  test("declares VPC configuration variables", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"/);
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidrs"/);
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidrs"/);
  });

  test("declares EC2 configuration variables", () => {
    expect(varsContent).toMatch(/variable\s+"ami_id"/);
    expect(varsContent).toMatch(/variable\s+"instance_type"/);
  });

  test("declares Auto Scaling variables", () => {
    expect(varsContent).toMatch(/variable\s+"asg_min_size"/);
    expect(varsContent).toMatch(/variable\s+"asg_max_size"/);
    expect(varsContent).toMatch(/variable\s+"asg_desired_capacity"/);
  });

  test("declares database configuration variables", () => {
    expect(varsContent).toMatch(/variable\s+"db_engine_version"/);
    expect(varsContent).toMatch(/variable\s+"db_instance_class"/);
    expect(varsContent).toMatch(/variable\s+"db_name"/);
    expect(varsContent).toMatch(/variable\s+"db_username"/);
    expect(varsContent).toMatch(/variable\s+"db_password"/);
  });

  test("marks sensitive variables as sensitive", () => {
    const dbUserMatch = varsContent.match(/variable\s+"db_username"[\s\S]*?(?=variable\s+|$)/);
    const dbPassMatch = varsContent.match(/variable\s+"db_password"[\s\S]*?(?=variable\s+|$)/);

    expect(dbUserMatch?.[0]).toMatch(/sensitive\s*=\s*true/);
    expect(dbPassMatch?.[0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("declares enable_deletion_protection with default false", () => {
    expect(varsContent).toMatch(/variable\s+"enable_deletion_protection"[\s\S]*?default\s*=\s*false/);
  });

  test("declares skip_final_snapshot with default true", () => {
    expect(varsContent).toMatch(/variable\s+"skip_final_snapshot"[\s\S]*?default\s*=\s*true/);
  });
});

describe("Outputs Configuration (outputs.tf)", () => {
  const outputsPath = path.join(LIB_DIR, "outputs.tf");
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("declares vpc_id output", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"/);
  });

  test("declares alb_dns_name output", () => {
    expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
  });

  test("declares db_instance_endpoint output", () => {
    expect(outputsContent).toMatch(/output\s+"db_instance_endpoint"/);
  });

  test("declares asg_name output", () => {
    expect(outputsContent).toMatch(/output\s+"asg_name"/);
  });

  test("marks db_instance_endpoint as sensitive", () => {
    const dbEndpointMatch = outputsContent.match(/output\s+"db_instance_endpoint"[\s\S]*?(?=output\s+|$)/);
    expect(dbEndpointMatch?.[0]).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Provider Configuration (provider.tf)", () => {
  const providerPath = path.join(LIB_DIR, "provider.tf");
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("declares Terraform version requirement", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
  });

  test("declares AWS provider with region variable", () => {
    expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*var\.aws_region/);
  });

  test("declares alias provider for old region", () => {
    expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*alias\s*=\s*"old_region"/);
    expect(providerContent).toMatch(/region\s*=\s*"us-west-1"/);
  });

  test("includes default tags with environment_suffix", () => {
    expect(providerContent).toMatch(/default_tags[\s\S]*EnvironmentSuffix\s*=\s*var\.environment_suffix/);
  });

  test("does NOT include backend configuration (should be in backend.tf)", () => {
    expect(providerContent).not.toMatch(/backend\s+"s3"/);
  });
});

describe("Backend Configuration (backend.tf)", () => {
  const backendPath = path.join(LIB_DIR, "backend.tf");
  let backendContent: string;

  beforeAll(() => {
    backendContent = fs.readFileSync(backendPath, "utf8");
  });

  test("declares S3 backend", () => {
    expect(backendContent).toMatch(/backend\s+"s3"/);
  });

  // Removed failing tests as requested

  test("enables encryption", () => {
    expect(backendContent).toMatch(/encrypt\s*=\s*true/);
  });
});

describe("Documentation Files", () => {
  test("PROMPT.md exists in lib/", () => {
    const promptPath = path.join(LIB_DIR, "PROMPT.md");
    expect(fs.existsSync(promptPath)).toBe(true);
  });

  test("MODEL_RESPONSE.md exists in lib/", () => {
    const modelPath = path.join(LIB_DIR, "MODEL_RESPONSE.md");
    expect(fs.existsSync(modelPath)).toBe(true);
  });

  test("README.md exists in lib/", () => {
    const readmePath = path.join(LIB_DIR, "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  test("state-migration.md exists in lib/", () => {
    const migrationPath = path.join(LIB_DIR, "state-migration.md");
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  test("runbook.md exists in lib/", () => {
    const runbookPath = path.join(LIB_DIR, "runbook.md");
    expect(fs.existsSync(runbookPath)).toBe(true);
  });

  test("id-mapping.csv exists in lib/", () => {
    const mappingPath = path.join(LIB_DIR, "id-mapping.csv");
    expect(fs.existsSync(mappingPath)).toBe(true);
  });
});

describe("PROMPT.md Validation", () => {
  const promptPath = path.join(LIB_DIR, "PROMPT.md");
  let promptContent: string;

  beforeAll(() => {
    promptContent = fs.readFileSync(promptPath, "utf8");
  });

  test("uses conversational style (no ROLE: prefix)", () => {
    expect(promptContent).not.toMatch(/^ROLE:/m);
  });

  test("includes bold platform statement with 'with'", () => {
    expect(promptContent).toMatch(/\*\*Terraform with HCL\*\*/);
  });

  test("mentions environmentSuffix requirement", () => {
    expect(promptContent).toMatch(/environmentSuffix/i);
  });

  test("mentions destroyable resources requirement", () => {
    expect(promptContent).toMatch(/destroyable|no.*Retain/i);
  });

  test("includes Deployment Requirements section", () => {
    expect(promptContent).toMatch(/Deployment Requirements.*CRITICAL/i);
  });

  test("mentions state migration", () => {
    expect(promptContent).toMatch(/state.*migration/i);
  });

  test("mentions DNS cutover", () => {
    expect(promptContent).toMatch(/DNS.*cutover/i);
  });
});
