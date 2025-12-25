// Unit tests for Terraform HCL configuration
// Tests verify infrastructure configuration without deploying

import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Configuration Unit Tests', () => {
  let tfFiles: { [key: string]: any } = {};

  beforeAll(async () => {
    // Read all .tf files
    const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      try {
        tfFiles[file] = await parse(content);
      } catch (e) {
        // If parsing fails, store raw content for basic checks
        tfFiles[file] = { _raw: content };
      }
    }
  });

  describe('File Structure', () => {
    test('provider.tf exists and contains backend configuration', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toContain('backend "s3"');
      expect(content).toContain('provider "aws"');
    });

    test('variables.tf exists and defines required variables', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
      const content = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('variable "db_password"');
    });

    test('outputs.tf exists and defines outputs', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toContain('output ');
    });
  });

  describe('KMS Configuration (kms.tf)', () => {
    let kmsContent: string;

    beforeAll(() => {
      kmsContent = fs.readFileSync(path.join(LIB_DIR, 'kms.tf'), 'utf8');
    });

    test('defines 4 customer-managed KMS keys', () => {
      const keyMatches = kmsContent.match(/resource\s+"aws_kms_key"/g);
      expect(keyMatches).toHaveLength(4);
    });

    test('all KMS keys have rotation enabled', () => {
      const rotationMatches = kmsContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toHaveLength(4);
    });

    test('all KMS keys have 7-day deletion window', () => {
      const deletionMatches = kmsContent.match(/deletion_window_in_days\s*=\s*7/g);
      expect(deletionMatches).toHaveLength(4);
    });

    test('all KMS keys include environment_suffix in name', () => {
      const suffixMatches = kmsContent.match(/var\.environment_suffix/g);
      expect(suffixMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test('defines KMS aliases for all keys', () => {
      const aliasMatches = kmsContent.match(/resource\s+"aws_kms_alias"/g);
      expect(aliasMatches).toHaveLength(4);
    });
  });

  describe('VPC Configuration (vpc.tf)', () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(path.join(LIB_DIR, 'vpc.tf'), 'utf8');
    });

    test('defines VPC with DNS support enabled', () => {
      expect(vpcContent).toContain('resource "aws_vpc"');
      expect(vpcContent).toContain('enable_dns_hostnames = true');
      expect(vpcContent).toContain('enable_dns_support   = true');
    });

    test('defines 3 private subnets across availability zones', () => {
      const subnetMatches = vpcContent.match(/resource\s+"aws_subnet"\s+"private"/g);
      expect(subnetMatches).toHaveLength(1);
      expect(vpcContent).toContain('count             = 3');
    });

    test('no public subnets or internet gateway defined', () => {
      expect(vpcContent).not.toContain('aws_subnet" "public');
      expect(vpcContent).not.toContain('aws_internet_gateway');
    });

    test('defines VPC endpoints for S3 and RDS', () => {
      const s3EndpointMatches = vpcContent.match(/resource\s+"aws_vpc_endpoint"\s+"s3"/g);
      const rdsEndpointMatches = vpcContent.match(/resource\s+"aws_vpc_endpoint"\s+"rds"/g);
      expect(s3EndpointMatches).toHaveLength(1);
      expect(rdsEndpointMatches).toHaveLength(1);
    });

    test('S3 VPC endpoint is Gateway type', () => {
      expect(vpcContent).toContain('vpc_endpoint_type = "Gateway"');
    });

    test('RDS VPC endpoint is Interface type with private DNS', () => {
      expect(vpcContent).toContain('vpc_endpoint_type   = "Interface"');
      expect(vpcContent).toContain('private_dns_enabled = true');
    });

    test('all resources include environment_suffix', () => {
      const suffixMatches = vpcContent.match(/var\.environment_suffix/g);
      expect(suffixMatches!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('RDS Configuration (rds.tf)', () => {
    let rdsContent: string;

    beforeAll(() => {
      rdsContent = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
    });

    test('defines RDS PostgreSQL instance', () => {
      expect(rdsContent).toContain('resource "aws_db_instance"');
      expect(rdsContent).toContain('engine         = "postgres"');
    });

    test('RDS has storage encryption enabled', () => {
      expect(rdsContent).toContain('storage_encrypted     = true');
      expect(rdsContent).toContain('kms_key_id            = aws_kms_key.rds.arn');
    });

    test('RDS has Multi-AZ enabled', () => {
      expect(rdsContent).toContain('multi_az                = true');
    });

    test('RDS is not publicly accessible', () => {
      expect(rdsContent).toContain('publicly_accessible     = false');
    });

    test('RDS has deletion protection disabled for testing', () => {
      expect(rdsContent).toContain('deletion_protection     = false');
    });

    test('RDS has skip_final_snapshot enabled for testing', () => {
      expect(rdsContent).toContain('skip_final_snapshot     = true');
    });

    test('RDS has parameter group with SSL enforcement', () => {
      expect(rdsContent).toContain('resource "aws_db_parameter_group"');
      expect(rdsContent).toContain('rds.force_ssl');
      expect(rdsContent).toContain('value = "1"');
    });

    test('RDS has CloudWatch logs exports enabled', () => {
      expect(rdsContent).toContain('enabled_cloudwatch_logs_exports');
      expect(rdsContent).toContain('postgresql');
    });

    test('RDS resources include environment_suffix', () => {
      const suffixMatches = rdsContent.match(/var\.environment_suffix/g);
      expect(suffixMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('S3 Configuration (s3.tf)', () => {
    let s3Content: string;

    beforeAll(() => {
      s3Content = fs.readFileSync(path.join(LIB_DIR, 's3.tf'), 'utf8');
    });

    test('defines 2 S3 buckets (data and flow logs)', () => {
      const bucketMatches = s3Content.match(/resource\s+"aws_s3_bucket"/g);
      expect(bucketMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('all buckets have versioning enabled', () => {
      const versioningMatches = s3Content.match(/resource\s+"aws_s3_bucket_versioning"/g);
      expect(versioningMatches!.length).toBeGreaterThanOrEqual(2);
      expect(s3Content).toContain('status = "Enabled"');
    });

    test('all buckets have KMS encryption', () => {
      const encryptionMatches = s3Content.match(/sse_algorithm\s*=\s*"aws:kms"/g);
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('all buckets use customer-managed KMS keys', () => {
      const kmsKeyMatches = s3Content.match(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/g);
      expect(kmsKeyMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('all buckets block public access', () => {
      const publicBlockMatches = s3Content.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicBlockMatches!.length).toBeGreaterThanOrEqual(2);
      expect(s3Content).toContain('block_public_acls       = true');
      expect(s3Content).toContain('block_public_policy     = true');
    });

    test('data bucket has policy denying unencrypted uploads', () => {
      expect(s3Content).toContain('DenyUnencryptedObjectUploads');
      expect(s3Content).toContain('s3:x-amz-server-side-encryption');
    });

    test('flow logs bucket has lifecycle policy', () => {
      expect(s3Content).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(s3Content).toContain('days = 90');
    });

    test('buckets have force_destroy enabled for testing', () => {
      const forceDestroyMatches = s3Content.match(/force_destroy\s*=\s*true/g);
      expect(forceDestroyMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lambda Configuration (lambda.tf)', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(LIB_DIR, 'lambda.tf'), 'utf8');
    });

    test('defines Lambda function', () => {
      expect(lambdaContent).toContain('resource "aws_lambda_function"');
      expect(lambdaContent).toContain('runtime          = "python3.11"');
    });

    test('Lambda has VPC configuration', () => {
      expect(lambdaContent).toContain('vpc_config {');
      expect(lambdaContent).toContain('subnet_ids');
      expect(lambdaContent).toContain('security_group_ids');
    });

    test('Lambda has encrypted environment variables', () => {
      expect(lambdaContent).toContain('kms_key_arn = aws_kms_key.lambda.arn');
      expect(lambdaContent).toContain('environment {');
    });

    test('Lambda has dead letter queue configured', () => {
      expect(lambdaContent).toContain('dead_letter_config {');
      expect(lambdaContent).toContain('target_arn = aws_sqs_queue.dlq.arn');
    });

    test('Lambda depends on CloudWatch log group', () => {
      expect(lambdaContent).toContain('depends_on = [');
      expect(lambdaContent).toContain('aws_cloudwatch_log_group.lambda');
    });

    test('defines SQS dead letter queue with KMS encryption', () => {
      expect(lambdaContent).toContain('resource "aws_sqs_queue" "dlq"');
      expect(lambdaContent).toContain('kms_master_key_id');
    });
  });

  describe('IAM Configuration (iam.tf)', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
    });

    test('defines Lambda execution role', () => {
      expect(iamContent).toContain('resource "aws_iam_role" "lambda_execution"');
    });

    test('Lambda role has 1-hour max session duration', () => {
      expect(iamContent).toContain('max_session_duration = 3600');
    });

    test('Lambda role does not have external ID for service principal', () => {
      const lambdaRoleStart = iamContent.indexOf('resource "aws_iam_role" "lambda_execution"');
      const lambdaRoleEnd = iamContent.indexOf('}', lambdaRoleStart + 100);
      const lambdaRoleContent = iamContent.substring(lambdaRoleStart, lambdaRoleEnd);
      expect(lambdaRoleContent).not.toContain('ExternalId');
    });

    test('defines custom IAM policy for S3 access', () => {
      expect(iamContent).toContain('resource "aws_iam_policy" "lambda_s3_access"');
      expect(iamContent).toContain('s3:GetObject');
      expect(iamContent).toContain('s3:PutObject');
    });

    test('attaches managed policies for Lambda execution', () => {
      expect(iamContent).toContain('AWSLambdaBasicExecutionRole');
      expect(iamContent).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    test('defines VPC Flow Logs role', () => {
      expect(iamContent).toContain('resource "aws_iam_role" "flow_logs"');
    });

    test('defines RDS monitoring role', () => {
      expect(iamContent).toContain('resource "aws_iam_role" "rds_monitoring"');
    });
  });

  describe('CloudWatch Configuration (cloudwatch.tf)', () => {
    let cloudwatchContent: string;

    beforeAll(() => {
      cloudwatchContent = fs.readFileSync(path.join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
    });

    test('defines 3 log groups (Lambda, Flow Logs, RDS)', () => {
      const logGroupMatches = cloudwatchContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
      expect(logGroupMatches).toHaveLength(3);
    });

    test('all log groups have 90-day retention', () => {
      const retentionMatches = cloudwatchContent.match(/retention_in_days\s*=\s*90/g);
      expect(retentionMatches).toHaveLength(3);
    });

    test('all log groups have KMS encryption', () => {
      const kmsMatches = cloudwatchContent.match(/kms_key_id\s*=\s*aws_kms_key\.cloudwatch\.arn/g);
      expect(kmsMatches).toHaveLength(3);
    });

    test('defines CloudWatch alarms for security monitoring', () => {
      const alarmMatches = cloudwatchContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
      expect(alarmMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test('defines metric filter for encryption violations', () => {
      expect(cloudwatchContent).toContain('resource "aws_cloudwatch_log_metric_filter"');
      expect(cloudwatchContent).toContain('encryption-violations');
    });

    test('alarm for RDS connection failures exists', () => {
      expect(cloudwatchContent).toContain('rds-connection-failures');
      expect(cloudwatchContent).toContain('DatabaseConnections');
    });

    test('alarm for Lambda errors exists', () => {
      expect(cloudwatchContent).toContain('lambda-errors');
      expect(cloudwatchContent).toContain('Errors');
    });

    test('alarm for failed authentication exists', () => {
      expect(cloudwatchContent).toContain('failed-authentication');
      expect(cloudwatchContent).toContain('Throttles');
    });
  });

  describe('VPC Flow Logs Configuration (flow_logs.tf)', () => {
    let flowLogsContent: string;

    beforeAll(() => {
      flowLogsContent = fs.readFileSync(path.join(LIB_DIR, 'flow_logs.tf'), 'utf8');
    });

    test('defines VPC Flow Logs to S3', () => {
      expect(flowLogsContent).toContain('resource "aws_flow_log" "vpc_to_s3"');
      expect(flowLogsContent).toContain('log_destination_type = "s3"');
    });

    test('defines VPC Flow Logs to CloudWatch', () => {
      expect(flowLogsContent).toContain('resource "aws_flow_log" "vpc_to_cloudwatch"');
      expect(flowLogsContent).toContain('log_destination = aws_cloudwatch_log_group.flow_logs.arn');
    });

    test('flow logs capture all traffic', () => {
      const trafficTypeMatches = flowLogsContent.match(/traffic_type\s*=\s*"ALL"/g);
      expect(trafficTypeMatches).toHaveLength(2);
    });
  });

  describe('Security Groups Configuration', () => {
    let lambdaContent: string;
    let rdsContent: string;
    let vpcContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(LIB_DIR, 'lambda.tf'), 'utf8');
      rdsContent = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
      vpcContent = fs.readFileSync(path.join(LIB_DIR, 'vpc.tf'), 'utf8');
    });

    test('Lambda security group allows outbound HTTPS', () => {
      expect(lambdaContent).toContain('egress {');
      expect(lambdaContent).toContain('from_port   = 443');
      expect(lambdaContent).toContain('to_port     = 443');
    });

    test('RDS security group ingress from Lambda only', () => {
      expect(rdsContent).toContain('from_port                = 5432');
      expect(rdsContent).toContain('to_port                  = 5432');
    });

    test('security group rules use separate resources to avoid circular dependency', () => {
      expect(rdsContent).toContain('resource "aws_security_group_rule" "rds_from_lambda"');
      expect(lambdaContent).toContain('resource "aws_security_group_rule" "lambda_to_rds"');
    });

    test('VPC endpoint security group allows HTTPS from VPC', () => {
      expect(vpcContent).toContain('ingress {');
      expect(vpcContent).toContain('from_port   = 443');
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    });

    test('outputs VPC ID', () => {
      expect(outputsContent).toContain('output "vpc_id"');
    });

    test('outputs private subnet IDs', () => {
      expect(outputsContent).toContain('output "private_subnet_ids"');
    });

    test('outputs RDS endpoint (marked sensitive)', () => {
      expect(outputsContent).toContain('output "rds_endpoint"');
      expect(outputsContent).toContain('sensitive');
    });

    test('outputs Lambda function details', () => {
      expect(outputsContent).toContain('output "lambda_function_name"');
      expect(outputsContent).toContain('output "lambda_function_arn"');
    });

    test('outputs S3 bucket names', () => {
      expect(outputsContent).toContain('output "s3_data_bucket"');
      expect(outputsContent).toContain('output "s3_flow_logs_bucket"');
    });

    test('outputs KMS key IDs', () => {
      expect(outputsContent).toContain('output "kms_key_ids"');
    });

    test('outputs security group IDs', () => {
      expect(outputsContent).toContain('output "security_group_ids"');
    });

    test('outputs CloudWatch log groups', () => {
      expect(outputsContent).toContain('output "cloudwatch_log_groups"');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource files include environment_suffix in resource names', () => {
      const files = ['kms.tf', 'vpc.tf', 'rds.tf', 's3.tf', 'lambda.tf', 'iam.tf', 'cloudwatch.tf', 'flow_logs.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        const suffixMatches = content.match(/var\.environment_suffix/g);
        expect(suffixMatches!.length).toBeGreaterThan(0);
      });
    });

    test('no hardcoded environment values in resource names', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-prod-/);
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-dev-/);
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-staging-/);
      });
    });
  });

  describe('Compliance and Security Requirements', () => {
    test('no Retain policies on any resources', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      files.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toContain('prevent_destroy');
        expect(content).not.toContain('Retain');
      });
    });

    test('all KMS keys deletable for testing', () => {
      const kmsContent = fs.readFileSync(path.join(LIB_DIR, 'kms.tf'), 'utf8');
      const deletionMatches = kmsContent.match(/deletion_window_in_days\s*=\s*7/g);
      expect(deletionMatches).toHaveLength(4);
    });

    test('provider has default tags for compliance', () => {
      const providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('DataClassification');
      expect(providerContent).toContain('Owner');
      expect(providerContent).toContain('ManagedBy');
    });
  });
});
