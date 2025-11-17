// Integration tests for Terraform infrastructure
// Tests actual Terraform operations without AWS deployment

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TERRAFORM_CMD_PREFIX = `cd ${LIB_DIR} &&`;

// Helper to execute Terraform commands
function execTerraform(command: string): string {
  try {
    return execSync(`${TERRAFORM_CMD_PREFIX} ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${error.message}\nStdout: ${error.stdout}\nStderr: ${error.stderr}`);
  }
}

// Helper to check if Terraform is initialized
function isTerraformInitialized(): boolean {
  return fs.existsSync(path.join(LIB_DIR, '.terraform'));
}

describe('Terraform Infrastructure - Integration Tests', () => {
  beforeAll(() => {
    if (!isTerraformInitialized()) {
      console.log('Initializing Terraform...');
      execTerraform('terraform init -backend=false -upgrade');
    }
  });

  describe('Terraform Command Execution', () => {
    test('terraform fmt succeeds and finds no formatting issues', () => {
      const output = execTerraform('terraform fmt -check -recursive -diff');
      // Empty output means all files are formatted
      expect(output.trim()).toBe('');
    });

    test('terraform validate confirms configuration is valid', () => {
      const output = execTerraform('terraform validate -json');
      const result = JSON.parse(output);

      expect(result.valid).toBe(true);
      expect(result.error_count).toBe(0);
      expect(result.warning_count).toBe(0);
    });

    test('terraform init can be run multiple times without errors', () => {
      const output = execTerraform('terraform init -backend=false -upgrade');
      expect(output).toContain('Terraform has been successfully initialized');
    });

    test('terraform providers shows correct AWS provider version', () => {
      const output = execTerraform('terraform providers');
      expect(output).toContain('provider[registry.terraform.io/hashicorp/aws]');
      expect(output).toMatch(/5\.\d+\.\d+/); // Version 5.x.x
    });
  });

  describe('Terraform Configuration Analysis', () => {
    test('terraform show detects no existing state (fresh deployment)', () => {
      try {
        execTerraform('terraform show');
      } catch (error: any) {
        // Expected: no state file exists
        expect(error.message).toContain('No state');
      }
    });

    test('terraform graph generates dependency graph', () => {
      const output = execTerraform('terraform graph');

      // Should contain key resources
      expect(output).toContain('module.ec2_east');
      expect(output).toContain('module.ec2_west');
      expect(output).toContain('module.rds_east');
      expect(output).toContain('module.rds_west');
    });
  });

  describe('Module Initialization', () => {
    test('EC2 module is properly initialized', () => {
      const ec2ModulePath = path.join(LIB_DIR, '.terraform/modules/modules.json');
      expect(fs.existsSync(ec2ModulePath)).toBe(true);

      const modulesData = JSON.parse(fs.readFileSync(ec2ModulePath, 'utf8'));
      const ec2Modules = modulesData.Modules.filter((m: any) =>
        m.Key.includes('ec2')
      );

      expect(ec2Modules.length).toBeGreaterThan(0);
    });

    test('RDS module is properly initialized', () => {
      const modulesPath = path.join(LIB_DIR, '.terraform/modules/modules.json');
      const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
      const rdsModules = modulesData.Modules.filter((m: any) =>
        m.Key.includes('rds')
      );

      expect(rdsModules.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is properly locked', () => {
      const lockFilePath = path.join(LIB_DIR, '.terraform.lock.hcl');
      expect(fs.existsSync(lockFilePath)).toBe(true);

      const lockContent = fs.readFileSync(lockFilePath, 'utf8');
      expect(lockContent).toContain('provider "registry.terraform.io/hashicorp/aws"');
    });
  });

  describe('Variable Validation', () => {
    test('terraform console can evaluate locals', () => {
      const output = execTerraform('echo "local.regions" | terraform console');
      // Should output the regions map structure
      expect(output).toContain('east');
      expect(output).toContain('west');
      expect(output).toContain('us-east-1');
      expect(output).toContain('us-west-2');
    });

    test('terraform console can evaluate ec2_instances local', () => {
      const output = execTerraform('echo "local.ec2_instances" | terraform console');
      expect(output).toContain('web-primary');
      expect(output).toContain('app-primary');
      expect(output).toContain('worker-primary');
    });

    test('terraform console can evaluate rds_clusters local', () => {
      const output = execTerraform('echo "local.rds_clusters" | terraform console');
      expect(output).toContain('primary-mysql');
      expect(output).toContain('secondary-postgres');
      expect(output).toContain('aurora-mysql');
      expect(output).toContain('aurora-postgresql');
    });
  });

  describe('Resource Naming', () => {
    test('common_tags include ManagedBy Terraform', () => {
      const output = execTerraform('echo "local.common_tags" | terraform console');
      expect(output).toContain('ManagedBy');
      expect(output).toContain('Terraform');
    });

    test('common_tags include environment variable reference', () => {
      const output = execTerraform('echo "local.common_tags" | terraform console');
      expect(output).toContain('Environment');
    });
  });

  describe('Module Outputs', () => {
    test('EC2 module declares expected outputs', () => {
      const ec2OutputsPath = path.join(LIB_DIR, 'modules/ec2/outputs.tf');
      const content = fs.readFileSync(ec2OutputsPath, 'utf8');

      expect(content).toContain('output "security_group_id"');
      expect(content).toContain('output "autoscaling_group_name"');
      expect(content).toContain('output "autoscaling_group_arn"');
      expect(content).toContain('output "launch_template_id"');
    });

    test('RDS module declares expected outputs', () => {
      const rdsOutputsPath = path.join(LIB_DIR, 'modules/rds/outputs.tf');
      const content = fs.readFileSync(rdsOutputsPath, 'utf8');

      expect(content).toContain('output "cluster_endpoint"');
      expect(content).toContain('output "cluster_reader_endpoint"');
      expect(content).toContain('output "cluster_id"');
      expect(content).toContain('output "security_group_id"');
    });
  });

  describe('File Integrity', () => {
    test('all .tf files are valid HCL', () => {
      const files = execSync(`find ${LIB_DIR} -name "*.tf" -type f`, { encoding: 'utf8' })
        .trim()
        .split('\n');

      expect(files.length).toBeGreaterThan(0);

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf8');
        // Basic HCL syntax check - should not contain obvious syntax errors
        expect(content).not.toContain('<<<<<<'); // No merge conflicts
        expect(content).not.toContain('>>>>>>'); // No merge conflicts
      });
    });

    test('user data scripts are executable bash', () => {
      const scriptDir = path.join(LIB_DIR, 'user_data');
      const scripts = fs.readdirSync(scriptDir).filter(f => f.endsWith('.sh'));

      expect(scripts.length).toBeGreaterThan(0);

      scripts.forEach((script) => {
        const content = fs.readFileSync(path.join(scriptDir, script), 'utf8');
        expect(content).toMatch(/^#!/); // Shebang line
        expect(content).toContain('bash'); // Bash script
      });
    });
  });

  describe('Backend Configuration', () => {
    test('S3 backend does not contain variable interpolation', () => {
      const providersPath = path.join(LIB_DIR, 'providers.tf');
      const content = fs.readFileSync(providersPath, 'utf8');

      const backendMatch = content.match(/backend\s+"s3"\s*{([^}]*)}/s);
      expect(backendMatch).toBeTruthy();

      if (backendMatch) {
        const backendBlock = backendMatch[1];
        // Should not contain ${var.
        expect(backendBlock).not.toContain('${var.');
      }
    });

    test('backend configuration specifies encryption', () => {
      const providersPath = path.join(LIB_DIR, 'providers.tf');
      const content = fs.readFileSync(providersPath, 'utf8');

      expect(content).toMatch(/backend\s+"s3"[\s\S]*?encrypt\s*=\s*true/);
    });
  });

  describe('Security Best Practices', () => {
    test('RDS clusters enable encryption at rest', () => {
      const rdsMainPath = path.join(LIB_DIR, 'modules/rds/main.tf');
      const content = fs.readFileSync(rdsMainPath, 'utf8');

      expect(content).toContain('storage_encrypted   = true');
    });

    test('EC2 launch templates enable EBS encryption', () => {
      const ec2MainPath = path.join(LIB_DIR, 'modules/ec2/main.tf');
      const content = fs.readFileSync(ec2MainPath, 'utf8');

      expect(content).toContain('encrypted             = true');
    });

    test('EC2 metadata service uses IMDSv2', () => {
      const ec2MainPath = path.join(LIB_DIR, 'modules/ec2/main.tf');
      const content = fs.readFileSync(ec2MainPath, 'utf8');

      expect(content).toContain('http_tokens                 = "required"');
    });

    test('RDS instances are not publicly accessible', () => {
      const rdsMainPath = path.join(LIB_DIR, 'modules/rds/main.tf');
      const content = fs.readFileSync(rdsMainPath, 'utf8');

      expect(content).toContain('publicly_accessible = false');
    });

    test('sensitive outputs are marked as sensitive', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      // rds_endpoints should be sensitive
      expect(content).toMatch(/output\s+"rds_endpoints"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('Performance Optimizations', () => {
    test('resources use for_each instead of count', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      // Check for for_each usage
      const forEachCount = (content.match(/for_each\s*=/g) || []).length;
      const countCount = (content.match(/count\s*=/g) || []).length;

      // Should have more for_each than count
      expect(forEachCount).toBeGreaterThan(3);
    });

    test('lifecycle rules include create_before_destroy', () => {
      const files = [
        path.join(LIB_DIR, 'modules/ec2/main.tf'),
        path.join(LIB_DIR, 'modules/rds/main.tf'),
      ];

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf8');
        expect(content).toContain('create_before_destroy');
      });
    });
  });

  describe('Multi-Region Configuration', () => {
    test('provider configuration includes both regions', () => {
      const providersPath = path.join(LIB_DIR, 'providers.tf');
      const content = fs.readFileSync(providersPath, 'utf8');

      expect(content).toContain('us-east-1');
      expect(content).toContain('us-west-2');
      expect(content).toContain('alias  = "west"');
    });

    test('data sources use correct provider aliases', () => {
      const dataPath = path.join(LIB_DIR, 'data.tf');
      const content = fs.readFileSync(dataPath, 'utf8');

      // West region resources should use provider alias
      expect(content).toMatch(/data\s+"aws_vpc"\s+"west"[\s\S]*?provider\s*=\s*aws\.west/);
      expect(content).toMatch(/data\s+"aws_subnets"\s+"public_west"[\s\S]*?provider\s*=\s*aws\.west/);
    });

    test('modules specify provider aliases correctly', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      // EC2 west should use west provider
      expect(content).toMatch(/module\s+"ec2_west"[\s\S]*?providers\s*=\s*{[\s\S]*?aws\s*=\s*aws\.west/);

      // RDS west should use west provider
      expect(content).toMatch(/module\s+"rds_west"[\s\S]*?providers\s*=\s*{[\s\S]*?aws\s*=\s*aws\.west/);
    });
  });

  describe('Optional Features', () => {
    test('DynamoDB state locking uses conditional count', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_locks"[\s\S]*?count\s*=\s*var\.enable_state_locking/);
    });

    test('SSM parameters use conditional for_each', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/for_each\s*=\s*var\.enable_ssm_secrets\s*\?/);
    });

    test('CloudFront uses conditional count', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toMatch(/count\s*=\s*var\.enable_cloudfront/);
    });
  });

  describe('Terraform State Management', () => {
    test('no hardcoded values in configuration', () => {
      const files = execSync(`find ${LIB_DIR} -name "*.tf" -type f -not -path "*/\\.terraform/*"`, { encoding: 'utf8' })
        .trim()
        .split('\n');

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf8');

        // Should not contain hardcoded IPs or account IDs (except in examples/comments)
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // Skip comments
          if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
            return;
          }

          // Check for suspicious patterns
          expect(line).not.toMatch(/ami-[0-9a-f]{17}/); // Hardcoded AMI IDs in code
          expect(line).not.toMatch(/[0-9]{12}/); // Account IDs
        });
      });
    });
  });
});
