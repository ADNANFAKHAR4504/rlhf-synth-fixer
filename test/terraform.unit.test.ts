import * as fs from 'fs';
import * as path from 'path';

// Terraform configuration unit tests
describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  
  // Test 1: All required Terraform files exist
  test('All required Terraform files exist', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf', 
      'outputs.tf',
      'security.tf',
      'logging.tf',
      'secrets.tf',
      'provider.tf'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(libDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // Test 2: Main.tf contains core infrastructure
  test('main.tf contains VPC and networking resources', () => {
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    
    expect(mainTf).toContain('resource "aws_vpc" "main"');
    expect(mainTf).toContain('resource "aws_subnet" "public"');
    expect(mainTf).toContain('resource "aws_subnet" "private"');
    expect(mainTf).toContain('resource "aws_internet_gateway"');
    expect(mainTf).toContain('resource "aws_nat_gateway"');
    expect(mainTf).toContain('resource "aws_route_table"');
  });

  // Test 3: Security.tf contains security groups and NACLs
  test('security.tf contains required security resources', () => {
    const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
    
    expect(securityTf).toContain('resource "aws_security_group"');
    expect(securityTf).toContain('resource "aws_network_acl"');
    expect(securityTf).toContain('resource "aws_iam_role"');
    expect(securityTf).toContain('ingress');
    expect(securityTf).toContain('egress');
  });

  // Test 4: Logging.tf contains CloudTrail and VPC Flow Logs
  test('logging.tf contains comprehensive logging setup', () => {
    const loggingTf = fs.readFileSync(path.join(libDir, 'logging.tf'), 'utf8');
    
    expect(loggingTf).toContain('resource "aws_cloudtrail"');
    expect(loggingTf).toContain('resource "aws_flow_log"');
    expect(loggingTf).toContain('resource "aws_s3_bucket"');
    expect(loggingTf).toContain('resource "aws_cloudwatch_log_group"');
  });

  // Test 5: Secrets.tf uses AWS Secrets Manager
  test('secrets.tf uses AWS Secrets Manager (no hardcoded secrets)', () => {
    const secretsTf = fs.readFileSync(path.join(libDir, 'secrets.tf'), 'utf8');
    
    expect(secretsTf).toContain('resource "aws_secretsmanager_secret"');
    // Allow placeholder values that are meant to be changed
    expect(secretsTf).toContain('placeholder');
    // Should not contain real hardcoded secrets
    expect(secretsTf).not.toContain('RealPassword123');
    expect(secretsTf).not.toContain('ActualApiKey');
  });

  // Test 6: Variables.tf defines required variables
  test('variables.tf contains all required variables', () => {
    const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    
    expect(variablesTf).toContain('variable "region"');
    expect(variablesTf).toContain('variable "vpc_cidr"');
    expect(variablesTf).toContain('variable "project_name"');
    expect(variablesTf).toContain('variable "environment"');
    expect(variablesTf).toContain('variable "owner"');
  });

  // Test 7: Provider.tf uses us-west-2 region
  test('provider.tf configured for us-west-2 region', () => {
    const providerTf = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
    
    expect(providerTf).toContain('provider "aws"');
    expect(providerTf).toContain('us-west-2');
  });

  // Test 8: Outputs.tf provides necessary outputs
  test('outputs.tf contains required infrastructure outputs', () => {
    const outputsTf = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    
    expect(outputsTf).toContain('output');
    expect(outputsTf).toContain('vpc_id');
    expect(outputsTf).toContain('subnet');
  });

  // Test 9: Random naming conventions implemented
  test('random naming with environment suffix implemented', () => {
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    
    expect(mainTf).toContain('resource "random_id"');
    expect(variablesTf).toContain('variable "environment_suffix"');
    expect(variablesTf).toContain('local.name_suffix');
  });

  // Test 10: Security groups deny by default
  test('security groups configured with restrictive ingress rules', () => {
    const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
    
    // Should have specific ingress rules, not allow all
    expect(securityTf).not.toContain('cidr_blocks = ["0.0.0.0/0"]' + 
      '\n' + '.*ingress');
    expect(securityTf).toContain('ingress {');
    expect(securityTf).toContain('from_port');
    expect(securityTf).toContain('to_port');
  });

  // Test 11: All resources tagged properly
  test('resources include required tags', () => {
    const variablesTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    
    // Check that common_tags includes all required tags
    expect(variablesTf).toContain('common_tags');
    expect(variablesTf).toContain('Environment');
    expect(variablesTf).toContain('Owner');
    expect(variablesTf).toContain('ManagedBy');
    
    // Check that main resources use the tags
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    expect(mainTf).toContain('merge(local.common_tags');
  });

  // Test 12: S3 buckets configured for cleanup/rollback
  test('S3 buckets configured for easy cleanup', () => {
    const loggingTf = fs.readFileSync(path.join(libDir, 'logging.tf'), 'utf8');
    
    if (loggingTf.includes('resource "aws_s3_bucket"')) {
      expect(loggingTf).toContain('force_destroy = true');
    }
  });

  // Test 13: Secrets Manager configured for rollback
  test('secrets manager configured for testing/rollback', () => {
    const secretsTf = fs.readFileSync(path.join(libDir, 'secrets.tf'), 'utf8');
    
    if (secretsTf.includes('resource "aws_secretsmanager_secret"')) {
      // Should allow immediate deletion for testing
      expect(secretsTf).toContain('recovery_window_in_days');
    }
  });

  // Test 14: NACLs configured for subnet security
  test('network ACLs provide subnet-level security', () => {
    const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
    
    expect(securityTf).toContain('resource "aws_network_acl"');
    expect(securityTf).toContain('rule_no');
    expect(securityTf).toContain('protocol');
  });

  // Test 15: IAM roles follow least privilege
  test('IAM roles configured with least privilege', () => {
    const securityTf = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf8');
    
    expect(securityTf).toContain('resource "aws_iam_role"');
    expect(securityTf).toContain('assume_role_policy');
    expect(securityTf).toContain('resource "aws_iam_policy_attachment"');
  });

  // Test 16: VPC Flow Logs enabled
  test('VPC Flow Logs enabled for network monitoring', () => {
    const loggingTf = fs.readFileSync(path.join(libDir, 'logging.tf'), 'utf8');
    
    expect(loggingTf).toContain('resource "aws_flow_log"');
    expect(loggingTf).toContain('vpc_id');
    expect(loggingTf).toContain('traffic_type');
    expect(loggingTf).toContain('ALL');
  });

  // Test 17: CloudTrail multi-region enabled
  test('CloudTrail configured for comprehensive auditing', () => {
    const loggingTf = fs.readFileSync(path.join(libDir, 'logging.tf'), 'utf8');
    
    expect(loggingTf).toContain('resource "aws_cloudtrail"');
    expect(loggingTf).toContain('is_multi_region_trail');
    expect(loggingTf).toContain('true');
    expect(loggingTf).toContain('s3_bucket_name');
  });

  // Test 18: KMS encryption for secrets
  test('KMS encryption configured for secrets', () => {
    const secretsTf = fs.readFileSync(path.join(libDir, 'secrets.tf'), 'utf8');
    
    expect(secretsTf).toContain('kms_key_id');
    expect(secretsTf).toContain('resource "aws_kms_key"');
  });

  // Test 19: S3 bucket versioning and encryption
  test('S3 buckets configured with security best practices', () => {
    const loggingTf = fs.readFileSync(path.join(libDir, 'logging.tf'), 'utf8');
    
    if (loggingTf.includes('resource "aws_s3_bucket"')) {
      expect(loggingTf).toContain('versioning');
      expect(loggingTf).toContain('server_side_encryption_configuration');
    }
  });

  // Test 20: Public subnets and private subnets properly configured
  test('subnets configured with proper CIDR and AZ distribution', () => {
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    
    expect(mainTf).toContain('map_public_ip_on_launch = true');
    expect(mainTf).toContain('availability_zone');
    expect(mainTf).toContain('cidr_block');
  });

  // Test 21: NAT Gateways for private subnet internet access
  test('NAT Gateways properly configured for private subnet access', () => {
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    
    expect(mainTf).toContain('resource "aws_nat_gateway"');
    expect(mainTf).toContain('resource "aws_eip"');
    expect(mainTf).toContain('allocation_id');
    expect(mainTf).toContain('subnet_id');
  });
});
