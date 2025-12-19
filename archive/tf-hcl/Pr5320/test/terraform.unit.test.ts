import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const terraformDir = path.join(__dirname, '../lib');
  const mainTfPath = path.join(terraformDir, 'main.tf');
  const providerTfPath = path.join(terraformDir, 'provider.tf');

  // Helper function to execute terraform commands
  const execTerraform = (command: string): string => {
    try {
      return execSync(`cd ${terraformDir} && ${command}`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Terraform command failed: ${error.message}`);
    }
  };

  // Helper function to read file content
  const readFileContent = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf-8');
  };

  // Helper function to parse HCL blocks
  const hasResourceBlock = (content: string, resourceType: string, resourceName: string): boolean => {
    const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s+{`, 'g');
    return regex.test(content);
  };

  describe('File Structure Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test('main.tf should not be empty', () => {
      const content = readFileContent(mainTfPath);
      expect(content.length).toBeGreaterThan(0);
    });

    test('provider.tf should not be empty', () => {
      const content = readFileContent(providerTfPath);
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Terraform Syntax Validation', () => {
    test('should pass terraform fmt check', () => {
      expect(() => {
        execTerraform('terraform fmt -check -recursive');
      }).not.toThrow();
    });

    test('should pass terraform validate', () => {
      // Initialize first
      execTerraform('terraform init -backend=false');
      
      // Then validate
      expect(() => {
        execTerraform('terraform validate');
      }).not.toThrow();
    });

    test('should have valid HCL syntax in main.tf', () => {
      const content = readFileContent(mainTfPath);
      
      // Check for balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have valid HCL syntax in provider.tf', () => {
      const content = readFileContent(providerTfPath);
      
      // Check for balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should use AWS provider version 5.x or higher', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('hashicorp/aws');
      expect(content).toMatch(/version\s*=\s*"~>\s*5\./);
    });

    test('should specify terraform required version', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('required_version');
    });

    test('should have default tags configuration', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('default_tags');
      expect(content).toContain('Environment');
      expect(content).toContain('Project');
      expect(content).toContain('ManagedBy');
    });

    test('should have required variables defined', () => {
      const content = readFileContent(providerTfPath);
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('variable "environment"');
      expect(content).toContain('variable "alarm_email"');
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have S3 bucket resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket', 'image_bucket')).toBe(true);
    });

    test('should enable AES256 encryption', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket_server_side_encryption_configuration', 'image_bucket_encryption')).toBe(true);
      expect(mainContent).toContain('sse_algorithm = "AES256"');
    });

    test('should block all public access', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket_public_access_block', 'image_bucket_pab')).toBe(true);
      expect(mainContent).toContain('block_public_acls       = true');
      expect(mainContent).toContain('block_public_policy     = true');
      expect(mainContent).toContain('ignore_public_acls      = true');
      expect(mainContent).toContain('restrict_public_buckets = true');
    });

    test('should enable versioning', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket_versioning', 'image_bucket_versioning')).toBe(true);
      expect(mainContent).toContain('status = "Enabled"');
    });

    test('should have lifecycle configuration', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket_lifecycle_configuration', 'image_bucket_lifecycle')).toBe(true);
    });

    test('should have lifecycle rule for Standard-IA transition', () => {
      expect(mainContent).toContain('storage_class = "STANDARD_IA"');
      expect(mainContent).toContain('days          = 30');
    });

    test('should have lifecycle rule for thumbnail expiration', () => {
      expect(mainContent).toContain('expiration');
      expect(mainContent).toContain('days = 90');
    });

    test('should have S3 event notification', () => {
      expect(hasResourceBlock(mainContent, 'aws_s3_bucket_notification', 'image_upload_trigger')).toBe(true);
      expect(mainContent).toContain('s3:ObjectCreated:*');
      expect(mainContent).toContain('filter_prefix       = "uploads/"');
    });
  });

  describe('Lambda Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have Lambda function resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_lambda_function', 'image_processor')).toBe(true);
    });

    test('should use Python 3.9 runtime', () => {
      expect(mainContent).toContain('runtime          = "python3.9"');
    });

    test('should have 1024MB memory allocation', () => {
      expect(mainContent).toContain('memory_size      = 1024');
    });

    test('should have 60 second timeout', () => {
      // Fixed: Flexible spacing match
      expect(mainContent).toMatch(/timeout\s*=\s*60/);
    });

    test('should have environment variables', () => {
      expect(mainContent).toContain('environment {');
      expect(mainContent).toContain('BUCKET_NAME');
      expect(mainContent).toContain('TABLE_NAME');
    });

    test('should have Lambda permission for S3 invoke', () => {
      expect(hasResourceBlock(mainContent, 'aws_lambda_permission', 'allow_s3_invoke')).toBe(true);
      expect(mainContent).toContain('principal     = "s3.amazonaws.com"');
    });

    test('should have archive_file data source', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_zip"');
      expect(mainContent).toContain('type        = "zip"');
    });

    test('should reference Pillow layer', () => {
      expect(mainContent).toContain('layers');
      expect(mainContent).toContain('Klayers-p39-pillow');
    });
  });

  describe('DynamoDB Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have DynamoDB table resource', () => {
      expect(hasResourceBlock(mainContent, 'aws_dynamodb_table', 'image_metadata')).toBe(true);
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
    });

    test('should have hash_key defined', () => {
      expect(mainContent).toContain('hash_key     = "image_id"');
    });

    test('should have required attributes', () => {
      expect(mainContent).toContain('name = "image_id"');
      expect(mainContent).toContain('name = "user_id"');
      expect(mainContent).toContain('name = "upload_timestamp"');
    });

    test('should have global secondary index', () => {
      expect(mainContent).toContain('global_secondary_index');
      expect(mainContent).toContain('name            = "user-images-index"');
      expect(mainContent).toContain('hash_key        = "user_id"');
      expect(mainContent).toContain('range_key       = "upload_timestamp"');
    });

    test('should enable point-in-time recovery', () => {
      expect(mainContent).toContain('point_in_time_recovery');
      expect(mainContent).toContain('enabled = true');
    });
  });

  describe('IAM Configuration - Least Privilege', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have Lambda execution role', () => {
      expect(hasResourceBlock(mainContent, 'aws_iam_role', 'lambda_execution')).toBe(true);
    });

    test('should have Lambda execution policy', () => {
      expect(hasResourceBlock(mainContent, 'aws_iam_policy', 'lambda_execution')).toBe(true);
    });

    test('should have role policy attachment', () => {
      expect(hasResourceBlock(mainContent, 'aws_iam_role_policy_attachment', 'lambda_execution')).toBe(true);
    });

    test('should have assume role policy for Lambda service', () => {
      expect(mainContent).toContain('sts:AssumeRole');
      expect(mainContent).toContain('lambda.amazonaws.com');
    });

    test('should NOT use wildcard resources in IAM policy', () => {
      const policyMatch = mainContent.match(/resource "aws_iam_policy" "lambda_execution"[\s\S]*?(?=resource "aws_iam_role_policy_attachment"|$)/);
      if (policyMatch) {
        const policyContent = policyMatch[0];
        expect(policyContent).not.toMatch(/Resource\s*=\s*"\*"/);
      }
    });

    test('should use explicit resource ARNs', () => {
      expect(mainContent).toContain('aws_s3_bucket.image_bucket.arn');
      expect(mainContent).toContain('aws_dynamodb_table.image_metadata.arn');
    });

    test('should have specific S3 prefix permissions', () => {
      expect(mainContent).toContain('/uploads/*');
      expect(mainContent).toContain('/processed/*');
    });

    test('should have specific DynamoDB permissions', () => {
      expect(mainContent).toContain('dynamodb:PutItem');
      expect(mainContent).toContain('dynamodb:GetItem');
      expect(mainContent).toContain('dynamodb:UpdateItem');
      expect(mainContent).toContain('dynamodb:Query');
    });

    test('should have CloudWatch Logs permissions', () => {
      expect(mainContent).toContain('logs:CreateLogGroup');
      expect(mainContent).toContain('logs:CreateLogStream');
      expect(mainContent).toContain('logs:PutLogEvents');
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have CloudWatch log group', () => {
      expect(hasResourceBlock(mainContent, 'aws_cloudwatch_log_group', 'lambda_logs')).toBe(true);
    });

    test('should have 7-day log retention', () => {
      expect(mainContent).toContain('retention_in_days = 7');
    });

    test('should have CloudWatch dashboard', () => {
      expect(hasResourceBlock(mainContent, 'aws_cloudwatch_dashboard', 'image_processing')).toBe(true);
    });

    test('should monitor Lambda invocations', () => {
      expect(mainContent).toContain('Invocations');
    });

    test('should monitor Lambda duration', () => {
      expect(mainContent).toContain('Duration');
    });

    test('should monitor Lambda errors', () => {
      expect(mainContent).toContain('Errors');
    });

    test('should monitor Lambda throttles', () => {
      expect(mainContent).toContain('Throttles');
    });

    test('should have SNS topic for alarms', () => {
      expect(hasResourceBlock(mainContent, 'aws_sns_topic', 'alarms')).toBe(true);
    });

    test('should have email subscription for alarms', () => {
      expect(hasResourceBlock(mainContent, 'aws_sns_topic_subscription', 'alarm_email')).toBe(true);
      expect(mainContent).toContain('protocol  = "email"');
    });

    test('should have high error rate alarm', () => {
      expect(hasResourceBlock(mainContent, 'aws_cloudwatch_metric_alarm', 'high_error_rate')).toBe(true);
      // Fixed: Flexible spacing match
      expect(mainContent).toMatch(/threshold\s*=\s*"0\.05"/);
    });

    test('should have high processing time alarm', () => {
      expect(hasResourceBlock(mainContent, 'aws_cloudwatch_metric_alarm', 'high_processing_time')).toBe(true);
      // Fixed: Flexible spacing match
      expect(mainContent).toMatch(/threshold\s*=\s*"30000"/);
    });
  });

  describe('Naming Convention - environmentSuffix', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have locals block with environmentSuffix', () => {
      expect(mainContent).toContain('locals {');
      expect(mainContent).toContain('environmentSuffix');
    });

    test('should use environmentSuffix in bucket name', () => {
      expect(mainContent).toContain('bucket_name');
      expect(mainContent).toContain('local.environmentSuffix');
    });

    test('should use environmentSuffix in function name', () => {
      expect(mainContent).toContain('function_name');
      expect(mainContent).toContain('local.environmentSuffix');
    });

    test('should use environmentSuffix in table name', () => {
      expect(mainContent).toContain('table_name');
      expect(mainContent).toContain('local.environmentSuffix');
    });

    test('should use environmentSuffix in dashboard name', () => {
      expect(mainContent).toContain('dashboard_name');
      expect(mainContent).toContain('local.environmentSuffix');
    });

    test('should reference local variables in resources', () => {
      expect(mainContent).toContain('local.bucket_name');
      expect(mainContent).toContain('local.function_name');
      expect(mainContent).toContain('local.table_name');
      expect(mainContent).toContain('local.dashboard_name');
    });
  });

  describe('Outputs Validation', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have s3_bucket_name output', () => {
      expect(mainContent).toContain('output "s3_bucket_name"');
      expect(mainContent).toContain('aws_s3_bucket.image_bucket.id');
    });

    test('should have lambda_function_arn output', () => {
      expect(mainContent).toContain('output "lambda_function_arn"');
      expect(mainContent).toContain('aws_lambda_function.image_processor.arn');
    });

    test('should have dynamodb_table_name output', () => {
      expect(mainContent).toContain('output "dynamodb_table_name"');
      expect(mainContent).toContain('aws_dynamodb_table.image_metadata.name');
    });

    test('should have cloudwatch_dashboard_url output', () => {
      expect(mainContent).toContain('output "cloudwatch_dashboard_url"');
    });

    test('should have sns_topic_arn output', () => {
      expect(mainContent).toContain('output "sns_topic_arn"');
      expect(mainContent).toContain('aws_sns_topic.alarms.arn');
    });

    test('should have upload_prefix output', () => {
      expect(mainContent).toContain('output "upload_prefix"');
      expect(mainContent).toContain('s3://');
      expect(mainContent).toContain('/uploads/');
    });

    test('should have processed_prefix output', () => {
      expect(mainContent).toContain('output "processed_prefix"');
      expect(mainContent).toContain('s3://');
      expect(mainContent).toContain('/processed/');
    });

    test('all outputs should have descriptions', () => {
      // Fixed: Match multi-line output blocks properly
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      outputBlocks.forEach(block => {
        expect(block).toContain('description');
      });
    });
  });

  describe('Compliance and Tagging', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have tags on S3 bucket', () => {
      const s3Section = mainContent.match(/resource "aws_s3_bucket" "image_bucket"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(s3Section![0]).toContain('tags');
      expect(s3Section![0]).toContain('Name');
    });

    test('should have tags on DynamoDB table', () => {
      const dynamoSection = mainContent.match(/resource "aws_dynamodb_table" "image_metadata"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(dynamoSection![0]).toContain('tags');
      expect(dynamoSection![0]).toContain('Name');
    });

    test('should have tags on Lambda function', () => {
      // Fixed: More flexible regex to capture Lambda block
      const lambdaSection = mainContent.match(/resource "aws_lambda_function" "image_processor" \{[\s\S]*?(?=\n# Lambda permission|\nresource "aws_lambda_permission")/);
      expect(lambdaSection).not.toBeNull();
      expect(lambdaSection![0]).toContain('tags');
      expect(lambdaSection![0]).toContain('Name');
    });

    test('should have tags on IAM role', () => {
      const iamSection = mainContent.match(/resource "aws_iam_role" "lambda_execution"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(iamSection![0]).toContain('tags');
      expect(iamSection![0]).toContain('Name');
    });

    test('should have tags on CloudWatch log group', () => {
      const cwLogsSection = mainContent.match(/resource "aws_cloudwatch_log_group" "lambda_logs"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(cwLogsSection![0]).toContain('tags');
      expect(cwLogsSection![0]).toContain('Name');
    });

    test('should have tags on SNS topic', () => {
      const snsSection = mainContent.match(/resource "aws_sns_topic" "alarms"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(snsSection![0]).toContain('tags');
      expect(snsSection![0]).toContain('Name');
    });

    test('should have tags on CloudWatch alarms', () => {
      expect(mainContent).toMatch(/resource "aws_cloudwatch_metric_alarm".*tags/s);
    });
  });

  describe('Data Sources', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should have aws_caller_identity data source', () => {
      expect(mainContent).toContain('data "aws_caller_identity" "current"');
    });

    test('should have archive_file data source', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_zip"');
    });
  });

  describe('Resource Dependencies', () => {
    const mainContent = readFileContent(mainTfPath);

    test('S3 notification should depend on Lambda permission', () => {
      const s3NotificationSection = mainContent.match(/resource "aws_s3_bucket_notification" "image_upload_trigger"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(s3NotificationSection![0]).toContain('depends_on');
      expect(s3NotificationSection![0]).toContain('aws_lambda_permission.allow_s3_invoke');
    });

    test('Lambda should reference S3 bucket', () => {
      // Fixed: Check in environment variables section
      const lambdaSection = mainContent.match(/resource "aws_lambda_function" "image_processor" \{[\s\S]*?(?=\n# Lambda permission|\nresource "aws_lambda_permission")/);
      expect(lambdaSection).not.toBeNull();
      expect(lambdaSection![0]).toContain('BUCKET_NAME = aws_s3_bucket.image_bucket.id');
    });

    test('Lambda should reference DynamoDB table', () => {
      // Fixed: Check in environment variables section
      const lambdaSection = mainContent.match(/resource "aws_lambda_function" "image_processor" \{[\s\S]*?(?=\n# Lambda permission|\nresource "aws_lambda_permission")/);
      expect(lambdaSection).not.toBeNull();
      expect(lambdaSection![0]).toContain('TABLE_NAME  = aws_dynamodb_table.image_metadata.name');
    });
  });

  describe('Security Best Practices', () => {
    const mainContent = readFileContent(mainTfPath);

    test('should not have hardcoded AWS credentials', () => {
      expect(mainContent).not.toMatch(/access_key\s*=/);
      expect(mainContent).not.toMatch(/secret_key\s*=/);
    });

    test('should not have hardcoded email addresses', () => {
      const snsSubscription = mainContent.match(/resource "aws_sns_topic_subscription" "alarm_email"[\s\S]*?(?=\nresource |\ndata |\noutput |$)/);
      expect(snsSubscription![0]).toContain('var.alarm_email');
    });

    test('should use server-side encryption for S3', () => {
      expect(mainContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(mainContent).toContain('AES256');
    });

    test('should block public access on S3', () => {
      expect(mainContent).toContain('aws_s3_bucket_public_access_block');
      expect(mainContent).toContain('block_public_acls       = true');
    });

    test('should enable DynamoDB point-in-time recovery', () => {
      expect(mainContent).toContain('point_in_time_recovery');
      expect(mainContent).toContain('enabled = true');
    });
  });
});
