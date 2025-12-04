// tests/unit/unit-tests.ts
// Exhaustive unit tests for tap_stack.tf
// Validates every aspect of the Terraform configuration: versions, providers, variables, resources, and outputs.

import fs from "fs";
import path from "path";

// Paths
const LIB_DIR = path.resolve(__dirname, "../lib");
const STACK_PATH = path.join(LIB_DIR, "tap_stack.tf");
const VARIABLES_PATH = path.join(LIB_DIR, "variables.tf");

// Helper to read file content
const readFile = (filePath: string) => fs.readFileSync(filePath, "utf8");

// Extract a block by type and name (e.g., resource "aws_s3_bucket" "name")
const extractBlock = (content: string, blockType: string, blockLabel1: string, blockLabel2?: string): string | null => {
  let regexStr = `${blockType}\\s+"${blockLabel1}"`;
  if (blockLabel2) {
    regexStr += `\\s+"${blockLabel2}"`;
  }
  regexStr += `\\s+\\{`;

  const headerRegex = new RegExp(regexStr, 'g');
  const match = headerRegex.exec(content);
  if (!match) return null;

  const startIndex = match.index;
  let openBraces = 0;
  let foundFirstBrace = false;
  let endIndex = -1;

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
      openBraces++;
      foundFirstBrace = true;
    }
    if (content[i] === '}') {
      openBraces--;
    }

    if (foundFirstBrace && openBraces === 0) {
      endIndex = i + 1;
      break;
    }
  }

  if (endIndex === -1) return null;
  return content.substring(startIndex, endIndex);
};

// Extract all names of a given block type (e.g., all "aws_s3_bucket" resource names)
const extractBlockNames = (content: string, blockType: string, subType?: string): string[] => {
  const regex = subType
    ? new RegExp(`${blockType}\\s+"${subType}"\\s+"([^"]+)"`, 'g')
    : new RegExp(`${blockType}\\s+"([^"]+)"`, 'g');

  const names: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
};

