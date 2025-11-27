import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as hcl from 'hcl2-parser';

describe('Terraform Multi-Region DR Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainConfig: any;
  let providersConfig: any;
  let variablesConfig: any;
  let outputsConfig: any;

  beforeAll(() => {
    // Read and parse main Terraform files
    const mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    const providersTf = fs.readFileSync(path.join(libPath, 'providers.tf'), 'utf8');
    const variablesTf = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    const outputsTf = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

    mainConfig = hcl.parseToObject(mainTf)[0];
    providersConfig = hcl.parseToObject(providersTf)[0];
    variablesConfig = hcl.parseToObject(variablesTf)[0];
    outputsConfig = hcl.parseToObject(outputsTf)[0];
  });

  describe('Backend Configuration', () => {
    let backendConfig: any;

    beforeAll(() => {
      const backendTf = fs.readFileSync(path.join(libPath, 'backend.tf'), 'utf8');
      backendConfig = hcl.parseToObject(backendTf)[0];
    });

    test('should have S3 backend configured', () => {
      expect(backendConfig).toHaveProperty('terraform');
      expect(backendConfig.terraform[0]).toHaveProperty('backend');
      expect(backendConfig.terraform[0].backend[0]).toHaveProperty('s3');
    });

    test('should have encryption enabled', () => {
      const s3Backend = backendConfig.terraform[0].backend[0].s3[0];
      expect(s3Backend.encrypt).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should have required Terraform version', () => {
      expect(providersConfig).toHaveProperty('terraform');
      expect(providersConfig.terraform[0].required_version).toContain('>= 1.5.0');
    });

    test('should have AWS provider configured', () => {
      expect(providersConfig.terraform[0].required_providers[0].aws[0]).toMatchObject({
        source: 'hashicorp/aws',
        version: expect.stringContaining('5.0'),
      });
    });

    test('should have primary region provider', () => {
      const providers = providersConfig.provider;
      const primaryProvider = providers.find((p: any) => p.aws && p.aws[0]?.alias === 'primary');
      expect(primaryProvider).toBeDefined();
    });

    test('should have DR region provider', () => {
      const providers = providersConfig.provider;
      const drProvider = providers.find((p: any) => p.aws && p.aws[0]?.alias === 'dr');
      expect(drProvider).toBeDefined();
    });

    test('should have global provider', () => {
      const providers = providersConfig.provider;
      const globalProvider = providers.find((p: any) => p.aws && p.aws[0]?.alias === 'global');
      expect(globalProvider).toBeDefined();
    });
  });

  describe('Variable Definitions', () => {
    test('should have environment_suffix variable', () => {
      expect(variablesConfig).toHaveProperty('variable');
      const envSuffix = variablesConfig.variable.find((v: any) => v.environment_suffix);
      expect(envSuffix).toBeDefined();
      expect(envSuffix.environment_suffix[0].type).toBe('string');
    });

    test('should have region variables', () => {
      const primaryRegion = variablesConfig.variable.find((v: any) => v.primary_region);
      const drRegion = variablesConfig.variable.find((v: any) => v.dr_region);
      expect(primaryRegion).toBeDefined();
      expect(drRegion).toBeDefined();
    });

    test('should have database credentials as sensitive', () => {
      const dbUsername = variablesConfig.variable.find((v: any) => v.db_master_username);
      const dbPassword = variablesConfig.variable.find((v: any) => v.db_master_password);
      expect(dbUsername).toBeDefined();
      expect(dbPassword).toBeDefined();
      expect(dbPassword.db_master_password[0].sensitive).toBe(true);
    });

    test('should have availability zones for both regions', () => {
      const azPrimary = variablesConfig.variable.find((v: any) => v.availability_zones_primary);
      const azDr = variablesConfig.variable.find((v: any) => v.availability_zones_dr);
      expect(azPrimary).toBeDefined();
      expect(azDr).toBeDefined();
    });
  });

  describe('VPC Module Configuration', () => {
    test('should have VPC module for primary region', () => {
      const vpcPrimary = mainConfig.module?.find((m: any) => m.vpc_primary);
      expect(vpcPrimary).toBeDefined();
      expect(vpcPrimary.vpc_primary[0].source).toBe('./modules/vpc');
    });

    test('should have VPC module for DR region', () => {
      const vpcDr = mainConfig.module?.find((m: any) => m.vpc_dr);
      expect(vpcDr).toBeDefined();
      expect(vpcDr.vpc_dr[0].source).toBe('./modules/vpc');
    });

    test('VPC modules should use environment_suffix', () => {
      const vpcPrimary = mainConfig.module?.find((m: any) => m.vpc_primary);
      expect(vpcPrimary.vpc_primary[0].environment_suffix).toBeDefined();
    });

    test('VPC modules should have correct provider configuration', () => {
      const vpcPrimary = mainConfig.module?.find((m: any) => m.vpc_primary);
      const vpcDr = mainConfig.module?.find((m: any) => m.vpc_dr);
      expect(vpcPrimary.vpc_primary[0].providers[0].aws).toBe('aws.primary');
      expect(vpcDr.vpc_dr[0].providers[0].aws).toBe('aws.dr');
    });
  });

  describe('VPC Peering Configuration', () => {
    test('should have VPC peering module', () => {
      const vpcPeering = mainConfig.module?.find((m: any) => m.vpc_peering);
      expect(vpcPeering).toBeDefined();
      expect(vpcPeering.vpc_peering[0].source).toBe('./modules/vpc-peering');
    });

    test('VPC peering should reference both VPCs', () => {
      const vpcPeering = mainConfig.module?.find((m: any) => m.vpc_peering);
      expect(vpcPeering.vpc_peering[0].primary_vpc_id).toBeDefined();
      expect(vpcPeering.vpc_peering[0].dr_vpc_id).toBeDefined();
    });
  });

  describe('RDS Aurora Global Database Configuration', () => {
    test('should have RDS module for primary region', () => {
      const rdsPrimary = mainConfig.module?.find((m: any) => m.rds_primary);
      expect(rdsPrimary).toBeDefined();
      expect(rdsPrimary.rds_primary[0].source).toBe('./modules/rds');
      expect(rdsPrimary.rds_primary[0].is_primary).toBe(true);
    });

    test('should have RDS module for DR region', () => {
      const rdsDr = mainConfig.module?.find((m: any) => m.rds_dr);
      expect(rdsDr).toBeDefined();
      expect(rdsDr.rds_dr[0].source).toBe('./modules/rds');
      expect(rdsDr.rds_dr[0].is_primary).toBe(false);
    });

    test('RDS DR should depend on primary', () => {
      const rdsDr = mainConfig.module?.find((m: any) => m.rds_dr);
      expect(rdsDr.rds_dr[0].depends_on).toBeDefined();
      expect(Array.isArray(rdsDr.rds_dr[0].depends_on)).toBe(true);
    });

    test('RDS modules should use environment_suffix', () => {
      const rdsPrimary = mainConfig.module?.find((m: any) => m.rds_primary);
      expect(rdsPrimary.rds_primary[0].environment_suffix).toBeDefined();
    });

    test('RDS modules should have database credentials', () => {
      const rdsPrimary = mainConfig.module?.find((m: any) => m.rds_primary);
      expect(rdsPrimary.rds_primary[0].db_master_username).toBeDefined();
      expect(rdsPrimary.rds_primary[0].db_master_password).toBeDefined();
    });
  });

  describe('DynamoDB Global Table Configuration', () => {
    test('should have DynamoDB module', () => {
      const dynamodb = mainConfig.module?.find((m: any) => m.dynamodb);
      expect(dynamodb).toBeDefined();
      expect(dynamodb.dynamodb[0].source).toBe('./modules/dynamodb');
    });

    test('DynamoDB should use environment_suffix', () => {
      const dynamodb = mainConfig.module?.find((m: any) => m.dynamodb);
      expect(dynamodb.dynamodb[0].environment_suffix).toBeDefined();
    });

    test('DynamoDB should support both regions', () => {
      const dynamodb = mainConfig.module?.find((m: any) => m.dynamodb);
      expect(dynamodb.dynamodb[0].primary_region).toBeDefined();
      expect(dynamodb.dynamodb[0].dr_region).toBeDefined();
    });
  });

  describe('S3 Cross-Region Replication', () => {
    test('should have S3 module for primary region', () => {
      const s3Primary = mainConfig.module?.find((m: any) => m.s3_primary);
      expect(s3Primary).toBeDefined();
      expect(s3Primary.s3_primary[0].source).toBe('./modules/s3');
    });

    test('should have S3 module for DR region', () => {
      const s3Dr = mainConfig.module?.find((m: any) => m.s3_dr);
      expect(s3Dr).toBeDefined();
      expect(s3Dr.s3_dr[0].source).toBe('./modules/s3');
    });

    test('S3 modules should use environment_suffix', () => {
      const s3Primary = mainConfig.module?.find((m: any) => m.s3_primary);
      expect(s3Primary.s3_primary[0].environment_suffix).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have Lambda module for primary region', () => {
      const lambdaPrimary = mainConfig.module?.find((m: any) => m.lambda_primary);
      expect(lambdaPrimary).toBeDefined();
      expect(lambdaPrimary.lambda_primary[0].source).toBe('./modules/lambda');
    });

    test('should have Lambda module for DR region', () => {
      const lambdaDr = mainConfig.module?.find((m: any) => m.lambda_dr);
      expect(lambdaDr).toBeDefined();
      expect(lambdaDr.lambda_dr[0].source).toBe('./modules/lambda');
    });

    test('Lambda modules should use environment_suffix', () => {
      const lambdaPrimary = mainConfig.module?.find((m: any) => m.lambda_primary);
      expect(lambdaPrimary.lambda_primary[0].environment_suffix).toBeDefined();
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should have ALB module for primary region', () => {
      const albPrimary = mainConfig.module?.find((m: any) => m.alb_primary);
      expect(albPrimary).toBeDefined();
      expect(albPrimary.alb_primary[0].source).toBe('./modules/alb');
    });

    test('should have ALB module for DR region', () => {
      const albDr = mainConfig.module?.find((m: any) => m.alb_dr);
      expect(albDr).toBeDefined();
      expect(albDr.alb_dr[0].source).toBe('./modules/alb');
    });

    test('ALB modules should use environment_suffix', () => {
      const albPrimary = mainConfig.module?.find((m: any) => m.alb_primary);
      expect(albPrimary.alb_primary[0].environment_suffix).toBeDefined();
    });
  });

  describe('Route53 Failover Configuration', () => {
    test('should have Route53 module', () => {
      const route53 = mainConfig.module?.find((m: any) => m.route53);
      expect(route53).toBeDefined();
      expect(route53.route53[0].source).toBe('./modules/route53');
    });

    test('Route53 should use environment_suffix', () => {
      const route53 = mainConfig.module?.find((m: any) => m.route53);
      expect(route53.route53[0].environment_suffix).toBeDefined();
    });

    test('Route53 should reference both ALBs', () => {
      const route53 = mainConfig.module?.find((m: any) => m.route53);
      expect(route53.route53[0].primary_alb_dns).toBeDefined();
      expect(route53.route53[0].dr_alb_dns).toBeDefined();
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have CloudWatch module for primary region', () => {
      const cwPrimary = mainConfig.module?.find((m: any) => m.cloudwatch_primary);
      expect(cwPrimary).toBeDefined();
      expect(cwPrimary.cloudwatch_primary[0].source).toBe('./modules/cloudwatch');
    });

    test('should have CloudWatch module for DR region', () => {
      const cwDr = mainConfig.module?.find((m: any) => m.cloudwatch_dr);
      expect(cwDr).toBeDefined();
      expect(cwDr.cloudwatch_dr[0].source).toBe('./modules/cloudwatch');
    });

    test('CloudWatch modules should use environment_suffix', () => {
      const cwPrimary = mainConfig.module?.find((m: any) => m.cloudwatch_primary);
      expect(cwPrimary.cloudwatch_primary[0].environment_suffix).toBeDefined();
    });
  });

  describe('SNS Configuration', () => {
    test('should have SNS module for primary region', () => {
      const snsPrimary = mainConfig.module?.find((m: any) => m.sns_primary);
      expect(snsPrimary).toBeDefined();
      expect(snsPrimary.sns_primary[0].source).toBe('./modules/sns');
    });

    test('should have SNS module for DR region', () => {
      const snsDr = mainConfig.module?.find((m: any) => m.sns_dr);
      expect(snsDr).toBeDefined();
      expect(snsDr.sns_dr[0].source).toBe('./modules/sns');
    });

    test('SNS modules should use environment_suffix', () => {
      const snsPrimary = mainConfig.module?.find((m: any) => m.sns_primary);
      expect(snsPrimary.sns_primary[0].environment_suffix).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('should have IAM module', () => {
      const iam = mainConfig.module?.find((m: any) => m.iam);
      expect(iam).toBeDefined();
      expect(iam.iam[0].source).toBe('./modules/iam');
    });

    test('IAM should use environment_suffix', () => {
      const iam = mainConfig.module?.find((m: any) => m.iam);
      expect(iam.iam[0].environment_suffix).toBeDefined();
    });
  });

  describe('Output Definitions', () => {
    test('should have VPC outputs', () => {
      const vpcOutputs = outputsConfig.output?.filter((o: any) =>
        o.vpc_primary_id || o.vpc_dr_id
      );
      expect(vpcOutputs).toBeDefined();
      expect(vpcOutputs.length).toBeGreaterThan(0);
    });

    test('should have RDS outputs', () => {
      const rdsOutputs = outputsConfig.output?.filter((o: any) =>
        o.rds_primary_endpoint || o.rds_dr_endpoint
      );
      expect(rdsOutputs).toBeDefined();
      expect(rdsOutputs.length).toBeGreaterThan(0);
    });

    test('should have ALB outputs', () => {
      const albOutputs = outputsConfig.output?.filter((o: any) =>
        o.alb_primary_dns || o.alb_dr_dns
      );
      expect(albOutputs).toBeDefined();
      expect(albOutputs.length).toBeGreaterThan(0);
    });

    test('should have Route53 outputs', () => {
      const route53Outputs = outputsConfig.output?.filter((o: any) =>
        o.route53_zone_id || o.route53_domain_name
      );
      expect(route53Outputs).toBeDefined();
      expect(route53Outputs.length).toBeGreaterThan(0);
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
        expect(() => hcl.parseToObject(content)).not.toThrow();
      });

      test(`${moduleName} module should have required_providers block`, () => {
        const modulePath = path.join(libPath, 'modules', moduleName, 'main.tf');
        const content = fs.readFileSync(modulePath, 'utf8');
        const parsed = hcl.parseToObject(content)[0];
        expect(parsed).toHaveProperty('terraform');
        expect(parsed.terraform[0]).toHaveProperty('required_providers');
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all modules should accept environment_suffix variable', () => {
      const modules = mainConfig.module || [];
      modules.forEach((mod: any) => {
        const moduleName = Object.keys(mod)[0];
        const moduleConfig = mod[moduleName][0];
        expect(moduleConfig.environment_suffix).toBeDefined();
      });
    });

    test('environment_suffix should be used consistently', () => {
      const allTfFiles = getAllTfFiles(libPath);
      allTfFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // Check that if environment_suffix is used, it's used correctly
        if (content.includes('environment_suffix')) {
          // Should be referenced as variable or passed to modules
          const hasVarReference = content.includes('var.environment_suffix') ||
                                 content.includes('environment_suffix =');
          expect(hasVarReference).toBe(true);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('sensitive variables should be marked as sensitive', () => {
      const sensitiveVars = ['db_master_password'];
      sensitiveVars.forEach(varName => {
        const variable = variablesConfig.variable.find((v: any) => v[varName]);
        if (variable) {
          expect(variable[varName][0].sensitive).toBe(true);
        }
      });
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
        const primaryModule = mainConfig.module?.find((m: any) => m[`${moduleName}_primary`]);
        const drModule = mainConfig.module?.find((m: any) => m[`${moduleName}_dr`]);
        expect(primaryModule).toBeDefined();
        expect(drModule).toBeDefined();
      });
    });

    test('should have cross-region replication for critical data', () => {
      const dynamodb = mainConfig.module?.find((m: any) => m.dynamodb);
      const s3Primary = mainConfig.module?.find((m: any) => m.s3_primary);
      expect(dynamodb).toBeDefined(); // DynamoDB global table
      expect(s3Primary).toBeDefined(); // S3 with replication
    });

    test('should have Route53 for failover', () => {
      const route53 = mainConfig.module?.find((m: any) => m.route53);
      expect(route53).toBeDefined();
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
