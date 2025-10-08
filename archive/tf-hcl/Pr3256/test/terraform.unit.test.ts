// test/terraform.unit.test.ts
// Unit tests for Terraform infrastructure

import fs from 'fs';
import path from 'path';

const libPath = path.resolve(__dirname, '../lib');

// Helper function to read file content
const readFile = (filename: string): string => {
  const filePath = path.join(libPath, filename);
  return fs.readFileSync(filePath, 'utf8');
};

// Helper function to check if file exists
const fileExists = (filename: string): boolean => {
  const filePath = path.join(libPath, filename);
  return fs.existsSync(filePath);
};

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('main.tf exists', () => {
      expect(fileExists('main.tf')).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fileExists('variables.tf')).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fileExists('outputs.tf')).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fileExists('provider.tf')).toBe(true);
    });

    test('sample-content.tf exists', () => {
      expect(fileExists('sample-content.tf')).toBe(true);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = readFile('variables.tf');
    });

    test('defines aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('defines domain_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test('defines project_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test('defines environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('defines create_dns_records variable', () => {
      expect(variablesContent).toMatch(/variable\s+"create_dns_records"\s*{/);
    });

    test('defines hosted_zone_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"hosted_zone_name"\s*{/);
    });

    test('defines tags variable', () => {
      expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
    });

    test('environment_suffix has default empty string', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[^}]*default\s*=\s*""/);
    });

    test('create_dns_records defaults to false', () => {
      expect(variablesContent).toMatch(/variable\s+"create_dns_records"[^}]*default\s*=\s*false/);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readFile('provider.tf');
    });

    test('configures terraform version requirement', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('configures AWS provider', () => {
      expect(providerContent).toMatch(/required_providers[\s\S]*aws\s*=\s*{/);
    });

    test('configures random provider', () => {
      expect(providerContent).toMatch(/required_providers[\s\S]*random\s*=\s*{/);
    });

    test('configures backend', () => {
      expect(providerContent).toMatch(/backend\s+"(s3|local)"/);
    });

    test('defines AWS provider with region', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=\s*var\.aws_region/);
    });
  });

  describe('S3 Buckets Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('creates website S3 bucket with environment suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"website"/);
      expect(mainContent).toContain('${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}');
    });

    test('creates logs S3 bucket with environment suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      const logsMatch = mainContent.match(/resource\s+"aws_s3_bucket"\s+"logs"[^}]*bucket\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      expect(logsMatch).toBeTruthy();
    });

    test('enables versioning on website bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"website"/);
      expect(mainContent).toContain('status = "Enabled"');
    });

    test('enables encryption on website bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"website"/);
    });

    test('enables encryption on logs bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    });

    test('configures lifecycle policy for logs', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(mainContent).toContain('storage_class = "GLACIER"');
      expect(mainContent).toContain('days          = 30');
    });

    test('configures public access block for website bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"website"/);
    });

    test('configures public access block for logs bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
    });

    test('website bucket has all public access blocks set to true', () => {
      const websiteBucketBlockMatch = mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"website"\s*{[^}]*}/s);
      expect(websiteBucketBlockMatch).toBeTruthy();
      if (websiteBucketBlockMatch) {
        const blockConfig = websiteBucketBlockMatch[0];
        expect(blockConfig).toContain('block_public_acls       = true');
        expect(blockConfig).toContain('block_public_policy     = true');
        expect(blockConfig).toContain('ignore_public_acls      = true');
        expect(blockConfig).toContain('restrict_public_buckets = true');
      }
    });

    test('logs bucket has all public access blocks set to true', () => {
      const logsBucketBlockMatch = mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{[^}]*}/s);
      expect(logsBucketBlockMatch).toBeTruthy();
      if (logsBucketBlockMatch) {
        const blockConfig = logsBucketBlockMatch[0];
        expect(blockConfig).toContain('block_public_acls       = true');
        expect(blockConfig).toContain('block_public_policy     = true');
        expect(blockConfig).toContain('ignore_public_acls      = true');
        expect(blockConfig).toContain('restrict_public_buckets = true');
      }
    });
  });

  describe('CloudFront Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('creates CloudFront OAC with environment suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudfront_origin_access_control"\s+"website"/);
      const oacMatch = mainContent.match(/resource\s+"aws_cloudfront_origin_access_control"\s+"website"[^}]*name\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      expect(oacMatch).toBeTruthy();
    });

    test('creates CloudFront distributions with environment suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"website_with_domain"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"website_default"/);
      const distWithDomainMatch = mainContent.match(/resource\s+"aws_cloudfront_distribution"\s+"website_with_domain"[^}]*comment\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      const distDefaultMatch = mainContent.match(/resource\s+"aws_cloudfront_distribution"\s+"website_default"[^}]*comment\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      expect(distWithDomainMatch).toBeTruthy();
      expect(distDefaultMatch).toBeTruthy();
    });

    test('configures CloudFront with OAC', () => {
      expect(mainContent).toContain('origin_access_control_id = aws_cloudfront_origin_access_control.website.id');
    });

    test('configures CloudFront viewer protocol policy', () => {
      expect(mainContent).toContain('viewer_protocol_policy = "redirect-to-https"');
    });

    test('configures CloudFront logging', () => {
      expect(mainContent).toMatch(/logging_config\s*{/);
      expect(mainContent).toContain('bucket          = aws_s3_bucket.logs.bucket_domain_name');
    });

    test('configures custom error responses', () => {
      expect(mainContent).toMatch(/custom_error_response\s*{[\s\S]*error_code\s*=\s*404/);
      expect(mainContent).toMatch(/custom_error_response\s*{[\s\S]*error_code\s*=\s*403/);
    });

    test('configures conditional viewer certificate', () => {
      expect(mainContent).toMatch(/viewer_certificate\s*{/);
      expect(mainContent).toContain('cloudfront_default_certificate = true');
      expect(mainContent).toContain('acm_certificate_arn      = aws_acm_certificate.website[0].arn');
    });

    test('uses managed cache policies instead of forwarded_values', () => {
      expect(mainContent).toContain('cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id');
      expect(mainContent).toContain('origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3_origin.id');
      // Ensure forwarded_values is not used
      expect(mainContent).not.toMatch(/forwarded_values\s*{/);
    });

    test('defines CloudFront managed cache policy data sources', () => {
      expect(mainContent).toMatch(/data\s+"aws_cloudfront_cache_policy"\s+"caching_optimized"/);
      expect(mainContent).toContain('name = "Managed-CachingOptimized"');
      expect(mainContent).toMatch(/data\s+"aws_cloudfront_origin_request_policy"\s+"cors_s3_origin"/);
      expect(mainContent).toContain('name = "Managed-CORS-S3Origin"');
    });

    test('CloudFront distribution with domain has certificate dependency', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"website_with_domain"/);
      expect(mainContent).toContain('depends_on = [aws_acm_certificate_validation.website[0]]');
    });

    test('creates local value for CloudFront distribution reference', () => {
      expect(mainContent).toMatch(/locals\s*{[\s\S]*cloudfront_distribution\s*=/);
      expect(mainContent).toContain('var.domain_name != "" && var.create_dns_records ? aws_cloudfront_distribution.website_with_domain[0] : aws_cloudfront_distribution.website_default[0]');
    });
  });

  describe('Route 53 Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('makes Route 53 zone data source conditional', () => {
      expect(mainContent).toMatch(/data\s+"aws_route53_zone"\s+"main"[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_dns_records\s*\?\s*1\s*:\s*0/);
    });

    test('makes Route 53 A record conditional', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route53_record"\s+"website"[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_dns_records\s*\?\s*1\s*:\s*0/);
    });

    test('makes Route 53 www record conditional', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route53_record"\s+"www"[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_dns_records\s*\?\s*1\s*:\s*0/);
    });

    test('makes ACM certificate conditional', () => {
      expect(mainContent).toMatch(/resource\s+"aws_acm_certificate"\s+"website"[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_dns_records\s*\?\s*1\s*:\s*0/);
    });

    test('makes ACM certificate validation conditional', () => {
      expect(mainContent).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"website"[\s\S]*count\s*=\s*var\.domain_name\s*!=\s*""\s*&&\s*var\.create_dns_records\s*\?\s*1\s*:\s*0/);
    });

    test('Route 53 zone uses improved domain parsing logic', () => {
      const zoneDataSourceMatch = mainContent.match(/data\s+"aws_route53_zone"\s+"main"[^}]*name\s*=[^}]*}/s);
      expect(zoneDataSourceMatch).toBeTruthy();
      if (zoneDataSourceMatch) {
        const zoneConfig = zoneDataSourceMatch[0];
        expect(zoneConfig).toContain('var.hosted_zone_name != "" ? var.hosted_zone_name');
        expect(zoneConfig).toContain('length(split(".", var.domain_name)) > 2');
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('creates CloudWatch dashboard with environment suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"website"/);
      const dashMatch = mainContent.match(/dashboard_name\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      expect(dashMatch).toBeTruthy();
    });

    test('configures CloudWatch alarms for 4xx errors', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_4xx_errors"/);
      expect(mainContent).toContain('metric_name         = "4xxErrorRate"');
    });

    test('configures CloudWatch alarms for 5xx errors', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_5xx_errors"/);
      expect(mainContent).toContain('metric_name         = "5xxErrorRate"');
    });

    test('alarm names include environment suffix', () => {
      const alarm4xxMatch = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_4xx_errors"[^}]*alarm_name\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      const alarm5xxMatch = mainContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_5xx_errors"[^}]*alarm_name\s*=\s*"[^"]*\$\{var\.environment_suffix/);
      expect(alarm4xxMatch).toBeTruthy();
      expect(alarm5xxMatch).toBeTruthy();
    });

    test('creates SNS topic for alerts', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(mainContent).toContain('${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-alerts');
    });

    test('alarms have SNS topic actions', () => {
      expect(mainContent).toContain('alarm_actions       = [aws_sns_topic.alerts.arn]');
      // Check that alarm_actions = [] is not present anymore
      expect(mainContent).not.toContain('alarm_actions       = []');
    });

    test('composite alarm has SNS topic actions', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_composite_alarm"\s+"website_health"/);
      expect(mainContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  describe('CloudWatch Application Signals', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('creates Application Insights application', () => {
      expect(mainContent).toMatch(/resource\s+"aws_applicationinsights_application"\s+"website"/);
      expect(mainContent).toContain('resource_group_name = aws_resourcegroups_group.website.name');
      expect(mainContent).toContain('auto_config_enabled = true');
    });

    test('creates resource group for Application Signals', () => {
      expect(mainContent).toMatch(/resource\s+"aws_resourcegroups_group"\s+"website"/);
      expect(mainContent).toContain('${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-resources');
    });

    test('resource group filters CloudFront and S3 resources', () => {
      expect(mainContent).toMatch(/resource\s+"aws_resourcegroups_group"\s+"website"/);
      expect(mainContent).toContain('AWS::CloudFront::Distribution');
      expect(mainContent).toContain('AWS::S3::Bucket');
      expect(mainContent).toContain('ResourceTypeFilters');
    });

    test('creates composite alarm for website health', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_composite_alarm"\s+"website_health"/);
      expect(mainContent).toContain('Composite alarm monitoring overall website health');
    });

    test('creates CloudWatch log group for Application Insights', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application_insights"/);
      expect(mainContent).toContain('/aws/applicationinsights/');
      expect(mainContent).toContain('retention_in_days = var.log_retention_days');
    });
  });

  describe('S3 Bucket Policies', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('creates S3 bucket policy for CloudFront OAC access', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"website"/);
      expect(mainContent).toContain('Service = "cloudfront.amazonaws.com"');
    });

    test('creates S3 bucket policy for CloudFront logs', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
    });

    test('bucket policy uses proper conditions', () => {
      expect(mainContent).toContain('"AWS:SourceArn" = local.cloudfront_distribution.arn');
    });
  });

  describe('Sample Content', () => {
    let sampleContent: string;

    beforeAll(() => {
      sampleContent = readFile('sample-content.tf');
    });

    test('creates index.html sample', () => {
      expect(sampleContent).toMatch(/resource\s+"aws_s3_object"\s+"index"/);
      expect(sampleContent).toContain('key          = "index.html"');
    });

    test('creates 404.html error page', () => {
      expect(sampleContent).toMatch(/resource\s+"aws_s3_object"\s+"error_404"/);
      expect(sampleContent).toContain('key          = "404.html"');
    });

    test('creates 403.html error page', () => {
      expect(sampleContent).toMatch(/resource\s+"aws_s3_object"\s+"error_403"/);
      expect(sampleContent).toContain('key          = "403.html"');
    });

    test('sample files have correct content type', () => {
      expect(sampleContent).toMatch(/content_type\s*=\s*"text\/html"/g);
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = readFile('outputs.tf');
    });

    test('exports website bucket name', () => {
      expect(outputsContent).toMatch(/output\s+"website_bucket_name"/);
    });

    test('exports website bucket ARN', () => {
      expect(outputsContent).toMatch(/output\s+"website_bucket_arn"/);
    });

    test('exports logs bucket name', () => {
      expect(outputsContent).toMatch(/output\s+"logs_bucket_name"/);
    });

    test('exports CloudFront distribution ID', () => {
      expect(outputsContent).toMatch(/output\s+"cloudfront_distribution_id"/);
    });

    test('exports CloudFront distribution domain', () => {
      expect(outputsContent).toMatch(/output\s+"cloudfront_distribution_domain"/);
    });

    test('exports website URL', () => {
      expect(outputsContent).toMatch(/output\s+"website_url"/);
    });

    test('website URL uses conditional logic', () => {
      expect(outputsContent).toContain('var.domain_name != "" && var.create_dns_records ? "https://${var.domain_name}" : "https://${local.cloudfront_distribution.domain_name}"');
    });

    test('ACM certificate ARN is conditional', () => {
      expect(outputsContent).toContain('var.domain_name != "" && var.create_dns_records ? aws_acm_certificate.website[0].arn : null');
    });

    test('Route53 zone ID is conditional', () => {
      expect(outputsContent).toContain('var.domain_name != "" && var.create_dns_records ? data.aws_route53_zone.main[0].zone_id : null');
    });

    test('exports SNS alerts topic ARN', () => {
      expect(outputsContent).toMatch(/output\s+"sns_alerts_topic_arn"/);
      expect(outputsContent).toContain('aws_sns_topic.alerts.arn');
    });
  });

  describe('Security Best Practices', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
    });

    test('no hardcoded AWS account IDs', () => {
      // Check that we're using data source for account ID
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(mainContent).toContain('data.aws_caller_identity.current');
    });

    test('uses encryption for all S3 buckets', () => {
      const encryptionCount = (mainContent.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
      expect(encryptionCount).toBeGreaterThanOrEqual(2);
    });

    test('blocks public access appropriately', () => {
      const publicAccessBlockCount = (mainContent.match(/aws_s3_bucket_public_access_block/g) || []).length;
      expect(publicAccessBlockCount).toBeGreaterThanOrEqual(2);
    });

    test('uses HTTPS for CloudFront', () => {
      expect(mainContent).toContain('viewer_protocol_policy = "redirect-to-https"');
    });

    test('minimum TLS version configured conditionally', () => {
      expect(mainContent).toMatch(/minimum_protocol_version\s*=/);
      expect(mainContent).toContain('minimum_protocol_version = "TLSv1.2_2021"');
      // Check that the domain distribution has TLS version and default doesn't
      const domainDistMatch = mainContent.match(/resource\s+"aws_cloudfront_distribution"\s+"website_with_domain"[\s\S]*?minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
      expect(domainDistMatch).toBeTruthy();
    });
  });

  describe('Resource Naming Convention', () => {
    let mainContent: string;
    let variablesContent: string;

    beforeAll(() => {
      mainContent = readFile('main.tf');
      variablesContent = readFile('variables.tf');
    });

    test('all resources use project_name variable', () => {
      const resourceCount = (mainContent.match(/resource\s+"aws_/g) || []).length;
      const projectNameUsage = (mainContent.match(/var\.project_name/g) || []).length;
      expect(projectNameUsage).toBeGreaterThan(0);
    });

    test('environment_suffix is used consistently', () => {
      const suffixUsage = (mainContent.match(/var\.environment_suffix/g) || []).length;
      expect(suffixUsage).toBeGreaterThan(10); // Should be used in many places
    });

    test('tags are applied to resources', () => {
      const tagUsage = (mainContent.match(/tags\s*=\s*(var\.tags|merge\(var\.tags)/g) || []).length;
      expect(tagUsage).toBeGreaterThan(5);
    });
  });
});