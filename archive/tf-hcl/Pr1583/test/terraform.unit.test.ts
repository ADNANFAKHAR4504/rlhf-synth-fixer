// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform HCL secure web application infrastructure
// Tests file structure, variable declarations, module configurations, and security settings
// No Terraform commands are executed - static analysis only

import * as fs from 'fs';
import * as path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const libPath = path.resolve(__dirname, '../lib');

describe('Terraform HCL Infrastructure Unit Tests', () => {
  describe('File Structure and Existence', () => {
    test('main stack file (tap_stack.tf) exists', () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test('provider.tf exists and is separate from main stack', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('all required modules exist', () => {
      const modulesPath = path.join(libPath, 'modules');
      const requiredModules = ['vpc', 'security', 'storage', 'compute'];

      requiredModules.forEach(module => {
        const modulePath = path.join(modulesPath, module);
        expect(fs.existsSync(modulePath)).toBe(true);

        const moduleFile = path.join(modulePath, 'tap_stack.tf');
        expect(fs.existsSync(moduleFile)).toBe(true);
      });
    });
  });

  describe('Provider and Backend Configuration', () => {
    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(content).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });

    test('provider.tf contains correct AWS provider configuration', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
    });
  });

  describe('Variable Declarations', () => {
    test('declares aws_region variable in tap_stack.tf', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('aws_region defaults to us-west-2 as required', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      const regionMatch = content.match(
        /variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/
      );
      expect(regionMatch).toBeTruthy();
      expect(regionMatch![1]).toBe('us-west-2');
    });

    test('declares required infrastructure variables', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      const requiredVars = [
        'vpc_name',
        'vpc_cidr',
        'public_subnet_cidrs',
        'bucket_name',
        'instance_type',
      ];

      requiredVars.forEach(varName => {
        expect(content).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("vpc_name defaults to 'secure-network' as required", () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      const vpcNameMatch = content.match(
        /variable\s+"vpc_name"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/
      );
      expect(vpcNameMatch).toBeTruthy();
      expect(vpcNameMatch![1]).toBe('secure-network');
    });
  });

  describe('Module Configurations', () => {
    test('uses modular approach with all required modules', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      const requiredModules = ['vpc', 'security', 'storage', 'compute'];

      requiredModules.forEach(module => {
        expect(content).toMatch(new RegExp(`module\\s+"${module}"\\s*{`));
        expect(content).toMatch(
          new RegExp(`source\\s*=\\s*"./modules/${module}"`)
        );
      });
    });

    test('modules have proper dependencies', () => {
      const content = fs.readFileSync(stackPath, 'utf8');

      // Security module should depend on VPC and Storage
      expect(content).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
      expect(content).toMatch(/bucket_arn\s*=\s*module\.storage\.bucket_arn/);

      // Compute module should depend on VPC and Security
      expect(content).toMatch(
        /security_group_id\s*=\s*module\.security\.web_security_group_id/
      );
      expect(content).toMatch(
        /iam_instance_profile\s*=\s*module\.security\.ec2_instance_profile_name/
      );
    });
  });

  describe('Output Declarations', () => {
    test('declares all required outputs', () => {
      const content = fs.readFileSync(stackPath, 'utf8');
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'ec2_instance_id',
        'ec2_public_ip',
        's3_bucket_name',
        'web_security_group_id',
      ];

      requiredOutputs.forEach(output => {
        expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });
  });

  describe('VPC Module Configuration', () => {
    let vpcContent: string;

    beforeAll(() => {
      const vpcPath = path.join(libPath, 'modules', 'vpc', 'tap_stack.tf');
      vpcContent = fs.readFileSync(vpcPath, 'utf8');
    });

    test('creates VPC with proper configuration', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates Internet Gateway', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('creates public subnets with proper configuration', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates route table for public subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(vpcContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(vpcContent).toMatch(
        /gateway_id\s*=\s*aws_internet_gateway\.main\.id/
      );
    });
  });

  describe('Security Module Configuration', () => {
    let securityContent: string;

    beforeAll(() => {
      const securityPath = path.join(
        libPath,
        'modules',
        'security',
        'tap_stack.tf'
      );
      securityContent = fs.readFileSync(securityPath, 'utf8');
    });

    test('creates security group with HTTP/HTTPS only', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_security_group"\s+"web"/
      );

      // Check for HTTP rule
      expect(securityContent).toMatch(/from_port\s*=\s*80/);
      expect(securityContent).toMatch(/to_port\s*=\s*80/);

      // Check for HTTPS rule
      expect(securityContent).toMatch(/from_port\s*=\s*443/);
      expect(securityContent).toMatch(/to_port\s*=\s*443/);
    });

    test('creates Network ACL with proper rules', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_network_acl"\s+"public"/
      );
      expect(securityContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
      expect(securityContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443/);
    });

    test('creates IAM role for EC2 with minimal permissions', () => {
      expect(securityContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(securityContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test('creates IAM policy with only s3:PutObject permission', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_iam_policy"\s+"s3_logs_policy"/
      );
      expect(securityContent).toMatch(/"s3:PutObject"/);
      expect(securityContent).not.toMatch(/"s3:GetObject"/);
      expect(securityContent).not.toMatch(/"s3:\*"/);
    });

    test('creates instance profile', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
      );
    });
  });

  describe('Storage Module Configuration', () => {
    let storageContent: string;

    beforeAll(() => {
      const storagePath = path.join(
        libPath,
        'modules',
        'storage',
        'tap_stack.tf'
      );
      storageContent = fs.readFileSync(storagePath, 'utf8');
    });

    test('creates S3 bucket with random suffix', () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(storageContent).toMatch(
        /resource\s+"random_string"\s+"bucket_suffix"/
      );
    });

    test('enables S3 bucket versioning', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"logs"/
      );
      expect(storageContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures server-side encryption', () => {
      expect(storageContent).toMatch(
        /aws_s3_bucket_server_side_encryption_configuration/
      );
      expect(storageContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('blocks public access', () => {
      expect(storageContent).toMatch(/aws_s3_bucket_public_access_block/);
      expect(storageContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(storageContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('enforces HTTPS connections', () => {
      expect(storageContent).toMatch(/aws_s3_bucket_policy/);
      expect(storageContent).toMatch(/aws:SecureTransport.*false/);
    });
  });

  describe('Compute Module Configuration', () => {
    let computeContent: string;

    beforeAll(() => {
      const computePath = path.join(
        libPath,
        'modules',
        'compute',
        'tap_stack.tf'
      );
      computeContent = fs.readFileSync(computePath, 'utf8');
    });

    test('uses latest Amazon Linux 2 AMI', () => {
      expect(computeContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(computeContent).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
      expect(computeContent).toMatch(/most_recent\s*=\s*true/);
    });

    test('creates EC2 instance with proper configuration', () => {
      expect(computeContent).toMatch(/resource\s+"aws_instance"\s+"web"/);
      expect(computeContent).toMatch(
        /ami\s*=\s*data\.aws_ami\.amazon_linux\.id/
      );
    });

    test('configures encrypted root volume', () => {
      expect(computeContent).toMatch(/root_block_device\s*{/);
      expect(computeContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('includes user data script', () => {
      expect(computeContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(computeContent).toMatch(/yum install -y httpd/);
    });
  });

  describe('Security Best Practices Validation', () => {
    test('no hardcoded secrets or credentials', () => {
      const allFiles = [
        stackPath,
        path.join(libPath, 'modules', 'vpc', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'security', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'storage', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'compute', 'tap_stack.tf'),
      ];

      allFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      });
    });

    test('uses proper tagging strategy', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const providerContent = fs.readFileSync(providerPath, 'utf8');

      expect(providerContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(providerContent).toMatch(/default_tags/);
    });
  });
});
