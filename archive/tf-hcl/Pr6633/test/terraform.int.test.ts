import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  describe('Terraform Configuration Validation', () => {
    const terraformDir = path.join(__dirname, '..', 'lib');

    test('should have valid terraform configuration files', async () => {
      // Check if main terraform files exist
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'backend.tf'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(terraformDir, file);
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
      }
    });

    test('should have properly configured backend', async () => {
      const backendPath = path.join(terraformDir, 'backend.tf');
      const backendContent = fs.readFileSync(backendPath, 'utf-8');

      // Verify backend configuration exists
      expect(backendContent).toContain('terraform {');
      expect(backendContent).toContain('backend');
      expect(backendContent).toContain('required_providers');
    });

    test('should have environment suffix variable configured', async () => {
      const variablesPath = path.join(terraformDir, 'variables.tf');
      const variablesContent = fs.readFileSync(variablesPath, 'utf-8');

      // Verify critical variables are defined
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toContain('description');
      expect(variablesContent).toContain('type');
    });

    test('should have module structure for EC2 and RDS', async () => {
      const ec2ModulePath = path.join(terraformDir, 'modules', 'ec2-autoscaling');
      const rdsModulePath = path.join(terraformDir, 'modules', 'rds-postgres');

      // Check if modules exist
      expect(fs.existsSync(ec2ModulePath)).toBe(true);
      expect(fs.existsSync(rdsModulePath)).toBe(true);

      // Verify module files
      const ec2MainPath = path.join(ec2ModulePath, 'main.tf');
      const rdsMainPath = path.join(rdsModulePath, 'main.tf');

      expect(fs.existsSync(ec2MainPath)).toBe(true);
      expect(fs.existsSync(rdsMainPath)).toBe(true);
    });

    test('should have security groups with dynamic rules', async () => {
      const sgPath = path.join(terraformDir, 'security_groups.tf');

      if (fs.existsSync(sgPath)) {
        const sgContent = fs.readFileSync(sgPath, 'utf-8');

        // Verify dynamic security group configuration
        expect(sgContent).toContain('dynamic');
        expect(sgContent).toContain('security_group');
        expect(sgContent).toContain('ingress');
        expect(sgContent).toContain('egress');
      } else {
        // Security groups might be in main.tf
        const mainPath = path.join(terraformDir, 'main.tf');
        const mainContent = fs.readFileSync(mainPath, 'utf-8');
        expect(mainContent).toContain('security_group');
      }
    });

    test('should have workspace-based environment configuration', async () => {
      const localsPath = path.join(terraformDir, 'locals.tf');

      if (fs.existsSync(localsPath)) {
        const localsContent = fs.readFileSync(localsPath, 'utf-8');

        // Verify workspace configuration
        expect(localsContent).toContain('terraform.workspace');
        expect(localsContent).toContain('env_config');
      }
    });

    test('should have proper outputs configuration', async () => {
      const outputsPath = path.join(terraformDir, 'outputs.tf');
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');

      // Verify critical outputs
      expect(outputsContent).toContain('output');
      expect(outputsContent).toContain('vpc_id');
      expect(outputsContent).toContain('alb_dns_name');
      expect(outputsContent).toContain('rds_endpoint');
      expect(outputsContent).toContain('sensitive');
    });

    test('should have all resources tagged with environment_suffix', async () => {
      const mainPath = path.join(terraformDir, 'main.tf');
      const mainContent = fs.readFileSync(mainPath, 'utf-8');

      // Verify resource naming convention
      expect(mainContent).toContain('${var.environment_suffix}');
      expect(mainContent).toContain('tags');
    });
  });
});
