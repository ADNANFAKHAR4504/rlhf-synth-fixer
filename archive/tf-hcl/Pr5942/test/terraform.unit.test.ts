import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;

  beforeAll(() => {
    // Read main.tf
    const mainPath = path.join(libPath, 'main.tf');
    expect(fs.existsSync(mainPath)).toBe(true);
    mainContent = fs.readFileSync(mainPath, 'utf8');

    // Read provider.tf
    const providerPath = path.join(libPath, 'provider.tf');
    expect(fs.existsSync(providerPath)).toBe(true);
    providerContent = fs.readFileSync(providerPath, 'utf8');

    // Combine for easier searching
    combinedContent = providerContent + '\n' + mainContent;
  });

  describe('File Structure Validation', () => {
    test('should have required Terraform files', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have lambda_compliance.py file', () => {
      const lambdaPath = path.join(libPath, 'lambda_compliance.py');
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test('should have valid Terraform syntax', () => {
      // Check for basic Terraform structure
      expect(providerContent).toContain('terraform {');
      expect(providerContent).toContain('provider "aws"');
      expect(mainContent).toContain('resource "');
      expect(mainContent).toContain('output "');
    });
  });

  describe('Terraform Version and Provider Configuration', () => {
    test('should require Terraform version >= 1.5', () => {
      const versionMatch = providerContent.match(/required_version\s*=\s*"([^"]+)"/);
      expect(versionMatch).toBeTruthy();
      expect(versionMatch![1]).toContain('>= 1.5');
    });

    test('should use AWS provider version ~> 5.0', () => {
      const awsProviderMatch = providerContent.match(/aws\s*=\s*\{[\s\S]*?version\s*=\s*"([^"]+)"/);
      expect(awsProviderMatch).toBeTruthy();
      expect(awsProviderMatch![1]).toContain('~> 5.0');
    });

    test('should have random provider configured', () => {
      expect(providerContent).toContain('random = {');
      const randomProviderMatch = providerContent.match(/random\s*=\s*\{[\s\S]*?version\s*=\s*"([^"]+)"/);
      expect(randomProviderMatch![1]).toContain('~> 3.5');
    });

    test('should have archive provider configured', () => {
      expect(providerContent).toContain('archive = {');
      const archiveProviderMatch = providerContent.match(/archive\s*=\s*\{[\s\S]*?version\s*=\s*"([^"]+)"/);
      expect(archiveProviderMatch![1]).toContain('~> 2.4');
    });

    test('should have S3 backend configuration', () => {
      expect(providerContent).toContain('backend "s3"');
    });

    test('should configure default tags in provider', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment = var.environment');
      expect(providerContent).toContain('Owner       = var.owner');
      expect(providerContent).toContain('CostCenter  = var.cost_center');
      expect(providerContent).toContain('Purpose     = var.purpose');
      expect(providerContent).toContain('Compliance  = var.compliance');
    });
  });

  describe('Data Sources Validation', () => {
    test('should use aws_caller_identity data source', () => {
      expect(mainContent).toContain('data "aws_caller_identity" "current"');
    });

    test('should use aws_region data source', () => {
      expect(mainContent).toContain('data "aws_region" "current"');
    });

    test('should use aws_availability_zones data source', () => {
      expect(mainContent).toContain('data "aws_availability_zones" "available"');
    });

    test('should use archive_file for Lambda packaging', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_compliance"');
    });

    test('should not use forbidden data sources', () => {
      const forbiddenDataSources = [
        'data "aws_vpc"',
        'data "aws_subnet"',
        'data "aws_iam_user"',
        'data "aws_iam_role"',
        'data "aws_s3_bucket"',
        'data "aws_db_instance"'
      ];
      
      forbiddenDataSources.forEach(forbidden => {
        expect(combinedContent).not.toContain(forbidden);
      });
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('should create VPC with DNS support enabled', () => {
      const vpcBlock = mainContent.match(/resource\s+"aws_vpc"\s+"healthcare"\s+\{[\s\S]*?\n\}/);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toContain('enable_dns_hostnames = true');
      expect(vpcBlock![0]).toContain('enable_dns_support   = true');
    });

    test('should create private subnets in different AZs', () => {
      const subnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"private"\s+\{[\s\S]*?\n\}/);
      expect(subnetBlock).toBeTruthy();
      expect(subnetBlock![0]).toContain('count');
      expect(subnetBlock![0]).toContain('availability_zone = data.aws_availability_zones.available.names[count.index]');
    });

    test('should create security group with restricted ingress', () => {
      // Use a more flexible regex that handles nested blocks
      const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"application"\s+\{[\s\S]*?tags\s*=\s*\{[^}]*\}[\s\S]*?\n\}/);
      expect(sgBlock).toBeTruthy();
      expect(sgBlock![0]).toContain('from_port   = 443');
      expect(sgBlock![0]).toContain('protocol    = "tcp"');
      
      // Extract only the ingress block to check CIDR restrictions
      const ingressBlock = sgBlock![0].match(/ingress\s+\{[\s\S]*?\n\s+\}/);
      expect(ingressBlock).toBeTruthy();
      expect(ingressBlock![0]).toContain('cidr_blocks = [var.vpc_cidr]');
      expect(ingressBlock![0]).not.toContain('0.0.0.0/0');
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('should create KMS key with deletion window', () => {
      // Use a more flexible regex that handles the complex policy block
      const kmsBlock = mainContent.match(/resource\s+"aws_kms_key"\s+"cloudtrail"\s+\{[\s\S]*?tags\s*=\s*\{[^}]*\}[\s\S]*?\n\}/);
      expect(kmsBlock).toBeTruthy();
      expect(kmsBlock![0]).toContain('deletion_window_in_days = 7');
      expect(kmsBlock![0]).toContain('enable_key_rotation     = true');
    });

    test('should have comprehensive KMS key policy', () => {
      const kmsBlock = mainContent.match(/resource\s+"aws_kms_key"\s+"cloudtrail"\s+\{[\s\S]*?policy = jsonencode[\s\S]*?\}\)/);
      expect(kmsBlock).toBeTruthy();
      expect(kmsBlock![0]).toContain('Enable Root Account Permissions');
      expect(kmsBlock![0]).toContain('Allow CloudTrail to use the key');
      expect(kmsBlock![0]).toContain('Allow S3 to use the key');
      expect(kmsBlock![0]).toContain('Allow CloudWatch Logs');
      expect(kmsBlock![0]).toContain('Allow SNS to use the key');
    });

    test('should create KMS alias', () => {
      expect(mainContent).toContain('resource "aws_kms_alias" "cloudtrail"');
      expect(mainContent).toContain('alias/cloudtrail-logs-key-${var.environment}');
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    test('should create S3 bucket with proper naming', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket" "cloudtrail_logs"');
      expect(mainContent).toContain('bucket        = "s3-cloudtrail-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"');
    });

    test('should enable S3 bucket versioning', () => {
      const versioningBlock = mainContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"\s+\{[\s\S]*?\n\}/);
      expect(versioningBlock).toBeTruthy();
      expect(versioningBlock![0]).toContain('status = "Enabled"');
    });

    test('should enable S3 bucket KMS encryption', () => {
      const encryptionBlock = mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"\s+\{[\s\S]*?\n\}/);
      expect(encryptionBlock).toBeTruthy();
      expect(encryptionBlock![0]).toContain('sse_algorithm     = "aws:kms"');
      expect(encryptionBlock![0]).toContain('kms_master_key_id = aws_kms_key.cloudtrail.arn');
    });

    test('should block all public access on S3 bucket', () => {
      const publicBlock = mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"\s+\{[\s\S]*?\n\}/);
      expect(publicBlock).toBeTruthy();
      expect(publicBlock![0]).toContain('block_public_acls       = true');
      expect(publicBlock![0]).toContain('block_public_policy     = true');
      expect(publicBlock![0]).toContain('ignore_public_acls      = true');
      expect(publicBlock![0]).toContain('restrict_public_buckets = true');
    });

    test('should have force_destroy enabled for testing', () => {
      const bucketBlock = mainContent.match(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s+\{[\s\S]*?\n\}/);
      expect(bucketBlock![0]).toContain('force_destroy = true');
    });

    test('should have S3 bucket policy for CloudTrail', () => {
      const policyBlock = mainContent.match(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"\s+\{[\s\S]*?policy = jsonencode[\s\S]*?\}\)/);
      expect(policyBlock).toBeTruthy();
      expect(policyBlock![0]).toContain('AWSCloudTrailAclCheck');
      expect(policyBlock![0]).toContain('AWSCloudTrailWrite');
      expect(policyBlock![0]).toContain('Service = "cloudtrail.amazonaws.com"');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should enable CloudTrail with proper settings', () => {
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"\s+\{[\s\S]*?\n\}/);
      expect(cloudtrailBlock).toBeTruthy();
      expect(cloudtrailBlock![0]).toContain('include_global_service_events = true');
      expect(cloudtrailBlock![0]).toContain('is_multi_region_trail         = true');
      expect(cloudtrailBlock![0]).toContain('enable_log_file_validation    = true');
    });

    test('should configure CloudTrail with CloudWatch Logs', () => {
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"\s+\{[\s\S]*?\n\}/);
      expect(cloudtrailBlock![0]).toContain('cloud_watch_logs_group_arn');
      expect(cloudtrailBlock![0]).toContain('cloud_watch_logs_role_arn');
    });

    test('should capture all management events', () => {
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"\s+\{[\s\S]*?\n\}/);
      expect(cloudtrailBlock![0]).toContain('read_write_type           = "All"');
      expect(cloudtrailBlock![0]).toContain('include_management_events = true');
    });

    test('should have proper dependencies', () => {
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"\s+\{[\s\S]*?\n\}/);
      expect(cloudtrailBlock![0]).toContain('depends_on = [');
      expect(cloudtrailBlock![0]).toContain('aws_s3_bucket_policy.cloudtrail_logs');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should use Python 3.11 runtime', () => {
      const lambdaBlock = mainContent.match(/resource\s+"aws_lambda_function"\s+"compliance_checker"\s+\{[\s\S]*?\n\}/);
      expect(lambdaBlock).toBeTruthy();
      expect(lambdaBlock![0]).toContain('runtime          = "python3.11"');
    });

    test('should have appropriate timeout and memory', () => {
      const lambdaBlock = mainContent.match(/resource\s+"aws_lambda_function"\s+"compliance_checker"\s+\{[\s\S]*?\n\}/);
      expect(lambdaBlock![0]).toContain('timeout          = var.lambda_timeout');
      expect(lambdaBlock![0]).toContain('memory_size      = var.lambda_memory');
    });

    test('should have environment variables configured', () => {
      // Look for the Lambda function and its environment block
      const lambdaBlock = mainContent.match(/resource\s+"aws_lambda_function"\s+"compliance_checker"\s+\{[\s\S]*?tags\s*=\s*\{[^}]*\}[\s\S]*?\n\}/);
      expect(lambdaBlock).toBeTruthy();
      expect(lambdaBlock![0]).toContain('environment {');
      expect(lambdaBlock![0]).toContain('SNS_TOPIC_ARN = aws_sns_topic.compliance_alerts.arn');
      expect(lambdaBlock![0]).toContain('ENVIRONMENT   = var.environment');
    });

    test('should reference archive file for source code', () => {
      const lambdaBlock = mainContent.match(/resource\s+"aws_lambda_function"\s+"compliance_checker"\s+\{[\s\S]*?\n\}/);
      expect(lambdaBlock![0]).toContain('filename         = data.archive_file.lambda_compliance.output_path');
      expect(lambdaBlock![0]).toContain('source_code_hash = data.archive_file.lambda_compliance.output_base64sha256');
    });

    test('should have proper IAM role with least privilege', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_compliance"');
      const roleBlock = mainContent.match(/resource\s+"aws_iam_role"\s+"lambda_compliance"\s+\{[\s\S]*?assume_role_policy[\s\S]*?\}\)/);
      expect(roleBlock![0]).toContain('Service = "lambda.amazonaws.com"');
    });

    test('should have IAM role policy for Lambda', () => {
      const policyBlock = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_compliance"\s+\{[\s\S]*?policy = jsonencode[\s\S]*?\}\)/);
      expect(policyBlock).toBeTruthy();
      expect(policyBlock![0]).toContain('logs:CreateLogGroup');
      expect(policyBlock![0]).toContain('ec2:DescribeSecurityGroups');
      expect(policyBlock![0]).toContain('s3:GetBucketPolicy');
      expect(policyBlock![0]).toContain('iam:GetPolicy');
      expect(policyBlock![0]).toContain('sns:Publish');
      expect(policyBlock![0]).toContain('kms:Decrypt');
    });

    test('should have CloudWatch Logs subscription filter', () => {
      const filterBlock = mainContent.match(/resource\s+"aws_cloudwatch_log_subscription_filter"\s+"compliance_events"\s+\{[\s\S]*?\n\}/);
      expect(filterBlock).toBeTruthy();
      expect(filterBlock![0]).toContain('AuthorizeSecurityGroupIngress');
      expect(filterBlock![0]).toContain('PutBucketPolicy');
      expect(filterBlock![0]).toContain('CreatePolicy');
    });

    test('should have Lambda permission for CloudWatch Logs', () => {
      expect(mainContent).toContain('resource "aws_lambda_permission" "cloudwatch_logs"');
      const permissionBlock = mainContent.match(/resource\s+"aws_lambda_permission"\s+"cloudwatch_logs"\s+\{[\s\S]*?\n\}/);
      expect(permissionBlock![0]).toContain('principal     = "logs.${data.aws_region.current.name}.amazonaws.com"');
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch Log Groups with retention', () => {
      const logGroupRegex = /resource\s+"aws_cloudwatch_log_group"[^{]*\{[\s\S]*?\n\}/g;
      const logGroups = mainContent.match(logGroupRegex);
      expect(logGroups).toBeTruthy();
      expect(logGroups!.length).toBeGreaterThan(0);
      
      logGroups!.forEach(group => {
        expect(group).toContain('retention_in_days');
      });
    });

    test('should create CloudWatch Log Group for CloudTrail', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "cloudtrail"');
      const logGroupBlock = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s+\{[\s\S]*?\n\}/);
      expect(logGroupBlock![0]).toContain('kms_key_id        = aws_kms_key.cloudtrail.arn');
    });

    test('should create CloudWatch alarms for monitoring', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_metric_alarm" "cloudtrail_delivery"');
      expect(mainContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_errors"');
      expect(mainContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_throttles"');
      expect(mainContent).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_duration"');
    });

    test('should configure alarm actions to SNS', () => {
      const alarmBlocks = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[^{]*\{[\s\S]*?\n\}/g);
      expect(alarmBlocks).toBeTruthy();
      alarmBlocks!.forEach(alarm => {
        expect(alarm).toContain('alarm_actions');
        expect(alarm).toContain('aws_sns_topic.compliance_alerts.arn');
      });
    });

    test('should treat missing data as breaching for CloudTrail alarm', () => {
      const deliveryAlarm = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudtrail_delivery"\s+\{[\s\S]*?\n\}/);
      expect(deliveryAlarm![0]).toContain('treat_missing_data  = "breaching"');
    });
  });

  describe('SNS Configuration', () => {
    test('should create encrypted SNS topic', () => {
      const snsBlock = mainContent.match(/resource\s+"aws_sns_topic"\s+"compliance_alerts"\s+\{[\s\S]*?\n\}/);
      expect(snsBlock).toBeTruthy();
      expect(snsBlock![0]).toContain('kms_master_key_id = aws_kms_key.cloudtrail.id');
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM role for CloudTrail CloudWatch integration', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "cloudtrail_cloudwatch"');
      const roleBlock = mainContent.match(/resource\s+"aws_iam_role"\s+"cloudtrail_cloudwatch"\s+\{[\s\S]*?\n\}/);
      expect(roleBlock![0]).toContain('Service = "cloudtrail.amazonaws.com"');
    });

    test('should attach Lambda basic execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role_policy_attachment" "lambda_basic"');
      expect(mainContent).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow consistent naming pattern', () => {
      const patterns = [
        /vpc-healthcare-\$\{var\.environment\}/,
        /subnet-private.*\$\{var\.environment\}/,
        /application-\$\{var\.environment\}/,
        /iam-role-.*\$\{var\.environment\}/,
        /lambda-compliance.*\$\{var\.environment\}/,
        /sns-compliance.*\$\{var\.environment\}/,
        /cloudtrail-audit-\$\{var\.environment\}/,
        /s3-cloudtrail.*\$\{var\.environment\}/,
        /cloudwatch.*\$\{var\.environment\}/
      ];
      
      patterns.forEach(pattern => {
        expect(mainContent).toMatch(pattern);
      });
    });

    test('should use environment variable in resource names', () => {
      const envVarCount = (mainContent.match(/\$\{var\.environment\}/g) || []).length;
      expect(envVarCount).toBeGreaterThan(10);
    });
  });

  describe('Required Outputs', () => {
    test('should have all critical outputs for integration testing', () => {
      const requiredOutputs = [
        'output "vpc_id"',
        'output "cloudtrail_arn"',
        'output "cloudtrail_name"',
        'output "s3_bucket_name"',
        'output "s3_bucket_arn"',
        'output "kms_key_arn"',
        'output "kms_key_id"',
        'output "lambda_function_name"',
        'output "lambda_function_arn"',
        'output "lambda_role_arn"',
        'output "sns_topic_arn"',
        'output "cloudwatch_log_group_name"',
        'output "security_group_id"',
        'output "account_id"',
        'output "region"'
      ];
      
      requiredOutputs.forEach(output => {
        expect(mainContent).toContain(output);
      });
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(outputBlocks).toBeTruthy();
      outputBlocks!.forEach(output => {
        expect(output).toContain('description =');
      });
    });
  });

  describe('Variables Configuration', () => {
    test('should have all required variables defined', () => {
      const requiredVars = [
        'variable "environment"',
        'variable "region"',
        'variable "vpc_cidr"',
        'variable "private_subnet_cidrs"',
        'variable "lambda_timeout"',
        'variable "lambda_memory"',
        'variable "log_retention_days"',
        'variable "owner"',
        'variable "cost_center"',
        'variable "purpose"',
        'variable "compliance"'
      ];
      
      requiredVars.forEach(varDef => {
        expect(providerContent).toContain(varDef);
      });
    });

    test('should have descriptions and types for all variables', () => {
      const variableBlocks = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(variableBlocks).toBeTruthy();
      variableBlocks!.forEach(variable => {
        expect(variable).toContain('description =');
        expect(variable).toMatch(/type\s+=\s+(string|number|list\(string\))/);
      });
    });

    test('should have default values for variables', () => {
      const variableBlocks = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(variableBlocks).toBeTruthy();
      variableBlocks!.forEach(variable => {
        expect(variable).toContain('default');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const sensitivePatterns = [
        /password\s*=\s*"[^$\{][^"]+"/i,
        /secret\s*=\s*"[^$\{][^"]+"/i,
        /api_key\s*=\s*"[^$\{][^"]+"/i,
        /access_key\s*=\s*"[^$\{][^"]+"/i,
        /private_key\s*=\s*"[^$\{][^"]+"/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use encryption for all data stores', () => {
      // S3 encryption
      expect(mainContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(mainContent).toContain('sse_algorithm     = "aws:kms"');
      
      // CloudWatch Logs encryption
      const cloudwatchLogGroup = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"[\s\S]*?\n\}/);
      expect(cloudwatchLogGroup![0]).toContain('kms_key_id');
      
      // SNS encryption
      const snsTopic = mainContent.match(/resource\s+"aws_sns_topic"\s+"compliance_alerts"[\s\S]*?\n\}/);
      expect(snsTopic![0]).toContain('kms_master_key_id');
    });

    test('should follow least privilege IAM principles', () => {
      const iamPolicyBlocks = mainContent.match(/policy\s*=\s*jsonencode\(\{[\s\S]*?\}\)/g);
      expect(iamPolicyBlocks).toBeTruthy();
      iamPolicyBlocks!.forEach(policy => {
        expect(policy).not.toContain('"Action": "*"');
        expect(policy).not.toContain('"Action" : "*"');
        expect(policy).not.toContain('Action = "*"');
      });
    });

    test('should not expose resources publicly', () => {
      // S3 bucket should block public access
      expect(mainContent).toContain('block_public_acls       = true');
      expect(mainContent).toContain('block_public_policy     = true');
      
      // Security group should not allow 0.0.0.0/0 ingress (except egress is ok)
      expect(mainContent).toContain('resource "aws_security_group" "application"');
      // Check that ingress doesn't have 0.0.0.0/0
      const sgIngressMatch = mainContent.match(/ingress\s+\{[\s\S]*?cidr_blocks\s*=\s*\[[^\]]*\]/g);
      if (sgIngressMatch) {
        sgIngressMatch.forEach(ingress => {
          expect(ingress).not.toContain('0.0.0.0/0');
        });
      }
    });
  });

  describe('Compliance and Tagging', () => {
    test('should have required tags on resources', () => {
      const taggedResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_security_group',
        'aws_kms_key',
        'aws_s3_bucket',
        'aws_cloudtrail',
        'aws_lambda_function',
        'aws_sns_topic',
        'aws_cloudwatch_log_group',
        'aws_iam_role'
      ];
      
      taggedResources.forEach(resourceType => {
        const resourceBlocks = mainContent.match(new RegExp(`resource\\s+"${resourceType}"[^{]*\\{[\\s\\S]*?\\n\\}`, 'g'));
        if (resourceBlocks) {
          resourceBlocks.forEach(block => {
            const hasInlineTags = block.includes('tags = {') || block.includes('tags = ');
            const hasDefaultTags = providerContent.includes('default_tags');
            expect(hasInlineTags || hasDefaultTags).toBe(true);
          });
        }
      });
    });

    test('should have default tags configured in provider', () => {
      // Just check for the presence of default_tags configuration
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment = var.environment');
      expect(providerContent).toContain('Owner       = var.owner');
      expect(providerContent).toContain('CostCenter  = var.cost_center');
      expect(providerContent).toContain('Purpose     = var.purpose');
      expect(providerContent).toContain('Compliance  = var.compliance');
    });
  });

  describe('Lambda Code File Validation', () => {
    test('should have lambda_compliance.py with proper structure', () => {
      const lambdaPath = path.join(libPath, 'lambda_compliance.py');
      if (fs.existsSync(lambdaPath)) {
        const lambdaContent = fs.readFileSync(lambdaPath, 'utf8');
        
        // Check for handler function
        expect(lambdaContent).toContain('def lambda_handler');
        expect(lambdaContent).toContain('event');
        expect(lambdaContent).toContain('context');
        
        // Check for imports
        expect(lambdaContent).toMatch(/import\s+(json|boto3|os)/);
      }
    });

    test('should reference correct handler in Lambda function', () => {
      const lambdaBlock = mainContent.match(/resource\s+"aws_lambda_function"\s+"compliance_checker"[\s\S]*?\n\}/);
      expect(lambdaBlock![0]).toContain('handler          = "lambda_compliance.lambda_handler"');
    });
  });

  describe('Terraform Plan Readiness', () => {
    test('should have all required providers', () => {
      // Check with flexible spacing
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });

    test('should have proper depends_on for resource ordering', () => {
      // CloudTrail depends on S3 bucket policy
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"[\s\S]*?\n\}/);
      expect(cloudtrailBlock![0]).toContain('depends_on');
      expect(cloudtrailBlock![0]).toContain('aws_s3_bucket_policy.cloudtrail_logs');
      
      // Log subscription filter depends on Lambda permission
      const filterBlock = mainContent.match(/resource\s+"aws_cloudwatch_log_subscription_filter"\s+"compliance_events"[\s\S]*?\n\}/);
      expect(filterBlock![0]).toContain('depends_on');
      expect(filterBlock![0]).toContain('aws_lambda_permission.cloudwatch_logs');
    });

    test('should use proper data source references', () => {
      expect(mainContent).toContain('data.aws_caller_identity.current.account_id');
      expect(mainContent).toContain('data.aws_region.current.name');
      expect(mainContent).toContain('data.aws_availability_zones.available');
    });
  });

  describe('Cost Optimization', () => {
    test('should use appropriate instance sizes for testing', () => {
      // Check Lambda memory configuration with flexible spacing
      const lambdaMemoryVar = providerContent.match(/variable\s+"lambda_memory"[\s\S]*?default\s*=\s*(\d+)/);
      expect(lambdaMemoryVar).toBeTruthy();
      const memorySize = parseInt(lambdaMemoryVar![1]);
      expect(memorySize).toBeLessThanOrEqual(512);
      expect(memorySize).toBeGreaterThanOrEqual(128);
    });

    test('should have retention policies to control costs', () => {
      // Check log retention variable with flexible spacing
      const retentionVar = providerContent.match(/variable\s+"log_retention_days"[\s\S]*?default\s*=\s*(\d+)/);
      expect(retentionVar).toBeTruthy();
      const retention = parseInt(retentionVar![1]);
      expect(retention).toBeLessThanOrEqual(30);
      expect(retention).toBeGreaterThan(0);
    });

    test('should enable force_destroy for easy cleanup', () => {
      // S3 bucket should have force_destroy
      const s3Bucket = mainContent.match(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"[\s\S]*?\n\}/);
      expect(s3Bucket![0]).toContain('force_destroy = true');
      
      // KMS key should have short deletion window
      const kmsKey = mainContent.match(/resource\s+"aws_kms_key"\s+"cloudtrail"[\s\S]*?tags\s*=\s*\{[^}]*\}[\s\S]*?\n\}/);
      expect(kmsKey![0]).toContain('deletion_window_in_days = 7');
    });
  });

  describe('Error Handling and Monitoring', () => {
    test('should have comprehensive CloudWatch alarms', () => {
      const alarmTypes = [
        'cloudtrail_delivery',
        'lambda_errors',
        'lambda_throttles',
        'lambda_duration'
      ];
      
      alarmTypes.forEach(alarmType => {
        expect(mainContent).toContain(`resource "aws_cloudwatch_metric_alarm" "${alarmType}"`);
      });
    });

    test('should configure alarm thresholds appropriately', () => {
      // Lambda errors alarm
      const errorsAlarm = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"[\s\S]*?\n\}/);
      expect(errorsAlarm![0]).toContain('threshold           = "5"');
      
      // Lambda throttles alarm
      const throttlesAlarm = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"[\s\S]*?\n\}/);
      expect(throttlesAlarm![0]).toContain('threshold           = "1"');
      
      // Lambda duration alarm
      const durationAlarm = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"[\s\S]*?\n\}/);
      expect(durationAlarm![0]).toContain('threshold           = "30000"');
    });

    test('should treat missing data appropriately in alarms', () => {
      const deliveryAlarm = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudtrail_delivery"[\s\S]*?\n\}/);
      expect(deliveryAlarm![0]).toContain('treat_missing_data  = "breaching"');
    });
  });

  describe('Archive Configuration for Lambda', () => {
    test('should properly configure archive_file data source', () => {
      const archiveBlock = mainContent.match(/data\s+"archive_file"\s+"lambda_compliance"[\s\S]*?\n\}/);
      expect(archiveBlock).toBeTruthy();
      expect(archiveBlock![0]).toContain('type        = "zip"');
      expect(archiveBlock![0]).toContain('source_file = "${path.module}/lambda_compliance.py"');
      expect(archiveBlock![0]).toContain('output_path = "${path.module}/lambda_compliance.zip"');
    });
  });

  describe('Variable Types and Validation', () => {
    test('should use appropriate variable types', () => {
      expect(providerContent).toMatch(/type\s*=\s*string/);
      expect(providerContent).toMatch(/type\s*=\s*number/);
      expect(providerContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test('should have HIPAA compliance tag', () => {
      const complianceVar = providerContent.match(/variable\s+"compliance"[\s\S]*?default\s*=\s*"([^"]+)"/);
      expect(complianceVar).toBeTruthy();
      expect(complianceVar![1]).toBe('HIPAA');
    });
  });

  describe('Integration Points', () => {
    test('should have CloudWatch Log subscription filter properly connected', () => {
      const subscriptionFilter = mainContent.match(/resource\s+"aws_cloudwatch_log_subscription_filter"\s+"compliance_events"[\s\S]*?\n\}/);
      expect(subscriptionFilter![0]).toContain('log_group_name  = aws_cloudwatch_log_group.cloudtrail.name');
      expect(subscriptionFilter![0]).toContain('destination_arn = aws_lambda_function.compliance_checker.arn');
    });

    test('should have CloudTrail integrated with CloudWatch Logs', () => {
      const cloudtrailBlock = mainContent.match(/resource\s+"aws_cloudtrail"\s+"audit"[\s\S]*?\n\}/);
      expect(cloudtrailBlock![0]).toContain('cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"');
      expect(cloudtrailBlock![0]).toContain('cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn');
    });
  });

  describe('Resource Limits and Constraints', () => {
    test('should set appropriate Lambda timeout', () => {
      const timeoutVar = providerContent.match(/variable\s+"lambda_timeout"[\s\S]*?default\s*=\s*(\d+)/);
      expect(timeoutVar).toBeTruthy();
      const timeout = parseInt(timeoutVar![1]);
      expect(timeout).toBeGreaterThanOrEqual(30);
      expect(timeout).toBeLessThanOrEqual(900); // Max 15 minutes
    });

    test('should use reasonable subnet count', () => {
      const subnetVar = providerContent.match(/variable\s+"private_subnet_cidrs"[\s\S]*?default\s*=\s*\[([\s\S]*?)\]/);
      expect(subnetVar).toBeTruthy();
      const subnets = subnetVar![1].split(',');
      expect(subnets.length).toBeGreaterThanOrEqual(2); // At least 2 for HA
      expect(subnets.length).toBeLessThanOrEqual(4); // Not too many for testing
    });
  });
});

// Export for coverage reporting
export {};