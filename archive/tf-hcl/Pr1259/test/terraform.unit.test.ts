// Unit tests for Terraform secure infrastructure
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');
  
  describe('File Structure', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'tap_stack.tf',
      'security.tf',
      'iam.tf',
      'storage.tf',
      'monitoring.tf',
      'compute.tf',
      'outputs.tf'
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Variables', () => {
    test('variables.tf contains required variables', () => {
      const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"resource_prefix"/);
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"allowed_cidr_blocks"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/variable\s+"enable_detailed_monitoring"/);
    });

    test('environment_suffix variable has proper description', () => {
      const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(content).toMatch(/environment_suffix.*description.*pr123.*dev/s);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf configures AWS provider', () => {
      const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/required_providers[\s\S]*aws[\s\S]*source\s*=\s*"hashicorp\/aws"/);
    });

    test('provider.tf uses S3 backend', () => {
      const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test('provider uses variable for region', () => {
      const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Security Resources', () => {
    test('KMS key is configured with rotation', () => {
      const content = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_kms_key"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('Security groups are defined', () => {
      const content = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ssh"/);
    });

    test('GuardDuty is enabled', () => {
      const content = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_guardduty_detector"/);
      expect(content).toMatch(/enable\s*=\s*true/);
    });

    test('Security Hub is configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_securityhub_account"/);
    });
  });

  describe('IAM Resources', () => {
    test('EC2 IAM role follows least privilege', () => {
      const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_policy"/);
    });

    test('IAM roles use environment suffix', () => {
      const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('Storage Resources', () => {
    test('S3 buckets have encryption configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'storage.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('S3 buckets have versioning enabled', () => {
      const content = fs.readFileSync(path.join(libPath, 'storage.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 buckets block public access', () => {
      const content = fs.readFileSync(path.join(libPath, 'storage.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('S3 bucket logging is configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'storage.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"/);
    });
  });

  describe('Networking Resources', () => {
    test('VPC is configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Subnets are configured for multiple AZs', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*2/);
    });

    test('VPC Flow Logs are enabled', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_flow_log"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe('Compute Resources', () => {
    test('Launch template uses encrypted EBS', () => {
      const content = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_launch_template"/);
      expect(content).toMatch(/encrypted\s*=\s*true/);
    });

    test('Auto Scaling Group is configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"/);
      expect(content).toMatch(/health_check_type\s*=\s*"EC2"/);
    });

    test('Load Balancer is configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('Instance metadata uses IMDSv2', () => {
      const content = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');
      expect(content).toMatch(/http_tokens\s*=\s*"required"/);
    });
  });

  describe('Monitoring Resources', () => {
    test('CloudWatch Log Group uses KMS encryption', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe('Outputs', () => {
    test('Essential outputs are defined', () => {
      const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"kms_key_id"/);
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"load_balancer_dns_name"/);
      expect(content).toMatch(/output\s+"security_group_ids"/);
      expect(content).toMatch(/output\s+"guardduty_detector_id"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Resources use environment suffix for uniqueness', () => {
      const files = ['tap_stack.tf', 'security.tf', 'iam.tf', 'storage.tf', 'monitoring.tf', 'compute.tf'];
      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf8');
        // Check that environment_suffix is used in resource names
        expect(content).toMatch(/\$\{var\.resource_prefix\}-\$\{var\.environment_suffix\}/);
      });
    });
  });
});