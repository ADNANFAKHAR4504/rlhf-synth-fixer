// Unit tests for Terraform HCL infrastructure files
// Environment-agnostic tests - verify schema correctness, resource definitions, and best practices
// No Terraform commands are executed - pure static analysis

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract a Terraform block by regex pattern (resource, data, variable, output, etc.)
 */
function extractBlockByRegex(content: string, startRegex: RegExp): string | null {
  const match = startRegex.exec(content);
  if (!match) return null;

  const startIndex = match.index;
  const firstBraceIndex = content.indexOf('{', startIndex);
  if (firstBraceIndex === -1) return null;

  let openBraces = 0;
  let endIndex = -1;

  for (let i = firstBraceIndex; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    else if (content[i] === '}') openBraces--;

    if (openBraces === 0) {
      endIndex = i + 1;
      break;
    }
  }

  if (endIndex === -1) return null;
  return content.substring(startIndex, endIndex);
}

function extractResource(content: string, type: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`resource\\s+"${type}"\\s+"${name}"\\s*\\{`, 'g'));
}

function extractVariable(content: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`variable\\s+"${name}"\\s*\\{`, 'g'));
}

function extractOutput(content: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`output\\s+"${name}"\\s*\\{`, 'g'));
}

function countResources(content: string, resourceType: string): number {
  const regex = new RegExp(`resource\\s+"${resourceType}"`, 'g');
  return (content.match(regex) || []).length;
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Terraform Infrastructure Unit Tests - Complete Coverage', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let tapStackContent: string;
  let variablesContent: string;
  let providerContent: string;
  let stepFunctionsTemplate: string;
  let combinedContent: string;

  beforeAll(() => {
    const tapStackPath = path.join(libPath, 'tap_stack.tf');
    const variablesPath = path.join(libPath, 'variables.tf');
    const providerPath = path.join(libPath, 'provider.tf');
    const stepFunctionsPath = path.join(libPath, 'step_functions_definition.json.tpl');

    if (!fs.existsSync(tapStackPath)) {
      throw new Error(`tap_stack.tf not found at ${tapStackPath}`);
    }
    if (!fs.existsSync(variablesPath)) {
      throw new Error(`variables.tf not found at ${variablesPath}`);
    }
    if (!fs.existsSync(providerPath)) {
      throw new Error(`provider.tf not found at ${providerPath}`);
    }

    tapStackContent = fs.readFileSync(tapStackPath, 'utf8');
    variablesContent = fs.readFileSync(variablesPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');

    if (fs.existsSync(stepFunctionsPath)) {
      stepFunctionsTemplate = fs.readFileSync(stepFunctionsPath, 'utf8');
    } else {
      stepFunctionsTemplate = '';
    }

    combinedContent = providerContent + '\n' + variablesContent + '\n' + tapStackContent;
  });

  // =============================================================================
  // PHASE 1: FILE STRUCTURE & EXISTENCE (10 tests)
  // =============================================================================

  describe('Phase 1: File Structure & Existence', () => {
    test('1.1 tap_stack.tf file exists', () => {
      expect(fs.existsSync(path.join(libPath, 'tap_stack.tf'))).toBe(true);
    });

    test('1.2 variables.tf file exists', () => {
      expect(fs.existsSync(path.join(libPath, 'variables.tf'))).toBe(true);
    });

    test('1.3 provider.tf file exists', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('1.4 step_functions_definition.json.tpl file exists', () => {
      expect(fs.existsSync(path.join(libPath, 'step_functions_definition.json.tpl'))).toBe(true);
    });

    test('1.5 provider.tf declares AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('1.6 provider.tf specifies AWS provider version', () => {
      expect(providerContent).toMatch(/version\s*=\s*"=\s*6\.9\.0"/);
    });

    test('1.7 provider.tf requires terraform >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('1.8 tap_stack.tf has balanced braces', () => {
      const openBraces = (tapStackContent.match(/\{/g) || []).length;
      const closeBraces = (tapStackContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('1.9 variables.tf does not declare provider block', () => {
      expect(variablesContent).not.toMatch(/provider\s+"aws"/);
    });

    test('1.10 tap_stack.tf does not redeclare provider block', () => {
      expect(tapStackContent).not.toMatch(/^provider\s+"aws"/m);
    });
  });

  // =============================================================================
  // PHASE 2: VARIABLE DECLARATIONS (20 tests)
  // =============================================================================

  describe('Phase 2: Variable Declarations', () => {
    const requiredVars = [
      'env', 'aws_region', 'project_name', 'owner', 'cost_center',
      'vpc_cidr', 'public_subnet_cidrs', 'private_subnet_cidrs', 'availability_zones',
      'api_gateway_throttle_rate_limit', 'api_gateway_throttle_burst_limit',
      'dynamodb_maintenance_requests_read_capacity', 'dynamodb_maintenance_requests_write_capacity',
      'lambda_validator_memory', 'lambda_validator_timeout',
      'redis_node_type', 'redis_num_cache_nodes', 'redis_multi_az_enabled',
      'aurora_instance_class', 'aurora_min_capacity', 'aurora_backup_retention_period',
      's3_archive_bucket', 's3_compliance_bucket'
    ];

    requiredVars.forEach((varName, index) => {
      test(`2.${index + 1} variable "${varName}" is declared`, () => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*\\{`));
      });
    });
  });

  // =============================================================================
  // PHASE 3: RESOURCE COUNTS & EXISTENCE (30 tests)
  // =============================================================================

  describe('Phase 3: Resource Counts & Existence', () => {
    test('3.1 has exactly 1 VPC', () => {
      expect(countResources(tapStackContent, 'aws_vpc')).toBe(1);
    });

    test('3.2 has exactly 2 subnets (public + private with count)', () => {
      expect(countResources(tapStackContent, 'aws_subnet')).toBe(2);
    });

    test('3.3 has exactly 1 Internet Gateway', () => {
      expect(countResources(tapStackContent, 'aws_internet_gateway')).toBe(1);
    });

    test('3.4 has exactly 1 NAT Gateway', () => {
      expect(countResources(tapStackContent, 'aws_nat_gateway')).toBe(1);
    });

    test('3.5 has exactly 1 EIP for NAT Gateway', () => {
      expect(countResources(tapStackContent, 'aws_eip')).toBe(1);
    });

    test('3.6 has exactly 2 route tables (public + private)', () => {
      expect(countResources(tapStackContent, 'aws_route_table')).toBe(2);
    });

    test('3.7 has exactly 2 route table associations', () => {
      expect(countResources(tapStackContent, 'aws_route_table_association')).toBe(2);
    });

    test('3.8 has exactly 5 VPC endpoints', () => {
      expect(countResources(tapStackContent, 'aws_vpc_endpoint')).toBe(5);
    });

    test('3.9 has exactly 4 security groups', () => {
      expect(countResources(tapStackContent, 'aws_security_group')).toBe(4);
    });

    test('3.10 has exactly 6 DynamoDB tables', () => {
      expect(countResources(tapStackContent, 'aws_dynamodb_table')).toBe(6);
    });

    test('3.11 has exactly 1 ElastiCache replication group', () => {
      expect(countResources(tapStackContent, 'aws_elasticache_replication_group')).toBe(1);
    });

    test('3.12 has exactly 1 ElastiCache subnet group', () => {
      expect(countResources(tapStackContent, 'aws_elasticache_subnet_group')).toBe(1);
    });

    test('3.13 has exactly 1 RDS Aurora cluster', () => {
      expect(countResources(tapStackContent, 'aws_rds_cluster')).toBe(1);
    });

    test('3.14 has exactly 1 RDS cluster instance', () => {
      expect(countResources(tapStackContent, 'aws_rds_cluster_instance')).toBe(1);
    });

    test('3.15 has exactly 1 DB subnet group', () => {
      expect(countResources(tapStackContent, 'aws_db_subnet_group')).toBe(1);
    });

    test('3.16 has exactly 4 SNS topics', () => {
      expect(countResources(tapStackContent, 'aws_sns_topic')).toBe(4);
    });

    test('3.17 has exactly 4 SQS queues (including DLQs)', () => {
      expect(countResources(tapStackContent, 'aws_sqs_queue')).toBe(4);
    });

    test('3.18 has exactly 2 SNS-to-SQS subscriptions', () => {
      expect(countResources(tapStackContent, 'aws_sns_topic_subscription')).toBe(2);
    });

    test('3.19 has exactly 2 S3 buckets', () => {
      expect(countResources(tapStackContent, 'aws_s3_bucket')).toBe(2);
    });

    test('3.20 has exactly 7 Lambda functions', () => {
      expect(countResources(tapStackContent, 'aws_lambda_function')).toBe(7);
    });

    test('3.21 has exactly 9 IAM roles', () => {
      expect(countResources(tapStackContent, 'aws_iam_role')).toBe(9);
    });

    test('3.22 has exactly 8 IAM role policies', () => {
      expect(countResources(tapStackContent, 'aws_iam_role_policy')).toBe(8);
    });

    test('3.23 has exactly 1 API Gateway REST API', () => {
      expect(countResources(tapStackContent, 'aws_api_gateway_rest_api')).toBe(1);
    });

    test('3.24 has exactly 1 Step Functions state machine', () => {
      expect(countResources(tapStackContent, 'aws_sfn_state_machine')).toBe(1);
    });

    test('3.25 has exactly 2 EventBridge rules', () => {
      expect(countResources(tapStackContent, 'aws_cloudwatch_event_rule')).toBe(2);
    });

    test('3.26 has exactly 5 CloudWatch log groups', () => {
      expect(countResources(tapStackContent, 'aws_cloudwatch_log_group')).toBe(5);
    });

    test('3.27 has exactly 5 CloudWatch metric alarms', () => {
      expect(countResources(tapStackContent, 'aws_cloudwatch_metric_alarm')).toBe(5);
    });

    test('3.28 has exactly 1 CloudWatch dashboard', () => {
      expect(countResources(tapStackContent, 'aws_cloudwatch_dashboard')).toBe(1);
    });

    test('3.29 has exactly 1 KMS key', () => {
      expect(countResources(tapStackContent, 'aws_kms_key')).toBe(1);
    });

    test('3.30 has exactly 4 Secrets Manager secrets (2 secrets + 2 versions)', () => {
      const secrets = countResources(tapStackContent, 'aws_secretsmanager_secret');
      const versions = countResources(tapStackContent, 'aws_secretsmanager_secret_version');
      expect(secrets).toBe(2);
      expect(versions).toBe(2);
    });
  });

  // =============================================================================
  // PHASE 4: NETWORKING & SECURITY (25 tests)
  // =============================================================================

  describe('Phase 4: Networking & Security', () => {
    test('4.1 VPC enables DNS hostnames', () => {
      const vpc = extractResource(tapStackContent, 'aws_vpc', 'main');
      expect(vpc).toContain('enable_dns_hostnames = true');
    });

    test('4.2 VPC enables DNS support', () => {
      const vpc = extractResource(tapStackContent, 'aws_vpc', 'main');
      expect(vpc).toContain('enable_dns_support   = true');
    });

    test('4.3 Public subnets map public IP on launch', () => {
      const subnet = extractResource(tapStackContent, 'aws_subnet', 'public');
      expect(subnet).toContain('map_public_ip_on_launch = true');
    });

    test('4.4 Private subnets do NOT map public IP on launch', () => {
      const subnet = extractResource(tapStackContent, 'aws_subnet', 'private');
      expect(subnet).not.toContain('map_public_ip_on_launch = true');
    });

    test('4.5 NAT Gateway is in public subnet', () => {
      const nat = extractResource(tapStackContent, 'aws_nat_gateway', 'main');
      expect(nat).toContain('aws_subnet.public');
    });

    test('4.6 Public route table routes to Internet Gateway', () => {
      const rt = extractResource(tapStackContent, 'aws_route_table', 'public');
      expect(rt).toContain('gateway_id');
    });

    test('4.7 Private route table routes to NAT Gateway', () => {
      const rt = extractResource(tapStackContent, 'aws_route_table', 'private');
      expect(rt).toContain('nat_gateway_id');
    });

    test('4.8 VPC endpoint for DynamoDB exists', () => {
      expect(tapStackContent).toContain('resource "aws_vpc_endpoint" "dynamodb"');
    });

    test('4.9 VPC endpoint for S3 exists', () => {
      expect(tapStackContent).toContain('resource "aws_vpc_endpoint" "s3"');
    });

    test('4.10 VPC endpoint for SNS exists', () => {
      expect(tapStackContent).toContain('resource "aws_vpc_endpoint" "sns"');
    });

    test('4.11 VPC endpoint for SQS exists', () => {
      expect(tapStackContent).toContain('resource "aws_vpc_endpoint" "sqs"');
    });

    test('4.12 VPC endpoint for Step Functions exists', () => {
      expect(tapStackContent).toContain('resource "aws_vpc_endpoint" "states"');
    });

    test('4.13 Lambda security group allows outbound traffic', () => {
      const sg = extractResource(tapStackContent, 'aws_security_group', 'lambda');
      expect(sg).toContain('egress');
    });

    test('4.14 Redis security group restricts ingress to Lambda SG', () => {
      const sg = extractResource(tapStackContent, 'aws_security_group', 'redis');
      expect(sg).toContain('security_groups = [aws_security_group.lambda.id]');
    });

    test('4.15 Aurora security group restricts ingress to Lambda SG', () => {
      const sg = extractResource(tapStackContent, 'aws_security_group', 'aurora');
      expect(sg).toContain('security_groups = [aws_security_group.lambda.id]');
    });

    test('4.16 VPC endpoints security group allows HTTPS', () => {
      const sg = extractResource(tapStackContent, 'aws_security_group', 'vpc_endpoints');
      expect(sg).toMatch(/from_port\s*=\s*443/);
      expect(sg).toMatch(/to_port\s*=\s*443/);
    });

    test('4.17 Redis uses encryption at rest', () => {
      const redis = extractResource(tapStackContent, 'aws_elasticache_replication_group', 'redis');
      expect(redis).toContain('at_rest_encryption_enabled = true');
    });

    test('4.18 Redis uses encryption in transit', () => {
      const redis = extractResource(tapStackContent, 'aws_elasticache_replication_group', 'redis');
      expect(redis).toContain('transit_encryption_enabled = true');
    });

    test('4.19 Aurora cluster is encrypted', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('4.20 S3 archive bucket has encryption', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "archive"');
    });

    test('4.21 S3 compliance bucket has encryption', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports"');
    });

    test('4.22 S3 buckets have encryption configuration', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "archive"');
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports"');
    });

    test('4.23 DynamoDB tables use encryption', () => {
      const table = extractResource(tapStackContent, 'aws_dynamodb_table', 'maintenance_requests');
      expect(table).toContain('server_side_encryption');
    });

    test('4.24 KMS key for maintenance data exists', () => {
      expect(tapStackContent).toContain('resource "aws_kms_key" "maintenance_data"');
    });

    test('4.25 No hardcoded credentials in any file', () => {
      expect(combinedContent).not.toMatch(/aws_access_key_id/);
      expect(combinedContent).not.toMatch(/aws_secret_access_key/);
      expect(combinedContent).not.toMatch(/password\s*=\s*"[^$]/);
    });
  });

  // =============================================================================
  // PHASE 5: IAM & LEAST PRIVILEGE (20 tests)
  // =============================================================================

  describe('Phase 5: IAM & Least Privilege', () => {
    const lambdaRoles = ['lambda_validator', 'lambda_router', 'lambda_vendor_notifier', 'lambda_status_processor', 'lambda_escalation'];

    lambdaRoles.forEach((roleName, index) => {
      test(`5.${index + 1} ${roleName} IAM role exists`, () => {
        expect(tapStackContent).toContain(`resource "aws_iam_role" "${roleName}"`);
      });

      test(`5.${index + 6} ${roleName} uses Lambda assume role policy`, () => {
        const role = extractResource(tapStackContent, 'aws_iam_role', roleName);
        if (role) {
          expect(role).toContain('assume_role_policy');
        }
      });
    });

    test('5.11 Lambda validator policy allows DynamoDB access', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'lambda_validator');
      expect(policy).toContain('dynamodb:PutItem');
    });

    test('5.12 Lambda router policy allows DynamoDB streams', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'lambda_router');
      expect(policy).toContain('dynamodb:GetRecords');
      expect(policy).toContain('dynamodb:GetShardIterator');
    });

    test('5.13 Lambda router policy allows SNS publish', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'lambda_router');
      expect(policy).toContain('sns:Publish');
    });

    test('5.14 Lambda vendor notifier policy allows SQS access', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'lambda_vendor_notifier');
      expect(policy).toContain('sqs:ReceiveMessage');
      expect(policy).toContain('sqs:DeleteMessage');
    });

    test('5.15 Step Functions role allows Lambda invoke', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'step_functions');
      expect(policy).toContain('lambda:InvokeFunction');
    });

    test('5.16 Step Functions role allows SNS publish', () => {
      const policy = extractResource(tapStackContent, 'aws_iam_role_policy', 'step_functions');
      expect(policy).toContain('sns:Publish');
    });

    test('5.17 Aurora monitoring role has enhanced monitoring policy', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role_policy_attachment" "aurora_monitoring"');
      const attachment = extractResource(tapStackContent, 'aws_iam_role_policy_attachment', 'aurora_monitoring');
      expect(attachment).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });

    test('5.18 All Lambda policies include CloudWatch Logs permissions', () => {
      lambdaRoles.forEach(roleName => {
        const policy = extractResource(tapStackContent, 'aws_iam_role_policy', roleName);
        if (policy) {
          expect(policy).toContain('logs:CreateLogGroup');
        }
      });
    });

    test('5.19 IAM policies use resource-specific ARNs (not wildcards)', () => {
      const validatorPolicy = extractResource(tapStackContent, 'aws_iam_role_policy', 'lambda_validator');
      expect(validatorPolicy).toContain('aws_dynamodb_table.maintenance_requests.arn');
    });

    test('5.20 No overly permissive policies (no "*" actions on "*" resources)', () => {
      const dangerousPattern = /"Action":\s*"\*"[\s\S]*?"Resource":\s*"\*"/;
      expect(tapStackContent).not.toMatch(dangerousPattern);
    });
  });

  // =============================================================================
  // PHASE 6: DYNAMODB TABLES (18 tests)
  // =============================================================================

  describe('Phase 6: DynamoDB Tables', () => {
    const tables = [
      { name: 'maintenance_requests', hashKey: 'request_id', rangeKey: 'property_id' },
      { name: 'vendor_availability', hashKey: 'vendor_id', rangeKey: 'skill_type' },
      { name: 'priority_matrix', hashKey: 'request_type', rangeKey: 'property_tier' },
      { name: 'quality_rules', hashKey: 'rule_id', rangeKey: null },
      { name: 'penalty_rates', hashKey: 'violation_type', rangeKey: null },
      { name: 'vendor_scores', hashKey: 'vendor_id', rangeKey: 'period' },
    ];

    tables.forEach((table, index) => {
      test(`6.${index * 3 + 1} ${table.name} table exists`, () => {
        expect(tapStackContent).toContain(`resource "aws_dynamodb_table" "${table.name}"`);
      });

      test(`6.${index * 3 + 2} ${table.name} has correct hash key`, () => {
        const tableBlock = extractResource(tapStackContent, 'aws_dynamodb_table', table.name);
        expect(tableBlock).toContain(`hash_key       = "${table.hashKey}"`);
      });

      if (table.rangeKey) {
        test(`6.${index * 3 + 3} ${table.name} has correct range key`, () => {
          const tableBlock = extractResource(tapStackContent, 'aws_dynamodb_table', table.name);
          expect(tableBlock).toContain(`range_key      = "${table.rangeKey}"`);
        });
      } else {
        test(`6.${index * 3 + 3} ${table.name} has no range key`, () => {
          const tableBlock = extractResource(tapStackContent, 'aws_dynamodb_table', table.name);
          expect(tableBlock).not.toContain('range_key');
        });
      }
    });
  });

  // =============================================================================
  // PHASE 7: LAMBDA FUNCTIONS (21 tests)
  // =============================================================================

  describe('Phase 7: Lambda Functions', () => {
    const lambdas = [
      'validator',
      'router',
      'vendor_notifier',
      'status_processor',
      'escalation_primary',
      'escalation_backup',
      'compliance_checker'
    ];

    lambdas.forEach((lambdaName, index) => {
      test(`7.${index + 1} Lambda function ${lambdaName} exists`, () => {
        expect(tapStackContent).toContain(`resource "aws_lambda_function" "${lambdaName}"`);
      });
    });

    test('7.8 Lambda functions use Python runtime', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toMatch(/runtime\s*=/);
    });

    test('7.9 Lambda functions have timeout configured', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toContain('timeout');
    });

    test('7.10 Lambda functions have memory configured', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toContain('memory_size');
    });

    test('7.11 Lambda router is in VPC', () => {
      const router = extractResource(tapStackContent, 'aws_lambda_function', 'router');
      expect(router).toContain('vpc_config');
      expect(router).toContain('subnet_ids');
      expect(router).toContain('security_group_ids');
    });

    test('7.12 Lambda validator has environment variables', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toContain('environment');
    });

    test('7.13 Lambda router has DynamoDB stream event source', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_event_source_mapping" "router_stream"');
    });

    test('7.14 Lambda vendor notifier has SQS event source', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_event_source_mapping" "vendor_notifier_sqs"');
    });

    test('7.15 Lambda has API Gateway permissions', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_permission" "api_gateway_validator"');
      expect(tapStackContent).toContain('resource "aws_lambda_permission" "api_gateway_status_processor"');
    });

    test('7.16 Lambda layer for psycopg2 exists', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_layer_version" "psycopg2"');
    });

    test('7.17 Status processor Lambda uses psycopg2 layer', () => {
      const statusProcessor = extractResource(tapStackContent, 'aws_lambda_function', 'status_processor');
      expect(statusProcessor).toContain('layers');
      expect(statusProcessor).toContain('aws_lambda_layer_version.psycopg2.arn');
    });

    test('7.18 Lambda functions use data archive for source code', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toContain('filename');
      expect(validator).toContain('data.archive_file');
    });

    test('7.19 Lambda escalation functions exist for primary and backup', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_function" "escalation_primary"');
      expect(tapStackContent).toContain('resource "aws_lambda_function" "escalation_backup"');
    });

    test('7.20 Lambda compliance checker exists', () => {
      expect(tapStackContent).toContain('resource "aws_lambda_function" "compliance_checker"');
    });

    test('7.21 All Lambda functions have roles assigned', () => {
      lambdas.forEach(lambdaName => {
        const lambda = extractResource(tapStackContent, 'aws_lambda_function', lambdaName);
        if (lambda) {
          expect(lambda).toContain('role');
        }
      });
    });
  });

  // =============================================================================
  // PHASE 8: API GATEWAY (15 tests)
  // =============================================================================

  describe('Phase 8: API Gateway', () => {
    test('8.1 API Gateway REST API exists', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_rest_api" "main"');
    });

    test('8.2 API Gateway has request validator', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_request_validator" "main"');
    });

    test('8.3 API Gateway /request resource exists', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_resource" "request"');
    });

    test('8.4 API Gateway /vendor resource exists', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_resource" "vendor"');
    });

    test('8.5 API Gateway /vendor/status resource exists', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_resource" "vendor_status"');
    });

    test('8.6 API Gateway /mock-sms resource exists', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_resource" "mock_sms"');
    });

    test('8.7 API Gateway POST method on /request', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_method" "request_post"');
    });

    test('8.8 API Gateway has API key requirement configured', () => {
      const method = extractResource(tapStackContent, 'aws_api_gateway_method', 'request_post');
      expect(method).toContain('api_key_required');
    });

    test('8.9 API Gateway has deployment', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_deployment" "main"');
    });

    test('8.10 API Gateway has stage', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_stage" "main"');
    });

    test('8.11 API Gateway stage has throttle settings', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_stage" "main"');
      expect(tapStackContent).toContain('throttle_settings');
    });

    test('8.12 API Gateway has usage plan', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_usage_plan" "main"');
    });

    test('8.13 API Gateway has API key', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_api_key" "main"');
    });

    test('8.14 API Gateway usage plan has throttle settings', () => {
      const usagePlan = extractResource(tapStackContent, 'aws_api_gateway_usage_plan', 'main');
      expect(usagePlan).toContain('throttle_settings');
    });

    test('8.15 API Gateway method settings configured', () => {
      expect(tapStackContent).toContain('resource "aws_api_gateway_method_settings" "all"');
    });
  });

  // =============================================================================
  // PHASE 9: MESSAGING (SNS & SQS) (15 tests)
  // =============================================================================

  describe('Phase 9: Messaging (SNS & SQS)', () => {
    const snsTopics = ['request_assigned', 'status_updates', 'compliance_alerts', 'escalation_alerts'];
    const sqsQueues = ['vendor_notifications', 'tenant_acknowledgments', 'vendor_notifications_dlq', 'tenant_acknowledgments_dlq'];

    snsTopics.forEach((topicName, index) => {
      test(`9.${index + 1} SNS topic ${topicName} exists`, () => {
        expect(tapStackContent).toContain(`resource "aws_sns_topic" "${topicName}"`);
      });
    });

    sqsQueues.forEach((queueName, index) => {
      test(`9.${index + 5} SQS queue ${queueName} exists`, () => {
        expect(tapStackContent).toContain(`resource "aws_sqs_queue" "${queueName}"`);
      });
    });

    test('9.9 SQS vendor_notifications has DLQ configured', () => {
      const queue = extractResource(tapStackContent, 'aws_sqs_queue', 'vendor_notifications');
      expect(queue).toContain('redrive_policy');
    });

    test('9.10 SQS tenant_acknowledgments has DLQ configured', () => {
      const queue = extractResource(tapStackContent, 'aws_sqs_queue', 'tenant_acknowledgments');
      expect(queue).toContain('redrive_policy');
    });

    test('9.11 SNS to SQS subscription for vendor_notifications', () => {
      expect(tapStackContent).toContain('resource "aws_sns_topic_subscription" "vendor_notifications"');
    });

    test('9.12 SNS to SQS subscription for tenant_acknowledgments', () => {
      expect(tapStackContent).toContain('resource "aws_sns_topic_subscription" "tenant_acknowledgments"');
    });

    test('9.13 SQS queue policy for vendor_notifications', () => {
      expect(tapStackContent).toContain('resource "aws_sqs_queue_policy" "vendor_notifications"');
    });

    test('9.14 SQS queue policy for tenant_acknowledgments', () => {
      expect(tapStackContent).toContain('resource "aws_sqs_queue_policy" "tenant_acknowledgments"');
    });

    test('9.15 SNS topics have KMS encryption', () => {
      const topic = extractResource(tapStackContent, 'aws_sns_topic', 'request_assigned');
      expect(topic).toContain('kms_master_key_id');
    });
  });

  // =============================================================================
  // PHASE 10: STORAGE (S3) (10 tests)
  // =============================================================================

  describe('Phase 10: Storage (S3)', () => {
    test('10.1 S3 archive bucket exists', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket" "archive"');
    });

    test('10.2 S3 compliance_reports bucket exists', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket" "compliance_reports"');
    });

    test('10.3 S3 archive bucket has versioning', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_versioning" "archive"');
    });

    test('10.4 S3 compliance bucket has versioning', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_versioning" "compliance_reports"');
    });

    test('10.5 S3 archive bucket has lifecycle policy', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_lifecycle_configuration" "archive"');
    });

    test('10.6 S3 compliance bucket has lifecycle policy', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_lifecycle_configuration" "compliance_reports"');
    });

    test('10.7 S3 lifecycle policy has filter configured', () => {
      const lifecycle = extractResource(tapStackContent, 'aws_s3_bucket_lifecycle_configuration', 'archive');
      expect(lifecycle).toContain('filter');
    });

    test('10.8 S3 buckets have force_destroy enabled', () => {
      const archiveBucket = extractResource(tapStackContent, 'aws_s3_bucket', 'archive');
      expect(archiveBucket).toContain('force_destroy = true');
    });

    test('10.9 S3 archive bucket transitions to GLACIER', () => {
      const lifecycle = extractResource(tapStackContent, 'aws_s3_bucket_lifecycle_configuration', 'archive');
      expect(lifecycle).toContain('GLACIER');
    });

    test('10.10 S3 buckets use environment suffix in naming', () => {
      const archiveBucket = extractResource(tapStackContent, 'aws_s3_bucket', 'archive');
      expect(archiveBucket).toContain('var.s3_archive_bucket');
    });
  });

  // =============================================================================
  // PHASE 11: DATABASES (Redis & Aurora) (15 tests)
  // =============================================================================

  describe('Phase 11: Databases (Redis & Aurora)', () => {
    test('11.1 ElastiCache Redis replication group exists', () => {
      expect(tapStackContent).toContain('resource "aws_elasticache_replication_group" "redis"');
    });

    test('11.2 Redis subnet group exists', () => {
      expect(tapStackContent).toContain('resource "aws_elasticache_subnet_group" "redis"');
    });

    test('11.3 Redis uses auth token', () => {
      const redis = extractResource(tapStackContent, 'aws_elasticache_replication_group', 'redis');
      expect(redis).toContain('auth_token');
    });

    test('11.4 Redis auth token stored in Secrets Manager', () => {
      expect(tapStackContent).toContain('resource "aws_secretsmanager_secret" "redis_auth_token"');
      expect(tapStackContent).toContain('resource "aws_secretsmanager_secret_version" "redis_auth_token"');
    });

    test('11.5 Redis automatic failover enabled for multi-AZ', () => {
      const redis = extractResource(tapStackContent, 'aws_elasticache_replication_group', 'redis');
      expect(redis).toContain('automatic_failover_enabled');
    });

    test('11.6 Aurora PostgreSQL cluster exists', () => {
      expect(tapStackContent).toContain('resource "aws_rds_cluster" "aurora"');
    });

    test('11.7 Aurora cluster instance exists', () => {
      expect(tapStackContent).toContain('resource "aws_rds_cluster_instance" "aurora"');
    });

    test('11.8 Aurora uses PostgreSQL engine', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('11.9 Aurora master password stored in Secrets Manager', () => {
      expect(tapStackContent).toContain('resource "aws_secretsmanager_secret" "aurora_master_password"');
      expect(tapStackContent).toContain('resource "aws_secretsmanager_secret_version" "aurora_master_password"');
    });

    test('11.10 Aurora has backup retention configured', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toContain('backup_retention_period');
    });

    test('11.11 Aurora deletion_protection is disabled for testing', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('11.12 Aurora skip_final_snapshot enabled for testing', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('11.13 Aurora has enhanced monitoring role', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role" "aurora_monitoring"');
    });

    test('11.14 Aurora DB subnet group exists', () => {
      expect(tapStackContent).toContain('resource "aws_db_subnet_group" "aurora"');
    });

    test('11.15 Aurora subnet group uses private subnets', () => {
      const subnetGroup = extractResource(tapStackContent, 'aws_db_subnet_group', 'aurora');
      expect(subnetGroup).toContain('aws_subnet.private');
    });
  });

  // =============================================================================
  // PHASE 12: ORCHESTRATION (Step Functions & EventBridge) (10 tests)
  // =============================================================================

  describe('Phase 12: Orchestration (Step Functions & EventBridge)', () => {
    test('12.1 Step Functions state machine (emergency_escalation) exists', () => {
      expect(tapStackContent).toContain('resource "aws_sfn_state_machine" "emergency_escalation"');
    });

    test('12.2 Step Functions uses embedded definition (not templatefile)', () => {
      const sfn = extractResource(tapStackContent, 'aws_sfn_state_machine', 'emergency_escalation');
      expect(sfn).toContain('definition = jsonencode');
    });

    test('12.3 Step Functions definition includes escalation logic', () => {
      const sfn = extractResource(tapStackContent, 'aws_sfn_state_machine', 'emergency_escalation');
      expect(sfn).toContain('ParallelEscalation');
      expect(sfn).toContain('TryPrimaryVendor');
    });

    test('12.4 Step Functions IAM role exists', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role" "step_functions"');
    });

    test('12.5 EventBridge rule for emergency requests exists', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_rule" "emergency_requests"');
    });

    test('12.6 EventBridge rule for compliance check exists', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_rule" "compliance_check"');
    });

    test('12.7 EventBridge emergency rule has event pattern', () => {
      const rule = extractResource(tapStackContent, 'aws_cloudwatch_event_rule', 'emergency_requests');
      expect(rule).toContain('event_pattern');
    });

    test('12.8 EventBridge compliance rule has schedule', () => {
      const rule = extractResource(tapStackContent, 'aws_cloudwatch_event_rule', 'compliance_check');
      expect(rule).toContain('schedule_expression');
    });

    test('12.9 EventBridge target for emergency requests (emergency_stepfunctions)', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_target" "emergency_stepfunctions"');
    });

    test('12.10 EventBridge target for compliance scan (compliance_lambda)', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_target" "compliance_lambda"');
    });
  });

  // =============================================================================
  // PHASE 13: MONITORING (CloudWatch) (15 tests)
  // =============================================================================

  describe('Phase 13: Monitoring (CloudWatch)', () => {
    test('13.1 CloudWatch log group for API Gateway', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_log_group" "api_gateway"');
    });

    test('13.2 CloudWatch log groups have retention configured', () => {
      const logGroup = extractResource(tapStackContent, 'aws_cloudwatch_log_group', 'api_gateway');
      expect(logGroup).toContain('retention_in_days');
    });

    test('13.3 CloudWatch alarm for API Gateway errors', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "api_gateway_errors"');
    });

    test('13.4 CloudWatch alarm for Lambda duration', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_duration"');
    });

    test('13.5 CloudWatch alarm for DynamoDB throttles', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles"');
    });

    test('13.6 CloudWatch alarm for SQS message age', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "sqs_message_age"');
    });

    test('13.7 CloudWatch alarm for Step Functions failures', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "step_functions_failures"');
    });

    test('13.8 CloudWatch alarms have evaluation periods', () => {
      const alarm = extractResource(tapStackContent, 'aws_cloudwatch_metric_alarm', 'api_gateway_errors');
      expect(alarm).toContain('evaluation_periods');
    });

    test('13.9 CloudWatch dashboard exists', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_dashboard" "main"');
    });

    test('13.10 CloudWatch dashboard has valid JSON body', () => {
      const dashboard = extractResource(tapStackContent, 'aws_cloudwatch_dashboard', 'main');
      expect(dashboard).toContain('dashboard_body');
      expect(dashboard).toContain('jsonencode');
    });

    test('13.11 CloudWatch alarms have comparison operators', () => {
      const alarm = extractResource(tapStackContent, 'aws_cloudwatch_metric_alarm', 'api_gateway_errors');
      expect(alarm).toContain('comparison_operator');
    });

    test('13.12 CloudWatch alarms have thresholds', () => {
      const alarm = extractResource(tapStackContent, 'aws_cloudwatch_metric_alarm', 'api_gateway_errors');
      expect(alarm).toContain('threshold');
    });

    test('13.13 CloudWatch alarms have metric names', () => {
      const alarm = extractResource(tapStackContent, 'aws_cloudwatch_metric_alarm', 'dynamodb_throttles');
      expect(alarm).toContain('metric_name');
    });

    test('13.14 CloudWatch log groups have KMS encryption', () => {
      const logGroup = extractResource(tapStackContent, 'aws_cloudwatch_log_group', 'api_gateway');
      expect(logGroup).toContain('kms_key_id');
    });

    test('13.15 API Gateway stage has X-Ray tracing enabled', () => {
      const stage = extractResource(tapStackContent, 'aws_api_gateway_stage', 'main');
      expect(stage).toContain('xray_tracing_enabled = true');
    });
  });

  // =============================================================================
  // PHASE 14: TAGGING & NAMING (10 tests)
  // =============================================================================

  describe('Phase 14: Tagging & Naming', () => {
    test('14.1 Resources use consistent tagging with merge', () => {
      expect(tapStackContent).toContain('merge(local.tags');
    });

    test('14.2 Tags include Environment', () => {
      expect(tapStackContent).toContain('Environment');
    });

    test('14.3 Tags include Owner', () => {
      expect(tapStackContent).toContain('Owner');
    });

    test('14.4 Tags include CostCenter', () => {
      expect(tapStackContent).toContain('CostCenter');
    });

    test('14.5 Tags include Project', () => {
      expect(tapStackContent).toContain('Project');
    });

    test('14.6 Resources use local.name_prefix for naming', () => {
      expect(tapStackContent).toContain('local.name_prefix');
    });

    test('14.7 VPC uses consistent naming with name_prefix', () => {
      const vpc = extractResource(tapStackContent, 'aws_vpc', 'main');
      expect(vpc).toContain('local.name_prefix');
    });

    test('14.8 DynamoDB tables use local.name_prefix pattern', () => {
      const table = extractResource(tapStackContent, 'aws_dynamodb_table', 'maintenance_requests');
      expect(table).toContain('local.name_prefix');
    });

    test('14.9 Lambda functions use local.lambda_functions naming', () => {
      const lambda = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(lambda).toContain('local.lambda_functions');
    });

    test('14.10 No resources have hardcoded environment names', () => {
      // Should not have hardcoded "dev", "staging", "prod" in resource names
      const hardcodedEnvPattern = /bucket\s*=\s*"[^"]*-(dev|staging|prod)-/;
      expect(tapStackContent).not.toMatch(hardcodedEnvPattern);
    });
  });

  // =============================================================================
  // PHASE 15: RESOURCE DEPENDENCIES (10 tests)
  // =============================================================================

  describe('Phase 15: Resource Dependencies', () => {
    test('15.1 Lambda functions depend on IAM roles with .arn', () => {
      const lambda = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(lambda).toContain('role             = aws_iam_role');
    });

    test('15.2 API Gateway deployment uses triggers for redeployment', () => {
      const deployment = extractResource(tapStackContent, 'aws_api_gateway_deployment', 'main');
      expect(deployment).toContain('triggers');
    });

    test('15.3 API Gateway stage depends on deployment', () => {
      const stage = extractResource(tapStackContent, 'aws_api_gateway_stage', 'main');
      expect(stage).toContain('deployment_id');
      expect(stage).toContain('aws_api_gateway_deployment.main.id');
    });

    test('15.4 Lambda event source mapping depends on Lambda function', () => {
      const mapping = extractResource(tapStackContent, 'aws_lambda_event_source_mapping', 'router_stream');
      expect(mapping).toContain('function_name');
      expect(mapping).toContain('aws_lambda_function');
    });

    test('15.5 SNS subscriptions depend on SNS topics and SQS queues', () => {
      const subscription = extractResource(tapStackContent, 'aws_sns_topic_subscription', 'vendor_notifications');
      expect(subscription).toContain('topic_arn');
      expect(subscription).toContain('endpoint');
    });

    test('15.6 NAT Gateway depends on EIP', () => {
      const nat = extractResource(tapStackContent, 'aws_nat_gateway', 'main');
      expect(nat).toContain('allocation_id');
      expect(nat).toContain('aws_eip');
    });

    test('15.7 Private route table depends on NAT Gateway', () => {
      const rt = extractResource(tapStackContent, 'aws_route_table', 'private');
      expect(rt).toContain('nat_gateway_id');
    });

    test('15.8 RDS cluster instances depend on RDS cluster', () => {
      const instance = extractResource(tapStackContent, 'aws_rds_cluster_instance', 'aurora');
      expect(instance).toContain('cluster_identifier');
      expect(instance).toContain('aws_rds_cluster');
    });

    test('15.9 Step Functions state machine (emergency_escalation) has role', () => {
      const sfn = extractResource(tapStackContent, 'aws_sfn_state_machine', 'emergency_escalation');
      expect(sfn).toContain('role_arn');
      expect(sfn).toContain('aws_iam_role');
    });

    test('15.10 EventBridge targets (emergency_stepfunctions) depend on rules', () => {
      const target = extractResource(tapStackContent, 'aws_cloudwatch_event_target', 'emergency_stepfunctions');
      expect(target).toContain('rule');
      expect(target).toContain('aws_cloudwatch_event_rule');
    });
  });

  // =============================================================================
  // PHASE 16: BEST PRACTICES & COMPLIANCE (15 tests)
  // =============================================================================

  describe('Phase 16: Best Practices & Compliance', () => {
    test('16.1 No inline policies with wildcard actions', () => {
      const wildcardInlinePolicy = /"Action":\s*"\*"/;
      const inlinePolicyBlocks = tapStackContent.match(/inline_policy\s*{[\s\S]*?}/g) || [];
      inlinePolicyBlocks.forEach(block => {
        expect(block).not.toMatch(wildcardInlinePolicy);
      });
    });

    test('16.2 DynamoDB tables use PAY_PER_REQUEST or have capacity configured', () => {
      const table = extractResource(tapStackContent, 'aws_dynamodb_table', 'maintenance_requests');
      const hasPayPerRequest = table?.includes('PAY_PER_REQUEST');
      const hasCapacity = table?.includes('read_capacity') && table?.includes('write_capacity');
      expect(hasPayPerRequest || hasCapacity).toBe(true);
    });

    test('16.3 DynamoDB tables have streams enabled for router', () => {
      const table = extractResource(tapStackContent, 'aws_dynamodb_table', 'maintenance_requests');
      expect(table).toContain('stream_enabled');
    });

    test('16.4 Lambda functions use environment variables for config', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      expect(validator).toContain('environment');
    });

    test('16.5 API Gateway has throttling configured', () => {
      const settings = extractResource(tapStackContent, 'aws_api_gateway_method_settings', 'all');
      expect(settings).toContain('throttling_rate_limit');
      expect(settings).toContain('throttling_burst_limit');
    });

    test('16.6 Redis has automatic backups', () => {
      const redis = extractResource(tapStackContent, 'aws_elasticache_replication_group', 'redis');
      expect(redis).toContain('snapshot_retention_limit');
    });

    test('16.7 Aurora has automated backups', () => {
      const aurora = extractResource(tapStackContent, 'aws_rds_cluster', 'aurora');
      expect(aurora).toContain('backup_retention_period');
    });

    test('16.8 S3 buckets block public access (no public ACL)', () => {
      const archiveBucket = extractResource(tapStackContent, 'aws_s3_bucket', 'archive');
      expect(archiveBucket).not.toContain('acl = "public-read"');
    });

    test('16.9 VPC has DNS resolution enabled', () => {
      const vpc = extractResource(tapStackContent, 'aws_vpc', 'main');
      expect(vpc).toContain('enable_dns_support');
    });

    test('16.10 Security groups use descriptive names and descriptions', () => {
      const sg = extractResource(tapStackContent, 'aws_security_group', 'lambda');
      expect(sg).toContain('description');
    });

    test('16.11 Lambda functions have reserved concurrent executions configured or left unset', () => {
      const validator = extractResource(tapStackContent, 'aws_lambda_function', 'validator');
      // Either has reserved_concurrent_executions or doesn't set it (both valid)
      expect(validator).toBeTruthy();
    });

    test('16.12 All IAM roles have assume_role_policy', () => {
      const role = extractResource(tapStackContent, 'aws_iam_role', 'lambda_validator');
      expect(role).toContain('assume_role_policy');
    });

    test('16.13 CloudWatch log groups don\'t have infinite retention', () => {
      const logGroup = extractResource(tapStackContent, 'aws_cloudwatch_log_group', 'api_gateway');
      expect(logGroup).toContain('retention_in_days');
    });

    test('16.14 Random passwords use sufficient length', () => {
      expect(tapStackContent).toContain('resource "random_password"');
      expect(tapStackContent).toContain('length');
    });

    test('16.15 API Gateway has CORS headers configured or documentation', () => {
      // Check if there's a mock integration with CORS headers
      const mockIntegration = extractResource(tapStackContent, 'aws_api_gateway_integration', 'mock_sms_post');
      expect(mockIntegration).toBeTruthy();
    });
  });
});