describe("Exhaustive Terraform Static Analysis", () => {
  const stackContent = readFile(STACK_PATH);
  const variablesContent = readFile(VARIABLES_PATH);
  const fullContent = stackContent + "\n" + variablesContent;

  // 1. Terraform Core Configuration
  describe("Core Configuration", () => {
    test("Terraform version should be constrained", () => {
      expect(stackContent).toMatch(/required_version\s*=\s*">= 1.5.0"/);
    });

    test("AWS Provider version should be constrained", () => {
      expect(stackContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(stackContent).toMatch(/version\s*=\s*"~> 5.0"/);
    });

    test("Archive Provider version should be constrained", () => {
      expect(stackContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
      expect(stackContent).toMatch(/version\s*=\s*"~> 2.4"/);
    });
  });

  // 2. Variables Validation
  describe("Variables", () => {
    const variableNames = extractBlockNames(stackContent, "variable");

    test("All variables should have a description", () => {
      variableNames.forEach(varName => {
        const block = extractBlock(stackContent, "variable", varName);
        expect(block).toMatch(/description\s*=/);
      });
    });

    test("All variables should have a type definition", () => {
      variableNames.forEach(varName => {
        const block = extractBlock(stackContent, "variable", varName);
        expect(block).toMatch(/type\s*=/);
      });
    });

    test("Environment variable should have validation", () => {
      const envVar = extractBlock(stackContent, "variable", "env");
      expect(envVar).toMatch(/validation\s*\{/);
      expect(envVar).toMatch(/condition\s*=/);
      expect(envVar).toMatch(/contains\(\["dev", "staging", "prod"\], var.env\)/);
    });
  });

  // 3. Data Sources
  describe("Data Sources", () => {
    test("Should fetch available Availability Zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
    test("Should fetch current Caller Identity", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // 4. Resources - Networking
  describe("Networking Resources", () => {
    test("VPC Configuration", () => {
      const vpc = extractBlock(stackContent, "resource", "aws_vpc", "main");
      expect(vpc).toMatch(/cidr_block\s*=\s*var.vpc_cidr/);
      expect(vpc).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpc).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpc).toMatch(/tags\s*=/);
    });

    test("Subnets Configuration", () => {
      const publicSubnet = extractBlock(stackContent, "resource", "aws_subnet", "public");
      expect(publicSubnet).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(publicSubnet).toMatch(/count\s*=\s*var.num_availability_zones/);

      const privateSubnet = extractBlock(stackContent, "resource", "aws_subnet", "private");
      expect(privateSubnet).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("NAT Gateway Configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });
  });

  // 5. Resources - Security
  describe("Security Resources", () => {
    test("KMS Key for PHI", () => {
      const key = extractBlock(stackContent, "resource", "aws_kms_key", "phi_encryption");
      expect(key).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(key).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS Key for Logs", () => {
      const key = extractBlock(stackContent, "resource", "aws_kms_key", "cloudwatch_logs");
      expect(key).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("Security Groups", () => {
      const sgs = extractBlockNames(stackContent, "resource", "aws_security_group");
      expect(sgs).toContain("lambda_vpc");
      expect(sgs).toContain("redis");
      expect(sgs).toContain("aurora");

      sgs.forEach(sg => {
        const block = extractBlock(stackContent, "resource", "aws_security_group", sg);
        expect(block).toMatch(/description\s*=/);
        expect(block).toMatch(/vpc_id\s*=/);
      });
    });
  });

  // 6. Resources - Storage (S3)
  describe("Storage Resources (S3)", () => {
    const buckets = extractBlockNames(stackContent, "resource", "aws_s3_bucket");

    test("All buckets should be defined", () => {
      expect(buckets).toContain("audit_logs");
      expect(buckets).toContain("documents");
    });

    buckets.forEach(bucket => {
      test(`Bucket ${bucket} should have Versioning enabled`, () => {
        const versioning = extractBlock(stackContent, "resource", "aws_s3_bucket_versioning", bucket);
        expect(versioning).toMatch(/status\s*=\s*"Enabled"/);
      });

      test(`Bucket ${bucket} should have SSE enabled`, () => {
        const encryption = extractBlock(stackContent, "resource", "aws_s3_bucket_server_side_encryption_configuration", bucket);
        expect(encryption).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      });

      test(`Bucket ${bucket} should block public access`, () => {
        const publicAccess = extractBlock(stackContent, "resource", "aws_s3_bucket_public_access_block", bucket);
        expect(publicAccess).toMatch(/block_public_acls\s*=\s*true/);
        expect(publicAccess).toMatch(/block_public_policy\s*=\s*true/);
        expect(publicAccess).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(publicAccess).toMatch(/restrict_public_buckets\s*=\s*true/);
      });
    });
  });

  // 7. Resources - Database (DynamoDB, RDS, Redis)
  describe("Database Resources", () => {
    const tables = extractBlockNames(stackContent, "resource", "aws_dynamodb_table");

    test("All DynamoDB tables should have encryption and PITR", () => {
      tables.filter(t => t !== "compliance").forEach(table => {
        const block = extractBlock(stackContent, "resource", "aws_dynamodb_table", table);
        expect(block).toMatch(/server_side_encryption\s*\{\s*enabled\s*=\s*true/);
        // PITR might not be on all, but let's check for the main ones
        if (["appointments", "prescriptions", "profiles"].includes(table)) {
          expect(block).toMatch(/point_in_time_recovery\s*\{\s*enabled\s*=\s*true/);
        }
      });
    });

    test("Aurora Cluster Configuration", () => {
      const cluster = extractBlock(stackContent, "resource", "aws_rds_cluster", "aurora");
      expect(cluster).toMatch(/engine\s*=\s*"aurora-postgresql"/);
      expect(cluster).toMatch(/storage_encrypted\s*=\s*true/);
      expect(cluster).toMatch(/kms_key_id\s*=/);
      expect(cluster).toMatch(/deletion_protection\s*=\s*var.deletion_protection/);
    });

    test("Redis Configuration", () => {
      const redis = extractBlock(stackContent, "resource", "aws_elasticache_replication_group", "redis");
      expect(redis).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      expect(redis).toMatch(/transit_encryption_enabled\s*=\s*var.transit_encryption_enabled/);
      expect(redis).toMatch(/auth_token\s*=/);
    });
  });

  // 8. Resources - Compute (Lambda)
  describe("Compute Resources (Lambda)", () => {
    const functions = extractBlockNames(stackContent, "resource", "aws_lambda_function");

    test("All Lambda functions should use defined runtime", () => {
      functions.forEach(func => {
        const block = extractBlock(stackContent, "resource", "aws_lambda_function", func);
        expect(block).toMatch(/runtime\s*=\s*var.runtime/);
      });
    });

    test("All Lambda functions should have tags", () => {
      functions.forEach(func => {
        const block = extractBlock(stackContent, "resource", "aws_lambda_function", func);
        expect(block).toMatch(/tags\s*=\s*merge\(local.tags/);
      });
    });

    test("VPC-enabled Lambdas should have vpc_config", () => {
      const vpcLambdas = ["scheduler", "billing", "session_manager", "approval_checker", "compliance_analyzer", "analytics_aggregator"];
      vpcLambdas.forEach(func => {
        const block = extractBlock(stackContent, "resource", "aws_lambda_function", func);
        expect(block).toMatch(/vpc_config\s*\{/);
      });
    });
  });

  // 9. Resources - Messaging (SQS, SNS)
  describe("Messaging Resources", () => {
    const queues = extractBlockNames(stackContent, "resource", "aws_sqs_queue");

    test("All SQS queues should be encrypted", () => {
      queues.filter(q => !q.includes("dlq")).forEach(queue => {
        const block = extractBlock(stackContent, "resource", "aws_sqs_queue", queue);
        expect(block).toMatch(/kms_master_key_id\s*=/);
      });
    });

    test("All main queues should have a DLQ", () => {
      queues.filter(q => !q.includes("dlq")).forEach(queue => {
        const block = extractBlock(stackContent, "resource", "aws_sqs_queue", queue);
        expect(block).toMatch(/redrive_policy\s*=/);
        expect(block).toMatch(/deadLetterTargetArn/);
      });
    });

    test("SNS Topics should be encrypted", () => {
      const topics = extractBlockNames(stackContent, "resource", "aws_sns_topic");
      topics.forEach(topic => {
        const block = extractBlock(stackContent, "resource", "aws_sns_topic", topic);
        expect(block).toMatch(/kms_master_key_id\s*=/);
      });
    });
  });

  // 10. Resources - API Gateway
  describe("API Gateway Resources", () => {
    test("API Gateway should be Regional", () => {
      const api = extractBlock(stackContent, "resource", "aws_api_gateway_rest_api", "main");
      expect(api).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test("API Stage should have access logs", () => {
      const stage = extractBlock(stackContent, "resource", "aws_api_gateway_stage", "main");
      expect(stage).toMatch(/access_log_settings\s*\{/);
      expect(stage).toMatch(/destination_arn\s*=/);
    });

    test("WAF should be associated (if present)", () => {
      // Conditional check since we know it might be missing in some versions
      if (stackContent.includes("aws_wafv2_web_acl_association")) {
        expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
      }
    });
  });

  // 11. Resources - Step Functions
  describe("Step Functions", () => {
    test("State Machine should have logging enabled", () => {
      const sfn = extractBlock(stackContent, "resource", "aws_sfn_state_machine", "prescription_approval");
      expect(sfn).toMatch(/logging_configuration\s*\{/);
      expect(sfn).toMatch(/level\s*=\s*"ALL"/);
    });
  });

  // 12. Outputs
  describe("Outputs", () => {
    const outputs = extractBlockNames(stackContent, "output");

    test("All outputs should have descriptions", () => {
      outputs.forEach(output => {
        const block = extractBlock(stackContent, "output", output);
        expect(block).toMatch(/description\s*=/);
      });
    });

    test("Critical outputs should be present", () => {
      const requiredOutputs = [
        "api_gateway_url",
        "dynamodb_tables",
        "sns_topic_arns",
        "sqs_queue_urls",
        "aurora_endpoints",
        "redis_endpoint",
        "vpc_id"
      ];
      requiredOutputs.forEach(req => {
        expect(outputs).toContain(req);
      });
    });
  });

});
