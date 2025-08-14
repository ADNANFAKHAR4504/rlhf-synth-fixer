/**
 * Comprehensive Unit Tests for Terraform Infrastructure Configuration
 * 
 * This test suite provides complete validation of the Terraform configuration
 * located at ../lib/main.tf and ../lib/provider.tf without executing any
 * terraform commands (init, plan, apply, etc.).
 * 
 * Test Coverage Summary:
 * ✅ 71 Test Cases Covering:
 * 
 * 🔧 INFRASTRUCTURE COMPONENTS:
 * - Provider configuration and version constraints
 * - Variable definitions with proper validations
 * - Local values and computed configurations
 * - Data sources (AWS caller identity, partition)
 * - Random ID generation for unique naming
 * 
 * 🗄️ S3 BUCKET SECURITY STACK:
 * - S3 bucket creation with for_each loops
 * - Versioning enabled for data protection
 * - Server-side encryption (AES-256) enforcement
 * - Public access blocking (all 4 controls)
 * - Lifecycle policies for cost optimization
 * - Access logging configuration
 * - Bucket policies with security controls
 * 
 * 🔐 IAM SECURITY FRAMEWORK:
 * - IAM roles with proper assume role policies
 * - External ID conditions for security
 * - Least privilege IAM policies
 * - Policy attachments and role relationships
 * - Read-only roles for operational access
 * 
 * 🔒 SECURITY COMPLIANCE:
 * - Encryption enforcement everywhere
 * - Secure transport (HTTPS) requirements
 * - Public access prevention
 * - Defense in depth implementation
 * - AWS security best practices
 * 
 * 📊 OPERATIONAL EXCELLENCE:
 * - Comprehensive output definitions
 * - Monitoring and logging capabilities
 * - Cost optimization features
 * - Resource naming conventions
 * - Dependency management
 * - Error handling and validation
 * 
 * 🏗️ ARCHITECTURE VALIDATION:
 * - End-to-end configuration integrity
 * - Multi-environment support
 * - Scalable resource creation
 * - Integration readiness
 * 
 * All tests validate the static configuration without requiring AWS credentials
 * or actual infrastructure deployment, making them perfect for CI/CD pipelines
 * and local development workflows.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Provider Configuration', () => {
  let providerContent: string;
  const providerFilePath = path.resolve(__dirname, '../lib/provider.tf');

  beforeAll(() => {
    // Read the provider configuration file
    expect(fs.existsSync(providerFilePath)).toBeTruthy();
    providerContent = fs.readFileSync(providerFilePath, 'utf8');
  });

  test('provider.tf file should exist and be readable', () => {
    expect(fs.existsSync(providerFilePath)).toBeTruthy();
    expect(providerContent).toBeDefined();
    expect(providerContent.length).toBeGreaterThan(0);
  });

  test('should define terraform required version', () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
  });

  test('should define AWS provider with proper version', () => {
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
  });

  test('should configure S3 backend', () => {
    expect(providerContent).toMatch(/backend\s*"s3"/);
  });

  test('should configure AWS provider with region variable', () => {
    expect(providerContent).toMatch(/provider\s*"aws"/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

// add more test suites and cases as needed

/**
 * Comprehensive Unit Tests for Terraform Configuration
 * 
 * This test suite validates the Terraform configuration in ../lib/main.tf
 * without running terraform init, plan, or apply commands.
 * 
 * Test Coverage:
 * - Variable validations and defaults
 * - Resource configurations and dependencies
 * - Security settings and compliance
 * - Output specifications
 * - Naming conventions and standards
 */

