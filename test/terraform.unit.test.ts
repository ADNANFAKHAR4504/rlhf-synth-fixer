import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const terraformCode = fs.readFileSync(STACK_PATH, 'utf-8');

describe('Terraform CloudFront CDN Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test('does NOT declare provider in tap_stack.tf', () => {
      expect(terraformCode).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('does NOT declare terraform block in tap_stack.tf', () => {
      expect(terraformCode).not.toMatch(/\bterraform\s*{[\s\S]*?required_version/);
    });
  });

  describe('Variables', () => {
    test('should define aws_region variable with default us-east-1', () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s+{[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should define environment variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"environment"\s+{[\s\S]*?validation/);
      expect(terraformCode).toMatch(/contains\(\["development",\s*"staging",\s*"production"\]/);
    });

    test('should define environment_suffix variable', () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"/);
    });

    test('should define application variable with default Publishing', () => {
      expect(terraformCode).toMatch(/variable\s+"application"[\s\S]*?default\s*=\s*"Publishing"/);
    });

    test('should define domain_name variable', () => {
      expect(terraformCode).toMatch(/variable\s+"domain_name"/);
    });

    test('should define price_class variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"price_class"[\s\S]*?validation/);
      expect(terraformCode).toMatch(/PriceClass_100|PriceClass_200|PriceClass_All/);
    });

    test('should define glacier_transition_days variable with default 90', () => {
      expect(terraformCode).toMatch(/variable\s+"glacier_transition_days"[\s\S]*?default\s*=\s*90/);
    });

    test('should define log_retention_days variable with default 365', () => {
      expect(terraformCode).toMatch(/variable\s+"log_retention_days"[\s\S]*?default\s*=\s*365/);
    });

    test('should define auth_type variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"auth_type"[\s\S]*?validation/);
      expect(terraformCode).toMatch(/jwt|api|dynamodb/);
    });

    test('should define create_subscriber_table boolean variable', () => {
      expect(terraformCode).toMatch(/variable\s+"create_subscriber_table"[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_athena boolean variable', () => {
      expect(terraformCode).toMatch(/variable\s+"enable_athena"[\s\S]*?type\s*=\s*bool/);
    });

    test('should define rate_limit variable with validation', () => {
      expect(terraformCode).toMatch(/variable\s+"rate_limit"[\s\S]*?validation/);
      expect(terraformCode).toMatch(/default\s*=\s*2000/);
    });

    test('should define geo_restriction_type variable', () => {
      expect(terraformCode).toMatch(/variable\s+"geo_restriction_type"/);
    });

    test('should define cache TTL variables', () => {
      expect(terraformCode).toMatch(/variable\s+"cache_min_ttl"/);
      expect(terraformCode).toMatch(/variable\s+"cache_default_ttl"/);
      expect(terraformCode).toMatch(/variable\s+"cache_max_ttl"/);
    });

    test('should define public_key_pem as sensitive variable', () => {
      expect(terraformCode).toMatch(/variable\s+"public_key_pem"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define aws_partition data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_partition"\s+"current"/);
    });

    test('should define aws_availability_zones data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('should define conditional Route53 zone data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_route53_zone"\s+"existing"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.hosted_zone_id\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('should define CloudFront log delivery canonical user data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_cloudfront_log_delivery_canonical_user_id"\s+"current"/);
    });

    test('should define canonical user ID data source', () => {
      expect(terraformCode).toMatch(/data\s+"aws_canonical_user_id"\s+"current"/);
    });
  });

  describe('Random Resources', () => {
    test('should define random_string for environment suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
      expect(terraformCode).toMatch(/length\s*=\s*8/);
      expect(terraformCode).toMatch(/special\s*=\s*false/);
      expect(terraformCode).toMatch(/upper\s*=\s*false/);
    });

    test('should define random_password for JWT secret', () => {
      expect(terraformCode).toMatch(/resource\s+"random_password"\s+"jwt_secret"/);
      expect(terraformCode).toMatch(/length\s*=\s*32/);
    });
  });

  describe('Locals Block', () => {
    test('should define env_suffix in locals', () => {
      expect(terraformCode).toMatch(/locals\s+{[\s\S]*?env_suffix\s*=/);
    });

    test('should define common_tags in locals', () => {
      expect(terraformCode).toMatch(/common_tags\s*=\s*{/);
      expect(terraformCode).toMatch(/Environment\s*=\s*var\.environment/);
      expect(terraformCode).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('should define resource names with env_suffix in locals', () => {
      expect(terraformCode).toMatch(/origin_bucket_name\s*=.*\$\{local\.env_suffix\}/);
      expect(terraformCode).toMatch(/logs_bucket_name\s*=.*\$\{local\.env_suffix\}/);
      expect(terraformCode).toMatch(/lambda_auth_name\s*=.*\$\{local\.env_suffix\}/);
    });
  });

  describe('KMS Key', () => {
    test('should define KMS key for S3 encryption', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    });

    test('should enable key rotation', () => {
      expect(terraformCode).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should have deletion window of 30 days', () => {
      expect(terraformCode).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test('should have CloudWatch Logs service principal in policy', () => {
      expect(terraformCode).toMatch(/Service\s*=\s*"logs\.\$\{var\.aws_region\}\.amazonaws\.com"/);
    });

    test('should have CloudFront service principal in policy', () => {
      expect(terraformCode).toMatch(/Service\s*=\s*"cloudfront\.amazonaws\.com"/);
    });

    test('should define KMS alias with env_suffix', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
      expect(terraformCode).toMatch(/name\s*=\s*local\.kms_key_alias/);
    });
  });

  describe('S3 Origin Bucket', () => {
    test('should define S3 origin bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"origin"/);
      expect(terraformCode).toMatch(/bucket\s*=\s*local\.origin_bucket_name/);
    });

    test('should block all public access', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"origin"/);
      expect(terraformCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/block_public_policy\s*=\s*true/);
      expect(terraformCode).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(terraformCode).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should enable versioning', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"origin"/);
      expect(terraformCode).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should enable KMS encryption', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"origin"/);
      expect(terraformCode).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(terraformCode).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('should have lifecycle policy for Glacier transition', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"origin"/);
      expect(terraformCode).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(terraformCode).toMatch(/days\s*=\s*var\.glacier_transition_days/);
    });

    test('should have lifecycle policy with filter block', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"origin"[\s\S]*?filter\s+\{\s*\}/);
    });

    test('should enforce bucket owner', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_ownership_controls"\s+"origin"/);
      expect(terraformCode).toMatch(/object_ownership\s*=\s*"BucketOwnerEnforced"/);
    });

    test('should enable S3 access logging', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"origin"/);
      expect(terraformCode).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.logs\.id/);
    });
  });

  describe('S3 Logs Bucket', () => {
    test('should define S3 logs bucket', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(terraformCode).toMatch(/bucket\s*=\s*local\.logs_bucket_name/);
    });

    test('should have lifecycle policy to delete old logs', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(terraformCode).toMatch(/days\s*=\s*var\.log_retention_days/);
    });

    test('should have lifecycle policy with filter block', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"[\s\S]*?filter\s+\{\s*\}/);
    });

    test('should use canonical user IDs in ACL configuration', () => {
      expect(terraformCode).toMatch(/owner[\s\S]*?id\s*=\s*data\.aws_canonical_user_id\.current\.id/);
      expect(terraformCode).toMatch(/grantee[\s\S]*?id\s*=\s*data\.aws_canonical_user_id\.current\.id/);
    });

    test('should have ACL for CloudFront log delivery', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_acl"\s+"logs"/);
    });
  });

  describe('CloudFront OAI', () => {
    test('should define Origin Access Identity', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"/);
    });

    test('should have bucket policy allowing OAI access', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"origin"/);
      expect(terraformCode).toMatch(/aws_cloudfront_origin_access_identity\.oai\.iam_arn/);
      expect(terraformCode).toMatch(/s3:GetObject/);
    });
  });

  describe('ACM Certificate', () => {
    test('should define ACM certificate conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_acm_certificate"\s+"cdn"/);
      expect(terraformCode).toMatch(/count\s*=\s*local\.has_custom_domain\s*\?\s*1\s*:\s*0/);
    });

    test('should use DNS validation', () => {
      expect(terraformCode).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test('should define Route53 validation records', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"/);
    });

    test('should define certificate validation resource', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"cdn"/);
    });
  });

  describe('Secrets Manager', () => {
    test('should define JWT secret', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"jwt_secret"/);
      expect(terraformCode).toMatch(/kms_key_id\s*=\s*aws_kms_key\.s3\.id/);
    });

    test('should define JWT secret version', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"jwt_secret"/);
      expect(terraformCode).toMatch(/secret_string\s*=\s*random_password\.jwt_secret\.result/);
    });

    test('should define CloudFront private key secret conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"cloudfront_private_key"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.public_key_pem\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  describe('CloudFront Public Key and Key Group', () => {
    test('should define public key conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudfront_public_key"\s+"signing"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.public_key_pem\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('should define key group conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudfront_key_group"\s+"signing"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.public_key_pem\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  describe('Lambda@Edge IAM Role', () => {
    test('should define Lambda@Edge IAM role', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"lambda_edge_auth"/);
      expect(terraformCode).toMatch(/name\s*=.*lambda-edge-auth-role.*\$\{local\.env_suffix\}/);
    });

    test('should have trust policy for Lambda and EdgeLambda', () => {
      expect(terraformCode).toMatch(/lambda\.amazonaws\.com/);
      expect(terraformCode).toMatch(/edgelambda\.amazonaws\.com/);
    });

    test('should define IAM policy for Lambda@Edge', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_edge_auth"/);
      expect(terraformCode).toMatch(/logs:CreateLogGroup/);
      expect(terraformCode).toMatch(/dynamodb:GetItem/);
      expect(terraformCode).toMatch(/secretsmanager:GetSecretValue/);
    });
  });

  describe('Lambda@Edge Function', () => {
    test('should define archive data source for Lambda@Edge', () => {
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"lambda_edge_auth"/);
    });

    test('should define Lambda@Edge function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"edge_auth"/);
      expect(terraformCode).toMatch(/function_name\s*=\s*local\.lambda_auth_name/);
      expect(terraformCode).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(terraformCode).toMatch(/timeout\s*=\s*5/);
      expect(terraformCode).toMatch(/publish\s*=\s*true/);
    });

    test('should NOT have environment variables (Lambda@Edge restriction)', () => {
      expect(terraformCode).not.toMatch(/environment\s+{[\s\S]*?AUTH_TYPE/);
      expect(terraformCode).not.toMatch(/environment\s+{[\s\S]*?DYNAMODB_TABLE/);
      expect(terraformCode).not.toMatch(/environment\s+{[\s\S]*?JWT_SECRET_ARN/);
    });
  });

  describe('Lambda Log Processor', () => {
    test('should define IAM role for log processor', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"lambda_log_processor"/);
    });

    test('should define IAM policy with S3 and CloudWatch permissions', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_log_processor"/);
      expect(terraformCode).toMatch(/s3:GetObject/);
      expect(terraformCode).toMatch(/s3:ListBucket/);
      expect(terraformCode).toMatch(/cloudwatch:PutMetricData/);
    });

    test('should define CloudWatch log group with KMS encryption', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_log_processor"/);
      expect(terraformCode).toMatch(/kms_key_id\s*=\s*aws_kms_key\.s3\.arn/);
      expect(terraformCode).toMatch(/depends_on\s*=\s*\[aws_kms_key\.s3\]/);
    });

    test('should define log processor Lambda function', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"log_processor"/);
      expect(terraformCode).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(terraformCode).toMatch(/timeout\s*=\s*300/);
      expect(terraformCode).toMatch(/memory_size\s*=\s*512/);
    });
  });

  describe('EventBridge Rule', () => {
    test('should define EventBridge rule for log processor', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"lambda_log_processor"/);
      expect(terraformCode).toMatch(/schedule_expression\s*=\s*var\.lambda_log_processor_schedule/);
    });

    test('should define EventBridge target', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda_log_processor"/);
    });

    test('should define Lambda permission for EventBridge', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"eventbridge"/);
      expect(terraformCode).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe('DynamoDB Subscribers Table', () => {
    test('should define DynamoDB table conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"\s+"subscribers"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.create_subscriber_table\s*\?\s*1\s*:\s*0/);
    });

    test('should use PAY_PER_REQUEST billing', () => {
      expect(terraformCode).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('should have subscriber_id as hash key', () => {
      expect(terraformCode).toMatch(/hash_key\s*=\s*"subscriber_id"/);
    });

    test('should enable encryption with KMS', () => {
      expect(terraformCode).toMatch(/server_side_encryption[\s\S]*?kms_key_arn\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('should enable point-in-time recovery', () => {
      expect(terraformCode).toMatch(/point_in_time_recovery[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe('WAF Web ACL', () => {
    test('should define WAF Web ACL', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront"/);
      expect(terraformCode).toMatch(/scope\s*=\s*"CLOUDFRONT"/);
    });

    test('should have AWS Managed Rules for Common Rule Set', () => {
      expect(terraformCode).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('should have AWS Managed Rules for Known Bad Inputs', () => {
      expect(terraformCode).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('should have rate limiting rule', () => {
      expect(terraformCode).toMatch(/rate_based_statement/);
      expect(terraformCode).toMatch(/limit\s*=\s*var\.rate_limit/);
    });

    test('should have custom rule to block invalid user agent', () => {
      expect(terraformCode).toMatch(/BlockInvalidUserAgent/);
      expect(terraformCode).toMatch(/user-agent/);
    });
  });

  describe('CloudFront Distribution', () => {
    test('should define CloudFront distribution', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"cdn"/);
      expect(terraformCode).toMatch(/enabled\s*=\s*true/);
    });

    test('should reference WAF Web ACL', () => {
      expect(terraformCode).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.cloudfront\.arn/);
    });

    test('should use HTTP/2 and HTTP/3', () => {
      expect(terraformCode).toMatch(/http_version\s*=\s*"http2and3"/);
    });

    test('should have S3 origin with OAI', () => {
      expect(terraformCode).toMatch(/origin\s+{[\s\S]*?s3_origin_config/);
      expect(terraformCode).toMatch(/origin_access_identity\s*=\s*aws_cloudfront_origin_access_identity\.oai/);
    });

    test('should have default cache behavior', () => {
      expect(terraformCode).toMatch(/default_cache_behavior\s+{/);
      expect(terraformCode).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      expect(terraformCode).toMatch(/compress\s*=\s*true/);
    });

    test('should have ordered cache behavior for premium content', () => {
      expect(terraformCode).toMatch(/ordered_cache_behavior\s+{[\s\S]*?path_pattern\s*=\s*"premium\/\*"/);
    });

    test('should have Lambda@Edge association', () => {
      expect(terraformCode).toMatch(/lambda_function_association\s+{/);
      expect(terraformCode).toMatch(/event_type\s*=\s*"viewer-request"/);
      expect(terraformCode).toMatch(/lambda_arn\s*=\s*aws_lambda_function\.edge_auth\.qualified_arn/);
    });

    test('should have logging configuration', () => {
      expect(terraformCode).toMatch(/logging_config\s+{/);
      expect(terraformCode).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket_domain_name/);
      expect(terraformCode).toMatch(/prefix\s*=\s*"cdn-access-logs\/"/);
    });

    test('should have geo restriction configuration', () => {
      expect(terraformCode).toMatch(/geo_restriction\s+{/);
      expect(terraformCode).toMatch(/restriction_type\s*=\s*var\.geo_restriction_type/);
    });

    test('should have dynamic viewer certificate', () => {
      expect(terraformCode).toMatch(/dynamic\s+"viewer_certificate"/);
      expect(terraformCode).toMatch(/acm_certificate_arn/);
      expect(terraformCode).toMatch(/ssl_support_method\s*=\s*"sni-only"/);
      expect(terraformCode).toMatch(/minimum_protocol_version\s*=\s*var\.minimum_protocol_version/);
    });
  });

  describe('Route 53 Records', () => {
    test('should define Route 53 zone conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_zone"\s+"cdn"/);
      expect(terraformCode).toMatch(/count\s*=\s*local\.create_route53_zone\s*\?\s*1\s*:\s*0/);
    });

    test('should define A record for CloudFront', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_record"\s+"cdn_a"/);
      expect(terraformCode).toMatch(/type\s*=\s*"A"/);
      expect(terraformCode).toMatch(/alias\s+{[\s\S]*?name\s*=\s*aws_cloudfront_distribution\.cdn\.domain_name/);
    });

    test('should define AAAA record for IPv6', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_route53_record"\s+"cdn_aaaa"/);
      expect(terraformCode).toMatch(/type\s*=\s*"AAAA"/);
    });
  });

  describe('SNS Topic and Subscriptions', () => {
    test('should define SNS topic conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.sns_topic_arn\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('should encrypt SNS topic with KMS', () => {
      expect(terraformCode).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.id/);
    });

    test('should define email subscription conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"/);
      expect(terraformCode).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should define 4xx error rate alarm', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudfront_4xx_error_rate"/);
      expect(terraformCode).toMatch(/metric_name\s*=\s*"4xxErrorRate"/);
      expect(terraformCode).toMatch(/namespace\s*=\s*"AWS\/CloudFront"/);
      expect(terraformCode).toMatch(/threshold\s*=\s*5/);
    });

    test('should define 5xx error rate alarm', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudfront_5xx_error_rate"/);
      expect(terraformCode).toMatch(/metric_name\s*=\s*"5xxErrorRate"/);
      expect(terraformCode).toMatch(/threshold\s*=\s*1/);
    });

    test('should define total error rate alarm', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cloudfront_total_error_rate"/);
      expect(terraformCode).toMatch(/metric_name\s*=\s*"TotalErrorRate"/);
      expect(terraformCode).toMatch(/threshold\s*=\s*5/);
    });

    test('should use CloudFront distribution ID in alarm dimensions', () => {
      expect(terraformCode).toMatch(/DistributionId\s*=\s*aws_cloudfront_distribution\.cdn\.id/);
    });
  });

  describe('Athena Integration', () => {
    test('should define Glue catalog database conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_glue_catalog_database"\s+"cloudfront_logs"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.enable_athena\s*\?\s*1\s*:\s*0/);
    });

    test('should define Glue catalog table conditionally', () => {
      expect(terraformCode).toMatch(/resource\s+"aws_glue_catalog_table"\s+"cloudfront_logs"/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.enable_athena\s*\?\s*1\s*:\s*0/);
    });

    test('should configure table as EXTERNAL_TABLE', () => {
      expect(terraformCode).toMatch(/table_type\s*=\s*"EXTERNAL_TABLE"/);
    });

    test('should point to S3 log location', () => {
      expect(terraformCode).toMatch(/location\s*=\s*"s3:\/\/\$\{aws_s3_bucket\.logs\.id\}\/cdn-access-logs\/"/);
    });
  });

  describe('Outputs', () => {
    test('should output CloudFront distribution ID', () => {
      expect(terraformCode).toMatch(/output\s+"cloudfront_distribution_id"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_cloudfront_distribution\.cdn\.id/);
    });

    test('should output CloudFront distribution domain name', () => {
      expect(terraformCode).toMatch(/output\s+"cloudfront_distribution_domain_name"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_cloudfront_distribution\.cdn\.domain_name/);
    });

    test('should output S3 origin bucket name', () => {
      expect(terraformCode).toMatch(/output\s+"s3_origin_bucket_name"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_s3_bucket\.origin\.id/);
    });

    test('should output S3 logs bucket name', () => {
      expect(terraformCode).toMatch(/output\s+"s3_logs_bucket_name"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_s3_bucket\.logs\.id/);
    });

    test('should output CloudFront OAI ID', () => {
      expect(terraformCode).toMatch(/output\s+"cloudfront_oai_id"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_cloudfront_origin_access_identity\.oai\.id/);
    });

    test('should output Lambda@Edge function ARN using qualified_arn', () => {
      expect(terraformCode).toMatch(/output\s+"lambda_edge_function_arn"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_lambda_function\.edge_auth\.qualified_arn/);
    });

    test('should output Lambda log processor function ARN', () => {
      expect(terraformCode).toMatch(/output\s+"lambda_log_processor_function_arn"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_lambda_function\.log_processor\.arn/);
    });

    test('should output WAF WebACL ARN', () => {
      expect(terraformCode).toMatch(/output\s+"waf_webacl_arn"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_wafv2_web_acl\.cloudfront\.arn/);
    });

    test('should output KMS key ARN', () => {
      expect(terraformCode).toMatch(/output\s+"kms_key_arn"/);
      expect(terraformCode).toMatch(/value\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('should output JWT secret ARN as sensitive', () => {
      expect(terraformCode).toMatch(/output\s+"jwt_secret_arn"/);
      expect(terraformCode).toMatch(/sensitive\s*=\s*true/);
    });

    test('should output Route53 zone ID conditionally', () => {
      expect(terraformCode).toMatch(/output\s+"route53_zone_id"/);
    });

    test('should output DynamoDB table name conditionally', () => {
      expect(terraformCode).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('should output Athena database name conditionally', () => {
      expect(terraformCode).toMatch(/output\s+"athena_database_name"/);
    });

    test('should output CloudFront public key ID as sensitive', () => {
      expect(terraformCode).toMatch(/output\s+"cloudfront_public_key_id"/);
      expect(terraformCode).toMatch(/cloudfront_public_key_id"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should output CloudFront key group ID as sensitive', () => {
      expect(terraformCode).toMatch(/output\s+"cloudfront_key_group_id"/);
      expect(terraformCode).toMatch(/cloudfront_key_group_id"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('Tagging', () => {
    test('should apply common tags to resources', () => {
      const tagMatches = terraformCode.match(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/g);
      expect(tagMatches).toBeDefined();
      expect(tagMatches!.length).toBeGreaterThan(10);
    });
  });

  describe('No Emojis', () => {
    test('should not contain any emojis in the code', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
      expect(terraformCode).not.toMatch(emojiRegex);
    });
  });
});
