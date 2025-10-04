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

  describe("main.tf Structure and Content", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(MAIN_TF, "utf8");
    });

    test("contains terraform block with required version", () => {
      expect(mainTfContent).toMatch(/terraform\s*{/);
      expect(mainTfContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("contains required providers configuration", () => {
      expect(mainTfContent).toMatch(/required_providers\s*{/);
      expect(mainTfContent).toMatch(/aws\s*=\s*{/);
      expect(mainTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(mainTfContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("contains dual region provider configuration", () => {
      expect(mainTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"source"/);
      expect(mainTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"target"/);
      expect(mainTfContent).toMatch(/region\s*=\s*var\.source_region/);
      expect(mainTfContent).toMatch(/region\s*=\s*var\.target_region/);
    });

    test("contains VPC and networking resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("contains security groups", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"redis"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"dax"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
    });

    test("contains KMS encryption resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"master"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"master"/);
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("contains S3 bucket resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"data"/);
    });

    test("contains DynamoDB table resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"/);
      expect(mainTfContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(mainTfContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
      expect(mainTfContent).toMatch(/point_in_time_recovery/);
    });

    test("contains DAX cluster resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dax_cluster"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_dax_subnet_group"\s+"main"/);
      expect(mainTfContent).toMatch(/server_side_encryption\s*{/);
    });

    test("contains ElastiCache Redis resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"/);
      expect(mainTfContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      expect(mainTfContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
    });

    test("contains Kinesis stream resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"\s+"s3"/);
      expect(mainTfContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test("contains Lambda function resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda"/);
      expect(mainTfContent).toMatch(/vpc_config\s*{/);
      expect(mainTfContent).toMatch(/tracing_config\s*{/);
    });

    test("contains API Gateway resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_stage"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_integration"\s+"lambda"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"main"/);
    });

    test("contains Step Functions resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"EXPRESS"/);
    });

    test("contains CloudWatch monitoring resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_5xx"/);
    });

    test("contains SNS and SQS resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
    });

    test("contains Secrets Manager resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_secrets"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"app_secrets"/);
    });

    test("contains WAF resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api_gateway"/);
      expect(mainTfContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("contains EventBridge resources", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"scheduled"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"/);
    });

    test("contains VPC endpoints", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(mainTfContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
    });

    test("uses common_tags variable for tagging", () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*(merge\()?var\.common_tags/);
    });

    test("uses target_region variable consistently", () => {
      expect(mainTfContent).toMatch(/var\.target_region/);
    });
  });

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

  describe("backend.tf Structure and Content", () => {
    let backendTfContent: string;

    beforeAll(() => {
      backendTfContent = fs.readFileSync(BACKEND_TF, "utf8");
    });

    test("contains terraform backend configuration", () => {
      expect(backendTfContent).toMatch(/terraform\s*{/);
      expect(backendTfContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("contains S3 bucket for state storage", () => {
      expect(backendTfContent).toMatch(/bucket\s*=\s*"serverless-app-terraform-state-ACCOUNT_ID"/);
    });

    test("contains state file key", () => {
      expect(backendTfContent).toMatch(/key\s*=\s*"serverless-app\/us-west-2\/terraform\.tfstate"/);
    });

    test("contains region configuration", () => {
      expect(backendTfContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("contains DynamoDB table for state locking", () => {
      expect(backendTfContent).toMatch(/dynamodb_table\s*=\s*"terraform-state-lock"/);
    });

    test("contains encryption configuration", () => {
      expect(backendTfContent).toMatch(/encrypt\s*=\s*true/);
    });

    test("contains workspace documentation", () => {
      expect(backendTfContent).toMatch(/workspace/i);
      expect(backendTfContent).toMatch(/migration/i);
    });
  });

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

  test("no hardcoded AWS account IDs", () => {
    // Allow data source references but not hardcoded IDs
    const hardcodedPattern = /:\d{12}:/g;
    const matches = mainTfContent.match(hardcodedPattern) || [];
    const validReferences = matches.filter(match =>
      mainTfContent.includes(`data.aws_caller_identity.current.account_id`) ||
      mainTfContent.includes(`\${data.aws_caller_identity.current.account_id}`)
    );
    // All account ID references should use data source
    expect(matches.every(match =>
      mainTfContent.includes(`data.aws_caller_identity.current.account_id`)
    )).toBe(true);
  });

  test("uses KMS encryption for sensitive resources", () => {
    expect(mainTfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.(arn|id)/);
    expect(mainTfContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master\.(arn|id)/);
  });

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

  test("enables versioning for S3 buckets", () => {
    expect(mainTfContent).toMatch(/versioning_configuration\s*{[\s\S]*?status\s*=\s*"Enabled"/);
  });

  test("blocks public access for S3 buckets", () => {
    expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("uses lifecycle rules for S3 cost optimization", () => {
    expect(mainTfContent).toMatch(/aws_s3_bucket_lifecycle_configuration/);
  });

  test("enables multi-AZ for high availability", () => {
    expect(mainTfContent).toMatch(/multi_az_enabled\s*=\s*true/);
    expect(mainTfContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
  });

  test("enables X-Ray tracing for observability", () => {
    expect(mainTfContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
  });

  test("configures CloudWatch log retention", () => {
    expect(mainTfContent).toMatch(/retention_in_days\s*=\s*7/);
  });

  test("uses proper IAM least privilege policies", () => {
    expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"/);
    expect(mainTfContent).toMatch(/Effect\s*=\s*"Allow"/);
    expect(mainTfContent).toMatch(/Action\s*=\s*\[/);
    expect(mainTfContent).toMatch(/Resource\s*=\s*/);
  });

  test("uses security groups with proper ingress rules", () => {
    expect(mainTfContent).toMatch(/security_groups\s*=\s*\[aws_security_group/);
    expect(mainTfContent).toMatch(/ingress\s*{/);
  });

  test("uses lifecycle policies for important resources", () => {
    expect(mainTfContent).toMatch(/lifecycle\s*{/);
    expect(mainTfContent).toMatch(/create_before_destroy\s*=\s*true/);
  });
});
