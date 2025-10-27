// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for Terraform HCL infrastructure code
// Tests resource configurations, variables, and inline Lambda code

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap-stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap-stack.tf exists and is readable", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("defines multiple AWS providers for regions", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"primary"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"secondary"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-east-1"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("specifies Terraform version constraints", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });
  });

  describe("Variables and Locals", () => {
    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("defines application name and regions in locals", () => {
      expect(stackContent).toMatch(/app_name\s*=\s*"tap-marketplace"/);
      expect(stackContent).toMatch(/primary_region\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/secondary_region\s*=\s*"us-west-2"/);
    });
  });

  describe("DynamoDB Configuration", () => {
    test("creates ticket inventory global table with environment suffix", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"ticket_inventory"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-ticket-inventory-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    });

    test("creates distributed locks table with TTL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"distributed_locks"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-distributed-locks-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
      expect(stackContent).toMatch(/attribute_name\s*=\s*"expiry_time"/);
    });

    test("configures global table replicas across multiple regions", () => {
      const replicaRegions = ["us-west-2", "eu-west-1", "ap-southeast-1", "us-east-2"];
      replicaRegions.forEach(region => {
        expect(stackContent).toMatch(new RegExp(`replica\\s*{[\\s\\S]*?region_name\\s*=\\s*"${region}"`));
      });
    });
  });

  describe("Lambda Functions", () => {
    test("uses inline code instead of ZIP files", () => {
      expect(stackContent).not.toMatch(/filename\s*=\s*"[^"]*\.zip"/);
      expect(stackContent).not.toMatch(/local_file.*\.js/);
      expect(stackContent).toMatch(/archive_file.*{[\s\S]*?content\s*=\s*<<-EOF/);
    });

    test("creates ticket purchase Lambda with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"ticket_purchase"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{local\.app_name\}-ticket-purchase-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
      expect(stackContent).toMatch(/memory_size\s*=\s*3008/);
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*2000/);
    });

    test("creates inventory verifier Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"inventory_verifier"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{local\.app_name\}-inventory-verifier-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
    });

    test("creates kinesis processor Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"kinesis_processor"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{local\.app_name\}-kinesis-processor-\$\{var\.environment_suffix\}"/);
    });

    test("Lambda code includes required AWS SDK imports", () => {
      expect(stackContent).toMatch(/const AWS = require\('aws-sdk'\);/);
      expect(stackContent).toMatch(/const Redis = require\('ioredis'\);/);
      expect(stackContent).toMatch(/const axios = require\('axios'\);/);
    });

    test("Lambda functions have proper IAM roles and environment variables", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution_role\.arn/);
      expect(stackContent).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
      expect(stackContent).toMatch(/INVENTORY_TABLE\s*=\s*aws_dynamodb_table\.ticket_inventory\.name/);
      expect(stackContent).toMatch(/LOCKS_TABLE\s*=\s*aws_dynamodb_table\.distributed_locks\.name/);
    });
  });

  describe("API Gateway", () => {
    test("creates REST API with environment suffix", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-api-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/endpoint_configuration[\s\S]*?types\s*=\s*\["REGIONAL"\]/);
    });

    test("configures Lambda integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/uri\s*=\s*aws_lambda_function\.ticket_purchase\.invoke_arn/);
    });

    test("creates deployment and stage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"/);
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"/);
      expect(stackContent).toMatch(/stage_name\s*=\s*"prod"/);
    });
  });

  describe("Infrastructure Scaling", () => {
    test("configures ElastiCache Redis with clustering", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"/);
      expect(stackContent).toMatch(/replication_group_id\s*=\s*"\$\{local\.app_name\}-redis-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/num_cache_clusters\s*=\s*3/);
      expect(stackContent).toMatch(/node_type\s*=\s*"cache\.r7g\.xlarge"/);
    });

    test("creates Kinesis stream with environment suffix", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"ticket_sales"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-ticket-sales-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/shard_count\s*=\s*20/);
    });

    test("configures Aurora cluster for analytics", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"analytics"/);
      expect(stackContent).toMatch(/cluster_identifier\s*=\s*"\$\{local\.app_name\}-analytics-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(stackContent).toMatch(/serverlessv2_scaling_configuration/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates Lambda execution role with environment suffix", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_role"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-lambda-execution-role-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });

    test("defines comprehensive IAM policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"/);
      expect(stackContent).toMatch(/dynamodb:GetItem/);
      expect(stackContent).toMatch(/dynamodb:PutItem/);
      expect(stackContent).toMatch(/kinesis:PutRecord/);
      expect(stackContent).toMatch(/elasticache:\*/);
    });
  });

  describe("Resource Naming Consistency", () => {
    test("all critical resources use environment suffix", () => {
      const resourcesWithSuffix = [
        "ticket-inventory-\\$\\{var\\.environment_suffix\\}",
        "distributed-locks-\\$\\{var\\.environment_suffix\\}",
        "lambda-execution-role-\\$\\{var\\.environment_suffix\\}",
        "ticket-purchase-\\$\\{var\\.environment_suffix\\}",
        "api-\\$\\{var\\.environment_suffix\\}",
        "redis-\\$\\{var\\.environment_suffix\\}"
      ];
      
      resourcesWithSuffix.forEach(pattern => {
        expect(stackContent).toMatch(new RegExp(pattern));
      });
    });
  });

  describe("Performance and Scaling Requirements", () => {
    test("Lambda configured for high-performance requirements", () => {
      expect(stackContent).toMatch(/memory_size\s*=\s*3008/); // Max Lambda memory
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*2000/);
      expect(stackContent).toMatch(/timeout\s*=\s*30/);
    });

    test("DynamoDB configured for high throughput", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test("Kinesis configured for high volume streaming", () => {
      expect(stackContent).toMatch(/shard_count\s*=\s*20/);
      expect(stackContent).toMatch(/retention_period\s*=\s*24/);
    });
  });
});