describe('Terraform main.tf Configuration Tests', () => {
  let terraformContent: string;
  const terraformFilePath = path.resolve(__dirname, '../lib/main.tf');

  beforeAll(() => {
    // Read the Terraform configuration file
    expect(fs.existsSync(terraformFilePath)).toBeTruthy();
    terraformContent = fs.readFileSync(terraformFilePath, 'utf8');
  });

  describe('File Structure and Syntax', () => {
    test('terraform file should exist and be readable', () => {
      expect(fs.existsSync(terraformFilePath)).toBeTruthy();
      expect(terraformContent).toBeDefined();
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test('should contain valid HCL syntax structure', () => {
      // Check for basic HCL structure elements
      expect(terraformContent).toMatch(/variable\s+"\w+"/);
      expect(terraformContent).toMatch(/resource\s+"\w+"/);
      expect(terraformContent).toMatch(/output\s+"\w+"/);
      expect(terraformContent).toMatch(/locals\s*{/);
    });

    test('should have proper terraform block structure', () => {
      // Verify that blocks are properly opened and closed
      const openBraces = (terraformContent.match(/{/g) || []).length;
      const closeBraces = (terraformContent.match(/}/g) || []).length;
      expect(openBraces).toEqual(closeBraces);
    });
  });

  describe('Variable Definitions and Validations', () => {
    test('should define aws_region variable with proper validation', () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"/);
      expect(terraformContent).toMatch(/type\s+=\s+string/);
      expect(terraformContent).toMatch(/default\s+=\s+"us-east-1"/);
      expect(terraformContent).toMatch(/validation\s*{[\s\S]*condition[\s\S]*error_message/);
    });

    test('should define environment variable with allowed values', () => {
      expect(terraformContent).toMatch(/variable\s+"environment"/);
      expect(terraformContent).toMatch(/default\s+=\s+"prod"/);
      expect(terraformContent).toMatch(/contains\(\["prod",\s*"staging",\s*"dev"\]/);
      expect(terraformContent).toMatch(/Environment must be one of: prod, staging, dev/);
    });

    test('should define project_name variable with naming validation', () => {
      expect(terraformContent).toMatch(/variable\s+"project_name"/);
      expect(terraformContent).toMatch(/default\s+=\s+"secure-app"/);
      expect(terraformContent).toMatch(/lowercase letters, numbers, and hyphens/);
    });

    test('should define bucket_names variable as list with validation', () => {
      expect(terraformContent).toMatch(/variable\s+"bucket_names"/);
      expect(terraformContent).toMatch(/type\s+=\s+list\(string\)/);
      expect(terraformContent).toMatch(/default\s+=\s+\["data",\s*"logs",\s*"backups"\]/);
      expect(terraformContent).toMatch(/length\(var\.bucket_names\)\s+>\s+0/);
    });

    test('all variables should have descriptions', () => {
      const variableBlocks = terraformContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);
      
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s+=\s+"[^"]+"/);
      });
    });
  });

  describe('Local Values Configuration', () => {
    test('should define common_tags local with required tags', () => {
      expect(terraformContent).toMatch(/locals\s*{/);
      expect(terraformContent).toMatch(/common_tags\s*=/);
      expect(terraformContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(terraformContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(terraformContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(terraformContent).toMatch(/Region\s*=\s*var\.aws_region/);
      expect(terraformContent).toMatch(/CreatedDate\s*=\s*timestamp\(\)/);
    });

    test('should define bucket_configs with proper naming convention', () => {
      expect(terraformContent).toMatch(/bucket_configs\s*=/);
      expect(terraformContent).toMatch(/for\s+name\s+in\s+var\.bucket_names/);
      expect(terraformContent).toMatch(/full_name\s*=/);
      expect(terraformContent).toMatch(/purpose\s*=\s*name/);
    });
  });

  describe('Data Sources', () => {
    test('should include aws_caller_identity data source', () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should include aws_partition data source', () => {
      expect(terraformContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe('Random ID Resource', () => {
    test('should define random_id for bucket naming', () => {
      expect(terraformContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(terraformContent).toMatch(/byte_length\s*=\s*4/);
      expect(terraformContent).toMatch(/keepers\s*=\s*{/);
      expect(terraformContent).toMatch(/project\s*=\s*var\.project_name/);
      expect(terraformContent).toMatch(/environment\s*=\s*var\.environment/);
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should define S3 buckets with for_each loop', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_buckets"/);
      expect(terraformContent).toMatch(/for_each\s*=\s*local\.bucket_configs/);
      expect(terraformContent).toMatch(/bucket\s*=\s*each\.value\.full_name/);
    });

    test('should include proper tagging for S3 buckets', () => {
      expect(terraformContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(terraformContent).toMatch(/Name\s*=\s*each\.value\.full_name/);
      expect(terraformContent).toMatch(/Purpose\s*=\s*each\.value\.purpose/);
    });

    test('should configure S3 bucket versioning', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"bucket_versioning"/);
      expect(terraformContent).toMatch(/for_each\s*=\s*aws_s3_bucket\.secure_buckets/);
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket\.secure_buckets\]/);
    });

    test('should configure S3 bucket encryption', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"bucket_encryption"/);
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(terraformContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test('should block all public access', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"bucket_pab"/);
      expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(terraformContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should configure lifecycle management', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"bucket_lifecycle"/);
      expect(terraformContent).toMatch(/id\s*=\s*"transition_to_ia"/);
      expect(terraformContent).toMatch(/days\s*=\s*30[\s\S]*storage_class\s*=\s*"STANDARD_IA"/);
      expect(terraformContent).toMatch(/days\s*=\s*90[\s\S]*storage_class\s*=\s*"GLACIER"/);
      expect(terraformContent).toMatch(/noncurrent_version_expiration/);
    });

    test('should configure access logging', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"bucket_logging"/);
      expect(terraformContent).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.secure_buckets\["logs"\]\.id/);
      expect(terraformContent).toMatch(/target_prefix\s*=\s*"access-logs/);
      // Should exclude logs bucket from logging to itself
      expect(terraformContent).toMatch(/if\s+k\s+!=\s+"logs"/);
    });
  });

  describe('IAM Resources', () => {
    test('should define IAM roles for S3 access', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_access_role"/);
      expect(terraformContent).toMatch(/for_each\s*=\s*local\.bucket_configs/);
      expect(terraformContent).toMatch(/name\s*=.*s3.*role/);
    });

    test('should include proper assume role policy with external ID', () => {
      expect(terraformContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(terraformContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
      expect(terraformContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(terraformContent).toMatch(/StringEquals\s*=\s*{/);
      expect(terraformContent).toMatch(/sts:ExternalId/);
    });

    test('should define IAM policies with least privilege', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_bucket_policy"/);
      expect(terraformContent).toMatch(/s3:ListBucket/);
      expect(terraformContent).toMatch(/s3:GetBucketLocation/);
      expect(terraformContent).toMatch(/s3:GetObject/);
      expect(terraformContent).toMatch(/s3:PutObject/);
      expect(terraformContent).toMatch(/s3:DeleteObject/);
      expect(terraformContent).toMatch(/s3:GetEncryptionConfiguration/);
    });

    test('should attach policies to roles', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_policy_attachment"/);
      expect(terraformContent).toMatch(/role\s*=\s*aws_iam_role\.s3_access_role\[each\.key\]\.name/);
      expect(terraformContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.s3_bucket_policy\[each\.key\]\.arn/);
    });

    test('should define read-only role and policy', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_readonly_role"/);
      expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_readonly_policy"/);
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"s3_readonly_policy_attachment"/);
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should define bucket policies with security controls', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"bucket_policies"/);
      expect(terraformContent).toMatch(/for_each\s*=\s*aws_s3_bucket\.secure_buckets/);
    });

    test('should deny insecure connections', () => {
      expect(terraformContent).toMatch(/Sid\s*=\s*"DenyInsecureConnections"/);
      expect(terraformContent).toMatch(/Effect\s*=\s*"Deny"/);
      expect(terraformContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
    });

    test('should deny unencrypted object uploads', () => {
      expect(terraformContent).toMatch(/Sid\s*=\s*"DenyUnencryptedObjectUploads"/);
      expect(terraformContent).toMatch(/"s3:x-amz-server-side-encryption"\s*=\s*"AES256"/);
    });

    test('should allow role access', () => {
      expect(terraformContent).toMatch(/Sid\s*=\s*"AllowRoleAccess"/);
      expect(terraformContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(terraformContent).toMatch(/aws_iam_role\.s3_access_role\[each\.key\]\.arn/);
      expect(terraformContent).toMatch(/aws_iam_role\.s3_readonly_role\.arn/);
    });

    test('should have proper dependencies', () => {
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_s3_bucket_public_access_block\.bucket_pab/);
      expect(terraformContent).toMatch(/aws_iam_role\.s3_access_role/);
      expect(terraformContent).toMatch(/aws_iam_role\.s3_readonly_role/);
    });
  });

  describe('Output Definitions', () => {
    const expectedOutputs = [
      's3_bucket_names',
      's3_bucket_arns',
      's3_bucket_domains',
      'iam_role_arns',
      'iam_readonly_role_arn',
      'iam_policy_arns',
      'iam_readonly_policy_arn',
      'bucket_encryption_status',
      'deployment_info'
    ];

    test('should define all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(terraformContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });

    test('all outputs should have descriptions', () => {
      expectedOutputs.forEach(outputName => {
        const outputRegex = new RegExp(`output\\s+"${outputName}"\\s*{[^}]*description[^}]*}`, 's');
        expect(terraformContent).toMatch(outputRegex);
      });
    });

    test('should output S3 bucket information correctly', () => {
      expect(terraformContent).toMatch(/value\s*=\s*{\s*for\s+k,\s*v\s+in\s+aws_s3_bucket\.secure_buckets\s*:\s*k\s*=>\s*v\.id/);
      expect(terraformContent).toMatch(/value\s*=\s*{\s*for\s+k,\s*v\s+in\s+aws_s3_bucket\.secure_buckets\s*:\s*k\s*=>\s*v\.arn/);
      expect(terraformContent).toMatch(/value\s*=\s*{\s*for\s+k,\s*v\s+in\s+aws_s3_bucket\.secure_buckets\s*:\s*k\s*=>\s*v\.bucket_domain_name/);
    });

    test('should output IAM information correctly', () => {
      expect(terraformContent).toMatch(/value\s*=\s*{\s*for\s+k,\s*v\s+in\s+aws_iam_role\.s3_access_role\s*:\s*k\s*=>\s*v\.arn/);
      expect(terraformContent).toMatch(/value\s*=\s*aws_iam_role\.s3_readonly_role\.arn/);
      expect(terraformContent).toMatch(/value\s*=\s*{\s*for\s+k,\s*v\s+in\s+aws_iam_policy\.s3_bucket_policy\s*:\s*k\s*=>\s*v\.arn/);
    });

    test('should output deployment information', () => {
      expect(terraformContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(terraformContent).toMatch(/environment\s*=\s*var\.environment/);
      expect(terraformContent).toMatch(/project\s*=\s*var\.project_name/);
      expect(terraformContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
      expect(terraformContent).toMatch(/created_at\s*=\s*timestamp\(\)/);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should enforce encryption on all S3 resources', () => {
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(terraformContent).toMatch(/bucket_key_enabled\s*=\s*true/);
      expect(terraformContent).toMatch(/"s3:x-amz-server-side-encryption"/);
    });

    test('should block all public access configurations', () => {
      expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(terraformContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should require secure transport (HTTPS)', () => {
      expect(terraformContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
      expect(terraformContent).toMatch(/Effect\s*=\s*"Deny"/);
    });

    test('should use external ID for assume role security', () => {
      expect(terraformContent).toMatch(/"sts:ExternalId"/);
      expect(terraformContent).toMatch(/StringEquals/);
    });

    test('should follow least privilege principle in IAM policies', () => {
      // Check that policies are scoped to specific buckets, not wildcards
      expect(terraformContent).toMatch(/Resource.*aws_s3_bucket\.secure_buckets\[each\.key\]\.arn/);
      expect(terraformContent).toMatch(/Resource.*aws_s3_bucket\.secure_buckets\[each\.key\]\.arn.*\/\*/);
    });

    test('should enable versioning for data protection', () => {
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
      expect(terraformContent).toMatch(/noncurrent_version_expiration/);
    });
  });

  describe('Naming Conventions and Standards', () => {
    test('should follow consistent resource naming pattern', () => {
      // Resources should include project name, environment, and purpose
      expect(terraformContent).toMatch(/name\s*=.*project_name.*environment/);
      expect(terraformContent).toMatch(/bucket\s*=\s*.*full_name/);
    });

    test('should use consistent tagging strategy', () => {
      expect(terraformContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      const requiredTags = ['Environment', 'Project', 'ManagedBy', 'Region', 'CreatedDate'];
      requiredTags.forEach(tag => {
        expect(terraformContent).toMatch(new RegExp(`${tag}\\s*=`));
      });
    });

    test('should use proper resource references', () => {
      // Check for proper resource references instead of hardcoded values
      expect(terraformContent).toMatch(/aws_s3_bucket\.secure_buckets\[each\.key\]/);
      expect(terraformContent).toMatch(/aws_iam_role\.s3_access_role\[each\.key\]/);
      expect(terraformContent).toMatch(/data\.aws_caller_identity\.current/);
    });
  });

  describe('Resource Dependencies', () => {
    test('should have explicit dependencies where required', () => {
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket\.secure_buckets\]/);
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_versioning\.bucket_versioning\]/);
    });

    test('should not create circular dependencies', () => {
      // Basic check that bucket policies depend on roles, not vice versa
      const bucketPolicyMatch = terraformContent.match(/resource\s+"aws_s3_bucket_policy"[\s\S]*?depends_on[\s\S]*?aws_iam_role/);
      expect(bucketPolicyMatch).toBeTruthy();
      
      // IAM roles should not depend on bucket policies
      const roleMatch = terraformContent.match(/resource\s+"aws_iam_role"[\s\S]*?depends_on[\s\S]*?aws_s3_bucket_policy/);
      expect(roleMatch).toBeFalsy();
    });

    test('should use for_each loops correctly', () => {
      expect(terraformContent).toMatch(/for_each\s*=\s*local\.bucket_configs/);
      expect(terraformContent).toMatch(/for_each\s*=\s*aws_s3_bucket\.secure_buckets/);
      expect(terraformContent).toMatch(/each\.key/);
      expect(terraformContent).toMatch(/each\.value/);
    });
  });

  describe('Cost Optimization Features', () => {
    test('should include lifecycle policies for cost management', () => {
      expect(terraformContent).toMatch(/transition/);
      expect(terraformContent).toMatch(/STANDARD_IA/);
      expect(terraformContent).toMatch(/GLACIER/);
      expect(terraformContent).toMatch(/noncurrent_version_transition/);
      expect(terraformContent).toMatch(/noncurrent_version_expiration/);
    });

    test('should configure appropriate transition periods', () => {
      expect(terraformContent).toMatch(/days\s*=\s*30/);
      expect(terraformContent).toMatch(/days\s*=\s*90/);
      expect(terraformContent).toMatch(/noncurrent_days\s*=\s*30/);
      expect(terraformContent).toMatch(/noncurrent_days\s*=\s*365/);
    });
  });

  describe('Monitoring and Observability', () => {
    test('should configure access logging', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_logging"/);
      expect(terraformContent).toMatch(/target_bucket/);
      expect(terraformContent).toMatch(/target_prefix/);
    });

    test('should include bucket notification configuration', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_notification"/);
    });

    test('should exclude logs bucket from self-logging', () => {
      expect(terraformContent).toMatch(/if\s+k\s+!=\s+"logs"/);
    });
  });

  describe('Error Handling and Validation', () => {
    test('should have proper variable validations', () => {
      expect(terraformContent).toMatch(/validation\s*{/);
      expect(terraformContent).toMatch(/condition/);
      expect(terraformContent).toMatch(/error_message/);
    });

    test('should validate input constraints', () => {
      expect(terraformContent).toMatch(/contains\(\["prod",\s*"staging",\s*"dev"\]/);
      expect(terraformContent).toMatch(/length\(var\.bucket_names\)\s*>\s*0/);
      expect(terraformContent).toMatch(/can\(regex\(/);
    });

    test('should have meaningful error messages', () => {
      expect(terraformContent).toMatch(/Environment must be one of/);
      expect(terraformContent).toMatch(/At least one bucket name must be provided/);
      expect(terraformContent).toMatch(/lowercase letters, numbers, and hyphens/);
    });
  });
});

/**
 * Integration validation tests (without actual deployment)
 * These tests validate the logical relationships and configurations
 */
describe('Terraform Configuration Integration Validation', () => {
  let terraformContent: string;
  const terraformFilePath = path.resolve(__dirname, '../lib/main.tf');

  beforeAll(() => {
    terraformContent = fs.readFileSync(terraformFilePath, 'utf8');
  });

  describe('End-to-End Configuration Validation', () => {
    test('should create complete S3 security stack', () => {
      const requiredS3Resources = [
        'aws_s3_bucket',
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_lifecycle_configuration',
        'aws_s3_bucket_logging',
        'aws_s3_bucket_policy'
      ];

      requiredS3Resources.forEach(resource => {
        expect(terraformContent).toMatch(new RegExp(`resource\\s+"${resource}"`));
      });
    });

    test('should create complete IAM security stack', () => {
      const requiredIAMResources = [
        'aws_iam_role.*s3_access_role',
        'aws_iam_policy.*s3_bucket_policy',
        'aws_iam_role_policy_attachment.*s3_policy_attachment',
        'aws_iam_role.*s3_readonly_role',
        'aws_iam_policy.*s3_readonly_policy',
        'aws_iam_role_policy_attachment.*s3_readonly_policy_attachment'
      ];

      requiredIAMResources.forEach(resourcePattern => {
        expect(terraformContent).toMatch(new RegExp(`resource\\s+"${resourcePattern.replace('.*', '"\\s+"')}"`));
      });
    });

    test('should provide comprehensive outputs for integration', () => {
      const outputCategories = [
        's3_bucket', // names, arns, domains
        'iam_role', // arns
        'iam_policy', // arns
        'bucket_encryption',
        'deployment_info'
      ];

      outputCategories.forEach(category => {
        expect(terraformContent).toMatch(new RegExp(`output\\s+"[^"]*${category}[^"]*"`));
      });
    });

    test('should handle multiple environments correctly', () => {
      // Verify environment-aware naming
      expect(terraformContent).toMatch(/environment.*var\.environment/);
      expect(terraformContent).toMatch(/project.*var\.project_name/);
      expect(terraformContent).toMatch(/region.*var\.aws_region/);
    });

    test('should support scalable bucket creation', () => {
      // Verify for_each usage for scalability
      expect(terraformContent).toMatch(/for_each\s*=\s*local\.bucket_configs/);
      expect(terraformContent).toMatch(/for\s+name\s+in\s+var\.bucket_names/);
    });
  });

  describe('Security Posture Validation', () => {
    test('should implement defense in depth', () => {
      const securityLayers = [
        'public_access_block', // Network level
        'bucket_policy', // Resource level
        'server_side_encryption', // Data level
        'iam_role', // Identity level
        'SecureTransport' // Transport level
      ];

      securityLayers.forEach(layer => {
        expect(terraformContent).toMatch(new RegExp(layer));
      });
    });

    test('should follow AWS security best practices', () => {
      const bestPractices = [
        /block_public_acls\s*=\s*true/,
        /status\s*=\s*"Enabled"/,
        /sse_algorithm\s*=\s*"AES256"/,
        /"aws:SecureTransport"\s*=\s*"false"/,
        /sts:ExternalId/
      ];

      bestPractices.forEach(practice => {
        expect(terraformContent).toMatch(practice);
      });
    });

    test('should enforce encryption everywhere', () => {
      expect(terraformContent).toMatch(/server_side_encryption/);
      expect(terraformContent).toMatch(/AES256/);
      expect(terraformContent).toMatch(/DenyUnencryptedObjectUploads/);
      expect(terraformContent).toMatch(/GetEncryptionConfiguration/);
    });
  });

  describe('Operational Excellence Validation', () => {
    test('should support monitoring and logging', () => {
      expect(terraformContent).toMatch(/bucket_logging/);
      expect(terraformContent).toMatch(/bucket_notification/);
      expect(terraformContent).toMatch(/access-logs/);
    });

    test('should support cost optimization', () => {
      expect(terraformContent).toMatch(/lifecycle_configuration/);
      expect(terraformContent).toMatch(/STANDARD_IA/);
      expect(terraformContent).toMatch(/GLACIER/);
      expect(terraformContent).toMatch(/noncurrent_version_expiration/);
    });

    test('should provide operational visibility', () => {
      const visibilityOutputs = [
        'deployment_info',
        'bucket_encryption_status',
        's3_bucket_names',
        'iam_role_arns'
      ];

      visibilityOutputs.forEach(output => {
        expect(terraformContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
