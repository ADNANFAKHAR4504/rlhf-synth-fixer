import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

describe('Terraform Configuration Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
  });

  describe('File Structure and Basic Requirements', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test('provider.tf exists and is readable', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('declares aws_region variable in tap_stack.tf', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });
  });

  describe('Variable Definitions', () => {
    test('defines required variables', () => {
      const requiredVariables = [
        'ec2_instance_type',
        'ec2_key_pair_name',
        'aws_region',
        'secondary_aws_region',
        'db_password',
        'allowed_cidr_blocks'
      ];

      requiredVariables.forEach(variable => {
        expect(stackContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test('db_password variable is marked as sensitive', () => {
      expect(stackContent).toMatch(/variable\s+"db_password"\s*{[^}]*sensitive\s*=\s*true/);
    });

    test('allowed_cidr_blocks is defined as list of strings', () => {
      expect(stackContent).toMatch(/variable\s+"allowed_cidr_blocks"\s*{[^}]*type\s*=\s*list\(string\)/);
    });
  });

  describe('Data Sources', () => {
    test('defines AMI data sources for both regions', () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_us_east_1"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_eu_west_1"/);
    });

    test('AMI data sources use correct filters', () => {
      expect(stackContent).toMatch(/filter\s*{\s*name\s*=\s*"name"\s*values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/);
      expect(stackContent).toMatch(/filter\s*{\s*name\s*=\s*"virtualization-type"\s*values\s*=\s*\["hvm"\]/);
    });

    test('secondary AMI data source uses correct provider', () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_eu_west_1"\s*{[^}]*provider\s*=\s*aws\.eu_west_1/);
    });
  });

  describe('KMS Configuration', () => {
    test('defines KMS keys for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
    });

    test('KMS keys have proper deletion window', () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test('KMS aliases are defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"/);
    });

    test('secondary KMS resources use correct provider', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"\s*{[^}]*provider\s*=\s*aws\.eu_west_1/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"\s*{[^}]*provider\s*=\s*aws\.eu_west_1/);
    });
  });

  describe('VPC Configuration', () => {
    test('defines VPCs for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test('VPCs have correct CIDR blocks', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test('VPCs have DNS enabled', () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('secondary VPC uses correct provider', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"\s*{[^}]*provider\s*=\s*aws\.eu_west_1/);
    });
  });

  describe('Networking Components', () => {
    test('defines internet gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test('defines subnets for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_private"/);
    });

    test('public subnets have auto-assign public IP enabled', () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('defines route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"secondary_public"/);
    });
  });

  describe('VPC Peering', () => {
    test('defines VPC peering connection', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection"\s+"primary_to_secondary"/);
    });

    test('defines VPC peering accepter', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"\s+"secondary"/);
    });

    test('defines routes for peering', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"primary_to_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"secondary_to_primary"/);
    });
  });

  describe('Security Groups', () => {
    test('defines security groups for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"secondary"/);
    });

    test('SSH access is restricted to allowed CIDR blocks', () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
    });

    test('security groups have proper egress rules', () => {
      expect(stackContent).toMatch(/egress\s*{[^}]*from_port\s*=\s*0[^}]*to_port\s*=\s*0[^}]*protocol\s*=\s*"-1"/);
    });
  });

  describe('S3 Configuration', () => {
    test('defines S3 buckets for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary"/);
    });

    test('defines logging S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logging"/);
    });

    test('S3 buckets have encryption enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/);
    });

    test('S3 buckets use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.secondary\.arn/);
    });

    test('S3 buckets have versioning enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/);
    });

    test('defines S3 replication configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary"/);
    });
  });

  describe('DynamoDB Configuration', () => {
    test('defines DynamoDB tables for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"secondary"/);
    });

    test('DynamoDB tables have encryption enabled', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/);
    });

    test('DynamoDB tables use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.secondary\.arn/);
    });

    test('defines DynamoDB global table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_global_table"\s+"main"/);
    });

    test('global table has replicas for both regions', () => {
      expect(stackContent).toMatch(/replica\s*{[^}]*region_name\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/replica\s*{[^}]*region_name\s*=\s*"eu-west-1"/);
    });
  });

  describe('RDS Configuration', () => {
    test('defines RDS instances for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"secondary"/);
    });

    test('RDS instances have encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('RDS instances use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.secondary\.arn/);
    });

    test('RDS instances are Multi-AZ', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('RDS instances use variable for password', () => {
      expect(stackContent).toMatch(/password\s*=\s*var\.db_password/);
    });

    test('defines DB subnet groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
    });
  });

  describe('EC2 Configuration', () => {
    test('defines EC2 instances for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"secondary"/);
    });

    test('EC2 instances use correct AMI data sources', () => {
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_us_east_1\.id/);
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_eu_west_1\.id/);
    });

    test('EC2 instances use variables for instance type and key pair', () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.ec2_instance_type/);
      expect(stackContent).toMatch(/key_name\s*=\s*var\.ec2_key_pair_name/);
    });

    test('EC2 root block devices are encrypted', () => {
      expect(stackContent).toMatch(/root_block_device\s*{[^}]*encrypted\s*=\s*true/);
    });

    test('EC2 root block devices use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.secondary\.arn/);
    });
  });

  describe('IAM Configuration', () => {
    test('defines IAM role for global access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"global_role"/);
    });

    test('defines IAM policy for global access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"global_policy"/);
    });

    test('IAM role has proper assume role policy', () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });

    test('IAM policy follows least privilege principle', () => {
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"dynamodb:GetItem"/);
      expect(stackContent).toMatch(/"dynamodb:PutItem"/);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('defines CloudTrail for both regions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"secondary"/);
    });

    test('CloudTrail uses S3 logging bucket', () => {
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.logging\.bucket/);
    });

    test('CloudTrail uses KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.secondary\.arn/);
    });

    test('CloudTrail has event selectors configured', () => {
      expect(stackContent).toMatch(/event_selector\s*{[^}]*read_write_type\s*=\s*"All"/);
    });
  });

  describe('S3 Bucket Policies', () => {
    test('defines S3 bucket policy for CloudTrail', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logging"/);
    });

    test('S3 bucket policy allows CloudTrail access', () => {
      expect(stackContent).toMatch(/Service\s*=\s*"cloudtrail\.amazonaws\.com"/);
    });
  });

  describe('Lifecycle Configuration', () => {
    test('defines S3 lifecycle configuration for logging', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logging"/);
    });

    test('lifecycle configuration has expiration rules', () => {
      expect(stackContent).toMatch(/expiration\s*{[^}]*days\s*=\s*90/);
    });
  });

  describe('Outputs', () => {
    test('defines outputs for critical resources', () => {
      const requiredOutputs = [
        'primary_vpc_id',
        'secondary_vpc_id',
        'primary_rds_endpoint',
        'secondary_rds_endpoint',
        'primary_s3_bucket_name',
        'secondary_s3_bucket_name',
        'logging_s3_bucket_name',
        'primary_ec2_instance_id',
        'secondary_ec2_instance_id',
        'primary_kms_key_id',
        'secondary_kms_key_id',
        'dynamodb_global_table_name',
        'vpc_peering_connection_id'
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test('sensitive outputs are marked as sensitive', () => {
      expect(stackContent).toMatch(/output\s+"primary_rds_endpoint"\s*{[^}]*sensitive\s*=\s*true/);
      expect(stackContent).toMatch(/output\s+"secondary_rds_endpoint"\s*{[^}]*sensitive\s*=\s*true/);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf defines required providers', () => {
      expect(providerContent).toMatch(/required_providers\s*{[^}]*aws\s*=\s*{[^}]*source\s*=\s*"hashicorp\/aws"/);
    });

    test('provider.tf defines primary AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*region\s*=\s*"us-east-1"/);
    });

    test('provider.tf defines secondary AWS provider with alias', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"eu_west_1"[^}]*region\s*=\s*"eu-west-1"/);
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded passwords in plain text', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*"/);
    });

    test('RDS instances are not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('EC2 instances use encrypted volumes', () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('all storage resources use KMS encryption', () => {
      // Check that S3, RDS, and EC2 all reference KMS keys
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\./);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\./);
    });
  });

  describe('Resource Dependencies', () => {
    test('VPC peering has proper dependencies', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test('S3 replication has proper dependencies', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_versioning\.primary\]/);
    });

    test('DynamoDB global table has proper dependencies', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_dynamodb_table\.primary[^\]]*aws_dynamodb_table\.secondary[^\]]*\]/);
    });
  });
});
