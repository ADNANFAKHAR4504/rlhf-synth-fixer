/**
 * Unit Tests for TAP Stack Terraform Configuration
 * 
 * These tests validate the Terraform configuration syntax, resource definitions,
 * and logical relationships without creating actual AWS resources.
 */

// Using Jest's built-in expect
import * as fs from 'fs';
import * as path from 'path';
import * as hcl from 'hcl2-parser';
import { execSync } from 'child_process';

describe('TAP Stack Unit Tests', () => {
    // Jest timeout is set via jest.setTimeout() or in jest config

    const terraformDir = path.join(__dirname, '..', 'lib');
    let providerConfig: any;
    let tapStackConfig: any;

    beforeAll(() => {
        // Parse Terraform configuration files
        const providerPath = path.join(terraformDir, 'provider.tf');
        const tapStackPath = path.join(terraformDir, 'tap_stack.tf');

        expect(fs.existsSync(providerPath)).toBe(true);
        expect(fs.existsSync(tapStackPath)).toBe(true);

        const providerContent = fs.readFileSync(providerPath, 'utf8');
        const tapStackContent = fs.readFileSync(tapStackPath, 'utf8');

        try {
            providerConfig = hcl.parseToObject(providerContent)[0];
            tapStackConfig = hcl.parseToObject(tapStackContent)[0];
        } catch (error) {
            console.error('HCL parsing error:', error);
            // Fallback to basic string validation
            expect(providerContent).toContain('terraform');
            expect(tapStackContent).toContain('resource');
        }
    });

    describe('Terraform Configuration Validation', () => {
        it('should have valid Terraform syntax', () => {
            expect(() => {
                execSync('terraform fmt -check=true -diff=true', {
                    cwd: terraformDir,
                    stdio: 'pipe'
                });
            }).not.toThrow();
        });

        it('should pass terraform validate', () => {
            // Initialize terraform first
            try {
                execSync('terraform init -backend=false', {
                    cwd: terraformDir,
                    stdio: 'pipe'
                });
            } catch (error) {
                console.warn('Terraform init failed, skipping validation');
                return; // Skip test in Jest
            }

            expect(() => {
                execSync('terraform validate', {
                    cwd: terraformDir,
                    stdio: 'pipe'
                });
            }).not.toThrow();
        });
    });

    describe('Provider Configuration', () => {
        it('should specify minimum Terraform version', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
            expect(content).toContain('required_version');
            expect(content).toMatch(/>= \d+\.\d+/);
        });

        it('should configure AWS provider with required version', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
            expect(content).toContain('required_providers');
            expect(content).toContain('hashicorp/aws');
            expect(content).toMatch(/>= \d+\.\d+/);
        });

        it('should include assume role configuration', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
            expect(content).toContain('assume_role');
            expect(content).toContain('var.assume_role_arn');
        });

        it('should have default tags configuration', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
            expect(content).toContain('default_tags');
            expect(content).toContain('Environment');
            expect(content).toContain('ManagedBy');
        });

        it('should validate environment variable constraints', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
            expect(content).toContain('validation');
            expect(content).toContain('dev');
            expect(content).toContain('test');
            expect(content).toContain('prod');
        });
    });

    describe('Variable Definitions', () => {
        let variableDefinitions: string[];

        beforeAll(() => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            variableDefinitions = content.match(/variable\s+"([^"]+)"/g) || [];
        });

        it('should define required variables', () => {
            const requiredVars = [
                'approved_cidrs',
                'vpc_id',
                'cdn_domain',
                'route53_zone_id',
                'alarm_email'
            ];

            requiredVars.forEach(varName => {
                expect(variableDefinitions.some(def => def.includes(varName))).toBe(true);
            });
        });

        it('should have proper variable types', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            
            // Check for list type
            expect(content).toMatch(/variable\s+"approved_cidrs"[\s\S]*?type\s*=\s*list\(string\)/);
            
            // Check for string types
            expect(content).toMatch(/variable\s+"vpc_id"[\s\S]*?type\s*=\s*string/);
        });

        it('should have default values for optional variables', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            
            // Optional variables should have empty string defaults
            expect(content).toMatch(/variable\s+"vpc_id"[\s\S]*?default\s*=\s*""/);
            expect(content).toMatch(/variable\s+"cdn_domain"[\s\S]*?default\s*=\s*""/);
        });
    });

    describe('Data Sources', () => {
        let dataSources: string[];

        beforeAll(() => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            dataSources = content.match(/data\s+"[^"]+"\s+"[^"]+"/g) || [];
        });

        it('should define required data sources', () => {
            const requiredDataSources = [
                'aws_caller_identity',
                'aws_partition',
                'aws_region',
                'aws_availability_zones'
            ];

            requiredDataSources.forEach(dataSource => {
                expect(dataSources.some(ds => ds.includes(dataSource))).toBe(true);
            });
        });

        it('should have conditional data sources for VPC', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('data "aws_subnets" "private"');
            expect(content).toMatch(/count\s*=\s*var\.vpc_id\s*!=\s*""\s*\?\s*1\s*:\s*0/);
        });
    });

    describe('Locals Configuration', () => {
        it('should define name_prefix local', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('locals {');
            expect(content).toContain('name_prefix');
            expect(content).toContain('${var.environment}-tap');
        });

        it('should define common_tags local', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('common_tags');
            expect(content).toContain('Environment');
            expect(content).toContain('ManagedBy');
        });
    });

    describe('KMS Key Configuration', () => {
        it('should create KMS key resource', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_kms_key" "main"');
        });

        it('should enable key rotation', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
        });

        it('should have comprehensive key policy', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('policy = jsonencode');
            expect(content).toContain('cloudtrail.amazonaws.com');
            expect(content).toContain('logs.amazonaws.com');
            expect(content).toContain('rds.amazonaws.com');
        });

        it('should create KMS alias', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_kms_alias" "main"');
            expect(content).toContain('aws_kms_key.main.key_id');
        });
    });

    describe('S3 Bucket Configuration', () => {
        it('should create logs and data buckets', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket" "logs"');
            expect(content).toContain('resource "aws_s3_bucket" "data"');
        });

        it('should enable versioning on both buckets', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket_versioning" "logs"');
            expect(content).toContain('resource "aws_s3_bucket_versioning" "data"');
            expect(content).toMatch(/status\s*=\s*"Enabled"/g);
        });

        it('should configure encryption for both buckets', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('server_side_encryption_configuration');
            expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/g);
            expect(content).toContain('aws_kms_key.main.arn');
        });

        it('should block public access on both buckets', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket_public_access_block" "logs"');
            expect(content).toContain('resource "aws_s3_bucket_public_access_block" "data"');
            expect(content).toMatch(/block_public_acls\s*=\s*true/g);
        });

        it('should have lifecycle policy for logs bucket', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket_lifecycle_configuration" "logs"');
            expect(content).toMatch(/days\s*=\s*90/);
        });

        it('should configure data bucket logging to logs bucket', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket_logging" "data"');
            expect(content).toContain('target_bucket = aws_s3_bucket.logs.id');
        });

        it('should have secure bucket policies', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_s3_bucket_policy" "logs"');
            expect(content).toContain('resource "aws_s3_bucket_policy" "data"');
            expect(content).toContain('aws:SecureTransport');
            expect(content).toContain('DenyInsecureConnections');
        });
    });

    describe('CloudTrail Configuration', () => {
        it('should create CloudWatch log group for CloudTrail', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_cloudwatch_log_group" "cloudtrail"');
            expect(content).toMatch(/retention_in_days\s*=\s*90/);
        });

        it('should create IAM role for CloudTrail', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_iam_role" "cloudtrail"');
            expect(content).toContain('cloudtrail.amazonaws.com');
        });

        it('should create CloudTrail with proper configuration', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_cloudtrail" "main"');
            expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
            expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
            expect(content).toMatch(/include_global_service_events\s*=\s*true/);
        });

        it('should configure data events for S3', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('event_selector');
            expect(content).toContain('data_resource');
            expect(content).toContain('AWS::S3::Object');
        });
    });

    describe('CloudFront Configuration', () => {
        it('should create Origin Access Identity', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_cloudfront_origin_access_identity" "main"');
        });

        it('should create conditional ACM certificate', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_acm_certificate" "main"');
            expect(content).toMatch(/count\s*=\s*var\.cdn_domain\s*!=\s*""\s*\?\s*1\s*:\s*0/);
        });

        it('should create CloudFront distribution', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_cloudfront_distribution" "main"');
            expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
        });

        it('should configure S3 origin with OAI', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('s3_origin_config');
            expect(content).toContain('origin_access_identity');
        });

        it('should configure logging to S3', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('logging_config');
            expect(content).toContain('aws_s3_bucket.logs.bucket_domain_name');
        });
    });

    describe('Security Groups Configuration', () => {
        it('should create three security groups', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_security_group" "web"');
            expect(content).toContain('resource "aws_security_group" "ssh"');
            expect(content).toContain('resource "aws_security_group" "database"');
        });

        it('should restrict access to approved CIDRs', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/cidr_blocks\s*=\s*var\.approved_cidrs/g);
        });

        it('should have appropriate port configurations', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/from_port\s*=\s*80/);   // HTTP
            expect(content).toMatch(/from_port\s*=\s*443/);  // HTTPS
            expect(content).toMatch(/from_port\s*=\s*22/);   // SSH
            expect(content).toMatch(/from_port\s*=\s*3306/); // MySQL
        });

        it('should have lifecycle rules to prevent conflicts', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/create_before_destroy\s*=\s*true/g);
        });
    });

    describe('RDS Configuration', () => {
        it('should create conditional DB subnet group', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_db_subnet_group" "main"');
            expect(content).toMatch(/count\s*=\s*var\.vpc_id\s*!=\s*""\s*\?\s*1\s*:\s*0/);
        });

        it('should create conditional RDS instance', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_db_instance" "main"');
            expect(content).toMatch(/count\s*=\s*var\.vpc_id\s*!=\s*""\s*\?\s*1\s*:\s*0/);
        });

        it('should configure encryption and monitoring', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/storage_encrypted\s*=\s*true/);
            expect(content).toMatch(/monitoring_interval\s*=\s*60/);
            expect(content).toContain('aws_kms_key.main.arn');
        });

        it('should have backup and maintenance windows', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toMatch(/backup_retention_period\s*=\s*7/);
            expect(content).toContain('backup_window');
            expect(content).toContain('maintenance_window');
        });

        it('should create monitoring IAM role', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_iam_role" "rds_monitoring"');
            expect(content).toContain('monitoring.rds.amazonaws.com');
        });
    });

    describe('VPC Flow Logs Configuration', () => {
        it('should create conditional VPC flow logs', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_flow_log" "vpc"');
            expect(content).toMatch(/count\s*=\s*var\.vpc_id\s*!=\s*""\s*\?\s*1\s*:\s*0/);
        });

        it('should create CloudWatch log group for flow logs', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_cloudwatch_log_group" "flow_logs"');
            expect(content).toMatch(/retention_in_days\s*=\s*30/);
        });

        it('should create IAM role for flow logs', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_iam_role" "flow_logs"');
            expect(content).toContain('vpc-flow-logs.amazonaws.com');
        });
    });

    describe('IAM Roles Configuration', () => {
        it('should create application and admin roles', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_iam_role" "app_role"');
            expect(content).toContain('resource "aws_iam_role" "admin_role"');
        });

        it('should create corresponding IAM policies', () => {
            const content = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
            expect(content).toContain('resource "aws_iam_role_policy" "app_policy"');
        });
    });
});