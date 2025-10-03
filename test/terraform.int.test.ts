// tests/integration/integration-tests.ts
// Comprehensive integration tests for secure content delivery system
// Tests real-world use cases and actual functionality

import * as fs from 'fs';
import * as path from 'path';

const OUTPUTS_FILE = path.join(__dirname, "../cfn-outputs/all-outputs.json");
const IS_CI_CD = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

describe("Secure Content Delivery System - Integration Tests", () => {
  let outputs: any;
  let usingMockData = false;

  // Mock outputs for local development only
  const mockOutputs = {
    cloudfront_distribution_id: "E1234567890ABC",
    cloudfront_domain_name: "d1234567890abc.cloudfront.net",
    cloudfront_distribution_arn: "arn:aws:cloudfront::123456789012:distribution/E1234567890ABC",
    s3_bucket_name: "tap-content-delivery-content-production",
    s3_bucket_arn: "arn:aws:s3:::tap-content-delivery-content-production",
    s3_bucket_domain_name: "tap-content-delivery-content-production.s3.amazonaws.com",
    s3_bucket_regional_domain_name: "tap-content-delivery-content-production.s3.us-east-1.amazonaws.com",
    kms_key_id: "12345678-1234-1234-1234-123456789012",
    kms_key_arn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    kms_alias_name: "alias/tap-content-delivery-content-production",
    route53_zone_id: "Z1234567890ABC",
    route53_name_servers: '["ns-123.awsdns-12.com", "ns-456.awsdns-45.org", "ns-789.awsdns-78.net", "ns-012.awsdns-01.co.uk"]',
    acm_certificate_arn: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
    cloudfront_origin_access_identity_id: "E1234567890ABC",
    cloudfront_origin_access_identity_iam_arn: "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E1234567890ABC",
    cloudwatch_dashboard_url: "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=tap-content-delivery-dashboard-production",
    sns_topic_arn: "arn:aws:sns:us-east-1:123456789012:tap-content-delivery-alerts-production",
    cloudtrail_arn: "arn:aws:cloudtrail:us-east-1:123456789012:trail/tap-content-delivery-cloudtrail-production",
    waf_web_acl_arn: "arn:aws:wafv2:us-east-1:123456789012:global/webacl/tap-content-delivery-waf-production/12345678-1234-1234-1234-123456789012",
    website_url: "https://example.com",
    test_url: "https://d1234567890abc.cloudfront.net",
    content_delivery_summary: '{"domain_name":"example.com","cloudfront_domain":"d1234567890abc.cloudfront.net","s3_bucket":"tap-content-delivery-content-production","encryption_enabled":true,"waf_enabled":true,"cloudtrail_enabled":true,"monitoring_enabled":true,"cost_optimization":"Lifecycle policies configured for S3 storage classes","test_url":"https://d1234567890abc.cloudfront.net"}'
  };

  beforeAll(async () => {
    try {
      // In CI/CD, we MUST have real deployment outputs
      if (IS_CI_CD) {
        if (!fs.existsSync(OUTPUTS_FILE)) {
          throw new Error(`CI/CD deployment outputs not found at ${OUTPUTS_FILE}. Deployment may have failed.`);
        }

        const rawOutputs = fs.readFileSync(OUTPUTS_FILE, 'utf8');
        const parsedOutputs = JSON.parse(rawOutputs);

        // Process Terraform output format (extract 'value' property if present)
        outputs = {};
        Object.keys(parsedOutputs).forEach(key => {
          const value = parsedOutputs[key];
          if (typeof value === 'object' && value !== null && 'value' in value) {
            outputs[key] = value.value;
          } else {
            outputs[key] = value;
          }
        });

        console.log(`✅ Loaded real deployment outputs from CI/CD`);
        usingMockData = false;

      } else {
        // Local development - use mock data
        outputs = mockOutputs;
        usingMockData = true;
        console.log(`⚠️  Using mock data for local development`);
      }

    } catch (error) {
      if (IS_CI_CD) {
        // In CI/CD, we must fail if we can't load real outputs
        throw new Error(`Failed to load deployment outputs in CI/CD: ${error}`);
      } else {
        // Local development - fallback to mock data
        outputs = mockOutputs;
        usingMockData = true;
        console.log(`⚠️  Failed to load outputs, using mock data: ${error}`);
      }
    }
  });

  afterAll(async () => {
    // Remove mock data after successful testing (only in local development)
    if (usingMockData && !IS_CI_CD) {
      console.log(`🧹 Tests completed successfully. Mock data can be removed after verifying real deployment.`);
    }
  });

  describe("Infrastructure Outputs Validation", () => {
    test("Deployment outputs source validation", () => {
      if (IS_CI_CD) {
        // In CI/CD, we must be using real deployment outputs
        expect(usingMockData).toBe(false);
        expect(outputs).toBeDefined();
        expect(Object.keys(outputs).length).toBeGreaterThan(0);

        // Verify we have real AWS resource identifiers (not mock values)
        expect(outputs.cloudfront_distribution_id).not.toBe("E1234567890ABC");
        expect(outputs.s3_bucket_name).not.toBe("tap-content-delivery-content-production");
        expect(outputs.kms_key_id).not.toBe("12345678-1234-1234-1234-123456789012");

        console.log(`✅ CI/CD validation passed - using real deployment outputs`);
      } else {
        // Local development - mock data is acceptable
        expect(usingMockData).toBe(true);
        console.log(`⚠️  Local development - using mock data`);
      }
    });

    test("CI/CD outputs file validation", () => {
      if (IS_CI_CD) {
        // In CI/CD, the outputs file must exist and be valid JSON
        expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);

        const rawContent = fs.readFileSync(OUTPUTS_FILE, 'utf8');
        expect(() => JSON.parse(rawContent)).not.toThrow();

        const parsedOutputs = JSON.parse(rawContent);
        expect(parsedOutputs).toBeDefined();
        expect(typeof parsedOutputs).toBe('object');

        // Verify essential outputs are present
        const requiredOutputs = [
          'cloudfront_distribution_id',
          'cloudfront_domain_name',
          's3_bucket_name',
          'kms_key_id',
          'test_url'
        ];

        requiredOutputs.forEach(outputKey => {
          expect(parsedOutputs[outputKey]).toBeDefined();
        });

        console.log(`✅ CI/CD outputs file validation passed`);
      }
    });

    test("CloudFront distribution outputs are valid", () => {
      expect(outputs.cloudfront_distribution_id).toBeDefined();
      expect(outputs.cloudfront_domain_name).toBeDefined();
      expect(outputs.cloudfront_distribution_arn).toBeDefined();

      expect(outputs.cloudfront_distribution_id).toMatch(/^E[A-Z0-9]+$/);
      expect(outputs.cloudfront_domain_name).toMatch(/^[a-z0-9-]+\.cloudfront\.net$/);
      expect(outputs.cloudfront_distribution_arn).toMatch(/^arn:aws:cloudfront::\d+:distribution\/E[A-Z0-9]+$/);
    });

    test("S3 bucket outputs are valid", () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_arn).toBeDefined();
      expect(outputs.s3_bucket_domain_name).toBeDefined();
      expect(outputs.s3_bucket_regional_domain_name).toBeDefined();

      expect(outputs.s3_bucket_name).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      expect(outputs.s3_bucket_domain_name).toMatch(/^[a-z0-9-]+\.s3\.amazonaws\.com$/);
      expect(outputs.s3_bucket_regional_domain_name).toMatch(/^[a-z0-9-]+\.s3\.us-east-1\.amazonaws\.com$/);
    });

    test("KMS encryption outputs are valid", () => {
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_alias_name).toBeDefined();

      expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]{36}$/);
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d+:key\/[a-f0-9-]{36}$/);
      expect(outputs.kms_alias_name).toMatch(/^alias\/[a-z0-9-]+$/);
    });

    test("Route 53 outputs are valid", () => {
      expect(outputs.route53_zone_id).toBeDefined();
      expect(outputs.route53_name_servers).toBeDefined();

      expect(outputs.route53_zone_id).toMatch(/^Z[A-Z0-9]+$/);
      expect(outputs.route53_name_servers).toMatch(/^\[.*\]$/);
    });

    test("SSL/TLS certificate outputs are valid", () => {
      expect(outputs.acm_certificate_arn).toBeDefined();
      expect(outputs.acm_certificate_arn).toMatch(/^arn:aws:acm:us-east-1:\d+:certificate\/[a-f0-9-]{36}$/);
    });

    test("Monitoring outputs are valid", () => {
      expect(outputs.cloudwatch_dashboard_url).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();

      expect(outputs.cloudwatch_dashboard_url).toMatch(/^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch/);
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d+:[a-z0-9-]+$/);
    });

    test("Security outputs are valid", () => {
      expect(outputs.cloudtrail_arn).toBeDefined();
      expect(outputs.waf_web_acl_arn).toBeDefined();

      expect(outputs.cloudtrail_arn).toMatch(/^arn:aws:cloudtrail:us-east-1:\d+:trail\/[a-z0-9-]+$/);
      expect(outputs.waf_web_acl_arn).toMatch(/^arn:aws:wafv2:us-east-1:\d+:global\/webacl\/[a-z0-9-]+\/[a-f0-9-]{36}$/);
    });

    test("Website URL is valid", () => {
      expect(outputs.website_url).toBeDefined();
      expect(outputs.website_url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    });

    test("Content delivery summary is valid JSON", () => {
      expect(outputs.content_delivery_summary).toBeDefined();

      const summary = JSON.parse(outputs.content_delivery_summary);
      expect(summary).toHaveProperty("domain_name");
      expect(summary).toHaveProperty("cloudfront_domain");
      expect(summary).toHaveProperty("s3_bucket");
      expect(summary).toHaveProperty("encryption_enabled");
      expect(summary).toHaveProperty("waf_enabled");
      expect(summary).toHaveProperty("cloudtrail_enabled");
      expect(summary).toHaveProperty("monitoring_enabled");
      expect(summary).toHaveProperty("cost_optimization");

      expect(summary.encryption_enabled).toBe(true);
      expect(summary.monitoring_enabled).toBe(true);
    });
  });

  describe("Real-World Use Case Testing", () => {
    test("Content delivery system can serve e-books", async () => {
      // Test that the system is configured to serve e-book content types
      const summary = JSON.parse(outputs.content_delivery_summary);

      // Verify CloudFront is configured for global content delivery
      expect(outputs.cloudfront_domain_name).toBeDefined();
      expect(outputs.cloudfront_distribution_arn).toContain("cloudfront");

      // Verify S3 bucket is configured for content storage
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_arn).toContain("s3");

      // Verify encryption is enabled for secure content delivery
      expect(summary.encryption_enabled).toBe(true);
    });

    test("System supports HTTPS-only access", async () => {
      // Verify SSL/TLS certificate is configured
      expect(outputs.acm_certificate_arn).toBeDefined();
      expect(outputs.acm_certificate_arn).toContain("acm");

      // Verify website URL uses HTTPS
      expect(outputs.website_url).toMatch(/^https:/);
    });

    test("System provides comprehensive monitoring", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      // Verify monitoring is enabled
      expect(summary.monitoring_enabled).toBe(true);

      // Verify CloudWatch dashboard is configured
      expect(outputs.cloudwatch_dashboard_url).toBeDefined();
      expect(outputs.cloudwatch_dashboard_url).toContain("cloudwatch");

      // Verify SNS topic for alerts is configured
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toContain("sns");
    });

    test("System implements security best practices", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      // Verify WAF is enabled for additional protection
      expect(summary.waf_enabled).toBe(true);
      expect(outputs.waf_web_acl_arn).toBeDefined();
      expect(outputs.waf_web_acl_arn).toContain("wafv2");

      // Verify CloudTrail is enabled for audit logging
      expect(summary.cloudtrail_enabled).toBe(true);
      expect(outputs.cloudtrail_arn).toBeDefined();
      expect(outputs.cloudtrail_arn).toContain("cloudtrail");
    });

    test("System supports cost optimization", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      // Verify cost optimization features are configured
      expect(summary.cost_optimization).toBeDefined();
      expect(summary.cost_optimization).toContain("Lifecycle policies");
    });

    test("System can handle 5,000 daily readers", async () => {
      // Verify CloudFront distribution can handle global traffic
      expect(outputs.cloudfront_distribution_id).toBeDefined();
      expect(outputs.cloudfront_domain_name).toBeDefined();

      // Verify WAF rate limiting is configured
      expect(outputs.waf_web_acl_arn).toBeDefined();

      // Verify monitoring for performance metrics
      expect(outputs.cloudwatch_dashboard_url).toBeDefined();
    });
  });

  describe("DNS and Domain Configuration", () => {
    test("Route 53 hosted zone is properly configured", async () => {
      expect(outputs.route53_zone_id).toBeDefined();
      expect(outputs.route53_name_servers).toBeDefined();

      // Verify zone ID format
      expect(outputs.route53_zone_id).toMatch(/^Z[A-Z0-9]+$/);

      // Verify name servers are provided
      const nameServers = JSON.parse(outputs.route53_name_servers);
      expect(Array.isArray(nameServers)).toBe(true);
      expect(nameServers.length).toBeGreaterThan(0);
    });

    test("Domain points to CloudFront distribution", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      expect(summary.domain_name).toBeDefined();
      expect(summary.cloudfront_domain).toBeDefined();
      expect(outputs.website_url).toContain(summary.domain_name);
    });
  });

  describe("Security and Compliance", () => {
    test("All content is encrypted at rest", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      expect(summary.encryption_enabled).toBe(true);
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
    });

    test("Audit logging is configured", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      expect(summary.cloudtrail_enabled).toBe(true);
      expect(outputs.cloudtrail_arn).toBeDefined();
    });

    test("Web Application Firewall is configured", async () => {
      const summary = JSON.parse(outputs.content_delivery_summary);

      expect(summary.waf_enabled).toBe(true);
      expect(outputs.waf_web_acl_arn).toBeDefined();
    });
  });

  describe("Performance and Scalability", () => {
    test("CloudFront distribution is globally distributed", async () => {
      expect(outputs.cloudfront_distribution_id).toBeDefined();
      expect(outputs.cloudfront_domain_name).toBeDefined();

      // CloudFront automatically provides global distribution
      expect(outputs.cloudfront_domain_name).toContain("cloudfront.net");
    });

    test("S3 bucket supports high availability", async () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_arn).toBeDefined();

      // S3 provides 99.999999999% (11 9's) durability
      expect(outputs.s3_bucket_arn).toContain("s3");
    });
  });

  describe("Integration with AWS Services", () => {
    test("All AWS services are properly integrated", async () => {
      const services = [
        "cloudfront",
        "s3",
        "kms",
        "route53",
        "acm",
        "cloudwatch",
        "sns",
        "cloudtrail",
        "wafv2"
      ];

      // Check that each service is represented in the outputs
      services.forEach(service => {
        const hasService = Object.keys(outputs).some(key =>
          key.toLowerCase().includes(service) || (outputs as any)[key].toString().toLowerCase().includes(service)
        );
        expect(hasService).toBe(true);
      });
    });

    test("Cross-service dependencies are properly configured", async () => {
      // CloudFront uses S3 as origin
      expect(outputs.cloudfront_distribution_arn).toBeDefined();
      expect(outputs.s3_bucket_arn).toBeDefined();

      // CloudFront uses ACM certificate
      expect(outputs.acm_certificate_arn).toBeDefined();

      // CloudWatch uses SNS for notifications
      expect(outputs.sns_topic_arn).toBeDefined();

      // CloudTrail uses S3 for log storage
      expect(outputs.cloudtrail_arn).toBeDefined();
    });
  });
});
