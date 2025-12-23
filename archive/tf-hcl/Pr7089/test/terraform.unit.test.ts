import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - BULLETPROOF v3.0', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;
  let resourceCounts: Record<string, number>;

  beforeAll(() => {
    console.log('🔍 Starting Terraform Infrastructure Analysis...');

    // Read files
    const mainPath = path.join(libPath, 'main.tf');
    const providerPath = path.join(libPath, 'provider.tf');

    if (fs.existsSync(mainPath)) {
      mainContent = fs.readFileSync(mainPath, 'utf8');
    } else {
      throw new Error('main.tf file not found');
    }

    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, 'utf8');
    } else {
      throw new Error('provider.tf file not found');
    }

    combinedContent = providerContent + '\n' + mainContent;

    // AUTOMATIC INFRASTRUCTURE DISCOVERY - COUNT EVERYTHING
    console.log('📊 Analyzing infrastructure resources...');

    resourceCounts = {
      // Core AWS Resources
      lambda: (mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length,
      dynamodb: (mainContent.match(/resource\s+"aws_dynamodb_table"/g) || []).length,
      sns: (mainContent.match(/resource\s+"aws_sns_topic"\s/g) || []).length,
      sns_subscription: (mainContent.match(/resource\s+"aws_sns_topic_subscription"/g) || []).length,
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
      iam_role_policy: (mainContent.match(/resource\s+"aws_iam_role_policy"/g) || []).length,
      iam_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,

      // Networking
      vpc: (mainContent.match(/resource\s+"aws_vpc"/g) || []).length,
      subnet: (mainContent.match(/resource\s+"aws_subnet"/g) || []).length,

      // Storage
      s3: (mainContent.match(/resource\s+"aws_s3_bucket"\s/g) || []).length,
      s3_versioning: (mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || []).length,
      s3_encryption: (mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || []).length,
      s3_public_access_block: (mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length,
      s3_replication: (mainContent.match(/resource\s+"aws_s3_bucket_replication_configuration"/g) || []).length,

      // Monitoring & Logging
      cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
      cloudwatch_alarm: (mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length,

      // Security & Encryption
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,

      // API Gateway
      api_gateway: (mainContent.match(/resource\s+"aws_apigatewayv2_api"/g) || []).length,
      api_gateway_integration: (mainContent.match(/resource\s+"aws_apigatewayv2_integration"/g) || []).length,
      api_gateway_route: (mainContent.match(/resource\s+"aws_apigatewayv2_route"/g) || []).length,
      api_gateway_stage: (mainContent.match(/resource\s+"aws_apigatewayv2_stage"/g) || []).length,
      lambda_permission: (mainContent.match(/resource\s+"aws_lambda_permission"/g) || []).length,

      // Route53
      route53_zone: (mainContent.match(/resource\s+"aws_route53_zone"/g) || []).length,
      route53_health_check: (mainContent.match(/resource\s+"aws_route53_health_check"/g) || []).length,
      route53_record: (mainContent.match(/resource\s+"aws_route53_record"/g) || []).length,

      // SSM
      ssm_parameter: (mainContent.match(/resource\s+"aws_ssm_parameter"/g) || []).length,

      // Data Sources
      data_sources: (mainContent.match(/data\s+"[^"]+"\s+"[^"]+"/g) || []).length
    };

    console.log('✅ Resource Discovery Complete:', resourceCounts);
  });

  // ============================================================================
  // PHASE 1: UNIVERSAL TESTS (Always Run)
  // ============================================================================

  describe('File Structure & Basic Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have terraform version requirement', () => {
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]*"/);
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version');
    });

    test('should use terraform fmt formatting', () => {
      const lines = mainContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  ') && line.trim());
      expect(indentedLines.length).toBeGreaterThan(10);
    });
  });

  describe('Terraform Configuration', () => {
    test('should have required providers configured', () => {
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('source  = "hashicorp/aws"');
    });

    test('should have AWS provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
    });

    test('should have variables defined', () => {
      const variableCount = (providerContent.match(/variable\s+"/g) || []).length;
      expect(variableCount).toBeGreaterThan(0);
    });

    test('should have variable descriptions', () => {
      const variableBlocks = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      if (variableBlocks) {
        variableBlocks.forEach(variable => {
          expect(variable).toContain('description');
        });
      }
    });

    test('should have default values for variables', () => {
      const variablesWithDefaults = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?default\s*=/g);
      expect(variablesWithDefaults?.length).toBeGreaterThan(0);
    });

    test('should use environment variable in resource naming', () => {
      const envRefs = combinedContent.match(/\$\{var\.environment\}/g) || [];
      expect(envRefs.length).toBeGreaterThan(5);
    });
  });

  // ============================================================================
  // PHASE 2: MULTI-REGION INFRASTRUCTURE TESTS
  // ============================================================================

  describe('Multi-Region Configuration', () => {
    test('should have multi-region provider setup', () => {
      const providers = providerContent.match(/provider\s+"aws"/g) || [];
      expect(providers.length).toBeGreaterThanOrEqual(2);
    });

    test('should have secondary provider with alias', () => {
      expect(providerContent).toContain('alias  = "secondary"');
    });

    test('should have data sources for both regions', () => {
      expect(mainContent).toContain('data "aws_region" "current"');
      expect(mainContent).toContain('data "aws_region" "secondary"');
    });

    test('should have availability zones for both regions', () => {
      expect(mainContent).toContain('data "aws_availability_zones" "primary"');
      expect(mainContent).toContain('data "aws_availability_zones" "secondary"');
    });
  });

  // ============================================================================
  // PHASE 3: NETWORKING TESTS
  // ============================================================================

  describe('VPC Configuration', () => {
    test('should have VPCs in both regions', () => {
      expect(resourceCounts.vpc).toBe(2);
    });

    test('should have DNS support enabled', () => {
      const dnsSupport = mainContent.match(/enable_dns_support\s*=\s*true/g) || [];
      expect(dnsSupport.length).toBe(resourceCounts.vpc);
    });

    test('should have DNS hostnames enabled', () => {
      const dnsHostnames = mainContent.match(/enable_dns_hostnames\s*=\s*true/g) || [];
      expect(dnsHostnames.length).toBe(resourceCounts.vpc);
    });

    test('should have subnets in both regions', () => {
      expect(resourceCounts.subnet).toBeGreaterThan(0);
    });

    test('should have proper CIDR blocks', () => {
      expect(mainContent).toContain('cidr_block           = "10.0.0.0/16"');
      expect(mainContent).toContain('cidr_block           = "10.1.0.0/16"');
    });
  });

  // ============================================================================
  // PHASE 4: DATABASE & STORAGE TESTS  
  // ============================================================================

  describe('DynamoDB Configuration', () => {
    test('should have DynamoDB tables', () => {
      expect(resourceCounts.dynamodb).toBeGreaterThan(0);
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const payPerRequest = mainContent.match(/billing_mode\s*=\s*"PAY_PER_REQUEST"/g) || [];
      expect(payPerRequest.length).toBe(resourceCounts.dynamodb);
    });

    test('should have point-in-time recovery enabled', () => {
      const pitr = mainContent.match(/point_in_time_recovery[\s\S]*?enabled\s*=\s*true/g) || [];
      expect(pitr.length).toBe(resourceCounts.dynamodb);
    });

    test('should have DynamoDB streams enabled', () => {
      expect(mainContent).toContain('stream_enabled   = true');
      expect(mainContent).toContain('stream_view_type = "NEW_AND_OLD_IMAGES"');
    });

    test('should have global table replication configured', () => {
      expect(mainContent).toContain('replica {');
      expect(mainContent).toContain('region_name = "us-west-2"');
    });

    test('should have hash_key and range_key defined', () => {
      const hashKeys = mainContent.match(/hash_key\s*=\s*"[^"]+"/g) || [];
      expect(hashKeys.length).toBe(resourceCounts.dynamodb);
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('should have S3 buckets', () => {
      expect(resourceCounts.s3).toBe(2); // Primary and Secondary
    });

    test('should have versioning enabled on all buckets', () => {
      expect(resourceCounts.s3_versioning).toBe(resourceCounts.s3);
      const versioningEnabled = mainContent.match(/status\s*=\s*"Enabled"/g) || [];
      expect(versioningEnabled.length).toBeGreaterThanOrEqual(resourceCounts.s3);
    });

    test('should have encryption configured on all buckets', () => {
      expect(resourceCounts.s3_encryption).toBe(resourceCounts.s3);
      const aes256 = mainContent.match(/sse_algorithm\s*=\s*"AES256"/g) || [];
      expect(aes256.length).toBe(resourceCounts.s3);
    });

    test('should block public access on all buckets', () => {
      expect(resourceCounts.s3_public_access_block).toBe(resourceCounts.s3);
      const publicAccessBlocks = mainContent.match(/block_public_acls\s*=\s*true/g) || [];
      expect(publicAccessBlocks.length).toBe(resourceCounts.s3);
    });

    test('should have force_destroy enabled for dev environment', () => {
      const forceDestroy = mainContent.match(/force_destroy\s*=\s*true/g) || [];
      expect(forceDestroy.length).toBe(resourceCounts.s3);
    });

    test('should have cross-region replication configured', () => {
      expect(resourceCounts.s3_replication).toBe(1);
    });

    test('should have delete_marker_replication for replication (AWS Provider 5.x fix)', () => {
      const deleteMarkerReplication = mainContent.match(/delete_marker_replication\s*\{/g) || [];
      expect(deleteMarkerReplication.length).toBe(resourceCounts.s3_replication);
      expect(mainContent).toContain('delete_marker_replication {');
      expect(mainContent).toContain('status = "Enabled"');
    });

    test('should have S3 replication IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "s3_replication"');
      expect(mainContent).toContain('data "aws_iam_policy_document" "s3_replication"');
    });
  });

  // ============================================================================
  // PHASE 5: COMPUTE & LAMBDA TESTS
  // ============================================================================

  describe('Lambda Functions Configuration', () => {
    test('should have Lambda functions', () => {
      expect(resourceCounts.lambda).toBe(4); // 2 health monitor + 2 config sync
    });

    test('should have proper Lambda runtime', () => {
      const runtimes = mainContent.match(/runtime\s*=\s*"python3\.11"/g) || [];
      expect(runtimes.length).toBe(resourceCounts.lambda);
    });

    test('should have memory and timeout configurations', () => {
      const memoryConfigs = mainContent.match(/memory_size\s*=\s*256/g) || [];
      const timeoutConfigs = mainContent.match(/timeout\s*=\s*300/g) || [];
      expect(memoryConfigs.length).toBe(resourceCounts.lambda);
      expect(timeoutConfigs.length).toBe(resourceCounts.lambda);
    });

    test('should have CloudWatch log groups for Lambda', () => {
      expect(resourceCounts.cloudwatch_log_group).toBeGreaterThanOrEqual(resourceCounts.lambda);
    });

    test('should have Lambda execution IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_execution"');
      expect(mainContent).toContain('data "aws_iam_policy_document" "lambda_assume_role"');
    });

    test('should have depends_on for Lambda resources', () => {
      const lambdaDependencies = mainContent.match(/resource\s+"aws_lambda_function"[\s\S]*?depends_on\s*=/g) || [];
      expect(lambdaDependencies.length).toBe(resourceCounts.lambda);
    });

    test('should have environment variables in Lambda', () => {
      const envVars = mainContent.match(/environment\s*\{[\s\S]*?variables\s*=/g) || [];
      expect(envVars.length).toBe(resourceCounts.lambda);
    });

    test('should have Lambda archive data sources', () => {
      expect(mainContent).toContain('data "archive_file" "health_monitor"');
      expect(mainContent).toContain('data "archive_file" "config_sync"');
    });
  });

  // ============================================================================
  // PHASE 6: SECURITY & ENCRYPTION TESTS
  // ============================================================================

  describe('KMS Encryption', () => {
    test('should have KMS keys in both regions', () => {
      expect(resourceCounts.kms_key).toBe(2);
    });

    test('should have key rotation enabled', () => {
      const keyRotation = mainContent.match(/enable_key_rotation\s*=\s*true/g) || [];
      expect(keyRotation.length).toBe(resourceCounts.kms_key);
    });

    test('should have deletion window configured', () => {
      const deletionWindow = mainContent.match(/deletion_window_in_days\s*=\s*7/g) || [];
      expect(deletionWindow.length).toBe(resourceCounts.kms_key);
    });

    test('should have KMS aliases  for both regions', () => {
      expect(resourceCounts.kms_alias).toBe(resourceCounts.kms_key);
    });

    test('should have proper KMS key policies', () => {
      const keyPolicies = mainContent.match(/policy\s*=\s*jsonencode\(/g) || [];
      expect(keyPolicies.length).toBeGreaterThanOrEqual(resourceCounts.kms_key);
    });
  });

  describe('IAM Configuration', () => {
    test('should have IAM roles', () => {
      expect(resourceCounts.iam_role).toBeGreaterThan(0);
    });

    test('should have IAM policies', () => {
      expect(resourceCounts.iam_policy).toBeGreaterThan(0);
    });

    test('should have IAM policy attachments', () => {
      expect(resourceCounts.iam_policy_attachment).toBeGreaterThan(0);
    });

    test('should have IAM role policies', () => {
      expect(resourceCounts.iam_role_policy).toBeGreaterThan(0);
    });

    test('should have cross-region assume role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "cross_region_assume"');
    });

    test('should use least privilege IAM policies', () => {
      const wildcardActions = mainContent.match(/Action\s*=\s*"\*"/g) || [];
      expect(wildcardActions.length).toBe(0);
    });
  });

  // ============================================================================
  // PHASE 7: MONITORING & OBSERVABILITY TESTS
  // ============================================================================

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch log groups', () => {
      expect(resourceCounts.cloudwatch_log_group).toBeGreaterThan(0);
    });

    test('should have CloudWatch alarms', () => {
      expect(resourceCounts.cloudwatch_alarm).toBeGreaterThan(0);
    });

    test('should have log retention policies', () => {
      const logRetention = mainContent.match(/retention_in_days\s*=\s*1/g) || [];
      expect(logRetention.length).toBe(resourceCounts.cloudwatch_log_group);
    });

    test('should have alarm actions configured', () => {
      const alarmActions = mainContent.match(/alarm_actions\s*=\s*\[/g) || [];
      expect(alarmActions.length).toBe(resourceCounts.cloudwatch_alarm);
    });

    test('should monitor critical metrics', () => {
      expect(mainContent).toContain('metric_name         = "UserErrors"');
      expect(mainContent).toContain('metric_name         = "SystemErrors"');
      expect(mainContent).toContain('metric_name         = "Errors"');
      expect(mainContent).toContain('metric_name         = "Throttles"');
    });

    test('should have alarms in both regions', () => {
      const eastAlarms = mainContent.match(/alarm-dynamodb-user-errors-east/g) || [];
      const westAlarms = mainContent.match(/alarm-dynamodb-user-errors-west/g) || [];
      expect(eastAlarms.length).toBeGreaterThan(0);
      expect(westAlarms.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topics Configuration', () => {
    test('should have SNS topics in both regions', () => {
      expect(resourceCounts.sns).toBe(2);
    });

    test('should have SNS subscriptions', () => {
      expect(resourceCounts.sns_subscription).toBe(2);
    });

    test('should use KMS encryption for SNS topics', () => {
      const kmsEncryption = mainContent.match(/kms_master_key_id\s*=\s*aws_kms_key/g) || [];
      expect(kmsEncryption.length).toBe(resourceCounts.sns);
    });

    test('should have email endpoints configured', () => {
      const emailEndpoints = mainContent.match(/endpoint\s*=\s*"test@example\.com"/g) || [];
      expect(emailEndpoints.length).toBe(resourceCounts.sns_subscription);
    });
  });

  // ============================================================================
  // PHASE 8: API GATEWAY & ROUTE53 TESTS
  // ============================================================================

  describe('API Gateway Configuration', () => {
    test('should have API Gateway APIs in both regions', () => {
      expect(resourceCounts.api_gateway).toBe(2);
    });

    test('should have API Gateway integrations', () => {
      expect(resourceCounts.api_gateway_integration).toBe(2);
    });

    test('should have API Gateway routes', () => {
      expect(resourceCounts.api_gateway_route).toBe(2);
    });

    test('should have API Gateway stages', () => {
      expect(resourceCounts.api_gateway_stage).toBe(2);
    });

    test('should use HTTP protocol type', () => {
      const httpProtocol = mainContent.match(/protocol_type\s*=\s*"HTTP"/g) || [];
      expect(httpProtocol.length).toBe(resourceCounts.api_gateway);
    });

    test('should have auto-deploy enabled', () => {
      const autoDeploy = mainContent.match(/auto_deploy\s*=\s*true/g) || [];
      expect(autoDeploy.length).toBe(resourceCounts.api_gateway_stage);
    });

    test('should have Lambda permissions for API Gateway', () => {
      expect(resourceCounts.lambda_permission).toBe(2);
    });

    test('should have proper route configuration', () => {
      const healthRoutes = mainContent.match(/route_key\s*=\s*"GET \/health"/g) || [];
      expect(healthRoutes.length).toBe(2);
    });
  });

  describe('Route53 Configuration', () => {
    test('should have Route53 hosted zone', () => {
      expect(resourceCounts.route53_zone).toBe(1);
    });

    test('should have Route53 health checks', () => {
      expect(resourceCounts.route53_health_check).toBe(2);
    });

    test('should have Route53 records', () => {
      expect(resourceCounts.route53_record).toBe(2);
    });

    test('should not use AWS reserved domains (fix applied)', () => {
      expect(mainContent).not.toContain('name = "payment.example.com"');
      expect(mainContent).toContain('name = "drpayment.example.internal"');
    });

    test('should use split() for FQDN extraction in health checks (fix applied)', () => {
      const splitUsage = mainContent.match(/fqdn\s*=\s*split\(/g) || [];
      expect(splitUsage.length).toBe(resourceCounts.route53_health_check);
    });

    test('should have weighted routing policy', () => {
      const weightedPolicy = mainContent.match(/weighted_routing_policy\s*\{/g) || [];
      expect(weightedPolicy.length).toBe(resourceCounts.route53_record);
    });

    test('should have health check IDs in records', () => {
      const healthCheckIds = mainContent.match(/health_check_id\s*=\s*aws_route53_health_check/g) || [];
      expect(healthCheckIds.length).toBe(resourceCounts.route53_record);
    });
  });

  // ============================================================================
  // PHASE 9: SSM PARAMETERS TESTS
  // ============================================================================

  describe('SSM Parameters Configuration', () => {
    test('should have SSM parameters', () => {
      expect(resourceCounts.ssm_parameter).toBe(4); // 2 in each region
    });

    test('should use SecureString type', () => {
      const secureStrings = mainContent.match(/type\s*=\s*"SecureString"/g) || [];
      expect(secureStrings.length).toBe(resourceCounts.ssm_parameter);
    });

    test('should encrypt with KMS', () => {
      const kmsEncrypted = mainContent.match(/key_id\s*=\s*aws_kms_key/g) || [];
      expect(kmsEncrypted.length).toBeGreaterThanOrEqual(resourceCounts.ssm_parameter);
    });

    test('should have parameters in both regions', () => {
      const eastParams = mainContent.match(/ssm-db-connection-east/g) || [];
      const westParams = mainContent.match(/ssm-db-connection-west/g) || [];
      expect(eastParams.length).toBeGreaterThan(0);
      expect(westParams.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // PHASE 10: SECURITY BEST PRACTICES TESTS
  // ============================================================================

  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const secretPatterns = [
        /password\s*=\s*"[^$\{\}][^"]+"/i,
        /secret\s*=\s*"[^$\{\}][^"]+"/i,
        /api_key\s*=\s*"[^$\{\}][^"]+"/i
      ];

      secretPatterns.forEach(pattern => {
        const matches = combinedContent.match(pattern) || [];
        const realSecrets = matches.filter((m: string) => !m.includes('test-') && !m.includes('example'));
        expect(realSecrets.length).toBe(0);
      });
    });

    test('should use variables for configuration values', () => {
      const varUsage = combinedContent.match(/\$\{var\.[^}]+\}/g) || [];
      expect(varUsage.length).toBeGreaterThan(10);
    });

    test('should use data sources', () => {
      expect(resourceCounts.data_sources).toBeGreaterThan(0);
      expect(mainContent).toContain('data.aws_caller_identity');
    });

    test('should use encryption at rest', () => {
      expect(mainContent).toContain('server_side_encryption');
      expect(mainContent).toContain('kms_master_key_id');
    });

    test('should block S3 public access', () => {
      const blockPublicAcls = mainContent.match(/block_public_acls\s*=\s*true/g) || [];
      const blockPublicPolicy = mainContent.match(/block_public_policy\s*=\s*true/g) || [];
      expect(blockPublicAcls.length).toBe(resourceCounts.s3);
      expect(blockPublicPolicy.length).toBe(resourceCounts.s3);
    });

    test('should not expose resources to public internet', () => {
      expect(mainContent).not.toContain('map_public_ip_on_launch = true');
      expect(mainContent).not.toContain('associate_public_ip_address = true');
    });
  });

  // ============================================================================
  // PHASE 11: OUTPUT VALIDATION TESTS
  // ============================================================================

  describe('Required Outputs', () => {
    test('should have outputs defined', () => {
      const outputCount = (mainContent.match(/output\s+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(30);
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);

      outputBlocks.forEach((output: string) => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });

    test('should mark sensitive outputs', () => {
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBe(2);
    });

    test('should have VPC outputs', () => {
      expect(mainContent).toContain('output "vpc_id_primary"');
      expect(mainContent).toContain('output "vpc_id_secondary"');
    });

    test('should have DynamoDB outputs', () => {
      expect(mainContent).toContain('output "dynamodb_table_name"');
      expect(mainContent).toContain('output "dynamodb_table_arn"');
      expect(mainContent).toContain('output "dynamodb_stream_arn"');
    });

    test('should have S3 outputs', () => {
      expect(mainContent).toContain('output "s3_bucket_name_primary"');
      expect(mainContent).toContain('output "s3_bucket_arn_primary"');
    });

    test('should have Lambda outputs', () => {
      expect(mainContent).toContain('output "lambda_health_monitor_name_primary"');
      expect(mainContent).toContain('output "lambda_config_sync_arn_primary"');
    });

    test('should have API Gateway outputs', () => {
      expect(mainContent).toContain('output "api_gateway_endpoint_primary"');
      expect(mainContent).toContain('output "api_gateway_id_primary"');
    });

    test('should have Route53 outputs', () => {
      expect(mainContent).toContain('output "route53_zone_id"');
      expect(mainContent).toContain('output "route53_health_check_id_primary"');
    });

    test('should have KMS outputs', () => {
      expect(mainContent).toContain('output "kms_key_id_primary"');
      expect(mainContent).toContain('output "kms_key_arn_primary"');
    });

    test('should have SNS outputs', () => {
      expect(mainContent).toContain('output "sns_topic_arn_primary"');
      expect(mainContent).toContain('output "sns_topic_arn_secondary"');
    });
  });

  // ============================================================================
  // PHASE 12: TERRAFORM BEST PRACTICES TESTS
  // ============================================================================

  describe('Terraform Best Practices', () => {
    test('should use depends_on where necessary', () => {
      const dependsOnUsage = mainContent.match(/depends_on\s*=\s*\[/g) || [];
      expect(dependsOnUsage.length).toBeGreaterThan(0);
    });

    test('should have proper resource naming with environment', () => {
      const resourceTags = mainContent.match(/Name\s*=\s*"[^"]*\$\{var\.environment\}[^"]*"/g) || [];
      expect(resourceTags.length).toBeGreaterThan(20);
    });

    test('should use consistent tag naming', () => {
      const tags = mainContent.match(/tags\s*=\s*\{/g) || [];
      expect(tags.length).toBeGreaterThan(20);
    });

    test('should use provider aliases correctly', () => {
      const providerUsage = mainContent.match(/provider\s*=\s*aws\.secondary/g) || [];
      expect(providerUsage.length).toBeGreaterThan(10);
    });
  });

  // ============================================================================
  // PHASE 13: COMPLIANCE & TAGGING TESTS
  // ============================================================================

  describe('Compliance & Tagging', () => {
    test('should have default tags in provider', () => {
      expect(providerContent).toContain('default_tags');
    });

    test('should include Environment tag', () => {
      expect(providerContent).toContain('Environment');
    });

    test('should include ManagedBy tag', () => {
      expect(providerContent).toContain('ManagedBy');
      expect(providerContent).toContain('"terraform"');
    });

    test('should include Owner tag', () => {
      expect(providerContent).toContain('Owner');
    });

    test('should include DataClassification tag', () => {
      expect(providerContent).toContain('DataClassification = "sensitive"');
    });

    test('should have resource-specific tags', () => {
      const resourceTags = mainContent.match(/tags\s*=\s*\{[\s\S]*?Name\s*=/g) || [];
      expect(resourceTags.length).toBeGreaterThan(20);
    });
  });

  // ============================================================================
  // PHASE 14: COST OPTIMIZATION TESTS
  // ============================================================================

  describe('Cost Optimization', () => {
    test('should use appropriate Lambda memory sizes', () => {
      const memorySizes = mainContent.match(/memory_size\s*=\s*256/g) || [];
      expect(memorySizes.length).toBe(resourceCounts.lambda);
    });

    test('should use PAY_PER_REQUEST for DynamoDB', () => {
      expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
    });

    test('should use log retention to control costs', () => {
      const logRetention = mainContent.match(/retention_in_days\s*=\s*1/g) || [];
      expect(logRetention.length).toBe(resourceCounts.cloudwatch_log_group);
    });

    test('should use force_destroy for dev environments', () => {
      const forceDestroy = mainContent.match(/force_destroy\s*=\s*true/g) || [];
      expect(forceDestroy.length).toBe(resourceCounts.s3);
    });
  });

  // ============================================================================
  // PHASE 15: DISASTER RECOVERY TESTS
  // ============================================================================

  describe('Disaster Recovery Configuration', () => {
    test('should have resources in both regions', () => {
      const eastResources = mainContent.match(/-east-/g) || [];
      const westResources = mainContent.match(/-west-/g) || [];
      expect(eastResources.length).toBeGreaterThan(10);
      expect(westResources.length).toBeGreaterThan(10);
    });

    test('should have global table replication', () => {
      expect(mainContent).toContain('replica {');
    });

    test('should have S3 cross-region replication', () => {
      expect(resourceCounts.s3_replication).toBe(1);
    });

    test('should have high availability with multiple subnets', () => {
      // 2 private subnets per region = 2 total (count is per count.index)
      expect(resourceCounts.subnet).toBe(2);
    });
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================

  describe('Test Coverage Summary', () => {
    test('should have discovered all infrastructure resources', () => {
      const totalResources = Object.values(resourceCounts).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
      console.log(`\n📊 Total Resources Discovered: ${totalResources}`);
      console.log('📋 Resource Breakdown:');
      Object.entries(resourceCounts).forEach(([key, value]) => {
        if (value > 0) {
          console.log(`   - ${key}: ${value}`);
        }
      });
      expect(totalResources).toBeGreaterThan(50);
    });
  });
});

export { };

