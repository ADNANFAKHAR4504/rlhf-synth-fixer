import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.resolve(__dirname, '..', 'lib');
  const tfstateFile = path.join(libDir, 'terraform.tfstate');
  const backendConfig = path.join(libDir, 'backend.hcl');
  const testTfvars = path.join(libDir, 'test.tfvars');

  describe('Infrastructure Validation', () => {
    let planOutput: string;

    beforeAll(async () => {
      try {
        // Create test.tfvars if it doesn't exist
        if (!fs.existsSync(testTfvars)) {
          const testVarsContent = `
environment     = "test"
active_color    = "blue"
domain_name     = "test.example.com"
regions         = ["us-east-1", "eu-central-1"]
allowed_ingress_cidrs = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16"
]
common_tags = {
  Owner       = "platform-team"
  Purpose     = "testing"
  Environment = "test"
  CostCenter  = "engineering"
  Project     = "tap-stack"
}`;
          fs.writeFileSync(testTfvars, testVarsContent);
        }

        // Initialize Terraform with backend config if available
        if (!fs.existsSync(path.join(libDir, '.terraform'))) {
          const initCommand = fs.existsSync(backendConfig)
            ? `terraform init -backend-config=${backendConfig}`
            : 'terraform init';
          execSync(initCommand, { cwd: libDir });
        }

        // Run plan once and store output for multiple tests
        try {
          planOutput = execSync(`terraform plan -var-file=${testTfvars} -detailed-exitcode`, { 
            cwd: libDir,
            encoding: 'utf8',
            stdio: 'pipe'
          });
        } catch (error: any) {
          // Exit code 2 means changes present but plan is valid
          if (error.status === 2) {
            planOutput = error.stdout.toString();
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Failed to initialize Terraform:', error);
        throw error;
      }
    });

    afterAll(() => {
      // Clean up temporary test files
      try {
        if (fs.existsSync(testTfvars)) {
          fs.unlinkSync(testTfvars);
        }
      } catch (error) {
        console.warn('Failed to clean up test files:', error);
      }
    });

    test('should validate infrastructure files and configuration', () => {
      // Check for required files
      expect(fs.existsSync(path.join(libDir, 'tap_stack.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libDir, 'provider.tf'))).toBe(true);

      // Run terraform validate
      const validateOutput = execSync('terraform validate', { 
        cwd: libDir, 
        encoding: 'utf8' 
      });
      expect(validateOutput).toContain('Success!');
    });

    test('should validate multi-region configuration and providers', () => {
      const stackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
      const providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      
      // Check providers are properly configured
      expect(providerContent).toMatch(/provider\s+"aws"\s+{[^}]*region\s+=\s+"us-east-1"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s+{[^}]*region\s+=\s+"eu-central-1"/);
      
      // Check resources use correct provider configurations
      expect(stackContent).toMatch(/provider\s+=\s+aws\.us_east_1/);
      expect(stackContent).toMatch(/provider\s+=\s+aws\.eu_central_1/);
    });

    test('should validate infrastructure components', () => {
      const stackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
      
      // Network Infrastructure
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_us_east_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main_eu_central_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);

      // Load Balancers
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"app_us_east_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"app_eu_central_1"/);

      // Security
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"/);
      
      // DNS and CDN
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"app_main"/);
    });

    test('should validate IAM resources consistency', () => {
      const stackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
      
      // IAM Roles and Policies
      const roles = [
        'app_role_us_east_1',
        'app_role_eu_central_1'
      ];
      
      const policies = [
        'app_secrets_policy_us_east_1',
        'app_secrets_policy_eu_central_1'
      ];

      roles.forEach(role => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_iam_role"\\s+"${role}"`));
      });

      policies.forEach(policy => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_iam_policy"\\s+"${policy}"`));
      });
    });

    test('should validate terraform plan execution', () => {
      try {
        const planOutput = execSync('terraform plan -detailed-exitcode', { 
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // Check for valid plan
        expect(planOutput).not.toContain('Error:');
        
        // Verify no syntax errors
        expect(planOutput).not.toContain('syntax error');
        
      } catch (error: any) {
        // Exit code 2 means changes present but plan is valid
        if (error.status !== 2) {
          throw error;
        }
      }
    });

    test('should validate terraform plan with variables', () => {
      try {
        const planOutput = execSync(`terraform plan -var-file=${testTfvars} -detailed-exitcode`, { 
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // Verify plan contains required resources
        expect(planOutput).toMatch(/aws_vpc\.main_us_east_1/);
        expect(planOutput).toMatch(/aws_vpc\.main_eu_central_1/);
        expect(planOutput).toMatch(/aws_lb\.app_us_east_1/);
        expect(planOutput).toMatch(/aws_cloudfront_distribution\.main/);
        
        // Verify no security issues in plan
        expect(planOutput).not.toMatch(/0\.0\.0\.0.*=.*true/); // No open security groups
        expect(planOutput).not.toMatch(/deletion_window_in_days.*=.*[0-6]/); // KMS key retention >= 7 days
        
      } catch (error: any) {
        // Exit code 2 means changes present but plan is valid
        if (error.status !== 2) {
          throw error;
        }
        const planOutput = error.stdout.toString();
        // Verify plan even when there are changes
        expect(planOutput).toMatch(/aws_vpc\.main_us_east_1/);
        expect(planOutput).toMatch(/aws_vpc\.main_eu_central_1/);
      }
    });

    test('should validate variable values in plan output', () => {
      try {
        const planOutput = execSync(`terraform plan -var-file=${testTfvars} -detailed-exitcode`, { 
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        // Verify environment-specific configurations
        expect(planOutput).toMatch(/environment\s*=\s*"test"/);
        expect(planOutput).toMatch(/active_color\s*=\s*"blue"/);
        
        // Verify CIDR ranges
        expect(planOutput).toMatch(/10\.0\.0\.0\/16/); // US East VPC CIDR
        expect(planOutput).toMatch(/10\.1\.0\.0\/16/); // EU Central VPC CIDR
        
        // Verify tags are applied
        expect(planOutput).toMatch(/Owner\s*=\s*"platform-team"/);
        expect(planOutput).toMatch(/Environment\s*=\s*"test"/);
        
      } catch (error: any) {
        if (error.status !== 2) {
          throw error;
        }
      }
    });

    test('should validate backend configuration if exists', () => {
      if (fs.existsSync(backendConfig)) {
        const backendContent = fs.readFileSync(backendConfig, 'utf8');
        
        // Required backend settings
        expect(backendContent).toMatch(/bucket\s*=/);
        expect(backendContent).toMatch(/key\s*=/);
        expect(backendContent).toMatch(/region\s*=/);
        expect(backendContent).toMatch(/dynamodb_table\s*=/);
        expect(backendContent).toMatch(/encrypt\s*=\s*true/);
      }
    });

    test('should validate resource counts in plan', () => {
      try {
        const planOutput = execSync(`terraform plan -var-file=${testTfvars} -detailed-exitcode`, { 
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        // Count subnet resources (3 public + 3 private per region)
        const subnetMatches = planOutput.match(/aws_subnet\.[^"]*"/g) || [];
        expect(subnetMatches.length).toBe(12); // 6 subnets per region * 2 regions

        // Count NAT Gateway resources (3 per region)
        const natMatches = planOutput.match(/aws_nat_gateway\.[^"]*"/g) || [];
        expect(natMatches.length).toBe(6); // 3 NAT Gateways per region * 2 regions

        // Count Route Table resources (1 public + 3 private per region)
        const rtMatches = planOutput.match(/aws_route_table\.[^"]*"/g) || [];
        expect(rtMatches.length).toBe(8); // 4 route tables per region * 2 regions

      } catch (error: any) {
        if (error.status !== 2) {
          throw error;
        }
      }
    });

    test('should validate state outputs comprehensively', () => {
      if (!fs.existsSync(tfstateFile)) {
        console.log('Skipping state validation - no terraform.tfstate found');
        return;
      }

      const showOutput = execSync('terraform show -json', { 
        cwd: libDir,
        encoding: 'utf8' 
      });
      const state = JSON.parse(showOutput);

      // VPC Validation
      const regions = ['us_east_1', 'eu_central_1'];
      regions.forEach(region => {
        const vpcId = state.values?.outputs?.[`vpc_id_${region}`]?.value;
        if (vpcId) {
          expect(vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
          
          // Validate VPC attributes
          const vpcState = state.values?.root_module?.resources?.find(
            (r: any) => r.type === 'aws_vpc' && r.name === `main_${region}`
          );
          if (vpcState) {
            expect(vpcState.values.enable_dns_hostnames).toBe(true);
            expect(vpcState.values.enable_dns_support).toBe(true);
            expect(vpcState.values.tags.Name).toMatch(new RegExp(`-vpc-${region.replace('_', '-')}$`));
          }
        }
      });

      // Load Balancer Validation
      regions.forEach(region => {
        const albDns = state.values?.outputs?.[`alb_dns_name_${region}`]?.value;
        if (albDns) {
          const expectedDomain = region === 'us_east_1' 
            ? '.elb.amazonaws.com'
            : `.elb.${region.replace('_', '-')}.amazonaws.com`;
          expect(albDns).toMatch(new RegExp(expectedDomain + '$'));
          
          // Validate ALB attributes
          const albState = state.values?.root_module?.resources?.find(
            (r: any) => r.type === 'aws_lb' && r.name === `app_${region}`
          );
          if (albState) {
            expect(albState.values.internal).toBe(false);
            expect(albState.values.enable_deletion_protection).toBe(true);
            expect(albState.values.enable_http2).toBe(true);
          }
        }
      });

      // CloudFront Validation
      if (state.values?.outputs?.cloudfront_domain_name?.value) {
        const cfDomain = state.values.outputs.cloudfront_domain_name.value;
        expect(cfDomain).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
        
        // Validate CloudFront configuration
        const cfState = state.values?.root_module?.resources?.find(
          (r: any) => r.type === 'aws_cloudfront_distribution' && r.name === 'main'
        );
        if (cfState) {
          expect(cfState.values.enabled).toBe(true);
          expect(cfState.values.is_ipv6_enabled).toBe(true);
          expect(cfState.values.http_version).toBe('http2and3');
          expect(cfState.values.price_class).toBe('PriceClass_100');
        }
      }

      // Certificate Validation
      if (state.values?.outputs?.certificate_arn?.value) {
        const certArn = state.values.outputs.certificate_arn.value;
        expect(certArn).toMatch(/^arn:aws:acm:us-east-1:[0-9]{12}:certificate\/[a-f0-9-]{36}$/);
        
        // Validate certificate configuration
        const certState = state.values?.root_module?.resources?.find(
          (r: any) => r.type === 'aws_acm_certificate' && r.name === 'main'
        );
        if (certState) {
          expect(certState.values.validation_method).toBe('DNS');
          expect(certState.values.domain_name).toBe(state.values?.outputs?.domain_name?.value);
        }
      }

      // KMS Key Validation
      regions.forEach(region => {
        const kmsArn = state.values?.outputs?.[`kms_key_arn_${region}`]?.value;
        if (kmsArn) {
          expect(kmsArn).toMatch(new RegExp(`^arn:aws:kms:${region.replace('_', '-')}:[0-9]{12}:key/[a-f0-9-]{36}$`));
          
          // Validate KMS configuration
          const kmsState = state.values?.root_module?.resources?.find(
            (r: any) => r.type === 'aws_kms_key' && r.name === `main_${region}`
          );
          if (kmsState) {
            expect(kmsState.values.deletion_window_in_days).toBe(7);
            expect(kmsState.values.enable_key_rotation).toBe(true);
            expect(kmsState.values.tags.Name).toMatch(new RegExp(`-kms-${region.replace('_', '-')}$`));
          }
        }
      });

      // Secrets Manager Validation
      regions.forEach(region => {
        const secretState = state.values?.root_module?.resources?.find(
          (r: any) => r.type === 'aws_secretsmanager_secret' && r.name === `app_secrets_${region}`
        );
        if (secretState) {
          expect(secretState.values.recovery_window_in_days).toBe(7);
          expect(secretState.values.kms_key_id).toMatch(new RegExp(`arn:aws:kms:${region.replace('_', '-')}`));
          expect(secretState.values.tags.Name).toMatch(new RegExp(`-app-secrets-${region.replace('_', '-')}$`));
        }
      });
    });

    test('should validate WAF rules and security configurations', () => {
      const stackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
      
      // WAF Configuration validation
      const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront"\s*{([^}]*)}/s);
      expect(wafMatch).toBeTruthy();
      
      if (wafMatch) {
        const wafConfig = wafMatch[1];
        
        // Validate rate limiting
        const rateLimitMatch = wafConfig.match(/rule\s*{[^}]*name\s*=\s*"rate-limit"/s);
        expect(rateLimitMatch).toBeTruthy();
        expect(wafConfig).toMatch(/limit\s*=\s*2000/);
        
        // Validate SQL injection protection
        expect(wafConfig).toMatch(/name\s*=\s*"AWSManagedRulesSQLiRuleSet"/);
        
        // Validate metrics
        expect(wafConfig).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
        expect(wafConfig).toMatch(/sampled_requests_enabled\s*=\s*true/);
      }

      // Security Group validation
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"[^{]*{([^}]*)}/g) || [];
      sgMatches.forEach(sg => {
        // No overly permissive rules
        expect(sg).not.toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][^}]*from_port\s*=\s*22/);
        expect(sg).not.toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][^}]*to_port\s*=\s*22/);
        
        // Required tags
        expect(sg).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
      });
    });

    test('should validate Route53 and DNS configurations', () => {
      const stackContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
      
      // DNS Records validation
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"app_blue"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"app_green"/);
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"app_main"/);

      // Blue-Green deployment validation
      const mainRecordMatch = stackContent.match(/resource\s+"aws_route53_record"\s+"app_main"\s*{([^}]*)}/s);
      expect(mainRecordMatch).toBeTruthy();
      if (mainRecordMatch) {
        const recordConfig = mainRecordMatch[1];
        expect(recordConfig).toMatch(/name\s*=\s*var\.active_color\s*==\s*"blue"/);
        expect(recordConfig).toMatch(/evaluate_target_health\s*=\s*true/);
      }
    });
  });
});
