import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Helper to count occurrences of regex matches
  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'vpc_cidr',
        'environments',
        'instance_type',
        'alert_email'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines all expected locals', () => {
      const expectedLocals = [
        'common_tags',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'env_suffixes',
        'resource_names'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags contains required standard tag keys', () => {
      ['ManagedBy', 'Project', 'Region'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
      );
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    ['aws_availability_zones', 'aws_ami', 'aws_caller_identity'].forEach(ds =>
      test(`data source ${ds} defined`, () => {
        expect(tfContent).toMatch(new RegExp(`data\\s+"${ds}"`));
      })
    );
  });

  // -------------------------
  // Random Resources
  // -------------------------
  describe('Random Resources', () => {
    test('random_string env_suffix created for each environment', () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"env_suffix"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
      expect(tfContent).toMatch(/length\s*=\s*4/);
    });
  });

  // -------------------------
  // KMS Keys and Aliases
  // -------------------------
  describe('KMS Resources', () => {
    test('KMS keys and aliases for S3 encryption are present with rotation enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption"/);
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_encryption"/);
    });
  });

  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC, Internet Gateway, Public and Private Subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('NAT Gateways and Elastic IPs configured with dependency on Internet Gateway', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Route tables and route table associations exist for public and private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    test('EC2 security groups defined per environment with proper ingress and egress rules', () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);

      // Check SSH port 22 ingress condition on prod and others
      expect(tfContent).toMatch(/from_port\s*=\s*22/);
      expect(tfContent).toMatch(/cidr_blocks\s*=\s*each\.key\s*==\s*"prod"\s*\? \["10\.0\.0\.0\/16"\] : \["0\.0\.0\.0\/0"\]/);
      // HTTP and HTTPS ingress
      expect(tfContent).toMatch(/from_port\s*=\s*80/);
      expect(tfContent).toMatch(/from_port\s*=\s*443/);
      // Egress all traffic
      expect(tfContent).toMatch(/protocol\s*=\s*"-1"/);
    });
  });

  // -------------------------
  // IAM Roles and Policies
  // -------------------------
  describe('IAM Roles and Policies', () => {
    test('IAM role, policy, and instance profile for EC2 per environment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_access"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudwatch_logs"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);

      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
      expect(tfContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });

    test('IAM role, policy and trust for CloudTrail', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudtrail_cloudwatch"/);
    });
  });

  // -------------------------
  // S3 Buckets and Configurations
  // -------------------------
  describe('S3 Buckets', () => {
    test('S3 bucket per environment with public access block, versioning and encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"environment"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"environment"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"environment"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"environment"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
    });

    test('CloudTrail S3 bucket and bucket policy resources exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });
  });

  // -------------------------
  // EC2 Instances
  // -------------------------
  describe('EC2 Instances', () => {
    test('EC2 instances created per environment with correct AMI, instance type, subnet, SG, and IAM profile', () => {
      expect(tfContent).toMatch(/resource\s+"aws_instance"\s+"environment"/);
      expect(tfContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(tfContent).toMatch(/instance_type\s*=\s*var\.instance_type\[each\.key\]/);
      expect(tfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\[each\.key\]\.id\]/);
      expect(tfContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\[each.key\]\.name/);
      expect(tfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[0\]\.id/);
      expect(tfContent).toMatch(/user_data\s*=\s*<<-EOF/);
      expect(tfContent).toMatch(/root_block_device\s*\{/);
    });
  });

  // -------------------------
  // CloudTrail and CloudWatch Log Groups
  // -------------------------
  describe('CloudTrail and Logs', () => {
    test('CloudTrail trail and CloudWatch Log Groups per environment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"environment"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
    });
  });

  // -------------------------
  // CloudWatch Monitoring and SNS Alerts
  // -------------------------
  describe('CloudWatch Alarms and SNS Topics', () => {
    test('SNS topics and subscriptions per environment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
    });

    test('CloudWatch alarms for EC2 CPU and status check per environment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"instance_status_check"/);
    });

    test('CloudWatch dashboards for each environment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"environment"/);
      expect(tfContent).toMatch(/for_each\s*=\s*toset\(var\.environments\)/);
      expect(tfContent).toMatch(/dashboard_name\s*=/);
      expect(tfContent).toMatch(/dashboard_body\s*=/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'nat_gateway_ids',
      'nat_gateway_public_ips',
      'internet_gateway_id',
      'ec2_instance_ids',
      'ec2_instance_private_ips',
      'ec2_instance_public_ips',
      's3_bucket_ids',
      's3_bucket_arns',
      's3_bucket_domains',
      'cloudtrail_s3_bucket_id',
      'iam_role_arns',
      'iam_role_names',
      'iam_instance_profile_names',
      'cloudtrail_arns',
      'cloudtrail_names',
      'cloudwatch_log_group_names',
      'sns_topic_arns',
      'kms_key_ids',
      'kms_key_arns',
      'security_group_ids',
      'ami_id',
      'ami_name',
      'environment_suffixes',
      'public_route_table_id',
      'private_route_table_ids',
      'cloudwatch_dashboard_urls',
      'aws_account_id',
      'aws_region',
    ];

    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
