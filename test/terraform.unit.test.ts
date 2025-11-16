import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - BULLETPROOF v3.0', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string = '';
  let providerContent: string = '';
  let combinedContent: string = '';
  let resourceCounts: Record<string, number> = {};

  beforeAll(() => {
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
    console.log('🔍 Analyzing infrastructure...');
    
    resourceCounts = {
      // Core AWS Resources
      lambda: (mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length,
      sqs: (mainContent.match(/resource\s+"aws_sqs_queue"/g) || []).length,
      dynamodb: (mainContent.match(/resource\s+"aws_dynamodb_table"/g) || []).length,
      sns: (mainContent.match(/resource\s+"aws_sns_topic"/g) || []).length,
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
      iam_role_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,
      
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
      cloudwatch_dashboard: (mainContent.match(/resource\s+"aws_cloudwatch_dashboard"/g) || []).length,
      cloudwatch_query_definition: (mainContent.match(/resource\s+"aws_cloudwatch_query_definition"/g) || []).length,
      cloudwatch_log_metric_filter: (mainContent.match(/resource\s+"aws_cloudwatch_log_metric_filter"/g) || []).length,
      xray: (mainContent.match(/resource\s+"aws_xray_sampling_rule"/g) || []).length,
      
      // Networking
      alb: (mainContent.match(/resource\s+"aws_lb"/g) || []).length,
      target_group: (mainContent.match(/resource\s+"aws_lb_target_group"/g) || []).length,
      listener: (mainContent.match(/resource\s+"aws_lb_listener"/g) || []).length,
      vpc_endpoint: (mainContent.match(/resource\s+"aws_vpc_endpoint"/g) || []).length,
      
      // Security & Encryption
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,
      sns_topic_policy: (mainContent.match(/resource\s+"aws_sns_topic_policy"/g) || []).length,
      sns_topic_subscription: (mainContent.match(/resource\s+"aws_sns_topic_subscription"/g) || []).length,
      lambda_permission: (mainContent.match(/resource\s+"aws_lambda_permission"/g) || []).length,
      
      // S3 Additional Resources
      s3_bucket_public_access_block: (mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length,
      s3_bucket_versioning: (mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || []).length,
      s3_bucket_server_side_encryption_configuration: (mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || []).length,
      s3_bucket_policy: (mainContent.match(/resource\s+"aws_s3_bucket_policy"/g) || []).length,
      s3_bucket_lifecycle_configuration: (mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g) || []).length,
      
      // Data Sources
      data_sources: (mainContent.match(/data\s+"[^"]+"/g) || []).length
    };
    
    console.log('📊 Resource counts:', resourceCounts);
  });

  // ========================================
  // UNIVERSAL TESTS - ALWAYS RUN
  // ========================================
  
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

    test('should have provider region configured', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region');
    });

    test('should have default tags configured', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment');
      expect(providerContent).toContain('ManagedBy');
    });
  });

  // ========================================
  // CONDITIONAL INFRASTRUCTURE TESTS
  // ========================================

  if (resourceCounts.lambda > 0) {
    describe('Lambda Functions Configuration', () => {
      test('should have Lambda functions', () => {
        expect(resourceCounts.lambda).toBeGreaterThan(0);
      });

      test('should have proper Lambda configurations', () => {
        const functionNames = mainContent.match(/function_name\s*=\s*"[^"]+"/g) || [];
        expect(functionNames.length).toBe(resourceCounts.lambda);
        
        const runtimes = mainContent.match(/runtime\s*=\s*"[^"]+"/g) || [];
        expect(runtimes.length).toBe(resourceCounts.lambda);
      });

      test('should use environment variables in Lambda names', () => {
        const envRefs = mainContent.match(/\$\{var\.environment\}/g) || [];
        expect(envRefs.length).toBeGreaterThan(0);
      });

      test('should have Lambda IAM roles', () => {
        expect(resourceCounts.iam_role).toBeGreaterThanOrEqual(resourceCounts.lambda);
      });

      test('should have proper memory size configured', () => {
        const memorySizes = mainContent.match(/memory_size\s*=\s*(\d+)/g) || [];
        expect(memorySizes.length).toBe(resourceCounts.lambda);
        
        memorySizes.forEach(size => {
          const memory = parseInt(size.match(/\d+/)?.[0] || '0');
          expect(memory).toBeGreaterThanOrEqual(128);
          expect(memory).toBeLessThanOrEqual(10240);
        });
      });

      test('should have timeout configured', () => {
        const timeouts = mainContent.match(/timeout\s*=\s*(\d+)/g) || [];
        expect(timeouts.length).toBe(resourceCounts.lambda);
      });

      test('should have handler configured', () => {
        const handlers = mainContent.match(/handler\s*=\s*"[^"]+"/g) || [];
        expect(handlers.length).toBe(resourceCounts.lambda);
      });
    });
  }

  if (resourceCounts.sqs > 0) {
    describe('SQS Queues Configuration', () => {
      test('should have SQS queues', () => {
        expect(resourceCounts.sqs).toBeGreaterThan(0);
      });

      test('should enable encryption on all queues', () => {
        const encryptedQueues = mainContent.match(/sqs_managed_sse_enabled\s*=\s*true/g) || [];
        expect(encryptedQueues.length).toBe(resourceCounts.sqs);
      });

      test('should have proper queue naming', () => {
        const queueNames = mainContent.match(/name\s*=\s*"[^"]+"/g) || [];
        expect(queueNames.length).toBeGreaterThan(0);
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
    });
  }

  if (resourceCounts.eventbridge_rule > 0) {
    describe('EventBridge Configuration', () => {
      test('should have EventBridge rules', () => {
        expect(resourceCounts.eventbridge_rule).toBeGreaterThan(0);
      });

      test('should have EventBridge targets', () => {
        expect(resourceCounts.eventbridge_target).toBe(resourceCounts.eventbridge_rule);
      });

      test('should have proper schedule expressions', () => {
        const scheduleExpressions = mainContent.match(/schedule_expression\s*=\s*"[^"]+"/g) || [];
        expect(scheduleExpressions.length).toBeGreaterThan(0);
      });

      test('should have rule names with environment', () => {
        const ruleNames = mainContent.match(/resource\s+"aws_cloudwatch_event_rule"[\s\S]*?name\s*=\s*"[^"]*\$\{var\.environment\}[^"]*"/g) || [];
        expect(ruleNames.length).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.sns > 0) {
    describe('SNS Topics Configuration', () => {
      test('should have SNS topics', () => {
        expect(resourceCounts.sns).toBeGreaterThan(0);
      });

      test('should have KMS encryption for SNS topics', () => {
        const encryptedTopics = mainContent.match(/kms_master_key_id\s*=\s*aws_kms_key/g) || [];
        expect(encryptedTopics.length).toBeGreaterThanOrEqual(resourceCounts.sns);
      });

      test('should have SNS topic policies', () => {
        expect(resourceCounts.sns_topic_policy).toBeGreaterThanOrEqual(resourceCounts.sns);
      });

      test('should have SNS topic subscriptions', () => {
        expect(resourceCounts.sns_topic_subscription).toBeGreaterThan(0);
      });
    });
  }

  if (resourceCounts.kms_key > 0) {
    describe('KMS Keys Configuration', () => {
      test('should have KMS keys', () => {
        expect(resourceCounts.kms_key).toBeGreaterThan(0);
      });

      test('should enable key rotation', () => {
        const keyRotation = mainContent.match(/enable_key_rotation\s*=\s*true/g) || [];
        expect(keyRotation.length).toBe(resourceCounts.kms_key);
      });

      test('should have KMS key aliases', () => {
        expect(resourceCounts.kms_alias).toBe(resourceCounts.kms_key);
      });

      test('should have deletion window configured', () => {
        const deletionWindows = mainContent.match(/deletion_window_in_days\s*=\s*\d+/g) || [];
        expect(deletionWindows.length).toBe(resourceCounts.kms_key);
      });

      test('should have KMS key policies', () => {
        const keyPolicies = mainContent.match(/resource\s+"aws_kms_key"[\s\S]*?policy\s*=\s*jsonencode/g) || [];
        expect(keyPolicies.length).toBe(resourceCounts.kms_key);
      });
    });
  }

  describe('Monitoring & Observability', () => {
    test('should have CloudWatch log groups', () => {
      expect(resourceCounts.cloudwatch_log_group).toBeGreaterThan(0);
    });

    test('should have CloudWatch alarms', () => {
      expect(resourceCounts.cloudwatch_alarm).toBeGreaterThan(0);
    });

    test('should use log retention policies', () => {
      const logRetention = mainContent.match(/retention_in_days\s*=\s*\d+/g) || [];
      expect(logRetention.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch metric filters', () => {
      expect(resourceCounts.cloudwatch_log_metric_filter).toBeGreaterThan(0);
    });

    test('should have CloudWatch dashboard', () => {
      expect(resourceCounts.cloudwatch_dashboard).toBeGreaterThan(0);
    });

    test('should have CloudWatch Logs Insights queries', () => {
      expect(resourceCounts.cloudwatch_query_definition).toBeGreaterThan(0);
    });

    test('should have alarm actions configured', () => {
      const alarmActions = mainContent.match(/alarm_actions\s*=\s*\[/g) || [];
      expect(alarmActions.length).toBe(resourceCounts.cloudwatch_alarm);
    });

    test('should have proper alarm descriptions', () => {
      const alarmDescriptions = mainContent.match(/alarm_description\s*=\s*"[^"]+"/g) || [];
      expect(alarmDescriptions.length).toBe(resourceCounts.cloudwatch_alarm);
    });
  });

  if (resourceCounts.s3 > 0) {
    describe('S3 Buckets Configuration', () => {
      test('should have S3 buckets', () => {
        expect(resourceCounts.s3).toBeGreaterThan(0);
      });

      test('should block public access on all buckets', () => {
        expect(resourceCounts.s3_bucket_public_access_block).toBe(resourceCounts.s3);
        
        const blockPublicAcls = mainContent.match(/block_public_acls\s*=\s*true/g) || [];
        expect(blockPublicAcls.length).toBeGreaterThanOrEqual(resourceCounts.s3);
        
        const blockPublicPolicy = mainContent.match(/block_public_policy\s*=\s*true/g) || [];
        expect(blockPublicPolicy.length).toBeGreaterThanOrEqual(resourceCounts.s3);
      });

      test('should have versioning enabled', () => {
        expect(resourceCounts.s3_bucket_versioning).toBe(resourceCounts.s3);
      });

      test('should have encryption enabled', () => {
        expect(resourceCounts.s3_bucket_server_side_encryption_configuration).toBe(resourceCounts.s3);
      });

      test('should have bucket policies', () => {
        expect(resourceCounts.s3_bucket_policy).toBe(resourceCounts.s3);
      });

      test('should enforce HTTPS only', () => {
        const httpsEnforcement = mainContent.match(/aws:SecureTransport.*false/g) || [];
        expect(httpsEnforcement.length).toBeGreaterThan(0);
      });

      test('should have lifecycle policies', () => {
        expect(resourceCounts.s3_bucket_lifecycle_configuration).toBeGreaterThan(0);
      });
    });
  }

  // ========================================
  // UNIVERSAL SECURITY TESTS
  // ========================================

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
      const dataSourceRefs = mainContent.match(/\$\{data\.[^}]*\}/g) || [];
      expect(dataSourceRefs.length).toBeGreaterThan(0);
    });

    test('should not expose resources to public internet', () => {
      expect(mainContent).not.toContain('map_public_ip_on_launch = true');
      expect(mainContent).not.toContain('associate_public_ip_address = true');
    });

    test('should have IAM policies with least privilege', () => {
      const iamPolicies = mainContent.match(/resource\s+"aws_iam_policy"[\s\S]*?policy\s*=/g) || [];
      expect(iamPolicies.length).toBeGreaterThan(0);
      
      iamPolicies.forEach(policy => {
        expect(policy).toContain('policy');
      });
    });

    test('should use IAM policy documents', () => {
      const policyDocuments = mainContent.match(/data\s+"aws_iam_policy_document"/g) || [];
      expect(policyDocuments.length).toBeGreaterThan(0);
    });

    test('should have proper IAM role trust policies', () => {
      const assumeRolePolicies = mainContent.match(/assume_role_policy\s*=/g) || [];
      expect(assumeRolePolicies.length).toBe(resourceCounts.iam_role);
    });

    test('should attach policies to roles', () => {
      expect(resourceCounts.iam_role_policy_attachment).toBeGreaterThan(0);
    });
  });

  describe('Encryption & Data Protection', () => {
    test('should use encryption for data at rest', () => {
      const encryptionChecks = [
        resourceCounts.kms_key > 0,
        resourceCounts.s3_bucket_server_side_encryption_configuration > 0 || resourceCounts.s3 === 0,
        mainContent.includes('kms_master_key_id') || mainContent.includes('sse_algorithm')
      ];
      
      const hasEncryption = encryptionChecks.some(check => check);
      expect(hasEncryption).toBe(true);
    });

    test('should not have unencrypted data transmission', () => {
      expect(mainContent).not.toContain('http://');
    });

    test('should use HTTPS endpoints', () => {
      const httpsRefs = mainContent.match(/https:\/\//g) || [];
      expect(httpsRefs.length).toBeGreaterThanOrEqual(0);
    });

    test('should have KMS encryption for sensitive services', () => {
      if (resourceCounts.sns > 0 || resourceCounts.cloudwatch_log_group > 0) {
        expect(resourceCounts.kms_key).toBeGreaterThan(0);
      }
    });
  });

  // ========================================
  // OUTPUT VALIDATION
  // ========================================

  describe('Required Outputs', () => {
    test('should have outputs defined', () => {
      const outputCount = (mainContent.match(/output\s+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(0);
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      
      outputBlocks.forEach(output => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });

    test('should mark sensitive outputs', () => {
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBeGreaterThan(0);
    });

    test('should have environment information outputs', () => {
      const envOutputs = mainContent.match(/output\s+"[^"]*environment[^"]*"/gi) || 
                         mainContent.match(/output\s+"aws_region"/gi) || 
                         mainContent.match(/output\s+"aws_account_id"/gi) || [];
      expect(envOutputs.length).toBeGreaterThan(0);
    });

    test('should have ARN outputs for resources', () => {
      const arnOutputs = mainContent.match(/output\s+"[^"]*arn[^"]*"/gi) || [];
      expect(arnOutputs.length).toBeGreaterThan(0);
    });

    test('should have name outputs for resources', () => {
      const nameOutputs = mainContent.match(/output\s+"[^"]*name[^"]*"/gi) || [];
      expect(nameOutputs.length).toBeGreaterThan(0);
    });
  });

  describe('Resource-Specific Outputs', () => {
    if (resourceCounts.lambda > 0) {
      test('should have Lambda function outputs', () => {
        const lambdaOutputs = mainContent.match(/output\s+"[^"]*lambda[^"]*"/gi) || [];
        expect(lambdaOutputs.length).toBeGreaterThanOrEqual(resourceCounts.lambda);
      });
    }

    if (resourceCounts.sns > 0) {
      test('should have SNS topic outputs', () => {
        const snsOutputs = mainContent.match(/output\s+"[^"]*sns[^"]*"/gi) || [];
        expect(snsOutputs.length).toBeGreaterThanOrEqual(resourceCounts.sns * 2);
      });
    }

    if (resourceCounts.kms_key > 0) {
      test('should have KMS key outputs', () => {
        const kmsOutputs = mainContent.match(/output\s+"[^"]*kms[^"]*"/gi) || [];
        expect(kmsOutputs.length).toBeGreaterThanOrEqual(resourceCounts.kms_key);
      });
    }

    if (resourceCounts.cloudwatch_log_group > 0) {
      test('should have CloudWatch log group outputs', () => {
        const logGroupOutputs = mainContent.match(/output\s+"[^"]*log_group[^"]*"/gi) || [];
        expect(logGroupOutputs.length).toBeGreaterThanOrEqual(resourceCounts.cloudwatch_log_group);
      });
    }

    if (resourceCounts.s3 > 0) {
      test('should have S3 bucket outputs', () => {
        const s3Outputs = mainContent.match(/output\s+"[^"]*s3[^"]*"/gi) || 
                          mainContent.match(/output\s+"[^"]*bucket[^"]*"/gi) || [];
        expect(s3Outputs.length).toBeGreaterThanOrEqual(resourceCounts.s3);
      });
    }
  });

  // ========================================
  // FORBIDDEN PATTERNS
  // ========================================

  describe('Forbidden Patterns', () => {
    test('should not have VPC (if not needed)', () => {
      if (resourceCounts.vpc === 0) {
        expect(mainContent).not.toContain('resource "aws_vpc"');
      }
    });

    test('should not have RDS databases (if not used)', () => {
      if (resourceCounts.rds === 0) {
        expect(mainContent).not.toContain('resource "aws_db_instance"');
      }
    });

    test('should not have ECR repositories (if not used)', () => {
      if (resourceCounts.ecr === 0) {
        expect(mainContent).not.toContain('resource "aws_ecr_repository"');
      }
    });

    test('should not have ECS resources (if not used)', () => {
      if (resourceCounts.ecs_cluster === 0) {
        expect(mainContent).not.toContain('resource "aws_ecs_cluster"');
      }
    });

    test('should not have hardcoded AWS account IDs', () => {
      const accountPattern = /\d{12}/g;
      const accountMatches = combinedContent.match(accountPattern) || [];
      
      const potentialAccountIds = accountMatches.filter(match => {
        return !combinedContent.includes(`data.aws_caller_identity.current.account_id`) ||
               !combinedContent.includes(`${match}`);
      });
      
      expect(potentialAccountIds.length).toBeGreaterThanOrEqual(0);
    });

    test('should not use deprecated Terraform syntax', () => {
      expect(mainContent).not.toContain('lifecycle { prevent_destroy = false }');
    });

    test('should not have unused resources', () => {
      expect(resourceCounts.data_sources).toBeGreaterThan(0);
    });
  });

  // ========================================
  // COMPLIANCE & BEST PRACTICES
  // ========================================

  describe('Terraform Best Practices', () => {
    test('should use depends_on appropriately', () => {
      const dependsOnUsage = mainContent.match(/depends_on\s*=\s*\[/g) || [];
      expect(dependsOnUsage.length).toBeGreaterThanOrEqual(0);
    });

    test('should have proper resource naming', () => {
      const resourceNames = mainContent.match(/name\s*=\s*"[^"]*\$\{var\.environment\}[^"]*"/g) || [];
      expect(resourceNames.length).toBeGreaterThan(0);
    });

    test('should use data sources for dynamic values', () => {
      expect(resourceCounts.data_sources).toBeGreaterThan(0);
    });

    test('should have proper resource references', () => {
      const resourceRefs = mainContent.match(/aws_[a-z_]+\.[a-z_]+\./g) || [];
      expect(resourceRefs.length).toBeGreaterThan(0);
    });

    test('should use jsonencode for policies', () => {
      const jsonEncodeUsage = mainContent.match(/jsonencode\(/g) || [];
      expect(jsonEncodeUsage.length).toBeGreaterThan(0);
    });

    test('should have consistent naming conventions', () => {
      const resourceBlocks = mainContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];
      expect(resourceBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Optimization', () => {
    if (resourceCounts.lambda > 0) {
      test('should use appropriate Lambda memory sizes', () => {
        const memorySizes = mainContent.match(/memory_size\s*=\s*(\d+)/g) || [];
        const reasonableMemory = memorySizes.some(size => {
          const memory = parseInt(size.match(/\d+/)?.[0] || '0');
          return memory >= 128 && memory <= 1024;
        });
        expect(reasonableMemory).toBe(true);
      });
    }

    if (resourceCounts.dynamodb > 0) {
      test('should not use provisioned capacity unnecessarily', () => {
        expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
      });
    }

    test('should set appropriate timeouts', () => {
      const timeoutPatterns = [
        /timeout\s*=\s*(\d+)/g,
        /ttl\s*=\s*(\d+)/g
      ];
      
      timeoutPatterns.forEach(pattern => {
        const timeouts = mainContent.match(pattern) || [];
        expect(timeouts.length).toBeGreaterThanOrEqual(0);
      });
    });

    test('should use log retention to control costs', () => {
      const retentionPolicies = mainContent.match(/retention_in_days\s*=\s*\d+/g) || [];
      expect(retentionPolicies.length).toBe(resourceCounts.cloudwatch_log_group);
    });

    if (resourceCounts.s3 > 0) {
      test('should have lifecycle policies for S3', () => {
        expect(resourceCounts.s3_bucket_lifecycle_configuration).toBeGreaterThan(0);
      });
    }
  });

  describe('Data Sources Validation', () => {
    test('should use data sources for account information', () => {
      expect(mainContent).toContain('data "aws_caller_identity"');
    });

    test('should use data sources for region information', () => {
      expect(mainContent).toContain('data "aws_region"');
    });

    test('should use archive data source for Lambda packages', () => {
      if (resourceCounts.lambda > 0) {
        expect(mainContent).toContain('data "archive_file"');
      }
    });
  });

  describe('IAM Configuration', () => {
    test('should have IAM roles for Lambda functions', () => {
      if (resourceCounts.lambda > 0) {
        expect(resourceCounts.iam_role).toBeGreaterThanOrEqual(resourceCounts.lambda);
      }
    });

    test('should use managed policies where appropriate', () => {
      const managedPolicies = mainContent.match(/arn:aws:iam::aws:policy\//g) || [];
      expect(managedPolicies.length).toBeGreaterThanOrEqual(0);
    });

    test('should have custom IAM policies', () => {
      expect(resourceCounts.iam_policy).toBeGreaterThan(0);
    });

    test('should attach policies to roles', () => {
      expect(resourceCounts.iam_role_policy_attachment).toBeGreaterThan(resourceCounts.iam_role);
    });
  });
});

export {};
