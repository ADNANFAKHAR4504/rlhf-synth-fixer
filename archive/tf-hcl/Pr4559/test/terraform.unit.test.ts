import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Stack Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/\bterraform\s+{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares domain_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test("declares allowed_countries variable", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_countries"\s*{/);
    });
  });

  describe("S3 Resources", () => {
    test("declares media content S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"media_content"\s*{/);
    });

    test("declares access logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"\s*{/);
    });

    test("blocks public access on media bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"media_content"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("blocks public access on logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"access_logs"\s*{/);
    });

    test("configures encryption for media bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"media_content"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm/);
    });

    test("configures KMS encryption for logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"access_logs"\s*{/);
      expect(stackContent).toMatch(/kms_master_key_id/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("configures bucket policy for CloudFront access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"media_content"\s*{/);
      expect(stackContent).toMatch(/s3:GetObject/);
    });

    test("buckets are deletable with force_destroy", () => {
      const mediaBucketSection = stackContent.substring(
        stackContent.indexOf('resource "aws_s3_bucket" "media_content"'),
        stackContent.indexOf('resource "aws_s3_bucket_public_access_block" "media_content"')
      );
      expect(mediaBucketSection).toMatch(/force_destroy\s*=\s*true/);
      
      const logsBucketSection = stackContent.substring(
        stackContent.indexOf('resource "aws_s3_bucket" "access_logs"'),
        stackContent.indexOf('resource "aws_s3_bucket_public_access_block" "access_logs"')
      );
      expect(logsBucketSection).toMatch(/force_destroy\s*=\s*true/);
    });
  });

  describe("KMS Resources", () => {
    test("declares KMS key for logs encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs"\s*{/);
    });

    test("enables key rotation on KMS key", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("sets short deletion window for KMS key", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("declares KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs"\s*{/);
    });
  });

  describe("CloudFront Resources", () => {
    test("declares CloudFront Origin Access Identity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"media_oai"\s*{/);
    });

    test("declares CloudFront distribution", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"media"\s*{/);
    });

    test("configures HTTPS enforcement", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("configures TLS minimum version", () => {
      expect(stackContent).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
    });

    test("enables IPv6", () => {
      expect(stackContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
    });

    test("configures geo-restrictions", () => {
      expect(stackContent).toMatch(/geo_restriction\s*{/);
      expect(stackContent).toMatch(/restriction_type\s*=\s*"whitelist"/);
      expect(stackContent).toMatch(/locations\s*=\s*var\.allowed_countries/);
    });

    test("configures logging to S3", () => {
      expect(stackContent).toMatch(/logging_config\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.access_logs\.bucket_domain_name/);
      expect(stackContent).toMatch(/prefix\s*=\s*"cloudfront-logs\//);
    });

    test("uses ACM certificate", () => {
      expect(stackContent).toMatch(/acm_certificate_arn\s*=\s*aws_acm_certificate\.cdn\.arn/);
      expect(stackContent).toMatch(/ssl_support_method\s*=\s*"sni-only"/);
    });

    test("configures S3 origin with OAI", () => {
      expect(stackContent).toMatch(/s3_origin_config\s*{/);
      expect(stackContent).toMatch(/origin_access_identity/);
    });
  });

  describe("ACM Certificate Resources", () => {
    test("declares ACM certificate", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"cdn"\s*{/);
    });

    test("uses DNS validation", () => {
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("declares certificate validation resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"cdn"\s*{/);
    });

    test("has create_before_destroy lifecycle", () => {
      const certSection = stackContent.substring(
        stackContent.indexOf('resource "aws_acm_certificate" "cdn"'),
        stackContent.indexOf('resource "aws_cloudfront_distribution"')
      );
      expect(certSection).toMatch(/lifecycle/);
      expect(certSection).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe("Route53 Resources", () => {
    test("declares Route53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"\s*{/);
    });

    test("declares Route53 record for certificate validation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=/);
    });

    test("declares Route53 A record for CloudFront", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"cdn"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*"A"/);
    });

    test("uses alias for CloudFront distribution", () => {
      expect(stackContent).toMatch(/alias\s*{/);
      expect(stackContent).toMatch(/aws_cloudfront_distribution\.media\.domain_name/);
    });

    test("hosted zone is deletable", () => {
      const zoneSection = stackContent.substring(
        stackContent.indexOf('resource "aws_route53_zone" "main"'),
        stackContent.indexOf('resource "aws_route53_record" "cert_validation"')
      );
      expect(zoneSection).toMatch(/force_destroy\s*=\s*true/);
    });
  });

  describe("CloudWatch Resources", () => {
    test("declares CloudWatch alarm for 5xx errors", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_5xx_errors"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"5xxErrorRate"/);
    });

    test("declares CloudWatch alarm for 4xx errors", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_4xx_errors"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"4xxErrorRate"/);
    });

    test("declares CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"media_platform"\s*{/);
    });

    test("dashboard includes CloudFront metrics", () => {
      expect(stackContent).toMatch(/AWS\/CloudFront/);
      expect(stackContent).toMatch(/Requests/);
      expect(stackContent).toMatch(/BytesDownloaded/);
    });
  });

  describe("Data Sources", () => {
    test("uses aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });

  describe("Outputs", () => {
    test("outputs CloudFront distribution ID", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_id"\s*{/);
    });

    test("outputs CloudFront domain name", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_domain"\s*{/);
    });

    test("outputs media bucket name", () => {
      expect(stackContent).toMatch(/output\s+"media_bucket_name"\s*{/);
    });

    test("outputs logs bucket name", () => {
      expect(stackContent).toMatch(/output\s+"logs_bucket_name"\s*{/);
    });

    test("outputs KMS key ARN", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("outputs Route53 zone ID", () => {
      expect(stackContent).toMatch(/output\s+"route53_zone_id"\s*{/);
    });

    test("outputs ACM certificate ARN", () => {
      expect(stackContent).toMatch(/output\s+"acm_certificate_arn"\s*{/);
    });

    test("outputs website URL", () => {
      expect(stackContent).toMatch(/output\s+"website_url"\s*{/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded sensitive values", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/AKIA[A-Z0-9]{16}/);
    });

    test("uses secure protocols only", () => {
      expect(stackContent).not.toMatch(/viewer_protocol_policy\s*=\s*"allow-all"/);
      expect(stackContent).not.toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.0/);
    });

    test("all S3 buckets have public access blocked", () => {
      const s3Buckets = stackContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || [];
      const publicAccessBlocks = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"\w+"/g) || [];
      expect(publicAccessBlocks.length).toBeGreaterThanOrEqual(s3Buckets.length);
    });
  });

  describe("Compliance with Requirements", () => {
    test("implements geo-restrictions for regional compliance", () => {
      expect(stackContent).toMatch(/geo_restriction/);
      expect(stackContent).toMatch(/restriction_type/);
    });

    test("enables encryption at rest", () => {
      expect(stackContent).toMatch(/server_side_encryption/);
    });

    test("enables encryption in transit (HTTPS)", () => {
      expect(stackContent).toMatch(/redirect-to-https/);
      expect(stackContent).toMatch(/acm_certificate_arn/);
    });

    test("implements access logging", () => {
      expect(stackContent).toMatch(/logging_config/);
    });

    test("uses least privilege (OAI for S3 access)", () => {
      expect(stackContent).toMatch(/origin_access_identity/);
      expect(stackContent).not.toMatch(/bucket\s+.*\s+acl\s*=\s*"public-read"/);
    });
  });
});
