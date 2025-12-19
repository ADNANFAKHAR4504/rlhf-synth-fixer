import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  let providerConfig: string;
  let mainConfig: string;

  beforeAll(() => {
    providerConfig = fs.readFileSync(
      path.join(__dirname, '../lib/provider.tf'),
      'utf8'
    );
    mainConfig = fs.readFileSync(
      path.join(__dirname, '../lib/tap_stack.tf'),
      'utf8'
    );
  });

  describe('Provider Configuration', () => {
    test('should specify AWS provider version >= 5.0', () => {
      expect(providerConfig).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should set region to var.aws_region', () => {
      expect(providerConfig).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should include required_version >= 1.4.0', () => {
      expect(providerConfig).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  describe('VPC Configuration', () => {
    test('should define VPC with correct CIDR block', () => {
      expect(mainConfig).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should enable DNS hostnames and support', () => {
      expect(mainConfig).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainConfig).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  describe('Subnet Configuration', () => {
    test('should create 2 public subnets', () => {
      const publicSubnets = mainConfig.match(
        /resource\s+"aws_subnet"\s+"public"/g
      );
      expect(publicSubnets).toHaveLength(1);
      expect(mainConfig).toMatch(/count\s*=\s*2/);
    });

    test('should create 2 private subnets', () => {
      const privateSubnets = mainConfig.match(
        /resource\s+"aws_subnet"\s+"private"/g
      );
      expect(privateSubnets).toHaveLength(1);
    });

    test('should enable public IP mapping for public subnets', () => {
      expect(mainConfig).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });
  });

  describe('Security Group Configuration', () => {
    test('should restrict SSH access to specific CIDR', () => {
      expect(mainConfig).toMatch(/203\.0\.113\.0\/24/);
      expect(mainConfig).toMatch(/from_port\s*=\s*22/);
      expect(mainConfig).toMatch(/to_port\s*=\s*22/);
    });

    test('should allow all outbound traffic', () => {
      expect(mainConfig).toMatch(/from_port\s*=\s*0/);
      expect(mainConfig).toMatch(/to_port\s*=\s*0/);
      expect(mainConfig).toMatch(/protocol\s*=\s*"-1"/);
    });
  });

  describe('S3 Configuration', () => {
    test('should configure S3 bucket encryption', () => {
      expect(mainConfig).toMatch(
        /aws_s3_bucket_server_side_encryption_configuration/
      );
      expect(mainConfig).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should block public access', () => {
      expect(mainConfig).toMatch(/aws_s3_bucket_public_access_block/);
      expect(mainConfig).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('should enforce HTTPS connections', () => {
      expect(mainConfig).toMatch(/aws:SecureTransport/);
      expect(mainConfig).toMatch(/"false"/);
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM role for EC2', () => {
      expect(mainConfig).toMatch(/resource\s+"aws_iam_role"\s+"ec2_logs"/);
      expect(mainConfig).toMatch(/ec2\.amazonaws\.com/);
    });

    test('should include S3 access policy', () => {
      expect(mainConfig).toMatch(/s3:GetBucketLocation/);
      expect(mainConfig).toMatch(/s3:ListBucket/);
      expect(mainConfig).toMatch(/s3:GetObject/);
      expect(mainConfig).toMatch(/s3:PutObject/);
    });
  });

  describe('EC2 Configuration', () => {
    test('should launch t2.micro instances', () => {
      expect(mainConfig).toMatch(/instance_type\s*=\s*"t2\.micro"/);
    });

    test('should create 2 instances', () => {
      const instances = mainConfig.match(/resource\s+"aws_instance"\s+"app"/g);
      expect(instances).toHaveLength(1);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CPU utilization alarms', () => {
      expect(mainConfig).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(mainConfig).toMatch(/CPUUtilization/);
    });

    test('should set correct threshold and evaluation periods', () => {
      expect(mainConfig).toMatch(/threshold\s*=\s*"70"/);
      expect(mainConfig).toMatch(/evaluation_periods\s*=\s*"2"/);
      expect(mainConfig).toMatch(/period\s*=\s*"300"/);
    });
  });

  describe('Output Configuration', () => {
    test('should define all required outputs', () => {
      expect(mainConfig).toMatch(/output\s+"vpc_id"/);
      expect(mainConfig).toMatch(/output\s+"public_subnet_ids"/);
      expect(mainConfig).toMatch(/output\s+"private_subnet_ids"/);
      expect(mainConfig).toMatch(/output\s+"logs_bucket_name"/);
      expect(mainConfig).toMatch(/output\s+"instance_ids"/);
    });
  });
});
