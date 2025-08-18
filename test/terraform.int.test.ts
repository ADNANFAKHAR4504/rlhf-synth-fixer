// tests/integration/integration-tests.ts
// Integration tests for Terraform HCL infrastructure
// Tests infrastructure configuration and deployment readiness
// No AWS credentials required - uses mocking and static analysis

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform HCL Infrastructure Integration Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');

  describe('Infrastructure Deployment Readiness', () => {
    test('main stack file is valid Terraform', () => {
      const stackPath = path.join(libPath, 'tap_stack.tf');
      expect(fs.existsSync(stackPath)).toBe(true);

      const content = fs.readFileSync(stackPath, 'utf8');

      // Basic Terraform syntax validation
      expect(content).toMatch(/variable\s+"/);
      expect(content).toMatch(/module\s+"/);
      expect(content).toMatch(/output\s+"/);

      // File should not be empty
      expect(content.trim().length).toBeGreaterThan(0);
    });

    test('all module files exist and are valid', () => {
      const modulesPath = path.join(libPath, 'modules');
      const requiredModules = ['vpc', 'security', 'storage', 'compute'];

      requiredModules.forEach(module => {
        const modulePath = path.join(modulesPath, module, 'tap_stack.tf');
        expect(fs.existsSync(modulePath)).toBe(true);

        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toMatch(/resource\s+"/);
      });
    });

    test('provider configuration is properly separated', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const stackPath = path.join(libPath, 'tap_stack.tf');

      expect(fs.existsSync(providerPath)).toBe(true);

      const providerContent = fs.readFileSync(providerPath, 'utf8');
      const stackContent = fs.readFileSync(stackPath, 'utf8');

      // Provider should be in provider.tf
      expect(providerContent).toMatch(/provider\s+"aws"/);

      // Provider should NOT be in main stack
      expect(stackContent).not.toMatch(/provider\s+"aws"/);

      // Main stack should declare aws_region variable
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
    });
  });

  describe('Configuration Validation', () => {
    test('VPC module configuration matches requirements', () => {
      const vpcPath = path.join(libPath, 'modules', 'vpc', 'tap_stack.tf');
      const content = fs.readFileSync(vpcPath, 'utf8');

      // Check for required resources
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_subnet"/);
      expect(content).toMatch(/resource\s+"aws_route_table"/);

      // Check for DNS settings
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);

      // Check for public IP mapping
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('Security module implements required controls', () => {
      const securityPath = path.join(
        libPath,
        'modules',
        'security',
        'tap_stack.tf'
      );
      const content = fs.readFileSync(securityPath, 'utf8');

      // Security Group with HTTP/HTTPS only
      expect(content).toMatch(/resource\s+"aws_security_group"/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);

      // Network ACL
      expect(content).toMatch(/resource\s+"aws_network_acl"/);

      // IAM Role and Policy
      expect(content).toMatch(/resource\s+"aws_iam_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"/);
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"/);

      // Check for minimal S3 permissions
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).not.toMatch(/"s3:\*"/);
    });

    test('Storage module implements security requirements', () => {
      const storagePath = path.join(
        libPath,
        'modules',
        'storage',
        'tap_stack.tf'
      );
      const content = fs.readFileSync(storagePath, 'utf8');

      // S3 Bucket
      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);

      // Encryption
      expect(content).toMatch(
        /aws_s3_bucket_server_side_encryption_configuration/
      );
      expect(content).toMatch(/AES256/);

      // Versioning
      expect(content).toMatch(/aws_s3_bucket_versioning/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);

      // Public access blocking
      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);

      // HTTPS enforcement
      expect(content).toMatch(/aws:SecureTransport.*false/);
    });

    test('Compute module implements security requirements', () => {
      const computePath = path.join(
        libPath,
        'modules',
        'compute',
        'tap_stack.tf'
      );
      const content = fs.readFileSync(computePath, 'utf8');

      // EC2 Instance
      expect(content).toMatch(/resource\s+"aws_instance"/);

      // Latest AMI data source
      expect(content).toMatch(/data\s+"aws_ami"/);
      expect(content).toMatch(/most_recent\s*=\s*true/);

      // Encrypted root volume
      expect(content).toMatch(/root_block_device/);
      expect(content).toMatch(/encrypted\s*=\s*true/);

      // User data for web server
      expect(content).toMatch(/user_data/);
      expect(content).toMatch(/httpd/);
    });
  });

  describe('Module Dependencies and Outputs', () => {
    test('main stack properly references module outputs', () => {
      const stackPath = path.join(libPath, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check module dependencies
      expect(content).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
      expect(content).toMatch(/bucket_arn\s*=\s*module\.storage\.bucket_arn/);
      expect(content).toMatch(
        /security_group_id\s*=\s*module\.security\.web_security_group_id/
      );

      // Check all required outputs are defined
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

    test('modules define all required outputs', () => {
      // VPC outputs
      const vpcPath = path.join(libPath, 'modules', 'vpc', 'tap_stack.tf');
      const vpcContent = fs.readFileSync(vpcPath, 'utf8');
      expect(vpcContent).toMatch(/output\s+"vpc_id"/);
      expect(vpcContent).toMatch(/output\s+"public_subnet_ids"/);

      // Security outputs
      const securityPath = path.join(
        libPath,
        'modules',
        'security',
        'tap_stack.tf'
      );
      const securityContent = fs.readFileSync(securityPath, 'utf8');
      expect(securityContent).toMatch(/output\s+"web_security_group_id"/);
      expect(securityContent).toMatch(/output\s+"ec2_instance_profile_name"/);

      // Storage outputs
      const storagePath = path.join(
        libPath,
        'modules',
        'storage',
        'tap_stack.tf'
      );
      const storageContent = fs.readFileSync(storagePath, 'utf8');
      expect(storageContent).toMatch(/output\s+"bucket_name"/);
      expect(storageContent).toMatch(/output\s+"bucket_arn"/);

      // Compute outputs
      const computePath = path.join(
        libPath,
        'modules',
        'compute',
        'tap_stack.tf'
      );
      const computeContent = fs.readFileSync(computePath, 'utf8');
      expect(computeContent).toMatch(/output\s+"instance_id"/);
      expect(computeContent).toMatch(/output\s+"public_ip"/);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('no hardcoded secrets or credentials in any file', () => {
      const allFiles = [
        path.join(libPath, 'tap_stack.tf'),
        path.join(libPath, 'provider.tf'),
        path.join(libPath, 'modules', 'vpc', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'security', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'storage', 'tap_stack.tf'),
        path.join(libPath, 'modules', 'compute', 'tap_stack.tf'),
      ];

      allFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Check for potential secrets
          expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
          expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
          expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
          expect(content).not.toMatch(/[0-9a-f]{40}/); // SHA-1 like secrets
        }
      });
    });

    test('proper tagging strategy is implemented', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const providerContent = fs.readFileSync(providerPath, 'utf8');

      // Check for default tags in provider
      expect(providerContent).toMatch(/default_tags/);
      expect(providerContent).toMatch(/Environment.*Production/);
    });

    test('region configuration is consistent', () => {
      const stackPath = path.join(libPath, 'tap_stack.tf');
      const stackContent = fs.readFileSync(stackPath, 'utf8');

      // Should default to us-west-2 as required
      const regionMatch = stackContent.match(
        /variable\s+"aws_region"[\s\S]*?default\s*=\s*"([^"]+)"/
      );
      expect(regionMatch).toBeTruthy();
      expect(regionMatch![1]).toBe('us-west-2');
    });
  });

  describe('Infrastructure Readiness for Deployment', () => {
    test('terraform configuration structure is deployment ready', () => {
      // Check that all essential files exist
      const essentialFiles = [
        'tap_stack.tf',
        'provider.tf',
        'modules/vpc/tap_stack.tf',
        'modules/security/tap_stack.tf',
        'modules/storage/tap_stack.tf',
        'modules/compute/tap_stack.tf',
      ];

      essentialFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);

        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(0);
      });
    });

    test('module source paths are correct', () => {
      const stackPath = path.join(libPath, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check module source paths
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/security"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/storage"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/compute"/);
    });

    test('variables are properly configured for production deployment', () => {
      const stackPath = path.join(libPath, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check that VPC name matches requirement
      const vpcNameMatch = content.match(
        /variable\s+"vpc_name"[\s\S]*?default\s*=\s*"([^"]+)"/
      );
      expect(vpcNameMatch).toBeTruthy();
      expect(vpcNameMatch![1]).toBe('secure-network');

      // Check instance type is appropriate
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/default\s*=\s*"t3\.micro"/);
    });
  });
});
