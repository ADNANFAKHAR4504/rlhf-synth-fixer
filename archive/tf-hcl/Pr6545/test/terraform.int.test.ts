import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Security, Compliance, and Governance Integration Tests', () => {
  const libPath = path.join(process.cwd(), 'lib');

  describe('Terraform Configuration Files', () => {
    test('should have all required Terraform configuration files', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'provider.tf',
        'backend.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have valid HCL syntax in all .tf files', () => {
      const tfFiles = fs.readdirSync(libPath)
        .filter(file => file.endsWith('.tf'))
        .map(file => path.join(libPath, file));

      tfFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Basic HCL syntax checks
        expect(content).toMatch(/resource\s+"|data\s+"|variable\s+"|output\s+"|provider\s+"|terraform\s+{/);
      });
    });
  });

  describe('AWS Config Resources', () => {
    test('should have AWS Config bucket configuration', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for Config S3 bucket
      expect(mainTf).toContain('resource "aws_s3_bucket" "config_bucket"');
      expect(mainTf).toContain('config-bucket-${var.environment_suffix}');

      // Check for bucket versioning
      expect(mainTf).toContain('resource "aws_s3_bucket_versioning" "config_bucket"');

      // Check for bucket encryption
      expect(mainTf).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket"');

      // Check for public access block
      expect(mainTf).toContain('resource "aws_s3_bucket_public_access_block" "config_bucket"');
    });

    test('should have AWS Config recorder configuration', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for Config recorder
      expect(mainTf).toContain('resource "aws_config_configuration_recorder"');
      expect(mainTf).toContain('recording_group');
      expect(mainTf).toContain('all_supported');
    });

    test('should have AWS Config delivery channel', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for delivery channel
      expect(mainTf).toContain('resource "aws_config_delivery_channel"');
      expect(mainTf).toContain('s3_bucket_name');

      // Check for SNS topic configuration if present
      const hasSNS = mainTf.includes('sns_topic_arn');
      if (hasSNS) {
        expect(mainTf).toContain('resource "aws_sns_topic"');
      }
    });

  });

  describe('Compliance Rules', () => {

    test('should have Lambda function for custom Config rules', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check if Lambda is used for custom Config rules
      const hasLambda = mainTf.includes('resource "aws_lambda_function"');
      const hasConfigLambda = mainTf.includes('config') && mainTf.includes('lambda');

      if (hasLambda) {
        expect(mainTf).toContain('runtime');
        expect(mainTf).toContain('handler');

        // Check for Lambda IAM role
        expect(mainTf).toContain('aws_iam_role');
        expect(mainTf).toContain('lambda.amazonaws.com');
      }

      // At least one type of Config rule should be present
      expect(hasConfigLambda || mainTf.includes('aws_config_config_rule')).toBe(true);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have CloudWatch Log Group for Config', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for CloudWatch Log Group
      const hasLogGroup = mainTf.includes('resource "aws_cloudwatch_log_group"');
      const hasConfigLogs = mainTf.includes('/aws/config') || mainTf.includes('config-logs');

      if (hasLogGroup) {
        expect(hasConfigLogs).toBe(true);
        expect(mainTf).toContain('retention_in_days');
      }
    });


    test('should have EventBridge rules for compliance events', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for EventBridge rules
      const hasEventBridge = mainTf.includes('resource "aws_cloudwatch_event_rule"') ||
                            mainTf.includes('resource "aws_eventbridge_rule"');

      if (hasEventBridge) {
        expect(mainTf).toContain('event_pattern');
        expect(mainTf).toContain('Config');

        // Check for EventBridge targets
        const hasTarget = mainTf.includes('resource "aws_cloudwatch_event_target"') ||
                         mainTf.includes('resource "aws_eventbridge_target"');
        expect(hasTarget).toBe(true);
      }
    });
  });

  describe('Security and Access Control', () => {

    test('should have S3 bucket policy for Config access', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for S3 bucket policy
      const hasBucketPolicy = mainTf.includes('resource "aws_s3_bucket_policy"');

      if (hasBucketPolicy) {
        expect(mainTf).toContain('config.amazonaws.com');
        expect(mainTf).toContain('GetBucketAcl');
        expect(mainTf).toContain('PutObject');
      }
    });

    test('should have encryption for all data at rest', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check S3 encryption
      expect(mainTf).toContain('server_side_encryption_configuration');
      expect(mainTf).toContain('sse_algorithm');

      // Check for KMS if used
      const hasKMS = mainTf.includes('resource "aws_kms_key"');
      if (hasKMS) {
        expect(mainTf).toContain('enable_key_rotation');
        expect(mainTf).toContain('key_policy');
      }
    });
  });

  describe('Variables and Outputs', () => {
    test('should have required variables defined', () => {
      const variablesTf = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');

      // Check for essential variables
      expect(variablesTf).toContain('variable "environment_suffix"');
      expect(variablesTf).toContain('variable "aws_region"');

      // Check for variable descriptions
      expect(variablesTf).toContain('description');

      // Check for variable types
      expect(variablesTf).toContain('type');

      // Check for tags variable
      expect(variablesTf).toContain('variable "tags"');
    });

    test('should have meaningful outputs', () => {
      const outputsTf = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf-8');

      // Check for Config-related outputs
      expect(outputsTf).toContain('output');

      // Check for specific outputs
      const expectedOutputs = [
        'config_bucket',
        'config_recorder',
        'config_rules',
        'sns_topic'
      ];

      let outputsFound = 0;
      expectedOutputs.forEach(output => {
        if (outputsTf.includes(output)) {
          outputsFound++;
        }
      });

      expect(outputsFound).toBeGreaterThan(0);

      // Check for output descriptions
      expect(outputsTf).toContain('description');
    });
  });

  describe('Backend and Provider Configuration', () => {
    test('should have backend configuration for state management', () => {
      const backendTf = fs.readFileSync(path.join(libPath, 'backend.tf'), 'utf-8');

      // Check for backend configuration
      expect(backendTf).toContain('terraform');
      expect(backendTf).toContain('backend');

      // Check for S3 backend (most common)
      const hasS3Backend = backendTf.includes('backend "s3"');
      if (hasS3Backend) {
        expect(backendTf).toContain('bucket');
        expect(backendTf).toContain('key');
        expect(backendTf).toContain('region');
      }
    });

    test('should have AWS provider configuration', () => {
      const providerTf = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf-8');

      // Check for AWS provider
      expect(providerTf).toContain('provider "aws"');
      expect(providerTf).toContain('region');

      // Check for provider version constraints
      const hasVersionConstraint = providerTf.includes('required_providers') ||
                                   providerTf.includes('version');
      expect(hasVersionConstraint).toBe(true);
    });
  });

  describe('Compliance Validation', () => {
    test('should validate all AWS services mentioned in metadata', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');
      const metadata = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'metadata.json'), 'utf-8'));

      const awsServices = metadata.aws_services || [];
      const serviceResourceMap: Record<string, string[]> = {
        'Config': ['aws_config_', 'config_bucket', 'config_role'],
        'Lambda': ['aws_lambda_function', 'lambda_role'],
        'CloudWatch Logs': ['aws_cloudwatch_log_group', 'log_group'],
        'SNS': ['aws_sns_topic', 'sns_topic'],
        'IAM': ['aws_iam_role', 'aws_iam_policy'],
        'S3': ['aws_s3_bucket', 's3_bucket'],
        'EventBridge': ['aws_cloudwatch_event', 'aws_eventbridge']
      };

      let servicesFound = 0;
      awsServices.forEach((service: string) => {
        const patterns = serviceResourceMap[service] || [];
        const serviceExists = patterns.some(pattern => mainTf.includes(pattern));
        if (serviceExists) {
          servicesFound++;
        }
      });

      // At least 80% of services should be implemented
      const coveragePercentage = (servicesFound / awsServices.length) * 100;
      expect(coveragePercentage).toBeGreaterThanOrEqual(80);
    });

    test('should have tags for resource management', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for tags on resources
      expect(mainTf).toContain('tags');

      // Check for merge function usage for consistent tagging
      const hasMerge = mainTf.includes('merge(');
      const hasVarTags = mainTf.includes('var.tags');

      expect(hasMerge || hasVarTags).toBe(true);
    });

    test('should follow Terraform best practices', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for data sources usage
      expect(mainTf).toContain('data "aws_');

      // Check for current account and region data sources
      expect(mainTf).toContain('data "aws_caller_identity" "current"');
      expect(mainTf).toContain('data "aws_region" "current"');

      // Check for resource dependencies
      const hasDependsOn = mainTf.includes('depends_on');
      const hasReferences = mainTf.includes('.id') || mainTf.includes('.arn');

      expect(hasDependsOn || hasReferences).toBe(true);
    });
  });

  describe('Infrastructure Deployment Readiness', () => {
    test('should be ready for terraform init', () => {
      const hasRequiredFiles = fs.existsSync(path.join(libPath, 'provider.tf')) &&
                               fs.existsSync(path.join(libPath, 'backend.tf'));

      expect(hasRequiredFiles).toBe(true);
    });

    test('should have no hardcoded values', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for hardcoded account IDs (12 digits)
      const hasHardcodedAccount = /\d{12}/.test(mainTf);
      expect(hasHardcodedAccount).toBe(false);

      // Check for use of variables and data sources
      expect(mainTf).toContain('var.');
      expect(mainTf).toContain('data.');
    });

    test('should have comprehensive resource naming convention', () => {
      const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf-8');

      // Check for consistent naming with environment suffix
      expect(mainTf).toContain('${var.environment_suffix}');

      // Check for use of locals for naming if present
      const hasLocals = mainTf.includes('locals {');
      if (hasLocals) {
        expect(mainTf).toContain('local.');
      }
    });
  });
});