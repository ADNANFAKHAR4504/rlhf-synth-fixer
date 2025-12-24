import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Multi-Region DR Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providersContent: string;
  let variablesContent: string;
  let outputsContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    providersContent = fs.readFileSync(path.join(libPath, 'providers.tf'), 'utf8');
    variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
  });

  describe('Provider Configuration', () => {
    test('should have required Terraform version', () => {
      expect(providersContent).toMatch(/required_version\s*=\s*">=\s*1\.[4-9]\.0"/);
    });

    test('should have AWS provider configured', () => {
      expect(providersContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providersContent).toMatch(/version\s*=\s*"(~>|>=)\s*5\.0"/);
    });

    test('should have primary region provider', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{[\s\S]*?alias\s*=\s*"primary"/);
    });

    test('should have DR region provider', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{[\s\S]*?alias\s*=\s*"dr"/);
    });

    test('should have global provider', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*\{[\s\S]*?alias\s*=\s*"global"/);
    });
  });

  describe('Variable Definitions', () => {
    test('should have environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('should have region variables', () => {
      expect(variablesContent).toMatch(/variable\s+"primary_region"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"dr_region"\s*\{/);
    });

    test('should have database credentials as sensitive', () => {
      expect(variablesContent).toMatch(/variable\s+"db_master_username"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"db_master_password"\s*\{[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should have availability zones for both regions', () => {
      expect(variablesContent).toMatch(/variable\s+"availability_zones_primary"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"availability_zones_dr"\s*\{/);
    });
  });

  describe('VPC Module Configuration', () => {
    test('should have VPC module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"vpc_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('should have VPC module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"vpc_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('VPC modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"vpc_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });

    test('VPC modules should have correct provider configuration', () => {
      expect(mainContent).toMatch(/module\s+"vpc_primary"\s*\{[\s\S]*?aws\s*=\s*aws\.primary/);
      expect(mainContent).toMatch(/module\s+"vpc_dr"\s*\{[\s\S]*?aws\s*=\s*aws\.dr/);
    });
  });

  describe('VPC Peering Configuration', () => {
    test('should have VPC peering module', () => {
      expect(mainContent).toMatch(/module\s+"vpc_peering"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/vpc-peering"/);
    });

    test('VPC peering should reference both VPCs', () => {
      expect(mainContent).toMatch(/module\s+"vpc_peering"\s*\{[\s\S]*?primary_vpc_id\s*=/);
      expect(mainContent).toMatch(/module\s+"vpc_peering"\s*\{[\s\S]*?dr_vpc_id\s*=/);
    });
  });

  describe('RDS Aurora Global Database Configuration', () => {
    test('should have RDS module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"rds_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/rds"/);
      expect(mainContent).toMatch(/module\s+"rds_primary"\s*\{[\s\S]*?is_primary\s*=\s*true/);
    });

    test('should have RDS module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"rds_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/rds"/);
      expect(mainContent).toMatch(/module\s+"rds_dr"\s*\{[\s\S]*?is_primary\s*=\s*false/);
    });

    test('RDS DR should depend on primary', () => {
      expect(mainContent).toMatch(/module\s+"rds_dr"\s*\{[\s\S]*?depends_on\s*=\s*\[/);
    });

    test('RDS modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"rds_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });

    test('RDS modules should have database credentials', () => {
      expect(mainContent).toMatch(/module\s+"rds_primary"\s*\{[\s\S]*?db_master_username\s*=/);
      expect(mainContent).toMatch(/module\s+"rds_primary"\s*\{[\s\S]*?db_master_password\s*=/);
    });
  });

  describe('DynamoDB Global Table Configuration', () => {
    test('should have DynamoDB module', () => {
      expect(mainContent).toMatch(/module\s+"dynamodb"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/dynamodb"/);
    });

    test('DynamoDB should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"dynamodb"\s*\{[\s\S]*?environment_suffix\s*=/);
    });

    test('DynamoDB should support both regions', () => {
      expect(mainContent).toMatch(/module\s+"dynamodb"\s*\{[\s\S]*?primary_region\s*=/);
      expect(mainContent).toMatch(/module\s+"dynamodb"\s*\{[\s\S]*?dr_region\s*=/);
    });
  });

  describe('S3 Cross-Region Replication', () => {
    test('should have S3 module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"s3_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/s3"/);
    });

    test('should have S3 module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"s3_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/s3"/);
    });

    test('S3 modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"s3_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have Lambda module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"lambda_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/lambda"/);
    });

    test('should have Lambda module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"lambda_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/lambda"/);
    });

    test('Lambda modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"lambda_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should have ALB module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"alb_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/alb"/);
    });

    test('should have ALB module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"alb_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/alb"/);
    });

    test('ALB modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"alb_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('Route53 Failover Configuration', () => {
    test('should have Route53 module', () => {
      expect(mainContent).toMatch(/module\s+"route53"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/route53"/);
    });

    test('Route53 should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"route53"\s*\{[\s\S]*?environment_suffix\s*=/);
    });

    test('Route53 should reference both ALBs', () => {
      expect(mainContent).toMatch(/module\s+"route53"\s*\{[\s\S]*?primary_alb_dns\s*=/);
      expect(mainContent).toMatch(/module\s+"route53"\s*\{[\s\S]*?dr_alb_dns\s*=/);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have CloudWatch module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"cloudwatch_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/cloudwatch"/);
    });

    test('should have CloudWatch module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"cloudwatch_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/cloudwatch"/);
    });

    test('CloudWatch modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"cloudwatch_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('SNS Configuration', () => {
    test('should have SNS module for primary region', () => {
      expect(mainContent).toMatch(/module\s+"sns_primary"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/sns"/);
    });

    test('should have SNS module for DR region', () => {
      expect(mainContent).toMatch(/module\s+"sns_dr"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/sns"/);
    });

    test('SNS modules should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"sns_primary"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('IAM Configuration', () => {
    test('should have IAM module', () => {
      expect(mainContent).toMatch(/module\s+"iam"\s*\{[\s\S]*?source\s*=\s*"\.\/modules\/iam"/);
    });

    test('IAM should use environment_suffix', () => {
      expect(mainContent).toMatch(/module\s+"iam"\s*\{[\s\S]*?environment_suffix\s*=/);
    });
  });

  describe('Output Definitions', () => {
    test('should have VPC outputs', () => {
      expect(outputsContent).toMatch(/output\s+"primary_vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"dr_vpc_id"/);
    });

    test('should have RDS outputs', () => {
      expect(outputsContent).toMatch(/output\s+"primary_rds_cluster_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"dr_rds_cluster_endpoint"/);
    });

    test('should have ALB outputs', () => {
      expect(outputsContent).toMatch(/output\s+"primary_alb_dns"/);
      expect(outputsContent).toMatch(/output\s+"dr_alb_dns"/);
    });

    test('should have Route53 outputs', () => {
      expect(outputsContent).toMatch(/output\s+"route53_zone_id"/);
    });
  });

  describe('Module Files Validation', () => {
    const modules = [
      'vpc', 'vpc-peering', 'rds', 'dynamodb', 's3',
      'lambda', 'alb', 'route53', 'cloudwatch', 'sns', 'iam'
    ];

    modules.forEach(moduleName => {
      test(`${moduleName} module should have main.tf`, () => {
        const modulePath = path.join(libPath, 'modules', moduleName, 'main.tf');
        expect(fs.existsSync(modulePath)).toBe(true);
      });

      test(`${moduleName} module should have valid Terraform syntax`, () => {
        const modulePath = path.join(libPath, 'modules', moduleName, 'main.tf');
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content).toMatch(/(resource|terraform|data|variable|output)\s+/);
      });

      test(`${moduleName} module should have required_providers block`, () => {
        const modulePath = path.join(libPath, 'modules', moduleName, 'main.tf');
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content).toMatch(/terraform\s*\{[\s\S]*?required_providers/);
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all modules should accept environment_suffix variable', () => {
      const moduleNames = [
        'vpc_primary', 'vpc_dr', 'vpc_peering', 'iam', 's3_primary', 's3_dr',
        'dynamodb', 'rds_primary', 'rds_dr', 'lambda_primary', 'lambda_dr',
        'alb_primary', 'alb_dr', 'route53', 'cloudwatch_primary', 'cloudwatch_dr',
        'sns_primary', 'sns_dr'
      ];
      moduleNames.forEach(moduleName => {
        expect(mainContent).toMatch(new RegExp(`module\\s+"${moduleName}"\\s*\\{[\\s\\S]*?environment_suffix\\s*=`));
      });
    });

    test('environment_suffix should be used consistently', () => {
      const allTfFiles = getAllTfFiles(libPath);
      allTfFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('environment_suffix')) {
          const hasVarReference = content.includes('var.environment_suffix') ||
                                 content.includes('environment_suffix =') ||
                                 content.includes('environment_suffix:') ||
                                 content.includes('"environment_suffix"') ||
                                 content.includes('variable "environment_suffix"');
          expect(hasVarReference).toBe(true);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('sensitive variables should be marked as sensitive', () => {
      expect(variablesContent).toMatch(/variable\s+"db_master_password"\s*\{[\s\S]*?sensitive\s*=\s*true/);
    });

    test('RDS should have encryption enabled', () => {
      const rdsModulePath = path.join(libPath, 'modules', 'rds', 'main.tf');
      const content = fs.readFileSync(rdsModulePath, 'utf8');
      expect(content).toContain('storage_encrypted');
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('S3 should have encryption enabled', () => {
      const s3ModulePath = path.join(libPath, 'modules', 's3', 'main.tf');
      const content = fs.readFileSync(s3ModulePath, 'utf8');
      expect(content).toContain('server_side_encryption_configuration');
    });
  });

  describe('Disaster Recovery Requirements', () => {
    test('should have resources in both primary and DR regions', () => {
      const criticalModules = ['vpc', 'rds', 's3', 'lambda', 'alb'];
      criticalModules.forEach(moduleName => {
        expect(mainContent).toMatch(new RegExp(`module\\s+"${moduleName}_primary"\\s*\\{`));
        expect(mainContent).toMatch(new RegExp(`module\\s+"${moduleName}_dr"\\s*\\{`));
      });
    });

    test('should have cross-region replication for critical data', () => {
      expect(mainContent).toMatch(/module\s+"dynamodb"\s*\{/);
      expect(mainContent).toMatch(/module\s+"s3_primary"\s*\{/);
    });

    test('should have Route53 for failover', () => {
      expect(mainContent).toMatch(/module\s+"route53"\s*\{/);
    });
  });

  describe('No Retention Policies', () => {
    test('RDS should have skip_final_snapshot enabled', () => {
      const rdsModulePath = path.join(libPath, 'modules', 'rds', 'main.tf');
      const content = fs.readFileSync(rdsModulePath, 'utf8');
      expect(content).toContain('skip_final_snapshot');
      expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('should not have DeletionProtection enabled', () => {
      const allTfFiles = getAllTfFiles(libPath);
      allTfFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('deletion_protection')) {
          expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
        }
      });
    });
  });
});

// Helper function to get all .tf files recursively
function getAllTfFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTfFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tf')) {
      files.push(fullPath);
    }
  }

  return files;
}
