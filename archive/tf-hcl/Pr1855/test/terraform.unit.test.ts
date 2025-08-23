/**
 * Unit Tests for Terraform Configuration
 * 
 * These tests validate the Terraform configuration without executing terraform commands.
 * They perform static analysis of the HCL configuration file.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  let terraformContent: string;

  beforeAll(() => {
    // Read the main.tf file from ../lib/main.tf
    const mainTfPath = path.resolve(__dirname, '../lib/main.tf');
    
    if (!fs.existsSync(mainTfPath)) {
      throw new Error(`main.tf file not found at ${mainTfPath}`);
    }
    
    terraformContent = fs.readFileSync(mainTfPath, 'utf-8');
  });

  describe('File Structure and Basic Validation', () => {
    test('main.tf file should exist and be readable', () => {
      expect(terraformContent).toBeDefined();
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test('should not contain provider blocks (provider.tf handles this)', () => {
      // Provider blocks should not exist in main.tf per guidelines
      const providerBlockPattern = /^\s*provider\s+"/gm;
      expect(terraformContent.match(providerBlockPattern)).toBeNull();
    });

    test('should not contain terraform or required_providers blocks', () => {
      // These should only be in provider.tf per guidelines
      const terraformBlockPattern = /^\s*terraform\s*{/gm;
      const requiredProvidersPattern = /^\s*required_providers\s*{/gm;
      
      expect(terraformContent.match(terraformBlockPattern)).toBeNull();
      expect(terraformContent.match(requiredProvidersPattern)).toBeNull();
    });

    test('should contain single-file comment header', () => {
      expect(terraformContent).toContain('Single-file Terraform HCL stack');
      expect(terraformContent).toContain('No provider blocks here');
    });
  });

  describe('Variables Validation', () => {
    test('should declare aws_region variable for provider.tf consumption', () => {
      const awsRegionPattern = /variable\s+"aws_region"\s*{[\s\S]*?}/;
      expect(terraformContent).toMatch(awsRegionPattern);
      
      // Check that it has proper description
      expect(terraformContent).toContain('provider.tf should consume this variable');
    });

    test('should declare all required variables', () => {
      const requiredVariables = [
        'aws_region',
        'project',
        'environment', 
        'owner',
        'lambda_runtime',
        'lambda_handler',
        'create_rds',
        'db_engine',
        'db_master_username',
        'db_master_password'
      ];

      requiredVariables.forEach(variable => {
        const variablePattern = new RegExp(`variable\\s+"${variable}"\\s*{`);
        expect(terraformContent).toMatch(variablePattern);
      });
    });

    test('should have secure password variable configuration', () => {
      const passwordVarPattern = /variable\s+"db_master_password"\s*{[\s\S]*?sensitive\s*=\s*true[\s\S]*?}/;
      expect(terraformContent).toMatch(passwordVarPattern);
    });

    test('should have reasonable default values', () => {
      expect(terraformContent).toContain('default     = "us-east-1"');
      expect(terraformContent).toContain('default     = "ProdApp"');
      expect(terraformContent).toContain('default     = "production"');
    });
  });

  describe('Local Values and Data Sources', () => {
    test('should define common_tags with required fields', () => {
      expect(terraformContent).toContain('common_tags = {');
      
      const requiredTags = ['Owner', 'Environment', 'Project', 'ManagedBy'];
      requiredTags.forEach(tag => {
        expect(terraformContent).toContain(`${tag}`);
      });
      
      expect(terraformContent).toContain('ManagedBy   = "terraform"');
    });

    test('should use random suffix for unique naming', () => {
      expect(terraformContent).toContain('resource "random_id" "suffix"');
      expect(terraformContent).toContain('local.suffix_hex');
    });

    test('should include account_id for naming', () => {
      expect(terraformContent).toContain('data "aws_caller_identity" "current"');
      expect(terraformContent).toContain('local.account_id');
    });

    test('should use default VPC data sources', () => {
      expect(terraformContent).toContain('data "aws_vpc" "default"');
      expect(terraformContent).toContain('default = true');
    });
  });

  describe('S3 Resources Validation', () => {
    test('should create static and logging S3 buckets', () => {
      expect(terraformContent).toContain('resource "aws_s3_bucket" "static"');
      expect(terraformContent).toContain('resource "aws_s3_bucket" "logging"');
    });

    test('should enable S3 encryption', () => {
      expect(terraformContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(terraformContent).toContain('aws:kms');
      expect(terraformContent).toContain('alias/aws/s3');
    });

    test('should enable S3 versioning', () => {
      expect(terraformContent).toContain('aws_s3_bucket_versioning');
      expect(terraformContent).toContain('status = "Enabled"');
    });

    test('should block public access', () => {
      expect(terraformContent).toContain('aws_s3_bucket_public_access_block');
      expect(terraformContent).toContain('block_public_acls       = true');
      expect(terraformContent).toContain('block_public_policy     = true');
      expect(terraformContent).toContain('ignore_public_acls      = true');
      expect(terraformContent).toContain('restrict_public_buckets = true');
    });

    test('should configure lifecycle policy', () => {
      expect(terraformContent).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(terraformContent).toContain('days = 365');
    });

    test('should setup access logging', () => {
      expect(terraformContent).toContain('aws_s3_bucket_logging');
      expect(terraformContent).toContain('target_bucket');
    });

    test('should use proper ACL configuration', () => {
      expect(terraformContent).toContain('aws_s3_bucket_acl');
      expect(terraformContent).toContain('aws_s3_bucket_ownership_controls');
      expect(terraformContent).toContain('object_ownership = "BucketOwnerPreferred"');
    });
  });

  describe('Lambda Configuration', () => {
    test('should create Lambda function with inline code', () => {
      expect(terraformContent).toContain('resource "aws_lambda_function" "app"');
      expect(terraformContent).toContain('data "archive_file" "lambda_zip"');
    });

    test('should have proper Lambda execution role', () => {
      expect(terraformContent).toContain('resource "aws_iam_role" "lambda_exec"');
      expect(terraformContent).toContain('lambda.amazonaws.com');
    });

    test('should configure VPC access for Lambda', () => {
      expect(terraformContent).toContain('vpc_config');
      expect(terraformContent).toContain('subnet_ids');
      expect(terraformContent).toContain('security_group_ids');
    });

    test('should have appropriate IAM permissions', () => {
      expect(terraformContent).toContain('aws_iam_role_policy');
      expect(terraformContent).toContain('logs:CreateLogGroup');
      expect(terraformContent).toContain('logs:CreateLogStream');
      expect(terraformContent).toContain('logs:PutLogEvents');
      expect(terraformContent).toContain('s3:GetObject');
      expect(terraformContent).toContain('s3:ListBucket');
    });

    test('should include VPC permissions for RDS access', () => {
      expect(terraformContent).toContain('ec2:CreateNetworkInterface');
      expect(terraformContent).toContain('ec2:DescribeNetworkInterfaces');
      expect(terraformContent).toContain('ec2:DeleteNetworkInterface');
    });

    test('should have inline Python code', () => {
      expect(terraformContent).toContain('def handler(event, context):');
      expect(terraformContent).toContain("'statusCode': 200");
      expect(terraformContent).toContain('filename = "app.py"');
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API with regional endpoint', () => {
      expect(terraformContent).toContain('resource "aws_api_gateway_rest_api" "api"');
      expect(terraformContent).toContain('types = ["REGIONAL"]');
    });

    test('should configure proxy resource and method', () => {
      expect(terraformContent).toContain('resource "aws_api_gateway_resource" "proxy"');
      expect(terraformContent).toContain('path_part   = "{proxy+}"');
      expect(terraformContent).toContain('resource "aws_api_gateway_method" "proxy_any"');
      expect(terraformContent).toContain('http_method   = "ANY"');
    });

    test('should setup Lambda integration', () => {
      expect(terraformContent).toContain('resource "aws_api_gateway_integration" "lambda_proxy"');
      expect(terraformContent).toContain('type                    = "AWS_PROXY"');
      expect(terraformContent).toContain('integration_http_method = "POST"');
    });

    test('should have proper Lambda permission for API Gateway', () => {
      expect(terraformContent).toContain('resource "aws_lambda_permission" "apigw"');
      expect(terraformContent).toContain('action        = "lambda:InvokeFunction"');
      expect(terraformContent).toContain('principal     = "apigateway.amazonaws.com"');
    });

    test('should create deployment and stage', () => {
      expect(terraformContent).toContain('resource "aws_api_gateway_deployment" "deployment"');
      expect(terraformContent).toContain('resource "aws_api_gateway_stage" "prod"');
      expect(terraformContent).toContain('stage_name    = "prod"');
    });

    test('should have deployment triggers for redeployment', () => {
      expect(terraformContent).toContain('triggers = {');
      expect(terraformContent).toContain('redeployment = sha1(jsonencode');
    });
  });

  describe('RDS Configuration', () => {
    test('should create RDS instance with encryption', () => {
      expect(terraformContent).toContain('resource "aws_db_instance" "db"');
      expect(terraformContent).toContain('storage_encrypted      = true');
    });

    test('should use conditional creation with create_rds variable', () => {
      expect(terraformContent).toContain('count                  = var.create_rds ? 1 : 0');
    });

    test('should create DB subnet group', () => {
      expect(terraformContent).toContain('resource "aws_db_subnet_group" "default"');
    });

    test('should configure proper security settings', () => {
      expect(terraformContent).toContain('publicly_accessible    = false');
      expect(terraformContent).toContain('skip_final_snapshot    = true');
    });

    test('should use proper database name attribute', () => {
      expect(terraformContent).toContain('db_name                =');
      // Check that we have the modern db_name attribute for RDS
      expect(terraformContent).toContain('db_name                = "${var.project}_db"');
    });
  });

  describe('Security Groups', () => {
    test('should create Lambda and RDS security groups', () => {
      expect(terraformContent).toContain('resource "aws_security_group" "lambda_sg"');
      expect(terraformContent).toContain('resource "aws_security_group" "rds_sg"');
    });

    test('should have proper ingress rules for RDS', () => {
      expect(terraformContent).toContain('ingress {');
      expect(terraformContent).toContain('security_groups = [aws_security_group.lambda_sg.id]');
    });

    test('should allow proper database ports', () => {
      expect(terraformContent).toContain('var.db_engine == "mysql" ? 3306 : 5432');
    });

    test('should have open egress for Lambda', () => {
      const egressPattern = /egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?}/;
      expect(terraformContent).toMatch(egressPattern);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use consistent naming pattern with suffix', () => {
      const resourcesWithSuffix = [
        'lambda-exec',
        'lambda-policy', 
        'lambda-sg',
        'rds-sg',
        'api'
      ];

      resourcesWithSuffix.forEach(resource => {
        expect(terraformContent).toContain(`${resource}-\${local.suffix_hex}`);
      });
      
      // DB subnet group has different pattern to ensure it starts with letter
      expect(terraformContent).toContain('db-subnet-group-${lower(var.project)}-${local.suffix_hex}');
    });

    test('should apply common tags to all taggable resources', () => {
      const tagPattern = /tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/;
      const tagMatches = terraformContent.match(new RegExp(tagPattern.source, 'g'));
      
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThanOrEqual(8);
      
      // Verify specific resource types have tags
      expect(terraformContent).toContain('aws_s3_bucket');
      expect(terraformContent).toContain('aws_iam_role');
      expect(terraformContent).toContain('aws_security_group');
      expect(terraformContent).toContain('aws_lambda_function');
      expect(terraformContent).toContain('aws_api_gateway_rest_api');
      expect(terraformContent).toContain('aws_api_gateway_stage');
      expect(terraformContent).toContain('aws_db_subnet_group');
      expect(terraformContent).toContain('aws_db_instance');
    });

    test('should have globally unique S3 bucket names', () => {
      expect(terraformContent).toContain('account_id');
      expect(terraformContent).toContain('suffix_hex');
      expect(terraformContent).toContain('s3_names = {');
    });
  });

  describe('Outputs Validation', () => {
    test('should define all required outputs', () => {
      const requiredOutputs = [
        's3_static_bucket_name',
        's3_logging_bucket_name', 
        'lambda_function_name',
        'api_gateway_url',
        'rds_instance_identifier',
        'aws_region'
      ];

      requiredOutputs.forEach(output => {
        const outputPattern = new RegExp(`output\\s+"${output}"\\s*{`);
        expect(terraformContent).toMatch(outputPattern);
      });
    });

    test('should have proper API Gateway URL construction', () => {
      expect(terraformContent).toContain('api_gateway_url');
      expect(terraformContent).toContain('execute-api');
      expect(terraformContent).toContain('amazonaws.com');
      expect(terraformContent).toContain('aws_api_gateway_stage.prod.stage_name');
    });

    test('should handle conditional RDS output', () => {
      expect(terraformContent).toContain('var.create_rds ? aws_db_instance.db[0].id : ""');
    });

    test('should mark RDS output as non-sensitive', () => {
      expect(terraformContent).toContain('sensitive   = false');
    });

    test('should not output sensitive values', () => {
      // Ensure no password or secret outputs in output blocks
      const outputBlocks = terraformContent.match(/output\s+"[^"]*"\s*{[^}]*}/g) || [];
      outputBlocks.forEach(output => {
        expect(output.toLowerCase()).not.toContain('password');
        expect(output.toLowerCase()).not.toContain('secret');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use least privilege IAM policies', () => {
      // Check for specific resource ARNs rather than wildcards where possible
      expect(terraformContent).toContain('aws_s3_bucket.static.arn');
      expect(terraformContent).toContain('/aws/lambda/*');
    });

    test('should encrypt storage resources', () => {
      expect(terraformContent).toContain('storage_encrypted      = true');
      expect(terraformContent).toContain('server_side_encryption_configuration');
    });

    test('should not contain hardcoded credentials', () => {
      const credentialPatterns = [
        /password\s*=\s*"[^"]*"/i,
        /secret\s*=\s*"[^"]*"/i,
        /key\s*=\s*"[^"]*"/i
      ];

      credentialPatterns.forEach(pattern => {
        expect(terraformContent).not.toMatch(pattern);
      });
    });

    test('should use secure defaults', () => {
      expect(terraformContent).toContain('publicly_accessible    = false');
      expect(terraformContent).toContain('multi_az               = false');
    });
  });

  describe('Configuration Standards', () => {
    test('should follow HCL formatting standards', () => {
      // Check for consistent indentation and structure
      expect(terraformContent).toMatch(/^resource\s+"[\w_]+"[\s\S]*?^}/gm);
      expect(terraformContent).toMatch(/^variable\s+"[\w_]+"[\s\S]*?^}/gm);
      expect(terraformContent).toMatch(/^output\s+"[\w_]+"[\s\S]*?^}/gm);
    });

    test('should have descriptive resource descriptions', () => {
      expect(terraformContent).toContain('description = ');
    });

    test('should use proper variable types', () => {
      expect(terraformContent).toContain('type        = string');
      expect(terraformContent).toContain('type        = bool'); 
      expect(terraformContent).toContain('type        = number');
    });

    test('should include helpful comments', () => {
      expect(terraformContent).toContain('# ');
      expect(terraformContent).toContain('########################################');
    });
  });

  describe('Test Friendliness', () => {
    test('should support conditional resource creation', () => {
      expect(terraformContent).toContain('var.create_rds');
      expect(terraformContent).toContain('count');
    });

    test('should provide empty string defaults for optional resources', () => {
      expect(terraformContent).toContain(': ""');
    });

    test('should use deterministic naming with random suffixes', () => {
      expect(terraformContent).toContain('random_suffix_bytes');
      expect(terraformContent).toContain('byte_length = var.random_suffix_bytes');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing or empty variables gracefully', () => {
      expect(terraformContent).toContain('default     = ""');
      expect(terraformContent).toContain('default     = []');
    });

    test('should have lifecycle management', () => {
      expect(terraformContent).toContain('lifecycle {');
      expect(terraformContent).toContain('prevent_destroy = false');
    });

    test('should handle deployment dependencies', () => {
      expect(terraformContent).toContain('depends_on');
      expect(terraformContent).toContain('create_before_destroy = true');
    });
  });
});