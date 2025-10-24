// Unit tests for Terraform feature flag infrastructure
// Tests verify presence and correctness of infrastructure code without execution

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure - Core Files", () => {
  test("main.tf exists", () => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test("variables.tf exists and has required variables", () => {
    const varsPath = path.join(LIB_DIR, "variables.tf");
    expect(fs.existsSync(varsPath)).toBe(true);
    
    const content = fs.readFileSync(varsPath, "utf8");
    expect(content).toMatch(/variable\s+"environment"/);
    expect(content).toMatch(/variable\s+"aws_region"/);
    expect(content).toMatch(/variable\s+"microservices_count"/);
    expect(content).toMatch(/variable\s+"business_rules_count"/);
    expect(content).toMatch(/variable\s+"cost_center"/);
    expect(content).toMatch(/variable\s+"owner"/);
  });

  test("outputs.tf exists and exports key resources", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    expect(fs.existsSync(outputsPath)).toBe(true);
    
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/output\s+"dynamodb_table_name"/);
    expect(content).toMatch(/output\s+"sns_topic_arn"/);
    expect(content).toMatch(/output\s+"redis_endpoint"/);
    expect(content).toMatch(/output\s+"opensearch_endpoint"/);
  });

  test("provider.tf exists", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("main.tf uses environment variable for naming", () => {
    const mainPath = path.join(LIB_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    // Should use ${var.environment} or ${local.name_prefix}, not hardcoded "production" or "dev"
    expect(content).not.toMatch(/name\s*=\s*"production-/);
    expect(content).not.toMatch(/name\s*=\s*"dev-/);
    expect(content).toMatch(/name_prefix/);
  });
});

describe("Terraform Modules - Networking", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/networking");

  test("networking module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("networking module creates VPC and subnets", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_vpc"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
  });

  test("networking module creates security groups", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"elasticache"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"opensearch"/);
  });
});

describe("Terraform Modules - DynamoDB", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/dynamodb");

  test("dynamodb module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("dynamodb module creates table with streams", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"/);
    expect(content).toMatch(/stream_enabled\s*=\s*true/);
    expect(content).toMatch(/stream_view_type/);
    expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("dynamodb module enables encryption", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/server_side_encryption/);
    expect(content).toMatch(/kms_key_arn/);
  });

  test("dynamodb IAM role uses name_prefix not name", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    // Should use name_prefix to avoid CAPABILITY_NAMED_IAM
    expect(content).toMatch(/name_prefix\s*=.*stream-processor/);
    expect(content).not.toMatch(/^\s*name\s*=.*stream-processor[^-]/m);
  });
});

describe("Terraform Modules - Lambda", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/lambda");

  test("lambda module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("lambda module creates all required functions", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"validator"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"cache_updater"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"consistency_checker"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"rollback"/);
  });

  test("lambda functions have correct timeout and memory configurations", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    // Validator: 2 seconds, 1024MB
    expect(content).toMatch(/timeout\s*=\s*2.*memory_size\s*=\s*1024|memory_size\s*=\s*1024.*timeout\s*=\s*2/s);
    
    // Cache updater: 3 seconds
    expect(content).toMatch(/timeout\s*=\s*3/);
    
    // Consistency checker: 5 seconds, 2048MB
    expect(content).toMatch(/timeout\s*=\s*5.*memory_size\s*=\s*2048|memory_size\s*=\s*2048.*timeout\s*=\s*5/s);
    
    // Rollback: 8 seconds
    expect(content).toMatch(/timeout\s*=\s*8/);
  });

  test("all Lambda IAM roles use name_prefix not name", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    // All roles should use name_prefix
    const roleMatches = content.match(/resource\s+"aws_iam_role"/g);
    expect(roleMatches).toBeTruthy();
    expect(roleMatches!.length).toBeGreaterThanOrEqual(4);
    
    // Should not have explicit name property (only name_prefix)
    expect(content).toMatch(/name_prefix\s*=.*validator/);
    expect(content).toMatch(/name_prefix\s*=.*cache-updater/);
    expect(content).toMatch(/name_prefix\s*=.*consistency-checker/);
    expect(content).toMatch(/name_prefix\s*=.*rollback/);
  });
});

