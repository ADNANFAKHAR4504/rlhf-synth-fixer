// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const BACKEND_PATH = path.resolve(__dirname, '../lib/backend.tf');

// Helper function to read file content
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

// Helper function to count resource occurrences
const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`,'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

// Helper function to check if resource has required tags
const hasRequiredTags = (content: string, resourceName: string): boolean => {
  const resourceRegex = new RegExp(`resource\\s+"[^"]+"\\s+"${resourceName}"[^{]*{[^}]*tags\\s*=.*cost-center.*=.*"1234"`, 's');
  return resourceRegex.test(content);
};

describe('Terraform Infrastructure Files', () => {
  describe('File Structure', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('backend.tf exists', () => {
      expect(fs.existsSync(BACKEND_PATH)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readFileContent(PROVIDER_PATH);
    });

    test('declares required Terraform version >= 1.5', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5/);
    });

    test('configures AWS provider ~> 5.0', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*"~>\s*5\.0/);
    });

    test('configures archive provider', () => {
      expect(providerContent).toMatch(/archive\s*=\s*{[\s\S]*version\s*=\s*"~>\s*2\.0/);
    });

    test('sets AWS region to us-west-2', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=\s*"us-west-2"/);
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      const stackContent = readFileContent(STACK_PATH);
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });
  });

  describe('Backend Configuration', () => {
    let backendContent: string;

    beforeAll(() => {
      backendContent = readFileContent(BACKEND_PATH);
    });

    test('declares environment_suffix variable', () => {
      expect(backendContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('creates S3 bucket for state with force_destroy', () => {
      expect(backendContent).toMatch(/resource\s+"aws_s3_bucket"\s+"terraform_state"/);
      expect(backendContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test('creates DynamoDB table for state locking', () => {
      expect(backendContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test('backend resources use environment_suffix for uniqueness', () => {
      expect(backendContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('backend resources have required tags', () => {
      expect(backendContent).toMatch(/tags.*cost-center.*=.*"1234"/s);
    });
  });

  describe('Main Stack Variables', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('declares all required variables', () => {
      const requiredVars = [
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'instance_type',
        'asg_min_size',
        'asg_max_size',
        'asg_desired_capacity',
        'db_engine',
        'db_instance_class',
        'db_username',
        'db_password',
        'notification_email',
        'log_lifecycle_days'
      ];

      requiredVars.forEach(varName => {
        expect(stackContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test('sensitive variables are marked as sensitive', () => {
      expect(stackContent).toMatch(/variable\s+"db_username"[\s\S]*sensitive\s*=\s*true/);
      expect(stackContent).toMatch(/variable\s+"db_password"[\s\S]*sensitive\s*=\s*true/);
    });

    test('declares common tags in locals', () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*common_tags[\s\S]*cost-center\s*=\s*"1234"/);
    });
  });

  describe('Networking Resources', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates VPC with DNS support', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('creates at least 2 public subnets', () => {
      // Check for public subnet resource declaration and count usage
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test('creates at least 2 private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('creates NAT Gateways for each public subnet', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*length\(aws_subnet\.public\)/);
    });

    test('creates Elastic IPs for NAT Gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('creates route tables for public and private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('associates subnets with route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe('Security Groups', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates ALB security group with HTTP/HTTPS ingress', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });

    test('creates App security group allowing traffic from ALB only', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('creates RDS security group allowing traffic from App only', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test('no SSH/RDP ports exposed to internet', () => {
      expect(stackContent).not.toMatch(/from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      expect(stackContent).not.toMatch(/from_port\s*=\s*3389[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe('Compute Resources', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates Launch Template with IMDSv2 required', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(stackContent).toMatch(/http_endpoint\s*=\s*"enabled"/);
    });

    test('creates Auto Scaling Group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(stackContent).toMatch(/min_size/);
      expect(stackContent).toMatch(/max_size/);
      expect(stackContent).toMatch(/desired_capacity/);
    });

    test('ASG uses private subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[/);
    });

    test('creates Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB uses public subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[/);
    });

    test('creates Target Group with health checks', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(stackContent).toMatch(/health_check\s*{/);
    });

    test('creates ALB listeners for HTTP and HTTPS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    });

    test('HTTP listener redirects to HTTPS', () => {
      expect(stackContent).toMatch(/redirect[\s\S]*protocol\s*=\s*"HTTPS"/);
    });

    test('configures auto-scaling policies', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"/);
      expect(stackContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
    });
  });

  describe('Database Resources', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates RDS instance with KMS encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id/);
    });

    test('enables Multi-AZ for RDS', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('creates RDS read replica', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"read_replica"/);
      expect(stackContent).toMatch(/replicate_source_db/);
    });

    test('creates DB subnet group using private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[/);
    });

    test('enables automated backups', () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
    });

    test('enables performance insights', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });
  });

  describe('Storage and CDN', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates S3 bucket for logs with versioning', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures S3 bucket encryption with KMS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('blocks public access to S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('configures S3 lifecycle rules', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(stackContent).toMatch(/transition\s*{/);
      expect(stackContent).toMatch(/expiration\s*{/);
    });

    test('creates CloudFront distribution', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test('CloudFront uses ALB as origin', () => {
      expect(stackContent).toMatch(/domain_name\s*=\s*aws_lb\.main\.dns_name/);
    });

    test('CloudFront enforces HTTPS', () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('CloudFront logging is enabled', () => {
      expect(stackContent).toMatch(/logging_config\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket_domain_name/);
    });
  });

  describe('Security and Compliance', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates KMS keys for encryption', () => {
      expect(countResourceOccurrences(stackContent, 'aws_kms_key')).toBeGreaterThanOrEqual(2);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates WAFv2 Web ACL', () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('WAF uses AWS managed rule groups', () => {
      expect(stackContent).toMatch(/managed_rule_group_statement/);
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('associates WAF with ALB', () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
      expect(stackContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
    });

    test('creates CloudTrail with management and data events', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(stackContent).toMatch(/event_selector\s*{/);
    });

    test('CloudTrail uses KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs_key\.arn/);
    });

    test('creates AWS Config recorder', () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test('creates Config delivery channel', () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test('creates Config rules for compliance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
    });

    test('enables VPC Flow Logs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe('Monitoring and Alerting', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates SNS topic for alerts', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('creates SNS topic subscription if email provided', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.notification_email\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('creates CloudWatch alarms for ASG', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm".*asg_cpu_high/);
    });

    test('creates CloudWatch alarms for ALB', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm".*alb_5xx/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm".*alb_response_time/);
    });

    test('creates CloudWatch alarms for RDS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm".*rds_cpu/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm".*rds_storage/);
    });

    test('alarms send notifications to SNS topic', () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });

    test('enables ALB access logs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"[\s\S]*access_logs\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test('creates CloudWatch Log Group for VPC Flow Logs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
      expect(stackContent).toMatch(/kms_key_id/);
    });
  });

  describe('Lambda Function', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates Lambda function', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"sample"/);
    });

    test('Lambda uses Python runtime', () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.\d+"/);
    });

    test('creates IAM role for Lambda', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda"/);
    });

    test('attaches basic execution policy to Lambda role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"/);
    });

    test('Lambda has environment variables', () => {
      expect(stackContent).toMatch(/environment\s*{[\s\S]*variables\s*=/);
    });

    test('Lambda logs to CloudWatch', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group".*lambda/);
    });
  });

  describe('IAM and Permissions', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('creates IAM role for EC2 instances', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test('creates instance profile for EC2', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('IAM policies follow least privilege principle', () => {
      // Check that policies don't use wildcard actions
      const policyMatches = stackContent.match(/Action"\s*:\s*"\*"/g);
      expect(policyMatches).toBeNull();
    });

    test('CloudTrail has necessary permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy".*cloudtrail/);
    });

    test('Config has necessary permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });
  });

  describe('Outputs', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('outputs VPC ID', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test('outputs subnet IDs', () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('outputs ALB DNS name', () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('outputs CloudFront domain', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain"/);
    });

    test('outputs RDS endpoint', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test('outputs S3 bucket name', () => {
      expect(stackContent).toMatch(/output\s+"logs_bucket"/);
    });

    test('outputs SNS topic ARN', () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('outputs KMS key ARNs', () => {
      expect(stackContent).toMatch(/output\s+"logs_kms_key_arn"/);
      expect(stackContent).toMatch(/output\s+"data_kms_key_arn"/);
    });
  });

  describe('Tagging Compliance', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('VPC has cost-center tag', () => {
      // Check that VPC uses common_tags (which contains cost-center)
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"[^}]*tags\s*=\s*merge\(local\.common_tags/);
    });

    test('all major resources reference common_tags', () => {
      const tagReferences = stackContent.match(/tags\s*=.*local\.common_tags/g);
      expect(tagReferences).not.toBeNull();
      expect(tagReferences!.length).toBeGreaterThan(10);
    });

    test('resources use merge for additional tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe('Data Sources', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFileContent(STACK_PATH);
    });

    test('uses SSM parameter for AMI lookup', () => {
      expect(stackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"amazon_linux_ami"/);
      expect(stackContent).toMatch(/\/aws\/service\/ami-amazon-linux-latest/);
    });

    test('uses availability zones data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test('uses caller identity data source', () => {
      // Check in backend.tf since that's where the data source is declared
      const backendContent = readFileContent(BACKEND_PATH);
      expect(backendContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });
});
