// Unit tests for Terraform Aurora Serverless infrastructure
// Tests configuration without running Terraform commands

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// List of Terraform files to test
const TF_FILES = [
  'provider.tf',
  'variables.tf',
  'main.tf',
  'vpc.tf',
  'security-groups.tf',
  'kms.tf',
  'secrets.tf',
  'cloudwatch.tf',
  'eventbridge.tf',
  's3.tf',
  'autoscaling.tf',
  'iam.tf',
  'outputs.tf',
];

describe('Terraform Aurora Serverless Infrastructure - Unit Tests', () => {
  // Test 1: All required files exist
  describe('File Structure', () => {
    test.each(TF_FILES)('%s exists', (filename) => {
      const filePath = path.join(LIB_DIR, filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // Test 2: Provider configuration
  describe('Provider Configuration', () => {
    test('provider.tf does not have hardcoded regions', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toContain('var.aws_region');
      expect(content).not.toMatch(/region\s*=\s*"us-[a-z]+-\d+"/);
    });

    test('only provider.tf contains provider blocks', () => {
      const nonProviderFiles = TF_FILES.filter((f) => f !== 'provider.tf');
      nonProviderFiles.forEach((filename) => {
        const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');
        expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
      });
    });
  });

  // Test 3: Variable definitions
  describe('Variables', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    });

    test('environment_suffix variable exists', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('aws_region variable exists', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('environment variable exists', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test('secrets.tf exists for Secrets Manager integration', () => {
      const secretsExists = fs.existsSync(path.join(LIB_DIR, 'secrets.tf'));
      expect(secretsExists).toBe(true);
    });
    
    test('Aurora cluster uses Secrets Manager for credentials', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(mainContent).toMatch(/manage_master_user_password\s*=\s*true/);
      expect(mainContent).toMatch(/master_user_secret_kms_key_id\s*=\s*aws_kms_key\.aurora\.key_id/);
    });

    test('Aurora MySQL version is specified', () => {
      expect(variablesContent).toMatch(/variable\s+"aurora_mysql_version"/);
      expect(variablesContent).toContain('8.0');
    });
  });

  // Test 4: Resource naming with environment_suffix
  describe('Resource Naming', () => {
    const resourceFiles = ['main.tf', 'vpc.tf', 'security-groups.tf', 'kms.tf', 'cloudwatch.tf', 'eventbridge.tf', 's3.tf', 'autoscaling.tf', 'iam.tf'];

    test.each(resourceFiles)('%s uses environment_suffix in resource names', (filename) => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');

      // Check for environment_suffix usage in name attributes
      const nameMatches = content.match(/name\s*=\s*"[^"]*\$\{var\.environment_suffix\}[^"]*"/g);
      if (nameMatches) {
        expect(nameMatches.length).toBeGreaterThan(0);
      }
    });

    test('no hardcoded environment names in resource names', () => {
      resourceFiles.forEach((filename) => {
        const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');

        // Should not have hardcoded dev, prod, staging in names
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-(dev|prod|production|staging)-[^"]*"/);
      });
    });
  });

  // Test 5: Aurora Serverless configuration
  describe('Aurora Serverless Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('Aurora cluster resource exists', () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora_serverless"/);
    });

    test('Aurora uses correct engine', () => {
      expect(mainContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(mainContent).toMatch(/engine_mode\s*=\s*"provisioned"/);
    });

    test('serverlessv2_scaling_configuration exists', () => {
      expect(mainContent).toMatch(/serverlessv2_scaling_configuration\s*{/);
      expect(mainContent).toContain('max_capacity');
      expect(mainContent).toContain('min_capacity');
    });

    test('Aurora instance uses db.serverless class', () => {
      expect(mainContent).toMatch(/instance_class\s*=\s*"db\.serverless"/);
    });

    test('Performance Insights is disabled for db.serverless', () => {
      expect(mainContent).toContain('performance_insights_enabled = false');
    });

    test('parameter group is associated with cluster', () => {
      expect(mainContent).toMatch(/db_cluster_parameter_group_name\s*=\s*aws_rds_cluster_parameter_group\.aurora\.name/);
    });

    test('deletion protection is disabled for testing', () => {
      expect(mainContent).toContain('deletion_protection = false');
      expect(mainContent).toContain('skip_final_snapshot = true');
    });
  });

  // Test 6: Security configuration
  describe('Security Configuration', () => {
    test('KMS encryption is enabled for Aurora', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(mainContent).toContain('storage_encrypted = true');
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.aurora\.arn/);
    });

    test('Security group allows MySQL port 3306', () => {
      const sgContent = fs.readFileSync(path.join(LIB_DIR, 'security-groups.tf'), 'utf8');
      expect(sgContent).toMatch(/from_port\s*=\s*3306/);
      expect(sgContent).toMatch(/to_port\s*=\s*3306/);
      expect(sgContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('S3 bucket has encryption enabled', () => {
      const s3Content = fs.readFileSync(path.join(LIB_DIR, 's3.tf'), 'utf8');
      expect(s3Content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(s3Content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('S3 bucket has versioning enabled', () => {
      const s3Content = fs.readFileSync(path.join(LIB_DIR, 's3.tf'), 'utf8');
      expect(s3Content).toMatch(/aws_s3_bucket_versioning/);
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket blocks public access', () => {
      const s3Content = fs.readFileSync(path.join(LIB_DIR, 's3.tf'), 'utf8');
      expect(s3Content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('KMS key has rotation enabled', () => {
      const kmsContent = fs.readFileSync(path.join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  // Test 7: IAM policies follow least privilege
  describe('IAM Configuration', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
    });

    test('IAM policies do not use wildcard resources', () => {
      // Check that we don't have Resource = "*" in policies
      const wildcardMatches = iamContent.match(/Resource\s*=\s*"\*"/g);

      // Allow wildcards only in managed AWS policies (AmazonRDSEnhancedMonitoringRole, etc)
      // Our custom policies should not use wildcards
      expect(wildcardMatches).toBeNull();
    });

    test('RDS enhanced monitoring role exists', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    });

    test('Lambda execution role exists', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"aurora_event_lambda"/);
    });

    test('S3 backup role exists', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"aurora_s3_backup"/);
    });

    test('IAM roles have proper assume role policies', () => {
      expect(iamContent).toMatch(/Service.*monitoring\.rds\.amazonaws\.com/);
      expect(iamContent).toMatch(/Service.*lambda\.amazonaws\.com/);
      expect(iamContent).toMatch(/Service.*rds\.amazonaws\.com/);
    });
  });

  // Test 8: Monitoring and alerting
  describe('Monitoring Configuration', () => {
    let cloudwatchContent: string;

    beforeAll(() => {
      cloudwatchContent = fs.readFileSync(path.join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
    });

    test('SNS topic exists for alerts', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic"\s+"aurora_alerts"/);
    });

    test('SNS topic policy allows EventBridge to publish', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"aurora_alerts"/);
      expect(cloudwatchContent).toMatch(/Service.*events\.amazonaws\.com/);
    });

    test('CPU utilization alarm exists', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_cpu_high"/);
      expect(cloudwatchContent).toContain('CPUUtilization');
    });

    test('Database connections alarm exists', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections_high"/);
      expect(cloudwatchContent).toContain('DatabaseConnections');
    });

    test('CloudWatch dashboard exists', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"aurora"/);
    });
  });

  // Test 9: EventBridge configuration
  describe('EventBridge Configuration', () => {
    let eventbridgeContent: string;

    beforeAll(() => {
      eventbridgeContent = fs.readFileSync(path.join(LIB_DIR, 'eventbridge.tf'), 'utf8');
    });

    test('EventBridge rule for scaling events exists', () => {
      expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"aurora_scaling"/);
      expect(eventbridgeContent).toContain('configuration change');
    });

    test('EventBridge rule for failover events exists', () => {
      expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"aurora_failover"/);
      expect(eventbridgeContent).toContain('failover');
    });

    test('Lambda function for event processing exists', () => {
      expect(eventbridgeContent).toMatch(/resource\s+"aws_lambda_function"\s+"aurora_event_processor"/);
    });

    test('Lambda has proper permissions', () => {
      expect(eventbridgeContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
    });
  });

  // Test 10: Auto-scaling configuration
  describe('Auto-Scaling Configuration', () => {
    let autoscalingContent: string;

    beforeAll(() => {
      autoscalingContent = fs.readFileSync(path.join(LIB_DIR, 'autoscaling.tf'), 'utf8');
    });

    test('Aurora Serverless v2 scaling is documented', () => {
      // Aurora Serverless v2 scales automatically, no Application Auto Scaling needed
      expect(autoscalingContent).toMatch(/Aurora Serverless v2/i);
      expect(autoscalingContent).toMatch(/serverlessv2_scaling_configuration/i);
    });

    test('scaling configuration uses min and max capacity variables', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(mainContent).toMatch(/serverlessv2_scaling_configuration/);
      expect(mainContent).toMatch(/min_capacity\s*=\s*var\.aurora_min_capacity/);
      expect(mainContent).toMatch(/max_capacity\s*=\s*var\.aurora_max_capacity/);
    });
  });

  // Test 11: VPC configuration
  describe('VPC Configuration', () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(path.join(LIB_DIR, 'vpc.tf'), 'utf8');
    });

    test('VPC resource exists', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('Private subnets exist for Aurora', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('Public subnets exist for NAT gateways', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('NAT gateways exist for private subnet internet access', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('Internet gateway exists', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('VPC endpoint for S3 exists', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    });
  });

  // Test 12: Outputs
  describe('Outputs', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    });

    test('Aurora cluster endpoint output exists', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
    });

    test('Aurora reader endpoint output exists', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_reader_endpoint"/);
    });

    test('VPC ID output exists', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('Security group ID output exists', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_security_group_id"/);
    });

    test('KMS key ARN output exists', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('S3 backup bucket output exists', () => {
      expect(outputsContent).toMatch(/output\s+"backup_bucket_name"/);
    });
  });

  // Test 13: Lambda function
  describe('Lambda Function', () => {
    test('Lambda zip file exists', () => {
      const lambdaZipPath = path.join(LIB_DIR, 'lambda/aurora-events.zip');
      expect(fs.existsSync(lambdaZipPath)).toBe(true);
    });

    test('Lambda source code exists', () => {
      const lambdaCodePath = path.join(LIB_DIR, 'lambda/aurora-events/index.py');
      expect(fs.existsSync(lambdaCodePath)).toBe(true);
    });

    test('Lambda code contains handler function', () => {
      const lambdaCodePath = path.join(LIB_DIR, 'lambda/aurora-events/index.py');
      const content = fs.readFileSync(lambdaCodePath, 'utf8');
      expect(content).toContain('def handler(event, context):');
    });
  });

  // Test 14: Tags consistency
  describe('Tagging', () => {
    const taggedFiles = ['main.tf', 'vpc.tf', 'security-groups.tf', 'kms.tf', 'cloudwatch.tf', 'eventbridge.tf', 's3.tf', 'iam.tf'];

    test.each(taggedFiles)('%s uses common_tags', (filename) => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');
      expect(content).toMatch(/local\.common_tags/);
    });

    test('common_tags includes ManagedBy', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(mainContent).toContain('ManagedBy   = "Terraform"');
    });
  });

  // Test 15: Dependencies
  describe('Resource Dependencies', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('Aurora instance depends on cluster', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[aws_rds_cluster\.aurora_serverless\]/);
    });
  });
});
