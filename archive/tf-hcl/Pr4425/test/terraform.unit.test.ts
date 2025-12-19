// Unit tests for Terraform infrastructure
// Tests tap_stack.tf without executing terraform commands

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_PATH = path.join(LIB_DIR, 'tap_stack.tf');
const PROVIDER_PATH = path.join(LIB_DIR, 'provider.tf');
const VARIABLES_PATH = path.join(LIB_DIR, 'variables.tf');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test('tap_stack.tf is not empty', () => {
      const content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;
    let tapStackContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
      tapStackContent = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('provider.tf contains random provider in required_providers', () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
    });

    test('provider.tf defines primary AWS provider alias', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"primary"/);
    });

    test('provider.tf defines secondary AWS provider alias', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"/);
    });

    test('provider.tf defines cloudfront AWS provider alias', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"cloudfront"/);
    });

    test('tap_stack.tf does not declare provider blocks', () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
      expect(tapStackContent).not.toMatch(/provider\s+"random"\s*{/);
    });

    test('provider.tf has S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });
  });

  describe('Resource Declarations', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('declares random_string for unique resource naming', () => {
      expect(content).toMatch(/resource\s+"random_string"\s+"unique_id"/);
    });

    describe('KMS Resources', () => {
      test('declares primary KMS key', () => {
        expect(content).toMatch(/resource\s+"aws_kms_key"\s+"primary_s3_key"/);
      });

      test('declares secondary KMS key', () => {
        expect(content).toMatch(/resource\s+"aws_kms_key"\s+"secondary_s3_key"/);
      });

      test('KMS keys have key rotation enabled', () => {
        const kmsKeyBlocks = content.match(/resource\s+"aws_kms_key"[\s\S]*?enable_key_rotation\s*=\s*true/g);
        expect(kmsKeyBlocks).not.toBeNull();
        expect(kmsKeyBlocks?.length).toBeGreaterThanOrEqual(2);
      });

      test('declares KMS key aliases', () => {
        expect(content).toMatch(/resource\s+"aws_kms_alias"/);
      });
    });

    describe('S3 Bucket Resources', () => {
      test('declares primary content bucket', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_content"/);
      });

      test('declares secondary content bucket', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary_content"/);
      });

      test('declares CloudFront logs bucket', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudfront_logs"/);
      });

      test('declares analytics bucket', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"analytics"/);
      });

      test('declares CloudTrail bucket', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      });

      test('declares primary and secondary log buckets', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_logs"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary_logs"/);
      });
    });

    describe('S3 Bucket Configurations', () => {
      test('all content buckets have versioning enabled', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary_content_versioning"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary_content_versioning"/);
      });

      test('all content buckets have encryption configured', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_content_encryption"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary_content_encryption"/);
      });

      test('content buckets use KMS encryption', () => {
        const encryptionBlocks = content.match(/sse_algorithm\s*=\s*"aws:kms"/g);
        expect(encryptionBlocks).not.toBeNull();
        expect(encryptionBlocks?.length).toBeGreaterThan(0);
      });

      test('all buckets have public access blocked', () => {
        const pabBlocks = content.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
        expect(pabBlocks).not.toBeNull();
        expect(pabBlocks?.length).toBeGreaterThanOrEqual(6);
      });

      test('public access block is properly configured', () => {
        expect(content).toMatch(/block_public_acls\s*=\s*true/);
        expect(content).toMatch(/block_public_policy\s*=\s*true/);
        expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
      });

      test('content buckets have lifecycle policies', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary_content_lifecycle"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"secondary_content_lifecycle"/);
      });

      test('content buckets have CORS configuration', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_cors_configuration"\s+"primary_content_cors"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket_cors_configuration"\s+"secondary_content_cors"/);
      });

      test('content buckets have logging configured', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"primary_content_logging"/);
        expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"secondary_content_logging"/);
      });
    });

    describe('S3 Replication', () => {
      test('declares S3 replication IAM role', () => {
        expect(content).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
      });

      test('declares S3 replication policy', () => {
        expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_replication"/);
      });

      test('declares S3 replication configuration', () => {
        expect(content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/);
      });

      test('replication configuration uses conditional count', () => {
        const replicationMatch = content.match(/resource\s+"aws_s3_bucket_replication_configuration"[\s\S]*?count\s*=\s*var\.enable_s3_replication\s*\?\s*1\s*:\s*0/);
        expect(replicationMatch).not.toBeNull();
      });
    });

    describe('CloudFront Resources', () => {
      test('declares CloudFront Origin Access Identity', () => {
        expect(content).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"/);
      });

      test('declares CloudFront distribution', () => {
        expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
      });

      test('CloudFront distribution has origin groups configured', () => {
        expect(content).toMatch(/origin_group\s*{/);
      });

      test('CloudFront uses default certificate (no custom domain)', () => {
        expect(content).toMatch(/cloudfront_default_certificate\s*=\s*true/);
      });

      test('CloudFront does not use domain aliases', () => {
        expect(content).not.toMatch(/aliases\s*=\s*\[.*domain_name/);
      });

      test('CloudFront has logging configured', () => {
        expect(content).toMatch(/logging_config\s*{/);
      });
    });

    describe('WAF Resources', () => {
      test('declares WAF Web ACL', () => {
        expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront_waf"/);
      });

      test('WAF Web ACL scope is CLOUDFRONT', () => {
        expect(content).toMatch(/scope\s*=\s*"CLOUDFRONT"/);
      });

      test('WAF has AWS Managed Rules Common Rule Set', () => {
        expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
      });

      test('WAF has AWS Managed Rules Known Bad Inputs', () => {
        expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      });

      test('WAF has rate limiting rule', () => {
        expect(content).toMatch(/rate_based_statement/);
      });

      test('WAF has CloudWatch metrics enabled', () => {
        const metricsEnabled = content.match(/cloudwatch_metrics_enabled\s*=\s*true/g);
        expect(metricsEnabled).not.toBeNull();
        expect(metricsEnabled?.length).toBeGreaterThan(0);
      });
    });

    describe('Lambda@Edge Resources', () => {
      test('declares Lambda@Edge IAM role', () => {
        expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_edge_role"/);
      });

      test('declares viewer request Lambda function', () => {
        expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"viewer_request"/);
      });

      test('declares viewer response Lambda function', () => {
        expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"viewer_response"/);
      });

      test('Lambda functions use nodejs20.x runtime', () => {
        const runtimeMatches = content.match(/runtime\s*=\s*"nodejs20\.x"/g);
        expect(runtimeMatches).not.toBeNull();
        expect(runtimeMatches?.length).toBeGreaterThanOrEqual(2);
      });

      test('Lambda functions have publish enabled for edge use', () => {
        const publishMatches = content.match(/publish\s*=\s*true/g);
        expect(publishMatches).not.toBeNull();
        expect(publishMatches?.length).toBeGreaterThanOrEqual(2);
      });

      test('Lambda source directories exist', () => {
        const viewerRequestDir = path.join(__dirname, '../lib/lambda-edge-viewer-request');
        const viewerResponseDir = path.join(__dirname, '../lib/lambda-edge-viewer-response');
        expect(fs.existsSync(viewerRequestDir)).toBe(true);
        expect(fs.existsSync(viewerResponseDir)).toBe(true);
      });
    });

    describe('CloudWatch Resources', () => {
      test('declares CloudWatch dashboard', () => {
        expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      });

      test('declares CloudWatch alarms', () => {
        expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      });

      test('declares alarm for 4xx errors', () => {
        expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_4xx_errors"/);
      });

      test('declares alarm for 5xx errors', () => {
        expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_5xx_errors"/);
      });

      test('declares alarm for WAF blocked requests', () => {
        expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"waf_blocked_requests"/);
      });
    });

    describe('SNS Resources', () => {
      test('declares SNS topic for alerts', () => {
        expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      });

      test('declares SNS topic subscription', () => {
        expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"/);
      });

      test('SNS subscription uses email protocol', () => {
        expect(content).toMatch(/protocol\s*=\s*"email"/);
      });
    });

    describe('CloudTrail Resources', () => {
      test('declares CloudTrail with conditional count', () => {
        expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
        expect(content).toMatch(/count\s*=\s*var\.enable_cloudtrail\s*\?\s*1\s*:\s*0/);
      });

      test('CloudTrail has logging enabled when deployed', () => {
        expect(content).toMatch(/enable_logging\s*=\s*true/);
      });

      test('CloudTrail is multi-region when deployed', () => {
        expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
      });

      test('CloudTrail has log file validation enabled when deployed', () => {
        expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
      });

      test('CloudTrail S3 bucket is conditional', () => {
        const cloudtrailBucketMatch = content.match(/resource\s+"aws_s3_bucket"\s+"cloudtrail"[\s\S]*?count\s*=\s*var\.enable_cloudtrail/);
        expect(cloudtrailBucketMatch).not.toBeNull();
      });
    });

    describe('QuickSight Resources', () => {
      test('declares QuickSight IAM role', () => {
        expect(content).toMatch(/resource\s+"aws_iam_role"\s+"quicksight"/);
      });

      test('declares QuickSight S3 policy', () => {
        expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"quicksight_s3"/);
      });

      test('declares QuickSight data source', () => {
        expect(content).toMatch(/resource\s+"aws_quicksight_data_source"\s+"cloudfront_logs"/);
      });

      test('declares QuickSight dataset', () => {
        expect(content).toMatch(/resource\s+"aws_quicksight_data_set"\s+"content_analytics"/);
      });

      test('QuickSight resources use conditional count', () => {
        const quicksightMatches = content.match(/count\s*=\s*var\.enable_quicksight\s*\?\s*1\s*:\s*0/g);
        expect(quicksightMatches).not.toBeNull();
        expect(quicksightMatches?.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Security Validations', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('no hardcoded AWS access keys', () => {
      expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test('no hardcoded AWS secret keys', () => {
      expect(content).not.toMatch(/aws_secret_access_key\s*=\s*"[^"]+"/);
    });

    test('no wildcard permissions in S3 bucket policies', () => {
      const s3PolicyBlocks = content.match(/data\s+"aws_iam_policy_document"[\s\S]*?actions\s*=\s*\[[^\]]*\*[^\]]*\]/);
      expect(s3PolicyBlocks).toBeNull();
    });

    test('IAM policies use specific actions (no wildcards)', () => {
      const policyDocuments = content.match(/data\s+"aws_iam_policy_document"[\s\S]*?}/g) || [];
      for (const policyDoc of policyDocuments) {
        const actionsMatch = policyDoc.match(/actions\s*=\s*\[([\s\S]*?)\]/);
        if (actionsMatch) {
          expect(actionsMatch[1]).not.toMatch(/"\*"/);
        }
      }
    });

    test('sensitive variables are marked as sensitive', () => {
      const variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf8');
      if (variablesContent.includes('origin_verify_secret')) {
        expect(variablesContent).toMatch(/variable\s+"origin_verify_secret"[\s\S]*?sensitive\s*=\s*true/);
      }
    });
  });

  describe('Tagging', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('resources use common_tags variable', () => {
      const tagMatches = content.match(/tags\s*=\s*(var\.common_tags|merge\(var\.common_tags)/g);
      expect(tagMatches).not.toBeNull();
      expect(tagMatches?.length).toBeGreaterThan(10);
    });

    test('KMS keys are tagged', () => {
      const kmsBlocks = content.match(/resource\s+"aws_kms_key"[\s\S]*?tags\s*=/g);
      expect(kmsBlocks).not.toBeNull();
      expect(kmsBlocks?.length).toBeGreaterThanOrEqual(2);
    });

    test('S3 buckets are tagged', () => {
      const s3Blocks = content.match(/resource\s+"aws_s3_bucket"[\s\S]*?tags\s*=/g);
      expect(s3Blocks).not.toBeNull();
      expect(s3Blocks?.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Dependencies', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('CloudFront distribution has proper depends_on', () => {
      const cfdistMatch = content.match(/resource\s+"aws_cloudfront_distribution"\s+"main"[\s\S]*?depends_on\s*=\s*\[/);
      expect(cfdistMatch).not.toBeNull();
    });

    test('Lambda functions depend on IAM role policy attachment', () => {
      const lambdaBlocks = content.match(/resource\s+"aws_lambda_function"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?lambda_edge_basic/g);
      expect(lambdaBlocks).not.toBeNull();
      expect(lambdaBlocks?.length).toBeGreaterThanOrEqual(2);
    });

    test('S3 replication depends on versioning being enabled', () => {
      const replicationMatch = content.match(/resource\s+"aws_s3_bucket_replication_configuration"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?versioning/);
      expect(replicationMatch).not.toBeNull();
    });

    test('CloudTrail depends on S3 bucket policy', () => {
      const cloudtrailMatch = content.match(/resource\s+"aws_cloudtrail"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?cloudtrail/);
      expect(cloudtrailMatch).not.toBeNull();
    });
  });

  describe('Outputs', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('outputs CloudFront distribution ID', () => {
      expect(content).toMatch(/output\s+"cloudfront_distribution_id"/);
    });

    test('outputs CloudFront domain name', () => {
      expect(content).toMatch(/output\s+"cloudfront_domain_name"/);
    });

    test('outputs CloudFront URL', () => {
      expect(content).toMatch(/output\s+"cloudfront_url"/);
    });

    test('outputs S3 bucket names', () => {
      expect(content).toMatch(/output\s+"s3_bucket_primary"/);
      expect(content).toMatch(/output\s+"s3_bucket_secondary"/);
    });

    test('outputs WAF Web ACL ID', () => {
      expect(content).toMatch(/output\s+"waf_web_acl_id"/);
    });

    test('outputs Lambda@Edge function ARNs', () => {
      expect(content).toMatch(/output\s+"lambda_edge_viewer_request_arn"/);
      expect(content).toMatch(/output\s+"lambda_edge_viewer_response_arn"/);
    });

    test('outputs deployment instructions', () => {
      expect(content).toMatch(/output\s+"deployment_instructions"/);
    });

    test('does not output domain-related information', () => {
      expect(content).not.toMatch(/output\s+"route53/);
      expect(content).not.toMatch(/output\s+".*domain.*name_servers/);
    });
  });

  describe('Variables', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(VARIABLES_PATH, 'utf8');
    });

    test('defines primary_region variable', () => {
      expect(content).toMatch(/variable\s+"primary_region"/);
    });

    test('defines secondary_region variable', () => {
      expect(content).toMatch(/variable\s+"secondary_region"/);
    });

    test('defines common_tags variable', () => {
      expect(content).toMatch(/variable\s+"common_tags"/);
    });

    test('defines project_name variable', () => {
      expect(content).toMatch(/variable\s+"project_name"/);
    });

    test('defines WAF configuration variables', () => {
      expect(content).toMatch(/variable\s+"waf_rate_limit"/);
      expect(content).toMatch(/variable\s+"waf_blocked_threshold"/);
    });

    test('defines CloudFront configuration variables', () => {
      expect(content).toMatch(/variable\s+"cloudfront_price_class"/);
      expect(content).toMatch(/variable\s+"cloudfront_min_ttl"/);
      expect(content).toMatch(/variable\s+"cloudfront_default_ttl"/);
      expect(content).toMatch(/variable\s+"cloudfront_max_ttl"/);
    });

    test('defines enable_s3_replication variable', () => {
      expect(content).toMatch(/variable\s+"enable_s3_replication"/);
    });

    test('defines enable_quicksight variable', () => {
      expect(content).toMatch(/variable\s+"enable_quicksight"/);
    });

    test('defines enable_cloudtrail variable', () => {
      expect(content).toMatch(/variable\s+"enable_cloudtrail"/);
    });

    test('defines alert_email variable', () => {
      expect(content).toMatch(/variable\s+"alert_email"/);
    });

    test('does not define domain_name variable', () => {
      expect(content).not.toMatch(/variable\s+"domain_name"/);
    });
  });

  describe('Lambda@Edge Functions', () => {
    let content: string;
    const viewerRequestPath = path.join(__dirname, '../lib/lambda-edge-viewer-request/index.js');
    const viewerResponsePath = path.join(__dirname, '../lib/lambda-edge-viewer-response/index.js');

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('viewer request Lambda function exists', () => {
      expect(fs.existsSync(viewerRequestPath)).toBe(true);
    });

    test('viewer response Lambda function exists', () => {
      expect(fs.existsSync(viewerResponsePath)).toBe(true);
    });

    test('viewer request function has proper handler export', () => {
      const content = fs.readFileSync(viewerRequestPath, 'utf8');
      expect(content).toMatch(/exports\.handler/);
    });

    test('viewer response function has proper handler export', () => {
      const content = fs.readFileSync(viewerResponsePath, 'utf8');
      expect(content).toMatch(/exports\.handler/);
    });

    test('viewer response function adds security headers', () => {
      const content = fs.readFileSync(viewerResponsePath, 'utf8');
      expect(content).toMatch(/Strict-Transport-Security/);
      expect(content).toMatch(/Content-Security-Policy/);
      expect(content).toMatch(/X-Frame-Options/);
      expect(content).toMatch(/X-Content-Type-Options/);
    });

    test('viewer request function handles device detection', () => {
      const content = fs.readFileSync(viewerRequestPath, 'utf8');
      expect(content).toMatch(/user-agent/i);
      expect(content).toMatch(/Mobile|Android|iPhone/);
    });

    test('Lambda functions use archive_file data sources', () => {
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_edge_viewer_request"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_edge_viewer_response"/);
    });

    test('Lambda functions reference archive output paths', () => {
      expect(content).toMatch(/data\.archive_file\.lambda_edge_viewer_request\.output_path/);
      expect(content).toMatch(/data\.archive_file\.lambda_edge_viewer_response\.output_path/);
    });
  });

  describe('Multi-Region Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(TAP_STACK_PATH, 'utf8');
    });

    test('resources use primary provider alias', () => {
      const primaryMatches = content.match(/provider\s*=\s*aws\.primary/g);
      expect(primaryMatches).not.toBeNull();
      expect(primaryMatches?.length).toBeGreaterThan(10);
    });

    test('resources use secondary provider alias', () => {
      const secondaryMatches = content.match(/provider\s*=\s*aws\.secondary/g);
      expect(secondaryMatches).not.toBeNull();
      expect(secondaryMatches?.length).toBeGreaterThan(5);
    });

    test('CloudFront and Lambda@Edge use cloudfront provider alias', () => {
      const cloudfrontMatches = content.match(/provider\s*=\s*aws\.cloudfront/g);
      expect(cloudfrontMatches).not.toBeNull();
      expect(cloudfrontMatches?.length).toBeGreaterThanOrEqual(5);
    });
  });
});
