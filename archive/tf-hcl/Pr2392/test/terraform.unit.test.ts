// Unit tests for Terraform secure AWS infrastructure configuration
// These tests validate the Terraform syntax, structure, and security requirements

import fs from 'fs';
import path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const mainPath = path.resolve(__dirname, '../lib/main.tf');
  const providerPath = path.resolve(__dirname, '../lib/provider.tf');
  const variablesPath = path.resolve(__dirname, '../lib/variables.tf');
  
  let mainContent = '';
  let providerContent = '';
  let variablesContent = '';

  beforeAll(() => {
    // Load Terraform files
    if (!fs.existsSync(mainPath)) {
      throw new Error(`main.tf not found at: ${mainPath}`);
    }
    if (!fs.existsSync(providerPath)) {
      throw new Error(`provider.tf not found at: ${providerPath}`);
    }
    if (!fs.existsSync(variablesPath)) {
      throw new Error(`variables.tf not found at: ${variablesPath}`);
    }

    mainContent = fs.readFileSync(mainPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
    variablesContent = fs.readFileSync(variablesPath, 'utf8');
  });

  describe('File Structure and Syntax', () => {
    test('all required files exist and are non-empty', () => {
      expect(mainContent.length).toBeGreaterThan(0);
      expect(providerContent.length).toBeGreaterThan(0);
      expect(variablesContent.length).toBeGreaterThan(0);
    });

    test('main.tf has proper resource structure', () => {
      // Should have resource blocks
      expect(mainContent).toMatch(/resource\s+"[^"]+"\s+"[^"]+"\s*{/);
      
      // Should have comments for documentation
      expect(mainContent).toMatch(/#.*\w+/);
    });

    test('provider.tf has correct AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(providerContent).toMatch(/required_providers/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('variables.tf defines required variables', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe('VPC and Network Resources', () => {
    test('VPC is properly configured', () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(mainContent).toMatch(/tags\s*=\s*{\s*Name\s*=\s*"web-app-vpc-274802"/);
    });

    test('Internet Gateway exists', () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(mainContent).toMatch(/Name\s*=\s*"main-igw-274802"/);
    });

    test('Public subnets are configured in multiple AZs', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(mainContent).toMatch(/availability_zone\s*=\s*"\$\{var\.aws_region\}a"/);
      expect(mainContent).toMatch(/availability_zone\s*=\s*"\$\{var\.aws_region\}b"/);
    });

    test('Route table and associations exist', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"main"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_secondary"/);
      expect(mainContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(mainContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });
  });

  describe('Security Group Configuration', () => {
    test('Security group allows only HTTPS traffic', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(mainContent).toMatch(/from_port\s*=\s*443/);
      expect(mainContent).toMatch(/to_port\s*=\s*443/);
      expect(mainContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(mainContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('Security group does NOT allow HTTP traffic', () => {
      // Should not have port 80 rules
      expect(mainContent).not.toMatch(/from_port\s*=\s*80/);
      expect(mainContent).not.toMatch(/to_port\s*=\s*80/);
    });

    test('Security group has proper egress rules', () => {
      expect(mainContent).toMatch(/egress\s*{/);
      expect(mainContent).toMatch(/from_port\s*=\s*0/);
      expect(mainContent).toMatch(/to_port\s*=\s*0/);
      expect(mainContent).toMatch(/protocol\s*=\s*"-1"/);
    });
  });

  describe('S3 Bucket and KMS Encryption', () => {
    test('KMS key is properly defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
      expect(mainContent).toMatch(/description\s*=\s*"S3 encryption key"/);
      expect(mainContent).toMatch(/Name\s*=\s*"s3-kms-key-274802"/);
    });

    test('S3 bucket uses modern configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app"/);
      expect(mainContent).toMatch(/bucket\s*=\s*"webapp-bucket-274802"/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_acl"/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    });

    test('S3 encryption uses KMS', () => {
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('S3 versioning is enabled', () => {
      expect(mainContent).toMatch(/versioning_configuration\s*{/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket policy exists for CloudTrail', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(mainContent).toMatch(/Service\s*=\s*"cloudtrail\.amazonaws\.com"/);
      expect(mainContent).toMatch(/s3:GetBucketAcl/);
      expect(mainContent).toMatch(/s3:PutObject/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('ECS task role follows least privilege', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
      expect(mainContent).toMatch(/"ecs-task-role-274802"/);
      expect(mainContent).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test('S3 read policy is restrictive', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_read"/);
      expect(mainContent).toMatch(/"s3-read-policy-274802"/);
      expect(mainContent).toMatch(/s3:GetObject/);
      expect(mainContent).toMatch(/s3:GetObjectVersion/);
      
      // Should reference specific bucket, not wildcard
      expect(mainContent).toMatch(/\$\{aws_s3_bucket\.app\.arn\}\/\*/);
    });

    test('IAM policy is attached to role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_read"/);
      expect(mainContent).toMatch(/role\s*=\s*aws_iam_role\.ecs_task\.name/);
      expect(mainContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.s3_read\.arn/);
    });

    test('CloudTrail IAM role exists', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"/);
      expect(mainContent).toMatch(/"cloudtrail-role-274802"/);
      expect(mainContent).toMatch(/Service\s*=\s*"cloudtrail\.amazonaws\.com"/);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail is properly configured', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(mainContent).toMatch(/"web-app-trail-274802"/);
      expect(mainContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.app\.bucket/);
      expect(mainContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(mainContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test('CloudTrail has CloudWatch integration', () => {
      expect(mainContent).toMatch(/cloud_watch_logs_group_arn/);
      expect(mainContent).toMatch(/cloud_watch_logs_role_arn/);
      expect(mainContent).toMatch(/aws_cloudwatch_log_group\.cloudtrail\.arn/);
    });

    test('CloudTrail monitors S3 data events', () => {
      expect(mainContent).toMatch(/event_selector\s*{/);
      expect(mainContent).toMatch(/data_resource\s*{/);
      expect(mainContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
      expect(mainContent).toMatch(/include_management_events\s*=\s*true/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch log group is encrypted', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
      expect(mainContent).toMatch(/retention_in_days\s*=\s*365/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('Metric filters exist for security monitoring', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"iam_policy_violations"/);
      expect(mainContent).toMatch(/"unauthorized-api-calls-274802"/);
      expect(mainContent).toMatch(/"iam-policy-violations-274802"/);
    });

    test('CloudWatch alarms are properly configured', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_access"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"iam_violations"/);
      expect(mainContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(mainContent).toMatch(/threshold\s*=\s*"0"/);
      expect(mainContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });

    test('Metric filter patterns are security-focused', () => {
      expect(mainContent).toMatch(/UnauthorizedOperation/);
      expect(mainContent).toMatch(/AccessDenied/);
      expect(mainContent).toMatch(/ConsoleLogin/);
      expect(mainContent).toMatch(/Failure/);
    });
  });

  describe('SNS Topic for Alerts', () => {
    test('SNS topic is configured with encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(mainContent).toMatch(/"security-alerts-274802"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources use 274802 prefix', () => {
      const resourcePattern = /"[^"]*274802[^"]*"/g;
      const matches = mainContent.match(resourcePattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(10);
    });

    test('no hardcoded account IDs or regions', () => {
      // Should not have hardcoded account IDs
      expect(mainContent).not.toMatch(/\d{12}/);
      
      // Should use variable for region
      expect(mainContent).toMatch(/var\.aws_region/);
    });

    test('no sensitive information in resource names', () => {
      // Check for common sensitive words that would indicate poor naming practices
      // Exclude AWS-specific legitimate usage patterns
      const sensitivePatternsToAvoid = [
        /password/i,
        /secret/i, 
        /admin/i,
        // Only check for "root" when it's not part of AWS IAM patterns
        /(?<!aws:iam::[^:]+:)root(?!"|\s*}\s*$)/i
      ];
      
      sensitivePatternsToAvoid.forEach((pattern, index) => {
        expect(mainContent).not.toMatch(pattern);
      });
    });
  });

  describe('Output Definitions', () => {
    test('required outputs are defined', () => {
      expect(mainContent).toMatch(/output\s+"vpc_id"/);
      expect(mainContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(mainContent).toMatch(/output\s+"kms_key_id"/);
      expect(mainContent).toMatch(/output\s+"cloudtrail_name"/);
      expect(mainContent).toMatch(/output\s+"security_group_id"/);
      expect(mainContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(mainContent).toMatch(/output\s+"cloudwatch_alarms"/);
    });

    test('outputs have proper descriptions', () => {
      expect(mainContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(mainContent).toMatch(/description\s*=\s*"Name of the S3 bucket"/);
      expect(mainContent).toMatch(/description\s*=\s*"CloudWatch alarm names for security monitoring"/);
    });

    test('complex outputs use proper JSON structure', () => {
      expect(mainContent).toMatch(/cloudwatch_alarms[\s\S]*unauthorized_access\s*=/);
      expect(mainContent).toMatch(/cloudwatch_alarms[\s\S]*iam_violations\s*=/);
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded secrets or credentials', () => {
      expect(mainContent).not.toMatch(/(password|secret|key|token)\s*=\s*"[^"]+"/i);
      expect(mainContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(mainContent).not.toMatch(/[0-9a-zA-Z\/\+]{40}/); // AWS Secret Key pattern
    });

    test('encryption is used throughout', () => {
      expect(mainContent).toMatch(/kms_key_id/);
      expect(mainContent).toMatch(/kms_master_key_id/);
      expect(mainContent).toMatch(/sse_algorithm/);
    });

    test('least privilege principle is followed', () => {
      // Should not use wildcard permissions
      expect(mainContent).not.toMatch(/"Action":\s*"\*"/);
      expect(mainContent).not.toMatch(/"Resource":\s*"\*"/);
      
      // Should have specific actions
      expect(mainContent).toMatch(/s3:GetObject/);
      expect(mainContent).toMatch(/logs:PutLogEvents/);
    });

    test('public access is restricted', () => {
      // Should not allow 0.0.0.0/0 on sensitive ports
      const httpPattern = /from_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/;
      expect(mainContent).not.toMatch(httpPattern);
      
      // HTTPS is allowed globally (as required)
      const httpsPattern = /from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/;
      expect(mainContent).toMatch(httpsPattern);
    });
  });

  describe('Terraform Syntax Validation', () => {
    test('resource blocks are properly formatted', () => {
      // Basic syntax check for resource blocks
      const resourceBlocks = mainContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      expect(resourceBlocks).toBeTruthy();
      expect(resourceBlocks!.length).toBeGreaterThan(15);
    });

    test('variable references use correct syntax', () => {
      expect(mainContent).toMatch(/var\.aws_region/);
      expect(mainContent).toMatch(/aws_vpc\.main\.id/);
      expect(mainContent).toMatch(/aws_kms_key\.s3\.arn/);
    });

    test('string interpolation is properly formatted', () => {
      expect(mainContent).toMatch(/\$\{[^}]+\}/);
      expect(mainContent).not.toMatch(/\$\{\s*\}/); // Empty interpolation
    });

    test('JSON encoding is used correctly', () => {
      expect(mainContent).toMatch(/jsonencode\(/);
      expect(mainContent).not.toMatch(/JSON\.stringify/); // Should use Terraform function
    });
  });

  describe('Infrastructure Components Validation', () => {
    test('all required AWS services are configured', () => {
      // VPC components
      expect(mainContent).toMatch(/aws_vpc/);
      expect(mainContent).toMatch(/aws_subnet/);
      expect(mainContent).toMatch(/aws_internet_gateway/);
      expect(mainContent).toMatch(/aws_route_table/);
      expect(mainContent).toMatch(/aws_security_group/);
      
      // Storage and encryption
      expect(mainContent).toMatch(/aws_s3_bucket/);
      expect(mainContent).toMatch(/aws_kms_key/);
      
      // IAM
      expect(mainContent).toMatch(/aws_iam_role/);
      expect(mainContent).toMatch(/aws_iam_policy/);
      
      // Monitoring
      expect(mainContent).toMatch(/aws_cloudtrail/);
      expect(mainContent).toMatch(/aws_cloudwatch/);
      expect(mainContent).toMatch(/aws_sns_topic/);
    });

    test('dependencies are properly defined', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[/);
      expect(mainContent).toMatch(/aws_s3_bucket_policy\.cloudtrail/);
    });

    test('resource tags are consistently applied', () => {
      const tagPattern = /tags\s*=\s*{\s*Name\s*=\s*"[^"]*274802[^"]*"/g;
      const tagMatches = mainContent.match(tagPattern);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(5);
    });
  });

  describe('Compliance Requirements', () => {
    test('multi-region deployment capability', () => {
      expect(mainContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(mainContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test('audit and compliance features', () => {
      expect(mainContent).toMatch(/retention_in_days/);
      expect(mainContent).toMatch(/enable_logging/);
      expect(mainContent).toMatch(/enable_log_file_validation/);
    });

    test('security monitoring is comprehensive', () => {
      expect(mainContent).toMatch(/UnauthorizedAPICalls/);
      expect(mainContent).toMatch(/IAMPolicyViolations/);
      expect(mainContent).toMatch(/CloudTrailMetrics/);
    });
  });
});