import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit Tests for Terraform Infrastructure Configuration
 * Tests static configuration files for required resources, security settings,
 * and best practices without deploying to AWS
 */

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  
  // Read main Terraform configuration
  const tapStackPath = path.join(libPath, 'tap_stack.tf');
  const tapStackContent = fs.readFileSync(tapStackPath, 'utf8');
  
  // Read variables configuration
  const variablesPath = path.join(libPath, 'variables.tf');
  const variablesContent = fs.readFileSync(variablesPath, 'utf8');
  
  // Read outputs configuration
  const outputsPath = path.join(libPath, 'outputs.tf');
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  
  // Helper function to check if content contains a pattern
  function has(content: string, pattern: RegExp): boolean {
    return pattern.test(content);
  }
  
  describe('File Structure and Basic Configuration', () => {
    test('should have required Terraform configuration files', () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
      expect(fs.existsSync(variablesPath)).toBe(true);
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });
    
    test('should have proper Terraform provider configuration', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(has(providerContent, /provider\s+"aws"/)).toBe(true);
      expect(has(providerContent, /version\s*=\s*"~>\s*5\.0"/)).toBe(true);
    });
    
    test('should have project metadata in comments', () => {
      expect(has(tapStackContent, /project\s*#166/i)).toBe(true);
      expect(has(tapStackContent, /batch\s*004/i)).toBe(true);
    });
  });
  
  describe('Module Configuration', () => {
    test('should declare all required modules', () => {
      const requiredModules = ['networking', 'storage', 'database', 'compute', 'monitoring'];
      
      requiredModules.forEach(moduleName => {
        expect(has(tapStackContent, new RegExp(`module\\s+"${moduleName}"`))).toBe(true);
      });
    });
    
    test('should have proper module source paths', () => {
      expect(has(tapStackContent, /source\s*=\s*"\.\/modules\/networking"/)).toBe(true);
      expect(has(tapStackContent, /source\s*=\s*"\.\/modules\/storage"/)).toBe(true);
      expect(has(tapStackContent, /source\s*=\s*"\.\/modules\/database"/)).toBe(true);
      expect(has(tapStackContent, /source\s*=\s*"\.\/modules\/compute"/)).toBe(true);
      expect(has(tapStackContent, /source\s*=\s*"\.\/modules\/monitoring"/)).toBe(true);
    });
    
    test('should have module dependencies configured', () => {
      expect(has(tapStackContent, /depends_on\s*=\s*\[\s*module\.networking\s*\]/)).toBe(true);
      expect(has(tapStackContent, /depends_on\s*=\s*\[\s*module\.networking,\s*module\.storage\s*\]/)).toBe(true);
      expect(has(tapStackContent, /depends_on\s*=\s*\[\s*module\.compute,\s*module\.database\s*\]/)).toBe(true);
    });
  });
  
  describe('Data Sources and Locals', () => {
    test('should have required data sources', () => {
      expect(has(tapStackContent, /data\s+"aws_availability_zones"\s+"available"/)).toBe(true);
      expect(has(tapStackContent, /data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
      expect(has(tapStackContent, /data\s+"aws_region"\s+"current"/)).toBe(true);
    });
    
    test('should have local values for configuration', () => {
      expect(has(tapStackContent, /locals\s*\{/)).toBe(true);
      expect(has(tapStackContent, /availability_zones\s*=/)).toBe(true);
      expect(has(tapStackContent, /common_tags\s*=/)).toBe(true);
    });
    
    test('should use dynamic availability zones', () => {
      expect(has(tapStackContent, /slice\(data\.aws_availability_zones\.available\.names/)).toBe(true);
    });
  });
  
  describe('Variable Definitions', () => {
    test('should have all required variables defined', () => {
      const requiredVariables = [
        'aws_region',
        'project_name',
        'environment',
        'owner',
        'vpc_cidr',
        'enable_nat_gateway',
        'instance_type',
        'key_name',
        'db_instance_class',
        'db_name',
        'db_username',
        'enable_encryption',
        'sns_email'
      ];
      
      requiredVariables.forEach(varName => {
        expect(has(variablesContent, new RegExp(`variable\\s+"${varName}"`))).toBe(true);
      });
    });
    
    test('should have appropriate variable defaults', () => {
      expect(has(variablesContent, /default\s*=\s*"us-west-2"/)).toBe(true);
      expect(has(variablesContent, /default\s*=\s*"production"/)).toBe(true);
      expect(has(variablesContent, /default\s*=\s*true/)).toBe(true);
    });
    
    test('should have secure key pair configuration', () => {
      expect(has(variablesContent, /EC2 Key Pair name \(optional - leave empty to launch without key pair\)/)).toBe(true);
      expect(has(variablesContent, /default\s*=\s*""/)).toBe(true); // Empty default for key_name
    });
  });
  
  describe('Output Configuration', () => {
    test('should have required outputs defined', () => {
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'ec2_instance_ids',
        'ec2_public_ips',
        'rds_endpoint',
        's3_bucket_name',
        's3_bucket_arn'
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(has(outputsContent, new RegExp(`output\\s+"${outputName}"`))).toBe(true);
      });
    });
    
    test('should have sensitive outputs marked appropriately', () => {
      expect(has(outputsContent, /sensitive\s*=\s*true/)).toBe(true);
    });
    
    test('should reference module outputs correctly', () => {
      expect(has(outputsContent, /module\.networking\./)).toBe(true);
      expect(has(outputsContent, /module\.compute\./)).toBe(true);
      expect(has(outputsContent, /module\.database\./)).toBe(true);
      expect(has(outputsContent, /module\.storage\./)).toBe(true);
    });
  });
  
  describe('Tagging and Naming Conventions', () => {
    test('should have consistent naming with prod- prefix', () => {
      expect(has(variablesContent, /prod-project-166/)).toBe(true);
    });
    
    test('should have comprehensive tagging strategy', () => {
      // Check tagging in provider.tf instead of tap_stack.tf
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(has(providerContent, /default_tags/)).toBe(true);
      expect(has(providerContent, /Project.*project-166/)).toBe(true);
      expect(has(providerContent, /Batch.*batch-004/)).toBe(true);
      expect(has(providerContent, /ManagedBy.*terraform/)).toBe(true);
      expect(has(providerContent, /CostCenter.*infrastructure/)).toBe(true);
    });
    
    test('should pass tags to all modules', () => {
      const moduleNames = ['networking', 'storage', 'database', 'compute', 'monitoring'];
      
      moduleNames.forEach(moduleName => {
        expect(has(tapStackContent, new RegExp(`tags\\s*=\\s*local\\.common_tags`))).toBe(true);
      });
    });
    
    test('should use merge function for consistent tagging in modules', () => {
      const moduleNames = ['compute', 'database'];
      
      moduleNames.forEach(moduleName => {
        const moduleMainContent = fs.readFileSync(path.join(libPath, 'modules', moduleName, 'main.tf'), 'utf8');
        expect(has(moduleMainContent, /merge\(var\.tags,/)).toBe(true);
      });
    });
  });
  
  describe('Security Configuration', () => {
    test('should have encryption enabled by default', () => {
      expect(has(variablesContent, /enable_encryption.*default\s*=\s*true/s)).toBe(true);
    });
    
    test('should have proper backend configuration for state management', () => {
      // Check backend configuration in provider.tf instead of tap_stack.tf
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(has(providerContent, /backend\s+"s3"/)).toBe(true);
      // Backend is configured as partial config (backend "s3" {}) for flexibility
    });
    
    test('should use secure provider versions', () => {
      // Check provider versions in provider.tf instead of tap_stack.tf
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(has(providerContent, /required_version\s*=\s*">=\s*1\.0"/)).toBe(true);
    });
  });
  
  describe('Module Files Structure', () => {
    const moduleNames = ['networking', 'storage', 'database', 'compute', 'monitoring'];
    
    moduleNames.forEach(moduleName => {
      describe(`${moduleName} module`, () => {
        const modulePath = path.join(libPath, 'modules', moduleName);
        
        test(`should have required files`, () => {
          expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
          expect(fs.existsSync(path.join(modulePath, 'variables.tf'))).toBe(true);
          expect(fs.existsSync(path.join(modulePath, 'outputs.tf'))).toBe(true);
        });
        
        test(`should have tags variable defined`, () => {
          const moduleVarsContent = fs.readFileSync(path.join(modulePath, 'variables.tf'), 'utf8');
          expect(has(moduleVarsContent, /variable\s+"tags"/)).toBe(true);
        });
      });
    });
  });
  
  describe('Specific Module Content Validation', () => {
    test('networking module should have VPC and subnet configurations', () => {
      const networkingMainContent = fs.readFileSync(path.join(libPath, 'modules', 'networking', 'main.tf'), 'utf8');
      
      expect(has(networkingMainContent, /resource\s+"aws_vpc"\s+"main"/)).toBe(true);
      expect(has(networkingMainContent, /resource\s+"aws_subnet"\s+"public"/)).toBe(true);
      expect(has(networkingMainContent, /resource\s+"aws_subnet"\s+"private"/)).toBe(true);
      expect(has(networkingMainContent, /resource\s+"aws_internet_gateway"/)).toBe(true);
      expect(has(networkingMainContent, /resource\s+"aws_nat_gateway"/)).toBe(true);
      expect(has(networkingMainContent, /resource\s+"aws_route_table"/)).toBe(true);
    });
    
    test('storage module should have S3 security configurations', () => {
      const storageMainContent = fs.readFileSync(path.join(libPath, 'modules', 'storage', 'main.tf'), 'utf8');
      
      expect(has(storageMainContent, /resource\s+"aws_s3_bucket"/)).toBe(true);
      expect(has(storageMainContent, /aws_s3_bucket_versioning/)).toBe(true);
      expect(has(storageMainContent, /aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
      expect(has(storageMainContent, /aws_s3_bucket_public_access_block/)).toBe(true);
      expect(has(storageMainContent, /aws_s3_bucket_lifecycle_configuration/)).toBe(true);
      expect(has(storageMainContent, /filter\s*\{\s*\}/)).toBe(true); // Fixed lifecycle issue
    });
    
    test('database module should have RDS with security features', () => {
      const dbMainContent = fs.readFileSync(path.join(libPath, 'modules', 'database', 'main.tf'), 'utf8');
      
      expect(has(dbMainContent, /resource\s+"random_id"\s+"database_suffix"/)).toBe(true); // Random suffix for uniqueness
      expect(has(dbMainContent, /resource\s+"random_password"/)).toBe(true);
      expect(has(dbMainContent, /resource\s+"aws_db_instance"/)).toBe(true);
      expect(has(dbMainContent, /storage_encrypted\s*=\s*var\.enable_encryption/)).toBe(true);
      expect(has(dbMainContent, /override_special\s*=/)).toBe(true); // Fixed password issue
      expect(has(dbMainContent, /aws_ssm_parameter/)).toBe(true);
      expect(has(dbMainContent, /overwrite\s*=\s*true/)).toBe(true); // SSM parameter overwrite
      expect(has(dbMainContent, /create_before_destroy\s*=\s*true/)).toBe(true); // Lifecycle management
      expect(has(dbMainContent, /random_id\.database_suffix\.hex/)).toBe(true); // Uses random suffix in names
    });
    
    test('compute module should have EC2 with IAM roles', () => {
      const computeMainContent = fs.readFileSync(path.join(libPath, 'modules', 'compute', 'main.tf'), 'utf8');
      
      expect(has(computeMainContent, /resource\s+"random_id"\s+"compute_suffix"/)).toBe(true); // Random suffix for uniqueness
      expect(has(computeMainContent, /resource\s+"aws_instance"/)).toBe(true);
      expect(has(computeMainContent, /resource\s+"aws_iam_role"/)).toBe(true);
      expect(has(computeMainContent, /resource\s+"aws_security_group"/)).toBe(true);
      expect(has(computeMainContent, /key_name.*var\.key_name.*!.*""/)).toBe(true); // Fixed key pair issue
      expect(has(computeMainContent, /overwrite\s*=\s*true/)).toBe(true); // SSM parameter overwrite
      expect(has(computeMainContent, /create_before_destroy\s*=\s*true/)).toBe(true); // IAM role lifecycle
      expect(has(computeMainContent, /random_id\.compute_suffix\.hex/)).toBe(true); // Uses random suffix in names
    });
    
    test('monitoring module should have CloudWatch and SNS', () => {
      const monitoringMainContent = fs.readFileSync(path.join(libPath, 'modules', 'monitoring', 'main.tf'), 'utf8');
      
      expect(has(monitoringMainContent, /resource\s+"random_id"\s+"monitoring_suffix"/)).toBe(true); // Random suffix for uniqueness
      expect(has(monitoringMainContent, /resource\s+"aws_sns_topic"/)).toBe(true);
      expect(has(monitoringMainContent, /resource\s+"aws_cloudwatch_metric_alarm"/)).toBe(true);
      expect(has(monitoringMainContent, /resource\s+"aws_sns_topic_subscription"/)).toBe(true);
      expect(has(monitoringMainContent, /random_id\.monitoring_suffix\.hex/)).toBe(true); // Uses random suffix in names
    });
  });
});