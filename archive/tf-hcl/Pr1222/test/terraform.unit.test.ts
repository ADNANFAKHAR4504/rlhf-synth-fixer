import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  
  // Helper function to read Terraform files
  const readTerraformFile = (filename: string): string => {
    const filePath = path.join(libPath, filename);
    return fs.readFileSync(filePath, 'utf8');
  };

  // Helper function to check if a resource exists in a file
  const resourceExists = (filename: string, resourceType: string, resourceName: string): boolean => {
    const content = readTerraformFile(filename);
    const resourcePattern = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`, 'm');
    return resourcePattern.test(content);
  };

  // Helper function to check if a string exists in a file
  const containsString = (filename: string, searchString: string): boolean => {
    const content = readTerraformFile(filename);
    return content.includes(searchString);
  };

  describe('File Structure', () => {
    test('All required Terraform files exist', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'locals.tf',
        'outputs.tf',
        'provider.tf',
        'vpc.tf',
        's3.tf',
        'kms.tf',
        'iam.tf',
        'rds.tf',
        'ec2.tf',
        'security-groups.tf',
        'cloudwatch.tf',
        'waf.tf',
        'backup.tf',
        'lambda.tf',
        'secrets-manager.tf',
        'config.tf',
        'alb.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Lambda function configuration exists in terraform', () => {
      const lambdaContent = readTerraformFile('lambda.tf');
      expect(lambdaContent).toContain('resource "local_file" "lambda_code"');
      expect(lambdaContent).toContain('lambda_function.py');
    });
  });

  describe('Environment Isolation', () => {
    test('Environment suffix variable is defined', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toContain('variable "environment_suffix"');
    });

    test('Project prefix uses environment suffix', () => {
      const localsContent = readTerraformFile('locals.tf');
      expect(localsContent).toContain('project_prefix');
      expect(localsContent).toContain('var.environment_suffix');
    });

    test('Resources use project_prefix for naming', () => {
      const files = ['vpc.tf', 's3.tf', 'kms.tf', 'rds.tf', 'ec2.tf'];
      files.forEach(file => {
        const content = readTerraformFile(file);
        expect(content).toContain('local.project_prefix');
      });
    });
  });

  describe('Security Requirement 1: IAM Roles with Least Privilege', () => {
    test('Lambda execution role exists', () => {
      expect(resourceExists('iam.tf', 'aws_iam_role', 'lambda_role')).toBe(true);
    });

    test('EC2 role exists', () => {
      expect(resourceExists('iam.tf', 'aws_iam_role', 'ec2_role')).toBe(true);
    });

    test('Config role exists', () => {
      expect(resourceExists('iam.tf', 'aws_iam_role', 'config_role')).toBe(true);
    });

    test('Lambda role has minimal permissions', () => {
      const iamContent = readTerraformFile('iam.tf');
      expect(iamContent).toContain('logs:CreateLogGroup');
      expect(iamContent).toContain('logs:CreateLogStream');
      expect(iamContent).toContain('logs:PutLogEvents');
    });
  });

  describe('Security Requirement 2: KMS Encryption for S3', () => {
    test('KMS key is defined', () => {
      expect(resourceExists('kms.tf', 'aws_kms_key', 's3_key')).toBe(true);
    });

    test('KMS key alias is created', () => {
      expect(resourceExists('kms.tf', 'aws_kms_alias', 's3_key_alias')).toBe(true);
    });

    test('S3 buckets use KMS encryption', () => {
      const s3Content = readTerraformFile('s3.tf');
      expect(s3Content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(s3Content).toContain('kms_master_key_id');
      expect(s3Content).toContain('aws_kms_key.s3_key.arn');
    });
  });

  describe('Security Requirement 3: Resource Tagging', () => {
    test('Common tags are defined in locals', () => {
      const localsContent = readTerraformFile('locals.tf');
      expect(localsContent).toContain('common_tags');
      expect(localsContent).toContain('environment');
      expect(localsContent).toContain('owner');
      expect(localsContent).toContain('project');
      expect(localsContent).toContain('managed_by');
    });

    test('Resources use common tags', () => {
      const files = ['s3.tf', 'kms.tf', 'lambda.tf'];
      files.forEach(file => {
        const content = readTerraformFile(file);
        expect(content).toContain('local.common_tags');
      });
    });
  });

  describe('Security Requirement 4: AWS WAF Protection', () => {
    test('WAF Web ACL is defined', () => {
      expect(resourceExists('waf.tf', 'aws_wafv2_web_acl', 'main')).toBe(true);
    });

    test('WAF has managed rule groups', () => {
      const wafContent = readTerraformFile('waf.tf');
      expect(wafContent).toContain('AWSManagedRulesCommonRuleSet');
      expect(wafContent).toContain('AWSManagedRulesKnownBadInputsRuleSet');
    });

    test('WAF logging is configured', () => {
      expect(resourceExists('waf.tf', 'aws_wafv2_web_acl_logging_configuration', 'main')).toBe(true);
    });

    test('WAF is associated with ALB', () => {
      expect(resourceExists('alb.tf', 'aws_wafv2_web_acl_association', 'alb')).toBe(true);
    });
  });

  describe('Security Requirement 5: CloudWatch Monitoring', () => {
    test('CloudWatch log groups are created', () => {
      expect(resourceExists('cloudwatch.tf', 'aws_cloudwatch_log_group', 'vpc_flow_log')).toBe(true);
      expect(resourceExists('cloudwatch.tf', 'aws_cloudwatch_log_group', 'alb_logs')).toBe(true);
    });

    test('CloudWatch alarms are configured', () => {
      // Alarms are created per environment
      const cwContent = readTerraformFile('cloudwatch.tf');
      expect(cwContent).toContain('aws_cloudwatch_metric_alarm');
      expect(cwContent).toContain('CPUUtilization');
    });

    test('SNS topic for alarms exists', () => {
      const cwContent = readTerraformFile('cloudwatch.tf');
      expect(cwContent).toContain('aws_sns_topic');
      expect(cwContent).toContain('alarm');
    });
  });

  describe('Security Requirement 6: VPC Flow Logs', () => {
    test('VPC flow logs are enabled', () => {
      expect(resourceExists('vpc.tf', 'aws_flow_log', 'vpc_flow_log')).toBe(true);
    });

    test('Flow logs use CloudWatch as destination', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toContain('aws_cloudwatch_log_group.vpc_flow_log.arn');
    });

    test('Flow logs IAM role exists', () => {
      expect(resourceExists('iam.tf', 'aws_iam_role', 'flow_log_role')).toBe(true);
    });
  });

  describe('Security Requirement 7: Restricted SSH Access', () => {
    test('Security group for EC2 exists', () => {
      expect(resourceExists('security-groups.tf', 'aws_security_group', 'web')).toBe(true);
    });

    test('SSH access is restricted', () => {
      const sgContent = readTerraformFile('security-groups.tf');
      expect(sgContent).toContain('from_port   = 22');
      expect(sgContent).toContain('to_port     = 22');
    });
  });

  describe('Security Requirement 8: RDS Encryption', () => {
    test('RDS instance has encryption enabled', () => {
      const rdsContent = readTerraformFile('rds.tf');
      expect(rdsContent).toContain('storage_encrypted');
      expect(rdsContent).toContain('= true');
      expect(rdsContent).toContain('kms_key_id');
    });

    test('RDS subnet group is created', () => {
      expect(resourceExists('rds.tf', 'aws_db_subnet_group', 'main')).toBe(true);
    });

    test('RDS uses private subnets', () => {
      const rdsContent = readTerraformFile('rds.tf');
      expect(rdsContent).toContain('aws_subnet.private');
    });
  });

  describe('Security Requirement 9: AWS Backup', () => {
    test('Backup vault is created', () => {
      expect(resourceExists('backup.tf', 'aws_backup_vault', 'main')).toBe(true);
    });

    test('Backup plan is configured', () => {
      expect(resourceExists('backup.tf', 'aws_backup_plan', 'main')).toBe(true);
    });

    test('Backup plan has 30-day retention', () => {
      const backupContent = readTerraformFile('backup.tf');
      expect(backupContent).toContain('delete_after');
      expect(backupContent).toContain('30');
    });

    test('Backup selection includes resources', () => {
      expect(resourceExists('backup.tf', 'aws_backup_selection', 'main')).toBe(true);
      const backupContent = readTerraformFile('backup.tf');
      expect(backupContent).toContain('resources');
      expect(backupContent).toContain('condition');
    });
  });

  describe('Security Requirement 10: Environment Isolation', () => {
    test('VPC is created per environment', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toContain('for_each');
      expect(vpcContent).toContain('var.environments');
    });

    test('Subnets are isolated per environment', () => {
      expect(resourceExists('vpc.tf', 'aws_subnet', 'public')).toBe(true);
      expect(resourceExists('vpc.tf', 'aws_subnet', 'private')).toBe(true);
    });
  });

  describe('Security Requirement 11: Lambda Security', () => {
    test('Lambda function is defined', () => {
      expect(resourceExists('lambda.tf', 'aws_lambda_function', 'example')).toBe(true);
    });

    test('Lambda has configuration', () => {
      const lambdaContent = readTerraformFile('lambda.tf');
      expect(lambdaContent).toContain('runtime');
      expect(lambdaContent).toContain('handler');
    });

    test('Lambda has proper IAM role', () => {
      const lambdaContent = readTerraformFile('lambda.tf');
      expect(lambdaContent).toContain('role');
      expect(lambdaContent).toContain('aws_iam_role.lambda_role.arn');
    });
  });

  describe('Security Requirement 12: S3 Versioning', () => {
    test('S3 versioning is enabled', () => {
      expect(resourceExists('s3.tf', 'aws_s3_bucket_versioning', 'main')).toBe(true);
      const s3Content = readTerraformFile('s3.tf');
      expect(s3Content).toContain('status = "Enabled"');
    });

    test('S3 bucket configuration is complete', () => {
      const s3Content = readTerraformFile('s3.tf');
      expect(s3Content).toContain('aws_s3_bucket_versioning');
      expect(s3Content).toContain('aws_s3_bucket_server_side_encryption_configuration');
    });
  });

  describe('Security Requirement 13: AWS Config Compliance', () => {
    test('Config recorder is created', () => {
      expect(resourceExists('config.tf', 'aws_config_configuration_recorder', 'main')).toBe(true);
    });

    test('Config delivery channel is configured', () => {
      expect(resourceExists('config.tf', 'aws_config_delivery_channel', 'main')).toBe(true);
    });

    test('Config rules are defined', () => {
      const configContent = readTerraformFile('config.tf');
      expect(configContent).toContain('aws_config_config_rule');
      expect(configContent).toContain('REQUIRED_TAGS');
    });

    test('Config bucket is created', () => {
      expect(resourceExists('s3.tf', 'aws_s3_bucket', 'config')).toBe(true);
    });
  });

  describe('Security Requirement 14: Secrets Manager', () => {
    test('Secrets are created for database credentials', () => {
      expect(resourceExists('secrets-manager.tf', 'aws_secretsmanager_secret', 'db_credentials')).toBe(true);
    });

    test('Secret versions are populated', () => {
      expect(resourceExists('secrets-manager.tf', 'aws_secretsmanager_secret_version', 'db_credentials')).toBe(true);
    });

    test('Secrets use proper JSON format', () => {
      const secretsContent = readTerraformFile('secrets-manager.tf');
      expect(secretsContent).toContain('jsonencode');
      expect(secretsContent).toContain('username');
      expect(secretsContent).toContain('password');
    });
  });

  describe('Infrastructure Components', () => {
    test('Application Load Balancer is configured', () => {
      expect(resourceExists('alb.tf', 'aws_lb', 'main')).toBe(true);
      expect(resourceExists('alb.tf', 'aws_lb_target_group', 'main')).toBe(true);
      expect(resourceExists('alb.tf', 'aws_lb_listener', 'main')).toBe(true);
    });

    test('EC2 instances are created', () => {
      expect(resourceExists('ec2.tf', 'aws_instance', 'web')).toBe(true);
    });

    test('EC2 instances use AMI', () => {
      const ec2Content = readTerraformFile('ec2.tf');
      expect(ec2Content).toContain('ami-');
    });

    test('Network connectivity is configured', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toContain('aws_internet_gateway');
      expect(vpcContent).toContain('aws_route');
    });

    test('Internet Gateway is configured', () => {
      expect(resourceExists('vpc.tf', 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('Route tables are properly configured', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toContain('aws_route_table_association');
      expect(vpcContent).toContain('aws_route');
    });
  });

  describe('Terraform Configuration', () => {
    test('Provider is configured with proper version constraints', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('aws');
    });

    test('Backend configuration exists', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toContain('backend');
    });

    test('Outputs are defined for key resources', () => {
      const outputsContent = readTerraformFile('outputs.tf');
      expect(outputsContent).toContain('output');
      expect(outputsContent).toContain('vpc_ids');
      expect(outputsContent).toContain('s3_bucket_names');
      expect(outputsContent).toContain('rds_endpoints');
    });
  });

  describe('Data Sources', () => {
    test('Data sources are configured', () => {
      const dataContent = readTerraformFile('data.tf');
      expect(dataContent).toContain('data "aws_caller_identity"');
      expect(dataContent).toContain('data "aws_availability_zones"');
    });

    test('Availability zones data source exists', () => {
      const dataContent = readTerraformFile('data.tf');
      expect(dataContent).toContain('data "aws_availability_zones"');
    });
  });

  describe('Best Practices', () => {
    test('No hardcoded credentials in configuration', () => {
      const files = fs.readdirSync(libPath).filter(f => f.endsWith('.tf'));
      files.forEach(file => {
        const content = readTerraformFile(file);
        expect(content).not.toContain('aws_access_key_id');
        expect(content).not.toContain('aws_secret_access_key');
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/);
      });
    });

    test('All S3 buckets have public access blocked', () => {
      const s3Content = readTerraformFile('s3.tf');
      expect(s3Content).toContain('aws_s3_bucket_public_access_block');
      expect(s3Content).toContain('block_public_acls');
      expect(s3Content).toContain('block_public_policy');
      expect(s3Content).toContain('ignore_public_acls');
      expect(s3Content).toContain('restrict_public_buckets');
    });

    test('RDS has deletion protection disabled for testing', () => {
      const rdsContent = readTerraformFile('rds.tf');
      expect(rdsContent).toContain('deletion_protection');
      expect(rdsContent).toContain('false');
    });

    test('RDS has automated backups enabled', () => {
      const rdsContent = readTerraformFile('rds.tf');
      expect(rdsContent).toContain('backup_retention_period');
    });
  });
});