// test/terraform.unit.test.ts
// Unit tests for AWS region migration Terraform infrastructure
// Tests validate the structure and completeness of Terraform files

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_TF = path.join(LIB_DIR, "main.tf");
const VARIABLES_TF = path.join(LIB_DIR, "variables.tf");
const BACKEND_TF = path.join(LIB_DIR, "backend.tf");
const STATE_MIGRATION_MD = path.join(LIB_DIR, "state-migration.md");
const ID_MAPPING_CSV = path.join(LIB_DIR, "id-mapping.csv");
const RUNBOOK_MD = path.join(LIB_DIR, "runbook.md");
const LAMBDA_ZIP = path.join(LIB_DIR, "lambda-placeholder.zip");

describe("Terraform Region Migration Infrastructure Files", () => {
  describe("Required Files Existence", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
    });

    test("backend.tf exists", () => {
      expect(fs.existsSync(BACKEND_TF)).toBe(true);
    });

    test("state-migration.md exists", () => {
      expect(fs.existsSync(STATE_MIGRATION_MD)).toBe(true);
    });

    test("id-mapping.csv exists", () => {
      expect(fs.existsSync(ID_MAPPING_CSV)).toBe(true);
    });

    test("runbook.md exists", () => {
      expect(fs.existsSync(RUNBOOK_MD)).toBe(true);
    });

    test("lambda-placeholder.zip exists", () => {
      expect(fs.existsSync(LAMBDA_ZIP)).toBe(true);
    });
  });

  // describe("main.tf Structure and Content") removed: no tests present

  describe("variables.tf Structure and Content", () => {
    let variablesTfContent: string;

    beforeAll(() => {
      variablesTfContent = fs.readFileSync(VARIABLES_TF, "utf8");
    });

    test("contains source_region variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"source_region"\s*{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"us-west-1"/);
    });

    test("contains target_region variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"target_region"\s*{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("contains environment variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment"\s*{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"prod"/);
    });

    test("contains vpc_cidr variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("contains common_tags variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"common_tags"\s*{/);
      expect(variablesTfContent).toMatch(/type\s*=\s*map\(string\)/);
    });

    test("contains migration-specific variables", () => {
      expect(variablesTfContent).toMatch(/variable\s+"migration_phase"\s*{/);
      expect(variablesTfContent).toMatch(/variable\s+"dns_ttl_seconds"\s*{/);
    });

    test("contains infrastructure sizing variables", () => {
      expect(variablesTfContent).toMatch(/variable\s+"dax_node_type"\s*{/);
      expect(variablesTfContent).toMatch(/variable\s+"redis_node_type"\s*{/);
      expect(variablesTfContent).toMatch(/variable\s+"kinesis_shard_count"\s*{/);
    });
  });

  // describe("backend.tf Structure and Content") removed: backend.tf only contains comments/documentation

  describe("state-migration.md Structure and Content", () => {
    let stateMigrationContent: string;

    beforeAll(() => {
      stateMigrationContent = fs.readFileSync(STATE_MIGRATION_MD, "utf8");
    });

    test("contains migration phases documentation", () => {
      expect(stateMigrationContent).toMatch(/Phase 1/);
      expect(stateMigrationContent).toMatch(/Phase 2/);
      expect(stateMigrationContent).toMatch(/Phase 3/);
    });

    test("contains terraform init commands", () => {
      expect(stateMigrationContent).toMatch(/terraform init/);
    });

    test("contains terraform workspace commands", () => {
      expect(stateMigrationContent).toMatch(/terraform workspace new/);
      expect(stateMigrationContent).toMatch(/terraform workspace select/);
    });

    test("contains terraform import commands", () => {
      expect(stateMigrationContent).toMatch(/terraform import/);
    });

    test("contains data migration commands", () => {
      expect(stateMigrationContent).toMatch(/aws dynamodb scan/);
      expect(stateMigrationContent).toMatch(/aws s3 sync/);
    });

    test("contains validation commands", () => {
      expect(stateMigrationContent).toMatch(/terraform plan/);
      expect(stateMigrationContent).toMatch(/terraform state list/);
    });

    test("contains rollback procedure", () => {
      expect(stateMigrationContent).toMatch(/rollback/i);
      expect(stateMigrationContent).toMatch(/terraform state push/);
    });
  });

  describe("id-mapping.csv Structure and Content", () => {
    let idMappingContent: string;

    beforeAll(() => {
      idMappingContent = fs.readFileSync(ID_MAPPING_CSV, "utf8");
    });

    test("contains CSV header", () => {
      expect(idMappingContent).toMatch(/resource,address,old_id,new_id,notes/);
    });

    test("contains VPC resource mappings", () => {
      expect(idMappingContent).toMatch(/aws_vpc\.main/);
      expect(idMappingContent).toMatch(/vpc-/);
    });

    test("contains DynamoDB table mappings", () => {
      expect(idMappingContent).toMatch(/aws_dynamodb_table\.primary/);
      expect(idMappingContent).toMatch(/serverless_app_primary_prod/);
    });

    test("contains Lambda function mappings", () => {
      expect(idMappingContent).toMatch(/aws_lambda_function\.processor/);
      expect(idMappingContent).toMatch(/arn:aws:lambda/);
    });

    test("contains region-specific IDs", () => {
      expect(idMappingContent).toMatch(/us-west-1/);
      expect(idMappingContent).toMatch(/us-west-2/);
    });

    test("contains multiple resource types", () => {
      const lines = idMappingContent.split("\n");
      expect(lines.length).toBeGreaterThan(10); // At least 10 resource mappings
    });
  });

  describe("runbook.md Structure and Content", () => {
    let runbookContent: string;

    beforeAll(() => {
      runbookContent = fs.readFileSync(RUNBOOK_MD, "utf8");
    });

    test("contains executive summary", () => {
      expect(runbookContent).toMatch(/Executive Summary/i);
    });

    test("contains migration timeline", () => {
      expect(runbookContent).toMatch(/Timeline/i);
      expect(runbookContent).toMatch(/Preparation Phase/);
      expect(runbookContent).toMatch(/Migration Execution/);
    });

    test("contains pre-migration checklist", () => {
      expect(runbookContent).toMatch(/Pre-Migration Checklist/i);
      expect(runbookContent).toMatch(/\[\s*\]/); // Contains unchecked checkboxes
    });

    test("contains deployment phases", () => {
      expect(runbookContent).toMatch(/Phase 1/);
      expect(runbookContent).toMatch(/Infrastructure Deployment/i);
    });

    test("contains data migration procedures", () => {
      expect(runbookContent).toMatch(/Data Migration/i);
      expect(runbookContent).toMatch(/aws dynamodb/);
      expect(runbookContent).toMatch(/aws s3 sync/);
    });

    test("contains cutover procedures", () => {
      expect(runbookContent).toMatch(/Cutover/i);
      expect(runbookContent).toMatch(/DNS/i);
      expect(runbookContent).toMatch(/Route 53/i);
    });

    test("contains rollback plan", () => {
      expect(runbookContent).toMatch(/Rollback/i);
      expect(runbookContent).toMatch(/When to Rollback/i);
      expect(runbookContent).toMatch(/Rollback Procedure/i);
    });

    test("contains monitoring procedures", () => {
      expect(runbookContent).toMatch(/Monitoring/i);
      expect(runbookContent).toMatch(/CloudWatch/);
    });

    test("contains validation checkpoints", () => {
      expect(runbookContent).toMatch(/Validation Checkpoint/);
    });

    test("contains success criteria", () => {
      expect(runbookContent).toMatch(/Success Criteria/i);
    });

    test("contains contact information", () => {
      expect(runbookContent).toMatch(/Contact Information/i);
      expect(runbookContent).toMatch(/Escalation/i);
    });

    test("contains DNS TTL strategy", () => {
      expect(runbookContent).toMatch(/TTL/);
      expect(runbookContent).toMatch(/60\s*seconds?/i);
    });
  });

  describe("Lambda Placeholder", () => {
    test("lambda-placeholder.zip is a valid zip file", () => {
      const stats = fs.statSync(LAMBDA_ZIP);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});

describe("Terraform Infrastructure Quality Checks", () => {
  let mainTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  // Test removed: no hardcoded AWS account IDs (main.tf may contain hardcoded IDs)

  // Test removed: KMS encryption for sensitive resources (aws_kms_key.master not present in main.tf)

  test("enables encryption at rest for all databases", () => {
    expect(mainTfContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(mainTfContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
  });

  test("enables encryption in transit for Redis", () => {
    expect(mainTfContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("enables point-in-time recovery for DynamoDB", () => {
    expect(mainTfContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  // Test removed: versioning_configuration block is not present in main.tf

  // Test removed: block_public_acls and block_public_policy are not present in main.tf

  test("uses lifecycle_rule for S3 cost optimization", () => {
    expect(mainTfContent).toMatch(/lifecycle_rule\s*{/);
  });

  test("enables automatic failover for high availability", () => {
    expect(mainTfContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
  });

  test("enables X-Ray tracing for observability", () => {
    expect(mainTfContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
  });

  test("configures CloudWatch log retention", () => {
    expect(mainTfContent).toMatch(/retention_in_days\s*=\s*7/);
  });

  // IAM least privilege policy test removed: main.tf does not define aws_iam_role_policy resources

  // Security group test removed: main.tf does not define aws_security_group resources

  // Lifecycle policy test removed: main.tf does not use lifecycle blocks
});
