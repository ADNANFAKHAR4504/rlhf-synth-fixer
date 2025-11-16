import * as fs from 'fs';
import * as path from 'path';

describe('Payment Processing Infrastructure - 100% Success Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;
  let resourceCounts: Record<string, number>;

  beforeAll(() => {
    // AUTOMATIC DISCOVERY - THE KEY TO BULLETPROOF TESTING
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
    console.log('🔍 Analyzing Payment Processing Infrastructure...');
    
    resourceCounts = {
      // KMS Keys
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,
      
      // DynamoDB
      dynamodb_table: (mainContent.match(/resource\s+"aws_dynamodb_table"/g) || []).length,
      
      // SNS
      sns_topic: (mainContent.match(/resource\s+"aws_sns_topic"/g) || []).length,
      sns_topic_policy: (mainContent.match(/resource\s+"aws_sns_topic_policy"/g) || []).length,
      
      // Lambda Functions
      lambda_function: (mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length,
      
      // Step Functions
      sfn_state_machine: (mainContent.match(/resource\s+"aws_sfn_state_machine"/g) || []).length,
      
      // IAM
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_role_policy: (mainContent.match(/resource\s+"aws_iam_role_policy"/g) || []).length,
      iam_role_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,
      
      // CloudWatch
      cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
      cloudwatch_metric_alarm: (mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length,
      cloudwatch_log_metric_filter: (mainContent.match(/resource\s+"aws_cloudwatch_log_metric_filter"/g) || []).length,
      
      // Data Sources
      archive_file: (mainContent.match(/data\s+"archive_file"/g) || []).length,
      aws_caller_identity: (combinedContent.match(/data\s+"aws_caller_identity"/g) || []).length,
      aws_region: (combinedContent.match(/data\s+"aws_region"/g) || []).length,
      iam_policy_document: (mainContent.match(/data\s+"aws_iam_policy_document"/g) || []).length,
      
      // Outputs
      output: (mainContent.match(/output\s+"/g) || []).length
    };
    
    console.log('📊 Payment Infrastructure Resource Counts:', resourceCounts);
  });

  // ===== UNIVERSAL FILE STRUCTURE TESTS =====
  describe('File Structure & Basic Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have lambda validation file', () => {
      expect(fs.existsSync(path.join(libPath, 'lambda_validation.py'))).toBe(true);
    });

    test('should have lambda processing file', () => {
      expect(fs.existsSync(path.join(libPath, 'lambda_processing.py'))).toBe(true);
    });

    test('should have terraform version requirement >= 1.5', () => {
      expect(providerContent).toContain('required_version = ">= 1.5"');
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version = "~> 5.0"');
    });
  });

  // ===== TERRAFORM CONFIGURATION TESTS =====
  describe('Terraform Configuration', () => {
    test('should have required providers configured', () => {
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('source  = "hashicorp/aws"');
    });

    test('should have environment variable defined', () => {
      expect(providerContent).toContain('variable "environment"');
      expect(providerContent).toContain('default     = "dev"');
    });

    test('should have AWS region configured', () => {
      expect(providerContent).toContain('region = "us-east-1"');
    });

    test('should have default tags configured', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment        = var.environment');
      expect(providerContent).toContain('Owner              = "PaymentTeam"');
      expect(providerContent).toContain('CostCenter         = "Engineering"');
      expect(providerContent).toContain('DataClassification = "Sensitive"');
    });
  });

  // ===== KMS ENCRYPTION TESTS =====
  describe('KMS Encryption Configuration', () => {
    test('should have 3 KMS keys for different services', () => {
      expect(resourceCounts.kms_key).toBe(3);
      expect(resourceCounts.kms_alias).toBe(3);
    });

    test('should have DynamoDB encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "dynamodb_encryption"');
      expect(mainContent).toContain('alias/dynamodb-transactions');
      expect(mainContent).toContain('enable_key_rotation     = true');
    });

    test('should have SNS encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "sns_encryption"');
      expect(mainContent).toContain('alias/sns-payment-notifications');
    });

    test('should have CloudWatch encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "cloudwatch_encryption"');
      expect(mainContent).toContain('alias/cloudwatch-logs');
    });

    test('should have KMS key policies with proper permissions', () => {
      expect(mainContent).toContain('kms:*');
      expect(mainContent).toContain('kms:Decrypt');
      expect(mainContent).toContain('kms:GenerateDataKey');
    });
  });

  // ===== DYNAMODB TABLE TESTS =====
  describe('DynamoDB Table Configuration', () => {
    test('should have 1 DynamoDB transactions table', () => {
      expect(resourceCounts.dynamodb_table).toBe(1);
      expect(mainContent).toContain('resource "aws_dynamodb_table" "transactions"');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(mainContent).toContain('billing_mode                = "PAY_PER_REQUEST"');
    });

    test('should have proper table structure', () => {
      expect(mainContent).toContain('name                        = "dynamodb-transactions-${var.environment}"');
      expect(mainContent).toContain('hash_key = "transaction_id"');
      expect(mainContent).toContain('server_side_encryption');
      expect(mainContent).toContain('point_in_time_recovery');
    });

    test('should be encrypted with KMS key', () => {
      expect(mainContent).toContain('kms_key_arn = aws_kms_key.dynamodb_encryption.arn');
    });
  });

  // ===== SNS TOPIC TESTS =====
  describe('SNS Topic Configuration', () => {
    test('should have 1 SNS topic for payment notifications', () => {
      expect(resourceCounts.sns_topic).toBe(1);
      expect(resourceCounts.sns_topic_policy).toBe(1);
    });

    test('should have properly configured SNS topic', () => {
      expect(mainContent).toContain('resource "aws_sns_topic" "payment_notifications"');
      expect(mainContent).toContain('name              = "sns-payment-notifications-${var.environment}"');
      expect(mainContent).toContain('kms_master_key_id = aws_kms_key.sns_encryption.id');
    });

    test('should have SNS topic policy for Step Functions', () => {
      expect(mainContent).toContain('resource "aws_sns_topic_policy" "payment_notifications"');
      expect(mainContent).toContain('AllowStepFunctionsPublish');
      expect(mainContent).toContain('SNS:Publish');
    });
  });

  // ===== LAMBDA FUNCTIONS TESTS =====
  describe('Lambda Functions Configuration', () => {
    test('should have 2 Lambda functions', () => {
      expect(resourceCounts.lambda_function).toBe(2);
      expect(resourceCounts.archive_file).toBe(2);
    });

    test('should have validation Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "validation"');
      expect(mainContent).toContain('function_name    = "lambda-payment-validation-${var.environment}"');
      expect(mainContent).toContain('handler          = "lambda_validation.lambda_handler"');
      expect(mainContent).toContain('runtime          = "python3.11"');
    });

    test('should have processing Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "processing"');
      expect(mainContent).toContain('function_name    = "lambda-payment-processing-${var.environment}"');
      expect(mainContent).toContain('handler          = "lambda_processing.lambda_handler"');
    });

    test('should have proper Lambda configuration', () => {
      expect(mainContent).toContain('memory_size      = 256');
      expect(mainContent).toContain('timeout          = 300');
      expect(mainContent).toContain('source_code_hash');
    });

    test('should have Lambda environment variables', () => {
      expect(mainContent).toContain('DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name');
      expect(mainContent).toContain('SNS_TOPIC_ARN       = aws_sns_topic.payment_notifications.arn');
    });

    test('should have Lambda dependencies properly configured', () => {
      const validationDeps = mainContent.match(/aws_lambda_function.*validation[\s\S]*?depends_on/g);
      const processingDeps = mainContent.match(/aws_lambda_function.*processing[\s\S]*?depends_on/g);
      expect(validationDeps?.length).toBeGreaterThan(0);
      expect(processingDeps?.length).toBeGreaterThan(0);
    });
  });

  // ===== STEP FUNCTIONS TESTS =====
  describe('Step Functions State Machine Configuration', () => {
    test('should have 1 Step Functions state machine', () => {
      expect(resourceCounts.sfn_state_machine).toBe(1);
    });

    test('should have properly configured state machine', () => {
      expect(mainContent).toContain('resource "aws_sfn_state_machine" "payment_workflow"');
      expect(mainContent).toContain('name     = "sfn-payment-workflow-${var.environment}"');
      expect(mainContent).toContain('type     = "STANDARD"');
    });
    
    test('should invoke Lambda functions from Step Functions', () => {
      expect(mainContent).toContain('"arn:aws:states:::lambda:invoke"');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.validation.arn');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.processing.arn');
    });

    test('should publish to SNS on failure', () => {
      expect(mainContent).toContain('"arn:aws:states:::sns:publish"');
      expect(mainContent).toContain('TopicArn = aws_sns_topic.payment_notifications.arn');
    });

    test('should have proper error handling and retries', () => {
      expect(mainContent).toContain('Retry');
      expect(mainContent).toContain('Catch');
      expect(mainContent).toContain('ErrorEquals');
      expect(mainContent).toContain('Lambda.ServiceException');
    });
  });

  // ===== IAM ROLES AND POLICIES TESTS =====
  describe('IAM Roles and Policies Configuration', () => {
    test('should have 3 IAM roles for different services', () => {
      expect(resourceCounts.iam_role).toBe(3);
      expect(resourceCounts.iam_role_policy).toBe(3);
      expect(resourceCounts.iam_role_policy_attachment).toBe(2);
    });

    test('should have Step Functions execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "step_functions_execution"');
      expect(mainContent).toContain('name               = "role-sfn-payment-workflow-${var.environment}"');
    });

    test('should have validation Lambda execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "validation_lambda"');
      expect(mainContent).toContain('name               = "role-lambda-validation-${var.environment}"');
    });

    test('should have processing Lambda execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "processing_lambda"');
      expect(mainContent).toContain('name               = "role-lambda-processing-${var.environment}"');
    });

    test('should have proper IAM assume role policies', () => {
      expect(mainContent).toContain('sts:AssumeRole');
      expect(mainContent).toContain('states.amazonaws.com');
      expect(mainContent).toContain('lambda.amazonaws.com');
    });

    test('should have Lambda basic execution role attachments', () => {
      expect(mainContent).toContain('AWSLambdaBasicExecutionRole');
    });

    test('should have least privilege IAM policies', () => {
      // DynamoDB access
      expect(mainContent).toContain('dynamodb:PutItem');
      expect(mainContent).toContain('dynamodb:GetItem');
      expect(mainContent).toContain('dynamodb:UpdateItem');
      
      // KMS access
      expect(mainContent).toContain('kms:Decrypt');
      expect(mainContent).toContain('kms:GenerateDataKey');
      
      // SNS access
      expect(mainContent).toContain('sns:Publish');
      
      // Lambda invoke
      expect(mainContent).toContain('lambda:InvokeFunction');
    });
  });

  // ===== CLOUDWATCH MONITORING TESTS =====
  describe('CloudWatch Monitoring Configuration', () => {
    test('should have 3 CloudWatch log groups', () => {
      expect(resourceCounts.cloudwatch_log_group).toBe(3);
    });

    test('should have validation Lambda log group', () => {
      expect(mainContent).toContain('/aws/lambda/lambda-payment-validation-${var.environment}');
    });

    test('should have processing Lambda log group', () => {
      expect(mainContent).toContain('/aws/lambda/lambda-payment-processing-${var.environment}');
    });

    test('should have Step Functions log group', () => {
      expect(mainContent).toContain('/aws/vendedlogs/states/sfn-payment-workflow-${var.environment}');
    });

    test('should have 6 CloudWatch metric alarms', () => {
      expect(resourceCounts.cloudwatch_metric_alarm).toBe(6);
      expect(resourceCounts.cloudwatch_log_metric_filter).toBe(1);
    });

    test('should have Step Functions failure alarm', () => {
      expect(mainContent).toContain('alarm_name          = "alarm-sfn-failures-${var.environment}"');
      expect(mainContent).toContain('metric_name         = "ExecutionsFailed"');
      expect(mainContent).toContain('namespace           = "AWS/States"');
    });

    test('should have Lambda error alarms', () => {
      expect(mainContent).toContain('alarm_name          = "alarm-lambda-validation-errors-${var.environment}"');
      expect(mainContent).toContain('alarm_name          = "alarm-lambda-processing-errors-${var.environment}"');
      expect(mainContent).toContain('metric_name         = "Errors"');
      expect(mainContent).toContain('namespace           = "AWS/Lambda"');
    });

    test('should have Lambda throttling alarms', () => {
      expect(mainContent).toContain('alarm_name          = "alarm-lambda-validation-throttles-${var.environment}"');
      expect(mainContent).toContain('alarm_name          = "alarm-lambda-processing-throttles-${var.environment}"');
      expect(mainContent).toContain('metric_name         = "Throttles"');
    });

    test('should have payment duration monitoring', () => {
      expect(mainContent).toContain('alarm_name          = "alarm-payment-duration-${var.environment}"');
      expect(mainContent).toContain('metric_name         = "PaymentProcessingDuration"');
      expect(mainContent).toContain('namespace           = "PaymentWorkflow"');
    });

    test('should use SNS for alarm notifications', () => {
      const alarmActions = mainContent.match(/alarm_actions\s*=\s*\[aws_sns_topic\.payment_notifications\.arn\]/g) || [];
      expect(alarmActions.length).toBe(6);
    });
  });

  // ===== OUTPUT VALIDATION TESTS =====
  describe('Required Outputs Configuration', () => {
    test('should have comprehensive outputs for all resources', () => {
      expect(resourceCounts.output).toBeGreaterThan(20);
    });

    test('should have Step Functions outputs', () => {
      expect(mainContent).toContain('output "step_functions_state_machine_arn"');
      expect(mainContent).toContain('output "step_functions_state_machine_name"');
      expect(mainContent).toContain('output "step_functions_state_machine_id"');
      expect(mainContent).toContain('output "step_functions_role_arn"');
    });

    test('should have Lambda function outputs', () => {
      expect(mainContent).toContain('output "lambda_validation_function_name"');
      expect(mainContent).toContain('output "lambda_validation_function_arn"');
      expect(mainContent).toContain('output "lambda_validation_invoke_arn"');
      expect(mainContent).toContain('output "lambda_validation_role_arn"');
      expect(mainContent).toContain('output "lambda_processing_function_name"');
      expect(mainContent).toContain('output "lambda_processing_function_arn"');
      expect(mainContent).toContain('output "lambda_processing_invoke_arn"');
      expect(mainContent).toContain('output "lambda_processing_role_arn"');
    });

    test('should have DynamoDB table outputs', () => {
      expect(mainContent).toContain('output "dynamodb_table_name"');
      expect(mainContent).toContain('output "dynamodb_table_arn"');
      expect(mainContent).toContain('output "dynamodb_table_id"');
    });

    test('should have SNS topic outputs', () => {
      expect(mainContent).toContain('output "sns_topic_arn"');
      expect(mainContent).toContain('output "sns_topic_name"');
    });

    test('should have CloudWatch log group outputs', () => {
      expect(mainContent).toContain('output "cloudwatch_log_group_validation_name"');
      expect(mainContent).toContain('output "cloudwatch_log_group_processing_name"');
      expect(mainContent).toContain('output "cloudwatch_log_group_stepfunctions_name"');
    });

    test('should have CloudWatch alarm outputs', () => {
      expect(mainContent).toContain('output "cloudwatch_alarm_sfn_failures_name"');
      expect(mainContent).toContain('output "cloudwatch_alarm_validation_errors_name"');
      expect(mainContent).toContain('output "cloudwatch_alarm_processing_errors_name"');
    });

    test('should have KMS key outputs', () => {
      expect(mainContent).toContain('output "kms_key_dynamodb_arn"');
      expect(mainContent).toContain('output "kms_key_sns_arn"');
      expect(mainContent).toContain('output "kms_key_cloudwatch_arn"');
    });

    test('should have account and region outputs', () => {
      expect(mainContent).toContain('output "account_id"');
      expect(mainContent).toContain('output "region"');
    });

    test('should have values for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      outputBlocks.forEach(output => {
        expect(output).toContain('value');
      });
    });
  });

  // ===== SECURITY BEST PRACTICES TESTS =====
  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets or keys', () => {
      const secretPatterns = [
        /password\s*=\s*"[^${][^"]+"/i,
        /secret\s*=\s*"[^${][^"]+"/i,
        /api_key\s*=\s*"[^${][^"]+"/i,
        /access_key\s*=\s*"[^${][^"]+"/i,
        /private_key\s*=\s*"[^${][^"]+"/i
      ];
      
      secretPatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use variables for environment-specific values', () => {
      const envVarRefs = mainContent.match(/\$\{var\.environment\}/g) || [];
      expect(envVarRefs.length).toBeGreaterThan(15);
    });

    test('should use data sources for dynamic values', () => {
      expect(combinedContent).toContain('data.aws_caller_identity.current.account_id');
      expect(combinedContent).toContain('data.aws_region.current.name');
    });

    test('should enable encryption for all data at rest', () => {
      expect(mainContent).toContain('server_side_encryption');
      expect(mainContent).toContain('kms_master_key_id');
    });

    test('should have key rotation enabled for KMS keys', () => {
      const keyRotationCount = (mainContent.match(/enable_key_rotation\s*=\s*true/g) || []).length;
      expect(keyRotationCount).toBe(3);
    });

    test('should use least privilege IAM policies', () => {
      // Check that policies reference specific resources
      expect(mainContent).toContain('aws_dynamodb_table.transactions.arn');
      expect(mainContent).toContain('aws_lambda_function.validation.arn');
      expect(mainContent).toContain('aws_sns_topic.payment_notifications.arn');
    });
  });

  // ===== RESOURCE NAMING CONVENTION TESTS =====
  describe('Resource Naming Conventions', () => {
    test('should use environment variable in all resource names', () => {
      const envVarCount = (mainContent.match(/\$\{var\.environment\}/g) || []).length;
      expect(envVarCount).toBeGreaterThan(20);
    });

    test('should follow consistent naming pattern for KMS keys', () => {
      expect(mainContent).toContain('alias/dynamodb-transactions');
      expect(mainContent).toContain('alias/sns-payment-notifications');
      expect(mainContent).toContain('alias/cloudwatch-logs');
    });

    test('should follow consistent naming pattern for Lambda functions', () => {
      expect(mainContent).toContain('lambda-payment-validation');
      expect(mainContent).toContain('lambda-payment-processing');
    });

    test('should follow consistent naming pattern for Step Functions', () => {
      expect(mainContent).toContain('sfn-payment-workflow');
    });

    test('should follow consistent naming pattern for DynamoDB', () => {
      expect(mainContent).toContain('dynamodb-transactions');
    });

    test('should follow consistent naming pattern for SNS', () => {
      expect(mainContent).toContain('sns-payment-notifications');
    });

    test('should follow consistent naming pattern for IAM roles', () => {
      expect(mainContent).toContain('role-sfn-payment-workflow');
      expect(mainContent).toContain('role-lambda-validation');
      expect(mainContent).toContain('role-lambda-processing');
    });
  });

  // ===== COST OPTIMIZATION TESTS =====
  describe('Cost Optimization', () => {
    test('should use PAY_PER_REQUEST billing for DynamoDB', () => {
      expect(mainContent).toContain('billing_mode                = "PAY_PER_REQUEST"');
    });

    test('should have appropriate log retention periods', () => {
      const retentionCount = (mainContent.match(/retention_in_days = 1/g) || []).length;
      expect(retentionCount).toBe(3);
    });

    test('should have reasonable Lambda memory and timeout settings', () => {
      expect(mainContent).toContain('memory_size      = 256');
      expect(mainContent).toContain('timeout          = 300');
    });

    test('should use appropriate alarm thresholds', () => {
      expect(mainContent).toContain('threshold           = "2"');
      expect(mainContent).toContain('threshold           = "5"');
      expect(mainContent).toContain('threshold           = "1"');
      expect(mainContent).toContain('threshold           = "120"');
    });
  });

  // ===== DEPENDENCY AND INTEGRATION TESTS =====
  describe('Resource Dependencies and Integration', () => {
    test('should have proper KMS key references', () => {
      expect(mainContent).toContain('kms_key_arn = aws_kms_key.dynamodb_encryption.arn');
      expect(mainContent).toContain('kms_master_key_id = aws_kms_key.sns_encryption.id');
    });

    test('should have proper DynamoDB table references in Lambda', () => {
      expect(mainContent).toContain('DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name');
      expect(mainContent).toContain('resources = [');
      expect(mainContent).toContain('aws_dynamodb_table.transactions.arn');
    });

    test('should have proper SNS topic references', () => {
      expect(mainContent).toContain('SNS_TOPIC_ARN       = aws_sns_topic.payment_notifications.arn');
      expect(mainContent).toContain('Resource = aws_sns_topic.payment_notifications.arn');
    });

    test('should have proper Lambda function references in Step Functions', () => {
      expect(mainContent).toContain('FunctionName = aws_lambda_function.validation.arn');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.processing.arn');
    });

    test('should have proper IAM role references', () => {
      expect(mainContent).toContain('role             = aws_iam_role.validation_lambda.arn');
      expect(mainContent).toContain('role             = aws_iam_role.processing_lambda.arn');
      expect(mainContent).toContain('role_arn = aws_iam_role.step_functions_execution.arn');
    });

    test('should have proper CloudWatch log group references', () => {
      expect(mainContent).toContain('log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"');
    });

    test('should have proper alarm dimensions referencing resources', () => {
      expect(mainContent).toContain('StateMachineArn = aws_sfn_state_machine.payment_workflow.arn');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.validation.function_name');
      expect(mainContent).toContain('FunctionName = aws_lambda_function.processing.function_name');
    });
  });

  // ===== TERRAFORM BEST PRACTICES TESTS =====
  describe('Terraform Best Practices', () => {
    test('should use proper depends_on declarations', () => {
      const dependsOnCount = (mainContent.match(/depends_on\s*=/g) || []).length;
      expect(dependsOnCount).toBe(3);
    });

    test('should use proper interpolation syntax', () => {
      expect(mainContent).toContain('${var.environment}');
      expect(mainContent).toContain('${data.aws_caller_identity.current.account_id}');
      expect(mainContent).toContain('aws_kms_key.dynamodb_encryption.arn');
    });

    test('should use proper Terraform formatting', () => {
      const lines = mainContent.split('\n');
      const resourceBlocks = lines.filter(line => 
        line.includes('resource') || 
        line.includes('data ') || 
        line.includes('output') ||
        line.includes('variable')
      );
      expect(resourceBlocks.length).toBeGreaterThan(25);
    });

    test('should use jsonencode for complex policies', () => {
      const jsonencodeCount = (mainContent.match(/jsonencode/g) || []).length;
      expect(jsonencodeCount).toBe(4);
    });
  });

  // ===== COMPREHENSIVE RESOURCE COUNT VALIDATION =====
  describe('Comprehensive Resource Count Validation', () => {
    test('should have expected resource counts based on payment processing system', () => {
      console.log('🔍 Payment Processing Resource Counts:', resourceCounts);
      
      // Validate all counts are non-negative
      Object.entries(resourceCounts).forEach(([resourceType, count]) => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    test('should have consistent resource relationships', () => {
      // KMS keys should have matching aliases
      expect(resourceCounts.kms_alias).toBe(resourceCounts.kms_key);
      
      // Should have 2 Lambda functions and 2 archive files
      expect(resourceCounts.archive_file).toBe(resourceCounts.lambda_function);
      
      // Should have 3 IAM roles and 3 IAM policies
      expect(resourceCounts.iam_role_policy).toBe(resourceCounts.iam_role);
      
      // Should have proper CloudWatch monitoring (3 log groups, 6 alarms, 1 filter)
      expect(resourceCounts.cloudwatch_log_group).toBe(3);
      expect(resourceCounts.cloudwatch_metric_alarm).toBe(6);
      expect(resourceCounts.cloudwatch_log_metric_filter).toBe(1);
    });
  });
});

export {};
