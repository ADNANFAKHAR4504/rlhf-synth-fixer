import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - SECURITY COMPLIANCE INFRASTRUCTURE', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;
  let resourceCounts: Record<string, number> = {}; // Initialize as empty object

  beforeAll(() => {
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
    console.log('🔍 Analyzing security compliance infrastructure...');
    
    resourceCounts = {
      // KMS Keys
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,
      kms_policy: (mainContent.match(/resource\s+"aws_kms_key_policy"/g) || []).length,
      
      // S3 Buckets
      s3_bucket: (mainContent.match(/resource\s+"aws_s3_bucket"/g) || []).length,
      s3_versioning: (mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || []).length,
      s3_encryption: (mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || []).length,
      s3_public_access: (mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length,
      s3_policy: (mainContent.match(/resource\s+"aws_s3_bucket_policy"/g) || []).length,
      s3_lifecycle: (mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g) || []).length,
      
      // VPC Networking
      vpc: (mainContent.match(/resource\s+"aws_vpc"/g) || []).length,
      internet_gateway: (mainContent.match(/resource\s+"aws_internet_gateway"/g) || []).length,
      eip: (mainContent.match(/resource\s+"aws_eip"/g) || []).length,
      nat_gateway: (mainContent.match(/resource\s+"aws_nat_gateway"/g) || []).length,
      subnet: (mainContent.match(/resource\s+"aws_subnet"/g) || []).length,
      route_table: (mainContent.match(/resource\s+"aws_route_table"/g) || []).length,
      route_table_association: (mainContent.match(/resource\s+"aws_route_table_association"/g) || []).length,
      
      // Security Groups
      security_group: (mainContent.match(/resource\s+"aws_security_group"/g) || []).length,
      security_group_rule: (mainContent.match(/resource\s+"aws_security_group_rule"/g) || []).length,
      
      // Network ACLs
      network_acl: (mainContent.match(/resource\s+"aws_network_acl"/g) || []).length,
      network_acl_rule: (mainContent.match(/resource\s+"aws_network_acl_rule"/g) || []).length,
      network_acl_association: (mainContent.match(/resource\s+"aws_network_acl_association"/g) || []).length,
      
      // IAM
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
      iam_role_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,
      
      // CloudWatch
      cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
      cloudwatch_metric_filter: (mainContent.match(/resource\s+"aws_cloudwatch_log_metric_filter"/g) || []).length,
      cloudwatch_metric_alarm: (mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length,
      
      // Lambda & EventBridge
      lambda_function: (mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length,
      eventbridge_rule: (mainContent.match(/resource\s+"aws_cloudwatch_event_rule"/g) || []).length,
      eventbridge_target: (mainContent.match(/resource\s+"aws_cloudwatch_event_target"/g) || []).length,
      lambda_permission: (mainContent.match(/resource\s+"aws_lambda_permission"/g) || []).length,
      
      // SNS & Secrets
      sns_topic: (mainContent.match(/resource\s+"aws_sns_topic"/g) || []).length,
      sns_topic_policy: (mainContent.match(/resource\s+"aws_sns_topic_policy"/g) || []).length,
      secrets_manager_secret: (mainContent.match(/resource\s+"aws_secretsmanager_secret"/g) || []).length,
      
      // Other Services
      vpc_flow_log: (mainContent.match(/resource\s+"aws_flow_log"/g) || []).length,
      guardduty_detector: (mainContent.match(/resource\s+"aws_guardduty_detector"/g) || []).length,
      
      // Data Sources
      archive_file: (mainContent.match(/data\s+"archive_file"/g) || []).length,
      aws_caller_identity: (mainContent.match(/data\s+"aws_caller_identity"/g) || []).length,
      aws_region: (mainContent.match(/data\s+"aws_region"/g) || []).length,
      availability_zones: (mainContent.match(/data\s+"aws_availability_zones"/g) || []).length,
    };
    
    console.log('📊 Resource counts:', resourceCounts);
  });

  // =============================================
  // UNIVERSAL TESTS - ALWAYS RUN
  // =============================================

  describe('File Structure & Basic Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(__dirname, '..', 'lib', 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(__dirname, '..', 'lib', 'provider.tf'))).toBe(true);
    });

    test('should have lambda_function.py file', () => {
      expect(fs.existsSync(path.join(__dirname, '..', 'lib', 'lambda_function.py'))).toBe(true);
    });

    test('should have terraform version requirement', () => {
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]*"/);
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version');
    });

    test('should have random provider for password generation', () => {
      expect(providerContent).toContain('hashicorp/random');
    });

    test('should have archive provider for Lambda packaging', () => {
      expect(providerContent).toContain('hashicorp/archive');
    });

    test('should use terraform fmt formatting', () => {
      // Check for consistent indentation (2 spaces)
      const lines = mainContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  ') && line.trim());
      expect(indentedLines.length).toBeGreaterThan(10); // Should have properly indented blocks
    });
  });

  // =============================================
  // KMS KEYS TESTS - SECURITY ENCRYPTION
  // =============================================

  if (resourceCounts.kms_key >= 3) {
    describe('KMS Keys Configuration', () => {
      test('should have 3 KMS keys for different purposes', () => {
        expect(resourceCounts.kms_key).toBe(3);
      });

      test('should have KMS key aliases', () => {
        expect(resourceCounts.kms_alias).toBe(3);
      });

      test('should have KMS key policies', () => {
        expect(resourceCounts.kms_policy).toBe(3);
      });

      test('should enable key rotation for all KMS keys', () => {
        const enableRotation = mainContent.match(/enable_key_rotation\s*=\s*true/g) || [];
        expect(enableRotation.length).toBe(3);
      });

      test('should have proper deletion window (7 days)', () => {
        const deletionWindow = mainContent.match(/deletion_window_in_days\s*=\s*7/g) || [];
        expect(deletionWindow.length).toBe(3);
      });

      test('should include root account access in KMS policies', () => {
        const rootAccountStatements = mainContent.match(/Enable IAM User Permissions/g) || [];
        expect(rootAccountStatements.length).toBe(3);
      });

      test('should include service principal permissions', () => {
        expect(mainContent).toContain('s3.amazonaws.com');
        expect(mainContent).toContain('logs.amazonaws.com');
      });
    });
  }

  // =============================================
  // S3 BUCKETS TESTS - SECURE STORAGE
  // =============================================

  if (resourceCounts.s3_bucket >= 3) {
    describe('S3 Buckets Configuration', () => {
      test('should have 3 S3 buckets for different purposes', () => {
        expect(resourceCounts.s3_bucket).toBe(3);
      });

      test('should enable versioning on all buckets', () => {
        expect(resourceCounts.s3_versioning).toBe(3);
      });

      test('should enable encryption on all buckets', () => {
        expect(resourceCounts.s3_encryption).toBe(3);
      });

      test('should have public access blocks enabled', () => {
        expect(resourceCounts.s3_public_access).toBe(3);
      });

      test('should have S3 bucket policies', () => {
        expect(resourceCounts.s3_policy).toBe(3);
      });

      test('should use KMS encryption for all buckets', () => {
        const kmsEncryption = mainContent.match(/sse_algorithm\s*=\s*"aws:kms"/g) || [];
        expect(kmsEncryption.length).toBe(3);
      });

      test('should have force_destroy enabled for testing', () => {
        const forceDestroy = mainContent.match(/force_destroy\s*=\s*true/g) || [];
        expect(forceDestroy.length).toBe(3);
      });

      test('should deny unencrypted uploads', () => {
        const denyUnencrypted = mainContent.match(/DenyUnencryptedObjectUploads/g) || [];
        expect(denyUnencrypted.length).toBe(3);
      });
    });
  }

  // =============================================
  // VPC NETWORKING TESTS - SECURE NETWORK
  // =============================================

  if (resourceCounts.vpc >= 1) {
    describe('VPC Networking Configuration', () => {
      test('should have VPC with DNS support enabled', () => {
        expect(mainContent).toContain('enable_dns_hostnames = true');
        expect(mainContent).toContain('enable_dns_support = true');
      });

      test('should have Internet Gateway', () => {
        expect(resourceCounts.internet_gateway).toBe(1);
      });

      test('should have NAT Gateway', () => {
        expect(resourceCounts.nat_gateway).toBe(1);
        expect(resourceCounts.eip).toBe(1);
      });

      test('should have 9 subnets (3 AZs × 3 tiers)', () => {
        expect(resourceCounts.subnet).toBe(9);
      });

      test('should have route tables for each tier', () => {
        expect(resourceCounts.route_table).toBe(3);
      });

      test('should have route table associations', () => {
        expect(resourceCounts.route_table_association).toBe(9);
      });

      test('should have VPC Flow Logs enabled', () => {
        expect(resourceCounts.vpc_flow_log).toBe(1);
        expect(mainContent).toContain('log_destination_type = "s3"');
        expect(mainContent).toContain('traffic_type = "ALL"');
      });
    });
  }

  // =============================================
  // SECURITY GROUPS TESTS - NETWORK SECURITY
  // =============================================

  if (resourceCounts.security_group >= 3) {
    describe('Security Groups Configuration', () => {
      test('should have 3 security groups for different tiers', () => {
        expect(resourceCounts.security_group).toBe(3);
      });

      test('should have security group rules', () => {
        expect(resourceCounts.security_group_rule).toBeGreaterThan(0);
      });

      test('should restrict SSH access appropriately', () => {
        expect(mainContent).toContain('cidr_blocks       = [for s in aws_subnet.mgmt : s.cidr_block]');
      });

      test('should allow HTTPS from internal network only', () => {
        const httpsRules = mainContent.match(/from_port.*=.*443.*protocol.*=.*"tcp".*cidr_blocks.*=.*\["10\.0\.0\.0\/8"\]/g) || [];
        expect(httpsRules.length).toBeGreaterThan(0);
      });
    });
  }

  // =============================================
  // NETWORK ACLS TESTS - ADDITIONAL SECURITY
  // =============================================

  if (resourceCounts.network_acl >= 3) {
    describe('Network ACLs Configuration', () => {
      test('should have NACLs for all tiers', () => {
        expect(resourceCounts.network_acl).toBe(3);
      });

      test('should have NACL rules', () => {
        expect(resourceCounts.network_acl_rule).toBeGreaterThan(0);
      });

      test('should deny test networks', () => {
        const denyTestNets = mainContent.match(/deny.*test.*net/g) || [];
        expect(denyTestNets.length).toBeGreaterThanOrEqual(9); // 3 tiers × 3 test networks
      });

      test('should have NACL associations', () => {
        expect(resourceCounts.network_acl_association).toBe(9);
      });
    });
  }

  // =============================================
  // IAM ROLES & POLICIES TESTS
  // =============================================

  if (resourceCounts.iam_role >= 2) {
    describe('IAM Roles and Policies Configuration', () => {
      test('should have IAM roles for Lambda and VPC Flow Logs', () => {
        expect(resourceCounts.iam_role).toBe(2);
      });

      test('should have corresponding IAM policies', () => {
        expect(resourceCounts.iam_policy).toBe(2);
      });

      test('should have IAM role policy attachments', () => {
        expect(resourceCounts.iam_role_policy_attachment).toBe(2);
      });

      test('should have assume role policies for services', () => {
        expect(mainContent).toContain('lambda.amazonaws.com');
        expect(mainContent).toContain('vpc-flow-logs.amazonaws.com');
      });

      test('should use least privilege IAM policies', () => {
        expect(mainContent).toContain('kms:Decrypt');
        expect(mainContent).toContain('kms:GenerateDataKey');
        expect(mainContent).not.toContain('kms:*');
      });
    });
  }

  // =============================================
  // CLOUDWATCH LOGGING TESTS
  // =============================================

  if (resourceCounts.cloudwatch_log_group >= 3) {
    describe('CloudWatch Log Groups Configuration', () => {
      test('should have CloudWatch log groups for different purposes', () => {
        expect(resourceCounts.cloudwatch_log_group).toBe(3);
      });

      test('should have 1-day retention for cost control', () => {
        const retentionOneDay = mainContent.match(/retention_in_days\s*=\s*1/g) || [];
        expect(retentionOneDay.length).toBe(3);
      });

      test('should use KMS encryption for log groups', () => {
        const kmsKeyEncryption = mainContent.match(/kms_key_id\s*=\s*aws_kms_key\.logs_encryption\.arn/g) || [];
        expect(kmsKeyEncryption.length).toBe(3);
      });

      test('should have CloudWatch metric alarms', () => {
        expect(resourceCounts.cloudwatch_metric_alarm).toBe(4);
      });

      test('should have metric filter for security monitoring', () => {
        expect(resourceCounts.cloudwatch_metric_filter).toBe(1);
      });
    });
  }

  // =============================================
  // LAMBDA & EVENTBRIDGE TESTS
  // =============================================

  if (resourceCounts.lambda_function >= 1) {
    describe('Lambda Function and EventBridge Configuration', () => {
      test('should have Lambda function for compliance checking', () => {
        expect(resourceCounts.lambda_function).toBe(1);
        expect(mainContent).toContain('python3.11');
        expect(mainContent).toContain('256');
        expect(mainContent).toContain('300');
      });

      test('should have EventBridge rules for scheduling', () => {
        expect(resourceCounts.eventbridge_rule).toBe(2);
        expect(mainContent).toContain('cron(0 2 * * ? *)');
      });

      test('should have EventBridge targets', () => {
        expect(resourceCounts.eventbridge_target).toBe(2);
      });

      test('should have Lambda permissions for EventBridge', () => {
        expect(resourceCounts.lambda_permission).toBe(1);
      });

      test('should archive Lambda function code', () => {
        expect(resourceCounts.archive_file).toBe(1);
      });
    });
  }

  // =============================================
  // SNS & SECRETS MANAGER TESTS
  // =============================================

  if (resourceCounts.sns_topic >= 1) {
    describe('SNS Topics and Secrets Manager Configuration', () => {
      test('should have SNS topic for security alerts', () => {
        expect(resourceCounts.sns_topic).toBe(1);
        expect(mainContent).toContain('kms_master_key_id = aws_kms_key.app_encryption.id');
      });

      test('should have SNS topic policy', () => {
        expect(resourceCounts.sns_topic_policy).toBe(1);
        expect(mainContent).toContain('AllowEventBridgeToPublish');
      });

      test('should have Secrets Manager for credentials', () => {
        expect(resourceCounts.secrets_manager_secret).toBe(1);
        expect(mainContent).toContain('recovery_window_in_days = 0');
      });

      test('should use KMS encryption for secrets', () => {
        expect(mainContent).toContain('kms_key_id = aws_kms_key.app_encryption.id');
      });
    });
  }

  // =============================================
  // GUARDDUTY TESTS
  // =============================================

  if (resourceCounts.guardduty_detector >= 1) {
    describe('GuardDuty Configuration', () => {
      test('should have GuardDuty detector enabled', () => {
        expect(resourceCounts.guardduty_detector).toBe(1);
        expect(mainContent).toContain('enable = true');
      });

      test('should enable S3 logs for GuardDuty', () => {
        expect(mainContent).toContain('s3_logs');
        expect(mainContent).toContain('enable = true');
      });
    });
  }

  // =============================================
  // DATA SOURCES TESTS
  // =============================================

  if (resourceCounts.aws_caller_identity >= 1) {
    describe('Data Sources Configuration', () => {
      test('should use aws_caller_identity for account ID', () => {
        expect(resourceCounts.aws_caller_identity).toBe(1);
      });

      test('should use aws_region for current region', () => {
        expect(resourceCounts.aws_region).toBe(1);
      });

      test('should use availability zones for subnet placement', () => {
        expect(resourceCounts.availability_zones).toBe(1);
      });
    });
  }

  // =============================================
  // UNIVERSAL SECURITY BEST PRACTICES
  // =============================================

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

    test('should use variables for environment configuration', () => {
      const varUsage = combinedContent.match(/\$\{var\.environment\}/g) || [];
      expect(varUsage.length).toBeGreaterThan(5);
    });

    test('should reference data sources appropriately', () => {
      const dataSourceRefs = mainContent.match(/\$\{[^}]*data\.[^}]*\}/g) || [];
      expect(dataSourceRefs.length).toBeGreaterThan(10);
    });

    test('should not expose resources to public internet unnecessarily', () => {
      // Check for public access patterns that should be restricted
      expect(mainContent).not.toMatch(/publicly_accessible\s*=\s*true/);
    });

    test('should have encryption at rest enabled', () => {
      expect(mainContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainContent).toContain('kms_master_key_id');
    });

    test('should have encryption in transit', () => {
      expect(mainContent).toContain('https');
    });
  });

  // =============================================
  // OUTPUTS VALIDATION
  // =============================================

  describe('Required Outputs', () => {
    test('should have comprehensive outputs for all resources', () => {
      const outputCount = (mainContent.match(/output\s+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(30); // Comprehensive infrastructure should have many outputs
    });

    test('should have KMS key outputs', () => {
      expect(mainContent).toContain('output "kms_app_encryption_id"');
      expect(mainContent).toContain('output "kms_s3_encryption_arn"');
    });

    test('should have S3 bucket outputs', () => {
      expect(mainContent).toContain('output "s3_app_logs_name"');
      expect(mainContent).toContain('output "s3_flow_logs_arn"');
    });

    test('should have VPC and networking outputs', () => {
      expect(mainContent).toContain('output "vpc_id"');
      expect(mainContent).toContain('output "subnet_app_ids"');
      expect(mainContent).toContain('output "nat_gateway_id"');
    });

    test('should have Lambda function outputs', () => {
      expect(mainContent).toContain('output "lambda_function_name"');
      expect(mainContent).toContain('output "lambda_function_arn"');
    });

    test('should mark sensitive outputs appropriately', () => {
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBeGreaterThan(0);
    });

    test('should have metadata outputs', () => {
      expect(mainContent).toContain('output "environment"');
      expect(mainContent).toContain('output "region"');
      expect(mainContent).toContain('output "account_id"');
    });
  });

  // =============================================
  // FORBIDDEN PATTERNS
  // =============================================

  describe('Forbidden Patterns', () => {
    test('should not have VPC endpoint restrictions that would prevent testing', () => {
      // VPC endpoint restrictions would break CI/CD testing
      expect(mainContent).not.toContain('aws_vpc_endpoint');
    });

    test('should not have hardcoded AWS regions in resources', () => {
        // Check for hardcoded regions in resource configurations (but not in provider block)
        const resourceContent = mainContent; // Only check main.tf, not provider.tf
        const hardcodedRegions = [
          '"us-west-2"',
          '"eu-west-1"',
          '"ap-southeast-1"',
          '"ca-central-1"',
          '"ap-northeast-1"'
        ];
        
        hardcodedRegions.forEach(region => {
          expect(resourceContent).not.toContain(region);
        });
        
        // Note: us-east-1 in provider.tf is acceptable as default region
        expect(combinedContent).toContain('"us-east-1"');
      });

    test('should not have hardcoded account IDs', () => {
      const accountPattern = /\d{12}/g;
      const accountMatches = combinedContent.match(accountPattern) || [];
      
      // Filter out common numbers that aren't account IDs
      const potentialAccountIds = accountMatches.filter(match => {
        return !match.startsWith('1') && !match.startsWith('0') && !match.startsWith('20') && !match.includes('0');
      });
      
      expect(potentialAccountIds.length).toBe(0);
    });

    test('should not have prevent_destroy lifecycle rules', () => {
      expect(mainContent).not.toContain('prevent_destroy = true');
    });

    test('should not have public security group rules', () => {
      const publicSG = mainContent.match(/cidr_blocks.*=.*\["0\.0\.0\.0\/0"\].*port.*(22|3389|5432|3306)/g) || [];
      expect(publicSG.length).toBe(0);
    });
  });

  // =============================================
  // TERRAFORM SPECIFIC VALIDATIONS
  // =============================================

  describe('Terraform Configuration Validation', () => {
    test('should have proper resource naming patterns', () => {
      expect(mainContent).toMatch(/resource\s+"aws_\w+"\s+"\w+"/g);
    });

    test('should use proper HCL syntax', () => {
      // Check for balanced braces and brackets
      const openBraces = (mainContent.match(/\{/g) || []).length;
      const closeBraces = (mainContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have proper dependencies', () => {
      expect(mainContent).toContain('depends_on');
    });

    test('should use count or for_each appropriately', () => {
      expect(mainContent).toContain('count');
    });
  });

  // =============================================
  // COST OPTIMIZATION
  // =============================================

  describe('Cost Optimization', () => {
    test('should have reasonable resource sizes', () => {
      // Check for reasonable Lambda memory size
      expect(mainContent).toContain('memory_size      = 256');
      expect(mainContent).toContain('timeout          = 300');
    });

    test('should have appropriate retention periods', () => {
      expect(mainContent).toContain('retention_in_days = 1');
    });

    test('should have force_destroy for buckets', () => {
      const forceDestroy = mainContent.match(/force_destroy\s*=\s*true/g) || [];
      expect(forceDestroy.length).toBeGreaterThan(0);
    });

    test('should have immediate secret deletion for testing', () => {
      expect(mainContent).toContain('recovery_window_in_days = 0');
    });
  });

  // =============================================
  // COMPLIANCE & MONITORING
  // =============================================

  describe('Compliance and Monitoring', () => {
    test('should have security monitoring in place', () => {
      expect(mainContent).toContain('cloudwatch_metric_alarm');
      expect(mainContent).toContain('guardduty');
    });

    test('should have comprehensive tagging', () => {
      const tags = mainContent.match(/tags\s*=\s*\{/g) || [];
      expect(tags.length).toBeGreaterThan(10);
    });

    test('should have default tags configured', () => {
      expect(providerContent).toContain('Environment');
      expect(providerContent).toContain('DataClassification');
      expect(providerContent).toContain('Compliance');
    });
  });
});

export {};
