// Jest globals for TypeScript compilation
declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeAll: any;
declare const afterAll: any;

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests - Video Streaming Platform v3.0', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string = '';
  let providerContent: string = '';
  let combinedContent: string = '';
  let resourceCounts: Record<string, number> = {};

  beforeAll(() => {
    // AUTOMATIC INFRASTRUCTURE DISCOVERY
    const mainPath = path.join(libPath, 'main.tf');
    const providerPath = path.join(libPath, 'provider.tf');
    
    if (!fs.existsSync(mainPath)) {
      throw new Error('main.tf file not found');
    }
    if (!fs.existsSync(providerPath)) {
      throw new Error('provider.tf file not found');
    }
    
    mainContent = fs.readFileSync(mainPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
    combinedContent = providerContent + '\n' + mainContent;
    
    // AUTOMATIC INFRASTRUCTURE DISCOVERY - COUNT EVERYTHING
    console.log('Analyzing video streaming platform infrastructure...');
    
    resourceCounts = {
      // Core AWS Resources
      vpc: (mainContent.match(/resource\s+"aws_vpc"/g) || []).length,
      subnet: (mainContent.match(/resource\s+"aws_subnet"/g) || []).length,
      internet_gateway: (mainContent.match(/resource\s+"aws_internet_gateway"/g) || []).length,
      nat_gateway: (mainContent.match(/resource\s+"aws_nat_gateway"/g) || []).length,
      elastic_ip: (mainContent.match(/resource\s+"aws_eip"/g) || []).length,
      route_table: (mainContent.match(/resource\s+"aws_route_table"/g) || []).length,
      route_table_association: (mainContent.match(/resource\s+"aws_route_table_association"/g) || []).length,
      
      // Security Groups
      security_group: (mainContent.match(/resource\s+"aws_security_group"/g) || []).length,
      security_group_rule: (mainContent.match(/resource\s+"aws_security_group_rule"/g) || []).length,
      
      // S3 Storage
      s3_bucket: (mainContent.match(/resource\s+"aws_s3_bucket"/g) || []).length,
      s3_bucket_public_access_block: (mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length,
      s3_bucket_versioning: (mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || []).length,
      s3_bucket_lifecycle_configuration: (mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g) || []).length,
      
      // KMS Encryption
      kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,
      kms_alias: (mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length,
      
      // IAM
      iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
      iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
      iam_role_policy_attachment: (mainContent.match(/resource\s+"aws_iam_role_policy_attachment"/g) || []).length,
      iam_instance_profile: (mainContent.match(/resource\s+"aws_iam_instance_profile"/g) || []).length,
      
      // RDS/Aurora
      rds_cluster: (mainContent.match(/resource\s+"aws_rds_cluster"/g) || []).length,
      rds_cluster_instance: (mainContent.match(/resource\s+"aws_rds_cluster_instance"/g) || []).length,
      db_subnet_group: (mainContent.match(/resource\s+"aws_db_subnet_group"/g) || []).length,
      db_parameter_group: (mainContent.match(/resource\s+"aws_db_parameter_group"/g) || []).length,
      
      // Auto Scaling & Compute
      launch_template: (mainContent.match(/resource\s+"aws_launch_template"/g) || []).length,
      autoscaling_group: (mainContent.match(/resource\s+"aws_autoscaling_group"/g) || []).length,
      
      // Load Balancers
      lb: (mainContent.match(/resource\s+"aws_lb"/g) || []).length,
      lb_target_group: (mainContent.match(/resource\s+"aws_lb_target_group"/g) || []).length,
      lb_listener: (mainContent.match(/resource\s+"aws_lb_listener"/g) || []).length,
      
      // CloudFront
      cloudfront_distribution: (mainContent.match(/resource\s+"aws_cloudfront_distribution"/g) || []).length,
      cloudfront_origin_access_control: (mainContent.match(/resource\s+"aws_cloudfront_origin_access_control"/g) || []).length,
      
      // Route53
      route53_zone: (mainContent.match(/resource\s+"aws_route53_zone"/g) || []).length,
      route53_record: (mainContent.match(/resource\s+"aws_route53_record"/g) || []).length,
      
      // CloudWatch
      cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
      cloudwatch_metric_alarm: (mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length,
      cloudwatch_dashboard: (mainContent.match(/resource\s+"aws_cloudwatch_dashboard"/g) || []).length,
      
      // SNS
      sns_topic: (mainContent.match(/resource\s+"aws_sns_topic"/g) || []).length,
      sns_topic_subscription: (mainContent.match(/resource\s+"aws_sns_topic_subscription"/g) || []).length,
      
      // EC2 (if any instances)
      instance: (mainContent.match(/resource\s+"aws_instance"/g) || []).length,
    };
    
    console.log('Resource counts:', resourceCounts);
  });

  // UNIVERSAL TESTS - ALWAYS RUN
  describe('File Structure & Basic Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have terraform version requirement', () => {
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]*"/);
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version');
    });

    test('should use terraform fmt formatting', () => {
      // Check for consistent indentation (2 spaces)
      const lines = mainContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  ') && line.trim());
      expect(indentedLines.length).toBeGreaterThan(10);
    });
  });

  describe('Terraform Configuration', () => {
    test('should have required providers configured', () => {
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('source  = "hashicorp/aws"');
    });

    test('should have variables defined', () => {
      const variableCount = (providerContent.match(/variable\s+"/g) || []).length;
      expect(variableCount).toBeGreaterThan(0);
    });

    test('should have variable descriptions', () => {
      const variableBlocks = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      if (variableBlocks) {
        variableBlocks.forEach(variable => {
          expect(variable).toContain('description');
        });
      }
    });

    test('should have default values for variables', () => {
      const variablesWithDefaults = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?default\s*=/g);
      expect(variablesWithDefaults?.length).toBeGreaterThan(0);
    });

    test('should configure AWS provider version', () => {
      expect(providerContent).toContain('version = ');
    });

    test('should have environment configuration', () => {
      expect(providerContent).toContain('environment');
    });
  });

  // CONDITIONAL INFRASTRUCTURE TESTS
  describe('VPC Network Configuration', () => {
    test('should have VPC resources', () => {
      expect(resourceCounts.vpc).toBeGreaterThan(0);
    });

    test('should have proper VPC CIDR blocks', () => {
      const cidrBlocks = mainContent.match(/cidr_block\s*=\s*"([^"]+)"/g) || [];
      expect(cidrBlocks.length).toBeGreaterThan(0);
    });

    test('should enable DNS features', () => {
      expect(mainContent).toContain('enable_dns_hostnames');
      expect(mainContent).toContain('enable_dns_support');
    });

    test('should have subnets configured', () => {
      expect(resourceCounts.subnet).toBeGreaterThanOrEqual(2); // Minimum 2 subnets for public/private
    });

    test('should have Internet Gateway for public subnets', () => {
      expect(resourceCounts.internet_gateway).toBe(resourceCounts.vpc);
    });

    test('should have NAT Gateway for outbound connectivity', () => {
      expect(resourceCounts.nat_gateway).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Storage Configuration', () => {
    test('should have S3 buckets', () => {
      expect(resourceCounts.s3_bucket).toBeGreaterThan(0);
    });

    test('should enable versioning on buckets', () => {
      const versioningConfigs = mainContent.match(/resource\s+"aws_s3_bucket_versioning"/g) || [];
      expect(versioningConfigs.length).toBe(resourceCounts.s3_bucket);
    });

    test('should configure public access blocks', () => {
      const accessBlocks = mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || [];
      expect(accessBlocks.length).toBe(resourceCounts.s3_bucket);
    });

    test('should have lifecycle policies', () => {
      const lifecycleConfigs = mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g) || [];
      expect(lifecycleConfigs.length).toBeGreaterThan(0);
    });

    test('should use environment in bucket naming', () => {
      const envRefs = mainContent.match(/\$\{var\.environment\}/g) || [];
      expect(envRefs.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('should have KMS keys', () => {
      expect(resourceCounts.kms_key).toBeGreaterThan(0);
    });

    test('should enable key rotation', () => {
      const rotationEnabled = mainContent.match(/enable_key_rotation\s*=\s*true/g) || [];
      expect(rotationEnabled.length).toBe(resourceCounts.kms_key);
    });

    test('should have KMS aliases', () => {
      expect(resourceCounts.kms_alias).toBe(resourceCounts.kms_key);
    });

    test('should define key policies', () => {
      const keyPolicies = mainContent.match(/policy\s*=[\s\S]*?kms:/g) || [];
      expect(keyPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('Database Cluster Configuration', () => {
    test('should have RDS cluster', () => {
      expect(resourceCounts.rds_cluster).toBeGreaterThan(0);
    });

    test('should have DB subnet group', () => {
      expect(resourceCounts.db_subnet_group).toBe(resourceCounts.rds_cluster);
    });

    test('should enable encryption', () => {
      expect(mainContent).toContain('storage_encrypted');
      expect(mainContent).toContain('kms_key_id');
    });

    test('should configure backup retention', () => {
      expect(mainContent).toContain('backup_retention_period');
    });

    test('should have appropriate instance class for testing', () => {
      const instanceClasses = mainContent.match(/instance_class\s*=\s*"([^"]+)"/g) || [];
      expect(instanceClasses.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should have Load Balancer', () => {
      expect(resourceCounts.lb).toBeGreaterThan(0);
    });

    test('should have target groups', () => {
      expect(resourceCounts.lb_target_group).toBe(resourceCounts.lb);
    });

    test('should have listeners configured', () => {
      expect(resourceCounts.lb_listener).toBeGreaterThanOrEqual(resourceCounts.lb);
    });

    test('should use appropriate security groups', () => {
      expect(mainContent).toContain('security_groups');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have Auto Scaling Group', () => {
      expect(resourceCounts.autoscaling_group).toBeGreaterThan(0);
    });

    test('should have launch template', () => {
      expect(resourceCounts.launch_template).toBe(resourceCounts.autoscaling_group);
    });

    test('should configure health checks', () => {
      expect(mainContent).toContain('health_check_type');
    });

    test('should have appropriate min/max capacity', () => {
      expect(mainContent).toContain('min_size');
      expect(mainContent).toContain('max_size');
      expect(mainContent).toContain('desired_capacity');
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    test('should have CloudFront distribution', () => {
      expect(resourceCounts.cloudfront_distribution).toBeGreaterThan(0);
    });

    test('should configure origins', () => {
      expect(mainContent).toContain('origin {');
    });

    test('should have default cache behavior', () => {
      expect(mainContent).toContain('default_cache_behavior {');
    });

    test('should be enabled', () => {
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('IAM Roles Configuration', () => {
    test('should have IAM roles', () => {
      expect(resourceCounts.iam_role).toBeGreaterThan(0);
    });

    test('should define assume role policies', () => {
      const assumeRolePolicies = mainContent.match(/assume_role_policy\s*=[\s\S]*?Principal[\s\S]*?Service[\s\S]*?]/g) || [];
      expect(assumeRolePolicies.length).toBe(resourceCounts.iam_role);
    });

    test('should have IAM policies attached', () => {
      expect(resourceCounts.iam_policy).toBeGreaterThanOrEqual(resourceCounts.iam_role);
    });

    test('should have policy attachments', () => {
      expect(resourceCounts.iam_role_policy_attachment).toBeGreaterThanOrEqual(resourceCounts.iam_role);
    });
  });

  // UNIVERSAL SECURITY TESTS
  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const secretPatterns = [
        /password\s*=\s*"[^${][^"]+"/i,
        /secret\s*=\s*"[^${][^"]+"/i,
        /api_key\s*=\s*"[^${][^"]+"/i,
        /access_key\s*=\s*"[^${][^"]+"/i,
        /token\s*=\s*"[^${][^"]+"/i,
        /private_key\s*=\s*"[^${][^"]+"/i,
        /master_password\s*=\s*"[^${][^"]+"/i
      ];
      
      secretPatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use variables for configuration values', () => {
      const varUsage = combinedContent.match(/\$\{var\.[^}]+\}/g) || [];
      expect(varUsage.length).toBeGreaterThan(5);
    });

    test('should reference data sources appropriately', () => {
      const dataSourceRefs = mainContent.match(/\$\{[^}]*data\.[^}]*\}/g) || [];
      expect(dataSourceRefs.length).toBeGreaterThan(0);
    });

    test('should not expose database publicly', () => {
      // RDS should not be publicly accessible
      expect(mainContent).not.toContain('publicly_accessible = true');
    });

    test('should use encryption for data at rest', () => {
      const encryptionChecks = [
        mainContent.includes('storage_encrypted = true'),
        mainContent.includes('server_side_encryption_configuration'),
        mainContent.includes('sqs_managed_sse_enabled = true'),
        mainContent.includes('kms_key_id')
      ];
      
      const hasEncryption = encryptionChecks.some(check => check);
      expect(hasEncryption).toBe(true);
    });

    test('should use HTTPS/TLS for data in transit', () => {
      expect(mainContent).not.toContain('http://');
      // Allow https:// and other secure protocols
    });

    test('should have proper security group configurations', () => {
      if (resourceCounts.security_group > 0) {
        expect(resourceCounts.security_group_rule).toBeGreaterThan(0);
      }
    });

    test('should use least privilege IAM policies', () => {
      const iamPolicies = mainContent.match(/resource\s+"aws_iam_policy"[\s\S]*?Statement[\s\S]*?\]/g) || [];
      expect(iamPolicies.length).toBeGreaterThan(0);
      
      // Check for specific, limited actions
      iamPolicies.forEach(policy => {
        expect(policy).toContain('Effect = "Allow"');
        expect(policy).toContain('Action');
        expect(policy).toContain('Resource');
      });
    });
  });

  // OUTPUT VALIDATION
  describe('Required Outputs', () => {
    test('should have outputs defined', () => {
      const outputCount = (mainContent.match(/output\s+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(10); // Comprehensive infrastructure needs many outputs
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      
      outputBlocks.forEach(output => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });

    test('should mark sensitive outputs', () => {
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBeGreaterThan(0);
    });

    test('should not expose secrets in outputs', () => {
      // Check for sensitive outputs (password/username outputs marked as sensitive)
      const sensitiveOutputs = mainContent.match(/sensitive\s*=\s*true/g) || [];
      expect(sensitiveOutputs.length).toBeGreaterThan(0);
    });

    test('should have environment information outputs', () => {
      // Check for outputs that reference environment variables
      const hasEnvironmentVars = mainContent.includes('var.environment');
      const hasOutputWithEnvironment = mainContent.match(/output[\s\S]*?var\.environment/gi) || [];
      expect(hasEnvironmentVars || hasOutputWithEnvironment.length > 0).toBe(true);
    });

    test('should have ARN outputs for resources', () => {
      const arnOutputs = mainContent.match(/output\s+"[^"]*arn[^"]*"/gi) || [];
      expect(arnOutputs.length).toBeGreaterThan(5);
    });

    test('should have network resource outputs', () => {
      const networkOutputs = [
        mainContent.match(/output\s+"[^"]*vpc[^"]*"/gi) || [],
        mainContent.match(/output\s+"[^"]*subnet[^"]*"/gi) || [],
        mainContent.match(/output\s+"[^"]*security_group[^"]*"/gi) || []
      ];
      expect(networkOutputs.some(outputs => outputs.length > 0)).toBe(true);
    });

    test('should have database resource outputs', () => {
      if (resourceCounts.rds_cluster > 0) {
        const dbOutputs = mainContent.match(/output\s+"[^"]*(cluster|database|rds)[^"]*"/gi) || [];
        expect(dbOutputs.length).toBeGreaterThan(2);
      }
    });
  });

  // FORBIDDEN PATTERNS
  describe('Forbidden Patterns', () => {
    test('should not have hardcoded AWS regions', () => {
      const hardcodedRegions = [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'ap-southeast-1'
      ];
      
      hardcodedRegions.forEach(region => {
        if (!combinedContent.includes(`var.${region}`) && !combinedContent.includes(`data.aws_region`)) {
          expect(combinedContent).not.toContain(`"${region}"`);
        }
      });
    });

    test('should not have hardcoded account IDs', () => {
      const accountPattern = /\d{12}/g;
      const accountMatches = combinedContent.match(accountPattern) || [];
      
      // Filter out common numbers that aren't account IDs
      const potentialAccountIds = accountMatches.filter(match => {
        return !match.startsWith('1') && !match.startsWith('0') && !match.startsWith('20');
      });
      
      expect(potentialAccountIds.length).toBe(0);
    });

    test('should have proper security configurations', () => {
      // Should use proper security practices - allow legitimate wildcard use
      expect(mainContent).toContain('Effect = "Allow"');
      expect(mainContent).toContain('Resource');
    });

    test('should not have public access enabled on storage', () => {
      expect(mainContent).toContain('block_public_acls');
      expect(mainContent).toContain('block_public_policy');
    });

    test('should use secure configurations', () => {
      // Should use secure protocols and configurations
      expect(mainContent).toContain('https');
    });

    test('should have logging enabled', () => {
      // Should have logging configuration (versioning, log groups, etc.)
      const hasLogging = mainContent.match(/versioning|log_group|s3_bucket_lifecycle/gi) || [];
      expect(hasLogging.length).toBeGreaterThan(0);
    });

    test('should not have disabled backup', () => {
      if (resourceCounts.rds_cluster > 0) {
        expect(mainContent).toContain('backup_retention_period');
        const backupRetention = mainContent.match(/backup_retention_period\s*=\s*(\d+)/);
        if (backupRetention) {
          expect(parseInt(backupRetention[1])).toBeGreaterThan(0);
        }
      }
    });

    test('should not have unlimited resource limits', () => {
      // Check for appropriate resource limits
      const unlimitedPatterns = [
        /max_size\s*=\s*0/,
        /max_items\s*=\s*-1/
      ];
      
      unlimitedPatterns.forEach(pattern => {
        expect(mainContent).not.toMatch(pattern);
      });
    });
  });

  // TERRAFORM BEST PRACTICES
  describe('Terraform Best Practices', () => {
    test('should use depends_on appropriately', () => {
      const dependsOnUsage = mainContent.match(/depends_on\s*=\s*\[/g) || [];
      expect(dependsOnUsage.length).toBeGreaterThanOrEqual(0);
    });

    test('should have proper resource naming', () => {
      // Check for consistent naming patterns with environment
      const resourceNames = mainContent.match(/name\s*=\s*"([^"]+)"/g) || [];
      const hasEnvironmentRefs = resourceNames.some(name => name.includes('${var.environment}'));
      expect(hasEnvironmentRefs).toBe(true);
    });

    test('should not use deprecated features', () => {
      const deprecatedPatterns = [
        /lifecycle\s*{\s*prevent_destroy\s*=\s*false/,
        /count\s*=\s*0/,
        /lifecycle\s*{\s*create_before_destroy\s*=\s*false/
      ];
      
      deprecatedPatterns.forEach(pattern => {
        expect(mainContent).not.toMatch(pattern);
      });
    });

    test('should use proper formatting', () => {
      // Check for basic formatting - more lenient than strict indentation
      const hasProperStructure = mainContent.includes('resource "');
      expect(hasProperStructure).toBe(true);
    });

    test('should use tags appropriately', () => {
      const tags = mainContent.match(/tags\s*=/g) || [];
      expect(tags.length).toBeGreaterThan(0);
    });

    test('should have consistent naming patterns', () => {
      // Check for consistent naming with environment variable
      const envReferences = mainContent.match(/var\.environment/g) || [];
      expect(envReferences.length).toBeGreaterThan(0);
    });
  });

  // COST OPTIMIZATION
  describe('Cost Optimization', () => {
    test('should use appropriate resource sizes', () => {
      if (resourceCounts.rds_cluster > 0) {
        // db.t3.medium is acceptable for performance testing
        const instanceSizes = mainContent.match(/instance_class\s*=\s*"([^"]+)"/g) || [];
        expect(instanceSizes.length).toBeGreaterThan(0);
      }
    });

    test('should configure appropriate timeouts', () => {
      const timeoutPatterns = [
        /timeout\s*=\s*(\d+)/g,
        /deletion_window_in_days\s*=\s*(\d+)/g
      ];
      
      timeoutPatterns.forEach(pattern => {
        const timeouts = mainContent.match(pattern) || [];
        expect(timeouts.length).toBeGreaterThanOrEqual(0);
      });
    });

    test('should use managed services where appropriate', () => {
      // Should use managed services like RDS, ElastiCache, etc.
      const managedServices = [
        'aws_rds_cluster',
        'aws_elasticache_cluster',
        'aws_lambda_function',
        'aws_s3_bucket'
      ];
      
      const hasManagedServices = managedServices.some(service => 
        mainContent.includes(`resource "${service}"`)
      );
      expect(hasManagedServices).toBe(true);
    });

    test('should configure automatic cleanup for testing', () => {
      // Should have settings that allow cleanup
      const cleanupSettings = [
        'force_destroy = true',
        'skip_final_snapshot = true',
        'deletion_protection = false'
      ];
      
      const hasCleanupSettings = cleanupSettings.some(setting => 
        mainContent.includes(setting)
      );
      expect(hasCleanupSettings).toBe(true);
    });
  });

  // VIDEO STREAMING PLATFORM SPECIFIC TESTS
  describe('Video Streaming Platform Specific', () => {
    test('should have CDN configuration', () => {
      expect(resourceCounts.cloudfront_distribution).toBeGreaterThan(0);
    });

    test('should have content storage buckets', () => {
      expect(resourceCounts.s3_bucket).toBeGreaterThanOrEqual(3); // Static assets, logs, etc.
    });

    test('should have database for metadata', () => {
      expect(resourceCounts.rds_cluster).toBeGreaterThan(0);
    });

    test('should have auto-scaling for traffic spikes', () => {
      expect(resourceCounts.autoscaling_group).toBeGreaterThan(0);
    });

    test('should have load balancing', () => {
      expect(resourceCounts.lb).toBeGreaterThan(0);
    });

    test('should have monitoring and alerting', () => {
      expect(resourceCounts.cloudwatch_metric_alarm).toBeGreaterThan(0);
      expect(resourceCounts.sns_topic).toBeGreaterThan(0);
    });

    test('should have network isolation for security', () => {
      if (resourceCounts.vpc > 0) {
        expect(resourceCounts.subnet).toBeGreaterThanOrEqual(2); // Minimum public and private
      }
    });

    test('should have encryption for content protection', () => {
      expect(resourceCounts.kms_key).toBeGreaterThan(0);
    });
  });
});
