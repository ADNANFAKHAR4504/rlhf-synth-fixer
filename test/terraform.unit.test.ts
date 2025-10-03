// Unit tests for Terraform Media Streaming Platform
// These tests validate the Terraform configuration structure without deploying

import fs from 'fs';
import path from 'path';

const libPath = path.resolve(__dirname, '../lib');

describe('Terraform Media Streaming Platform Configuration', () => {
  
  describe('Core Configuration Files', () => {
    test('provider.tf exists and configures AWS provider', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
      
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
      expect(content).toContain('hashicorp/aws');
    });

    test('variables.tf exists and declares all required variables', () => {
      const varPath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(varPath)).toBe(true);
      
      const content = fs.readFileSync(varPath, 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"vpc_cidr_block"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/variable\s+"domain_name"/);
      expect(content).toMatch(/variable\s+"s3_bucket_name"/);
      expect(content).toContain('10.11.0.0/16');
      expect(content).toContain('m5.large');
    });

    test('main.tf exists and declares all modules', () => {
      const mainPath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(mainPath)).toBe(true);
      
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toMatch(/module\s+"networking"/);
      expect(content).toMatch(/module\s+"compute"/);
      expect(content).toMatch(/module\s+"content_delivery"/);
      expect(content).toMatch(/module\s+"storage"/);
      expect(content).toMatch(/module\s+"media_processing"/);
      expect(content).toMatch(/module\s+"security"/);
      expect(content).toMatch(/module\s+"monitoring"/);
    });

    test('main.tf does NOT declare provider (provider.tf owns it)', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).not.toMatch(/^provider\s+"aws"\s*{/m);
    });

    test('terraform.tfvars exists with correct VPC CIDR', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);
      
      const content = fs.readFileSync(tfvarsPath, 'utf8');
      expect(content).toContain('10.11.0.0/16');
      expect(content).toContain('us-east-1');
      expect(content).toContain('m5.large');
    });

    test('outputs.tf exists', () => {
      const outputPath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('Networking Module', () => {
    test('networking module exists', () => {
      const modulePath = path.join(libPath, 'modules/networking/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('networking module creates VPC with correct CIDR', () => {
      const modulePath = path.join(libPath, 'modules/networking/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr_block/);
      expect(content).toContain('enable_dns_support');
      expect(content).toContain('enable_dns_hostnames');
    });

    test('networking module creates public and private subnets', () => {
      const modulePath = path.join(libPath, 'modules/networking/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('networking module creates NAT gateways and internet gateway', () => {
      const modulePath = path.join(libPath, 'modules/networking/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(content).toMatch(/resource\s+"aws_eip"/);
    });
  });

  describe('Compute Module', () => {
    test('compute module exists', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('compute module creates ALB with security groups', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toContain('application');
      expect(content).toContain('from_port   = 80');
      expect(content).toContain('from_port   = 443');
    });

    test('compute module creates Auto Scaling Group', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_launch_template"/);
      expect(content).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(content).toMatch(/max_size\s*=\s*var\.max_size/);
    });

    test('compute module uses m5.large instance type', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    test('compute module creates scaling policies with custom metrics', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"custom_metric"/);
      expect(content).toContain('ConcurrentViewers');
      expect(content).toContain('TargetTrackingScaling');
    });

    test('compute module creates IAM role for EC2 with SSM', () => {
      const modulePath = path.join(libPath, 'modules/compute/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"instance"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm"/);
      expect(content).toContain('AmazonSSMManagedInstanceCore');
    });
  });

  describe('Content Delivery Module', () => {
    test('content_delivery module exists', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('content_delivery module creates CloudFront distribution', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
      expect(content).toContain('origin');
      expect(content).toContain('ALB');
      expect(content).toContain('S3');
    });

    test('content_delivery module implements geo-restrictions', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toContain('geo_restriction');
      expect(content).toMatch(/restriction_type\s*=\s*var\.geo_restrictions\.restriction_type/);
    });

    test('content_delivery module implements TTL caching policies', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/min_ttl\s*=\s*var\.ttl_settings\.min_ttl/);
      expect(content).toMatch(/default_ttl\s*=\s*var\.ttl_settings\.default_ttl/);
      expect(content).toMatch(/max_ttl\s*=\s*var\.ttl_settings\.max_ttl/);
    });

    test('content_delivery module creates Lambda@Edge function', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"edge_request"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_edge"/);
      expect(content).toContain('edgelambda.amazonaws.com');
    });

    test('content_delivery module has Route53 configuration (commented out)', () => {
      const modulePath = path.join(libPath, 'modules/content_delivery/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      // Route53 resources are commented out due to missing domain
      expect(content).toContain('Route53 configuration removed');
      expect(content).toContain('# resource "aws_route53_record"');
    });
  });

  describe('Storage Module', () => {
    test('storage module exists', () => {
      const modulePath = path.join(libPath, 'modules/storage/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('storage module creates S3 bucket with Intelligent-Tiering', () => {
      const modulePath = path.join(libPath, 'modules/storage/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"video_storage"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"/);
      expect(content).toContain('INTELLIGENT_TIERING');
    });

    test('storage module enables Transfer Acceleration', () => {
      const modulePath = path.join(libPath, 'modules/storage/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_s3_bucket_accelerate_configuration"/);
      expect(content).toContain('status = "Enabled"');
    });

    test('storage module enables versioning and encryption', () => {
      const modulePath = path.join(libPath, 'modules/storage/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toContain('AES256');
    });
  });

  describe('Media Processing Module', () => {
    test('media_processing module exists', () => {
      const modulePath = path.join(libPath, 'modules/media_processing/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('media_processing module creates MediaConvert queue', () => {
      const modulePath = path.join(libPath, 'modules/media_processing/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_media_convert_queue"/);
    });

    test('media_processing module creates IAM role for MediaConvert', () => {
      const modulePath = path.join(libPath, 'modules/media_processing/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"media_convert"/);
      expect(content).toContain('mediaconvert.amazonaws.com');
    });
  });

  describe('Security Module', () => {
    test('security module exists', () => {
      const modulePath = path.join(libPath, 'modules/security/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    test('security module creates WAF with rate limiting', () => {
      const modulePath = path.join(libPath, 'modules/security/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"/);
      expect(content).toContain('rate_based_statement');
      expect(content).toContain('CLOUDFRONT');
    });

    test('security module implements AWS managed rule sets', () => {
      const modulePath = path.join(libPath, 'modules/security/main.tf');
      const content = fs.readFileSync(modulePath, 'utf8');
      
      expect(content).toContain('AWSManagedRulesCommonRuleSet');
      expect(content).toContain('AWSManagedRulesSQLiRuleSet');
    });
  });

  describe('Monitoring Module', () => {
    test('monitoring module exists', () => {
      const modulePath = path.join(libPath, 'modules/monitoring/main.tf');
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });

  describe('Module Structure Validation', () => {
    const modules = ['networking', 'compute', 'content_delivery', 'storage', 'media_processing', 'security', 'monitoring'];
    
    modules.forEach(moduleName => {
      test(`${moduleName} module has main.tf`, () => {
        const modulePath = path.join(libPath, `modules/${moduleName}/main.tf`);
        expect(fs.existsSync(modulePath)).toBe(true);
      });
    });
  });
});
