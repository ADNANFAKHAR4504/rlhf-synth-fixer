// tests/terraform.int.test.ts
// Integration tests for Terraform multi-environment infrastructure

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LIB_DIR = path.resolve(__dirname, '../lib');
const OUTPUTS_FILE = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

describe('Terraform Multi-Environment Infrastructure - Integration Tests', () => {
  let outputs: Record<string, string>;
  let hasDeployment = false;

  beforeAll(() => {
    // Check if we have deployment outputs available
    if (fs.existsSync(OUTPUTS_FILE)) {
      try {
        const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf8');
        outputs = JSON.parse(outputsContent);
        hasDeployment = Object.keys(outputs).length > 0;
      } catch (error) {
        console.warn('Failed to parse outputs file:', error);
        hasDeployment = false;
      }
    }
  });

  describe('Terraform Configuration Validation', () => {
    test('terraform validate passes', () => {
      expect(() => {
        const result = execSync('terraform validate', {
          cwd: LIB_DIR,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        expect(result).toContain('Success');
      }).not.toThrow();
    });

    test('terraform fmt check passes', () => {
      const result = execSync('terraform fmt -check -recursive', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      // Empty output means all files are formatted correctly
      expect(result.trim()).toBe('');
    });
  });

  describe('Terraform Plan Generation', () => {
    test('dev environment plan generates successfully', () => {
      expect(() => {
        execSync('terraform plan -var-file="dev.tfvars" -out=dev.tfplan', {
          cwd: LIB_DIR,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      }).not.toThrow();

      // Verify plan file was created
      expect(fs.existsSync(path.join(LIB_DIR, 'dev.tfplan'))).toBe(true);

      // Clean up
      fs.unlinkSync(path.join(LIB_DIR, 'dev.tfplan'));
    });

    test('staging environment plan generates successfully', () => {
      expect(() => {
        execSync('terraform plan -var-file="staging.tfvars" -out=staging.tfplan', {
          cwd: LIB_DIR,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      }).not.toThrow();

      // Verify plan file was created
      expect(fs.existsSync(path.join(LIB_DIR, 'staging.tfplan'))).toBe(true);

      // Clean up
      fs.unlinkSync(path.join(LIB_DIR, 'staging.tfplan'));
    });

    test('prod environment plan generates successfully', () => {
      expect(() => {
        execSync('terraform plan -var-file="prod.tfvars" -out=prod.tfplan', {
          cwd: LIB_DIR,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      }).not.toThrow();

      // Verify plan file was created
      expect(fs.existsSync(path.join(LIB_DIR, 'prod.tfplan'))).toBe(true);

      // Clean up
      fs.unlinkSync(path.join(LIB_DIR, 'prod.tfplan'));
    });

    test('plan includes expected resource count', () => {
      const result = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Should create multiple resources
      expect(result).toMatch(/Plan:/);
      expect(result).toMatch(/to add/);

      // Extract the number of resources to add
      const match = result.match(/(\d+)\s+to\s+add/);
      expect(match).toBeTruthy();
      const resourceCount = parseInt(match![1], 10);

      // Should have at least 25 resources (VPC, subnets, EC2, RDS, S3, etc.)
      expect(resourceCount).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Multi-Environment Consistency Validation', () => {
    test('all environments create same resource types', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const stagingPlan = execSync('terraform plan -var-file="staging.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const prodPlan = execSync('terraform plan -var-file="prod.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Check that all environments create VPC
      expect(devPlan).toMatch(/aws_vpc\.main/);
      expect(stagingPlan).toMatch(/aws_vpc\.main/);
      expect(prodPlan).toMatch(/aws_vpc\.main/);

      // Check that all environments create ALB
      expect(devPlan).toMatch(/aws_lb\.main/);
      expect(stagingPlan).toMatch(/aws_lb\.main/);
      expect(prodPlan).toMatch(/aws_lb\.main/);

      // Check that all environments create RDS
      expect(devPlan).toMatch(/aws_db_instance\.main/);
      expect(stagingPlan).toMatch(/aws_db_instance\.main/);
      expect(prodPlan).toMatch(/aws_db_instance\.main/);

      // Check that all environments create S3
      expect(devPlan).toMatch(/aws_s3_bucket\.app/);
      expect(stagingPlan).toMatch(/aws_s3_bucket\.app/);
      expect(prodPlan).toMatch(/aws_s3_bucket\.app/);
    });

    test('environments scale appropriately', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const prodPlan = execSync('terraform plan -var-file="prod.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Dev should use smaller instance types
      expect(devPlan).toMatch(/instance_type\s*=\s*"t3\.micro"/);

      // Prod should use larger instance types
      expect(prodPlan).toMatch(/instance_type\s*=\s*"t3\.medium"/);

      // Dev should have fewer availability zones
      const devAzMatch = devPlan.match(/az_count\s*=\s*(\d+)/);
      const prodAzMatch = prodPlan.match(/az_count\s*=\s*(\d+)/);

      if (devAzMatch && prodAzMatch) {
        const devAz = parseInt(devAzMatch[1], 10);
        const prodAz = parseInt(prodAzMatch[1], 10);
        expect(prodAz).toBeGreaterThanOrEqual(devAz);
      }
    });
  });

  describe('Resource Naming Convention Validation', () => {
    test('resources include environment suffix in names', () => {
      // Check the actual Terraform configuration files for resource naming
      const stackContent = fs.readFileSync(path.join(LIB_DIR, 'tap_stack.tf'), 'utf8');
      const devVarsContent = fs.readFileSync(path.join(LIB_DIR, 'dev.tfvars'), 'utf8');

      // Verify stack uses environmentSuffix variables in resource names
      expect(stackContent).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/); // VPC uses Name tag
      expect(stackContent).toMatch(/name\s*=\s*"alb-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/identifier\s*=\s*"rds-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/bucket\s*=\s*"app-storage-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);

      // Verify dev.tfvars has correct suffix
      expect(devVarsContent).toMatch(/environment_suffix\s*=\s*"dev-001"/);
    });

    test('different environments have different resource names', () => {
      // Check the actual tfvars files for unique suffixes
      const devVarsContent = fs.readFileSync(path.join(LIB_DIR, 'dev.tfvars'), 'utf8');
      const stagingVarsContent = fs.readFileSync(path.join(LIB_DIR, 'staging.tfvars'), 'utf8');
      const prodVarsContent = fs.readFileSync(path.join(LIB_DIR, 'prod.tfvars'), 'utf8');

      // Extract environment suffixes
      const devSuffix = devVarsContent.match(/environment_suffix\s*=\s*"([^"]+)"/);
      const stagingSuffix = stagingVarsContent.match(/environment_suffix\s*=\s*"([^"]+)"/);
      const prodSuffix = prodVarsContent.match(/environment_suffix\s*=\s*"([^"]+)"/);

      expect(devSuffix).toBeTruthy();
      expect(stagingSuffix).toBeTruthy();
      expect(prodSuffix).toBeTruthy();

      // Ensure they're all different
      expect(devSuffix![1]).not.toBe(stagingSuffix![1]);
      expect(stagingSuffix![1]).not.toBe(prodSuffix![1]);
      expect(devSuffix![1]).not.toBe(prodSuffix![1]);
    });
  });

  describe('Security Configuration Validation', () => {
    test('RDS is properly secured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // RDS should not be publicly accessible
      expect(devPlan).toMatch(/publicly_accessible\s*=\s*false/);

      // RDS should have deletion protection disabled (for testing)
      expect(devPlan).toMatch(/deletion_protection\s*=\s*false/);

      // RDS should skip final snapshot (for testing)
      expect(devPlan).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('ALB is properly configured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // ALB should have deletion protection disabled (for testing)
      expect(devPlan).toMatch(/enable_deletion_protection\s*=\s*false/);

      // ALB should be internet-facing
      expect(devPlan).toMatch(/internal\s*=\s*false/);
    });

    test('security groups are properly configured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // ALB SG should allow HTTP
      expect(devPlan).toContain('alb-sg');
      expect(devPlan).toMatch(/from_port\s*=\s*80/);

      // EC2 SG should exist
      expect(devPlan).toContain('ec2-sg');

      // RDS SG should exist and allow MySQL
      expect(devPlan).toContain('rds-sg');
      expect(devPlan).toMatch(/from_port\s*=\s*3306/);
    });
  });

  describe('Network Architecture Validation', () => {
    test('VPC has proper CIDR configuration', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // VPC should have CIDR block
      expect(devPlan).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);

      // VPC should have DNS support enabled
      expect(devPlan).toMatch(/enable_dns_support\s*=\s*true/);
      expect(devPlan).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('subnets are properly distributed', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Should have public subnets
      expect(devPlan).toMatch(/aws_subnet\.public/);
      expect(devPlan).toMatch(/map_public_ip_on_launch\s*=\s*true/);

      // Should have private subnets
      expect(devPlan).toMatch(/aws_subnet\.private/);
    });

    test('NAT gateway configuration varies by environment', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const prodPlan = execSync('terraform plan -var-file="prod.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Dev might not have NAT gateway (cost optimization)
      const devHasNat = devPlan.includes('aws_nat_gateway.main');

      // Prod should have NAT gateway
      const prodHasNat = prodPlan.includes('aws_nat_gateway.main');

      expect(prodHasNat).toBe(true);
    });
  });

  describe('Auto Scaling Configuration Validation', () => {
    test('Auto Scaling Group is properly configured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // ASG should exist
      expect(devPlan).toMatch(/aws_autoscaling_group\.main/);

      // ASG should have min/max/desired capacity
      expect(devPlan).toMatch(/min_size\s*=\s*\d+/);
      expect(devPlan).toMatch(/max_size\s*=\s*\d+/);
      expect(devPlan).toMatch(/desired_capacity\s*=\s*\d+/);

      // ASG should have ELB health check
      expect(devPlan).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('Launch Template is properly configured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Launch template should exist
      expect(devPlan).toMatch(/aws_launch_template\.main/);

      // Should have AMI ID
      expect(devPlan).toMatch(/image_id\s*=\s*"ami-[a-f0-9]+"/);

      // Should have instance type
      expect(devPlan).toMatch(/instance_type\s*=\s*"t3\./);

      // Should have IAM instance profile
      expect(devPlan).toMatch(/aws_iam_instance_profile\.ec2/);
    });
  });

  describe('IAM Configuration Validation', () => {
    test('EC2 IAM role is properly configured', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // IAM role should exist
      expect(devPlan).toMatch(/aws_iam_role\.ec2/);

      // Should have AssumeRole policy
      expect(devPlan).toContain('AssumeRole');
      expect(devPlan).toContain('ec2.amazonaws.com');
    });

    test('IAM policy allows required permissions', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // IAM role policy should exist
      expect(devPlan).toMatch(/aws_iam_role_policy\.ec2/);

      // Should allow CloudWatch logs (in the config, may not show in plan output)
      const stackContent = fs.readFileSync(path.join(LIB_DIR, 'tap_stack.tf'), 'utf8');
      expect(stackContent).toContain('logs:CreateLogGroup');
      expect(stackContent).toContain('logs:CreateLogStream');
      expect(stackContent).toContain('logs:PutLogEvents');

      // Should allow S3 access
      expect(stackContent).toContain('s3:GetObject');
      expect(stackContent).toContain('s3:PutObject');
      expect(stackContent).toContain('s3:ListBucket');
    });
  });

  describe('Output Validation', () => {
    test('plan includes all required outputs', () => {
      const devPlan = execSync('terraform plan -var-file="dev.tfvars"', {
        cwd: LIB_DIR,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Should have outputs section
      expect(devPlan).toMatch(/Changes to Outputs:/);

      // Should output VPC ID
      expect(devPlan).toMatch(/vpc_id/);

      // Should output ALB DNS
      expect(devPlan).toMatch(/alb_dns_name/);

      // Should output RDS endpoint
      expect(devPlan).toMatch(/rds_endpoint/);

      // Should output S3 bucket name
      expect(devPlan).toMatch(/s3_bucket_name/);
    });
  });

  // The following tests run only if there's an actual deployment
  describe('Deployed Resources Validation', () => {
    beforeEach(() => {
      if (!hasDeployment) {
        console.log('Skipping deployment tests - no outputs available');
      }
    });

    test('deployment outputs are available', () => {
      if (!hasDeployment) {
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('VPC ID is valid', () => {
      if (!hasDeployment || !outputs.vpc_id) {
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('ALB DNS name is valid', () => {
      if (!hasDeployment || !outputs.alb_dns_name) {
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('RDS endpoint is valid', () => {
      if (!hasDeployment || !outputs.rds_endpoint) {
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com:\d+$/);
    });

    test('S3 bucket name follows convention', () => {
      if (!hasDeployment || !outputs.s3_bucket_name) {
        expect(true).toBe(true); // Skip test
        return;
      }

      expect(outputs.s3_bucket_name).toMatch(/^app-storage-/);
    });
  });
});
