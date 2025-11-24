"""Integration tests for TapStack."""
import json
from cdktf import App, Testing

from lib.tap_stack import TapStack


def get_synth_json(stack):
    """Helper to synthesize stack and parse JSON."""
    synth_str = Testing.synth(stack)
    return json.loads(synth_str)


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        # Verify basic structure
        assert stack is not None

    def test_s3_bucket_configuration(self):
        """Test that S3 bucket is properly configured with security settings."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackS3",
            environment_suffix="test-s3",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        # Synthesize the stack
        synth = get_synth_json(stack)

        # Find S3 bucket resources in synthesized config
        s3_buckets = [
            res for res in synth.get("resource", {}).get("aws_s3_bucket", {}).values()
        ]

        assert len(s3_buckets) > 0, "S3 bucket should be created"
        bucket = s3_buckets[0]
        assert "waf-cloudfront-origin-test-s3" in bucket["bucket"]

        # Verify versioning is enabled
        s3_versioning = [
            res for res in synth.get("resource", {}).get("aws_s3_bucket_versioning", {}).values()
        ]
        assert len(s3_versioning) > 0, "S3 versioning should be enabled"
        assert s3_versioning[0]["versioning_configuration"]["status"] == "Enabled"

        # Verify public access block
        public_access_blocks = [
            res for res in synth.get("resource", {}).get("aws_s3_bucket_public_access_block", {}).values()
        ]
        assert len(public_access_blocks) > 0, "Public access block should be configured"
        block = public_access_blocks[0]
        assert block["block_public_acls"] is True
        assert block["block_public_policy"] is True
        assert block["ignore_public_acls"] is True
        assert block["restrict_public_buckets"] is True

    def test_waf_webacl_rules_configuration(self):
        """Test that WAF WebACL is configured with all required rules."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackWAF",
            environment_suffix="test-waf",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        # Synthesize the stack
        synth = get_synth_json(stack)

        # Find WAF WebACL resources
        waf_webacls = [
            res for res in synth.get("resource", {}).get("aws_wafv2_web_acl", {}).values()
        ]

        assert len(waf_webacls) > 0, "WAF WebACL should be created"
        webacl = waf_webacls[0]

        # Verify scope is CLOUDFRONT
        assert webacl["scope"] == "CLOUDFRONT"

        # Verify default action is allow
        assert "allow" in webacl["default_action"]

        # Verify all required rules are present
        rules = webacl["rule"]
        assert len(rules) == 6, "Should have exactly 6 WAF rules"

        # Check rule names and priorities
        rule_names = {rule["name"]: rule["priority"] for rule in rules}
        expected_rules = {
            "IPAllowlistRule": 1,
            "RateLimitRule": 2,
            "AWSManagedRulesCommonRuleSet": 3,
            "AWSManagedRulesKnownBadInputsRuleSet": 4,
            "SQLInjectionRule": 5,
            "GeoBlockingRule": 6,
        }

        for rule_name, expected_priority in expected_rules.items():
            assert rule_name in rule_names, f"Rule {rule_name} should exist"
            assert rule_names[rule_name] == expected_priority, f"Rule {rule_name} should have priority {expected_priority}"

        # Verify visibility config
        assert webacl["visibility_config"]["cloudwatch_metrics_enabled"] is True
        assert webacl["visibility_config"]["sampled_requests_enabled"] is True

    def test_waf_rate_limiting_rule(self):
        """Test that WAF rate limiting rule is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackRateLimit",
            environment_suffix="test-rate",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)
        waf_webacls = [
            res for res in synth.get("resource", {}).get("aws_wafv2_web_acl", {}).values()
        ]

        webacl = waf_webacls[0]
        rate_limit_rule = next(
            (rule for rule in webacl["rule"] if rule["name"] == "RateLimitRule"),
            None
        )

        assert rate_limit_rule is not None, "Rate limit rule should exist"
        assert "rate_based_statement" in rate_limit_rule["statement"]
        assert rate_limit_rule["statement"]["rate_based_statement"]["limit"] == 2000
        assert rate_limit_rule["statement"]["rate_based_statement"]["aggregate_key_type"] == "IP"
        assert "block" in rate_limit_rule["action"]

    def test_waf_geo_blocking_rule(self):
        """Test that geo-blocking rule allows only specified countries."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackGeo",
            environment_suffix="test-geo",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)
        waf_webacls = [
            res for res in synth.get("resource", {}).get("aws_wafv2_web_acl", {}).values()
        ]

        webacl = waf_webacls[0]
        geo_rule = next(
            (rule for rule in webacl["rule"] if rule["name"] == "GeoBlockingRule"),
            None
        )

        assert geo_rule is not None, "Geo blocking rule should exist"
        assert "not_statement" in geo_rule["statement"]
        assert "geo_match_statement" in geo_rule["statement"]["not_statement"]["statement"]

        allowed_countries = geo_rule["statement"]["not_statement"]["statement"]["geo_match_statement"]["country_codes"]
        assert set(allowed_countries) == {"US", "CA", "GB"}, "Should allow only US, CA, and GB"
        assert "block" in geo_rule["action"]

    def test_waf_sql_injection_rule(self):
        """Test that SQL injection protection rule is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackSQL",
            environment_suffix="test-sql",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)
        waf_webacls = [
            res for res in synth.get("resource", {}).get("aws_wafv2_web_acl", {}).values()
        ]

        webacl = waf_webacls[0]
        sql_rule = next(
            (rule for rule in webacl["rule"] if rule["name"] == "SQLInjectionRule"),
            None
        )

        assert sql_rule is not None, "SQL injection rule should exist"
        assert "sqli_match_statement" in sql_rule["statement"]

        sqli_statement = sql_rule["statement"]["sqli_match_statement"]
        assert "query_string" in sqli_statement["field_to_match"]

        # Verify text transformations
        transformations = sqli_statement["text_transformation"]
        assert len(transformations) == 2
        assert transformations[0]["type"] == "URL_DECODE"
        assert transformations[1]["type"] == "HTML_ENTITY_DECODE"
        assert "block" in sql_rule["action"]

    def test_cloudfront_distribution_configuration(self):
        """Test that CloudFront distribution is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackCF",
            environment_suffix="test-cf",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Find CloudFront distribution
        cf_distributions = [
            res for res in synth.get("resource", {}).get("aws_cloudfront_distribution", {}).values()
        ]

        assert len(cf_distributions) > 0, "CloudFront distribution should be created"
        distribution = cf_distributions[0]

        # Verify basic settings
        assert distribution["enabled"] is True
        assert distribution["default_root_object"] == "index.html"
        assert distribution["price_class"] == "PriceClass_100"

        # Verify default cache behavior
        cache_behavior = distribution["default_cache_behavior"]
        assert cache_behavior["viewer_protocol_policy"] == "https-only"
        assert cache_behavior["compress"] is True
        assert "GET" in cache_behavior["allowed_methods"]
        assert "HEAD" in cache_behavior["allowed_methods"]
        assert "OPTIONS" in cache_behavior["allowed_methods"]

        # Verify viewer certificate
        viewer_cert = distribution["viewer_certificate"]
        assert viewer_cert["cloudfront_default_certificate"] is True
        assert viewer_cert["minimum_protocol_version"] == "TLSv1.2_2021"

    def test_cloudfront_waf_association(self):
        """Test that CloudFront distribution is associated with WAF WebACL."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackCFWAF",
            environment_suffix="test-cf-waf",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        cf_distributions = [
            res for res in synth.get("resource", {}).get("aws_cloudfront_distribution", {}).values()
        ]

        assert len(cf_distributions) > 0
        distribution = cf_distributions[0]

        # Verify WAF WebACL is associated
        assert "web_acl_id" in distribution, "CloudFront should be associated with WAF WebACL"
        # The web_acl_id should reference the WAF WebACL ARN
        assert "${aws_wafv2_web_acl" in distribution["web_acl_id"]

    def test_cloudfront_origin_access_control(self):
        """Test that CloudFront uses Origin Access Control for S3."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackOAC",
            environment_suffix="test-oac",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Verify OAC resource exists
        oac_resources = [
            res for res in synth.get("resource", {}).get("aws_cloudfront_origin_access_control", {}).values()
        ]

        assert len(oac_resources) > 0, "Origin Access Control should be created"
        oac = oac_resources[0]

        assert oac["origin_access_control_origin_type"] == "s3"
        assert oac["signing_behavior"] == "always"
        assert oac["signing_protocol"] == "sigv4"

        # Verify CloudFront distribution uses OAC
        cf_distributions = [
            res for res in synth.get("resource", {}).get("aws_cloudfront_distribution", {}).values()
        ]

        distribution = cf_distributions[0]
        origins = distribution["origin"]
        assert len(origins) > 0
        assert "origin_access_control_id" in origins[0]

    def test_s3_bucket_policy_cloudfront_access(self):
        """Test that S3 bucket policy allows only CloudFront access."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackS3Policy",
            environment_suffix="test-policy",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Find S3 bucket policy
        bucket_policies = [
            res for res in synth.get("resource", {}).get("aws_s3_bucket_policy", {}).values()
        ]

        assert len(bucket_policies) > 0, "S3 bucket policy should be created"

        # The policy is a Terraform expression, so we verify it exists and contains expected elements
        policy_str = str(bucket_policies[0]["policy"])
        assert "cloudfront.amazonaws.com" in policy_str, "Policy should allow CloudFront service principal"
        assert "s3:GetObject" in policy_str, "Policy should allow GetObject action"
        assert "DenyNonHTTPS" in policy_str, "Policy should deny non-HTTPS traffic"

    def test_waf_ip_allowlist_configuration(self):
        """Test that WAF IP allowlist is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackIPSet",
            environment_suffix="test-ipset",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Find IP set resources
        ip_sets = [
            res for res in synth.get("resource", {}).get("aws_wafv2_ip_set", {}).values()
        ]

        assert len(ip_sets) > 0, "IP set should be created"
        ip_set = ip_sets[0]

        assert ip_set["scope"] == "CLOUDFRONT"
        assert ip_set["ip_address_version"] == "IPV4"
        assert "203.0.113.0/24" in ip_set["addresses"]
        assert "198.51.100.0/24" in ip_set["addresses"]

    def test_waf_logging_configuration(self):
        """Test that WAF logging is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackWAFLog",
            environment_suffix="test-log",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Verify CloudWatch Log Group
        log_groups = [
            res for res in synth.get("resource", {}).get("aws_cloudwatch_log_group", {}).values()
        ]

        assert len(log_groups) > 0, "CloudWatch log group should be created"
        log_group = log_groups[0]
        assert "aws-waf-logs-test-log" in log_group["name"]
        assert log_group["retention_in_days"] == 30

        # Verify WAF logging configuration
        waf_logging_configs = [
            res for res in synth.get("resource", {}).get("aws_wafv2_web_acl_logging_configuration", {}).values()
        ]

        assert len(waf_logging_configs) > 0, "WAF logging configuration should be created"

        # Verify IAM role for WAF logging
        iam_roles = [
            res for res in synth.get("resource", {}).get("aws_iam_role", {}).values()
        ]

        waf_logging_role = next(
            (role for role in iam_roles if "waf-logging-role" in role["name"]),
            None
        )

        assert waf_logging_role is not None, "WAF logging IAM role should be created"

    def test_terraform_outputs_configuration(self):
        """Test that all required Terraform outputs are defined."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackOutputs",
            environment_suffix="test-outputs",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        outputs = synth.get("output", {})

        # Verify all expected outputs exist
        expected_outputs = [
            "cloudfront_distribution_id",
            "cloudfront_distribution_domain_name",
            "waf_webacl_id",
            "waf_webacl_arn",
            "origin_bucket_name",
            "waf_log_group_name",
        ]

        for output_name in expected_outputs:
            assert output_name in outputs, f"Output {output_name} should be defined"
            assert "value" in outputs[output_name], f"Output {output_name} should have a value"

    def test_resource_tagging(self):
        """Test that resources are properly tagged."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackTags",
            environment_suffix="test-tags",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "production", "Owner": "security-team"},
        )

        synth = get_synth_json(stack)

        # Check tags on various resources
        s3_buckets = [
            res for res in synth.get("resource", {}).get("aws_s3_bucket", {}).values()
        ]

        if len(s3_buckets) > 0:
            bucket_tags = s3_buckets[0].get("tags", {})
            assert "Environment" in bucket_tags
            assert bucket_tags["Environment"] == "test-tags"
            assert "Project" in bucket_tags
            assert bucket_tags["Project"] == "WAF-CloudFront"

    def test_multi_provider_configuration(self):
        """Test that multiple AWS providers are correctly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackProviders",
            environment_suffix="test-providers",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Verify AWS providers
        providers = synth.get("provider", {}).get("aws", [])

        # Should have two providers with different aliases
        assert len(providers) >= 2, "Should have at least 2 AWS providers"

        aliases = [p.get("alias") for p in providers if "alias" in p]
        assert "us_east_1" in aliases, "Should have us-east-1 provider"
        assert "us_west_2" in aliases, "Should have us-west-2 provider"

    def test_s3_backend_configuration(self):
        """Test that S3 backend for Terraform state is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStackBackend",
            environment_suffix="test-backend",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"},
        )

        synth = get_synth_json(stack)

        # Verify S3 backend configuration
        terraform_config = synth.get("terraform", {})
        backend = terraform_config.get("backend", {})

        assert "s3" in backend, "S3 backend should be configured"
        s3_backend = backend["s3"]

        assert s3_backend["bucket"] == "test-state-bucket"
        assert s3_backend["key"] == "tap-stack-test-backend.tfstate"
        assert s3_backend["region"] == "us-east-1"
        assert s3_backend["encrypt"] is True
