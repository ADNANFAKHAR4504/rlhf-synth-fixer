import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

describe('Terraform Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;
  let tapStackOnly: string;

  beforeAll(() => {
    // Recursively read all .tf files under lib/ and concatenate contents
    const readAllTf = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const contents: string[] = [];
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) contents.push(...readAllTf(full));
        else if (e.isFile() && full.endsWith('.tf'))
          contents.push(fs.readFileSync(full, 'utf8'));
      }
      return contents;
    };

    stackContent = readAllTf(LIB_DIR).join('\n');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
    const TAP_STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
    tapStackOnly = fs.readFileSync(TAP_STACK_PATH, 'utf8');
  });

  describe('File Structure', () => {
    test('lib directory exists', () => {
      expect(fs.existsSync(LIB_DIR)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('does NOT declare provider in tap_stack.tf', () => {
      expect(tapStackOnly).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe('Variables', () => {
    test('declares required variables', () => {
      const requiredVars = [
        'aws_region',
        'project_name',
        'environment_name',
        'environment_suffix',
        'notification_email',
        'allowed_ssh_cidrs',
        'instance_type',
        'enable_vpc_flow_logs',
        'enable_cloudtrail',
        'tags',
      ];

      requiredVars.forEach(varName => {
        expect(stackContent).toMatch(
          new RegExp(`variable\\s+"${varName}"\\s*{`)
        );
      });
    });

    test('has proper variable validations', () => {
      expect(stackContent).toMatch(
        /validation\s*{[\s\S]*?condition\s*=[\s\S]*?error_message/
      );
    });

    test('aws_region has default value', () => {
      expect(stackContent).toMatch(
        /variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"us-east-1"/
      );
    });

    test('instance_type has valid default', () => {
      expect(stackContent).toMatch(
        /variable\s+"instance_type"\s*{[\s\S]*?default\s*=\s*"t3\.micro"/
      );
    });
  });

  describe('Data Sources', () => {
    test('uses correct AMI data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"al2023_ami"/);
      expect(stackContent).toMatch(/al2023-ami-kernel-6\.1-x86_64/);
    });

    test('fetches availability zones', () => {
      expect(stackContent).toMatch(
        /data\s+"aws_availability_zones"\s+"available"/
      );
    });

    test('gets caller identity', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with proper CIDR', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates internet gateway', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_internet_gateway"\s+"main"/
      );
    });

    test('creates public and private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.public_subnets/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.private_subnets/);
    });

    test('creates NAT gateways with EIPs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('creates route tables and associations', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"public"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_route_table_association"\s+"private"/
      );
    });
  });

  describe('S3 Configuration', () => {
    test('creates logging and data buckets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logging"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
    });

    test('enables versioning on buckets', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"logging"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"data"/
      );
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures encryption', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/
      );
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('blocks public access', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"/
      );
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('enforces TLS-only policy', () => {
      expect(stackContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+"s3_tls_only"/
      );
      expect(stackContent).toMatch(/aws:SecureTransport/);
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      // Inspect only the EC2 security group block to ensure it uses 'name' and not 'name_prefix'
      const sgMatch = stackContent.match(
        /resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?}/
      );
      expect(sgMatch).not.toBeNull();
      const sgBlock = sgMatch ? sgMatch[0] : '';
      expect(sgBlock).toMatch(/\bname\s*=/);
      expect(sgBlock).not.toMatch(/\bname_prefix\s*=/);
    });

    test('configures SSH access conditionally', () => {
      expect(stackContent).toMatch(/dynamic\s+"ingress"/);
      expect(stackContent).toMatch(
        /for_each\s*=\s*length\(var\.allowed_ssh_cidrs\)\s*>\s*0/
      );
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
    });

    test('allows outbound traffic', () => {
      expect(stackContent).toMatch(
        /egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0/
      );
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe('EC2 Configuration', () => {
    test('creates launch template', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      // Accept either direct image_id reference or module input ami_id being set from the SSM parameter
      const amiPattern = new RegExp(
        '(image_id\\s*=\\s*data\\.aws_ssm_parameter\\.al2023_ami\\.value)' +
          '|' +
          '(ami_id\\s*=\\s*data\\.aws_ssm_parameter\\.al2023_ami\\.value)'
      );
      expect(stackContent).toMatch(amiPattern);
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    test('configures IAM instance profile', () => {
      // Accept inline resource reference, module output, or module input variable
      const pattern = new RegExp(
        '(iam_instance_profile\\s*{\\s*name\\s*=\\s*aws_iam_instance_profile\\.ec2\\.name)' +
          '|' +
          '(iam_instance_profile\\s*{\\s*name\\s*=\\s*module\\.iam\\.ec2_instance_profile_name)' +
          '|' +
          '(iam_instance_profile\\s*{\\s*name\\s*=\\s*var\\.ec2_instance_profile_name)'
      );
      expect(stackContent).toMatch(pattern);
    });

    test('includes user data for SSM', () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(stackContent).toMatch(/amazon-ssm-agent/);
    });

    test('creates auto scaling group', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_autoscaling_group"\s+"main"/
      );
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*2/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*1/);
    });
  });

  describe('Logging and Monitoring', () => {
    test('creates CloudWatch log groups', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow"/
      );
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/);
    });

    test('configures CloudTrail', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test('sets up VPC Flow Logs conditionally', () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
      expect(stackContent).toMatch(
        /count\s*=\s*var\.enable_vpc_flow_logs\s*\?\s*1\s*:\s*0/
      );
    });
  });

  describe('IAM Configuration', () => {
    test('creates necessary IAM roles', () => {
      const roles = ['cloudtrail', 'vpc_flow', 'ec2', 'lambda'];
      roles.forEach(role => {
        expect(stackContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_role"\\s+"${role}"`)
        );
      });
    });

    test('uses policy documents for assume role policies', () => {
      expect(stackContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+".*_assume"/
      );
    });

    test('creates instance profile for EC2', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_instance_profile"\s+"ec2"/
      );
    });
  });

  describe('Lambda Function', () => {
    test('creates security group remediation function', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_lambda_function"\s+"sg_remediation"/
      );
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.handler"/);
    });

    test('includes inline Lambda code', () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"sg_remediation"/);
      expect(stackContent).toMatch(/import boto3/);
      expect(stackContent).toMatch(/AuthorizeSecurityGroupIngress/);
    });

    test('configures EventBridge trigger', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"sg_changes"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_event_target"\s+"lambda"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/
      );
    });
  });

  describe('Alerting', () => {
    test('creates SNS topic and subscription', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(stackContent).toMatch(
        /resource\s+"aws_sns_topic_subscription"\s+"email"/
      );
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test('configures CloudWatch alarm', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_calls"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_calls"/
      );
      expect(stackContent).toMatch(/UnauthorizedOperation/);
    });
  });

  describe('Outputs', () => {
    test('defines all required outputs', () => {
      const outputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'nat_gateway_ids',
        'asg_name',
        'data_bucket_name',
        'logging_bucket_name',
        'cloudtrail_name',
        'sns_topic_arn',
        'lambda_function_name',
        'lambda_function_arn',
      ];

      outputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });
  });

  describe('Provider Configuration', () => {
    test('uses variable for AWS region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('pins Terraform and AWS provider versions', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe('Security Best Practices', () => {
    test('uses least privilege IAM policies', () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"/);
      expect(stackContent).not.toMatch(/"Action":\s*"\*"/);
    });

    test('encrypts S3 buckets', () => {
      expect(stackContent).toMatch(/server_side_encryption_configuration/);
    });

    test('blocks public S3 access', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('uses private subnets for EC2', () => {
      // Accept inline comprehension, module output reference, or module input variable used within compute module
      const pattern = new RegExp(
        '(vpc_zone_identifier\\s*=\\s*\\[for subnet in aws_subnet\\.private : subnet\\.id\\])' +
          '|' +
          '(vpc_zone_identifier\\s*=\\s*module\\.network\\.private_subnet_ids)' +
          '|' +
          '(vpc_zone_identifier\\s*=\\s*var\\.private_subnet_ids)'
      );
      expect(stackContent).toMatch(pattern);
    });

    test('enables CloudTrail logging', () => {
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });
  });

  describe('Tagging', () => {
    test('defines common tags in locals', () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment_name/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('applies tags to resources', () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });
});
