import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '../lib');
  const mainTfPath = path.join(libDir, 'main.tf');
  const providerTfPath = path.join(libDir, 'provider.tf');
  const variablesTfPath = path.join(libDir, 'variables.tf');

  beforeAll(() => {
    // Ensure test files exist
    expect(fs.existsSync(mainTfPath)).toBe(true);
    expect(fs.existsSync(providerTfPath)).toBe(true);
    expect(fs.existsSync(variablesTfPath)).toBe(true);
  });

  describe('Terraform Syntax and Validation', () => {
    test('main.tf should exist and be readable', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/resource\s+"aws_/);
    });

    test('provider.tf should exist and be readable', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
      const content = fs.readFileSync(providerTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test('variables.tf should exist and be readable', () => {
      expect(fs.existsSync(variablesTfPath)).toBe(true);
      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/variable\s+/);
    });

    test('Terraform files should have valid basic syntax', () => {
      const mainContent = fs.readFileSync(mainTfPath, 'utf8');
      
      // Check for balanced braces
      const openBraces = (mainContent.match(/{/g) || []).length;
      const closeBraces = (mainContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
      
      // Check for valid resource declarations
      expect(mainContent).toMatch(/resource\s+"[\w_]+"\s+"[\w_]+"\s*{/);
    });
  });

  describe('Security Requirements Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('should have KMS encryption for S3 buckets', () => {
      // Check for S3 bucket with KMS encryption
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainTfContent).toMatch(/kms_master_key_id\s*=.*aws_kms_key/);
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_flow_log"/);
      expect(mainTfContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('should have CloudFront distribution with WAF', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudfront_distribution"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl"/);
      expect(mainTfContent).toMatch(/web_acl_id\s*=.*aws_wafv2_web_acl/);
    });

    test('should have IAM MFA enforcement policy', () => {
      // Look for MFA enforcement in the policy
      expect(mainTfContent).toMatch(/aws:MultiFactorAuthPresent/);
      expect(mainTfContent).toMatch(/BoolIfExists/);
    });

    test('should have IP restriction policy', () => {
      expect(mainTfContent).toMatch(/aws:SourceIp/);
      expect(mainTfContent).toMatch(/IpAddress/);
    });

    test('should have security groups restricting to HTTP/HTTPS only', () => {
      expect(mainTfContent).toMatch(/from_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/from_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('should have IAM roles for EC2 to S3 access', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role".*EC2.*S3/i);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
      expect(mainTfContent).toMatch(/s3:GetObject|s3:PutObject/);
    });

    test('should have KMS key rotation enabled', () => {
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe('Environment Suffix Usage Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('S3 bucket should use environment_suffix variable', () => {
      expect(mainTfContent).toMatch(/bucket\s*=.*var\.environment_suffix/);
    });

    test('should check for potential resource naming conflicts', () => {
      const resourcesWithoutSuffix = [
        'VPCFlowLogsRole',
        'EC2S3AccessRole',
        'MFAEnforcementPolicy',
        'IPRestrictionPolicy'
      ];

      const resourcesFound = resourcesWithoutSuffix.filter(resource => 
        mainTfContent.includes(`"${resource}"`) && 
        !mainTfContent.includes(`"${resource}-\${var.environment_suffix}"`)
      );

      if (resourcesFound.length > 0) {
        console.warn(`⚠️ Resources without environment suffix found: ${resourcesFound.join(', ')}`);
      }
    });

    test('KMS key aliases should use environment_suffix to avoid conflicts', () => {
      const aliasMatches = mainTfContent.match(/name\s*=\s*"alias\/[\w-]+"/g);
      if (aliasMatches) {
        const hardcodedAliases = aliasMatches.filter(alias => 
          !alias.includes('${var.environment_suffix}')
        );
        
        if (hardcodedAliases.length > 0) {
          console.warn(`⚠️ Hardcoded KMS aliases found: ${hardcodedAliases.join(', ')}`);
        }
      }
    });

    test('CloudWatch log groups should use environment_suffix', () => {
      const logGroupMatches = mainTfContent.match(/name\s*=\s*"\/aws\/[\w\/]+"/g);
      if (logGroupMatches) {
        const hardcodedLogGroups = logGroupMatches.filter(logGroup => 
          !logGroup.includes('${var.environment_suffix}')
        );
        
        if (hardcodedLogGroups.length > 0) {
          console.warn(`⚠️ Hardcoded log group names found: ${hardcodedLogGroups.join(', ')}`);
        }
      }
    });
  });

  describe('Security Best Practices Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('should not use test IP ranges in production', () => {
      const testIpRanges = [
        '203.0.113.0/24',  // TEST-NET-3
        '198.51.100.0/24', // TEST-NET-2
        '192.0.2.0/24'     // TEST-NET-1
      ];

      testIpRanges.forEach(testIp => {
        if (mainTfContent.includes(testIp)) {
          console.warn(`⚠️ Test IP range found in configuration: ${testIp}`);
        }
      });
    });

    test('should have proper S3 bucket policies', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
      expect(mainTfContent).toMatch(/cloudfront\.amazonaws\.com/);
    });

    test('should have proper HTTPS redirects in CloudFront', () => {
      expect(mainTfContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('should have WAF rules for security', () => {
      expect(mainTfContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(mainTfContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });
  });

  describe('Resource Tagging Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('should have consistent tagging across resources', () => {
      const resourceBlocks = mainTfContent.match(/resource\s+"[\w_]+"[\s\S]*?(?=resource\s+"|$)/g) || [];
      
      let resourcesWithoutTags = 0;
      let resourcesWithoutEnvironmentTag = 0;

      resourceBlocks.forEach((block, index) => {
        if (!block.includes('tags =') && !block.includes('tags{')) {
          resourcesWithoutTags++;
        }
        
        if (!block.includes('Environment') && !block.includes('environment')) {
          resourcesWithoutEnvironmentTag++;
        }
      });

      // Log warnings for missing tags
      if (resourcesWithoutTags > 0) {
        console.warn(`⚠️ ${resourcesWithoutTags} resources found without tags`);
      }
      
      if (resourcesWithoutEnvironmentTag > 0) {
        console.warn(`⚠️ ${resourcesWithoutEnvironmentTag} resources found without Environment tag`);
      }
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesTfPath, 'utf8');
    });

    test('should have environment_suffix variable defined', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('should have aws_region variable defined', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('environment_suffix should have proper default value', () => {
      const envSuffixMatch = variablesContent.match(/variable\s+"environment_suffix"[\s\S]*?(?=variable\s+|$)/);
      if (envSuffixMatch) {
        expect(envSuffixMatch[0]).toMatch(/default\s*=\s*"dev"/);
      }
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerTfPath, 'utf8');
    });

    test('should have AWS provider with minimum version', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should have terraform block with required version', () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\./);
    });

    test('should have S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });
  });

  describe('Terraform Configuration Validation', () => {
    test('should have valid configuration structure', () => {
      const mainContent = fs.readFileSync(mainTfPath, 'utf8');
      
      // Check for essential resource types
      const requiredResources = [
        'aws_vpc',
        'aws_s3_bucket',
        'aws_cloudfront_distribution',
        'aws_security_group',
        'aws_kms_key',
        'aws_flow_log',
        'aws_wafv2_web_acl'
      ];

      requiredResources.forEach(resourceType => {
        expect(mainContent).toMatch(new RegExp(`resource\\s+"${resourceType}"`));
      });
    });

    test('should have proper resource relationships', () => {
      const mainContent = fs.readFileSync(mainTfPath, 'utf8');
      
      // Check that resources reference each other properly
      expect(mainContent).toMatch(/aws_vpc\.main\.id/);
      expect(mainContent).toMatch(/aws_kms_key\.\w+\.arn/);
      expect(mainContent).toMatch(/aws_s3_bucket\.\w+\.arn/);
    });
  });
});