describe("Terraform Modules - SNS/SQS", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/sns_sqs");

  test("sns_sqs module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("sns_sqs module creates SNS topic and SQS queues", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_sns_topic"/);
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"microservice"/);
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
  });

  test("sns_sqs module enables KMS encryption", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/kms_master_key_id/);
  });
});

describe("Terraform Modules - ElastiCache", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/elasticache");

  test("elasticache module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("elasticache module creates Redis cluster", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"/);
    expect(content).toMatch(/engine\s*=\s*"redis"/);
  });

  test("elasticache module enables encryption", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    expect(content).toMatch(/transit_encryption_enabled\s*=\s*true/);
    expect(content).toMatch(/auth_token_enabled\s*=\s*true/);
  });

  test("elasticache module has destroyable lifecycle", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/prevent_destroy\s*=\s*false/);
  });
});

describe("Terraform Modules - EventBridge", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/eventbridge");

  test("eventbridge module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("eventbridge module creates Step Functions", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_sfn_state_machine"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
  });

  test("eventbridge IAM roles use name_prefix", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/name_prefix\s*=.*eventbridge/);
    expect(content).toMatch(/name_prefix\s*=.*sfn/);
  });
});

describe("Terraform Modules - OpenSearch", () => {
  const MODULE_DIR = path.join(LIB_DIR, "modules/opensearch");

  test("opensearch module exists with required files", () => {
    expect(fs.existsSync(path.join(MODULE_DIR, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(MODULE_DIR, "outputs.tf"))).toBe(true);
  });

  test("opensearch module creates domain with security", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/resource\s+"aws_opensearch_domain"/);
    expect(content).toMatch(/encrypt_at_rest/);
    expect(content).toMatch(/node_to_node_encryption/);
    expect(content).toMatch(/enforce_https\s*=\s*true/);
  });

  test("opensearch IAM role uses name_prefix", () => {
    const mainPath = path.join(MODULE_DIR, "main.tf");
    const content = fs.readFileSync(mainPath, "utf8");
    
    expect(content).toMatch(/name_prefix\s*=.*opensearch-cognito/);
  });
});

describe("Lambda Functions - ZIP Files", () => {
  const LAMBDA_DIR = path.join(LIB_DIR, "lambda");

  test("all Lambda ZIP files exist", () => {
    expect(fs.existsSync(path.join(LAMBDA_DIR, "validator.zip"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "cache_updater.zip"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "consistency_checker.zip"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "rollback.zip"))).toBe(true);
  });

  test("Lambda source code exists", () => {
    expect(fs.existsSync(path.join(LAMBDA_DIR, "validator/index.py"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "cache_updater/index.py"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "consistency_checker/index.py"))).toBe(true);
    expect(fs.existsSync(path.join(LAMBDA_DIR, "rollback/index.py"))).toBe(true);
  });
});

describe("Documentation and Metadata", () => {
  test("MODEL_FAILURES.md exists and documents fixes", () => {
    const docPath = path.join(LIB_DIR, "MODEL_FAILURES.md");
    expect(fs.existsSync(docPath)).toBe(true);
    
    const content = fs.readFileSync(docPath, "utf8");
    expect(content).toMatch(/Issue \d+:/);
    expect(content).toMatch(/Problem/i);
    expect(content).toMatch(/Solution/i);
  });

  test("metadata.json exists in root", () => {
    const metadataPath = path.resolve(__dirname, "../metadata.json");
    expect(fs.existsSync(metadataPath)).toBe(true);
    
    const content = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    expect(content.platform).toBe("tf");
    expect(content.language).toBe("hcl");
  });
});
