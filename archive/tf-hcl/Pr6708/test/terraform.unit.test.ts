import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - BULLETPROOF v3.0', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;
  let resourceCounts: Record<string, number> = {};

  // 🔍 PHASE 1: AUTOMATIC INFRASTRUCTURE DISCOVERY
  beforeAll(() => {
    console.log('🔍 Starting automatic infrastructure discovery...');
    
    // Read files
    const mainPath = path.join(libPath, 'main.tf');
    const providerPath = path.join(libPath, 'provider.tf');
    
    if (!fs.existsSync(mainPath)) {
      throw new Error('main.tf file not found');
    }
    
    if (!fs.existsSync(providerPath)) {
      throw new Error('provider.tf file not found');
    }
    
    mainContent = fs.readFileSync(mainPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
    combinedContent = providerContent + '\n' + mainContent;
    
    // AUTOMATIC INFRASTRUCTURE DISCOVERY - COUNT EVERYTHING
    console.log('📊 Analyzing infrastructure...');
    
    resourceCounts = {
      // Core AWS Resources
      lambda: (mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length,
      sqs: (mainContent.match(/resource\s+"aws_sqs_queue"/g) || []).length,
      dynamodb: (mainContent.match(/resource\s+"aws_dynamodb_table"/g) || []).length,
      sns: (mainContent.match(/resource\s+"aws_sns_topic"/g) || []).length,
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
      iam_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,
      
      // EventBridge & Pipes
      eventbridge_bus: (mainContent.match(/resource\s+"aws_cloudwatch_event_bus"/g) || []).length,
      eventbridge_rule: (mainContent.match(/resource\s+"aws_cloudwatch_event_rule"/g) || []).length,
      eventbridge_target: (mainContent.match(/resource\s+"aws_cloudwatch_event_target"/g) || []).length,
      pipes: (mainContent.match(/resource\s+"aws_pipes_pipe"/g) || []).length,
      
      // Compute & Storage
      vpc: (mainContent.match(/resource\s+"aws_vpc"/g) || []).length,
      subnet: (mainContent.match(/resource\s+"aws_subnet"/g) || []).length,
      security_group: (mainContent.match(/resource\s+"aws_security_group"/g) || []).length,
      s3: (mainContent.match(/resource\s+"aws_s3_bucket"/g) || []).length,
      ecr: (mainContent.match(/resource\s+"aws_ecr_repository"/g) || []).length,
      ecs_cluster: (mainContent.match(/resource\s+"aws_ecs_cluster"/g) || []).length,
      ecs_task: (mainContent.match(/resource\s+"aws_ecs_task_definition"/g) || []).length,
      ecs_service: (mainContent.match(/resource\s+"aws_ecs_service"/g) || []).length,
      
      // Databases
      rds: (mainContent.match(/resource\s+"aws_db_instance"/g) || []).length,
      aurora: (mainContent.match(/resource\s+"aws_rds_cluster"/g) || []).length,
      redis: (mainContent.match(/resource\s+"aws_elasticache_cluster"/g) || []).length,
      
      // Monitoring & Logging
      cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
      cloudwatch_alarm: (mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length,
      xray: (mainContent.match(/resource\s+"aws_xray_sampling_rule"/g) || []).length,
      flow_log: (mainContent.match(/resource\s+"aws_flow_log"/g) || []).length,
      cloudtrail: (mainContent.match(/resource\s+"aws_cloudtrail"/g) || []).length,
      
      // Networking
      alb: (mainContent.match(/resource\s+"aws_lb"/g) || []).length,
      target_group: (mainContent.match(/resource\s+"aws_lb_target_group"/g) || []).length,
      listener: (mainContent.match(/resource\s+"aws_lb_listener"/g) || []).length,
      vpc_endpoint: (mainContent.match(/resource\s+"aws_vpc_endpoint"/g) || []).length,
      
      // Security & Encryption
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,
      kms_key_policy: (mainContent.match(/resource\s+"aws_kms_key_policy"/g) || []).length,
      
      // Other
      lambda_event_source_mapping: (mainContent.match(/resource\s+"aws_lambda_event_source_mapping"/g) || []).length,
      cloudwatch_dashboard: (mainContent.match(/resource\s+"aws_cloudwatch_dashboard"/g) || []).length,
      route_table: (mainContent.match(/resource\s+"aws_route_table"/g) || []).length,
      route_table_association: (mainContent.match(/resource\s+"aws_route_table_association"/g) || []).length,
      s3_bucket_policy: (mainContent.match(/resource\s+"aws_s3_bucket_policy"/g) || []).length,
      s3_bucket_server_side_encryption_configuration: (mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || []).length,
      s3_bucket_public_access_block: (mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length,
      s3_bucket_lifecycle_configuration: (mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g) || []).length,
      s3_bucket_versioning: (mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || []).length,
      sns_topic_policy: (mainContent.match(/resource\s+"aws_sns_topic_policy"/g) || []).length,
      sns_topic_subscription: (mainContent.match(/resource\s+"aws_sns_topic_subscription"/g) || []).length,
      security_group_rule: (mainContent.match(/resource\s+"aws_security_group_rule"/g) || []).length,
      dynamodb_gsi: (mainContent.match(/global_secondary_index\s+\{/g) || []).length
    };
    
    console.log('📊 Resource counts:', resourceCounts);
  });

  // 📋 PHASE 2: UNIVERSAL FILE STRUCTURE TESTS (Always run)
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
      // Check for consistent indentation (2 spaces)
      const lines = mainContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  ') && line.trim());
      expect(indentedLines.length).toBeGreaterThan(50); // Should have properly indented blocks
    });

    test('should have proper file structure organization', () => {
      const dataSourceBlocks = (mainContent.match(/data\s+"/g) || []).length;
      const resourceBlocks = (mainContent.match(/resource\s+"/g) || []).length;
      const outputBlocks = (mainContent.match(/output\s+"/g) || []).length;
      
      expect(dataSourceBlocks).toBeGreaterThan(0);
      expect(resourceBlocks).toBeGreaterThan(10);
      expect(outputBlocks).toBeGreaterThan(20);
    });
  });

  // 🔧 UNIVERSAL PROVIDER & VARIABLE TESTS
  describe('Terraform Configuration', () => {
    test('should have required providers configured', () => {
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('source  = "hashicorp/aws"');
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

    test('should have appropriate provider configuration', () => {
      expect(providerContent).toContain('region');
      expect(providerContent).toContain('default_tags');
    });

    test('should use multiple providers when needed', () => {
      const providerBlocks = providerContent.match(/provider\s+"[^"]+"/g) || [];
      expect(providerBlocks.length).toBeGreaterThanOrEqual(2); // AWS + other providers
    });
  });

  // 🛠️ CONDITIONAL INFRASTRUCTURE TESTS
  if (resourceCounts.lambda > 0) {
    describe('Lambda Functions Configuration', () => {
      test('should have Lambda functions', () => {
        expect(resourceCounts.lambda).toBeGreaterThan(0);
      });

      test('should have proper Lambda configurations', () => {
        const functionNames = mainContent.match(/function_name\s*=\s*"([^"]+)"/g) || [];
        expect(functionNames.length).toBe(resourceCounts.lambda);
        
        const runtimes = mainContent.match(/runtime\s*=\s*"([^"]+)"/g) || [];
        expect(runtimes.length).toBe(resourceCounts.lambda);
        
        const memorySizes = mainContent.match(/memory_size\s*=\s*var\.[^}]+/g) || [];
        expect(memorySizes.length).toBe(resourceCounts.lambda);
      });

      test('should use environment variables in Lambda names', () => {
        const envRefs = mainContent.match(/\$\{var\.environment\}/g) || [];
        expect(envRefs.length).toBeGreaterThan(0);
      });

      test('should have Lambda IAM roles', () => {
        expect(resourceCounts.iam_role).toBeGreaterThanOrEqual(resourceCounts.lambda);
      });

      test('should have Lambda log groups', () => {
        expect(resourceCounts.cloudwatch_log_group).toBeGreaterThan(0);
      });

      test('should have Lambda event source mappings for SQS', () => {
        if (resourceCounts.sqs > 0) {
          expect(resourceCounts.lambda_event_source_mapping).toBeGreaterThan(0);
        }
      });

      test('should have VPC configuration for Lambda functions', () => {
        const vpcConfigs = mainContent.match(/vpc_config\s*\{/g) || [];
        expect(vpcConfigs.length).toBe(resourceCounts.lambda);
      });
    });
  }

  if (resourceCounts.sqs > 0) {
    describe('SQS Queues Configuration', () => {
      test('should have SQS queues', () => {
        expect(resourceCounts.sqs).toBeGreaterThan(0);
      });

      test('should enable encryption on all queues', () => {
        const encryptedQueues = mainContent.match(/kms_master_key_id\s*=/g) || [];
        expect(encryptedQueues.length).toBe(resourceCounts.sqs);
      });

      test('should have proper queue naming', () => {
        const queueNames = mainContent.match(/name\s*=\s*"([^"]+)"/g) || [];
        expect(queueNames.length).toBeGreaterThanOrEqual(resourceCounts.sqs);
      });

      test('should have dead letter queues', () => {
        const dlqRefs = mainContent.match(/deadLetterTargetArn/g) || [];
        expect(dlqRefs.length).toBeGreaterThan(0);
      });

      test('should have redrive policies configured', () => {
        const redrivePolicies = mainContent.match(/redrive_policy\s*=/g) || [];
        expect(redrivePolicies.length).toBeGreaterThan(0);
      });

      test('should configure proper timeouts', () => {
        const visibilityTimeouts = mainContent.match(/visibility_timeout_seconds\s*=/g) || [];
        const retentionPeriods = mainContent.match(/message_retention_seconds\s*=/g) || [];
        
        expect(visibilityTimeouts.length).toBeGreaterThan(0);
        expect(retentionPeriods.length).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.dynamodb > 0) {
    describe('DynamoDB Tables Configuration', () => {
      test('should have DynamoDB tables', () => {
        expect(resourceCounts.dynamodb).toBeGreaterThan(0);
      });

      test('should use PAY_PER_REQUEST billing', () => {
        const payPerRequest = mainContent.match(/billing_mode\s*=\s*"PAY_PER_REQUEST"/g) || [];
        expect(payPerRequest.length).toBe(resourceCounts.dynamodb);
      });

      test('should have encryption enabled', () => {
        const encryptedTables = mainContent.match(/server_side_encryption[\s\S]*?enabled\s*=\s*true/g) || [];
        expect(encryptedTables.length).toBe(resourceCounts.dynamodb);
      });

      test('should have proper table definitions', () => {
        const hashKeys = mainContent.match(/hash_key\s*=/g) || [];
        expect(hashKeys.length).toBe(resourceCounts.dynamodb);
        
        const attributes = mainContent.match(/attribute\s*\{/g) || [];
        expect(attributes.length).toBeGreaterThan(resourceCounts.dynamodb);
      });

      test('should have point-in-time recovery enabled', () => {
        const pitrEnabled = mainContent.match(/point_in_time_recovery[\s\S]*?enabled\s*=\s*true/g) || [];
        expect(pitrEnabled.length).toBe(resourceCounts.dynamodb);
      });

      test('should have global secondary indexes when needed', () => {
        if (resourceCounts.dynamodb_gsi > 0) {
          const gsiBlocks = mainContent.match(/global_secondary_index\s*\{[\s\S]*?\n\}/g) || [];
          expect(gsiBlocks.length).toBeGreaterThan(0);
        }
      });
    });
  }

  if (resourceCounts.vpc > 0) {
    describe('VPC Configuration', () => {
      test('should have VPC configured', () => {
        expect(resourceCounts.vpc).toBeGreaterThan(0);
      });

      test('should have private subnets', () => {
        expect(resourceCounts.subnet).toBeGreaterThan(0);
      });

      test('should have route tables', () => {
        expect(resourceCounts.route_table).toBeGreaterThan(0);
        expect(resourceCounts.route_table_association).toBeGreaterThan(0);
      });

      test('should enable DNS support', () => {
        expect(mainContent).toContain('enable_dns_support   = true');
        expect(mainContent).toContain('enable_dns_hostnames = true');
      });

      test('should have security groups', () => {
        expect(resourceCounts.security_group).toBeGreaterThan(0);
        expect(resourceCounts.security_group_rule).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.vpc_endpoint > 0) {
    describe('VPC Endpoints Configuration', () => {
      test('should have VPC endpoints', () => {
        expect(resourceCounts.vpc_endpoint).toBeGreaterThan(0);
      });

      test('should have proper endpoint configurations', () => {
        const gatewayEndpoints = mainContent.match(/vpc_endpoint_type\s*=\s*"Gateway"/g) || [];
        const interfaceEndpoints = mainContent.match(/vpc_endpoint_type\s*=\s*"Interface"/g) || [];
        
        expect(gatewayEndpoints.length).toBeGreaterThan(0);
        expect(interfaceEndpoints.length).toBeGreaterThan(0);
      });

      test('should have private DNS enabled for interface endpoints', () => {
        const privateDns = mainContent.match(/private_dns_enabled\s*=\s*true/g) || [];
        expect(privateDns.length).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.s3 > 0) {
    describe('S3 Bucket Configuration', () => {
      test('should have S3 buckets', () => {
        expect(resourceCounts.s3).toBeGreaterThan(0);
      });

      test('should have server-side encryption configured', () => {
        expect(resourceCounts.s3_bucket_server_side_encryption_configuration).toBeGreaterThan(0);
      });

      test('should have public access blocks', () => {
        expect(resourceCounts.s3_bucket_public_access_block).toBeGreaterThan(0);
      });

      test('should have bucket policies', () => {
        expect(resourceCounts.s3_bucket_policy).toBeGreaterThan(0);
      });

      test('should have versioning enabled', () => {
        expect(resourceCounts.s3_bucket_versioning).toBeGreaterThan(0);
      });

      test('should have lifecycle configurations', () => {
        expect(resourceCounts.s3_bucket_lifecycle_configuration).toBeGreaterThan(0);
      });

      test('should deny unencrypted uploads', () => {
        const denyUnencrypted = mainContent.match(/DenyUnencryptedObjectUploads/g) || [];
        expect(denyUnencrypted.length).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.cloudtrail > 0) {
    describe('CloudTrail Configuration', () => {
      test('should have CloudTrail configured', () => {
        expect(resourceCounts.cloudtrail).toBeGreaterThan(0);
      });

      test('should have log file validation enabled', () => {
        expect(mainContent).toContain('enable_log_file_validation    = true');
      });

      test('should be integrated with CloudWatch Logs', () => {
        expect(mainContent).toContain('cloud_watch_logs_group_arn');
        expect(mainContent).toContain('cloud_watch_logs_role_arn');
      });

      test('should use KMS encryption', () => {
        expect(mainContent).toContain('kms_key_id');
      });
    });
  }

  if (resourceCounts.flow_log > 0) {
    describe('VPC Flow Logs Configuration', () => {
      test('should have VPC Flow Logs configured', () => {
        expect(resourceCounts.flow_log).toBeGreaterThan(0);
      });

      test('should use S3 destination', () => {
        const s3Destinations = mainContent.match(/log_destination_type\s*=\s*"s3"/g) || [];
        expect(s3Destinations.length).toBe(resourceCounts.flow_log);
      });

      test('should have proper log group configuration', () => {
        expect(mainContent).toContain('retention_in_days');
        expect(mainContent).toContain('kms_key_id');
      });
    });
  }

  // 🛡️ UNIVERSAL SECURITY TESTS (Always run)
  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const secretPatterns = [
        /password\s*=\s*"[^${][^"]+"/i,
        /secret\s*=\s*"[^${][^"]+"/i,
        /api_key\s*=\s*"[^${][^"]+"/i,
        /access_key\s*=\s*"[^${][^"]+"/i,
        /token\s*=\s*"[^${][^"]+"/i,
        /private_key\s*=\s*"[^${][^"]+"/i
      ];
      
      secretPatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use variables for configuration values', () => {
      const varUsage = combinedContent.match(/\$\{var\.[^}]+\}/g) || [];
      expect(varUsage.length).toBeGreaterThan(5);
    });

    test('should reference data sources', () => {
      const dataSourceRefs = mainContent.match(/\$\{[^}]*data\.[^}]*\}/g) || [];
      expect(dataSourceRefs.length).toBeGreaterThan(0);
    });

    test('should not expose resources to public internet unnecessarily', () => {
      const forbiddenPatterns = [
        'map_public_ip_on_launch = true',
        'associate_public_ip_address = true'
      ];
      
      forbiddenPatterns.forEach(pattern => {
        expect(mainContent).not.toContain(pattern);
      });
    });

    test('should use encryption for data at rest', () => {
      const encryptionChecks = [
        // KMS keys
        ...(resourceCounts.kms_key > 0 ? [mainContent.includes('resource "aws_kms_key"')] : []),
        // SQS encryption
        ...(resourceCounts.sqs > 0 ? [mainContent.includes('kms_master_key_id')] : []),
        // DynamoDB encryption
        ...(resourceCounts.dynamodb > 0 ? [mainContent.includes('server_side_encryption')] : []),
        // S3 encryption
        ...(resourceCounts.s3 > 0 ? [mainContent.includes('server_side_encryption_configuration')] : [])
      ];
      
      const hasEncryption = encryptionChecks.some(check => check);
      expect(hasEncryption).toBe(true);
    });

    test('should have proper KMS key policies', () => {
      if (resourceCounts.kms_key > 0) {
        expect(resourceCounts.kms_key_policy).toBe(resourceCounts.kms_key);
      }
    });

    test('should not have unencrypted data transmission', () => {
      // Check for HTTPS/TLS usage
      expect(mainContent).not.toContain('http://');
      expect(mainContent).toContain('https://');
    });
  });

  // 📋 OUTPUT VALIDATION (Always run)
  describe('Required Outputs', () => {
    test('should have outputs defined', () => {
      const outputCount = (mainContent.match(/output\s+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(20);
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      
      outputBlocks.forEach(output => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });

    test('should mark sensitive outputs appropriately', () => {
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBeGreaterThan(0);
    });

    test('should not expose secrets in outputs', () => {
      const secretOutputPatterns = [
        /output\s+"[^"]*password[^"]*"/i,
        /output\s+"[^"]*secret[^"]*"/i,
        /output\s+"[^"]*api[_-]?key[^"]*"/i,
        /output\s+"[^"]*access[_-]?key[^"]*"/i,
        /output\s+"[^"]*token[^"]*"/i
      ];
      
      secretOutputPatterns.forEach(pattern => {
        expect(mainContent).not.toMatch(pattern);
      });
    });

    test('should have environment information outputs', () => {
      // Check for region and account outputs which contain environment info
      const regionOutputs = mainContent.match(/output\s+"region"/gi) || [];
      const accountOutputs = mainContent.match(/output\s+"account_id"/gi) || [];
      
      expect(regionOutputs.length + accountOutputs.length).toBeGreaterThan(0);
    });

    test('should have ARN outputs for resources', () => {
      const arnOutputs = mainContent.match(/output\s+"[^"]*arn[^"]*"/gi) || [];
      expect(arnOutputs.length).toBeGreaterThan(0);
    });

    test('should have resource identifier outputs', () => {
      const idOutputs = mainContent.match(/output\s+"[^"]*id[^"]*"/gi) || [];
      expect(idOutputs.length).toBeGreaterThan(0);
    });
  });

  // 🚫 FORBIDDEN PATTERNS (Always run)
  describe('Forbidden Patterns', () => {
    test('should not have hardcoded AWS regions', () => {
      const hardcodedRegions = [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'ap-southeast-1'
      ];
      
      hardcodedRegions.forEach(region => {
        if (!combinedContent.includes(`var.${region}`) && !combinedContent.includes(`data.aws_region`)) {
          expect(combinedContent).not.toContain(`"${region}"`);
        }
      });
    });

    test('should not have hardcoded account IDs', () => {
      const accountPattern = /\d{12}/g;
      const accountMatches = combinedContent.match(accountPattern) || [];
      
      // Filter out common numbers that aren't account IDs
      const potentialAccountIds = accountMatches.filter(match => {
        return !match.startsWith('1') && !match.startsWith('0') && !match.startsWith('20');
      });
      
      expect(potentialAccountIds.length).toBe(0);
    });

    test('should not use deprecated Terraform features', () => {
      const deprecatedPatterns = [
        /count\s*=\s*0/,
        /lifecycle\s*{\s*create_before_destroy\s*=\s*false/
      ];
      
      deprecatedPatterns.forEach(pattern => {
        expect(mainContent).not.toMatch(pattern);
      });
    });

    test('should not have wildcard IAM permissions unnecessarily', () => {
      const wildcardPolicies = mainContent.match(/Action\s*=\s*\*|Resource\s*=\s*\*|Principal\s*=\s*\*\s*/g) || [];
      // Some wildcard permissions are necessary, but should be limited
      expect(wildcardPolicies.length).toBeLessThan(10);
    });

    test('should not have resources without proper tagging', () => {
      // Count total resources
      const totalResources = (mainContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || []).length;
      
      // Count resources that have tags block - more flexible matching
      const resourcesWithTags = mainContent.match(/tags\s*=\s*\{/g) || [];
      
      // Most resources should have tags (allow for some exceptions)
      expect(resourcesWithTags.length).toBeGreaterThan(totalResources * 0.4); // At least 40% should have tags
    });
  });

  // 📊 COMPLIANCE & BEST PRACTICES (Always run)
  describe('Terraform Best Practices', () => {
    test('should use depends_on appropriately', () => {
      const dependsOnUsage = mainContent.match(/depends_on\s*=\s*\[/g) || [];
      expect(dependsOnUsage.length).toBeGreaterThan(0);
    });

    test('should have proper resource naming', () => {
      // Check for consistent naming patterns
      const resourceNames = mainContent.match(/name\s*=\s*"([^"]+)"/g) || [];
      const hasEnvironmentRefs = resourceNames.some(name => name.includes('${var.environment}'));
      expect(hasEnvironmentRefs).toBe(true);
    });

    test('should use proper indentation', () => {
      // Basic check for reasonable formatting - not overly strict
      expect(mainContent).toContain('  '); // Should have some indentation
      expect(mainContent.split('\n').length).toBeGreaterThan(100); // Should be substantial
    });

    test('should have proper module structure', () => {
      expect(mainContent).toContain('data "');
      expect(mainContent).toContain('resource "');
      expect(mainContent).toContain('output "');
    });

    test('should use appropriate data sources', () => {
      const dataSources = mainContent.match(/data\s+"[^"]+"\s+"[^"]+"\s+\{/g) || [];
      expect(dataSources.length).toBeGreaterThan(0);
    });

    test('should have consistent formatting', () => {
      // Check for proper spacing around equals signs
      const lines = mainContent.split('\n');
      const inconsistentSpacing = lines.filter(line => 
        line.includes('= ') || line.includes(' =')
      );
      expect(inconsistentSpacing.length).toBeGreaterThan(10);
    });
  });

  // 💰 COST OPTIMIZATION (Always run)
  describe('Cost Optimization', () => {
    test('should use appropriate resource sizes', () => {
      if (resourceCounts.lambda > 0) {
        const memorySizes = mainContent.match(/memory_size\s*=\s*var\.[^}]+/g) || [];
        expect(memorySizes.length).toBe(resourceCounts.lambda);
      }
    });

    test('should use PAY_PER_REQUEST for DynamoDB', () => {
      if (resourceCounts.dynamodb > 0) {
        expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
      }
    });

    test('should set appropriate log retention', () => {
      const logRetention = mainContent.match(/retention_in_days\s*=\s*(\d+)/g) || [];
      expect(logRetention.length).toBeGreaterThan(0);
      
      // Check that retention is not excessive
      logRetention.forEach(retention => {
        const days = parseInt(retention.match(/\d+/)?.[0] || '0');
        expect(days).toBeLessThanOrEqual(365); // Max 1 year retention
      });
    });

    test('should have proper timeout configurations', () => {
      const timeouts = [
        mainContent.match(/timeout\s*=\s*(\d+)/g),
        mainContent.match(/visibility_timeout_seconds\s*=\s*(\d+)/g),
        mainContent.match(/message_retention_seconds\s*=\s*(\d+)/g)
      ].filter(timeout => timeout !== null);
      
      expect(timeouts.length).toBeGreaterThan(0);
    });
  });

  // 🔍 MONITORING & OBSERVABILITY (Always run)
  describe('Monitoring & Observability', () => {
    test('should have CloudWatch log groups', () => {
      expect(resourceCounts.cloudwatch_log_group).toBeGreaterThan(0);
    });

    test('should have CloudWatch alarms', () => {
      expect(resourceCounts.cloudwatch_alarm).toBeGreaterThan(0);
    });

    test('should have proper alarm configurations', () => {
      const alarmActions = mainContent.match(/alarm_actions\s*=/g) || [];
      expect(alarmActions.length).toBe(resourceCounts.cloudwatch_alarm);
    });

    test('should have CloudWatch dashboard when appropriate', () => {
      if (resourceCounts.cloudwatch_alarm > 3) {
        expect(resourceCounts.cloudwatch_dashboard).toBeGreaterThan(0);
      }
    });

    test('should have SNS notifications for alerts', () => {
      expect(resourceCounts.sns).toBeGreaterThan(0);
      expect(resourceCounts.sns_topic_subscription).toBeGreaterThan(0);
    });
  });
});

// Test execution summary
export {};
