// terraform-utils.unit.test.ts
// Unit tests for Terraform utility functions

import fs from 'fs';
import path from 'path';
import {
  validateResourceNaming,
  extractTerraformResources,
  validateRequiredVariables,
  extractTerraformOutputs,
  validateIAMPolicy,
  generateResourceName,
  validateSecurityBestPractices,
  calculateContentHash,
} from '../lib/terraform-utils';

const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
let terraformContent: string;

describe('Terraform Utilities Unit Tests', () => {
  beforeAll(() => {
    terraformContent = fs.readFileSync(stackPath, 'utf8');
  });

  describe('validateResourceNaming', () => {
    test('validates correct resource naming', () => {
      const namePrefix = 'serverless-api-dev-test';
      expect(validateResourceNaming(`${namePrefix}-lambda`, namePrefix)).toBe(true);
      expect(validateResourceNaming(`${namePrefix}-config`, namePrefix)).toBe(true);
    });

    test('rejects incorrect resource naming', () => {
      const namePrefix = 'serverless-api-dev-test';
      expect(validateResourceNaming('other-resource', namePrefix)).toBe(false);
      expect(validateResourceNaming('wrong-prefix-lambda', namePrefix)).toBe(false);
    });

    test('handles empty or null inputs', () => {
      expect(validateResourceNaming('', 'prefix')).toBe(false);
      expect(validateResourceNaming('resource', '')).toBe(false);
      expect(validateResourceNaming('', '')).toBe(false);
    });
  });

  describe('extractTerraformResources', () => {
    test('extracts Lambda function resources', () => {
      const lambdaResources = extractTerraformResources(terraformContent, 'aws_lambda_function');
      expect(lambdaResources).toHaveLength(1);
      expect(lambdaResources[0].name).toBe('fn');
      expect(lambdaResources[0].type).toBe('aws_lambda_function');
    });

    test('extracts Secrets Manager resources', () => {
      const secretsResources = extractTerraformResources(terraformContent, 'aws_secretsmanager_secret');
      expect(secretsResources).toHaveLength(1);
      expect(secretsResources[0].name).toBe('config');
    });

    test('extracts IAM role resources', () => {
      const roleResources = extractTerraformResources(terraformContent, 'aws_iam_role');
      expect(roleResources.length).toBeGreaterThanOrEqual(2);
      
      const roleNames = roleResources.map(r => r.name);
      expect(roleNames).toContain('lambda_role');
      expect(roleNames).toContain('apigw_logs_role');
    });

    test('returns empty array for non-existent resource type', () => {
      const resources = extractTerraformResources(terraformContent, 'aws_nonexistent_resource');
      expect(resources).toHaveLength(0);
    });

    test('handles special characters in resource type', () => {
      const resources = extractTerraformResources(terraformContent, 'aws_api_gateway_rest_api');
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('api');
    });
  });

  describe('validateRequiredVariables', () => {
    test('validates presence of required variables', () => {
      const requiredVars = ['aws_region', 'environment', 'environment_suffix'];
      expect(validateRequiredVariables(terraformContent, requiredVars)).toBe(true);
    });

    test('detects missing required variables', () => {
      const requiredVars = ['aws_region', 'nonexistent_variable'];
      expect(validateRequiredVariables(terraformContent, requiredVars)).toBe(false);
    });

    test('handles empty required variables array', () => {
      expect(validateRequiredVariables(terraformContent, [])).toBe(true);
    });

    test('handles variables with special characters', () => {
      const requiredVars = ['lambda_memory_size', 'lambda_timeout'];
      expect(validateRequiredVariables(terraformContent, requiredVars)).toBe(true);
    });
  });

  describe('extractTerraformOutputs', () => {
    test('extracts output definitions', () => {
      const outputs = extractTerraformOutputs(terraformContent);
      
      expect(outputs).toHaveProperty('api_gateway_url');
      expect(outputs).toHaveProperty('lambda_function_name');
      expect(outputs).toHaveProperty('secret_arn');
      expect(outputs).toHaveProperty('name_prefix');
    });

    test('output values contain expected references', () => {
      const outputs = extractTerraformOutputs(terraformContent);
      
      expect(outputs.api_gateway_url.value).toContain('aws_api_gateway_stage.stage.invoke_url');
      expect(outputs.lambda_function_name.value).toContain('aws_lambda_function.fn.function_name');
      expect(outputs.secret_arn.value).toContain('aws_secretsmanager_secret.config.arn');
    });

    test('handles content without outputs', () => {
      const outputs = extractTerraformOutputs('resource "aws_s3_bucket" "test" {}');
      expect(Object.keys(outputs)).toHaveLength(0);
    });
  });

  describe('validateIAMPolicy', () => {
    test('validates secure IAM policy', () => {
      const securePolicy = `
        policy = jsonencode({
          Version = "2012-10-17"
          Statement = [{
            Effect   = "Allow"
            Action   = ["secretsmanager:GetSecretValue"]
            Resource = aws_secretsmanager_secret.config.arn
          }]
        })
      `;
      
      const result = validateIAMPolicy(securePolicy);
      expect(result.isValid).toBe(true);
      expect(result.hasWildcardActions).toBe(false);
      expect(result.hasWildcardResources).toBe(false);
      expect(result.issues).toHaveLength(0);
    });

    test('detects wildcard actions', () => {
      const insecurePolicy = `
        policy = jsonencode({
          Version = "2012-10-17"
          Statement = [{
            Effect = "Allow"
            Action = "*"
            Resource = "arn:aws:s3:::mybucket/*"
          }]
        })
      `;
      
      const result = validateIAMPolicy(insecurePolicy);
      expect(result.isValid).toBe(false);
      expect(result.hasWildcardActions).toBe(true);
      expect(result.issues).toContain('Policy contains wildcard actions');
    });

    test('detects wildcard resources', () => {
      const insecurePolicy = `
        policy = jsonencode({
          Version = "2012-10-17"
          Statement = [{
            Effect = "Allow"
            Action = ["s3:GetObject"]
            Resource = "*"
          }]
        })
      `;
      
      const result = validateIAMPolicy(insecurePolicy);
      expect(result.isValid).toBe(false);
      expect(result.hasWildcardResources).toBe(true);
      expect(result.issues).toContain('Policy contains wildcard resources');
    });

    test('validates policy with required fields', () => {
      const validPolicy = `
        policy = jsonencode({
          Version = "2012-10-17"
          Statement = [{
            Effect = "Allow"
            Action = ["lambda:InvokeFunction"]
            Resource = "arn:aws:lambda:*:*:function:*"
          }]
        })
      `;
      
      const result = validateIAMPolicy(validPolicy);
      expect(result.issues.filter(i => i.includes('missing required'))).toHaveLength(0);
    });

    test('handles malformed policy', () => {
      const malformedPolicy = 'this is not a policy';
      const result = validateIAMPolicy(malformedPolicy);
      expect(result.isValid).toBe(false);
    });
  });

  describe('generateResourceName', () => {
    test('generates correct Lambda function name', () => {
      const namePrefix = 'serverless-api-dev-test';
      const result = generateResourceName(namePrefix, 'lambda');
      expect(result).toBe(`${namePrefix}-fn`);
    });

    test('generates correct secret name', () => {
      const namePrefix = 'serverless-api-dev-test';
      const result = generateResourceName(namePrefix, 'secret');
      expect(result).toBe(`${namePrefix}-config`);
    });

    test('generates correct role name', () => {
      const namePrefix = 'serverless-api-dev-test';
      const result = generateResourceName(namePrefix, 'role');
      expect(result).toBe(`${namePrefix}-role`);
    });

    test('handles API resource name', () => {
      const namePrefix = 'serverless-api-dev-test';
      const result = generateResourceName(namePrefix, 'api');
      expect(result).toBe(namePrefix);
    });

    test('handles unknown resource type', () => {
      const namePrefix = 'serverless-api-dev-test';
      const result = generateResourceName(namePrefix, 'unknown');
      expect(result).toBe(`${namePrefix}-unknown`);
    });

    test('handles empty inputs', () => {
      expect(generateResourceName('', 'lambda')).toBe('-fn');
      expect(generateResourceName('prefix', '')).toBe('prefix-');
    });
  });

  describe('validateSecurityBestPractices', () => {
    test('validates security practices in real Terraform content', () => {
      const result = validateSecurityBestPractices(terraformContent);
      
      expect(result.hasEncryption).toBe(true);
      expect(result.hasIAMAuthentication).toBe(true);
      expect(result.hasProperTagging).toBe(true);
      expect(result.hasLogRetention).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('detects missing encryption', () => {
      const insecureContent = `
        resource "aws_s3_bucket" "test" {
          bucket = "test-bucket"
        }
      `;
      
      const result = validateSecurityBestPractices(insecureContent);
      expect(result.hasEncryption).toBe(false);
      expect(result.issues).toContain('No encryption configuration found');
    });

    test('detects missing IAM authentication', () => {
      const insecureContent = `
        resource "aws_api_gateway_method" "test" {
          authorization = "NONE"
        }
      `;
      
      const result = validateSecurityBestPractices(insecureContent);
      expect(result.hasIAMAuthentication).toBe(false);
      expect(result.issues).toContain('No IAM authentication found for API Gateway');
    });

    test('detects missing tagging', () => {
      const insecureContent = `
        resource "aws_lambda_function" "test" {
          function_name = "test"
        }
      `;
      
      const result = validateSecurityBestPractices(insecureContent);
      expect(result.hasProperTagging).toBe(false);
      expect(result.issues).toContain('Consistent tagging strategy not implemented');
    });

    test('detects missing log retention', () => {
      const insecureContent = `
        resource "aws_cloudwatch_log_group" "test" {
          name = "/aws/lambda/test"
        }
      `;
      
      const result = validateSecurityBestPractices(insecureContent);
      expect(result.hasLogRetention).toBe(false);
      expect(result.issues).toContain('No log retention policy configured');
    });

    test('validates content with all security practices', () => {
      const secureContent = `
        resource "aws_lambda_function" "test" {
          kms_key_arn = aws_kms_key.test.arn
          tags = local.common_tags
        }
        resource "aws_api_gateway_method" "test" {
          authorization = "AWS_IAM"
        }
        resource "aws_cloudwatch_log_group" "test" {
          retention_in_days = 14
        }
      `;
      
      const result = validateSecurityBestPractices(secureContent);
      expect(result.hasEncryption).toBe(true);
      expect(result.hasIAMAuthentication).toBe(true);
      expect(result.hasProperTagging).toBe(true);
      expect(result.hasLogRetention).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('calculateContentHash', () => {
    test('generates consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = calculateContentHash(content);
      const hash2 = calculateContentHash(content);
      expect(hash1).toBe(hash2);
    });

    test('generates different hashes for different content', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const hash1 = calculateContentHash(content1);
      const hash2 = calculateContentHash(content2);
      expect(hash1).not.toBe(hash2);
    });

    test('handles empty string', () => {
      const hash = calculateContentHash('');
      expect(hash).toBe('0');
    });

    test('handles long content', () => {
      const longContent = 'A'.repeat(10000);
      const hash = calculateContentHash(longContent);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });

    test('hash is deterministic', () => {
      const content = terraformContent;
      const hash1 = calculateContentHash(content);
      const hash2 = calculateContentHash(content);
      const hash3 = calculateContentHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    test('different line endings produce different hashes', () => {
      const contentUnix = 'line1\\nline2\\nline3';
      const contentWindows = 'line1\\r\\nline2\\r\\nline3';
      
      const hash1 = calculateContentHash(contentUnix);
      const hash2 = calculateContentHash(contentWindows);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Integration with Real Terraform File', () => {
    test('validates that our stack meets naming conventions', () => {
      const namePrefix = 'serverless-api-dev-local';
      const lambdaResources = extractTerraformResources(terraformContent, 'aws_lambda_function');
      
      lambdaResources.forEach(resource => {
        // For this test, we check the resource name structure
        expect(['fn', 'lambda']).toContain(resource.name);
      });
    });

    test('validates all required variables are present', () => {
      const criticalVariables = [
        'aws_region',
        'environment', 
        'environment_suffix',
        'lambda_memory_size',
        'lambda_timeout'
      ];
      
      expect(validateRequiredVariables(terraformContent, criticalVariables)).toBe(true);
    });

    test('validates security configuration', () => {
      const securityValidation = validateSecurityBestPractices(terraformContent);
      
      // Our stack should implement all security best practices
      expect(securityValidation.hasEncryption).toBe(true);
      expect(securityValidation.hasIAMAuthentication).toBe(true);
      expect(securityValidation.hasProperTagging).toBe(true);
      expect(securityValidation.hasLogRetention).toBe(true);
      expect(securityValidation.issues.length).toBe(0);
    });

    test('content hash is stable', () => {
      const hash = calculateContentHash(terraformContent);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      
      // Hash should be the same when calculated multiple times
      expect(calculateContentHash(terraformContent)).toBe(hash);
    });
  });
});